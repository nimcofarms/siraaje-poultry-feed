"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";

/* =========================================================
   TYPES
========================================================= */

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

type FormRow = {
  rowId: string;
  feedType: FeedType;
  bagSizeChoice: string;
  customBagSize: string;
  quantity: string;
};

type ProductionForm = {
  date: string;
  location: string;
  items: FormRow[];
};

/* =========================================================
   CONSTANTS
========================================================= */

const FEED_TYPES: FeedType[] = [
  "Starter",
  "Grower",
  "Layer",
];

const BAG_SIZE_OPTIONS = [
  "25",
  "50",
  "100",
  "custom",
];

/* =========================================================
   HELPERS
========================================================= */

function makeRow(
  feedType: FeedType = "Starter"
): FormRow {
  return {
    rowId:
      typeof crypto !== "undefined" &&
      "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,

    feedType,
    bagSizeChoice: "50",
    customBagSize: "",
    quantity: "",
  };
}

function getToday() {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function emptyForm(): ProductionForm {
  return {
    date: getToday(),
    location: "",
    items: [
      makeRow("Starter"),
      makeRow("Grower"),
      makeRow("Layer"),
    ],
  };
}

function getBagSize(row: FormRow) {
  if (
    row.bagSizeChoice === "custom"
  ) {
    return Number(
      row.customBagSize
    );
  }

  return Number(
    row.bagSizeChoice
  );
}

function getRowTotalKg(
  row: FormRow
) {
  const bagSize =
    getBagSize(row);

  const quantity =
    Number(row.quantity);

  if (
    !Number.isFinite(bagSize) ||
    bagSize <= 0 ||
    !Number.isFinite(quantity) ||
    quantity <= 0
  ) {
    return 0;
  }

  return bagSize * quantity;
}

function formatNumber(
  value: number
) {
  return new Intl.NumberFormat(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  ).format(value);
}

function formatDate(
  value: string
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }
  ).format(date);
}

function formatDateTime(
  value: string
) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
}

