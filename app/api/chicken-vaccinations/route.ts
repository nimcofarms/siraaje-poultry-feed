import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ALLOWED_STAGES = [
  "Day 1",
  "Day 12-14",
  "Day 16-18",
  "Week 6-8",
  "Week 8-10",
  "Week 12-14",
  "Week 16-18",
];

export async function GET() {
  try {
    const vaccinations = await prisma.chickenVaccination.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(vaccinations);
  } catch (error) {
    console.error("CHICKEN VACCINATION GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta tallaalka lama soo qaadi karin. / Vaccination records could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const stage = String(body.stage || "").trim();
    const vaccineName = String(body.vaccineName || "").trim();
    const disease = String(body.disease || "").trim();
    const application = String(body.application || "").trim();
    const givenBy = String(body.givenBy || "").trim();
    const notes = String(body.notes || "").trim();
    const numberOfChickens = Number(body.numberOfChickens);

    if (
      !body.date ||
      !stage ||
      !vaccineName ||
      !disease ||
      !application ||
      !givenBy
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STAGES.includes(stage)) {
      return NextResponse.json(
        {
          error:
            "Marxaladda digaagga sax ma aha. / Chicken stage is not valid.",
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

    const vaccination = await prisma.chickenVaccination.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        stage,
        vaccineName,
        disease,
        application,
        givenBy,
        numberOfChickens,
        notes: notes || null,
      },
    });

    return NextResponse.json(vaccination, { status: 201 });
  } catch (error) {
    console.error("CHICKEN VACCINATION CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Tallaalka lama kaydin karin. / Vaccination record could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();

    const id = String(body.id || "").trim();
    const stage = String(body.stage || "").trim();
    const vaccineName = String(body.vaccineName || "").trim();
    const disease = String(body.disease || "").trim();
    const application = String(body.application || "").trim();
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

    if (
      !body.date ||
      !stage ||
      !vaccineName ||
      !disease ||
      !application ||
      !givenBy
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_STAGES.includes(stage)) {
      return NextResponse.json(
        {
          error:
            "Marxaladda digaagga sax ma aha. / Chicken stage is not valid.",
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

    const vaccination = await prisma.chickenVaccination.update({
      where: {
        id,
      },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        stage,
        vaccineName,
        disease,
        application,
        givenBy,
        numberOfChickens,
        notes: notes || null,
      },
    });

    return NextResponse.json(vaccination);
  } catch (error) {
    console.error("CHICKEN VACCINATION UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Tallaalka lama beddeli karin. / Vaccination record could not be updated.",
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

    await prisma.chickenVaccination.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("CHICKEN VACCINATION DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Tallaalka lama tirtiri karin. / Vaccination record could not be deleted.",
      },
      { status: 500 }
    );
  }
}