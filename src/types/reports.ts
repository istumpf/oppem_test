import { z } from "zod";

export type ProviderName = "VATE" | "ARGELOR";

export interface Report {
  provider_id: string;
  report_id: string;
  date: string;
  weather: string;
  description: string;
  workers: string[];
}

export interface StoredReport {
  id: string;
  providerName: ProviderName;
}

export interface ReportRequestBody {
  id: string;
  date: string;
  weather: string;
  description: string;
  workers: string[];
}

export interface ReportMapping {
  apiId: string;
  provider: ProviderName;
  providerId: string;
}

export const ReportSchema = z.object({
  id: z.string().min(3, "ID do relatório inválido"),
  weather: z.enum(["ensolarado", "chuvoso", "nublado", "tempestuoso"], {
    errorMap: () => ({
      message:
        "Condição climática deve ser: ensolarado, chuvoso, nublado ou tempestuoso",
    }),
  }),
  date: z.string().min(1, "Data inválida").date("Formato de data inválido"),
  description: z
    .string()
    .min(10, "Descrição deve conter no mínimo 10 caracteres"),
  workers: z
    .array(z.string().min(3, "Trabalhador deve conter no mínimo 3 caracteres"))
    .min(1, "Equipe deve conter no mínimo 1 trabalhador"),
});
