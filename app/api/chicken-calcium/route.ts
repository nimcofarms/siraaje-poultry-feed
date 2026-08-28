import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const calciumRecords = await prisma.chickenCalcium.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(calciumRecords);
  } catch (error) {
    console.error("CHICKEN CALCIUM GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta calcium-ka lama soo qaadi karin. / Calcium records could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const calciumName = String(body.calciumName || "").trim();
    const givenBy = String(body.givenBy || "").trim();
    const notes = String(body.notes || "").trim();
    const numberOfChickens = Number(body.numberOfChickens);

    if (!body.date || !calciumName || !givenBy) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(numberOfChickens) ||
      numberOfChickens <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tirada digaagga waa inay noqotaa tiro sax ah oo ka weyn 0. / Number of chickens must be a whole number greater than 0.",
        },
        { status: 400 }
      );
    }

    const calcium = await prisma.chickenCalcium.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        calciumName,
        givenBy,
        numberOfChickens,
        notes: notes || null,
      },
    });

    return NextResponse.json(calcium, { status: 201 });
  } catch (error) {
    console.error("CHICKEN CALCIUM CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Calcium-ka lama kaydin karin. / Calcium record could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "").trim();
    const calciumName = String(body.calciumName || "").trim();
    const givenBy = String(body.givenBy || "").trim();
    const notes = String(body.notes || "").trim();
    const numberOfChickens = Number(body.numberOfChickens);

    if (!id) {
      return NextResponse.json(
        {
          error: "ID-ga lama helin. / Record ID is missing.",
        },
        { status: 400 }
      );
    }

    if (!body.date || !calciumName || !givenBy) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(numberOfChickens) ||
      numberOfChickens <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tirada digaagga waa inay noqotaa tiro sax ah oo ka weyn 0. / Number of chickens must be a whole number greater than 0.",
        },
        { status: 400 }
      );
    }

    const calcium = await prisma.chickenCalcium.update({
      where: {
        id,
      },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        calciumName,
        givenBy,
        numberOfChickens,
        notes: notes || null,
      },
    });

    return NextResponse.json(calcium);
  } catch (error) {
    console.error("CHICKEN CALCIUM UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Calcium-ka lama beddeli karin. / Calcium record could not be updated.",
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

    await prisma.chickenCalcium.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("CHICKEN CALCIUM DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Calcium-ka lama tirtiri karin. / Calcium record could not be deleted.",
      },
      { status: 500 }
    );
  }
}
