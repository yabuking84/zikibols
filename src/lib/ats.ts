/**
 * Asset Tokenization Studio (headless). The public SDK is browser/MetaMask-first;
 * we stub `window` only around Network.connect (debug:true) and inject an ethers
 * Wallet. Bonds are created with internal KYC on so deployBond encodes, then we
 * deactivate KYC so minting does not need a Terminal3 verifiable credential.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { PrivateKey } from "@hashgraph/sdk";
import type { Campaign } from "@/lib/campaigns";
import { isEvmAddress, isHederaAccountId } from "@/lib/hedera";
import {
  getOperatorAccountId,
  getOperatorPrivateKeyRaw,
  isHederaOperatorConfigured,
  payCoupon,
} from "@/lib/hts";

/** ATS's published ESM entry omits .js extensions; load the CJS build instead. */
const requireSdk = createRequire(join(process.cwd(), "package.json"));
const {
  Network,
  InitializationRequest,
  ConnectRequest,
  SupportedWallets,
  Bond,
  Security,
  Role,
  Kyc,
  CreateBondRequest,
  IssueRequest,
  ControlListRequest,
  PauseRequest,
  ApplyRolesRequest,
  DeactivateInternalKycRequest,
} = requireSdk("@hashgraph/asset-tokenization-sdk") as typeof import("@hashgraph/asset-tokenization-sdk");
/** Same ethers instance the SDK's Factory__factory uses (Next must not bundle a second copy). */
const { Wallet, JsonRpcProvider, Contract } = requireSdk("ethers") as typeof import("ethers");

export const ATS_FACTORY_ID = process.env.ATS_FACTORY_ID?.trim() || "0.0.9213391";
export const ATS_RESOLVER_ID = process.env.ATS_RESOLVER_ID?.trim() || "0.0.9212226";
export const ATS_BOND_CONFIG_ID =
  process.env.ATS_BOND_CONFIG_ID?.trim() ||
  "0x0000000000000000000000000000000000000000000000000000000000000002";
const ATS_RPC = process.env.ATS_RPC_URL?.trim() || "https://testnet.hashio.io/api";
const ATS_MIRROR =
  process.env.ATS_MIRROR_URL?.trim() || "https://testnet.mirrornode.hedera.com/api/v1/";

/** Role ids from ATS SecurityRole. Operator needs these after Bond.create. */
const ROLES = {
  ISSUER: "0x5eeaf5602c75bf26e73b5206d0bd6ee82f621166255e5fd73cc06bc7bd84a95f",
  CONTROLLIST: "0x6ed9a91e996c6475ecdc28ecbdbe9bd1122fc62b30cdbe6da8271884b51ec74d",
  PAUSER: "0x3cb8b459fdb6e7dc3d2a2aa529e530f885d45e03584adb438423209c86a2731f",
  CONTROLLER: "0xb4d2b850c3ed8a234d390d5c157bbb1824883213c335ffe2a0f0761bb168713e",
  CORPORATEACTIONS: "0xa1acfc499025c99f55059195e6276f639d34a18aad7b8121b9192b7f438c55cd",
  BOND_MANAGER: "0x68fe577385095e80beadf873ac12a3100f9a9d1b6d40f0d123eecf3d01bf5c49",
  INTERNAL_KYC_MANAGER: "0xdd78fdcd1b38a5360405cef8d91e758ad0f42bf2ced681b803b3c2704b0a32a7",
};

export function isAtsConfigured() {
  return isHederaOperatorConfigured();
}

export function isBackerId(value: string) {
  const trimmed = value.trim();
  return isHederaAccountId(trimmed) || isEvmAddress(trimmed);
}

function operatorHexKey() {
  const raw = getOperatorPrivateKeyRaw();
  if (raw.startsWith("0x")) return raw;
  const pk = raw.startsWith("30")
    ? PrivateKey.fromStringDer(raw)
    : PrivateKey.fromStringECDSA(raw);
  return `0x${pk.toStringRaw()}`;
}

function unwrapId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "value" in value) {
    const inner = (value as { value?: unknown }).value;
    if (typeof inner === "string") return inner;
  }
  return null;
}

function txId(result: { transactionId?: string; payload?: unknown } | null | undefined) {
  return result?.transactionId ?? (typeof result?.payload === "string" ? result.payload : "");
}

type AtsInterface = {
  encodeFunctionData: (name: string, args?: unknown[]) => string;
};

function loadContracts() {
  return requireSdk("@hashgraph/asset-tokenization-contracts") as {
    ICoupon__factory: { createInterface: () => AtsInterface };
    IPause__factory: { createInterface: () => AtsInterface };
  };
}

