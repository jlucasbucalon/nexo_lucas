export function createObserver(callback, options) {
  if (typeof IntersectionObserver === 'undefined') {
    return null
  }

  return new IntersectionObserver(callback, options)
}

export { initLazyLoad, lazyLoadRoute } from './lazy.js'
