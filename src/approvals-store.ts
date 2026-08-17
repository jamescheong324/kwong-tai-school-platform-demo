import type { ApprovalSeed } from "./school";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Approval = ApprovalSeed & { status: ApprovalStatus };

let items: Approval[] = [];
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

export function hydrateApprovals(seeds: ApprovalSeed[]) {
  if (items.length === 0) items = seeds.map((a) => ({ ...a, status: "pending" }));
}

export function getApprovals() {
  return items;
}

export function pendingCount() {
  return items.filter((a) => a.status === "pending").length;
}

export function setApprovalStatus(id: string, status: ApprovalStatus) {
  items = items.map((a) => (a.id === id ? { ...a, status } : a));
  emit();
}

export function subscribeApprovals(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
