"use client";

import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type FeedType = "Starter" | "Grower" | "Layer";

type AuditUser = {
  id?: string;
  name?: string | null;
  email?: string | null;
  role?: string | null;
};

type ProductionItem = {
  id: string;
  batchId?: string;
  feedType: FeedType;
  bagSizeKg: number;
  quantity: number;
  totalKg: number;
  createdAt?: string;
  updatedAt?: string;
};

type ProductionBatch = {
  id: string;
  date: string;
  location: string;
  items: ProductionItem[];
  createdBy?: AuditUser | null;
  updatedBy?: AuditUser | null;
  createdAt: string;
  updatedAt: string;
};

type ProductionForm = {
  date: string;
  location: string;
  bagSizeChoice: string;
  customBagSize: string;
  quantity: string;
};

type ProductionRecord = {
  batch: ProductionBatch;
  item: ProductionItem;
};

const FEED_TYPES: FeedType[] = ["Starter", "Grower", "Layer"];

const BAG_SIZE_OPTIONS = ["25", "50", "100", "custom"];

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function createEmptyForm(): ProductionForm {
  return {
    date: today(),
    location: "",
    bagSizeChoice: "50",
    customBagSize: "",
    quantity: "",
  };
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
  }).format(value);
}

function getBagSize(form: ProductionForm) {
  if (form.bagSizeChoice === "custom") {
    return Number(form.customBagSize);
  }

  return Number(form.bagSizeChoice);
}

function getFormTotalKg(form: ProductionForm) {
  const bagSizeKg = getBagSize(form);
  const quantity = Number(form.quantity);

  if (
    !Number.isFinite(bagSizeKg) ||
    !Number.isFinite(quantity) ||
    bagSizeKg <= 0 ||
    quantity <= 0
  ) {
    return 0;
  }

  return bagSizeKg * quantity;
}

function feedTypeSomali(feedType: FeedType) {
  if (feedType === "Starter") {
    return "Starter";
  }

  if (feedType === "Grower") {
    return "Grower";
  }

  return "Layer";
}

