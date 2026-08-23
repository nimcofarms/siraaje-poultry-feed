import Link from "next/link";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[#f7f7f2]">
      <header className="bg-[#075b35] px-6 py-5 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">
              Siraaje Poultry Feed
            </h1>

            <p className="mt-1 text-sm text-green-100">
              Nidaamka Maamulka
            </p>
          </div>

          <div className="rounded-xl bg-white/10 px-4 py-2 text-sm">
            Maamule
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div>
          <h2 className="text-3xl font-extrabold text-[#064b2c]">
            Bogga Maamulka
          </h2>

          <p className="mt-2 text-slate-500">
            Ku soo dhawoow Siraaje Poultry Feed.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Wadarta Kharashaadka
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
              0 Birr
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Kharashaadka Bishan
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
              0 Birr
            </p>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">
              Tirada Diiwaannada
            </p>

            <p className="mt-3 text-3xl font-extrabold text-[#075b35]">
              0
            </p>
          </div>
        </div>

        <section className="mt-8 rounded-3xl bg-white p-7 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-bold text-[#064b2c]">
                Kharashaadka
              </h3>

              <p className="mt-2 text-slate-500">
                Diiwaangeli dhammaan lacagaha ka baxa mashruuca.
              </p>
            </div>

            <Link
              href="/dashboard/expenses"
              className="rounded-2xl bg-[#075b35] px-6 py-3 font-bold text-white shadow-md transition hover:bg-[#064b2c]"
            >
              + Ku dar Kharash
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}