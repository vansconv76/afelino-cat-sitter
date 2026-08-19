export type PricingSettings = Record<string, number>;

export type DayType = "util" | "sabado" | "domingo" | "feriado";

export type VisitInput = {
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
};

export type PriceInput = {
  durationMinutes: 30 | 45 | 60;
  catCount: number;
  withMedication: boolean;
  visits: VisitInput[];
  previsit: boolean;
  /** true = pré-visita antes da contratação confirmada (cobrada) */
  previsitBeforeContract: boolean;
};

export type VisitBreakdown = {
  date: string;
  time: string;
  dayType: DayType;
  surchargePct: number;
  price: number;
};

export type PriceResult = {
  perVisitBase: number;
  extraCatsPerVisit: number;
  medicationPerVisit: number;
  visits: VisitBreakdown[];
  subtotal: number;
  discountPct: number;
  discountAmount: number;
  previsitFee: number;
  total: number;
};

export const DURATIONS = [30, 45, 60] as const;

const round2 = (n: number) => Math.round(n * 100) / 100;

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

export function formatPct(value: number): string {
  return `${round2(value * 100).toLocaleString("pt-BR")}%`;
}

/** yyyy-mm-dd -> tipo de dia, sem depender de fuso horário */
export function dayTypeFor(date: string, holidays: Set<string>): DayType {
  if (holidays.has(date)) return "feriado";
  const [y, m, d] = date.split("-").map(Number);
  const weekday = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1)).getUTCDay();
  if (weekday === 6) return "sabado";
  if (weekday === 0) return "domingo";
  return "util";
}

export const DAY_TYPE_LABEL: Record<DayType, string> = {
  util: "Dia útil",
  sabado: "Sábado",
  domingo: "Domingo",
  feriado: "Feriado",
};

function extraCatsFee(settings: PricingSettings, catCount: number): number {
  let fee = 0;
  if (catCount >= 3) fee += settings["extra_cat_3"] ?? 0;
  if (catCount >= 4) fee += settings["extra_cat_4"] ?? 0;
  if (catCount >= 5) fee += settings["extra_cat_5"] ?? 0;
  // A partir do 6º gato repete o adicional do 5º por gato extra.
  if (catCount > 5) fee += (catCount - 5) * (settings["extra_cat_5"] ?? 0);
  return fee;
}

export function surchargeFor(settings: PricingSettings, dayType: DayType): number {
  if (dayType === "sabado") return settings["surcharge_saturday"] ?? 0;
  if (dayType === "domingo") return settings["surcharge_sunday"] ?? 0;
  if (dayType === "feriado") return settings["surcharge_holiday"] ?? 0;
  return 0;
}

export function packageDiscount(settings: PricingSettings, visitCount: number): number {
  if (visitCount >= 15) return settings["discount_15_plus"] ?? 0;
  if (visitCount >= 8) return settings["discount_8_14"] ?? 0;
  if (visitCount >= 5) return settings["discount_5_7"] ?? 0;
  if (visitCount >= 3) return settings["discount_3_4"] ?? 0;
  return 0;
}

export function calculatePrice(
  settings: PricingSettings,
  holidays: Set<string>,
  input: PriceInput,
): PriceResult {
  const base = settings[`base_${input.durationMinutes}`] ?? 0;
  const extras = extraCatsFee(settings, input.catCount);
  const medication = input.withMedication ? (settings["medication_fee"] ?? 0) : 0;
  const visitValue = base + extras + medication;

  const visits: VisitBreakdown[] = input.visits.map((visit) => {
    const dayType = dayTypeFor(visit.date, holidays);
    const surchargePct = surchargeFor(settings, dayType);
    return {
      date: visit.date,
      time: visit.time,
      dayType,
      surchargePct,
      price: round2(visitValue * (1 + surchargePct)),
    };
  });

  const subtotal = round2(visits.reduce((sum, v) => sum + v.price, 0));
  const discountPct = packageDiscount(settings, visits.length);
  const discountAmount = round2(subtotal * discountPct);
  const previsitFee =
    input.previsit && input.previsitBeforeContract ? (settings["previsit_fee"] ?? 0) : 0;

  return {
    perVisitBase: base,
    extraCatsPerVisit: extras,
    medicationPerVisit: medication,
    visits,
    subtotal,
    discountPct,
    discountAmount,
    previsitFee: round2(previsitFee),
    total: round2(subtotal - discountAmount + previsitFee),
  };
}

export const SERVICE_AREAS = ["Alphaville", "Tamboré"] as const;

export const BOOKING_STATUSES = [
  "pendente",
  "confirmada",
  "concluida",
  "cancelada",
] as const;

export const STATUS_LABEL: Record<string, string> = {
  pendente: "Aguardando confirmação",
  confirmada: "Confirmada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};
