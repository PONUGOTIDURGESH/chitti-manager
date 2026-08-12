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
    <div className="rounded-lg border border-slate-200 bg-white px-2 py-2 min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 leading-none whitespace-nowrap">
        {title}
      </p>

      <p className="mt-1 text-[16px] font-bold text-slate-900 leading-none whitespace-nowrap">
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
          value={formatMoney(member.installment_amount)}
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