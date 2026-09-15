import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

import {
  auditUserInclude,
  createAuditData,
  updateAuditData,
} from "@/lib/audit";

import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/* =========================================================
   AUTHORIZE
========================================================= */

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

/* =========================================================
   GET
   VIEW CHICKEN MEAT PURCHASES

   Permission: chickenView
========================================================= */

export async function GET() {
  try {
    const auth = await authorize("chickenView");

    if (auth.response) {
      return auth.response;
    }

    const purchases = await prisma.chickenMeatPurchase.findMany({
      include: auditUserInclude,
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
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

/* =========================================================
   POST
   ADD CHICKEN MEAT PURCHASE

   Permission: chickenAdd
========================================================= */

export async function POST(request: Request) {
  try {
    const auth = await authorize("chickenAdd");

    if (auth.response) {
      return auth.response;
    }

    if (!auth.user) {
      return NextResponse.json(
        {
          error: "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const date = String(body.date || "").trim();
    const location = String(body.location || "").trim();
    const companyName = String(body.companyName || "").trim();
    const purchasedBy = String(body.purchasedBy || "").trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);
    const meatWeightKg = Number(body.meatWeightKg);
    const pricePerKg = Number(body.pricePerKg);

    /* =====================================================
       BASIC VALIDATION

       quantity = general purchase quantity.
       price = general purchase price.
       meatWeightKg = meat weight in kilograms.
       pricePerKg = ETB per kilogram.
    ===================================================== */

    if (
      !date ||
      !location ||
      !companyName ||
      !purchasedBy ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(meatWeightKg) ||
      meatWeightKg <= 0 ||
      !Number.isFinite(pricePerKg) ||
      pricePerKg < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta si sax ah. / Please enter all required information correctly.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       DATE VALIDATION
    ===================================================== */

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          error: "Taariikhda sax ma aha. / Invalid date.",
        },
        { status: 400 }
      );
    }

    // Final total is based on meat weight × price per kg.
    const total = meatWeightKg * pricePerKg;

    /* =====================================================
       CREATE CHICKEN MEAT PURCHASE
    ===================================================== */

    const purchase = await prisma.chickenMeatPurchase.create({
      data: {
        date: parsedDate,
        location,
        companyName,
        purchasedBy,
        quantity,
        price,
        meatWeightKg,
        pricePerKg,
        total,
        currency: "ETB",

        /*
         * AUDIT TRAIL
         *
         * purchasedBy = person who physically handled/made
         * the meat purchase for Siraaje Poultry Feed.
         *
         * createdById = logged-in account that entered
         * this record into the system.
         */
        ...createAuditData(auth.user),
      },

      include: auditUserInclude,
    });

    return NextResponse.json(purchase, {
      status: 201,
    });
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

/* =========================================================
   PUT
   EDIT CHICKEN MEAT PURCHASE

   Permission: chickenEdit
========================================================= */

export async function PUT(request: Request) {
  try {
    const auth = await authorize("chickenEdit");

    if (auth.response) {
      return auth.response;
    }

    if (!auth.user) {
      return NextResponse.json(
        {
          error: "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(body.id || "").trim();
    const date = String(body.date || "").trim();
    const location = String(body.location || "").trim();
    const companyName = String(body.companyName || "").trim();
    const purchasedBy = String(body.purchasedBy || "").trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);
    const meatWeightKg = Number(body.meatWeightKg);
    const pricePerKg = Number(body.pricePerKg);

    /* =====================================================
       BASIC VALIDATION

       quantity = general purchase quantity.
       price = general purchase price.
       meatWeightKg = meat weight in kilograms.
       pricePerKg = ETB per kilogram.
    ===================================================== */

    if (
      !id ||
      !date ||
      !location ||
      !companyName ||
      !purchasedBy ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(meatWeightKg) ||
      meatWeightKg <= 0 ||
      !Number.isFinite(pricePerKg) ||
      pricePerKg < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi dhammaan xogta si sax ah. / Please enter all required information correctly.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       DATE VALIDATION
    ===================================================== */

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        {
          error: "Taariikhda sax ma aha. / Invalid date.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK RECORD EXISTS
    ===================================================== */

    const existingPurchase = await prisma.chickenMeatPurchase.findUnique({
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

    // Recalculate final total using meat weight × price per kg.
    const total = meatWeightKg * pricePerKg;

    /* =====================================================
       UPDATE CHICKEN MEAT PURCHASE
    ===================================================== */

    const updatedPurchase = await prisma.chickenMeatPurchase.update({
      where: {
        id,
      },

      data: {
        date: parsedDate,
        location,
        companyName,
        purchasedBy,
        quantity,
        price,
        meatWeightKg,
        pricePerKg,
        total,

        /*
         * createdById remains unchanged.
         * updatedById becomes the account editing the record.
         */
        ...updateAuditData(auth.user),
      },

      include: auditUserInclude,
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

/* =========================================================
   DELETE
   DELETE CHICKEN MEAT PURCHASE

   Permission: chickenDelete
========================================================= */

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

    /* =====================================================
       CHECK RECORD EXISTS
    ===================================================== */

    const existingPurchase = await prisma.chickenMeatPurchase.findUnique({
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

    /* =====================================================
       DELETE
    ===================================================== */

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
