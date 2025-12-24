import { useNavigate } from "react-router-dom";
import Button from "../components/common/Button/Button";
import SectionHeader from "../components/common/SectionHeader/SectionHeader";
import StatusCard from "../components/common/StatusCard/StatusCard";
import Table from "../components/common/Table/Table";
import Badge from "../components/common/Badge/Badge";

export default function PharmacistDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Pharmacist Dashboard"
        subtitle="Overview of today’s pharmacy operations"
        action={
          <Button onClick={() => navigate("/pharmacist/entry")}>
            + Add New Prescription
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatusCard title="Total Prescriptions" value="120" />
        <StatusCard title="Pending Validation" value="18" />
        <StatusCard title="Completed" value="92" />
        <StatusCard title="Alerts" value="5" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg p-4">
        <h2 className="font-semibold mb-3">Recent Prescriptions</h2>

        <Table
          columns={[
            { key: "id", label: "ID" },
            { key: "patient", label: "Patient" },
            {
              key: "status",
              label: "Status",
              render: (value) => <Badge label={value} />,
            },
            { key: "date", label: "Date" },
          ]}
          data={[
            {
              id: "RX001",
              patient: "John Doe",
              status: "Pending",
              date: "Today",
            },
            {
              id: "RX002",
              patient: "Jane Smith",
              status: "Completed",
              date: "Today",
            },
          ]}
        />
      </div>
    </div>
  );
}
  