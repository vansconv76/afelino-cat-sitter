CREATE TYPE public.app_role AS ENUM ('admin', 'tutor');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT 'Alphaville',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.cats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  age_years numeric(4,1),
  temperament text NOT NULL DEFAULT '',
  needs_medication boolean NOT NULL DEFAULT false,
  medication_notes text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cats TO authenticated;
GRANT ALL ON public.cats TO service_role;
ALTER TABLE public.cats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cats read" ON public.cats FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "cats insert" ON public.cats FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());
CREATE POLICY "cats update" ON public.cats FOR UPDATE TO authenticated
  USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "cats delete" ON public.cats FOR DELETE TO authenticated
  USING (owner_id = auth.uid());

CREATE TABLE public.pricing_settings (
  key text PRIMARY KEY,
  label text NOT NULL,
  value numeric(10,4) NOT NULL,
  unit text NOT NULL DEFAULT 'BRL',
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.pricing_settings TO anon;
GRANT SELECT, UPDATE ON public.pricing_settings TO authenticated;
GRANT ALL ON public.pricing_settings TO service_role;
ALTER TABLE public.pricing_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pricing public read" ON public.pricing_settings FOR SELECT USING (true);
CREATE POLICY "pricing admin update" ON public.pricing_settings FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.pricing_settings (key, label, value, unit, sort_order) VALUES
  ('base_30', 'Visita de 30 minutos', 90, 'BRL', 1),
  ('base_45', 'Visita de 45 minutos', 105, 'BRL', 2),
  ('base_60', 'Visita de 60 minutos', 120, 'BRL', 3),
  ('extra_cat_3', 'Adicional 3º gato (por visita)', 15, 'BRL', 4),
  ('extra_cat_4', 'Adicional 4º gato (por visita)', 25, 'BRL', 5),
  ('extra_cat_5', 'Adicional 5º gato (por visita)', 35, 'BRL', 6),
  ('medication_fee', 'Medicação oral/tópica (por visita)', 15, 'BRL', 7),
  ('previsit_fee', 'Pré-visita antes da contratação', 50, 'BRL', 8),
  ('surcharge_saturday', 'Adicional sábado', 0.10, 'PCT', 9),
  ('surcharge_sunday', 'Adicional domingo', 0.20, 'PCT', 10),
  ('surcharge_holiday', 'Adicional feriado', 0.50, 'PCT', 11),
  ('discount_3_4', 'Desconto pacote 3-4 visitas', 0.03, 'PCT', 12),
  ('discount_5_7', 'Desconto pacote 5-7 visitas', 0.05, 'PCT', 13),
  ('discount_8_14', 'Desconto pacote 8-14 visitas', 0.07, 'PCT', 14),
  ('discount_15_plus', 'Desconto pacote 15+ visitas', 0.10, 'PCT', 15);

CREATE TABLE public.holidays (
  day date PRIMARY KEY,
  name text NOT NULL
);
GRANT SELECT ON public.holidays TO anon;
GRANT SELECT ON public.holidays TO authenticated;
GRANT ALL ON public.holidays TO service_role;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "holidays public read" ON public.holidays FOR SELECT USING (true);
CREATE POLICY "holidays admin write" ON public.holidays FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
GRANT INSERT, UPDATE, DELETE ON public.holidays TO authenticated;

INSERT INTO public.holidays (day, name) VALUES
  ('2026-09-07', 'Independência'),
  ('2026-10-12', 'Nossa Senhora Aparecida'),
  ('2026-11-02', 'Finados'),
  ('2026-11-15', 'Proclamação da República'),
  ('2026-12-25', 'Natal'),
  ('2027-01-01', 'Confraternização Universal');

CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pendente',
  duration_minutes int NOT NULL DEFAULT 30,
  cat_ids uuid[] NOT NULL DEFAULT '{}',
  cat_count int NOT NULL DEFAULT 1,
  with_medication boolean NOT NULL DEFAULT false,
  previsit boolean NOT NULL DEFAULT false,
  previsit_fee numeric(10,2) NOT NULL DEFAULT 0,
  address text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT 'Alphaville',
  notes text NOT NULL DEFAULT '',
  subtotal numeric(10,2) NOT NULL DEFAULT 0,
  discount_pct numeric(10,4) NOT NULL DEFAULT 0,
  discount_amount numeric(10,2) NOT NULL DEFAULT 0,
  total numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings read" ON public.bookings FOR SELECT TO authenticated
  USING (tutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings insert" ON public.bookings FOR INSERT TO authenticated
  WITH CHECK (tutor_id = auth.uid());
CREATE POLICY "bookings update" ON public.bookings FOR UPDATE TO authenticated
  USING (tutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (tutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "bookings delete" ON public.bookings FOR DELETE TO authenticated
  USING (tutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.booking_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  visit_date date NOT NULL,
  visit_time time NOT NULL DEFAULT '09:00',
  day_type text NOT NULL DEFAULT 'util',
  price numeric(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.booking_visits TO authenticated;
GRANT ALL ON public.booking_visits TO service_role;
ALTER TABLE public.booking_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits read" ON public.booking_visits FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.tutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));
CREATE POLICY "visits insert" ON public.booking_visits FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND b.tutor_id = auth.uid()));
CREATE POLICY "visits delete" ON public.booking_visits FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.bookings b WHERE b.id = booking_id AND (b.tutor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))));

CREATE TABLE public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_name text NOT NULL,
  cat_names text NOT NULL DEFAULT '',
  neighborhood text NOT NULL DEFAULT 'Alphaville',
  content text NOT NULL,
  rating int NOT NULL DEFAULT 5,
  published boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.testimonials TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.testimonials TO authenticated;
GRANT ALL ON public.testimonials TO service_role;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "testimonials public read" ON public.testimonials FOR SELECT USING (published = true);
CREATE POLICY "testimonials admin read" ON public.testimonials FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "testimonials admin write" ON public.testimonials FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.testimonials (author_name, cat_names, neighborhood, content, rating, sort_order) VALUES
  ('Marina Rocha', 'Nina e Tobias', 'Alphaville', 'Viajei duas semanas tranquila. Recebia foto e relatório de cada visita, e a Nina, que é medrosa, apareceu no vídeo pedindo carinho.', 5, 1),
  ('Rafael Bittencourt', 'Momo', 'Tamboré', 'O Momo toma remédio para tireoide todos os dias. A Afelino não errou um único horário e ainda organizou a farmacinha dele.', 5, 2),
  ('Cláudia Menezes', 'Frida, Lupi e Zoe', 'Alphaville', 'Três gatas, três temperamentos. A pré-visita fez toda diferença: chegaram no dia já conhecendo os cantos e a rotina da casa.', 5, 3);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER bookings_updated_at BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), COALESCE(NEW.raw_user_meta_data->>'phone', ''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'tutor')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();