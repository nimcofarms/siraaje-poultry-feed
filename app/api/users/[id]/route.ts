import { getCurrentUser, isOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

// =========================================================
// UPDATE WORKER
// OWNER / ADMIN ONLY
// =========================================================
export async function PATCH(
  request: Request,
  context: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "You are not logged in." },
        { status: 401 }
      );
    }

    if (!isOwner(currentUser)) {
      return NextResponse.json(
        { error: "You do not have permission to edit workers." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    const worker = await prisma.user.findUnique({
      where: { id },
    });

    if (!worker) {
      return NextResponse.json(
        { error: "Worker was not found." },
        { status: 404 }
      );
    }

    // Prevent this API from modifying OWNER/ADMIN accounts.
    if (worker.role === "OWNER" || worker.role === "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Owner/administrator accounts cannot be changed here.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "")
      .trim()
      .toLowerCase();
    const password = String(body.password || "");

    if (!name || !email) {
      return NextResponse.json(
        {
          error: "Name and email are required.",
        },
        { status: 400 }
      );
    }

    const duplicateEmail = await prisma.user.findFirst({
      where: {
        email,
        NOT: {
          id,
        },
      },
    });

    if (duplicateEmail) {
      return NextResponse.json(
        {
          error: "Another user already uses this email.",
        },
        { status: 409 }
      );
    }

    if (password && password.length < 8) {
      return NextResponse.json(
        {
          error:
            "New password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const permissions = body.permissions || {};

    const passwordData = password
      ? {
          password: await bcrypt.hash(password, 12),
        }
      : {};

    const permissionData = {
      dashboardView: Boolean(permissions.dashboardView),

      expensesView: Boolean(permissions.expensesView),
      expensesAdd: Boolean(permissions.expensesAdd),
      expensesEdit: Boolean(permissions.expensesEdit),
      expensesDelete: Boolean(permissions.expensesDelete),

      eggsView: Boolean(permissions.eggsView),
      eggsAdd: Boolean(permissions.eggsAdd),
      eggsEdit: Boolean(permissions.eggsEdit),
      eggsDelete: Boolean(permissions.eggsDelete),

      feedsView: Boolean(permissions.feedsView),
      feedsAdd: Boolean(permissions.feedsAdd),
      feedsEdit: Boolean(permissions.feedsEdit),
      feedsDelete: Boolean(permissions.feedsDelete),

      poultryHealthView: Boolean(
        permissions.poultryHealthView
      ),
      poultryHealthAdd: Boolean(
        permissions.poultryHealthAdd
      ),
      poultryHealthEdit: Boolean(
        permissions.poultryHealthEdit
      ),
      poultryHealthDelete: Boolean(
        permissions.poultryHealthDelete
      ),

      // CHICKEN / DIGAAG
      chickenView: Boolean(permissions.chickenView),
      chickenAdd: Boolean(permissions.chickenAdd),
      chickenEdit: Boolean(permissions.chickenEdit),
      chickenDelete: Boolean(permissions.chickenDelete),

      documentsView: Boolean(permissions.documentsView),
      documentsAdd: Boolean(permissions.documentsAdd),
      documentsEdit: Boolean(permissions.documentsEdit),
      documentsDelete: Boolean(permissions.documentsDelete),
    };

    const user = await prisma.user.update({
      where: {
        id,
      },

      data: {
        name,
        email,
        ...passwordData,

        permissions: {
          upsert: {
            create: permissionData,
            update: permissionData,
          },
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        permissions: true,
      },
    });

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("USER UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error: "Worker could not be updated.",
      },
      { status: 500 }
    );
  }
}

// =========================================================
// DELETE WORKER
// OWNER / ADMIN ONLY
// =========================================================
export async function DELETE(
  _request: Request,
  context: RouteContext
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { error: "You are not logged in." },
        { status: 401 }
      );
    }

    if (!isOwner(currentUser)) {
      return NextResponse.json(
        { error: "You do not have permission to delete workers." },
        { status: 403 }
      );
    }

    const { id } = await context.params;

    if (id === currentUser.id) {
      return NextResponse.json(
        {
          error: "You cannot delete your own account.",
        },
        { status: 400 }
      );
    }

    const worker = await prisma.user.findUnique({
      where: {
        id,
      },
    });

    if (!worker) {
      return NextResponse.json(
        {
          error: "Worker was not found.",
        },
        { status: 404 }
      );
    }

    if (worker.role === "OWNER" || worker.role === "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Owner/administrator accounts cannot be deleted here.",
        },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("USER DELETE ERROR:", error);

    return NextResponse.json(
      {
        error: "Worker could not be deleted.",
      },
      { status: 500 }
    );
  }
}