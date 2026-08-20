ALTER TABLE public.cats
  ADD COLUMN IF NOT EXISTS photo_path text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS breed text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS sex text NOT NULL DEFAULT 'nao_informado',
  ADD COLUMN IF NOT EXISTS weight_kg numeric,
  ADD COLUMN IF NOT EXISTS neutered boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS energy_level text NOT NULL DEFAULT 'medio',
  ADD COLUMN IF NOT EXISTS social_people boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS social_cats boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS lives_with_other_pets boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS hides boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS escape_risk boolean NOT NULL DEFAULT false;

CREATE POLICY "cat photos owner read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cat-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "cat photos owner insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cat-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "cat photos owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cat-photos' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'cat-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "cat photos owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cat-photos' AND (storage.foldername(name))[1] = auth.uid()::text);