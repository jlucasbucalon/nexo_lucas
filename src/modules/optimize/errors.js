export {
  shouldIgnore,
  ignoreError,
  setupErrorFilter,
} from './errorFilter.js'

export const IGNORED_ERRORS = [
  'A listener indicated an asynchronous response',
  'chrome-extension',
]
