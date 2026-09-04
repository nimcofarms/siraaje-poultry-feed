import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

const ALLOWED_CUSTOMER_TYPES = [
  "Dukaan",
  "Restaurant",
  "Hotel",
  "Cafeteria",
];

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
    const auth = await authorize("eggsView");

    if (auth.response) {
      return auth.response;
    }

    const sales = await prisma.eggSale.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(sales);
  } catch (error) {
    console.error("EGG SALES GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Ukumaha la iibiyay lama soo qaadi karin. / Egg sales could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorize("eggsAdd");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const customerType = String(body.customerType || "").trim();
    const companyName = String(body.companyName || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!body.date || !customerType || !companyName) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, nooca macmiilka iyo magaca macmiilka. / Please enter the date, customer type and customer name.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_CUSTOMER_TYPES.includes(customerType)) {
      return NextResponse.json(
        {
          error:
            "Nooca macmiilka waa inuu noqdaa Dukaan, Restaurant, Hotel ama Cafeteria. / Customer type must be Shop, Restaurant, Hotel or Cafeteria.",
        },
        { status: 400 }
      );
    }

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

    const sale = await prisma.eggSale.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        customerType,
        companyName,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("EGG SALES CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Iibka ukunta lama kaydin karin. / Egg sale could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorize("eggsEdit");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const id = String(body.id || "").trim();
    const customerType = String(body.customerType || "").trim();
    const companyName = String(body.companyName || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!id) {
      return NextResponse.json(
        {
          error: "ID-ga lama helin. / Record ID is missing.",
        },
        { status: 400 }
      );
    }

    if (!body.date || !customerType || !companyName) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, nooca macmiilka iyo magaca macmiilka. / Please enter the date, customer type and customer name.",
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_CUSTOMER_TYPES.includes(customerType)) {
      return NextResponse.json(
        {
          error:
            "Nooca macmiilka waa inuu noqdaa Dukaan, Restaurant, Hotel ama Cafeteria. / Customer type must be Shop, Restaurant, Hotel or Cafeteria.",
        },
        { status: 400 }
      );
    }

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

    const sale = await prisma.eggSale.update({
      where: {
        id,
      },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        customerType,
        companyName,
        quantity,
        price,
        total,
      },
    });

    return NextResponse.json(sale);
  } catch (error) {
    console.error("EGG SALES UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Iibka ukunta lama beddeli karin. / Egg sale could not be updated.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorize("eggsDelete");

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

    await prisma.eggSale.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("EGG SALES DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Iibka ukunta lama tirtiri karin. / Egg sale could not be deleted.",
      },
      { status: 500 }
    );
  }
}