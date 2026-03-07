#!/usr/bin/env node

/**
 * Build Lambda zip files from upstream aws-samples/document-translation.
 *
 * Clones the upstream repo (if not already cached) and builds Lambda zips
 * from infrastructure/lambda/. Output goes to ./lambda/.
 *
 * Upstream: https://github.com/aws-samples/document-translation (v3.4.0)
 * License: MIT-0
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const UPSTREAM_REPO = "https://github.com/aws-samples/document-translation.git";
const UPSTREAM_TAG = "v3.4.0";
const UPSTREAM_CACHE = path.resolve(__dirname, "../.upstream");
const UPSTREAM_LAMBDA_DIR = path.join(UPSTREAM_CACHE, "infrastructure", "lambda");
const PATCHES_DIR = path.resolve(__dirname, "../lambda-patches");
const OUTPUT_DIR = path.resolve(__dirname, "../lambda");

// Lambda functions we need, mapped to their upstream directory names
const LAMBDAS = [
  "appsyncMutationRequest",
  "decodeS3Key",
  "docToHtml",
  "htmlToMd",
  "invokeBedrock",
  "invokeBedrockSaveToS3",
  "parseTerminologies",
  "unmarshallDdb",
  "utilRegexReplace",
  "utilSplit",
  "utilTrim",
];

function ensureUpstream() {
  if (fs.existsSync(UPSTREAM_LAMBDA_DIR)) {
    console.log("  Using cached upstream clone.");
    return;
  }
  console.log(`  Cloning ${UPSTREAM_REPO} @ ${UPSTREAM_TAG}...`);
  execSync(
    `git clone --depth 1 --branch "${UPSTREAM_TAG}" "${UPSTREAM_REPO}" "${UPSTREAM_CACHE}"`,
    { stdio: "pipe" }
  );
}

function buildLambda(name) {
  const srcDir = path.join(UPSTREAM_LAMBDA_DIR, name);
  if (!fs.existsSync(srcDir)) {
    console.error(`  WARN: ${name} not found at ${srcDir}, skipping`);
    return false;
  }

  const tmpDir = path.join(OUTPUT_DIR, `.tmp-${name}`);
  const zipPath = path.join(OUTPUT_DIR, `${name}.zip`);

  // Clean tmp
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true });
  }
  fs.mkdirSync(tmpDir, { recursive: true });

  // Copy source files
  execSync(`cp -r "${srcDir}/"* "${tmpDir}/"`);

  // Apply patches (override upstream source with local patches)
  const patchDir = path.join(PATCHES_DIR, name);
  if (fs.existsSync(patchDir)) {
    execSync(`cp -r "${patchDir}/"* "${tmpDir}/"`);
    console.log(`  Applied patch for ${name}`);
  }

  // Install dependencies if package.json exists
  if (fs.existsSync(path.join(tmpDir, "package.json"))) {
    execSync("npm install --omit=dev --ignore-scripts", {
      cwd: tmpDir,
      stdio: "pipe",
    });
  }

  // Compile TypeScript to JavaScript using esbuild (bundle into single index.js)
  const tsEntry = path.join(tmpDir, "index.ts");
  if (fs.existsSync(tsEntry)) {
    execSync(
      `npx esbuild "${tsEntry}" --bundle --platform=node --target=node20 --outfile="${path.join(tmpDir, "index.js")}" --external:@aws-sdk/*`,
      { cwd: tmpDir, stdio: "pipe" }
    );
    // Remove the .ts source — Lambda only needs the bundled .js
    fs.unlinkSync(tsEntry);
    // Remove node_modules, package.json, package-lock.json — everything is bundled
    // except @aws-sdk (provided by Lambda runtime). Removing package.json avoids
    // "type":"module" conflicts with the CJS bundle output.
    for (const f of ["node_modules", "package.json", "package-lock.json"]) {
      const p = path.join(tmpDir, f);
      if (fs.existsSync(p)) fs.rmSync(p, { recursive: true });
    }
  }

  // Create zip
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }
  execSync(`cd "${tmpDir}" && zip -qr "${zipPath}" .`);

  // Clean tmp
  fs.rmSync(tmpDir, { recursive: true });

  const size = fs.statSync(zipPath).size;
  console.log(`  ${name}.zip (${(size / 1024).toFixed(1)}KB)`);
  return true;
}

// Main
console.log("Building Lambda zips from upstream document-translation...");
ensureUpstream();
console.log(`  Source: ${UPSTREAM_LAMBDA_DIR}`);
console.log(`  Output: ${OUTPUT_DIR}`);

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let built = 0;
for (const name of LAMBDAS) {
  if (buildLambda(name)) built++;
}

console.log(`\nBuilt ${built}/${LAMBDAS.length} Lambda zips.`);
