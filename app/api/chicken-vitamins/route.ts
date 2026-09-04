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

export async function GET() {
  try {
    const auth = await authorize("poultryHealthView");

    if (auth.response) {
      return auth.response;
    }

    const vitamins = await prisma.chickenVitamin.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(vitamins);
  } catch (error) {
    console.error("CHICKEN VITAMIN GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Xogta vitamin-ka lama soo qaadi karin. / Vitamin records could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorize("poultryHealthAdd");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const vitaminName = String(body.vitaminName || "").trim();
    const givenBy = String(body.givenBy || "").trim();
    const notes = String(body.notes || "").trim();
    const numberOfChickens = Number(body.numberOfChickens);

    if (!body.date || !vitaminName || !givenBy) {
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

    const vitamin = await prisma.chickenVitamin.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        vitaminName,
        givenBy,
        numberOfChickens,
        notes: notes || null,
      },
    });

    return NextResponse.json(vitamin, { status: 201 });
  } catch (error) {
    console.error("CHICKEN VITAMIN CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Vitamin-ka lama kaydin karin. / Vitamin record could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorize("poultryHealthEdit");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const id = String(body.id || "").trim();
    const vitaminName = String(body.vitaminName || "").trim();
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

    if (!body.date || !vitaminName || !givenBy) {
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

    const vitamin = await prisma.chickenVitamin.update({
      where: {
        id,
      },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        vitaminName,
        givenBy,
        numberOfChickens,
        notes: notes || null,
      },
    });

    return NextResponse.json(vitamin);
  } catch (error) {
    console.error("CHICKEN VITAMIN UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Vitamin-ka lama beddeli karin. / Vitamin record could not be updated.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorize("poultryHealthDelete");

    if (auth.response) {
      return auth.response;
    }

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

    await prisma.chickenVitamin.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("CHICKEN VITAMIN DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Vitamin-ka lama tirtiri karin. / Vitamin record could not be deleted.",
      },
      { status: 500 }
    );
  }
}