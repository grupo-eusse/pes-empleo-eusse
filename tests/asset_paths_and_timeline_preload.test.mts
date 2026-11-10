import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const {
  TIMELINE_PHOTOS,
  getTimelinePhotosToPreload,
  resetTimelinePhotoPreloadStateForTests,
} = await import(new URL("../ui/components/about/timeline_assets.ts", import.meta.url).href) as typeof import("../ui/components/about/timeline_assets");

const repoRoot = process.cwd();

function run() {
  resetTimelinePhotoPreloadStateForTests();

  const firstPass = getTimelinePhotosToPreload(TIMELINE_PHOTOS);
  const secondPass = getTimelinePhotosToPreload(TIMELINE_PHOTOS);

  assert.deepEqual(firstPass, TIMELINE_PHOTOS);
  assert.deepEqual(secondPass, []);

  const reducedLogoPath = path.join(repoRoot, "public", "logo-eusse-reducido.webp");
  const workerOneWebpPath = path.join(repoRoot, "public", "trabajador-1.webp");
  const workerTwoWebpPath = path.join(repoRoot, "public", "trabajador-2.webp");

  assert.equal(existsSync(reducedLogoPath), true);
  assert.equal(existsSync(workerOneWebpPath), true);
  assert.equal(existsSync(workerTwoWebpPath), true);

  const navbarSource = readFileSync(path.join(repoRoot, "ui", "components", "navbar.tsx"), "utf8");
  const footerSource = readFileSync(path.join(repoRoot, "ui", "components", "footer.tsx"), "utf8");
  const careerSectionSource = readFileSync(path.join(repoRoot, "ui", "components", "home", "career_section.tsx"), "utf8");
  const quienesSomosSource = readFileSync(path.join(repoRoot, "app", "quienes-somos", "page.tsx"), "utf8");
  const loginSource = readFileSync(path.join(repoRoot, "app", "login", "login_content.tsx"), "utf8");
  const recoverSource = readFileSync(path.join(repoRoot, "app", "recuperar", "page.tsx"), "utf8");
  const registerSource = readFileSync(path.join(repoRoot, "app", "registro", "page.tsx"), "utf8");
  const timelineSource = readFileSync(path.join(repoRoot, "ui", "components", "about", "timeline_section.tsx"), "utf8");

  assert.match(navbarSource, /\/logo-eusse-reducido\.webp/);
  assert.match(footerSource, /\/logo-eusse-reducido\.webp/);
  assert.match(careerSectionSource, /\/trabajador-1\.webp/);
  assert.match(careerSectionSource, /\/trabajador-2\.webp/);
  assert.match(quienesSomosSource, /sizes="100vw"/);
  assert.match(loginSource, /\/logo-eusse-reducido\.webp/);
  assert.match(recoverSource, /\/logo-eusse-reducido\.webp/);
  assert.match(registerSource, /\/logo-eusse-reducido\.webp/);
  assert.doesNotMatch(loginSource, /\/logo-eusse-reducido\.png/);
  assert.doesNotMatch(recoverSource, /\/logo-eusse-reducido\.png/);
  assert.doesNotMatch(registerSource, /\/logo-eusse-reducido\.png/);
  assert.doesNotMatch(timelineSource, /\bunoptimized\b/);
}

try {
  run();
  console.log("asset_paths_and_timeline_preload: ok");
} catch (error) {
  console.error("asset_paths_and_timeline_preload: failed");
  throw error;
}
