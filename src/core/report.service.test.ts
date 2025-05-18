import { ReportService } from "./report.service";
import { IReportProvider } from "../providers/base.provider";
import { ProviderName, Report, StoredReport } from "../types/reports";
import {
  FallbackExhaustedError,
  ProviderNotFoundError,
  ReportNotFoundError,
} from "../utils/errors";
import { Logger } from "../utils/logger";
import { MappingService } from "./mapping.service";

class MockVateProvider implements IReportProvider {
  readonly name: ProviderName = "VATE";
  private shouldFail = false;

  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }

  transformToProviderFormat(report: Report) {
    return {
      obra_id: report.report_id,
      data: report.date,
      clima: report.weather,
      descricao: report.description,
      equipe: report.workers,
    };
  }

  async createReport(
    report: Report,
    forceError?: boolean,
  ): Promise<{ id: string }> {
    if (this.shouldFail || forceError) {
      throw new Error("Vate provider error");
    }
    return { id: "VATE-123" };
  }

  async updateReport(id: string, report: Report): Promise<void> {
    if (this.shouldFail) {
      throw new Error("Vate provider error");
    }
  }

  async getReport(id: string): Promise<Report> {
    if (this.shouldFail) {
      throw new Error("Vate provider error");
    }
    return {
      provider_id: "VATE",
      report_id: "OBRA-123",
      date: "2024-03-20",
      weather: "ensolarado",
      description: "Test description",
      workers: ["Worker 1", "Worker 2"],
    };
  }
}

class MockArgelorProvider implements IReportProvider {
  readonly name: ProviderName = "ARGELOR";
  private shouldFail = false;

  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
  }

  transformToProviderFormat(report: Report) {
    return {
      site: report.provider_id,
      reportDate: report.date,
      weather: report.weather,
      summary: report.description,
      workers: report.workers,
    };
  }

  async createReport(
    report: Report,
    forceError?: boolean,
  ): Promise<{ id: string }> {
    if (this.shouldFail || forceError) {
      throw new Error("Argelor provider error");
    }
    return { id: "ARGELOR-456" };
  }

  async updateReport(id: string, report: Report): Promise<void> {
    if (this.shouldFail) {
      throw new Error("Argelor provider error");
    }
  }

  async getReport(id: string): Promise<Report> {
    if (this.shouldFail) {
      throw new Error("Argelor provider error");
    }
    return {
      provider_id: "ARGELOR",
      report_id: "SITE-456",
      date: "2024-03-20",
      weather: "ensolarado",
      description: "Test description",
      workers: ["Worker 1", "Worker 2"],
    };
  }
}

describe("ReportService", () => {
  let service: ReportService;
  let vateProvider: MockVateProvider;
  let argelorProvider: MockArgelorProvider;
  let logger: Logger;
  let mappingService: MappingService;

  const mockReport: Report = {
    provider_id: "TEST",
    report_id: "OBRA-123",
    date: "2024-03-20",
    weather: "ensolarado",
    description: "Test description",
    workers: ["Worker 1", "Worker 2"],
  };

  beforeEach(() => {
    vateProvider = new MockVateProvider();
    argelorProvider = new MockArgelorProvider();
    logger = new Logger("TestLogger");
    mappingService = new MappingService();
    service = new ReportService(
      [vateProvider, argelorProvider],
      logger,
      mappingService,
    );
  });

  describe("createWithFallback", () => {
    it("should create report using first provider successfully", async () => {
      const result = await service.createWithFallback(mockReport);

      expect(result).toMatchObject({
        id: expect.any(String),
        providerName: "VATE",
      });
      expect(result.id).toBeDefined();
    });

    it("should fallback to second provider when first fails", async () => {
      vateProvider = new MockVateProvider(true);
      service = new ReportService(
        [vateProvider, argelorProvider],
        logger,
        mappingService,
      );

      const result = await service.createWithFallback(mockReport);

      expect(result).toMatchObject({
        id: expect.any(String),
        providerName: "ARGELOR",
      });
      expect(result.id).toBeDefined();
    });

    it("should throw FallbackExhaustedError when all providers fail", async () => {
      vateProvider = new MockVateProvider(true);
      argelorProvider = new MockArgelorProvider(true);
      service = new ReportService(
        [vateProvider, argelorProvider],
        logger,
        mappingService,
      );

      await expect(service.createWithFallback(mockReport)).rejects.toThrow(
        FallbackExhaustedError,
      );
    });

    it("should force error on first provider when forceError is true", async () => {
      const result = await service.createWithFallback(mockReport, true);

      expect(result).toMatchObject({
        id: expect.any(String),
        providerName: "ARGELOR",
      });
      expect(result.id).toBeDefined();
    });
  });

  describe("updateReport", () => {
    it("should update report successfully", async () => {
      const created = await service.createWithFallback(mockReport);

      const updatedReport = {
        ...mockReport,
        description: "Updated description",
      };
      await expect(
        service.updateReport(created.id, updatedReport),
      ).resolves.not.toThrow();
    });

    it("should throw ReportNotFoundError for non-existent mapping", async () => {
      await expect(
        service.updateReport("non-existent-id", mockReport),
      ).rejects.toThrow(ReportNotFoundError);
    });

    it("should throw ProviderNotFoundError when provider is not found", async () => {
      const created = await service.createWithFallback(mockReport);

      service = new ReportService([], logger, mappingService);

      await expect(
        service.updateReport(created.id, mockReport),
      ).rejects.toThrow(ProviderNotFoundError);
    });
  });

  describe("getReport", () => {
    it("should get report successfully", async () => {
      const created = await service.createWithFallback(mockReport);

      const retrieved = await service.getReport(created.id);

      expect(retrieved).toMatchObject({
        provider_id: expect.any(String),
        report_id: expect.any(String),
        date: expect.any(String),
        weather: expect.any(String),
        description: expect.any(String),
        workers: expect.any(Array),
      });
    });

    it("should throw ProviderNotFoundError for non-existent mapping", async () => {
      await expect(service.getReport("non-existent-id")).rejects.toThrow(
        ReportNotFoundError,
      );
    });

    it("should throw ProviderNotFoundError when provider is not found", async () => {
      const created = await service.createWithFallback(mockReport);

      service = new ReportService([], logger, mappingService);

      await expect(service.getReport(created.id)).rejects.toThrow(
        ProviderNotFoundError,
      );
    });
  });
});
