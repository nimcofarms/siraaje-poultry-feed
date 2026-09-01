import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { prisma } from "@/lib/prisma";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: {
    dashboardView: boolean;

    expensesView: boolean;
    expensesAdd: boolean;
    expensesEdit: boolean;
    expensesDelete: boolean;

    eggsView: boolean;
    eggsAdd: boolean;
    eggsEdit: boolean;
    eggsDelete: boolean;

    feedsView: boolean;
    feedsAdd: boolean;
    feedsEdit: boolean;
    feedsDelete: boolean;

    poultryHealthView: boolean;
    poultryHealthAdd: boolean;
    poultryHealthEdit: boolean;
    poultryHealthDelete: boolean;

    documentsView: boolean;
    documentsAdd: boolean;
    documentsEdit: boolean;
    documentsDelete: boolean;
  } | null;
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("siraaje_session")?.value;

    if (!token) {
      return null;
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("JWT_SECRET is missing.");
      return null;
    }

    const secret = new TextEncoder().encode(jwtSecret);

    const { payload } = await jwtVerify(token, secret);

    if (!payload.userId || typeof payload.userId !== "string") {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },
      include: {
        permissions: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
    };
  } catch (error) {
    console.error("AUTH ERROR:", error);
    return null;
  }
}

export function isOwner(user: CurrentUser | null) {
  if (!user) {
    return false;
  }

  return user.role === "OWNER" || user.role === "ADMIN";
}