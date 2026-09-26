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
   CHICKEN STAGES LA OGGOLO YAHAY
========================================================= */

const ALLOWED_STAGES = [
  "Day 1",
  "Day 12-14",
  "Day 16-18",
  "Week 6-8",
  "Week 8-10",
  "Week 12-14",
  "Week 16-18",
];

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

  if (
    !Number.isFinite(number) ||
    number <= 0
  ) {
    return null;
  }

  return number;
}

function getFinancialData(body: Record<string, unknown>) {
  const hasAnyFinancialValue =
    body.quantity !== undefined &&
      body.quantity !== null &&
      body.quantity !== "" ||
    body.price !== undefined &&
      body.price !== null &&
      body.price !== "" ||
    body.unit !== undefined &&
      body.unit !== null &&
      String(body.unit).trim() !== "";

  /*
   * Financial information is optional so old-style
   * health records can still exist without becoming
   * financial expenses.
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
    parseOptionalPositiveNumber(
      body.quantity
    );

  const price =
    parseOptionalPositiveNumber(
      body.price
    );

  const unit = String(
    body.unit || ""
  ).trim();

  const currency =
    String(
      body.currency || "ETB"
    )
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

  const total =
    Math.round(
      quantity *
        price *
        100
    ) / 100;

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
  const user =
    await getCurrentUser();

  if (!user) {
    return {
      user: null,
      response:
        NextResponse.json(
          {
            error:
              "Fadlan marka hore gal. / Please log in first.",
          },
          { status: 401 }
        ),
    };
  }

  if (
    !hasPermission(
      user,
      permission
    )
  ) {
    return {
      user,
      response:
        NextResponse.json(
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
   SOO QAADO DHAMMAAN TALLAALLADA

   Permission: poultryHealthView
========================================================= */

export async function GET() {
  try {
    const auth =
      await authorize(
        "poultryHealthView"
      );

    if (auth.response) {
      return auth.response;
    }

    const vaccinations =
      await prisma.chickenVaccination.findMany(
        {
          include:
            auditUserInclude,

          orderBy: [
            {
              date: "desc",
            },
            {
              createdAt:
                "desc",
            },
          ],
        }
      );

    return NextResponse.json(
      vaccinations
    );
  } catch (error) {
    console.error(
      "CHICKEN VACCINATION GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Xogta tallaalka lama soo qaadi karin. / Vaccination records could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   KAYDI TALLAAL CUSUB

   Permission: poultryHealthAdd
========================================================= */

export async function POST(
  request: Request
) {
  try {
    const auth =
      await authorize(
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

    const body =
      await request.json();

    const stage = String(
      body.stage || ""
    ).trim();

    const vaccineName =
      String(
        body.vaccineName ||
          ""
      ).trim();

    const disease = String(
      body.disease || ""
    ).trim();

    const application =
      String(
        body.application ||
          ""
      ).trim();

    const givenBy = String(
      body.givenBy || ""
    ).trim();

    const notes = String(
      body.notes || ""
    ).trim();

    const numberOfChickens =
      Number(
        body.numberOfChickens
      );

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

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

    /* =====================================================
       STAGE VALIDATION
    ===================================================== */

    if (
      !ALLOWED_STAGES.includes(
        stage
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Marxaladda digaagga sax ma aha. / Chicken stage is not valid.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       NUMBER OF CHICKENS VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(
        numberOfChickens
      ) ||
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

    const financial =
      getFinancialData(body);

    if (!financial.success) {
      return financial.response;
    }

    /* =====================================================
       CREATE VACCINATION
    ===================================================== */

    const vaccination =
      await prisma.chickenVaccination.create(
        {
          data: {
            date: new Date(
              `${body.date}T12:00:00`
            ),

            stage,

            vaccineName,

            disease,

            application,

            givenBy,

            numberOfChickens,

            notes:
              notes || null,

            /*
             * FINANCIAL INFORMATION
             *
             * total is NEVER trusted from the browser.
             * Server calculates:
             *
             * quantity × price = total
             */
            quantity:
              financial.data
                .quantity,

            unit:
              financial.data
                .unit,

            price:
              financial.data
                .price,

            total:
              financial.data
                .total,

            currency:
              financial.data
                .currency,

            /*
             * AUDIT TRAIL
             *
             * givenBy = qofka tallaalka bixiyay.
             * createdBy = qofka website-ka xogta geliyay.
             */
            ...createAuditData(
              auth.user
            ),
          },

          include:
            auditUserInclude,
        }
      );

    return NextResponse.json(
      vaccination,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "CHICKEN VACCINATION CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Tallaalka lama kaydin karin. / Vaccination record could not be saved.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   BEDEL XOGTA TALLAALKA

   Permission: poultryHealthEdit
========================================================= */

export async function PUT(
  request: Request
) {
  try {
    const auth =
      await authorize(
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

    const body =
      await request.json();

    const id = String(
      body.id || ""
    ).trim();

    const stage = String(
      body.stage || ""
    ).trim();

    const vaccineName =
      String(
        body.vaccineName ||
          ""
      ).trim();

    const disease = String(
      body.disease || ""
    ).trim();

    const application =
      String(
        body.application ||
          ""
      ).trim();

    const givenBy = String(
      body.givenBy || ""
    ).trim();

    const notes = String(
      body.notes || ""
    ).trim();

    const numberOfChickens =
      Number(
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

    /* =====================================================
       STAGE VALIDATION
    ===================================================== */

    if (
      !ALLOWED_STAGES.includes(
        stage
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Marxaladda digaagga sax ma aha. / Chicken stage is not valid.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       NUMBER OF CHICKENS VALIDATION
    ===================================================== */

    if (
      !Number.isInteger(
        numberOfChickens
      ) ||
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

    const financial =
      getFinancialData(body);

    if (!financial.success) {
      return financial.response;
    }

    /* =====================================================
       UPDATE VACCINATION
    ===================================================== */

    const vaccination =
      await prisma.chickenVaccination.update(
        {
          where: {
            id,
          },

          data: {
            date: new Date(
              `${body.date}T12:00:00`
            ),

            stage,

            vaccineName,

            disease,

            application,

            givenBy,

            numberOfChickens,

            notes:
              notes || null,

            quantity:
              financial.data
                .quantity,

            unit:
              financial.data
                .unit,

            price:
              financial.data
                .price,

            total:
              financial.data
                .total,

            currency:
              financial.data
                .currency,

            /*
             * createdById lama beddelayo.
             * updatedById = account-ka hadda wax ka beddelay.
             */
            ...updateAuditData(
              auth.user
            ),
          },

          include:
            auditUserInclude,
        }
      );

    return NextResponse.json(
      vaccination
    );
  } catch (error) {
    console.error(
      "CHICKEN VACCINATION UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Tallaalka lama beddeli karin. / Vaccination record could not be updated.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   TIRTIR TALLAALKA

   Permission: poultryHealthDelete
========================================================= */

export async function DELETE(
  request: Request
) {
  try {
    const auth =
      await authorize(
        "poultryHealthDelete"
      );

    if (auth.response) {
      return auth.response;
    }

    const { searchParams } =
      new URL(request.url);

    const id =
      searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID-ga lama helin. / Record ID is missing.",
        },
        { status: 400 }
      );
    }

    await prisma.chickenVaccination.delete(
      {
        where: {
          id,
        },
      }
    );

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "CHICKEN VACCINATION DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Tallaalka lama tirtiri karin. / Vaccination record could not be deleted.",
      },
      { status: 500 }
    );
  }
}