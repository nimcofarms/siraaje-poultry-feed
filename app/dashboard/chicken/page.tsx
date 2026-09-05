"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

type AgeUnit = "DAY" | "WEEK" | "MONTH";

type LiveChickenRecord = {
  id: string;
  date: string;
  chickenType: string;
  location: string;
  ageNumber: number;
  ageUnit: AgeUnit;
  quantity: number;
  price: number;
  total: number;
  currency: string;
};

type MeatPurchase = {
  id: string;
  date: string;
  location: string;
  companyName: string;
  quantity: number;
  price: number;
  total: number;
  currency: string;
};

type MeatSale = {
  id: string;
  date: string;
  location: string;
  customerType: string;
  branch: string;
  quantity: number;
  price: number;
  total: number;
  currency: string;
};

type LiveForm = {
  date: string;
  chickenType: string;
  location: string;
  ageNumber: string;
  ageUnit: AgeUnit;
  quantity: string;
  price: string;
};

type MeatPurchaseForm = {
  date: string;
  location: string;
  companyName: string;
  quantity: string;
  price: string;
};

type MeatSaleForm = {
  date: string;
  location: string;
  customerType: string;
  branch: string;
  quantity: string;
  price: string;
};

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

  chickenView: boolean;
  chickenAdd: boolean;
  chickenEdit: boolean;
  chickenDelete: boolean;

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

type MainTab = "LIVE" | "MEAT";
type SubTab = "PURCHASES" | "SALES";

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

function formatAgeUnit(unit: string) {
  if (unit === "DAY") return "Maalin / Day";
  if (unit === "WEEK") return "Toddobaad / Week";
  if (unit === "MONTH") return "Bil / Month";
  return unit;
}

function formatCustomerType(value: string) {
  const types: Record<string, string> = {
    HOTEL: "Hotel",
    RESTAURANT: "Restaurant",
    CAFE: "Cafe",
    DUKAAN: "Dukaan / Shop",
    SHAQSI: "Shaqsi / Individual",
    XAAFAD: "Xaafad / Neighborhood",
    ANOTHER: "Kale / Another",
  };

  return types[value] ?? value;
}

