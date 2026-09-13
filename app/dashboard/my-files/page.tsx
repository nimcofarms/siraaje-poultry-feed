"use client";

import {
  Download,
  ExternalLink,
  File,
  FileText,
  FolderOpen,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type AssignedTo = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UploadedBy = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type WorkerFile = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  fileName: string;
  fileUrl: string;
  blobPathname: string | null;
  contentType: string;
  size: number | null;
  assignedToId: string | null;
  uploadedById: string;
  createdAt: string;
  updatedAt: string;
  assignedTo: AssignedTo | null;
  uploadedBy: UploadedBy;
};

type ApiResponse = {
  workerFiles?: WorkerFile[];
  files?: WorkerFile[];
  error?: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatFileSize(bytes: number | null) {
  if (!bytes || bytes <= 0) {
    return "Size unavailable";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }

  const mb = kb / 1024;

  return `${mb.toFixed(1)} MB`;
}

function getCategoryLabel(category: string | null) {
  if (!category) {
    return "Worker File";
  }

  return category;
}

export default function MyFilesPage() {
  const router = useRouter();

  const [files, setFiles] = useState<WorkerFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadFiles = useCallback(async (manualRefresh = false) => {
    try {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const response = await fetch("/api/worker-files", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      const data = (await response.json()) as ApiResponse;

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Your assigned files could not be loaded."
        );
      }

      const result = data.workerFiles ?? data.files ?? [];

      setFiles(Array.isArray(result) ? result : []);
    } catch (loadError) {
      console.error("MY FILES LOAD ERROR:", loadError);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Your assigned files could not be loaded."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (logoutError) {
      console.error("LOGOUT ERROR:", logoutError);
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  function openFile(file: WorkerFile) {
    window.open(
      `/api/worker-files/${encodeURIComponent(file.id)}/file`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function downloadFile(file: WorkerFile) {
    window.location.href =
      `/api/worker-files/${encodeURIComponent(file.id)}/file?download=1`;
  }

  return (
    <main className="min-h-screen bg-[#f5f1e8]">
      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-[#d8d1c3] bg-[#173d2b] text-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <FolderOpen className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-bold sm:text-2xl">
                My Files
              </h1>

              <p className="truncate text-xs text-white/70 sm:text-sm">
                Faylashayda • Siraaje Poultry Feed
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadFiles(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm font-semibold transition hover:bg-white/20"
            >
              <LogOut className="h-4 w-4" />

              <span className="hidden sm:inline">
                Logout
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          PAGE
      ====================================================== */}

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Intro */}

        <section className="mb-6 overflow-hidden rounded-2xl border border-[#d8d1c3] bg-white shadow-sm">
          <div className="border-b border-[#e7e1d7] bg-[#fbf9f4] px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-[#24613f]" />

                  <span className="text-xs font-bold uppercase tracking-wider text-[#24613f]">
                    Private Worker Files
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-[#18352a]">
                  Files Assigned to You
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6a665f]">
                  This area contains only files that have
                  been assigned to your account by Siraaje
                  Poultry Feed management.
                </p>
              </div>

              <div className="rounded-xl bg-[#edf5ef] px-5 py-3 text-center">
                <p className="text-2xl font-bold text-[#1d5035]">
                  {files.length}
                </p>

                <p className="text-xs font-semibold text-[#597062]">
                  Assigned Files
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3 rounded-xl border border-[#d8e6dc] bg-[#f4faf5] p-4">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#24613f]" />

              <div>
                <p className="text-sm font-semibold text-[#234b35]">
                  Read and download only
                </p>

                <p className="mt-1 text-sm leading-6 text-[#667269]">
                  You can open or download files assigned to
                  you. You cannot upload, replace, edit,
                  delete, or assign files.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Error */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}

        {loading ? (
          <section className="rounded-2xl border border-[#d8d1c3] bg-white px-6 py-16 text-center shadow-sm">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-[#24613f]" />

            <p className="mt-4 font-semibold text-[#34473d]">
              Loading your files...
            </p>
          </section>
        ) : files.length === 0 ? (
          /* Empty */

          <section className="rounded-2xl border border-[#d8d1c3] bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#edf5ef]">
              <FolderOpen className="h-8 w-8 text-[#24613f]" />
            </div>

            <h3 className="mt-5 text-xl font-bold text-[#18352a]">
              No files assigned
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#716d65]">
              Management has not assigned any files to your
              account yet. When a file is assigned to you,
              it will appear here automatically.
            </p>
          </section>
        ) : (
          /* Files */

          <section>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#18352a]">
                  Your Files
                </h3>

                <p className="mt-1 text-sm text-[#716d65]">
                  Open or download the files assigned to your
                  account.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {files.map((file) => (
                <article
                  key={file.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-[#d8d1c3] bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf5ef]">
                        {file.contentType ===
                        "application/pdf" ? (
                          <FileText className="h-6 w-6 text-[#24613f]" />
                        ) : (
                          <File className="h-6 w-6 text-[#24613f]" />
                        )}
                      </div>

                      <span className="rounded-full bg-[#f0ece3] px-3 py-1 text-xs font-semibold text-[#686158]">
                        {getCategoryLabel(file.category)}
                      </span>
                    </div>

                    <div className="mt-4">
                      <h4 className="break-words text-lg font-bold text-[#18352a]">
                        {file.title}
                      </h4>

                      <p className="mt-1 break-all text-xs text-[#8a857d]">
                        {file.fileName}
                      </p>
                    </div>

                    {file.description && (
                      <p className="mt-4 text-sm leading-6 text-[#68645e]">
                        {file.description}
                      </p>
                    )}

                    <div className="mt-5 space-y-2 border-t border-[#eee9df] pt-4 text-xs text-[#777168]">
                      <div className="flex items-center justify-between gap-3">
                        <span>File size</span>

                        <span className="font-semibold text-[#4d4943]">
                          {formatFileSize(file.size)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span>Assigned</span>

                        <span className="text-right font-semibold text-[#4d4943]">
                          {formatDate(file.createdAt)}
                        </span>
                      </div>

                      {file.uploadedBy?.name && (
                        <div className="flex items-center justify-between gap-3">
                          <span>Uploaded by</span>

                          <span className="text-right font-semibold text-[#4d4943]">
                            {file.uploadedBy.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-[#e8e2d8] bg-[#fbfaf7] p-4">
                    <button
                      type="button"
                      onClick={() => openFile(file)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#cfc8bb] bg-white px-3 py-2.5 text-sm font-semibold text-[#34473d] transition hover:bg-[#f3f0e9]"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </button>

                    <button
                      type="button"
                      onClick={() => downloadFile(file)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#24613f] px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d5035]"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}