import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPublicContent } from "@/lib/public.functions";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { formatBRL, formatPct } from "@/lib/pricing";

const contentQuery = queryOptions({
  queryKey: ["public-content"],
  queryFn: () => getPublicContent(),
});

export const Route = createFileRoute("/servicos")({
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  head: () => ({
    meta: [
      { title: "Serviços e preços — Afelino cat sitter" },
      {
        name: "description",
        content:
          "Valores das visitas de 30, 45 e 60 minutos, adicionais de gatos, fim de semana e feriado, descontos de pacote e regras da pré-visita.",
      },
      { property: "og:title", content: "Serviços e preços — Afelino cat sitter" },
      {
        property: "og:description",
        content: "Tabela completa de visitas, adicionais e descontos de pacote da Afelino.",
      },
    ],
  }),
  component: Servicos,
});

function Servicos() {
  const { data } = useSuspenseQuery(contentQuery);
  const money = data.pricing.filter((p) => p.unit === "BRL");
  const pct = data.pricing.filter((p) => p.unit === "PCT");

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-4xl px-5 py-16">
        <p className="eyebrow">Serviços e preços</p>
        <h1 className="mt-3 text-4xl sm:text-5xl">Tudo aberto, antes de agendar</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          O valor da visita já inclui até dois gatos. Adicionais e descontos são aplicados
          automaticamente no agendamento, visita por visita.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          <div className="surface-card p-7">
            <h2 className="text-xl">Valores fixos</h2>
            <dl className="mt-5 space-y-3 text-sm">
              {money.map((item) => (
                <div key={item.key} className="flex items-baseline justify-between gap-4 border-b border-border/70 pb-2">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium">{formatBRL(Number(item.value))}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="surface-card p-7">
            <h2 className="text-xl">Adicionais e descontos</h2>
            <dl className="mt-5 space-y-3 text-sm">
              {pct.map((item) => (
                <div key={item.key} className="flex items-baseline justify-between gap-4 border-b border-border/70 pb-2">
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="font-medium">{formatPct(Number(item.value))}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-10 space-y-5 text-muted-foreground">
          <h2 className="text-2xl text-foreground">Regras que valem sempre</h2>
          <p>
            <strong className="text-foreground">Gatos.</strong> Até dois gatos inclusos. Do terceiro
            em diante, o adicional é cobrado por visita, por gato.
          </p>
          <p>
            <strong className="text-foreground">Dias.</strong> Dia útil não tem adicional. Sábado,
            domingo e feriado têm percentual aplicado sobre o valor daquela visita.
          </p>
          <p>
            <strong className="text-foreground">Pacotes.</strong> O desconto progressivo depende do
            número de visitas do mesmo agendamento e incide sobre o subtotal.
          </p>
          <p>
            <strong className="text-foreground">Pré-visita.</strong> Feita antes da contratação
            confirmada, é cobrada e abatida da primeira contratação. Depois do contrato confirmado, é
            gratuita.
          </p>
          <p>
            <strong className="text-foreground">Área.</strong> Atendemos exclusivamente Alphaville e
            Tamboré, sem taxa por bairro. Fora dessa área não atendemos.
          </p>
        </div>

        <div className="mt-12">
          <Button asChild size="lg">
            <Link to="/agendar">Agendar visitas</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
