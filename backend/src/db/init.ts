import 'dotenv/config';

import { pool } from './index';

export async function initDatabase() {
  await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'batch_status') THEN
        CREATE TYPE batch_status AS ENUM ('draft', 'processing', 'completed', 'archived');
      END IF;
    END
    $$;
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS pricing_rule (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      courier text NOT NULL,
      first_weight double precision NOT NULL,
      first_weight_price double precision NOT NULL,
      extra_weight_price double precision NOT NULL,
      base_operation_fee double precision NOT NULL,
      tolerance_express_fee double precision NOT NULL,
      tolerance_packaging_fee double precision NOT NULL,
      enabled boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reconciliation_batch (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      courier text NOT NULL,
      reconciliation_month text NOT NULL,
      total_difference double precision NOT NULL DEFAULT 0,
      exception_count integer NOT NULL DEFAULT 0,
      pending_exception_count integer NOT NULL DEFAULT 0,
      status batch_status NOT NULL DEFAULT 'draft',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_detail (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      batch_id uuid NOT NULL REFERENCES reconciliation_batch(id),
      waybill_number text NOT NULL,
      courier text NOT NULL,
      province text NOT NULL,
      shipping_date timestamptz NOT NULL,
      total_difference double precision NOT NULL DEFAULT 0,
      exception_types text[] NOT NULL DEFAULT '{}',
      conclusion text NOT NULL DEFAULT 'pending',
      processing_note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    );
  `);

  await pool.query(`
    ALTER TABLE order_detail
    ADD COLUMN IF NOT EXISTS raw_data jsonb;
  `);
}

if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('Database schema initialized.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database init failed:', error);
      process.exit(1);
    });
}
