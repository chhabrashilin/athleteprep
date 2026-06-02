/**
 * Converts a team name into a URL-safe slug.
 * lowercase, hyphens for spaces, unsafe chars removed.
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")  // strip diacritics
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Generates a slug with a short random suffix to resolve collisions.
 * e.g. "wisconsin-cricket-club" → "wisconsin-cricket-club-7f3a"
 */
export function generateSlugWithSuffix(name: string): string {
  const base = generateSlug(name);
  const suffix = crypto.getRandomValues(new Uint32Array(1))[0].toString(36).slice(0, 4);
  return `${base}-${suffix}`;
}
