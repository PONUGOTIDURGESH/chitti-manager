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
   <table className="w-full table-fixed border-collapse border border-slate-300 align-middle text-slate-900">
  <colgroup>
    <col className="w-[5%]" />
    <col className="w-[14%]" />
    <col className="w-[16%]" />
    <col className="w-[16%]" />
    <col className="w-[16%]" />
    <col className="w-[13%]" />
    <col className="w-[8%]" />
    <col className="w-[12%]" />
  </colgroup>
      <thead>
  <tr className="bg-slate-100">
    <th className="border border-slate-300 px-2 py-[6px] text-center align-middle text-[10px] font-extrabold leading-none text-slate-900">
      #
    </th>

    <th className="border border-slate-300 px-2 py-[6px] text-center align-middle text-[10px] font-extrabold leading-none text-slate-900">
      Due Date
    </th>

    <th className="border border-slate-300 px-2 py-[6px] text-center align-middle text-[10px] font-extrabold leading-none text-slate-900">
      Lift Amount
    </th>

    <th className="border border-slate-300 px-2 py-[6px] text-center align-middle text-[10px] font-extrabold leading-none text-slate-900">
      Amount Due
    </th>

    <th className="border border-slate-300 px-2 py-[6px] text-center align-middle text-[10px] font-extrabold leading-none text-slate-900">
      Amount Paid
    </th>

    <th className="border border-slate-300 px-2 py-[6px] text-center align-middle text-[10px] font-extrabold leading-none text-slate-900">
      Paid On
    </th>

    <th className="border border-slate-300 px-2 py-[6px] text-center align-middle text-[10px] font-extrabold leading-none text-slate-900">
      Mode
    </th>

    <th className="border border-slate-300 px-2 py-[6px] text-center align-middle text-[10px] font-extrabold leading-none text-slate-900">
  Balance
</th>
  </tr>
</thead>

      <tbody>
        {rows.map((row) => (
          <React.Fragment key={row.index}>
            <tr>
              <td className="border border-slate-300 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-900">{row.index}</td>


              <td className="border border-slate-300 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-900">
                {formatDate(row.dueDate)}
              </td>

              <td className="border border-slate-300 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-900">
                {formatMoney(row.liftAmount)}
              </td>

              <td className="border border-slate-300 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-900">
                {formatMoney(row.amountDue)}
              </td>

              <td className="border border-slate-300 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-900">
                {formatMoney(row.amountPaid)}
              </td>

              <td className="border border-slate-300 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-900">
                {row.paymentDate
                  ? formatDate(row.paymentDate)
                  : "—"}
              </td>

              <td className="border border-slate-300 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-900">
                {row.paymentMode ?? "—"}
              </td>

              <td className="border border-slate-300 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-900">
  {formatMoney(Math.max(0, row.amountDue - row.amountPaid))}
</td>
            </tr>

            {lifts
  ?.filter((l) => l.lifted_month_number === row.index)
  .map((lift) => (
    <tr key={lift.id}>
      <td
        colSpan={8}
        className="border border-slate-300 bg-green-100 px-3 py-[6px] text-center align-middle text-[15px] font-semibold leading-none text-[#0F172A]"
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