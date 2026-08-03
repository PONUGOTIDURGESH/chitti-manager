import { useRef } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Download } from 'lucide-react';
import type { Member, Payment } from '@/types';
import { formatMoney, formatDate } from '@/lib/format';
import { ShareButtons } from '@/components/StatementCard';

export function ReceiptCard({
  payment, member, chittiName, remainingBalance,
}: {
  payment: Payment; member: Member; chittiName: string; remainingBalance: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div>
      <div ref={ref} className="rounded-2xl bg-white p-6 text-slate-900" style={{ width: '100%', maxWidth: 420 }}>
        <div className="text-center">
          <h1 className="text-lg font-bold uppercase tracking-tight">Payment Received</h1>
          <p className="mt-1 text-sm text-slate-500">{chittiName}</p>
        </div>
        <div className="my-4 text-center">
          <p className="text-3xl font-bold text-green-600">{formatMoney(Number(payment.amount))}</p>
          <p className="mt-1 text-xs text-slate-500">{formatDate(payment.payment_date)} · {payment.payment_mode.toUpperCase()}</p>
        </div>
        <div className="grid grid-cols-2 gap-y-2 border-t border-slate-200 pt-3 text-sm">
          <span className="text-slate-500">Member</span><span className="font-semibold">{member.full_name}</span>
          <span className="text-slate-500">Installment</span><span>{payment.installment_month}</span>
          {payment.reference_number && (<><span className="text-slate-500">Reference</span><span>{payment.reference_number}</span></>)}
          {payment.note && (<><span className="text-slate-500">Note</span><span>{payment.note}</span></>)}
          <span className="text-slate-500">Remaining balance</span><span className="font-semibold">{formatMoney(remainingBalance)}</span>
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-400">
          This receipt is generated from the Chitti Management System.
        </p>
      </div>
      <ShareButtons targetRef={ref} filename={`receipt-${member.full_name}-${payment.installment_month}.png`} />
    </div>
  );
}
