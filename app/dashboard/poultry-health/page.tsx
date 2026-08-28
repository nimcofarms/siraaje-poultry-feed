"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Vaccination = {
  id: string;
  date: string;
  stage: string;
  vaccineName: string;
  disease: string;
  application: string;
  givenBy: string;
  numberOfChickens: number;
  notes: string | null;
};

type Vitamin = {
  id: string;
  date: string;
  vitaminName: string;
  givenBy: string;
  numberOfChickens: number;
  notes: string | null;
};

type Calcium = {
  id: string;
  date: string;
  calciumName: string;
  givenBy: string;
  numberOfChickens: number;
  notes: string | null;
};

type VaccinationForm = {
  date: string;
  stage: string;
  vaccineName: string;
  disease: string;
  application: string;
  givenBy: string;
  numberOfChickens: string;
  notes: string;
};

type VitaminForm = {
  date: string;
  vitaminName: string;
  givenBy: string;
  numberOfChickens: string;
  notes: string;
};

type CalciumForm = {
  date: string;
  calciumName: string;
  givenBy: string;
  numberOfChickens: string;
  notes: string;
};

type ModalType = "vaccination" | "vitamin" | "calcium" | null;

function today() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string) {
  if (!date) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(date));
}

function emptyVaccinationForm(): VaccinationForm {
  return {
    date: today(),
    stage: "",
    vaccineName: "",
    disease: "",
    application: "",
    givenBy: "",
    numberOfChickens: "",
    notes: "",
  };
}

function emptyVitaminForm(): VitaminForm {
  return {
    date: today(),
    vitaminName: "",
    givenBy: "",
    numberOfChickens: "",
    notes: "",
  };
}

function emptyCalciumForm(): CalciumForm {
  return {
    date: today(),
    calciumName: "",
    givenBy: "",
    numberOfChickens: "",
    notes: "",
  };
}

const sidebarItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "▦",
  },
  {
    href: "/dashboard/expenses",
    label: "Kharashaadka / Expenses",
    icon: "💰",
  },
  {
    href: "/dashboard/eggs",
    label: "Ukumaha / Eggs",
    icon: "🥚",
  },
  {
    href: "/dashboard/feeds",
    label: "Quudinta / Feeds",
    icon: "🌾",
  },
  {
    href: "/dashboard/poultry-health",
    label: "Daaweynta Digaagga / Poultry Health",
    icon: "✚",
  },
];

type VaccineScheduleItem = {
  stage: string;
  vaccineName: string;
  disease: string;
  application: string;
  note?: string;
};

const vaccineSchedule: VaccineScheduleItem[] = [
  { stage: "Day 1", vaccineName: "Innovax ND/IBD", disease: "Marek's + NCD + IBD", application: "S/C injection", note: "Done in hatchery" },
  { stage: "Day 1", vaccineName: "Rismavac", disease: "Marek's", application: "S/C injection", note: "Done in hatchery" },
  { stage: "Day 1", vaccineName: "NCD+IB Live (Vitabron)", disease: "NCD + IB", application: "Coarse spray", note: "Done in hatchery" },
  { stage: "Day 12-14", vaccineName: "NCD+IB Live (Ceva BIL)", disease: "NCD + IB", application: "Eye drop / Drinking water" },
  { stage: "Day 16-18", vaccineName: "IBD intermediate", disease: "Gumboro", application: "Drinking water" },
  { stage: "Week 6-8", vaccineName: "Salmonella E&T", disease: "Salmonella E&T", application: "Intramuscular injection" },
  { stage: "Week 6-8", vaccineName: "Coryza (ABC) Killed", disease: "Coryza", application: "S/C injection" },
  { stage: "Week 6-8", vaccineName: "NCD+IB Live (Ceva BIL)", disease: "NCD + IB", application: "Drinking water" },
  { stage: "Week 8-10", vaccineName: "Fowl pox", disease: "Pox", application: "Wing stab" },
  { stage: "Week 8-10", vaccineName: "Fowl cholera", disease: "Fowl cholera", application: "S/C injection", note: "If there is disease history; otherwise optional" },
  { stage: "Week 12-14", vaccineName: "Salmonella E&T (killed)", disease: "Salmonella E&T", application: "Intramuscular injection" },
  { stage: "Week 12-14", vaccineName: "Coryza (ABC) (killed)", disease: "Coryza", application: "S/C injection" },
  { stage: "Week 16-18", vaccineName: "NCD+IB (Killed)", disease: "NCD + IB", application: "Intramuscular injection" },
  { stage: "Week 16-18", vaccineName: "Fowl cholera", disease: "Fowl cholera", application: "Subcutaneous injection", note: "If there is disease history; otherwise optional" },
];

