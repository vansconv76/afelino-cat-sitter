import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPublicContent } from "@/lib/public.functions";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/pricing";

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
          "Visita Felina de 30, 45 e 60 minutos, administração de medicamentos e transporte veterinário sob consulta em Alphaville e Tamboré.",
      },
      { property: "og:title", content: "Serviços e preços — Afelino cat sitter" },
      {
        property: "og:description",
        content:
          "O que inclui cada duração de visita, o adicional de medicação e como funciona o transporte veterinário.",
      },
    ],
  }),
  component: Servicos,
});

const VISITS = [
  {
    key: "base_30",
    duration: "30 minutos",
    fallback: 90,
    summary:
      "Alimentação conforme orientação do tutor, troca e reposição de água, limpeza da caixa de areia, observação visual do bem-estar, interação e brincadeiras conforme a disposição do gato.",
    includes: [
      "Alimentação conforme orientação do tutor",
      "Troca e reposição de água",
      "Limpeza da caixa de areia",
      "Observação visual do bem-estar",
      "Interação e brincadeiras no ritmo do gato",
    ],
  },
  {
    key: "base_45",
    duration: "45 minutos",
    fallback: 105,
    summary: "Mesmo cuidado da visita de 30 minutos, com mais tempo de brincadeira e companhia.",
    includes: [
      "Todo o cuidado da visita de 30 minutos",
      "Mais tempo de brincadeira",
      "Mais tempo de companhia",
    ],
  },
  {
    key: "base_60",
    duration: "60 minutos",
    fallback: 120,
    summary:
      "Acompanhamento mais completo — indicado para vários gatos ou ausências mais longas do tutor.",
    includes: [
      "Acompanhamento mais completo da rotina",
      "Indicado para vários gatos",
      "Indicado para ausências mais longas do tutor",
    ],
  },
];

function Servicos() {
  const { data } = useSuspenseQuery(contentQuery);
  const priceOf = (key: string, fallback: number) => {
    const found = data.pricing.find((item) => item.key === key);
    return Number(found?.value ?? fallback);
  };
  const medicationFee = priceOf("medication_fee", 15);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-5 py-16">
        <p className="eyebrow">Serviços e preços</p>
        <h1 className="mt-3 max-w-2xl">
          Visita Felina, medicação e transporte
        </h1>
        <p className="mt-5 max-w-2xl text-muted-foreground">
          Escolha a duração que combina com a rotina do seu gato. Todas as visitas acontecem na casa
          dele, em Alphaville ou Tamboré.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {VISITS.map((visit) => (
            <article key={visit.key} className="surface-card flex flex-col p-7">
              <p className="eyebrow">Visita Felina</p>
              <h2 className="mt-2">{visit.duration}</h2>
              <p className="mt-4 price-figure">{formatBRL(priceOf(visit.key, visit.fallback))}</p>
              <p className="mt-1 text-muted-foreground">inclui até 2 gatos</p>
              <p className="mt-5 leading-relaxed text-muted-foreground">{visit.summary}</p>
              <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm">
                {visit.includes.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className="text-accent">
                      •
                    </span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <p className="mt-6 text-muted-foreground">
          A partir do 3º gato, há um adicional por visita (consulte no momento do agendamento).
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <article className="surface-card p-7">
            <p className="eyebrow">Serviço complementar</p>
            <h2 className="mt-2">Administração de medicamentos</h2>
            <p className="mt-4 price-figure">
              a partir de {formatBRL(medicationFee)}
              <span className="ml-2 align-middle text-sm font-normal text-muted-foreground">
                por visita
              </span>
            </p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              Medicação oral ou tópica, incluindo colírio, aplicada durante a visita e registrada no
              relatório.
            </p>
            <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
              <li>
                O Afelino não realiza inalação, nebulização ou procedimentos injetáveis.
              </li>
              <li>
                O profissional apenas segue as orientações do tutor e/ou veterinário — nunca
                prescreve, altera dose ou faz diagnóstico.
              </li>
            </ul>
          </article>

          <article className="surface-card p-7">
            <p className="eyebrow">Serviço complementar</p>
            <h2 className="mt-2">Transporte veterinário</h2>
            <p className="mt-4 price-figure">Sob consulta</p>
            <p className="mt-1 text-muted-foreground">sem preço fixo</p>
            <p className="mt-5 leading-relaxed text-muted-foreground">
              O valor é definido caso a caso, considerando a distância e a modalidade escolhida:
            </p>
            <ul className="mt-5 space-y-2 border-t border-border pt-5 text-sm text-muted-foreground">
              <li>Somente ida</li>
              <li>Ida e volta</li>
              <li>Com acompanhamento durante a consulta</li>
            </ul>
          </article>
        </div>

        <p className="mt-10 rounded-2xl border border-border bg-secondary/50 px-6 py-5 text-muted-foreground">
          Valores sujeitos a adicionais conforme quantidade de gatos, dia da semana e forma de
          contratação — confira o cálculo completo ao agendar.
        </p>

        <div className="mt-10">
          <Button asChild size="lg">
            <Link to="/agendar">Agendar visitas</Link>
          </Button>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
