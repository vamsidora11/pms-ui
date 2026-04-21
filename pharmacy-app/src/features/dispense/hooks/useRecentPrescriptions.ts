import { useEffect, useState } from "react";
import { getAllPrescriptions } from "@api/prescription";
import type { PrescriptionSummaryDto } from "@api/prescription";

export function useRecentPrescriptions() {
  const [recent, setRecent] = useState<PrescriptionSummaryDto[]>([]);
  const [isLoading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const startOfDay = new Date(
          Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate()
          )
        );

        const res = await getAllPrescriptions({
          pageSize: 5,
          pageNumber: 1,
          createdAt: startOfDay.toISOString(),
          sortBy: "createdAt",
          sortDirection: "desc",
          status: "Active",
        });

        setRecent(res.items ?? []);
      } catch {
        setRecent([]);
      } finally {
        setLoading(false);
      }
    };

    void fetch();
  }, []);

  return { recent, isLoading };
}
