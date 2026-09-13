
import { get } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUser, isOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// =========================================================
// SECURE WORKER FILE DOWNLOAD / OPEN
//
// OWNER / ADMIN:
// Can access every worker file.
//
// WORKER:
// Can access ONLY files assigned to their own account.
//
// Workers cannot edit, replace, reassign or delete files.
// =========================================================

export async function GET(
  request: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  }
) {
  try {
    // =====================================================
    // AUTHENTICATION
    // =====================================================

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

    // =====================================================
    // GET FILE ID
    // =====================================================

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json(
        {
          error: "Worker file ID is required.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // FIND WORKER FILE
    // =====================================================

    const workerFile =
      await prisma.workerFile.findUnique({
        where: {
          id,
        },

        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },

          uploadedBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

    if (!workerFile) {
      return NextResponse.json(
        {
          error: "Worker file was not found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // SECURITY CHECK
    // =====================================================
    //
    // OWNER / ADMIN:
    // Can access every worker file.
    //
    // WORKER:
    // assignedToId MUST match their logged-in user ID.
    //
    // This prevents Worker A from changing the URL
    // and downloading Worker B's file.
    // =====================================================

    const ownerOrAdmin = isOwner(user);

    if (
      !ownerOrAdmin &&
      workerFile.assignedToId !== user.id
    ) {
      return NextResponse.json(
        {
          error:
            "You do not have permission to access this file.",
        },
        { status: 403 }
      );
    }

    // =====================================================
    // STORAGE CONFIGURATION
    // =====================================================

    const blobToken =
      process.env.BLOB_READ_WRITE_TOKEN;

    if (!blobToken) {
      console.error(
        "WORKER FILE DOWNLOAD ERROR: BLOB_READ_WRITE_TOKEN is missing."
      );

      return NextResponse.json(
        {
          error:
            "Worker file storage is not configured.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // GET PRIVATE FILE FROM VERCEL BLOB
    // =====================================================

    const blobResult = await get(
      workerFile.fileUrl,
      {
        access: "private",
        token: blobToken,
      }
    );

    if (!blobResult || !blobResult.stream) {
      return NextResponse.json(
        {
          error:
            "The stored worker file could not be found.",
        },
        { status: 404 }
      );
    }

    // =====================================================
    // OPEN OR DOWNLOAD
    // =====================================================

    const { searchParams } =
      new URL(request.url);

    const shouldDownload =
      searchParams.get("download") === "1";

    const disposition = shouldDownload
      ? "attachment"
      : "inline";

    // Clean the filename before putting it in
    // the Content-Disposition header.
    const safeDownloadName =
      workerFile.fileName
        .replace(/[\r\n"]/g, "_")
        .replace(/[^\x20-\x7E]/g, "_");

    const headers = new Headers();

    headers.set(
      "Content-Type",
      workerFile.contentType ||
        "application/octet-stream"
    );

    headers.set(
      "Content-Disposition",
      `${disposition}; filename="${safeDownloadName}"`
    );

    headers.set(
      "Cache-Control",
      "private, no-store, max-age=0"
    );

    headers.set(
      "X-Content-Type-Options",
      "nosniff"
    );

    if (workerFile.size) {
      headers.set(
        "Content-Length",
        String(workerFile.size)
      );
    }

    // =====================================================
    // SEND FILE
    // =====================================================

    return new Response(
      blobResult.stream,
      {
        status: 200,
        headers,
      }
    );
  } catch (error) {
    console.error(
      "WORKER FILE DOWNLOAD ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "The worker file could not be opened or downloaded.",
      },
      { status: 500 }
    );
  }
}