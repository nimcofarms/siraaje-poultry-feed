import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

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

    // Only PDF files are allowed.
    if (file.type !== "application/pdf") {
      return NextResponse.json(
        {
          error: "Only PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    // Maximum file size = 10 MB.
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "The PDF must be 10 MB or smaller.",
        },
        { status: 400 }
      );
    }

    // Empty files should not be accepted.
    if (file.size <= 0) {
      return NextResponse.json(
        {
          error: "The selected PDF is empty.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // CHECK WHETHER THIS DOCUMENT ALREADY EXISTS
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
    // UPLOAD PDF TO PRIVATE VERCEL BLOB
    // -----------------------------------------------------
    const blob = await put(pathname, file, {
      access: "private",
      addRandomSuffix: true,
      contentType: "application/pdf",
    });

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
      // If the database operation fails after the Blob upload,
      // remove the newly uploaded Blob so we do not leave
      // unused files in storage.
      try {
        await del(blob.url);
      } catch (cleanupError) {
        console.error(
          "NEW BLOB CLEANUP ERROR:",
          cleanupError
        );
      }

      throw databaseError;
    }

    // -----------------------------------------------------
    // REMOVE OLD PDF AFTER SUCCESSFUL REPLACEMENT
    // -----------------------------------------------------
    if (
      existingDocument?.fileUrl &&
      existingDocument.fileUrl !== blob.url
    ) {
      try {
        await del(existingDocument.fileUrl);
      } catch (deleteError) {
        // Do not fail the new upload just because cleanup
        // of the old file failed.
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

    // -----------------------------------------------------
    // VALIDATE CODE
    // -----------------------------------------------------
    if (!code) {
      return NextResponse.json(
        {
          error: "Document code is required.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // FIND DOCUMENT
    // -----------------------------------------------------
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
        await del(document.fileUrl);
      } catch (blobError) {
        console.error(
          "DOCUMENT BLOB DELETE ERROR:",
          blobError
        );

        return NextResponse.json(
          {
            error:
              "The PDF could not be removed from file storage.",
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
      },
      { status: 500 }
    );
  }
}