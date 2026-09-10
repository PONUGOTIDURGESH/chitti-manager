import React from "react";

type BrandLogoVariant =
  | "hero"
  | "sidebar"
  | "mobile"
  | "watermark"
  | "statement"
  | "seal";

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  className?: string;
  showText?: boolean;
}

const variantStyles: Record<
  BrandLogoVariant,
  {
    logo: string;
    text: string;
    wrapper: string;
  }
> = {
  hero: {
    logo: "h-28 w-28",
    text: "text-2xl",
    wrapper: "flex flex-col items-center gap-3",
  },

  sidebar: {
    logo: "h-10 w-10",
    text: "text-lg",
    wrapper: "flex items-center gap-3",
  },

  mobile: {
    logo: "h-9 w-9",
    text: "text-base",
    wrapper: "flex items-center gap-2.5",
  },

  watermark: {
    logo: "h-40 w-40 opacity-[0.045]",
    text: "hidden",
    wrapper: "pointer-events-none",
  },

  statement: {
    logo: "h-12 w-12",
    text: "text-xl",
    wrapper: "flex items-center gap-3",
  },

  seal: {
    logo: "h-8 w-8",
    text: "hidden",
    wrapper: "inline-flex items-center justify-center",
  },
};

export default function BrandLogo({
  variant = "sidebar",
  className = "",
  showText = true,
}: BrandLogoProps) {
  const style = variantStyles[variant];

  const shouldShowText =
    showText &&
    variant !== "watermark" &&
    variant !== "seal";

  return (
    <div className={`${style.wrapper} ${className}`}>
      <img
        src="/logo.png"
        alt="Chitti Manager"
        className={`${style.logo} object-contain`}
      />

      {shouldShowText && (
        <div className="leading-tight">
          <div
            className={`${style.text} font-black tracking-tight text-slate-900`}
          >
            Chitti Manager
          </div>

          {variant === "hero" && (
            <div className="mt-1 text-center text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              Smart Chitti Management
            </div>
          )}
        </div>
      )}
    </div>
  );
}