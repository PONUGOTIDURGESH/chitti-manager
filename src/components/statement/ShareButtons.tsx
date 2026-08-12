import { useState } from "react";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { Share2, Download } from "lucide-react";

type Props = {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
};

export default function ShareButtons({
  targetRef,
  filename,
}: Props) {
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    if (!targetRef.current) return null;

    const dataUrl = await toPng(targetRef.current, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "#ffffff",
    });

    const res = await fetch(dataUrl);
    return await res.blob();
  };

  const download = async () => {
  if (!targetRef.current) return;

  setBusy(true);

  try {
    const canvas = await html2canvas(targetRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 200;


const imgWidth = pageWidth;
const imgHeight = (canvas.height * imgWidth) / canvas.width;

pdf.addImage(imgData, "PNG", 5, 5, imgWidth, imgHeight);
    pdf.save(`${filename}.pdf`);
  } finally {
    setBusy(false);
  }
};

const save = async () => {
  if (!targetRef.current) return;

  setBusy(true);

  try {
    const canvas = await html2canvas(targetRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
    });

    const link = document.createElement("a");
    link.download = `${filename}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  } finally {
    setBusy(false);
  }
};

  const share = async () => {
    setBusy(true);

    try {
      const blob = await generate();
      if (!blob) return;

      const file = new File([blob], `${filename}.png`, {
        type: "image/png",
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
        await download();
      }
    } finally {
      setBusy(false);
    }
  }
  return (
  <div className="mt-6 flex items-center justify-center gap-3">
  <button
    type="button"
    onClick={share}
    disabled={busy}
    className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
  >
    Share
  </button>

  <button
    type="button"
    onClick={download}
    disabled={busy}
    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
  >
    Download PDF
  </button>

  <button
    type="button"
    onClick={save}
    disabled={busy}
    className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 disabled:opacity-60"
  >
    Save
  </button>
</div>
);
}