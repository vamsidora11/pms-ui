import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { SVGProps } from 'react';

// --------------------------- Mocks (defined inside factories) ---------------------------

// Icons: include both Plus and Search since PatientDirectoryPanel uses Search
vi.mock('lucide-react', () => {
  const Icon = (props: SVGProps<SVGSVGElement>) => <svg data-testid="icon" {...props} />;
  return { Plus: Icon, Search: Icon };
});

// API mocks
vi.mock('@api/patient', () => {
  return {
    createPatient: vi.fn(),
    getPatientDetails: vi.fn(),
    searchPatients: vi.fn(),
  };
});

vi.mock('@api/prescription', () => {
  return {
    getPrescriptionsByPatient: vi.fn(),
  };
});

// Toast mock (returns the same object instance on each call)
vi.mock('@components/common/Toast/useToast', () => {
  const toast = { error: vi.fn(), success: vi.fn(), info: vi.fn() };
  return { useToast: () => toast };
});

// ---- IMPORTANT: mock child components using paths from *this test* folder ----
vi.mock('../components/addpatient', () => ({
  default: (props: { onSave: (req: { some: string }) => void; onClose: () => void }) => (
    <div>
      <div>AddPatientModal</div>
      <button data-testid="add-save" onClick={() => props.onSave({ some: 'request' })}>save</button>
      <button data-testid="add-close" onClick={() => props.onClose()}>close</button>
    </div>
  ),
}));

vi.mock('../components/updatePatient', () => ({
  default: (props: { onSave: (req: { id: string; fullName: string }) => void; onClose: () => void }) => (
    <div>
      <div>UpdatePatientModal</div>
      <button data-testid="update-save" onClick={() => props.onSave({ id: 'p-1', fullName: 'Updated P' })}>save</button>
      <button data-testid="update-close" onClick={() => props.onClose()}>close</button>
    </div>
  ),
}));

vi.mock('../components/PatientDirectoryPanel', () => ({
  default: (props: {
    selectedPatientId?: string | null;
    onSelectPatient: (id: string) => void;
    searchTerm?: string;
    listLoading?: boolean;
    listError?: string | null;
  }) => (
    <div>
      <div>PatientDirectoryPanel</div>
      <div data-testid="dir-selected-id">{props.selectedPatientId ?? 'none'}</div>
      <button data-testid="dir-select-p2" onClick={() => props.onSelectPatient('p-2')}>select p-2</button>
      {/* mirror props for assertions */}
      <div data-testid="dir-search">{props.searchTerm ?? ''}</div>
      <div data-testid="dir-loading">{String(!!props.listLoading)}</div>
      <div data-testid="dir-error">{props.listError ?? ''}</div>
    </div>
  ),
}));

vi.mock('../components/PatientDetailsPanel', () => ({
  default: (props: {
    onClickUpdate?: () => void;
    onLoadMorePrescriptions?: () => void;
    detailsLoading?: boolean;
    prescriptionsLoading?: boolean;
  }) => (
    <div>
      <div>PatientDetailsPanel</div>
      <button data-testid="open-update" onClick={() => props.onClickUpdate?.()}>open update</button>
      <button data-testid="load-more" onClick={() => props.onLoadMorePrescriptions?.()}>load more</button>
      <div data-testid="details-loading">{String(!!props.detailsLoading)}</div>
      <div data-testid="rx-loading">{String(!!props.prescriptionsLoading)}</div>
    </div>
  ),
}));

// Hooks
vi.mock('../hooks/usePatientDirectory', () => ({ usePatientDirectory: vi.fn() }));
vi.mock('../hooks/usePatientDetails', () => ({ usePatientDetails: vi.fn() }));
vi.mock('../hooks/usePatientPrescriptions', () => ({ usePatientPrescriptions: vi.fn() }));

// --------------------------- Imports after mocks ---------------------------

import PatientProfiles from '../components/PatientProfile';
import { useToast } from '@components/common/Toast/useToast';
import * as patientApi from '@api/patient';
import { usePatientDirectory } from '../hooks/usePatientDirectory';
import { usePatientDetails } from '../hooks/usePatientDetails';
import { usePatientPrescriptions } from '../hooks/usePatientPrescriptions';

// --------------------------- Helpers ---------------------------

type PatientListItem = { id: string; fullName?: string };

type DirState = {
  patients: PatientListItem[];
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  listLoading: boolean;
  listError: string | null;
  debouncedSearch?: string | null;
  setPatients: (p: PatientListItem[]) => void;
};

type DetailsState = {
  selectedPatient: PatientListItem | null;
  selectPatient: (id: string) => Promise<void> | void;
  setSelectedPatient: (p: PatientListItem | null) => void;
  detailsLoading: boolean;
  detailsError: string | null;
};

