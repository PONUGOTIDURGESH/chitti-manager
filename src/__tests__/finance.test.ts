import { describe, it, expect } from 'vitest';
import {
  computeMemberFinance,
  getInstallmentRows,
  sumPayments,
  detectDuplicatePayment,
  getOutstandingForInstallment,
  computeChittiFinance,
} from '../lib/finance';
import type { Member, Payment } from '../types';

function makeMember(over: Partial<Member> = {}): Member {
  return {
    id: 'm1', user_id: 'u', chitti_id: 'c1', full_name: 'Test', mobile_number: null, photo_url: null,
    total_chitti_amount: 60000, installment_amount: 5000, total_installments: 12, due_day: 5,
    start_date: '2026-01-01', notes: null, archived: false, created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-01T00:00:00Z',
    ...over,
  };
}

function makePayment(over: Partial<Payment> = {}): Payment {
  return {
    id: 'p1', user_id: 'u', member_id: 'm1', chitti_id: 'c1', amount: 5000,
    payment_date: '2026-01-03', installment_month: '2026-01', payment_mode: 'upi',
    reference_number: null, note: null, reversed: false, created_at: '2026-01-03T10:00:00Z', updated_at: '2026-01-03T10:00:00Z',
    ...over,
  };
}

describe('sumPayments', () => {
  it('sums non-reversed payments', () => {
    const payments = [makePayment({ amount: 2000 }), makePayment({ amount: 3000, id: 'p2' }), makePayment({ amount: 5000, id: 'p3', reversed: true })];
    expect(sumPayments(payments)).toBe(5000);
  });
});

describe('computeMemberFinance — example 1', () => {
  it('8 of 12 installments paid', () => {
    const member = makeMember();
    const payments: Payment[] = [];
    for (let i = 0; i < 8; i++) {
      const y = 2026; const m = String(i + 1).padStart(2, '0');
      payments.push(makePayment({ id: `p${i}`, installment_month: `${y}-${m}`, payment_date: `${y}-${m}-03` }));
    }
    const f = computeMemberFinance(member, payments);
    expect(f.totalPaid).toBe(40000);
    expect(f.remainingBalance).toBe(20000);
    expect(f.installmentsPaid).toBe(8);
    expect(f.installmentsRemaining).toBe(4);
    expect(f.collectionPercentage).toBeCloseTo(66.67, 1);
  });
});

describe('computeMemberFinance — partial payments', () => {
  it('two partial payments for same installment = PAID', () => {
    const member = makeMember();
    const payments = [
      makePayment({ id: 'p1', amount: 2000, installment_month: '2026-01' }),
      makePayment({ id: 'p2', amount: 3000, installment_month: '2026-01' }),
    ];
    const f = computeMemberFinance(member, payments);
    expect(f.totalPaid).toBe(5000);
    expect(f.installmentsPaid).toBe(1);
    const rows = getInstallmentRows(member, payments);
    expect(rows[0].status).toBe('PAID');
    expect(rows[0].amountPaid).toBe(5000);
  });
});

describe('getOutstandingForInstallment', () => {
  it('returns remaining for partial', () => {
    const member = makeMember();
    const payments = [makePayment({ amount: 2000, installment_month: '2026-01' })];
    expect(getOutstandingForInstallment(member, payments, '2026-01')).toBe(3000);
  });
});

describe('detectDuplicatePayment', () => {
  it('detects recent same-amount payment', () => {
    const recent = makePayment({ amount: 5000, installment_month: '2026-01', created_at: new Date().toISOString() });
    const dup = detectDuplicatePayment([recent], 'm1', '2026-01', 5000);
    expect(dup).not.toBeNull();
  });
  it('ignores old payments', () => {
    const old = makePayment({ amount: 5000, installment_month: '2026-01', created_at: '2025-01-01T00:00:00Z' });
    const dup = detectDuplicatePayment([old], 'm1', '2026-01', 5000);
    expect(dup).toBeNull();
  });
});

describe('computeChittiFinance', () => {
  it('aggregates across members', () => {
    const m1 = makeMember({ id: 'm1', total_chitti_amount: 60000, installment_amount: 5000 });
    const m2 = makeMember({ id: 'm2', total_chitti_amount: 100000, installment_amount: 10000 });
    const payments = [
      makePayment({ member_id: 'm1', amount: 5000, installment_month: '2026-01' }),
      makePayment({ member_id: 'm2', amount: 10000, installment_month: '2026-01', id: 'p2' }),
    ];
    const f = computeChittiFinance([m1, m2], payments);
    expect(f.totalExpected).toBe(160000);
    expect(f.totalCollected).toBe(15000);
    expect(f.remainingBalance).toBe(145000);
  });
});

describe('reversed payments', () => {
  it('excludes reversed from totals', () => {
    const member = makeMember();
    const payments = [
      makePayment({ amount: 5000, installment_month: '2026-01' }),
      makePayment({ amount: 5000, installment_month: '2026-01', id: 'p2', reversed: true }),
    ];
    const f = computeMemberFinance(member, payments);
    expect(f.totalPaid).toBe(5000);
    expect(f.installmentsPaid).toBe(1);
  });
});
