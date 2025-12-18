import { build as esbuild } from "esbuild";
import { rm } from "fs/promises";
import path from "path";

// Externalize native/compiled modules that cannot be bundled
// These will be loaded from node_modules at runtime
const externalModules = [
  // Native modules requiring compilation
  "bcrypt",
  // pg has native bindings for better performance
  "pg-native",
  // Optional native buffer utilities
  "bufferutil",
  "utf-8-validate",
];

async function buildServer() {
  await rm("dist", { recursive: true, force: true });

  console.log("Building server for production (Render deployment)...");

  const result = await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    target: "node18",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externalModules,
    logLevel: "info",
    // Use tsconfig for path resolution
    tsconfig: "tsconfig.json",
    // Resolve @shared alias explicitly
    alias: {
      "@shared": path.resolve(process.cwd(), "shared"),
    },
    // Handle Node.js polyfills
    packages: "bundle",
  });

  if (result.errors.length > 0) {
    console.error("Build errors:", result.errors);
    process.exit(1);
  }

  console.log("Server build completed successfully!");
  console.log("Output: dist/index.cjs");
  console.log("Start with: node dist/index.cjs");
}

buildServer().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
