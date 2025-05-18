import { Response } from "express";

interface ErrorResponse {
  code: string;
  message: string;
}

export class FallbackExhaustedError extends Error {
  constructor() {
    super("Todos os provedores falharam");
    this.name = "FallbackExhaustedError";
  }
}

export class ProviderNotFoundError extends Error {
  constructor(provider: string) {
    super(`Provedor ${provider} não encontrado`);
    this.name = "ProviderNotFoundError";
  }
}

export class ReportNotFoundError extends Error {
  constructor(apiId: string) {
    super(`Relatório ${apiId} não encontrado`);
    this.name = "ReportNotFoundError";
  }
}

export const handleError = (
  res: Response,
  error: unknown,
): Response<ErrorResponse> => {
  if (error instanceof ReportNotFoundError) {
    return res.status(400).json({
      code: "NOT_FOUND",
      message: error.message,
    });
  }
  if (error instanceof FallbackExhaustedError) {
    return res.status(503).json({
      code: "SERVICE_UNAVAILABLE",
      message: error.message,
    });
  }
  return res.status(500).json({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
};
