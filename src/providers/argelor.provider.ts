import axios from "axios";
import { config } from "../config";
import { ProviderName, Report } from "../types/reports";
import { IReportProvider } from "./base.provider";
import { Logger } from "../utils/logger";

export class ArgelorProvider implements IReportProvider {
  readonly name: ProviderName = "ARGELOR";
  private readonly logger: Logger;

  constructor() {
    this.logger = new Logger("ArgelorProvider");
  }

  async createReport(
    report: Report,
    forceError?: boolean,
  ): Promise<{ id: string }> {
    try {
      const payload = this.transformToProviderFormat(report);

      const response = await axios.post<{ report_id: string }>(
        `${config.ARGELOR_URL}/daily-reports`,
        payload,
        {
          timeout: 5000,
          headers: forceError ? { "x-simulate-error": "true" } : undefined,
        },
      );

      return { id: `${response.data.report_id}` };
    } catch (error) {
      this.logger.error(
        `PROVIDER: Falha ao criar relatório ${report.report_id} no Argelor`,
        error,
      );
      throw error;
    }
  }

  async updateReport(id: string, report: Report): Promise<void> {
    try {
      const payload = this.transformToProviderFormat(report);

      await axios.put(`${config.ARGELOR_URL}/daily-reports/${id}`, payload, {
        timeout: 5000,
      });
    } catch (error) {
      this.logger.error(
        `PROVIDER: Falha ao atualizar relatório ${id} no Argelor`,
        error,
      );
      throw error;
    }
  }

  transformToProviderFormat(report: Report): ArgelorReportPayload {
    return {
      site: report.provider_id,
      reportDate: report.date,
      weather: report.weather,
      summary: report.description,
      workers: report.workers,
    };
  }

  async getReport(id: string): Promise<Report> {
    const response = await axios.get(
      `${config.ARGELOR_URL}/daily-reports/${id}`,
    );
    return {
      provider_id: response.data.id,
      report_id: response.data.site,
      date: response.data.reportDate,
      weather: response.data.weather,
      description: response.data.summary,
      workers: response.data.workers,
    };
  }
}

export interface ArgelorReportPayload {
  site: string;
  reportDate: string;
  weather: string;
  summary: string;
  workers: string[];
}
