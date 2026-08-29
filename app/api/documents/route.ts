import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown server error.";
}

// =========================================================
// GET ALL UPLOADED COMPANY DOCUMENTS
// =========================================================
export async function GET() {
  try {
    const documents = await prisma.companyDocument.findMany({
      orderBy: {
        uploadedAt: "desc",
      },
    });

    return NextResponse.json(documents);
  } catch (error) {
    console.error("DOCUMENTS GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Documents could not be loaded.",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// =========================================================
// UPLOAD / REPLACE PDF
// =========================================================
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");
    const code = String(formData.get("code") || "").trim();
    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();

    // -----------------------------------------------------
    // VALIDATE DOCUMENT INFORMATION
    // -----------------------------------------------------
    if (!code || !name || !category) {
      return NextResponse.json(
        {
          error: "Document code, name and category are required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // VALIDATE FILE
    // -----------------------------------------------------
    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please select a PDF file.",
        },
        { status: 400 }
      );
    }

    // iPhone/Safari may sometimes provide an empty or
    // unusual MIME type, so also accept a .pdf filename.
    const fileName = file.name || "";
    const hasPdfExtension = fileName.toLowerCase().endsWith(".pdf");
    const hasPdfMimeType = file.type === "application/pdf";

    if (!hasPdfMimeType && !hasPdfExtension) {
      return NextResponse.json(
        {
          error: "Only PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "The PDF must be 10 MB or smaller.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error: "The selected PDF is empty.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // CHECK WHETHER DOCUMENT ALREADY EXISTS
    // -----------------------------------------------------
    const existingDocument =
      await prisma.companyDocument.findUnique({
        where: {
          code,
        },
      });

    // -----------------------------------------------------
    // CREATE SAFE BLOB FILE NAME
    // -----------------------------------------------------
    const safeCode = code.replace(/[^a-zA-Z0-9-_]/g, "-");

    const pathname =
      `company-documents/${safeCode}-${Date.now()}.pdf`;

    // -----------------------------------------------------
    // CHECK BLOB CONFIGURATION
    // -----------------------------------------------------
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error(
        "DOCUMENT UPLOAD ERROR: BLOB_READ_WRITE_TOKEN is missing."
      );

      return NextResponse.json(
        {
          error:
            "Document storage is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------------------
    // UPLOAD PDF TO PRIVATE VERCEL BLOB
    // -----------------------------------------------------
    let blob;

    try {
      blob = await put(pathname, file, {
        access: "private",
        addRandomSuffix: true,
        contentType: "application/pdf",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
    } catch (blobError) {
      console.error("VERCEL BLOB UPLOAD ERROR:", blobError);

      return NextResponse.json(
        {
          error: "Vercel Blob could not upload the PDF.",
          details: getErrorMessage(blobError),
        },
        { status: 500 }
      );
    }

    // -----------------------------------------------------
    // SAVE DOCUMENT INFORMATION IN POSTGRESQL
    // -----------------------------------------------------
    let document;

    try {
      document = await prisma.companyDocument.upsert({
        where: {
          code,
        },

        update: {
          name,
          category,
          fileName: file.name,
          fileUrl: blob.url,
          blobPathname: blob.pathname,
          contentType: "application/pdf",
          size: file.size,
          uploadedAt: new Date(),
        },

        create: {
          code,
          name,
          category,
          fileName: file.name,
          fileUrl: blob.url,
          blobPathname: blob.pathname,
          contentType: "application/pdf",
          size: file.size,
        },
      });
    } catch (databaseError) {
      console.error(
        "DOCUMENT DATABASE SAVE ERROR:",
        databaseError
      );

      try {
        await del(blob.url, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (cleanupError) {
        console.error(
          "NEW BLOB CLEANUP ERROR:",
          cleanupError
        );
      }

      return NextResponse.json(
        {
          error:
            "The PDF was uploaded, but its document record could not be saved.",
          details: getErrorMessage(databaseError),
        },
        { status: 500 }
      );
    }

    // -----------------------------------------------------
    // REMOVE OLD PDF AFTER SUCCESSFUL REPLACEMENT
    // -----------------------------------------------------
    if (
      existingDocument?.fileUrl &&
      existingDocument.fileUrl !== blob.url
    ) {
      try {
        await del(existingDocument.fileUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (deleteError) {
        console.error(
          "OLD DOCUMENT BLOB DELETE ERROR:",
          deleteError
        );
      }
    }

    // -----------------------------------------------------
    // RETURN SAVED DOCUMENT
    // -----------------------------------------------------
    return NextResponse.json(
      {
        success: true,
        document,
      },
      {
        status: existingDocument ? 200 : 201,
      }
    );
  } catch (error) {
    console.error("DOCUMENT UPLOAD ERROR:", error);

    return NextResponse.json(
      {
        error: "The PDF could not be uploaded.",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE UPLOADED DOCUMENT
// =========================================================
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const code = String(
      searchParams.get("code") || ""
    ).trim();

    if (!code) {
      return NextResponse.json(
        {
          error: "Document code is required.",
        },
        { status: 400 }
      );
    }

    const document =
      await prisma.companyDocument.findUnique({
        where: {
          code,
        },
      });

    if (!document) {
      return NextResponse.json(
        {
          error: "Document was not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // DELETE PRIVATE BLOB FILE
    // -----------------------------------------------------
    if (document.fileUrl) {
      try {
        await del(document.fileUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (blobError) {
        console.error(
          "DOCUMENT BLOB DELETE ERROR:",
          blobError
        );

        return NextResponse.json(
          {
            error:
              "The PDF could not be removed from file storage.",
            details: getErrorMessage(blobError),
          },
          { status: 500 }
        );
      }
    }

    // -----------------------------------------------------
    // DELETE DATABASE RECORD
    // -----------------------------------------------------
    await prisma.companyDocument.delete({
      where: {
        code,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("DOCUMENT DELETE ERROR:", error);

    return NextResponse.json(
      {
        error: "The document could not be deleted.",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}