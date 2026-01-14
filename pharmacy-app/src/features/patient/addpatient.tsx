import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { CreatePatientRequest } from "../../store/patient/patienttype";

interface AddPatientModalProps {
  onClose: () => void;
  onSave: (request: CreatePatientRequest) => void; // parent does API call
}

export default function AddPatientModal({ onClose, onSave }: AddPatientModalProps) {
  const [name, setName] = useState("");
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(""); // collected but not sent
  const [address, setAddress] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [newAllergy, setNewAllergy] = useState("");

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

  const handleSave = () => {
    if (!name || !dob || !phone) {
      alert("Full Name, Date of Birth and Phone are required");
      return;
    }
    const isoDob = new Date(dob).toISOString();
    const request: CreatePatientRequest = {
      fullName: name,
      dob: isoDob, // normalize date string
      gender,
      phone,
      email,
      address,
      allergies: allergies.map(a => ({ code: a, displayName: a }))
      // insurance: { provider: "...", memberId: "..." } // if you collect it
    };

    onSave(request); 
    onClose();
    setName(""); setDob(""); setGender("Male"); setPhone(""); setEmail(""); setAddress(""); setAllergies([]); setNewAllergy("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Add New Patient</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 overflow-y-auto flex-1 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name *" value={name} onChange={setName} />
            <Input label="Date of Birth *" type="date" value={dob} onChange={setDob} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select label="Gender" value={gender} onChange={setGender} options={["Male", "Female", "Other"]} />
            <Input label="Phone *" value={phone} onChange={setPhone} />
          </div>

          <Input label="Email" value={email} onChange={setEmail} />
          <Input label="Address" value={address} onChange={setAddress} />

          {/* Allergies */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Allergies</label>
            <div className="flex gap-2">
              <input
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy"
                className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => {
                  if (newAllergy && !allergies.includes(newAllergy)) {
                    setAllergies([...allergies, newAllergy]);
                    setNewAllergy("");
                  }
                }}
                className="px-5 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {allergies.map((a) => (
                <span key={a} className="px-3 py-1 bg-red-100 text-red-700 rounded-lg flex items-center gap-1">
                  {a}
                  <button onClick={() => setAllergies(allergies.filter((x) => x !== a))}>
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
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

/* Inputs */
function Input({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
