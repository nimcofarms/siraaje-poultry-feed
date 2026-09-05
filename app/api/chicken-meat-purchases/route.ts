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
// GET - View chicken meat purchases
// Permission: chickenView
// ======================================================

export async function GET() {
  try {
    const auth = await authorize("chickenView");

    if (auth.response) {
      return auth.response;
    }

    const purchases = await prisma.chickenMeatPurchase.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error("GET CHICKEN MEAT PURCHASES ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not load chicken meat purchases.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST - Add chicken meat purchase
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
    const location = String(body.location || "").trim();
    const companyName = String(body.companyName || "").trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (
      !date ||
      !location ||
      !companyName ||
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

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          error: "Taariikhda sax ma aha. / Invalid date.",
        },
        { status: 400 }
      );
    }

    // Total is calculated by the server.
    const total = quantity * price;

    const purchase = await prisma.chickenMeatPurchase.create({
      data: {
        date: parsedDate,
        location,
        companyName,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(purchase, { status: 201 });
  } catch (error) {
    console.error("POST CHICKEN MEAT PURCHASE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not create chicken meat purchase.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT - Edit chicken meat purchase
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
    const location = String(body.location || "").trim();
    const companyName = String(body.companyName || "").trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (
      !id ||
      !date ||
      !location ||
      !companyName ||
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
      await prisma.chickenMeatPurchase.findUnique({
        where: {
          id,
        },
      });

    if (!existingPurchase) {
      return NextResponse.json(
        {
          error:
            "Xogta lama helin. / Chicken meat purchase was not found.",
        },
        { status: 404 }
      );
    }

    // Recalculate total when the record is edited.
    const total = quantity * price;

    const updatedPurchase =
      await prisma.chickenMeatPurchase.update({
        where: {
          id,
        },
        data: {
          date: parsedDate,
          location,
          companyName,
          quantity,
          price,
          total,
        },
      });

    return NextResponse.json(updatedPurchase);
  } catch (error) {
    console.error("PUT CHICKEN MEAT PURCHASE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not update chicken meat purchase.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE - Delete chicken meat purchase
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
      await prisma.chickenMeatPurchase.findUnique({
        where: {
          id,
        },
      });

    if (!existingPurchase) {
      return NextResponse.json(
        {
          error:
            "Xogta lama helin. / Chicken meat purchase was not found.",
        },
        { status: 404 }
      );
    }

    await prisma.chickenMeatPurchase.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
      message:
        "Xogta waa la tirtiray. / Chicken meat purchase deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE CHICKEN MEAT PURCHASE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not delete chicken meat purchase.",
      },
      { status: 500 }
    );
  }
}