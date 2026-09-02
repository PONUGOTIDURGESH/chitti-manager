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
const [pan, setPan] = useState({ x: 0, y: 0 });


const lastTouch = useRef({ x: 0, y: 0 });

const pinchStartDistance = useRef<number | null>(null);
const pinchStartZoom = useRef(1);



const getTouchDistance = (touches: React.TouchList) => {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;

  return Math.sqrt(dx * dx + dy * dy);
};




const handleTouchStart = (e: React.TouchEvent) => {
  if (e.touches.length === 2) {
    pinchStartDistance.current =
      getTouchDistance(e.touches);

    pinchStartZoom.current = zoom;
    return;
  }

  if (e.touches.length === 1 && zoom > 1) {
    lastTouch.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }
};

const handleTouchMove = (e: React.TouchEvent) => {
  // =========================================================
  // TWO FINGERS → PINCH ZOOM
  // =========================================================
  if (
    e.touches.length === 2 &&
    pinchStartDistance.current !== null
  ) {
    e.preventDefault();

    const currentDistance =
      getTouchDistance(e.touches);

    const ratio =
      currentDistance /
      pinchStartDistance.current;

    const nextZoom = Math.min(
      2.5,
      Math.max(
        1,
        pinchStartZoom.current * ratio
      )
    );

    setZoom(nextZoom);

    if (nextZoom <= 1) {
      setPan({ x: 0, y: 0 });
    }

    return;
  }

  // =========================================================
  // ONE FINGER → HORIZONTAL PAN WHEN ZOOMED
  // =========================================================
  if (
    e.touches.length === 1 &&
    zoom > 1
  ) {
    const currentX =
      e.touches[0].clientX;

    const currentY =
      e.touches[0].clientY;

    const deltaX =
      currentX - lastTouch.current.x;

    const deltaY =
      currentY - lastTouch.current.y;

    // Only capture horizontal dragging.
    // Vertical movement remains normal page scrolling.
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault();

      const pageWidth =
        statementRef.current?.offsetWidth ??
        794;

      const viewportWidth =
        statementRef.current?.parentElement
          ?.clientWidth ??
        window.innerWidth;

      const scaledPageWidth =
        pageWidth * pageScale * zoom;

      const maxPanX = Math.max(
        0,
        (scaledPageWidth -
          viewportWidth) / 2
      );

      setPan((current) => ({
        x: Math.max(
          -maxPanX,
          Math.min(
            maxPanX,
            current.x + deltaX
          )
        ),
        y: current.y,
      }));
    }

    lastTouch.current = {
      x: currentX,
      y: currentY,
    };
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
    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
    transformOrigin: "center center",
    touchAction: "pan-y",
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
  transformOrigin: "center center",
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