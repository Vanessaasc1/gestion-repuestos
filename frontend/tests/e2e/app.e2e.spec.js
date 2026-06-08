import { expect, test } from "@playwright/test";

const dashboard = {
  totalRequests: 1,
  requestsByStatus: [{ status: "pendiente", total: 1 }],
  lowStock: [{ id: 2, code: "RP-002", name: "Correa A-42", stock: 4, min_stock: 6 }],
  recentRequests: [{ id: 1, status: "pendiente", part_name: "Filtro hidraulico", user_name: "Vanessa" }]
};

const parts = [
  { id: 1, code: "RP-001", name: "Filtro hidraulico", stock: 12, min_stock: 5, provider_name: "Proveedor Norte" },
  { id: 2, code: "RP-002", name: "Correa A-42", stock: 4, min_stock: 6, provider_name: "Proveedor Local" }
];

const history = [
  {
    id: 1,
    request_id: 1,
    from_status: null,
    to_status: "pendiente",
    changed_by_name: "Vanessa",
    note: "Solicitud registrada",
    created_at: "2026-06-07T20:00:00.000Z"
  },
  {
    id: 2,
    request_id: 1,
    from_status: "pendiente",
    to_status: "aprobada",
    changed_by_name: "Almacen",
    note: "Solicitud aprobada",
    created_at: "2026-06-07T20:05:00.000Z"
  }
];

async function mockApi(page, role = "tecnico") {
  let requests = [
    {
      id: 1,
      user_name: "Vanessa",
      part_name: "Filtro hidraulico",
      quantity: 2,
      justification: "Mantenimiento preventivo",
      status: "pendiente",
      provider_name: "Proveedor Norte"
    }
  ];

  await page.route("**/api/auth/login", async (route) => {
    await route.fulfill({
      json: {
        token: "token-demo",
        user: {
          id: 1,
          name: role === "admin" ? "Admin Demo" : "Tecnico Demo",
          email: "demo@test.com",
          role
        }
      }
    });
  });

  await page.route("**/api/dashboard", async (route) => {
    await route.fulfill({ json: dashboard });
  });

  await page.route("**/api/parts", async (route) => {
    await route.fulfill({ json: parts });
  });

  await page.route("**/api/providers", async (route) => {
    await route.fulfill({ json: [] });
  });

  await page.route("**/api/requests/1/history", async (route) => {
    await route.fulfill({ json: history });
  });

  await page.route("**/api/requests", async (route) => {
    if (route.request().method() === "POST") {
      requests = [
        {
          id: 2,
          user_name: "Tecnico Demo",
          part_name: "Filtro hidraulico",
          quantity: 1,
          justification: "Cambio por mantenimiento",
          status: "pendiente",
          provider_name: "Proveedor Norte"
        },
        ...requests
      ];
      await route.fulfill({ status: 201, json: requests[0] });
      return;
    }

    await route.fulfill({ json: requests });
  });
}

async function login(page, role = "tecnico") {
  await mockApi(page, role);
  await page.goto("/");
  await page.getByPlaceholder("Correo").fill("demo@test.com");
  await page.getByPlaceholder("Clave").fill("Clave123");
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
}

test.describe("Gestion de repuestos E2E", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("permite iniciar sesion y ver el panel principal", async ({ page }) => {
    await login(page);

    await expect(page.getByText("Usuario activo")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Tecnico Demo" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Solicitudes" })).toBeVisible();
    await expect(page.getByText("Bajo stock", { exact: true })).toBeVisible();
  });

  test("permite crear una solicitud de repuesto", async ({ page }) => {
    await login(page);
    await page.getByRole("button", { name: "Solicitudes" }).click();

    await page.getByRole("combobox").first().selectOption("1");
    await page.getByRole("spinbutton").fill("1");
    await page.getByPlaceholder("Justificacion").fill("Cambio por mantenimiento");
    await page.getByRole("button", { name: "Registrar" }).click();

    await expect(page.getByText("#2 Filtro hidraulico")).toBeVisible();
    await expect(page.getByText("Cambio por mantenimiento")).toBeVisible();
  });

  test("muestra la trazabilidad de una solicitud", async ({ page }) => {
    await login(page, "admin");
    await page.getByRole("button", { name: "Solicitudes" }).click();
    await page.getByRole("button", { name: "Trazabilidad" }).first().click();

    await expect(page.getByText("inicio a pendiente")).toBeVisible();
    await expect(page.getByText("pendiente a aprobada")).toBeVisible();
    await expect(page.getByText("Solicitud aprobada")).toBeVisible();
  });
});
