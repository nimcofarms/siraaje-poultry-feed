"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type ConstructionExpense = {
  id: string;
  total: number;
};

type ProductExpense = {
  id: string;
  total: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [profileOpen, setProfileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadExpenses() {
      try {
        const [constructionResponse, productResponse] = await Promise.all([
          fetch("/api/construction-expenses", {
            cache: "no-store",
          }),
          fetch("/api/product-expenses", {
            cache: "no-store",
          }),
        ]);

        if (!constructionResponse.ok || !productResponse.ok) {
          return;
        }

        const constructionData: ConstructionExpense[] =
          await constructionResponse.json();

        const productData: ProductExpense[] =
          await productResponse.json();

        const constructionTotal = constructionData.reduce(
          (sum, expense) => sum + Number(expense.total || 0),
          0
        );

        const productTotal = productData.reduce(
          (sum, expense) => sum + Number(expense.total || 0),
          0
        );

        setTotalExpenses(constructionTotal + productTotal);

        setExpenseCount(
          constructionData.length + productData.length
        );
      } catch (error) {
        console.error("Dashboard expense error:", error);
      }
    }

    loadExpenses();
  }, []);

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
              onClick={() => setProfileOpen((current) => !current)}
              className="flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-3 py-2.5 transition hover:bg-white/15 sm:px-4"
              aria-expanded={profileOpen}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-extrabold text-[#075b35] shadow-sm">
                K
              </div>

              <div className="hidden min-w-[80px] text-left sm:block">
                <p className="text-sm font-extrabold leading-tight">
                  Keyse
                </p>

                <p className="mt-1 text-xs text-green-100">
                  Maamule
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
              <div className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl">
                <div className="flex items-center gap-3 px-5 py-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e7f5eb] font-extrabold text-[#075b35]">
                    K
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-extrabold text-[#064b2c]">
                      Keyse
                    </p>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Maamule
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

                    {loggingOut ? "Waa laga baxayaa..." : "Ka Bax"}
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
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-2xl bg-[#075b35] px-4 py-3 font-bold text-white"
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

              Dashboard
            </Link>

            {/* EXPENSES */}
            <Link
              href="/dashboard/expenses"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-[#17452f] transition hover:bg-[#edf6ef]"
            >
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

              Kharashaadka / Expenses
            </Link>

            {/* EGGS */}
            <Link
              href="/dashboard/eggs"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-[#17452f] transition hover:bg-[#edf6ef]"
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
                  d="M12 3C8.8 3 6 8.4 6 13a6 6 0 0 0 12 0c0-4.6-2.8-10-6-10Z"
                />
              </svg>

              Ukumaha / Eggs
            </Link>
          </nav>
        </aside>

        {/* DASHBOARD CONTENT */}
        <section>
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#b38420]">
              Maamulka
            </p>

            <h2 className="mt-1 text-3xl font-extrabold text-[#064b2c] sm:text-4xl">
              Dashboard
            </h2>

            <p className="mt-2 text-slate-500">
              Ku soo dhawoow nidaamka maamulka Siraaje Poultry Feed.
            </p>
          </div>

          {/* SUMMARY CARDS */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-6 w-6"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="14"
                      rx="2"
                    />

                    <path d="M3 9h18" />
                    <path d="M16 14h2" />
                  </svg>
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
                </div>
              </div>
            </div>

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
                </div>

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#dcf7e6] text-[#075b35]">
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
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="mt-7 grid gap-5 xl:grid-cols-2">
            {/* EXPENSE QUICK ACTION */}
            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-[#075b35]">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="h-5 w-5"
                      >
                        <path d="M12 5v14" />
                        <path d="M5 12h14" />
                      </svg>
                    </div>

                    <h3 className="text-xl font-extrabold text-[#064b2c]">
                      Kharash cusub / New Expense
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Diiwaangeli kharashka dhismaha ama kharashka
                    productiga, kadibna ka maamul qaybta Kharashaadka.
                  </p>
                </div>

                <Link
                  href="/dashboard/expenses"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#075b35] px-6 font-bold text-white shadow-md transition hover:bg-[#064b2c]"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-5 w-5"
                  >
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>

                  Ku Dar Kharash / Add Expense
                </Link>
              </div>
            </div>

            {/* EGGS QUICK ACTION */}
            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm sm:p-8">
              <div className="flex h-full flex-col justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff3d6] text-[#9a6b08]">
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
                    </div>

                    <h3 className="text-xl font-extrabold text-[#064b2c]">
                      Ukumaha / Eggs
                    </h3>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Diiwaangeli ukumaha la soo gatay iyo ukumaha la iibiyay,
                    kadibna ka maamul dhammaan diiwaannada qaybta Ukumaha.
                  </p>
                </div>

                <Link
                  href="/dashboard/eggs"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#b38420] px-6 font-bold text-white shadow-md transition hover:bg-[#966d15]"
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
                      d="M12 3C8.8 3 6 8.4 6 13a6 6 0 0 0 12 0c0-4.6-2.8-10-6-10Z"
                    />
                  </svg>

                  Fur Ukumaha / Open Eggs
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 Siraaje Poultry & Feeds Company
          </p>
        </section>
      </div>
    </main>
  );
}