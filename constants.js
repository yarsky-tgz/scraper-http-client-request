const STAGES_CONSTANTS = {
  RAW: 0,
  CLOUDFLARE: 1,
  PROXIED_RAW: 2,
  PROXIED_CLOUDFLARE: 3,
}
const STAGE_DESCRIPTION = {
  [STAGES_CONSTANTS.RAW]: 'direct connection',
  [STAGES_CONSTANTS.CLOUDFLARE]: 'cloudflare bypasser',
  [STAGES_CONSTANTS.PROXIED_RAW]: 'proxy',
  [STAGES_CONSTANTS.PROXIED_CLOUDFLARE]: 'proxied cloudflare bypasser',
}
const RETRY_OPTIONS = {
  retries: 10,
  factor: 0,
  minTimeout: 0,
}

module.exports = {
  STAGES_CONSTANTS, STAGE_DESCRIPTION, RETRY_OPTIONS,
}
