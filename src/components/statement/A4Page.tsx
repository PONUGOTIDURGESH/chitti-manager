import { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export default function A4Page({ children }: Props) {
  return (
    <div className="flex justify-center mb-8">
      <div
        className="bg-white shadow-lg"
        style={{
          width: "210mm",
          minHeight: "297mm",
          padding: "12mm",
          boxSizing: "border-box",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}