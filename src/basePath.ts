// Sub-path the static export is served from (GitHub/GitLab Pages host this
// project at /<project-name>/). Empty for dev and root-hosted builds. Next
// inlines NEXT_PUBLIC_* at build time, and it must match next.config.mjs's
// basePath, which Next does not apply to plain fetch()/worker URLs for us.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
