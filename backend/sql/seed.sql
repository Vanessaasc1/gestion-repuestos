insert into providers (name, contact_name, phone, email, address) values
  ('Proveedor Industrial Norte', 'Laura Gomez', '3001112233', 'ventas@norte.test', 'Zona industrial'),
  ('Repuestos Locales SAS', 'Carlos Rojas', '3105557788', 'contacto@locales.test', 'Centro');

insert into parts (code, name, description, stock, min_stock, provider_id) values
  ('RP-001', 'Filtro hidraulico', 'Filtro para sistema hidraulico principal', 12, 5, 1),
  ('RP-002', 'Correa A-42', 'Correa de transmision industrial', 4, 6, 2),
  ('RP-003', 'Rodamiento 6205', 'Rodamiento sellado de uso general', 25, 10, 1),
  ('RP-004', 'Sensor de presion', 'Sensor para linea de aire comprimido', 2, 3, 2);