export default function ProductionPage() {
  const [batches, setBatches] = useState<ProductionBatch[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [selectedFeedType, setSelectedFeedType] =
    useState<FeedType>("Starter");

  const [editingBatchId, setEditingBatchId] = useState<string | null>(
    null
  );

  const [form, setForm] = useState<ProductionForm>(() =>
    createEmptyForm()
  );

  const loadProduction = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/feed-production", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Production records could not be loaded. / Xogta wax-soo-saarka lama soo qaadi karin."
        );
      }

      setBatches(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Production records could not be loaded. / Xogta wax-soo-saarka lama soo qaadi karin."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProduction();
  }, [loadProduction]);

  const productionRecords = useMemo<ProductionRecord[]>(() => {
    return batches.flatMap((batch) =>
      (batch.items || []).map((item) => ({
        batch,
        item,
      }))
    );
  }, [batches]);

  const starterRecords = useMemo(
    () =>
      productionRecords.filter(
        (record) => record.item.feedType === "Starter"
      ),
    [productionRecords]
  );

  const growerRecords = useMemo(
    () =>
      productionRecords.filter(
        (record) => record.item.feedType === "Grower"
      ),
    [productionRecords]
  );

  const layerRecords = useMemo(
    () =>
      productionRecords.filter(
        (record) => record.item.feedType === "Layer"
      ),
    [productionRecords]
  );

  function getRecords(feedType: FeedType) {
    if (feedType === "Starter") {
      return starterRecords;
    }

    if (feedType === "Grower") {
      return growerRecords;
    }

    return layerRecords;
  }

  function calculateSummary(records: ProductionRecord[]) {
    return records.reduce(
      (summary, record) => {
        summary.bags += Number(record.item.quantity || 0);
        summary.kg += Number(record.item.totalKg || 0);

        return summary;
      },
      {
        bags: 0,
        kg: 0,
      }
    );
  }

  const starterSummary = useMemo(
    () => calculateSummary(starterRecords),
    [starterRecords]
  );

  const growerSummary = useMemo(
    () => calculateSummary(growerRecords),
    [growerRecords]
  );

  const layerSummary = useMemo(
    () => calculateSummary(layerRecords),
    [layerRecords]
  );

  const allSummary = useMemo(
    () => calculateSummary(productionRecords),
    [productionRecords]
  );

  const formTotalKg = useMemo(
    () => getFormTotalKg(form),
    [form]
  );

  function openAddForm(feedType: FeedType) {
    setSelectedFeedType(feedType);
    setEditingBatchId(null);
    setForm(createEmptyForm());
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingBatchId(null);
    setForm(createEmptyForm());
  }

  function openEditForm(record: ProductionRecord) {
    const { batch, item } = record;

    const standardBagSize = ["25", "50", "100"].includes(
      String(item.bagSizeKg)
    );

    setSelectedFeedType(item.feedType);
    setEditingBatchId(batch.id);

    setForm({
      date: batch.date.slice(0, 10),
      location: batch.location ?? "",
      bagSizeChoice: standardBagSize
        ? String(item.bagSizeKg)
        : "custom",
      customBagSize: standardBagSize
        ? ""
        : String(item.bagSizeKg),
      quantity: String(item.quantity),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const location = form.location.trim();
    const bagSizeKg = getBagSize(form);
    const quantity = Number(form.quantity);

    if (!form.date || !location) {
      setError(
        "Please enter Date and Location. / Fadlan geli Taariikhda iyo Goobta."
      );
      return;
    }

    if (!Number.isFinite(bagSizeKg) || bagSizeKg <= 0) {
      setError(
        "Please enter a valid bag size. / Fadlan geli cabbir joorkeed sax ah."
      );
      return;
    }

    if (
      !Number.isFinite(quantity) ||
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      setError(
        "Quantity must be a whole number of bags. / Tiradu waa inay noqotaa tiro joonyado ah oo sax ah."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/feed-production", {
        method: editingBatchId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingBatchId
            ? { id: editingBatchId }
            : {}),
          date: form.date,
          location,
          items: [
            {
              feedType: selectedFeedType,
              bagSizeKg,
              quantity,
            },
          ],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Production could not be saved. / Wax-soo-saarka lama kaydin karin."
        );
      }

      await loadProduction();

      setShowForm(false);
      setEditingBatchId(null);
      setForm(createEmptyForm());

      setSuccess(
        editingBatchId
          ? `${selectedFeedType} production updated successfully. / Wax-soo-saarka ${selectedFeedType} waa la cusboonaysiiyay.`
          : `${selectedFeedType} production saved successfully. / Wax-soo-saarka ${selectedFeedType} waa la kaydiyay.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Production could not be saved. / Wax-soo-saarka lama kaydin karin."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(record: ProductionRecord) {
    const { batch, item } = record;

    const confirmed = window.confirm(
      `Delete this ${item.feedType} production record? / Ma tirtiraysaa diiwaankan ${item.feedType}?`
    );

    if (!confirmed) return;

    try {
      setDeletingId(batch.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/feed-production?id=${encodeURIComponent(batch.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Production record could not be deleted. / Diiwaanka lama tirtiri karin."
        );
      }

      await loadProduction();

      setSuccess(
        `${item.feedType} production deleted successfully. / Diiwaanka ${item.feedType} waa la tirtiray.`
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Production record could not be deleted. / Diiwaanka lama tirtiri karin."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function ProductionTable({
    feedType,
  }: {
    feedType: FeedType;
  }) {
    const records = getRecords(feedType);
    const summary = calculateSummary(records);

    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-xl">
                🏭
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {feedType} Production
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {feedTypeSomali(feedType)} Feed Production Records
                  / Diiwaanka wax-soo-saarka {feedType}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openAddForm(feedType)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
          >
            + Add {feedType} Production
          </button>
        </div>

        <div className="grid gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Records
            </p>

            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {records.length}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Bags / Wadarta Joonyadaha
            </p>

            <p className="mt-1 text-lg font-extrabold text-slate-900">
              {formatNumber(summary.bags)}
            </p>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Total Weight / Wadarta KG
            </p>

            <p className="mt-1 text-lg font-extrabold text-emerald-700">
              {formatNumber(summary.kg)} KG
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Date / Taariikhda
                </th>

                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Location / Goobta
                </th>

                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Bag Size / Cabbirka
                </th>

                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Quantity / Bags
                </th>

                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Total Weight
                </th>

                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Entered By
                </th>

                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Entered At
                </th>

                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Loading production records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    No {feedType} production records yet. /
                    Weli wax {feedType} production ah lama diiwaangelin.
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <tr
                    key={`${record.batch.id}-${record.item.id}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                      {formatDate(record.batch.date)}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {record.batch.location || "—"}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatNumber(record.item.bagSizeKg)} KG
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatNumber(record.item.quantity)}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-extrabold text-emerald-700">
                      {formatNumber(record.item.totalKg)} KG
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm">
                      {record.batch.createdBy ? (
                        <div>
                          <p className="font-bold text-slate-900">
                            {record.batch.createdBy.name || "—"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-400">
                            {record.batch.createdBy.role || ""}
                          </p>
                        </div>
                      ) : (
                        <span className="font-semibold text-slate-400">
                          Old record
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                      {formatDateTime(record.batch.createdAt)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(record)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={deletingId === record.batch.id}
                          onClick={() => handleDelete(record)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {deletingId === record.batch.id
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

            <tfoot className="border-t border-slate-200 bg-slate-50">
              <tr>
                <td
                  colSpan={3}
                  className="px-4 py-4 text-right text-sm font-bold text-slate-700"
                >
                  {feedType} Total
                </td>

                <td className="px-4 py-4 text-right text-sm font-extrabold text-slate-900">
                  {formatNumber(summary.bags)} bags
                </td>

                <td className="px-4 py-4 text-right text-sm font-extrabold text-emerald-700">
                  {formatNumber(summary.kg)} KG
                </td>

                <td colSpan={3} />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    );
  }
    return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">

        {/* HEADER */}

        <div className="mb-7">
          <Link
            href="/dashboard/feeds"
            className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 transition hover:text-emerald-800"
          >
            ← Back to Feeds Sold
          </Link>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                Siraaje Poultry & Feeds Company
              </p>

              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                Production / Wax-soo-saarka
              </h1>

              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Record and manage Starter, Grower and Layer feed
                production separately.
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            {success}
          </div>
        )}

        {/* OVERVIEW */}

        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Starter Production
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatNumber(starterSummary.kg)} KG
            </p>

            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {formatNumber(starterSummary.bags)} bags
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Grower Production
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatNumber(growerSummary.kg)} KG
            </p>

            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {formatNumber(growerSummary.bags)} bags
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">
              Layer Production
            </p>

            <p className="mt-2 text-2xl font-extrabold text-slate-900">
              {formatNumber(layerSummary.kg)} KG
            </p>

            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {formatNumber(layerSummary.bags)} bags
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
            <p className="text-sm font-bold text-emerald-700">
              All Production / Wadarta
            </p>

            <p className="mt-2 text-2xl font-extrabold text-emerald-800">
              {formatNumber(allSummary.kg)} KG
            </p>

            <p className="mt-1 text-sm font-semibold text-emerald-700">
              {formatNumber(allSummary.bags)} bags
            </p>
          </div>
        </div>

        {/* SEPARATE PRODUCTION CATEGORIES */}

        <div className="space-y-8">
          {FEED_TYPES.map((feedType) => (
            <ProductionTable
              key={feedType}
              feedType={feedType}
            />
          ))}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
                  {selectedFeedType} Production
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                  {editingBatchId
                    ? `Edit ${selectedFeedType} Production`
                    : `Add ${selectedFeedType} Production`}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Record the amount manufactured by the feed machine.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 transition hover:bg-slate-200 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              {/* SELECTED CATEGORY */}

              <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                  Feed Type / Nooca Quudinta
                </p>

                <p className="mt-1 text-xl font-extrabold text-emerald-800">
                  {selectedFeedType} Feed
                </p>

                <p className="mt-1 text-xs text-emerald-600">
                  This record will be saved only under the{" "}
                  {selectedFeedType} Production category.
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                {/* DATE */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Date / Taariikhda
                  </label>

                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* LOCATION */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Location / Goobta
                  </label>

                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        location: event.target.value,
                      }))
                    }
                    placeholder="Example: Jigjiga"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* BAG SIZE */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Bag Size / Cabbirka Joorka
                  </label>

                  <select
                    required
                    value={form.bagSizeChoice}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        bagSizeChoice: event.target.value,
                        customBagSize:
                          event.target.value === "custom"
                            ? current.customBagSize
                            : "",
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    {BAG_SIZE_OPTIONS.map((option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option === "custom"
                          ? "Custom Size"
                          : `${option} KG`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* CUSTOM BAG SIZE */}

                {form.bagSizeChoice === "custom" && (
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Custom Bag Size (KG)
                    </label>

                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={form.customBagSize}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          customBagSize: event.target.value,
                        }))
                      }
                      placeholder="Example: 75"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                )}

                {/* QUANTITY */}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Quantity / Number of Bags
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    placeholder="Example: 100"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* AUTOMATIC TOTAL */}

                <div className="sm:col-span-2">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-emerald-700">
                          Total Weight / Wadarta Miisaanka
                        </p>

                        <p className="mt-1 text-xs font-medium text-emerald-600">
                          Bag Size × Number of Bags
                        </p>
                      </div>

                      <p className="text-3xl font-extrabold text-emerald-800">
                        {formatNumber(formTotalKg)} KG
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              )}

              {/* BUTTONS */}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel / Jooji
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : editingBatchId
                      ? `Save ${selectedFeedType} Changes`
                      : `Save ${selectedFeedType} Production`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}