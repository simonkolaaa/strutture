/** Canonical URL of the running app — origin + Vite base. */
export function siteUrl(): string {
  return `${window.location.origin}${import.meta.env.BASE_URL}`
}

/** Bare host + path, no scheme — for showing in a caption or on an image. */
export const SITE_LABEL = 'vocabe.federicodiluca.com'
