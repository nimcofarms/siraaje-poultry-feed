import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const expenses = await prisma.constructionExpense.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("CONSTRUCTION EXPENSE GET ERROR:", error);

    return NextResponse.json(
      { error: "Kharashaadka dhismaha lama soo qaadi karin." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const type = String(body.type || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!body.date || !name || !type) {
      return NextResponse.json(
        { error: "Fadlan buuxi taariikhda, magaca iyo nooca." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        { error: "Tirada iyo qiimaha si sax ah u geli." },
        { status: 400 }
      );
    }

    const total = quantity * price;

    const expense = await prisma.constructionExpense.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        name,
        type,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("CONSTRUCTION EXPENSE CREATE ERROR:", error);

    return NextResponse.json(
      { error: "Kharashka dhismaha lama kaydin." },
      { status: 500 }
    );
  }
}