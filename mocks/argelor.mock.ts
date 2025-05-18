import express, { Request, Response, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { v4 as uuidv4 } from "uuid";

interface ArgelorReportBody {
  site: string;
  reportDate: string;
  weather: string;
  summary: string;
  workers: string[];
}

interface ReportPostResponseParams {
  report_id: string;
  created: Date;
  state: string;
}

interface ReportPutResponseParams {
  report_id: string;
  state: string;
}

type ArgelorReportData = ArgelorReportBody & {
  created: Date;
  id: string;
};

const app = express();
const PORT = 3002;

app.use(express.json());

const reports = new Map<
  string,
  ArgelorReportBody & { created: Date; id: string }
>();

app.post("/daily-reports", ((
  req: Request<ParamsDictionary, {}, ArgelorReportBody>,
  res: Response<ReportPostResponseParams>,
) => {
  if (req.headers["x-simulate-error"] === "true") {
    return res.status(503).json({ error: "Provedor indisponível" } as any);
  }

  const now = new Date();
  const reportId = uuidv4();

  reports.set(reportId, {
    site: req.body.site,
    reportDate: req.body.reportDate,
    weather: req.body.weather,
    summary: req.body.summary,
    workers: req.body.workers,
    created: now,
    id: reportId,
  });

  res.status(201).json({
    report_id: reportId,
    created: now,
    state: "saved",
  });
}) as unknown as RequestHandler);

app.put("/daily-reports/:id", ((
  req: Request<ParamsDictionary & { id: string }, {}, ArgelorReportBody>,
  res: Response<ReportPutResponseParams>,
) => {
  const id = req.params.id;
  const existing = reports.get(id);

  if (!existing) {
    return res.status(404).json({ error: "Relatório não encontrado" } as any);
  }

  reports.set(id, {
    ...existing,
    site: req.body.site,
    reportDate: req.body.reportDate,
    weather: req.body.weather,
    summary: req.body.summary,
    workers: req.body.workers,
  });
  res.json({ report_id: id, state: "updated" });
}) as unknown as RequestHandler);

app.get("/daily-reports/:id", ((
  req: Request<ParamsDictionary & { id: string }, {}, ArgelorReportBody>,
  res: Response<ArgelorReportData>,
) => {
  const id = req.params.id;
  const existing = reports.get(id);

  if (!existing) {
    return res.status(404).json({ error: "Relatório não encontrado" } as any);
  }

  res.json(existing);
}) as unknown as RequestHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Provedor Argelor mockado rodando na porta ${PORT}`);
  });
}

export { app };
