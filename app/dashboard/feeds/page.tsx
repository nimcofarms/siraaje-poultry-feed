"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type FeedType = "Starter" | "Grower" | "Layer";

type Feed = {
  id: string;
  date: string;
  feedType: FeedType;
  companyName: string;
  suppliedBy: string;
  quantity: number;
  price: number;
  total: number;
  currency: string;
};

type FeedForm = {
  date: string;
  feedType: FeedType;
  companyName: string;
  suppliedBy: string;
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

function createEmptyForm(feedType: FeedType = "Starter"): FeedForm {
  return {
    date: today(),
    feedType,
    companyName: "",
    suppliedBy: "",
    quantity: "",
    price: "",
  };
}

function formatDate(date: string) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function formatMoney(value: number, currency = "ETB") {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + ` ${currency}`;
}

function feedTypeLabel(feedType: FeedType) {
  if (feedType === "Starter") {
    return "Starter Feed";
  }

  if (feedType === "Grower") {
    return "Grower Feed";
  }

  return "Layer Feed";
}

const sidebarItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "▦",
  },
  {
    href: "/dashboard/expenses",
    label: "Kharashaadka / Expenses",
    icon: "💰",
  },
  {
    href: "/dashboard/eggs",
    label: "Ukumaha / Eggs",
    icon: "🥚",
  },
  {
    href: "/dashboard/feeds",
    label: "Quudinta / Feeds",
    icon: "🌾",
  },
];

