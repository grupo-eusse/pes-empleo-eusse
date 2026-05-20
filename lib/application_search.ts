const ACCENT_VARIANTS: Record<string, string[]> = {
  a: ['a', 'á'],
  e: ['e', 'é'],
  i: ['i', 'í'],
  o: ['o', 'ó'],
  u: ['u', 'ú', 'ü'],
  n: ['n', 'ñ'],
};

const MAX_SEARCH_VARIANTS = 16;

export function buildSearchVariants(search: string, limit = MAX_SEARCH_VARIANTS) {
  const trimmedSearch = search.trim();

  if (!trimmedSearch) {
    return [];
  }

  const normalizedSearch = trimmedSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const variants = new Set<string>([trimmedSearch, normalizedSearch]);
  let currentVariants = [''];

  for (const char of normalizedSearch) {
    const lowerChar = char.toLowerCase();
    const replacements = ACCENT_VARIANTS[lowerChar];

    if (!replacements) {
      currentVariants = currentVariants.map((variant) => `${variant}${char}`);
      continue;
    }

    const nextVariants: string[] = [];
    for (const variant of currentVariants) {
      for (const replacement of replacements) {
        const nextChar = char === lowerChar ? replacement : replacement.toUpperCase();
        nextVariants.push(`${variant}${nextChar}`);
        if (nextVariants.length >= limit) {
          break;
        }
      }
      if (nextVariants.length >= limit) {
        break;
      }
    }

    currentVariants = nextVariants;
  }

  for (const variant of currentVariants) {
    variants.add(variant);
    if (variants.size >= limit) {
      break;
    }
  }

  return Array.from(variants).slice(0, limit);
}

export function buildApplicationSearchFilter(search: string, jobIds: number[] = []) {
  const trimmedSearch = search.trim();

  if (!trimmedSearch) {
    return '';
  }

  const filters = buildSearchVariants(trimmedSearch).flatMap((variant) => {
    const term = `%${variant}%`;
    return [
      `applicant_full_name.ilike.${term}`,
      `applicant_id_number.ilike.${term}`,
      `applicant_phone.ilike.${term}`,
    ];
  });
  const uniqueJobIds = Array.from(new Set(jobIds)).filter(Number.isFinite);

  if (uniqueJobIds.length > 0) {
    filters.push(`job_id.in.(${uniqueJobIds.join(',')})`);
  }

  return filters.join(',');
}
