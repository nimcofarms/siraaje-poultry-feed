import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  hasPermission,
  type PermissionKey,
} from "@/lib/auth";

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
    const auth = await authorize("expensesView");

    if (auth.response) {
      return auth.response;
    }

    const expenses = await prisma.constructionExpense.findMany({
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(expenses);
  } catch (error) {
    console.error("CONSTRUCTION EXPENSE GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashaadka dhismaha lama soo qaadi karin. / Construction expenses could not be loaded.",
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

    const location = String(body.location || "").trim();
    const name = String(body.name || "").trim();
    const type = String(body.type || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

    if (!body.date || !location || !name || !type) {
      return NextResponse.json(
        {
          error:
            "Fadlan buuxi taariikhda, location-ka, magaca iyo nooca. / Please complete the date, location, name and type.",
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

    const expense = await prisma.constructionExpense.create({
      data: {
        date: new Date(`${body.date}T12:00:00`),
        location,
        name,
        type,
        quantity,
        price,
        total,
        currency: "ETB",
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("CONSTRUCTION CREATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashka dhismaha lama kaydin. / Construction expense could not be saved.",
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
    const location = String(body.location || "").trim();
    const name = String(body.name || "").trim();
    const type = String(body.type || "").trim();
    const quantity = Number(body.quantity);
    const price = Number(body.price);

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

    const expense = await prisma.constructionExpense.update({
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
        total,
      },
    });

    return NextResponse.json(expense);
  } catch (error) {
    console.error("CONSTRUCTION UPDATE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashka dhismaha lama beddeli karin. / Construction expense could not be updated.",
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

    await prisma.constructionExpense.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("CONSTRUCTION DELETE ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Kharashka dhismaha lama tirtiri karin. / Construction expense could not be deleted.",
      },
      { status: 500 }
    );
  }
}