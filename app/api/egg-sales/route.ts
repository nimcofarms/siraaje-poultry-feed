import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sales = await prisma.eggSale.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("EGG SALES GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ukumaha la iibiyay lama soo qaadi karin. / Egg sales could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const companyName = String(body.companyName || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!body.date || !companyName) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda iyo magaca macmiilka. / Please enter the date and customer/company name.",
        },
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
        {
          error:
            "Tirada iyo qiimaha si sax ah u geli. / Enter a valid quantity and price.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price;

    const sale = await prisma.eggSale.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        companyName,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("EGG SALES CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Iibka ukunta lama kaydin karin. / Egg sale could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "").trim();
    const companyName = String(body.companyName || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!id) {
      return NextResponse.json(
        {
          error: "ID-ga lama helin. / Record ID is missing.",
        },
        { status: 400 }
      );
    }

    if (!body.date || !companyName) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda iyo magaca macmiilka. / Please enter the date and customer/company name.",
        },
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
        {
          error:
            "Tirada iyo qiimaha si sax ah u geli. / Enter a valid quantity and price.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price;

    const sale = await prisma.eggSale.update({
      where: {
        id,
      },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        companyName,
        quantity,
        price,
        total,
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("EGG SALES UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Iibka ukunta lama beddeli karin. / Egg sale could not be updated.",
      },
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
        {
          error: "ID-ga lama helin. / Record ID is missing.",
        },
        { status: 400 }
      );
    }

    await prisma.eggSale.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("EGG SALES DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Iibka ukunta lama tirtiri karin. / Egg sale could not be deleted.",
      },
      { status: 500 }
    );
  }
}