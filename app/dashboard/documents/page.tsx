"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  HardHat,
  Loader2,
  Printer,
  RefreshCw,
  Scale,
  ShieldCheck,
  Trash2,
  Truck,
  Upload,
  Users,
  UserRound,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type DocumentItem = {
  name: string;
  code: string;
  version?: string;
  staticFile?: string;
  staticUploaded?: boolean;
};

type DocumentSection = {
  title: string;
  description: string;
  icon: typeof Users;
  documents: DocumentItem[];
};

type UploadedDocument = {
  id: string;
  code: string;
  name: string;
  category: string;
  fileName: string;
  fileUrl: string;
  blobPathname?: string | null;
  contentType: string;
  size?: number | null;
  uploadedAt: string;
  updatedAt: string;
};

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
  contentType: string;
  size?: number | null;
  assignedToId?: string | null;
  assignedTo?: WorkerUser | null;
  uploadedBy?: WorkerUser | null;
  createdAt: string;
  updatedAt: string;
};

const documentSections: DocumentSection[] = [
  {
    title: "Employee Documents",
    description:
      "Employment contracts, employee forms, signatures and staff records.",
    icon: Users,
    documents: [
      {
        name: "Employee Rules & Acknowledgement Form",
        code: "SPF-HR-001",
        version: "1.0",
        staticFile:
          "/documents/hr/SPF-HR-001-Employee-Rules.pdf",
        staticUploaded: true,
      },
      {
        name: "Employment Contract",
        code: "SPF-HR-002",
        version: "1.0",
        staticFile:
          "/documents/hr/SPF-HR-002-Employment-Contract.pdf",
        staticUploaded: true,
      },
      {
        name: "Employee Registration Form",
        code: "SPF-HR-003",
        version: "1.0",
        staticFile:
          "/documents/hr/SPF-HR-003-Employee-Registration.pdf",
        staticUploaded: true,
      },
      {
        name: "Leave Request Form",
        code: "SPF-HR-004",
        version: "1.0",
        staticFile:
          "/documents/hr/SPF-HR-004-Leave-Request.pdf",
        staticUploaded: true,
      },
      {
        name: "Employee Warning & Corrective Action Form",
        code: "SPF-HR-005",
        version: "1.0",
        staticFile:
          "/documents/hr/SPF-HR-005-Warning-Corrective-Action.pdf",
        staticUploaded: true,
      },
      {
        name: "Equipment Handover & Return Form",
        code: "SPF-HR-006",
        version: "1.0",
        staticFile:
          "/documents/hr/SPF-HR-006-Equipment-Handover-Return.pdf",
        staticUploaded: true,
      },
    ],
  },

  {
    title: "Company Policies",
    description:
      "Official policies and workplace rules for Siraaje Poultry Feed.",
    icon: ShieldCheck,
    documents: [
      {
        name: "Workplace Rules",
        code: "SPF-POL-001",
        version: "1.0",
      },
      {
        name: "Health & Safety Policy",
        code: "SPF-POL-002",
        version: "1.0",
      },
      {
        name: "Hygiene Policy",
        code: "SPF-POL-003",
        version: "1.0",
      },
      {
        name: "Confidentiality Policy",
        code: "SPF-POL-004",
        version: "1.0",
      },
    ],
  },

  {
    title: "Production Records",
    description:
      "Production forms, feed records, quality records and operational documents.",
    icon: Building2,
    documents: [
      {
        name: "Daily Production Record",
        code: "SPF-PROD-001",
        version: "1.0",
      },
      {
        name: "Feed Production Record",
        code: "SPF-PROD-002",
        version: "1.0",
      },
      {
        name: "Quality Control Form",
        code: "SPF-PROD-003",
        version: "1.0",
      },
    ],
  },

  {
    title: "Purchasing & Suppliers",
    description:
      "Supplier information, purchase forms and supplier agreements.",
    icon: Truck,
    documents: [
      {
        name: "Supplier Registration Form",
        code: "SPF-SUP-001",
        version: "1.0",
      },
      {
        name: "Purchase Order Form",
        code: "SPF-SUP-002",
        version: "1.0",
      },
      {
        name: "Supplier Agreement",
        code: "SPF-SUP-003",
        version: "1.0",
      },
    ],
  },

  {
    title: "Certificates & Legal",
    description:
      "Company certificates, licences and important legal documents.",
    icon: Scale,
    documents: [
      {
        name: "Business Certificate",
        code: "SPF-LEGAL-001",
        version: "1.0",
      },
      {
        name: "Business Licence",
        code: "SPF-LEGAL-002",
        version: "1.0",
      },
      {
        name: "Tax / Registration Document",
        code: "SPF-LEGAL-003",
        version: "1.0",
      },
      {
        name: "Other Legal Document",
        code: "SPF-LEGAL-004",
        version: "1.0",
      },
    ],
  },
];

