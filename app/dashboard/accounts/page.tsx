"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

// =========================================================
// TYPES
// =========================================================

type AccountCategory =
  | "expenses"
  | "eggs"
  | "feeds"
  | "chicken";

type EntryType =
  | "PURCHASE"
  | "SALE"
  | "EXPENSE";

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

  accountsView: boolean;

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
  permissions: Permissions | null;
};

type AuditUser = {
  id: string;
  name: string;
  role: string;
};

type AccountEntry = {
  id: string;
  date: string;
  category: AccountCategory;
  categoryLabel: string;
  type: EntryType;
  source: string;
  description: string;
  location: string | null;
  party: string | null;
  quantity: number | null;
  unitPrice: number | null;
  total: number;
  currency: string;
  createdAt: string;
  createdBy: AuditUser | null;
  feedType?: string | null;
};

type TransactionFilter =
  | "ALL"
  | "PURCHASE"
  | "SALE"
  | "EXPENSE";

type FeedTypeFilter =
  | "ALL"
  | "Starter"
  | "Grower"
  | "Layer";

type ProductionEntry = {
  id: string;
  batchId: string;
  itemId: string;
  date: string;
  location: string;
  feedType: string;
  bagSizeKg: number;
  quantity: number;
  totalKg: number;
  createdAt: string;
  createdBy: AuditUser | null;
};

type ProductionFeedSummary = {
  feedType: string;
  batches: number;
  records: number;
  bags: number;
  totalKg: number;
};

type CurrencySummary = {
  currency: string;
  sales: number;
  purchases: number;
  expenses: number;
  outgoing: number;
  netResult: number;
  records: number;
};

type CategorySummary = {
  category: AccountCategory;
  label: string;
  currency: string;
  sales: number;
  purchases: number;
  expenses: number;
  outgoing: number;
  netResult: number;
  records: number;
};

type AccountsResponse = {
  success: boolean;

  month: string;

  period: {
    start: string;
    endExclusive: string;
  };

  selectedCategories: AccountCategory[];

  filters: {
    categories: AccountCategory[];
    transaction: TransactionFilter;
    company: string;
    feedType: FeedTypeFilter;
  };

  availableCategories: {
    value: AccountCategory;
    label: string;
  }[];

  availableTransactions: {
    value: TransactionFilter;
    label: string;
  }[];

  availableParties: string[];

  availableFeedTypes: {
    value: FeedTypeFilter;
    label: string;
  }[];

  summary: {
    totalRecords: number;
    currencies: CurrencySummary[];
    categories: CategorySummary[];
  };

  entries: AccountEntry[];

  production: {
    totalBatches: number;
    totalRecords: number;
    totalBags: number;
    totalKg: number;
    byFeedType: ProductionFeedSummary[];
    entries: ProductionEntry[];
  };
};

const CATEGORY_OPTIONS: {
  value: AccountCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "chicken",
    label: "Digaag",
    description:
      "Digaagga nool iyo hilibka digaagga ee la soo iibsaday ama la iibiyay.",
  },
  {
    value: "eggs",
    label: "Ukumo",
    description:
      "Ukumaha la soo iibsaday iyo kuwa la iibiyay.",
  },
  {
    value: "feeds",
    label: "Quudinta",
    description:
      "Quudinta la soo iibsaday, la iibiyay iyo wax-soo-saarka bishan.",
  },
  {
    value: "expenses",
    label: "Kharashaadka",
    description:
      "Kharashaadka guud, dhismaha iyo alaabta.",
  },
];

// =========================================================
// HELPERS
// =========================================================

function getCurrentMonth() {
  const now = new Date();

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  return `${year}-${month}`;
}

