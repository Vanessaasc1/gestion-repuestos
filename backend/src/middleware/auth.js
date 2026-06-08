import jwt from "jsonwebtoken";

/**
 * Validates the JWT sent in the Authorization header.
 *
 * When the token is valid, the decoded user information is stored in `req.user`
 * so route handlers can identify the authenticated user.
 *
 * @param {import("express").Request} req Express request.
 * @param {import("express").Response} res Express response.
 * @param {import("express").NextFunction} next Express next callback.
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
 * Allows access only to users whose role is included in the permitted roles.
 *
 * @param {...string} roles Roles allowed to execute the protected action.
 * @returns {import("express").RequestHandler} Express middleware.
 */
export function allowRoles(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "No tiene permisos para esta accion" });
    }

    next();
  };
}
