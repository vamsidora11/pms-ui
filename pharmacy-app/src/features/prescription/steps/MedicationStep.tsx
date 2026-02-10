import { Plus, X, Search } from "lucide-react";
import type { MedicationDraft, InventorySearchItem } from "../models";
import { FREQUENCY_OPTIONS } from "../models";
import { useMedicationStepState } from "../hooks/useMedicationStepState";
import { searchInventory as defaultSearchInventory } from "@api/inventory";

interface Props {
  medications: MedicationDraft[];
  onChange: (medications: MedicationDraft[]) => void;

  /** DIP-friendly */
  searchFn?: (q: string) => Promise<InventorySearchItem[]>;
  debounceMs?: number;
  minChars?: number;
}

export default function MedicationStep({
  medications,
  onChange,
  searchFn = defaultSearchInventory,
  debounceMs = 250,
  minChars = 2,
}: Props) {
  const {
    rows,
    searchText,
    results,
    loadingByUid,
    setSearchText,
    addRow,
    removeRow,
    updateField,
    startSearchMode,
    selectDrug,
  } = useMedicationStepState({
    medications,
    onChange,
    searchFn,
    debounceMs,
    minChars,
  });

  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h2 className="text-gray-900">Medications</h2>
          <p className="text-gray-500 text-sm">Search and add medications from inventory</p>
        </div>

        <button
          onClick={addRow}
          className="flex items-center gap-2 text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg"
        >
          <Plus size={16} /> Add Medication
        </button>
      </div>

      {/* Rows */}
      <div className="p-6 space-y-4">
        {rows.map((row) => (
          <div key={row.uid} className="border rounded-xl p-6 bg-gray-50 relative ">
            <div className="flex justify-between mb-4">
              <span className="text-gray-900">Medication</span>

              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(row.uid)}
                  className="text-red-600 hover:bg-red-50 p-2 rounded"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Drug search / selected */}
            <div className="relative mb-4">
              <label className="block mb-2 text-sm">
                Drug Name <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                {row.isSearching && (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                )}

                <input
                  value={
                    row.isSearching
                      ? searchText[row.uid] ?? ""
                      : `${row.drugName} ${row.strength}`.trim()
                  }
                  readOnly={!row.isSearching}
                  onChange={(e) =>
                    setSearchText((s) => ({ ...s, [row.uid]: e.target.value }))
                  }
                  onClick={() => {
                    if (!row.isSearching) startSearchMode(row.uid);
                  }}
                  className={`w-full ${row.isSearching ? "pl-10" : "pl-4"} pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    row.isSearching ? "bg-white" : "bg-gray-100 cursor-pointer"
                  }`}
                  placeholder="Search inventory..."
                />
              </div>

              {/* Dropdown */}
              {row.isSearching && (
                <div className="absolute z-30 w-full bg-white border rounded-lg shadow mt-1 max-h-56 overflow-y-auto">
                  {loadingByUid[row.uid] && (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
                  )}

                  {!loadingByUid[row.uid] &&
                    (results[row.uid]?.length ?? 0) === 0 &&
                    (searchText[row.uid] ?? "").trim().length >= minChars && (
                      <div className="px-4 py-3 text-sm text-gray-500">No results</div>
                    )}

                  {(results[row.uid] ?? []).map((item) => (
                    <button
                      key={item.productId}
                      onClick={() => selectDrug(row.uid, item)}
                      className="block w-full text-left px-4 py-3 hover:bg-gray-50"
                    >
                      <div className="font-medium">{item.name}</div>
                      <div className="text-sm text-gray-500">{item.strength}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Frequency and Quantity */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 text-sm">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={row.frequency}
                  onChange={(e) => updateField(row.uid, "frequency", e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {FREQUENCY_OPTIONS.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => updateField(row.uid, "quantity", Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Duration and Refills */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block mb-2 text-sm">
                  Duration (Days) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={row.durationDays}
                  onChange={(e) =>
                    updateField(row.uid, "durationDays", Number(e.target.value))
                  }
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Refills</label>
                <input
                  type="number"
                  min={0}
                  value={row.refills}
                  onChange={(e) => updateField(row.uid, "refills", Number(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block mb-2 text-sm">Instructions</label>
              <input
                placeholder="e.g., Take after meals"
                value={row.instructions}
                onChange={(e) => updateField(row.uid, "instructions", e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}