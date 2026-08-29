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
    title: "Forms & Templates",
    description:
      "Printable forms and reusable templates for everyday company operations.",
    icon: FileText,
    documents: [
      {
        name: "General Request Form",
        code: "SPF-FRM-001",
        version: "1.0",
      },
      {
        name: "Incident Report Form",
        code: "SPF-FRM-002",
        version: "1.0",
      },
      {
        name: "Asset Handover Form",
        code: "SPF-FRM-003",
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
  }, [loadDocuments]);

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