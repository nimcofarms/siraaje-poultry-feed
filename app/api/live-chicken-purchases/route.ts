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
          error:
            "Fadlan marka hore gal. / Please log in first.",
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
   VIEW LIVE CHICKEN PURCHASES

   Permission: chickenView
========================================================= */

export async function GET() {
  try {
    const auth = await authorize("chickenView");

    if (auth.response) {
      return auth.response;
    }

    const purchases =
      await prisma.liveChickenPurchase.findMany({
        /*
         * Waxaa response-ka lagu darayaa:
         *
         * createdBy
         * updatedBy
         *
         * createdAt iyo updatedAt-na model-ka
         * ayay hore ugu jiraan.
         */
        include: auditUserInclude,

        orderBy: [
          {
            date: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

    return NextResponse.json(purchases);
  } catch (error) {
    console.error(
      "GET LIVE CHICKEN PURCHASES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not load live chicken purchases.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   ADD LIVE CHICKEN PURCHASE

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
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const date = String(
      body.date || ""
    ).trim();

    const chickenType = String(
      body.chickenType || ""
    ).trim();

    const location = String(
      body.location || ""
    ).trim();

    const ageUnit = String(
      body.ageUnit || ""
    ).trim();

    const ageNumber = Number(body.ageNumber);
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

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

    /* =====================================================
       AGE UNIT VALIDATION
    ===================================================== */

    const allowedAgeUnits = [
      "DAY",
      "WEEK",
      "MONTH",
    ];

    const normalizedAgeUnit =
      ageUnit.toUpperCase();

    if (
      !allowedAgeUnits.includes(
        normalizedAgeUnit
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Da'da waa inay noqotaa Day, Week ama Month. / Age unit must be Day, Week or Month.",
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
          error:
            "Taariikhda sax ma aha. / Invalid date.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price;

    /* =====================================================
       CREATE LIVE CHICKEN PURCHASE
    ===================================================== */

    const purchase =
      await prisma.liveChickenPurchase.create({
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

          /*
           * AUDIT TRAIL
           *
           * createdById:
           * account-ka digaagga soo iibsaday
           * xogtiisa geliyay.
           *
           * updatedById:
           * marka record-ka la sameeyo wuxuu
           * noqonayaa isla user-kaas.
           *
           * ID-yadan browser-ka lagama qaadanayo.
           * Session-ka server-ka ayaa laga qaadayaa.
           */
          ...createAuditData(auth.user),
        },

        include: auditUserInclude,
      });

    return NextResponse.json(
      purchase,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST LIVE CHICKEN PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not create live chicken purchase.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   EDIT LIVE CHICKEN PURCHASE

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
          error:
            "Fadlan marka hore gal. / Please log in first.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const id = String(
      body.id || ""
    ).trim();

    const date = String(
      body.date || ""
    ).trim();

    const chickenType = String(
      body.chickenType || ""
    ).trim();

    const location = String(
      body.location || ""
    ).trim();

    const ageUnit = String(
      body.ageUnit || ""
    ).trim();

    const ageNumber = Number(body.ageNumber);
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

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

    /* =====================================================
       AGE UNIT VALIDATION
    ===================================================== */

    const allowedAgeUnits = [
      "DAY",
      "WEEK",
      "MONTH",
    ];

    const normalizedAgeUnit =
      ageUnit.toUpperCase();

    if (
      !allowedAgeUnits.includes(
        normalizedAgeUnit
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Da'da waa inay noqotaa Day, Week ama Month. / Age unit must be Day, Week or Month.",
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
          error:
            "Taariikhda sax ma aha. / Invalid date.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK RECORD EXISTS
    ===================================================== */

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

    /* =====================================================
       UPDATE LIVE CHICKEN PURCHASE
    ===================================================== */

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

          /*
           * createdById lama taabanayo.
           *
           * updatedById waxaa loo beddelayaa
           * account-ka hadda record-ka wax ka
           * beddelay.
           */
          ...updateAuditData(auth.user),
        },

        include: auditUserInclude,
      });

    return NextResponse.json(
      updatedPurchase
    );
  } catch (error) {
    console.error(
      "PUT LIVE CHICKEN PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not update live chicken purchase.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   DELETE LIVE CHICKEN PURCHASE

   Permission: chickenDelete
========================================================= */

export async function DELETE(request: Request) {
  try {
    const auth = await authorize(
      "chickenDelete"
    );

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const id = String(
      body.id || ""
    ).trim();

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID-ga waa loo baahan yahay. / ID is required.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       CHECK RECORD EXISTS
    ===================================================== */

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

    /* =====================================================
       DELETE RECORD
    ===================================================== */

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
    console.error(
      "DELETE LIVE CHICKEN PURCHASE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not delete live chicken purchase.",
      },
      { status: 500 }
    );
  }
}