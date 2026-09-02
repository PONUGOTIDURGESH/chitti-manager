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
  // GENERATE A4 IMAGE
  // =========================================================
  const generateA4Image = async (): Promise<Blob | null> => {
    if (!targetRef.current) return null;

    const original = targetRef.current;

    // ---------------------------------------------------------
    // Clone the statement so mobile preview transforms
    // (scale / translate / zoom / pan) do NOT affect export.
    // ---------------------------------------------------------
    const clone = original.cloneNode(true) as HTMLElement;

    const exportWidth = 794;
    const exportHeight = 1123;

    clone.style.transform = "none";
    clone.style.transformOrigin = "top left";
    clone.style.width = `${exportWidth}px`;
    clone.style.minWidth = `${exportWidth}px`;
    clone.style.height = "auto";
    clone.style.minHeight = `${exportHeight}px`;

    clone.style.position = "absolute";
    clone.style.left = "-10000px";
    clone.style.top = "0";
    clone.style.margin = "0";
    clone.style.padding = original.style.padding;
    clone.style.overflow = "visible";

    document.body.appendChild(clone);

    try {
      // -------------------------------------------------------
      // Render clean, unscaled A4 statement
      // -------------------------------------------------------
      const canvas = await html2canvas(clone, {
        scale: 3,
        useCORS: true,
        backgroundColor: "#ffffff",
        width: exportWidth,
        windowWidth: exportWidth,
        height: Math.max(
          exportHeight,
          clone.scrollHeight
        ),
        windowHeight: Math.max(
          exportHeight,
          clone.scrollHeight
        ),
        scrollX: 0,
        scrollY: 0,
      });

      // -------------------------------------------------------
      // Final A4 image: 2480 × 3508
      // -------------------------------------------------------
      const A4_WIDTH = 2480;
      const A4_HEIGHT = 3508;
      const margin = 100;

      const outputCanvas = document.createElement("canvas");

      outputCanvas.width = A4_WIDTH;
      outputCanvas.height = A4_HEIGHT;

      const ctx = outputCanvas.getContext("2d");

      if (!ctx) return null;

      // White A4 background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(
        0,
        0,
        A4_WIDTH,
        A4_HEIGHT
      );

      // -------------------------------------------------------
      // Fit statement nicely inside A4
      // -------------------------------------------------------
      const maxWidth = A4_WIDTH - margin * 2;
      const maxHeight = A4_HEIGHT - margin * 2;

      const fitScale = Math.min(
        maxWidth / canvas.width,
        maxHeight / canvas.height
      );

      const drawWidth =
        canvas.width * fitScale;

      const drawHeight =
        canvas.height * fitScale;

      const x =
        (A4_WIDTH - drawWidth) / 2;

      const y = margin;

      ctx.drawImage(
        canvas,
        x,
        y,
        drawWidth,
        drawHeight
      );

      // -------------------------------------------------------
      // Convert to PNG
      // -------------------------------------------------------
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
      // Remove temporary export clone
      document.body.removeChild(clone);
    }
  };

  // =========================================================
  // BLOB → DATA URL
  // =========================================================
  const blobToDataUrl = (
    blob: Blob
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onloadend = () => {
        resolve(reader.result as string);
      };

      reader.onerror = reject;

      reader.readAsDataURL(blob);
    });
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================
  const download = async () => {
    setBusy(true);

    try {
      const blob = await generateA4Image();

      if (!blob) return;

      const dataUrl =
        await blobToDataUrl(blob);

      const pdf = new jsPDF(
        "p",
        "mm",
        "a4"
      );

      pdf.addImage(
        dataUrl,
        "PNG",
        0,
        0,
        210,
        297
      );

      pdf.save(`${filename}.pdf`);
    } catch (error) {
      console.error(
        "Failed to generate PDF:",
        error
      );

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
        "Failed to save image:",
        error
      );

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
      }
    } catch (error) {
      console.error(
        "Failed to share:",
        error
      );
    } finally {
      setBusy(false);
    }
  };

  // =========================================================
  // UI
  // =========================================================
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