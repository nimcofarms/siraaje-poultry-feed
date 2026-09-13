import {
  getCurrentUser,
  type CurrentUser,
} from "@/lib/auth";

/**
 * Soo qaada user-ka hadda login-ka ku jira.
 *
 * Audit trail-ka marna kama qaadanayo userId
 * xogta browser-ka/form-ka laga soo diray.
 *
 * User-ka waxaa laga xaqiijinayaa session-ka server-ka.
 */
export async function getAuditUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }

  return user;
}

/**
 * Waxaa la isticmaalaa marka record cusub la abuurayo.
 *
 * createdById = qofkii sameeyay record-ka
 * updatedById = isla qofkaas markii ugu horreysay
 */
export function createAuditData(user: CurrentUser) {
  return {
    createdById: user.id,
    updatedById: user.id,
  };
}

/**
 * Waxaa la isticmaalaa marka record hore wax laga beddelayo.
 *
 * createdById lama taabanayo.
 * updatedById oo keliya ayaa isu beddelaya qofka hadda wax beddelay.
 */
export function updateAuditData(user: CurrentUser) {
  return {
    updatedById: user.id,
  };
}

/**
 * Prisma include-kan waxaa isticmaali kara APIs-ka
 * si frontend-ku u helo qofkii xogta geliyay iyo
 * qofkii ugu dambeeyay wax ka beddelay.
 */
export const auditUserInclude = {
  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },

  updatedBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} as const;

/**
 * Helper loogu talagalay frontend/API response.
 *
 * createdAt iyo updatedAt waxaa hore u kaydiya Prisma.
 * createdBy iyo updatedBy-na relations-ka database-ka
 * ayaa laga soo qaadaa.
 */
export type AuditUserInfo = {
  id: string;
  name: string;
  role: string;
};

export type AuditInfo = {
  createdBy: AuditUserInfo | null;
  updatedBy: AuditUserInfo | null;
  createdAt: Date | string;
  updatedAt: Date | string;
};