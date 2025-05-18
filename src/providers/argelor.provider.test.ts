import { ArgelorProvider } from "./argelor.provider";
import { Report } from "../types/reports";
import axios from "axios";
import { config } from "../config";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("ArgelorProvider", () => {
  let provider: ArgelorProvider;
  const mockReport: Report = {
    provider_id: "",
    report_id: "SITE-123",
    date: "2024-03-20",
    weather: "Sunny",
    description: "Test report summary",
    workers: ["John", "Mary"],
  };

  beforeEach(() => {
    provider = new ArgelorProvider();
    jest.clearAllMocks();
  });

  describe("createReport", () => {
    it("should create a report successfully", async () => {
      const mockResponse = {
        data: {
          report_id: "mock-id-123",
          created: new Date().toISOString(),
          state: "saved",
        },
        status: 201,
        statusText: "Created",
        headers: {},
        config: {} as any,
      };

      mockedAxios.post.mockResolvedValueOnce(mockResponse);

      const result = await provider.createReport(mockReport);

      expect(result).toEqual({ id: "mock-id-123" });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${config.ARGELOR_URL}/daily-reports`,
        {
          site: mockReport.provider_id,
          reportDate: mockReport.date,
          weather: mockReport.weather,
          summary: mockReport.description,
          workers: mockReport.workers,
        },
        {
          timeout: 5000,
          headers: undefined,
        },
      );
    });

    it("should throw an error when forceError is true", async () => {
      const mockError = {
        response: {
          status: 503,
          data: { error: "Provedor indisponível" },
        },
      };
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(provider.createReport(mockReport, true)).rejects.toEqual(
        mockError,
      );

      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        {
          timeout: 5000,
          headers: { "x-simulate-error": "true" },
        },
      );
    });

    it("should handle network errors", async () => {
      const mockError = new Error("Network error");
      mockedAxios.post.mockRejectedValueOnce(mockError);

      await expect(provider.createReport(mockReport)).rejects.toEqual(
        mockError,
      );
    });
  });

  describe("updateReport", () => {
    it("should update a report successfully", async () => {
      const mockResponse = {
        data: {
          report_id: "mock-id-123",
          state: "updated",
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      };

      mockedAxios.put.mockResolvedValueOnce(mockResponse);

      await provider.updateReport("mock-id-123", mockReport);

      expect(mockedAxios.put).toHaveBeenCalledWith(
        `${config.ARGELOR_URL}/daily-reports/mock-id-123`,
        {
          site: mockReport.provider_id,
          reportDate: mockReport.date,
          weather: mockReport.weather,
          summary: mockReport.description,
          workers: mockReport.workers,
        },
        {
          timeout: 5000,
        },
      );
    });

    it("should throw an error when updating non-existent report", async () => {
      const mockError = {
        response: {
          status: 404,
          data: { error: "Relatório não encontrado" },
        },
      };
      mockedAxios.put.mockRejectedValueOnce(mockError);

      await expect(
        provider.updateReport("non-existent-id", mockReport),
      ).rejects.toEqual(mockError);
    });

    it("should handle network errors during update", async () => {
      const mockError = new Error("Network error");
      mockedAxios.put.mockRejectedValueOnce(mockError);

      await expect(
        provider.updateReport("mock-id-123", mockReport),
      ).rejects.toEqual(mockError);
    });
  });

  describe("getReport", () => {
    it("should get a report successfully", async () => {
      const mockResponse = {
        data: {
          id: "mock-id-123",
          site: mockReport.report_id,
          reportDate: mockReport.date,
          weather: mockReport.weather,
          summary: mockReport.description,
          workers: mockReport.workers,
          created: new Date().toISOString(),
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      };

      mockedAxios.get.mockResolvedValueOnce(mockResponse);

      const fetchedReport = await provider.getReport("mock-id-123");

      expect(fetchedReport).toEqual({
        provider_id: "mock-id-123",
        report_id: mockReport.report_id,
        date: mockReport.date,
        weather: mockReport.weather,
        description: mockReport.description,
        workers: mockReport.workers,
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `${config.ARGELOR_URL}/daily-reports/mock-id-123`,
      );
    });

    it("should throw an error when getting non-existent report", async () => {
      const mockError = {
        response: {
          status: 404,
          data: { error: "Relatório não encontrado" },
        },
      };
      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(provider.getReport("non-existent-id")).rejects.toEqual(
        mockError,
      );
    });

    it("should handle network errors during get", async () => {
      const mockError = new Error("Network error");
      mockedAxios.get.mockRejectedValueOnce(mockError);

      await expect(provider.getReport("mock-id-123")).rejects.toEqual(
        mockError,
      );
    });
  });

  describe("transformToProviderFormat", () => {
    it("should transform report to provider format correctly", () => {
      const transformed = provider.transformToProviderFormat(mockReport);

      expect(transformed).toEqual({
        site: mockReport.provider_id,
        reportDate: mockReport.date,
        weather: mockReport.weather,
        summary: mockReport.description,
        workers: mockReport.workers,
      });
    });
  });
});
