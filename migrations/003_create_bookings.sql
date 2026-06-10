CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  icon_link TEXT NOT NULL,
  payment_info JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO payment_methods (name, icon_link, payment_info) VALUES
  ('Cash',  '/icons/cash.svg',  '{}'),
  ('GoPay', '/icons/gopay.svg', '{"account": ""}'),
  ('OVO',   '/icons/ovo.svg',   '{"account": ""}')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS beacons (
  driver_id  UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  is_active  BOOLEAN NOT NULL DEFAULT false,
  latitude   DECIMAL(10, 8),
  longitude  DECIMAL(11, 8),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  pickup_location TEXT NOT NULL,
  stops           TEXT[],
  destination     TEXT NOT NULL,

  driver_ready_at      TIMESTAMPTZ,
  delivery_start_time  TIMESTAMPTZ,
  delivery_end_time    TIMESTAMPTZ,

  customer_id        UUID NOT NULL REFERENCES users(id),
  driver_id          UUID REFERENCES users(id),

  payment_method_id  UUID NOT NULL REFERENCES payment_methods(id),
  price              DECIMAL(10, 2) NOT NULL,
  distance           DECIMAL(10, 2) NOT NULL,
  payment_status     BOOLEAN NOT NULL DEFAULT false,

  stage              SMALLINT NOT NULL DEFAULT 1,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS bookings_customer_id_idx ON bookings (customer_id);
CREATE INDEX IF NOT EXISTS bookings_driver_id_idx   ON bookings (driver_id);
CREATE INDEX IF NOT EXISTS bookings_stage_idx       ON bookings (stage);