function formatFileSize(size?: number | null) {
  if (!size) return "";

  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Record<string, UploadedDocument>
  >({});

  const [loadingDocuments, setLoadingDocuments] =
    useState(true);

  const [uploadingCode, setUploadingCode] = useState<
    string | null
  >(null);

  const [deletingCode, setDeletingCode] = useState<
    string | null
  >(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputs = useRef<
    Record<string, HTMLInputElement | null>
  >({});

  const [workerFiles, setWorkerFiles] = useState<WorkerFileItem[]>([]);
  const [workers, setWorkers] = useState<WorkerUser[]>([]);
  const [isManagement, setIsManagement] = useState(false);
  const [loadingWorkerFiles, setLoadingWorkerFiles] = useState(true);
  const [uploadingWorkerFile, setUploadingWorkerFile] = useState(false);
  const [deletingWorkerFileId, setDeletingWorkerFileId] = useState<string | null>(null);
  const [workerFileTitle, setWorkerFileTitle] = useState("");
  const [workerFileDescription, setWorkerFileDescription] = useState("");
  const [workerFileCategory, setWorkerFileCategory] = useState("");
  const [assignedWorkerId, setAssignedWorkerId] = useState("");
  const [selectedWorkerFile, setSelectedWorkerFile] = useState<File | null>(null);
  const workerFileInput = useRef<HTMLInputElement | null>(null);

  const loadWorkerFiles = useCallback(async () => {
    try {
      setLoadingWorkerFiles(true);

      const response = await fetch("/api/worker-files", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Worker files could not be loaded.");
      }

      const data: WorkerFileItem[] = await response.json();
      setWorkerFiles(data);

      // /api/users is intentionally OWNER / ADMIN only.
      // If it succeeds, this page enables the management controls.
      const usersResponse = await fetch("/api/users", {
        cache: "no-store",
      });

      if (usersResponse.ok) {
        const users: WorkerUser[] = await usersResponse.json();
        setWorkers(users.filter((item) => item.role === "WORKER"));
        setIsManagement(true);
      } else {
        setWorkers([]);
        setIsManagement(false);
      }
    } catch (loadError) {
      console.error(loadError);
      setError("Worker files could not be loaded.");
    } finally {
      setLoadingWorkerFiles(false);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      setLoadingDocuments(true);

      const response = await fetch("/api/documents", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Documents could not be loaded.");
      }

      const data: UploadedDocument[] =
        await response.json();

      const documentMap: Record<
        string,
        UploadedDocument
      > = {};

      for (const document of data) {
        documentMap[document.code] = document;
      }

      setUploadedDocuments(documentMap);
    } catch (loadError) {
      console.error(loadError);
      setError(
        "Uploaded documents could not be loaded."
      );
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
    void loadWorkerFiles();
  }, [loadDocuments, loadWorkerFiles]);

  async function handleFileSelected(
    event: ChangeEvent<HTMLInputElement>,
    document: DocumentItem,
    category: string
  ) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    setMessage("");
    setError("");

    if (file.type !== "application/pdf") {
      setError("Please select a PDF file only.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("The PDF must be 10 MB or smaller.");
      return;
    }

    try {
      setUploadingCode(document.code);

      const formData = new FormData();

      formData.append("file", file);
      formData.append("code", document.code);
      formData.append("name", document.name);
      formData.append("category", category);

      const response = await fetch("/api/documents", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "The PDF could not be uploaded."
        );
      }

      const savedDocument: UploadedDocument =
        result.document;

      setUploadedDocuments((current) => ({
        ...current,
        [document.code]: savedDocument,
      }));

      setMessage(
        `${document.name} uploaded successfully.`
      );
    } catch (uploadError) {
      console.error(uploadError);

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The PDF could not be uploaded."
      );
    } finally {
      setUploadingCode(null);
    }
  }

  async function handleDelete(
    document: DocumentItem
  ) {
    const confirmed = window.confirm(
      `Delete the uploaded PDF for "${document.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");

    try {
      setDeletingCode(document.code);

      const response = await fetch(
        `/api/documents?code=${encodeURIComponent(
          document.code
        )}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "The document could not be deleted."
        );
      }

      setUploadedDocuments((current) => {
        const updated = { ...current };
        delete updated[document.code];
        return updated;
      });

      setMessage(
        `${document.name} was removed successfully.`
      );
    } catch (deleteError) {
      console.error(deleteError);

      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The document could not be deleted."
      );
    } finally {
      setDeletingCode(null);
    }
  }

  async function handleWorkerFileUpload() {
    if (!workerFileTitle.trim()) {
      setError("Please enter a file title.");
      return;
    }

    if (!assignedWorkerId) {
      setError("Please select a worker.");
      return;
    }

    if (!selectedWorkerFile) {
      setError("Please choose a file.");
      return;
    }

    setMessage("");
    setError("");
    setUploadingWorkerFile(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedWorkerFile);
      formData.append("title", workerFileTitle.trim());
      formData.append("description", workerFileDescription.trim());
      formData.append("category", workerFileCategory.trim());
      formData.append("assignedToId", assignedWorkerId);

      const response = await fetch("/api/worker-files", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Worker file could not be uploaded.");
      }

      setWorkerFiles((current) => [result.workerFile, ...current]);
      setWorkerFileTitle("");
      setWorkerFileDescription("");
      setWorkerFileCategory("");
      setAssignedWorkerId("");
      setSelectedWorkerFile(null);

      if (workerFileInput.current) {
        workerFileInput.current.value = "";
      }

      setMessage("Worker file uploaded and assigned successfully.");
    } catch (uploadError) {
      console.error(uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Worker file could not be uploaded."
      );
    } finally {
      setUploadingWorkerFile(false);
    }
  }

  async function handleWorkerFileDelete(file: WorkerFileItem) {
    const confirmed = window.confirm(
      `Delete "${file.title}" from worker files?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingWorkerFileId(file.id);

    try {
      const response = await fetch(
        `/api/worker-files?id=${encodeURIComponent(file.id)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Worker file could not be deleted.");
      }

      setWorkerFiles((current) =>
        current.filter((item) => item.id !== file.id)
      );
      setMessage(`${file.title} was deleted successfully.`);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Worker file could not be deleted."
      );
    } finally {
      setDeletingWorkerFileId(null);
    }
  }

  function openFilePicker(code: string) {
    fileInputs.current[code]?.click();
  }

  const staticDocumentCount = documentSections
    .flatMap((section) => section.documents)
    .filter((document) => document.staticUploaded)
    .length;

  const availableDocuments =
    staticDocumentCount +
    Object.keys(uploadedDocuments).filter((code) => {
      const item = documentSections
        .flatMap((section) => section.documents)
        .find((document) => document.code === code);

      return item && !item.staticUploaded;
    }).length;

  const totalDocuments = documentSections.flatMap(
    (section) => section.documents
  ).length;

  return (
    <main className="min-h-screen bg-[#f7f5ed]">
      {/* HEADER */}
      <header className="border-b border-[#0a4f31] bg-[#075b35] text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <FolderOpen className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">
                Siraaje Poultry Feed
              </p>

              <h1 className="text-2xl font-extrabold">
                Documents
              </h1>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold transition hover:bg-white/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        {/* PAGE INTRO */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-[#b38420]" />

            <p className="text-sm font-extrabold uppercase tracking-[0.15em] text-[#b38420]">
              Document Center
            </p>
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight text-[#064b2c] sm:text-4xl">
            Company Documents
          </h2>

          <p className="mt-3 max-w-3xl leading-7 text-slate-500">
            Upload, organize, open, print and download
            important Siraaje Poultry Feed documents.
          </p>
        </div>

        {/* MESSAGES */}
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

        {/* SUMMARY */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-[#075b35]" />

              <span className="text-sm font-semibold text-slate-500">
                Document Categories
              </span>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-[#064b2c]">
              {documentSections.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <FileCheck2 className="h-5 w-5 text-[#075b35]" />

              <span className="text-sm font-semibold text-slate-500">
                Available Documents
              </span>
            </div>

            <p className="mt-3 text-3xl font-extrabold text-[#064b2c]">
              {loadingDocuments ? (
                <Loader2 className="h-7 w-7 animate-spin" />
              ) : (
                <>
                  {availableDocuments}
                  <span className="ml-1 text-base font-bold text-slate-400">
                    / {totalDocuments}
                  </span>
                </>
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-[#e7e1d4] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <HardHat className="h-5 w-5 text-[#075b35]" />

              <span className="text-sm font-semibold text-slate-500">
                Employee Documents
              </span>
            </div>

            <p className="mt-3 font-extrabold text-[#064b2c]">
              HR-001 — HR-006
            </p>
          </div>
        </div>

        {/* WORKER FILES */}
        <section className="mb-8 overflow-hidden rounded-3xl border border-[#d8e8dd] bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9f7ee]">
                <UserRound className="h-6 w-6 text-[#075b35]" />
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-[#064b2c]">
                  {isManagement ? "Worker Files" : "My Assigned Files"}
                </h3>
                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {isManagement
                    ? "Upload files and assign them to a worker. Workers can open and download their files but cannot alter them."
                    : "Files assigned to your account. You can open or download them; the original company file cannot be changed."}
                </p>
              </div>
            </div>
            <div className="rounded-xl bg-[#edf7ef] px-4 py-2 text-sm font-extrabold text-[#075b35]">
              {loadingWorkerFiles ? "Loading..." : `${workerFiles.length} file${workerFiles.length === 1 ? "" : "s"}`}
            </div>
          </div>

          {isManagement && (
            <div className="border-b border-slate-100 bg-[#fbfdfb] p-6">
              <h4 className="mb-4 font-extrabold text-[#064b2c]">
                Upload & Assign Worker File
              </h4>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    File title
                  </span>
                  <input
                    value={workerFileTitle}
                    onChange={(event) => setWorkerFileTitle(event.target.value)}
                    placeholder="Example: Employment Letter"
                    className="w-full rounded-xl border border-[#dfe6e1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#075b35]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Assign to worker
                  </span>
                  <select
                    value={assignedWorkerId}
                    onChange={(event) => setAssignedWorkerId(event.target.value)}
                    className="w-full rounded-xl border border-[#dfe6e1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#075b35]"
                  >
                    <option value="">Select worker</option>
                    {workers.map((worker) => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} — {worker.email}
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
                    onChange={(event) => setWorkerFileCategory(event.target.value)}
                    placeholder="Contract, Training, Schedule..."
                    className="w-full rounded-xl border border-[#dfe6e1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#075b35]"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Choose file
                  </span>
                  <input
                    ref={workerFileInput}
                    type="file"
                    onChange={(event) =>
                      setSelectedWorkerFile(event.target.files?.[0] || null)
                    }
                    className="block w-full rounded-xl border border-[#dfe6e1] bg-white px-3 py-2 text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#edf7ef] file:px-3 file:py-1.5 file:text-xs file:font-extrabold file:text-[#075b35]"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-1.5 block text-xs font-extrabold uppercase tracking-wide text-slate-500">
                  Description (optional)
                </span>
                <input
                  value={workerFileDescription}
                  onChange={(event) => setWorkerFileDescription(event.target.value)}
                  placeholder="Short note about this file"
                  className="w-full rounded-xl border border-[#dfe6e1] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#075b35]"
                />
              </label>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={uploadingWorkerFile}
                  onClick={() => void handleWorkerFileUpload()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#075b35] px-5 py-3 text-sm font-extrabold text-white transition hover:bg-[#064b2c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploadingWorkerFile ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {uploadingWorkerFile ? "Uploading..." : "Upload & Assign"}
                </button>

                {selectedWorkerFile && (
                  <div className="inline-flex items-center gap-2 rounded-xl border border-[#dfe6e1] bg-white px-3 py-2 text-xs font-bold text-slate-500">
                    <FileText className="h-4 w-4 text-[#075b35]" />
                    {selectedWorkerFile.name}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkerFile(null);
                        if (workerFileInput.current) {
                          workerFileInput.current.value = "";
                        }
                      }}
                      className="rounded-md p-1 hover:bg-slate-100"
                      aria-label="Remove selected file"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Maximum 20 MB per file. The stored file is private.
              </p>
            </div>
          )}

          <div className="p-4 sm:p-6">
            {loadingWorkerFiles ? (
              <div className="flex items-center justify-center gap-3 py-10 text-sm font-bold text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin text-[#075b35]" />
                Loading worker files...
              </div>
            ) : workerFiles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#d8e8dd] bg-[#fbfdfb] px-5 py-10 text-center">
                <FolderOpen className="mx-auto h-8 w-8 text-[#075b35]" />
                <p className="mt-3 font-extrabold text-slate-700">
                  {isManagement ? "No worker files yet" : "No files assigned to you"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {isManagement
                    ? "Upload a file above and assign it to a worker."
                    : "When management assigns a file to you, it will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {workerFiles.map((file) => {
                  const openUrl = `/api/worker-files/${encodeURIComponent(file.id)}/file`;
                  const downloadUrl = `${openUrl}?download=1`;
                  const deleting = deletingWorkerFileId === file.id;

                  return (
                    <div
                      key={file.id}
                      className="rounded-2xl border border-[#edf0ed] bg-white p-4 transition hover:border-[#d6e5da] hover:bg-[#fbfdfb]"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7ef]">
                            <FileText className="h-5 w-5 text-[#075b35]" />
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-700">
                              {file.title}
                            </p>
                            <div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-xs text-slate-400">
                              <span>{file.fileName}</span>
                              {file.size ? <span>• {formatFileSize(file.size)}</span> : null}
                              {file.category ? <span>• {file.category}</span> : null}
                              {isManagement && file.assignedTo ? (
                                <span className="font-bold text-[#075b35]">
                                  • Assigned to {file.assignedTo.name}
                                </span>
                              ) : null}
                            </div>
                            {file.description ? (
                              <p className="mt-2 text-sm text-slate-500">
                                {file.description}
                              </p>
                            ) : null}
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

                          {isManagement && (
                            <button
                              type="button"
                              disabled={deleting}
                              onClick={() => void handleWorkerFileDelete(file)}
                              className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3.5 py-2 text-xs font-extrabold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {deleting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                              {deleting ? "Deleting..." : "Delete"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* DOCUMENT SECTIONS */}
        <div className="grid gap-6 lg:grid-cols-2">
          {documentSections.map((section) => {
            const Icon = section.icon;

            return (
              <section
                key={section.title}
                className="overflow-hidden rounded-3xl border border-[#e7e1d4] bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex items-start gap-4 border-b border-slate-100 p-6">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9f7ee]">
                    <Icon className="h-6 w-6 text-[#075b35]" />
                  </div>

                  <div>
                    <h3 className="text-xl font-extrabold text-[#064b2c]">
                      {section.title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      {section.description}
                    </p>
                  </div>
                </div>

                <div className="p-4">
                  <div className="space-y-3">
                    {section.documents.map((document) => {
                      const uploaded =
                        uploadedDocuments[document.code];

                      const isStatic =
                        document.staticUploaded &&
                        document.staticFile;

                      const isAvailable =
                        Boolean(isStatic) ||
                        Boolean(uploaded);

                      const uploading =
                        uploadingCode === document.code;

                      const deleting =
                        deletingCode === document.code;

                      const privateOpenUrl =
                        `/api/documents/${encodeURIComponent(
                          document.code
                        )}/file`;

                      const privateDownloadUrl =
                        `${privateOpenUrl}?download=1`;

                      return (
                        <div
                          key={document.code}
                          className="rounded-2xl border border-[#edf0ed] bg-white p-4 transition hover:border-[#d6e5da] hover:bg-[#fbfdfb]"
                        >
                          <input
                            ref={(element) => {
                              fileInputs.current[
                                document.code
                              ] = element;
                            }}
                            type="file"
                            accept="application/pdf,.pdf"
                            className="hidden"
                            onChange={(event) =>
                              void handleFileSelected(
                                event,
                                document,
                                section.title
                              )
                            }
                          />

                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf7ef]">
                              <FileText className="h-5 w-5 text-[#075b35]" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="font-extrabold text-slate-700">
                                {document.name}
                              </p>

                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-400">
                                <span>
                                  {document.code}
                                </span>

                                {document.version && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Version{" "}
                                      {document.version}
                                    </span>
                                  </>
                                )}

                                <span>•</span>

                                {isAvailable ? (
                                  <span className="font-extrabold text-[#16824c]">
                                    Available
                                  </span>
                                ) : (
                                  <span className="font-extrabold text-[#b38420]">
                                    PDF not added yet
                                  </span>
                                )}
                              </div>

                              {uploaded && (
                                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                                  <span>
                                    {uploaded.fileName}
                                  </span>

                                  {uploaded.size ? (
                                    <>
                                      <span>•</span>
                                      <span>
                                        {formatFileSize(
                                          uploaded.size
                                        )}
                                      </span>
                                    </>
                                  ) : null}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* STATIC HR PDF */}
                          {isStatic ? (
                            <div className="mt-4 flex flex-wrap gap-2 pl-0 sm:pl-[52px]">
                              <a
                                href={document.staticFile}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-[#d6e5da] bg-white px-3.5 py-2 text-xs font-extrabold text-[#075b35] transition hover:bg-[#edf7ef]"
                              >
                                <Printer className="h-4 w-4" />
                                Open / Print
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>

                              <a
                                href={document.staticFile}
                                download
                                className="inline-flex items-center gap-2 rounded-xl bg-[#075b35] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#064b2c]"
                              >
                                <Download className="h-4 w-4" />
                                Download PDF
                              </a>
                            </div>
                          ) : uploaded ? (
                            /* PRIVATE UPLOADED PDF */
                            <div className="mt-4 flex flex-wrap gap-2 pl-0 sm:pl-[52px]">
                              <a
                                href={privateOpenUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-xl border border-[#d6e5da] bg-white px-3.5 py-2 text-xs font-extrabold text-[#075b35] transition hover:bg-[#edf7ef]"
                              >
                                <Printer className="h-4 w-4" />
                                Open / Print
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>

                              <a
                                href={privateDownloadUrl}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#075b35] px-3.5 py-2 text-xs font-extrabold text-white transition hover:bg-[#064b2c]"
                              >
                                <Download className="h-4 w-4" />
                                Download PDF
                              </a>

                              <button
                                type="button"
                                disabled={
                                  uploading || deleting
                                }
                                onClick={() =>
                                  openFilePicker(
                                    document.code
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-[#d6e5da] bg-white px-3.5 py-2 text-xs font-extrabold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {uploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}

                                {uploading
                                  ? "Replacing..."
                                  : "Replace PDF"}
                              </button>

                              <button
                                type="button"
                                disabled={
                                  deleting || uploading
                                }
                                onClick={() =>
                                  void handleDelete(
                                    document
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
                          ) : (
                            /* REAL UPLOAD BUTTON */
                            <div className="mt-4 pl-0 sm:pl-[52px]">
                              <button
                                type="button"
                                disabled={
                                  uploading ||
                                  loadingDocuments
                                }
                                onClick={() =>
                                  openFilePicker(
                                    document.code
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-xl bg-[#075b35] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#064b2c] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {uploading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Upload className="h-4 w-4" />
                                )}

                                {uploading
                                  ? "Uploading..."
                                  : "Upload PDF"}
                              </button>

                              <p className="mt-2 text-xs text-slate-400">
                                PDF only • Maximum 10 MB
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* DOCUMENT CONTROL */}
        <section className="mt-8 rounded-3xl border border-[#d8e8dd] bg-[#edf7ef] p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
              <ShieldCheck className="h-6 w-6 text-[#075b35]" />
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-[#064b2c]">
                Siraaje Document Control
              </h3>

              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                Company documents can be uploaded securely
                as PDF files. Uploaded documents are stored
                privately and can be opened, printed,
                downloaded, replaced or removed when needed.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-slate-400">
          © 2026 Siraaje Poultry & Feeds Company
        </p>
      </div>
    </main>
  );
}