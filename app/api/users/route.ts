import { getCurrentUser, isOwner } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// =========================================================
// GET ALL USERS / WORKERS
// OWNER / ADMIN ONLY
// =========================================================
export async function GET() {
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
        { error: "You do not have permission to manage workers." },
        { status: 403 }
      );
    }

    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
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

    return NextResponse.json(users);
  } catch (error) {
    console.error("USERS GET ERROR:", error);

    return NextResponse.json(
      { error: "Workers could not be loaded." },
      { status: 500 }
    );
  }
}

// =========================================================
// CREATE WORKER
// OWNER / ADMIN ONLY
// =========================================================
export async function POST(request: Request) {
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
        { error: "You do not have permission to create workers." },
        { status: 403 }
      );
    }

    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      return NextResponse.json(
        {
          error: "Name, email and password are required.",
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        {
          error: "Password must contain at least 8 characters.",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          error: "A user with this email already exists.",
        },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const permissions = body.permissions || {};

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "WORKER",

        permissions: {
          create: {
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
          },
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        permissions: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        user,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("USER CREATE ERROR:", error);

    return NextResponse.json(
      {
        error: "Worker could not be created.",
      },
      { status: 500 }
    );
  }
}