const stages = [
  "Day 1",
  "Day 12-14",
  "Day 16-18",
  "Week 6-8",
  "Week 8-10",
  "Week 12-14",
  "Week 16-18",
];

export default function PoultryHealthPage() {
  const pathname = usePathname();

  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [vitamins, setVitamins] = useState<Vitamin[]>([]);
  const [calciumRecords, setCalciumRecords] = useState<Calcium[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalType, setModalType] = useState<ModalType>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [vaccinationForm, setVaccinationForm] =
    useState<VaccinationForm>(emptyVaccinationForm());

  const [vitaminForm, setVitaminForm] =
    useState<VitaminForm>(emptyVitaminForm());

  const [calciumForm, setCalciumForm] =
    useState<CalciumForm>(emptyCalciumForm());

  const availableVaccines = vaccineSchedule.filter(
    (item) => item.stage === vaccinationForm.stage
  );

  const selectedVaccine = vaccineSchedule.find(
    (item) =>
      item.stage === vaccinationForm.stage &&
      item.vaccineName === vaccinationForm.vaccineName
  );

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [
        vaccinationResponse,
        vitaminResponse,
        calciumResponse,
      ] = await Promise.all([
        fetch("/api/chicken-vaccinations", {
          cache: "no-store",
        }),
        fetch("/api/chicken-vitamins", {
          cache: "no-store",
        }),
        fetch("/api/chicken-calcium", {
          cache: "no-store",
        }),
      ]);

      const vaccinationData = await vaccinationResponse.json();
      const vitaminData = await vitaminResponse.json();
      const calciumData = await calciumResponse.json();

      if (!vaccinationResponse.ok) {
        throw new Error(
          vaccinationData.error ||
            "Vaccination records could not be loaded."
        );
      }

      if (!vitaminResponse.ok) {
        throw new Error(
          vitaminData.error ||
            "Vitamin records could not be loaded."
        );
      }

      if (!calciumResponse.ok) {
        throw new Error(
          calciumData.error ||
            "Calcium records could not be loaded."
        );
      }

      setVaccinations(
        Array.isArray(vaccinationData) ? vaccinationData : []
      );

      setVitamins(
        Array.isArray(vitaminData) ? vitaminData : []
      );

      setCalciumRecords(
        Array.isArray(calciumData) ? calciumData : []
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Xogta lama soo qaadi karin. / Records could not be loaded."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForms() {
    setVaccinationForm(emptyVaccinationForm());
    setVitaminForm(emptyVitaminForm());
    setCalciumForm(emptyCalciumForm());
  }

  function closeModal() {
    if (saving) return;

    setModalType(null);
    setEditingId(null);
    resetForms();
  }

  function openVaccinationForm() {
    setEditingId(null);
    setVaccinationForm(emptyVaccinationForm());
    setError("");
    setSuccess("");
    setModalType("vaccination");
  }

  function openVitaminForm() {
    setEditingId(null);
    setVitaminForm(emptyVitaminForm());
    setError("");
    setSuccess("");
    setModalType("vitamin");
  }

  function openCalciumForm() {
    setEditingId(null);
    setCalciumForm(emptyCalciumForm());
    setError("");
    setSuccess("");
    setModalType("calcium");
  }

  function editVaccination(record: Vaccination) {
    setEditingId(record.id);

    setVaccinationForm({
      date: record.date.slice(0, 10),
      stage: record.stage,
      vaccineName: record.vaccineName,
      disease: record.disease,
      application: record.application,
      givenBy: record.givenBy,
      numberOfChickens: String(record.numberOfChickens),
      notes: record.notes ?? "",
    });

    setError("");
    setSuccess("");
    setModalType("vaccination");
  }

  function editVitamin(record: Vitamin) {
    setEditingId(record.id);

    setVitaminForm({
      date: record.date.slice(0, 10),
      vitaminName: record.vitaminName,
      givenBy: record.givenBy,
      numberOfChickens: String(record.numberOfChickens),
      notes: record.notes ?? "",
    });

    setError("");
    setSuccess("");
    setModalType("vitamin");
  }

  function editCalcium(record: Calcium) {
    setEditingId(record.id);

    setCalciumForm({
      date: record.date.slice(0, 10),
      calciumName: record.calciumName,
      givenBy: record.givenBy,
      numberOfChickens: String(record.numberOfChickens),
      notes: record.notes ?? "",
    });

    setError("");
    setSuccess("");
    setModalType("calcium");
  }

  async function submitVaccination(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numberOfChickens = Number(
      vaccinationForm.numberOfChickens
    );

    if (
      !vaccinationForm.date ||
      !vaccinationForm.stage ||
      !vaccinationForm.vaccineName.trim() ||
      !vaccinationForm.disease.trim() ||
      !vaccinationForm.application ||
      !vaccinationForm.givenBy.trim()
    ) {
      setError(
        "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields."
      );
      return;
    }

    if (
      !Number.isInteger(numberOfChickens) ||
      numberOfChickens <= 0
    ) {
      setError(
        "Tirada digaagga waa inay ka weyn tahay 0. / Number of chickens must be greater than 0."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        "/api/chicken-vaccinations",
        {
          method: editingId ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...(editingId ? { id: editingId } : {}),
            date: vaccinationForm.date,
            stage: vaccinationForm.stage,
            vaccineName: vaccinationForm.vaccineName.trim(),
            disease: vaccinationForm.disease.trim(),
            application: vaccinationForm.application,
            givenBy: vaccinationForm.givenBy.trim(),
            numberOfChickens,
            notes: vaccinationForm.notes.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Tallaalka lama kaydin karin. / Vaccination could not be saved."
        );
      }

      await loadData();

      setModalType(null);
      setEditingId(null);
      setVaccinationForm(emptyVaccinationForm());

      setSuccess(
        editingId
          ? "Tallaalka waa la cusboonaysiiyay. / Vaccination updated successfully."
          : "Tallaalka waa la kaydiyay. / Vaccination saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Tallaalka lama kaydin karin. / Vaccination could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitVitamin(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numberOfChickens = Number(
      vitaminForm.numberOfChickens
    );

    if (
      !vitaminForm.date ||
      !vitaminForm.vitaminName.trim() ||
      !vitaminForm.givenBy.trim()
    ) {
      setError(
        "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields."
      );
      return;
    }

    if (
      !Number.isInteger(numberOfChickens) ||
      numberOfChickens <= 0
    ) {
      setError(
        "Tirada digaagga waa inay ka weyn tahay 0. / Number of chickens must be greater than 0."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/chicken-vitamins", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          date: vitaminForm.date,
          vitaminName: vitaminForm.vitaminName.trim(),
          givenBy: vitaminForm.givenBy.trim(),
          numberOfChickens,
          notes: vitaminForm.notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Vitamin-ka lama kaydin karin. / Vitamin could not be saved."
        );
      }

      await loadData();

      setModalType(null);
      setEditingId(null);
      setVitaminForm(emptyVitaminForm());

      setSuccess(
        editingId
          ? "Vitamin-ka waa la cusboonaysiiyay. / Vitamin updated successfully."
          : "Vitamin-ka waa la kaydiyay. / Vitamin saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Vitamin-ka lama kaydin karin. / Vitamin could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitCalcium(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const numberOfChickens = Number(
      calciumForm.numberOfChickens
    );

    if (
      !calciumForm.date ||
      !calciumForm.calciumName.trim() ||
      !calciumForm.givenBy.trim()
    ) {
      setError(
        "Fadlan buuxi dhammaan xogta loo baahan yahay. / Please complete all required fields."
      );
      return;
    }

    if (
      !Number.isInteger(numberOfChickens) ||
      numberOfChickens <= 0
    ) {
      setError(
        "Tirada digaagga waa inay ka weyn tahay 0. / Number of chickens must be greater than 0."
      );
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/chicken-calcium", {
        method: editingId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...(editingId ? { id: editingId } : {}),
          date: calciumForm.date,
          calciumName: calciumForm.calciumName.trim(),
          givenBy: calciumForm.givenBy.trim(),
          numberOfChickens,
          notes: calciumForm.notes.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Calcium-ka lama kaydin karin. / Calcium could not be saved."
        );
      }

      await loadData();

      setModalType(null);
      setEditingId(null);
      setCalciumForm(emptyCalciumForm());

      setSuccess(
        editingId
          ? "Calcium-ka waa la cusboonaysiiyay. / Calcium updated successfully."
          : "Calcium-ka waa la kaydiyay. / Calcium saved successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Calcium-ka lama kaydin karin. / Calcium could not be saved."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteRecord(
    type: "vaccination" | "vitamin" | "calcium",
    id: string
  ) {
    const confirmed = window.confirm(
      "Ma hubtaa inaad tirtirayso diiwaankan? / Are you sure you want to delete this record?"
    );

    if (!confirmed) return;

    let endpoint = "";

    if (type === "vaccination") {
      endpoint = "/api/chicken-vaccinations";
    }

    if (type === "vitamin") {
      endpoint = "/api/chicken-vitamins";
    }

    if (type === "calcium") {
      endpoint = "/api/chicken-calcium";
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${endpoint}?id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Diiwaanka lama tirtiri karin. / Record could not be deleted."
        );
      }

      await loadData();

      setSuccess(
        "Diiwaanka waa la tirtiray. / Record deleted successfully."
      );
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Diiwaanka lama tirtiri karin. / Record could not be deleted."
      );
    }
  }
    return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        {/* SIDEBAR */}
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white lg:flex">
          <div className="border-b border-slate-200 px-6 py-6">
            <h1 className="text-xl font-extrabold text-emerald-700">
              Siraaje Poultry
            </h1>

            <p className="mt-1 text-sm font-medium text-slate-500">
              & Feeds Company
            </p>
          </div>

          <nav className="flex-1 space-y-2 p-4">
            {sidebarItems.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                    active
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-slate-200 p-4">
            <p className="text-xs text-slate-400">
              © 2026 Siraaje Poultry & Feeds Company
            </p>
          </div>
        </aside>

        {/* MAIN */}
        <main className="min-w-0 flex-1">
          {/* MOBILE NAVIGATION */}
          <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
            <p className="mb-3 font-extrabold text-emerald-700">
              Siraaje Poultry & Feeds
            </p>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {sidebarItems.map((item) => {
                const active =
                  item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold ${
                      active
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="mx-auto max-w-[1700px] p-4 sm:p-6 lg:p-8">
            {/* PAGE HEADER */}
            <div className="mb-7">
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                Siraaje Poultry & Feeds Company
              </p>

              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                Daaweynta Digaagga / Poultry Health
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Maamul tallaalka, vitamin-ka iyo calcium-ka digaagga. /
                Manage chicken vaccination, vitamins and calcium records.
              </p>
            </div>

            {/* MESSAGES */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {success}
              </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Tallaalka / Vaccination
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900">
                      {vaccinations.length}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-xl font-bold text-emerald-700">
                    ✚
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Vitamin
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900">
                      {vitamins.length}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl font-bold text-amber-700">
                    V
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Calcium
                    </p>

                    <p className="mt-2 text-3xl font-extrabold text-slate-900">
                      {calciumRecords.length}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-lg font-bold text-blue-700">
                    Ca
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-7">
              {/* VACCINATION TABLE */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Tallaalka / Vaccination
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Diiwaanka tallaalka iyo cudurrada laga hortagayo. /
                      Vaccination and disease prevention records.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openVaccinationForm}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    + Ku Dar Tallaal / Add Vaccination
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[1450px] w-full">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Taariikhda / Date
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Marxaladda / Stage-Age
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Tallaalka / Vaccine
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Cudurka / Disease
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Habka / Application
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Qofka Siiyay / Given By
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">
                          Digaagga / Chickens
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Faahfaahin / Notes
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-600">
                          Maamul / Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-10 text-center text-sm text-slate-500"
                          >
                            Xogta waa la soo qaadayaa... / Loading...
                          </td>
                        </tr>
                      ) : vaccinations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={9}
                            className="px-4 py-10 text-center text-sm text-slate-500"
                          >
                            Weli tallaal lama diiwaangelin. / No vaccination
                            records yet.
                          </td>
                        </tr>
                      ) : (
                        vaccinations.map((record) => (
                          <tr
                            key={record.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                              {formatDate(record.date)}
                            </td>

                            <td className="whitespace-nowrap px-4 py-4 text-sm font-semibold text-slate-700">
                              {record.stage}
                            </td>

                            <td className="px-4 py-4 text-sm font-bold text-slate-900">
                              {record.vaccineName}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {record.disease}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {record.application}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {record.givenBy}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                              {record.numberOfChickens}
                            </td>

                            <td className="max-w-[260px] px-4 py-4 text-sm text-slate-500">
                              {record.notes || "—"}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => editVaccination(record)}
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                >
                                  Beddel / Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteRecord(
                                      "vaccination",
                                      record.id
                                    )
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                >
                                  Tirtir / Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* VITAMIN TABLE */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Vitamin
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Diiwaanka vitamin-ka digaagga. / Chicken vitamin
                      records.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openVitaminForm}
                    className="rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-amber-700"
                  >
                    + Ku Dar Vitamin / Add Vitamin
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[950px] w-full">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Taariikhda / Date
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Vitamin-ka / Vitamin
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Qofka Siiyay / Given By
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">
                          Digaagga / Chickens
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Faahfaahin / Notes
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-600">
                          Maamul / Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center text-sm text-slate-500"
                          >
                            Xogta waa la soo qaadayaa... / Loading...
                          </td>
                        </tr>
                      ) : vitamins.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center text-sm text-slate-500"
                          >
                            Weli vitamin lama diiwaangelin. / No vitamin
                            records yet.
                          </td>
                        </tr>
                      ) : (
                        vitamins.map((record) => (
                          <tr
                            key={record.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                              {formatDate(record.date)}
                            </td>

                            <td className="px-4 py-4 text-sm font-bold text-slate-900">
                              {record.vitaminName}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {record.givenBy}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                              {record.numberOfChickens}
                            </td>

                            <td className="max-w-[300px] px-4 py-4 text-sm text-slate-500">
                              {record.notes || "—"}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => editVitamin(record)}
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                >
                                  Beddel / Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteRecord("vitamin", record.id)
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                >
                                  Tirtir / Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* CALCIUM TABLE */}
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      Calcium
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Diiwaanka calcium-ka digaagga. / Chicken calcium
                      records.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={openCalciumForm}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
                  >
                    + Ku Dar Calcium / Add Calcium
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-[950px] w-full">
                    <thead className="bg-slate-50">
                      <tr className="border-b border-slate-200">
                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Taariikhda / Date
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Calcium-ka / Calcium
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Qofka Siiyay / Given By
                        </th>

                        <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-600">
                          Digaagga / Chickens
                        </th>

                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-600">
                          Faahfaahin / Notes
                        </th>

                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-600">
                          Maamul / Actions
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {loading ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center text-sm text-slate-500"
                          >
                            Xogta waa la soo qaadayaa... / Loading...
                          </td>
                        </tr>
                      ) : calciumRecords.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-10 text-center text-sm text-slate-500"
                          >
                            Weli calcium lama diiwaangelin. / No calcium
                            records yet.
                          </td>
                        </tr>
                      ) : (
                        calciumRecords.map((record) => (
                          <tr
                            key={record.id}
                            className="transition hover:bg-slate-50"
                          >
                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-700">
                              {formatDate(record.date)}
                            </td>

                            <td className="px-4 py-4 text-sm font-bold text-slate-900">
                              {record.calciumName}
                            </td>

                            <td className="px-4 py-4 text-sm text-slate-700">
                              {record.givenBy}
                            </td>

                            <td className="px-4 py-4 text-right text-sm font-bold text-slate-900">
                              {record.numberOfChickens}
                            </td>

                            <td className="max-w-[300px] px-4 py-4 text-sm text-slate-500">
                              {record.notes || "—"}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => editCalcium(record)}
                                  className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
                                >
                                  Beddel / Edit
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    deleteRecord("calcium", record.id)
                                  }
                                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
                                >
                                  Tirtir / Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* VACCINATION MODAL */}
      {modalType === "vaccination" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[95vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {editingId
                    ? "Beddel Tallaalka / Edit Vaccination"
                    : "Ku Dar Tallaal / Add Vaccination"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Diiwaangeli tallaalka digaagga iyo habka loo siiyay.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitVaccination} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Taariikhda / Date
                  </label>

                  <input
                    type="date"
                    required
                    value={vaccinationForm.date}
                    onChange={(event) =>
                      setVaccinationForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                {/* STAGE / AGE */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Marxaladda / Stage-Age
                  </label>
                  <select
                    required
                    value={vaccinationForm.stage}
                    onChange={(event) => {
                      const newStage = event.target.value;
                      setVaccinationForm((current) => ({
                        ...current, stage: newStage, vaccineName: "", disease: "", application: "",
                      }));
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">Dooro marxaladda / Select stage</option>
                    {stages.map((stage) => (<option key={stage} value={stage}>{stage}</option>))}
                  </select>
                  {vaccinationForm.stage === "Day 1" && (
                    <p className="mt-2 text-xs font-semibold text-amber-700">Day 1 vaccines are marked as done in the hatchery in the vaccination schedule.</p>
                  )}
                </div>

                {/* VACCINE */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Nooca Tallaalka / Vaccine</label>
                  <select
                    required
                    disabled={!vaccinationForm.stage}
                    value={vaccinationForm.vaccineName}
                    onChange={(event) => {
                      const vaccineName = event.target.value;
                      const scheduleItem = vaccineSchedule.find((item) => item.stage === vaccinationForm.stage && item.vaccineName === vaccineName);
                      setVaccinationForm((current) => ({ ...current, vaccineName, disease: scheduleItem?.disease ?? "", application: scheduleItem?.application ?? "" }));
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">{vaccinationForm.stage ? "Dooro tallaalka / Select vaccine" : "Marka hore dooro marxaladda / Select stage first"}</option>
                    {availableVaccines.map((item) => (
                      <option key={`${item.stage}-${item.vaccineName}`} value={item.vaccineName}>{item.vaccineName}{item.note ? " — Optional/Note" : ""}</option>
                    ))}
                  </select>
                </div>

                {/* DISEASE - AUTO FILLED */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Cudurka / Disease</label>
                  <input type="text" required readOnly value={vaccinationForm.disease} placeholder="Si otomaatig ah ayuu u soo baxayaa / Auto-filled" className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
                  <p className="mt-1.5 text-xs text-slate-500">Waxaa laga soo buuxinayaa jadwalka tallaalka. / Filled automatically from the vaccination schedule.</p>
                </div>

                {/* APPLICATION - AUTO FILLED */}
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">Habka Loo Siiyay / Application</label>
                  <input type="text" required readOnly value={vaccinationForm.application} placeholder="Si otomaatig ah ayuu u soo baxayaa / Auto-filled" className="w-full cursor-not-allowed rounded-xl border border-slate-300 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400" />
                  <p className="mt-1.5 text-xs text-slate-500">Habka saxda ah wuxuu ku xiran yahay tallaalka la doortay. / Correct application is selected automatically.</p>
                </div>

                {/* SCHEDULE INFORMATION */}
                {selectedVaccine && (
                  <div className="sm:col-span-2">
                    <div className={`rounded-xl border px-4 py-4 ${selectedVaccine.note ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50"}`}>
                      <p className={`text-sm font-extrabold ${selectedVaccine.note ? "text-amber-800" : "text-emerald-800"}`}>Xogta Jadwalka / Vaccination Schedule</p>
                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                        <div><span className="font-bold text-slate-700">Vaccine:</span>{" "}<span className="text-slate-600">{selectedVaccine.vaccineName}</span></div>
                        <div><span className="font-bold text-slate-700">Disease:</span>{" "}<span className="text-slate-600">{selectedVaccine.disease}</span></div>
                        <div><span className="font-bold text-slate-700">Application:</span>{" "}<span className="text-slate-600">{selectedVaccine.application}</span></div>
                      </div>
                      {selectedVaccine.note && (<div className="mt-3 rounded-lg bg-white/70 px-3 py-2 text-sm font-semibold text-amber-800">Fiiro gaar ah / Note: {selectedVaccine.note}</div>)}
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Qofka Siiyay / Given By
                  </label>

                  <input
                    type="text"
                    required
                    value={vaccinationForm.givenBy}
                    onChange={(event) =>
                      setVaccinationForm((current) => ({
                        ...current,
                        givenBy: event.target.value,
                      }))
                    }
                    placeholder="Magaca qofka / Person's name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Tirada Digaagga / Number of Chickens
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={vaccinationForm.numberOfChickens}
                    onChange={(event) =>
                      setVaccinationForm((current) => ({
                        ...current,
                        numberOfChickens: event.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Faahfaahin / Notes
                  </label>

                  <textarea
                    rows={3}
                    value={vaccinationForm.notes}
                    onChange={(event) =>
                      setVaccinationForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    placeholder="Faahfaahin dheeraad ah / Additional notes"
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Jooji / Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {saving
                    ? "Waa la kaydinayaa... / Saving..."
                    : editingId
                    ? "Kaydi Isbeddelka / Save Changes"
                    : "Kaydi Tallaalka / Save Vaccination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VITAMIN MODAL */}
      {modalType === "vitamin" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {editingId
                    ? "Beddel Vitamin-ka / Edit Vitamin"
                    : "Ku Dar Vitamin / Add Vitamin"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitVitamin} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Taariikhda / Date
                  </label>

                  <input
                    type="date"
                    required
                    value={vitaminForm.date}
                    onChange={(event) =>
                      setVitaminForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Vitamin-ka / Vitamin Name
                  </label>

                  <input
                    type="text"
                    required
                    value={vitaminForm.vitaminName}
                    onChange={(event) =>
                      setVitaminForm((current) => ({
                        ...current,
                        vitaminName: event.target.value,
                      }))
                    }
                    placeholder="Tusaale: Multivitamin"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Qofka Siiyay / Given By
                  </label>

                  <input
                    type="text"
                    required
                    value={vitaminForm.givenBy}
                    onChange={(event) =>
                      setVitaminForm((current) => ({
                        ...current,
                        givenBy: event.target.value,
                      }))
                    }
                    placeholder="Magaca qofka / Person's name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Tirada Digaagga / Number of Chickens
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={vitaminForm.numberOfChickens}
                    onChange={(event) =>
                      setVitaminForm((current) => ({
                        ...current,
                        numberOfChickens: event.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Faahfaahin / Notes
                  </label>

                  <textarea
                    rows={3}
                    value={vitaminForm.notes}
                    onChange={(event) =>
                      setVitaminForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Jooji / Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-amber-600 px-6 py-3 text-sm font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {saving
                    ? "Waa la kaydinayaa... / Saving..."
                    : editingId
                    ? "Kaydi Isbeddelka / Save Changes"
                    : "Kaydi Vitamin / Save Vitamin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CALCIUM MODAL */}
      {modalType === "calcium" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {editingId
                    ? "Beddel Calcium-ka / Edit Calcium"
                    : "Ku Dar Calcium / Add Calcium"}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500 hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitCalcium} className="p-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Taariikhda / Date
                  </label>

                  <input
                    type="date"
                    required
                    value={calciumForm.date}
                    onChange={(event) =>
                      setCalciumForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Calcium-ka / Calcium Name
                  </label>

                  <input
                    type="text"
                    required
                    value={calciumForm.calciumName}
                    onChange={(event) =>
                      setCalciumForm((current) => ({
                        ...current,
                        calciumName: event.target.value,
                      }))
                    }
                    placeholder="Tusaale: Liquid Calcium"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Qofka Siiyay / Given By
                  </label>

                  <input
                    type="text"
                    required
                    value={calciumForm.givenBy}
                    onChange={(event) =>
                      setCalciumForm((current) => ({
                        ...current,
                        givenBy: event.target.value,
                      }))
                    }
                    placeholder="Magaca qofka / Person's name"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Tirada Digaagga / Number of Chickens
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={calciumForm.numberOfChickens}
                    onChange={(event) =>
                      setCalciumForm((current) => ({
                        ...current,
                        numberOfChickens: event.target.value,
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Faahfaahin / Notes
                  </label>

                  <textarea
                    rows={3}
                    value={calciumForm.notes}
                    onChange={(event) =>
                      setCalciumForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              {error && (
                <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
                >
                  Jooji / Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving
                    ? "Waa la kaydinayaa... / Saving..."
                    : editingId
                    ? "Kaydi Isbeddelka / Save Changes"
                    : "Kaydi Calcium / Save Calcium"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}