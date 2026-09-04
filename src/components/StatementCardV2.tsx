import type { MemberLift } from "@/types";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { TouchEvent } from "react";
import { formatMoney } from "@/lib/format";
import StatementHeader from "./statement/StatementHeader";
import StatementTable from "./statement/StatementTable";
import StatementFooter from "./statement/StatementFooter";
import StatementSummary from "./statement/StatementSummary";
import ShareButtons from "./statement/ShareButtons";

import {
  computeMemberFinance,
  getInstallmentRows,
} from "@/lib/finance";

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
    [
      member,
      payments,
      chitti,
      schedules,
      lifts,
    ]
  );

  const finance = useMemo(
    () =>
      computeMemberFinance(
        member,
        payments,
        chitti,
        schedules
      ),
    [
      member,
      payments,
      chitti,
      schedules,
    ]
  );

  // =========================================================
  // REFS
  // =========================================================

  const statementRef =
    useRef<HTMLDivElement>(null);

  const viewportRef =
    useRef<HTMLDivElement>(null);
    useEffect(() => {
  viewportRef.current?.scrollTo({
    top: 0,
    left: 0,
    behavior: "instant",
  });

  resetPan();
}, [member.id]);

  // =========================================================
  // ZOOM / PAN
  // =========================================================

  const [zoom, setZoom] = useState(1.08);

  const [pan, setPan] = useState({
    x: 0,
    y: 0,
  });

  const lastTouch = useRef({
    x: 0,
    y: 0,
  });

  const pinchStartDistance =
    useRef<number | null>(null);

  const pinchStartZoom =
    useRef(1);

  // =========================================================
  // TOUCH DISTANCE
  // =========================================================

  const getTouchDistance = (
    touches: React.TouchList
  ) => {
    if (touches.length < 2) {
      return 0;
    }

    const dx =
      touches[0].clientX -
      touches[1].clientX;

    const dy =
      touches[0].clientY -
      touches[1].clientY;

    return Math.sqrt(
      dx * dx + dy * dy
    );
  };

  // =========================================================
  // RESET PAN
  // =========================================================

  const resetPan = () => {
    setPan({
      x: 0,
      y: 0,
    });
  };

   // =========================================================
  // TOUCH START
  // =========================================================

  const handleTouchStart = (
    e: TouchEvent<HTMLDivElement>
  ) => {
    // TWO FINGERS → PINCH ZOOM
    if (e.touches.length === 2) {
      pinchStartDistance.current =
        getTouchDistance(e.touches);

      pinchStartZoom.current = zoom;

      return;
    }

    // ONE FINGER → PAN WHEN ZOOMED
    if (
      e.touches.length === 1 &&
      zoom > 1
    ) {
      lastTouch.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  // =========================================================
  // TOUCH MOVE
  // =========================================================

  const handleTouchMove = (
    e: TouchEvent<HTMLDivElement>
  ) => {
    // =======================================================
    // TWO FINGERS → PINCH ZOOM
    // =======================================================

    if (
      e.touches.length === 2 &&
      pinchStartDistance.current !== null
    ) {
      e.preventDefault();

      const currentDistance =
        getTouchDistance(e.touches);

      if (
        pinchStartDistance.current <= 0
      ) {
        return;
      }

      const ratio =
        currentDistance /
        pinchStartDistance.current;

      const nextZoom = Math.min(
        3,
        Math.max(
          1,
          pinchStartZoom.current * ratio
        )
      );

      setZoom(nextZoom);

      if (nextZoom <= 1) {
        resetPan();
      }

      return;
    }

    // =======================================================
    // ONE FINGER → PAN WHEN ZOOMED
    // =======================================================

    if (
      e.touches.length === 1 &&
      zoom > 1
    ) {
      e.preventDefault();

      const currentX =
        e.touches[0].clientX;

      const currentY =
        e.touches[0].clientY;

      const deltaX =
        currentX -
        lastTouch.current.x;

      const deltaY =
        currentY -
        lastTouch.current.y;

      const viewport =
        viewportRef.current;

      const statement =
        statementRef.current;

      if (!viewport || !statement) {
        return;
      }

      const viewportWidth =
        viewport.clientWidth;

      const viewportHeight =
        viewport.clientHeight;

      // Actual visual size after zoom
      const rect =
        statement.getBoundingClientRect();

      const scaledWidth =
        rect.width;

      const scaledHeight =
        rect.height;

      // Horizontal pan boundary
      const maxPanX = Math.max(
        0,
        (scaledWidth -
          viewportWidth) / 2
      );

      // Vertical pan boundary
      const maxPanY = Math.max(
        0,
        (scaledHeight -
          viewportHeight) / 2
      );

      setPan((current) => ({
        x: Math.max(
          -maxPanX,
          Math.min(
            maxPanX,
            current.x + deltaX
          )
        ),

        y: Math.max(
          -maxPanY,
          Math.min(
            maxPanY,
            current.y + deltaY
          )
        ),
      }));

      lastTouch.current = {
        x: currentX,
        y: currentY,
      };
    }
  };

  // =========================================================
  // TOUCH END
  // =========================================================

  const handleTouchEnd = (
    e: TouchEvent<HTMLDivElement>
  ) => {
    if (e.touches.length < 2) {
      pinchStartDistance.current =
        null;
    }

    if (
      e.touches.length === 1 &&
      zoom > 1
    ) {
      lastTouch.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else {
      lastTouch.current = {
        x: 0,
        y: 0,
      };
    }
  };

  // =========================================================
  // RESPONSIVE A4 WIDTH
  // =========================================================
  return (
    <div className="flex w-full flex-col bg-slate-950">
      {/* =====================================================
          DOCUMENT VIEWER
          ===================================================== */}

      <div
  ref={viewportRef}
  className="relative w-full bg-slate-300/70 px-2 py-2"
  style={{
  height:
    "min(520px, calc(100dvh - 300px))",

  minHeight: "420px",

  overflow:
    zoom > 1
      ? "hidden"
      : "auto",

  touchAction:
    zoom > 1
      ? "none"
      : "pan-y",

  WebkitOverflowScrolling:
    "touch",

  overscrollBehavior:
    "contain",

  scrollbarWidth:
    "none",
}}
>
        {/* ===================================================
            DOCUMENT
            =================================================== */}

        <div
  className="flex w-full justify-center"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform:
              `translate(${pan.x}px, ${pan.y}px)`,
            transformOrigin:
              "center center",

            transition:
              pinchStartDistance.current === null
                ? "transform 0.05s linear"
                : "none",
          }}
        >
          <div
            ref={statementRef}
            className="relative shrink-0 bg-white text-slate-900 shadow-2xl"
            style={{
              width:
                "min(794px, calc(100vw - 32px))",

              minHeight:
                "calc(min(794px, calc(100vw - 32px)) * 1.414)",

              padding: "6mm",

              transform:
                `scale(${zoom})`,

              transformOrigin:
                "center center",
            }}
          >
            {/* =================================================
                HEADER
                ================================================= */}

            <StatementHeader
              memberName={
                member.full_name
              }
              mobileNumber={
                member.mobile_number ??
                null
              }
              chittiName={
                chitti.name
              }
              startDate={
                member.start_date
              }
               units={member.units ?? 1}
            />

            {/* =================================================
                SUMMARY
                ================================================= */}

            <div className="mt-1.5">
              <StatementSummary
                member={member}
                finance={finance}
              />
            </div>

            {/* =================================================
                TABLE
                ================================================= */}

            <div className="mt-0">
              <StatementTable
                rows={rows}
                lifts={lifts}
                liftedMonth={
                  member.lifted_month_number
                }
                liftedDate={
                  member.lifted_date
                }
              />
            </div>

            {/* =====================================================
    CHITTI LIFT STATEMENT
    ===================================================== */}


            {/* =================================================
                FOOTER
                ================================================= */}

            <div className="mt-3">
              <StatementFooter
                totalPaid={
                  finance.totalPaid
                }
                memberName={
                  member.full_name
                }
                chittiName={
                  chitti.name
                }
                status={
                  finance.status
                }
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          ACTION BAR
          ===================================================== */}

      <div className="mt-24 border-t border-slate-800 bg-slate-950 px-3 py-4">
  <ShareButtons
    targetRef={statementRef}
    filename={`${member.full_name}-statement`}
  />
</div>
    </div>
  );
}