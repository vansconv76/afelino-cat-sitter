import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPublicContent } from "@/lib/public.functions";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/pricing";
import heroCat from "@/assets/hero-cat.jpg";
import careVisit from "@/assets/care-visit.jpg";

const contentQuery = queryOptions({
  queryKey: ["public-content"],
  queryFn: () => getPublicContent(),
});

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(contentQuery),
  head: () => ({
    meta: [
      { title: "Afelino — Cat sitter em Alphaville e Tamboré" },
      {
        name: "description",
        content:
          "Visitas domiciliares para gatos em Alphaville e Tamboré: rotina mantida, medicação no horário e relatório com foto a cada visita.",
      },
      { property: "og:title", content: "Afelino — Cat sitter em Alphaville e Tamboré" },
      {
        property: "og:description",
        content:
          "Seu gato fica em casa, com a rotina dele preservada. Agende visitas com preço calculado na hora.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  {
    title: "Pré-visita",
    body: "Conhecemos seu gato, os cantos da casa, a comida, a caixinha e a farmacinha. Antes da contratação custa uma taxa abatida depois; com contrato confirmado, é gratuita.",
  },
  {
    title: "Visitas combinadas",
    body: "Você escolhe a duração e as datas. Em cada visita: alimentação, água fresca, caixa de areia limpa, brincadeira e carinho no ritmo dele.",
  },
  {
    title: "Relatório com foto",
    body: "Ao fim de cada visita você recebe um resumo do que ele comeu, como usou a caixinha, o humor do dia e fotos.",
  },
];

function Home() {
  const { data } = useSuspenseQuery(contentQuery);
  const price30 = data.pricing.find((p) => p.key === "base_30")?.value ?? 0;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-24">
        <div>
          <p className="eyebrow">Alphaville · Tamboré</p>
          <h1 className="mt-4 leading-[1.05]">
            Seu gato fica em casa.
            <br />
            A rotina dele continua.
          </h1>
          <p className="mt-6 max-w-md text-muted-foreground">
            A Afelino cuida de gatos no território deles: visitas domiciliares com alimentação,
            caixa de areia, medicação no horário e relatório com foto para você acompanhar de longe.
          </p>
          <div className="mt-8">
            <Button asChild size="lg">
              <Link to="/agendar">Agendar visitas</Link>
            </Button>
          </div>
          <p className="mt-4 text-muted-foreground">
            Visitas a partir de {formatBRL(Number(price30))} · inclui até 2 gatos
          </p>
        </div>

        <div className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-lift)]">
          <img
            src={heroCat}
            alt="Gato deitado no parapeito de uma janela iluminada pelo sol"
            width={1280}
            height={1600}
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      <section className="border-y border-border/70 bg-cream py-16">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow">Como funciona</p>
          <h2 className="mt-3 max-w-xl">Três etapas, nenhuma surpresa</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <div key={step.title} className="surface-card-cream p-7">
                <span className="font-display text-3xl text-accent">0{index + 1}</span>
                <h3 className="mt-3">{step.title}</h3>
                <p className="mt-3 leading-relaxed text-petrol/80">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-2">
        <div className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-soft)]">
          <img
            src={careVisit}
            alt="Cuidadora escovando um gato cinza ao lado da fonte de água e dos potes de comida"
            width={1200}
            height={912}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <p className="eyebrow">Cuidado gato-específico</p>
          <h2 className="mt-3">Gato não é cachorro pequeno</h2>
          <ul className="mt-6 space-y-4 text-muted-foreground">
            <li>
              <strong className="text-foreground">Território preservado.</strong> Sem hotel, sem
              transporte, sem estresse de mudança de ambiente.
            </li>
            <li>
              <strong className="text-foreground">Medicação com registro.</strong> Oral ou tópica,
              anotada por horário e confirmada no relatório.
            </li>
            <li>
              <strong className="text-foreground">Leitura de comportamento.</strong> Apetite, uso da
              caixinha e esconderijos observados a cada visita — sinais que aparecem antes do sintoma.
            </li>
            <li>
              <strong className="text-foreground">Área restrita e conhecida.</strong> Atendemos
              somente Alphaville e Tamboré, o que garante pontualidade real.
            </li>
          </ul>
        </div>
      </section>

      <section className="border-y border-border/70 bg-primary py-20 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-5">
          <p className="eyebrow-light">Tutores atendidos</p>
          <h2 className="mt-3 max-w-xl text-primary-foreground">
            Quem já viajou tranquilo
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {data.testimonials.map((item) => (
              <blockquote
                key={item.id}
                className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/5 p-7"
              >
                <p className="text-primary-foreground/60">
                  {"★".repeat(item.rating)}
                </p>
                <p className="mt-4 font-display leading-relaxed text-xl">“{item.content}”</p>
                <footer className="mt-5 text-sm text-primary-foreground/70">
                  {item.author_name} · {item.cat_names} · {item.neighborhood}
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="surface-card flex flex-col items-start justify-between gap-6 p-10 sm:flex-row sm:items-center">
          <div>
            <h2>Pronto para combinar as datas?</h2>
            <p className="mt-2 max-w-lg text-muted-foreground">
              Cadastre você e seus gatos, escolha as visitas e veja o valor total calculado na hora,
              com adicionais de fim de semana e descontos de pacote já aplicados.
            </p>
          </div>
          <div className="flex shrink-0 gap-3">
            <Button asChild size="lg">
              <Link to="/agendar">Agendar visitas</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/servicos">Ver preços</Link>
            </Button>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
