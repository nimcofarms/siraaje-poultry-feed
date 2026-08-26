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
    console.error("PRODUCT EXPENSE CREATE ERROR:", error);

    return NextResponse.json(
      { error: "Kharashka productiga lama kaydin." },
      { status: 500 }
    );
  }
}