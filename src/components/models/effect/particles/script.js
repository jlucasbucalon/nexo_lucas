window.Components = window.Components || {}

window.Components['effect-particles'] = (function () {
  let animationId = null

  let particles = []

  let container = null

  let canvas = null

  let ctx = null

  let width = 0

  let height = 0

  let lastTime = null

  let config = {}

  let themeObserver = null

  let mouse = {
    x: 0,
    y: 0,
    active: false,
  }

  function parseNumber(value, fallback) {
    if (!value) {
      return fallback
    }

    const n = parseFloat(value)

    return Number.isFinite(n) ? n : fallback
  }

  function parseInteger(value, fallback) {
    if (!value) {
      return fallback
    }

    const n = parseInt(value, 10)

    return Number.isFinite(n) ? n : fallback
  }

  function parseBoolean(value, fallback) {
    if (!value) {
      return fallback
    }

    const normalized = String(value).trim().toLowerCase()

    if (
      normalized === 'true' ||
      normalized === '1' ||
      normalized === 'yes' ||
      normalized === 'on'
    ) {
      return true
    }

    if (
      normalized === 'false' ||
      normalized === '0' ||
      normalized === 'no' ||
      normalized === 'off'
    ) {
      return false
    }

    return fallback
  }

  function readConfig() {
    const styles = getComputedStyle(container)

    const count = parseInteger(
      styles.getPropertyValue('--particles-count'),
      40
    )

    const sizeMin = parseNumber(
      styles.getPropertyValue('--particle-size-min'),
      1
    )

    const sizeMax = parseNumber(
      styles.getPropertyValue('--particle-size-max'),
      4
    )

    const speed = parseNumber(
      styles.getPropertyValue('--particles-speed'),
      1
    )

    const opacity = parseNumber(
      styles.getPropertyValue('--particles-opacity'),
      1
    )

    const line = parseBoolean(
      styles.getPropertyValue('--particles-line'),
      false
    )

    const lineOpacity = parseNumber(
      styles.getPropertyValue('--particles-line-opacity'),
      0.2
    )

    const lineWidth = parseNumber(
      styles.getPropertyValue('--particles-line-width'),
      1
    )

    const lineDistance = parseNumber(
      styles.getPropertyValue('--particles-line-distance'),
      120
    )

    const lineBlur = parseNumber(
      styles.getPropertyValue('--particles-line-blur'),
      0
    )

    const lineColor =
      styles
        .getPropertyValue('--particles-line-color')
        .trim() || '#000'

    const animatedMouse = parseBoolean(
      styles.getPropertyValue('--particles-animated-mouse'),
      false
    )

    const mouseRadius = parseNumber(
      styles.getPropertyValue('--particles-mouse-radius'),
      120
    )

    const mouseForce = parseNumber(
      styles.getPropertyValue('--particles-mouse-force'),
      100
    )

    return {
      count: Math.max(1, count),

      sizeMin: Math.max(0.1, sizeMin),

      sizeMax: Math.max(Math.max(0.1, sizeMin), sizeMax),

      speed: Math.max(0.1, speed),

      opacity: Math.max(0, Math.min(1, opacity)),

      line,

      lineOpacity: Math.max(0, Math.min(1, lineOpacity)),

      lineWidth: Math.max(0.1, lineWidth),

      lineDistance: Math.max(1, lineDistance),

      lineBlur: Math.max(0, lineBlur),

      lineColor,

      animatedMouse,

      mouseRadius: Math.max(1, mouseRadius),

      mouseForce: Math.max(0, mouseForce),
    }
  }

  function updateThemeConfig() {
    if (!container) {
      return
    }

    const styles = getComputedStyle(container)

    const lineColor = styles
      .getPropertyValue('--particles-line-color')
      .trim()

    if (lineColor) {
      config.lineColor = lineColor
    }
  }

  function observeTheme() {
    if (typeof MutationObserver === 'undefined') {
      return
    }

    if (themeObserver) {
      themeObserver.disconnect()
    }

    themeObserver = new MutationObserver(() => {
      updateThemeConfig()
    })

    themeObserver.observe(document.documentElement, {
      attributes: true,

      attributeFilter: ['data-theme'],
    })
  }

  function updateSize() {
    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()

    width =
      rect.width ||
      container.clientWidth ||
      window.innerWidth

    height =
      rect.height ||
      container.clientHeight ||
      window.innerHeight

    if (!canvas) {
      return
    }

    const dpr = window.devicePixelRatio || 1

    canvas.width = Math.round(width * dpr)

    canvas.height = Math.round(height * dpr)

    canvas.style.width = `${width}px`

    canvas.style.height = `${height}px`

    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function createCanvas() {
    canvas = document.createElement('canvas')

    canvas.className = 'particles-lines'

    container.appendChild(canvas)

    ctx = canvas.getContext('2d')

    updateSize()
  }

  function createParticle(size) {
    const el = document.createElement('div')

    el.className = 'particle'

    el.style.width = `${size}px`

    el.style.height = `${size}px`

    el.style.opacity = config.opacity

    const x = Math.random() * Math.max(0, width - size)

    const y = Math.random() * Math.max(0, height - size)

    const baseSpeed = 10 * Math.max(0.1, config.speed)

    const vx = (Math.random() * 2 - 1) * baseSpeed

    const vy = (Math.random() * 2 - 1) * baseSpeed

    const particle = {
      el,

      x,

      y,

      vx,

      vy,

      size,
    }

    el.style.transform = `translate3d(${x}px, ${y}px, 0)`

    container.appendChild(el)

    particles.push(particle)
  }

  function applyMouseForce(particle, dt) {
    if (!config.animatedMouse) {
      return
    }

    if (!mouse.active) {
      return
    }

    const centerX = particle.x + particle.size * 0.5

    const centerY = particle.y + particle.size * 0.5

    const dx = centerX - mouse.x

    const dy = centerY - mouse.y

    const distance = Math.hypot(dx, dy)

    if (distance <= 0 || distance >= config.mouseRadius) {
      return
    }

    const influence = 1 - distance / config.mouseRadius

    const normalizedX = dx / distance

    const normalizedY = dy / distance

    const force = config.mouseForce * influence * dt

    particle.vx += normalizedX * force

    particle.vy += normalizedY * force
  }

  function drawLines() {
    if (!ctx) {
      return
    }

    ctx.clearRect(0, 0, width, height)

    if (!config.line) {
      return
    }

    const maxDistance = config.lineDistance

    const maxDistanceSquared = maxDistance * maxDistance

    ctx.lineWidth = config.lineWidth

    ctx.strokeStyle = config.lineColor

    ctx.lineCap = 'round'

    for (let i = 0; i < particles.length; i++) {
      const a = particles[i]

      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j]

        const dx = a.x - b.x

        const dy = a.y - b.y

        const distanceSquared = dx * dx + dy * dy

        if (distanceSquared > maxDistanceSquared) {
          continue
        }

        const distance = Math.sqrt(distanceSquared)

        const influence = 1 - distance / maxDistance

        const opacity = config.lineOpacity * influence

        if (opacity <= 0) {
          continue
        }

        ctx.globalAlpha = opacity

        if (config.lineBlur > 0) {
          ctx.shadowBlur = config.lineBlur

          ctx.shadowColor = config.lineColor
        } else {
          ctx.shadowBlur = 0
        }

        ctx.beginPath()

        ctx.moveTo(a.x + a.size * 0.5, a.y + a.size * 0.5)

        ctx.lineTo(b.x + b.size * 0.5, b.y + b.size * 0.5)

        ctx.stroke()
      }
    }

    ctx.globalAlpha = 1

    ctx.shadowBlur = 0
  }

  function animate(ts) {
    if (!lastTime) {
      lastTime = ts
    }

    const dt = Math.min(0.06, (ts - lastTime) / 1000)

    lastTime = ts

    const noiseScale = 6 * Math.max(0.1, config.speed)

    const maxSpeed = 40 * Math.max(0.1, config.speed)

    const minSpeed = 2 * Math.max(0.1, config.speed)

    for (const particle of particles) {
      applyMouseForce(particle, dt)

      particle.x += particle.vx * dt

      particle.y += particle.vy * dt

      if (particle.x <= 0) {
        particle.x = 0

        particle.vx =
          Math.abs(particle.vx) *
          (0.88 + Math.random() * 0.12)

        particle.vy *= 0.98
      } else if (particle.x + particle.size >= width) {
        particle.x = Math.max(0, width - particle.size)

        particle.vx =
          -Math.abs(particle.vx) *
          (0.88 + Math.random() * 0.12)

        particle.vy *= 0.98
      }

      if (particle.y <= 0) {
        particle.y = 0

        particle.vy =
          Math.abs(particle.vy) *
          (0.88 + Math.random() * 0.12)

        particle.vx *= 0.98
      } else if (particle.y + particle.size >= height) {
        particle.y = Math.max(0, height - particle.size)

        particle.vy =
          -Math.abs(particle.vy) *
          (0.88 + Math.random() * 0.12)

        particle.vx *= 0.98
      }

      particle.vx += (Math.random() - 0.5) * noiseScale * dt

      particle.vy += (Math.random() - 0.5) * noiseScale * dt

      let velocity = Math.hypot(particle.vx, particle.vy)

      if (velocity === 0) {
        const angle = Math.random() * Math.PI * 2

        const speed = minSpeed + Math.random() * minSpeed

        particle.vx = Math.cos(angle) * speed

        particle.vy = Math.sin(angle) * speed

        velocity = Math.hypot(particle.vx, particle.vy)
      }

      if (velocity > maxSpeed) {
        const scale = maxSpeed / velocity

        particle.vx *= scale

        particle.vy *= scale
      } else if (velocity < minSpeed) {
        const scale = minSpeed / velocity

        particle.vx *= scale

        particle.vy *= scale
      }

      particle.el.style.transform = `translate3d(${particle.x}px, ${particle.y}px, 0)`
    }

    drawLines()

    animationId = requestAnimationFrame(animate)
  }

  function startAnimation() {
    if (animationId) {
      return
    }

    lastTime = null

    animationId = requestAnimationFrame(animate)
  }

  function stopAnimation() {
    if (!animationId) {
      return
    }

    cancelAnimationFrame(animationId)

    animationId = null

    lastTime = null
  }

  function handleMouseMove(event) {
    if (!config.animatedMouse) {
      return
    }

    if (!container) {
      return
    }

    const rect = container.getBoundingClientRect()

    mouse.x = event.clientX - rect.left

    mouse.y = event.clientY - rect.top

    mouse.active = true
  }

  function handleMouseLeave() {
    mouse.active = false
  }

  function init() {
    container = document.querySelector('.effect-particles')

    if (!container) {
      return
    }

    if (animationId) {
      return
    }

    config = readConfig()

    updateSize()

    createCanvas()

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

    if (config.animatedMouse) {
      window.addEventListener(
        'mousemove',
        handleMouseMove,
        {
          passive: true,
        }
      )

      window.addEventListener(
        'mouseleave',
        handleMouseLeave,
        {
          passive: true,
        }
      )
    }

    if (typeof ResizeObserver !== 'undefined') {
      container._ro = new ResizeObserver(() => {
        updateSize()

        for (const particle of particles) {
          particle.x = clamp(
            particle.x,
            0,
            Math.max(0, width - particle.size)
          )

          particle.y = clamp(
            particle.y,
            0,
            Math.max(0, height - particle.size)
          )
        }
      })

      container._ro.observe(container)
    } else {
      container._onResize = () => {
        updateSize()

        for (const particle of particles) {
          particle.x = clamp(
            particle.x,
            0,
            Math.max(0, width - particle.size)
          )

          particle.y = clamp(
            particle.y,
            0,
            Math.max(0, height - particle.size)
          )
        }
      }

      window.addEventListener('resize', container._onResize)
    }

    const onVisibility = () => {
      if (document.hidden) {
        stopAnimation()
      } else {
        startAnimation()
      }
    }

    document.addEventListener(
      'visibilitychange',
      onVisibility
    )

    container._onVisibility = onVisibility

    observeTheme()

    startAnimation()
  }

  function destroy() {
    stopAnimation()

    if (!container) {
      return
    }

    if (themeObserver) {
      themeObserver.disconnect()

      themeObserver = null
    }

    if (container._ro) {
      container._ro.disconnect()

      delete container._ro
    }

    if (container._onResize) {
      window.removeEventListener(
        'resize',
        container._onResize
      )

      delete container._onResize
    }

    if (container._onVisibility) {
      document.removeEventListener(
        'visibilitychange',
        container._onVisibility
      )

      delete container._onVisibility
    }

    window.removeEventListener('mousemove', handleMouseMove)

    window.removeEventListener(
      'mouseleave',
      handleMouseLeave
    )

    container.innerHTML = ''

    particles = []

    canvas = null

    ctx = null

    container = null

    width = 0

    height = 0

    lastTime = null

    mouse.x = 0

    mouse.y = 0

    mouse.active = false
  }

  return {
    init,
    destroy,
  }
})()
