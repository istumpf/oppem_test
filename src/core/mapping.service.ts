import { v4 as uuidv4 } from "uuid";
import { ProviderName, ReportMapping } from "../types/reports";
import { ReportNotFoundError } from "../utils/errors";

export class MappingService {
  private mappings = new Map<string, ReportMapping>();

  create(provider: ProviderName, providerId: string): string {
    const apiId = uuidv4();
    this.mappings.set(apiId, { apiId, provider, providerId });
    return apiId;
  }

  get(apiId: string): ReportMapping {
    const mapping = this.mappings.get(apiId);
    if (!mapping) throw new ReportNotFoundError(apiId);
    return mapping;
  }
}
