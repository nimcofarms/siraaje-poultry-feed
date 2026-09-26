"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type WorkerUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type WorkerFileItem = {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  fileName: string;
  fileUrl?: string;
  contentType: string;
  size?: number | null;
  assignedToId?: string | null;
  assignedTo?: WorkerUser | null;
  uploadedBy?: WorkerUser | null;
  createdAt: string;
  updatedAt: string;
};

type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isOwner?: boolean;
};

function formatFileSize(size?: number | null) {
  if (!size) {
    return "";
  }

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export default function WorkerFilesPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] =
    useState<CurrentUser | null>(null);

  const [workerFiles, setWorkerFiles] =
    useState<WorkerFileItem[]>([]);

  const [workers, setWorkers] = useState<
    WorkerUser[]
  >([]);

  const [loadingPage, setLoadingPage] =
    useState(true);

  const [loadingWorkerFiles, setLoadingWorkerFiles] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [uploadingWorkerFile, setUploadingWorkerFile] =
    useState(false);

  const [
    deletingWorkerFileId,
    setDeletingWorkerFileId,
  ] = useState<string | null>(null);

  const [workerFileTitle, setWorkerFileTitle] =
    useState("");

  const [
    workerFileDescription,
    setWorkerFileDescription,
  ] = useState("");

  const [workerFileCategory, setWorkerFileCategory] =
    useState("");

  const [assignedWorkerId, setAssignedWorkerId] =
    useState("");

  const [
    selectedWorkerFile,
    setSelectedWorkerFile,
  ] = useState<File | null>(null);

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");

  const [error, setError] = useState("");

  const workerFileInput =
    useRef<HTMLInputElement | null>(null);

  /* =====================================================
     LOAD CURRENT USER
  ====================================================== */

  const loadCurrentUser = useCallback(async () => {
    try {
      const response = await fetch("/api/me", {
        cache: "no-store",
      });

      const data = await response.json();

      if (response.status === 401) {
        router.replace("/");
        return false;
      }

      if (!response.ok || !data.user) {
        throw new Error(
          data.error ||
            "Could not load current user."
        );
      }

      const user: CurrentUser = data.user;

      const management =
        user.isOwner === true ||
        user.role === "OWNER" ||
        user.role === "ADMIN";

      if (!management) {
        router.replace("/dashboard/my-files");
        return false;
      }

      setCurrentUser(user);

      return true;
    } catch (loadError) {
      console.error(
        "CURRENT USER ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load current user."
      );

      return false;
    }
  }, [router]);

  /* =====================================================
     LOAD WORKERS
  ====================================================== */

  const loadWorkers = useCallback(async () => {
    try {
      const response = await fetch("/api/users", {
        cache: "no-store",
      });

      if (response.status === 401) {
        router.replace("/");
        return;
      }

      if (response.status === 403) {
        router.replace("/dashboard");
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Workers could not be loaded."
        );
      }

      const users: WorkerUser[] =
        Array.isArray(data) ? data : [];

      setWorkers(
        users
          .filter(
            (user) =>
              user.role === "WORKER"
          )
          .sort((a, b) =>
            a.name.localeCompare(b.name)
          )
      );
    } catch (loadError) {
      console.error(
        "WORKERS LOAD ERROR:",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Workers could not be loaded."
      );
    }
  }, [router]);

  /* =====================================================
     LOAD WORKER FILES
  ====================================================== */

  const loadWorkerFiles = useCallback(
    async (showRefresh = false) => {
      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoadingWorkerFiles(true);
        }

        const response = await fetch(
          "/api/worker-files",
          {
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.replace("/");
          return;
        }

        if (response.status === 403) {
          router.replace("/dashboard");
          return;
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Worker files could not be loaded."
          );
        }

        setWorkerFiles(
          Array.isArray(data) ? data : []
        );
      } catch (loadError) {
        console.error(
          "WORKER FILES LOAD ERROR:",
          loadError
        );

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Worker files could not be loaded."
        );
      } finally {
        setLoadingWorkerFiles(false);
        setRefreshing(false);
      }
    },
    [router]
  );

  /* =====================================================
     INITIAL LOAD
  ====================================================== */

  useEffect(() => {
    let active = true;

    async function initialize() {
      setLoadingPage(true);
      setError("");

      const authorized =
        await loadCurrentUser();

      if (!authorized || !active) {
        setLoadingPage(false);
        return;
      }

      await Promise.all([
        loadWorkers(),
        loadWorkerFiles(),
      ]);

      if (active) {
        setLoadingPage(false);
      }
    }

    void initialize();

    return () => {
      active = false;
    };
  }, [
    loadCurrentUser,
    loadWorkers,
    loadWorkerFiles,
  ]);

  /* =====================================================
     UPLOAD & ASSIGN
  ====================================================== */

  async function handleWorkerFileUpload() {
    setMessage("");
    setError("");

    const title = workerFileTitle.trim();
    const description =
      workerFileDescription.trim();
    const category =
      workerFileCategory.trim();

    if (!title) {
      setError(
        "Please enter a file title."
      );
      return;
    }

    if (!assignedWorkerId) {
      setError(
        "Please select a worker."
      );
      return;
    }

    if (!selectedWorkerFile) {
      setError(
        "Please choose a file."
      );
      return;
    }

    if (
      selectedWorkerFile.size >
      20 * 1024 * 1024
    ) {
      setError(
        "The file must be 20 MB or smaller."
      );
      return;
    }

    try {
      setUploadingWorkerFile(true);

      const formData = new FormData();

      formData.append(
        "file",
        selectedWorkerFile
      );

      formData.append(
        "title",
        title
      );

      formData.append(
        "description",
        description
      );

      formData.append(
        "category",
        category
      );

      formData.append(
        "assignedToId",
        assignedWorkerId
      );

      const response = await fetch(
        "/api/worker-files",
        {
          method: "POST",
          body: formData,
        }
      );

      const result =
        await response.json();

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
            "Worker file could not be uploaded."
        );
      }

      if (result.workerFile) {
        setWorkerFiles((current) => [
          result.workerFile,
          ...current,
        ]);
      } else {
        await loadWorkerFiles();
      }

      setWorkerFileTitle("");
      setWorkerFileDescription("");
      setWorkerFileCategory("");
      setAssignedWorkerId("");
      setSelectedWorkerFile(null);

      if (workerFileInput.current) {
        workerFileInput.current.value = "";
      }

      setMessage(
        "Employee file uploaded and assigned successfully."
      );
    } catch (uploadError) {
      console.error(
        "WORKER FILE UPLOAD ERROR:",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Worker file could not be uploaded."
      );
    } finally {
      setUploadingWorkerFile(false);
    }
  }

  /* =====================================================
     DELETE
  ====================================================== */

  async function handleWorkerFileDelete(
    file: WorkerFileItem
  ) {
    const confirmed = window.confirm(
      `Delete "${file.title}" from employee files?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      setDeletingWorkerFileId(file.id);

      const response = await fetch(
        `/api/worker-files?id=${encodeURIComponent(
          file.id
        )}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

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
            "Worker file could not be deleted."
        );
      }

      setWorkerFiles((current) =>
        current.filter(
          (item) => item.id !== file.id
        )
      );

      setMessage(
        `${file.title} was deleted successfully.`
      );
    } catch (deleteError) {
      console.error(
        "WORKER FILE DELETE ERROR:",
        deleteError
      );

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Worker file could not be deleted."
      );
    } finally {
      setDeletingWorkerFileId(null);
    }
  }

  /* =====================================================
     FILTER
  ====================================================== */

  const normalizedSearch =
    search.trim().toLowerCase();

  const filteredFiles =
    normalizedSearch.length === 0
      ? workerFiles
      : workerFiles.filter((file) => {
          const searchable = [
            file.title,
            file.description || "",
            file.category || "",
            file.fileName,
            file.assignedTo?.name || "",
            file.assignedTo?.email || "",
            file.uploadedBy?.name || "",
          ]
            .join(" ")
            .toLowerCase();

          return searchable.includes(
            normalizedSearch
          );
        });

  const assignedWorker =
    workers.find(
      (worker) =>
        worker.id === assignedWorkerId
    ) || null;

  /* =====================================================
     LOADING
  ====================================================== */

  if (loadingPage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f5ed]">
        <div className="rounded-3xl border border-[#e7e1d4] bg-white px-8 py-7 text-center shadow-sm">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#075b35]" />

          <p className="mt-4 font-bold text-[#064b2c]">
            Loading employee files...
          </p>
        </div>
      </main>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#f7f5ed]">
      {/* =================================================
          HEADER
      ================================================== */}

      <header className="border-b border-[#0a4f31] bg-[#075b35] text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <FolderOpen className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                Siraaje Poultry Feed
              </p>

              <h1 className="text-2xl font-extrabold">
                Faylasha Shaqaalaha / Employee Files
              </h1>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* =================================================
            INTRO
        ================================================== */}

        <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-[#b38420]" />

              <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#b38420]">
                Employee Document Center
              </p>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-[#064b2c] sm:text-4xl">
              Upload & Assign Employee Files
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-500">
              Upload private files and assign
              them directly to an employee.
              Employees can open and download
              their assigned files from their
              own account.
            </p>
          </div>

          <button
            type="button"
            disabled={refreshing}
            onClick={() => {
              setError("");
              setMessage("");
              void Promise.all([
                loadWorkers(),
                loadWorkerFiles(true),
              ]);
            }}
            className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#d6e5da] bg-white px-4 py-3 text-sm font-extrabold text-[#075b35] shadow-sm transition hover:bg-[#edf7ef] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${
                refreshing
                  ? "animate-spin"
                  : ""
              }`}
            />

            {refreshing
              ? "Refreshing..."
              : "Refresh"}
          </button>
        </div>

        {/* =================================================
            MESSAGES
        ================================================== */}

        {message && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-800">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        {/* =================================================
            SUMMARY
        ================================================== */}

        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#075b35]" />

              <span className="text-sm font-semibold text-slate-500">
                Workers
              </span>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-[#064b2c]">
              {workers.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#075b35]" />

              <span className="text-sm font-semibold text-slate-500">
                Assigned Files
              </span>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-[#064b2c]">
              {workerFiles.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-[#075b35]" />

              <span className="text-sm font-semibold text-slate-500">
                Storage
              </span>
            </div>

            <p className="mt-3 font-extrabold text-[#064b2c]">
              Private Files
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Maximum 20 MB per file
            </p>
          </div>
        </div>

        {/* =================================================
            UPLOAD FORM
        ================================================== */}

        <section className="mb-7 overflow-hidden rounded-3xl border border-[#d8e8dd] bg-white shadow-sm">
          <div className="border-b border-slate-100 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9f7ee]">
                <Upload className="h-6 w-6 text-[#075b35]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  Upload & Assign Worker File
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Choose an employee and upload
                  the document that should appear
                  in their My Files page.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#fbfdfb] p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  File title *
                </span>

                <input
                  value={workerFileTitle}
                  onChange={(event) =>
                    setWorkerFileTitle(
                      event.target.value
                    )
                  }
                  placeholder="Example: Employment Contract"
                  className="w-full rounded-xl border border-[#dfe6e1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#075b35]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Assign to worker *
                </span>

                <select
                  value={assignedWorkerId}
                  onChange={(event) =>
                    setAssignedWorkerId(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-[#dfe6e1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#075b35]"
                >
                  <option value="">
                    Select worker
                  </option>

                  {workers.map((worker) => (
                    <option
                      key={worker.id}
                      value={worker.id}
                    >
                      {worker.name} —{" "}
                      {worker.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Category
                </span>

                <input
                  value={workerFileCategory}
                  onChange={(event) =>
                    setWorkerFileCategory(
                      event.target.value
                    )
                  }
                  placeholder="Contract, Training, Salary, Letter..."
                  className="w-full rounded-xl border border-[#dfe6e1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#075b35]"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Choose file *
                </span>

                <input
                  ref={workerFileInput}
                  type="file"
                  onChange={(event) => {
                    setError("");

                    const file =
                      event.target.files?.[0] ||
                      null;

                    if (
                      file &&
                      file.size >
                        20 * 1024 * 1024
                    ) {
                      setSelectedWorkerFile(
                        null
                      );

                      event.target.value = "";

                      setError(
                        "The file must be 20 MB or smaller."
                      );

                      return;
                    }

                    setSelectedWorkerFile(
                      file
                    );
                  }}
                  className="block w-full rounded-xl border border-[#dfe6e1] bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf7ef] file:px-3 file:py-1.5 file:text-xs file:font-extrabold file:text-[#075b35]"
                />
              </label>
            </div>

            <label className="mt-4 block">
              <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                Description
              </span>

              <textarea
                value={workerFileDescription}
                onChange={(event) =>
                  setWorkerFileDescription(
                    event.target.value
                  )
                }
                placeholder="Optional note about this employee file"
                rows={3}
                className="w-full resize-none rounded-xl border border-[#dfe6e1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#075b35]"
              />
            </label>

            {assignedWorker && (
              <div className="mt-4 rounded-2xl border border-[#d8e8dd] bg-white px-4 py-3">
                <p className="text-xs font-extrabold uppercase tracking-wide text-slate-400">
                  Selected employee
                </p>

                <div className="mt-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf7ef] font-extrabold text-[#075b35]">
                    {assignedWorker.name
                      .trim()
                      .charAt(0)
                      .toUpperCase() || "W"}
                  </div>

                  <div>
                    <p className="font-extrabold text-slate-700">
                      {assignedWorker.name}
                    </p>

                    <p className="text-sm text-slate-400">
                      {assignedWorker.email}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={uploadingWorkerFile}
                onClick={() =>
                  void handleWorkerFileUpload()
                }
                className="inline-flex items-center gap-2 rounded-xl bg-[#075b35] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#064b2c] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploadingWorkerFile ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}

                {uploadingWorkerFile
                  ? "Uploading..."
                  : "Upload & Assign"}
              </button>

              {selectedWorkerFile && (
                <div className="inline-flex max-w-full items-center gap-2 rounded-xl border border-[#dfe6e1] bg-white px-3 py-2 text-xs font-bold text-slate-500">
                  <FileText className="h-4 w-4 shrink-0 text-[#075b35]" />

                  <span className="max-w-[260px] truncate">
                    {selectedWorkerFile.name}
                  </span>

                  <span className="text-slate-400">
                    {formatFileSize(
                      selectedWorkerFile.size
                    )}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWorkerFile(
                        null
                      );

                      if (
                        workerFileInput.current
                      ) {
                        workerFileInput.current.value =
                          "";
                      }
                    }}
                    className="rounded-md p-1 transition hover:bg-slate-100"
                    aria-label="Remove selected file"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>

            <p className="mt-3 text-xs text-slate-400">
              Maximum 20 MB per file. Files are
              stored privately and are only
              available to management and the
              employee they are assigned to.
            </p>
          </div>
        </section>

        {/* =================================================
            FILE LIST
        ================================================== */}

        <section className="overflow-hidden rounded-3xl border border-[#e7e1d4] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9f7ee]">
                <UserRound className="h-6 w-6 text-[#075b35]" />
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  Assigned Employee Files
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Review all files sent to
                  employees.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search employee or file..."
                className="w-full rounded-xl border border-[#dfe6e1] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#075b35] sm:w-72"
              />

              <div className="whitespace-nowrap rounded-xl bg-[#edf7ef] px-4 py-2.5 text-sm font-extrabold text-[#075b35]">
                {filteredFiles.length}{" "}
                {filteredFiles.length === 1
                  ? "file"
                  : "files"}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {loadingWorkerFiles ? (
              <div className="flex items-center justify-center gap-3 py-12 text-sm font-bold text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#075b35]" />
                Loading employee files...
              </div>
            ) : filteredFiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d8e8dd] bg-[#fbfdfb] px-5 py-12 text-center">
                <FolderOpen className="mx-auto h-9 w-9 text-[#075b35]" />

                <p className="mt-3 font-extrabold text-slate-700">
                  {workerFiles.length === 0
                    ? "No employee files yet"
                    : "No matching files"}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {workerFiles.length === 0
                    ? "Upload a file above and assign it to an employee."
                    : "Try another employee name, category or file title."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map(
                  (file) => {
                    const openUrl =
                      `/api/worker-files/${encodeURIComponent(
                        file.id
                      )}/file`;

                    const downloadUrl =
                      `${openUrl}?download=1`;

                    const deleting =
                      deletingWorkerFileId ===
                      file.id;

                    return (
                      <article
                        key={file.id}
                        className="rounded-2xl border border-[#edf0ed] bg-white p-4 transition hover:border-[#d6e5da] hover:bg-[#fbfdfb]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf7ef]">
                              <FileText className="h-5 w-5 text-[#075b35]" />
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-extrabold text-slate-700">
                                {file.title}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-400">
                                <span>
                                  {file.fileName}
                                </span>

                                {file.size ? (
                                  <span>
                                    •{" "}
                                    {formatFileSize(
                                      file.size
                                    )}
                                  </span>
                                ) : null}

                                {file.category ? (
                                  <span>
                                    •{" "}
                                    {file.category}
                                  </span>
                                ) : null}
                              </div>

                              {file.assignedTo && (
                                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                                  <span className="font-bold text-[#075b35]">
                                    Assigned to:
                                  </span>

                                  <span className="font-semibold text-slate-600">
                                    {
                                      file
                                        .assignedTo
                                        .name
                                    }
                                  </span>

                                  <span className="text-slate-400">
                                    {
                                      file
                                        .assignedTo
                                        .email
                                    }
                                  </span>
                                </div>
                              )}

                              {file.description && (
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                  {
                                    file.description
                                  }
                                </p>
                              )}

                              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
                                <span>
                                  Assigned:{" "}
                                  {formatDate(
                                    file.createdAt
                                  )}
                                </span>

                                {file.uploadedBy && (
                                  <span>
                                    Uploaded by{" "}
                                    {
                                      file
                                        .uploadedBy
                                        .name
                                    }
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap gap-2">
                            <a
                              href={openUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 rounded-xl border border-[#d6e5da] bg-white px-3.5 py-2 text-xs font-extrabold text-[#075b35] transition hover:bg-[#edf7ef]"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Open
                            </a>

                            <a
                              href={downloadUrl}
                              className="inline-flex items-center gap-2 rounded-xl bg-[#075b35] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#064b2c]"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>

                            <button
                              type="button"
                              disabled={deleting}
                              onClick={() =>
                                void handleWorkerFileDelete(
                                  file
                                )
                              }
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}

                              {deleting
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            SECURITY NOTE
        ================================================== */}

        <section className="mt-7 rounded-3xl border border-[#d8e8dd] bg-[#edf7ef] p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
              <ShieldCheck className="h-6 w-6 text-[#075b35]" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-[#064b2c]">
                Private Employee Documents
              </h3>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                Management can upload and
                assign employee documents.
                Employees can access only files
                assigned to their own account.
                They cannot delete or alter the
                original stored file.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          © 2026 Siraaje Poultry & Feeds
          Company
        </p>
      </div>
    </main>
  );
}