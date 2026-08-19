import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAdminOverview,
  updatePricing,
  setBookingStatus,
  saveTestimonial,
  deleteTestimonial,
  saveHoliday,
  deleteHoliday,
} from "@/lib/admin.functions";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BOOKING_STATUSES, STATUS_LABEL, formatBRL, formatPct } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Painel administrativo — Afelino" },
      {
        name: "description",
        content:
          "Gerencie preços, feriados, reservas e depoimentos publicados no site da Afelino cat sitter.",
      },
      { property: "og:title", content: "Painel administrativo — Afelino" },
      {
        property: "og:description",
        content: "Controle interno de preços, reservas e prova social.",
      },
    ],
  }),
  component: Admin,
});

function Admin() {
  const queryClient = useQueryClient();
  const fetchOverview = useServerFn(getAdminOverview);
  const overview = useQuery({ queryKey: ["admin-overview"], queryFn: () => fetchOverview() });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-overview"] });
    queryClient.invalidateQueries({ queryKey: ["public-content"] });
    queryClient.invalidateQueries({ queryKey: ["account"] });
  };

  const savePricing = useMutation({
    mutationFn: useServerFn(updatePricing),
    onSuccess: () => {
      toast.success("Preços atualizados.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const changeStatus = useMutation({
    mutationFn: useServerFn(setBookingStatus),
    onSuccess: () => {
      toast.success("Status atualizado.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const upsertTestimonial = useMutation({
    mutationFn: useServerFn(saveTestimonial),
    onSuccess: () => {
      toast.success("Depoimento salvo.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeTestimonial = useMutation({
    mutationFn: useServerFn(deleteTestimonial),
    onSuccess: () => {
      toast.success("Depoimento removido.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const upsertHoliday = useMutation({
    mutationFn: useServerFn(saveHoliday),
    onSuccess: () => {
      toast.success("Feriado salvo.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });
  const removeHoliday = useMutation({
    mutationFn: useServerFn(deleteHoliday),
    onSuccess: () => {
      toast.success("Feriado removido.");
      invalidate();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const [prices, setPrices] = useState<Record<string, string>>({});
  useEffect(() => {
    if (overview.data) {
      setPrices(
        Object.fromEntries(
          overview.data.pricing.map((row) => [row.key, String(Number(row.value))]),
        ),
      );
    }
  }, [overview.data]);

  const [holidayDay, setHolidayDay] = useState("");
  const [holidayName, setHolidayName] = useState("");

  const [testimonial, setTestimonial] = useState({
    id: undefined as string | undefined,
    author_name: "",
    cat_names: "",
    neighborhood: "Alphaville",
    content: "",
    rating: 5,
    published: true,
    sort_order: 0,
  });

  function resetTestimonial() {
    setTestimonial({
      id: undefined,
      author_name: "",
      cat_names: "",
      neighborhood: "Alphaville",
      content: "",
      rating: 5,
      published: true,
      sort_order: 0,
    });
  }

  if (overview.isError) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-20">
          <h1>Acesso restrito</h1>
          <p className="mt-3 text-muted-foreground">
            Esta área é exclusiva da equipe Afelino.
          </p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const data = overview.data;
  const profileName = (id: string) =>
    data?.profiles.find((p) => p.id === id)?.full_name ?? "Tutor";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
        <p className="eyebrow">Interno</p>
        <h1 className="mt-3">Painel administrativo</h1>

        {overview.isLoading && <p className="mt-10 text-muted-foreground">Carregando...</p>}

        {data && (
          <Tabs defaultValue="reservas" className="mt-10">
            <TabsList>
              <TabsTrigger value="reservas">Reservas</TabsTrigger>
              <TabsTrigger value="precos">Preços</TabsTrigger>
              <TabsTrigger value="feriados">Feriados</TabsTrigger>
              <TabsTrigger value="depoimentos">Depoimentos</TabsTrigger>
            </TabsList>

            <TabsContent value="reservas" className="mt-6 space-y-4">
              {data.bookings.length === 0 && (
                <p className="text-muted-foreground">Nenhuma reserva ainda.</p>
              )}
              {data.bookings.map((booking) => (
                <div key={booking.id} className="surface-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2>{profileName(booking.tutor_id)}</h2>
                      <p className="text-muted-foreground">
                        {booking.duration_minutes} min · {booking.cat_count} gato(s) ·{" "}
                        {booking.neighborhood} · {booking.booking_visits?.length ?? 0} visita(s)
                      </p>
                      <p className="text-muted-foreground">{booking.address}</p>
                      {booking.notes && (
                        <p className="mt-2 text-muted-foreground">{booking.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-display text-3xl">{formatBRL(Number(booking.total))}</p>
                      <Select
                        value={booking.status}
                        onValueChange={(status) =>
                          changeStatus.mutate({
                            data: { id: booking.id, status: status as (typeof BOOKING_STATUSES)[number] },
                          })
                        }
                      >
                        <SelectTrigger className="mt-2 w-56">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {BOOKING_STATUSES.map((status) => (
                            <SelectItem key={status} value={status}>
                              {STATUS_LABEL[status]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <ul className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
                    {(booking.booking_visits ?? []).map((visit) => (
                      <li key={visit.id} className="rounded-full bg-secondary px-3 py-1">
                        {visit.visit_date.split("-").reverse().join("/")} · {visit.visit_time.slice(0, 5)} ·{" "}
                        {formatBRL(Number(visit.price))}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="precos" className="mt-6">
              <div className="surface-card p-7">
                <h2>Tabela de preços</h2>
                <p className="mt-1 text-muted-foreground">
                  Valores em reais para itens BRL e em fração decimal para percentuais (0.2 = 20%).
                </p>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {data.pricing.map((row) => (
                    <div key={row.key} className="space-y-1">
                      <Label htmlFor={`price-${row.key}`}>
                        {row.label}{" "}
                        <span className="text-muted-foreground">
                          (
                          {row.unit === "PCT"
                            ? formatPct(Number(row.value))
                            : formatBRL(Number(row.value))}
                          )
                        </span>
                      </Label>
                      <Input
                        id={`price-${row.key}`}
                        type="number"
                        step={row.unit === "PCT" ? "0.01" : "1"}
                        min="0"
                        value={prices[row.key] ?? ""}
                        onChange={(e) =>
                          setPrices((prev) => ({ ...prev, [row.key]: e.target.value }))
                        }
                      />
                    </div>
                  ))}
                </div>
                <Button
                  className="mt-6"
                  disabled={savePricing.isPending}
                  onClick={() =>
                    savePricing.mutate({
                      data: {
                        entries: data.pricing.map((row) => ({
                          key: row.key,
                          value: Number(prices[row.key] ?? row.value),
                        })),
                      },
                    })
                  }
                >
                  {savePricing.isPending ? "Salvando..." : "Salvar preços"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="feriados" className="mt-6">
              <div className="surface-card p-7">
                <h2>Feriados com adicional</h2>
                <div className="mt-5 flex flex-wrap items-end gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="holiday-day">Data</Label>
                    <Input
                      id="holiday-day"
                      type="date"
                      value={holidayDay}
                      onChange={(e) => setHolidayDay(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="holiday-name">Nome</Label>
                    <Input
                      id="holiday-name"
                      value={holidayName}
                      onChange={(e) => setHolidayName(e.target.value)}
                      placeholder="Natal"
                    />
                  </div>
                  <Button
                    disabled={!holidayDay || holidayName.trim().length < 2}
                    onClick={() => {
                      upsertHoliday.mutate({
                        data: { day: holidayDay, name: holidayName.trim() },
                      });
                      setHolidayDay("");
                      setHolidayName("");
                    }}
                  >
                    Adicionar
                  </Button>
                </div>
                <ul className="mt-6 divide-y divide-border text-sm">
                  {data.holidays.map((holiday) => (
                    <li key={holiday.day} className="flex items-center justify-between py-2">
                      <span>
                        {holiday.day.split("-").reverse().join("/")} · {holiday.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeHoliday.mutate({ data: { day: holiday.day } })}
                      >
                        Remover
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="depoimentos" className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="surface-card p-7">
                <h2>
                  {testimonial.id ? "Editar depoimento" : "Novo depoimento"}
                </h2>
                <div className="mt-5 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Nome do tutor</Label>
                    <Input
                      id="author"
                      value={testimonial.author_name}
                      onChange={(e) =>
                        setTestimonial((t) => ({ ...t, author_name: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cat-names">Gatos</Label>
                    <Input
                      id="cat-names"
                      value={testimonial.cat_names}
                      onChange={(e) => setTestimonial((t) => ({ ...t, cat_names: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Região</Label>
                    <Select
                      value={testimonial.neighborhood}
                      onValueChange={(value) =>
                        setTestimonial((t) => ({ ...t, neighborhood: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Alphaville">Alphaville</SelectItem>
                        <SelectItem value="Tamboré">Tamboré</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="content">Depoimento</Label>
                    <Textarea
                      id="content"
                      rows={4}
                      value={testimonial.content}
                      onChange={(e) => setTestimonial((t) => ({ ...t, content: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rating">Nota (1-5)</Label>
                      <Input
                        id="rating"
                        type="number"
                        min="1"
                        max="5"
                        className="w-24"
                        value={testimonial.rating}
                        onChange={(e) =>
                          setTestimonial((t) => ({ ...t, rating: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sort">Ordem</Label>
                      <Input
                        id="sort"
                        type="number"
                        min="0"
                        className="w-24"
                        value={testimonial.sort_order}
                        onChange={(e) =>
                          setTestimonial((t) => ({ ...t, sort_order: Number(e.target.value) }))
                        }
                      />
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <Switch
                        id="published"
                        checked={testimonial.published}
                        onCheckedChange={(checked) =>
                          setTestimonial((t) => ({ ...t, published: checked }))
                        }
                      />
                      <Label htmlFor="published">Publicado</Label>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      disabled={upsertTestimonial.isPending}
                      onClick={() =>
                        upsertTestimonial.mutate(
                          {
                            data: {
                              ...testimonial,
                              neighborhood: testimonial.neighborhood as "Alphaville" | "Tamboré",
                            },
                          },
                          { onSuccess: resetTestimonial },
                        )
                      }
                    >
                      Salvar
                    </Button>
                    {testimonial.id && (
                      <Button variant="outline" onClick={resetTestimonial}>
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {data.testimonials.map((item) => (
                  <div key={item.id} className="surface-card p-6">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">
                          {item.author_name}{" "}
                          <span className="text-sm text-muted-foreground">
                            · {item.neighborhood} · {item.rating}/5
                          </span>
                        </p>
                        <p className="mt-2 text-muted-foreground">{item.content}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          {item.published ? "Publicado" : "Oculto"} · ordem {item.sort_order}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setTestimonial({
                              id: item.id,
                              author_name: item.author_name,
                              cat_names: item.cat_names ?? "",
                              neighborhood: item.neighborhood,
                              content: item.content,
                              rating: item.rating,
                              published: item.published,
                              sort_order: item.sort_order,
                            })
                          }
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTestimonial.mutate({ data: { id: item.id } })}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
