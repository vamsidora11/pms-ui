import Button from "../../components/common/Button";
import SectionHeader from "../../components/common/SectionHeader";
import StatusCard from "../../components/common/StatusCard";
import Table from "../../components/common/Table";
import Badge from "../../components/common/Badge";

type Props = {
  onAddPrescription: () => void;
};

export default function DashboardView({ onAddPrescription }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Pharmacist Dashboard"
        subtitle="Overview of today’s pharmacy operations"
        action={
          <Button onClick={onAddPrescription}>
            + Add New Prescription
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
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
            { id: "RX001", patient: "John Doe", status: "Pending", date: "Today" },
            { id: "RX002", patient: "Jane Smith", status: "Completed", date: "Today" },
          ]}
        />
      </div>
    </div>
  );
}
