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
   SOO QAADO UKUMAHA LA SOO GATAY
========================================================= */

export async function GET() {
  try {
    const auth = await authorize("eggsView");

    if (auth.response) {
      return auth.response;
    }

    const eggs = await prisma.purchasedEgg.findMany({
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

    return NextResponse.json(eggs);
  } catch (error) {
    console.error(
      "PURCHASED EGGS GET ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ukumaha la soo gatay lama soo qaadi karin. / Purchased eggs could not be loaded.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST
   KAYDI UKUN CUSUB OO LA SOO GATAY
========================================================= */

export async function POST(request: Request) {
  try {
    const auth = await authorize("eggsAdd");

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

    const location = String(
      body.location || ""
    ).trim();

    const companyName = String(
      body.companyName || ""
    ).trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      !body.date ||
      !location ||
      !companyName
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, goobta iyo magaca shirkadda. / Please enter date, location and company name.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       NUMBER VALIDATION
    ===================================================== */

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tirada iyo qiimaha si sax ah u geli. / Enter a valid quantity and price.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price;

    /* =====================================================
       CREATE
    ===================================================== */

    const egg = await prisma.purchasedEgg.create({
      data: {
        date: new Date(
          `${body.date}T12:00:00`
        ),

        location,

        companyName,

        quantity,

        price,

        total,

        currency: "ETB",

        /*
         * AUDIT TRAIL
         *
         * createdById = account-ka xogta geliyay
         * updatedById = account-ka ugu dambeeyay taabtay
         *
         * Labadaba waxaa laga qaadayaa session-ka.
         * Frontend-ku ma soo diri karo qofka xogta geliyay.
         */
        ...createAuditData(auth.user),
      },

      include: auditUserInclude,
    });

    return NextResponse.json(
      egg,
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "PURCHASED EGGS CREATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Ukumaha lama kaydin karin. / Purchased eggs could not be saved.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   PUT
   BEDEL XOGTA UKUNTA LA SOO GATAY
========================================================= */

export async function PUT(request: Request) {
  try {
    const auth = await authorize("eggsEdit");

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

    const location = String(
      body.location || ""
    ).trim();

    const companyName = String(
      body.companyName || ""
    ).trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);

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
      !location ||
      !companyName
    ) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, goobta iyo magaca shirkadda. / Please enter date, location and company name.",
        },
        { status: 400 }
      );
    }

    /* =====================================================
       NUMBER VALIDATION
    ===================================================== */

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Tirada iyo qiimaha si sax ah u geli. / Enter a valid quantity and price.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price;

    /* =====================================================
       UPDATE
    ===================================================== */

    const egg = await prisma.purchasedEgg.update({
      where: {
        id,
      },

      data: {
        date: new Date(
          `${body.date}T12:00:00`
        ),

        location,

        companyName,

        quantity,

        price,

        total,

        /*
         * createdById lama beddelayo.
         *
         * updatedById wuxuu noqonayaa account-ka
         * hadda wax ka beddelay record-kan.
         */
        ...updateAuditData(auth.user),
      },

      include: auditUserInclude,
    });

    return NextResponse.json(egg);
  } catch (error) {
    console.error(
      "PURCHASED EGGS UPDATE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Xogta lama beddeli karin. / Purchased egg record could not be updated.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE
   TIRTIR XOGTA UKUNTA
========================================================= */

export async function DELETE(request: Request) {
  try {
    const auth = await authorize("eggsDelete");

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

    await prisma.purchasedEgg.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "PURCHASED EGGS DELETE ERROR:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Xogta lama tirtiri karin. / Purchased egg record could not be deleted.",
      },
      { status: 500 }
    );
  }
}