import express from "express";
import { VateProvider } from "../providers/vate.provider";
import { ArgelorProvider } from "../providers/argelor.provider";
import { ReportService } from "../core/report.service";
import { reportRouter } from "./routes/report.routes";
import { Logger } from "../utils/logger";
import helmet from "helmet";
import cors from "cors";
import { MappingService } from "../core/mapping.service";

export function createApp(): express.Application {
  const app = express();
  const logger = new Logger("App");

  app.use(helmet());
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  const providers = [new VateProvider(), new ArgelorProvider()]; // [Primário, Secundário]
  const mappingService = new MappingService();
  const reportService = new ReportService(providers, logger, mappingService);

  app.use("/reports", reportRouter(reportService, logger));

  app.use((req, res) => {
    res.status(404).json({
      code: "NOT_FOUND",
      message: "Endpoint não encontrado",
    });
  });

  app.use(
    (
      error: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      logger.error(`Erro não tratado: ${error.message}`, error);
      res.status(500).json({
        code: "INTERNAL_SERVER_ERROR",
        message: "Ocorreu um erro interno no servidor",
      });
    },
  );

  return app;
}
