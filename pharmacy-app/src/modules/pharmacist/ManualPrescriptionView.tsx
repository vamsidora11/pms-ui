import { useState } from "react";
import SectionHeader from "../../components/common/SectionHeader";
import Button from "../../components/common/Button";
import Input from "../../components/common/Input";

type Medicine = {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
};

type Props = {
  onProceed: () => void;
};

export default function ManualPrescriptionView({ onProceed }: Props) {
 
  const [form, setForm] = useState({
    patientName: "",
    age: "",
    gender: "",
    contact: "",
    patientId: "",
    date: "",
    doctorName: "",
    registrationNumber: "",
    diagnosis: "",
  });

 
  const [medicines, setMedicines] = useState<Medicine[]>([
    {
      id: "1",
      name: "",
      dosage: "",
      frequency: "",
      duration: "",
    },
  ]);

 
  const handleChange =
    (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm({
        ...form,
        [field]: e.target.value,
      });
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

  const addMedicine = () => {
    setMedicines([
      ...medicines,
      {
        id: Date.now().toString(),
        name: "",
        dosage: "",
        frequency: "",
        duration: "",
      },
    ]);
  };

  const removeMedicine = (id: string) => {
    setMedicines(medicines.filter((m) => m.id !== id));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Page Header */}
      <SectionHeader
        title="Manual Prescription Entry"
        subtitle="Enter patient and prescription details"
      />

      {/* Patient Details */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Patient Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Patient Name"
            value={form.patientName}
            onChange={handleChange("patientName")}
            placeholder="Enter patient name"
          />

          <Input
            label="Age"
            type="number"
            value={form.age}
            onChange={handleChange("age")}
            placeholder="Enter age"
          />

          <Input
            label="Gender"
            value={form.gender}
            onChange={handleChange("gender")}
            placeholder="Male / Female / Other"
          />

          <Input
            label="Contact Number"
            value={form.contact}
            onChange={handleChange("contact")}
            placeholder="Enter contact number"
          />

          <Input
            label="Patient ID"
            value={form.patientId}
            onChange={handleChange("patientId")}
            placeholder="Optional"
          />

          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={handleChange("date")}
          />
        </div>
      </div>

      {/* Doctor Details */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Doctor Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Doctor Name"
            value={form.doctorName}
            onChange={handleChange("doctorName")}
            placeholder="Enter doctor name"
          />

          <Input
            label="Registration Number"
            value={form.registrationNumber}
            onChange={handleChange("registrationNumber")}
            placeholder="Enter registration number"
          />
        </div>
      </div>

      {/* Diagnosis */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Diagnosis</h2>

        <Input
          label="Diagnosis / Notes"
          value={form.diagnosis}
          onChange={handleChange("diagnosis")}
          placeholder="Enter diagnosis details"
        />
      </div>

      {/* Medicines */}
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Medicines</h2>
          <Button variant="secondary" onClick={addMedicine}>
            + Add Medicine
          </Button>
        </div>

        <div className="space-y-4">
          {medicines.map((medicine, index) => (
            <div
              key={medicine.id}
              className="border rounded-lg p-4 bg-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium">
                  Medicine {index + 1}
                </span>

                {medicines.length > 1 && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => removeMedicine(medicine.id)}
                  >
                    Remove
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input
                  label="Medicine Name"
                  value={medicine.name}
                  onChange={(e) =>
                    updateMedicine(
                      medicine.id,
                      "name",
                      e.target.value
                    )
                  }
                  placeholder="Paracetamol"
                />

                <Input
                  label="Dosage"
                  value={medicine.dosage}
                  onChange={(e) =>
                    updateMedicine(
                      medicine.id,
                      "dosage",
                      e.target.value
                    )
                  }
                  placeholder="500mg"
                />

                <Input
                  label="Frequency"
                  value={medicine.frequency}
                  onChange={(e) =>
                    updateMedicine(
                      medicine.id,
                      "frequency",
                      e.target.value
                    )
                  }
                  placeholder="1-0-1"
                />

                <Input
                  label="Duration"
                  value={medicine.duration}
                  onChange={(e) =>
                    updateMedicine(
                      medicine.id,
                      "duration",
                      e.target.value
                    )
                  }
                  placeholder="5 days"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="secondary">Save Draft</Button>
        <Button variant="primary" onClick={onProceed}>
          Proceed to Validation
        </Button>
      </div>
    </div>
  );
}
