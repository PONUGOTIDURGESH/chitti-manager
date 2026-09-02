import { formatMoney } from "@/lib/format";
import type { MemberFinance } from "@/lib/finance";
import type { Member } from "@/types";

type Props = {
  member: Member;
  finance: MemberFinance;
};

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 leading-none whitespace-nowrap">
        {title}
      </p>

      <p className="mt-2 text-[15px] font-bold leading-none text-slate-900 whitespace-nowrap">
        {value}
      </p>
    </div>
  );
}

export default function StatementSummary({
  member,
  finance,
}: Props) {
  return (
    <section className="space-y-2">
      {/* Top Row */}
      <div className="grid grid-cols-4 gap-2">
        <Card
          title="Total Chitti"
          value={formatMoney(
            member.installment_amount * member.total_installments
          )}
        />

        <Card
          title="Current EMI"
          value={formatMoney(finance.currentInstallment)}
        />

          <Card
          title="Paid"
          value={`${finance.installmentsPaid}/${member.total_installments}`}
        />

         <Card
          title="Remaining"
          value={`${finance.installmentsRemaining}`}
        />

      </div>

    </section>
  );
}