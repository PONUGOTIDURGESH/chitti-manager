import { formatMoney } from "@/lib/format";

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
  <footer className="mt-0 border-t-4 border-slate-900 pt-2">
    <div className="w-full rounded-lg border border-slate-300 bg-slate px-3 py-2 text-[9px] leading-[1.2] text-slate-800">
      <p className="font-semibold">
        Note: Every month chit amount should be paid before the 10th of every month.
      </p>

      <p className="mt-1">
        If any one misses the chit payment before the 10th, a penalty of ₹100 per day
        will be charged from the 11th onwards.
      </p>

      <p className="mt-1 font-semibold">
        Please pay the chit amount before the 10th of every month.
      </p>

      <p className="mt-1 font-semibold">
        From the 2nd month onwards there will be a draw (chit).
      </p>
    </div>

    <div className="mt-2 flex justify-between text-[10px] text-slate-400">
      <span>
        This statement is generated from the Chitti Management System.
      </span>

      <span>
        {memberName} • {chittiName}
      </span>
    </div>
  </footer>
);
}