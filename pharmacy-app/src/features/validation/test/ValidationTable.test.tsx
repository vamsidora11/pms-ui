import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ValidationTable from "../components/ValidationTable";
import type { PrescriptionDetails } from "@prescription/domain/model";

vi.mock("@components/common/Pill/Pill", () => ({
  Pill: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

function createData(): PrescriptionDetails {
  return {
    id: "rx-1",
    patientId: "p-1",
    patientName: "John Doe",
    prescriber: { id: "dr-1", name: "Dr. Smith" },
    prescriberName: "Dr. Smith",
    createdAt: new Date("2026-03-01T10:00:00Z"),
    status: "Created",
    medicineCount: 1,
    medicines: [
      {
        lineId: "line-1",
        productId: "prod-1",
        name: "Amoxicillin",
        strength: "500mg",
        frequency: "BID",
        instructions: "",
        durationDays: 7,
        quantityPrescribed: 14,
        quantityApprovedPerFill: null,
        quantityDispensed: 0,
        refillsAllowed: 0,
        refillsRemaining: 0,
        validation: {
          hasAllergy: false,
          hasInteraction: false,
          severity: "None",
          interactionDetails: [],
        },
        review: {
          status: "Pending",
          reviewedBy: null,
          reviewedAt: null,
          notes: null,
        },
      },
    ],
  };
}

describe("ValidationTable", () => {
  it("calls handlers when a line is still pending", () => {
    const onAccept = vi.fn();
    const onOpenReject = vi.fn();
    const onOpenAllergy = vi.fn();

    render(
      <ValidationTable
        data={createData()}
        submitting={false}
        decisions={{}}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onOpenAllergy={onOpenAllergy}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));
    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    expect(onAccept).toHaveBeenCalledWith("line-1");
    expect(onOpenReject).toHaveBeenCalledWith("line-1");
  });

  it("keeps both decision buttons available while a draft approval can still be changed", () => {
    render(
      <ValidationTable
        data={createData()}
        submitting={false}
        decisions={{ "line-1": "Approved" }}
        onAccept={vi.fn()}
        onOpenReject={vi.fn()}
        onOpenAllergy={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Approve" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).not.toBeDisabled();
  });

  it("keeps both decision buttons available while a draft rejection can still be changed", () => {
    render(
      <ValidationTable
        data={createData()}
        submitting={false}
        decisions={{ "line-1": "Rejected" }}
        onAccept={vi.fn()}
        onOpenReject={vi.fn()}
        onOpenAllergy={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Approve" })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).not.toBeDisabled();
  });

  it("locks both decision buttons when the line was already finalized", () => {
    const data = createData();
    data.medicines[0].review.status = "Rejected";
    data.medicines[0].review.notes = "Interaction risk";

    render(
      <ValidationTable
        data={data}
        submitting={false}
        decisions={{}}
        onAccept={vi.fn()}
        onOpenReject={vi.fn()}
        onOpenAllergy={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Approve" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reject" })).toBeDisabled();
  });
});
