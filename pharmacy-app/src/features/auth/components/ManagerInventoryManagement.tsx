import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CalendarX,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  LayoutDashboard,
  Package,
  Plus,
  RotateCcw,
  Search,
  X,
  XCircle,
} from "lucide-react";

import Breadcrumbs from "@components/common/BreadCrumps/Breadcrumbs";
import Button from "@components/common/Button/Button";
import Dropdown from "@components/common/Dropdown/Dropdown";
import Input from "@components/common/Input/Input";
import Modal from "@components/common/Modal/Modal";
import Textarea from "@components/common/TextArea/TextArea";
import { useToast } from "@components/common/Toast/useToast";
import { searchAllergies } from "@api/catalogs";
import {
  createManagerProduct,
  getManagerInventoryProducts,
  getManagerPendingInventoryLots,
  getManagerProductLots,
  reviewManagerInventoryLot,
  type CreateManagerProductPayload,
  type ManagerInventoryLotDto,
  type ManagerProductInventoryDto,
} from "@api/managerInventory";
import { logger } from "@utils/logger/logger";
import AllergySelector from "@patient/components/AllergySelector";

type Tab = "stock" | "add-medicine" | "restock-requests" | "expiry";

const PRODUCT_FORMS = ["Tablet", "Capsule", "Syrup", "Injection", "Cream", "Drops", "Inhaler"];

