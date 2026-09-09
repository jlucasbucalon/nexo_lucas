import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ==================================================
// PATHS
// ==================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ==================================================
// APP
// ==================================================

const app = express()

const port = process.env.PORT || 3000

// ==================================================
// PATHS DO PROJETO
// ==================================================

const clientDir = path.join(__dirname, 'client')

const srcDir = path.join(__dirname, 'src')

// ==================================================
// SRC
// ==================================================

app.use(
  '/src',
  express.static(srcDir, {
    index: false,
  })
)

// ==================================================
// ARQUIVOS GLOBAIS
// ==================================================

app.get('/global.css', (req, res) => {
  res.sendFile(path.join(clientDir, 'global.css'))
})

// ==================================================
// TEMPLATE CENTRAL DOS CLIENTES
// ==================================================

app.get('/@:username', (req, res) => {
  const { username } = req.params

  const clientPath = path.join(clientDir, `@${username}`)

  // ----------------------------------------------
  // VERIFICA CLIENTE
  // ----------------------------------------------

  if (!fs.existsSync(clientPath)) {
    res.status(404).send('Cliente não encontrado')

    return
  }

  // ----------------------------------------------
  // TEMPLATE CENTRAL
  // ----------------------------------------------

  res.sendFile(path.join(clientDir, 'index.html'))
})

// ==================================================
// ARQUIVOS DE CADA CLIENTE
// ==================================================

app.use('/@:username', (req, res, next) => {
  const { username } = req.params

  const clientPath = path.join(clientDir, `@${username}`)

  express.static(clientPath, {
    index: false,
  })(req, res, next)
})

// ==================================================
// ARQUIVOS PÚBLICOS DO CLIENT
// ==================================================

app.use(
  '/client',
  express.static(clientDir, {
    index: false,
  })
)

// ==================================================
// SITE PRINCIPAL
// ==================================================

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

// ==================================================
// SERVER
// ==================================================

app.listen(port, '0.0.0.0', () => {
  console.log(
    `Servidor rodando em http://localhost:${port}`
  )
})
