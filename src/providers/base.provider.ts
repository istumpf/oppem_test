import { ProviderName, Report } from "../types/reports";
import { VateReportPayload } from "./vate.provider";
import { ArgelorReportPayload } from "./argelor.provider";

export interface IReportProvider {
  name: ProviderName;
  createReport(report: Report, forceError?: boolean): Promise<{ id: string }>;
  updateReport(id: string, report: Report): Promise<void>;
  getReport(id: string): Promise<Report>;
  transformToProviderFormat(
    report: Report,
  ): VateReportPayload | ArgelorReportPayload;
}