export default function ChickenPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [permissionLoading, setPermissionLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const [mainTab, setMainTab] = useState<MainTab>("LIVE");
  const [subTab, setSubTab] = useState<SubTab>("PURCHASES");

  const [livePurchases, setLivePurchases] = useState<LiveChickenRecord[]>([]);
  const [liveSales, setLiveSales] = useState<LiveChickenRecord[]>([]);
  const [meatPurchases, setMeatPurchases] = useState<MeatPurchase[]>([]);
  const [meatSales, setMeatSales] = useState<MeatSale[]>([]);

  const [liveModalOpen, setLiveModalOpen] = useState(false);
  const [meatPurchaseModalOpen, setMeatPurchaseModalOpen] = useState(false);
  const [meatSaleModalOpen, setMeatSaleModalOpen] = useState(false);

  const [editingLiveId, setEditingLiveId] = useState<string | null>(null);
  const [editingMeatPurchaseId, setEditingMeatPurchaseId] = useState<
    string | null
  >(null);
  const [editingMeatSaleId, setEditingMeatSaleId] = useState<string | null>(
    null
  );

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const [liveForm, setLiveForm] = useState<LiveForm>({
    date: today(),
    chickenType: "",
    location: "",
    ageNumber: "",
    ageUnit: "DAY",
    quantity: "",
    price: "",
  });

  const [meatPurchaseForm, setMeatPurchaseForm] =
    useState<MeatPurchaseForm>({
      date: today(),
      location: "",
      companyName: "",
      quantity: "",
      price: "",
    });

  const [meatSaleForm, setMeatSaleForm] = useState<MeatSaleForm>({
    date: today(),
    location: "",
    customerType: "",
    branch: "",
    quantity: "",
    price: "",
  });

  const isOwner = currentUser?.isOwner === true;

  const canView =
    isOwner || currentUser?.permissions?.chickenView === true;

  const canAdd =
    isOwner || currentUser?.permissions?.chickenAdd === true;

  const canEdit =
    isOwner || currentUser?.permissions?.chickenEdit === true;

  const canDelete =
    isOwner || currentUser?.permissions?.chickenDelete === true;

  useEffect(() => {
    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/me", {
          cache: "no-store",
        });

        const data = await response.json();

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (!response.ok || !data.user) {
          throw new Error(
            data.error || "Could not load your account permissions."
          );
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

  async function loadChickenData() {
    try {
      setLoading(true);

      const responses = await Promise.all([
        fetch("/api/live-chicken-purchases", {
          cache: "no-store",
        }),
        fetch("/api/live-chicken-sales", {
          cache: "no-store",
        }),
        fetch("/api/chicken-meat-purchases", {
          cache: "no-store",
        }),
        fetch("/api/chicken-meat-sales", {
          cache: "no-store",
        }),
      ]);

      if (responses.some((response) => !response.ok)) {
        throw new Error("Chicken data could not be loaded.");
      }

      const [
        livePurchaseData,
        liveSaleData,
        meatPurchaseData,
        meatSaleData,
      ] = await Promise.all(responses.map((response) => response.json()));

      setLivePurchases(livePurchaseData);
      setLiveSales(liveSaleData);
      setMeatPurchases(meatPurchaseData);
      setMeatSales(meatSaleData);
    } catch (error) {
      console.error("Chicken page load error:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!permissionLoading && currentUser && canView) {
      void loadChickenData();
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
        throw new Error("Logout failed.");
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  function resetLiveForm() {
    setLiveForm({
      date: today(),
      chickenType: "",
      location: "",
      ageNumber: "",
      ageUnit: "DAY",
      quantity: "",
      price: "",
    });

    setEditingLiveId(null);
    setFormError("");
  }

  function resetMeatPurchaseForm() {
    setMeatPurchaseForm({
      date: today(),
      location: "",
      companyName: "",
      quantity: "",
      price: "",
    });

    setEditingMeatPurchaseId(null);
    setFormError("");
  }

  function resetMeatSaleForm() {
    setMeatSaleForm({
      date: today(),
      location: "",
      customerType: "",
      branch: "",
      quantity: "",
      price: "",
    });

    setEditingMeatSaleId(null);
    setFormError("");
  }

  function openNewRecord() {
    if (!canAdd) return;

    setFormError("");

    if (mainTab === "LIVE") {
      resetLiveForm();
      setLiveModalOpen(true);
      return;
    }

    if (subTab === "PURCHASES") {
      resetMeatPurchaseForm();
      setMeatPurchaseModalOpen(true);
      return;
    }

    resetMeatSaleForm();
    setMeatSaleModalOpen(true);
  }

  function openEditLive(record: LiveChickenRecord) {
    if (!canEdit) return;

    setEditingLiveId(record.id);

    setLiveForm({
      date: record.date.slice(0, 10),
      chickenType: record.chickenType,
      location: record.location,
      ageNumber: String(record.ageNumber),
      ageUnit: record.ageUnit,
      quantity: String(record.quantity),
      price: String(record.price),
    });

    setFormError("");
    setLiveModalOpen(true);
  }

  function openEditMeatPurchase(record: MeatPurchase) {
    if (!canEdit) return;

    setEditingMeatPurchaseId(record.id);

    setMeatPurchaseForm({
      date: record.date.slice(0, 10),
      location: record.location,
      companyName: record.companyName,
      quantity: String(record.quantity),
      price: String(record.price),
    });

    setFormError("");
    setMeatPurchaseModalOpen(true);
  }

  function openEditMeatSale(record: MeatSale) {
    if (!canEdit) return;

    setEditingMeatSaleId(record.id);

    setMeatSaleForm({
      date: record.date.slice(0, 10),
      location: record.location,
      customerType: record.customerType,
      branch: record.branch,
      quantity: String(record.quantity),
      price: String(record.price),
    });

    setFormError("");
    setMeatSaleModalOpen(true);
  }

  function closeLiveModal() {
    if (saving) return;
    setLiveModalOpen(false);
    resetLiveForm();
  }

  function closeMeatPurchaseModal() {
    if (saving) return;
    setMeatPurchaseModalOpen(false);
    resetMeatPurchaseForm();
  }

  function closeMeatSaleModal() {
    if (saving) return;
    setMeatSaleModalOpen(false);
    resetMeatSaleForm();
  }

  async function handleLiveSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (editingLiveId ? !canEdit : !canAdd) return;

    try {
      setSaving(true);
      setFormError("");

      const ageNumber = Number(liveForm.ageNumber);
      const quantity = Number(liveForm.quantity);
      const price = Number(liveForm.price);

      if (
        !liveForm.date ||
        !liveForm.chickenType.trim() ||
        !liveForm.location.trim() ||
        !Number.isInteger(ageNumber) ||
        ageNumber <= 0 ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        setFormError(
          "Fadlan xogta oo dhan si sax ah u geli. / Please enter all required information correctly."
        );
        return;
      }

      const endpoint =
        subTab === "PURCHASES"
          ? "/api/live-chicken-purchases"
          : "/api/live-chicken-sales";

      const response = await fetch(endpoint, {
        method: editingLiveId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingLiveId ? { id: editingLiveId } : {}),
          date: liveForm.date,
          chickenType: liveForm.chickenType.trim(),
          location: liveForm.location.trim(),
          ageNumber,
          ageUnit: liveForm.ageUnit,
          quantity,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Record could not be saved.");
      }

      await loadChickenData();
      setLiveModalOpen(false);
      resetLiveForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Xogta lama kaydin karin. / Record could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleMeatPurchaseSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (editingMeatPurchaseId ? !canEdit : !canAdd) return;

    try {
      setSaving(true);
      setFormError("");

      const quantity = Number(meatPurchaseForm.quantity);
      const price = Number(meatPurchaseForm.price);

      if (
        !meatPurchaseForm.date ||
        !meatPurchaseForm.location.trim() ||
        !meatPurchaseForm.companyName.trim() ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        setFormError(
          "Fadlan xogta oo dhan si sax ah u geli. / Please enter all required information correctly."
        );
        return;
      }

      const response = await fetch("/api/chicken-meat-purchases", {
        method: editingMeatPurchaseId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingMeatPurchaseId
            ? { id: editingMeatPurchaseId }
            : {}),
          date: meatPurchaseForm.date,
          location: meatPurchaseForm.location.trim(),
          companyName: meatPurchaseForm.companyName.trim(),
          quantity,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Purchase could not be saved.");
      }

      await loadChickenData();
      setMeatPurchaseModalOpen(false);
      resetMeatPurchaseForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Xogta lama kaydin karin. / Record could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleMeatSaleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (editingMeatSaleId ? !canEdit : !canAdd) return;

    try {
      setSaving(true);
      setFormError("");

      const quantity = Number(meatSaleForm.quantity);
      const price = Number(meatSaleForm.price);

      if (
        !meatSaleForm.date ||
        !meatSaleForm.location.trim() ||
        !meatSaleForm.customerType ||
        !meatSaleForm.branch.trim() ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        setFormError(
          "Fadlan xogta oo dhan si sax ah u geli. / Please enter all required information correctly."
        );
        return;
      }

      const response = await fetch("/api/chicken-meat-sales", {
        method: editingMeatSaleId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingMeatSaleId ? { id: editingMeatSaleId } : {}),
          date: meatSaleForm.date,
          location: meatSaleForm.location.trim(),
          customerType: meatSaleForm.customerType,
          branch: meatSaleForm.branch.trim(),
          quantity,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sale could not be saved.");
      }

      await loadChickenData();
      setMeatSaleModalOpen(false);
      resetMeatSaleForm();
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "Iibka lama kaydin karin. / Sale could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(id: string) {
    if (!canDelete) return;

    const confirmed = window.confirm(
      "Ma hubtaa inaad tirtirayso diiwaankan? / Are you sure you want to delete this record?"
    );

    if (!confirmed) return;

    let endpoint = "";

    if (mainTab === "LIVE") {
      endpoint =
        subTab === "PURCHASES"
          ? "/api/live-chicken-purchases"
          : "/api/live-chicken-sales";
    } else {
      endpoint =
        subTab === "PURCHASES"
          ? "/api/chicken-meat-purchases"
          : "/api/chicken-meat-sales";
    }

    try {
      const response = await fetch(endpoint, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Delete failed.");
      }

      await loadChickenData();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "Xogta lama tirtiri karin. / Record could not be deleted."
      );
    }
  }

  const currentLiveRecords =
    subTab === "PURCHASES" ? livePurchases : liveSales;

  const currentMeatRecords =
    subTab === "PURCHASES" ? meatPurchases : meatSales;

  const currentRecords =
    mainTab === "LIVE" ? currentLiveRecords : currentMeatRecords;

  const currentQuantity = currentRecords.reduce(
    (sum, record) => sum + Number(record.quantity || 0),
    0
  );

  const currentTotal = currentRecords.reduce(
    (sum, record) => sum + Number(record.total || 0),
    0
  );

  const livePurchaseQuantity = livePurchases.reduce(
    (sum, record) => sum + Number(record.quantity || 0),
    0
  );

  const liveSaleQuantity = liveSales.reduce(
    (sum, record) => sum + Number(record.quantity || 0),
    0
  );

  const meatPurchaseQuantity = meatPurchases.reduce(
    (sum, record) => sum + Number(record.quantity || 0),
    0
  );

  const meatSaleQuantity = meatSales.reduce(
    (sum, record) => sum + Number(record.quantity || 0),
    0
  );

  const liveFormTotal =
    Number(liveForm.quantity || 0) * Number(liveForm.price || 0);

  const meatPurchaseFormTotal =
    Number(meatPurchaseForm.quantity || 0) *
    Number(meatPurchaseForm.price || 0);

  const meatSaleFormTotal =
    Number(meatSaleForm.quantity || 0) *
    Number(meatSaleForm.price || 0);

  if (permissionLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ed]">
        <div className="rounded-3xl border border-[#e7e1d4] bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-green-100 border-t-[#075b35]" />
          <p className="mt-4 font-bold text-[#064b2c]">
            Checking access...
          </p>
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

          <h1 className="mt-4 text-2xl font-extrabold text-[#064b2c]">
            Access Not Allowed
          </h1>

          <p className="mt-3 text-slate-500">
            You do not have permission to view Chicken.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-[#075b35] px-6 py-3 font-bold text-white"
          >
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
                <p className="text-sm font-extrabold leading-tight">
                  {currentUser.name}
                </p>

                <p className="mt-1 text-xs text-green-100">
                  {isOwner ? "Maamule" : "Shaqaale"}
                </p>
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
                    <p className="font-extrabold text-[#064b2c]">
                      {currentUser.name}
                    </p>

                    <p className="mt-0.5 text-sm text-slate-500">
                      {isOwner ? "Maamule" : "Shaqaale"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="w-full rounded-xl px-3 py-3 text-left font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
                    {loggingOut
                      ? "Waa laga baxayaa..."
                      : "Ka Bax / Logout"}
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

            {(isOwner || currentUser.permissions?.eggsView) && (
              <Link
                href="/dashboard/eggs"
                className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-[#17452f] transition hover:bg-[#edf6ef]"
              >
                <span className="text-lg">🥚</span>
                Ukumaha / Eggs
              </Link>
            )}

            <Link
              href="/dashboard/chicken"
              className="flex items-center gap-3 rounded-2xl bg-[#075b35] px-4 py-3 font-bold text-white"
            >
              <span className="text-lg">🐔</span>
              Digaag / Chicken
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
              Digaag / Chicken
            </h2>

            <p className="mt-2 text-slate-500">
              Maamul digaagga nool iyo hilibka digaagga la soo iibsaday
              ama la iibiyay. / Manage live chicken and chicken meat
              purchases and sales.
            </p>
          </div>

          {/* SUMMARY */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Nool La Soo Gatay / Live Purchased"
              value={formatMoney(livePurchaseQuantity)}
              subtitle="Tirada / Quantity"
            />

            <SummaryCard
              title="Nool La Iibiyay / Live Sold"
              value={formatMoney(liveSaleQuantity)}
              subtitle="Tirada / Quantity"
            />

            <SummaryCard
              title="Hilib La Soo Gatay / Meat Purchased"
              value={formatMoney(meatPurchaseQuantity)}
              subtitle="Tirada / Quantity"
            />

            <SummaryCard
              title="Hilib La Iibiyay / Meat Sold"
              value={formatMoney(meatSaleQuantity)}
              subtitle="Tirada / Quantity"
            />
          </div>

          {/* MAIN TABS */}
          <div className="mt-7 rounded-3xl border border-[#e7e1d4] bg-white p-3 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setMainTab("LIVE");
                  setSubTab("PURCHASES");
                }}
                className={`rounded-2xl px-5 py-4 text-left transition ${
                  mainTab === "LIVE"
                    ? "bg-[#075b35] text-white"
                    : "bg-[#f8faf8] text-[#17452f] hover:bg-[#edf6ef]"
                }`}
              >
                <p className="text-lg font-extrabold">
                  🐔 Nool Nool / Live Chicken
                </p>

                <p
                  className={`mt-1 text-sm ${
                    mainTab === "LIVE"
                      ? "text-green-100"
                      : "text-slate-500"
                  }`}
                >
                  Digaagga nool ee la soo iibsaday iyo kuwa la iibiyay.
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMainTab("MEAT");
                  setSubTab("PURCHASES");
                }}
                className={`rounded-2xl px-5 py-4 text-left transition ${
                  mainTab === "MEAT"
                    ? "bg-[#075b35] text-white"
                    : "bg-[#f8faf8] text-[#17452f] hover:bg-[#edf6ef]"
                }`}
              >
                <p className="text-lg font-extrabold">
                  🍗 Hilib / Chicken Meat
                </p>

                <p
                  className={`mt-1 text-sm ${
                    mainTab === "MEAT"
                      ? "text-green-100"
                      : "text-slate-500"
                  }`}
                >
                  Hilibka digaagga la soo iibsaday iyo iibkiisa.
                </p>
              </button>
            </div>
          </div>

          {/* SUB TABS */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setSubTab("PURCHASES")}
              className={`rounded-2xl px-5 py-3 font-bold transition ${
                subTab === "PURCHASES"
                  ? "bg-[#075b35] text-white"
                  : "border border-[#e7e1d4] bg-white text-[#17452f]"
              }`}
            >
              Soo Iibsaday / Purchases
            </button>

            <button
              type="button"
              onClick={() => setSubTab("SALES")}
              className={`rounded-2xl px-5 py-3 font-bold transition ${
                subTab === "SALES"
                  ? "bg-[#b38420] text-white"
                  : "border border-[#e7e1d4] bg-white text-[#17452f]"
              }`}
            >
              Sii Iibiyay / Sales
            </button>
          </div>

          {/* CURRENT SECTION SUMMARY */}
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <SummaryCard
              title={
                subTab === "PURCHASES"
                  ? "Tirada La Soo Gatay / Purchased Quantity"
                  : "Tirada La Iibiyay / Sold Quantity"
              }
              value={formatMoney(currentQuantity)}
              subtitle={
                mainTab === "LIVE"
                  ? "Digaag / Chickens"
                  : "Hilib / Chicken Meat"
              }
            />

            <SummaryCard
              title={
                subTab === "PURCHASES"
                  ? "Qiimaha Iibsiga / Purchase Cost"
                  : "Dakhliga Iibka / Sales Revenue"
              }
              value={`${formatMoney(currentTotal)} ETB`}
              subtitle="Wadarta / Total"
            />
          </div>

          {/* TABLE */}
          <div className="mt-7 overflow-hidden rounded-3xl border border-[#e7e1d4] bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-[#eee9df] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  {mainTab === "LIVE"
                    ? subTab === "PURCHASES"
                      ? "Digaagga Nool La Soo Gatay / Live Chicken Purchases"
                      : "Digaagga Nool La Iibiyay / Live Chicken Sales"
                    : subTab === "PURCHASES"
                      ? "Hilibka La Soo Gatay / Chicken Meat Purchases"
                      : "Hilibka La Iibiyay / Chicken Meat Sales"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Diiwaanka maamulka digaagga. / Chicken management
                  records.
                </p>
              </div>

              {canAdd && (
                <button
                  type="button"
                  onClick={openNewRecord}
                  className={`inline-flex min-h-11 items-center justify-center rounded-2xl px-5 font-bold text-white transition ${
                    subTab === "SALES"
                      ? "bg-[#b38420] hover:bg-[#966d15]"
                      : "bg-[#075b35] hover:bg-[#064b2c]"
                  }`}
                >
                  {subTab === "SALES"
                    ? "+ Ku Dar Iib / Add Sale"
                    : "+ Ku Dar / Add"}
                </button>
              )}
            </div>

            {mainTab === "LIVE" ? (
              <LiveTable
                records={currentLiveRecords}
                loading={loading}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={openEditLive}
                onDelete={deleteRecord}
              />
            ) : subTab === "PURCHASES" ? (
              <MeatPurchaseTable
                records={meatPurchases}
                loading={loading}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={openEditMeatPurchase}
                onDelete={deleteRecord}
              />
            ) : (
              <MeatSaleTable
                records={meatSales}
                loading={loading}
                canEdit={canEdit}
                canDelete={canDelete}
                onEdit={openEditMeatSale}
                onDelete={deleteRecord}
              />
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 Siraaje Poultry & Feeds Company
          </p>
        </section>
      </div>

      {/* LIVE CHICKEN MODAL */}
      {liveModalOpen && (editingLiveId ? canEdit : canAdd) && (
        <Modal
          title={
            editingLiveId
              ? "Beddel Digaagga / Edit Chicken"
              : subTab === "PURCHASES"
                ? "Digaag La Soo Gatay / Live Chicken Purchase"
                : "Digaag La Iibiyay / Live Chicken Sale"
          }
          description="Geli xogta digaagga nool. / Enter live chicken information."
          onClose={closeLiveModal}
        >
          <form onSubmit={handleLiveSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Taariikhda / Date">
                <input
                  type="date"
                  required
                  value={liveForm.date}
                  onChange={(event) =>
                    setLiveForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Nooca Digaagga / Chicken Type">
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Broiler"
                  value={liveForm.chickenType}
                  onChange={(event) =>
                    setLiveForm((current) => ({
                      ...current,
                      chickenType: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Goobta / Location">
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Jigjiga"
                  value={liveForm.location}
                  onChange={(event) =>
                    setLiveForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Da'da / Age">
                <div className="grid grid-cols-[1fr_1.3fr] gap-2">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    placeholder="1"
                    value={liveForm.ageNumber}
                    onChange={(event) =>
                      setLiveForm((current) => ({
                        ...current,
                        ageNumber: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />

                  <select
                    value={liveForm.ageUnit}
                    onChange={(event) =>
                      setLiveForm((current) => ({
                        ...current,
                        ageUnit: event.target.value as AgeUnit,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="DAY">Maalin / Day</option>
                    <option value="WEEK">Toddobaad / Week</option>
                    <option value="MONTH">Bil / Month</option>
                  </select>
                </div>
              </Field>

              <Field label="Tirada / Quantity">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={liveForm.quantity}
                  onChange={(event) =>
                    setLiveForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Qiimaha Halkii Digaag / Price Per Chicken">
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={liveForm.price}
                  onChange={(event) =>
                    setLiveForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <TotalBox value={liveFormTotal} />

            {formError && <ErrorBox message={formError} />}

            <ModalButtons
              saving={saving}
              editing={Boolean(editingLiveId)}
              onCancel={closeLiveModal}
            />
          </form>
        </Modal>
      )}

      {/* MEAT PURCHASE MODAL */}
      {meatPurchaseModalOpen &&
        (editingMeatPurchaseId ? canEdit : canAdd) && (
          <Modal
            title={
              editingMeatPurchaseId
                ? "Beddel Iibsiga Hilibka / Edit Meat Purchase"
                : "Hilib La Soo Gatay / Chicken Meat Purchase"
            }
            description="Geli shirkadda iyo xogta hilibka la soo gatay. / Enter the supplier and purchase information."
            onClose={closeMeatPurchaseModal}
          >
            <form onSubmit={handleMeatPurchaseSubmit}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Taariikhda / Date">
                  <input
                    type="date"
                    required
                    value={meatPurchaseForm.date}
                    onChange={(event) =>
                      setMeatPurchaseForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Goobta / Location">
                  <input
                    type="text"
                    required
                    placeholder="Tusaale: Jigjiga"
                    value={meatPurchaseForm.location}
                    onChange={(event) =>
                      setMeatPurchaseForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Shirkadda / Company">
                  <input
                    type="text"
                    required
                    value={meatPurchaseForm.companyName}
                    onChange={(event) =>
                      setMeatPurchaseForm((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Tirada / Quantity">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={meatPurchaseForm.quantity}
                    onChange={(event) =>
                      setMeatPurchaseForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>

                <Field label="Qiimaha / Price">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={meatPurchaseForm.price}
                    onChange={(event) =>
                      setMeatPurchaseForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </Field>
              </div>

              <TotalBox value={meatPurchaseFormTotal} />

              {formError && <ErrorBox message={formError} />}

              <ModalButtons
                saving={saving}
                editing={Boolean(editingMeatPurchaseId)}
                onCancel={closeMeatPurchaseModal}
              />
            </form>
          </Modal>
        )}

      {/* MEAT SALE MODAL */}
      {meatSaleModalOpen && (editingMeatSaleId ? canEdit : canAdd) && (
        <Modal
          title={
            editingMeatSaleId
              ? "Beddel Iibka Hilibka / Edit Meat Sale"
              : "Hilib La Iibiyay / Chicken Meat Sale"
          }
          description="Geli macmiilka iyo xogta iibka. / Enter customer and sale information."
          onClose={closeMeatSaleModal}
        >
          <form onSubmit={handleMeatSaleSubmit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Taariikhda / Date">
                <input
                  type="date"
                  required
                  value={meatSaleForm.date}
                  onChange={(event) =>
                    setMeatSaleForm((current) => ({
                      ...current,
                      date: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Goobta / Location">
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Jigjiga"
                  value={meatSaleForm.location}
                  onChange={(event) =>
                    setMeatSaleForm((current) => ({
                      ...current,
                      location: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Nooca Macmiilka / Customer Type">
                <select
                  required
                  value={meatSaleForm.customerType}
                  onChange={(event) =>
                    setMeatSaleForm((current) => ({
                      ...current,
                      customerType: event.target.value,
                    }))
                  }
                  className={inputClass}
                >
                  <option value="">Dooro / Select</option>
                  <option value="HOTEL">Hotel</option>
                  <option value="RESTAURANT">Restaurant</option>
                  <option value="CAFE">Cafe</option>
                  <option value="DUKAAN">Dukaan / Shop</option>
                  <option value="SHAQSI">Shaqsi / Individual</option>
                  <option value="XAAFAD">Xaafad / Neighborhood</option>
                  <option value="ANOTHER">Kale / Another</option>
                </select>
              </Field>

              <Field label="Laanta / Branch">
                <input
                  type="text"
                  required
                  placeholder="Tusaale: Sheraton Hotel - Main Branch"
                  value={meatSaleForm.branch}
                  onChange={(event) =>
                    setMeatSaleForm((current) => ({
                      ...current,
                      branch: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Tirada / Quantity">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={meatSaleForm.quantity}
                  onChange={(event) =>
                    setMeatSaleForm((current) => ({
                      ...current,
                      quantity: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Qiimaha / Price">
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={meatSaleForm.price}
                  onChange={(event) =>
                    setMeatSaleForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                  className={inputClass}
                />
              </Field>
            </div>

            <TotalBox value={meatSaleFormTotal} gold />

            {formError && <ErrorBox message={formError} />}

            <ModalButtons
              saving={saving}
              editing={Boolean(editingMeatSaleId)}
              onCancel={closeMeatSaleModal}
              gold
            />
          </form>
        </Modal>
      )}
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-[#075b35] focus:ring-2 focus:ring-green-100";

function SummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div className="rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-slate-500">{title}</p>

      <p className="mt-2 text-2xl font-extrabold text-[#075b35]">
        {value}
      </p>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

function TotalBox({
  value,
  gold = false,
}: {
  value: number;
  gold?: boolean;
}) {
  return (
    <div
      className={`mt-5 rounded-2xl p-4 ${
        gold ? "bg-[#fff7e5]" : "bg-[#edf6ef]"
      }`}
    >
      <p className="text-sm font-bold text-slate-500">Wadarta / Total</p>

      <p
        className={`mt-1 text-2xl font-extrabold ${
          gold ? "text-[#9a6b08]" : "text-[#075b35]"
        }`}
      >
        {formatMoney(value)} ETB
      </p>
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {message}
    </div>
  );
}

function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-extrabold text-[#064b2c]">
              {title}
            </h3>

            <p className="mt-1 text-sm text-slate-500">{description}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function ModalButtons({
  saving,
  editing,
  onCancel,
  gold = false,
}: {
  saving: boolean;
  editing: boolean;
  onCancel: () => void;
  gold?: boolean;
}) {
  return (
    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="rounded-2xl border border-slate-300 px-5 py-3 font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
      >
        Jooji / Cancel
      </button>

      <button
        type="submit"
        disabled={saving}
        className={`rounded-2xl px-6 py-3 font-bold text-white disabled:opacity-50 ${
          gold
            ? "bg-[#b38420] hover:bg-[#966d15]"
            : "bg-[#075b35] hover:bg-[#064b2c]"
        }`}
      >
        {saving
          ? "Waa la kaydinayaa..."
          : editing
            ? "Kaydi Isbeddelka / Save Changes"
            : "Kaydi / Save"}
      </button>
    </div>
  );
}

function LiveTable({
  records,
  loading,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  records: LiveChickenRecord[];
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (record: LiveChickenRecord) => void;
  onDelete: (id: string) => void;
}) {
  const columns = canEdit || canDelete ? 8 : 7;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4">Taariikhda / Date</th>
            <th className="px-5 py-4">Nooca / Type</th>
            <th className="px-5 py-4">Goobta / Location</th>
            <th className="px-5 py-4">Da&apos;da / Age</th>
            <th className="px-5 py-4">Tirada / Quantity</th>
            <th className="px-5 py-4">Qiimaha / Price</th>
            <th className="px-5 py-4">Wadarta / Total</th>

            {(canEdit || canDelete) && (
              <th className="px-5 py-4 text-right">
                Maamul / Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td
                colSpan={columns}
                className="px-5 py-10 text-center text-slate-500"
              >
                Xogta waa la soo qaadayaa... / Loading...
              </td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td
                colSpan={columns}
                className="px-5 py-10 text-center text-slate-500"
              >
                Weli wax xog ah lama diiwaangelin. / No records yet.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-5 py-4 text-sm">
                  {formatDate(record.date)}
                </td>

                <td className="px-5 py-4 text-sm font-bold">
                  {record.chickenType}
                </td>

                <td className="px-5 py-4 text-sm">
                  {record.location}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm">
                  {record.ageNumber} {formatAgeUnit(record.ageUnit)}
                </td>

                <td className="px-5 py-4 text-sm">
                  {formatMoney(record.quantity)}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm">
                  {formatMoney(record.price)} ETB
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm font-extrabold text-[#075b35]">
                  {formatMoney(record.total)} ETB
                </td>

                {(canEdit || canDelete) && (
                  <ActionCell
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => onEdit(record)}
                    onDelete={() => onDelete(record.id)}
                  />
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function MeatPurchaseTable({
  records,
  loading,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  records: MeatPurchase[];
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (record: MeatPurchase) => void;
  onDelete: (id: string) => void;
}) {
  const columns = canEdit || canDelete ? 7 : 6;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px] text-left">
        <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4">Taariikhda / Date</th>
            <th className="px-5 py-4">Goobta / Location</th>
            <th className="px-5 py-4">Shirkadda / Company</th>
            <th className="px-5 py-4">Tirada / Quantity</th>
            <th className="px-5 py-4">Qiimaha / Price</th>
            <th className="px-5 py-4">Wadarta / Total</th>

            {(canEdit || canDelete) && (
              <th className="px-5 py-4 text-right">
                Maamul / Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td
                colSpan={columns}
                className="px-5 py-10 text-center text-slate-500"
              >
                Xogta waa la soo qaadayaa... / Loading...
              </td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td
                colSpan={columns}
                className="px-5 py-10 text-center text-slate-500"
              >
                Weli wax xog ah lama diiwaangelin. / No records yet.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-5 py-4 text-sm">
                  {formatDate(record.date)}
                </td>

                <td className="px-5 py-4 text-sm">
                  {record.location}
                </td>

                <td className="px-5 py-4 text-sm font-medium">
                  {record.companyName}
                </td>

                <td className="px-5 py-4 text-sm">
                  {formatMoney(record.quantity)}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm">
                  {formatMoney(record.price)} ETB
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm font-extrabold text-[#075b35]">
                  {formatMoney(record.total)} ETB
                </td>

                {(canEdit || canDelete) && (
                  <ActionCell
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => onEdit(record)}
                    onDelete={() => onDelete(record.id)}
                  />
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function MeatSaleTable({
  records,
  loading,
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  records: MeatSale[];
  loading: boolean;
  canEdit: boolean;
  canDelete: boolean;
  onEdit: (record: MeatSale) => void;
  onDelete: (id: string) => void;
}) {
  const columns = canEdit || canDelete ? 8 : 7;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1100px] text-left">
        <thead className="bg-[#f8faf8] text-xs uppercase tracking-wide text-slate-500">
          <tr>
            <th className="px-5 py-4">Taariikhda / Date</th>
            <th className="px-5 py-4">Goobta / Location</th>
            <th className="px-5 py-4">Macmiilka / Customer</th>
            <th className="px-5 py-4">Laanta / Branch</th>
            <th className="px-5 py-4">Tirada / Quantity</th>
            <th className="px-5 py-4">Qiimaha / Price</th>
            <th className="px-5 py-4">Wadarta / Total</th>

            {(canEdit || canDelete) && (
              <th className="px-5 py-4 text-right">
                Maamul / Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td
                colSpan={columns}
                className="px-5 py-10 text-center text-slate-500"
              >
                Xogta waa la soo qaadayaa... / Loading...
              </td>
            </tr>
          ) : records.length === 0 ? (
            <tr>
              <td
                colSpan={columns}
                className="px-5 py-10 text-center text-slate-500"
              >
                Weli wax iib ah lama diiwaangelin. / No sales yet.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr key={record.id} className="hover:bg-slate-50/70">
                <td className="whitespace-nowrap px-5 py-4 text-sm">
                  {formatDate(record.date)}
                </td>

                <td className="px-5 py-4 text-sm">
                  {record.location}
                </td>

                <td className="px-5 py-4 text-sm font-bold">
                  {formatCustomerType(record.customerType)}
                </td>

                <td className="px-5 py-4 text-sm">
                  {record.branch}
                </td>

                <td className="px-5 py-4 text-sm">
                  {formatMoney(record.quantity)}
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm">
                  {formatMoney(record.price)} ETB
                </td>

                <td className="whitespace-nowrap px-5 py-4 text-sm font-extrabold text-[#075b35]">
                  {formatMoney(record.total)} ETB
                </td>

                {(canEdit || canDelete) && (
                  <ActionCell
                    canEdit={canEdit}
                    canDelete={canDelete}
                    onEdit={() => onEdit(record)}
                    onDelete={() => onDelete(record.id)}
                  />
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function ActionCell({
  canEdit,
  canDelete,
  onEdit,
  onDelete,
}: {
  canEdit: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <td className="px-5 py-4">
      <div className="flex justify-end gap-2">
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="rounded-xl bg-[#edf6ef] px-3 py-2 text-sm font-bold text-[#075b35] transition hover:bg-[#dcefe1]"
          >
            Beddel / Edit
          </button>
        )}

        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100"
          >
            Tirtir / Delete
          </button>
        )}
      </div>
    </td>
  );
}