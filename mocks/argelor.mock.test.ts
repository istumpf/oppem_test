import request from "supertest";
import express from "express";
import { v4 as uuidv4 } from "uuid";

let server: express.Application;
const PORT = 3002;

const mockReport = {
  site: "Site A",
  reportDate: "2024-03-20",
  weather: "Sunny",
  summary: "Test report summary",
  workers: ["John", "Mary"],
};

beforeAll(() => {
  server = require("./argelor.mock").app;
});

describe("Argelor Mock Server", () => {
  describe("POST /daily-reports", () => {
    it("should create a new report successfully", async () => {
      const response = await request(server)
        .post("/daily-reports")
        .send(mockReport);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("report_id");
      expect(response.body).toHaveProperty("created");
      expect(response.body.state).toBe("saved");
    });

    it("should return 503 when x-simulate-error header is true", async () => {
      const response = await request(server)
        .post("/daily-reports")
        .set("x-simulate-error", "true")
        .send(mockReport);

      expect(response.status).toBe(503);
      expect(response.body.error).toBe("Provedor indisponível");
    });
  });

  describe("PUT /daily-reports/:id", () => {
    let reportId: string;

    beforeEach(async () => {
      const createResponse = await request(server)
        .post("/daily-reports")
        .send(mockReport);
      reportId = createResponse.body.report_id;
    });

    it("should update an existing report successfully", async () => {
      const updatedData = {
        ...mockReport,
        weather: "Rainy",
        summary: "Updated report summary",
      };

      const response = await request(server)
        .put(`/daily-reports/${reportId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.report_id).toBe(reportId);
      expect(response.body.state).toBe("updated");

      const getResponse = await request(server).get(
        `/daily-reports/${reportId}`,
      );

      expect(getResponse.body.weather).toBe("Rainy");
      expect(getResponse.body.summary).toBe("Updated report summary");
    });

    it("should return 404 when updating non-existent report", async () => {
      const nonExistentId = uuidv4();
      const response = await request(server)
        .put(`/daily-reports/${nonExistentId}`)
        .send(mockReport);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Relatório não encontrado");
    });
  });

  describe("GET /daily-reports/:id", () => {
    let reportId: string;

    beforeEach(async () => {
      const createResponse = await request(server)
        .post("/daily-reports")
        .send(mockReport);
      reportId = createResponse.body.report_id;
    });

    it("should get an existing report successfully", async () => {
      const response = await request(server).get(`/daily-reports/${reportId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reportId);
      expect(response.body.site).toBe(mockReport.site);
      expect(response.body.reportDate).toBe(mockReport.reportDate);
      expect(response.body.weather).toBe(mockReport.weather);
      expect(response.body.summary).toBe(mockReport.summary);
      expect(response.body.workers).toEqual(mockReport.workers);
      expect(response.body).toHaveProperty("created");
    });

    it("should return 404 when getting non-existent report", async () => {
      const nonExistentId = uuidv4();
      const response = await request(server).get(
        `/daily-reports/${nonExistentId}`,
      );

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Relatório não encontrado");
    });
  });
});