type RxState = {
  prescriptions: unknown[];
  prescriptionsLoading: boolean;
  prescriptionsError: string | null;
  hasMore: boolean;
  loadMore: () => void;
  prescriptionsLoadingMore: boolean;
  reset: () => void;
};

function makeDir(partial: Partial<DirState> = {}): DirState {
  return {
    patients: [],
    searchTerm: '',
    setSearchTerm: vi.fn(),
    listLoading: false,
    listError: null,
    debouncedSearch: '',
    setPatients: vi.fn(),
    ...partial,
  };
}

function makeDetails(partial: Partial<DetailsState> = {}): DetailsState {
  return {
    selectedPatient: null,
    selectPatient: vi.fn().mockResolvedValue(undefined),
    setSelectedPatient: vi.fn(),
    detailsLoading: false,
    detailsError: null,
    ...partial,
  };
}

function makeRx(partial: Partial<RxState> = {}): RxState {
  return {
    prescriptions: [],
    prescriptionsLoading: false,
    prescriptionsError: null,
    hasMore: false,
    loadMore: vi.fn(),
    prescriptionsLoadingMore: false,
    reset: vi.fn(),
    ...partial,
  };
}

function setDirectoryReturn(dir: DirState) {
  (usePatientDirectory as unknown as Mock).mockReturnValue(dir);
  return dir;
}
function setDetailsReturn(det: DetailsState) {
  (usePatientDetails as unknown as Mock).mockReturnValue(det);
  return det;
}
function setRxReturn(rx: RxState) {
  (usePatientPrescriptions as unknown as Mock).mockReturnValue(rx);
  return rx;
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
});

// --------------------------- Tests ---------------------------

