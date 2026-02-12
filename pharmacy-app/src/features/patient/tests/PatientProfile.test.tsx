import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// If you DON'T have a global lucide mock in setupFiles, keep this:
vi.mock("lucide-react", () => {
  const Svg = (props: any) => React.createElement("svg", props);
  return { Plus: Svg };
});

// ---- Mock child components to keep tests focused on container logic ----
vi.mock("../components/addpatient", () => {
  const AddPatientModal = ({
    onClose,
    onSave,
  }: {
    onClose: () => void;
    onSave: (req: any) => Promise<void> | void;
  }) => (
    <div data-testid="add-patient-modal">
      <button onClick={() => onSave({ fullName: "New User" })}>
        add-modal-save
      </button>
      <button onClick={onClose}>add-modal-close</button>
    </div>
  );
  return { default: AddPatientModal };
});

vi.mock("../components/updatePatient", () => {
  const UpdatePatientModal = ({
    onClose,
    onSave,
    patient,
  }: {
    onClose: () => void;
    onSave: (updated: any) => Promise<void> | void;
    patient: any;
  }) => (
    <div data-testid="update-patient-modal">
      <div>editing-{patient?.id}</div>
      <button
        onClick={() =>
          onSave({ ...patient, fullName: "Updated Name From Modal" })
        }
      >
        update-modal-save
      </button>
      <button onClick={onClose}>update-modal-close</button>
    </div>
  );
  return { default: UpdatePatientModal };
});

