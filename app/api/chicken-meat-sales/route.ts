import {
    getCurrentUser,
    hasPermission,
    type PermissionKey,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_CUSTOMER_TYPES = [
  "HOTEL",
  "RESTAURANT",
  "CAFE",
  "DUKAAN",
  "SHAQSI",
  "XAAFAD",
  "ANOTHER",
];

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
// GET - View chicken meat sales
// Permission: chickenView
// ======================================================

export async function GET() {
  try {
    const auth = await authorize("chickenView");

    if (auth.response) {
      return auth.response;
    }

    const sales = await prisma.chickenMeatSale.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("GET CHICKEN MEAT SALES ERROR:", error);

    return NextResponse.json(
      {
        error: "Waxaa dhacay cilad. / Could not load chicken meat sales.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// POST - Add chicken meat sale
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
    const customerType = String(body.customerType || "")
      .trim()
      .toUpperCase();
    const branch = String(body.branch || "").trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);

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

    if (!ALLOWED_CUSTOMER_TYPES.includes(customerType)) {
      return NextResponse.json(
        {
          error:
            "Nooca xarunta sax ma aha. / Invalid customer type.",
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

    // Total is always calculated on the server.
    const total = quantity * price;

    const sale = await prisma.chickenMeatSale.create({
      data: {
        date: parsedDate,
        location,
        customerType,
        branch,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("POST CHICKEN MEAT SALE ERROR:", error);

    return NextResponse.json(
      {
        error: "Waxaa dhacay cilad. / Could not create chicken meat sale.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// PUT - Edit chicken meat sale
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
    const customerType = String(body.customerType || "")
      .trim()
      .toUpperCase();
    const branch = String(body.branch || "").trim();

    const quantity = Number(body.quantity);
    const price = Number(body.price);

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

    if (!ALLOWED_CUSTOMER_TYPES.includes(customerType)) {
      return NextResponse.json(
        {
          error:
            "Nooca xarunta sax ma aha. / Invalid customer type.",
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

    const existingSale = await prisma.chickenMeatSale.findUnique({
      where: {
        id,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        {
          error: "Xogta lama helin. / Chicken meat sale was not found.",
        },
        { status: 404 }
      );
    }

    const total = quantity * price;

    const updatedSale = await prisma.chickenMeatSale.update({
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
      },
    });

    return NextResponse.json(updatedSale);
  } catch (error) {
    console.error("PUT CHICKEN MEAT SALE ERROR:", error);

    return NextResponse.json(
      {
        error: "Waxaa dhacay cilad. / Could not update chicken meat sale.",
      },
      { status: 500 }
    );
  }
}

// ======================================================
// DELETE - Delete chicken meat sale
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

    const existingSale = await prisma.chickenMeatSale.findUnique({
      where: {
        id,
      },
    });

    if (!existingSale) {
      return NextResponse.json(
        {
          error: "Xogta lama helin. / Chicken meat sale was not found.",
        },
        { status: 404 }
      );
    }

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
    console.error("DELETE CHICKEN MEAT SALE ERROR:", error);

    return NextResponse.json(
      {
        error: "Waxaa dhacay cilad. / Could not delete chicken meat sale.",
      },
      { status: 500 }
    );
  }
}