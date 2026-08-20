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

  async function handleGoogle() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      toast.error("Não foi possível entrar com o Google. Tente novamente.");
      setLoading(false);
    }
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
            <h1>Confirme seu e-mail</h1>
            <p className="mt-3 text-muted-foreground">
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
            <h1 className="mt-3">
              {mode === "signin" ? "Entrar na sua conta" : "Criar conta de tutor"}
            </h1>

            <Button
              type="button"
              variant="outline"
              className="mt-7 w-full"
              disabled={loading}
              onClick={handleGoogle}
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.6 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.5 24.5c0-1.6-.1-2.8-.4-4.1H24v8.4h12.7c-.3 2.1-1.6 5.2-4.7 7.3l7.6 5.9c4.5-4.2 6.9-10.3 6.9-17.5z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.4 28.7A14.6 14.6 0 0 1 9.6 24c0-1.6.3-3.2.8-4.7l-7.8-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.8-6.1z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.2 0 11.5-2 15.6-5.9l-7.6-5.9c-2 1.4-4.8 2.4-8 2.4-6.4 0-11.7-3.7-13.6-9.9l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
                />
              </svg>
              Continuar com Google
            </Button>

            <div className="mt-6 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="caption-light text-muted-foreground">ou com e-mail</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>

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

            <p className="mt-6 text-muted-foreground">
              {mode === "signin" ? "Ainda não tem conta?" : "Já é tutor cadastrado?"}{" "}
              <button
                type="button"
                className="font-medium text-accent underline-offset-4 hover:underline"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
              >
                {mode === "signin" ? "Criar conta" : "Entrar"}
              </button>
            </p>
            <p className="mt-2 text-muted-foreground">
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
