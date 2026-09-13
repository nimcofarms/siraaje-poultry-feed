import { del, put } from "@vercel/blob";
import { NextResponse } from "next/server";

import { getCurrentUser, isOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return "Unknown server error.";
}

function safeFileName(fileName: string) {
  const cleaned = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-");

  return cleaned || "worker-file";
}

// =========================================================
// GET WORKER FILES
//
// OWNER / ADMIN:
// Can see every worker file.
//
// WORKER:
// Can see ONLY files assigned to their own account.
// =========================================================

export async function GET() {
  try {
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

    const ownerOrAdmin = isOwner(user);

    const files = await prisma.workerFile.findMany({
      where: ownerOrAdmin
        ? undefined
        : {
            assignedToId: user.id,
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

      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("WORKER FILES GET ERROR:", error);

    return NextResponse.json(
      {
        error: "Worker files could not be loaded.",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// =========================================================
// UPLOAD + ASSIGN WORKER FILE
//
// IMPORTANT:
// ONLY OWNER / ADMIN CAN DO THIS.
// A normal worker cannot upload or assign worker files.
// =========================================================

export async function POST(request: Request) {
  let uploadedBlobUrl: string | null = null;

  try {
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

    if (!isOwner(user)) {
      return NextResponse.json(
        {
          error:
            "Only OWNER or ADMIN can upload and assign worker files.",
        },
        { status: 403 }
      );
    }

    const formData = await request.formData();

    const file = formData.get("file");

    const title = String(
      formData.get("title") || ""
    ).trim();

    const description = String(
      formData.get("description") || ""
    ).trim();

    const category = String(
      formData.get("category") || ""
    ).trim();

    const assignedToId = String(
      formData.get("assignedToId") || ""
    ).trim();

    // -----------------------------------------------------
    // VALIDATE INFORMATION
    // -----------------------------------------------------

    if (!title) {
      return NextResponse.json(
        {
          error: "File title is required.",
        },
        { status: 400 }
      );
    }

    if (!assignedToId) {
      return NextResponse.json(
        {
          error: "Please select a worker.",
        },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Please select a file.",
        },
        { status: 400 }
      );
    }

    if (file.size <= 0) {
      return NextResponse.json(
        {
          error: "The selected file is empty.",
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "The file must be 20 MB or smaller.",
        },
        { status: 400 }
      );
    }

    // -----------------------------------------------------
    // VERIFY ASSIGNED USER
    // -----------------------------------------------------

    const assignedWorker = await prisma.user.findUnique({
      where: {
        id: assignedToId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!assignedWorker) {
      return NextResponse.json(
        {
          error: "The selected worker was not found.",
        },
        { status: 404 }
      );
    }

    // -----------------------------------------------------
    // CHECK VERCEL BLOB
    // -----------------------------------------------------

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error(
        "WORKER FILE UPLOAD ERROR: BLOB_READ_WRITE_TOKEN is missing."
      );

      return NextResponse.json(
        {
          error:
            "Worker file storage is not configured on the server.",
        },
        { status: 500 }
      );
    }

    // -----------------------------------------------------
    // CREATE PRIVATE BLOB PATH
    // -----------------------------------------------------

    const originalName =
      file.name || "worker-file";

    const cleanedName = safeFileName(originalName);

    const pathname =
      `worker-files/${assignedWorker.id}/` +
      `${Date.now()}-${cleanedName}`;

    // -----------------------------------------------------
    // UPLOAD PRIVATE FILE
    // -----------------------------------------------------

    let blob;

    try {
      blob = await put(pathname, file, {
        access: "private",
        addRandomSuffix: true,
        contentType:
          file.type || "application/octet-stream",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      uploadedBlobUrl = blob.url;
    } catch (blobError) {
      console.error(
        "WORKER FILE BLOB UPLOAD ERROR:",
        blobError
      );

      return NextResponse.json(
        {
          error:
            "The file could not be uploaded to storage.",
          details: getErrorMessage(blobError),
        },
        { status: 500 }
      );
    }

    // -----------------------------------------------------
    // SAVE DATABASE RECORD
    // -----------------------------------------------------

    let workerFile;

    try {
      workerFile = await prisma.workerFile.create({
        data: {
          title,
          description: description || null,
          category: category || null,

          fileName: originalName,
          fileUrl: blob.url,
          blobPathname: blob.pathname,

          contentType:
            file.type || "application/octet-stream",

          size: file.size,

          assignedToId: assignedWorker.id,
          uploadedById: user.id,
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
    } catch (databaseError) {
      console.error(
        "WORKER FILE DATABASE SAVE ERROR:",
        databaseError
      );

      // If database saving fails, remove the new Blob
      // so we do not leave an unused file in storage.
      try {
        await del(blob.url, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (cleanupError) {
        console.error(
          "WORKER FILE CLEANUP ERROR:",
          cleanupError
        );
      }

      return NextResponse.json(
        {
          error:
            "The file was uploaded but could not be saved in the database.",
          details: getErrorMessage(databaseError),
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        workerFile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "WORKER FILE POST ERROR:",
      error
    );

    // Extra cleanup protection
    if (
      uploadedBlobUrl &&
      process.env.BLOB_READ_WRITE_TOKEN
    ) {
      try {
        await del(uploadedBlobUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (cleanupError) {
        console.error(
          "WORKER FILE POST CLEANUP ERROR:",
          cleanupError
        );
      }
    }

    return NextResponse.json(
      {
        error: "The worker file could not be uploaded.",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE WORKER FILE
//
// IMPORTANT:
// ONLY OWNER / ADMIN CAN DELETE.
// WORKERS CANNOT ALTER THEIR ASSIGNED FILES.
// =========================================================

export async function DELETE(request: Request) {
  try {
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

    if (!isOwner(user)) {
      return NextResponse.json(
        {
          error:
            "Only OWNER or ADMIN can delete worker files.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);

    const id = String(
      searchParams.get("id") || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          error: "Worker file ID is required.",
        },
        { status: 400 }
      );
    }

    const workerFile =
      await prisma.workerFile.findUnique({
        where: {
          id,
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

    // -----------------------------------------------------
    // REMOVE PRIVATE BLOB
    // -----------------------------------------------------

    if (
      workerFile.fileUrl &&
      process.env.BLOB_READ_WRITE_TOKEN
    ) {
      try {
        await del(workerFile.fileUrl, {
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
      } catch (blobError) {
        console.error(
          "WORKER FILE BLOB DELETE ERROR:",
          blobError
        );

        return NextResponse.json(
          {
            error:
              "The worker file could not be removed from storage.",
            details: getErrorMessage(blobError),
          },
          { status: 500 }
        );
      }
    }

    // -----------------------------------------------------
    // REMOVE DATABASE RECORD
    // -----------------------------------------------------

    await prisma.workerFile.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "WORKER FILE DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error: "The worker file could not be deleted.",
        details: getErrorMessage(error),
      },
      { status: 500 }
    );
  }
}