import { prisma } from "@/lib/prisma";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

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

    chickenView: boolean;
    chickenAdd: boolean;
    chickenEdit: boolean;
    chickenDelete: boolean;

    documentsView: boolean;
    documentsAdd: boolean;
    documentsEdit: boolean;
    documentsDelete: boolean;
  } | null;
};

export type PermissionKey =
  | "dashboardView"
  | "expensesView"
  | "expensesAdd"
  | "expensesEdit"
  | "expensesDelete"
  | "eggsView"
  | "eggsAdd"
  | "eggsEdit"
  | "eggsDelete"
  | "feedsView"
  | "feedsAdd"
  | "feedsEdit"
  | "feedsDelete"
  | "poultryHealthView"
  | "poultryHealthAdd"
  | "poultryHealthEdit"
  | "poultryHealthDelete"
  | "chickenView"
  | "chickenAdd"
  | "chickenEdit"
  | "chickenDelete"
  | "documentsView"
  | "documentsAdd"
  | "documentsEdit"
  | "documentsDelete";

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

export function isOwner(user: CurrentUser | null): boolean {
  if (!user) {
    return false;
  }

  return user.role === "OWNER" || user.role === "ADMIN";
}

export function hasPermission(
  user: CurrentUser | null,
  permission: PermissionKey
): boolean {
  if (!user) {
    return false;
  }

  // OWNER and ADMIN always have full access.
  if (isOwner(user)) {
    return true;
  }

  // Workers without a permission record have no access.
  if (!user.permissions) {
    return false;
  }

  return user.permissions[permission] === true;
}