export default function FeedsPage() {
  const pathname = usePathname();

  const [feeds, setFeeds] = useState<Feed[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState<FeedForm>(() => createEmptyForm());

  async function loadFeeds() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/feeds", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Xogta quudinta lama soo qaadi karin. / Feed records could not be loaded."
        );
      }

      setFeeds(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Xogta quudinta lama soo qaadi karin. / Feed records could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeeds();
  }, []);

  const starterFeeds = useMemo(
    () => feeds.filter((feed) => feed.feedType === "Starter"),
    [feeds]
  );

  const growerFeeds = useMemo(
    () => feeds.filter((feed) => feed.feedType === "Grower"),
    [feeds]
  );

  const layerFeeds = useMemo(
    () => feeds.filter((feed) => feed.feedType === "Layer"),
    [feeds]
  );

  const grandTotal = useMemo(
    () => feeds.reduce((sum, feed) => sum + Number(feed.total || 0), 0),
    [feeds]
  );

  const starterTotal = useMemo(
    () =>
      starterFeeds.reduce(
        (sum, feed) => sum + Number(feed.total || 0),
        0
      ),
    [starterFeeds]
  );

  const growerTotal = useMemo(
    () =>
      growerFeeds.reduce(
        (sum, feed) => sum + Number(feed.total || 0),
        0
      ),
    [growerFeeds]
  );

  const layerTotal = useMemo(
    () =>
      layerFeeds.reduce(
        (sum, feed) => sum + Number(feed.total || 0),
        0
      ),
    [layerFeeds]
  );

  const formTotal = useMemo(() => {
    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (
      !Number.isFinite(quantity) ||
      !Number.isFinite(price) ||
      quantity <= 0 ||
      price < 0
    ) {
      return 0;
    }

    return quantity * price;
  }, [form.quantity, form.price]);

  function openAddForm(feedType: FeedType = "Starter") {
    setEditingId(null);
    setForm(createEmptyForm(feedType));
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function openEditForm(feed: Feed) {
    setEditingId(feed.id);

    setForm({
      date: feed.date.slice(0, 10),
      feedType: feed.feedType,
      companyName: feed.companyName,
      suppliedBy: feed.suppliedBy,
      quantity: String(feed.quantity),
      price: String(feed.price),
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  }

  function closeForm() {
    if (saving) return;

    setShowForm(false);
    setEditingId(null);
    setForm(createEmptyForm());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const companyName = form.companyName.trim();
    const suppliedBy = form.suppliedBy.trim();
    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (
      !form.date ||
      !form.feedType ||
      !companyName ||
      !suppliedBy
    ) {
      setError(
        "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields."
      );
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError(
        "Fadlan geli tiro sax ah. / Please enter a valid quantity."
      );
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError(
        "Fadlan geli qiime sax ah. / Please enter a valid price."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/feeds", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          date: form.date,
          feedType: form.feedType,
          companyName,
          suppliedBy,
          quantity,
          price,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Xogta quudinta lama kaydin karin. / Feed record could not be saved."
        );
      }

      await loadFeeds();

      setShowForm(false);
      setEditingId(null);
      setForm(createEmptyForm());

      setSuccess(
        editingId
          ? "Xogta quudinta waa la cusboonaysiiyay. / Feed record updated successfully."
          : "Xogta quudinta waa la kaydiyay. / Feed record saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Xogta quudinta lama kaydin karin. / Feed record could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(feed: Feed) {
    const confirmed = window.confirm(
      `Ma hubtaa inaad tirtirayso ${feedTypeLabel(
        feed.feedType
      )} ee ${feed.companyName}? / Are you sure you want to delete this record?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `/api/feeds?id=${encodeURIComponent(feed.id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Xogta quudinta lama tirtiri karin. / Feed record could not be deleted."
        );
      }

      await loadFeeds();

      setSuccess(
        "Xogta quudinta waa la tirtiray. / Feed record deleted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Xogta quudinta lama tirtiri karin. / Feed record could not be deleted."
      );
    }
  }

  function FeedTable({
    title,
    subtitle,
    records,
    total,
    feedType,
  }: {
    title: string;
    subtitle: string;
    records: Feed[];
    total: number;
    feedType: FeedType;
  }) {
    return (
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => openAddForm(feedType)}
            className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            + Ku Dar / Add
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1050px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Taariikhda / Date
                </th>

                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Shirkadda / Company
                </th>

                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                  Qofka Siiyay / Supplied By
                </th>

                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Tirada / Quantity
                </th>

                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Qiimaha / Price
                </th>

                <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-wide text-slate-600">
                  Wadarta / Total
                </th>

                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                  Maamul / Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Xogta waa la soo qaadayaa... / Loading...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Weli wax xog ah lama diiwaangelin. / No records yet.
                  </td>
                </tr>
              ) : (
                records.map((feed) => (
                  <tr
                    key={feed.id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                      {formatDate(feed.date)}
                    </td>

                    <td className="px-4 py-4 text-sm font-semibold text-slate-900">
                      {feed.companyName}
                    </td>

                    <td className="px-4 py-4 text-sm text-slate-700">
                      {feed.suppliedBy}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {feed.quantity}
                    </td>

                    <td className="px-4 py-4 text-right text-sm text-slate-700">
                      {formatMoney(feed.price, feed.currency)}
                    </td>

                    <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                      {formatMoney(feed.total, feed.currency)}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(feed)}
                          className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                        >
                          Beddel / Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(feed)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Tirtir / Delete
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
                  colSpan={5}
                  className="px-4 py-4 text-right text-sm font-bold text-slate-700"
                >
                  Wadarta Guud / Section Total
                </td>

                <td className="px-4 py-4 text-right text-sm font-extrabold text-emerald-700">
                  {formatMoney(total)}
                </td>

                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    );
  }
    return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-200 px-6 py-6">
            <h1 className="text-xl font-extrabold text-emerald-700">
              Siraaje Poultry
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              & Feeds Company
            </p>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {sidebarItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <p className="text-xs text-slate-400">
              © 2026 Siraaje Poultry & Feeds Company
            </p>
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 flex-1">
          {/* Mobile navigation */}
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <div className="mb-3">
              <p className="font-extrabold text-emerald-700">
                Siraaje Poultry & Feeds
              </p>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {sidebarItems.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-emerald-600">
                  Siraaje Poultry & Feeds Company
                </p>

                <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                  Quudinta / Feeds
                </h1>

                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Maamul iibka Starter, Grower iyo Layer Feed. / Manage
                  Starter, Grower and Layer Feed records.
                </p>
              </div>

              <button
                type="button"
                onClick={() => openAddForm("Starter")}
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
              >
                + Ku Dar Quudin / Add Feed
              </button>
            </div>

            {/* Messages */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}

            {/* Summary */}
            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Starter Feed
                </p>

                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {starterFeeds.length}
                </p>

                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {formatMoney(starterTotal)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Grower Feed
                </p>

                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {growerFeeds.length}
                </p>

                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {formatMoney(growerTotal)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <p className="text-sm font-semibold text-slate-500">
                  Layer Feed
                </p>

                <p className="mt-2 text-2xl font-extrabold text-slate-900">
                  {layerFeeds.length}
                </p>

                <p className="mt-1 text-sm font-semibold text-emerald-700">
                  {formatMoney(layerTotal)}
                </p>
              </div>

              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
                <p className="text-sm font-semibold text-emerald-700">
                  Wadarta Guud / Grand Total
                </p>

                <p className="mt-2 text-2xl font-extrabold text-emerald-800">
                  {formatMoney(grandTotal)}
                </p>

                <p className="mt-1 text-xs font-medium text-emerald-600">
                  {feeds.length} records
                </p>
              </div>
            </div>

            {/* Feed sections */}
            <div className="space-y-7">
              <FeedTable
                title="Starter Feed"
                subtitle="Diiwaanka Starter Feed / Starter Feed Records"
                records={starterFeeds}
                total={starterTotal}
                feedType="Starter"
              />

              <FeedTable
                title="Grower Feed"
                subtitle="Diiwaanka Grower Feed / Grower Feed Records"
                records={growerFeeds}
                total={growerTotal}
                feedType="Grower"
              />

              <FeedTable
                title="Layer Feed"
                subtitle="Diiwaanka Layer Feed / Layer Feed Records"
                records={layerFeeds}
                total={layerTotal}
                feedType="Layer"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Add / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {editingId
                    ? "Beddel Quudinta / Edit Feed"
                    : "Ku Dar Quudin / Add Feed"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Starter, Grower ama Layer Feed
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                {/* Date */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Taariikhda / Date
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

                {/* Feed Type */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Nooca Quudinta / Feed Type
                  </label>

                  <select
                    required
                    value={form.feedType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        feedType: event.target.value as FeedType,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="Starter">Starter Feed</option>
                    <option value="Grower">Grower Feed</option>
                    <option value="Layer">Layer Feed</option>
                  </select>
                </div>

                {/* Company */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Shirkadda / Company
                  </label>

                  <input
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        companyName: event.target.value,
                      }))
                    }
                    placeholder="Tusaale: ABC Poultry Farm"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Supplied by */}
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Qofka Siiyay / Supplied By
                  </label>

                  <input
                    type="text"
                    required
                    value={form.suppliedBy}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        suppliedBy: event.target.value,
                      }))
                    }
                    placeholder="Magaca qofka / Person's name"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Tirada / Quantity
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.quantity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        quantity: event.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Qiimaha / Price (ETB)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.price}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        price: event.target.value,
                      }))
                    }
                    placeholder="0.00"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* Total */}
                <div className="sm:col-span-2">
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-emerald-700">
                        Wadarta / Total
                      </span>

                      <span className="text-xl font-extrabold text-emerald-800">
                        {formatMoney(formTotal)}
                      </span>
                    </div>

                    <p className="mt-1 text-xs text-emerald-600">
                      Tirada × Qiimaha / Quantity × Price
                    </p>
                  </div>
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Jooji / Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Waa la kaydinayaa... / Saving..."
                    : editingId
                    ? "Kaydi Isbeddelka / Save Changes"
                    : "Kaydi / Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}