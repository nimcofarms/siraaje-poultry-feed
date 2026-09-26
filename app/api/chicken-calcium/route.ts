import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

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

export const runtime = "nodejs";

/* =========================================================
   FINANCIAL HELPERS
========================================================= */

function parseOptionalPositiveNumber(value: unknown) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (!Number.isFinite(number) || number <= 0) {
    return null;
  }

  return number;
}

function getFinancialData(body: Record<string, unknown>) {
  const hasAnyFinancialValue =
    (body.quantity !== undefined &&
      body.quantity !== null &&
      body.quantity !== "") ||
    (body.price !== undefined &&
      body.price !== null &&
      body.price !== "") ||
    (body.unit !== undefined &&
      body.unit !== null &&
      String(body.unit).trim() !== "");

  /*
   * Financial information is optional.
   *
   * Old/non-financial health records remain valid.
   * If financial information is entered, Quantity,
   * Unit and Unit Price must all be supplied.
   */
  if (!hasAnyFinancialValue) {
    return {
      success: true as const,
      data: {
        quantity: null,
        unit: null,
        price: null,
        total: null,
        currency: "ETB",
      },
    };
  }

  const quantity =
    parseOptionalPositiveNumber(body.quantity);

  const price =
    parseOptionalPositiveNumber(body.price);

  const unit = String(
    body.unit || ""
  ).trim();

  const currency =
    String(body.currency || "ETB")
      .trim()
      .toUpperCase() || "ETB";

  if (
    quantity === null ||
    price === null ||
    !unit
  ) {
    return {
      success: false as const,
      response: NextResponse.json(
        {
          error:
            "Marka xogta lacagta la gelinayo, Quantity, Unit iyo Unit Price dhammaantood waa loo baahan yahay. / When financial information is entered, Quantity, Unit and Unit Price are all required.",
        },
        { status: 400 }
      ),
    };
  }

  /*
   * The server calculates the total.
   * body.total from the browser is not trusted.
   */
  const total =
    Math.round(quantity * price * 100) / 100;

  return {
    success: true as const,
    data: {
      quantity,
      unit,
      price,
      total,
      currency,
    },
  };
}

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
   SOO QAADO DHAMMAAN CALCIUM RECORDS

   Permission: poultryHealthView
========================================================= */

export async function GET() {
  try {
    const auth = await authorize(
      "poultryHealthView"
    );

    if (auth.response) {
      return auth.response;
    }

    const calciumRecords =
      await prisma.chickenCalcium.findMany({
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

    return NextResponse.json(calciumRecords);
  } catch (error) {
    console.error(
      "CHICKEN CALCIUM GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Xogta calcium-ka lama soo qaadi karin. / Calcium records could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   KAYDI CALCIUM CUSUB

   Permission: poultryHealthAdd
========================================================= */

export async function POST(request: Request) {
  try {
    const auth = await authorize(
      "poultryHealthAdd"
    );

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

    const calciumName = String(
      body.calciumName || ""
    ).trim();

    const givenBy = String(
      body.givenBy || ""
    ).trim();

    const notes = String(
      body.notes || ""
    ).trim();

    const numberOfChickens = Number(
      body.numberOfChickens
    );

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      !body.date ||
      !calciumName ||
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

    /* =====================================================
       NUMBER OF CHICKENS VALIDATION
    ===================================================== */

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

    /* =====================================================
       FINANCIAL VALIDATION
    ===================================================== */

    const financial = getFinancialData(body);

    if (!financial.success) {
      return financial.response;
    }

    /* =====================================================
       CREATE CALCIUM RECORD
    ===================================================== */

    const calcium =
      await prisma.chickenCalcium.create({
        data: {
          date: new Date(
            `${body.date}T12:00:00`
          ),

          calciumName,

          givenBy,

          numberOfChickens,

          notes: notes || null,

          /*
           * FINANCIAL INFORMATION
           *
           * quantity = quantity purchased/used
           * unit     = bottle, litre, ml, pack, etc.
           * price    = price per unit
           * total    = quantity × price
           */
          quantity: financial.data.quantity,

          unit: financial.data.unit,

          price: financial.data.price,

          total: financial.data.total,

          currency: financial.data.currency,

          /*
           * AUDIT TRAIL
           *
           * givenBy = qofka calcium-ka bixiyay.
           * createdBy = qofka website-ka xogta geliyay.
           */
          ...createAuditData(auth.user),
        },

        include: auditUserInclude,
      });

    return NextResponse.json(
      calcium,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CHICKEN CALCIUM CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Calcium-ka lama kaydin karin. / Calcium record could not be saved.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   BEDEL XOGTA CALCIUM-KA

   Permission: poultryHealthEdit
========================================================= */

export async function PUT(request: Request) {
  try {
    const auth = await authorize(
      "poultryHealthEdit"
    );

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

    const calciumName = String(
      body.calciumName || ""
    ).trim();

    const givenBy = String(
      body.givenBy || ""
    ).trim();

    const notes = String(
      body.notes || ""
    ).trim();

    const numberOfChickens = Number(
      body.numberOfChickens
    );

    /* =====================================================
       ID VALIDATION
    ===================================================== */

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID-ga lama helin. / Record ID is missing.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      !body.date ||
      !calciumName ||
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

    /* =====================================================
       NUMBER OF CHICKENS VALIDATION
    ===================================================== */

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

    /* =====================================================
       FINANCIAL VALIDATION
    ===================================================== */

    const financial = getFinancialData(body);

    if (!financial.success) {
      return financial.response;
    }

    /* =====================================================
       UPDATE CALCIUM RECORD
    ===================================================== */

    const calcium =
      await prisma.chickenCalcium.update({
        where: {
          id,
        },

        data: {
          date: new Date(
            `${body.date}T12:00:00`
          ),

          calciumName,

          givenBy,

          numberOfChickens,

          notes: notes || null,

          /*
           * FINANCIAL INFORMATION
           *
           * Browser-supplied total is ignored.
           */
          quantity: financial.data.quantity,

          unit: financial.data.unit,

          price: financial.data.price,

          total: financial.data.total,

          currency: financial.data.currency,

          /*
           * createdById is preserved.
           * updatedById = account currently editing.
           */
          ...updateAuditData(auth.user),
        },

        include: auditUserInclude,
      });

    return NextResponse.json(calcium);
  } catch (error) {
    console.error(
      "CHICKEN CALCIUM UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Calcium-ka lama beddeli karin. / Calcium record could not be updated.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   TIRTIR CALCIUM RECORD

   Permission: poultryHealthDelete
========================================================= */

export async function DELETE(request: Request) {
  try {
    const auth = await authorize(
      "poultryHealthDelete"
    );

    if (auth.response) {
      return auth.response;
    }

    const { searchParams } = new URL(
      request.url
    );

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID-ga lama helin. / Record ID is missing.",
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
    console.error(
      "CHICKEN CALCIUM DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Calcium-ka lama tirtiri karin. / Calcium record could not be deleted.",
      },
      { status: 500 }
    );
  }
}