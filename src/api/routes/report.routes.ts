import express, { Router, Request, Response } from "express";
import { ReportService } from "../../core/report.service";
import { Report, ProviderName, ReportSchema } from "../../types/reports";
import { handleError, ReportNotFoundError } from "../../utils/errors";
import { ReportRequestBody } from "../../types/reports";
import { validateRequest } from "../middleware/validation.middleware";
import { z } from "zod";
import { Logger } from "../../utils/logger";

export function reportRouter(
  reportService: ReportService,
  logger: Logger,
): Router {
  const router = Router();

  const createReportSchema = z.object({
    body: ReportSchema,
  });

  const updateReportSchema = z.object({
    params: z.object({
      id: z.string().min(1, "ID inválido"),
    }),
    body: ReportSchema,
  });

  const getReportSchema = z.object({
    params: z.object({
      id: z.string().min(1, "ID inválido"),
    }),
  });

  router.post(
    "/",
    validateRequest(createReportSchema),
    async (req: Request<{}, {}, ReportRequestBody>, res: Response) => {
      const forceError = req.headers["x-force-error"] === "true";
      try {
        const report: Report = {
          provider_id: "",
          report_id: req.body.id,
          date: req.body.date,
          weather: req.body.weather,
          description: req.body.description,
          workers: req.body.workers,
        };

        const createdReport = await reportService.createWithFallback(
          report,
          forceError,
        );
        logger.info(
          `Relatório ${createdReport.id} criado com sucesso no provedor ${createdReport.providerName}`,
        );
        res.status(201).json({
          id: createdReport.id,
          status: "created",
          provider: createdReport.providerName,
        });
      } catch (error) {
        logger.error("Erro ao criar relatório", error);
        handleError(res, error);
      }
    },
  );

  router.put(
    "/:id",
    validateRequest(updateReportSchema),
    async (
      req: Request<{ id: string }, {}, ReportRequestBody>,
      res: Response,
    ) => {
      try {
        const id = req.params.id;
        const report: Report = {
          provider_id: "",
          report_id: req.body.id,
          date: req.body.date,
          weather: req.body.weather,
          description: req.body.description,
          workers: req.body.workers,
        };

        const updatedReport = await reportService.updateReport(id, report);
        logger.info(
          `Relatório ${id} atualizado com sucesso no provedor ${updatedReport.providerName}`,
        );
        res.json({
          id: id,
          status: "updated",
          message: "Relatório atualizado com sucesso",
        });
      } catch (error) {
        handleError(res, error);
      }
    },
  );

  router.get(
    "/:id",
    validateRequest(getReportSchema),
    async (req: Request<{ id: string }>, res: Response) => {
      try {
        const id = req.params.id;
        const report = await reportService.getReport(id);

        res.json({
          id: id,
          provider_id: report.provider_id,
          report_id: report.report_id,
          date: report.date,
          weather: report.weather,
          description: report.description,
          workers: report.workers,
        });
      } catch (error) {
        handleError(res, error);
      }
    },
  );

  return router;
}
