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
    console.error("CONSTRUCTION CREATE ERROR:", error);

    return NextResponse.json(
      { error: "Kharashka dhismaha lama kaydin." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "");
    const name = String(body.name || "").trim();
    const type = String(body.type || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!id) {
      return NextResponse.json(
        { error: "ID-ga kharashka lama helin." },
        { status: 400 }
      );
    }

    if (!body.date || !name || !type) {
      return NextResponse.json(
        { error: "Fadlan buuxi dhammaan xogta muhiimka ah." },
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

    const expense = await prisma.constructionExpense.update({
      where: { id },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        name,
        type,
        quantity,
        price,
        total,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("CONSTRUCTION UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Kharashka dhismaha lama beddeli karin." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID-ga kharashka lama helin." },
        { status: 400 }
      );
    }

    await prisma.constructionExpense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("CONSTRUCTION DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Kharashka dhismaha lama tirtiri karin." },
      { status: 500 }
    );
  }
}