import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import {
  getCurrentUser,
  isOwner,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

/* =========================================================
   GET COMPANY DOCUMENT FILE
   OWNER / ADMIN ONLY
========================================================= */

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    /* =====================================================
       AUTHENTICATION
    ====================================================== */

    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    /* =====================================================
       OWNER / ADMIN ONLY
    ====================================================== */

    if (!isOwner(user)) {
      return NextResponse.json(
        {
          error:
            "Company documents are restricted to OWNER and ADMIN accounts.",
        },
        { status: 403 }
      );
    }

    /* =====================================================
       GET DOCUMENT CODE
    ====================================================== */

    const { code } = await context.params;

    const documentCode =
      decodeURIComponent(code);

    if (!documentCode.trim()) {
      return NextResponse.json(
        {
          error:
            "Document code is required.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       FIND DOCUMENT
    ====================================================== */

    const document =
      await prisma.companyDocument.findUnique({
        where: {
          code: documentCode,
        },
      });

    if (
      !document ||
      !document.blobPathname
    ) {
      return NextResponse.json(
        {
          error:
            "Document was not found.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       PRIVATE VERCEL BLOB
    ====================================================== */

    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      console.error(
        "PRIVATE DOCUMENT FILE ERROR: BLOB_READ_WRITE_TOKEN is missing."
      );

      return NextResponse.json(
        {
          error:
            "Document storage is not configured.",
        },
        { status: 500 }
      );
    }

    const result = await get(
      document.blobPathname,
      {
        access: "private",
        token: blobToken,
      }
    );

    if (
      !result ||
      result.statusCode !== 200 ||
      !result.stream
    ) {
      return NextResponse.json(
        {
          error:
            "PDF file could not be loaded.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       INLINE VIEW OR DOWNLOAD
    ====================================================== */

    const { searchParams } =
      new URL(request.url);

    const download =
      searchParams.get("download") === "1";

    const safeFileName =
      document.fileName
        .replace(/[\r\n"]/g, "")
        .replace(
          /[^\x20-\x7E]/g,
          "_"
        );

    /* =====================================================
       RETURN PRIVATE PDF
    ====================================================== */

    const headers = new Headers();

    headers.set(
      "Content-Type",
      document.contentType ||
        "application/pdf"
    );

    headers.set(
      "Content-Disposition",
      `${
        download
          ? "attachment"
          : "inline"
      }; filename="${safeFileName}"`
    );

    headers.set(
      "Cache-Control",
      "private, no-store, max-age=0"
    );

    headers.set(
      "X-Content-Type-Options",
      "nosniff"
    );

    if (document.size) {
      headers.set(
        "Content-Length",
        String(document.size)
      );
    }

    return new Response(
      result.stream,
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error(
      "PRIVATE DOCUMENT FILE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "PDF file could not be loaded.",
      },
      { status: 500 }
    );
  }
}