vi.mock("../components/PatientDirectoryPanel", () => {
  const PatientDirectoryPanel = ({
    patients,
    onSelectPatient,
  }: {
    patients: Array<{ id: string; fullName?: string }>;
    onSelectPatient: (id: string) => Promise<void> | void;
  }) => (
    <div data-testid="directory-panel">
      <ul>
        {patients.map((p) => (
          <li key={p.id}>
            <button onClick={() => onSelectPatient(p.id)}>
              select-{p.id}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
  return { default: PatientDirectoryPanel };
});

vi.mock("../components/PatientDetailsPanel", () => {
  const PatientDetailsPanel = ({
    onClickUpdate,
    onLoadMorePrescriptions,
  }: {
    onClickUpdate: () => void;
    onLoadMorePrescriptions: () => Promise<void> | void;
  }) => (
    <div data-testid="details-panel">
      <button onClick={onClickUpdate}>open-update-modal</button>
      <button onClick={() => onLoadMorePrescriptions()}>load-more</button>
    </div>
  );
  return { default: PatientDetailsPanel };
});

// ---- Mock APIs ----
const createPatientMock = vi.fn();
const searchPatientsMock = vi.fn();
const getPatientDetailsMock = vi.fn();
const getPrescriptionsByPatientMock = vi.fn();

vi.mock("@api/patient", () => ({
  createPatient: (...args: any[]) => createPatientMock(...args),
  searchPatients: (...args: any[]) => searchPatientsMock(...args),
  getPatientDetails: (...args: any[]) => getPatientDetailsMock(...args),
}));

vi.mock("@api/prescription", () => ({
  getPrescriptionsByPatient: (...args: any[]) =>
    getPrescriptionsByPatientMock(...args),
}));

// ---- Mock hooks ----
type DirReturn = {
  patients: Array<{ id: string; fullName?: string }>;
  searchTerm: string;
  debouncedSearch: string | null;
  setSearchTerm: (v: string) => void;
  setPatients: (ps: any[]) => void;
  listLoading: boolean;
  listError: string | null;
};

type DetailsReturn = {
  selectedPatient: { id: string; fullName?: string } | null;
  selectPatient: (id: string) => Promise<void>;
  setSelectedPatient: (p: any) => void;
  detailsLoading: boolean;
  detailsError: string | null;
};

type RxReturn = {
  prescriptions: any[];
  prescriptionsLoading: boolean;
  prescriptionsError: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  prescriptionsLoadingMore: boolean;
  reset: () => void;
};

const usePatientDirectoryMock = vi.fn<(...args: any[]) => DirReturn>();
const usePatientDetailsMock = vi.fn<(...args: any[]) => DetailsReturn>();
const usePatientPrescriptionsMock = vi.fn<
  (...args: any[]) => RxReturn>();

vi.mock("../hooks/usePatientDirectory", () => ({
  usePatientDirectory: (...args: any[]) => usePatientDirectoryMock(...args),
}));
vi.mock("../hooks/usePatientDetails", () => ({
  usePatientDetails: (...args: any[]) => usePatientDetailsMock(...args),
}));
vi.mock("../hooks/usePatientPrescriptions", () => ({
  usePatientPrescriptions: (...args: any[]) =>
    usePatientPrescriptionsMock(...args),
}));

import PatientProfiles from "../components/PatientProfile";

// ---- Helpers ----
const makeDir = (over: Partial<DirReturn> = {}): DirReturn => ({
  patients: [],
  searchTerm: "",
  debouncedSearch: "",
  setSearchTerm: vi.fn(),
  setPatients: vi.fn(),
  listLoading: false,
  listError: null,
  ...over,
});

const makeDetails = (over: Partial<DetailsReturn> = {}): DetailsReturn => ({
  selectedPatient: null,
  selectPatient: vi.fn().mockResolvedValue(undefined),
  setSelectedPatient: vi.fn(),
  detailsLoading: false,
  detailsError: null,
  ...over,
});

const makeRx = (over: Partial<RxReturn> = {}): RxReturn => ({
  prescriptions: [],
  prescriptionsLoading: false,
  prescriptionsError: null,
  hasMore: false,
  loadMore: vi.fn().mockResolvedValue(undefined),
  prescriptionsLoadingMore: false,
  reset: vi.fn(),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();

  // Default mocks for hooks for most tests; override inside specific tests as needed.
  usePatientDirectoryMock.mockReturnValue(
    makeDir({
      patients: [
        { id: "p-001", fullName: "Alice" },
        { id: "p-002", fullName: "Bob" },
      ],
      debouncedSearch: "  demo  ",
    })
  );

  usePatientDetailsMock.mockReturnValue(
    makeDetails({
      selectedPatient: { id: "p-001", fullName: "Alice" },
    })
  );

  usePatientPrescriptionsMock.mockReturnValue(
    makeRx({
      prescriptions: [{ id: "rx-1" }],
      hasMore: true,
    })
  );

  // Default API behavior
  createPatientMock.mockResolvedValue({ patientId: "p-new" });
  searchPatientsMock.mockResolvedValue([
    { id: "p-new", fullName: "New User" },
    { id: "p-001", fullName: "Alice" },
  ]);
  getPatientDetailsMock.mockResolvedValue({ id: "p-001", fullName: "Alice" });
  getPrescriptionsByPatientMock.mockResolvedValue({
    items: [],
    continuationToken: null,
  });
});

describe("PatientProfiles Component", () => {
  it("renders header and add button", () => {
    render(<PatientProfiles />);

    expect(
      screen.getByRole("heading", { name: /patient profiles/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add new patient/i })
    ).toBeInTheDocument();
  });

  it("opens AddPatientModal when button clicked", () => {
    render(<PatientProfiles />);

    // Modal should not be present initially
    expect(screen.queryByTestId("add-patient-modal")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add new patient/i }));

    // Modal should be present
    expect(screen.getByTestId("add-patient-modal")).toBeInTheDocument();
  });

  it("calls createPatient and updates directory on AddPatientModal save", async () => {
    // Use the SAME instance for all renders of this component in this test
    const dir = makeDir({
      patients: [{ id: "p-001", fullName: "Alice" }],
      debouncedSearch: "  search-text  ", // ensure trim() is exercised
    });
    const det = makeDetails({ selectedPatient: null });

    // Important: mockReturnValue (not Once) so re-renders keep using this instance
    usePatientDirectoryMock.mockReturnValue(dir);
    usePatientDetailsMock.mockReturnValue(det);
    usePatientPrescriptionsMock.mockReturnValue(makeRx());

    render(<PatientProfiles />);

    // Open modal
    fireEvent.click(screen.getByRole("button", { name: /add new patient/i }));
    const modal = await screen.findByTestId("add-patient-modal");
    expect(modal).toBeInTheDocument();

    // Trigger save inside mocked modal
    fireEvent.click(screen.getByText("add-modal-save"));

    // Assert create & refresh
    await waitFor(() => {
      expect(createPatientMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(searchPatientsMock).toHaveBeenCalled();
    });
    const arg = searchPatientsMock.mock.calls.at(-1)?.[0];
    expect(typeof arg).toBe("string");
    // trimmed debouncedSearch should be used
    expect(arg).toBe("search-text");

    // Directory updated with refreshed results
    expect(dir.setPatients).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "p-new", fullName: "New User" }),
      ])
    );

    // new patient selected
    await waitFor(() => {
      expect(det.selectPatient).toHaveBeenCalledWith("p-new");
    });

    // Modal closes after success
    await waitFor(() => {
      expect(screen.queryByTestId("add-patient-modal")).not.toBeInTheDocument();
    });
  });

  it("auto-selects first patient if none selected", async () => {
    const dir = makeDir({
      patients: [
        { id: "p-100", fullName: "First" },
        { id: "p-200", fullName: "Second" },
      ],
    });
    const det = makeDetails({ selectedPatient: null });

    usePatientDirectoryMock.mockReturnValue(dir);
    usePatientDetailsMock.mockReturnValue(det);
    usePatientPrescriptionsMock.mockReturnValue(makeRx());

    render(<PatientProfiles />);

    await waitFor(() => {
      expect(det.selectPatient).toHaveBeenCalledWith("p-100");
    });
  });

  it("opens UpdatePatientModal when update button clicked", async () => {
    // Ensure a selected patient so Update modal passes its condition
    const det = makeDetails({ selectedPatient: { id: "p-001", fullName: "A" } });
    usePatientDetailsMock.mockReturnValue(det);

    render(<PatientProfiles />);

    expect(
      screen.queryByTestId("update-patient-modal")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("open-update-modal"));

    // Wait for modal to appear
    expect(await screen.findByTestId("update-patient-modal")).toBeInTheDocument();
    expect(screen.getByText(/editing-p-001/i)).toBeInTheDocument();
  });

  it("updates patient and directory on UpdatePatientModal save", async () => {
    // IMPORTANT: include the selected patient in the directory list
    // and use mockReturnValue (not Once) so every render uses these instances.
    const dir = makeDir({
      patients: [{ id: "p-001", fullName: "A" }],
      debouncedSearch: "   q   ",
    });
    const det = makeDetails({ selectedPatient: { id: "p-001", fullName: "A" } });

    usePatientDirectoryMock.mockReturnValue(dir);
    usePatientDetailsMock.mockReturnValue(det);
    usePatientPrescriptionsMock.mockReturnValue(makeRx());

    render(<PatientProfiles />);

    // Open update modal via DetailsPanel button
    fireEvent.click(screen.getByText("open-update-modal"));

    // Ensure modal is mounted before clicking save
    await screen.findByTestId("update-patient-modal");

    // Click mocked modal save
    fireEvent.click(screen.getByText("update-modal-save"));

    // Component should set selected patient and refresh directory
    await waitFor(() => {
      expect(det.setSelectedPatient).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: "Updated Name From Modal" })
      );
    });

    await waitFor(() => {
      expect(searchPatientsMock).toHaveBeenCalled();
    });
    const qArg = searchPatientsMock.mock.calls.at(-1)?.[0];
    expect(qArg).toBe("q");

    expect(dir.setPatients).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: "p-new", fullName: "New User" }),
      ])
    );

    await waitFor(() => {
      expect(screen.queryByTestId("update-patient-modal")).not.toBeInTheDocument();
    });
  });

  it("calls loadMore when prescriptions load more is triggered", async () => {
    const rx = makeRx();
    usePatientPrescriptionsMock.mockReturnValue(rx);

    render(<PatientProfiles />);

    fireEvent.click(screen.getByText("load-more"));
    await waitFor(() => {
      expect(rx.loadMore).toHaveBeenCalledTimes(1);
    });
  });

  it("resets prescriptions if selected patient not in directory", async () => {
    const dir = makeDir({
      patients: [{ id: "p-001" }, { id: "p-002" }],
    });
    const det = makeDetails({
      selectedPatient: { id: "p-ghost", fullName: "Ghost" },
    });
    const rx = makeRx();

    usePatientDirectoryMock.mockReturnValue(dir);
    usePatientDetailsMock.mockReturnValue(det);
    usePatientPrescriptionsMock.mockReturnValue(rx);

    render(<PatientProfiles />);

    await waitFor(() => {
      expect(det.setSelectedPatient).toHaveBeenCalledWith(null);
    });
    expect(rx.reset).toHaveBeenCalledTimes(1);
  });
});