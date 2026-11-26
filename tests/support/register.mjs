import { registerHooks } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const root = new URL("../../", import.meta.url);
registerHooks({
  resolve(specifier, context, nextResolve) {
    // Test both server and client modules in Node; boundary enforcement stays in Next builds.
    if (specifier === "server-only" || specifier === "client-only" || specifier.endsWith(".css")) {
      return { url: "data:text/javascript,export {}", shortCircuit: true };
    }
    if (specifier.startsWith("@/")) specifier = new URL("src/" + specifier.slice(2), root).href;
    if ((context.parentURL?.startsWith(new URL("src/", root).href) || specifier.startsWith(new URL("src/", root).href)) && (specifier.startsWith(".") || specifier.startsWith("file:"))) {
      const url = new URL(specifier, context.parentURL);
      if (url.protocol === "file:") {
        for (const suffix of [".ts", ".tsx", "/index.ts"]) {
          if (existsSync(fileURLToPath(url) + suffix)) {
            return nextResolve(pathToFileURL(fileURLToPath(url) + suffix).href, context);
          }
        }
      }
    }
    return nextResolve(specifier, context);
  },
  load(url, context, nextLoad) {
    if ((url.startsWith(new URL("src/", root).href) || url.startsWith(new URL("next.config.", root).href)) && /\.tsx?$/.test(url)) {
      return { format: "module", shortCircuit: true, source: ts.transpileModule(readFileSync(new URL(url), "utf8"), {
        fileName: fileURLToPath(url), compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
      }).outputText };
    }
    return nextLoad(url, context);
  },
});
