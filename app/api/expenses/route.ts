import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

import {
  auditUserInclude,
  createAuditData,
} from "@/lib/audit";

export const runtime = "nodejs";

/* =========================================================
   AUTHORIZE
========================================================= */

async function authorize(permission: PermissionKey) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      ),
    };
  }

  if (!hasPermission(user, permission)) {
    return {
      user,
      response: NextResponse.json(
        {
          error:
            "Ma lihid oggolaanshaha hawshan. / You do not have permission to perform this action.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

/* =========================================================
   GET
   SOO QAADO DHAMMAAN KHARASHAADKA
========================================================= */

export async function GET() {
  try {
    const auth = await authorize("expensesView");

    if (auth.response) {
      return auth.response;
    }

    const expenses = await prisma.expense.findMany({
      include: auditUserInclude,

      orderBy: [
        {
          date: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("EXPENSE GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashaadka lama soo qaadi karin. / Expenses could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   KAYDI KHARASH CUSUB
========================================================= */

export async function POST(request: Request) {
  try {
    const auth = await authorize("expensesAdd");

    if (auth.response) {
      return auth.response;
    }

    if (!auth.user) {
      return NextResponse.json(
        {
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (
      !body.name ||
      !body.category ||
      !body.date ||
      body.amount === "" ||
      body.amount === null ||
      body.amount === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi magaca, nooca, taariikhda iyo wadarta lacagta. / Please complete the name, category, date and total amount.",
        },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error:
            "Wadarta lacagtu waa inay ka weyn tahay 0. / Total amount must be greater than 0.",
        },
        { status: 400 }
      );
    }

    const quantity =
      body.quantity !== "" &&
      body.quantity !== null &&
      body.quantity !== undefined
        ? Number(body.quantity)
        : null;

    const unitPrice =
      body.unitPrice !== "" &&
      body.unitPrice !== null &&
      body.unitPrice !== undefined
        ? Number(body.unitPrice)
        : null;

    const workers =
      body.workers !== "" &&
      body.workers !== null &&
      body.workers !== undefined
        ? Number(body.workers)
        : null;

    const workDays =
      body.workDays !== "" &&
      body.workDays !== null &&
      body.workDays !== undefined
        ? Number(body.workDays)
        : null;

    const laborCost =
      body.laborCost !== "" &&
      body.laborCost !== null &&
      body.laborCost !== undefined
        ? Number(body.laborCost)
        : null;

    /* =====================================================
       OPTIONAL NUMBER VALIDATION
    ===================================================== */

    if (
      quantity !== null &&
      !Number.isFinite(quantity)
    ) {
      return NextResponse.json(
        {
          error:
            "Tirada sax ma aha. / Quantity is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      unitPrice !== null &&
      !Number.isFinite(unitPrice)
    ) {
      return NextResponse.json(
        {
          error:
            "Qiimaha halkii sax ma aha. / Unit price is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      workers !== null &&
      (!Number.isInteger(workers) || workers < 0)
    ) {
      return NextResponse.json(
        {
          error:
            "Tirada shaqaalaha sax ma aha. / Number of workers is invalid.",
        },
        { status: 400 }
      );
    }

    if (
      workDays !== null &&
      !Number.isFinite(workDays)
    ) {
      return NextResponse.json(
        {
          error:
            "Maalmaha shaqada sax ma aha. / Work days are invalid.",
        },
        { status: 400 }
      );
    }

    if (
      laborCost !== null &&
      !Number.isFinite(laborCost)
    ) {
      return NextResponse.json(
        {
          error:
            "Kharashka shaqaalaha sax ma aha. / Labor cost is invalid.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CREATE EXPENSE
    ===================================================== */

    const expense = await prisma.expense.create({
      data: {
        category: String(body.category).trim(),

        name: String(body.name).trim(),

        description:
          body.description?.trim() || null,

        date: new Date(
          `${body.date}T12:00:00`
        ),

        purchasePlace:
          body.purchasePlace?.trim() || null,

        quantity,

        unit:
          body.unit?.trim() || null,

        unitPrice,

        workers,

        workDays,

        laborCost,

        amount,

        currency:
          String(body.currency || "ETB")
            .trim()
            .toUpperCase() || "ETB",

        paymentMethod:
          body.paymentMethod?.trim() || null,

        supplier:
          body.supplier?.trim() || null,

        receiptNumber:
          body.receiptNumber?.trim() || null,

        notes:
          body.notes?.trim() || null,

        /*
         * AUDIT TRAIL
         *
         * createdById iyo updatedById waxaa
         * laga qaadayaa user-ka login-ka ku jira.
         *
         * Browser-ku ma dooran karo qofka
         * xogta geliyay.
         */
        ...createAuditData(auth.user),
      },

      /*
       * Response-ka isla markiiba waxaa
       * ku jira createdBy iyo updatedBy.
       */
      include: auditUserInclude,
    });

    return NextResponse.json(
      expense,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "EXPENSE CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Kharashka lama kaydin. Fadlan mar kale isku day. / Expense could not be saved. Please try again.",
      },
      { status: 500 }
    );
  }
}