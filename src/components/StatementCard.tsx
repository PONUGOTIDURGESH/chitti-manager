import { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { Share2, Download, Loader2 } from 'lucide-react';
import type { Member } from '@/types';
import type { InstallmentRow, MemberFinance } from '@/lib/finance';
import { formatMoney, formatDate, todayISO } from '@/lib/format';

const A4 = {
  width: '210mm',
  height: '297mm',

  paddingTop: '12mm',
  paddingBottom: '12mm',
  paddingLeft: '12mm',
  paddingRight: '12mm',
};

export function ShareButtons({
  targetRef,
  filename,
}: {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
}) {
  const [busy, setBusy] = useState(false);

  const generate = async (): Promise<Blob | null> => {
  if (!targetRef.current) return null;

  const element = targetRef.current;

  const width = element.scrollWidth;
  const height = element.scrollHeight;

  const dataUrl = await toPng(element, {
    width,
    height,
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: '#ffffff',
    style: {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: 'none',
      overflow: 'visible',
    },
  });

  const res = await fetch(dataUrl);
  return await res.blob();
};

  const share = async () => {
    setBusy(true);

    try {
      const blob = await generate();
      if (!blob) return;

      const file = new File([blob], filename, {
        type: 'image/png',
      });

      if (
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: filename,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        a.href = url;
        a.download = filename;
        a.click();

        URL.revokeObjectURL(url);
      }
    } catch (e) {
      if (e instanceof Error && e.name !== 'AbortError') {
        alert('Could not share. Try saving the image instead.');
      }
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    setBusy(true);

    try {
      const blob = await generate();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = filename;
      a.click();

      URL.revokeObjectURL(url);
    } catch {
      alert('Could not generate image.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 flex gap-2">
      <button
        onClick={share}
        disabled={busy}
        className="btn-primary flex-1"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        Share
      </button>

      <button
        onClick={download}
        disabled={busy}
        className="btn-secondary flex-1"
      >
        <Download className="h-4 w-4" />
        Save image
      </button>
    </div>
  );
}

export function StatementCard({
  member,
  chittiName,
  rows,
  finance,
}: {
  member: Member;
  chittiName: string;
  rows: InstallmentRow[];
  finance: MemberFinance;
}) 

{
  const ref = useRef<HTMLDivElement>(null);

  const today = todayISO();

  console.log("TODAY:", today);

rows.forEach((row) => {
  console.log({
    month: row.monthLabel,
    dueDate: row.dueDate,
    amountDue: row.amountDue,
    amountPaid: row.amountPaid,
    status: row.status,
  });
});

const todayDate = new Date(today);

const totalDue = rows
  .filter((row) => row.monthLabel === "Aug 2026")
  .reduce((total, row) => {
    console.log("CHECK ROW", row);

    const dueDate = new Date(row.dueDate);
    const todayDate = new Date(today);

    console.log({
      dueDate,
      todayDate,
      isFuture: dueDate > todayDate,
    });

    if (dueDate > todayDate) {
      return total;
    }

    return total + Math.max(
      Number(row.amountDue) - Number(row.amountPaid),
      0
    );
  }, 0);

const currentInstallment =
  rows.find((row) => row.status !== 'PAID')?.amountDue ??
  rows[rows.length - 1]?.amountDue ??
  Number(member.installment_amount);

  const ROWS_PER_PAGE = 12;

const pages: InstallmentRow[][] = [];

for (let i = 0; i < rows.length; i += ROWS_PER_PAGE) {
  pages.push(rows.slice(i, i + ROWS_PER_PAGE));
}

const totalRows = rows.length;

const scale =
  totalRows <= 25
    ? 1
    : totalRows <= 35
    ? 0.92
    : totalRows <= 45
    ? 0.84
    : totalRows <= 60
    ? 0.76
    : totalRows <= 80
    ? 0.68
    : 0.60;

return (
    <div
  style={{
    transform: `scale(${scale})`,
    transformOrigin: "top center",
    width: `${100 / scale}%`,
  }}
>
      {/* Screen preview wrapper */}
      <div className="w-full overflow-x-auto">
        {/* Fixed A4 canvas */}
        <div
          ref={ref}
          className="relative bg-white text-slate-900"
          style={{
  width: A4.width,

  maxHeight: A4.height,
  paddingTop: A4.paddingTop,
paddingBottom: A4.paddingBottom,
paddingLeft: A4.paddingLeft,
paddingRight: A4.paddingRight,
  boxSizing: 'border-box',

  background: '#ffffff',
margin: '0 auto',
overflow: 'visible',
position: 'relative',

  fontFamily:
    'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}}
        >
          {/* HEADER */}
          <header className="border-b-[3px] border-slate-900 pb-6">
            <div className="flex items-end justify-between">
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-500">
                  Account Statement
                </p>

                <h1 className="text-[30px] font-bold uppercase tracking-tight">
                  Chitti Payment Statement
                </h1>
              </div>

              <div className="text-right text-[11px] text-slate-500">
                Generated
                <div className="mt-1 text-[14px] font-semibold text-slate-900">
                  {formatDate(todayISO())}
                </div>
              </div>
            </div>
          </header>

          {/* MEMBER INFORMATION */}
          <section className="mt-5 grid grid-cols-2 gap-x-10 rounded-lg border border-slate-200 bg-slate-50 px-5 py-3">
            <InfoItem
              label="Member"
              value={member.full_name}
            />

            <InfoItem
              label="Chitti"
              value={chittiName}
            />

            <InfoItem
              label="Mobile Number"
              value={member.mobile_number || '—'}
            />

            <InfoItem
              label="Start Date"
              value={
                member.start_date
                  ? formatDate(member.start_date)
                  : '—'
              }
            />
          </section>

          {/* SUMMARY */}
          <section className="mt-7 grid grid-cols-7 gap-3">
            <SummaryBox
              label="Total Chitti"
              value={formatMoney(finance.totalExpected)}
            />

            <SummaryBox
label="Current EMI"
  value={formatMoney(currentInstallment)}
/>

<SummaryBox
  label="Total Due"
  value={formatMoney(totalDue)}
/>


            <SummaryBox
              label="Balance"
              value={formatMoney(finance.remainingBalance)}
            />

            <SummaryBox
              label="Paid"
              value={`${finance.installmentsPaid}/${member.total_installments}`}
            />

            <SummaryBox
              label="Remaining"
              value={`${finance.installmentsRemaining}`}
            />
          </section>

          {/* PAYMENT TABLE */}
          <section className="mt-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-bold">
                Installment Details
              </h2>

              <p className="text-[10px] text-slate-500">
                {rows.length} EMIs
              </p>
            </div>

            <table className="w-full table-fixed border-collapse text-[14px]">
              <colgroup>
  <col style={{ width: '5%' }} />

  <col style={{ width: '15%' }} />
  <col style={{ width: '13%' }} />
  <col style={{ width: '13%' }} />
  <col style={{ width: '11%' }} />
  <col style={{ width: '11%' }} />
  <col style={{ width: '10%' }} />
  <col style={{ width: '12%' }} />
</colgroup>

              <thead>
  <tr className="bg-slate-100">
    <TableHeader>#</TableHeader>

    

    <TableHeader>Due Date</TableHeader>

    <TableHeader align="right">
      Lift Amount
    </TableHeader>

    <TableHeader align="right">
      Amount Due
    </TableHeader>

    <TableHeader align="right">
  Amount Paid
</TableHeader>





<TableHeader>
  Paid On
</TableHeader>

<TableHeader>
  Mode
</TableHeader>

<TableHeader>
  Status
</TableHeader>
  </tr>
</thead>

<tbody>
  {rows.map((r, index) => (
    <>
      <tr key={r.index}>
      <TableCell>{r.index}</TableCell>

      <TableCell>
        {formatDate(r.dueDate)}
      </TableCell>

      <TableCell align="right">
        {formatMoney(r.liftAmount, false)}
      </TableCell>

      <TableCell align="right">
        {formatMoney(r.amountDue, false)}
      </TableCell>

      <TableCell align="right">
        {formatMoney(r.amountPaid, false)}
      </TableCell>

      



      <TableCell>
        {r.paymentDate
          ? formatDate(r.paymentDate)
          : '—'}
      </TableCell>

      <TableCell>
        <span className="capitalize">
          {r.paymentMode ?? '—'}
        </span>
      </TableCell>

      <TableCell>
        <InstallmentStatus status={r.status} />
      </TableCell>
    </tr>

    {member.is_lifted &&
 member.lifted_month_number === r.index && (
  <tr>
    <td
      colSpan={8}
      className="border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800"
    >
      ⭐ Lift Paid • Month {member.lifted_month_number} • {formatMoney(r.liftAmount)} • {member.lifted_date ? formatDate(member.lifted_date) : "—"}
    </td>
  </tr>
)}


    </>
  ))}
</tbody>
            </table>

            


          </section>

          {/* TOTAL SECTION */}
          <section className="mt-8 border-t-[3px] border-slate-900 pt-6">
            <div className="flex justify-end">
              <div className="flex gap-12">

                
              </div>

              <StatusBadgeForImage
                status={finance.status}
              />
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-5 border-t border-slate-200 pt-2">
            <div className="flex items-center justify-between text-[12px] text-slate-400">
              <span>
                This statement is generated from the Chitti
                Management System.
              </span>

              <span>
                {member.full_name} • {chittiName}
              </span>
            </div>
          </footer>
        </div>
      </div>

      <ShareButtons
        targetRef={ref}
        filename={`statement-${member.full_name}.png`}
      />
    </div>
  );
}

function InfoItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center border-b border-slate-200 py-2 last:border-0">
      <span className="w-[145px] text-[14px] font-medium text-slate-500">
        {label}
      </span>

      <span className="text-[16px] font-semibold text-slate-900">
        {value}
      </span>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-[92px] flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50 px-2 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

     <p className="mt-1 whitespace-nowrap text-[15px] font-extrabold text-slate-900">
        {value}
      </p>
    </div>
  );
}

function TableHeader({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <th
      className={`border border-slate-300 bg-slate-100 px-2 py-1 h-[36px] text-[12px] font-semibold text-black ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  );
}

function TableCell({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right';
}) {
  return (
    <td
      className={`h-[28px] border border-slate-200 px-1.5 py-0.5 text-[11px] ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </td>
  );
}

function TotalItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-[22px] font-extrabold">
        {value}
      </p>
    </div>
  );
}

function InstallmentStatus({
  status,
}: {
  status: string;
}) {
  const styles: Record<string, string> = {
    PAID: 'bg-green-100 text-green-700',
    PENDING: 'bg-slate-100 text-slate-700',
    PARTIAL: 'bg-amber-100 text-amber-700',
    OVERDUE: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full px-2 py-1 text-[10px] font-bold ${
        styles[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {status}
    </span>
  );
}

function StatusBadgeForImage({
  status,
}: {
  status: MemberFinance['status'];
}) {
  const colors: Record<string, string> = {
    UP_TO_DATE: 'bg-green-100 text-green-700',
    DUE_SOON: 'bg-amber-100 text-amber-700',
    DUE: 'bg-amber-100 text-amber-700',
    OVERDUE: 'bg-red-100 text-red-700',
    PARTIALLY_PAID: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
  };

  const labels: Record<string, string> = {
    UP_TO_DATE: 'UP TO DATE',
    DUE_SOON: 'DUE SOON',
    DUE: 'DUE',
    OVERDUE: 'OVERDUE',
    PARTIALLY_PAID: 'PARTIALLY PAID',
    COMPLETED: 'COMPLETED',
  };

  return (
    <span
      className={`rounded-full px-5 py-2 text-[13px] font-bold ${
        colors[status] ?? 'bg-slate-100 text-slate-700'
      }`}
    >
      {labels[status] ?? status}
    </span>
  );
}


