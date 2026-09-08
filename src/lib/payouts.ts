export type PayoutApprovals = {
  founderWallet: string | null;
  operator: boolean;
};

const approvals = new Map<string, PayoutApprovals>();

export function getPayoutApprovals(slug: string): PayoutApprovals {
  return approvals.get(slug) ?? { founderWallet: null, operator: false };
}

export function approveFounder(slug: string, wallet: string) {
  const current = getPayoutApprovals(slug);
  const next = { ...current, founderWallet: wallet };
  approvals.set(slug, next);
  return next;
}

export function approveOperator(slug: string) {
  const current = getPayoutApprovals(slug);
  const next = { ...current, operator: true };
  approvals.set(slug, next);
  return next;
}

export function payoutReady(slug: string) {
  const current = getPayoutApprovals(slug);
  return Boolean(current.founderWallet && current.operator);
}
