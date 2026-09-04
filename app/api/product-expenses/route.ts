import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

const allowedProducts = [
  "Gallay",
  "Soyabean",
  "Corn Maize",
  "White Sunflower",
  "Black Sunflower",
  "Premix",
  "Lafaha Malayga",
  "Dhagaxaanta Nuurada",
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

function validateProduct(body: any) {
  const location = String(body.location || "").trim();
  const name = String(body.name || "").trim();
  const type = String(body.type || "").trim();
  const quantity = Number(body.quantity);
  const price = Number(body.price);

  const transport =
    body.transport === "" ||
    body.transport === null ||
    body.transport === undefined
      ? 0
      : Number(body.transport);

  return {
    location,
    name,
    type,
    quantity,
    price,
    transport,
  };
}

export async function GET() {
  try {
    const auth = await authorize("expensesView");

    if (auth.response) {
      return auth.response;
    }

    const expenses = await prisma.productExpense.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("PRODUCT EXPENSE GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashaadka productiga lama soo qaadi karin. / Product expenses could not be loaded.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authorize("expensesAdd");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const { location, name, type, quantity, price, transport } =
      validateProduct(body);

    if (!body.date || !location || !name || !type) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, location-ka, magaca iyo nooca. / Please complete the date, location, name and type.",
        },
        { status: 400 }
      );
    }

    if (!allowedProducts.includes(name)) {
      return NextResponse.json(
        {
          error:
            "Product-ka aad dooratay lama oggola. / The selected product is not allowed.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(transport) ||
      transport < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Quantity, price ama transport si sax ah u geli. / Enter a valid quantity, price and transport cost.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price + transport;

    const expense = await prisma.productExpense.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        location,
        name,
        type,
        quantity,
        price,
        transport,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("PRODUCT CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashka productiga lama kaydin. / Product expense could not be saved.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await authorize("expensesEdit");

    if (auth.response) {
      return auth.response;
    }

    const body = await request.json();

    const id = String(body.id || "").trim();

    const { location, name, type, quantity, price, transport } =
      validateProduct(body);

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID-ga kharashka lama helin. / Expense ID is missing.",
        },
        { status: 400 }
      );
    }

    if (!body.date || !location || !name || !type) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, location-ka, magaca iyo nooca. / Please complete the date, location, name and type.",
        },
        { status: 400 }
      );
    }

    if (!allowedProducts.includes(name)) {
      return NextResponse.json(
        {
          error:
            "Product-ka aad dooratay lama oggola. / The selected product is not allowed.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(transport) ||
      transport < 0
    ) {
      return NextResponse.json(
        {
          error:
            "Quantity, price ama transport si sax ah u geli. / Enter a valid quantity, price and transport cost.",
        },
        { status: 400 }
      );
    }

    const total = quantity * price + transport;

    const expense = await prisma.productExpense.update({
      where: {
        id,
      },
      data: {
        date: new Date(`${body.date}T12:00:00`),
        location,
        name,
        type,
        quantity,
        price,
        transport,
        total,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("PRODUCT UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashka productiga lama beddeli karin. / Product expense could not be updated.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await authorize("expensesDelete");

    if (auth.response) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          error:
            "ID-ga kharashka lama helin. / Expense ID is missing.",
        },
        { status: 400 }
      );
    }

    await prisma.productExpense.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("PRODUCT DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashka productiga lama tirtiri karin. / Product expense could not be deleted.",
      },
      { status: 500 }
    );
  }
}