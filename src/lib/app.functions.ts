import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { calculatePrice, type PricingSettings } from "@/lib/pricing";

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(30),
  address: z.string().trim().max(200),
  neighborhood: z.enum(["Alphaville", "Tamboré"]),
});

const catSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(60),
  age_years: z.number().min(0).max(30).nullable(),
  temperament: z.string().trim().max(120),
  needs_medication: z.boolean(),
  medication_notes: z.string().trim().max(400),
  notes: z.string().trim().max(600),
  photo_path: z.string().trim().max(300).default(""),
  breed: z.string().trim().max(80).default(""),
  sex: z.enum(["macho", "femea", "nao_informado"]).default("nao_informado"),
  weight_kg: z.number().min(0).max(30).nullable().default(null),
  neutered: z.boolean().default(false),
  energy_level: z.enum(["baixo", "medio", "alto"]).default("medio"),
  social_people: z.boolean().default(true),
  social_cats: z.boolean().default(true),
  lives_with_other_pets: z.boolean().default(false),
  hides: z.boolean().default(false),
  escape_risk: z.boolean().default(false),
});

const bookingSchema = z.object({
  duration_minutes: z.union([z.literal(30), z.literal(45), z.literal(60)]),
  cat_ids: z.array(z.string().uuid()).min(1).max(12),
  with_medication: z.boolean(),
  previsit: z.boolean(),
  previsit_before_contract: z.boolean(),
  address: z.string().trim().min(5).max(200),
  neighborhood: z.enum(["Alphaville", "Tamboré"]),
  notes: z.string().trim().max(800),
  visits: z
    .array(z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), time: z.string().regex(/^\d{2}:\d{2}$/) }))
    .min(1)
    .max(60),
});

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [profile, cats, bookings, pricing, holidays, roles] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("cats").select("*").eq("owner_id", userId).order("created_at"),
      supabase
        .from("bookings")
        .select("*, booking_visits(id, visit_date, visit_time, day_type, price)")
        .eq("tutor_id", userId)
        .order("created_at", { ascending: false }),
      supabase.from("pricing_settings").select("key, label, value, unit, sort_order").order("sort_order"),
      supabase.from("holidays").select("day, name").order("day"),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);

    return {
      profile: profile.data ?? null,
      cats: cats.data ?? [],
      bookings: bookings.data ?? [],
      pricing: pricing.data ?? [],
      holidays: holidays.data ?? [],
      isAdmin: (roles.data ?? []).some((r: { role: string }) => r.role === "admin"),
    };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => profileSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ id: context.userId, ...data });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => catSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { id, ...fields } = data;
    const payload = { ...fields, owner_id: context.userId };
    const { error } = id
      ? await context.supabase.from("cats").update(payload).eq("id", id)
      : await context.supabase.from("cats").insert(payload);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteCat = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cats").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => bookingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const [pricingRes, holidayRes, catsRes] = await Promise.all([
      supabase.from("pricing_settings").select("key, value"),
      supabase.from("holidays").select("day"),
      supabase.from("cats").select("id").eq("owner_id", userId).in("id", data.cat_ids),
    ]);

    if ((catsRes.data ?? []).length !== data.cat_ids.length) {
      throw new Error("Selecione apenas gatos cadastrados no seu perfil.");
    }

    const settings: PricingSettings = Object.fromEntries(
      (pricingRes.data ?? []).map((row: { key: string; value: number | string }) => [
        row.key,
        Number(row.value),
      ]),
    );
    const holidays = new Set((holidayRes.data ?? []).map((h: { day: string }) => h.day));

    const result = calculatePrice(settings, holidays, {
      durationMinutes: data.duration_minutes,
      catCount: data.cat_ids.length,
      withMedication: data.with_medication,
      visits: data.visits,
      previsit: data.previsit,
      previsitBeforeContract: data.previsit_before_contract,
    });

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        tutor_id: userId,
        duration_minutes: data.duration_minutes,
        cat_ids: data.cat_ids,
        cat_count: data.cat_ids.length,
        with_medication: data.with_medication,
        previsit: data.previsit,
        previsit_fee: result.previsitFee,
        address: data.address,
        neighborhood: data.neighborhood,
        notes: data.notes,
        subtotal: result.subtotal,
        discount_pct: result.discountPct,
        discount_amount: result.discountAmount,
        total: result.total,
      })
      .select("id")
      .single();
    if (error || !booking) throw new Error(error?.message ?? "Não foi possível criar a reserva.");

    const { error: visitError } = await supabase.from("booking_visits").insert(
      result.visits.map((visit) => ({
        booking_id: booking.id,
        visit_date: visit.date,
        visit_time: visit.time,
        day_type: visit.dayType,
        price: visit.price,
      })),
    );
    if (visitError) throw new Error(visitError.message);

    return { id: booking.id as string, total: result.total };
  });

export const cancelBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("bookings")
      .update({ status: "cancelada" })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
