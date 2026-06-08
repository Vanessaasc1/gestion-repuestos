import jwt from "jsonwebtoken";

/**
 * Valida el JWT enviado en el encabezado Authorization.
 *
 * Cuando el token es valido, la informacion del usuario se guarda en `req.user`
 * para que las rutas puedan identificar al usuario autenticado.
 *
 * @param {import("express").Request} req Solicitud de Express.
 * @param {import("express").Response} res Respuesta de Express.
 * @param {import("express").NextFunction} next Funcion para continuar el flujo.
 * @returns {void}
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token no enviado" });
  }

  try {
    const token = header.replace("Bearer ", "");
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: "Sesion invalida o expirada" });
  }
}

/**
 * Permite el acceso solo a usuarios cuyo rol este dentro de los roles permitidos.
 *
 * @param {...string} roles Roles autorizados para ejecutar la accion protegida.
 * @returns {import("express").RequestHandler} Middleware de Express.
 */
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tiene permisos para esta accion" });
    }

    next();
  };
}
