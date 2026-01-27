import { useEffect, useRef, useState } from "react";
import { X, Search as SearchIcon, Loader2 } from "lucide-react";
import type {
  UpdatePatientRequest,
  PatientDetailsDto,
} from "@store/patient/patienttype";
import { updatePatient, getPatientDetails } from "@api/patient";
import Select from "@components/common/Select/Select";
import Input from "@components/common/Input/Input";
import clsx from "clsx";
import { searchAllergies } from "@api/catalogs";

/* Debounce */
function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

interface UpdatePatientModalProps {
  patient: PatientDetailsDto;
  onClose: () => void;
  onSave: (updated: PatientDetailsDto) => void;
}

export default function UpdatePatientModal({
  patient,
  onClose,
  onSave,
}: UpdatePatientModalProps) {
  const [form, setForm] = useState({
    fullName: patient.fullName,
    dob: patient.dob ? patient.dob.split("T")[0] : "", // ISO → yyyy-mm-dd
    gender: patient.gender,
    phone: patient.phone,
    email: patient.email ?? "",
    address: patient.address ?? "",
    // 👇 Allergies as string[]
    allergies: Array.isArray(patient.allergies)
      ? patient.allergies
          .map((s) => (s ?? "").toString().trim())
          .filter(Boolean)
      : [],
    newAllergy: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState("");

  // Allergy search state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);

  const debouncedAllergyQuery = useDebouncedValue(form.newAllergy, 250);
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setHighlightIndex(-1);
      }
    };
    window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, []);

  // Search allergies as user types
  useEffect(() => {
    const q = debouncedAllergyQuery.trim();

    if (q.length === 0) {
      setSuggestions([]);
      setSuggestError(null);
      setDropdownOpen(false);
      setHighlightIndex(-1);
      abortRef.current?.abort();
      return;
    }

    // Cancel previous search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const run = async () => {
      setLoadingSuggestions(true);
      setSuggestError(null);
      try {
        // You can set minChars to 2 if desired; backend has no min limit per your note.
        const results = await searchAllergies(q, {
          signal: controller.signal,
          minChars: 1,
        });

        // Case-insensitive set of already selected
        const selectedSet = new Set(
          form.allergies.map((a) => (a ?? "").toString().toLowerCase()),
        );

        // Normalize and filter out selected
        const normalized = results
          .map((s) => (s ?? "").toString().trim())
          .filter(Boolean);

        const filtered = normalized.filter(
          (s) => !selectedSet.has(s.toLowerCase()),
        );

        setSuggestions(filtered);
        setDropdownOpen(true);
        setHighlightIndex(filtered.length ? 0 : -1);
      } catch (err: any) {
        if (err?.name === "AbortError" || err?.code === "ERR_CANCELED") return;
        console.error("Allergy search failed:", err);
        setSuggestError(err?.message || "Failed to search allergies");
        setSuggestions([]);
        setDropdownOpen(true);
        setHighlightIndex(-1);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    run();

    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedAllergyQuery]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addAllergy = (value: string) => {
    const v = (value ?? "").toString().trim();
    if (!v) return;
    setForm((prev) => {
      const exists = prev.allergies.some(
        (a) => (a ?? "").toString().toLowerCase() === v.toLowerCase(),
      );
      if (exists) return prev;
      return { ...prev, allergies: [...prev.allergies, v], newAllergy: "" };
    });
    setSuggestions([]);
    setDropdownOpen(false);
    setHighlightIndex(-1);
    inputRef.current?.focus();
  };

  const removeAllergy = (value: string) => {
    setForm((prev) => ({
      ...prev,
      allergies: prev.allergies.filter(
        (a) => a.toLowerCase() !== value.toLowerCase(),
      ),
    }));
  };

  const handleSave = async () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.fullName) newErrors.fullName = "Full Name is required";
    if (!form.dob) newErrors.dob = "Date of Birth is required";
    if (!form.phone) newErrors.phone = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError("Please fix the errors below before saving.");
      return;
    }

    const request: UpdatePatientRequest = {
      fullName: form.fullName,
      dob: new Date(form.dob).toISOString(),
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      address: form.address,
      // 👇 Send allergies as string[]
      allergies: form.allergies,
    };

    try {
      await updatePatient(patient.id, request);
      const updated = await getPatientDetails(patient.id);
      onSave(updated);
      onClose();
    } catch (err) {
      console.error("Failed to update patient", err);
      setFormError("Error updating patient");
    }
  };

  const highlight = (label: string, q: string) => {
    const L = (label ?? "").toString();
    const Q = (q ?? "").toString();
    const idx = L.toLowerCase().indexOf(Q.toLowerCase());
    if (idx < 0) return L;
    return (
      <>
        {L.slice(0, idx)}
        <mark className="bg-yellow-100">{L.slice(idx, idx + Q.length)}</mark>
        {L.slice(idx + Q.length)}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Update Patient</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-800"
          >
            <X />
          </button>
        </div>

        {/* Global Alert Bar */}
        {formError && (
          <div className="bg-red-100 text-red-700 px-6 py-3">{formError}</div>
        )}

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={form.fullName}
              onChange={(v) => updateField("fullName", v)}
              error={errors.fullName}
            />
            <Input
              label="Date of Birth *"
              type="date"
              value={form.dob}
              onChange={(v) => updateField("dob", v)}
              error={errors.dob}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Gender"
              value={form.gender}
              onChange={(v) => updateField("gender", v)}
              options={["Male", "Female", "Other"]}
            />
            <Input
              label="Phone *"
              value={form.phone}
              onChange={(v) => updateField("phone", v)}
              error={errors.phone}
            />
          </div>

          <Input
            label="Email"
            value={form.email}
            onChange={(v) => updateField("email", v)}
          />
          <Input
            label="Address"
            value={form.address}
            onChange={(v) => updateField("address", v)}
          />

          {/* Allergies (string[] with async suggestions) */}
          <div ref={wrapperRef}>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Allergies
            </label>

            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <SearchIcon
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    ref={inputRef}
                    value={form.newAllergy}
                    onChange={(e) => updateField("newAllergy", e.target.value)}
                    onFocus={() => {
                      if (form.newAllergy.trim()) setDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (!dropdownOpen) return;

                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setHighlightIndex((i) =>
                          Math.min(i + 1, suggestions.length - 1),
                        );
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setHighlightIndex((i) => Math.max(i - 1, 0));
                      } else if (e.key === "Enter") {
                        e.preventDefault();
                        if (
                          highlightIndex >= 0 &&
                          highlightIndex < suggestions.length
                        ) {
                          addAllergy(suggestions[highlightIndex]);
                        }
                      } else if (e.key === "Escape") {
                        setDropdownOpen(false);
                        setHighlightIndex(-1);
                      }
                    }}
                    placeholder="Type to search allergy catalog (e.g., Aspirin, Penicillin)…"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 pl-9 pr-3 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* Dropdown */}
              {dropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-xl border bg-white shadow-lg max-h-64 overflow-auto">
                  {loadingSuggestions && (
                    <div className="flex items-center gap-2 px-3 py-2 text-gray-500">
                      <Loader2 className="animate-spin" size={16} /> Searching…
                    </div>
                  )}

                  {!loadingSuggestions && suggestError && (
                    <div className="px-3 py-2 text-red-600 text-sm">
                      {suggestError}
                    </div>
                  )}

                  {!loadingSuggestions &&
                    !suggestError &&
                    suggestions.length === 0 && (
                      <div className="px-3 py-2 text-gray-500 text-sm">
                        No matches. Press Enter to add “{form.newAllergy.trim()}
                        ”.
                      </div>
                    )}

                  {!loadingSuggestions &&
                    !suggestError &&
                    suggestions.map((s, idx) => (
                      <button
                        key={`${s}-${idx}`}
                        type="button"
                        onMouseEnter={() => setHighlightIndex(idx)}
                        onClick={() => addAllergy(s)}
                        className={clsx(
                          "w-full text-left px-3 py-2 hover:bg-gray-50",
                          idx === highlightIndex && "bg-blue-50",
                        )}
                      >
                        <div className="font-medium text-gray-900">
                          {highlight(s, form.newAllergy)}
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Chips */}
            <div className="flex flex-wrap gap-2 mt-3">
              {form.allergies.map((a) => (
                <span
                  key={a}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg flex items-center gap-1"
                  title={a}
                >
                  {a}
                  <button
                    type="button"
                    onClick={() => removeAllergy(a)}
                    aria-label={`Remove ${a}`}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-teal-500 text-white hover:from-blue-700 hover:to-teal-600"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
