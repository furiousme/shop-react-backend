import * as dotenv from "dotenv";
import path =  require("node:path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

export type ConfigProps = {
  REGION: string;
  EMAIL_FOR_SNS: string;
};

export const getConfig = (): ConfigProps => ({
  REGION: process.env.REGION || "eu-west-1",
  EMAIL_FOR_SNS: process.env.EMAIL_FOR_SNS || ""
});