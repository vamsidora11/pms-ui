import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "../../components/common/SectionHeader/SectionHeader";
import Button from "../../components/common/Button/Button";
import Input from "../../components/common/Input/Input";
import Textarea from "../../components/common/TextArea/TextArea";

type Medicine = {
  id: string;
  name: string;
  strength: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
};

export default function ManualPrescriptionView() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    patientName: "",
    patientId: "",
    age: "",
    gender: "",
    phone: "",
    date: "2025-12-18",
    doctorId: "",
    doctorName: "",
    clinic: "",
    doctorNotes: "",
    disease: "",
    symptoms: "",
  });

  const [allergies, setAllergies] = useState<string[]>(["Penicillin"]);
  const [newAllergy, setNewAllergy] = useState("");

  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: "1",
      name: "",
      strength: "",
      frequency: "",
      duration: "",
      quantity: "",
      instructions: "",
    },
  ]);

  const handleChange =
    (field: keyof typeof form) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement
      >
    ) => {
      setForm({ ...form, [field]: e.target.value });
    };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setAllergies([...allergies, newAllergy.trim()]);
      setNewAllergy("");
    }
  };

  const removeAllergy = (a: string) => {
    setAllergies(allergies.filter((x) => x !== a));
  };

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        id: Date.now().toString(),
        name: "",
        strength: "",
        frequency: "",
        duration: "",
        quantity: "",
        instructions: "",
      },
    ]);
  };

  const updateMedicine = (
    id: string,
    field: keyof Medicine,
    value: string
  ) => {
    setMedicines(
      medicines.map((m) =>
        m.id === id ? { ...m, [field]: value } : m
      )
    );
  };

  return (
    <div className="max-w-6xl space-y-8">
      <SectionHeader
        title="Manual Prescription Entry"
        subtitle="Enter prescription details for a new patient order"
      />

      {/* ================= PATIENT DETAILS ================= */}
      <div className="bg-white border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            Patient Details
          </h2>
          <p className="text-sm text-gray-500">
            Enter patient information
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Input
            label="Patient Name"
            placeholder="Enter patient name"
            value={form.patientName}
            onChange={handleChange("patientName")}
            className="bg-gray-50"
          />

          <Input
            label="Patient ID"
            placeholder="Enter patient ID"
            value={form.patientId}
            onChange={handleChange("patientId")}
            className="bg-gray-50"
          />

          <Input
            label="Age"
            placeholder="Enter age"
            type="number"
            value={form.age}
            onChange={handleChange("age")}
            className="bg-gray-50"
          />

          <Input
            label="Gender"
            placeholder="Select gender"
            value={form.gender}
            onChange={handleChange("gender")}
            className="bg-gray-50"
          />

          <Input
            label="Phone Number"
            type="tel"
            placeholder="Enter phone number"
            value={form.phone}
            onChange={handleChange("phone")}
            className="bg-gray-50"
          />

          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={handleChange("date")}
            className="bg-gray-50"
          />
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Allergies
          </label>

          <div className="flex flex-wrap gap-2 items-center border rounded-lg p-3 bg-gray-50">
            {allergies.map((a) => (
              <span
                key={a}
                className="flex items-center gap-2 bg-white border rounded-full px-3 py-1 text-sm"
              >
                {a}
                <button
                  onClick={() => removeAllergy(a)}
                  className="text-gray-500 hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}

            <input
              value={newAllergy}
              onChange={(e) =>
                setNewAllergy(e.target.value)
              }
              onKeyDown={(e) =>
                e.key === "Enter" && addAllergy()
              }
              placeholder="+ Add Allergy"
              className="bg-transparent outline-none text-sm px-2"
            />
          </div>
        </div>
      </div>

      {/* ================= DOCTOR INFORMATION ================= */}
      <div className="bg-white border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            Doctor Information
          </h2>
          <p className="text-sm text-gray-500">
            Enter prescribing doctor details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Doctor ID"
            placeholder="Enter doctor ID"
            value={form.doctorId}
            onChange={handleChange("doctorId")}
            className="bg-gray-50"
          />

          <Input
            label="Doctor Name"
            placeholder="Enter doctor name"
            value={form.doctorName}
            onChange={handleChange("doctorName")}
            className="bg-gray-50"
          />
        </div>

        <Input
          label="Clinic / Hospital Name"
          placeholder="Enter clinic or hospital name"
          value={form.clinic}
          onChange={handleChange("clinic")}
          className="bg-gray-50"
        />

        <Textarea
          placeholder="Any additional notes from the doctor"
          value={form.doctorNotes}
          onChange={handleChange("doctorNotes")}
          className="bg-gray-50 min-h-[100px]"
        />
      </div>

      {/* ================= DIAGNOSIS ================= */}
      <div className="bg-white border rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold">
            Diagnosis
          </h2>
          <p className="text-sm text-gray-500">
            Patient diagnosis and symptoms
          </p>
        </div>

        <Input
          label="Disease Description"
          placeholder="Brief description of the disease"
          value={form.disease}
          onChange={handleChange("disease")}
          className="bg-gray-50"
        />

        <Textarea
          placeholder="List patient symptoms"
          value={form.symptoms}
          onChange={handleChange("symptoms")}
          className="bg-gray-50 min-h-[100px]"
        />
      </div>

      {/* ================= MEDICINES ================= */}
      <div className="bg-white border rounded-xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">
              Medicines
            </h2>
            <p className="text-sm text-gray-500">
              Add prescribed medications
            </p>
          </div>

          <Button variant="secondary" onClick={addMedicine}>
            + Add Medicine
          </Button>
        </div>

        {medicines.map((m, index) => (
          <div
            key={m.id}
            className="border rounded-xl p-6 space-y-4"
          >
            <span className="text-sm font-medium">
              Medicine {index + 1}
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Input
                label="Medicine Name"
                placeholder="Search medicine"
                value={m.name}
                onChange={(e) =>
                  updateMedicine(
                    m.id,
                    "name",
                    e.target.value
                  )
                }
                className="bg-gray-50"
              />

              <Input
                label="Strength / Dosage"
                placeholder="e.g., 500mg"
                value={m.strength}
                onChange={(e) =>
                  updateMedicine(
                    m.id,
                    "strength",
                    e.target.value
                  )
                }
                className="bg-gray-50"
              />

              <Input
                label="Frequency"
                placeholder="Select frequency"
                value={m.frequency}
                onChange={(e) =>
                  updateMedicine(
                    m.id,
                    "frequency",
                    e.target.value
                  )
                }
                className="bg-gray-50"
              />

              <Input
                label="Duration"
                placeholder="e.g., 5 days"
                value={m.duration}
                onChange={(e) =>
                  updateMedicine(
                    m.id,
                    "duration",
                    e.target.value
                  )
                }
                className="bg-gray-50"
              />

              <Input
                label="Quantity"
                placeholder="Total quantity"
                value={m.quantity}
                onChange={(e) =>
                  updateMedicine(
                    m.id,
                    "quantity",
                    e.target.value
                  )
                }
                className="bg-gray-50"
              />

              <Input
                label="Special Instructions"
                placeholder="Select instruction"
                value={m.instructions}
                onChange={(e) =>
                  updateMedicine(
                    m.id,
                    "instructions",
                    e.target.value
                  )
                }
                className="bg-gray-50"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ================= ACTIONS ================= */}
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <Button variant="secondary">Save Draft</Button>
          <Button variant="secondary">Clear Form</Button>
        </div>

        <Button
          className="bg-gradient-to-r from-blue-600 to-green-600 text-white"
          onClick={() =>
            navigate("/pharmacist/validation")
          }
        >
          Proceed to Validation →
        </Button>
      </div>
    </div>
  );
}
