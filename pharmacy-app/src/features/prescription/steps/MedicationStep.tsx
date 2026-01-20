import { useState } from "react";
import { Plus, X, Search } from "lucide-react";
import { searchInventory } from "@api/inventory.api";
import type {
  MedicationDraft,
  InventorySearchItem,
} from "../models";

interface Props {
  medications: MedicationDraft[];
  onChange: (medications: MedicationDraft[]) => void;
}

/**
 * UI-only medication row
 */
type MedicationRow = MedicationDraft & {
  uid: string;
  isSearching: boolean;
};

const createRow = (draft?: MedicationDraft): MedicationRow => ({
  uid: crypto.randomUUID(),
  drugId: draft?.drugId,
  drugName: draft?.drugName ?? "",
  strength: draft?.strength ?? "",
  frequency: draft?.frequency ?? "BID",
  quantity: draft?.quantity ?? 1,
  durationDays: draft?.durationDays ?? 7,
  refills: draft?.refills ?? 0,
  instructions: draft?.instructions ?? "",
  isSearching: !draft?.drugName,
});

const FREQUENCIES = [
  { value: "OD", label: "Once Daily (OD)" },
  { value: "BID", label: "Twice Daily (BID)" },
  { value: "TID", label: "Three Times Daily (TID)" },
  { value: "QID", label: "Four Times Daily (QID)" },
  { value: "Q4H", label: "Every 4 Hours" },
  { value: "Q6H", label: "Every 6 Hours" },
  { value: "Q8H", label: "Every 8 Hours" },
  { value: "Q12H", label: "Every 12 Hours" },
  { value: "PRN", label: "As Needed (PRN)" },
  { value: "STAT", label: "Immediately (STAT)" },
];

export default function MedicationStep({ medications, onChange }: Props) {
  const [rows, setRows] = useState<MedicationRow[]>(
    medications.length > 0
      ? medications.map(createRow)
      : [createRow()]
  );

  const [searchText, setSearchText] = useState<Record<string, string>>({});
  const [results, setResults] = useState<
    Record<string, InventorySearchItem[]>
  >({});

  // ---------------- helpers ----------------

  const commit = (updated: MedicationRow[]) => {
    setRows(updated);
    onChange(
      updated.map(({ uid, isSearching, ...rest }) => rest)
    );
  };

  const addRow = () => commit([...rows, createRow()]);

  const removeRow = (uid: string) => {
    if (rows.length === 1) return;
    commit(rows.filter((r) => r.uid !== uid));
  };

  const updateField = (
    uid: string,
    field: keyof MedicationDraft,
    value: string | number
  ) => {
    commit(
      rows.map((r) =>
        r.uid === uid ? { ...r, [field]: value } : r
      )
    );
  };

  const handleSearch = async (uid: string, value: string) => {
    setSearchText((s) => ({ ...s, [uid]: value }));

    if (!value.trim()) {
      setResults((r) => ({ ...r, [uid]: [] }));
      return;
    }

   
  const data = await searchInventory(value);

  if (!data) {
    setResults((r) => ({ ...r, [uid]: [] }));
    return;
  }

  setResults((r) => ({ ...r, [uid]: data }));
};





  const selectDrug = (uid: string, item: InventorySearchItem) => {
    commit(
      rows.map((r) =>
        r.uid === uid
          ? {
              ...r,
              drugId: item.inventoryId,
              drugName: item.medicineName,
              strength: item.dosage,
              isSearching: false,
            }
          : r
      )
    );

    setResults((r) => ({ ...r, [uid]: [] }));
    setSearchText((s) => ({ ...s, [uid]: "" }));
  };

  // ---------------- render ----------------

  return (
    <div className="bg-white rounded-2xl border shadow-sm">
      {/* Header */}
      <div className="p-6 border-b flex justify-between items-center">
        <div>
          <h2 className="text-gray-900">Medications</h2>
          <p className="text-gray-500 text-sm">
            Search and add medications from inventory
          </p>
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
          <div
            key={row.uid}
            className="border rounded-xl p-6 bg-gray-50 relative"
          >
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

            {/* Drug search / selected field */}
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
                      : `${row.drugName} ${row.strength}`
                  }
                  readOnly={!row.isSearching}
                  onChange={(e) =>
                    handleSearch(row.uid, e.target.value)
                  }
                  onClick={() => {
                    if (!row.isSearching) {
                      setRows((prev) =>
                        prev.map((r) =>
                          r.uid === row.uid
                            ? { ...r, isSearching: true }
                            : r
                        )
                      );
                    }
                  }}
                  className={`w-full ${
                    row.isSearching ? "pl-10" : "pl-4"
                  } pr-4 py-2 border rounded-lg ${
                    row.isSearching
                      ? "bg-white"
                      : "bg-gray-100 cursor-pointer"
                  }`}
                  placeholder="Search inventory..."
                />
              </div>

              {/* Dropdown */}
              {row.isSearching &&
                (results[row.uid]?.length ?? 0) > 0 && (
                  <div className="absolute z-30 w-full bg-white border rounded-lg shadow mt-1 max-h-56 overflow-y-auto">
                    {results[row.uid].map((item) => (
                      <button
                        key={item.inventoryId}
                        onClick={() =>
                          selectDrug(row.uid, item)
                        }
                        className="block w-full text-left px-4 py-3 hover:bg-gray-50"
                      >
                        <div className="font-medium">
                          {item.medicineName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {item.dosage} • Stock:{" "}
                          {item.availableStock}
                        </div>
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
                  onChange={(e) =>
                    updateField(row.uid, "frequency", e.target.value)
                  }
                  className="w-full border px-3 py-2 rounded-lg"
                >
                  {FREQUENCIES.map((freq) => (
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
                  onChange={(e) =>
                    updateField(
                      row.uid,
                      "quantity",
                      Number(e.target.value)
                    )
                  }
                  className="w-full border px-3 py-2 rounded-lg"
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
                    updateField(
                      row.uid,
                      "durationDays",
                      Number(e.target.value)
                    )
                  }
                  className="w-full border px-3 py-2 rounded-lg"
                  placeholder="e.g., 7, 14, 30"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm">Refills</label>
                <input
                  type="number"
                  min={0}
                  value={row.refills}
                  onChange={(e) =>
                    updateField(
                      row.uid,
                      "refills",
                      Number(e.target.value)
                    )
                  }
                  className="w-full border px-3 py-2 rounded-lg"
                />
              </div>
            </div>

            {/* Instructions */}
            <div>
              <label className="block mb-2 text-sm">Instructions</label>
              <input
                placeholder="e.g., Take after meals"
                value={row.instructions}
                onChange={(e) =>
                  updateField(
                    row.uid,
                    "instructions",
                    e.target.value
                  )
                }
                className="w-full border px-3 py-2 rounded-lg"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}