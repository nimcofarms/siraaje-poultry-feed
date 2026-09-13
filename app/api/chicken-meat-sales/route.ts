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
   CUSTOMER TYPES LA OGGOLO YAHAY
========================================================= */

const ALLOWED_CUSTOMER_TYPES = [
  "HOTEL",
  "RESTAURANT",
  "CAFE",
  "DUKAAN",
  "SHAQSI",
  "XAAFAD",
  "ANOTHER",
];

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
   VIEW CHICKEN MEAT SALES

   Permission: chickenView
========================================================= */

export async function GET() {
  try {
    const auth = await authorize("chickenView");

    if (auth.response) {
      return auth.response;
    }

    const sales =
      await prisma.chickenMeatSale.findMany({
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

    return NextResponse.json(sales);
  } catch (error) {
    console.error(
      "GET CHICKEN MEAT SALES ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not load chicken meat sales.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   ADD CHICKEN MEAT SALE

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

    const location = String(
      body.location || ""
    ).trim();

    const customerType = String(
      body.customerType || ""
    )
      .trim()
      .toUpperCase();

    const branch = String(
      body.branch || ""
    ).trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (
      !date ||
      !location ||
      !customerType ||
      !branch ||
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
       CUSTOMER TYPE VALIDATION
    ===================================================== */

    if (
      !ALLOWED_CUSTOMER_TYPES.includes(
        customerType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Nooca xarunta sax ma aha. / Invalid customer type.",
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

    /*
     * Total-ka server-ka ayaa xisaabinaya.
     */
    const total = quantity * price;

    /* =====================================================
       CREATE CHICKEN MEAT SALE
    ===================================================== */

    const sale =
      await prisma.chickenMeatSale.create({
        data: {
          date: parsedDate,

          location,

          customerType,

          branch,

          quantity,

          price,

          total,

          currency: "ETB",

          /*
           * AUDIT TRAIL
           *
           * createdById = account-ka iibka geliyay.
           *
           * updatedById = isla account-kaas marka
           * record-ka markii ugu horreysay la sameeyo.
           *
           * User ID-ga session-ka server-ka ayaa
           * laga qaadayaa.
           */
          ...createAuditData(auth.user),
        },

        include: auditUserInclude,
      });

    return NextResponse.json(
      sale,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST CHICKEN MEAT SALE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not create chicken meat sale.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   EDIT CHICKEN MEAT SALE

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

    const location = String(
      body.location || ""
    ).trim();

    const customerType = String(
      body.customerType || ""
    )
      .trim()
      .toUpperCase();

    const branch = String(
      body.branch || ""
    ).trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);

    /* =====================================================
       BASIC VALIDATION
    ===================================================== */

    if (
      !id ||
      !date ||
      !location ||
      !customerType ||
      !branch ||
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
       CUSTOMER TYPE VALIDATION
    ===================================================== */

    if (
      !ALLOWED_CUSTOMER_TYPES.includes(
        customerType
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Nooca xarunta sax ma aha. / Invalid customer type.",
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

    const existingSale =
      await prisma.chickenMeatSale.findUnique({
        where: {
          id,
        },
      });

    if (!existingSale) {
      return NextResponse.json(
        {
          error:
            "Xogta lama helin. / Chicken meat sale was not found.",
        },
        { status: 404 }
      );
    }

    const total = quantity * price;

    /* =====================================================
       UPDATE CHICKEN MEAT SALE
    ===================================================== */

    const updatedSale =
      await prisma.chickenMeatSale.update({
        where: {
          id,
        },

        data: {
          date: parsedDate,

          location,

          customerType,

          branch,

          quantity,

          price,

          total,

          /*
           * createdById lama beddelayo.
           *
           * updatedById wuxuu noqonayaa account-ka
           * hadda record-kan wax ka beddelay.
           */
          ...updateAuditData(auth.user),
        },

        include: auditUserInclude,
      });

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error(
      "PUT CHICKEN MEAT SALE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not update chicken meat sale.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   DELETE CHICKEN MEAT SALE

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

    const existingSale =
      await prisma.chickenMeatSale.findUnique({
        where: {
          id,
        },
      });

    if (!existingSale) {
      return NextResponse.json(
        {
          error:
            "Xogta lama helin. / Chicken meat sale was not found.",
        },
        { status: 404 }
      );
    }

    /* =====================================================
       DELETE
    ===================================================== */

    await prisma.chickenMeatSale.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,

      message:
        "Xogta waa la tirtiray. / Chicken meat sale deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE CHICKEN MEAT SALE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Waxaa dhacay cilad. / Could not delete chicken meat sale.",
      },
      { status: 500 }
    );
  }
}