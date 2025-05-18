import request from "supertest";
import express from "express";
import { reportRouter } from "./report.routes";
import { ReportService } from "../../core/report.service";
import { Logger } from "../../utils/logger";
import {
  Report,
  ProviderName,
  StoredReport,
  ReportMapping,
} from "../../types/reports";
import { IReportProvider } from "../../providers/base.provider";
import { MappingService } from "../../core/mapping.service";
import { VateReportPayload } from "../../providers/vate.provider";

const mockLogger = new Logger("test");

jest.spyOn(mockLogger, "error").mockImplementation(() => {});

const mockProvider: jest.Mocked<IReportProvider> = {
  name: "VATE" as ProviderName,
  createReport: jest.fn(),
  updateReport: jest.fn(),
  getReport: jest.fn(),
  transformToProviderFormat: jest.fn().mockImplementation(
    (report: Report): VateReportPayload => ({
      obra_id: report.report_id,
      data: report.date,
      clima: report.weather,
      descricao: report.description,
      equipe: report.workers,
    }),
  ),
};

class MockMappingService extends MappingService {
  private mockMappings = new Map<string, ReportMapping>();

  constructor() {
    super();
    (this as any).mappings = this.mockMappings;
  }

  create = jest
    .fn()
    .mockImplementation(
      (provider: ProviderName, providerId: string): string => {
        const apiId = "test-api-id";
        this.mockMappings.set(apiId, { apiId, provider, providerId });
        return apiId;
      },
    );

  get = jest.fn().mockImplementation((apiId: string): ReportMapping => {
    const mapping = this.mockMappings.get(apiId);
    if (!mapping) throw new Error("Report not found");
    return mapping;
  });
}

const mockMappingService = new MockMappingService();

const mockReportService = new ReportService(
  [mockProvider],
  mockLogger,
  mockMappingService,
);

