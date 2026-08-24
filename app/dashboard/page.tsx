"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Expense = {
  id: string;
  amount: number;
};

export default function DashboardPage() {
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);

  useEffect(() => {
    async function loadExpenses() {
      try {
        const response = await fetch("/api/expenses", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();

        const expenses: Expense[] = Array.isArray(data)
          ? data
          : data.expenses ?? [];

        setExpenseCount(expenses.length);

        const total = expenses.reduce(
          (sum, expense) => sum + Number(expense.amount || 0),
          0
        );

        setTotalExpenses(total);
      } catch (error) {
        console.error("Dashboard expense error:", error);
      }
    }

    loadExpenses();
  }, []);

  return (
    <main className="min-h-screen bg-[#f7f5ed]">
      {/* HEADER */}
      <header className="border-b border-[#e5dfd0] bg-[#075b35] text-white">
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

          <div className="hidden text-right sm:block">
            <p className="font-bold">Maamulka</p>
            <p className="text-sm text-green-100">Dashboard</p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[250px_1fr]">
        {/* SIDEBAR */}
        <aside className="h-fit rounded-3xl border border-[#e7e1d4] bg-white p-4 shadow-sm">
          <nav className="space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-2xl bg-[#075b35] px-4 py-3 font-bold text-white"
            >
              <span className="text-xl">⌂</span>
              Dashboard
            </Link>

            <Link
              href="/dashboard/expenses"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-[#17452f] transition hover:bg-[#edf6ef]"
            >
              <span className="text-xl">₿</span>
              Kharashaadka
            </Link>
          </nav>

          <div className="mt-8 border-t border-slate-100 pt-4">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-2xl px-4 py-3 font-semibold text-red-600 transition hover:bg-red-50"
            >
              <span>↪</span>
              Ka Bax
            </Link>
          </div>
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

          {/* CARDS */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {/* KHARASH TOTAL */}
            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Wadarta Kharashaadka
                  </p>

                  <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
                    {totalExpenses.toLocaleString()} ETB
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e5f5e9] text-xl font-bold text-[#075b35]">
                  $
                </div>
              </div>
            </div>

            {/* TIRADA KHARASHYADA */}
            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Diiwaannada Kharashaadka
                  </p>

                  <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
                    {expenseCount}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#fff2cc] text-xl">
                  📋
                </div>
              </div>
            </div>

            {/* STATUS */}
            <div className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-500">
                    Xaaladda Nidaamka
                  </p>

                  <p className="mt-3 text-2xl font-extrabold text-[#075b35]">
                    Shaqaynaya
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#dcf7e6] font-extrabold text-[#075b35]">
                  ✓
                </div>
              </div>
            </div>
          </div>

          {/* QUICK ACTION */}
          <div className="mt-7 rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  Kharash cusub
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Diiwaangeli alaab, adeeg, shaqaale ama kharash kale oo
                  shirkadda galay.
                </p>
              </div>

              <Link
                href="/dashboard/expenses"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#075b35] px-6 font-bold text-white shadow-md transition hover:bg-[#064b2c]"
              >
                + Ku Dar Kharash
              </Link>
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