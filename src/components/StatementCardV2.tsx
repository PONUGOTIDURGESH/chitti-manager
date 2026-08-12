import type {  MemberLift } from "@/types";
import { useMemo, useRef } from "react";
import StatementHeader from "./statement/StatementHeader";
import StatementTable from "./statement/StatementTable";
import StatementFooter from "./statement/StatementFooter";
import StatementSummary from "./statement/StatementSummary";
import ShareButtons from "./statement/ShareButtons";
import { computeMemberFinance, getInstallmentRows } from "@/lib/finance";


import type {
  Member,
  Payment,
  Chitti,
  ChittiSchedule,
} from "@/types";

type Props = {
  member: Member;
  payments: Payment[];
  chitti: Chitti;
  schedules: ChittiSchedule[];
  lifts?: MemberLift[];
};


export default function StatementCardV2({
  member,
  payments,
  chitti,
  schedules,
  lifts = [],
}: Props) {
  const rows = useMemo(
    () =>
      getInstallmentRows(
        member,
        payments,
        chitti,
        schedules,
        lifts
      ),
    [member, payments, chitti, schedules]
  );

  const finance = useMemo(
    () =>
      computeMemberFinance(
        member,
        payments,
        chitti,
        schedules
      ),
    [member, payments, chitti, schedules]
  );

  const statementRef = useRef<HTMLDivElement>(null);

  const scale = Math.min(1, 35 / rows.length);
  const pageScale = rows.length > 35 ? scale : 1;

  return (
  <div className="flex flex-col items-center bg-slate-100 py-3">
    {/* A4 page */}
    <div
      ref={statementRef}
      className="bg-white text-slate-900 shadow-sm"
      style={{
        width: "210mm",
        minHeight: "297mm",
        padding: "2.5mm",
        overflow: "hidden",
        transform: `scale(${pageScale})`,
        transformOrigin: "top center",
      }}
    >
      {/* Header */}
      <StatementHeader
        memberName={member.full_name}
        mobileNumber={member.mobile_number ?? null}
        chittiName={chitti.name}
        startDate={member.start_date}
      />
      {/* Summary */}
      <div className="mt-2">
        <StatementSummary
          member={member}
          finance={finance}
        />
      </div>

      {/* Table */}
      <div className="mt-2">
        <StatementTable
          rows={rows}
          lifts={lifts}
          liftedMonth={member.lifted_month_number}
          liftedDate={member.lifted_date}
        />
      </div>

      {/* Footer */}
      <div className="mt-3">
        <StatementFooter
          totalPaid={finance.totalPaid}
          memberName={member.full_name}
          chittiName={chitti.name}
          status={finance.status}
        />
      </div>
    </div>

    {/* Share buttons */}
    <ShareButtons
      targetRef={statementRef}
      filename={`${member.full_name}-statement`}
    />
  </div>
  )}