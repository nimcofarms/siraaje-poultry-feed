"use client";



import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type PurchasedEgg = {
  id: string;
  date: string;
  location: string;
  companyName: string;
  quantity: number;
  price: number;
  total: number;
  currency: string;
};

type EggSale = {
  id: string;
  date: string;
  customerType: string | null;
  companyName: string;
  quantity: number;
  price: number;
  total: number;
  currency: string;
};

type PurchaseForm = {
  date: string;
  location: string;
  companyName: string;
  quantity: string;
  price: string;
};

type SaleForm = {
  date: string;
  customerType: string;
  companyName: string;
  quantity: string;
  price: string;
};

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function formatCustomerType(customerType: string | null) {
  if (!customerType) return "—";
  if (customerType === "Dukaan") return "Dukaan / Shop";
  return customerType;
}

type Permissions = {
  dashboardView: boolean;
  expensesView: boolean;
  expensesAdd: boolean;
  expensesEdit: boolean;
  expensesDelete: boolean;
  eggsView: boolean;
  eggsAdd: boolean;
  eggsEdit: boolean;
  eggsDelete: boolean;
  feedsView: boolean;
  feedsAdd: boolean;
  feedsEdit: boolean;
  feedsDelete: boolean;
  poultryHealthView: boolean;
  poultryHealthAdd: boolean;
  poultryHealthEdit: boolean;
  poultryHealthDelete: boolean;
  documentsView: boolean;
  documentsAdd: boolean;
  documentsEdit: boolean;
  documentsDelete: boolean;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner: boolean;
  permissions: Permissions | null;
};

