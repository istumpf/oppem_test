import { IReportProvider } from "./base.provider";
import { ProviderName, Report } from "../types/reports";
import axios from "axios";
import { config } from "../config";
import { Logger } from "../utils/logger";

export class VateProvider implements IReportProvider {
  readonly name: ProviderName = "VATE";
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger("VateProvider");
  }

  async createReport(
    report: Report,
    forceError: boolean = false,
  ): Promise<{ id: string }> {
    try {
      const payload = this.transformToProviderFormat(report);

      const response = await axios.post<{ id: string }>(
        `${config.VATE_URL}/reports`,
        payload,
        {
          timeout: 5000,
          headers: forceError ? { "x-simulate-error": "true" } : undefined,
        },
      );

      return { id: `${response.data.id}` };
    } catch (error) {
      this.logger.error(
        `PROVIDER: Falha ao criar relatório ${report.report_id} no Vate`,
        error,
      );
      throw error;
    }
  }

  async updateReport(id: string, report: Report): Promise<void> {
    try {
      const payload = this.transformToProviderFormat(report);

      await axios.put(`${config.VATE_URL}/reports/${id}`, payload, {
        timeout: 5000,
      });
    } catch (error) {
      this.logger.error(
        `PROVIDER: Falha ao atualizar relatório ${id} no Vate`,
        error,
      );
      throw error;
    }
  }

  transformToProviderFormat(report: Report): VateReportPayload {
    return {
      obra_id: report.report_id,
      data: report.date,
      clima: report.weather,
      descricao: report.description,
      equipe: report.workers,
    };
  }

  async getReport(id: string): Promise<Report> {
    const response = await axios.get(`${config.VATE_URL}/reports/${id}`);
    return {
      provider_id: response.data.id,
      report_id: response.data.obra_id,
      date: response.data.data,
      weather: response.data.clima,
      description: response.data.descricao,
      workers: response.data.equipe,
    };
  }
}

export interface VateReportPayload {
  obra_id: string;
  data: string;
  clima: string;
  descricao: string;
  equipe: string[];
}
