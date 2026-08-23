import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Fadlan geli iimaylka iyo erayga sirta ah." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Iimaylka ama erayga sirta ah waa khalad." },
        { status: 401 }
      );
    }

    const passwordIsCorrect = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordIsCorrect) {
      return NextResponse.json(
        { error: "Iimaylka ama erayga sirta ah waa khalad." },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(
      process.env.JWT_SECRET
    );

    const token = await new SignJWT({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
    });

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
      { error: "Cilad ayaa dhacday. Fadlan mar kale isku day." },
      { status: 500 }
    );
  }
}