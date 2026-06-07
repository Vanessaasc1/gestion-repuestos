drop table if exists request_history;
drop table if exists requests;
drop table if exists parts;
drop table if exists providers;
drop table if exists users;
drop type if exists user_role;
drop type if exists request_status;

create type user_role as enum ('admin', 'almacen', 'tecnico');
create type request_status as enum ('pendiente', 'aprobada', 'rechazada', 'en_proveedor', 'entregada', 'cerrada');

create table users (
  id serial primary key,
  name varchar(120) not null,
  email varchar(160) not null unique,
  password_hash text not null,
  role user_role not null default 'tecnico',
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table providers (
  id serial primary key,
  name varchar(140) not null,
  contact_name varchar(140),
  phone varchar(40),
  email varchar(160),
  address varchar(220),
  created_at timestamptz not null default now()
);

create table parts (
  id serial primary key,
  code varchar(60) not null unique,
  name varchar(140) not null,
  description text,
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  provider_id integer references providers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table requests (
  id serial primary key,
  user_id integer not null references users(id),
  part_id integer not null references parts(id),
  quantity integer not null check (quantity > 0),
  justification text not null,
  status request_status not null default 'pendiente',
  provider_id integer references providers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table request_history (
  id serial primary key,
  request_id integer not null references requests(id) on delete cascade,
  from_status request_status,
  to_status request_status not null,
  changed_by integer not null references users(id),
  note text,
  created_at timestamptz not null default now()
);

create index idx_requests_status on requests(status);
create index idx_requests_created_at on requests(created_at);
create index idx_requests_user_id on requests(user_id);
create index idx_request_history_request_id on request_history(request_id);
