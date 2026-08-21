import { formatDate, todayISO } from "@/lib/format";

type Props = {
  memberName: string;
  mobileNumber: string | null;
  chittiName: string;
  startDate: string | null;
};

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center border-b border-slate-200 py-1 last:border-0">
      <span className="w-[120px] text-[9px] font-medium text-slate-500">
        {label}
      </span>

      <span className="text-[10px] font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

export default function StatementHeader({
  memberName,
  mobileNumber,
  chittiName,
  startDate,
}: Props) {
  return (
    <>
      <header className="border-b-[3px] border-slate-900 pb-2 align-middle">
        <div>
          <div>
            <p className="mb-1 text-[8px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              Account Statement
            </p>

            <h1 className="text-[15px] font-black tracking-tight text-slate-950 leading-none">
              CHITTI PAYMENT STATEMENT
            </h1>
          </div>
          
          
        </div>
      </header>

      <section className="mt-0 grid grid-cols-2 gap-x-4 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1">
        <InfoItem
          label="Member"
          value={memberName}
        />

        <InfoItem
          label="Chitti"
          value={chittiName}
        />

        <InfoItem
          label="Mobile Number"
          value={mobileNumber || "—"}
        />

        <InfoItem
          label="Start Date"
          value={
            startDate
              ? formatDate(startDate)
              : "—"
          }
        />
      </section>
    </>
  );
}