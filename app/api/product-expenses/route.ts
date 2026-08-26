import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const allowedProducts = [
  "Gallay",
  "Soyabean",
  "Corn Maize",
  "White Sunflower",
  "Black Sunflower",
  "Premix",
  "Lafaha Malayga",
  "Dhagaxaanta Nuurada",
];

function validateProduct(body: any) {
  const name = String(body.name || "").trim();
  const type = String(body.type || "").trim();
  const quantity = Number(body.quantity);
  const price = Number(body.price);

  const transport =
    body.transport === "" ||
    body.transport === null ||
    body.transport === undefined
      ? 0
      : Number(body.transport);

  return {
    name,
    type,
    quantity,
    price,
    transport,
  };
}

export async function GET() {
  try {
    const expenses = await prisma.productExpense.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("PRODUCT EXPENSE GET ERROR:", error);

    return NextResponse.json(
      { error: "Kharashaadka productiga lama soo qaadi karin." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { name, type, quantity, price, transport } =
      validateProduct(body);

    if (!body.date || !name || !type) {
      return NextResponse.json(
        { error: "Fadlan buuxi taariikhda, magaca iyo nooca." },
        { status: 400 }
      );
    }

    if (!allowedProducts.includes(name)) {
      return NextResponse.json(
        { error: "Product-ka aad dooratay lama oggola." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(transport) ||
      transport < 0
    ) {
      return NextResponse.json(
        { error: "Quantity, price ama transport si sax ah u geli." },
        { status: 400 }
      );
    }

    const total = quantity * price + transport;

    const expense = await prisma.productExpense.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        name,
        type,
        quantity,
        price,
        transport,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("PRODUCT CREATE ERROR:", error);

    return NextResponse.json(
      { error: "Kharashka productiga lama kaydin." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "");

    const { name, type, quantity, price, transport } =
      validateProduct(body);

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

    if (!allowedProducts.includes(name)) {
      return NextResponse.json(
        { error: "Product-ka aad dooratay lama oggola." },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(transport) ||
      transport < 0
    ) {
      return NextResponse.json(
        { error: "Quantity, price ama transport si sax ah u geli." },
        { status: 400 }
      );
    }

    const total = quantity * price + transport;

    const expense = await prisma.productExpense.update({
      where: { id },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        name,
        type,
        quantity,
        price,
        transport,
        total,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("PRODUCT UPDATE ERROR:", error);

    return NextResponse.json(
      { error: "Kharashka productiga lama beddeli karin." },
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

    await prisma.productExpense.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Kharashka productiga lama tirtiri karin." },
      { status: 500 }
    );
  }
}