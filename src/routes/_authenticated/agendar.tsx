import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getMyAccount, createBooking } from "@/lib/app.functions";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  calculatePrice,
  DAY_TYPE_LABEL,
  DURATIONS,
  formatBRL,
  formatPct,
  SERVICE_AREAS,
  type PricingSettings,
} from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/agendar")({
  head: () => ({
    meta: [
      { title: "Agendar visitas — Afelino" },
      {
        name: "description",
        content:
          "Monte seu pacote de visitas: duração, gatos, datas e medicação, com o preço calculado automaticamente.",
      },
      { property: "og:title", content: "Agendar visitas — Afelino" },
      {
        property: "og:description",
        content: "Escolha datas e veja o total com adicionais e descontos aplicados na hora.",
      },
    ],
  }),
  component: Agendar,
});

type VisitRow = { date: string; time: string };

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Agendar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchAccount = useServerFn(getMyAccount);
  const submitBooking = useServerFn(createBooking);
  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });

  const [duration, setDuration] = useState<30 | 45 | 60>(30);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [withMedication, setWithMedication] = useState(false);
  const [previsit, setPrevisit] = useState(false);
  const [previsitBefore, setPrevisitBefore] = useState(true);
  const [address, setAddress] = useState("");
  const [neighborhood, setNeighborhood] = useState<string>("Alphaville");
  const [notes, setNotes] = useState("");
  const [visits, setVisits] = useState<VisitRow[]>([{ date: todayISO(), time: "09:00" }]);
  const [busy, setBusy] = useState(false);

  const profile = account.data?.profile;
  useEffect(() => {
    if (profile) {
      setAddress((current) => current || (profile.address ?? ""));
      setNeighborhood(profile.neighborhood ?? "Alphaville");
    }
  }, [profile]);

  const cats = account.data?.cats ?? [];

  useEffect(() => {
    if (cats.length > 0 && selectedCats.length === 0) {
      setSelectedCats(cats.map((cat) => cat.id));
    }
  }, [cats, selectedCats.length]);

  useEffect(() => {
    const anyNeedsMedication = cats.some(
      (cat) => selectedCats.includes(cat.id) && cat.needs_medication,
    );
    if (anyNeedsMedication) setWithMedication(true);
  }, [cats, selectedCats]);

  const settings: PricingSettings = useMemo(
    () =>
      Object.fromEntries(
        (account.data?.pricing ?? []).map((row) => [row.key, Number(row.value)]),
      ),
    [account.data?.pricing],
  );
  const holidays = useMemo(
    () => new Set((account.data?.holidays ?? []).map((h) => h.day)),
    [account.data?.holidays],
  );

  const validVisits = visits.filter((visit) => visit.date && visit.time);

  const quote = useMemo(
    () =>
      calculatePrice(settings, holidays, {
        durationMinutes: duration,
        catCount: Math.max(selectedCats.length, 1),
        withMedication,
        visits: validVisits,
        previsit,
        previsitBeforeContract: previsitBefore,
      }),
    [settings, holidays, duration, selectedCats.length, withMedication, validVisits, previsit, previsitBefore],
  );

  function updateVisit(index: number, patch: Partial<VisitRow>) {
    setVisits((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (selectedCats.length === 0) {
      toast.error("Selecione ao menos um gato.");
      return;
    }
    if (validVisits.length === 0) {
      toast.error("Adicione ao menos uma visita.");
      return;
    }
    if (address.trim().length < 5) {
      toast.error("Informe o endereço da visita.");
      return;
    }
    setBusy(true);
    try {
      await submitBooking({
        data: {
          duration_minutes: duration,
          cat_ids: selectedCats,
          with_medication: withMedication,
          previsit,
          previsit_before_contract: previsit ? previsitBefore : false,
          address: address.trim(),
          neighborhood: neighborhood as "Alphaville" | "Tamboré",
          notes: notes.trim(),
          visits: validVisits,
        },
      });
      toast.success("Reserva enviada! Vamos confirmar em seguida.");
      queryClient.invalidateQueries({ queryKey: ["account"] });
      navigate({ to: "/painel" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar a reserva.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="eyebrow">Agendamento</p>
        <h1 className="mt-3 text-4xl">Monte seu pacote de visitas</h1>

        {account.isLoading && <p className="mt-8 text-muted-foreground">Carregando...</p>}

        {account.data && cats.length === 0 && (
          <div className="surface-card mt-8 p-7">
            <h2 className="text-xl">Cadastre seus gatos primeiro</h2>
            <p className="mt-2 text-muted-foreground">
              Precisamos saber quem vamos cuidar para calcular o valor das visitas.
            </p>
            <Button asChild className="mt-5">
              <Link to="/painel">Cadastrar gatos</Link>
            </Button>
          </div>
        )}

        {account.data && cats.length > 0 && (
          <form className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_1fr]" onSubmit={handleSubmit}>
            <div className="space-y-6">
              <section className="surface-card p-7">
                <h2 className="text-xl">1. Duração da visita</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {DURATIONS.map((option) => {
                    const active = duration === option;
                    return (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setDuration(option)}
                        className={`rounded-xl border px-4 py-4 text-left transition-colors ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-secondary/40 hover:border-primary/40"
                        }`}
                      >
                        <span className="block font-display text-xl">{option} min</span>
                        <span className="text-sm opacity-80">
                          {formatBRL(settings[`base_${option}`] ?? 0)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="surface-card p-7">
                <h2 className="text-xl">2. Gatos atendidos</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A visita inclui até 2 gatos. A partir do 3º há adicional por visita.
                </p>
                <ul className="mt-4 space-y-2">
                  {cats.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3"
                    >
                      <Checkbox
                        id={`cat-${cat.id}`}
                        checked={selectedCats.includes(cat.id)}
                        onCheckedChange={(checked) =>
                          setSelectedCats((prev) =>
                            checked ? [...prev, cat.id] : prev.filter((id) => id !== cat.id),
                          )
                        }
                      />
                      <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer font-normal">
                        {cat.name}
                        {cat.needs_medication && (
                          <span className="text-muted-foreground"> · usa medicação</span>
                        )}
                      </Label>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="surface-card p-7">
                <h2 className="text-xl">3. Datas e horários</h2>
                <div className="mt-4 space-y-3">
                  {visits.map((visit, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-3">
                      <div className="space-y-1">
                        <Label htmlFor={`date-${index}`}>Data</Label>
                        <Input
                          id={`date-${index}`}
                          type="date"
                          min={todayISO()}
                          value={visit.date}
                          onChange={(e) => updateVisit(index, { date: e.target.value })}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`time-${index}`}>Horário</Label>
                        <Input
                          id={`time-${index}`}
                          type="time"
                          value={visit.time}
                          onChange={(e) => updateVisit(index, { time: e.target.value })}
                        />
                      </div>
                      <span className="pb-2 text-sm text-muted-foreground">
                        {visit.date
                          ? DAY_TYPE_LABEL[
                              quote.visits[index]?.dayType ?? "util"
                            ]
                          : ""}
                      </span>
                      {visits.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setVisits((rows) => rows.filter((_, i) => i !== index))}
                        >
                          Remover
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4"
                  onClick={() =>
                    setVisits((rows) => [
                      ...rows,
                      { date: rows[rows.length - 1]?.date ?? todayISO(), time: "09:00" },
                    ])
                  }
                >
                  Adicionar visita
                </Button>
              </section>

              <section className="surface-card space-y-5 p-7">
                <h2 className="text-xl">4. Detalhes</h2>

                <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                  <div>
                    <Label htmlFor="medication">Administração de medicamentos</Label>
                    <p className="text-xs text-muted-foreground">
                      Oral ou tópico/colírio · adicional por visita
                    </p>
                  </div>
                  <Switch
                    id="medication"
                    checked={withMedication}
                    onCheckedChange={setWithMedication}
                  />
                </div>

                <div className="rounded-xl border border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="previsit">Incluir pré-visita</Label>
                      <p className="text-xs text-muted-foreground">
                        Conhecer a casa e a rotina antes das visitas
                      </p>
                    </div>
                    <Switch id="previsit" checked={previsit} onCheckedChange={setPrevisit} />
                  </div>
                  {previsit && (
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                      <div>
                        <Label htmlFor="previsit-before">Antes da contratação confirmada</Label>
                        <p className="text-xs text-muted-foreground">
                          Cobrada e abatida da primeira contratação. Depois do contrato confirmado é
                          gratuita.
                        </p>
                      </div>
                      <Switch
                        id="previsit-before"
                        checked={previsitBefore}
                        onCheckedChange={setPrevisitBefore}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Endereço da visita</Label>
                  <Input
                    id="address"
                    maxLength={200}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Região</Label>
                  <Select value={neighborhood} onValueChange={setNeighborhood}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_AREAS.map((area) => (
                        <SelectItem key={area} value={area}>
                          {area}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Atendemos somente Alphaville e Tamboré.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Observações para o cuidador</Label>
                  <Textarea
                    id="notes"
                    maxLength={800}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Onde fica a ração, chave com o porteiro, horários de remédio..."
                  />
                </div>
              </section>
            </div>

            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="surface-card p-7">
                <h2 className="text-xl">Resumo do orçamento</h2>
                <dl className="mt-5 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Visita de {duration} min</dt>
                    <dd>{formatBRL(quote.perVisitBase)}</dd>
                  </div>
                  {quote.extraCatsPerVisit > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">
                        Gatos extras ({selectedCats.length} gatos)
                      </dt>
                      <dd>+ {formatBRL(quote.extraCatsPerVisit)}</dd>
                    </div>
                  )}
                  {quote.medicationPerVisit > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Medicação por visita</dt>
                      <dd>+ {formatBRL(quote.medicationPerVisit)}</dd>
                    </div>
                  )}
                </dl>

                <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                  {quote.visits.map((visit, index) => (
                    <li key={`${visit.date}-${index}`} className="flex justify-between gap-3">
                      <span className="text-muted-foreground">
                        {visit.date.split("-").reverse().join("/")} · {visit.time} ·{" "}
                        {DAY_TYPE_LABEL[visit.dayType]}
                        {visit.surchargePct > 0 && ` (+${formatPct(visit.surchargePct)})`}
                      </span>
                      <span>{formatBRL(visit.price)}</span>
                    </li>
                  ))}
                </ul>

                <dl className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Subtotal ({quote.visits.length} visitas)</dt>
                    <dd>{formatBRL(quote.subtotal)}</dd>
                  </div>
                  {quote.discountPct > 0 && (
                    <div className="flex justify-between text-accent">
                      <dt>Desconto de pacote ({formatPct(quote.discountPct)})</dt>
                      <dd>- {formatBRL(quote.discountAmount)}</dd>
                    </div>
                  )}
                  {quote.previsitFee > 0 && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Pré-visita</dt>
                      <dd>+ {formatBRL(quote.previsitFee)}</dd>
                    </div>
                  )}
                </dl>

                <div className="mt-5 flex items-end justify-between border-t border-border pt-5">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="font-display text-3xl">{formatBRL(quote.total)}</span>
                </div>

                <Button type="submit" size="lg" className="mt-6 w-full" disabled={busy}>
                  {busy ? "Enviando..." : "Confirmar reserva"}
                </Button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Valores sujeitos a adicionais conforme quantidade de gatos, dia da semana e forma de
                  contratação. A reserva fica aguardando nossa confirmação.
                </p>
              </div>
            </aside>
          </form>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
