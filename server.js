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
  const file = path.join(clientDir, 'global.css')

  if (!fs.existsSync(file)) {
    res.status(404).send('global.css não encontrado')
    return
  }

  res.sendFile(file)
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

  const indexFile = path.join(clientDir, 'index.html')

  if (!fs.existsSync(indexFile)) {
    res.status(500).send('Template central não encontrado')

    return
  }

  res.sendFile(indexFile)
})

// ==================================================
// ARQUIVOS DE CADA CLIENTE
// ==================================================

app.use('/@:username', (req, res, next) => {
  const { username } = req.params

  const clientPath = path.join(clientDir, `@${username}`)

  // --------------------------------------------
  // VERIFICA CLIENTE
  // --------------------------------------------

  if (!fs.existsSync(clientPath)) {
    res.status(404).send('Cliente não encontrado')

    return
  }

  // --------------------------------------------
  // SERVE ARQUIVO
  // --------------------------------------------

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
  const indexFile = path.join(__dirname, 'index.html')

  if (!fs.existsSync(indexFile)) {
    res.status(500).send('index.html não encontrado')

    return
  }

  res.sendFile(indexFile)
})

// ==================================================
// SERVER
// ==================================================

app.listen(port, '0.0.0.0', () => {
  console.log(
    `Servidor rodando em http://localhost:${port}`
  )
})
