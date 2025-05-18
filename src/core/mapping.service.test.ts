import { MappingService } from "./mapping.service";
import { ProviderName } from "../types/reports";
import { ReportNotFoundError } from "../utils/errors";

describe("MappingService", () => {
  let service: MappingService;

  beforeEach(() => {
    service = new MappingService();
  });

  describe("create", () => {
    it("should create a mapping for VATE provider", () => {
      const provider: ProviderName = "VATE";
      const providerId = "VATE-123";

      const apiId = service.create(provider, providerId);

      expect(apiId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      const mapping = service.get(apiId);
      expect(mapping).toEqual({
        apiId,
        provider,
        providerId,
      });
    });

    it("should create a mapping for ARGELOR provider", () => {
      const provider: ProviderName = "ARGELOR";
      const providerId = "ARGELOR-456";

      const apiId = service.create(provider, providerId);

      expect(apiId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );

      const mapping = service.get(apiId);
      expect(mapping).toEqual({
        apiId,
        provider,
        providerId,
      });
    });

    it("should create unique mappings for different provider IDs", () => {
      const provider: ProviderName = "VATE";
      const providerId1 = "VATE-123";
      const providerId2 = "VATE-456";

      const apiId1 = service.create(provider, providerId1);
      const apiId2 = service.create(provider, providerId2);

      expect(apiId1).not.toBe(apiId2);

      const mapping1 = service.get(apiId1);
      const mapping2 = service.get(apiId2);

      expect(mapping1.providerId).toBe(providerId1);
      expect(mapping2.providerId).toBe(providerId2);
    });

    it("should create unique mappings for same provider ID with different providers", () => {
      const providerId = "REPORT-123";
      const apiId1 = service.create("VATE", providerId);
      const apiId2 = service.create("ARGELOR", providerId);

      expect(apiId1).not.toBe(apiId2);

      const mapping1 = service.get(apiId1);
      const mapping2 = service.get(apiId2);

      expect(mapping1.provider).toBe("VATE");
      expect(mapping2.provider).toBe("ARGELOR");
      expect(mapping1.providerId).toBe(providerId);
      expect(mapping2.providerId).toBe(providerId);
    });
  });

  describe("get", () => {
    it("should retrieve an existing mapping", () => {
      const provider: ProviderName = "VATE";
      const providerId = "VATE-123";
      const apiId = service.create(provider, providerId);

      const mapping = service.get(apiId);

      expect(mapping).toEqual({
        apiId,
        provider,
        providerId,
      });
    });

    it("should throw an error when getting non-existent mapping", () => {
      const nonExistentId = "non-existent-id";

      expect(() => service.get(nonExistentId)).toThrow(ReportNotFoundError);
    });

    it("should maintain separate mappings for different API IDs", () => {
      const provider1: ProviderName = "VATE";
      const provider2: ProviderName = "ARGELOR";
      const providerId1 = "VATE-123";
      const providerId2 = "ARGELOR-456";

      const apiId1 = service.create(provider1, providerId1);
      const apiId2 = service.create(provider2, providerId2);

      const mapping1 = service.get(apiId1);
      const mapping2 = service.get(apiId2);

      expect(mapping1.provider).toBe(provider1);
      expect(mapping1.providerId).toBe(providerId1);
      expect(mapping2.provider).toBe(provider2);
      expect(mapping2.providerId).toBe(providerId2);
    });
  });
});
