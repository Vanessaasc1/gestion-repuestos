# App de gestion de solicitudes de repuestos

Proyecto base full-stack para los requisitos enviados:

- Frontend: React + Vite.
- Backend: Node.js + Express.
- Base de datos: PostgreSQL.
- Seguridad: JWT, contrasenas con bcrypt y control por roles.
- Roles incluidos: `admin`, `almacen`, `tecnico`.

## Funcionalidades incluidas

- Registro e inicio de sesion.
- Creacion de solicitudes de repuestos.
- Historial de solicitudes con filtros por estado y fecha.
- Actualizacion de estado por almacen o administrador.
- Inventario de repuestos.
- Asociacion de proveedores.
- Gestion de usuarios y roles para administrador.
- Trazabilidad basica en `request_history`.
- Panel resumen con totales, estados, bajo stock y solicitudes recientes.

## Preparar base de datos

1. Crear la base de datos:

```bash
createdb repuestos_app
```

2. Ejecutar esquema y datos iniciales:

```bash
psql -d repuestos_app -f backend/sql/schema.sql
psql -d repuestos_app -f backend/sql/seed.sql
```

## Backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

La API queda en:

```text
http://localhost:4000/api
```

## Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

La app queda en la URL que muestre Vite, normalmente:

```text
http://localhost:5173
```

## Primer usuario

Para el demo, la pantalla de registro permite escoger rol. Crea primero un usuario con rol `admin`.

En una version de produccion, lo correcto es desactivar el registro publico de administradores y crear el primer admin con un script seguro o una migracion controlada.

## Endpoints principales

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/dashboard`
- `GET /api/requests`
- `POST /api/requests`
- `PATCH /api/requests/:id/status`
- `GET /api/requests/:id/history`
- `GET /api/parts`
- `POST /api/parts`
- `GET /api/providers`
- `POST /api/providers`
- `GET /api/users`
- `PATCH /api/users/:id`