export default function EggsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);

  const [purchases, setPurchases] = useState<PurchasedEgg[]>([]);
  const [sales, setSales] = useState<EggSale[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingPurchase, setSavingPurchase] = useState(false);
  const [savingSale, setSavingSale] = useState(false);

  const [purchaseError, setPurchaseError] = useState("");
  const [saleError, setSaleError] = useState("");

  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [saleModalOpen, setSaleModalOpen] = useState(false);

  const [editingPurchaseId, setEditingPurchaseId] = useState<string | null>(
    null
  );
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);

  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const [purchaseForm, setPurchaseForm] = useState<PurchaseForm>({
    date: today(),
    location: "",
    companyName: "",
    quantity: "",
    price: "",
  });

  const [saleForm, setSaleForm] = useState<SaleForm>({
    date: today(),
    customerType: "",
    companyName: "",
    quantity: "",
    price: "",
  });

  const isOwner = currentUser?.isOwner === true;
  const canView = isOwner || currentUser?.permissions?.eggsView === true;
  const canAdd = isOwner || currentUser?.permissions?.eggsAdd === true;
  const canEdit = isOwner || currentUser?.permissions?.eggsEdit === true;
  const canDelete = isOwner || currentUser?.permissions?.eggsDelete === true;

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/me", { cache: "no-store" });
        const data = await response.json();

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok || !data.user) {
          throw new Error(data.error || "Could not load your account permissions.");
        }

        setCurrentUser(data.user);
      } catch (error) {
        console.error("Permission load error:", error);
      } finally {
        setPermissionLoading(false);
      }
    }

    void loadCurrentUser();
  }, [router]);

  async function loadEggs() {
    try {
      setLoading(true);

      const [purchaseResponse, salesResponse] = await Promise.all([
        fetch("/api/purchased-eggs", {
          cache: "no-store",
        }),
        fetch("/api/egg-sales", {
          cache: "no-store",
        }),
      ]);

      if (!purchaseResponse.ok) {
        throw new Error("Purchased eggs could not be loaded.");
      }

      if (!salesResponse.ok) {
        throw new Error("Egg sales could not be loaded.");
      }

      const purchaseData: PurchasedEgg[] = await purchaseResponse.json();
      const salesData: EggSale[] = await salesResponse.json();

      setPurchases(purchaseData);
      setSales(salesData);
    } catch (error) {
      console.error("Eggs page load error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!permissionLoading && currentUser && canView) {
      void loadEggs();
    }
  }, [permissionLoading, currentUser, canView]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  async function handleLogout() {
    try {
      setLoggingOut(true);

      const response = await fetch("/api/logout", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Logout failed");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  function resetPurchaseForm() {
    setPurchaseForm({
      date: today(),
      location: "",
      companyName: "",
      quantity: "",
      price: "",
    });

    setEditingPurchaseId(null);
    setPurchaseError("");
  }

  function resetSaleForm() {
    setSaleForm({
      date: today(),
      customerType: "",
      companyName: "",
      quantity: "",
      price: "",
    });

    setEditingSaleId(null);
    setSaleError("");
  }

  function openNewPurchase() {
    if (!canAdd) return;
    resetPurchaseForm();
    setPurchaseModalOpen(true);
  }

  function openNewSale() {
    if (!canAdd) return;
    resetSaleForm();
    setSaleModalOpen(true);
  }

  function openEditPurchase(expense: PurchasedEgg) {
    if (!canEdit) return;
    setEditingPurchaseId(expense.id);

    setPurchaseForm({
      date: expense.date.slice(0, 10),
      location: expense.location,
      companyName: expense.companyName,
      quantity: String(expense.quantity),
      price: String(expense.price),
    });

    setPurchaseError("");
    setPurchaseModalOpen(true);
  }

  function openEditSale(sale: EggSale) {
    if (!canEdit) return;
    setEditingSaleId(sale.id);

    setSaleForm({
      date: sale.date.slice(0, 10),
      customerType: sale.customerType ?? "",
      companyName: sale.companyName,
      quantity: String(sale.quantity),
      price: String(sale.price),
    });

    setSaleError("");
    setSaleModalOpen(true);
  }

  function closePurchaseModal() {
    if (savingPurchase) return;

    setPurchaseModalOpen(false);
    resetPurchaseForm();
  }

  function closeSaleModal() {
    if (savingSale) return;

    setSaleModalOpen(false);
    resetSaleForm();
  }

  async function handlePurchaseSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingPurchaseId ? !canEdit : !canAdd) return;

    try {
      setSavingPurchase(true);
      setPurchaseError("");

      const quantity = Number(purchaseForm.quantity);
      const price = Number(purchaseForm.price);

      if (
        !purchaseForm.date ||
        !purchaseForm.location.trim() ||
        !purchaseForm.companyName.trim()
      ) {
        setPurchaseError(
          "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields."
        );
        return;
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        setPurchaseError(
          "Tirada iyo qiimaha si sax ah u geli. / Enter a valid quantity and price."
        );
        return;
      }

      const response = await fetch("/api/purchased-eggs", {
        method: editingPurchaseId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingPurchaseId ? { id: editingPurchaseId } : {}),
          date: purchaseForm.date,
          location: purchaseForm.location.trim(),
          companyName: purchaseForm.companyName.trim(),
          quantity,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Purchased eggs could not be saved.");
      }

      await loadEggs();
      setPurchaseModalOpen(false);
      resetPurchaseForm();
    } catch (error) {
      setPurchaseError(
        error instanceof Error
          ? error.message
          : "Xogta lama kaydin karin. / Record could not be saved."
      );
    } finally {
      setSavingPurchase(false);
    }
  }

  async function handleSaleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (editingSaleId ? !canEdit : !canAdd) return;

    try {
      setSavingSale(true);
      setSaleError("");

      const quantity = Number(saleForm.quantity);
      const price = Number(saleForm.price);

      if (
        !saleForm.date ||
        !saleForm.customerType ||
        !saleForm.companyName.trim()
      ) {
        setSaleError(
          "Fadlan buuxi taariikhda, nooca macmiilka iyo magaca macmiilka. / Please complete the date, customer type and customer name."
        );
        return;
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        setSaleError(
          "Tirada iyo qiimaha si sax ah u geli. / Enter a valid quantity and price."
        );
        return;
      }

      const response = await fetch("/api/egg-sales", {
        method: editingSaleId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingSaleId ? { id: editingSaleId } : {}),
          date: saleForm.date,
          customerType: saleForm.customerType,
          companyName: saleForm.companyName.trim(),
          quantity,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Egg sale could not be saved.");
      }

      await loadEggs();
      setSaleModalOpen(false);
      resetSaleForm();
    } catch (error) {
      setSaleError(
        error instanceof Error
          ? error.message
          : "Iibka lama kaydin karin. / Sale could not be saved."
      );
    } finally {
      setSavingSale(false);
    }
  }

  async function deletePurchase(id: string) {
    if (!canDelete) return;
    const confirmed = window.confirm(
      "Ma hubtaa inaad tirtirayso diiwaankan? / Are you sure you want to delete this record?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/purchased-eggs?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      setPurchases((current) =>
        current.filter((purchase) => purchase.id !== id)
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Xogta lama tirtiri karin. / Record could not be deleted."
      );
    }
  }

  async function deleteSale(id: string) {
    if (!canDelete) return;
    const confirmed = window.confirm(
      "Ma hubtaa inaad tirtirayso iibkan? / Are you sure you want to delete this sale?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `/api/egg-sales?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      setSales((current) => current.filter((sale) => sale.id !== id));
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Iibka lama tirtiri karin. / Sale could not be deleted."
      );
    }
  }

  const purchasedQuantity = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.quantity || 0),
    0
  );

  const purchasedTotal = purchases.reduce(
    (sum, purchase) => sum + Number(purchase.total || 0),
    0
  );

  const soldQuantity = sales.reduce(
    (sum, sale) => sum + Number(sale.quantity || 0),
    0
  );

  const salesTotal = sales.reduce(
    (sum, sale) => sum + Number(sale.total || 0),
    0
  );

  const purchaseFormTotal =
    Number(purchaseForm.quantity || 0) * Number(purchaseForm.price || 0);

  const saleFormTotal =
    Number(saleForm.quantity || 0) * Number(saleForm.price || 0);

  if (permissionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ed]">
        <div className="rounded-3xl border border-[#e7e1d4] bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-green-100 border-t-[#075b35]" />
          <p className="mt-4 font-bold text-[#064b2c]">Checking access...</p>
        </div>
      </main>
    );
  }

  if (!currentUser) return null;

  if (!canView) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ed] px-5">
        <div className="max-w-lg rounded-3xl border border-[#e7e1d4] bg-white p-8 text-center shadow-sm">
          <div className="text-5xl">🔒</div>
          <h1 className="mt-4 text-2xl font-extrabold text-[#064b2c]">Access Not Allowed</h1>
          <p className="mt-3 text-slate-500">You do not have permission to view Eggs.</p>
          <Link href="/dashboard" className="mt-6 inline-flex rounded-xl bg-[#075b35] px-6 py-3 font-bold text-white">
            Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f5ed]">
      {/* HEADER */}
      <header className="relative z-40 border-b border-[#e5dfd0] bg-[#075b35] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="relative h-14 w-16 overflow-hidden rounded-xl bg-white">
              <Image
                src="/siraaje-logo.jpg"
                alt="Siraaje Poultry & Feeds Company"
                fill
                sizes="64px"
                className="object-contain"
                priority
              />
            </div>

            <div>
              <h1 className="text-xl font-extrabold sm:text-2xl">
                Siraaje Poultry Feed
              </h1>

              <p className="text-xs text-green-100 sm:text-sm">
                Nidaamka Maareynta Quudinta Digaagga
              </p>
            </div>
          </div>

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((current) => !current)}
              className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 transition hover:bg-white/15 sm:px-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-extrabold text-[#075b35]">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>

              <div className="hidden min-w-[80px] text-left sm:block">
                <p className="text-sm font-extrabold leading-tight">{currentUser.name}</p>
                <p className="mt-1 text-xs text-green-100">{isOwner ? "Maamule" : "Shaqaale"}</p>
              </div>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className={`hidden h-4 w-4 transition-transform sm:block ${
                  profileOpen ? "rotate-180" : ""
                }`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m6 9 6 6 6-6"
                />
              </svg>
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7f5eb] font-extrabold text-[#075b35]">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>

                  <div>
                    <p className="font-extrabold text-[#064b2c]">{currentUser.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{isOwner ? "Maamule" : "Shaqaale"}</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full rounded-xl px-3 py-3 text-left font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {loggingOut ? "Waa laga baxayaa..." : "Ka Bax / Logout"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[250px_1fr]">
        {/* SIDEBAR */}
        <aside className="h-fit rounded-3xl border border-[#e7e1d4] bg-white p-4 shadow-sm">
          <nav className="space-y-2">
            {(isOwner || currentUser.permissions?.dashboardView) && (
              <Link
                href="/dashboard"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-[#17452f] transition hover:bg-[#edf6ef]"
              >
                Dashboard
              </Link>
            )}

            {(isOwner || currentUser.permissions?.expensesView) && (
              <Link
                href="/dashboard/expenses"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-[#17452f] transition hover:bg-[#edf6ef]"
              >
                Kharashaadka / Expenses
              </Link>
            )}

            <Link
              href="/dashboard/eggs"
              className="flex items-center gap-3 rounded-2xl bg-[#075b35] px-4 py-3 font-bold text-white"
            >
              <span className="text-lg">🥚</span>
              Ukumaha / Eggs
            </Link>
          </nav>
        </aside>

        {/* CONTENT */}
        <section className="min-w-0">
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#b38420]">
              Maamulka / Management
            </p>

            <h2 className="mt-1 text-3xl font-extrabold text-[#064b2c] sm:text-4xl">
              Ukumaha / Eggs
            </h2>

            <p className="mt-2 text-slate-500">
              Maamul ukumaha la soo gatay iyo ukumaha la iibiyay. / Manage
              purchased and sold eggs.
            </p>
          </div>

          {/* SUMMARY */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">
                La Soo Gatay / Purchased
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#075b35]">
                {formatMoney(purchasedQuantity)}
              </p>
              <p className="mt-1 text-xs text-slate-400">Tirada / Amount</p>
            </div>

            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">
                Qiimaha Iibsiga / Purchase Cost
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#075b35]">
                {formatMoney(purchasedTotal)} ETB
              </p>
            </div>

            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">
                La Iibiyay / Sold
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#075b35]">
                {formatMoney(soldQuantity)}
              </p>
              <p className="mt-1 text-xs text-slate-400">Tirada / Amount</p>
            </div>

            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-slate-500">
                Dakhliga Iibka / Sales Revenue
              </p>
              <p className="mt-2 text-2xl font-extrabold text-[#075b35]">
                {formatMoney(salesTotal)} ETB
              </p>
            </div>
          </div>
                    {/* PURCHASED EGGS */}
          <div className="mt-7 overflow-hidden rounded-3xl border border-[#e7e1d4] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#eee9df] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  Ukumaha la soo gatay / Purchased Eggs
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Diiwaanka ukumaha shirkaddu soo iibsatay. / Record of eggs
                  purchased by the company.
                </p>
              </div>

              {canAdd && (


                <button
                type="button"
                onClick={openNewPurchase}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#075b35] px-5 font-bold text-white transition hover:bg-[#064b2c]"
              >
                + Ku Dar / Add
              </button>


              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Taariikhda / Date</th>
                    <th className="px-5 py-4">Goobta / Location</th>
                    <th className="px-5 py-4">Shirkadda / Company</th>
                    <th className="px-5 py-4">Tirada / Amount</th>
                    <th className="px-5 py-4">Qiimaha / Price</th>
                    <th className="px-5 py-4">Wadarta / Total</th>
                    {(canEdit || canDelete) && (
                      <th className="px-5 py-4 text-right">Maamul / Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={canEdit || canDelete ? 7 : 6}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        Xogta waa la soo qaadayaa... / Loading...
                      </td>
                    </tr>
                  ) : purchases.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canEdit || canDelete ? 7 : 6}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        Weli wax ukun ah lama diiwaangelin. / No purchased eggs
                        recorded yet.
                      </td>
                    </tr>
                  ) : (
                    purchases.map((purchase) => (
                      <tr key={purchase.id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                          {formatDate(purchase.date)}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium">
                          {purchase.location}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {purchase.companyName}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {formatMoney(purchase.quantity)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                          {formatMoney(purchase.price)} ETB
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-extrabold text-[#075b35]">
                          {formatMoney(purchase.total)} ETB
                        </td>

                        {(canEdit || canDelete) && (
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => openEditPurchase(purchase)}
                                  className="rounded-xl bg-[#edf6ef] px-3 py-2 text-sm font-bold text-[#075b35] transition hover:bg-[#dcefe1]"
                                >
                                  Beddel / Edit
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => deletePurchase(purchase.id)}
                                  className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                                >
                                  Tirtir / Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* SOLD EGGS */}
          <div className="mt-7 overflow-hidden rounded-3xl border border-[#e7e1d4] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#eee9df] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  Ukumaha la iibiyay / Eggs Sold
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Iibka hotel, restaurant, cafeteria ama dukaan. / Sales to
                  hotels, restaurants, cafeterias or shops.
                </p>
              </div>

              {canAdd && (


                <button
                type="button"
                onClick={openNewSale}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-[#b38420] px-5 font-bold text-white transition hover:bg-[#966d15]"
              >
                + Ku Dar Iib / Add Sale
              </button>


              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left">
                <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Taariikhda / Date</th>
                    <th className="px-5 py-4">
                      Nooca Macmiilka / Customer Type
                    </th>
                    <th className="px-5 py-4">
                      Magaca Macmiilka / Customer Name
                    </th>
                    <th className="px-5 py-4">Tirada / Amount</th>
                    <th className="px-5 py-4">Qiimaha / Price</th>
                    <th className="px-5 py-4">Wadarta / Total</th>
                    {(canEdit || canDelete) && (
                      <th className="px-5 py-4 text-right">Maamul / Actions</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={canEdit || canDelete ? 7 : 6}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        Xogta waa la soo qaadayaa... / Loading...
                      </td>
                    </tr>
                  ) : sales.length === 0 ? (
                    <tr>
                      <td
                        colSpan={canEdit || canDelete ? 7 : 6}
                        className="px-5 py-10 text-center text-slate-500"
                      >
                        Weli wax iib ukun ah lama diiwaangelin. / No egg sales
                        recorded yet.
                      </td>
                    </tr>
                  ) : (
                    sales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/70">
                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                          {formatDate(sale.date)}
                        </td>

                        <td className="px-5 py-4 text-sm font-bold text-slate-700">
                          {formatCustomerType(sale.customerType)}
                        </td>

                        <td className="px-5 py-4 text-sm font-medium">
                          {sale.companyName}
                        </td>

                        <td className="px-5 py-4 text-sm">
                          {formatMoney(sale.quantity)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm">
                          {formatMoney(sale.price)} ETB
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-sm font-extrabold text-[#075b35]">
                          {formatMoney(sale.total)} ETB
                        </td>

                        {(canEdit || canDelete) && (
                          <td className="px-5 py-4">
                            <div className="flex justify-end gap-2">
                              {canEdit && (
                                <button
                                  type="button"
                                  onClick={() => openEditSale(sale)}
                                  className="rounded-xl bg-[#edf6ef] px-3 py-2 text-sm font-bold text-[#075b35] transition hover:bg-[#dcefe1]"
                                >
                                  Beddel / Edit
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => deleteSale(sale.id)}
                                  className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
                                >
                                  Tirtir / Delete
                                </button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 Siraaje Poultry & Feeds Company
          </p>
        </section>
      </div>

      {/* PURCHASE MODAL */}
      {purchaseModalOpen && (editingPurchaseId ? canEdit : canAdd) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  {editingPurchaseId
                    ? "Beddel Ukunta / Edit Purchase"
                    : "Ukun La Soo Gatay / Purchased Eggs"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Geli xogta ukumaha la soo gatay. / Enter purchased egg
                  information.
                </p>
              </div>

              <button
                type="button"
                onClick={closePurchaseModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePurchaseSubmit} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Taariikhda / Date
                  </span>

                  <input
                    type="date"
                    required
                    value={purchaseForm.date}
                    onChange={(event) =>
                      setPurchaseForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Goobta / Location
                  </span>

                  <input
                    type="text"
                    required
                    placeholder="Tusaale: Jigjiga"
                    value={purchaseForm.location}
                    onChange={(event) =>
                      setPurchaseForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Magaca Shirkadda / Company Name
                  </span>

                  <input
                    type="text"
                    required
                    value={purchaseForm.companyName}
                    onChange={(event) =>
                      setPurchaseForm((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Tirada / Amount
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={purchaseForm.quantity}
                    onChange={(event) =>
                      setPurchaseForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Qiimaha / Price
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={purchaseForm.price}
                    onChange={(event) =>
                      setPurchaseForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-2xl bg-[#edf6ef] p-4">
                <p className="text-sm font-bold text-slate-500">
                  Wadarta / Total
                </p>

                <p className="mt-1 text-2xl font-extrabold text-[#075b35]">
                  {formatMoney(purchaseFormTotal)} ETB
                </p>
              </div>

              {purchaseError && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {purchaseError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closePurchaseModal}
                  disabled={savingPurchase}
                  className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Jooji / Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingPurchase}
                  className="rounded-2xl bg-[#075b35] px-6 py-3 font-bold text-white hover:bg-[#064b2c] disabled:opacity-50"
                >
                  {savingPurchase
                    ? "Waa la kaydinayaa..."
                    : editingPurchaseId
                      ? "Kaydi Isbeddelka / Save Changes"
                      : "Kaydi / Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SALE MODAL */}
      {saleModalOpen && (editingSaleId ? canEdit : canAdd) && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  {editingSaleId
                    ? "Beddel Iibka / Edit Sale"
                    : "Ukun La Iibiyay / Egg Sale"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Geli nooca macmiilka, magaca macmiilka iyo xogta iibka. /
                  Enter the customer type, customer name and sale information.
                </p>
              </div>

              <button
                type="button"
                onClick={closeSaleModal}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaleSubmit} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Taariikhda / Date
                  </span>

                  <input
                    type="date"
                    required
                    value={saleForm.date}
                    onChange={(event) =>
                      setSaleForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Nooca Macmiilka / Customer Type
                  </span>

                  <select
                    required
                    value={saleForm.customerType}
                    onChange={(event) =>
                      setSaleForm((current) => ({
                        ...current,
                        customerType: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  >
                    <option value="">Dooro / Select</option>
                    <option value="Dukaan">Dukaan / Shop</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Cafeteria">Cafeteria</option>
                  </select>
                </label>

                <label className="block sm:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Magaca Macmiilka / Customer Name
                  </span>

                  <input
                    type="text"
                    required
                    placeholder="Tusaale: Sheraton Hotel ama ABC Cafeteria"
                    value={saleForm.companyName}
                    onChange={(event) =>
                      setSaleForm((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Tirada / Amount
                  </span>

                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={saleForm.quantity}
                    onChange={(event) =>
                      setSaleForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">
                    Qiimaha / Price
                  </span>

                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={saleForm.price}
                    onChange={(event) =>
                      setSaleForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100"
                  />
                </label>
              </div>

              <div className="mt-5 rounded-2xl bg-[#fff7e5] p-4">
                <p className="text-sm font-bold text-slate-500">
                  Wadarta / Total
                </p>

                <p className="mt-1 text-2xl font-extrabold text-[#9a6b08]">
                  {formatMoney(saleFormTotal)} ETB
                </p>
              </div>

              {saleError && (
                <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {saleError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeSaleModal}
                  disabled={savingSale}
                  className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  Jooji / Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingSale}
                  className="rounded-2xl bg-[#b38420] px-6 py-3 font-bold text-white hover:bg-[#966d15] disabled:opacity-50"
                >
                  {savingSale
                    ? "Waa la kaydinayaa..."
                    : editingSaleId
                      ? "Kaydi Isbeddelka / Save Changes"
                      : "Kaydi Iibka / Save Sale"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
