import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyAccount, saveProfile, cancelBooking } from "@/lib/app.functions";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatBRL, SERVICE_AREAS, STATUS_LABEL } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/painel")({
  head: () => ({
    meta: [
      { title: "Meu painel — Afelino" },
      { name: "description", content: "Seus dados de tutor, seus gatos e suas reservas de visitas." },
      { property: "og:title", content: "Meu painel — Afelino" },
      { property: "og:description", content: "Gerencie tutor, gatos e reservas na Afelino." },
    ],
  }),
  component: Painel,
});


function Painel() {
  const queryClient = useQueryClient();
  const fetchAccount = useServerFn(getMyAccount);
  const submitProfile = useServerFn(saveProfile);
  const cancel = useServerFn(cancelBooking);

  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });

  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    address: "",
    neighborhood: "Alphaville",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const data = account.data?.profile;
    if (data) {
      setProfile({
        full_name: data.full_name ?? "",
        phone: data.phone ?? "",
        address: data.address ?? "",
        neighborhood: data.neighborhood ?? "Alphaville",
      });
    }
  }, [account.data?.profile]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["account"] });

  async function onSaveProfile(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await submitProfile({
        data: {
          full_name: profile.full_name.trim(),
          phone: profile.phone.trim(),
          address: profile.address.trim(),
          neighborhood: profile.neighborhood as "Alphaville" | "Tamboré",
        },
      });
      toast.success("Dados do tutor salvos.");
      refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar.");
    } finally {
      setBusy(false);
    }
  }


  const cats = account.data?.cats ?? [];
  const bookings = account.data?.bookings ?? [];

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Área do tutor</p>
            <h1 className="mt-3">Meu painel</h1>
          </div>
          <div className="flex gap-3">
            {account.data?.isAdmin && (
              <Button asChild variant="outline">
                <Link to="/admin">Painel administrativo</Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/agendar">Agendar visitas</Link>
            </Button>
          </div>
        </div>

        {account.isLoading && <p className="mt-10 text-muted-foreground">Carregando seus dados...</p>}

        {account.data && (
          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_1.15fr]">
            <section className="surface-card p-7">
              <h2>Dados do tutor</h2>
              <form className="mt-5 space-y-4" onSubmit={onSaveProfile}>
                <div className="space-y-2">
                  <Label htmlFor="full_name">Nome completo</Label>
                  <Input
                    id="full_name"
                    maxLength={120}
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input
                    id="phone"
                    maxLength={30}
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço (rua, número, condomínio)</Label>
                  <Input
                    id="address"
                    maxLength={200}
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Região</Label>
                  <Select
                    value={profile.neighborhood}
                    onValueChange={(value) => setProfile({ ...profile, neighborhood: value })}
                  >
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
                </div>
                <Button type="submit" disabled={busy}>
                  Salvar dados
                </Button>
              </form>
            </section>

            <section className="surface-card p-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2>Meus gatos</h2>
                <Button asChild variant="outline" size="sm">
                  <Link to="/gatos">Gerenciar gatos</Link>
                </Button>
              </div>
              {cats.length === 0 ? (
                <>
                  <p className="mt-3 text-muted-foreground">
                    Nenhum gato cadastrado ainda. Cadastre ao menos um para agendar visitas.
                  </p>
                  <Button asChild className="mt-5">
                    <Link to="/gatos">Cadastrar gato</Link>
                  </Button>
                </>
              ) : (
                <ul className="mt-5 space-y-3">
                  {cats.map((cat) => (
                    <li
                      key={cat.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3"
                    >
                      <div>
                        <p className="font-medium">
                          {cat.name}
                          {cat.age_years != null && (
                            <span className="text-muted-foreground"> · {cat.age_years} anos</span>
                          )}
                        </p>
                        <p className="text-muted-foreground">
                          {cat.breed || cat.temperament || "Ficha básica"}
                          {cat.needs_medication ? " · usa medicação" : ""}
                        </p>
                      </div>
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/gatos">Editar</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}

        {account.data && (
          <section className="mt-12">
            <h2>Minhas reservas</h2>
            {bookings.length === 0 ? (
              <p className="mt-3 text-muted-foreground">
                Você ainda não tem reservas.{" "}
                <Link to="/agendar" className="text-accent underline-offset-4 hover:underline">
                  Agendar a primeira
                </Link>
                .
              </p>
            ) : (
              <div className="mt-5 space-y-4">
                {bookings.map((booking) => (
                  <article key={booking.id} className="surface-card p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="eyebrow">{STATUS_LABEL[booking.status] ?? booking.status}</p>
                        <h3 className="mt-2">
                          {booking.booking_visits?.length ?? 0} visita(s) de{" "}
                          {booking.duration_minutes} min · {booking.cat_count} gato(s)
                        </h3>
                        <p className="mt-1 text-muted-foreground">
                          {booking.address} · {booking.neighborhood}
                          {booking.with_medication ? " · com medicação" : ""}
                          {booking.previsit ? " · com pré-visita" : ""}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="price-figure">{formatBRL(Number(booking.total))}</p>
                        {Number(booking.discount_amount) > 0 && (
                          <p className="text-sm text-muted-foreground">
                            desconto de {formatBRL(Number(booking.discount_amount))}
                          </p>
                        )}
                      </div>
                    </div>

                    <ul className="mt-4 flex flex-wrap gap-2 text-xs">
                      {[...(booking.booking_visits ?? [])]
                        .sort((a, b) => a.visit_date.localeCompare(b.visit_date))
                        .map((visit) => (
                          <li
                            key={visit.id}
                            className="rounded-full border border-border bg-secondary/50 px-3 py-1"
                          >
                            {visit.visit_date.split("-").reverse().join("/")} ·{" "}
                            {String(visit.visit_time).slice(0, 5)} · {formatBRL(Number(visit.price))}
                          </li>
                        ))}
                    </ul>

                    {booking.notes && (
                      <p className="mt-4 text-muted-foreground">{booking.notes}</p>
                    )}

                    {booking.status !== "cancelada" && booking.status !== "concluida" && (
                      <Button
                        className="mt-5"
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          await cancel({ data: { id: booking.id } });
                          toast.success("Reserva cancelada.");
                          refresh();
                        }}
                      >
                        Cancelar reserva
                      </Button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
