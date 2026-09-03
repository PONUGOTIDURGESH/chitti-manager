import {
  Coins,
  TrendingUp,
  FileCheck2,
  PieChart,
} from "lucide-react";

import { formatMoney } from "@/lib/format";
import type { MemberFinance } from "@/lib/finance";
import type { Member } from "@/types";

type Props = {
  member: Member;
  finance: MemberFinance;
};

function Card({
  icon,
  title,
  value,
  theme,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  theme: "blue" | "green" | "purple" | "orange";
}) {
  const themes = {
    blue: {
      border: "border-blue-200",
      bg: "bg-blue-50/40",
      iconBg: "bg-blue-100",
      icon: "text-blue-600",
      title: "text-blue-700",
      accent: "bg-blue-600",
    },

    green: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/40",
      iconBg: "bg-emerald-100",
      icon: "text-emerald-600",
      title: "text-emerald-700",
      accent: "bg-emerald-500",
    },

    purple: {
      border: "border-purple-200",
      bg: "bg-purple-50/40",
      iconBg: "bg-purple-100",
      icon: "text-purple-600",
      title: "text-purple-700",
      accent: "bg-purple-500",
    },

    orange: {
      border: "border-orange-200",
      bg: "bg-orange-50/40",
      iconBg: "bg-orange-100",
      icon: "text-orange-600",
      title: "text-orange-600",
      accent: "bg-orange-500",
    },
  };

  const t = themes[theme];

  return (
    <div
      className={`relative min-w-0 overflow-hidden rounded-lg border ${t.border} ${t.bg} px-2.5 py-2.5 shadow-sm`}
    >
      {/* TOP ACCENT */}
      <div
        className={`absolute inset-x-0 top-0 h-[2px] ${t.accent}`}
      />

      <div className="flex items-center gap-2">
        {/* ICON */}
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${t.iconBg} ${t.icon}`}
        >
          {icon}
        </div>

        {/* CONTENT */}
        <div className="min-w-0 flex-1">
          <p
            className={`truncate text-[7px] font-extrabold uppercase tracking-[0.1em] ${t.title}`}
          >
            {title}
          </p>

          <p className="mt-0.5 truncate text-[13px] font-black leading-tight tracking-tight text-[#142b62]">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StatementSummary({
  member,
  finance,
}: Props) {
  return (
    <section>
      <div className="grid grid-cols-4 gap-2">
        {/* TOTAL CHITTI */}
        <Card
          icon={<Coins className="h-4 w-4" strokeWidth={2.5} />}
          title="Total Chitti"
          value={formatMoney(
            member.installment_amount *
              member.total_installments
          )}
          theme="blue"
        />

        {/* CURRENT EMI */}
        <Card
          icon={<TrendingUp className="h-4 w-4" strokeWidth={2.5} />}
          title="Current EMI"
          value={formatMoney(finance.currentInstallment)}
          theme="green"
        />

        {/* PAID */}
        <Card
          icon={<FileCheck2 className="h-4 w-4" strokeWidth={2.5} />}
          title="Paid"
          value={`${finance.installmentsPaid}/${member.total_installments}`}
          theme="purple"
        />

        {/* REMAINING */}
        <Card
          icon={<PieChart className="h-4 w-4" strokeWidth={2.5} />}
          title="Remaining"
          value={`${finance.installmentsRemaining}`}
          theme="orange"
        />
      </div>
    </section>
  );
}