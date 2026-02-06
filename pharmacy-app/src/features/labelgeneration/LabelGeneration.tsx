import { useCallback } from "react";
import { LabelQueueList } from "@labels/components/LabelQueueList";
import { LabelPreview } from "@labels/components/LabelPreview";
import { useLabelQueue } from "@labels/hooks/useLabelQueue";
import { useLabelPrescriptionDetails } from "@labels/hooks/useLabelPrescriptionDetails";

export default function LabelGenerationPage() {
  const { prescriptions, loading: queueLoading, error: queueError } = useLabelQueue();

  const {
    selected,
    loading: detailsLoading,
    error: detailsError,
    selectById,
  } = useLabelPrescriptionDetails();

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  // keep download open for future: PDF export, print-to-PDF, etc.
  const handleDownload = useCallback(() => {
    // TODO: implement "download label(s)" - pdf/html/canvas
    // For now do nothing to preserve behavior.
  }, []);

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
        />
      </div>
    </div>
  );
}