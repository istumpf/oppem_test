import express, { Request, Response, RequestHandler } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { v4 as uuidv4 } from "uuid";

interface VateReportBody {
  obra_id: string;
  data: string;
  clima: string;
  descricao: string;
  equipe: string[];
}

interface VateReportCreateResponse {
  id: string;
  createdAt: Date;
  status: string;
}

interface VateReportUpdateResponse {
  id: string;
  status: string;
}

type VateReportData = VateReportBody & {
  createdAt: Date;
  id: string;
};

const app = express();
const PORT = 3001;

app.use(express.json());

const reports = new Map<
  string,
  VateReportBody & { createdAt: Date; id: string }
>();

app.post("/reports", ((
  req: Request<ParamsDictionary, {}, VateReportBody>,
  res: Response<VateReportCreateResponse>,
) => {
  if (req.headers["x-simulate-error"] === "true") {
    return res.status(503).json({ error: "Provedor indisponível" } as any);
  }

  const now = new Date();
  const reportId = uuidv4();

  reports.set(reportId, {
    obra_id: req.body.obra_id,
    data: req.body.data,
    clima: req.body.clima,
    descricao: req.body.descricao,
    equipe: req.body.equipe,
    createdAt: now,
    id: reportId,
  });

  res.status(201).json({
    id: reportId,
    createdAt: now,
    status: "registrado",
  });
}) as unknown as RequestHandler);

app.put("/reports/:id", ((
  req: Request<ParamsDictionary & { id: string }, {}, VateReportBody>,
  res: Response<VateReportUpdateResponse>,
) => {
  const id = req.params.id;
  const existing = reports.get(id);

  if (!existing) {
    return res.status(404).json({ error: "Relatório não encontrado" } as any);
  }

  reports.set(id, { ...existing, ...req.body });
  res.json({ id, status: "atualizado" });
}) as unknown as RequestHandler);

app.get("/reports/:id", ((
  req: Request<ParamsDictionary & { id: string }, {}, VateReportBody>,
  res: Response<VateReportData>,
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
    console.log(`Provedor Vate mockado rodando na porta ${PORT}`);
  });
}

export { app };
