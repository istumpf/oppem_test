import request from "supertest";
import express from "express";
import { v4 as uuidv4 } from "uuid";

let server: express.Application;
const PORT = 3001;

const mockReport = {
  obra_id: "123",
  data: "2024-03-20",
  clima: "Ensolarado",
  descricao: "Teste de relatório",
  equipe: ["João", "Maria"],
};

beforeAll(() => {
  server = require("./vate.mock").app;
});

describe("Vate Mock Server", () => {
  describe("POST /reports", () => {
    it("should create a new report successfully", async () => {
      const response = await request(server).post("/reports").send(mockReport);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("createdAt");
      expect(response.body.status).toBe("registrado");
    });

    it("should return 503 when x-simulate-error header is true", async () => {
      const response = await request(server)
        .post("/reports")
        .set("x-simulate-error", "true")
        .send(mockReport);

      expect(response.status).toBe(503);
      expect(response.body.error).toBe("Provedor indisponível");
    });
  });

  describe("PUT /reports/:id", () => {
    let reportId: string;

    beforeEach(async () => {
      const createResponse = await request(server)
        .post("/reports")
        .send(mockReport);
      reportId = createResponse.body.id;
    });

    it("should update an existing report successfully", async () => {
      const updatedData = {
        ...mockReport,
        clima: "Chuvoso",
        descricao: "Relatório atualizado",
      };

      const response = await request(server)
        .put(`/reports/${reportId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reportId);
      expect(response.body.status).toBe("atualizado");

      const getResponse = await request(server).get(`/reports/${reportId}`);

      expect(getResponse.body.clima).toBe("Chuvoso");
      expect(getResponse.body.descricao).toBe("Relatório atualizado");
    });

    it("should return 404 when updating non-existent report", async () => {
      const nonExistentId = uuidv4();
      const response = await request(server)
        .put(`/reports/${nonExistentId}`)
        .send(mockReport);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Relatório não encontrado");
    });
  });

  describe("GET /reports/:id", () => {
    let reportId: string;

    beforeEach(async () => {
      const createResponse = await request(server)
        .post("/reports")
        .send(mockReport);
      reportId = createResponse.body.id;
    });

    it("should get an existing report successfully", async () => {
      const response = await request(server).get(`/reports/${reportId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(reportId);
      expect(response.body.obra_id).toBe(mockReport.obra_id);
      expect(response.body.data).toBe(mockReport.data);
      expect(response.body.clima).toBe(mockReport.clima);
      expect(response.body.descricao).toBe(mockReport.descricao);
      expect(response.body.equipe).toEqual(mockReport.equipe);
      expect(response.body).toHaveProperty("createdAt");
    });

    it("should return 404 when getting non-existent report", async () => {
      const nonExistentId = uuidv4();
      const response = await request(server).get(`/reports/${nonExistentId}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBe("Relatório não encontrado");
    });
  });
});
