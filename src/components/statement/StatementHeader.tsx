import type { ReactNode } from "react";
import {
  CalendarDays,
  CreditCard,
  Phone,
  UserRound,
} from "lucide-react";
import { formatDate } from "@/lib/format";

type Props = {
  memberName: string;
  mobileNumber: string | null;
  chittiName: string;
  startDate: string | null;
  units: number | null | undefined;
};

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5">
      {/* ICON */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
        {icon}
      </div>

      {/* LABEL */}
      <span className="w-[82px] shrink-0 text-[11px] font-bold text-slate-500">
        {label}
      </span>

      {/* VALUE */}
      <div className="min-w-0 flex-1">
  <span className="block truncate text-[14px] font-extrabold leading-none text-[#142b62]">
    {value}
  </span>
</div>
    </div>
  );
}

export default function StatementHeader({
  memberName,
  mobileNumber,
  chittiName,
  startDate,
  units,
}: Props) {
  return (
    <section className="space-y-1.5.5">
      {/* =====================================================
          STATEMENT TITLE
          ===================================================== */}
      <header className="border-b-[3px] border-blue-700 pb-2">
  <p className="mb-1 text-[7px] font-extrabold uppercase tracking-[0.2em] text-blue-600">
    Account Statement
  </p>

  <h1 className="text-[14px] font-black uppercase leading-none tracking-[-0.03em] text-[#10285c]">
    Chitti Payment Statement
  </h1>
</header>

      {/* =====================================================
          MEMBER / CHITTI INFORMATION
          ===================================================== */}
      <section className="rounded-[10px] border border-blue-100 bg-gradient-to-r from-white via-blue-50/20 to-white px-3 py-1.5 shadow-sm">
        <div className="grid grid-cols-2">
          {/* =================================================
              LEFT INFORMATION
              ================================================= */}
          <div className="space-y-1.5 border-r border-blue-100 pr-6">
            <InfoRow
              icon={<UserRound className="h-4 w-4" strokeWidth={2.2} />}
              label="Member"
              value={memberName}
            />

            <InfoRow
              icon={<Phone className="h-4 w-4" strokeWidth={2.2} />}
              label="Mobile Number"
              value={mobileNumber || "—"}
            />
          </div>

          {/* =================================================
              RIGHT INFORMATION
              ================================================= */}
          <div className="space-y-1.5 pl-7">
            <div className="flex min-w-0 items-center gap-2.5">
  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
    <CreditCard
      className="h-4 w-4"
      strokeWidth={2.2}
    />
  </div>

  <span className="w-[82px] shrink-0 text-[11px] font-bold text-slate-500">
    Chitti
  </span>

  <div className="min-w-0 flex-1">
    <p className="truncate text-[14px] font-extrabold leading-none text-[#142b62]">
      {chittiName}
    </p>

    <p className="mt-1 text-[9px] font-bold leading-none text-blue-600">
      {units ?? 1} {units === 1 ? "Chitti" : "Chittis"}
    </p>
  </div>
</div>

            <InfoRow
              icon={<CalendarDays className="h-4 w-4" strokeWidth={2.2} />}
              label="Start Date"
              value={startDate ? formatDate(startDate) : "—"}
            />
          </div>
        </div>
      </section>
    </section>
  );
}