describe("Report Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    jest.clearAllMocks();

    app = express();
    app.use(express.json());
    app.use("/reports", reportRouter(mockReportService, mockLogger));
  });

  describe("POST /reports", () => {
    const validReportData = {
      id: "test-report-123",
      date: "2024-03-20",
      weather: "ensolarado",
      description: "Descrição do relatório com mais de 10 caracteres",
      workers: ["João", "Maria"],
    };

    it("should create a report successfully", async () => {
      const mockCreatedReport: StoredReport = {
        id: "test-report-123",
        providerName: "VATE",
      };

      mockProvider.createReport.mockResolvedValue({ id: "provider-123" });
      mockMappingService.create.mockReturnValue("test-report-123");

      const response = await request(app)
        .post("/reports")
        .send(validReportData)
        .expect(201);

      expect(response.body).toEqual({
        id: "test-report-123",
        status: "created",
        provider: "VATE",
      });
      expect(mockProvider.createReport).toHaveBeenCalledWith(
        expect.objectContaining({
          report_id: validReportData.id,
          date: validReportData.date,
          weather: validReportData.weather,
          description: validReportData.description,
          workers: validReportData.workers,
        }),
        false,
      );
    });

    it("should return 400 for invalid report data", async () => {
      const invalidReportData = {
        id: "te",
        date: "2024-03-20",
        weather: "solzão",
        description: "Desc",
        workers: ["Jo"],
      };

      const response = await request(app)
        .post("/reports")
        .send(invalidReportData)
        .expect(400);

      const expectedErrors = [
        {
          path: "body.id",
          message: "ID do relatório inválido",
        },
        {
          path: "body.weather",
          message:
            "Condição climática deve ser: ensolarado, chuvoso, nublado ou tempestuoso",
        },
        {
          path: "body.description",
          message: "Descrição deve conter no mínimo 10 caracteres",
        },
        {
          path: "body.workers.0",
          message: "Trabalhador deve conter no mínimo 3 caracteres",
        },
      ];

      expect(response.body).toEqual({
        status: "error",
        message: "Dados inválidos",
        errors: expect.arrayContaining(expectedErrors),
      });
      expect(response.body.errors).toHaveLength(expectedErrors.length);
      expect(mockProvider.createReport).not.toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      mockProvider.createReport.mockRejectedValue(new Error("Service error"));

      const response = await request(app)
        .post("/reports")
        .send(validReportData)
        .expect(503);

      expect(response.body).toEqual({
        code: "SERVICE_UNAVAILABLE",
        message: "Todos os provedores falharam",
      });
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe("PUT /reports/:id", () => {
    const validUpdateData = {
      id: "test-obra-123",
      date: "2024-03-20",
      weather: "chuvoso",
      description: "Descrição do relatório com mais de 10 caracteres",
      workers: ["João", "Maria", "Pedro"],
    };

    it("should update a report successfully", async () => {
      mockMappingService.get.mockReturnValue({
        apiId: "9b4b381f-0c13-47f6-a285-3b26ceeea013",
        provider: "VATE",
        providerId: "provider-123",
      });

      const response = await request(app)
        .put("/reports/9b4b381f-0c13-47f6-a285-3b26ceeea013")
        .send(validUpdateData)
        .expect(200);

      expect(response.body).toEqual({
        id: "9b4b381f-0c13-47f6-a285-3b26ceeea013",
        status: "updated",
        message: "Relatório atualizado com sucesso",
      });
      expect(mockProvider.updateReport).toHaveBeenCalledWith(
        "provider-123",
        expect.objectContaining({
          report_id: validUpdateData.id,
          date: validUpdateData.date,
          weather: validUpdateData.weather,
          description: validUpdateData.description,
          workers: validUpdateData.workers,
        }),
      );
    });

    it("should return 400 for invalid update data", async () => {
      const invalidUpdateData = {
        id: "te",
        date: "2024-03-20",
        weather: "solzão",
        description: "Desc",
        workers: ["Jo"],
      };

      const response = await request(app)
        .put("/reports/9b4b381f-0c13-47f6-a285-3b26ceeea013")
        .send(invalidUpdateData)
        .expect(400);

      const expectedErrors = [
        {
          path: "body.id",
          message: "ID do relatório inválido",
        },
        {
          path: "body.weather",
          message:
            "Condição climática deve ser: ensolarado, chuvoso, nublado ou tempestuoso",
        },
        {
          path: "body.description",
          message: "Descrição deve conter no mínimo 10 caracteres",
        },
        {
          path: "body.workers.0",
          message: "Trabalhador deve conter no mínimo 3 caracteres",
        },
      ];

      expect(response.body).toEqual({
        status: "error",
        message: "Dados inválidos",
        errors: expect.arrayContaining(expectedErrors),
      });
      expect(response.body.errors).toHaveLength(expectedErrors.length);
      expect(mockProvider.updateReport).not.toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      mockMappingService.get.mockReturnValue({
        apiId: "test-report-123",
        provider: "VATE",
        providerId: "provider-123",
      });
      mockProvider.updateReport.mockRejectedValue(new Error("Service error"));

      const response = await request(app)
        .put("/reports/test-report-123")
        .send(validUpdateData)
        .expect(500);
    });
  });

  describe("GET /reports/:id", () => {
    const mockReport: Report = {
      provider_id: "provider-123",
      report_id: "test-obra-123",
      date: "2024-03-20",
      weather: "ensolarado",
      description: "Descrição do relatório com mais de 10 caracteres",
      workers: ["João", "Maria"],
    };

    it("should get a report successfully", async () => {
      mockMappingService.get.mockReturnValue({
        apiId: "test-report-123",
        provider: "VATE",
        providerId: "provider-123",
      });
      mockProvider.getReport.mockResolvedValue(mockReport);

      const response = await request(app)
        .get("/reports/test-report-123")
        .expect(200);

      expect(response.body).toEqual({
        id: "test-report-123",
        provider_id: mockReport.provider_id,
        report_id: mockReport.report_id,
        date: mockReport.date,
        weather: mockReport.weather,
        description: mockReport.description,
        workers: mockReport.workers,
      });
      expect(mockProvider.getReport).toHaveBeenCalledWith("provider-123");
    });

    it("should return 400 for invalid report id", async () => {
      await request(app).get("/reports/").expect(404);

      expect(mockProvider.getReport).not.toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      mockMappingService.get.mockReturnValue({
        apiId: "test-report-123",
        provider: "VATE",
        providerId: "provider-123",
      });
      mockProvider.getReport.mockRejectedValue(new Error("Service error"));

      const response = await request(app)
        .get("/reports/test-report-123")
        .expect(500);

      expect(response.body).toEqual({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      });
    });
  });
});
