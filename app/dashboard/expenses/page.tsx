"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";

type ConstructionExpense = {
  id: string;
  date: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  total: number;
  currency: string;
};

type ProductExpense = {
  id: string;
  date: string;
  name: string;
  type: string;
  quantity: number;
  price: number;
  transport: number;
  total: number;
  currency: string;
};

type Section = "construction" | "product";
type ModalType = Section | null;

const today = () => new Date().toISOString().split("T")[0];

const initialConstructionForm = {
  date: today(),
  name: "",
  type: "",
  quantity: "",
  price: "",
};

const initialProductForm = {
  date: today(),
  name: "Gallay",
  type: "",
  quantity: "",
  price: "",
  transport: "",
};

const products = [
  "Gallay",
  "Soyabean",
  "Corn Maize",
  "White Sunflower",
  "Black Sunflower",
  "Premix",
  "Lafaha Malayga",
  "Dhagaxaanta Nuurada",
];

export default function ExpensesPage() {
  const [section, setSection] = useState<Section>("construction");
  const [modal, setModal] = useState<ModalType>(null);

  const [constructionExpenses, setConstructionExpenses] = useState<
    ConstructionExpense[]
  >([]);

  const [productExpenses, setProductExpenses] = useState<ProductExpense[]>([]);

  const [constructionForm, setConstructionForm] = useState(
    initialConstructionForm
  );

  const [productForm, setProductForm] = useState(initialProductForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadExpenses() {
    try {
      setLoading(true);
      setError("");

      const [constructionResponse, productResponse] = await Promise.all([
        fetch("/api/construction-expenses", { cache: "no-store" }),
        fetch("/api/product-expenses", { cache: "no-store" }),
      ]);

      const constructionData = await constructionResponse.json();
      const productData = await productResponse.json();

      if (!constructionResponse.ok) {
        throw new Error(
          constructionData.error ||
            "Kharashaadka dhismaha lama soo qaadi karin."
        );
      }

      if (!productResponse.ok) {
        throw new Error(
          productData.error ||
            "Kharashaadka productiga lama soo qaadi karin."
        );
      }

      setConstructionExpenses(constructionData);
      setProductExpenses(productData);
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

  const constructionTotal = useMemo(
    () =>
      constructionExpenses.reduce(
        (sum, expense) => sum + expense.total,
        0
      ),
    [constructionExpenses]
  );

  const productTotal = useMemo(
    () =>
      productExpenses.reduce(
        (sum, expense) => sum + expense.total,
        0
      ),
    [productExpenses]
  );

  const grandTotal = constructionTotal + productTotal;

  const constructionPreviewTotal =
    (Number(constructionForm.quantity) || 0) *
    (Number(constructionForm.price) || 0);

  const productPreviewTotal =
    (Number(productForm.quantity) || 0) *
      (Number(productForm.price) || 0) +
    (Number(productForm.transport) || 0);

  function openModal(type: Section) {
    setEditingId(null);
    setError("");
    setSuccess("");

    if (type === "construction") {
      setConstructionForm({
        ...initialConstructionForm,
        date: today(),
      });
    } else {
      setProductForm({
        ...initialProductForm,
        date: today(),
      });
    }

    setModal(type);
  }

  function closeModal() {
    setModal(null);
    setEditingId(null);
    setError("");
    setSuccess("");
  }

  function editConstruction(expense: ConstructionExpense) {
    setEditingId(expense.id);

    setConstructionForm({
      date: new Date(expense.date).toISOString().split("T")[0],
      name: expense.name,
      type: expense.type,
      quantity: String(expense.quantity),
      price: String(expense.price),
    });

    setError("");
    setSuccess("");
    setModal("construction");
  }

  function editProduct(expense: ProductExpense) {
    setEditingId(expense.id);

    setProductForm({
      date: new Date(expense.date).toISOString().split("T")[0],
      name: expense.name,
      type: expense.type,
      quantity: String(expense.quantity),
      price: String(expense.price),
      transport: String(expense.transport),
    });

    setError("");
    setSuccess("");
    setModal("product");
  }

  async function deleteExpense(type: Section, id: string) {
    const confirmed = window.confirm(
      "Ma hubtaa inaad rabto inaad tirtirto kharashkan? Xogtan dib looma soo celin karo."
    );

    if (!confirmed) return;

    try {
      setDeletingId(id);
      setError("");

      const endpoint =
        type === "construction"
          ? "/api/construction-expenses"
          : "/api/product-expenses";

      const response = await fetch(
        `${endpoint}?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Kharashka lama tirtiri karin."
        );
      }

      await loadExpenses();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kharashka lama tirtiri karin."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function submitConstruction(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/construction-expenses", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...constructionForm,
          id: editingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (editingId
              ? "Kharashka dhismaha lama beddeli karin."
              : "Kharashka dhismaha lama kaydin.")
        );
      }

      setSuccess(
        editingId
          ? "Kharashka dhismaha waa la beddelay."
          : "Kharashka dhismaha waa la kaydiyay."
      );

      setEditingId(null);

      setConstructionForm({
        ...initialConstructionForm,
        date: today(),
      });

      await loadExpenses();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kharashka dhismaha lama kaydin."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/product-expenses", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...productForm,
          id: editingId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (editingId
              ? "Kharashka productiga lama beddeli karin."
              : "Kharashka productiga lama kaydin.")
        );
      }

      setSuccess(
        editingId
          ? "Kharashka productiga waa la beddelay."
          : "Kharashka productiga waa la kaydiyay."
      );

      setEditingId(null);

      setProductForm({
        ...initialProductForm,
        date: today(),
      });

      await loadExpenses();

      setTimeout(() => {
        closeModal();
      }, 700);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Kharashka productiga lama kaydin."
      );
    } finally {
      setSaving(false);
    }
  }

  function formatMoney(amount: number) {
    return (
      new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2,
      }).format(amount) + " ETB"
    );
  }

  function formatNumber(amount: number) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(date: string) {
    return new Date(date).toLocaleDateString("en-GB");
  }

  return (
    <main className="min-h-screen bg-[#f6f7f2]">
      <header className="bg-[#075b35] text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
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
        <div>
          <h2 className="text-3xl font-extrabold text-[#064b2c]">
            Kharashaadka
          </h2>

          <p className="mt-2 text-slate-500">
            La soco kharashka dhismaha iyo kharashka productiga.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <SummaryCard
            title="Kharashka Dhismaha"
            value={formatMoney(constructionTotal)}
            icon="🏗️"
          />

          <SummaryCard
            title="Kharashka Productiga"
            value={formatMoney(productTotal)}
            icon="🌾"
          />

          <SummaryCard
            title="Wadarta Guud"
            value={formatMoney(grandTotal)}
            icon="💰"
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => setSection("construction")}
            className={`rounded-3xl border p-6 text-left shadow-sm transition ${
              section === "construction"
                ? "border-[#075b35] bg-[#075b35] text-white"
                : "border-slate-100 bg-white text-slate-800 hover:border-green-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
                  section === "construction"
                    ? "bg-white/15"
                    : "bg-green-50"
                }`}
              >
                🏗️
              </div>

              <div>
                <h3 className="text-xl font-extrabold">
                  Kharashka Dhismaha
                </h3>

                <p
                  className={`mt-1 text-sm ${
                    section === "construction"
                      ? "text-green-100"
                      : "text-slate-500"
                  }`}
                >
                  Alaabta iyo kharashaadka dhismaha.
                </p>
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSection("product")}
            className={`rounded-3xl border p-6 text-left shadow-sm transition ${
              section === "product"
                ? "border-[#075b35] bg-[#075b35] text-white"
                : "border-slate-100 bg-white text-slate-800 hover:border-green-200"
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${
                  section === "product"
                    ? "bg-white/15"
                    : "bg-green-50"
                }`}
              >
                🌾
              </div>

              <div>
                <h3 className="text-xl font-extrabold">
                  Kharashka Productiga
                </h3>

                <p
                  className={`mt-1 text-sm ${
                    section === "product"
                      ? "text-green-100"
                      : "text-slate-500"
                  }`}
                >
                  Quudka iyo alaabta wax-soo-saarka.
                </p>
              </div>
            </div>
          </button>
        </div>

        {error && !modal && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
            {error}
          </div>
        )}

        {section === "construction" && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  Kharashka Dhismaha
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Wadarta: {formatMoney(constructionTotal)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openModal("construction")}
                className="rounded-xl bg-[#075b35] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#064b2c]"
              >
                + Ku Dar Kharash
              </button>
            </div>

            {loading ? (
              <Loading />
            ) : constructionExpenses.length === 0 ? (
              <EmptyState
                icon="🏗️"
                text="Weli kharash dhisme lama diiwaangelin."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1050px] text-left">
                  <thead className="bg-[#f7f9f5] text-sm text-slate-600">
                    <tr>
                      <th className="px-6 py-4">Taariikhda</th>
                      <th className="px-6 py-4">Magaca</th>
                      <th className="px-6 py-4">Nooca</th>
                      <th className="px-6 py-4 text-right">Tirada</th>
                      <th className="px-6 py-4 text-right">Qiimaha</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-center">
                        Maamul
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {constructionExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="transition hover:bg-[#fafbf8]"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDate(expense.date)}
                        </td>

                        <td className="px-6 py-4 font-bold text-slate-800">
                          {expense.name}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {expense.type}
                        </td>

                        <td className="px-6 py-4 text-right text-slate-700">
                          {formatNumber(expense.quantity)}
                        </td>

                        <td className="px-6 py-4 text-right text-slate-700">
                          {formatMoney(expense.price)}
                        </td>

                        <td className="px-6 py-4 text-right font-extrabold text-[#075b35]">
                          {formatMoney(expense.total)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                editConstruction(expense)
                              }
                              className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-bold text-[#075b35] transition hover:bg-green-100"
                            >
                              ✎ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteExpense(
                                  "construction",
                                  expense.id
                                )
                              }
                              disabled={deletingId === expense.id}
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingId === expense.id
                                ? "..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
                {section === "product" && (
          <section className="mt-8 overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  Kharashka Productiga
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Wadarta: {formatMoney(productTotal)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => openModal("product")}
                className="rounded-xl bg-[#075b35] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#064b2c]"
              >
                + Ku Dar Kharash
              </button>
            </div>

            {loading ? (
              <Loading />
            ) : productExpenses.length === 0 ? (
              <EmptyState
                icon="🌾"
                text="Weli kharash product lama diiwaangelin."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left">
                  <thead className="bg-[#f7f9f5] text-sm text-slate-600">
                    <tr>
                      <th className="px-6 py-4">Taariikhda</th>
                      <th className="px-6 py-4">Magaca</th>
                      <th className="px-6 py-4">Nooca</th>
                      <th className="px-6 py-4 text-right">Quantity</th>
                      <th className="px-6 py-4 text-right">Price</th>
                      <th className="px-6 py-4 text-right">Transport</th>
                      <th className="px-6 py-4 text-right">Total</th>
                      <th className="px-6 py-4 text-center">Maamul</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {productExpenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="transition hover:bg-[#fafbf8]"
                      >
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                          {formatDate(expense.date)}
                        </td>

                        <td className="px-6 py-4 font-bold text-slate-800">
                          {expense.name}
                        </td>

                        <td className="px-6 py-4 text-slate-600">
                          {expense.type}
                        </td>

                        <td className="px-6 py-4 text-right text-slate-700">
                          {formatNumber(expense.quantity)}
                        </td>

                        <td className="px-6 py-4 text-right text-slate-700">
                          {formatMoney(expense.price)}
                        </td>

                        <td className="px-6 py-4 text-right text-slate-700">
                          {formatMoney(expense.transport)}
                        </td>

                        <td className="px-6 py-4 text-right font-extrabold text-[#075b35]">
                          {formatMoney(expense.total)}
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => editProduct(expense)}
                              className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm font-bold text-[#075b35] transition hover:bg-green-100"
                            >
                              ✎ Edit
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                deleteExpense("product", expense.id)
                              }
                              disabled={deletingId === expense.id}
                              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingId === expense.id
                                ? "..."
                                : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>

      {/* DHISMAHA FORM */}
      {modal === "construction" && (
        <Modal
          title={
            editingId
              ? "Wax Ka Beddel Kharashka Dhismaha"
              : "Ku Dar Kharashka Dhismaha"
          }
          onClose={closeModal}
        >
          <form onSubmit={submitConstruction}>
            <Messages error={error} success={success} />

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Taariikhda *">
                <input
                  type="date"
                  value={constructionForm.date}
                  onChange={(e) =>
                    setConstructionForm({
                      ...constructionForm,
                      date: e.target.value,
                    })
                  }
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Magaca *">
                <input
                  value={constructionForm.name}
                  onChange={(e) =>
                    setConstructionForm({
                      ...constructionForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Tusaale: Sibidh, Bir, Alwaax..."
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Nooca *">
                <input
                  value={constructionForm.type}
                  onChange={(e) =>
                    setConstructionForm({
                      ...constructionForm,
                      type: e.target.value,
                    })
                  }
                  placeholder="Tusaale: Qalab dhisme"
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Tirada / Quantity *">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={constructionForm.quantity}
                  onChange={(e) =>
                    setConstructionForm({
                      ...constructionForm,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="0"
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Qiimaha halkii xabbo / unit *">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={constructionForm.price}
                  onChange={(e) =>
                    setConstructionForm({
                      ...constructionForm,
                      price: e.target.value,
                    })
                  }
                  placeholder="0"
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Total">
                <input
                  value={formatMoney(constructionPreviewTotal)}
                  readOnly
                  className={`${inputClass} bg-green-50 font-extrabold text-[#075b35]`}
                />
              </Field>
            </div>

            <FormButtons
              saving={saving}
              onCancel={closeModal}
              label={
                editingId
                  ? "Kaydi Isbeddelka"
                  : "Kaydi Kharashka"
              }
            />
          </form>
        </Modal>
      )}

      {/* PRODUCT FORM */}
      {modal === "product" && (
        <Modal
          title={
            editingId
              ? "Wax Ka Beddel Kharashka Productiga"
              : "Ku Dar Kharashka Productiga"
          }
          onClose={closeModal}
        >
          <form onSubmit={submitProduct}>
            <Messages error={error} success={success} />

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Taariikhda *">
                <input
                  type="date"
                  value={productForm.date}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      date: e.target.value,
                    })
                  }
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Magaca Productiga *">
                <select
                  value={productForm.name}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      name: e.target.value,
                    })
                  }
                  required
                  className={inputClass}
                >
                  {products.map((product) => (
                    <option key={product} value={product}>
                      {product}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Nooca / Type *">
                <input
                  value={productForm.type}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      type: e.target.value,
                    })
                  }
                  placeholder="Tusaale: Kiish, kg, ton..."
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Quantity *">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={productForm.quantity}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      quantity: e.target.value,
                    })
                  }
                  placeholder="0"
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Price *">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={productForm.price}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      price: e.target.value,
                    })
                  }
                  placeholder="0"
                  required
                  className={inputClass}
                />
              </Field>

              <Field label="Transport">
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={productForm.transport}
                  onChange={(e) =>
                    setProductForm({
                      ...productForm,
                      transport: e.target.value,
                    })
                  }
                  placeholder="0"
                  className={inputClass}
                />
              </Field>

              <Field label="Total">
                <input
                  value={formatMoney(productPreviewTotal)}
                  readOnly
                  className={`${inputClass} bg-green-50 font-extrabold text-[#075b35]`}
                />
              </Field>
            </div>

            <FormButtons
              saving={saving}
              onCancel={closeModal}
              label={
                editingId
                  ? "Kaydi Isbeddelka"
                  : "Kaydi Kharashka"
              }
            />
          </form>
        </Modal>
      )}
    </main>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-[#087343] focus:ring-4 focus:ring-green-100";

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-2xl font-extrabold text-[#075b35]">
            {value}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-xl">
          {icon}
        </div>
      </div>
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

function Loading() {
  return (
    <div className="p-12 text-center text-slate-500">
      Kharashaadka waa la soo qaadayaa...
    </div>
  );
}

function EmptyState({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="p-12 text-center">
      <div className="text-5xl">{icon}</div>

      <p className="mt-4 font-semibold text-slate-500">
        {text}
      </p>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 px-4 py-8 backdrop-blur-sm">
      <div className="mx-auto w-full max-w-3xl rounded-[32px] bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 sm:px-8">
          <div>
            <h2 className="text-2xl font-extrabold text-[#064b2c]">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Geli xogta kharashka hoose.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 transition hover:bg-slate-200"
          >
            ×
          </button>
        </div>

        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}

function Messages({
  error,
  success,
}: {
  error: string;
  success: string;
}) {
  return (
    <>
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
    </>
  );
}

function FormButtons({
  saving,
  onCancel,
  label,
}: {
  saving: boolean;
  onCancel: () => void;
  label: string;
}) {
  return (
    <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-6">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-600 transition hover:bg-slate-50"
      >
        Jooji
      </button>

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-[#075b35] px-7 py-3 font-bold text-white shadow-md transition hover:bg-[#064b2c] disabled:opacity-60"
      >
        {saving ? "Waa la kaydinayaa..." : label}
      </button>
    </div>
  );
}