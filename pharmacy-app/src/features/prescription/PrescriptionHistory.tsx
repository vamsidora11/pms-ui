import { useCallback, useMemo } from "react";
import { useDispatch } from "react-redux";

import DataTable from "@components/common/Table/Table";
import type { Column, ServerTableQuery } from "@components/common/Table/Table";
import Breadcrumbs from "@components/common/BreadCrumps/Breadcrumbs";
import { fetchAllPrescriptions } from "@store/prescription/prescriptionSlice";
import type { AppDispatch } from "../../store";

import type { PrescriptionSummaryDto } from "@prescription/prescription.types";

import { usePrescriptionHistoryData } from "./hooks/usePrescriptionHistoryData";
import PrescriptionExpandedDetails from "./components/PrescriptionExpandedDetails";
import {
  buildHistoryQueryParams,
  formatDateTime,
  statusStyle,
} from "./prescriptionHistoryUtils";

export default function PrescriptionHistory() {
  const dispatch = useDispatch<AppDispatch>();

  const {
    prescriptions,
    requestStatus,
    totalCount,
    pageNumber,
    pageSize,
    expandedRowId,
    expandedDetails,
    expandedPatient,
    expandedPatientLoading,
    toggleRow,
    isRowExpanded,
  } = usePrescriptionHistoryData({ pageSize: 10, skipInitialFetch: true });

  const columns: Column<PrescriptionSummaryDto>[] = useMemo(
    () => [
      {
        key: "id",
        header: "Prescription ID",
        sortable: true,
        filterable: true,
        width: 180,
        render: (v) => <span className="font-semibold text-gray-900">{String(v)}</span>,
      },
      {
        key: "patientName",
        header: "Patient",
        sortable: true,
        filterable: true,
        width: 220,
        render: (_, row) => (
          <div>
            <div className="font-medium">{row.patientName}</div>
            <div className="text-xs text-gray-500">{row.patientId}</div>
          </div>
        ),
      },
      {
        key: "prescriberName",
        header: "Doctor",
        sortable: true,
        filterable: true,
        width: 200,
      },
      {
        key: "createdAt",
        header: "Date",
        sortable: true,
        filterable: true,
        filterType: "date",
        width: 180,
        render: (v) => {
          const { date, time } = formatDateTime(v as string);
          return (
            <div>
              <div className="font-medium">{date}</div>
              <div className="text-xs text-gray-500">{time}</div>
            </div>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        sortable: true,
        filterable: true,
        filterType: "select",
        filterOptions: [
          { label: "Created", value: "Created" },
          { label: "Reviewed", value: "Reviewed" },
          { label: "Active", value: "Active" },
          { label: "Completed", value: "Completed" },
          { label: "Cancelled", value: "Cancelled" },
          { label: "Expired", value: "Expired" },
        ],
        width: 160,
        render: (v) => {
          const statusValue = String(v);
          return (
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(statusValue)}`}
            >
              {statusValue}
            </span>
          );
        },
      },
    ],
    []
  );

  const renderExpandedRow = useCallback(
    (row: PrescriptionSummaryDto) => {
      if (expandedRowId !== row.id) return null;

      return (
        <PrescriptionExpandedDetails
          row={row}
          details={expandedDetails}
          patient={expandedPatient}
          patientLoading={expandedPatientLoading}
        />
      );
    },
    [expandedRowId, expandedDetails, expandedPatient, expandedPatientLoading]
  );

  const handleRowClick = useCallback(
    (row: PrescriptionSummaryDto) => toggleRow(row.id),
    [toggleRow]
  );

  const handleServerQueryChange = useCallback(
    (tableQuery: ServerTableQuery) => {
      const apiQuery = buildHistoryQueryParams({
        pageNumber: tableQuery.pageNumber,
        pageSize: tableQuery.pageSize,
        searchTerm: tableQuery.searchTerm,
        sortBy: tableQuery.sortBy,
        sortDirection: tableQuery.sortDirection,
        columnFilters: tableQuery.columnFilters,
      });

      dispatch(fetchAllPrescriptions(apiQuery));
    },
    [dispatch]
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Prescription History" }]} />

      <div>
        <h1 className="text-2xl font-bold">Prescription History</h1>
        <p className="text-sm text-gray-500">View and track all prescriptions - {totalCount}</p>
      </div>

      <DataTable
        data={prescriptions}
        columns={columns}
        pageSize={10}
        pageSizeOptions={[5, 10, 20]}
        searchPlaceholder="Search patient name..."
        exportFileName="prescription-history"
        height={650}
        expandable
        renderExpandedRow={renderExpandedRow}
        isRowExpanded={isRowExpanded}
        onRowClick={handleRowClick}
        serverSide
        loading={requestStatus === "loading"}
        totalItems={totalCount}
        initialServerQuery={{
          pageNumber,
          pageSize,
        }}
        onServerQueryChange={handleServerQueryChange}
      />
    </div>
  );
}