function formatMoney(
  amount: number,
  currency: string
) {
  try {
    return (
      new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount) + ` ${currency}`
    );
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatNumber(value: number | null) {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatMonthLabel(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  const [year, monthNumber] = month
    .split("-")
    .map(Number);

  const monthNames = [
    "Janaayo",
    "Febraayo",
    "Maarso",
    "Abriil",
    "Maajo",
    "Juun",
    "Luulyo",
    "Agoosto",
    "Sebtembar",
    "Oktoobar",
    "Nofeembar",
    "Diseembar",
  ];

  return `${monthNames[monthNumber - 1]} ${year}`;
}

function isOwnerOrAdmin(user: CurrentUser | null) {
  if (!user) {
    return false;
  }

  return (
    user.role === "OWNER" ||
    user.role === "ADMIN"
  );
}

function typeLabel(type: EntryType) {
  if (type === "SALE") {
    return "Iib";
  }

  if (type === "PURCHASE") {
    return "Soo Iibsi";
  }

  return "Kharash";
}

function typeClass(type: EntryType) {
  if (type === "SALE") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (type === "PURCHASE") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-red-50 text-red-700 border-red-200";
}

// =========================================================
// PAGE
// =========================================================

export default function MonthlyAccountsPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [authLoading, setAuthLoading] =
    useState(true);

  const [month, setMonth] =
    useState(getCurrentMonth());

  const [transaction, setTransaction] =
    useState<TransactionFilter>("ALL");

  const [company, setCompany] =
    useState("ALL");

  const [feedType, setFeedType] =
    useState<FeedTypeFilter>("ALL");

  const [selectedCategories, setSelectedCategories] =
    useState<AccountCategory[]>(
      CATEGORY_OPTIONS.map(
        (category) => category.value
      )
    );

  const [data, setData] =
    useState<AccountsResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // =======================================================
  // AUTH
  // =======================================================

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      try {
        setAuthLoading(true);
        setError("");

        const response = await fetch("/api/me", {
          cache: "no-store",
        });

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Akoonkaaga lama soo gelin karin."
          );
        }

        if (!active) {
          return;
        }

        const user = result.user as CurrentUser;

        const allowed =
          isOwnerOrAdmin(user) ||
          user.permissions?.accountsView === true;

        if (!allowed) {
          router.replace("/dashboard");
          return;
        }

        setCurrentUser(user);
      } catch (error) {
        if (!active) {
          return;
        }

        setError(
          error instanceof Error
            ? error.message
            : "Akoonkaaga lama soo gelin karin."
        );
      } finally {
        if (active) {
          setAuthLoading(false);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, [router]);

  // =======================================================
  // LOAD MONTHLY ACCOUNTS
  // =======================================================

  const loadAccounts = useCallback(async () => {
    if (selectedCategories.length === 0) {
      setData(null);
      setError(
        "Fadlan dooro ugu yaraan hal qayb."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const categories =
        selectedCategories.join(",");

      const query =
        new URLSearchParams({
          month,
          categories,
          transaction,
          company: company === "ALL" ? "" : company,
          feedType,
        });

      const response = await fetch(
        `/api/accounts/monthly?${query.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      if (response.status === 403) {
        router.replace("/dashboard");
        return;
      }

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Xisaabta bishan lama soo gelin karin."
        );
      }

      setData(result);
    } catch (error) {
      setData(null);

      setError(
        error instanceof Error
          ? error.message
          : "Xisaabta bishan lama soo gelin karin."
      );
    } finally {
      setLoading(false);
    }
  }, [
    month,
    router,
    selectedCategories,
    transaction,
    company,
    feedType,
  ]);

  useEffect(() => {
    if (
      authLoading ||
      !currentUser
    ) {
      return;
    }

    void loadAccounts();
  }, [
    authLoading,
    currentUser,
    loadAccounts,
  ]);

  // =======================================================
  // CATEGORY SELECTION
  // =======================================================

  function toggleCategory(
    category: AccountCategory
  ) {
    setSelectedCategories((current) => {
      if (current.includes(category)) {
        return current.filter(
          (item) => item !== category
        );
      }

      return [...current, category];
    });
  }

  function selectAllCategories() {
    setSelectedCategories(
      CATEGORY_OPTIONS.map(
        (category) => category.value
      )
    );
  }

  function clearCategories() {
    setSelectedCategories([]);
    setData(null);
  }

  const allSelected =
    selectedCategories.length ===
    CATEGORY_OPTIONS.length;

  const currencyCount =
    data?.summary.currencies.length || 0;

  const monthLabel =
    useMemo(
      () => formatMonthLabel(month),
      [month]
    );

  // =======================================================
  // PRINT
  // =======================================================

  function printAccounts() {
    window.print();
  }

  // =======================================================
  // LOADING AUTH
  // =======================================================

  if (authLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ed] px-5">
        <div className="rounded-3xl border border-[#e7e1d4] bg-white px-8 py-10 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#d9eadf] border-t-[#075b35]" />

          <p className="font-extrabold text-[#064b2c]">
            Xisaabta waa la soo gelinayaa...
          </p>
        </div>
      </main>
    );
  }

  // =======================================================
  // PAGE UI
  // =======================================================

  return (
    <main className="min-h-screen bg-[#f7f5ed]">
      {/* HEADER */}
      <header className="print:hidden border-b border-[#e5dfd0] bg-[#075b35] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
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

          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
            <p className="text-sm font-bold">
              Xisaab Xirka Bilaha
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[250px_1fr] print:block print:max-w-none print:px-0 print:py-0">
        {/* SIDEBAR */}
        <aside className="print:hidden h-fit rounded-3xl border border-[#e7e1d4] bg-white p-4 shadow-sm">
          <nav className="space-y-2">
            <SidebarLink
              href="/dashboard"
              text="Bogga Guud"
            />

            <SidebarLink
              href="/dashboard/expenses"
              text="Kharashaadka"
            />

            <SidebarLink
              href="/dashboard/eggs"
              text="Ukumaha"
            />

            <SidebarLink
              href="/dashboard/chicken"
              text="Digaagga"
            />

            <SidebarLink
              href="/dashboard/feeds"
              text="Quudinta"
            />

            <SidebarLink
              href="/dashboard/documents"
              text="Dukumentiyada"
            />

            <SidebarLink
              href="/dashboard/poultry-health"
              text="Caafimaadka Digaagga"
            />

            {isOwnerOrAdmin(currentUser) && (
              <SidebarLink
                href="/dashboard/workers"
                text="Shaqaalaha & Ogolaanshaha"
              />
            )}

            <div className="my-4 border-t border-[#e7e1d4]" />

            <p className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#9a7a32]">
              Xisaabaadka
            </p>

            <Link
              href="/dashboard/accounts"
              className="flex items-center gap-3 rounded-2xl bg-[#075b35] px-4 py-3 font-bold text-white"
            >
              <AccountsIcon />

              <span>
                Xisaab Xirka Bilaha
              </span>
            </Link>
          </nav>
        </aside>

        {/* CONTENT */}
        <section className="min-w-0">
          {/* PRINT HEADER */}
          <div className="hidden print:mb-8 print:block">
            <div className="border-b-2 border-[#075b35] pb-4">
              <h1 className="text-2xl font-extrabold">
                Siraaje Poultry & Feeds Company
              </h1>

              <p className="mt-1 font-semibold">
                Xisaab Xirka Bisha — {monthLabel}
              </p>
            </div>
          </div>

          {/* TITLE */}
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#b38420]">
                Xisaabaadka
              </p>

              <h2 className="mt-1 text-3xl font-extrabold text-[#064b2c] sm:text-4xl">
                Xisaab Xir
              </h2>

              <p className="mt-2 max-w-3xl text-slate-500">
                Eeg iibka, wax iibsiga iyo kharashaadka
                la diiwaangeliyay bisha aad doorato, kadibna
                si otomaatig ah u arag natiijada xisaabta.
              </p>
            </div>

            <button
              type="button"
              onClick={printAccounts}
              disabled={!data || loading}
              className="print:hidden min-h-11 rounded-2xl border border-[#075b35] bg-white px-5 font-extrabold text-[#075b35] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Daabac Xisaabta
            </button>
          </div>

          {/* IMPORTANT ACCOUNTING NOTE */}
          <div className="mb-6 rounded-2xl border border-[#ead9a6] bg-[#fffaf0] px-5 py-4">
            <p className="font-extrabold text-[#725b25]">
              Natiijada xisaabta bisha
            </p>

            <p className="mt-1 text-sm leading-6 text-[#806d3f]">
              Natiijada Xisaabtu waxay ka dhigan tahay
              iibka la diiwaangeliyay oo laga jaray wax
              iibsiga iyo kharashaadka la diiwaangeliyay
              bisha iyo qaybaha aad dooratay. Waa soo
              koobidda xogta ku jirta nidaamkan.
            </p>
          </div>

          {/* MONTH + ADVANCED FILTERS */}
          <div className="print:hidden rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm sm:p-7">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#b38420]">
                Shaandhaynta Xisaabta / Account Filters
              </p>

              <h3 className="mt-1 text-xl font-extrabold text-[#064b2c]">
                Dooro xogta aad rabto inaad xisaabiso
              </h3>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <div>
                <label className="mb-2 block text-sm font-extrabold text-[#17452f]">
                  Bisha / Month
                </label>

                <input
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-[#d9d5ca] bg-white px-4 font-bold text-slate-700 outline-none transition focus:border-[#075b35] focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-extrabold text-[#17452f]">
                  Transaction
                </label>

                <select
                  value={transaction}
                  onChange={(event) =>
                    setTransaction(event.target.value as TransactionFilter)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#d9d5ca] bg-white px-4 font-bold text-slate-700 outline-none transition focus:border-[#075b35] focus:ring-4 focus:ring-green-100"
                >
                  <option value="ALL">Dhammaan / All</option>
                  <option value="SALE">La iibiyay / Sold</option>
                  <option value="PURCHASE">La iibsaday / Purchased</option>
                  <option value="EXPENSE">Kharash / Expense</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-extrabold text-[#17452f]">
                  Shirkad / Customer / Supplier
                </label>

                <select
                  value={company}
                  onChange={(event) => setCompany(event.target.value)}
                  className="min-h-12 w-full rounded-2xl border border-[#d9d5ca] bg-white px-4 font-bold text-slate-700 outline-none transition focus:border-[#075b35] focus:ring-4 focus:ring-green-100"
                >
                  <option value="ALL">Dhammaan / All</option>
                  {(data?.availableParties || []).map((party) => (
                    <option key={party} value={party}>
                      {party}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-extrabold text-[#17452f]">
                  Nooca Quudinta / Feed Type
                </label>

                <select
                  value={feedType}
                  onChange={(event) =>
                    setFeedType(event.target.value as FeedTypeFilter)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#d9d5ca] bg-white px-4 font-bold text-slate-700 outline-none transition focus:border-[#075b35] focus:ring-4 focus:ring-green-100"
                >
                  <option value="ALL">Dhammaan / All</option>
                  <option value="Starter">Starter</option>
                  <option value="Grower">Grower</option>
                  <option value="Layer">Layer</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => {
                    setTransaction("ALL");
                    setCompany("ALL");
                    setFeedType("ALL");
                  }}
                  className="min-h-12 w-full rounded-2xl border border-slate-200 px-4 font-extrabold text-slate-600 transition hover:bg-slate-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <p className="text-sm font-extrabold text-[#17452f]">
                Qaybaha / Categories
              </p>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  disabled={allSelected}
                  className="rounded-xl border border-[#075b35] px-4 py-2 text-sm font-extrabold text-[#075b35] hover:bg-green-50 disabled:opacity-40"
                >
                  Dooro Dhammaan
                </button>

                <button
                  type="button"
                  onClick={clearCategories}
                  disabled={selectedCategories.length === 0}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Ka Saar Dhammaan
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {CATEGORY_OPTIONS.map(
                (category) => {
                  const selected =
                    selectedCategories.includes(
                      category.value
                    );

                  return (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() =>
                        toggleCategory(
                          category.value
                        )
                      }
                      className={`rounded-2xl border p-4 text-left transition ${
                        selected
                          ? "border-[#075b35] bg-[#edf6ef] shadow-sm"
                          : "border-[#e7e1d4] bg-[#faf9f5] hover:border-[#b7cbbd]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-extrabold text-[#064b2c]">
                            {category.label}
                          </p>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {category.description}
                          </p>
                        </div>

                        <span
                          className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? "border-[#075b35] bg-[#075b35] text-white"
                              : "border-slate-300 bg-white text-transparent"
                          }`}
                        >
                          ✓
                        </span>
                      </div>
                    </button>
                  );
                }
              )}
            </div>

            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-[#ece7dc] pt-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm text-slate-500">
                  {selectedCategories.length} ka mid ah{" "}
                  {CATEGORY_OPTIONS.length} qaybood ayaa la doortay
                </p>

                <p className="mt-1 text-xs font-semibold text-slate-400">
                  Transaction: {transaction} · Company: {company} · Feed: {feedType}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void loadAccounts()}
                disabled={
                  loading ||
                  selectedCategories.length === 0 ||
                  !month
                }
                className="min-h-11 rounded-2xl bg-[#075b35] px-6 font-extrabold text-white transition hover:bg-[#064b2c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Xisaabinta..." : "Xisaabi"}
              </button>
            </div>
          </div>

          {/* ERROR */}
          {error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* LOADING */}
          {loading && (
            <div className="mt-6 rounded-3xl border border-[#e7e1d4] bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#d9eadf] border-t-[#075b35]" />

              <p className="font-extrabold text-[#064b2c]">
                Xisaabta {monthLabel} waa la
                xisaabinayaa...
              </p>
            </div>
          )}

          {/* RESULTS */}
          {!loading && data && (
            <>
              <div className="mt-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#b38420]">
                    Xisaab Xirka Bisha
                  </p>

                  <h3 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                    {formatMonthLabel(data.month)}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
                    {data.summary.totalRecords} diiwaan
                  </span>

                  <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
                    {currencyCount} nooc lacag ah
                  </span>
                </div>
              </div>

              {/* CURRENCY SUMMARIES */}
              {data.summary.currencies.length === 0 ? (
                <div className="mt-5 rounded-3xl border border-[#e7e1d4] bg-white px-6 py-12 text-center shadow-sm">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf6ef] text-[#075b35]">
                    <AccountsIcon />
                  </div>

                  <h4 className="mt-4 text-xl font-extrabold text-[#064b2c]">
                    Wax xog ah lama helin
                  </h4>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Wax diiwaan maaliyadeed ah lagama helin
                    qaybaha aad dooratay bisha {monthLabel}.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-6">
                  {data.summary.currencies.map(
                    (summary) => (
                      <div
                        key={summary.currency}
                        className="rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm sm:p-6"
                      >
                        <div className="mb-5 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-slate-400">
                              Lacagta
                            </p>

                            <h4 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                              {summary.currency}
                            </h4>
                          </div>

                          <span className="rounded-full bg-[#edf6ef] px-4 py-2 text-sm font-extrabold text-[#075b35]">
                            {summary.records} diiwaan
                          </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <SummaryCard
                            label="Wadarta Iibka"
                            value={formatMoney(
                              summary.sales,
                              summary.currency
                            )}
                            description="Lacagta ka soo gashay iibka"
                            variant="positive"
                          />

                          <SummaryCard
                            label="Wax Iibsiga"
                            value={formatMoney(
                              summary.purchases,
                              summary.currency
                            )}
                            description="Digaag, ukumo iyo quudin la soo iibsaday"
                            variant="warning"
                          />

                          <SummaryCard
                            label="Kharashaadka Kale"
                            value={formatMoney(
                              summary.expenses,
                              summary.currency
                            )}
                            description="Kharashaadka guud iyo kuwa kale"
                            variant="negative"
                          />

                          <SummaryCard
                            label="Natiijada Xisaabta"
                            value={formatMoney(
                              summary.netResult,
                              summary.currency
                            )}
                            description={`Iibka laga jaray ${formatMoney(
                              summary.outgoing,
                              summary.currency
                            )} oo baxay`}
                            variant={
                              summary.netResult >= 0
                                ? "positive"
                                : "negative"
                            }
                          />
                        </div>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* CATEGORY BREAKDOWN */}
              {data.summary.categories.length > 0 && (
                <div className="mt-7 rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm sm:p-7">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#b38420]">
                      Faahfaahinta
                    </p>

                    <h3 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                      Soo Koobidda Qaybaha
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Eeg qayb kasta sida ay uga qayb qaadatay
                      xisaabta bisha.
                    </p>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                      <thead>
                        <tr className="border-b-2 border-[#075b35] text-sm text-[#17452f]">
                          <th className="px-4 py-3">
                            Qaybta
                          </th>

                          <th className="px-4 py-3">
                            Lacagta
                          </th>

                          <th className="px-4 py-3 text-right">
                            Iibka
                          </th>

                          <th className="px-4 py-3 text-right">
                            Wax Iibsiga
                          </th>

                          <th className="px-4 py-3 text-right">
                            Kharashaadka
                          </th>

                          <th className="px-4 py-3 text-right">
                            Natiijada
                          </th>

                          <th className="px-4 py-3 text-right">
                            Diiwaannada
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.summary.categories.map(
                          (summary) => (
                            <tr
                              key={`${summary.category}-${summary.currency}`}
                              className="border-b border-[#ece7dc]"
                            >
                              <td className="px-4 py-4 font-extrabold text-[#17452f]">
                                {summary.label}
                              </td>

                              <td className="px-4 py-4 font-bold text-slate-600">
                                {summary.currency}
                              </td>

                              <td className="px-4 py-4 text-right font-bold text-green-700">
                                {formatMoney(
                                  summary.sales,
                                  summary.currency
                                )}
                              </td>

                              <td className="px-4 py-4 text-right font-bold text-amber-700">
                                {formatMoney(
                                  summary.purchases,
                                  summary.currency
                                )}
                              </td>

                              <td className="px-4 py-4 text-right font-bold text-red-700">
                                {formatMoney(
                                  summary.expenses,
                                  summary.currency
                                )}
                              </td>

                              <td
                                className={`px-4 py-4 text-right font-extrabold ${
                                  summary.netResult >= 0
                                    ? "text-green-700"
                                    : "text-red-700"
                                }`}
                              >
                                {formatMoney(
                                  summary.netResult,
                                  summary.currency
                                )}
                              </td>

                              <td className="px-4 py-4 text-right font-bold text-slate-600">
                                {summary.records}
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
                            {/* FEED PRODUCTION - NON-MONETARY */}
              {selectedCategories.includes("feeds") && data.production && (
                <div className="mt-7 rounded-3xl border border-[#cfe3d5] bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#b38420]">
                        Wax-soo-saarka Quudinta / Feed Production
                      </p>

                      <h3 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                        Production-ka Bisha
                      </h3>

                      <p className="mt-1 max-w-3xl text-sm text-slate-500">
                        Production-ku waa xog KG iyo bags ah. Laguma daro iibka,
                        wax iibsiga, kharashaadka ama natiijada lacagta.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#edf6ef] px-4 py-2 text-sm font-extrabold text-[#075b35]">
                      {data.production.totalRecords} records
                    </span>
                  </div>

                  <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                      label="Production Batches"
                      value={formatNumber(data.production.totalBatches)}
                      description="Tirada batches-ka bishan"
                      variant="positive"
                    />

                    <SummaryCard
                      label="Total Bags"
                      value={formatNumber(data.production.totalBags)}
                      description="Dhammaan bacaha la soo saaray"
                      variant="positive"
                    />

                    <SummaryCard
                      label="Total Weight"
                      value={`${formatNumber(data.production.totalKg)} KG`}
                      description="Miisaanka guud ee production-ka"
                      variant="positive"
                    />

                    <SummaryCard
                      label="Feed Types"
                      value={formatNumber(data.production.byFeedType.length)}
                      description="Starter, Grower iyo Layer"
                      variant="positive"
                    />
                  </div>

                  {data.production.byFeedType.length > 0 && (
                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                      {data.production.byFeedType.map((item) => (
                        <div
                          key={item.feedType}
                          className="rounded-2xl border border-[#e7e1d4] bg-[#faf9f5] p-5"
                        >
                          <p className="text-lg font-extrabold text-[#064b2c]">
                            {item.feedType}
                          </p>

                          <div className="mt-3 space-y-2 text-sm text-slate-600">
                            <p>
                              Batches:{" "}
                              <span className="font-extrabold text-slate-800">
                                {item.batches}
                              </span>
                            </p>
                            <p>
                              Bags:{" "}
                              <span className="font-extrabold text-slate-800">
                                {formatNumber(item.bags)}
                              </span>
                            </p>
                            <p>
                              Total KG:{" "}
                              <span className="font-extrabold text-slate-800">
                                {formatNumber(item.totalKg)} KG
                              </span>
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {data.production.entries.length > 0 ? (
                    <div className="mt-6 overflow-x-auto">
                      <table className="w-full min-w-[1100px] text-left">
                        <thead>
                          <tr className="border-b-2 border-[#075b35] text-sm text-[#17452f]">
                            <th className="px-3 py-3">Taariikhda</th>
                            <th className="px-3 py-3">Feed Type</th>
                            <th className="px-3 py-3">Goobta</th>
                            <th className="px-3 py-3 text-right">Bag Size</th>
                            <th className="px-3 py-3 text-right">Bags</th>
                            <th className="px-3 py-3 text-right">Total KG</th>
                            <th className="px-3 py-3">Waxaa Geliyay</th>
                            <th className="px-3 py-3">Waqtiga</th>
                          </tr>
                        </thead>

                        <tbody>
                          {data.production.entries.map((entry) => (
                            <tr
                              key={entry.id}
                              className="border-b border-[#ece7dc]"
                            >
                              <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-600">
                                {formatDate(entry.date)}
                              </td>

                              <td className="px-3 py-4 font-extrabold text-[#17452f]">
                                {entry.feedType}
                              </td>

                              <td className="px-3 py-4 text-sm text-slate-600">
                                {entry.location || "—"}
                              </td>

                              <td className="px-3 py-4 text-right font-bold text-slate-700">
                                {formatNumber(entry.bagSizeKg)} KG
                              </td>

                              <td className="px-3 py-4 text-right font-bold text-slate-700">
                                {formatNumber(entry.quantity)}
                              </td>

                              <td className="px-3 py-4 text-right font-extrabold text-[#075b35]">
                                {formatNumber(entry.totalKg)} KG
                              </td>

                              <td className="px-3 py-4 text-sm">
                                {entry.createdBy ? (
                                  <div>
                                    <p className="font-extrabold text-[#17452f]">
                                      {entry.createdBy.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-slate-400">
                                      {entry.createdBy.role}
                                    </p>
                                  </div>
                                ) : (
                                  <span className="font-semibold text-slate-400">
                                    Xog hore
                                  </span>
                                )}
                              </td>

                              <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-600">
                                {formatDateTime(entry.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mt-6 rounded-2xl bg-[#faf9f5] px-5 py-8 text-center text-sm font-semibold text-slate-500">
                      Production lama helin bisha iyo filters-ka la doortay.
                    </div>
                  )}
                </div>
              )}

              {/* DIIWAANNADA FAAHFAAHSAN */}
              {data.entries.length > 0 && (
                <div className="mt-7 rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#b38420]">
                        Diiwaannada Bisha
                      </p>

                      <h3 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                        Dhammaan Xogta Bishan La Geliyay
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Hoos waxaad ka arkaysaa dhammaan
                        diiwaannada lagu daray xisaabinta
                        bishan.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#edf6ef] px-4 py-2 text-sm font-extrabold text-[#075b35]">
                      {data.entries.length} diiwaan
                    </span>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[1450px] text-left">
                      <thead>
                        <tr className="border-b-2 border-[#075b35] text-sm text-[#17452f]">
                          <th className="px-3 py-3">
                            Taariikhda
                          </th>

                          <th className="px-3 py-3">
                            Qaybta
                          </th>

                          <th className="px-3 py-3">
                            Nooca
                          </th>

                          <th className="px-3 py-3">
                            Isha Xogta
                          </th>

                          <th className="px-3 py-3">
                            Faahfaahin
                          </th>

                          <th className="px-3 py-3">
                            Goobta
                          </th>

                          <th className="px-3 py-3">
                            Shirkad / Macmiil
                          </th>

                          <th className="px-3 py-3 text-right">
                            Tirada
                          </th>

                          <th className="px-3 py-3 text-right">
                            Qiimaha Halkii
                          </th>

                          <th className="px-3 py-3 text-right">
                            Wadarta
                          </th>

                          <th className="px-3 py-3">
                            Waxaa Geliyay
                          </th>

                          <th className="px-3 py-3">
                            Waqtiga la Geliyay
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {data.entries.map((entry) => (
                          <tr
                            key={`${entry.source}-${entry.id}`}
                            className="border-b border-[#ece7dc] align-top"
                          >
                            <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-600">
                              {formatDate(entry.date)}
                            </td>

                            <td className="px-3 py-4">
                              <span className="font-extrabold text-[#17452f]">
                                {entry.categoryLabel}
                              </span>
                            </td>

                            <td className="px-3 py-4">
                              <span
                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-extrabold ${typeClass(
                                  entry.type
                                )}`}
                              >
                                {typeLabel(entry.type)}
                              </span>
                            </td>

                            <td className="px-3 py-4 text-sm font-semibold text-slate-600">
                              {entry.source}
                            </td>

                            <td className="px-3 py-4 text-sm text-slate-600">
                              {entry.description}
                            </td>

                            <td className="px-3 py-4 text-sm text-slate-600">
                              {entry.location || "—"}
                            </td>

                            <td className="px-3 py-4 text-sm text-slate-600">
                              {entry.party || "—"}
                            </td>

                            <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-bold text-slate-700">
                              {formatNumber(
                                entry.quantity
                              )}
                            </td>

                            <td className="whitespace-nowrap px-3 py-4 text-right text-sm font-bold text-slate-700">
                              {entry.unitPrice === null
                                ? "—"
                                : formatMoney(
                                    entry.unitPrice,
                                    entry.currency
                                  )}
                            </td>

                            <td
                              className={`whitespace-nowrap px-3 py-4 text-right font-extrabold ${
                                entry.type === "SALE"
                                  ? "text-green-700"
                                  : entry.type ===
                                      "PURCHASE"
                                    ? "text-amber-700"
                                    : "text-red-700"
                              }`}
                            >
                              {formatMoney(
                                entry.total,
                                entry.currency
                              )}
                            </td>

                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                              {entry.createdBy ? (
                                <div>
                                  <p className="font-extrabold text-[#17452f]">
                                    {entry.createdBy.name}
                                  </p>

                                  <p className="mt-0.5 text-xs text-slate-400">
                                    {entry.createdBy.role}
                                  </p>
                                </div>
                              ) : (
                                <span className="font-semibold text-slate-400">
                                  Xog hore
                                </span>
                              )}
                            </td>

                            <td className="whitespace-nowrap px-3 py-4 text-sm font-semibold text-slate-600">
                              {formatDateTime(entry.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#faf9f5] px-5 py-4">
                    <p className="text-xs leading-5 text-slate-500">
                      Jadwalkan wuxuu muujinayaa diiwaannada
                      loo isticmaalay xisaabinta natiijada
                      kore. Haddii aad rabto inaad wax ka
                      beddesho diiwaan, ka beddel qaybtii
                      markii hore lagu geliyay sida
                      Kharashaadka, Ukumaha, Quudinta ama
                      Digaagga.
                    </p>
                  </div>
                </div>
              )}

              {/* QAYBTA SAXIIXA MARKA LA DAABACO */}
              <div className="mt-8 hidden border-t border-slate-300 pt-5 print:block">
                <div className="grid grid-cols-2 gap-10">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Waxaa Diyaariyay
                    </p>

                    <p className="mt-8 border-t border-slate-400 pt-2 text-sm">
                      Magaca / Saxiixa
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Waxaa Ansixiyay
                    </p>

                    <p className="mt-8 border-t border-slate-400 pt-2 text-sm">
                      Magaca / Saxiixa
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <p className="mt-8 text-center text-xs text-slate-400 print:mt-10">
            © 2026 Siraaje Poultry & Feeds Company
          </p>
        </section>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 12mm;
          }

          html,
          body {
            background: white !important;
          }

          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }
        }
      `}</style>
    </main>
  );
}

// =========================================================
// KAARKA SOO KOOBIDDA
// =========================================================

function SummaryCard({
  label,
  value,
  description,
  variant,
}: {
  label: string;
  value: string;
  description: string;
  variant:
    | "positive"
    | "warning"
    | "negative";
}) {
  const styles = {
    positive:
      "border-green-200 bg-green-50 text-green-800",
    warning:
      "border-amber-200 bg-amber-50 text-amber-800",
    negative:
      "border-red-200 bg-red-50 text-red-800",
  };

  return (
    <div
      className={`rounded-2xl border p-5 ${styles[variant]}`}
    >
      <p className="text-xs font-extrabold uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>

      <p className="mt-2 break-words text-xl font-extrabold sm:text-2xl">
        {value}
      </p>

      <p className="mt-2 text-xs leading-5 opacity-70">
        {description}
      </p>
    </div>
  );
}

// =========================================================
// SIDEBAR LINK
// =========================================================

function SidebarLink({
  href,
  text,
}: {
  href: string;
  text: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-[#17452f] transition hover:bg-[#edf6ef]"
    >
      <span className="flex h-5 w-5 items-center justify-center">
        <span className="h-2.5 w-2.5 rounded-full bg-current" />
      </span>

      {text}
    </Link>
  );
}

// =========================================================
// ACCOUNTS ICON
// =========================================================

function AccountsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 19V9"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 19V5"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 19v-7"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 19V3"
      />

      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 19h22"
      />
    </svg>
  );
}