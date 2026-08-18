import { env } from "cloudflare:workers";

let ready: Promise<void> | null = null;

export function ensureReceiptsSchema() {
  if (!ready) {
    const db = env.DB;
    ready = db.batch([
      db.prepare(`CREATE TABLE IF NOT EXISTS receipts (
        id text PRIMARY KEY NOT NULL,
        receipt_date text NOT NULL,
        arrival_time text NOT NULL,
        sese_id text NOT NULL,
        shift text NOT NULL,
        origin text NOT NULL,
        receipt_type text NOT NULL,
        warehouse text NOT NULL,
        gate text NOT NULL,
        supplier text NOT NULL,
        carrier text NOT NULL,
        invoice_number text NOT NULL,
        vehicle_plate text NOT NULL,
        driver text DEFAULT '' NOT NULL,
        status text DEFAULT 'AGUARDANDO' NOT NULL,
        has_divergence integer DEFAULT false NOT NULL,
        divergence_description text DEFAULT '' NOT NULL,
        notes text DEFAULT '' NOT NULL,
        created_by text NOT NULL,
        completed_at text,
        created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
      )`),
      db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS receipts_supplier_invoice_unique ON receipts (supplier, invoice_number)"),
      db.prepare("CREATE INDEX IF NOT EXISTS receipts_status_idx ON receipts (status)"),
      db.prepare("CREATE INDEX IF NOT EXISTS receipts_date_idx ON receipts (receipt_date)"),
    ]).then(() => undefined).catch((error) => { ready = null; throw error; });
  }
  return ready;
}
