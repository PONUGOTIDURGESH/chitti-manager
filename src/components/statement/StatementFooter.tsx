import {
  CalendarDays,
  FileCheck2,
  Info,
  Sparkles,
} from "lucide-react";

type Props = {
  totalPaid: number;
  memberName: string;
  chittiName: string;
  status: string;
};

export default function StatementFooter({
  totalPaid,
  memberName,
  chittiName,
  status,
}: Props) {
  return (
    <footer className="mt-2">
      {/* =====================================================
          COMPACT PAYMENT NOTES
          ===================================================== */}
      <section className="overflow-hidden rounded-xl border border-blue-200 bg-white shadow-sm">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-blue-100 bg-gradient-to-r from-blue-50 to-white px-3 py-1">
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-600 text-white">
            <Info size={13} strokeWidth={2.5} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[6.5px] font-extrabold uppercase tracking-[0.18em] text-blue-600">
              Important Information
            </span>

            <span className="text-[9px] font-black uppercase text-slate-900">
              Payment Rules & Notes
            </span>
          </div>
        </div>

        {/* FOUR COMPACT RULES */}
        <div className="grid grid-cols-4 divide-x divide-slate-100">
          {/* Monthly */}
          <div className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <CalendarDays size={10} strokeWidth={2.5} />
            </div>

            <div className="min-w-0">
              <p className="text-[6px] font-extrabold uppercase tracking-wide text-slate-400">
                Monthly Payment
              </p>

              <p className="mt-0.5 text-[7px] font-semibold leading-tight text-slate-700">
                Pay before the 10th every month.
              </p>
            </div>
          </div>

          {/* Late */}
          <div className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600">
              <span className="text-[9px] font-black">₹</span>
            </div>

            <div className="min-w-0">
              <p className="text-[6px] font-extrabold uppercase tracking-wide text-slate-400">
                Late Payment
              </p>

              <p className="mt-0.5 text-[7px] font-semibold leading-tight text-slate-700">
                ₹100/day penalty from 11th.
              </p>
            </div>
          </div>

          {/* Reminder */}
          <div className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <FileCheck2 size={10} strokeWidth={2.5} />
            </div>

            <div className="min-w-0">
              <p className="text-[6px] font-extrabold uppercase tracking-wide text-slate-400">
                Reminder
              </p>

              <p className="mt-0.5 text-[7px] font-semibold leading-tight text-slate-700">
                Avoid penalties by paying on time.
              </p>
            </div>
          </div>

          {/* Draw */}
          <div className="flex min-w-0 items-center gap-1.5 px-2.5 py-1.5">
            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-violet-50 text-violet-600">
              <Sparkles size={10} strokeWidth={2.5} />
            </div>

            <div className="min-w-0">
              <p className="text-[6px] font-extrabold uppercase tracking-wide text-slate-400">
                Chit Draw
              </p>

              <p className="mt-0.5 text-[7px] font-semibold leading-tight text-slate-700">
                Draw starts from 2nd month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          ULTRA COMPACT FOOTER
          ===================================================== */}
      <div className="mt-1.5 flex items-center justify-between border-t border-slate-200 pt-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-slate-900 text-white">
            <FileCheck2 size={9} strokeWidth={2.5} />
          </div>

          <span className="truncate text-[6.5px] font-semibold text-slate-400">
            Generated from Chitti Management System
          </span>
        </div>

        <div className="text-right">
          <span className="text-[6.5px] font-bold text-slate-400">
            {memberName} • {chittiName}
          </span>
        </div>
      </div>
    </footer>
  );
}