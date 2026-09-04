import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

async function authorize(permission: PermissionKey) {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error: "Fadlan marka hore gal. / Please log in first.",
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

// SOO QAADO DHAMMAAN KHARASHAADKA
export async function GET() {
  try {
    const auth = await authorize("expensesView");

    if (auth.response) {
      return auth.response;
    }

    const expenses = await prisma.expense.findMany({
      orderBy: {
        date: "desc",
      },
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

// KAYDI KHARASH CUSUB
export async function POST(request: Request) {
  try {
    const auth = await authorize("expensesAdd");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    if (!body.name || !body.category || !body.date || !body.amount) {
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

    const expense = await prisma.expense.create({
      data: {
        category: body.category,
        name: body.name.trim(),

        description: body.description?.trim() || null,

        date: new Date(`${body.date}T12:00:00`),

        purchasePlace: body.purchasePlace?.trim() || null,

        quantity:
          body.quantity !== "" &&
          body.quantity !== null &&
          body.quantity !== undefined
            ? Number(body.quantity)
            : null,

        unit: body.unit?.trim() || null,

        unitPrice:
          body.unitPrice !== "" &&
          body.unitPrice !== null &&
          body.unitPrice !== undefined
            ? Number(body.unitPrice)
            : null,

        workers:
          body.workers !== "" &&
          body.workers !== null &&
          body.workers !== undefined
            ? Number(body.workers)
            : null,

        workDays:
          body.workDays !== "" &&
          body.workDays !== null &&
          body.workDays !== undefined
            ? Number(body.workDays)
            : null,

        laborCost:
          body.laborCost !== "" &&
          body.laborCost !== null &&
          body.laborCost !== undefined
            ? Number(body.laborCost)
            : null,

        amount,

        currency: body.currency || "ETB",

        paymentMethod: body.paymentMethod?.trim() || null,

        supplier: body.supplier?.trim() || null,

        receiptNumber: body.receiptNumber?.trim() || null,

        notes: body.notes?.trim() || null,
      },
    });

    return NextResponse.json(expense, {
      status: 201,
    });
  } catch (error) {
    console.error("EXPENSE CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashka lama kaydin. Fadlan mar kale isku day. / Expense could not be saved. Please try again.",
      },
      { status: 500 }
    );
  }
}