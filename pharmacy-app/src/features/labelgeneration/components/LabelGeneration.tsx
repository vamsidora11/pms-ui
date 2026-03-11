import { useCallback, useState } from "react";
import { LabelQueueList } from "@labels/components/LabelQueueList";
import { LabelPreview } from "@labels/components/LabelPreview";
import { useLabelQueue } from "@labels/hooks/useLabelQueue";
import { useLabelPrescriptionDetails } from "@labels/hooks/useLabelPrescriptionDetails";
import { toast } from "@components/common/Toast/toastService";

export default function LabelGenerationPage() {
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const { prescriptions, loading: queueLoading, error: queueError } = useLabelQueue();

  const {
    selected,
    loading: detailsLoading,
    error: detailsError,
    selectById,
  } = useLabelPrescriptionDetails();

  const handlePrint = useCallback(() => {
    const labels = document.querySelectorAll(".print-label");

    if (labels.length === 0) {
      toast.warning("No Labels Found", "Please select a prescription first.");
      return;
    }

    setIsPrinting(true);

    try {
      const printWindow = window.open("", "_blank", "width=800,height=600");

      if (!printWindow) {
        toast.error("Popup Blocked", "Please allow popups to print labels.");
        setIsPrinting(false);
        return;
      }

      const printContent = Array.from(labels)
        .map((label) => label.outerHTML)
        .join("");

      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Medication Labels - ${selected?.patientName || "Patient"}</title>
            <meta charset="UTF-8">
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }

              body {
                margin: 0;
                padding: 1.5cm;
                font-family: monospace;
                background: white;
              }

              .labels-container {
                display: flex;
                flex-wrap: wrap;
                gap: 1cm;
                justify-content: flex-start;
                align-items: flex-start;
              }

              .print-label {
                width: 10cm !important;
                max-width: 10cm !important;
                flex-shrink: 0;
                border: 2px solid #000 !important;
                border-radius: 8px;
                padding: 10px !important;
                background: white;
                margin: 0 !important;
                font-size: 9px !important;
                line-height: 1.3 !important;
                box-sizing: border-box;
                page-break-inside: avoid;
              }

              .print-label .font-bold,
              .print-label .font-semibold { font-weight: bold; }

              .print-label > div:first-child { font-size: 11px !important; }
              .print-label > div:first-child > div:first-child { font-size: 13px !important; font-weight: bold; }

              .print-label .border-b-2 { border-bottom: 2px solid #333 !important; padding-bottom: 8px !important; margin-bottom: 8px !important; }
              .print-label .border-t-2 { border-top: 2px solid #333 !important; padding-top: 8px !important; margin-top: 8px !important; }
              .print-label .border-t { border-top: 1px solid #ccc !important; }
              .print-label .border-gray-300 { border-color: #333 !important; }

              .print-label .grid { display: grid; }
              .print-label .grid-cols-2 { grid-template-columns: repeat(2, 1fr); gap: 8px !important; }

              .print-label .text-xs { font-size: 7px !important; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 2px; }
              .print-label .text-sm { font-size: 8px !important; }
              .print-label .font-semibold { font-weight: 600; font-size: 10px !important; }

              .print-label .bg-yellow-50 { background: #fffbeb !important; border: 2px solid #f59e0b !important; border-radius: 4px; padding: 6px !important; margin-top: 4px; }

              .print-label .mb-2 { margin-bottom: 4px !important; }
              .print-label .mb-4 { margin-bottom: 8px !important; }
              .print-label .mt-4 { margin-top: 8px !important; }
              .print-label .pt-4 { padding-top: 8px !important; }
              .print-label .pb-4 { padding-bottom: 8px !important; }
              .print-label .p-6 { padding: 10px !important; }
              .print-label .p-3 { padding: 6px !important; }

              .print-label .space-y-1 > * + * { margin-top: 2px !important; }

              .print-label ul { list-style: none; padding-left: 0; font-size: 8px !important; }
              .print-label li { line-height: 1.4; }
              .print-label .text-gray-500 { color: #666 !important; }

              @page { margin: 1.5cm; size: A4 portrait; }

              @media print {
                body { padding: 0; }
                .labels-container { gap: 1cm; }
                .print-label { box-shadow: none !important; }
              }

              @media screen {
                body { background: #f5f5f5; }
                .print-label { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              }
            </style>
          </head>
          <body>
            <div class="labels-container">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.focus();
                setTimeout(function() { window.print(); }, 250);
              };
              window.onafterprint = function() { window.close(); };
            </script>
          </body>
        </html>
      `);

      printWindow.document.close();
      setTimeout(() => setIsPrinting(false), 1000);
    } catch (error) {
      console.error("[LabelGenerationPage] Print error:", error);
      toast.error("Print Failed", "An error occurred while preparing labels for printing.");
      setIsPrinting(false);
    }
  }, [selected]);

  const handleDownload = useCallback(async () => {
    if (!selected) {
      toast.warning("No Prescription Selected", "Please select a prescription first.");
      return;
    }

    const labels = document.querySelectorAll(".print-label");

    if (labels.length === 0) {
      toast.warning("No Labels Found", "No labels available to download.");
      return;
    }

    setIsDownloading(true);

    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const labelWidth = 100;
      const gap = 10;

      let xPos = margin;
      let yPos = margin;
      let isFirstLabel = true;

      for (let i = 0; i < labels.length; i++) {
        const label = labels[i] as HTMLElement;

        const canvas = await html2canvas(label, {
          scale: 3,
          backgroundColor: "#ffffff",
          logging: false,
          useCORS: true,
        });

        const imgData = canvas.toDataURL("image/png");
        const imgWidth = labelWidth;
        const imgHeight = (canvas.height * labelWidth) / canvas.width;

        if (yPos + imgHeight > pageHeight - margin) {
          pdf.addPage();
          xPos = margin;
          yPos = margin;
          isFirstLabel = true;
        }

        if (!isFirstLabel) {
          pdf.addPage();
          xPos = margin;
          yPos = margin;
        }

        pdf.addImage(imgData, "PNG", xPos, yPos, imgWidth, imgHeight);

        if (xPos + labelWidth + gap + labelWidth <= pageWidth - margin) {
          xPos += labelWidth + gap;
        } else {
          xPos = margin;
          yPos += imgHeight + gap;
        }

        isFirstLabel = false;
      }

      const patientName = selected.patientName.replace(/\s+/g, "_");
      const date = new Date().toISOString().split("T")[0];
      const filename = `Medication_Labels_${patientName}_${date}.pdf`;

      pdf.save(filename);
      toast.success("Download Complete", `Labels saved as ${filename}`);
      setIsDownloading(false);
    } catch (error) {
      console.error("[LabelGenerationPage] Download error:", error);
      toast.error("Download Failed", "An error occurred while generating the PDF. Please try again.");
      setIsDownloading(false);
    }
  }, [selected]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Label Generation</h1>
        <p className="text-gray-500">Generate and print medication labels</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left */}
        <LabelQueueList
          prescriptions={prescriptions}
          loading={queueLoading}
          error={queueError}
          selectedId={selected?.id ?? null}
          onSelect={selectById}
        />

        {/* Right */}
        <LabelPreview
          selected={selected}
          loading={detailsLoading}
          error={detailsError}
          onPrint={handlePrint}
          onDownload={handleDownload}
          isPrinting={isPrinting}
          isDownloading={isDownloading}
        />
      </div>
    </div>
  );
}