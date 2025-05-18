interface AppConfig {
  VATE_URL: string;
  ARGELOR_URL: string;
  PORT: number;
}

export const config: AppConfig = {
  VATE_URL: process.env.VATE_URL || "http://localhost:3001",
  ARGELOR_URL: process.env.ARGELOR_URL || "http://localhost:3002",
  PORT: Number(process.env.PORT) || 3000,
};
