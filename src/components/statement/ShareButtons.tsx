import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
};

export default function ShareButtons({
  targetRef,
  filename,
}: Props) {
  const [busy, setBusy] = useState(false);

  // =========================================================
  // GENERATE A4-SIZED IMAGE
  // =========================================================
  const generateA4Image = async (): Promise<Blob | null> => {
  if (!targetRef.current) return null;

  const original = targetRef.current;

  const clone = original.cloneNode(true) as HTMLElement;

  const EXPORT_WIDTH = 794;
  const A4_WIDTH = 2480;
  const A4_HEIGHT = 3508;
  const MARGIN = 40;

  clone.style.transform = "none";
  clone.style.transformOrigin = "top left";

  clone.style.width = `${EXPORT_WIDTH}px`;
  clone.style.minWidth = `${EXPORT_WIDTH}px`;
  clone.style.height = "auto";
  clone.style.minHeight = "1123px";

  clone.style.position = "absolute";
  clone.style.left = "-10000px";
  clone.style.top = "0";
  clone.style.margin = "0";
  clone.style.overflow = "visible";

  document.body.appendChild(clone);

  try {
    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",

      width: EXPORT_WIDTH,
      windowWidth: EXPORT_WIDTH,

      height: Math.max(
        1123,
        clone.scrollHeight
      ),

      windowHeight: Math.max(
        1123,
        clone.scrollHeight
      ),

      scrollX: 0,
      scrollY: 0,
    });

    const outputCanvas =
      document.createElement("canvas");

    outputCanvas.width = A4_WIDTH;
    outputCanvas.height = A4_HEIGHT;

    const ctx =
      outputCanvas.getContext("2d");

    if (!ctx) return null;

    ctx.fillStyle = "#ffffff";

    ctx.fillRect(
      0,
      0,
      A4_WIDTH,
      A4_HEIGHT
    );

    const availableWidth =
      A4_WIDTH - MARGIN * 2;

    const scale =
      availableWidth / canvas.width;

    const drawWidth =
      canvas.width * scale;

    const drawHeight =
      canvas.height * scale;

    const x =
      (A4_WIDTH - drawWidth) / 2;

    const y = MARGIN;

    ctx.drawImage(
      canvas,
      x,
      y,
      drawWidth,
      drawHeight
    );

    return await new Promise<Blob | null>(
      (resolve) => {
        outputCanvas.toBlob(
          (blob) => resolve(blob),
          "image/png",
          1
        );
      }
    );
  } finally {
    document.body.removeChild(clone);
  }
};

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================
  const download = async () => {
    setBusy(true);

    try {
      const blob = await generateA4Image();

      if (!blob) return;

      const imageUrl = URL.createObjectURL(blob);

      const pdf = new jsPDF("p", "mm", "a4");

      pdf.addImage(
        imageUrl,
        "PNG",
        0,
        0,
        210,
        297
      );

      pdf.save(`${filename}.pdf`);

      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      alert("Failed to generate PDF");
    } finally {
      setBusy(false);
    }
  };

  // =========================================================
  // SAVE IMAGE
  // =========================================================
  const save = async () => {
    setBusy(true);

    try {
      const blob = await generateA4Image();

      if (!blob) return;

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.download = `${filename}.png`;
      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to save image:", error);
      alert("Failed to save image");
    } finally {
      setBusy(false);
    }
  };

  // =========================================================
  // SHARE IMAGE
  // =========================================================
  const share = async () => {
    setBusy(true);

    try {
      const blob = await generateA4Image();

      if (!blob) return;

      const file = new File(
        [blob],
        `${filename}.png`,
        {
          type: "image/png",
        }
      );

      if (
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {
        await navigator.share({
          files: [file],
          title: filename,
        });
      } else {
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");

        link.download = `${filename}.png`;
        link.href = url;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Failed to share:", error);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-0 flex w-full items-center justify-center gap-2">
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