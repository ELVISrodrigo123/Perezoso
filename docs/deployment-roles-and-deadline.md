# Despliegue: roles dinámicos, permisos y plazo de inscripción

Pasos para instalar o actualizar el sistema en otra PC o en producción con el script único `db/migrations/pgadmin_full_update.sql`.

## 1. Qué hace el script

`pgadmin_full_update.sql` reúne en una sola transacción (`BEGIN` / `COMMIT`):

- **002**: plazo de inscripción dinámico (`configuracion_sistema`, columnas de plazo en `curso`, `historial_plazo_inscripcion`).
- **003 + 004**:
  - crea `roles`, `permissions` (55: 17 de menú y 38 de acción), `role_permissions` y `user_permissions`;
  - agrega `role_id` en `usuario_roles` y `permissions_version` en `usuarios`;
  - crea los triggers de versión y de protección del super administrador.

Características:

- **Idempotente**: funciona en una base sin 002/003, con 002/003 ya aplicadas, y se puede ejecutar dos veces.
- **No borra datos**:
  - las filas de `usuario_roles` se conservan y reciben su `role_id`;
  - los permisos `*.read` de la 003 se renombran a sus permisos de menú.
- No contiene datos de prueba ni contraseñas.
- Si algo falla, PostgreSQL deshace todo.
- Requiere las tablas base de la academia (`usuarios`, `usuario_roles`, `administradores`, `curso`, `inscripcion`, …).

Los archivos `002_enrollment_deadline.sql`, `003_permissions.sql` y `004_dynamic_roles.sql` quedan como historial. Para instalar basta con el script único.

## 2. Revisión previa (solo lectura)

```sql
SELECT role, estado, COUNT(*) FROM usuario_roles GROUP BY role, estado;
SELECT es_super, COUNT(*) FROM administradores GROUP BY es_super;
SELECT estado, COUNT(*) FROM curso GROUP BY estado;
SELECT COUNT(*) FILTER (WHERE cupo_total IS NULL) AS sin_cupo,
       COUNT(*) FILTER (WHERE fecha_creacion IS NULL) AS sin_inicio,
       COUNT(*) FILTER (WHERE duracion IS NULL) AS sin_duracion
FROM curso;
```

Qué revisar en los resultados:

- **Super administrador**: debe existir al menos uno activo (`es_super = true`). Si no hay ninguno, hay que marcar uno antes de usar el panel de accesos.
- **Roles con otros nombres**: los valores de `usuario_roles.role` que no sean los 4 base se crean como roles nuevos sin permisos; hay que asignárselos después en el panel.
- **Cursos incompletos**: los cursos sin cupo, fecha o duración hay que completarlos antes.

## 3. Ejecutar en pgAdmin 4

1. Hacer un respaldo: clic derecho en la base → *Backup…* (formato *Custom*).
2. Clic derecho en la base → *Query Tool*.
3. Abrir `db/migrations/pgadmin_full_update.sql` (o pegar su contenido) y ejecutar con **F5**.
4. Ejecutar por separado las consultas de verificación que trae el final del archivo. Resultado esperado:
   - `permissions`: 55 (17 de tipo `menu`);
   - permisos por rol: `administrador` 31, `estudiante` 6, `profesor` 10, `super_administrador` 10;
   - 0 filas de `usuario_roles` sin rol en el catálogo;
   - al menos 1 super administrador activo.

Con `psql`, lo equivalente es `psql -v ON_ERROR_STOP=1 -d <base> -f db/migrations/pgadmin_full_update.sql`.

**Rollback.** Está comentado al final del script. Hay que quitar los `--` y ejecutarlo. Después hay que volver también a la versión anterior del código, porque el backend nuevo necesita estas tablas.

## 4. Código y variables de entorno

```bash
git clone <url-del-repo>   # o git pull en una copia existente
cd backend && npm install
cd ../frontend && npm install
```

`backend/.env` (valores de ejemplo; no subir este archivo):

```
PORT=5000
DATABASE_URL=<cadena de conexión a PostgreSQL>
JWT_SECRET=<secreto largo y aleatorio>
CHATBOT_API_KEY=<clave para el chatbot>
RECIBO_VERIFICACION_SECRET=<secreto largo y aleatorio>
FRONTEND_URL=<url del frontend>
N8N_WEBHOOK_PAGO_URL=<url del webhook de n8n>
N8N_WEBHOOK_KEY=<clave del webhook>
```

`frontend/.env`:

```
VITE_API_URL=<url del backend>
```

No hay variables nuevas respecto a la versión anterior.

Para levantar el sistema:

- desarrollo: `npm run dev` en `backend/` y `npm start` en `frontend/`;
- todo junto: `docker-compose up --build`.

Hay que desplegar backend y frontend **juntos**: el frontend nuevo arma el sidebar con `GET /perfil/menu` y lee `permissions` del token.

## 5. Checklist después del deploy

- [ ] Login sin selector de rol. Un usuario con dos roles ve un solo menú con los ítems de ambos.
- [ ] El access token trae `roles`, `permissions`, `permissions_version` y `type: "access"`.
- [ ] El super administrador ve *Gestión de accesos* con las pestañas Roles y Usuarios.
- [ ] Si se deniega un permiso a un usuario en el panel, su siguiente acción ya no lo tiene: el frontend renueva el token y el menú se actualiza.
- [ ] `POST /cambiar-rol` responde 404.
- [ ] Un profesor en `/docente/cursos` y un estudiante en `/estudiante/cursos` ven solo sus propios datos.
- [ ] `GET /admin/configuracion/plazo-inscripcion` responde 200. La columna "Inscripción" de Cursos coincide con lo esperado.
- [ ] El modo claro y el oscuro se ven bien en Configuración, Cursos, Inscripciones, Control de pagos y las tablas de usuarios.

## 6. Cambios de comportamiento

- **Login y sesión**:
  - no hay selector de rol en el login ni opción "Cambiar a" en el header;
  - los tokens anteriores al despliegue se rechazan, así que cada usuario inicia sesión una vez más.
- **Permisos**:
  - toda ruta protegida exige un permiso;
  - un `403` ya no cierra la sesión en el frontend; solo un `401` sin refresh posible lo hace.
- **Cambios de accesos al instante**: cualquier cambio de roles o permisos, incluido uno hecho a mano en la base, incrementa `usuarios.permissions_version`. El token viejo deja de servir en segundos.
- **Super administrador**: no se puede bloquear, no se le pueden denegar permisos y siempre debe quedar al menos uno. La base lo hace cumplir con triggers.
- **Seguridad (corregido)**: un profesor ya no puede consultar los exámenes calificados de un curso que no dicta.
- **Interfaz**:
  - sidebar armado desde la base;
  - columna Roles con chips y botón Accesos en las tablas de usuarios;
  - "Dar de baja" y "Activar" con los mismos nombres y colores en todas las tablas;
  - tarjetas y textos que respetan el modo oscuro.
