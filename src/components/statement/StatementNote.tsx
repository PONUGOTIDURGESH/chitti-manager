import { StickyNote } from "lucide-react";

type Props = {
  note?: string | null;
};

export default function StatementNote({ note }: Props) {
  const text = (note ?? "").trim();

  if (!text) return null;

  return (
    <section className="mb-2 overflow-hidden rounded-xl border border-amber-300 bg-amber-50">
      <div className="flex items-center gap-1.5 border-b border-amber-200 px-3 py-1">
        <StickyNote size={11} strokeWidth={2.5} className="text-amber-600" />

        <span className="text-[7px] font-extrabold uppercase tracking-[0.18em] text-amber-700">
          Note
        </span>
      </div>

      <p className="whitespace-pre-line break-words px-3 py-1.5 text-[10px] font-semibold leading-snug text-slate-800">
        {text}
      </p>
    </section>
  );
}