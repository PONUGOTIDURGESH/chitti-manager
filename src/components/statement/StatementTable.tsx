import React from "react";
import type { InstallmentRow } from "@/lib/finance";
import { formatDate, formatMoney } from "@/lib/format";
import type { MemberLift } from "@/types";

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
    <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
      <table className="w-full table-fixed border-collapse border border-slate-300 align-middle text-slate-900">
        {/* 🔒 LOCKED COLUMN WIDTHS */}
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

        {/* =====================================================
            TABLE HEADER
            ===================================================== */}
        <thead>
          <tr className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-900">
            <th className="border border-blue-800/60 px-2 py-[6px] text-center align-middle text-[12px] font-extrabold leading-none text-white">
              #
            </th>

            <th className="border border-blue-800/60 px-2 py-[6px] text-center align-middle text-[12px] font-extrabold leading-none text-white">
              Due Date
            </th>

            <th className="border border-blue-800/60 px-2 py-[6px] text-center align-middle text-[12px] font-extrabold leading-none text-white">
              Lift Amount
            </th>

            <th className="border border-blue-800/60 px-2 py-[6px] text-center align-middle text-[12px] font-extrabold leading-none text-white">
              Amount Due
            </th>

            <th className="border border-blue-800/60 px-2 py-[6px] text-center align-middle text-[12px] font-extrabold leading-none text-white">
              Amount Paid
            </th>

            <th className="border border-blue-800/60 px-2 py-[6px] text-center align-middle text-[12px] font-extrabold leading-none text-white">
              Paid On
            </th>

            <th className="border border-blue-800/60 px-2 py-[6px] text-center align-middle text-[12px] font-extrabold leading-none text-white">
              Mode
            </th>

            <th className="border border-blue-800/60 px-2 py-[6px] text-center align-middle text-[12px] font-extrabold leading-none text-white">
              Balance
            </th>
          </tr>
        </thead>

        {/* =====================================================
            TABLE BODY
            ===================================================== */}
        <tbody>
          {rows.map((row, index) => {
            const balance = Math.max(
              0,
              row.amountDue - row.amountPaid
            );

            const isPaid = row.status === "PAID";
            const isPartiallyPaid =
              row.status === "PARTIALLY_PAID";

            return (
              <React.Fragment key={row.index}>
                <tr
                  className={
                    index % 2 === 0
                      ? "bg-white"
                      : "bg-slate-50/80"
                  }
                >
                  {/* # */}
                  <td className="border border-slate-200 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-bold leading-none text-slate-700">
                    {row.index}
                  </td>

                  {/* Due Date */}
                  <td className="border border-slate-200 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-700">
                    {formatDate(row.dueDate)}
                  </td>

                  {/* Lift Amount */}
                  <td className="border border-slate-200 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-700">
                    {formatMoney(row.liftAmount)}
                  </td>

                  {/* Amount Due */}
                  <td className="border border-slate-200 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none text-slate-800">
                    {formatMoney(row.amountDue)}
                  </td>

                  {/* Amount Paid */}
                  <td
                    className={`border border-slate-200 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-bold leading-none ${
                      isPaid
                        ? "text-emerald-700"
                        : isPartiallyPaid
                          ? "text-amber-700"
                          : "text-red-600"
                    }`}
                  >
                    {formatMoney(row.amountPaid)}
                  </td>

                  {/* Paid On */}
                  <td
                    className={`border border-slate-200 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold leading-none ${
                      row.paymentDate
                        ? "text-slate-700"
                        : "text-slate-400"
                    }`}
                  >
                    {row.paymentDate
                      ? formatDate(row.paymentDate)
                      : "—"}
                  </td>

                  {/* Mode */}
                  <td className="border border-slate-200 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-semibold capitalize leading-none text-slate-700">
                    {row.paymentMode ?? "—"}
                  </td>

                  {/* Balance */}
                  <td
                    className={`border border-slate-200 px-1.5 py-[6.5px] text-center align-middle text-[11px] font-extrabold leading-none ${
                      balance === 0
                        ? "text-emerald-700"
                        : "text-red-600"
                    }`}
                  >
                    {formatMoney(balance)}
                  </td>
                </tr>

                {/* =================================================
                    CHITTI LIFT ROW
                    ================================================= */}
                {lifts
                  ?.filter(
                    (lift) =>
                      lift.lifted_month_number ===
                      row.index
                  )
                  .map((lift) => (
                    <tr key={lift.id}>
  <td
  colSpan={8}
  className="h-[22px] border border-emerald-100/70 bg-emerald-50 px-3 py-0 text-center align-middle"
>
  <div className="flex h-[22px] items-center justify-center leading-none">
    <span className="text-[12px] font-extrabold text-emerald-800">
      ✓ Chitti Lift Amount Paid
    </span>

    <span className="mx-2 text-emerald-300">•</span>

    <span className="text-[11px] font-bold text-slate-600">
      Lift Month {lift.lifted_month_number}
    </span>

    <span className="mx-2 text-emerald-300">•</span>

    <span className="text-[11px] font-extrabold text-emerald-700">
      {formatMoney(Number(lift.lift_amount))}
    </span>

    <span className="mx-2 text-emerald-300">•</span>

    <span className="text-[11px] font-semibold text-slate-600">
      {lift.paid_date
        ? formatDate(lift.paid_date)
        : "—"}
    </span>
  </div>
</td>
</tr>
                  ))}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}