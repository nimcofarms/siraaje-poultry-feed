import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, hasPermission } from "@/lib/auth";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

export async function GET(
  request: Request,
  context: RouteContext
) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        {
          error: "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // DOCUMENT VIEW PERMISSION
    // =====================================================
    if (!hasPermission(user, "documentsView")) {
      return NextResponse.json(
        {
          error:
            "Ma lihid oggolaanshaha dukumentiyada. / You do not have permission to view documents.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // GET DOCUMENT CODE
    // =====================================================
    const { code } = await context.params;
    const documentCode = decodeURIComponent(code);

    // =====================================================
    // FIND DOCUMENT
    // =====================================================
    const document = await prisma.companyDocument.findUnique({
      where: {
        code: documentCode,
      },
    });

    if (!document || !document.blobPathname) {
      return NextResponse.json(
        {
          error: "Document was not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // GET PRIVATE PDF FROM VERCEL BLOB
    // =====================================================
    const result = await get(document.blobPathname, {
      access: "private",
    });

    if (!result || result.statusCode !== 200 || !result.stream) {
      return NextResponse.json(
        {
          error: "PDF file could not be loaded.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // INLINE VIEW OR DOWNLOAD
    // =====================================================
    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "1";

    const safeFileName = document.fileName
      .replace(/[\r\n"]/g, "")
      .replace(/[^\x20-\x7E]/g, "_");

    // =====================================================
    // RETURN PRIVATE PDF
    // =====================================================
    return new Response(result.stream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${
          download ? "attachment" : "inline"
        }; filename="${safeFileName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("PRIVATE DOCUMENT FILE ERROR:", error);

    return NextResponse.json(
      {
        error: "PDF file could not be loaded.",
      },
      { status: 500 }
    );
  }
}