describe('PatientProfiles', () => {
  it('renders header and Add New Patient button', () => {
    setDirectoryReturn(makeDir());
    setDetailsReturn(makeDetails());
    setRxReturn(makeRx());

    render(<PatientProfiles />);

    expect(screen.getByText('Patient Profiles')).toBeInTheDocument();
    expect(screen.getByText('View patient demographics and medical information')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add New Patient/i })).toBeInTheDocument();

    expect(screen.getByText('PatientDirectoryPanel')).toBeInTheDocument();
    expect(screen.getByText('PatientDetailsPanel')).toBeInTheDocument();

    expect(screen.getAllByTestId('icon').length).toBeGreaterThan(0);
  });

  it('opens AddPatientModal and can close it', async () => {
    const user = userEvent.setup();
    setDirectoryReturn(makeDir());
    setDetailsReturn(makeDetails());
    setRxReturn(makeRx());

    render(<PatientProfiles />);

    await user.click(screen.getByRole('button', { name: /Add New Patient/i }));
    expect(screen.getByText('AddPatientModal')).toBeInTheDocument();

    await user.click(screen.getByTestId('add-close'));
    await waitFor(() => expect(screen.queryByText('AddPatientModal')).not.toBeInTheDocument());
  });

  it('AddPatientModal onSave success: creates patient, refreshes list, selects new patient, closes', async () => {
    const user = userEvent.setup();
    const dir = setDirectoryReturn(makeDir({ debouncedSearch: '  john ', patients: [{ id: 'x' }]}));
    const det = setDetailsReturn(makeDetails());
    setRxReturn(makeRx());

    (patientApi.createPatient as Mock).mockResolvedValue({ patientId: 'p-2' });
    const refreshed = [{ id: 'p-2', fullName: 'P 2' }];
    (patientApi.searchPatients as Mock).mockResolvedValue(refreshed);

    render(<PatientProfiles />);
    await user.click(screen.getByRole('button', { name: /Add New Patient/i }));
    expect(screen.getByText('AddPatientModal')).toBeInTheDocument();

    await user.click(screen.getByTestId('add-save'));

    await waitFor(() => expect(patientApi.createPatient).toHaveBeenCalledTimes(1));
    expect(patientApi.searchPatients).toHaveBeenCalledWith('john'); // trimmed
    expect(dir.setPatients).toHaveBeenCalledWith(refreshed);
    expect(det.selectPatient).toHaveBeenCalledWith('p-2');

    await waitFor(() => expect(screen.queryByText('AddPatientModal')).not.toBeInTheDocument());
  });

  it('AddPatientModal onSave failure: shows toast error and modal stays open', async () => {
    const user = userEvent.setup();
    setDirectoryReturn(makeDir({ debouncedSearch: '  q  ' }));
    setDetailsReturn(makeDetails());
    setRxReturn(makeRx());

    (patientApi.createPatient as Mock).mockRejectedValue(new Error('bad'));

    render(<PatientProfiles />);
    await user.click(screen.getByRole('button', { name: /Add New Patient/i }));
    expect(screen.getByText('AddPatientModal')).toBeInTheDocument();

    await user.click(screen.getByTestId('add-save'));

    const toast = useToast();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Error adding patient'));
    expect(screen.getByText('AddPatientModal')).toBeInTheDocument();
  });

  it('wires PatientDirectoryPanel: shows selected id and onSelectPatient triggers details.selectPatient', async () => {
    const user = userEvent.setup();
    const det = setDetailsReturn(makeDetails({ selectedPatient: { id: 'p-9' } }));
    setDirectoryReturn(makeDir());
    setRxReturn(makeRx());

    render(<PatientProfiles />);

    expect(screen.getByTestId('dir-selected-id').textContent).toBe('p-9');

    await user.click(screen.getByTestId('dir-select-p2'));
    expect(det.selectPatient).toHaveBeenCalledWith('p-2');
  });

  it('wires PatientDetailsPanel: load more triggers prescriptions.loadMore and open update shows UpdatePatientModal', async () => {
    const user = userEvent.setup();
    setDirectoryReturn(makeDir());
    const rx = makeRx();
    setRxReturn(rx);
    setDetailsReturn(makeDetails({ selectedPatient: { id: 'p-1', fullName: 'P1' } }));

    render(<PatientProfiles />);

    await user.click(screen.getByTestId('load-more'));
    expect(rx.loadMore).toHaveBeenCalled();

    await user.click(screen.getByTestId('open-update'));
    expect(screen.getByText('UpdatePatientModal')).toBeInTheDocument();
  });

  it('UpdatePatientModal onSave: sets selected, refreshes list and closes', async () => {
    const user = userEvent.setup();
    const dir = setDirectoryReturn(makeDir({ debouncedSearch: '  jane  ' }));
    const det = setDetailsReturn(makeDetails({ selectedPatient: { id: 'p-1', fullName: 'P1' } }));
    setRxReturn(makeRx());

    (patientApi.searchPatients as Mock).mockResolvedValue([{ id: 'p-1', fullName: 'Updated P' }]);

    render(<PatientProfiles />);

    await user.click(screen.getByTestId('open-update'));
    expect(screen.getByText('UpdatePatientModal')).toBeInTheDocument();

    await user.click(screen.getByTestId('update-save'));

    await waitFor(() => expect(det.setSelectedPatient).toHaveBeenCalledWith({ id: 'p-1', fullName: 'Updated P' }));
    expect(patientApi.searchPatients).toHaveBeenCalledWith('jane');
    expect(dir.setPatients).toHaveBeenCalledWith([{ id: 'p-1', fullName: 'Updated P' }]);

    await waitFor(() => expect(screen.queryByText('UpdatePatientModal')).not.toBeInTheDocument());
  });

  it('UpdatePatientModal onClose hides the modal', async () => {
    const user = userEvent.setup();
    setDirectoryReturn(makeDir());
    setDetailsReturn(makeDetails({ selectedPatient: { id: 'p-1' } }));
    setRxReturn(makeRx());

    render(<PatientProfiles />);

    await user.click(screen.getByTestId('open-update'));
    expect(screen.getByText('UpdatePatientModal')).toBeInTheDocument();

    await user.click(screen.getByTestId('update-close'));
    await waitFor(() => expect(screen.queryByText('UpdatePatientModal')).not.toBeInTheDocument());
  });

  it('effect: auto-selects first patient when none is selected and list becomes non-empty', async () => {
    setDirectoryReturn(makeDir({ patients: [] }));
    const det = setDetailsReturn(makeDetails({ selectedPatient: null }));
    setRxReturn(makeRx());

    const { rerender } = render(<PatientProfiles />);

    setDirectoryReturn(makeDir({ patients: [{ id: 'p-1' }, { id: 'p-2' }] }));
    rerender(<PatientProfiles />);

    await waitFor(() => expect(det.selectPatient).toHaveBeenCalledWith('p-1'));
  });

  it('effect: clears selection and resets prescriptions when selected patient is not in list', async () => {
    setDirectoryReturn(makeDir({ patients: [{ id: 'p-1' }, { id: 'p-2' }] }));
    const rx = makeRx();
    setRxReturn(rx);
    const det = setDetailsReturn(makeDetails({ selectedPatient: { id: 'p-9' } }));

    render(<PatientProfiles />);

    await waitFor(() => expect(det.setSelectedPatient).toHaveBeenCalledWith(null));
    expect(rx.reset).toHaveBeenCalled();
  });
});
