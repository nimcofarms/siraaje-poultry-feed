import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import {
  getCurrentUser,
  isOwner,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

/* =========================================================
   HELPERS
========================================================= */

function unauthorizedResponse() {
  return NextResponse.json(
    {
      error:
        "Fadlan marka hore gal. / Please log in first.",
    },
    { status: 401 }
  );
}

function forbiddenResponse() {
  return NextResponse.json(
    {
      error:
        "Documents are restricted to OWNER and ADMIN accounts.",
    },
    { status: 403 }
  );
}

async function requireManagement() {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: unauthorizedResponse(),
    };
  }

  if (!isOwner(user)) {
    return {
      user,
      response: forbiddenResponse(),
    };
  }

  return {
    user,
    response: null,
  };
}

function cleanText(
  value: FormDataEntryValue | null
) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function safeBlobCode(code: string) {
  const cleaned = code
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned || "document";
}

function isPdfFile(file: File) {
  const type = file.type
    .trim()
    .toLowerCase();

  const name = file.name
    .trim()
    .toLowerCase();

  return (
    type === "application/pdf" ||
    name.endsWith(".pdf")
  );
}

/* =========================================================
   GET
   OWNER / ADMIN ONLY
========================================================= */

export async function GET() {
  try {
    const auth = await requireManagement();

    if (auth.response) {
      return auth.response;
    }

    const documents =
      await prisma.companyDocument.findMany({
        orderBy: [
          {
            category: "asc",
          },
          {
            name: "asc",
          },
        ],
      });

    return NextResponse.json({
      documents,
    });
  } catch (error) {
    console.error(
      "DOCUMENT GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Documents could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   OWNER / ADMIN ONLY
   Upload new PDF or replace existing PDF
========================================================= */

export async function POST(
  request: Request
) {
  let newBlobUrl: string | null = null;

  try {
    const auth = await requireManagement();

    if (auth.response) {
      return auth.response;
    }

    const formData =
      await request.formData();

    const code = cleanText(
      formData.get("code")
    );

    const name = cleanText(
      formData.get("name")
    );

    const category = cleanText(
      formData.get("category")
    );

    const fileValue =
      formData.get("file");

    if (!code) {
      return NextResponse.json(
        {
          error:
            "Document code is required.",
        },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        {
          error:
            "Document name is required.",
        },
        { status: 400 }
      );
    }

    if (!category) {
      return NextResponse.json(
        {
          error:
            "Document category is required.",
        },
        { status: 400 }
      );
    }

    if (!(fileValue instanceof File)) {
      return NextResponse.json(
        {
          error:
            "Please select a PDF file.",
        },
        { status: 400 }
      );
    }

    const file = fileValue;

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error:
            "The selected PDF file is empty.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error:
            "PDF file must be 10 MB or smaller.",
        },
        { status: 400 }
      );
    }

    if (!isPdfFile(file)) {
      return NextResponse.json(
        {
          error:
            "Only PDF files are allowed.",
        },
        { status: 400 }
      );
    }

    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      console.error(
        "DOCUMENT UPLOAD ERROR: BLOB_READ_WRITE_TOKEN is missing."
      );

      return NextResponse.json(
        {
          error:
            "Document storage is not configured.",
        },
        { status: 500 }
      );
    }

    const existingDocument =
      await prisma.companyDocument.findUnique({
        where: {
          code,
        },
      });

    const pathname =
      `company-documents/` +
      `${safeBlobCode(code)}-${Date.now()}.pdf`;

    const blob = await put(
      pathname,
      file,
      {
        access: "private",
        addRandomSuffix: true,
        contentType: "application/pdf",
        token: blobToken,
      }
    );

    newBlobUrl = blob.url;

    let document;

    try {
      document =
        await prisma.companyDocument.upsert({
          where: {
            code,
          },

          create: {
            code,
            name,
            category,
            fileName:
              file.name || `${code}.pdf`,
            fileUrl: blob.url,
            blobPathname: blob.pathname,
            contentType:
              "application/pdf",
            size: file.size,
          },

          update: {
            name,
            category,
            fileName:
              file.name || `${code}.pdf`,
            fileUrl: blob.url,
            blobPathname: blob.pathname,
            contentType:
              "application/pdf",
            size: file.size,
          },
        });
    } catch (databaseError) {
      try {
        await del(blob.url, {
          token: blobToken,
        });
      } catch (cleanupError) {
        console.error(
          "DOCUMENT NEW BLOB CLEANUP ERROR:",
          cleanupError
        );
      }

      throw databaseError;
    }

    if (
      existingDocument?.fileUrl &&
      existingDocument.fileUrl !== blob.url
    ) {
      try {
        await del(
          existingDocument.fileUrl,
          {
            token: blobToken,
          }
        );
      } catch (oldBlobError) {
        console.error(
          "DOCUMENT OLD BLOB DELETE ERROR:",
          oldBlobError
        );
      }
    }

    return NextResponse.json(
      {
        message: existingDocument
          ? "Document replaced successfully."
          : "Document uploaded successfully.",

        document,
      },
      {
        status: existingDocument
          ? 200
          : 201,
      }
    );
  } catch (error) {
    console.error(
      "DOCUMENT POST ERROR:",
      error
    );

    if (newBlobUrl) {
      const blobToken =
        process.env.BLOB_READ_WRITE_TOKEN;

      if (blobToken) {
        try {
          await del(newBlobUrl, {
            token: blobToken,
          });
        } catch (cleanupError) {
          console.error(
            "DOCUMENT POST CLEANUP ERROR:",
            cleanupError
          );
        }
      }
    }

    return NextResponse.json(
      {
        error:
          "Document could not be uploaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   OWNER / ADMIN ONLY
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    const auth = await requireManagement();

    if (auth.response) {
      return auth.response;
    }

    const { searchParams } =
      new URL(request.url);

    const code =
      searchParams.get("code")?.trim();

    if (!code) {
      return NextResponse.json(
        {
          error:
            "Document code is required.",
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
          error:
            "Document was not found.",
        },
        { status: 404 }
      );
    }

    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN;

    if (
      document.fileUrl &&
      !blobToken
    ) {
      console.error(
        "DOCUMENT DELETE ERROR: BLOB_READ_WRITE_TOKEN is missing."
      );

      return NextResponse.json(
        {
          error:
            "Document storage is not configured.",
        },
        { status: 500 }
      );
    }

    if (
      document.fileUrl &&
      blobToken
    ) {
      try {
        await del(
          document.fileUrl,
          {
            token: blobToken,
          }
        );
      } catch (blobError) {
        console.error(
          "DOCUMENT BLOB DELETE ERROR:",
          blobError
        );

        return NextResponse.json(
          {
            error:
              "The document file could not be deleted.",
          },
          { status: 500 }
        );
      }
    }

    await prisma.companyDocument.delete({
      where: {
        code,
      },
    });

    return NextResponse.json({
      message:
        "Document deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DOCUMENT DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Document could not be deleted.",
      },
      { status: 500 }
    );
  }
}