import { IReportProvider } from "../providers/base.provider";
import { Report, StoredReport } from "../types/reports";
import { FallbackExhaustedError, ProviderNotFoundError } from "../utils/errors";
import { Logger } from "../utils/logger";
import { MappingService } from "./mapping.service";

export class ReportService {
  constructor(
    private readonly providers: IReportProvider[],
    private readonly logger: Logger,
    private readonly mappingService: MappingService,
  ) {}

  async createWithFallback(
    report: Report,
    forceError: boolean = false,
  ): Promise<StoredReport> {
    for (const [index, provider] of this.providers.entries()) {
      try {
        const result = await provider.createReport(
          report,
          forceError && index === 0,
        );
        const apiId = this.mappingService.create(provider.name, result.id);

        return { id: apiId, providerName: provider.name };
      } catch (error) {
        this.logger.error(`Falha no provedor ${provider.name}`, error);
      }
    }
    throw new FallbackExhaustedError();
  }

  async updateReport(apiId: string, report: Report): Promise<StoredReport> {
    const mapping = this.mappingService.get(apiId);
    this.logger.debug("mapping", mapping as unknown as Record<string, unknown>);
    const provider = this.providers.find((p) => p.name === mapping.provider);

    if (!provider) {
      throw new ProviderNotFoundError(mapping.provider);
    }

    await provider.updateReport(mapping.providerId, report);

    return {
      id: `${apiId}`,
      providerName: provider.name,
    };
  }

  async getReport(apiId: string): Promise<Report> {
    const mapping = this.mappingService.get(apiId);

    const provider = this.providers.find((p) => p.name === mapping.provider);

    if (!provider) {
      throw new ProviderNotFoundError(mapping.provider);
    }

    return provider.getReport(mapping.providerId);
  }
}