function getDaysUntilExpiry(expiryDate: string) {
  const today = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function getProductStockBadge(product: ManagerProductInventoryDto) {
  if (!product.isActive) return <span className="rounded-md border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700">Inactive</span>;
  if (product.totalQuantityAvailable <= 0) return <span className="rounded-md border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Unavailable</span>;
  return <span className="rounded-md border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">Available</span>;
}

function getInventoryLotBadge(status: string) {
  if (status === "Rejected") return <span className="rounded border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Rejected</span>;
  if (status === "Pending") return <span className="rounded border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Pending</span>;
  return <span className="rounded border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Approved</span>;
}

function formatBackendDate(value: string | null | undefined) {
  if (!value) return "Not set";

  return new Date(value).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getApiErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (error as { response?: { data?: unknown } }).response;
    const data = response?.data;

    if (typeof data === "object" && data !== null) {
      const problem = data as {
        detail?: unknown;
        title?: unknown;
        errors?: Record<string, string[]>;
      };

      if (typeof problem.detail === "string" && problem.detail.trim()) {
        return problem.detail;
      }

      if (typeof problem.title === "string" && problem.title.trim()) {
        return problem.title;
      }

      if (problem.errors && typeof problem.errors === "object") {
        const firstError = Object.values(problem.errors).flat().find((value) => typeof value === "string" && value.trim());
        if (firstError) return firstError;
      }
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Request failed.";
}

export default function ManagerInventoryManagement() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("stock");
  const [stockSearch, setStockSearch] = useState("");
  const [stockProducts, setStockProducts] = useState<ManagerProductInventoryDto[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isStockLoading, setIsStockLoading] = useState(true);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [lotsByProductId, setLotsByProductId] = useState<Record<string, ManagerInventoryLotDto[]>>({});
  const [lotsLoadingByProductId, setLotsLoadingByProductId] = useState<Record<string, boolean>>({});
  const [pendingLots, setPendingLots] = useState<ManagerInventoryLotDto[]>([]);
  const [isPendingLoading, setIsPendingLoading] = useState(true);

  const pendingRestocks = pendingLots.length;
  const expiringLots = useMemo(
    () =>
      stockProducts.reduce((sum, product) => (
        sum + product.inventoryLots.filter((lot) => lot.expiry && getDaysUntilExpiry(lot.expiry) <= 60).length
      ), 0),
    [stockProducts],
  );
  const visibleLotsCount = useMemo(
    () =>
      stockProducts.reduce((sum, product) => {
        const availableLots = lotsByProductId[product.id] ?? product.inventoryLots.filter((lot) => lot.status === "Approved" && lot.quantityAvailable > 0);
        return sum + availableLots.length;
      }, 0),
    [lotsByProductId, stockProducts],
  );

  const fetchStockProducts = useCallback(
    async (searchTerm: string) => {
      setIsStockLoading(true);

      try {
        const page = await getManagerInventoryProducts({
          name: searchTerm.trim() || undefined,
          sortBy: "name",
          sortDirection: "asc",
          pageNumber: 1,
          pageSize: 100,
        });

        setStockProducts(page.items);
        setTotalProducts(page.totalCount);
      } catch (error) {
        setStockProducts([]);
        setTotalProducts(0);
        toast.error("Inventory load failed", "Could not fetch products from the backend.");
        logger.error("Manager inventory stock fetch failed", { searchTerm, error });
      } finally {
        setIsStockLoading(false);
      }
    },
    [toast],
  );

  const fetchPendingLots = useCallback(
    async () => {
      setIsPendingLoading(true);

      try {
        const page = await getManagerPendingInventoryLots({ pageNumber: 1, pageSize: 100 });
        setPendingLots(page.items);
      } catch (error) {
        setPendingLots([]);
        toast.error("Pending requests load failed", "Could not fetch pending inventory requests.");
        logger.error("Manager pending lots fetch failed", { error });
      } finally {
        setIsPendingLoading(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void fetchStockProducts(stockSearch);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [fetchStockProducts, stockSearch]);

  useEffect(() => {
    void fetchPendingLots();
  }, [fetchPendingLots]);

  const handleToggleProductExpand = useCallback(
    async (productId: string) => {
      const isCurrentlyExpanded = expandedProducts.has(productId);

      if (isCurrentlyExpanded) {
        setExpandedProducts((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
        return;
      }

      setExpandedProducts((prev) => new Set(prev).add(productId));

      if (productId in lotsByProductId) return;

      setLotsLoadingByProductId((prev) => ({ ...prev, [productId]: true }));

      try {
        const lots = await getManagerProductLots(productId);
        setLotsByProductId((prev) => ({ ...prev, [productId]: lots }));
      } catch (error) {
        toast.error("Lot load failed", "Could not fetch lots for the selected product.");
        logger.error("Manager inventory product lots fetch failed", { productId, error });
      } finally {
        setLotsLoadingByProductId((prev) => ({ ...prev, [productId]: false }));
      }
    },
    [expandedProducts, lotsByProductId, toast],
  );

  const tabs: Array<{ id: Tab; label: string; icon: ReactNode; badge?: number }> = [
    { id: "stock", label: "Medicines & Stock", icon: <Package className="h-4 w-4" /> },
    { id: "add-medicine", label: "Add Medicine", icon: <Plus className="h-4 w-4" /> },
    { id: "restock-requests", label: "Restock Requests", icon: <ClipboardCheck className="h-4 w-4" />, badge: pendingRestocks },
    { id: "expiry", label: "Expiry Management", icon: <CalendarX className="h-4 w-4" />, badge: expiringLots },
  ];

  const productDetailsById = useMemo(
    () =>
      stockProducts.reduce<Record<string, ManagerProductInventoryDto>>((acc, product) => {
        acc[product.id] = product;
        return acc;
      }, {}),
    [stockProducts],
  );

  const handleCreateProduct = useCallback(
    async (payload: CreateManagerProductPayload) => {
      const response = await createManagerProduct(payload);
      toast.success("Product created", `${response.data.name} was added to the catalogue.`);
      await fetchStockProducts(stockSearch);
    },
    [fetchStockProducts, stockSearch, toast],
  );

  const handleApprovePendingLot = useCallback(
    async (lotId: string, quantity: number, expiry: string, supplierName: string) => {
      await reviewManagerInventoryLot(lotId, {
        approved: true,
        quantity,
        expiry,
        supplierName,
      });

      toast.success("Request approved", "The inventory lot was approved.");
      await Promise.all([fetchPendingLots(), fetchStockProducts(stockSearch)]);
    },
    [fetchPendingLots, fetchStockProducts, stockSearch, toast],
  );

  const handleRejectPendingLot = useCallback(
    async (lotId: string, rejectionReason: string) => {
      await reviewManagerInventoryLot(lotId, {
        approved: false,
        rejectionReason,
      });

      toast.success("Request rejected", "The inventory lot request was rejected.");
      await fetchPendingLots();
    },
    [fetchPendingLots, toast],
  );

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Dashboard", onClick: () => undefined, icon: <LayoutDashboard className="h-4 w-4" /> }, { label: "Inventory Management" }]} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-sm text-gray-500">{totalProducts || stockProducts.length} products · {visibleLotsCount} visible lots</p>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"}`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 ? (
                <span className={`flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold ${activeTab === tab.id ? "bg-blue-600 text-white" : "bg-amber-500 text-white"}`}>
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {activeTab === "stock" ? (
          <StockOverview
            products={stockProducts}
            search={stockSearch}
            onSearchChange={setStockSearch}
            isLoading={isStockLoading}
            expandedProducts={expandedProducts}
            onToggleExpand={handleToggleProductExpand}
            lotsByProductId={lotsByProductId}
            lotsLoadingByProductId={lotsLoadingByProductId}
          />
        ) : null}
        {activeTab === "add-medicine" ? <AddMedicineForm onCreateProduct={handleCreateProduct} onError={(message) => toast.error("Validation error", message)} /> : null}
        {activeTab === "restock-requests" ? <RestockRequestsPanel pendingLots={pendingLots} productDetailsById={productDetailsById} isLoading={isPendingLoading} onApprove={handleApprovePendingLot} onReject={handleRejectPendingLot} onError={(message) => toast.error("Validation error", message)} /> : null}
        {activeTab === "expiry" ? <ExpiryManagement products={stockProducts} onSuccess={(title, message) => toast.success(title, message)} /> : null}
      </div>
    </div>
  );
}

function StockOverview({
  products,
  search,
  onSearchChange,
  isLoading,
  expandedProducts,
  onToggleExpand,
  lotsByProductId,
  lotsLoadingByProductId,
}: {
  products: ManagerProductInventoryDto[];
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  expandedProducts: Set<string>;
  onToggleExpand: (productId: string) => void;
  lotsByProductId: Record<string, ManagerInventoryLotDto[]>;
  lotsLoadingByProductId: Record<string, boolean>;
}) {
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return products;

    return products.filter((product) =>
      product.name.toLowerCase().includes(term) ||
      product.manufacturer.toLowerCase().includes(term) ||
      product.strength.toLowerCase().includes(term) ||
      product.form.toLowerCase().includes(term),
    );
  }, [products, search]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search products..." value={search} onChange={(event) => onSearchChange(event.target.value)} className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-9 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500" />
        {search ? <button type="button" onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button> : null}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="w-8 px-4 py-3 text-left font-semibold text-gray-600"></th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Form</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Manufacturer</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Available Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-600">Lots</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading products...</td>
                </tr>
              ) : null}

              {!isLoading ? visibleProducts.map((product, index) => {
                const lots = lotsByProductId[product.id] ?? product.inventoryLots.filter((lot) => lot.status === "Approved" && lot.quantityAvailable > 0);
                const isExpanded = expandedProducts.has(product.id);
                const isLotsLoading = lotsLoadingByProductId[product.id] ?? false;

                return (
                  <Fragment key={product.id}>
                    <tr className={`cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50/60 ${index % 2 === 0 ? "" : "bg-gray-50/30"}`} onClick={() => void onToggleExpand(product.id)}>
                      <td className="px-4 py-3 text-gray-400">{isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}</td>
                      <td className="px-4 py-3"><div className="font-semibold text-gray-900">{product.name}</div><div className="text-xs text-gray-500">{product.strength} · {product.id}</div></td>
                      <td className="px-4 py-3 text-gray-700">{product.form}</td>
                      <td className="px-4 py-3 text-gray-600">{product.manufacturer}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">{product.totalQuantityAvailable.toLocaleString()}</td>
                      <td className="px-4 py-3">{getProductStockBadge(product)}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{lots.length}</td>
                    </tr>

                    {isExpanded ? (
                      <tr key={`${product.id}-expanded`} className="bg-blue-50/30">
                        <td colSpan={7} className="px-4 py-3">
                          <div className="ml-4 overflow-hidden rounded-lg border border-blue-100">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="border-b border-blue-100 bg-blue-50">
                                  <th className="px-3 py-2 text-left font-semibold text-blue-800">Lot ID</th>
                                  <th className="px-3 py-2 text-right font-semibold text-blue-800">Requested Qty</th>
                                  <th className="px-3 py-2 text-right font-semibold text-blue-800">Initial Qty</th>
                                  <th className="px-3 py-2 text-right font-semibold text-blue-800">Available Qty</th>
                                  <th className="px-3 py-2 text-left font-semibold text-blue-800">Expiry Date</th>
                                  <th className="px-3 py-2 text-left font-semibold text-blue-800">Supplier</th>
                                  <th className="px-3 py-2 text-left font-semibold text-blue-800">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {isLotsLoading ? <tr><td colSpan={7} className="px-3 py-3 text-center text-gray-400">Loading lots...</td></tr> : null}
                                {!isLotsLoading && lots.length === 0 ? <tr><td colSpan={7} className="px-3 py-3 text-center text-gray-400">No approved available lots found</td></tr> : null}
                                {!isLotsLoading ? lots.map((lot) => (
                                  <tr key={lot.id} className="border-b border-blue-50 last:border-0">
                                    <td className="px-3 py-2 font-mono font-medium text-gray-800">{lot.id}</td>
                                    <td className="px-3 py-2 text-right font-semibold text-gray-900">{lot.requestedQuantity}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">{lot.initialQuantity}</td>
                                    <td className="px-3 py-2 text-right text-gray-700">{lot.quantityAvailable}</td>
                                    <td className="px-3 py-2 text-gray-700">{formatBackendDate(lot.expiry)}</td>
                                    <td className="px-3 py-2 text-gray-600">{lot.supplierName || "Not provided"}</td>
                                    <td className="px-3 py-2">{getInventoryLotBadge(lot.status)}</td>
                                  </tr>
                                )) : null}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              }) : null}
            </tbody>
          </table>
        </div>
        {!isLoading && visibleProducts.length === 0 ? <div className="py-12 text-center text-gray-400">No products found</div> : null}
      </div>
    </div>
  );
}
function buildProductId(name: string, strength: string) {
  const base = `${name}-${strength}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  return `PRD-${base || "ITEM"}`;
}

function AddMedicineForm({
  onCreateProduct,
  onError,
}: {
  onCreateProduct: (payload: CreateManagerProductPayload) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [strength, setStrength] = useState("");
  const [form, setForm] = useState(PRODUCT_FORMS[0]);
  const [manufacturer, setManufacturer] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [taxPercent, setTaxPercent] = useState("");
  const [allergyQuery, setAllergyQuery] = useState("");
  const [allergyTags, setAllergyTags] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const clearForm = () => {
    setName("");
    setStrength("");
    setForm(PRODUCT_FORMS[0]);
    setManufacturer("");
    setUnitPrice("");
    setTaxPercent("");
    setAllergyQuery("");
    setAllergyTags([]);
    setIsActive(true);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !strength.trim() || !form || !manufacturer.trim() || !unitPrice || !taxPercent) {
      onError("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      await onCreateProduct({
        id: buildProductId(name, strength),
        name: name.trim(),
        strength: strength.trim(),
        form,
        manufacturer: manufacturer.trim(),
        isActive,
        allergyTags,
        interactions: [],
        unitPrice: Number.parseFloat(unitPrice),
        taxPercent: Number.parseFloat(taxPercent),
      });

      clearForm();
    } catch (error) {
      logger.error("Create manager product failed", { error });
      onError("Could not create product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="mb-6">
          <h3 className="mb-1 text-lg font-semibold text-gray-900">Add New Product to Catalogue</h3>
          <p className="text-sm text-gray-500">This posts directly to the manager product API and refreshes the stock tab.</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Product Name" value={name} onChange={setName} placeholder="e.g. Lisinopril" required />
            <Input label="Strength" value={strength} onChange={setStrength} placeholder="e.g. 10mg" required />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Dropdown label="Form" value={form} onChange={setForm} options={PRODUCT_FORMS} />
            <Input label="Manufacturer" value={manufacturer} onChange={setManufacturer} placeholder="e.g. Pfizer" required />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Input label="Unit Price" type="number" value={unitPrice} onChange={setUnitPrice} placeholder="e.g. 12.50" required />
            <Input label="Tax Percent" type="number" value={taxPercent} onChange={setTaxPercent} placeholder="e.g. 5" required />
          </div>

          <AllergySelector
            label="Allergy Tags"
            query={allergyQuery}
            onQueryChange={setAllergyQuery}
            selected={allergyTags}
            onAdd={(value) => {
              setAllergyTags((prev) => prev.includes(value) ? prev : [...prev, value]);
              setAllergyQuery("");
            }}
            onRemove={(value) => {
              setAllergyTags((prev) => prev.filter((item) => item !== value));
            }}
            searchFn={searchAllergies}
            placeholder="Type to search allergy catalog..."
          />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Product is active
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800">
            <Plus className="mr-2 h-4 w-4" />
            {isSubmitting ? "Creating..." : "Add Product"}
          </Button>
          <Button variant="secondary" onClick={clearForm}>Clear</Button>
        </div>
      </div>
    </div>
  );
}

function RestockRequestsPanel({
  pendingLots,
  productDetailsById,
  isLoading,
  onApprove,
  onReject,
  onError,
}: {
  pendingLots: ManagerInventoryLotDto[];
  productDetailsById: Record<string, ManagerProductInventoryDto>;
  isLoading: boolean;
  onApprove: (lotId: string, quantity: number, expiry: string, supplierName: string) => Promise<void>;
  onReject: (lotId: string, reason: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [selectedLot, setSelectedLot] = useState<ManagerInventoryLotDto | null>(null);
  const [approvedQuantity, setApprovedQuantity] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const stats = useMemo(() => ({
    pending: pendingLots.length,
  }), [pendingLots]);

  const closeApproveModal = () => {
    setApproveModal(false);
    setSelectedLot(null);
    setApprovedQuantity("");
    setSupplierName("");
    setExpiryDate("");
  };

  const closeRejectModal = () => {
    setRejectModal(false);
    setSelectedLot(null);
    setRejectionReason("");
  };

  const handleApprove = async () => {
    if (!selectedLot || !expiryDate || !approvedQuantity || !supplierName.trim()) {
      onError("Please provide quantity, supplier name, and expiry date.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove(selectedLot.id, Number.parseInt(approvedQuantity, 10), expiryDate, supplierName.trim());
      closeApproveModal();
    } catch (error) {
      logger.error("Approve pending lot failed", { error, lotId: selectedLot.id });
      onError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedLot || !rejectionReason.trim()) {
      onError("Please provide a rejection reason.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReject(selectedLot.id, rejectionReason.trim());
      closeRejectModal();
    } catch (error) {
      logger.error("Reject pending lot failed", { error, lotId: selectedLot.id });
      onError(getApiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-1">
        <InfoCard tone="amber" label="Pending Review" value={stats.pending} />
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Lot ID</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Product</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Requested Qty</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Requested By</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-400">Loading pending requests...</td></tr> : null}
              {!isLoading ? pendingLots.map((lot, index) => (
                <tr key={lot.id} className={`border-b border-gray-100 last:border-0 ${index % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{lot.id}</td>
                  <td className="px-4 py-3"><div className="font-semibold text-gray-900">{productDetailsById[lot.productId]?.name ?? lot.productId}</div><div className="text-xs text-gray-500">{productDetailsById[lot.productId]?.strength ?? "Pending lookup"}</div></td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{lot.requestedQuantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-700">{lot.workflow.requestedBy}</td>
                  <td className="px-4 py-3 text-gray-600">{formatBackendDate(lot.workflow.requestedAt)}</td>
                  <td className="px-4 py-3">{getInventoryLotBadge(lot.status)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => { setSelectedLot(lot); setApprovedQuantity(String(lot.requestedQuantity)); setApproveModal(true); }} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700">Approve</button>
                      <button type="button" onClick={() => { setSelectedLot(lot); setRejectModal(true); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100">Reject</button>
                    </div>
                  </td>
                </tr>
              )) : null}
            </tbody>
          </table>
        </div>
        {!isLoading && pendingLots.length === 0 ? <div className="py-12 text-center text-gray-400">No pending requests</div> : null}
      </div>

      <Modal isOpen={approveModal} onClose={closeApproveModal} className="w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl">
        <div className="border-b border-gray-100 px-6 pb-4 pt-5">
          <h2 className="text-xl font-semibold text-gray-900">Approve Restock Request</h2>
          <p className="mt-1 text-sm text-gray-600">Approving will review pending lot <strong>{selectedLot?.id}</strong> for {productDetailsById[selectedLot?.productId ?? ""]?.name ?? selectedLot?.productId}.</p>
        </div>
        <div className="space-y-3 px-6 py-4">
          <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm">
            <div className="mb-1 font-medium text-blue-900">Lot Details</div>
            <div className="text-blue-700">Product: {productDetailsById[selectedLot?.productId ?? ""]?.name ?? selectedLot?.productId}</div>
            <div className="text-blue-700">Requested: {selectedLot?.requestedQuantity} units</div>
          </div>
          <Input label="Approved Quantity" type="number" value={approvedQuantity} onChange={setApprovedQuantity} required />
          <Input label="Supplier Name" value={supplierName} onChange={setSupplierName} required />
          <Input label="Expiry Date for New Lot" type="date" value={expiryDate} onChange={setExpiryDate} required />
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <Button variant="secondary" onClick={closeApproveModal}>Cancel</Button>
          <Button onClick={() => void handleApprove()} disabled={isSubmitting} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle className="mr-2 h-4 w-4" />Approve & Create Lot</Button>
        </div>
      </Modal>

      <Modal isOpen={rejectModal} onClose={closeRejectModal} className="w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl">
        <div className="border-b border-gray-100 px-6 pb-4 pt-5">
          <h2 className="text-xl font-semibold text-gray-900">Reject Restock Request</h2>
          <p className="mt-1 text-sm text-gray-600">Rejecting pending lot {selectedLot?.id} for {productDetailsById[selectedLot?.productId ?? ""]?.name ?? selectedLot?.productId}.</p>
        </div>
        <div className="px-6 py-4">
          <label className="mb-1 block text-sm font-medium text-gray-900">Rejection Reason <span className="text-red-500">*</span></label>
          <Textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} placeholder="Explain why this request is being rejected..." rows={4} />
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <Button variant="secondary" onClick={closeRejectModal}>Cancel</Button>
          <Button onClick={() => void handleReject()} disabled={isSubmitting} variant="danger"><XCircle className="mr-2 h-4 w-4" />Reject Request</Button>
        </div>
      </Modal>
    </div>
  );
}

function ExpiryManagement({
  products,
  onSuccess,
}: {
  products: ManagerProductInventoryDto[];
  onSuccess: (title: string, message: string) => void;
}) {
  const [filter, setFilter] = useState<"all" | "expired" | "critical" | "warning">("all");
  const [confirmAction, setConfirmAction] = useState<{ type: "return" | "dispose"; lot: ManagerInventoryLotDto & { productName: string; strength: string; form: string; days: number; risk: "expired" | "critical" | "warning" | "ok" } } | null>(null);
  const [markedReturnedLotIds, setMarkedReturnedLotIds] = useState<Set<string>>(new Set());
  const [markedDisposedLotIds, setMarkedDisposedLotIds] = useState<Set<string>>(new Set());

  const enrichedLots = useMemo(() => products
    .flatMap((product) => product.inventoryLots.map((lot) => {
      const days = lot.expiry ? getDaysUntilExpiry(lot.expiry) : Number.POSITIVE_INFINITY;
      const risk = !lot.expiry ? "ok" : days <= 0 ? "expired" : days <= 14 ? "critical" : days <= 60 ? "warning" : "ok";
      return { ...lot, productName: product.name, strength: product.strength, form: product.form, days, risk };
    }))
    .filter((lot) => !markedReturnedLotIds.has(lot.id) && !markedDisposedLotIds.has(lot.id))
    .filter((lot) => lot.risk !== "ok")
    .sort((left, right) => left.days - right.days), [markedDisposedLotIds, markedReturnedLotIds, products]);

  const filteredLots = useMemo(() => filter === "all" ? enrichedLots : enrichedLots.filter((lot) => lot.risk === filter), [enrichedLots, filter]);
  const stats = useMemo(() => ({
    expired: enrichedLots.filter((lot) => lot.risk === "expired").length,
    critical: enrichedLots.filter((lot) => lot.risk === "critical").length,
    warning: enrichedLots.filter((lot) => lot.risk === "warning").length,
  }), [enrichedLots]);

  const handleConfirm = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "return") {
      setMarkedReturnedLotIds((prev) => new Set(prev).add(confirmAction.lot.id));
      onSuccess("Lot returned", `Lot ${confirmAction.lot.id} was marked as returned.`);
    } else {
      setMarkedDisposedLotIds((prev) => new Set(prev).add(confirmAction.lot.id));
      onSuccess("Marked as dispose", `Lot ${confirmAction.lot.id} was marked as dispose.`);
    }

    setConfirmAction(null);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ExpiryInfoCard tone="red" title="Expired Lots" subtitle="Require immediate action" value={stats.expired} />
        <ExpiryInfoCard tone="orange" title="Critical (<=14 days)" subtitle="Plan return/disposal" value={stats.critical} />
        <ExpiryInfoCard tone="amber" title="Warning (<=60 days)" subtitle="Monitor closely" value={stats.warning} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["all", "expired", "critical", "warning"] as const).map((value) => (
          <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-all ${filter === value ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {value === "all" ? "All" : value}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Medicine</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Lot ID</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-600">Qty</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Expiry Date</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Days Left</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Risk</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLots.map((lot, index) => (
                <tr key={lot.id} className={`border-b border-gray-100 last:border-0 ${index % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                  <td className="px-4 py-3"><div className="font-semibold text-gray-900">{lot.productName}</div><div className="text-xs text-gray-500">{lot.strength} · {lot.form}</div></td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{lot.id}</td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">{lot.quantityAvailable}</td>
                  <td className="px-4 py-3 text-gray-700">{formatBackendDate(lot.expiry)}</td>
                  <td className="px-4 py-3"><span className={`font-semibold ${lot.days <= 0 ? "text-red-600" : lot.days <= 14 ? "text-orange-600" : "text-amber-600"}`}>{lot.days <= 0 ? `${Math.abs(lot.days)}d ago` : `${lot.days}d`}</span></td>
                  <td className="px-4 py-3">{renderRiskBadge(lot.risk)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => setConfirmAction({ type: "return", lot })} className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"><RotateCcw className="h-3 w-3" />Return</button>
                      <button type="button" onClick={() => setConfirmAction({ type: "dispose", lot })} className="flex items-center gap-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"><XCircle className="h-3 w-3" />Mark as Dispose</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredLots.length === 0 ? <div className="py-12 text-center text-gray-400">No {filter === "all" ? "expiring" : filter} lots</div> : null}
      </div>

      <Modal isOpen={!!confirmAction} onClose={() => setConfirmAction(null)} className="w-full max-w-md rounded-2xl bg-white p-0 shadow-2xl">
        <div className="border-b border-gray-100 px-6 pb-4 pt-5">
          <h2 className="text-xl font-semibold text-gray-900">{confirmAction?.type === "return" ? "Mark Lot as Returned" : "Mark as Dispose"}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {confirmAction?.type === "return"
              ? `Lot ${confirmAction.lot.id} will be marked as returned in the current UI session.`
              : confirmAction ? `Lot ${confirmAction.lot.id} will be marked as dispose in the current UI session.` : ""}
          </p>
        </div>
        <div className="px-6 py-4">
          <div className="space-y-1 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="flex justify-between gap-4"><span className="text-gray-500">Medicine:</span><span className="font-medium text-gray-900">{confirmAction?.lot.productName}</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Lot ID:</span><span className="font-mono text-gray-900">{confirmAction?.lot.id}</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Quantity:</span><span className="font-medium text-gray-900">{confirmAction?.lot.quantityAvailable} units</span></div>
            <div className="flex justify-between gap-4"><span className="text-gray-500">Expiry Date:</span><span className="font-medium text-gray-900">{confirmAction ? formatBackendDate(confirmAction.lot.expiry) : ""}</span></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
          <Button onClick={handleConfirm} className={confirmAction?.type === "return" ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 hover:bg-gray-800"}>
            {confirmAction?.type === "return" ? <><RotateCcw className="mr-2 h-4 w-4" />Confirm Return</> : <><XCircle className="mr-2 h-4 w-4" />Confirm Mark as Dispose</>}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
function renderRiskBadge(risk: string) {
  if (risk === "expired") return <span className="rounded-md border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Expired</span>;
  if (risk === "critical") return <span className="rounded-md border border-orange-200 bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">Critical</span>;
  return <span className="rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Warning</span>;
}

function InfoCard({ tone, label, value }: { tone: "amber" | "emerald" | "red"; label: string; value: number }) {
  const toneMap = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-red-200 bg-red-50 text-red-700",
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${toneMap[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </div>
  );
}

function ExpiryInfoCard({ tone, title, subtitle, value }: { tone: "red" | "orange" | "amber"; title: string; subtitle: string; value: number }) {
  const toneMap = {
    red: "border-red-200 bg-red-50 text-red-700",
    orange: "border-orange-200 bg-orange-50 text-orange-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  } as const;

  return (
    <div className={`rounded-xl border p-4 ${toneMap[tone]}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{title}</div>
          <div className="mt-0.5 text-xs opacity-80">{subtitle}</div>
        </div>
        <span className="text-2xl font-bold">{value}</span>
      </div>
    </div>
  );
}




