import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schemas";

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || "your-project-id" || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production";

export default defineConfig({
  name: "trade-show-studio",
  title: "Trade Show Conventions",
  projectId,
  dataset,
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
