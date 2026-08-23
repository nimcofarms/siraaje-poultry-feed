"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Expense = {
  id: string;
  category: string;
  name: string;
  description: string | null;
  date: string;
  purchasePlace: string | null;
  quantity: number | null;
  unit: string | null;
  unitPrice: number | null;
  workers: number | null;
  workDays: number | null;
  laborCost: number | null;
  amount: number;
  currency: string;
  paymentMethod: string | null;
  supplier: string | null;
  receiptNumber: string | null;
  notes: string | null;
};

const initialForm = {
  category: "Alaabta ceeriin",
  name: "",
  description: "",
  date: new Date().toISOString().split("T")[0],
  purchasePlace: "",
  quantity: "",
  unit: "",
  unitPrice: "",
  workers: "",
  workDays: "",
  laborCost: "",
  amount: "",
  currency: "ETB",
  paymentMethod: "Cash",
  supplier: "",
  receiptNumber: "",
  notes: "",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadExpenses() {
    try {
      setLoading(true);

      const response = await fetch("/api/expenses", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kharashaadka lama soo qaadi karin.");
      }

      setExpenses(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kharashaadka lama soo qaadi karin."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadExpenses();
  }, []);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const monthExpenses = useMemo(() => {
    const now = new Date();

    return expenses
      .filter((expense) => {
        const date = new Date(expense.date);

        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  function updateField(
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLSelectElement>
      | React.ChangeEvent<HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Kharashka lama kaydin.");
      }

      setSuccess("Kharashka si guul leh ayaa loo kaydiyay.");
      setForm({
        ...initialForm,
        date: new Date().toISOString().split("T")[0],
      });

      await loadExpenses();

      setTimeout(() => {
        setShowForm(false);
        setSuccess("");
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kharashka lama kaydin."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatMoney(amount: number, currency = "ETB") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(amount) + ` ${currency}`;
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2]">
      {/* HEADER */}
      <header className="bg-[#075b35] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <h1 className="text-2xl font-extrabold">
              Siraaje Poultry Feed
            </h1>

            <p className="mt-1 text-sm text-green-100">
              Nidaamka Maamulka Kharashaadka
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl bg-white/10 px-5 py-2.5 text-sm font-bold transition hover:bg-white/20"
          >
            ← Bogga Maamulka
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6">
        {/* TITLE */}
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div>
            <h2 className="text-3xl font-extrabold text-[#064b2c]">
              Kharashaadka
            </h2>

            <p className="mt-2 text-slate-500">
              Diiwaangeli oo la soco dhammaan lacagaha ka baxa mashruuca.
            </p>
          </div>

          <button
            onClick={() => {
              setError("");
              setSuccess("");
              setShowForm(true);
            }}
            className="rounded-2xl bg-[#075b35] px-6 py-3.5 font-bold text-white shadow-lg transition hover:bg-[#064b2c]"
          >
            + Ku dar Kharash
          </button>
        </div>

        {/* SUMMARY */}
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Wadarta Kharashaadka
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
              {formatMoney(totalExpenses)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Kharashaadka Bishan
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
              {formatMoney(monthExpenses)}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Tirada Diiwaannada
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
              {expenses.length}
            </p>
          </div>
        </div>

        {/* ERROR */}
        {error && !showForm && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-medium text-red-700">
            {error}
          </div>
        )}

        {/* TABLE */}
        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h3 className="text-xl font-bold text-[#064b2c]">
              Dhammaan Kharashaadka
            </h3>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">
              Kharashaadka waa la soo qaadayaa...
            </div>
          ) : expenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl">🧾</div>

              <h4 className="mt-4 text-lg font-bold text-slate-700">
                Weli kharash lama diiwaangelin
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                Riix “Ku dar Kharash” si aad u bilowdo.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left">
                <thead className="bg-[#f7f9f5] text-sm text-slate-600">
                  <tr>
                    <th className="px-6 py-4">Taariikh</th>
                    <th className="px-6 py-4">Nooca</th>
                    <th className="px-6 py-4">Magaca</th>
                    <th className="px-6 py-4">Meesha</th>
                    <th className="px-6 py-4">Lacag bixinta</th>
                    <th className="px-6 py-4 text-right">Wadarta</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {expenses.map((expense) => (
                    <tr
                      key={expense.id}
                      className="transition hover:bg-[#fafbf8]"
                    >
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-[#075b35]">
                          {expense.category}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {expense.name}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {expense.purchasePlace || "—"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600">
                        {expense.paymentMethod || "—"}
                      </td>

                      <td className="whitespace-nowrap px-6 py-4 text-right font-extrabold text-[#075b35]">
                        {formatMoney(expense.amount, expense.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-4xl rounded-[32px] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
              <div>
                <h2 className="text-2xl font-extrabold text-[#064b2c]">
                  Ku dar Kharash
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Geli faahfaahinta kharashka.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8">
              {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-semibold text-green-700">
                  ✓ {success}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Nooca Kharashka *">
                  <select
                    name="category"
                    value={form.category}
                    onChange={updateField}
                    className={inputClass}
                  >
                    <option>Alaabta ceeriin</option>
                    <option>Shaqaale</option>
                    <option>Gaadiid</option>
                    <option>Koronto</option>
                    <option>Shidaal</option>
                    <option>Dayactir</option>
                    <option>Qalab</option>
                    <option>Kirada</option>
                    <option>Biyo</option>
                    <option>Baakadaha</option>
                    <option>Kharash kale</option>
                  </select>
                </Field>

                <Field label="Magaca Kharashka *">
                  <input
                    name="name"
                    value={form.name}
                    onChange={updateField}
                    placeholder="Tusaale: Galley"
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="Taariikhda *">
                  <input
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={updateField}
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="Meesha laga gatay">
                  <input
                    name="purchasePlace"
                    value={form.purchasePlace}
                    onChange={updateField}
                    placeholder="Tusaale: Jigjiga"
                    className={inputClass}
                  />
                </Field>

                <Field label="Supplier / Qofka laga gatay">
                  <input
                    name="supplier"
                    value={form.supplier}
                    onChange={updateField}
                    placeholder="Magaca supplier-ka"
                    className={inputClass}
                  />
                </Field>

                <Field label="Tirada">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="quantity"
                    value={form.quantity}
                    onChange={updateField}
                    placeholder="0"
                    className={inputClass}
                  />
                </Field>

                <Field label="Unit">
                  <select
                    name="unit"
                    value={form.unit}
                    onChange={updateField}
                    className={inputClass}
                  >
                    <option value="">Dooro</option>
                    <option value="kg">kg</option>
                    <option value="ton">Ton</option>
                    <option value="kiish">Kiish</option>
                    <option value="piece">Xabbo</option>
                    <option value="liter">Litir</option>
                    <option value="day">Maalin</option>
                  </select>
                </Field>

                <Field label="Qiimaha halkii Unit">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="unitPrice"
                    value={form.unitPrice}
                    onChange={updateField}
                    placeholder="0"
                    className={inputClass}
                  />
                </Field>

                <Field label="Tirada Shaqaalaha">
                  <input
                    type="number"
                    min="0"
                    name="workers"
                    value={form.workers}
                    onChange={updateField}
                    placeholder="0"
                    className={inputClass}
                  />
                </Field>

                <Field label="Maalmaha ay shaqeeyeen">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="workDays"
                    value={form.workDays}
                    onChange={updateField}
                    placeholder="0"
                    className={inputClass}
                  />
                </Field>

                <Field label="Kharashka Shaqaalaha">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="laborCost"
                    value={form.laborCost}
                    onChange={updateField}
                    placeholder="0"
                    className={inputClass}
                  />
                </Field>

                <Field label="Wadarta Lacagta *">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    name="amount"
                    value={form.amount}
                    onChange={updateField}
                    placeholder="0"
                    required
                    className={inputClass}
                  />
                </Field>

                <Field label="Lacagta">
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={updateField}
                    className={inputClass}
                  >
                    <option value="ETB">ETB - Birr</option>
                    <option value="USD">USD - Dollar</option>
                    <option value="SEK">SEK - Krona</option>
                  </select>
                </Field>

                <Field label="Habka Lacag Bixinta">
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={updateField}
                    className={inputClass}
                  >
                    <option>Cash</option>
                    <option>Bank</option>
                    <option>Mobile Money</option>
                    <option>Kale</option>
                  </select>
                </Field>

                <Field label="Lambarka Rasiidka">
                  <input
                    name="receiptNumber"
                    value={form.receiptNumber}
                    onChange={updateField}
                    placeholder="Haddii uu jiro"
                    className={inputClass}
                  />
                </Field>

                <Field label="Faahfaahin">
                  <input
                    name="description"
                    value={form.description}
                    onChange={updateField}
                    placeholder="Faahfaahin kooban"
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-5">
                <Field label="Qoraal Dheeraad ah">
                  <textarea
                    name="notes"
                    value={form.notes}
                    onChange={updateField}
                    rows={4}
                    placeholder="Wax kasta oo kale halkan ku qor..."
                    className={inputClass}
                  />
                </Field>
              </div>

              <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Jooji
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-[#075b35] px-7 py-3 font-bold text-white shadow-md transition hover:bg-[#064b2c] disabled:opacity-60"
                >
                  {saving ? "Waa la kaydinayaa..." : "Kaydi Kharashka"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#087343] focus:ring-4 focus:ring-green-100";

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