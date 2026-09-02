import type {  MemberLift } from "@/types";
import { useMemo, useRef, useState } from "react";
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
    [member, payments, chitti, schedules, lifts]
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

const [zoom, setZoom] = useState(1);
const pinchStartDistance = useRef<number | null>(null);
const pinchStartZoom = useRef(1);

const getTouchDistance = (touches: React.TouchList) => {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;

  return Math.sqrt(dx * dx + dy * dy);
};

const handleTouchStart = (e: React.TouchEvent) => {
  if (e.touches.length === 2) {
    pinchStartDistance.current = getTouchDistance(e.touches);
    pinchStartZoom.current = zoom;
  }
};

const handleTouchMove = (e: React.TouchEvent) => {
  if (e.touches.length === 2 && pinchStartDistance.current) {
    e.preventDefault();

    const currentDistance = getTouchDistance(e.touches);
    const ratio = currentDistance / pinchStartDistance.current;

    setZoom(
      Math.min(
        2.5,
        Math.max(0.6, pinchStartZoom.current * ratio)
      )
    );
  }
};

const handleTouchEnd = () => {
  pinchStartDistance.current = null;
};

const scale = Math.min(
  1,
  typeof window !== 'undefined'
    ? (window.innerWidth - 32) / 794
    : 1
);

const pageScale = scale;
  return (
  <div className="flex w-full flex-col items-center bg-slate-200/60 py-6">

    


    {/* A4 page */}
    <div
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
  style={{
    transform: `scale(${zoom})`,
    transformOrigin: "top center",
    touchAction: "none",
  }}
>
  <div
    ref={statementRef}
      className="relative shrink-0 bg-white text-slate-900"
      style={{
  width: "210mm",
  minHeight: "297mm",
  padding: "6mm",
  overflow: "visible",
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

      <div className="mt-1.5">
        <StatementSummary
          member={member}
          finance={finance}
        />
      </div>

      {/* Table */}
      <div className="mt-0">
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
  </div>

  {/* Share buttons */}
  <ShareButtons
    targetRef={statementRef}
    filename={`${member.full_name}-statement`}
  />
</div>
);
}