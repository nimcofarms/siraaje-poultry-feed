"use client";

import Image from "next/image";
import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          remember,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          data.error || "Iimaylka ama erayga sirta ah waa khalad."
        );
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError(
        "Cilad ayaa dhacday. Fadlan mar kale isku day."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#fff9ed]">

      {/* BACKGROUND-KA KORE */}
      <div className="absolute inset-x-0 top-0 h-[570px] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_45%,#5f956b_0%,#17613b_45%,#064126_100%)]" />

        <div className="absolute left-1/2 top-20 h-80 w-[650px] -translate-x-1/2 rounded-full bg-[#fff5b0]/20 blur-3xl" />

        <div className="absolute left-10 top-8 h-44 w-64 opacity-20 [background-image:radial-gradient(#e6b63e_2px,transparent_2px)] [background-size:18px_18px]" />

        <div className="absolute -left-16 -top-12 rotate-[20deg] text-[190px] opacity-20">
          🌿
        </div>

        <div className="absolute -right-10 bottom-16 text-[160px] opacity-[0.08]">
          🌾
        </div>

        <div className="absolute -bottom-[110px] left-[-5%] h-[190px] w-[110%] rotate-[3deg] rounded-[50%] bg-[#dba92d]" />

        <div className="absolute -bottom-[123px] left-[-5%] h-[190px] w-[110%] rotate-[3deg] rounded-[50%] bg-[#fff9ed]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center px-4 pb-10 pt-6">

        {/* LOGO */}
        <div className="relative h-[185px] w-[210px]">
          <Image
            src="/siraaje-logo.jpg"
            alt="Siraaje Poultry & Feeds Company"
            fill
            sizes="210px"
            priority
            className="object-contain mix-blend-multiply"
          />
        </div>

        {/* MAGACA */}
        <h1 className="-mt-1 text-center text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Siraaje Poultry Feed
        </h1>

        <div className="mt-4 flex items-center gap-3">
          <span className="h-[2px] w-16 bg-[#e8b83e]" />
          <span className="h-2 w-2 rounded-full bg-[#e8b83e]" />
          <span className="h-[2px] w-16 bg-[#e8b83e]" />
        </div>

        <p className="mt-4 text-center text-base font-medium text-green-50 sm:text-lg">
          Nidaamka Maareynta Quudinta Digaagga
        </p>

        {/* LOGIN CARD */}
        <section className="mt-8 w-full max-w-[620px] rounded-[34px] border border-[#eee7d8] bg-white px-6 py-8 shadow-[0_25px_70px_rgba(23,61,38,0.20)] sm:px-11 sm:py-10">

          <div className="mb-8 flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#075b35] text-white shadow-md">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                className="h-8 w-8"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
            </div>

            <div>
              <h2 className="text-3xl font-extrabold text-[#064b2c]">
                Soo Gal / Login
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Ku soo dhawoow. Fadlan gal si aad u maamusho xogtaada.
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-bold text-[#172019]"
              >
                Cinwaanka Email/ 
              </label>

              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Geli cinwaanka iimaylkaaga"
                  className="h-[62px] w-full rounded-2xl border border-[#aac67d] bg-[#fcfdf8] px-5 pr-14 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#087343] focus:ring-4 focus:ring-green-100"
                />

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#075b35]"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3 7 9 6 9-6" />
                </svg>
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-[#172019]"
              >
                password/Sirta ah
              </label>

              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Geli erayga sirta ah"
                  className="h-[62px] w-full rounded-2xl border border-[#aac67d] bg-[#fcfdf8] px-5 pr-14 text-base text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#087343] focus:ring-4 focus:ring-green-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? "Qari erayga sirta ah"
                      : "Muuji erayga sirta ah"
                  }
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-[#075b35]"
                >
                  {showPassword ? (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path d="m3 3 18 18" />
                      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                      <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c5 0 9 4 10 8" />
                      <path d="M6.2 6.2C4.1 7.6 2.7 9.7 2 12c1 4 5 8 10 8 1.5 0 2.9-.4 4.1-1" />
                    </svg>
                  ) : (
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-5 w-5"
                    >
                      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* XUSUUSNOW */}
            <label className="flex cursor-pointer items-center gap-3 text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-5 w-5 accent-[#075b35]"
              />
              I Xusuusnow
            </label>

            {/* ERROR */}
            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            {/* SOO GAL */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-[62px] w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-[#064b2c] to-[#087343] text-lg font-extrabold text-white shadow-[0_10px_25px_rgba(7,91,53,0.22)] transition hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Waa lagu gelinayaa...
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="h-6 w-6"
                  >
                    <path d="M10 17l5-5-5-5" />
                    <path d="M15 12H3" />
                    <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
                  </svg>
                  Soo Gal / Login
                </>
              )}
            </button>
          </form>

          {/* SECURITY */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="flex items-center justify-center gap-3 text-sm font-medium text-[#185c3a]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#dcf7e6] font-bold">
                ✓
              </span>

              <span>Ammaan. Xogtaada waa la ilaaliyaa.</span>
            </div>
          </div>
        </section>

        <p className="mt-7 text-center text-sm text-[#52695b]">
          © 2026 Siraaje Poultry & Feeds Company
        </p>
      </div>
    </main>
  );
}