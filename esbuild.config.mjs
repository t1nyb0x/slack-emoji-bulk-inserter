import * as esbuild from "esbuild";

const isWatch = process.argv.includes("--watch");

const buildOptions = {
  entryPoints: ["src/content.ts"],
  bundle: true,
  outfile: "dist/content.js",
  format: "iife",
  target: "chrome120",
  minify: !isWatch,
  sourcemap: isWatch,
};

if (isWatch) {
  const context = await esbuild.context(buildOptions);
  await context.watch();
  console.log("Watching for changes...");
} else {
  await esbuild.build(buildOptions);
  console.log("Build complete.");
}
