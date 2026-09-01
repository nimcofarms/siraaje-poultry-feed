"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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

  documentsView: boolean;
  documentsAdd: boolean;
  documentsEdit: boolean;
  documentsDelete: boolean;
};

type Worker = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  permissions: Permissions | null;
};

const emptyPermissions: Permissions = {
  dashboardView: true,

  expensesView: false,
  expensesAdd: false,
  expensesEdit: false,
  expensesDelete: false,

  eggsView: false,
  eggsAdd: false,
  eggsEdit: false,
  eggsDelete: false,

  feedsView: false,
  feedsAdd: false,
  feedsEdit: false,
  feedsDelete: false,

  poultryHealthView: false,
  poultryHealthAdd: false,
  poultryHealthEdit: false,
  poultryHealthDelete: false,

  documentsView: false,
  documentsAdd: false,
  documentsEdit: false,
  documentsDelete: false,
};

const permissionGroups = [
  {
    title: "Kharashaadka / Expenses",
    view: "expensesView",
    add: "expensesAdd",
    edit: "expensesEdit",
    delete: "expensesDelete",
  },
  {
    title: "Ukumaha / Eggs",
    view: "eggsView",
    add: "eggsAdd",
    edit: "eggsEdit",
    delete: "eggsDelete",
  },
  {
    title: "Quudinta / Feeds",
    view: "feedsView",
    add: "feedsAdd",
    edit: "feedsEdit",
    delete: "feedsDelete",
  },
  {
    title: "Daaweynta Digaagga / Poultry Health",
    view: "poultryHealthView",
    add: "poultryHealthAdd",
    edit: "poultryHealthEdit",
    delete: "poultryHealthDelete",
  },
  {
    title: "Documents",
    view: "documentsView",
    add: "documentsAdd",
    edit: "documentsEdit",
    delete: "documentsDelete",
  },
] as const;

