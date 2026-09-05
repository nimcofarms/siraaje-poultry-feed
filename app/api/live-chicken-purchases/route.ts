import {
    getCurrentUser,
    hasPermission,
    type PermissionKey,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

async function authorize(permission: PermissionKey) {
  const user = await getCurrentUser();

  if (!user) {
    return {
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
    response: null,
  };
}

// ======================================================
// GET - View live chicken purchases
// Permission: chickenView
// ======================================================

export async function GET() {
  try {
    const auth = await authorize("chickenView");

    if (auth.response) {
      return auth.response;
    }

    const purchases = await prisma.liveChickenPurchase.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("GET LIVE CHICKEN PURCHASES ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not load live chicken purchases.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST - Add live chicken purchase
// Permission: chickenAdd
// ======================================================

export async function POST(request: Request) {
  try {
    const auth = await authorize("chickenAdd");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const date = String(body.date || "").trim();
    const chickenType = String(body.chickenType || "").trim();
    const location = String(body.location || "").trim();
    const ageUnit = String(body.ageUnit || "").trim();

    const ageNumber = Number(body.ageNumber);
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (
      !date ||
      !chickenType ||
      !location ||
      !ageUnit ||
      !Number.isInteger(ageNumber) ||
      ageNumber < 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta si sax ah. / Please enter all required information correctly.",
        },
        { status: 400 }
      );
    }

    const allowedAgeUnits = ["DAY", "WEEK", "MONTH"];

    const normalizedAgeUnit = ageUnit.toUpperCase();

    if (!allowedAgeUnits.includes(normalizedAgeUnit)) {
      return NextResponse.json(
        {
          error:
            "Da'da waa inay noqotaa Day, Week ama Month. / Age unit must be Day, Week or Month.",
        },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          error: "Taariikhda sax ma aha. / Invalid date.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price;

    const purchase = await prisma.liveChickenPurchase.create({
      data: {
        date: parsedDate,
        chickenType,
        location,
        ageNumber,
        ageUnit: normalizedAgeUnit,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("POST LIVE CHICKEN PURCHASE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not create live chicken purchase.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT - Edit live chicken purchase
// Permission: chickenEdit
// ======================================================

export async function PUT(request: Request) {
  try {
    const auth = await authorize("chickenEdit");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const id = String(body.id || "").trim();
    const date = String(body.date || "").trim();
    const chickenType = String(body.chickenType || "").trim();
    const location = String(body.location || "").trim();
    const ageUnit = String(body.ageUnit || "").trim();

    const ageNumber = Number(body.ageNumber);
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (
      !id ||
      !date ||
      !chickenType ||
      !location ||
      !ageUnit ||
      !Number.isInteger(ageNumber) ||
      ageNumber < 0 ||
      !Number.isInteger(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta si sax ah. / Please enter all required information correctly.",
        },
        { status: 400 }
      );
    }

    const allowedAgeUnits = ["DAY", "WEEK", "MONTH"];

    const normalizedAgeUnit = ageUnit.toUpperCase();

    if (!allowedAgeUnits.includes(normalizedAgeUnit)) {
      return NextResponse.json(
        {
          error:
            "Da'da waa inay noqotaa Day, Week ama Month. / Age unit must be Day, Week or Month.",
        },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          error: "Taariikhda sax ma aha. / Invalid date.",
        },
        { status: 400 }
      );
    }

    const existingPurchase =
      await prisma.liveChickenPurchase.findUnique({
        where: {
          id,
        },
      });

    if (!existingPurchase) {
      return NextResponse.json(
        {
          error:
            "Xogta lama helin. / Live chicken purchase was not found.",
        },
        { status: 404 }
      );
    }

    const total = quantity * price;

    const updatedPurchase =
      await prisma.liveChickenPurchase.update({
        where: {
          id,
        },
        data: {
          date: parsedDate,
          chickenType,
          location,
          ageNumber,
          ageUnit: normalizedAgeUnit,
          quantity,
          price,
          total,
        },
      });

    return NextResponse.json(updatedPurchase);
  } catch (error) {
    console.error("PUT LIVE CHICKEN PURCHASE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not update live chicken purchase.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE - Delete live chicken purchase
// Permission: chickenDelete
// ======================================================

export async function DELETE(request: Request) {
  try {
    const auth = await authorize("chickenDelete");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const id = String(body.id || "").trim();

    if (!id) {
      return NextResponse.json(
        {
          error: "ID-ga waa loo baahan yahay. / ID is required.",
        },
        { status: 400 }
      );
    }

    const existingPurchase =
      await prisma.liveChickenPurchase.findUnique({
        where: {
          id,
        },
      });

    if (!existingPurchase) {
      return NextResponse.json(
        {
          error:
            "Xogta lama helin. / Live chicken purchase was not found.",
        },
        { status: 404 }
      );
    }

    await prisma.liveChickenPurchase.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Xogta waa la tirtiray. / Live chicken purchase deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE LIVE CHICKEN PURCHASE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not delete live chicken purchase.",
      },
      { status: 500 }
    );
  }
}