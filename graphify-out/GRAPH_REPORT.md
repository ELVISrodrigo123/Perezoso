# Graph Report - brilliand-minds  (2026-11-26)

## Corpus Check
- 256 files · ~249,691 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 55 file(s) not represented in the graph (top: .scss 32, (none) 17, .example 2)

## Summary
- 1152 nodes · 2631 edges · 79 communities (63 shown, 16 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 91 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `97e4a702`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useGestionAcceso.js
- react
- usuario.js
- server.js
- ConfiguracionAcademia.js
- backend/package.json
- generarReporteInscripcionesPdf.js
- Dashboard.js
- gestionProfesorRoutes.js
- administradoresController.js
- inscripcionController.js
- dependencies
- frontend/package.json
- inicio.spec.js
- controlDePagosEstudiante.js
- chatbot.controller.js
- profesorController.js
- dataBase.js
- armarRespuestaPaginada
- cursosParaEstudiantes.js
- chatbot/package.json
- devDependencies
- CoreUI Free React Admin Template - Built for AI-Assisted Development [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&logo=twitter)](https://twitter.com/intent/tweet?text=CoreUI%20-%20Free%React%204%20Admin%20Template%20&url=https://coreui.io&hashtags=bootstrap,admin,template,dashboard,panel,free,angular,react,vue)
- preInscripcionEstudianteController.js
- gestionProfesor.js
- manifest.json
- scripts
- vite.config.mjs
- repository
- codebase-memory-mcp
- User.js
- Contributing to CoreUI
- logo.js
- sygnet.js
- App.js
- Codebase Memory — Knowledge Graph Tools
- Git Commit Message Convention
- CoreUI Free React Admin Template - Development Guide
- Brilliant Minds
- CoreUI Free React Admin Template - Architecture
- Contributor Covenant Code of Conduct
- VerificarRecibo.js
- Home.js
- Core Components
- Technology Stack
- Best Practices
- Styling Components
- Build and Deployment
- Working with Routes
- Architectural Pattern
- Browser Support
- Deployment
- Build System
- Performance Optimizations
- Styling Architecture
- Routing System
- State Management
- Testing
- Code Quality
- Creating Components
- Development Workflow
- Prerequisites
- Adding New Pages
- Data Visualization
- Troubleshooting
- Working with Forms
- Project Structure
- README.md

## God Nodes (most connected - your core abstractions)
1. `react` - 64 edges
2. `@coreui/react` - 53 edges
3. `pool` - 42 edges
4. `obtenerPaginacion()` - 24 edges
5. `armarRespuestaPaginada()` - 24 edges
6. `react-router-dom` - 20 edges
7. `SectionCard()` - 19 edges
8. `CoreUI Free React Admin Template - Development Guide` - 18 edges
9. `express` - 17 edges
10. `@coreui/icons` - 17 edges

## Surprising Connections (you probably didn't know these)
- `Cursos()` --calls--> `useCursos()`  [EXTRACTED]
  frontend/src/views/cursos/Cursos.js → frontend/src/views/cursos/hooks/useCursos.js
- `Administradores()` --calls--> `useAdministradores()`  [EXTRACTED]
  frontend/src/views/gestionAdministrador/Administradores/Administradores.js → frontend/src/views/gestionAdministrador/Administradores/hooks/useAdministradores.js
- `GestionAccesos()` --calls--> `useGestionAcceso()`  [EXTRACTED]
  frontend/src/views/gestionAdministrador/gestionAccesos/GestionAccesos.js → frontend/src/views/gestionAdministrador/gestionAccesos/hooks/useGestionAcceso.js
- `getAdministradores()` --calls--> `armarRespuestaPaginada()`  [EXTRACTED]
  backend/controllers/administradoresController.js → backend/utils/paginacion.js
- `getAdministradores()` --calls--> `obtenerPaginacion()`  [EXTRACTED]
  backend/controllers/administradoresController.js → backend/utils/paginacion.js

## Import Cycles
- None detected.

## Communities (79 total, 16 thin omitted)

### Community 0 - "useGestionAcceso.js"
Cohesion: 0.06
Nodes (66): api, Register, useHabilitarUsuario(), deleteCursos(), getCursos(), getCursosPaginado(), postCursos(), putCursos() (+58 more)

### Community 1 - "react"
Cohesion: 0.05
Nodes (80): EmptyState(), FeedbackAlert(), frontend_src_components_index_emptystate, frontend_src_components_index_feedbackalert, frontend_src_components_index_loadingstate, frontend_src_components_index_pageheader, frontend_src_components_index_sectioncard, frontend_src_components_index_statusbadge (+72 more)

### Community 2 - "usuario.js"
Cohesion: 0.08
Nodes (40): colaPendiente, colaPendiente, colaPendiente, DefaultLayout, Login, frontend_src_assets_images_avatars_0, frontend_src_assets_images_logo0, AppContent() (+32 more)

### Community 3 - "server.js"
Cohesion: 0.06
Nodes (48): configurarCors, opcionesCors, cambiarRol(), crearAccessToken(), crearRefreshToken(), elegirRolPorDefecto(), emitirSesion(), guardarRefreshTokenEnCookie() (+40 more)

### Community 4 - "ConfiguracionAcademia.js"
Cohesion: 0.07
Nodes (45): apiEstudiante, frontend_src_assets_images_respaldocursosweb, CursosResultadosEstudiante, PreinscripcionCursosEstudiante, crearInscripcionAunCursoEstudiante(), getMostrarCalificaionesDeunCursoEstudiante(), getMostrarCursosEstudiante(), getMostrarCursosNoInscritosDeunEstudiante() (+37 more)

### Community 5 - "backend/package.json"
Cohesion: 0.05
Nodes (42): author, bugs, url, dependencies, bcryptjs, cors, dotenv, express (+34 more)

### Community 6 - "generarReporteInscripcionesPdf.js"
Cohesion: 0.22
Nodes (14): frontend_src_assets_images_logo1, dibujarBordePagina(), formatearFecha(), generarReporteCalificacionesPdf(), textoCorto(), crearDocumento(), dibujarBordePagina(), fechaActual() (+6 more)

### Community 7 - "Dashboard.js"
Cohesion: 0.09
Nodes (34): apiDocente, CursosEvaluacionProfesor, MostrarCursosProfesor, MostrarEstudiantesProfesor, getControlDePagosParaLosEstudiante(), getCursosPorVencer(), getEstudiantes(), deleteEvaluacionDeunCursoProfesor() (+26 more)

### Community 8 - "gestionProfesorRoutes.js"
Cohesion: 0.14
Nodes (20): getMostrarExamenesCalificados(), postCalificarEvaluacion(), putCalificarEvaluacion(), deleteEvaluacionDeunCurso(), getCursosEvaluacion(), getEvaluacionCurso(), getListarCalificacionesEvaluacion(), postCrearEvaluacionAunCurso() (+12 more)

### Community 9 - "administradoresController.js"
Cohesion: 0.15
Nodes (26): activarAdministrador(), deleteAdministrador(), getAdministradores(), getEsSuper(), mensajesDuplicado, postAdministrador(), putAdministrador(), soloSuperAdministrador() (+18 more)

### Community 10 - "inscripcionController.js"
Cohesion: 0.16
Nodes (16): deleteEliminarTodasInscripcionesDelCurso(), deleteinscripcionPorEstudiante(), deleteInscripcionPorId(), getInscripciones(), getInscripcionesPorCurso(), getInscripcionesPorProfesor(), mostrarInscripcionPorEstudiante(), postInscripciones() (+8 more)

### Community 11 - "dependencies"
Cohesion: 0.08
Nodes (25): dependencies, axios, chart.js, classnames, core-js, @coreui/chartjs, @coreui/coreui, @coreui/icons (+17 more)

### Community 12 - "frontend/package.json"
Cohesion: 0.09
Nodes (24): author, bugs, url, description, homepage, dotenv, license, name (+16 more)

### Community 13 - "inicio.spec.js"
Cohesion: 0.15
Nodes (15): { defineConfig, devices }, createAuditTracker(), getCredentials(), hasRoleCredentials(), isControlledCrudEnabled(), isExtraRoleAuditEnabled(), requiredEnv, loginAs() (+7 more)

### Community 14 - "controlDePagosEstudiante.js"
Cohesion: 0.18
Nodes (19): getControlDePagosEstudiante(), getMostrarRecibos(), getVerificarRecibo(), postRegistrarRecibos(), putMarcarInscripcionComoPagada(), validarInscripcion, controlPagosDeEstudiantesACursos(), marcarInscripcionComoPagada() (+11 more)

### Community 15 - "chatbot.controller.js"
Cohesion: 0.22
Nodes (12): obtenerCalificaciones(), getCursosActivos(), getInscripcion(), getPagos(), identificar(), calificacionesDelEstudiante(), filasDeCalificaciones(), buscarPorTelefono() (+4 more)

### Community 16 - "profesorController.js"
Cohesion: 0.22
Nodes (9): deleteProfesor(), getProfesor(), postProfesor(), putProfesor(), validarAdministrador, validarProfesor, validarCampos(), router (+1 more)

### Community 17 - "dataBase.js"
Cohesion: 0.17
Nodes (10): deleteCurso(), getMostrarCursosPorVencer(), postCursos(), putCursos(), pool, validarCurso, actualizarCurso(), crearCursos() (+2 more)

### Community 18 - "armarRespuestaPaginada"
Cohesion: 0.20
Nodes (12): getCursos(), deletePadreTutor(), getPadresTutors(), postPadreTutor(), putPadreTutor(), validarPadreTutor, actualizarPadreTutor(), obtenerPadresTutors() (+4 more)

### Community 19 - "cursosParaEstudiantes.js"
Cohesion: 0.07
Nodes (53): getMostrarCalificaionesDelEstudiante(), getMostrarCursosNoInscritosDelEstudiante(), getMostrarcursosParaEstudiantes(), getMostrarDeudasEstudiante(), postCrearInscripcionAunCursoestudiante(), armarPlazoCurso(), armarPlazoGlobal(), getPlazoCurso() (+45 more)

### Community 20 - "chatbot/package.json"
Cohesion: 0.13
Nodes (14): author, dependencies, dotenv-cli, n8n, description, keywords, license, main (+6 more)

### Community 21 - "devDependencies"
Cohesion: 0.14
Nodes (14): devDependencies, autoprefixer, eslint, eslint-config-prettier, eslint-plugin-prettier, eslint-plugin-react, eslint-plugin-react-hooks, globals (+6 more)

### Community 22 - "CoreUI Free React Admin Template - Built for AI-Assisted Development [![Tweet](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&logo=twitter)](https://twitter.com/intent/tweet?text=CoreUI%20-%20Free%React%204%20Admin%20Template%20&url=https://coreui.io&hashtags=bootstrap,admin,template,dashboard,panel,free,angular,react,vue)"
Cohesion: 0.09
Nodes (21): AI-Friendly Development, Basic usage, Benefits for AI Coding Assistants, Build, Code Documentation, Community, Components, Context Files (+13 more)

### Community 23 - "preInscripcionEstudianteController.js"
Cohesion: 0.29
Nodes (8): getPreinscripcionEstudiante(), posPreinscripcionAprobada(), posPreinscripcionRechazada(), postPreinscripcionEstudiante(), mostrarPreinscripcionEstudiante(), preinscripcionAceptada(), postPreInscripciones(), preinscripcionRechazada()

### Community 24 - "gestionProfesor.js"
Cohesion: 0.50
Nodes (6): getCursosAsignados(), getEstudiantesAsignados(), mostrarCursoProfesor(), mostrarCursosConEstudiantesProfesor(), mostrarEstudiantesDeCursoProfesor(), mostrarEstudiantesProfesor()

### Community 25 - "manifest.json"
Cohesion: 0.25
Nodes (7): background_color, display, icons, name, short_name, start_url, theme_color

### Community 26 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, lint, serve, start

### Community 27 - "vite.config.mjs"
Cohesion: 0.40
Nodes (4): autoprefixer, ref_node_path, vite, @vitejs/plugin-react

### Community 28 - "repository"
Cohesion: 0.67
Nodes (3): repository, type, url

### Community 32 - "Contributing to CoreUI"
Cohesion: 0.13
Nodes (13): Bug reports, Code guidelines, Contributing to CoreUI, CSS, Feature requests, HTML, JS, License (+5 more)

### Community 39 - "App.js"
Cohesion: 0.16
Nodes (10): App(), Home, frontend_src_scss_examples, frontend_src_scss_style, initialState, store, core-js, react-dom (+2 more)

### Community 40 - "Codebase Memory — Knowledge Graph Tools"
Cohesion: 0.17
Nodes (11): 15 MCP Tools, Codebase Memory — Knowledge Graph Tools, Cypher Examples (for query_graph), Edge Types, Evidence Tiers, Exploration Workflow, Gotchas, Quality Analysis (+3 more)

### Community 41 - "Git Commit Message Convention"
Cohesion: 0.20
Nodes (9): Body, Examples, Footer, Full Message Format, Git Commit Message Convention, Revert, Scope, Subject (+1 more)

### Community 42 - "CoreUI Free React Admin Template - Development Guide"
Cohesion: 0.22
Nodes (8): Available Scripts, CoreUI Free React Admin Template - Development Guide, Getting Started, Installation, Local Component State, State Management, Table of Contents, Using Redux

### Community 43 - "Brilliant Minds"
Cohesion: 0.25
Nodes (7): Brilliant Minds, Código, Cómo se levanta, Entrega, Forma de trabajo, Herramientas, Memoria de la PC

### Community 44 - "CoreUI Free React Admin Template - Architecture"
Cohesion: 0.25
Nodes (7): Best Practices, CoreUI Free React Admin Template - Architecture, Directory Structure, Project Overview, React Security, Security Considerations, Table of Contents

### Community 45 - "Contributor Covenant Code of Conduct"
Cohesion: 0.25
Nodes (7): Attribution, Contributor Covenant Code of Conduct, Enforcement, Our Pledge, Our Responsibilities, Our Standards, Scope

### Community 46 - "VerificarRecibo.js"
Cohesion: 0.43
Nodes (4): publicApi, VerificarRecibo, verificarRecibo(), VerificarRecibo()

### Community 47 - "Home.js"
Cohesion: 0.48
Nodes (4): frontend_src_assets_images_robot_tech_3d, obtenerCursosDisponibles(), Home(), useCursosDisponibles()

### Community 48 - "Core Components"
Cohesion: 0.33
Nodes (6): Application Component (App.js), Core Components, DefaultLayout (layout/DefaultLayout.js), Layout System, Navigation Components, View Components

### Community 49 - "Technology Stack"
Cohesion: 0.33
Nodes (6): Build Tools & Development, Data Visualization, Frontend Core, Technology Stack, UI Framework, Utilities

### Community 50 - "Best Practices"
Cohesion: 0.33
Nodes (6): Accessibility, Best Practices, Code Organization, Git Workflow, Performance, Security

### Community 51 - "Styling Components"
Cohesion: 0.33
Nodes (6): Bootstrap Utilities, Conditional Styling, CSS Custom Properties, Custom Styles, Styling Components, Using CoreUI Components

### Community 52 - "Build and Deployment"
Cohesion: 0.33
Nodes (6): Build Analysis, Build and Deployment, Deployment Platforms, Environment Variables, Preview Production Build, Production Build

### Community 53 - "Working with Routes"
Cohesion: 0.40
Nodes (5): Dynamic Routes, Programmatic Navigation, Protected Routes, Route Configuration, Working with Routes

### Community 54 - "Architectural Pattern"
Cohesion: 0.50
Nodes (4): Architectural Pattern, Component-Based Architecture, Single Page Application (SPA) Pattern, State Management Pattern

### Community 55 - "Browser Support"
Cohesion: 0.50
Nodes (4): Browser Support, Polyfills, Progressive Enhancement, Target Browsers

### Community 56 - "Deployment"
Cohesion: 0.50
Nodes (4): Build for Production, Deployment, HashRouter for Static Hosts, Static Hosting

### Community 57 - "Build System"
Cohesion: 0.50
Nodes (4): Build Process, Build System, Code Splitting Strategy, Vite Configuration

### Community 58 - "Performance Optimizations"
Cohesion: 0.50
Nodes (4): Bundle Size Management, Component Optimization, Implemented Optimizations, Performance Optimizations

### Community 59 - "Styling Architecture"
Cohesion: 0.50
Nodes (4): Component Styling, CSS Custom Properties (CSS Variables), Sass/SCSS Structure, Styling Architecture

### Community 60 - "Routing System"
Cohesion: 0.50
Nodes (4): Lazy Loading & Code Splitting, Navigation Configuration, React Router DOM v7, Routing System

### Community 61 - "State Management"
Cohesion: 0.50
Nodes (4): Redux Store Architecture, State Management, State Usage in Components, Theme Management

### Community 62 - "Testing"
Cohesion: 0.50
Nodes (4): Browser Testing, Manual Testing Checklist, Responsive Testing, Testing

### Community 63 - "Code Quality"
Cohesion: 0.50
Nodes (4): Code Quality, Code Style Guidelines, ESLint Configuration, Pre-commit Checks

### Community 64 - "Creating Components"
Cohesion: 0.50
Nodes (4): Component Best Practices, Component Structure, Creating Components, Custom Hooks

### Community 65 - "Development Workflow"
Cohesion: 0.50
Nodes (4): Daily Development Process, Development Server Features, Development Workflow, Hot Module Replacement (HMR)

### Community 66 - "Prerequisites"
Cohesion: 0.50
Nodes (4): Knowledge Requirements, Prerequisites, Recommended Tools, Required Software

### Community 67 - "Adding New Pages"
Cohesion: 0.67
Nodes (3): Adding New Pages, Page Templates, Step-by-Step Process

### Community 68 - "Data Visualization"
Cohesion: 0.67
Nodes (3): Chart Types, Data Visualization, Using Chart.js with CoreUI

### Community 69 - "Troubleshooting"
Cohesion: 0.67
Nodes (3): Common Issues, Debugging Tips, Troubleshooting

### Community 70 - "Working with Forms"
Cohesion: 0.67
Nodes (3): Form Component Example, Form Validation, Working with Forms

### Community 71 - "Project Structure"
Cohesion: 0.67
Nodes (3): Key Files, Project Structure, Source Code Organization

## Knowledge Gaps
- **294 isolated node(s):** `C:/Users/ec790/AppData/Local/Programs/codebase-memory-mcp/codebase-memory-mcp.exe`, `opcionesCors`, `mensajesDuplicado`, `PRIORIDAD_ROLES`, `DIAS_PLAZO_MINIMO` (+289 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 354 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@playwright/test` connect `inicio.spec.js` to `frontend/package.json`?**
  _High betweenness centrality (0.331) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `useGestionAcceso.js`, `usuario.js`, `ConfiguracionAcademia.js`, `App.js`, `Dashboard.js`, `frontend/package.json`, `VerificarRecibo.js`, `Home.js`?**
  _High betweenness centrality (0.193) - this node is a cross-community bridge._
- **Why does `@coreui/react` connect `react` to `usuario.js`, `ConfiguracionAcademia.js`, `Dashboard.js`, `App.js`, `frontend/package.json`, `VerificarRecibo.js`, `Home.js`?**
  _High betweenness centrality (0.103) - this node is a cross-community bridge._
- **What connects `C:/Users/ec790/AppData/Local/Programs/codebase-memory-mcp/codebase-memory-mcp.exe`, `opcionesCors`, `mensajesDuplicado` to the rest of the system?**
  _294 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useGestionAcceso.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05799373040752351 - nodes in this community are weakly interconnected._
- **Should `react` be split into smaller, more focused modules?**
  _Cohesion score 0.0520471894517696 - nodes in this community are weakly interconnected._
- **Should `usuario.js` be split into smaller, more focused modules?**
  _Cohesion score 0.07656341320864991 - nodes in this community are weakly interconnected._