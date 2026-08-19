import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const testimonialSchema = z.object({
  id: z.string().uuid().optional(),
  author_name: z.string().trim().min(2).max(80),
  cat_names: z.string().trim().max(120),
  neighborhood: z.enum(["Alphaville", "Tamboré"]),
  content: z.string().trim().min(10).max(800),
  rating: z.number().int().min(1).max(5),
  published: z.boolean(),
  sort_order: z.number().int().min(0).max(999),
});

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");

    const [pricing, bookings, testimonials, holidays, profiles, cats] = await Promise.all([
      supabase.from("pricing_settings").select("*").order("sort_order"),
      supabase
        .from("bookings")
        .select("*, booking_visits(id, visit_date, visit_time, day_type, price)")
        .order("created_at", { ascending: false }),
      supabase.from("testimonials").select("*").order("sort_order"),
      supabase.from("holidays").select("*").order("day"),
      supabase.from("profiles").select("id, full_name, phone, neighborhood"),
      supabase.from("cats").select("id, owner_id, name, needs_medication"),
    ]);

    return {
      pricing: pricing.data ?? [],
      bookings: bookings.data ?? [],
      testimonials: testimonials.data ?? [],
      holidays: holidays.data ?? [],
      profiles: profiles.data ?? [],
      cats: cats.data ?? [],
    };
  });

export const updatePricing = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        entries: z
          .array(z.object({ key: z.string().min(1).max(60), value: z.number().min(0).max(100000) }))
          .min(1)
          .max(50),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");

    for (const entry of data.entries) {
      const { error } = await supabase
        .from("pricing_settings")
        .update({ value: entry.value, updated_at: new Date().toISOString() })
        .eq("key", entry.key);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const setBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pendente", "confirmada", "concluida", "cancelada"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");
    const { error } = await supabase.from("bookings").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => testimonialSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");
    const { error } = data.id
      ? await supabase.from("testimonials").update(data).eq("id", data.id)
      : await supabase.from("testimonials").insert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTestimonial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");
    const { error } = await supabase.from("testimonials").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveHoliday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        name: z.string().trim().min(2).max(80),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");
    const { error } = await supabase.from("holidays").upsert(data);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteHoliday = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso restrito a administradores.");
    const { error } = await supabase.from("holidays").delete().eq("day", data.day);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
