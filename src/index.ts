import { createApp } from "./api/app";
import { Logger } from "./utils/logger";
import { config } from "./config";

const logger = new Logger("Server");

const PORT = config.PORT;
const app = createApp();

const server = app.listen(PORT, () => {
  logger.info(`Servidor principal rodando na porta ${PORT}`);
  logger.info(`Provedores configurados:`);
  logger.info(`- Vate: ${config.VATE_URL}`);
  logger.info(`- Argelor: ${config.ARGELOR_URL}`);
});

process.on("uncaughtException", (error) => {
  logger.error(`Erro não capturado: ${error.message}`, error);
  process.exit(1);
});

process.on("SIGINT", () => {
  logger.info("Encerrando servidor...");
  server.close(() => {
    logger.info("Servidor principal encerrado");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  logger.info("Recebido sinal SIGTERM");
  server.close(() => {
    logger.info("Servidor principal encerrado");
    process.exit(0);
  });
});
