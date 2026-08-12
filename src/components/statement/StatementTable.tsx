import React from "react";
import type { InstallmentRow } from "@/lib/finance";
import { formatDate, formatMoney } from "@/lib/format";
import type { Member, MemberLift } from "@/types";
type Props = {
  rows: InstallmentRow[];
  liftedMonth?: number | null;
  liftedDate?: string | null;
  lifts?: MemberLift[];
};

export default function StatementTable({
  rows,
  liftedMonth,
  liftedDate,
  lifts,
}: Props) {
  return (
   <table className="w-full border border-slate-300 border-collapse align-middle table-fixed">
      <thead>
        <tr className="bg-slate-50 text-slate-950">

          <th className="w-[32px] border border-slate-300 bg-slate-50 px-2 py-[5px] text-center align-middle text-[10px] font-bold text-slate-900">#</th>

<th className="w-[92px] border border-slate-300 bg-slate-50 px-2 py-[5px] text-center align-middle text-[10px] font-bold text-slate-900">Due Date</th>

<th className="w-[102px] border border-slate-300 bg-slate-50 px-2 py-[5px] text-center align-middle text-[10px] font-bold text-slate-900">Lift Amount</th>

<th className="w-[102px] border border-slate-300 bg-slate-50 px-2 py-[5px] text-center align-middle text-[10px] font-bold text-slate-900">Amount Due</th>

<th className="w-[102px] border border-slate-300 bg-slate-50 px-2 py-[5px] text-center align-middle text-[10px] font-bold text-slate-900">Amount Paid</th>

<th className="w-[86px] border border-slate-300 bg-slate-50 px-2 py-[5px] text-center align-middle text-[10px] font-bold text-slate-900">Paid On</th>

<th className="w-[54px] border border-slate-300 bg-slate-50 px-2 py-[5px] text-center align-middle text-[10px] font-bold text-slate-900">Mode</th>

<th className="w-[70px] border border-slate-300 bg-slate-50 px-2 py-[5px] text-center align-middle text-[10px] font-bold text-slate-900">Status</th>
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <React.Fragment key={row.index}>
            <tr>
              <td className="border border-slate-300 px-1 py-[3px] text-center align-middle text-[10px] font-medium text-slate-900">{row.index}</td>


              <td className="border border-slate-300 px-1 py-[3px] text-center align-middle text-[10px] font-medium text-slate-900">
                {formatDate(row.dueDate)}
              </td>

              <td className="border border-slate-300 px-1 py-[3px] text-center align-middle text-[10px] font-medium text-slate-900">
                {formatMoney(row.liftAmount)}
              </td>

              <td className="border border-slate-300 px-1 py-[3px] text-center align-middle text-[10px] font-medium text-slate-900">
                {formatMoney(row.amountDue)}
              </td>

              <td className="border border-slate-300 px-1 py-[3px] text-center align-middle text-[10px] font-medium text-slate-900">
                {formatMoney(row.amountPaid)}
              </td>

              <td className="border border-slate-300 px-1 py-[3px] text-center align-middle text-[10px] font-medium text-slate-900">
                {row.paymentDate
                  ? formatDate(row.paymentDate)
                  : "—"}
              </td>

              <td className="border border-slate-300 px-1 py-[3px] text-center align-middle text-[10px] font-medium text-slate-900">
                {row.paymentMode ?? "—"}
              </td>

              <td className="border border-slate-300 px-1 py-[3px] text-center align-middle text-[10px] font-medium text-slate-900">
  <span
  className={
    row.status === "PAID"
      ? "inline-flex items-center justify-center align-middle rounded-full bg-emerald-100 px-1.5 py-[1px] text-[8px] font-semibold tracking-wide text-emerald-700"
      : "inline-flex items-center justify-center align-middle rounded-full bg-amber-100 px-1.5 py-[1px] text-[7px] font-semibold tracking-wide text-amber-700"
  }
>
  {row.status}
</span>
</td>
            </tr>

            {lifts
  ?.filter((l) => l.lifted_month_number === row.index)
  .map((lift) => (
    <tr key={lift.id}>
      <td
        colSpan={8}
        className="border border-slate-300 bg-amber-50 px-3 py-1 text-center align-middle text-[9px] text-[#0F172A]"
      >
        Chitti Lift Amount Paid • Lift Month {lift.lifted_month_number} •{" "}
        {formatMoney(Number(lift.lift_amount))} • {lift.paid_date}
      </td>
    </tr>
  ))}
          </React.Fragment>
        ))}
      </tbody>
    </table>
  );
}