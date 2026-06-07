import { Router } from "express";
import { query } from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const userFilter = req.user.role === "tecnico" ? "where user_id = $1" : "";
    const params = req.user.role === "tecnico" ? [req.user.id] : [];

    const [totals, byStatus, lowStock, recent] = await Promise.all([
      query(`select count(*)::int as total from requests ${userFilter}`, params),
      query(
        `select status, count(*)::int as total
         from requests
         ${userFilter}
         group by status
         order by status`,
        params
      ),
      query(
        `select id, code, name, stock, min_stock
         from parts
         where stock <= min_stock
         order by stock asc
         limit 8`
      ),
      query(
        `select r.id, r.status, r.created_at, p.name as part_name, u.name as user_name
         from requests r
         join parts p on p.id = r.part_id
         join users u on u.id = r.user_id
         ${req.user.role === "tecnico" ? "where r.user_id = $1" : ""}
         order by r.created_at desc
         limit 8`,
        params
      )
    ]);

    res.json({
      totalRequests: totals.rows[0].total,
      requestsByStatus: byStatus.rows,
      lowStock: lowStock.rows,
      recentRequests: recent.rows
    });
  } catch (error) {
    next(error);
  }
});

export default router;
