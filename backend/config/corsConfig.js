import cors from 'cors'

const frontendURL = process.env.NODE_ENV === 'production'
  ? process.env.FRONTEND_URL
  : 'http://localhost:3000'

const opcionesCors = {
  origin: frontendURL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  optionsSuccessStatus: 200,
  credentials: true // Permite el envío de cookies/tokens
}

export const configurarCors = cors(opcionesCors)
