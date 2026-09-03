import { useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type Props = {
  targetRef: React.RefObject<HTMLElement>;
  filename: string;
};

// =========================================================
// EXPORT SETTINGS
// =========================================================

const EXPORT_WIDTH = 794;

// PDF
const PDF_WIDTH_MM = 210;
const PDF_HEIGHT_MM = 297;
const PDF_MARGIN_MM = 8;

// =========================================================
// COMPONENT
// =========================================================

export default function ShareButtons({
  targetRef,
  filename,
}: Props) {
  const [busy, setBusy] = useState(false);

  // =========================================================
  // CREATE FULL STATEMENT CANVAS
  // =========================================================

  const generateStatementCanvas =
    async (): Promise<HTMLCanvasElement | null> => {
      if (!targetRef.current) return null;

      const original = targetRef.current;

      // Clone the statement so preview styles/zoom are untouched.
      const clone = original.cloneNode(true) as HTMLElement;

      // Remove preview transform/position effects.
      clone.style.transform = "none";
      clone.style.transformOrigin = "top left";

      // Force a stable export width.
      clone.style.width = `${EXPORT_WIDTH}px`;
      clone.style.minWidth = `${EXPORT_WIDTH}px`;
      clone.style.maxWidth = `${EXPORT_WIDTH}px`;

      // IMPORTANT:
      // Do NOT force A4 height.
      // Let the statement use its complete natural height.
      clone.style.height = "auto";
      clone.style.minHeight = "0";
      clone.style.maxHeight = "none";

      clone.style.position = "absolute";
      clone.style.left = "-10000px";
      clone.style.top = "0";
      clone.style.margin = "0";

      // Never clip the statement.
      clone.style.overflow = "visible";

      // Keep the export clean.
      clone.style.boxSizing = "border-box";

      document.body.appendChild(clone);

      // =========================================================
// EXPORT TEXT VISIBILITY FIX
// =========================================================

const liftRows =
  clone.querySelectorAll<HTMLElement>(
    "td.bg-emerald-50"
  );

liftRows.forEach((cell) => {
  cell.style.verticalAlign = "middle";

  const content = cell.querySelector<HTMLElement>("div");

  if (content) {
    content.style.position = "relative";
    content.style.top = "-2px";
    content.style.lineHeight = "1";
    content.style.display = "flex";
    content.style.alignItems = "center";
    content.style.justifyContent = "center";
  }
});

const truncatedElements =
  clone.querySelectorAll<HTMLElement>(".truncate");

truncatedElements.forEach((element) => {
  element.style.overflow = "visible";
  element.style.textOverflow = "clip";
  element.style.whiteSpace = "nowrap";
  element.style.minWidth = "0";
});

const valueElements =
  clone.querySelectorAll<HTMLElement>(
    "span.min-w-0.flex-1"
  );

valueElements.forEach((element) => {
  element.style.overflow = "visible";
  element.style.textOverflow = "clip";
  element.style.whiteSpace = "nowrap";
  element.style.display = "block";
  element.style.flex = "1 1 auto";
});

      try {
        // Force browser layout before measuring.
        await new Promise<void>((resolve) => {
          requestAnimationFrame(() => resolve());
        });

        const fullWidth = clone.scrollWidth;
        const fullHeight = clone.scrollHeight;

        console.log(
          "Statement export size:",
          fullWidth,
          "x",
          fullHeight
        );

        const canvas = await html2canvas(clone, {
          scale: 3,

          useCORS: true,
          allowTaint: true,

          backgroundColor: "#ffffff",

          width: fullWidth,
          height: fullHeight,

          windowWidth: fullWidth,
          windowHeight: fullHeight,

          scrollX: 0,
          scrollY: 0,

          logging: false,
        });

        return canvas;
      } finally {
        document.body.removeChild(clone);
      }
    };

  // =========================================================
  // CANVAS → PNG BLOB
  // =========================================================

  const canvasToBlob = (
    canvas: HTMLCanvasElement
  ): Promise<Blob | null> => {
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/png",
        1
      );
    });
  };

  // =========================================================
  // SAVE FULL STATEMENT IMAGE
  // =========================================================

  const save = async () => {
    setBusy(true);

    try {
      const canvas =
        await generateStatementCanvas();

      if (!canvas) return;

      const blob =
        await canvasToBlob(canvas);

      if (!blob) return;

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.download =
        `${filename}.png`;

      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Failed to save statement:",
        error
      );

      alert(
        "Failed to save statement image"
      );
    } finally {
      setBusy(false);
    }
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const download = async () => {
  setBusy(true);

  try {
    const canvas = await generateStatementCanvas();

    if (!canvas) return;

    const pdf = new jsPDF("p", "mm", "a4");

    const PAGE_WIDTH = 210;
    const MARGIN = 5;

    const availableWidth = PAGE_WIDTH - MARGIN * 2;

    const scale = availableWidth / canvas.width;

    const drawWidth = canvas.width * scale;
    const drawHeight = canvas.height * scale;

    const x = (PAGE_WIDTH - drawWidth) / 2;
    const y = MARGIN;

    pdf.addImage(
      canvas.toDataURL("image/png", 1),
      "PNG",
      x,
      y,
      drawWidth,
      drawHeight
    );

    pdf.save(`${filename}.pdf`);
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    alert("Failed to generate PDF");
  } finally {
    setBusy(false);
  }
};

  // =========================================================
  // SHARE FULL STATEMENT IMAGE
  // =========================================================

  const share = async () => {
    setBusy(true);

    try {
      const canvas =
        await generateStatementCanvas();

      if (!canvas) return;

      const blob =
        await canvasToBlob(canvas);

      if (!blob) return;

      const file =
        new File(
          [blob],
          `${filename}.png`,
          {
            type: "image/png",
          }
        );

      // -------------------------------------------------------
      // Native device sharing
      // -------------------------------------------------------

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

        return;
      }

      // -------------------------------------------------------
      // Fallback → download image
      // -------------------------------------------------------

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.download =
        `${filename}.png`;

      link.href = url;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Failed to share statement:",
        error
      );
    } finally {
      setBusy(false);
    }
  };

  // =========================================================
  // BUTTONS
  // =========================================================

  return (
    <div className="mt-0 flex w-full items-center justify-center gap-2">
      <button
        type="button"
        onClick={share}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Share
      </button>

      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Download PDF
      </button>

      <button
        type="button"
        onClick={save}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Save
      </button>
    </div>
  );
}