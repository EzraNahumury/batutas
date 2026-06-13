import { describe, it, expect } from "vitest";
import { batutasAbi } from "../src/abi";

const names = (type: string) =>
  batutasAbi.filter((e) => e.type === type).map((e) => (e as { name: string }).name);

describe("batutasAbi", () => {
  it("includes the full player flow functions", () => {
    const fns = names("function");
    for (const fn of ["deposit", "withdraw", "commitMove", "revealMove", "claimRefund", "balanceOf", "pendingCommit"]) {
      expect(fns).toContain(fn);
    }
  });

  it("includes the events the frontend decodes", () => {
    const events = names("event");
    for (const ev of ["Deposited", "Committed", "Revealed", "Withdrawn", "Refunded"]) {
      expect(events).toContain(ev);
    }
  });

  it("is the full ABI, not the old minimal subset", () => {
    // The minimal copy had ~15 entries; the full artifact ABI has 54.
    expect(batutasAbi.length).toBeGreaterThanOrEqual(54);
  });
});
