// ==================================================
// NEXO USER
// MARAUDERS MAP
// ENGINE EFFECT
// ==================================================

window.Components = window.Components || {}

// ==================================================
// DESTROY PREVIOUS INSTANCE
// ==================================================

if (
  window.Components['effect-marauders'] &&
  typeof window.Components['effect-marauders'].destroy ===
    'function'
) {
  try {
    window.Components['effect-marauders'].destroy()
  } catch (error) {
    console.warn(
      '[Marauders] Falha ao destruir instância anterior:',
      error
    )
  }
}

// ==================================================
// ENGINE
// ==================================================

window.Components['effect-marauders'] = (function () {
  // ==================================================
  // STATE
  // ==================================================

  let container = null
  let canvas = null
  let ctx = null
  let ribbonLayer = null
  let animationId = null
  let resizeObserver = null
  let mutationObserver = null
  let width = 0
  let height = 0
  let dpr = 1
  let config = {}

  let architecture = []
  let corridors = []
  let rooms = []
  let towers = []
  let stairs = []
  let symbols = []
  let routes = []
  let characters = []
  let particles = []
  let footprints = []

  let initialized = false

  // ==================================================
  // OFFICIAL CHARACTERS
  // ==================================================

  const MARAUDERS_CHARACTERS = [
    {
      id: 'harry-potter',
      name: 'Harry Potter',
    },
    {
      id: 'albus-dumbledore',
      name: 'Albus Dumbledore',
    },
    {
      id: 'severus-snape',
      name: 'Severus Snape',
    },
    {
      id: 'minerva-mcgonagall',
      name: 'Minerva McGonagall',
    },
    {
      id: 'hermione-granger',
      name: 'Hermione Granger',
    },
    {
      id: 'ron-weasley',
      name: 'Ron Weasley',
    },
    {
      id: 'O-bucalones',
      name: 'O Bucalonês',
    },
  ]

  // ==================================================
  // HELPERS
  // ==================================================

  function random(min, max) {
    return Math.random() * (max - min) + min
  }

  function seededRandom(seed) {
    const x = Math.sin(seed * 12.9898) * 43758.5453
    return x - Math.floor(x)
  }

  function number(value, fallback) {
    const result = parseFloat(value)
    return Number.isFinite(result) ? result : fallback
  }

  function integer(value, fallback) {
    const result = parseInt(value, 10)
    return Number.isFinite(result) ? result : fallback
  }

  function boolean(value, fallback) {
    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {
      return fallback
    }

    const normalized = String(value).trim().toLowerCase()

    return normalized === 'true' || normalized === '1'
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function distance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y)
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount
  }

  function lerpPoint(a, b, amount) {
    return {
      x: lerp(a.x, b.x, amount),
      y: lerp(a.y, b.y, amount),
    }
  }

  // ==================================================
  // RIBBON STYLE
  // ==================================================

  function ensureRibbonStyles() {
    if (
      document.getElementById(
        'marauders-ribbon-engine-style'
      )
    ) {
      return
    }

    const style = document.createElement('style')

    style.id = 'marauders-ribbon-engine-style'

    style.textContent = `
      /* ==================================================
         MARAUDERS RIBBON SYSTEM
         ================================================== */

      .marauders-map__ribbons {
        position: absolute !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        pointer-events: none !important;
        overflow: visible !important;
        z-index: 20 !important;
      }

      .marauders-map__ribbon {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: max-content !important;
        height: auto !important;
        display: block !important;
        padding: 0 !important;
        margin: 0 !important;
        pointer-events: none !important;
        transform-origin: center center !important;
        rotate: 0deg !important;
        will-change: transform, opacity !important;
        white-space: nowrap !important;
        isolation: isolate !important;
      }

      .marauders-map__ribbon::after {
        content: "" !important;
        position: absolute !important;
        left: 50% !important;
        top: 100% !important;
        width: 1px !important;
        height: 13px !important;
        transform: translateX(-50%) !important;
        background: linear-gradient(
          to bottom,
          rgba(30,30,30,0.68),
          rgba(30,30,30,0)
        ) !important;
        opacity: 0.65 !important;
        pointer-events: none !important;
      }

      .marauders-map__ribbon::before {
        content: "" !important;
        position: absolute !important;
        left: 50% !important;
        top: calc(100% + 10px) !important;
        width: 4px !important;
        height: 4px !important;
        transform: translateX(-50%) rotate(45deg) !important;
        border: 1px solid rgba(30,30,30,0.65) !important;
        background: rgba(238,232,214,0.88) !important;
        box-sizing: border-box !important;
        z-index: -5 !important;
      }

      .marauders-map__ribbon-inner {
        position: relative !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        box-sizing: border-box !important;
        max-width: 200px !important;
        height: 32px !important;
        padding: 0 12px !important;
        background: linear-gradient(
          to bottom,
          rgba(245,241,226,0.94),
          rgba(229,222,202,0.90)
        ) !important;
        border-top: 1px solid rgba(30,30,30,0.62) !important;
        border-bottom: 1px solid rgba(30,30,30,0.62) !important;
        box-shadow: 0 2px 5px rgba(0,0,0,0.14), inset 0 1px 0 rgba(255,255,255,0.55) !important;
        transform: skewX(-1deg) !important;
        white-space: nowrap !important;
      }

      .marauders-map__ribbon-inner::before {
        content: "" !important;
        position: absolute !important;
        left: 7px !important;
        right: 7px !important;
        top: 4px !important;
        bottom: 4px !important;
        border-top: 1px solid rgba(30,30,30,0.25) !important;
        border-bottom: 1px solid rgba(30,30,30,0.25) !important;
        pointer-events: none !important;
      }

      .marauders-map__ribbon-line::after {
        content: "" !important;
        position: absolute !important;
        top: 50% !important;
        width: 5px !important;
        height: 5px !important;
        transform: translateY(-50%) rotate(45deg) !important;
        border: 1px solid rgba(0,0,0,1) !important;
        background: rgba(0,0,0,1) !important;
        box-sizing: border-box !important;
      }

      .marauders-map__ribbon-line--left::after {
        right: 10px !important;
      }

      .marauders-map__ribbon-line--right::after {
        left: 10px !important;
      }

      .marauders-map__ribbon-name {
        position: relative !important;
        display: block !important;
        z-index: -2 !important;
        color: rgba(25,25,25,0.94) !important;
        font-family: Georgia, "Times New Roman", serif !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        line-height: 1 !important;
        letter-spacing: 0.095em !important;
        text-transform: uppercase !important;
        text-align: center !important;
        white-space: nowrap !important;
        text-shadow: 0 1px 0 rgba(255,255,255,0.55) !important;
        transform: skewX(1deg) !important;
      }

      .marauders-map__ribbon-tail {
        position: absolute !important;
        top: 0 !important;
        width: 15px !important;
        height: 32px !important;
        background: rgba(224,216,195,0.90) !important;
        border-top: 1px solid rgba(30,30,30,0.58) !important;
        border-bottom: 1px solid rgba(30,30,30,0.58) !important;
        box-sizing: border-box !important;
        z-index: -1 !important;
      }

      .marauders-map__ribbon-tail--left {
        right: calc(100% - 5px) !important;
        clip-path: polygon(100% 0, 0 50%, 100% 100%) !important;
        border-left: 1px solid rgba(30,30,30,0.40) !important;
      }

      .marauders-map__ribbon-tail--right {
        left: calc(100% - 5px) !important;
        clip-path: polygon(0 0, 100% 50%, 0 100%) !important;
        border-right: 1px solid rgba(30,30,30,0.40) !important;
      }

      .marauders-map__ribbon[data-long-name="true"] .marauders-map__ribbon-inner {
        min-width: 190px !important;
      }

      .marauders-map__ribbon[data-long-name="true"] .marauders-map__ribbon-name {
        font-size: 9px !important;
        letter-spacing: 0.075em !important;
      }

      .marauders-map__ribbon.is-horizontal {
        rotate: 0deg !important;
      }

      .marauders-map__ribbons.is-hidden {
        opacity: 0 !important;
      }
    `

    document.head.appendChild(style)
  }

  // ==================================================
  // CONFIG
  // ==================================================

  function readConfig() {
    const styles = getComputedStyle(
      container || document.body
    )

    return {
      ink:
        styles.getPropertyValue('--marauders-ink').trim() ||
        '#1e1e1e',

      lineOpacity: number(
        styles.getPropertyValue('--marauders-line-opacity'),
        0.24
      ),

      architectureOpacity: number(
        styles.getPropertyValue(
          '--marauders-architecture-opacity'
        ),
        0.28
      ),

      detailOpacity: number(
        styles.getPropertyValue(
          '--marauders-detail-opacity'
        ),
        0.34
      ),

      routeOpacity: number(
        styles.getPropertyValue(
          '--marauders-route-opacity'
        ),
        0.55
      ),

      markerOpacity: number(
        styles.getPropertyValue(
          '--marauders-marker-opacity'
        ),
        0.34
      ),

      footstepOpacity: number(
        styles.getPropertyValue(
          '--marauders-footstep-opacity'
        ),
        0.72
      ),

      particleOpacity: number(
        styles.getPropertyValue(
          '--marauders-particle-opacity'
        ),
        0.14
      ),

      ribbonOpacity: number(
        styles.getPropertyValue(
          '--marauders-ribbon-opacity'
        ),
        0.88
      ),

      ribbonTextOpacity: number(
        styles.getPropertyValue(
          '--marauders-ribbon-text-opacity'
        ),
        0.94
      ),

      ribbonOffsetY: number(
        styles.getPropertyValue(
          '--marauders-ribbon-offset-y'
        ),
        -27
      ),

      ribbonWave: number(
        styles.getPropertyValue('--marauders-ribbon-wave'),
        2
      ),

      lineWidth: number(
        styles.getPropertyValue('--marauders-line-width'),
        0.72
      ),

      architectureWidth: number(
        styles.getPropertyValue(
          '--marauders-architecture-width'
        ),
        0.82
      ),

      routeWidth: number(
        styles.getPropertyValue('--marauders-route-width'),
        0.95
      ),

      roomCount: integer(
        styles.getPropertyValue('--marauders-room-count'),
        34
      ),

      corridorCount: integer(
        styles.getPropertyValue(
          '--marauders-corridor-count'
        ),
        18
      ),

      towerCount: integer(
        styles.getPropertyValue('--marauders-tower-count'),
        8
      ),

      stairCount: integer(
        styles.getPropertyValue('--marauders-stair-count'),
        12
      ),

      symbolCount: integer(
        styles.getPropertyValue('--marauders-symbol-count'),
        36
      ),

      routeCount: integer(
        styles.getPropertyValue('--marauders-route-count'),
        MARAUDERS_CHARACTERS.length
      ),

      particleCount: integer(
        styles.getPropertyValue(
          '--marauders-particle-count'
        ),
        42
      ),

      footstepCount: integer(
        styles.getPropertyValue(
          '--marauders-footstep-count'
        ),
        180
      ),

      speed: number(
        styles.getPropertyValue('--marauders-speed'),
        0.00006
      ),

      pulseSpeed: number(
        styles.getPropertyValue('--marauders-pulse-speed'),
        0.001
      ),

      animated: boolean(
        styles.getPropertyValue('--marauders-animation'),
        true
      ),

      footsteps: boolean(
        styles.getPropertyValue('--marauders-footsteps'),
        true
      ),

      ribbons: boolean(
        styles.getPropertyValue('--marauders-ribbons'),
        true
      ),
    }
  }

  // ==================================================
  // SIZE
  // ==================================================

  function updateSize() {
    if (!container || !canvas || !ctx) {
      return
    }

    const rect = container.getBoundingClientRect()

    width = rect.width || window.innerWidth
    height = rect.height || window.innerHeight

    dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.width = Math.max(1, Math.round(width * dpr))
    canvas.height = Math.max(1, Math.round(height * dpr))

    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    if (ribbonLayer) {
      ribbonLayer.style.width = `${width}px`
      ribbonLayer.style.height = `${height}px`
    }
  }

  // ==================================================
  // POINT PATH
  // ==================================================

  function createOrganicPath(
    seed,
    count,
    startX,
    startY,
    horizontal = true
  ) {
    const points = []

    let x =
      startX !== undefined
        ? startX
        : seededRandom(seed) * width

    let y =
      startY !== undefined
        ? startY
        : seededRandom(seed + 1) * height

    points.push({ x, y })

    for (let i = 1; i < count; i++) {
      const drift = (seededRandom(seed + i * 17) - 0.5) * 80

      if (horizontal) {
        x += (width / count) * random(0.55, 1.25)
        y += drift
      } else {
        y += (height / count) * random(0.55, 1.25)
        x += drift
      }

      x = clamp(x, -width * 0.08, width * 1.08)
      y = clamp(y, -height * 0.08, height * 1.08)

      points.push({ x, y })
    }

    return points
  }

  // ==================================================
  // ROOM GENERATOR
  // ==================================================

  function createRoom(seed, x, y, w, h, rotation) {
    const corners = []

    const hw = w / 2
    const hh = h / 2

    const raw = [
      { x: -hw, y: -hh },
      { x: hw, y: -hh },
      { x: hw, y: hh },
      { x: -hw, y: hh },
    ]

    const cos = Math.cos(rotation)
    const sin = Math.sin(rotation)

    raw.forEach((point) => {
      corners.push({
        x: x + point.x * cos - point.y * sin,
        y: y + point.x * sin + point.y * cos,
      })
    })

    return {
      corners,
      x,
      y,
      w,
      h,
      rotation,
      seed,
    }
  }

  // ==================================================
  // ROOM INTERIOR
  // ==================================================

  function createRoomDetails(room) {
    const details = []

    const count =
      2 + Math.floor(seededRandom(room.seed) * 5)

    for (let i = 0; i < count; i++) {
      const angle =
        seededRandom(room.seed + i * 23) * Math.PI * 2

      const radius = random(
        5,
        Math.min(room.w, room.h) * 0.28
      )

      details.push({
        x: room.x + Math.cos(angle) * radius,
        y: room.y + Math.sin(angle) * radius,
        r: random(3, 9),
      })
    }

    return details
  }

  // ==================================================
  // CREATE CHARACTER
  // ==================================================

  function createCharacter(
    characterDefinition,
    route,
    index
  ) {
    return {
      id: characterDefinition.id,
      name: characterDefinition.name,
      routeIndex: index,
      route,
      progress: route.progress,
      phase: route.phase,
      speed: route.speed,
      ribbon: null,
      lastFootstep: -1,
    }
  }

  // ==================================================
  // MAP CREATION
  // ==================================================

  function createMap() {
    architecture = []
    corridors = []
    rooms = []
    towers = []
    stairs = []
    symbols = []
    routes = []
    characters = []
    particles = []
    footprints = []

    for (let i = 0; i < config.roomCount; i++) {
      const x =
        width * (0.08 + seededRandom(i * 41 + 2) * 0.84)
      const y =
        height * (0.08 + seededRandom(i * 53 + 7) * 0.84)
      const w = random(55, Math.max(90, width * 0.13))
      const h = random(38, Math.max(70, height * 0.12))
      const rotation =
        (seededRandom(i * 67 + 3) - 0.5) * 0.35

      const room = createRoom(i, x, y, w, h, rotation)
      room.details = createRoomDetails(room)

      rooms.push(room)
      architecture.push(room)
    }

    for (let i = 0; i < config.corridorCount; i++) {
      const horizontal = i % 2 === 0
      const path = createOrganicPath(
        1000 + i * 31,
        7 + (i % 4),
        horizontal ? -width * 0.08 : random(0, width),
        horizontal ? random(0, height) : -height * 0.08,
        horizontal
      )

      corridors.push(path)
      architecture.push({
        type: 'corridor',
        points: path,
      })
    }

    for (let i = 0; i < config.towerCount; i++) {
      towers.push({
        x:
          width * (0.06 + seededRandom(i * 81 + 11) * 0.88),
        y:
          height *
          (0.06 + seededRandom(i * 97 + 13) * 0.88),
        radius: random(18, 42),
        phase: seededRandom(i * 33) * Math.PI * 2,
      })
    }

    for (let i = 0; i < config.stairCount; i++) {
      stairs.push({
        x: random(width * 0.08, width * 0.92),
        y: random(height * 0.08, height * 0.92),
        width: random(28, 58),
        height: random(45, 95),
        rotation: random(-Math.PI, Math.PI),
      })
    }

    for (let i = 0; i < config.symbolCount; i++) {
      symbols.push({
        x: random(width * 0.03, width * 0.97),
        y: random(height * 0.03, height * 0.97),
        type: i % 5,
        size: random(3, 10),
        rotation: random(0, Math.PI * 2),
        phase: random(0, Math.PI * 2),
      })
    }

    const characterTotal = Math.min(
      Math.max(0, config.routeCount),
      MARAUDERS_CHARACTERS.length
    )

    for (let i = 0; i < characterTotal; i++) {
      const characterDefinition = MARAUDERS_CHARACTERS[i]
      let points
      const source = corridors[i]

      if (source && source.length > 3) {
        points = source.map((point, pointIndex) => ({
          x: point.x + Math.sin(pointIndex * 1.7 + i) * 18,
          y: point.y + Math.cos(pointIndex * 1.3 + i) * 14,
        }))
      } else {
        points = createOrganicPath(5000 + i * 71, 10)
      }

      const route = {
        id: `route-${characterDefinition.id}`,
        characterId: characterDefinition.id,
        points,
        progress: random(0, 1),
        speed: config.speed * random(8, 18),
        phase: random(0, Math.PI * 2),
        lastFootstep: -1,
        ribbon: null,
      }

      routes.push(route)

      const character = createCharacter(
        characterDefinition,
        route,
        i
      )

      characters.push(character)
    }

    for (let i = 0; i < config.particleCount; i++) {
      particles.push({
        x: random(0, width),
        y: random(0, height),
        vx: random(-0.08, 0.08),
        vy: random(-0.08, 0.08),
        radius: random(0.4, 1.4),
        phase: random(0, Math.PI * 2),
      })
    }

    createRibbons()
  }

  // ==================================================
  // RIBBONS
  // ==================================================

  function createRibbons() {
    if (!ribbonLayer) {
      return
    }

    ribbonLayer.innerHTML = ''

    const createdCharacters = new Set()

    characters.forEach((character, index) => {
      if (createdCharacters.has(character.id)) {
        return
      }

      createdCharacters.add(character.id)

      const ribbon = document.createElement('div')

      ribbon.className =
        'marauders-map__ribbon is-horizontal'

      ribbon.dataset.index = String(index)
      ribbon.dataset.characterId = character.id

      if (character.name.length > 18) {
        ribbon.dataset.longName = 'true'
      }

      ribbon.innerHTML = `
          <span
            class="
              marauders-map__ribbon-tail
              marauders-map__ribbon-tail--left
            "
          ></span>

          <div
            class="marauders-map__ribbon-inner"
          >

            <span
              class="
                marauders-map__ribbon-line
                marauders-map__ribbon-line--left
              "
            ></span>

            <span
              class="marauders-map__ribbon-name"
            >
              ${escapeHtml(character.name)}
            </span>

            <span
              class="
                marauders-map__ribbon-line
                marauders-map__ribbon-line--right
              "
            ></span>

          </div>

          <span
            class="
              marauders-map__ribbon-tail
              marauders-map__ribbon-tail--right
            "
          ></span>
        `

      ribbon.style.rotate = '0deg'
      ribbon.style.transformOrigin = 'center center'

      ribbonLayer.appendChild(ribbon)

      character.ribbon = ribbon
      character.route.ribbon = ribbon
    })
  }

  // ==================================================
  // ESCAPE HTML
  // ==================================================

  function escapeHtml(value) {
    return String(value).replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#039;',
        })[character]
    )
  }

  // ==================================================
  // PATH INTERPOLATION
  // ==================================================

  function interpolatePath(points, progress) {
    if (!points || points.length < 2) {
      return {
        x: 0,
        y: 0,
        angle: 0,
      }
    }

    const total = points.length - 1
    const scaled = clamp(progress, 0, 0.999999) * total
    const index = Math.floor(scaled)
    const local = scaled - index

    const a = points[index]
    const b = points[index + 1]

    return {
      x: lerp(a.x, b.x, local),
      y: lerp(a.y, b.y, local),
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    }
  }

  // ==================================================
  // FOOTPRINT CREATION
  // ==================================================

  function createFootprint(character, position, side) {
    footprints.push({
      characterId: character.id,
      x:
        position.x +
        Math.cos(position.angle + Math.PI / 2) * side,
      y:
        position.y +
        Math.sin(position.angle + Math.PI / 2) * side,
      angle: position.angle,
      life: 1,
      fade: random(0.0015, 0.0035),
      phase: random(0, Math.PI * 2),
    })
  }

  // ==================================================
  // DRAW ROOM
  // ==================================================

  function drawRoom(room) {
    ctx.beginPath()

    room.corners.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })

    ctx.closePath()
    ctx.stroke()

    const center = {
      x: room.x,
      y: room.y,
    }

    const vertical = room.w > room.h

    ctx.beginPath()

    if (vertical) {
      ctx.moveTo(
        center.x - room.w * 0.18,
        center.y - room.h * 0.5
      )
      ctx.lineTo(
        center.x - room.w * 0.18,
        center.y + room.h * 0.5
      )
    } else {
      ctx.moveTo(
        center.x - room.w * 0.5,
        center.y - room.h * 0.12
      )
      ctx.lineTo(
        center.x + room.w * 0.5,
        center.y - room.h * 0.12
      )
    }

    ctx.stroke()

    room.details.forEach((detail) => {
      ctx.beginPath()
      ctx.arc(detail.x, detail.y, detail.r, 0, Math.PI * 2)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(detail.x - detail.r, detail.y)
      ctx.lineTo(detail.x + detail.r, detail.y)
      ctx.moveTo(detail.x, detail.y - detail.r)
      ctx.lineTo(detail.x, detail.y + detail.r)
      ctx.stroke()
    })

    ctx.save()
    ctx.lineWidth = config.architectureWidth * 2
    ctx.globalCompositeOperation = 'destination-out'
    ctx.beginPath()
    ctx.arc(
      room.x + room.w * 0.5,
      room.y,
      7,
      -Math.PI / 2,
      Math.PI / 2
    )
    ctx.stroke()
    ctx.restore()
  }

  // ==================================================
  // DRAW TOWER
  // ==================================================

  function drawTower(tower, time) {
    const pulse =
      Math.sin(time * config.pulseSpeed + tower.phase) * 1.5

    ctx.beginPath()
    ctx.arc(tower.x, tower.y, tower.radius, 0, Math.PI * 2)
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(
      tower.x,
      tower.y,
      tower.radius * 0.72 + pulse,
      0,
      Math.PI * 2
    )
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(
      tower.x,
      tower.y,
      tower.radius * 0.38,
      0,
      Math.PI * 2
    )
    ctx.stroke()

    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8

      ctx.beginPath()
      ctx.moveTo(
        tower.x + Math.cos(angle) * tower.radius * 0.72,
        tower.y + Math.sin(angle) * tower.radius * 0.72
      )
      ctx.lineTo(
        tower.x + Math.cos(angle) * tower.radius,
        tower.y + Math.sin(angle) * tower.radius
      )
      ctx.stroke()
    }
  }

  // ==================================================
  // DRAW STAIRS
  // ==================================================

  function drawStairs(stair) {
    ctx.save()
    ctx.translate(stair.x, stair.y)
    ctx.rotate(stair.rotation)

    const count = Math.floor(stair.height / 6)

    for (let i = 0; i < count; i++) {
      const y = -stair.height / 2 + i * 6

      ctx.beginPath()
      ctx.moveTo(-stair.width / 2, y)
      ctx.lineTo(stair.width / 2, y)
      ctx.stroke()
    }

    ctx.restore()
  }

  // ==================================================
  // DRAW CARTOGRAPHIC SYMBOL
  // ==================================================

  function drawSymbol(symbol, time) {
    const alpha = symbol.type === 0 ? 0.8 : 0.55

    ctx.save()
    ctx.translate(symbol.x, symbol.y)
    ctx.rotate(symbol.rotation)
    ctx.globalAlpha *= alpha

    const s = symbol.size

    if (symbol.type === 0) {
      ctx.beginPath()
      ctx.moveTo(-s, 0)
      ctx.lineTo(s, 0)
      ctx.moveTo(0, -s)
      ctx.lineTo(0, s)
      ctx.stroke()
    } else if (symbol.type === 1) {
      ctx.beginPath()
      ctx.arc(0, 0, s, 0, Math.PI * 2)
      ctx.stroke()
    } else if (symbol.type === 2) {
      ctx.beginPath()
      ctx.moveTo(-s, s)
      ctx.lineTo(0, -s)
      ctx.lineTo(s, s)
      ctx.closePath()
      ctx.stroke()
    } else if (symbol.type === 3) {
      ctx.beginPath()
      ctx.moveTo(-s, -s)
      ctx.lineTo(s, s)
      ctx.moveTo(s, -s)
      ctx.lineTo(-s, s)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(0, 0, s * 0.7, 0, Math.PI * 2)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(-s, 0)
      ctx.lineTo(s, 0)
      ctx.stroke()
    }

    ctx.restore()
  }

  // ==================================================
  // DRAW ARCHITECTURE
  // ==================================================

  function drawArchitecture(time) {
    ctx.save()

    ctx.strokeStyle = config.ink
    ctx.lineWidth = config.architectureWidth
    ctx.globalAlpha = config.architectureOpacity

    rooms.forEach(drawRoom)

    ctx.globalAlpha = config.lineOpacity

    corridors.forEach((path) => {
      ctx.beginPath()
      path.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y)
        } else {
          ctx.lineTo(point.x, point.y)
        }
      })
      ctx.stroke()
    })

    ctx.globalAlpha = config.detailOpacity

    towers.forEach((tower) => drawTower(tower, time))
    stairs.forEach(drawStairs)

    ctx.globalAlpha = config.detailOpacity

    symbols.forEach((symbol) => drawSymbol(symbol, time))

    ctx.restore()
  }

  // ==================================================
  // DRAW SECONDARY MAP LINES
  // ==================================================

  function drawSecondaryLines() {
    ctx.save()

    ctx.strokeStyle = config.ink
    ctx.lineWidth = config.lineWidth * 0.55
    ctx.globalAlpha = config.lineOpacity * 0.55

    for (let i = 0; i < 16; i++) {
      const y = height * (0.04 + i * 0.062)

      ctx.beginPath()
      ctx.moveTo(0, y)

      for (let x = 0; x <= width; x += 70) {
        const wave = Math.sin(x * 0.008 + i) * 3
        ctx.lineTo(x, y + wave)
      }

      ctx.stroke()
    }

    ctx.restore()
  }

  // ==================================================
  // DRAW CHARACTER ROUTE
  // ==================================================

  function drawRoute(character, time) {
    const route = character.route

    if (!route.points || route.points.length < 2) {
      return
    }

    ctx.save()

    ctx.strokeStyle = config.ink
    ctx.lineWidth = config.routeWidth
    ctx.globalAlpha = config.routeOpacity

    ctx.setLineDash([3, 6])

    ctx.beginPath()

    route.points.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })

    ctx.stroke()
    ctx.setLineDash([])

    const position = interpolatePath(
      route.points,
      character.progress
    )

    const actorPulse =
      1 +
      Math.sin(
        time * config.pulseSpeed * 2 + character.phase
      ) *
        0.18

    ctx.globalAlpha = config.routeOpacity * 1.7

    ctx.beginPath()
    ctx.arc(
      position.x,
      position.y,
      2.4 * actorPulse,
      0,
      Math.PI * 2
    )

    ctx.fillStyle = config.ink
    ctx.fill()

    ctx.restore()
  }

  // ==================================================
  // UPDATE FOOTPRINTS
  // ==================================================

  function updateFootprints(character, position) {
    if (!config.footsteps) {
      return
    }

    const cycle = Math.floor(
      character.progress * config.footstepCount
    )

    if (cycle !== character.lastFootstep) {
      character.lastFootstep = cycle
      const side = cycle % 2 === 0 ? -5 : 5
      createFootprint(character, position, side)
    }
  }

  // ==================================================
  // DRAW FOOTPRINT
  // ==================================================

  function drawFootprint(footprint) {
    ctx.save()

    ctx.translate(footprint.x, footprint.y)
    ctx.rotate(footprint.angle + Math.PI / 2)

    ctx.globalAlpha =
      config.footstepOpacity * footprint.life

    ctx.fillStyle = config.ink

    ctx.beginPath()
    ctx.ellipse(0, -1, 2.1, 5.8, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.ellipse(0, 4.5, 1.7, 1.8, 0, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
  }

  // ==================================================
  // UPDATE PARTICLES
  // ==================================================

  function updateParticles() {
    particles.forEach((particle) => {
      particle.x += particle.vx
      particle.y += particle.vy

      if (particle.x < -10) particle.x = width + 10
      if (particle.x > width + 10) particle.x = -10
      if (particle.y < -10) particle.y = height + 10
      if (particle.y > height + 10) particle.y = -10
    })
  }

  // ==================================================
  // DRAW PARTICLES
  // ==================================================

  function drawParticles(time) {
    ctx.save()

    ctx.fillStyle = config.ink

    particles.forEach((particle) => {
      const pulse =
        0.55 +
        Math.sin(time * 0.001 + particle.phase) * 0.25

      ctx.globalAlpha = config.particleOpacity * pulse

      ctx.beginPath()
      ctx.arc(
        particle.x,
        particle.y,
        particle.radius,
        0,
        Math.PI * 2
      )
      ctx.fill()
    })

    ctx.restore()
  }

  // ==================================================
  // RIBBON UPDATE
  // ==================================================

  function updateRibbon(character, position, time, index) {
    const ribbon = character.ribbon

    if (!ribbon || !config.ribbons) {
      return
    }

    const wave =
      Math.sin(time * 0.0008 + character.phase) *
      config.ribbonWave

    const ribbonX = position.x
    const ribbonY = position.y + config.ribbonOffsetY + wave

    ribbon.style.transform =
      `translate3d(` +
      `${ribbonX}px, ` +
      `${ribbonY}px, ` +
      `0) translate(-50%, -50%)`

    ribbon.style.rotate = '0deg'
    ribbon.style.opacity = String(config.ribbonOpacity)

    ribbon.dataset.index = String(index)
    ribbon.dataset.characterId = character.id
  }

  // ==================================================
  // UPDATE CHARACTER
  // ==================================================

  function updateCharacter(character) {
    if (!config.animated) {
      return
    }

    character.progress += character.speed

    if (character.progress > 1) {
      character.progress = 0
      character.lastFootstep = -1
    }

    character.route.progress = character.progress
  }

  // ==================================================
  // RENDER
  // ==================================================

  function render(time) {
    if (!ctx || !container || !initialized) {
      return
    }

    ctx.clearRect(0, 0, width, height)

    config = readConfig()

    drawSecondaryLines()
    drawArchitecture(time)

    characters.forEach((character, index) => {
      updateCharacter(character)

      const position = interpolatePath(
        character.route.points,
        character.progress
      )

      drawRoute(character, time)
      updateFootprints(character, position)
      updateRibbon(character, position, time, index)
    })

    updateParticles()
    drawParticles(time)

    if (config.footsteps) {
      footprints = footprints.filter((footprint) => {
        footprint.life -= footprint.fade

        if (footprint.life <= 0) {
          return false
        }

        drawFootprint(footprint)

        return true
      })
    } else {
      footprints = []
    }

    animationId = requestAnimationFrame(render)
  }

  // ==================================================
  // THEME OBSERVER
  // ==================================================

  function observeTheme() {
    mutationObserver = new MutationObserver(() => {
      config = readConfig()
    })

    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
  }

  // ==================================================
  // INIT (com Fallback automático)
  // ==================================================

  function init(targetContainer) {
    // Busca o elemento container automaticamente caso nenhum seja passado
    const resolvedContainer =
      targetContainer ||
      document.querySelector('.effect-marauders') ||
      document.body

    if (!resolvedContainer || initialized) {
      return
    }

    container = resolvedContainer

    ensureRibbonStyles()
    config = readConfig()

    const oldRibbons = container.querySelector(
      '.marauders-map__ribbons'
    )
    if (oldRibbons) oldRibbons.remove()

    const oldCanvas = container.querySelector(
      '.marauders-map__canvas'
    )
    if (oldCanvas) oldCanvas.remove()

    canvas = document.createElement('canvas')
    canvas.className = 'marauders-map__canvas'
    canvas.setAttribute('aria-hidden', 'true')
    canvas.style.position = 'absolute'
    canvas.style.left = '0'
    canvas.style.top = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.style.zIndex = '10'
    canvas.style.pointerEvents = 'none'

    container.appendChild(canvas)

    ctx = canvas.getContext('2d')

    if (!ctx) {
      canvas.remove()
      canvas = null
      container = null
      return
    }

    ribbonLayer = document.createElement('div')
    ribbonLayer.className = 'marauders-map__ribbons'
    ribbonLayer.style.position = 'absolute'
    ribbonLayer.style.left = '0'
    ribbonLayer.style.top = '0'
    ribbonLayer.style.width = '100%'
    ribbonLayer.style.height = '100%'
    ribbonLayer.style.zIndex = '20'
    ribbonLayer.style.pointerEvents = 'none'

    container.appendChild(ribbonLayer)

    initialized = true

    updateSize()
    createMap()

    resizeObserver = new ResizeObserver(() => {
      updateSize()
    })
    resizeObserver.observe(container)

    observeTheme()

    if (config.animated) {
      animationId = requestAnimationFrame(render)
    } else {
      render(performance.now())
    }

    console.log('[Marauders] Mapa procedural iniciado.')
    console.log(
      `[Marauders] Personagens ativos: ${characters.length}`
    )
  }

  // ==================================================
  // DESTROY
  // ==================================================

  function destroy() {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }

    if (mutationObserver) {
      mutationObserver.disconnect()
      mutationObserver = null
    }

    if (canvas) {
      canvas.remove()
      canvas = null
    }

    if (ribbonLayer) {
      ribbonLayer.remove()
      ribbonLayer = null
    }

    ctx = null
    container = null

    architecture = []
    corridors = []
    rooms = []
    towers = []
    stairs = []
    symbols = []
    routes = []
    characters = []
    particles = []
    footprints = []

    width = 0
    height = 0
    dpr = 1
    config = {}
    initialized = false
  }

  // ==================================================
  // PUBLIC API
  // ==================================================

  return {
    init,
    destroy,
  }
})()
