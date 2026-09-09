window.Components = window.Components || {}

window.Components['background-particles'] = (function () {
  let animationId = null
  let particles = []
  let container = null
  let width = 0
  let height = 0
  let lastTime = null
  let config = {}

  function parseNumber(value, fallback) {
    if (!value) return fallback
    const n = parseFloat(value)
    return Number.isFinite(n) ? n : fallback
  }

  function readConfig() {
    const s = getComputedStyle(container)
    const count =
      parseInt(s.getPropertyValue('--particles-count')) ||
      60
    const sizeMin = parseNumber(
      s.getPropertyValue('--particle-size-min'),
      1
    )
    const sizeMax = parseNumber(
      s.getPropertyValue('--particle-size-max'),
      4
    )
    const speed = parseNumber(
      s.getPropertyValue('--particles-speed'),
      1
    )

    return { count, sizeMin, sizeMax, speed }
  }

  function updateSize() {
    const rect = container.getBoundingClientRect()
    width =
      rect.width ||
      container.clientWidth ||
      window.innerWidth
    height =
      rect.height ||
      container.clientHeight ||
      window.innerHeight
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v))
  }

  function createParticle(size) {
    const el = document.createElement('div')
    el.className = 'particle'
    el.style.width = el.style.height = `${size}px`

    const x = Math.random() * Math.max(0, width - size)
    const y = Math.random() * Math.max(0, height - size)

    // velocities in px per second
    const baseSpeed = 10 * Math.max(0.1, config.speed)
    const vx = (Math.random() * 2 - 1) * baseSpeed
    const vy = (Math.random() * 2 - 1) * baseSpeed

    const particle = { el, x, y, vx, vy, size }
    el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`
    container.appendChild(el)
    particles.push(particle)
  }

  function animate(ts) {
    if (!lastTime) lastTime = ts
    const dt = Math.min(0.06, (ts - lastTime) / 1000) // clamp dt to avoid large jumps
    lastTime = ts

    // small noise and smoother bounces for more fluid motion
    const noiseScale = 6 * Math.max(0.1, config.speed)
    const maxSpeed = 40 * Math.max(0.1, config.speed)
    const minSpeed = 2 * Math.max(0.1, config.speed)

    for (const p of particles) {
      p.x += p.vx * dt
      p.y += p.vy * dt

      // smoother bounce with slight damping and random factor
      if (p.x <= 0) {
        p.x = 0
        p.vx =
          Math.abs(p.vx) * (0.88 + Math.random() * 0.12)
        p.vy *= 0.98
      } else if (p.x + p.size >= width) {
        p.x = Math.max(0, width - p.size)
        p.vx =
          -Math.abs(p.vx) * (0.88 + Math.random() * 0.12)
        p.vy *= 0.98
      }

      if (p.y <= 0) {
        p.y = 0
        p.vy =
          Math.abs(p.vy) * (0.88 + Math.random() * 0.12)
        p.vx *= 0.98
      } else if (p.y + p.size >= height) {
        p.y = Math.max(0, height - p.size)
        p.vy =
          -Math.abs(p.vy) * (0.88 + Math.random() * 0.12)
        p.vx *= 0.98
      }

      // gentle random acceleration for organic movement
      p.vx += (Math.random() - 0.5) * noiseScale * dt
      p.vy += (Math.random() - 0.5) * noiseScale * dt

      // regulate speed to avoid too slow or too fast
      let vmag = Math.hypot(p.vx, p.vy)
      if (vmag === 0) {
        const a = Math.random() * Math.PI * 2
        p.vx =
          Math.cos(a) *
          (minSpeed + Math.random() * minSpeed)
        p.vy =
          Math.sin(a) *
          (minSpeed + Math.random() * minSpeed)
        vmag = Math.hypot(p.vx, p.vy)
      }
      if (vmag > maxSpeed) {
        const s = maxSpeed / vmag
        p.vx *= s
        p.vy *= s
      } else if (vmag < minSpeed) {
        const s = minSpeed / vmag
        p.vx *= s
        p.vy *= s
      }

      // use fractional pixels for smooth rendering
      p.el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`
    }

    animationId = requestAnimationFrame(animate)
  }

  function startAnimation() {
    if (animationId) return
    lastTime = null
    animationId = requestAnimationFrame(animate)
  }

  function stopAnimation() {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
      lastTime = null
    }
  }

  function init() {
    container = document.querySelector(
      '.background-particles'
    )
    if (!container) return

    // avoid double-init
    if (animationId) return

    updateSize()
    config = readConfig()

    // scale particle count with viewport area (keeps density similar)
    const baseArea = 1280 * 720
    const area = Math.max(1, width * height)
    const areaFactor = Math.sqrt(area / baseArea)
    const count = Math.max(
      5,
      Math.round(config.count * areaFactor)
    )

    particles = []

    for (let i = 0; i < count; i++) {
      const size =
        Math.random() * (config.sizeMax - config.sizeMin) +
        config.sizeMin
      createParticle(size)
    }

    startAnimation()

    // responsive: keep size updated and clamp particles on resize
    if (typeof ResizeObserver !== 'undefined') {
      container._ro = new ResizeObserver(() => {
        updateSize()
        for (const p of particles) {
          p.x = clamp(p.x, 0, Math.max(0, width - p.size))
          p.y = clamp(p.y, 0, Math.max(0, height - p.size))
        }
      })
      container._ro.observe(container)
    } else {
      window.addEventListener('resize', () => {
        updateSize()
        for (const p of particles) {
          p.x = clamp(p.x, 0, Math.max(0, width - p.size))
          p.y = clamp(p.y, 0, Math.max(0, height - p.size))
        }
      })
    }

    // pause on background tab to save CPU
    const onVisibility = () => {
      if (document.hidden) stopAnimation()
      else startAnimation()
    }
    document.addEventListener(
      'visibilitychange',
      onVisibility
    )
    container._onVisibility = onVisibility
  }

  function destroy() {
    stopAnimation()
    if (container) {
      if (container._ro) {
        container._ro.disconnect()
        delete container._ro
      }
      if (container._onVisibility) {
        document.removeEventListener(
          'visibilitychange',
          container._onVisibility
        )
        delete container._onVisibility
      }
      container.innerHTML = ''
    }
    particles = []
  }

  return { init, destroy }
})()