function dateForInput(
  value: string
) {
  if (!value) {
    return getToday();
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return getToday();
  }

  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getAuditName(
  user?: AuditUser | null
) {
  if (!user) {
    return "-";
  }

  return (
    user.name ||
    user.email ||
    "-"
  );
}

/* =========================================================
   PAGE
========================================================= */

export default function ProductionPage() {
  const [batches, setBatches] =
    useState<ProductionBatch[]>(
      []
    );

  const [form, setForm] =
    useState<ProductionForm>(
      emptyForm()
    );

  const [
    editingId,
    setEditingId,
  ] = useState<string | null>(
    null
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingId,
    setDeletingId,
  ] = useState<string | null>(
    null
  );

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  const loadBatches =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            "/api/feed-production",
            {
              method: "GET",
              cache: "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "Production records could not be loaded."
          );
        }

        setBatches(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Production records could not be loaded."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadBatches();
  }, [loadBatches]);

  /* =======================================================
     OVERVIEW TOTALS
  ======================================================= */

  const overview =
    useMemo(() => {
      let starterKg = 0;
      let growerKg = 0;
      let layerKg = 0;

      let starterBags = 0;
      let growerBags = 0;
      let layerBags = 0;

      for (
        const batch of batches
      ) {
        for (
          const item of batch.items ||
          []
        ) {
          if (
            item.feedType ===
            "Starter"
          ) {
            starterKg +=
              Number(
                item.totalKg
              ) || 0;

            starterBags +=
              Number(
                item.quantity
              ) || 0;
          }

          if (
            item.feedType ===
            "Grower"
          ) {
            growerKg +=
              Number(
                item.totalKg
              ) || 0;

            growerBags +=
              Number(
                item.quantity
              ) || 0;
          }

          if (
            item.feedType ===
            "Layer"
          ) {
            layerKg +=
              Number(
                item.totalKg
              ) || 0;

            layerBags +=
              Number(
                item.quantity
              ) || 0;
          }
        }
      }

      return {
        starterKg,
        growerKg,
        layerKg,

        starterBags,
        growerBags,
        layerBags,

        totalKg:
          starterKg +
          growerKg +
          layerKg,

        totalBags:
          starterBags +
          growerBags +
          layerBags,
      };
    }, [batches]);

  /* =======================================================
     CURRENT FORM TOTALS
  ======================================================= */

  const formTotals =
    useMemo(() => {
      let totalKg = 0;
      let totalBags = 0;

      for (
        const row of form.items
      ) {
        totalKg +=
          getRowTotalKg(row);

        const quantity =
          Number(row.quantity);

        if (
          Number.isFinite(
            quantity
          ) &&
          quantity > 0
        ) {
          totalBags +=
            quantity;
        }
      }

      return {
        totalKg,
        totalBags,
      };
    }, [form.items]);

  /* =======================================================
     UPDATE MAIN FORM
  ======================================================= */

  function updateMainField(
    field:
      | "date"
      | "location",
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =======================================================
     UPDATE ROW
  ======================================================= */

  function updateRow(
    rowId: string,
    field:
      | "feedType"
      | "bagSizeChoice"
      | "customBagSize"
      | "quantity",
    value: string
  ) {
    setForm((current) => ({
      ...current,

      items:
        current.items.map(
          (row) => {
            if (
              row.rowId !==
              rowId
            ) {
              return row;
            }

            if (
              field ===
              "feedType"
            ) {
              return {
                ...row,
                feedType:
                  value as FeedType,
              };
            }

            return {
              ...row,
              [field]: value,
            };
          }
        ),
    }));
  }

  /* =======================================================
     ADD ROW
  ======================================================= */

  function addRow() {
    setForm((current) => ({
      ...current,

      items: [
        ...current.items,
        makeRow("Starter"),
      ],
    }));
  }

  /* =======================================================
     REMOVE ROW
  ======================================================= */

  function removeRow(
    rowId: string
  ) {
    setForm((current) => {
      if (
        current.items.length <=
        1
      ) {
        return current;
      }

      return {
        ...current,

        items:
          current.items.filter(
            (row) =>
              row.rowId !==
              rowId
          ),
      };
    });
  }

  /* =======================================================
     RESET FORM
  ======================================================= */

  function resetForm() {
    setEditingId(null);

    setForm(
      emptyForm()
    );

    setError("");
    setMessage("");
  }

  /* =======================================================
     VALIDATE + BUILD PAYLOAD
  ======================================================= */

  function buildPayload() {
    const date =
      form.date.trim();

    const location =
      form.location.trim();

    if (!date) {
      throw new Error(
        "Please enter the production date."
      );
    }

    if (!location) {
      throw new Error(
        "Please enter the production location."
      );
    }

    if (
      form.items.length === 0
    ) {
      throw new Error(
        "Add at least one production item."
      );
    }

    const items =
      form.items.map(
        (row, index) => {
          const bagSizeKg =
            getBagSize(row);

          const quantity =
            Number(
              row.quantity
            );

          if (
            !FEED_TYPES.includes(
              row.feedType
            )
          ) {
            throw new Error(
              `Row ${
                index + 1
              }: Select a valid feed type.`
            );
          }

          if (
            !Number.isFinite(
              bagSizeKg
            ) ||
            bagSizeKg <= 0
          ) {
            throw new Error(
              `Row ${
                index + 1
              }: Enter a valid bag size.`
            );
          }

          if (
            !Number.isFinite(
              quantity
            ) ||
            quantity <= 0 ||
            !Number.isInteger(
              quantity
            )
          ) {
            throw new Error(
              `Row ${
                index + 1
              }: Quantity must be a whole number of bags.`
            );
          }

          return {
            feedType:
              row.feedType,

            bagSizeKg,

            quantity,
          };
        }
      );

    return {
      date,
      location,
      items,
    };
  }

  /* =======================================================
     SAVE
  ======================================================= */

  async function handleSave(
    event:
      React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload =
        buildPayload();

      const response =
        await fetch(
          "/api/feed-production",
          {
            method: editingId
              ? "PUT"
              : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              editingId
                ? {
                    id: editingId,
                    ...payload,
                  }
                : payload
            ),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Production could not be saved."
        );
      }

      setMessage(
        editingId
          ? "Production updated successfully."
          : "Production saved successfully."
      );

      setEditingId(null);

      setForm(
        emptyForm()
      );

      await loadBatches();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Production could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  /* =======================================================
     EDIT
  ======================================================= */

  function handleEdit(
    batch: ProductionBatch
  ) {
    const rows: FormRow[] =
      (batch.items || []).map(
        (item) => {
          const bagSize =
            Number(
              item.bagSizeKg
            );

          const isStandard =
            bagSize === 25 ||
            bagSize === 50 ||
            bagSize === 100;

          return {
            rowId:
              typeof crypto !==
                "undefined" &&
              "randomUUID" in
                crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random()}`,

            feedType:
              item.feedType,

            bagSizeChoice:
              isStandard
                ? String(
                    bagSize
                  )
                : "custom",

            customBagSize:
              isStandard
                ? ""
                : String(
                    bagSize
                  ),

            quantity:
              String(
                item.quantity
              ),
          };
        }
      );

    setEditingId(
      batch.id
    );

    setForm({
      date: dateForInput(
        batch.date
      ),

      location:
        batch.location || "",

      items:
        rows.length > 0
          ? rows
          : [
              makeRow(
                "Starter"
              ),
            ],
    });

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* =======================================================
     DELETE
  ======================================================= */

  async function handleDelete(
    batch: ProductionBatch
  ) {
    const confirmed =
      window.confirm(
        `Delete production from ${formatDate(
          batch.date
        )} at ${
          batch.location
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(
        batch.id
      );

      setError("");
      setMessage("");

      const response =
        await fetch(
          `/api/feed-production?id=${encodeURIComponent(
            batch.id
          )}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Production could not be deleted."
        );
      }

      if (
        editingId ===
        batch.id
      ) {
        resetForm();
      }

      setMessage(
        "Production deleted successfully."
      );

      await loadBatches();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Production could not be deleted."
      );
    } finally {
      setDeletingId(
        null
      );
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-[#07150f] text-slate-100">
      <div className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">

        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-6 rounded-3xl border border-emerald-900/70 bg-[#0b1f17] p-5 shadow-2xl shadow-black/20 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

            <div>
              <div className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-emerald-400">
                Siraaje Poultry Feed
              </div>

              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Production / Wax-soo-saarka
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Record feed manufactured by the production machine.
                Enter the date and location once, then add all Starter,
                Grower and Layer products produced in the same batch.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/feeds"
                className="rounded-xl border border-emerald-800 bg-[#10281e] px-4 py-2.5 text-sm font-bold text-emerald-200 transition hover:bg-[#163426]"
              >
                ← Back to Feeds
              </Link>

              <button
                type="button"
                onClick={() =>
                  void loadBatches()
                }
                className="rounded-xl border border-slate-700 bg-[#111c18] px-4 py-2.5 text-sm font-bold text-slate-200 transition hover:bg-[#17251f]"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <OverviewCard
            title="Starter"
            subtitle="Starter Feed Produced"
            kg={overview.starterKg}
            bags={overview.starterBags}
          />

          <OverviewCard
            title="Grower"
            subtitle="Grower Feed Produced"
            kg={overview.growerKg}
            bags={overview.growerBags}
          />

          <OverviewCard
            title="Layer"
            subtitle="Layer Feed Produced"
            kg={overview.layerKg}
            bags={overview.layerBags}
          />

          <OverviewCard
            title="All Production"
            subtitle="Total Feed Manufactured"
            kg={overview.totalKg}
            bags={overview.totalBags}
            strong
          />
        </div>

        {/* =================================================
            MESSAGE
        ================================================= */}

        {message ? (
          <div className="mb-5 rounded-2xl border border-emerald-700/60 bg-emerald-950/50 px-5 py-4 text-sm font-semibold text-emerald-200">
            {message}
          </div>
        ) : null}

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-800/70 bg-red-950/40 px-5 py-4 text-sm font-semibold text-red-200">
            {error}
          </div>
        ) : null}

        {/* =================================================
            FORM
        ================================================= */}

        <form
          onSubmit={handleSave}
          className="mb-7 overflow-hidden rounded-3xl border border-emerald-900/70 bg-[#0b1f17] shadow-2xl shadow-black/20"
        >
          <div className="border-b border-emerald-900/70 px-5 py-5 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h2 className="text-xl font-black text-white">
                  {editingId
                    ? "Edit Production Batch"
                    : "Add Production Batch"}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Date and location apply to every product row below.
                </p>
              </div>

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-700 bg-[#111c18] px-4 py-2.5 text-sm font-bold text-slate-200 hover:bg-[#17251f]"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
          </div>

          <div className="p-5 sm:p-7">

            {/* DATE + LOCATION */}

            <div className="mb-7 grid gap-5 md:grid-cols-2">

              <Field>
                <Label>
                  Date / Taariikhda
                </Label>

                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(event) =>
                    updateMainField(
                      "date",
                      event.target.value
                    )
                  }
                  className={inputClass}
                />
              </Field>

              <Field>
                <Label>
                  Location / Goobta
                </Label>

                <input
                  type="text"
                  required
                  value={
                    form.location
                  }
                  onChange={(event) =>
                    updateMainField(
                      "location",
                      event.target.value
                    )
                  }
                  placeholder="Example: Jigjiga Factory"
                  className={inputClass}
                />
              </Field>
            </div>

            {/* PRODUCT ROWS */}

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <h3 className="text-lg font-black text-white">
                  Products Produced
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  Quantity means the number of bags produced.
                </p>
              </div>

              <button
                type="button"
                onClick={addRow}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-500"
              >
                + Add Product Row
              </button>
            </div>

            <div className="space-y-4">
              {form.items.map(
                (row, index) => {
                  const rowTotalKg =
                    getRowTotalKg(
                      row
                    );

                  return (
                    <div
                      key={
                        row.rowId
                      }
                      className="rounded-2xl border border-emerald-900/70 bg-[#091912] p-4 sm:p-5"
                    >
                      <div className="mb-4 flex items-center justify-between">

                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 font-black text-emerald-300">
                            {index + 1}
                          </div>

                          <div>
                            <div className="font-black text-white">
                              Production Item
                            </div>

                            <div className="text-xs text-slate-500">
                              Feed product
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={
                            form
                              .items
                              .length <=
                            1
                          }
                          onClick={() =>
                            removeRow(
                              row.rowId
                            )
                          }
                          className="rounded-lg border border-red-900/70 bg-red-950/30 px-3 py-2 text-xs font-bold text-red-300 transition hover:bg-red-950/60 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">

                        {/* FEED TYPE */}

                        <Field>
                          <Label>
                            Feed Type
                          </Label>

                          <select
                            value={
                              row.feedType
                            }
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                row.rowId,
                                "feedType",
                                event
                                  .target
                                  .value
                              )
                            }
                            className={
                              inputClass
                            }
                          >
                            {FEED_TYPES.map(
                              (
                                feedType
                              ) => (
                                <option
                                  key={
                                    feedType
                                  }
                                  value={
                                    feedType
                                  }
                                >
                                  {
                                    feedType
                                  }
                                </option>
                              )
                            )}
                          </select>
                        </Field>

                        {/* BAG SIZE */}

                        <Field>
                          <Label>
                            Bag Size
                          </Label>

                          <select
                            value={
                              row.bagSizeChoice
                            }
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                row.rowId,
                                "bagSizeChoice",
                                event
                                  .target
                                  .value
                              )
                            }
                            className={
                              inputClass
                            }
                          >
                            {BAG_SIZE_OPTIONS.map(
                              (
                                option
                              ) => (
                                <option
                                  key={
                                    option
                                  }
                                  value={
                                    option
                                  }
                                >
                                  {option ===
                                  "custom"
                                    ? "Custom"
                                    : `${option} kg`}
                                </option>
                              )
                            )}
                          </select>
                        </Field>

                        {/* CUSTOM BAG */}

                        <Field>
                          <Label>
                            Custom KG
                          </Label>

                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            disabled={
                              row.bagSizeChoice !==
                              "custom"
                            }
                            required={
                              row.bagSizeChoice ===
                              "custom"
                            }
                            value={
                              row.customBagSize
                            }
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                row.rowId,
                                "customBagSize",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder={
                              row.bagSizeChoice ===
                              "custom"
                                ? "Enter kg"
                                : "Not needed"
                            }
                            className={`${inputClass} disabled:cursor-not-allowed disabled:opacity-40`}
                          />
                        </Field>

                        {/* QUANTITY */}

                        <Field>
                          <Label>
                            Quantity / Bags
                          </Label>

                          <input
                            type="number"
                            min="1"
                            step="1"
                            required
                            value={
                              row.quantity
                            }
                            onChange={(
                              event
                            ) =>
                              updateRow(
                                row.rowId,
                                "quantity",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="100"
                            className={
                              inputClass
                            }
                          />
                        </Field>

                        {/* TOTAL */}

                        <Field>
                          <Label>
                            Total Weight
                          </Label>

                          <div className="flex h-[46px] items-center rounded-xl border border-emerald-800/60 bg-emerald-950/40 px-4 font-black text-emerald-300">
                            {formatNumber(
                              rowTotalKg
                            )}{" "}
                            kg
                          </div>
                        </Field>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* BATCH TOTAL */}

            <div className="mt-6 grid gap-4 sm:grid-cols-2">

              <div className="rounded-2xl border border-emerald-900/70 bg-[#091912] p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Bags
                </div>

                <div className="mt-2 text-2xl font-black text-white">
                  {formatNumber(
                    formTotals.totalBags
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-emerald-700/60 bg-emerald-950/40 p-5">
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Total Production Weight
                </div>

                <div className="mt-2 text-2xl font-black text-emerald-200">
                  {formatNumber(
                    formTotals.totalKg
                  )}{" "}
                  kg
                </div>
              </div>
            </div>

            {/* SAVE */}

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              {editingId ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-700 bg-[#111c18] px-5 py-3 text-sm font-black text-slate-200 hover:bg-[#17251f]"
                >
                  Cancel
                </button>
              ) : null}

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Update Production"
                    : "Save Production"}
              </button>
            </div>
          </div>
        </form>

        {/* =================================================
            HISTORY
        ================================================= */}

        <div className="overflow-hidden rounded-3xl border border-emerald-900/70 bg-[#0b1f17] shadow-2xl shadow-black/20">

          <div className="border-b border-emerald-900/70 px-5 py-5 sm:px-7">
            <h2 className="text-xl font-black text-white">
              Production History
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              All production batches recorded in the system.
            </p>
          </div>

          {loading ? (
            <div className="p-10 text-center text-sm font-semibold text-slate-400">
              Loading production...
            </div>
          ) : batches.length ===
            0 ? (
            <div className="p-10 text-center">
              <div className="text-lg font-black text-slate-300">
                No production recorded yet
              </div>

              <div className="mt-2 text-sm text-slate-500">
                Your first production batch will appear here.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[1250px] w-full">

                <thead className="bg-[#091912]">
                  <tr>
                    <TableHead>
                      Date
                    </TableHead>

                    <TableHead>
                      Location
                    </TableHead>

                    <TableHead>
                      Products
                    </TableHead>

                    <TableHead>
                      Total Bags
                    </TableHead>

                    <TableHead>
                      Total Weight
                    </TableHead>

                    <TableHead>
                      Entered By
                    </TableHead>

                    <TableHead>
                      Entered At
                    </TableHead>

                    <TableHead>
                      Actions
                    </TableHead>
                  </tr>
                </thead>

                <tbody className="divide-y divide-emerald-950">
                  {batches.map(
                    (batch) => {
                      const totalBags =
                        (
                          batch.items ||
                          []
                        ).reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            (Number(
                              item.quantity
                            ) ||
                              0),
                          0
                        );

                      const totalKg =
                        (
                          batch.items ||
                          []
                        ).reduce(
                          (
                            total,
                            item
                          ) =>
                            total +
                            (Number(
                              item.totalKg
                            ) ||
                              0),
                          0
                        );

                      return (
                        <tr
                          key={
                            batch.id
                          }
                          className="transition hover:bg-[#0e261c]"
                        >
                          <TableCell>
                            <span className="font-bold text-white">
                              {formatDate(
                                batch.date
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-semibold text-slate-200">
                              {
                                batch.location
                              }
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="space-y-2">
                              {(
                                batch.items ||
                                []
                              ).map(
                                (
                                  item
                                ) => (
                                  <div
                                    key={
                                      item.id
                                    }
                                    className="flex flex-wrap items-center gap-2"
                                  >
                                    <span className="rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-2.5 py-1 text-xs font-black text-emerald-300">
                                      {
                                        item.feedType
                                      }
                                    </span>

                                    <span className="text-xs font-semibold text-slate-400">
                                      {formatNumber(
                                        Number(
                                          item.bagSizeKg
                                        )
                                      )}{" "}
                                      kg ×{" "}
                                      {formatNumber(
                                        Number(
                                          item.quantity
                                        )
                                      )}{" "}
                                      bags
                                    </span>

                                    <span className="text-xs font-black text-slate-200">
                                      ={" "}
                                      {formatNumber(
                                        Number(
                                          item.totalKg
                                        )
                                      )}{" "}
                                      kg
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="font-black text-white">
                              {formatNumber(
                                totalBags
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <span className="font-black text-emerald-300">
                              {formatNumber(
                                totalKg
                              )}{" "}
                              kg
                            </span>
                          </TableCell>

                          <TableCell>
                            <div>
                              <div className="font-bold text-slate-200">
                                {getAuditName(
                                  batch.createdBy
                                )}
                              </div>

                              {batch
                                .createdBy
                                ?.role ? (
                                <div className="mt-1 text-xs font-semibold text-slate-500">
                                  {
                                    batch
                                      .createdBy
                                      .role
                                  }
                                </div>
                              ) : null}
                            </div>
                          </TableCell>

                          <TableCell>
                            <span className="text-sm text-slate-400">
                              {formatDateTime(
                                batch.createdAt
                              )}
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    batch
                                  )
                                }
                                className="rounded-lg border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-xs font-black text-amber-300 transition hover:bg-amber-950/60"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deletingId ===
                                  batch.id
                                }
                                onClick={() =>
                                  void handleDelete(
                                    batch
                                  )
                                }
                                className="rounded-lg border border-red-900/70 bg-red-950/30 px-3 py-2 text-xs font-black text-red-300 transition hover:bg-red-950/60 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {deletingId ===
                                batch.id
                                  ? "Deleting..."
                                  : "Delete"}
                              </button>
                            </div>
                          </TableCell>
                        </tr>
                      );
                    }
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   SMALL COMPONENTS
========================================================= */

function OverviewCard({
  title,
  subtitle,
  kg,
  bags,
  strong = false,
}: {
  title: string;
  subtitle: string;
  kg: number;
  bags: number;
  strong?: boolean;
}) {
  return (
    <div
      className={
        strong
          ? "rounded-2xl border border-emerald-600/70 bg-emerald-950/50 p-5 shadow-lg shadow-black/20"
          : "rounded-2xl border border-emerald-900/70 bg-[#0b1f17] p-5 shadow-lg shadow-black/20"
      }
    >
      <div
        className={
          strong
            ? "text-sm font-black text-emerald-300"
            : "text-sm font-black text-white"
        }
      >
        {title}
      </div>

      <div className="mt-1 text-xs font-semibold text-slate-500">
        {subtitle}
      </div>

      <div
        className={
          strong
            ? "mt-4 text-2xl font-black text-emerald-200"
            : "mt-4 text-2xl font-black text-white"
        }
      >
        {formatNumber(kg)} kg
      </div>

      <div className="mt-1 text-sm font-semibold text-slate-400">
        {formatNumber(bags)} bags
      </div>
    </div>
  );
}

function Field({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {children}
    </div>
  );
}

function Label({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <label className="block text-xs font-black uppercase tracking-wide text-slate-400">
      {children}
    </label>
  );
}

function TableHead({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <th className="whitespace-nowrap px-5 py-4 text-left text-xs font-black uppercase tracking-wide text-slate-500">
      {children}
    </th>
  );
}

function TableCell({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <td className="px-5 py-4 align-top text-sm">
      {children}
    </td>
  );
}

/* =========================================================
   SHARED INPUT STYLE
========================================================= */

const inputClass =
  "w-full rounded-xl border border-emerald-900/80 bg-[#07150f] px-4 py-3 text-sm font-semibold text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-900/50";