export type Medicine = {
  id: string;
  name: string;
  strength: string;
  frequency: string;
  duration: string;
  quantity: string;
  instructions: string;
};

export interface Prescription {
  id: string;
  patientName: string;
  patientId: string;
  age: string;
  gender: string;
  phone: string;
  date: string;
  doctorId: string;
  doctorName: string;
  clinic: string;
  doctorNotes: string;
  disease: string;
  symptoms: string;
  allergies: string[];
  medicines: Medicine[];
}