async function resolveContractEvm(securityId: string) {
  const trimmed = securityId.trim();
  if (isEvmAddress(trimmed)) return trimmed.toLowerCase();
  const response = await fetch(`${ATS_MIRROR.replace(/\/?$/, "/")}contracts/${trimmed}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`Hedera mirror does not know contract ${trimmed}.`);
  }
  const json = (await response.json()) as { evm_address?: string };
  const evm = json.evm_address?.startsWith("0x")
    ? json.evm_address
    : json.evm_address
      ? `0x${json.evm_address}`
      : "";
  if (!isEvmAddress(evm)) {
    throw new Error(`No EVM address for contract ${trimmed}.`);
  }
  return evm.toLowerCase();
}

async function callDiamond(securityId: string, data: string) {
  const wallet = await ensureConnected();
  if (!data || data === "0x") {
    throw new Error("ATS facet encoding returned empty calldata.");
  }
  const sent = await wallet.sendTransaction({
    to: await resolveContractEvm(securityId),
    data,
    gasLimit: 2_000_000,
  });
  const receipt = await sent.wait();
  if (receipt && Number(receipt.status) === 0) {
    throw new Error(`ATS diamond call reverted (${sent.hash}).`);
  }
  return { transactionId: receipt?.hash ?? sent.hash };
}

async function resolveEvmAddress(idOrEvm: string) {
  const trimmed = idOrEvm.trim();
  if (isEvmAddress(trimmed)) return trimmed.toLowerCase();
  if (!isHederaAccountId(trimmed)) {
    throw new Error("Backer must be a Privy 0x address or a Hedera account like 0.0.12345.");
  }
  const response = await fetch(`${ATS_MIRROR.replace(/\/?$/, "/")}accounts/${trimmed}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) {
    throw new Error(`Hedera mirror does not know ${trimmed} yet.`);
  }
  const json = (await response.json()) as { evm_address?: string };
  const evm = json.evm_address?.startsWith("0x")
    ? json.evm_address
    : json.evm_address
      ? `0x${json.evm_address}`
      : "";
  if (!isEvmAddress(evm)) {
    throw new Error(`No EVM alias for ${trimmed}.`);
  }
  return evm.toLowerCase();
}

type SdkInternals = {
  Injectable: {
    resolveTransactionHandler: () => {
      setSignerOrProvider: (signer: InstanceType<typeof Wallet>) => void;
    };
  };
};

function loadSdkInternals(): SdkInternals {
  const entry = requireSdk.resolve("@hashgraph/asset-tokenization-sdk");
  const src = dirname(entry);
  return {
    Injectable: requireSdk(join(src, "core/injectable/Injectable.js")).default,
  };
}

let connecting: Promise<InstanceType<typeof Wallet>> | null = null;

async function ensureConnected() {
  if (!isAtsConfigured()) {
    throw new Error(
      "Set HEDERA_OPERATOR_ACCOUNT_ID and HEDERA_OPERATOR_PRIVATE_KEY (or the HEDERA_AGENT_* pair) to issue ATS bonds.",
    );
  }
  if (!connecting) {
    connecting = connectInner().catch((error) => {
      connecting = null;
      throw error;
    });
  }
  return connecting;
}

async function connectInner() {
  const accountId = getOperatorAccountId();
  const provider = new JsonRpcProvider(ATS_RPC, undefined, { batchMaxCount: 1 });
  const wallet = new Wallet(operatorHexKey(), provider);

  const globalWithWindow = globalThis as { window?: unknown };
  // Match the working /tmp spike: init without window so the RPC adapter is
  // not MetaMask-inited, then stub window so connect() can resolve METAMASK.
  delete globalWithWindow.window;

  await Network.init(
    new InitializationRequest({
      network: "testnet",
      mirrorNode: { baseUrl: ATS_MIRROR },
      rpcNode: { baseUrl: ATS_RPC },
      configuration: { factoryAddress: ATS_FACTORY_ID, resolverAddress: ATS_RESOLVER_ID },
    }),
  );

  globalWithWindow.window = { addEventListener() {}, removeEventListener() {} };

  await Network.connect(
    new ConnectRequest({
      account: { accountId, evmAddress: wallet.address },
      network: "testnet",
      mirrorNode: { baseUrl: ATS_MIRROR },
      rpcNode: { baseUrl: ATS_RPC },
      wallet: SupportedWallets.METAMASK,
      debug: true,
    }),
  );

  const { Injectable } = loadSdkInternals();
  const handler = Injectable.resolveTransactionHandler();
  handler.setSignerOrProvider(wallet);
  delete globalWithWindow.window;
  return wallet;
}

async function latestBondConfigVersion() {
  const provider = new JsonRpcProvider(ATS_RPC, undefined, { batchMaxCount: 1 });
  const num = BigInt(ATS_RESOLVER_ID.split(".")[2] ?? "0");
  const resolverEvm = `0x${num.toString(16).padStart(40, "0")}`;
  const resolver = new Contract(
    resolverEvm,
    ["function getLatestVersionByConfiguration(bytes32) view returns (uint256)"],
    provider,
  );
  const version = Number(await resolver.getLatestVersionByConfiguration(ATS_BOND_CONFIG_ID));
  if (!Number.isFinite(version) || version < 1) {
    throw new Error("ATS resolver returned no bond configuration version.");
  }
  return version;
}

async function applyOperatorRoles(securityId: string, operatorEvm: string) {
  const roles = Object.values(ROLES);
  await Role.applyRoles(
    new ApplyRolesRequest({
      securityId,
      targetId: operatorEvm,
      roles,
      actives: roles.map(() => true),
    }),
  );
}

