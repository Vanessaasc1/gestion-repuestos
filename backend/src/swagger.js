export const swaggerDocument = {
  openapi: "3.0.0",
  info: {
    title: "API Sistema de Gestion de Repuestos",
    version: "1.0.0",
    description: "Documentacion de endpoints para autenticacion, usuarios, repuestos, proveedores, solicitudes, trazabilidad y dashboard."
  },
  servers: [
    {
      url: "http://localhost:4000/api",
      description: "Servidor local"
    }
  ],
  tags: [
    { name: "Auth", description: "Autenticacion y sesion" },
    { name: "Dashboard", description: "Indicadores resumidos del sistema" },
    { name: "Requests", description: "Solicitudes de repuestos y trazabilidad" },
    { name: "Parts", description: "Inventario de repuestos" },
    { name: "Providers", description: "Gestion de proveedores" },
    { name: "Users", description: "Gestion de usuarios y roles" }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      }
    },
    schemas: {
      LoginRequest: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", example: "admin@test.com" },
          password: { type: "string", example: "Admin123" }
        }
      },
      RegisterRequest: {
        type: "object",
        required: ["name", "email", "password"],
        properties: {
          name: { type: "string", example: "Vanessa Ascencio" },
          email: { type: "string", example: "vanessa@test.com" },
          password: { type: "string", example: "Clave123" },
          role: { type: "string", enum: ["admin", "almacen", "tecnico"], example: "tecnico" }
        }
      },
      User: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Vanessa Ascencio" },
          email: { type: "string", example: "vanessa@test.com" },
          role: { type: "string", example: "tecnico" },
          active: { type: "boolean", example: true }
        }
      },
      Part: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          code: { type: "string", example: "RP-001" },
          name: { type: "string", example: "Filtro hidraulico" },
          description: { type: "string", example: "Filtro para sistema hidraulico principal" },
          stock: { type: "integer", example: 12 },
          min_stock: { type: "integer", example: 5 },
          provider_id: { type: "integer", nullable: true, example: 1 }
        }
      },
      Provider: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          name: { type: "string", example: "Proveedor Industrial Norte" },
          contact_name: { type: "string", example: "Laura Gomez" },
          phone: { type: "string", example: "3001112233" },
          email: { type: "string", example: "ventas@proveedor.test" },
          address: { type: "string", example: "Zona industrial" }
        }
      },
      Request: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          user_id: { type: "integer", example: 1 },
          part_id: { type: "integer", example: 2 },
          quantity: { type: "integer", example: 3 },
          justification: { type: "string", example: "Mantenimiento preventivo" },
          status: { type: "string", example: "pendiente" },
          provider_id: { type: "integer", nullable: true, example: null }
        }
      },
      RequestHistory: {
        type: "object",
        properties: {
          id: { type: "integer", example: 1 },
          request_id: { type: "integer", example: 1 },
          from_status: { type: "string", nullable: true, example: "pendiente" },
          to_status: { type: "string", example: "aprobada" },
          changed_by_name: { type: "string", example: "Administrador" },
          note: { type: "string", example: "Solicitud aprobada" },
          created_at: { type: "string", format: "date-time" }
        }
      },
      Error: {
        type: "object",
        properties: {
          message: { type: "string", example: "No tiene permisos para esta accion" }
        }
      }
    }
  },
  paths: {
    "/health": {
      get: {
        tags: ["Dashboard"],
        summary: "Verificar estado de la API",
        responses: {
          200: { description: "API disponible" }
        }
      }
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Registrar usuario",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          201: { description: "Usuario registrado" },
          409: { description: "Correo ya registrado" }
        }
      }
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Iniciar sesion",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/LoginRequest" }
            }
          }
        },
        responses: {
          200: { description: "Sesion iniciada" },
          401: { description: "Credenciales invalidas" }
        }
      }
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Consultar usuario autenticado",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Usuario autenticado" },
          401: { description: "Token invalido" }
        }
      }
    },
    "/dashboard": {
      get: {
        tags: ["Dashboard"],
        summary: "Consultar indicadores del panel",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Resumen del proceso" },
          401: { description: "No autenticado" }
        }
      }
    },
    "/requests": {
      get: {
        tags: ["Requests"],
        summary: "Listar solicitudes",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "userId", in: "query", schema: { type: "integer" } },
          { name: "from", in: "query", schema: { type: "string", format: "date" } },
          { name: "to", in: "query", schema: { type: "string", format: "date" } }
        ],
        responses: {
          200: { description: "Lista de solicitudes" }
        }
      },
      post: {
        tags: ["Requests"],
        summary: "Crear solicitud de repuesto",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["part_id", "quantity", "justification"],
                properties: {
                  part_id: { type: "integer", example: 1 },
                  quantity: { type: "integer", example: 2 },
                  justification: { type: "string", example: "Repuesto requerido para mantenimiento" }
                }
              }
            }
          }
        },
        responses: {
          201: { description: "Solicitud creada" },
          403: { description: "Rol no autorizado" }
        }
      }
    },
    "/requests/{id}/status": {
      patch: {
        tags: ["Requests"],
        summary: "Actualizar estado de una solicitud",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["status"],
                properties: {
                  status: {
                    type: "string",
                    enum: ["pendiente", "aprobada", "rechazada", "en_proveedor", "entregada", "cerrada"],
                    example: "aprobada"
                  },
                  note: { type: "string", example: "Solicitud aprobada por almacen" },
                  provider_id: { type: "integer", nullable: true, example: 1 }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Estado actualizado" },
          400: { description: "Estado no permitido" },
          403: { description: "Rol no autorizado" },
          404: { description: "Solicitud no encontrada" }
        }
      }
    },
    "/requests/{id}/history": {
      get: {
        tags: ["Requests"],
        summary: "Consultar trazabilidad de una solicitud",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Historial de cambios" }
        }
      }
    },
    "/parts": {
      get: {
        tags: ["Parts"],
        summary: "Listar repuestos",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Inventario disponible" }
        }
      },
      post: {
        tags: ["Parts"],
        summary: "Crear repuesto",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Part" }
            }
          }
        },
        responses: {
          201: { description: "Repuesto creado" },
          403: { description: "Rol no autorizado" }
        }
      }
    },
    "/parts/{id}": {
      patch: {
        tags: ["Parts"],
        summary: "Actualizar repuesto",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        responses: {
          200: { description: "Repuesto actualizado" },
          403: { description: "Rol no autorizado" }
        }
      }
    },
    "/providers": {
      get: {
        tags: ["Providers"],
        summary: "Listar proveedores",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de proveedores" }
        }
      },
      post: {
        tags: ["Providers"],
        summary: "Crear proveedor",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/Provider" }
            }
          }
        },
        responses: {
          201: { description: "Proveedor creado" },
          403: { description: "Rol no autorizado" }
        }
      }
    },
    "/users": {
      get: {
        tags: ["Users"],
        summary: "Listar usuarios",
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: "Lista de usuarios" },
          403: { description: "Rol no autorizado" }
        }
      },
      post: {
        tags: ["Users"],
        summary: "Crear usuario desde administracion",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/RegisterRequest" }
            }
          }
        },
        responses: {
          201: { description: "Usuario creado" },
          403: { description: "Rol no autorizado" }
        }
      }
    },
    "/users/{id}": {
      patch: {
        tags: ["Users"],
        summary: "Actualizar rol o estado de usuario",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "integer" } }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["admin", "almacen", "tecnico"] },
                  active: { type: "boolean" }
                }
              }
            }
          }
        },
        responses: {
          200: { description: "Usuario actualizado" },
          403: { description: "Rol no autorizado" }
        }
      }
    }
  }
};