export default function WorkersPage() {
  const router = useRouter();

  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [permissions, setPermissions] =
    useState<Permissions>(emptyPermissions);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadWorkers() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/users", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Workers could not be loaded.");
      }

      setWorkers(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Workers could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkers();
  }, []);

  function resetForm() {
    setEditingId(null);
    setName("");
    setEmail("");
    setPassword("");
    setPermissions({ ...emptyPermissions });
    setError("");
  }

  function changePermission(
    key: keyof Permissions,
    value: boolean
  ) {
    setPermissions((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function editWorker(worker: Worker) {
    if (worker.role === "ADMIN" || worker.role === "OWNER") {
      return;
    }

    setEditingId(worker.id);
    setName(worker.name);
    setEmail(worker.email);
    setPassword("");

    setPermissions({
      ...emptyPermissions,
      ...(worker.permissions || {}),
    });

    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const url = editingId
        ? `/api/users/${editingId}`
        : "/api/users";

      const response = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          permissions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            (editingId
              ? "Worker could not be updated."
              : "Worker could not be created.")
        );
      }

      setMessage(
        editingId
          ? "Worker updated successfully."
          : "Worker created successfully."
      );

      resetForm();
      await loadWorkers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteWorker(worker: Worker) {
    if (
      !window.confirm(
        `Delete ${worker.name}? This worker will no longer be able to log in.`
      )
    ) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(`/api/users/${worker.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Worker could not be deleted."
        );
      }

      if (editingId === worker.id) {
        resetForm();
      }

      setMessage("Worker deleted successfully.");
      await loadWorkers();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Worker could not be deleted."
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f5ed]">
      {/* HEADER */}
      <header className="border-b border-[#e5dfd0] bg-[#075b35] text-white shadow-sm">
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

          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3">
            <p className="text-sm font-bold">
              Workers & Access
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 px-5 py-7 sm:px-8 lg:grid-cols-[250px_1fr]">
        {/* SIDEBAR */}
        <aside className="h-fit rounded-3xl border border-[#e7e1d4] bg-white p-4 shadow-sm">
          <nav className="space-y-2">
            <SidebarLink href="/dashboard" text="Dashboard" />

            <SidebarLink
              href="/dashboard/expenses"
              text="Kharashaadka / Expenses"
            />

            <SidebarLink
              href="/dashboard/eggs"
              text="Ukumaha / Eggs"
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

            <Link
              href="/dashboard/workers"
              className="flex items-center gap-3 rounded-2xl bg-[#075b35] px-4 py-3 font-bold text-white"
            >
              <UserIcon />
              Workers & Access
            </Link>
          </nav>
        </aside>

        <section className="min-w-0">
          <div className="mb-7">
            <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#b38420]">
              Administration
            </p>

            <h2 className="mt-1 text-3xl font-extrabold text-[#064b2c] sm:text-4xl">
              Workers & Access
            </h2>

            <p className="mt-2 max-w-3xl text-slate-500">
              Add workers and decide exactly which parts of
              Siraaje Poultry Feed they are allowed to view
              and manage.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 font-semibold text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 font-semibold text-green-700">
              {message}
            </div>
          )}

          {/* ADD / EDIT WORKER */}
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-2xl font-extrabold text-[#064b2c]">
                  {editingId
                    ? "Edit Worker"
                    : "Add New Worker"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Create a separate login and choose the
                  worker&apos;s permissions.
                </p>
              </div>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              <Field label="Worker Name">
                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  placeholder="Example: Ahmed Ali"
                  className="inputStyle"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  placeholder="worker@example.com"
                  className="inputStyle"
                />
              </Field>

              <Field
                label={
                  editingId
                    ? "New Password (optional)"
                    : "Password"
                }
              >
                <input
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required={!editingId}
                  minLength={8}
                  placeholder={
                    editingId
                      ? "Leave empty to keep password"
                      : "Minimum 8 characters"
                  }
                  className="inputStyle"
                />
              </Field>
            </div>

            {/* DASHBOARD */}
            <div className="mt-8 rounded-2xl border border-[#e7e1d4] bg-[#faf9f5] p-5">
              <label className="flex cursor-pointer items-center justify-between gap-4">
                <div>
                  <p className="font-extrabold text-[#064b2c]">
                    Dashboard
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Allow this worker to open the main dashboard.
                  </p>
                </div>

                <input
                  type="checkbox"
                  checked={permissions.dashboardView}
                  onChange={(event) =>
                    changePermission(
                      "dashboardView",
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-[#075b35]"
                />
              </label>
            </div>

            {/* PERMISSIONS */}
            <div className="mt-6 overflow-x-auto rounded-2xl border border-[#e7e1d4]">
              <table className="w-full min-w-[650px] text-left">
                <thead className="bg-[#075b35] text-white">
                  <tr>
                    <th className="px-5 py-4">
                      Section
                    </th>
                    <th className="px-4 py-4 text-center">
                      View
                    </th>
                    <th className="px-4 py-4 text-center">
                      Add
                    </th>
                    <th className="px-4 py-4 text-center">
                      Edit
                    </th>
                    <th className="px-4 py-4 text-center">
                      Delete
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {permissionGroups.map((group) => (
                    <tr
                      key={group.title}
                      className="border-t border-[#ece7dc]"
                    >
                      <td className="px-5 py-4 font-bold text-[#17452f]">
                        {group.title}
                      </td>

                      {[
                        group.view,
                        group.add,
                        group.edit,
                        group.delete,
                      ].map((permission) => (
                        <td
                          key={permission}
                          className="px-4 py-4 text-center"
                        >
                          <input
                            type="checkbox"
                            checked={permissions[permission]}
                            onChange={(event) =>
                              changePermission(
                                permission,
                                event.target.checked
                              )
                            }
                            className="h-5 w-5 accent-[#075b35]"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="min-h-12 rounded-2xl bg-[#075b35] px-7 font-extrabold text-white shadow-md transition hover:bg-[#064b2c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                    ? "Save Changes"
                    : "Create Worker"}
              </button>
            </div>
          </form>

          {/* WORKERS LIST */}
          <div className="mt-7 rounded-3xl border border-[#e7e1d4] bg-white p-6 shadow-sm sm:p-8">
            <div>
              <h3 className="text-2xl font-extrabold text-[#064b2c]">
                Users & Workers
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Accounts currently registered in the system.
              </p>
            </div>

            {loading ? (
              <p className="py-10 text-center font-semibold text-slate-500">
                Loading workers...
              </p>
            ) : workers.length === 0 ? (
              <p className="py-10 text-center text-slate-500">
                No workers have been created yet.
              </p>
            ) : (
              <div className="mt-6 space-y-4">
                {workers.map((worker) => {
                  const protectedAccount =
                    worker.role === "ADMIN" ||
                    worker.role === "OWNER";

                  return (
                    <div
                      key={worker.id}
                      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#e7e1d4] p-5 lg:flex-row lg:items-center"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e7f5eb] text-lg font-extrabold text-[#075b35]">
                          {worker.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-extrabold text-[#064b2c]">
                              {worker.name}
                            </p>

                            <span
                              className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                                protectedAccount
                                  ? "bg-[#fff3d6] text-[#8a6109]"
                                  : "bg-[#e7f5eb] text-[#075b35]"
                              }`}
                            >
                              {worker.role}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-slate-500">
                            {worker.email}
                          </p>
                        </div>
                      </div>

                      {!protectedAccount && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              editWorker(worker)
                            }
                            className="rounded-xl border border-[#075b35] px-4 py-2 font-bold text-[#075b35] transition hover:bg-green-50"
                          >
                            Edit Access
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              void deleteWorker(worker)
                            }
                            className="rounded-xl border border-red-200 px-4 py-2 font-bold text-red-600 transition hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            © 2026 Siraaje Poultry & Feeds Company
          </p>
        </section>
      </div>

      <style jsx>{`
        :global(.inputStyle) {
          width: 100%;
          min-height: 48px;
          border: 1px solid #d9d5ca;
          border-radius: 14px;
          padding: 0 14px;
          background: white;
          color: #1f2937;
          outline: none;
        }

        :global(.inputStyle:focus) {
          border-color: #075b35;
          box-shadow: 0 0 0 3px rgba(7, 91, 53, 0.1);
        }
      `}</style>
    </main>
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
      <span className="mb-2 block text-sm font-extrabold text-[#17452f]">
        {label}
      </span>

      {children}
    </label>
  );
}

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

function UserIcon() {
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