export async function issueBond(campaign: Campaign) {
  const wallet = await ensureConnected();
  const version = await latestBondConfigVersion();
  const now = Math.floor(Date.now() / 1000);

  const created = await Bond.create(
    new CreateBondRequest({
      name: campaign.tokenName.slice(0, 100),
      symbol: campaign.tokenSymbol.slice(0, 12),
      isin: "US0378331005",
      decimals: 0,
      isWhiteList: true,
      erc20VotesActivated: false,
      isControllable: true,
      arePartitionsProtected: false,
      isMultiPartition: false,
      clearingActive: false,
      internalKycActivated: true,
      diamondOwnerAccount: getOperatorAccountId(),
      currency: "0x455552",
      numberOfUnits: "1000",
      nominalValue: "100",
      nominalValueDecimals: 2,
      startingDate: String(now + 120),
      maturityDate: String(now + 365 * 24 * 3600),
      regulationType: 1,
      regulationSubType: 0,
      isCountryControlListWhiteList: false,
      countries: "",
      info: `zikibols:${campaign.slug}`,
      configId: ATS_BOND_CONFIG_ID,
      configVersion: version,
    }),
  );

  const security = created.security as {
    diamondAddress?: unknown;
    evmDiamondAddress?: unknown;
  };
  const tokenId =
    unwrapId(security?.diamondAddress) ?? unwrapId(security?.evmDiamondAddress);
  if (!tokenId) {
    throw new Error("ATS Bond.create returned no diamond address.");
  }

  await applyOperatorRoles(tokenId, wallet.address);
  try {
    await Kyc.deactivateInternalKyc(new DeactivateInternalKycRequest({ securityId: tokenId }));
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/already|not activated/i.test(message)) throw error;
  }

  return {
    tokenId,
    evmAddress: unwrapId(security?.evmDiamondAddress),
    transactionId: created.transactionId ?? "",
  };
}

export async function mintToBacker(securityId: string, backer: string) {
  await ensureConnected();
  const target = await resolveEvmAddress(backer);
  try {
    await Security.addToControlList(
      new ControlListRequest({ securityId, targetId: target }),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!/already in the control list/i.test(message)) throw error;
  }
  const issued = await Security.issue(
    new IssueRequest({ securityId, targetId: target, amount: "1" }),
  );
  return { transactionId: txId(issued), recipient: target };
}

export async function pauseBond(securityId: string) {
  await ensureConnected();
  const paused = await Security.pause(new PauseRequest({ securityId }));
  return { transactionId: txId(paused) };
}

export async function unpauseBond(securityId: string) {
  const { IPause__factory } = loadContracts();
  return callDiamond(securityId, IPause__factory.createInterface().encodeFunctionData("unpause"));
}

export async function controlListBacker(securityId: string, backer: string) {
  await ensureConnected();
  const target = await resolveEvmAddress(backer);
  const added = await Security.addToControlList(
    new ControlListRequest({ securityId, targetId: target }),
  );
  return { transactionId: txId(added), recipient: target };
}

/** On-chain coupon entitlement. Not Mass Payout — HBAR still moves via payCoupon. */
export async function setCouponRecord(securityId: string) {
  const now = Math.floor(Date.now() / 1000);
  const record = now + 30;
  const execution = record + 300;
  const { ICoupon__factory } = loadContracts();
  const encoded = await callDiamond(
    securityId,
    ICoupon__factory.createInterface().encodeFunctionData("setCoupon", [
      {
        recordDate: record,
        executionDate: execution,
        startDate: now,
        endDate: now + 86400 * 30,
        fixingDate: record,
        rate: 100,
        rateDecimals: 0,
        rateStatus: 1,
      },
    ]),
  );
  return { transactionId: encoded.transactionId, couponId: encoded.transactionId };
}

export async function payCouponToBacker(backer: string) {
  const trimmed = backer.trim();
  if (isHederaAccountId(trimmed)) {
    return payCoupon(trimmed);
  }
  if (!isEvmAddress(trimmed)) {
    throw new Error("Coupon recipient must be a Hedera account or an EVM address.");
  }
  const mapped = await hederaAccountFromEvmLocal(trimmed);
  if (mapped) return payCoupon(mapped);
  return payCouponViaEvm(trimmed);
}

async function hederaAccountFromEvmLocal(evm: string) {
  try {
    const response = await fetch(
      `${ATS_MIRROR.replace(/\/?$/, "/")}accounts/${evm.toLowerCase()}`,
      { cache: "no-store", signal: AbortSignal.timeout(8_000) },
    );
    if (!response.ok) return null;
    const json = (await response.json()) as { account?: string };
    const account = json.account?.trim() ?? "";
    return isHederaAccountId(account) ? account : null;
  } catch {
    return null;
  }
}

/** 1000 tinybars as Hedera EVM wei (1 tinybar = 10^10 wei). */
async function payCouponViaEvm(to: string) {
  const wallet = await ensureConnected();
  const tx = await wallet.sendTransaction({
    to,
    value: BigInt(1000) * BigInt("10000000000"),
  });
  await tx.wait();
  return { transactionId: tx.hash, recipient: to };
}
