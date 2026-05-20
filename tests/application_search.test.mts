import assert from "node:assert/strict";

import { buildApplicationSearchFilter } from "../lib/application_search.ts";

function run() {
  const filterWithJobs = buildApplicationSearchFilter("Lubricentro", [12, 7, 12]);

  assert.match(filterWithJobs, /applicant_full_name\.ilike\.%Lubricentro%/);
  assert.match(filterWithJobs, /applicant_id_number\.ilike\.%Lubricentro%/);
  assert.match(filterWithJobs, /applicant_phone\.ilike\.%Lubricentro%/);
  assert.match(filterWithJobs, /job_id\.in\.\(12,7\)/);
  assert.doesNotMatch(filterWithJobs, /job_id\.in\.\(12,7,12\)/);
  assert.doesNotMatch(filterWithJobs, /job\.title/);

  const filterWithoutJobs = buildApplicationSearchFilter("Lubricentro");

  assert.match(filterWithoutJobs, /applicant_full_name\.ilike\.%Lubricentro%/);
  assert.match(filterWithoutJobs, /applicant_id_number\.ilike\.%Lubricentro%/);
  assert.match(filterWithoutJobs, /applicant_phone\.ilike\.%Lubricentro%/);
  assert.doesNotMatch(filterWithoutJobs, /job_id\.in/);

  assert.equal(buildApplicationSearchFilter("   ", [1]), "");

  const joseFilter = buildApplicationSearchFilter("Jose");
  assert.match(joseFilter, /applicant_full_name\.ilike\.%Jose%/);
  assert.match(joseFilter, /applicant_full_name\.ilike\.%José%/);

  const accentedJoseFilter = buildApplicationSearchFilter("José");
  assert.match(accentedJoseFilter, /applicant_full_name\.ilike\.%José%/);
  assert.match(accentedJoseFilter, /applicant_full_name\.ilike\.%Jose%/);

  const limonFilter = buildApplicationSearchFilter("Limon");
  assert.match(limonFilter, /applicant_full_name\.ilike\.%Limon%/);
  assert.match(limonFilter, /applicant_full_name\.ilike\.%Limón%/);

  const munozFilter = buildApplicationSearchFilter("Munoz");
  assert.match(munozFilter, /applicant_full_name\.ilike\.%Munoz%/);
  assert.match(munozFilter, /applicant_full_name\.ilike\.%Muñoz%/);

  const duplicateVariantFilter = buildApplicationSearchFilter("José");
  assert.equal(
    duplicateVariantFilter.match(/applicant_full_name\.ilike\.%Jose%/g)?.length,
    1,
  );
}

try {
  run();
  console.log("application_search: ok");
} catch (error) {
  console.error("application_search: failed");
  throw error;
}
