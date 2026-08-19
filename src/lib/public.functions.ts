import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const getPublicContent = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });

  const [pricing, testimonials] = await Promise.all([
    supabase.from("pricing_settings").select("key, label, value, unit, sort_order").order("sort_order"),
    supabase
      .from("testimonials")
      .select("id, author_name, cat_names, neighborhood, content, rating")
      .eq("published", true)
      .order("sort_order"),
  ]);

  return {
    pricing: pricing.data ?? [],
    testimonials: testimonials.data ?? [],
  };
});
