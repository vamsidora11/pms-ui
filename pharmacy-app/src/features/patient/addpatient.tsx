import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { CreatePatientRequest } from "@store/patient/patienttype";
import Input from "@components/common/Input/Input";
import Select from "@components/common/Select/Select";

interface AddPatientModalProps {
  onClose: () => void;
  onSave: (request: CreatePatientRequest) => void;
}

export default function AddPatientModal({
  onClose,
  onSave,
}: AddPatientModalProps) {
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    phone: "",
    email: "",
    address: "",
    allergies: [] as string[],
    newAllergy: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [formError, setFormError] = useState("");

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

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" })); // clear error when user types
  };

  const handleSave = () => {
    const newErrors: { [key: string]: string } = {};
    if (!form.fullName) newErrors.fullName = "Full Name is required";
    if (!form.dob) newErrors.dob = "Date of Birth is required";
    if (!form.phone) newErrors.phone = "Phone number is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setFormError("Please fix the errors below before saving.");
      return;
    }

    const isoDob = new Date(form.dob).toISOString();
    const request: CreatePatientRequest = {
      fullName: form.fullName,
      dob: isoDob,
      gender: form.gender,
      phone: form.phone,
      email: form.email,
      address: form.address,
      allergies: form.allergies.map((a) => ({ code: a, displayName: a })),
    };

    onSave(request);
    onClose();
    setForm({
      fullName: "",
      dob: "",
      gender: "Male",
      phone: "",
      email: "",
      address: "",
      allergies: [],
      newAllergy: "",
    });
    setErrors({});
    setFormError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add New Patient</h3>
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

          {/* Allergies */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">
              Allergies
            </label>
            <div className="flex gap-2">
              <input
                value={form.newAllergy}
                onChange={(e) => updateField("newAllergy", e.target.value)}
                placeholder="Add allergy"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => {
                  if (
                    form.newAllergy &&
                    !form.allergies.includes(form.newAllergy)
                  ) {
                    setForm((prev) => ({
                      ...prev,
                      allergies: [...prev.allergies, prev.newAllergy],
                      newAllergy: "",
                    }));
                  }
                }}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            {/* Show added allergies */}
            <div className="flex flex-wrap gap-2 mt-3">
              {form.allergies.map((a) => (
                <span
                  key={a}
                  className="px-3 py-1 bg-red-100 text-red-700 rounded-lg flex items-center gap-1"
                >
                  {a}
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        allergies: prev.allergies.filter((x) => x !== a),
                      }))
                    }
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
            Add Patient
          </button>
        </div>
      </div>
    </div>
  );
}