import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyAccount, saveCat, deleteCat } from "@/lib/app.functions";
import { supabase } from "@/integrations/supabase/client";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/gatos")({
  head: () => ({
    meta: [
      { title: "Cadastro do gato — Afelino" },
      {
        name: "description",
        content: "Cadastre a ficha completa de cada gato: foto, raça, idade, comportamento e cuidados.",
      },
      { property: "og:title", content: "Cadastro do gato — Afelino" },
      {
        property: "og:description",
        content: "Ficha completa de cada gato para visitas seguras e personalizadas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CatsPage;
});

type Sex = "macho" | "femea" | "nao_informado";
type Energy = "baixo" | "medio" | "alto";

type CatForm = {
  id?: string;
  name: string;
  photo_path: string;
  breed: string;
  age_years: string;
  sex: Sex;
  weight_kg: string;
  neutered: boolean;
  energy_level: Energy;
  social_people: boolean;
  social_cats: boolean;
  lives_with_other_pets: boolean;
  hides: boolean;
  escape_risk: boolean;
  temperament: string;
  needs_medication: boolean;
  medication_notes: string;
  notes: string;
};

const emptyCat: CatForm = {
  name: "",
  photo_path: "",
  breed: "",
  age_years: "",
  sex: "nao_informado",
  weight_kg: "",
  neutered: false,
  energy_level: "medio",
  social_people: true,
  social_cats: true,
  lives_with_other_pets: false,
  hides: false,
  escape_risk: false,
  temperament: "",
  needs_medication: false,
  medication_notes: "",
  notes: "",
};

const SEX_LABEL: Record<string, string> = {
  macho: "Macho",
  femea: "Fêmea",
  nao_informado: "Não informado",
};

const ENERGY_LABEL: Record<string, string> = {
  baixo: "Energia baixa",
  medio: "Energia média",
  alto: "Energia alta",
};

function YesNo({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border px-4 py-3">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {hint && <p className="caption-light text-muted-foreground">{hint}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function CatPhoto({ path, name }: { path: string; name: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    supabase.storage
      .from("cat-photos")
      .createSignedUrl(path, 3600)
      .then(({ data }) => {
        if (active) setUrl(data?.signedUrl ?? null);
      });
    return () => {
      active = false;
    };
  }, [path]);

  if (!url) {
    return (
      <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-border bg-secondary/50 caption-light">
        sem foto
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={`Foto do gato ${name}`}
      loading="lazy"
      className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
    />
  );
}

function CatsPage() {
  const queryClient = useQueryClient();
  const fetchAccount = useServerFn(getMyAccount);
  const submitCat = useServerFn(saveCat);
  const removeCat = useServerFn(deleteCat);

  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });
  const cats = account.data?.cats ?? [];

  const [form, setForm] = useState<CatForm>(emptyCat);
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = <K extends keyof CatForm>(key: K, value: CatForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function startNew() {
    setForm(emptyCat);
    setShowForm(true);
  }

  function startEdit(cat: (typeof cats)[number]) {
    setForm({
      id: cat.id,
      name: cat.name ?? "",
      photo_path: cat.photo_path ?? "",
      breed: cat.breed ?? "",
      age_years: cat.age_years == null ? "" : String(cat.age_years),
      sex: (cat.sex ?? "nao_informado") as Sex,
      weight_kg: cat.weight_kg == null ? "" : String(cat.weight_kg),
      neutered: cat.neutered ?? false,
      energy_level: (cat.energy_level ?? "medio") as Energy,
      social_people: cat.social_people ?? true,
      social_cats: cat.social_cats ?? true,
      lives_with_other_pets: cat.lives_with_other_pets ?? false,
      hides: cat.hides ?? false,
      escape_risk: cat.escape_risk ?? false,
      temperament: cat.temperament ?? "",
      needs_medication: cat.needs_medication ?? false,
      medication_notes: cat.medication_notes ?? "",
      notes: cat.notes ?? "",
    });
    setShowForm(true);
  }

  async function onUpload(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Envie um arquivo de imagem.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessão expirada. Entre novamente.");
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("cat-photos").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw new Error(error.message);
      set("photo_path", path);
      toast.success("Foto carregada.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a foto.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (form.name.trim().length < 1) {
      toast.error("Informe o nome do gato.");
      return;
    }
    setBusy(true);
    try {
      await submitCat({
        data: {
          ...(form.id ? { id: form.id } : {}),
          name: form.name.trim(),
          photo_path: form.photo_path,
          breed: form.breed.trim(),
          age_years: form.age_years === "" ? null : Number(form.age_years),
          sex: form.sex,
          weight_kg: form.weight_kg === "" ? null : Number(form.weight_kg),
          neutered: form.neutered,
          energy_level: form.energy_level,
          social_people: form.social_people,
          social_cats: form.social_cats,
          lives_with_other_pets: form.lives_with_other_pets,
          hides: form.hides,
          escape_risk: form.escape_risk,
          temperament: form.temperament.trim(),
          needs_medication: form.needs_medication,
          medication_notes: form.medication_notes.trim(),
          notes: form.notes.trim(),
        },
      });
      toast.success(form.id ? "Gato atualizado." : "Gato cadastrado.");
      setForm(emptyCat);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["account"] });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o gato.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Área do tutor</p>
            <h1 className="mt-3">Meus gatos</h1>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              Uma ficha por gato ajuda o cuidador a respeitar o ritmo de cada um durante as visitas.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link to="/painel">Voltar ao painel</Link>
            </Button>
            <Button onClick={startNew}>Adicionar gato</Button>
          </div>
        </div>

        {account.isLoading && <p className="mt-10 text-muted-foreground">Carregando seus gatos...</p>}

        {account.data && (
          <section className="mt-10 space-y-4">
            {cats.length === 0 ? (
              <div className="surface-card p-7">
                <h2>Nenhum gato cadastrado</h2>
                <p className="mt-3 text-muted-foreground">
                  Cadastre o primeiro gato para poder agendar visitas.
                </p>
                <Button className="mt-5" onClick={startNew}>
                  Cadastrar meu primeiro gato
                </Button>
              </div>
            ) : (
              cats.map((cat) => (
                <article key={cat.id} className="surface-card flex flex-wrap items-start gap-5 p-6">
                  <CatPhoto path={cat.photo_path ?? ""} name={cat.name} />
                  <div className="min-w-[240px] flex-1">
                    <h2>{cat.name}</h2>
                    <p className="mt-1 text-muted-foreground">
                      {[
                        cat.breed || "Raça não informada",
                        SEX_LABEL[cat.sex ?? "nao_informado"],
                        cat.age_years != null ? `${cat.age_years} anos` : null,
                        cat.weight_kg != null ? `${cat.weight_kg} kg` : null,
                        cat.neutered ? "castrado" : "não castrado",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {[
                        ENERGY_LABEL[cat.energy_level ?? "medio"],
                        cat.social_people ? "sociável com pessoas" : "reservado com pessoas",
                        cat.social_cats ? "sociável com gatos" : "não sociável com gatos",
                        cat.lives_with_other_pets ? "convive com outros animais" : null,
                        cat.hides ? "costuma se esconder" : null,
                        cat.escape_risk ? "risco de fuga na porta" : null,
                        cat.needs_medication ? "usa medicação" : null,
                      ]
                        .filter(Boolean)
                        .map((tag) => (
                          <li
                            key={String(tag)}
                            className="caption-light rounded-full border border-border bg-secondary/50 px-3 py-1"
                          >
                            {tag}
                          </li>
                        ))}
                    </ul>
                    {cat.notes && <p className="mt-4 text-muted-foreground">{cat.notes}</p>}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(cat)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        await removeCat({ data: { id: cat.id } });
                        toast.success("Gato removido.");
                        queryClient.invalidateQueries({ queryKey: ["account"] });
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </article>
              ))
            )}
          </section>
        )}

        {showForm && (
          <section className="surface-card mt-10 p-7">
            <h2>{form.id ? `Editar ${form.name || "gato"}` : "Cadastro do gato"}</h2>
            <form className="mt-6 space-y-5" onSubmit={onSubmit}>
              <div className="flex flex-wrap items-center gap-5">
                <CatPhoto path={form.photo_path} name={form.name || "gato"} />
                <div className="space-y-2">
                  <Label htmlFor="cat_photo">Foto</Label>
                  <Input
                    id="cat_photo"
                    type="file"
                    accept="image/*"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void onUpload(file);
                    }}
                  />
                  <p className="caption-light text-muted-foreground">
                    JPG ou PNG, até 5 MB. {uploading ? "Enviando..." : ""}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cat_name">Nome</Label>
                  <Input
                    id="cat_name"
                    maxLength={60}
                    value={form.name}
                    onChange={(e) => set("name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat_breed">Raça</Label>
                  <Input
                    id="cat_breed"
                    maxLength={80}
                    placeholder="SRD, siamês, persa..."
                    value={form.breed}
                    onChange={(e) => set("breed", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat_age">Idade (anos)</Label>
                  <Input
                    id="cat_age"
                    type="number"
                    min={0}
                    max={30}
                    step="0.5"
                    value={form.age_years}
                    onChange={(e) => set("age_years", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat_weight">Peso aproximado (kg)</Label>
                  <Input
                    id="cat_weight"
                    type="number"
                    min={0}
                    max={30}
                    step="0.1"
                    value={form.weight_kg}
                    onChange={(e) => set("weight_kg", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sexo</Label>
                  <Select value={form.sex} onValueChange={(value) => set("sex", value as Sex)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(["macho", "femea", "nao_informado"] as Sex[]).map((value) => (
                        <SelectItem key={value} value={value}>
                          {SEX_LABEL[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Nível de energia</Label>
                  <Select
                    value={form.energy_level}
                    onValueChange={(value) => set("energy_level", value as Energy)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixo">Baixo</SelectItem>
                      <SelectItem value="medio">Médio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <YesNo
                  id="cat_neutered"
                  label="É castrado"
                  checked={form.neutered}
                  onChange={(value) => set("neutered", value)}
                />
                <YesNo
                  id="cat_social_people"
                  label="Sociável com pessoas"
                  checked={form.social_people}
                  onChange={(value) => set("social_people", value)}
                />
                <YesNo
                  id="cat_social_cats"
                  label="Sociável com outros gatos"
                  checked={form.social_cats}
                  onChange={(value) => set("social_cats", value)}
                />
                <YesNo
                  id="cat_other_pets"
                  label="Convive com outros animais"
                  checked={form.lives_with_other_pets}
                  onChange={(value) => set("lives_with_other_pets", value)}
                />
                <YesNo
                  id="cat_hides"
                  label="Costuma se esconder"
                  checked={form.hides}
                  onChange={(value) => set("hides", value)}
                />
                <YesNo
                  id="cat_escape"
                  label="Pode tentar fugir ao abrir a porta"
                  hint="Importante para a segurança nas visitas"
                  checked={form.escape_risk}
                  onChange={(value) => set("escape_risk", value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cat_temper">Temperamento</Label>
                <Input
                  id="cat_temper"
                  maxLength={120}
                  placeholder="Carinhoso, arisco, brincalhão..."
                  value={form.temperament}
                  onChange={(e) => set("temperament", e.target.value)}
                />
              </div>

              <YesNo
                id="cat_med"
                label="Usa medicação"
                hint="Oral ou tópica"
                checked={form.needs_medication}
                onChange={(value) => set("needs_medication", value)}
              />
              {form.needs_medication && (
                <div className="space-y-2">
                  <Label htmlFor="cat_med_notes">Detalhes da medicação</Label>
                  <Textarea
                    id="cat_med_notes"
                    maxLength={400}
                    value={form.medication_notes}
                    onChange={(e) => set("medication_notes", e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="cat_notes">Observações</Label>
                <Textarea
                  id="cat_notes"
                  maxLength={600}
                  placeholder="Ração, esconderijos, rotina, o que ele não gosta..."
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={busy || uploading}>
                  {form.id ? "Salvar alterações" : "Cadastrar gato"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setForm(emptyCat);
                    setShowForm(false);
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
