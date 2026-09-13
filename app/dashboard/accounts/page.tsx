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

  availableCategories: {
    value: AccountCategory;
    label: string;
  }[];

  summary: {
    totalRecords: number;
    currencies: CurrencySummary[];
    categories: CategorySummary[];
  };

  entries: AccountEntry[];
};

const CATEGORY_OPTIONS: {
  value: AccountCategory;
  label: string;
  description: string;
}[] = [
  {
    value: "chicken",
    label: "Digaag / Chicken",
    description:
      "Live chicken and chicken meat purchases and sales.",
  },
  {
    value: "eggs",
    label: "Ukumaha / Eggs",
    description:
      "Egg purchases and egg sales.",
  },
  {
    value: "feeds",
    label: "Quudinta / Feeds",
    description:
      "Feed purchases recorded during the selected month.",
  },
  {
    value: "expenses",
    label: "Kharashaadka / Expenses",
    description:
      "General, construction and product expenses.",
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
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currency}`;
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

function formatMonthLabel(month: string) {
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return month;
  }

  const [year, monthNumber] = month
    .split("-")
    .map(Number);

  const date = new Date(
    year,
    monthNumber - 1,
    1
  );

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
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
    return "Sale";
  }

  if (type === "PURCHASE") {
    return "Purchase";
  }

  return "Expense";
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
              "Your account could not be loaded."
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
            : "Your account could not be loaded."
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
        "Select at least one category."
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
            "Monthly accounts could not be loaded."
        );
      }

      setData(result);
    } catch (error) {
      setData(null);

      setError(
        error instanceof Error
          ? error.message
          : "Monthly accounts could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }, [
    month,
    router,
    selectedCategories,
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
            Loading Monthly Accounts...
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
              Xisaab Xir / Monthly Accounts
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
              text="Dashboard"
            />

            <SidebarLink
              href="/dashboard/expenses"
              text="Kharashaadka / Expenses"
            />

            <SidebarLink
              href="/dashboard/eggs"
              text="Ukumaha / Eggs"
            />

            <SidebarLink
              href="/dashboard/chicken"
              text="Digaag / Chicken"
            />

            <SidebarLink
              href="/dashboard/feeds"
              text="Quudinta / Feeds"
            />

            <SidebarLink
              href="/dashboard/documents"
              text="Documents"
            />

            <SidebarLink
              href="/dashboard/poultry-health"
              text="Daaweynta / Poultry Health"
            />

            {isOwnerOrAdmin(currentUser) && (
              <SidebarLink
                href="/dashboard/workers"
                text="Workers & Access"
              />
            )}

            <div className="my-4 border-t border-[#e7e1d4]" />

            <p className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-[0.15em] text-[#9a7a32]">
              Accounting
            </p>

            <Link
              href="/dashboard/accounts"
              className="flex items-center gap-3 rounded-2xl bg-[#075b35] px-4 py-3 font-bold text-white"
            >
              <AccountsIcon />
              <span>
                Xisaab Xir / Monthly Accounts
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
                Monthly Accounts — {monthLabel}
              </p>
            </div>
          </div>

          {/* TITLE */}
          <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#b38420]">
                Accounting
              </p>

              <h2 className="mt-1 text-3xl font-extrabold text-[#064b2c] sm:text-4xl">
                Xisaab Xir
              </h2>

              <p className="mt-2 max-w-3xl text-slate-500">
                Review purchases, expenses and sales
                recorded during a selected month and see
                the calculated monthly result.
              </p>
            </div>

            <button
              type="button"
              onClick={printAccounts}
              disabled={!data || loading}
              className="print:hidden min-h-11 rounded-2xl border border-[#075b35] bg-white px-5 font-extrabold text-[#075b35] transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Print Accounts
            </button>
          </div>

          {/* IMPORTANT ACCOUNTING NOTE */}
          <div className="mb-6 rounded-2xl border border-[#ead9a6] bg-[#fffaf0] px-5 py-4">
            <p className="font-extrabold text-[#725b25]">
              Monthly operating result
            </p>

            <p className="mt-1 text-sm leading-6 text-[#806d3f]">
              Net Result on this page means recorded sales
              minus recorded purchases and expenses for the
              selected categories and month. It is an
              operational summary of records in this system,
              not a complete statutory profit-and-loss
              statement.
            </p>
          </div>

          {/* MONTH + CATEGORY FILTER */}
          <div className="print:hidden rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm sm:p-7">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="w-full lg:max-w-xs">
                <label className="mb-2 block text-sm font-extrabold text-[#17452f]">
                  Select Month
                </label>

                <input
                  type="month"
                  value={month}
                  onChange={(event) =>
                    setMonth(event.target.value)
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#d9d5ca] bg-white px-4 font-bold text-slate-700 outline-none transition focus:border-[#075b35] focus:ring-4 focus:ring-green-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectAllCategories}
                  disabled={allSelected}
                  className="rounded-xl border border-[#075b35] px-4 py-2 text-sm font-extrabold text-[#075b35] hover:bg-green-50 disabled:opacity-40"
                >
                  Select All
                </button>

                <button
                  type="button"
                  onClick={clearCategories}
                  disabled={
                    selectedCategories.length === 0
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-extrabold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                >
                  Clear
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
              <p className="text-sm text-slate-500">
                {selectedCategories.length} of{" "}
                {CATEGORY_OPTIONS.length} categories selected
              </p>

              <button
                type="button"
                onClick={() =>
                  void loadAccounts()
                }
                disabled={
                  loading ||
                  selectedCategories.length === 0 ||
                  !month
                }
                className="min-h-11 rounded-2xl bg-[#075b35] px-6 font-extrabold text-white transition hover:bg-[#064b2c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Calculating..."
                  : "Calculate Accounts"}
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
                Calculating {monthLabel} accounts...
              </p>
            </div>
          )}

          {/* RESULTS */}
          {!loading && data && (
            <>
              <div className="mt-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#b38420]">
                    Monthly Closing
                  </p>

                  <h3 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                    {formatMonthLabel(data.month)}
                  </h3>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
                    {data.summary.totalRecords} records
                  </span>

                  <span className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm">
                    {currencyCount}{" "}
                    {currencyCount === 1
                      ? "currency"
                      : "currencies"}
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
                    No records found
                  </h4>

                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    There are no financial records for the
                    selected categories in {monthLabel}.
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
                              Currency
                            </p>

                            <h4 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                              {summary.currency}
                            </h4>
                          </div>

                          <span className="rounded-full bg-[#edf6ef] px-4 py-2 text-sm font-extrabold text-[#075b35]">
                            {summary.records} records
                          </span>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                          <SummaryCard
                            label="Total Sales"
                            value={formatMoney(
                              summary.sales,
                              summary.currency
                            )}
                            description="Money recorded from sales"
                            variant="positive"
                          />

                          <SummaryCard
                            label="Purchases"
                            value={formatMoney(
                              summary.purchases,
                              summary.currency
                            )}
                            description="Chicken, eggs and feed purchases"
                            variant="warning"
                          />

                          <SummaryCard
                            label="Other Expenses"
                            value={formatMoney(
                              summary.expenses,
                              summary.currency
                            )}
                            description="General and other expenses"
                            variant="negative"
                          />

                          <SummaryCard
                            label="Net Result"
                            value={formatMoney(
                              summary.netResult,
                              summary.currency
                            )}
                            description={`Sales - ${formatMoney(
                              summary.outgoing,
                              summary.currency
                            )} outgoing`}
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
                      Breakdown
                    </p>

                    <h3 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                      Category Summary
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      See how each selected section contributed
                      to the monthly result.
                    </p>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left">
                      <thead>
                        <tr className="border-b-2 border-[#075b35] text-sm text-[#17452f]">
                          <th className="px-4 py-3">
                            Category
                          </th>

                          <th className="px-4 py-3">
                            Currency
                          </th>

                          <th className="px-4 py-3 text-right">
                            Sales
                          </th>

                          <th className="px-4 py-3 text-right">
                            Purchases
                          </th>

                          <th className="px-4 py-3 text-right">
                            Expenses
                          </th>

                          <th className="px-4 py-3 text-right">
                            Net Result
                          </th>

                          <th className="px-4 py-3 text-right">
                            Records
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
                            {/* DETAILED RECORDS */}
              {data.entries.length > 0 && (
                <div className="mt-7 rounded-3xl border border-[#e7e1d4] bg-white p-5 shadow-sm sm:p-7">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.12em] text-[#b38420]">
                        Monthly Records
                      </p>

                      <h3 className="mt-1 text-2xl font-extrabold text-[#064b2c]">
                        Everything Entered This Month
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        All records included in this monthly
                        calculation.
                      </p>
                    </div>

                    <span className="rounded-full bg-[#edf6ef] px-4 py-2 text-sm font-extrabold text-[#075b35]">
                      {data.entries.length} records
                    </span>
                  </div>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[1150px] text-left">
                      <thead>
                        <tr className="border-b-2 border-[#075b35] text-sm text-[#17452f]">
                          <th className="px-3 py-3">
                            Date
                          </th>

                          <th className="px-3 py-3">
                            Category
                          </th>

                          <th className="px-3 py-3">
                            Type
                          </th>

                          <th className="px-3 py-3">
                            Source
                          </th>

                          <th className="px-3 py-3">
                            Description
                          </th>

                          <th className="px-3 py-3">
                            Location
                          </th>

                          <th className="px-3 py-3">
                            Company / Customer
                          </th>

                          <th className="px-3 py-3 text-right">
                            Quantity
                          </th>

                          <th className="px-3 py-3 text-right">
                            Unit Price
                          </th>

                          <th className="px-3 py-3 text-right">
                            Total
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
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-5 rounded-2xl bg-[#faf9f5] px-5 py-4">
                    <p className="text-xs leading-5 text-slate-500">
                      The detailed table shows the records used
                      to calculate the summary above. Editing
                      financial records must be done from their
                      original section, such as Expenses, Eggs,
                      Feeds or Chicken.
                    </p>
                  </div>
                </div>
              )}

              {/* PRINT FOOTER */}
              <div className="mt-8 hidden border-t border-slate-300 pt-5 print:block">
                <div className="grid grid-cols-2 gap-10">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Prepared By
                    </p>

                    <p className="mt-8 border-t border-slate-400 pt-2 text-sm">
                      Name / Signature
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Approved By
                    </p>

                    <p className="mt-8 border-t border-slate-400 pt-2 text-sm">
                      Name / Signature
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
// SUMMARY CARD
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