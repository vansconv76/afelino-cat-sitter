import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SiteFooter, SiteHeader } from "@/components/site-header";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — Afelino" },
      {
        name: "description",
        content: "Acesse sua conta Afelino para cadastrar seus gatos e agendar visitas.",
      },
      { property: "og:title", content: "Entrar ou criar conta — Afelino" },
      {
        property: "og:description",
        content: "Área do tutor: cadastro de gatos, agendamentos e histórico de visitas.",
      },
    ],
  }),
  component: AuthPage,
});

const signUpSchema = z.object({
  full_name: z.string().trim().min(2, "Informe seu nome completo").max(120),
  phone: z.string().trim().min(8, "Informe um telefone válido").max(30),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres").max(72),
});

const signInSchema = signUpSchema.pick({ email: true, password: true });

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [form, setForm] = useState({ full_name: "", phone: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/painel", replace: true });
    });
  }, [navigate]);

  function update(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const parsed = signUpSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
          return;
        }
        const { data, error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: parsed.data.full_name, phone: parsed.data.phone },
          },
        });
        if (error) {
          toast.error(error.message);
          return;
        }
        if (!data.session) {
          setCheckEmail(true);
          return;
        }
        navigate({ to: "/painel" });
      } else {
        const parsed = signInSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0]?.message ?? "Dados inválidos");
          return;
        }
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) {
          toast.error("E-mail ou senha incorretos.");
          return;
        }
        navigate({ to: "/painel" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 py-16">
        {checkEmail ? (
          <div className="surface-card p-8 text-center">
            <h1 className="text-2xl">Confirme seu e-mail</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Enviamos um link de confirmação para <strong>{form.email}</strong>. Depois de
              confirmar, volte aqui e entre com sua senha.
            </p>
            <Button className="mt-6" variant="outline" onClick={() => setCheckEmail(false)}>
              Voltar
            </Button>
          </div>
        ) : (
          <div className="surface-card p-8">
            <p className="eyebrow">Área do tutor</p>
            <h1 className="mt-3 text-3xl">
              {mode === "signin" ? "Entrar na sua conta" : "Criar conta de tutor"}
            </h1>

            <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
              {mode === "signup" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nome completo</Label>
                    <Input
                      id="full_name"
                      value={form.full_name}
                      maxLength={120}
                      onChange={(e) => update("full_name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      maxLength={30}
                      onChange={(e) => update("phone", e.target.value)}
                      required
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  maxLength={255}
                  onChange={(e) => update("email", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={form.password}
                  maxLength={72}
                  onChange={(e) => update("password", e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Aguarde..." : mode === "signin" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              {mode === "signin" ? "Ainda não tem conta?" : "Já é tutor cadastrado?"}{" "}
              <button
                type="button"
                className="font-medium text-accent underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Criar conta" : "Entrar"}
              </button>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              <Link to="/servicos" className="underline-offset-4 hover:underline">
                Ver preços antes de decidir
              </Link>
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
