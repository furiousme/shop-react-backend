import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({ path: path.resolve(__dirname, ".env") });

export type ConfigProps = {
  REGION: string;
  EMAIL_FOR_SNS: string;
  EMAIL_FOR_SNS_SMALL_COUNT: string;
};

export const getConfig = (): ConfigProps => ({
  REGION: process.env.REGION || "eu-west-1",
  EMAIL_FOR_SNS: process.env.EMAIL_FOR_SNS || "",
  EMAIL_FOR_SNS_SMALL_COUNT: process.env.EMAIL_FOR_SNS_SMALL_COUNT || ""
});