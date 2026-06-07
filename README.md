# Sistema de Gestion de Solicitudes de Repuestos

Aplicacion web full-stack para registrar, consultar y gestionar solicitudes de repuestos dentro de un proceso operativo. El sistema permite que los tecnicos creen solicitudes, que el area de almacen revise disponibilidad y actualice estados, y que el administrador gestione usuarios, roles y seguimiento general del proceso.

## Descripcion del problema

En muchas organizaciones, la solicitud de repuestos se realiza mediante procesos manuales, mensajes informales o registros dispersos. Esto dificulta conocer el estado real de cada solicitud, consultar el inventario disponible, identificar proveedores y mantener trazabilidad sobre las decisiones tomadas durante el proceso.

El problema principal es la falta de una plataforma centralizada que permita registrar solicitudes, controlar su estado, consultar disponibilidad de repuestos y dejar evidencia del flujo realizado desde la solicitud inicial hasta su cierre.

## Objetivo del proyecto

Desarrollar una solucion web cliente-servidor que permita administrar solicitudes de repuestos de manera clara, segura y trazable, integrando autenticacion por roles, inventario, proveedores, historial de solicitudes y paneles de informacion resumida.

## Alcance funcional implementado

- Registro e inicio de sesion de usuarios.
- Autenticacion mediante JWT.
- Control de acceso por roles: `admin`, `almacen` y `tecnico`.
- Creacion de solicitudes de repuestos.
- Consulta del historial de solicitudes.
- Filtro de solicitudes por estado y fecha.
- Actualizacion del estado de solicitudes por usuarios autorizados.
- Visualizacion del inventario disponible.
- Registro de nuevos repuestos.
- Registro de proveedores.
- Asociacion de proveedores a repuestos.
- Gestion de usuarios y roles por parte del administrador.
- Trazabilidad de cambios de estado por solicitud.
- Panel resumen con indicadores del proceso.

## Roles del sistema

### Tecnico

Usuario encargado de crear solicitudes de repuestos y consultar el estado de sus solicitudes.

### Almacen

Usuario encargado de revisar solicitudes, validar disponibilidad, actualizar estados, gestionar inventario y registrar proveedores.

### Administrador

Usuario con permisos para supervisar el sistema, gestionar usuarios, cambiar roles y consultar la informacion general del proceso.

## Arquitectura general

La solucion utiliza una arquitectura cliente-servidor:

```text
Frontend React
      |
      | HTTP/JSON
      v
Backend Node.js + Express
      |
      | SQL
      v
PostgreSQL
```

### Frontend

Desarrollado con React y Vite. Contiene las pantallas de autenticacion, panel principal, solicitudes, inventario y usuarios.

### Backend

Desarrollado con Node.js y Express. Expone una API REST para autenticacion, usuarios, solicitudes, repuestos, proveedores, trazabilidad y dashboard.

### Base de datos

PostgreSQL almacena usuarios, repuestos, proveedores, solicitudes y el historial de cambios de estado.

## Tecnologias utilizadas

- Node.js
- Express
- React
- Vite
- PostgreSQL
- JWT
- bcryptjs
- GitHub
- Postman

## Estructura del proyecto

```text
repuestos/
  backend/
    sql/
      schema.sql
      seed.sql
    src/
      middleware/
      routes/
      db.js
      server.js
    .env.example
    package.json
  frontend/
    src/
      services/
      App.jsx
      main.jsx
      styles.css
    .env.example
    package.json
    vite.config.js
  README.md
```

## Requisitos previos

- Node.js instalado.
- PostgreSQL instalado y en ejecucion.
- Git instalado.

## Variables de entorno

### Backend

Crear el archivo `backend/.env` a partir de `backend/.env.example`.

```env
PORT=4000
DATABASE_URL=postgres://postgres:TU_CONTRASENA@localhost:5432/repuestos_app
JWT_SECRET=cambia_este_valor_en_produccion
JWT_EXPIRES_IN=8h
```

### Frontend

Crear el archivo `frontend/.env` a partir de `frontend/.env.example`.

```env
VITE_API_URL=http://localhost:4000/api
```

## Instalacion local

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
cd repuestos
```

### 2. Crear base de datos

```bash
psql -U postgres -c "CREATE DATABASE repuestos_app;"
```

### 3. Crear tablas y cargar datos iniciales

```bash
psql -U postgres -d repuestos_app -f backend/sql/schema.sql
psql -U postgres -d repuestos_app -f backend/sql/seed.sql
```

### 4. Instalar y ejecutar backend

```bash
cd backend
copy .env.example .env
npm install
npm run dev
```

La API queda disponible en:

```text
http://localhost:4000/api
```

Endpoint de prueba:

```text
http://localhost:4000/api/health
```

### 5. Instalar y ejecutar frontend

Abrir una segunda terminal:

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

La aplicacion queda disponible normalmente en:

```text
http://localhost:5173
```

## Endpoints principales

### Autenticacion

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Dashboard

- `GET /api/dashboard`

### Solicitudes

- `GET /api/requests`
- `POST /api/requests`
- `PATCH /api/requests/:id/status`
- `GET /api/requests/:id/history`

### Repuestos

- `GET /api/parts`
- `POST /api/parts`
- `PATCH /api/parts/:id`

### Proveedores

- `GET /api/providers`
- `POST /api/providers`

### Usuarios

- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id`

## Flujo general del sistema

1. El tecnico inicia sesion.
2. Registra una solicitud de repuesto.
3. El sistema guarda la solicitud con estado `pendiente`.
4. El area de almacen revisa la solicitud.
5. Si el repuesto esta disponible, se aprueba y se gestiona la entrega.
6. Si no esta disponible, se consulta o asigna un proveedor.
7. Almacen actualiza el estado de la solicitud.
8. El tecnico consulta el resultado.
9. El administrador revisa usuarios, historial y reportes.

## Seguridad

- Las contrasenas se almacenan cifradas con bcrypt.
- La autenticacion usa tokens JWT.
- El backend valida permisos segun rol.
- El archivo `.env` no debe subirse al repositorio.

## Estado actual del proyecto

El proyecto se encuentra en una version funcional de entrega academica. Permite demostrar el flujo principal del sistema y cubre los requisitos funcionales principales planteados para la gestion de solicitudes de repuestos.

## Funcionalidades pendientes o no implementadas

- Recuperacion de contrasena por correo electronico.
- Notificaciones automaticas por email.
- Reportes exportables en PDF o Excel.
- Validacion avanzada de stock antes de aprobar solicitudes.
- Integracion real con sistemas externos de proveedores.
- Despliegue productivo con dominio propio.

Estas funcionalidades no se implementaron porque el alcance principal de la entrega se concentro en construir el flujo central del proceso: autenticacion, roles, solicitudes, inventario, proveedores, trazabilidad y panel de resumen.
