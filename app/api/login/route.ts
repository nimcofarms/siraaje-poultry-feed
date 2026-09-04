import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    // =====================================================
    // READ LOGIN INFORMATION
    // =====================================================
    const body = await request.json();

    const email = String(body.email || "")
      .trim()
      .toLowerCase();

    const password = String(body.password || "");

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Fadlan geli iimaylka iyo erayga sirta ah. / Please enter your email and password.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // CHECK JWT CONFIGURATION
    // =====================================================
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error("LOGIN ERROR: JWT_SECRET is missing.");

      return NextResponse.json(
        {
          error:
            "Authentication is not configured correctly on the server.",
        },
        { status: 500 }
      );
    }

    // =====================================================
    // FIND USER
    // =====================================================
    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    // =====================================================
    // CHECK USER
    // =====================================================
    if (!user) {
      return NextResponse.json(
        {
          error:
            "Iimaylka ama erayga sirta ah waa khalad. / Email or password is incorrect.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // VERIFY PASSWORD
    // =====================================================
    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsCorrect) {
      return NextResponse.json(
        {
          error:
            "Iimaylka ama erayga sirta ah waa khalad. / Email or password is incorrect.",
        },
        { status: 401 }
      );
    }

    // =====================================================
    // CREATE SIGNED SESSION TOKEN
    // =====================================================
    const secret = new TextEncoder().encode(jwtSecret);

    const token = await new SignJWT({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({
        alg: "HS256",
        typ: "JWT",
      })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    // =====================================================
    // CREATE RESPONSE
    // =====================================================
    const response = NextResponse.json({
      success: true,
    });

    // =====================================================
    // SET SECURE SESSION COOKIE
    // =====================================================
    response.cookies.set("siraaje_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return NextResponse.json(
      {
        error:
          "Cilad ayaa dhacday. Fadlan mar kale isku day. / Something went wrong. Please try again.",
      },
      { status: 500 }
    );
  }
}