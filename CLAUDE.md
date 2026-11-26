# Brilliant Minds

Sistema de gestión de una academia: administradores gestionan estudiantes, profesores, padres/tutores, cursos, preinscripciones, inscripciones y pagos; los profesores evalúan y califican; los estudiantes se inscriben y ven resultados. Los padres/tutores no entran a la web: consultan por WhatsApp a través del chatbot.

| Carpeta | Qué es |
|---|---|
| `backend/` | Express 5 (ESM) + PostgreSQL (`pg`) + JWT (`jsonwebtoken`) + `bcryptjs`. Lint: `standard` |
| `backend/routes/` | Routers; el montaje y la protección por rol están en `backend/server.js` |
| `backend/middlewares/` | `veriificarToken.js` (JWT), `requireRole.js`, validadores `express-validator`, rate limit, API key del chatbot |
| `backend/controllers/` | Lógica HTTP por módulo (`gestionProfesor/`, `gestionEstudiante/`, `gestionChatbot/`, …) |
| `backend/models/` | Consultas SQL crudas con `pg` por módulo (`modelsUsuarios/`, `modelsInscripcion/`, …) |
| `frontend/src/` | React 19 + Vite, plantilla CoreUI, Redux (solo UI), React Router 7 con `HashRouter` |
| `frontend/src/routes.js`, `_nav.js` | Rutas y menú con `roles: [...]`; guards en `components/ProteccionRoute.js` y `components/proteccionRol.js` |
| `chatbot/workflows/` | Workflows de n8n (solo `00-principal.json` tiene contenido) |
| `docs/avances/` | Bitácoras locales (no se suben a git) |

No hay scripts SQL ni migraciones en el repo: el esquema se deduce de las consultas en `backend/models/`.

## Cómo se levanta

- Todo junto: `docker-compose up --build` (backend :5000, frontend :3000, n8n :5679, evolution-go :8080). PostgreSQL corre en el host (`host.docker.internal`).
- Backend: `cd backend && npm run dev` (nodemon). Requiere `backend/.env` con `DATABASE_URL`, `JWT_SECRET`, `CHATBOT_API_KEY`, `RECIBO_VERIFICACION_SECRET`, `FRONTEND_URL`, `N8N_WEBHOOK_PAGO_URL`, `N8N_WEBHOOK_KEY`.
- Frontend: `cd frontend && npm start` (Vite). Variable: `VITE_API_URL`.
- Chatbot: `cd chatbot && npm start` (n8n con `chatbot/.env`).

## Forma de trabajo

- **Git:** el usuario hace commits, ramas y push. El agente no commitea ni pushea sin pedido explícito.
- **Orden:** primero análisis, después la decisión del usuario, después implementación.
- **Inglés:** ramas (`feature/`, `fix/`, `refactor/`, `docs/`), tickets y mensajes de commit (formato convencional, `feat(auth): …`).
- **Español:** variables, funciones y textos de la interfaz (como el código existente).
- **Base de datos:** el usuario ejecuta las migraciones y cualquier cambio en la base. El agente solo los propone (SQL en la bitácora o en un archivo para revisar), nunca los ejecuta.

## Código

- Sin comentarios, salvo los muy importantes: un caso raro, una regla de negocio, un aviso de datos o de seguridad.
- No romper ni quitar funciones. Reusar lo que existe antes de crear algo nuevo.
- No debilitar: verificación de token, roles, rate limit, API key del chatbot, cookie httpOnly del refresh.
- Ningún secreto en archivos: solo nombres de variables.

## Memoria de la PC

- Un proceso pesado a la vez (build, Docker, navegador de prueba).
- **Tests al final**, una sola vez y solo los de lo tocado; la implementación tiene prioridad.

## Herramientas

- Grafo de graphify en `graphify-out/` (`GRAPH_REPORT.md`, `graph.json`). Tras cambios de código: `graphify update .` (sin costo de API).
- MCP `codebase-memory-mcp` (proyecto `D-tesis-peresoso-brilliand-minds`) para búsquedas estructurales y llamadas; si el índice queda viejo, reindexar con `index_repository`.

## Entrega

- Bitácora en `docs/avances/NN-<tema>.md` (excluida de git).
- `git status` final.
