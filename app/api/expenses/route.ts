import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// SOO QAADO DHAMMAAN KHARASHAADKA
export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("EXPENSE GET ERROR:", error);

    return NextResponse.json(
      { error: "Kharashaadka lama soo qaadi karin." },
      { status: 500 }
    );
  }
}

// KAYDI KHARASH CUSUB
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.category || !body.date || !body.amount) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi magaca, nooca, taariikhda iyo wadarta lacagta.",
        },
        { status: 400 }
      );
    }

    const amount = Number(body.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json(
        {
          error: "Wadarta lacagtu waa inay ka weyn tahay 0.",
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
        error: "Kharashka lama kaydin. Fadlan mar kale isku day.",
      },
      { status: 500 }
    );
  }
}