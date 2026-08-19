import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getMyAccount, saveProfile, saveCat, deleteCat, cancelBooking } from "@/lib/app.functions";
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
  component: Painel;
});

function Painel() {
  return null;
}
