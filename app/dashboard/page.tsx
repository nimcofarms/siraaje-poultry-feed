"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type ConstructionExpense = {
  id: string;
  total: number;
};

type ProductExpense = {
  id: string;
  total: number;
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

export default function DashboardPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [userLoading, setUserLoading] = useState(true);

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);

  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  const isOwner = currentUser?.isOwner === true;

  const canDashboard =
    isOwner ||
    currentUser?.permissions?.dashboardView === true;

  const canExpenses =
    isOwner ||
    currentUser?.permissions?.expensesView === true;

  const canEggs =
    isOwner ||
    currentUser?.permissions?.eggsView === true;

  const canChicken =
    isOwner ||
    currentUser?.permissions?.chickenView === true;

  const canFeeds =
    isOwner ||
    currentUser?.permissions?.feedsView === true;

  const canDocuments =
    isOwner ||
    currentUser?.permissions?.documentsView === true;

  const canPoultryHealth =
    isOwner ||
    currentUser?.permissions?.poultryHealthView === true;

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
            data.error || "Could not load user."
          );
        }

        setCurrentUser(data.user);
      } catch (error) {
        console.error("Current user error:", error);
      } finally {
        setUserLoading(false);
      }
    }

    void loadCurrentUser();
  }, [router]);

  useEffect(() => {
    if (userLoading || !currentUser) {
      return;
    }

    if (!canDashboard) {
      if (canExpenses) {
        router.replace("/dashboard/expenses");
        return;
      }

      if (canEggs) {
        router.replace("/dashboard/eggs");
        return;
      }

      if (canChicken) {
        router.replace("/dashboard/chicken");
        return;
      }

      if (canFeeds) {
        router.replace("/dashboard/feeds");
        return;
      }

      if (canDocuments) {
        router.replace("/dashboard/documents");
        return;
      }

      if (canPoultryHealth) {
        router.replace("/dashboard/poultry-health");
        return;
      }
    }
  }, [
    userLoading,
    currentUser,
    canDashboard,
    canExpenses,
    canEggs,
    canChicken,
    canFeeds,
    canDocuments,
    canPoultryHealth,
    router,
  ]);

  useEffect(() => {
    async function loadExpenses() {
      if (!canExpenses) {
        setTotalExpenses(0);
        setExpenseCount(0);
        return;
      }

      try {
        const [constructionResponse, productResponse] =
          await Promise.all([
            fetch("/api/construction-expenses", {
              cache: "no-store",
            }),
            fetch("/api/product-expenses", {
              cache: "no-store",
            }),
          ]);

        if (
          !constructionResponse.ok ||
          !productResponse.ok
        ) {
          return;
        }

        const constructionData: ConstructionExpense[] =
          await constructionResponse.json();

        const productData: ProductExpense[] =
          await productResponse.json();

        const constructionTotal =
          constructionData.reduce(
            (sum, expense) =>
              sum + Number(expense.total || 0),
            0
          );

        const productTotal = productData.reduce(
          (sum, expense) =>
            sum + Number(expense.total || 0),
          0
        );

        setTotalExpenses(
          constructionTotal + productTotal
        );

        setExpenseCount(
          constructionData.length + productData.length
        );
      } catch (error) {
        console.error(
          "Dashboard expense error:",
          error
        );
      }
    }

    if (currentUser) {
      void loadExpenses();
    }
  }, [currentUser, canExpenses]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(
          event.target as Node
        )
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );
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

  if (userLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ed]">
        <div className="rounded-3xl border border-[#e7e1d4] bg-white px-8 py-7 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#dce9df] border-t-[#075b35]" />

          <p className="mt-4 font-bold text-[#064b2c]">
            Loading Siraaje Poultry Feed...
          </p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  if (
    !canDashboard &&
    !canExpenses &&
    !canEggs &&
    !canChicken &&
    !canFeeds &&
    !canDocuments &&
    !canPoultryHealth
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ed] px-5">
        <div className="max-w-lg rounded-3xl border border-[#e7e1d4] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-7 w-7"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M9 9l6 6" />
              <path d="M15 9l-6 6" />
            </svg>
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-[#064b2c]">
            No Access Assigned
          </h1>

          <p className="mt-3 text-slate-500">
            Your account is active, but an administrator
            has not assigned access to any section yet.
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 rounded-2xl bg-[#075b35] px-6 py-3 font-bold text-white"
          >
            Log Out
          </button>
        </div>
      </main>
    );
  }

  if (!canDashboard) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ed]">
        <p className="font-bold text-[#064b2c]">
          Opening your permitted section...
        </p>
      </main>
    );
  }

  const initial =
    currentUser.name?.trim().charAt(0).toUpperCase() ||
    "U";

  const roleLabel = isOwner
    ? "Maamule / Administrator"
    : "Shaqaale / Worker";

  return (
    <main className="min-h-screen bg-[#f7f5ed]">
      {/* HEADER */}
      <header className="relative z-50 border-b border-[#e5dfd0] bg-[#075b35] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          {/* LOGO */}
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

          {/* PROFILE */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() =>
                setProfileOpen(
                  (current) => !current
                )
              }
              className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 transition hover:bg-white/15 sm:px-4"
              aria-expanded={profileOpen}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-extrabold text-[#075b35] shadow-sm">
                {initial}
              </div>

              <div className="hidden min-w-[80px] text-left sm:block">
                <p className="max-w-[160px] truncate text-sm font-extrabold leading-tight">
                  {currentUser.name}
                </p>

                <p className="mt-1 text-xs text-green-100">
                  {isOwner
                    ? "Maamule"
                    : "Shaqaale"}
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

            {/* PROFILE DROPDOWN */}
            {profileOpen && (
              <div className="absolute right-0 top-[calc(100%+10px)] w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e7f5eb] font-extrabold text-[#075b35]">
                    {initial}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-[#064b2c]">
                      {currentUser.name}
                    </p>

                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {currentUser.email}
                    </p>

                    <p className="mt-1 text-xs font-bold text-[#075b35]">
                      {roleLabel}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-100 p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left font-bold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                  >
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
                        d="M10 17l5-5-5-5"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12H3"
                      />

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"
                      />
                    </svg>

                    {loggingOut
                      ? "Waa laga baxayaa..."
                      : "Ka Bax / Log Out"}
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
            {/* DASHBOARD */}
            {canDashboard && (
              <SidebarLink
                href="/dashboard"
                label="Dashboard"
                active
                icon={<DashboardIcon />}
              />
            )}

            {/* EXPENSES */}
            {canExpenses && (
              <SidebarLink
                href="/dashboard/expenses"
                label="Kharashaadka / Expenses"
                icon={<ExpensesIcon />}
              />
            )}

            {/* EGGS */}
            {canEggs && (
              <SidebarLink
                href="/dashboard/eggs"
                label="Ukumaha / Eggs"
                icon={<EggIcon />}
              />
            )}

            {/* CHICKEN */}
            {canChicken && (
              <SidebarLink
                href="/dashboard/chicken"
                label="Digaag / Chicken"
                icon={<ChickenIcon />}
              />
            )}

            {/* FEEDS */}
            {canFeeds && (
              <SidebarLink
                href="/dashboard/feeds"
                label="Quudinta / Feeds"
                icon={<FeedIcon />}
              />
            )}

            {/* DOCUMENTS */}
            {canDocuments && (
              <SidebarLink
                href="/dashboard/documents"
                label="Documents"
                icon={<DocumentsIcon />}
              />
            )}

            {/* POULTRY HEALTH */}
            {canPoultryHealth && (
              <SidebarLink
                href="/dashboard/poultry-health"
                label="Daaweynta Digaagga / Poultry Health"
                icon={<HealthIcon />}
              />
            )}

            {/* WORKERS & ACCESS - OWNER/ADMIN ONLY */}
            {isOwner && (
              <>
                <div className="my-3 border-t border-[#eee9de]" />

                <SidebarLink
                  href="/dashboard/workers"
                  label="Workers & Access"
                  icon={<WorkersIcon />}
                />
              </>
            )}
          </nav>
        </aside>

        {/* DASHBOARD CONTENT */}
        <section className="min-w-0">
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#b38420]">
              Maamulka
            </p>

            <h2 className="mt-1 text-3xl font-extrabold text-[#064b2c] sm:text-4xl">
              Dashboard
            </h2>

            <p className="mt-2 text-slate-500">
              Ku soo dhawoow nidaamka maamulka Siraaje
              Poultry Feed, {currentUser.name}.
            </p>
          </div>
                    {/* SUMMARY CARDS */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {canExpenses && (
              <>
                {/* TOTAL EXPENSES */}
                <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Wadarta Kharashaadka
                      </p>

                      <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
                        {totalExpenses.toLocaleString()} ETB
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e5f5e9] text-[#075b35]">
                      <ExpensesIcon />
                    </div>
                  </div>
                </div>

                {/* EXPENSE COUNT */}
                <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-bold text-slate-500">
                        Diiwaannada Kharashaadka
                      </p>

                      <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
                        {expenseCount}
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fff3d6] text-[#9a6b08]">
                      <ListIcon />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SYSTEM STATUS */}
            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Xaaladda Nidaamka
                  </p>

                  <p className="mt-3 text-2xl font-extrabold text-[#075b35]">
                    Shaqaynaya
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {isOwner
                      ? "Administrator access"
                      : "Worker access"}
                  </p>
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dcf7e6] text-[#075b35]">
                  <CheckIcon />
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-7 grid gap-5 xl:grid-cols-2">
            {canExpenses && (
              <QuickActionCard
                title="Kharash cusub / New Expense"
                description="Diiwaangeli kharashka dhismaha ama kharashka productiga, kadibna ka maamul qaybta Kharashaadka."
                href="/dashboard/expenses"
                buttonLabel="Ku Dar Kharash / Add Expense"
                icon={<ExpensesIcon />}
              />
            )}

            {canEggs && (
              <QuickActionCard
                title="Ukumaha / Eggs"
                description="Diiwaangeli ukumaha la soo gatay iyo ukumaha la iibiyay, kadibna ka maamul dhammaan diiwaannada qaybta Ukumaha."
                href="/dashboard/eggs"
                buttonLabel="Fur Ukumaha / Open Eggs"
                icon={<EggIcon />}
                gold
              />
            )}

            {canChicken && (
              <QuickActionCard
                title="Digaag / Chicken"
                description="Diiwaangeli digaagga nool iyo hilibka digaagga la soo iibsaday ama la iibiyay, kadibna ka maamul dhammaan diiwaannada qaybta Digaagga."
                href="/dashboard/chicken"
                buttonLabel="Fur Digaagga / Open Chicken"
                icon={<ChickenIcon />}
              />
            )}

            {canFeeds && (
              <QuickActionCard
                title="Quudinta / Feeds"
                description="Diiwaangeli Starter Feed, Grower Feed iyo Layer Feed, kadibna ka maamul dhammaan diiwaannada qaybta Quudinta."
                href="/dashboard/feeds"
                buttonLabel="Fur Quudinta / Open Feeds"
                icon={<FeedIcon />}
              />
            )}

            {canPoultryHealth && (
              <QuickActionCard
                title="Daaweynta Digaagga / Poultry Health"
                description="Diiwaangeli tallaalka, vitamin-ka iyo calcium-ka digaagga, kadibna ka maamul dhammaan diiwaannada caafimaadka digaagga."
                href="/dashboard/poultry-health"
                buttonLabel="Fur Daaweynta / Open Poultry Health"
                icon={<HealthIcon />}
              />
            )}

            {canDocuments && (
              <QuickActionCard
                title="Documents"
                description="Fur oo maamul dukumentiyada shirkadda iyo faylasha loo oggolaaday isticmaalaha."
                href="/dashboard/documents"
                buttonLabel="Fur Documents / Open Documents"
                icon={<DocumentsIcon />}
              />
            )}

            {isOwner && (
              <QuickActionCard
                title="Workers & Access"
                description="Ku dar shaqaale cusub oo dooro qaybaha uu arki karo iyo waxa uu ku samayn karo nidaamka."
                href="/dashboard/workers"
                buttonLabel="Manage Workers"
                icon={<WorkersIcon />}
              />
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 Siraaje Poultry & Feeds Company
          </p>
        </section>
      </div>
    </main>
  );
}

function SidebarLink({
  href,
  label,
  icon,
  active = false,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
        active
          ? "bg-[#075b35] font-bold text-white"
          : "font-semibold text-[#17452f] transition hover:bg-[#edf6ef]"
      }`}
    >
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  buttonLabel,
  icon,
  gold = false,
}: {
  title: string;
  description: string;
  href: string;
  buttonLabel: string;
  icon: React.ReactNode;
  gold?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm sm:p-8">
      <div className="flex h-full flex-col justify-between gap-5">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                gold
                  ? "bg-[#fff3d6] text-[#9a6b08]"
                  : "bg-[#e5f5e9] text-[#075b35]"
              }`}
            >
              {icon}
            </div>

            <h3 className="text-xl font-extrabold text-[#064b2c]">
              {title}
            </h3>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {description}
          </p>
        </div>

        <Link
          href={href}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-6 font-bold text-white shadow-md transition ${
            gold
              ? "bg-[#b38420] hover:bg-[#966d15]"
              : "bg-[#075b35] hover:bg-[#064b2c]"
          }`}
        >
          {buttonLabel}
        </Link>
      </div>
    </div>
  );
}

function DashboardIcon() {
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
        d="M3 10.5 12 3l9 7.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 9.5V21h14V9.5"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 21v-7h6v7"
      />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="2"
      />
      <path d="M3 9h18" />
      <path d="M7 15h3" />
    </svg>
  );
}

function EggIcon() {
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
        d="M12 3C8.8 3 6 8.4 6 13a6 6 0 0 0 12 0c0-4.6-2.8-10-6-10Z"
      />
    </svg>
  );
}

function ChickenIcon() {
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
        d="M8 14c0-4 2.5-7 6-7 2.5 0 4.5 1.5 5 4-1.2 3.8-4.2 6-8 6H8v-3Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14 7c0-2 1-3 2-4"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7c1-2 2-2.5 3-2"
      />
      <circle cx="16.5" cy="10" r=".7" fill="currentColor" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 14 5 12"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11 17v3"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 16.5V20"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.5 20H12"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 20H16"
      />
    </svg>
  );
}

function FeedIcon() {
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
        d="M12 21V10"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 14c-4 0-7-2.5-7-6 4 0 7 2.5 7 6Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 10c4 0 7-2.5 7-6-4 0-7 2.5-7 6Z"
      />
    </svg>
  );
}

function DocumentsIcon() {
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
        d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"
      />
    </svg>
  );
}

function HealthIcon() {
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
        d="M12 3v18"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12h18"
      />
    </svg>
  );
}

function WorkersIcon() {
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
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
      />
      <circle cx="9" cy="7" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 8v6"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M22 11h-6"
      />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-6 w-6"
    >
      <path d="M9 5h11" />
      <path d="M9 12h11" />
      <path d="M9 19h11" />
      <path d="M4 5h.01" />
      <path d="M4 12h.01" />
      <path d="M4 19h.01" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className="h-6 w-6"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 12 4 4L19 6"
      />
    </svg>
  );
}