import {
  AccountCreateTransaction,
  AccountId,
  Client,
  Hbar,
  PrivateKey,
  TokenAirdropTransaction,
  TokenCreateTransaction,
  TokenFreezeTransaction,
  TokenPauseTransaction,
  TransferTransaction,
} from "@hashgraph/sdk";

function operatorAccountId() {
  return (
    process.env.HEDERA_OPERATOR_ACCOUNT_ID ??
    process.env.HEDERA_AGENT_ACCOUNT_ID ??
    ""
  );
}

function operatorPrivateKeyRaw() {
  return (
    process.env.HEDERA_OPERATOR_PRIVATE_KEY ??
    process.env.HEDERA_AGENT_PRIVATE_KEY ??
    ""
  );
}

export function isHederaOperatorConfigured() {
  return Boolean(operatorAccountId() && operatorPrivateKeyRaw());
}

export function getBackerAccountId() {
  return process.env.HEDERA_BACKER_ACCOUNT_ID ?? "";
}

function parseKey(raw: string) {
  return raw.startsWith("0x")
    ? PrivateKey.fromStringECDSA(raw)
    : PrivateKey.fromString(raw);
}

function getClient() {
  if (!isHederaOperatorConfigured()) {
    throw new Error(
      "Set HEDERA_OPERATOR_ACCOUNT_ID and HEDERA_OPERATOR_PRIVATE_KEY (or the HEDERA_AGENT_* pair) to issue tokens on testnet.",
    );
  }
  const client = Client.forTestnet();
  client.setOperator(AccountId.fromString(operatorAccountId()), parseKey(operatorPrivateKeyRaw()));
  return client;
}

async function withClient<T>(run: (client: Client) => Promise<T>) {
  const client = getClient();
  try {
    return await run(client);
  } finally {
    client.close();
  }
}

export async function withHederaClient<T>(run: (client: Client) => Promise<T>) {
  return withClient(run);
}

export async function createReceiverAccount(memo: string) {
  const key = parseKey(operatorPrivateKeyRaw());
  return withClient(async (client) => {
    const response = await new AccountCreateTransaction()
      .setKey(key.publicKey)
      .setInitialBalance(new Hbar(0))
      .setAccountMemo(memo.slice(0, 100))
      .execute(client);
    const receipt = await response.getReceipt(client);
    const accountId = receipt.accountId?.toString();
    if (!accountId) {
      throw new Error("Account create succeeded but returned no account id");
    }
    return {
      accountId,
      transactionId: response.transactionId.toString(),
    };
  });
}

export async function issueCampaignToken(input: {
  name: string;
  symbol: string;
  memo: string;
  supply: number;
}) {
  const treasury = operatorAccountId();
  const key = parseKey(operatorPrivateKeyRaw());

  return withClient(async (client) => {
    const response = await new TokenCreateTransaction()
      .setTokenName(input.name)
      .setTokenSymbol(input.symbol)
      .setDecimals(0)
      .setInitialSupply(input.supply)
      .setTreasuryAccountId(treasury)
      .setAdminKey(key)
      .setFreezeKey(key)
      .setPauseKey(key)
      .setSupplyKey(key)
      .setTokenMemo(input.memo.slice(0, 100))
      .execute(client);
    const receipt = await response.getReceipt(client);
    const tokenId = receipt.tokenId?.toString();
    if (!tokenId) {
      throw new Error("Token create succeeded but returned no token id");
    }
    return {
      tokenId,
      transactionId: response.transactionId.toString(),
      treasury,
    };
  });
}

export async function transferCampaignToken(tokenId: string, recipient: string) {
  const treasury = operatorAccountId();
  return withClient(async (client) => {
    const response = await new TokenAirdropTransaction()
      .addTokenTransfer(tokenId, treasury, -1)
      .addTokenTransfer(tokenId, recipient, 1)
      .execute(client);
    await response.getReceipt(client);
    return { transactionId: response.transactionId.toString(), recipient };
  });
}

export async function freezeCampaignHolder(tokenId: string, accountId: string) {
  return withClient(async (client) => {
    const response = await new TokenFreezeTransaction()
      .setTokenId(tokenId)
      .setAccountId(accountId)
      .execute(client);
    await response.getReceipt(client);
    return { transactionId: response.transactionId.toString(), accountId };
  });
}

export async function pauseCampaignToken(tokenId: string) {
  return withClient(async (client) => {
    const response = await new TokenPauseTransaction().setTokenId(tokenId).execute(client);
    await response.getReceipt(client);
    return { transactionId: response.transactionId.toString() };
  });
}

export async function payCoupon(recipient: string, tinybars = 1000) {
  const treasury = operatorAccountId();
  return withClient(async (client) => {
    const amount = Hbar.fromTinybars(tinybars);
    const response = await new TransferTransaction()
      .addHbarTransfer(treasury, amount.negated())
      .addHbarTransfer(recipient, amount)
      .setTransactionMemo("zikibols coupon payout")
      .execute(client);
    await response.getReceipt(client);
    return { transactionId: response.transactionId.toString(), recipient };
  });
}
