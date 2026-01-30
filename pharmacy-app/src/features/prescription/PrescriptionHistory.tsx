import {
  useMemo,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Loader2,
  Pill,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import type { RootState } from '../../store';
import {
  searchPrescriptionsThunk,
  fetchAllPrescriptions,
  fetchPrescriptionDetails
} from '../../store/prescription/prescriptionSlice';

/* -------------------- Types -------------------- */

interface PrescriptionMedicine {
  prescriptionMedicineId: string;
  productId: string;
  name: string;
  strength: string;
  prescribedQuantity: number;
  dispensedQuantity: number;
  totalRefillsAuthorized: number;
  refillsRemaining: number;
  frequency: string;
  daysSupply: number;
  endDate: string;
  instruction: string;
}

interface PrescriptionSummary {
  id: string;
  patientId: string;
  patientName: string;
  prescriberName?: string;
  status: string;
  createdAt: string;
  expiresAt: string;
  medicineCount: number;
}

interface PrescriptionDetails {
  id: string;
  patientId: string;
  patientName: string;
  prescriber: {
    id: string;
    name: string;
  };
  status: string;
  createdAt: string;
  expiresAt: string;
  medicines: PrescriptionMedicine[];
  isRefillable: boolean;
}

interface Patient {
  id: string;
  name: string;
}

/* -------------------- Constants -------------------- */

const PAGE_SIZE = 10;

/* -------------------- Component -------------------- */

export default function PrescriptionHistory() {
  const dispatch = useDispatch();

  /* ---------- Redux State ---------- */

  const {
    items: prescriptions = [],
    continuationToken = null,
    status,
    selected
  } = useSelector((state: RootState) => state.prescriptions);

  const loading = status === 'loading';

  const patients = useSelector(
    (state: RootState) => state.patients?.list || []
  ) as Patient[];

  /* ---------- Local State ---------- */

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [tokensByPage, setTokensByPage] = useState<Record<number, string | null>>({
    1: null
  });

  // 🔐 Prevent React 18 double-fetch
  const hasFetchedRef = useRef(false);

  /* -------------------- Initial Load -------------------- */

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    console.log('🚀 Initial load - Page 1');

    dispatch(fetchAllPrescriptions({
      status: undefined,
      pageSize: PAGE_SIZE,
      continuationToken: null,
      reset: true
    }) as any);

    setCurrentPage(1);
    setTokensByPage({ 1: null });
  }, [dispatch]);

  /* -------------------- Prescription Details -------------------- */

  const loadPrescriptionDetails = useCallback(
    async (id: string) => {
      setLoadingDetails(true);
      try {
        await dispatch(fetchPrescriptionDetails(id) as any);
      } finally {
        setLoadingDetails(false);
      }
    },
    [dispatch]
  );

  /* -------------------- Search -------------------- */

  const executeSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim();

      setCurrentPage(1);
      setTokensByPage({ 1: null });

      if (!trimmed) {
        dispatch(fetchAllPrescriptions({
          status: statusFilter === 'All' ? undefined : statusFilter,
          pageSize: PAGE_SIZE,
          continuationToken: null,
          reset: true
        }) as any);
        return;
      }

      setIsSearching(true);
      try {
        await dispatch(searchPrescriptionsThunk({
          searchTerm: trimmed,
          pageSize: PAGE_SIZE,
          continuationToken: null,
          reset: true
        }) as any);
      } finally {
        setIsSearching(false);
      }
    },
    [dispatch, statusFilter]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      executeSearch(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, executeSearch]);

  /* -------------------- Status Filter -------------------- */

  const handleStatusChange = (newStatus: string) => {
    setStatusFilter(newStatus);
    setCurrentPage(1);
    setTokensByPage({ 1: null });

    if (!searchTerm.trim()) {
      dispatch(fetchAllPrescriptions({
        status: newStatus === 'All' ? undefined : newStatus,
        pageSize: PAGE_SIZE,
        continuationToken: null,
        reset: true
      }) as any);
    }
  };

  /* -------------------- Pagination -------------------- */

  const goToPage = (page: number) => {
    if (page === currentPage || loading) return;

    const token = tokensByPage[page];
    if (!token && page !== 1) return; // safety: no token and not page 1

    if (searchTerm.trim()) {
      dispatch(searchPrescriptionsThunk({
        searchTerm: searchTerm.trim(),
        pageSize: PAGE_SIZE,
        continuationToken: token || null,
        reset: true
      }) as any);
    } else {
      dispatch(fetchAllPrescriptions({
        status: statusFilter === 'All' ? undefined : statusFilter,
        pageSize: PAGE_SIZE,
        continuationToken: token || null,
        reset: true
      }) as any);
    }

    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (!continuationToken || loading) return;

    const nextPage = currentPage + 1;

    // Store token for back navigation
    setTokensByPage(prev => ({
      ...prev,
      [nextPage]: continuationToken
    }));

    // 🔥 PASS TOKEN DIRECTLY — DO NOT READ FROM STATE
    if (searchTerm.trim()) {
      dispatch(searchPrescriptionsThunk({
        searchTerm: searchTerm.trim(),
        pageSize: PAGE_SIZE,
        continuationToken: continuationToken,
        reset: true
      }) as any);
    } else {
      dispatch(fetchAllPrescriptions({
        status: statusFilter === 'All' ? undefined : statusFilter,
        pageSize: PAGE_SIZE,
        continuationToken: continuationToken,
        reset: true
      }) as any);
    }

    setCurrentPage(nextPage);
  };

  const goToPrevPage = () => {
    if (currentPage > 1 && !loading) {
      goToPage(currentPage - 1);
    }
  };

  const hasNextPage = !!continuationToken;

  /* -------------------- Derived Data -------------------- */

  const patientMap = useMemo(
    () => Object.fromEntries(patients.map(p => [p.id, p])),
    [patients]
  );

  /* -------------------- Helpers -------------------- */

  const formatDateTime = (date: string) => {
    try {
      return new Date(date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return date;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'created':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'approved':
      case 'reviewed':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'inpreparation':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'readyforpickup':
        return 'bg-teal-100 text-teal-700 border-teal-300';
      case 'completed':
      case 'active':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-700 border-red-300';
      case 'expired':
        return 'bg-gray-100 text-gray-700 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  const statusOptions = [
    'All',
    'Created',
    'Reviewed',
    'Active',
    'Completed',
    'Cancelled',
    'Expired'
  ];

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      loadPrescriptionDetails(id);
    }
  };

  /* -------------------- Render -------------------- */

  if (loading && prescriptions.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Loading prescriptions...</span>
      </div>
    );
  }


  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Prescription History
        </h1>
        <p className="text-gray-600 mt-1">
          View and track all prescription orders
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            {isSearching && (
              <Loader2 className="w-5 h-5 text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
            )}
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by prescription ID, patient ID, or patient name"
              className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="sm:w-64 relative">
            <Filter className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={e => handleStatusChange(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-gray-50 border border-gray-300 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">
            Prescriptions
          </h2>
        </div>

        {prescriptions.length === 0 && !loading ? (
          <div className="p-16 text-center">
            <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <div className="text-gray-900 text-xl font-medium mb-2">
              {searchTerm.trim()
                ? 'No prescriptions found'
                : 'No prescriptions available'}
            </div>
            {searchTerm.trim() && (
              <p className="text-gray-500">
                Try a different search term or clear the search
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-200">
              {prescriptions.map((prescription: PrescriptionSummary) => {
                const patient = patientMap[prescription.patientId];
                const expanded = expandedId === prescription.id;
                const doctorName = prescription.prescriberName || 'N/A';
                
                // Get details if this prescription is expanded and selected
                const details = (expanded && selected?.id === prescription.id) 
                  ? (selected as PrescriptionDetails) 
                  : null;

                return (
                  <div key={prescription.id} className="transition-colors hover:bg-gray-50">
                    <div
                      className="p-6 cursor-pointer select-none"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleExpand(prescription.id);
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 flex-1">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              Prescription ID
                            </div>
                            <div className="font-semibold text-gray-900">{prescription.id}</div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              Patient
                            </div>
                            <div className="font-semibold text-gray-900">
                              {prescription.patientName}
                            </div>
                            <div className="text-sm text-gray-500 mt-0.5">
                              {prescription.patientId}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              Doctor
                            </div>
                            <div className="font-medium text-gray-900">
                              {doctorName}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              Date
                            </div>
                            <div className="text-sm text-gray-900">
                              {formatDateTime(prescription.createdAt)}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                              Status
                            </div>
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold ${getStatusColor(
                                prescription.status
                              )}`}
                            >
                              {prescription.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex-shrink-0 ml-4">
                          {expanded ? (
                            <ChevronUp className="w-6 h-6 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </div>

                    {expanded && (
                      <div className="px-6 pb-6 border-t border-gray-100 bg-gray-50">
                        {loadingDetails ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                            <span className="ml-2 text-gray-600">Loading details...</span>
                          </div>
                        ) : details ? (
                          <div className="pt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Left Column - Medications */}
                            <div>
                              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <Pill className="w-5 h-5 mr-2 text-blue-600" />
                                Medications ({details.medicines?.length || 0})
                              </h3>
                              
                              {details.medicines && details.medicines.length > 0 ? (
                                <div className="space-y-3">
                                  {details.medicines.map((med: PrescriptionMedicine) => (
                                    <div key={med.prescriptionMedicineId} className="bg-white rounded-lg p-4 border border-gray-200">
                                      <div className="font-semibold text-gray-900 mb-2">
                                        {med.name} {med.strength}
                                      </div>
                                      
                                      <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                          <span className="text-gray-600">Dosage:</span>
                                          <span className="ml-1 font-medium text-gray-900">
                                            {med.prescribedQuantity} units
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Quantity:</span>
                                          <span className="ml-1 font-medium text-gray-900">
                                            {med.prescribedQuantity}
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Duration:</span>
                                          <span className="ml-1 font-medium text-gray-900">
                                            {med.daysSupply} days
                                          </span>
                                        </div>
                                        <div>
                                          <span className="text-gray-600">Refills:</span>
                                          <span className="ml-1 font-medium text-gray-900">
                                            {med.refillsRemaining}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      {med.instruction && (
                                        <div className="mt-3 pt-3 border-t border-gray-100">
                                          <span className="text-xs text-gray-500">Instructions:</span>
                                          <p className="text-sm text-gray-700 mt-1">{med.instruction}</p>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-gray-500 text-sm">
                                  No medications listed
                                </div>
                              )}

                              {patient && (
                                <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                                  <div className="flex items-center text-blue-900">
                                    <User className="w-5 h-5 mr-2 text-blue-600" />
                                    <div>
                                      <div className="font-semibold">{patient.name}</div>
                                      <div className="text-sm text-blue-700">{patient.id}</div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Right Column - Prescription Info */}
                            <div className="space-y-4">
                              <div className="bg-white p-5 rounded-lg border border-gray-200">
                                <div className="text-sm font-medium text-gray-500 mb-3">
                                  Prescription Information
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Status</span>
                                    <span className="font-semibold text-gray-900">
                                      {details.status}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Created</span>
                                    <span className="text-sm text-gray-900">
                                      {formatDateTime(details.createdAt)}
                                    </span>
                                  </div>
                                  {details.expiresAt && (
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Expires</span>
                                      <span className="text-sm text-gray-900">
                                        {formatDateTime(details.expiresAt)}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm text-gray-600">Refillable</span>
                                    <span className="text-sm text-gray-900">
                                      {details.isRefillable ? 'Yes' : 'No'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-8 text-center text-gray-500">
                            Failed to load prescription details
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {(hasNextPage || currentPage > 1) && (
              <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Page {currentPage}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={goToPrevPage}
                      disabled={currentPage <= 1 || loading}
                      className={`p-2 rounded-lg border transition-colors ${
                        currentPage <= 1 || loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                      aria-label="Previous page"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(currentPage + 1, 5) }, (_, i) => {
                        let pageNum;
                        const maxPages = currentPage + 1;
                        if (maxPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= maxPages - 2) {
                          pageNum = maxPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => goToPage(pageNum)}
                            disabled={loading}
                            className={`min-w-[40px] h-10 px-3 rounded-lg border font-medium transition-colors ${
                              currentPage === pageNum
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                            } ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      {hasNextPage && currentPage + 1 > 5 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                    </div>

                    <button
                      onClick={goToNextPage}
                      disabled={!hasNextPage || loading}
                      className={`p-2 rounded-lg border transition-colors ${
                        !hasNextPage || loading
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                      }`}
                      aria-label="Next page"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}