import api from "./axiosInstance";
import type { ValidationResultDto } from "./validation.dto";

export async function getValidationResults(
  prescriptionId: string,
  patientId: string
): Promise<ValidationResultDto> {
  const res = await api.get<ValidationResultDto>(
    `/api/prescriptions/${prescriptionId}/validate`,
    {
      params: { patientId },
    }
  );

  return res.data;
}
