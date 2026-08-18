import { sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const receipts = sqliteTable("receipts", {
  id: text("id").primaryKey(), receiptDate: text("receipt_date").notNull(), arrivalTime: text("arrival_time").notNull(),
  seseId: text("sese_id").notNull(), shift: text("shift").notNull(), origin: text("origin").notNull(),
  receiptType: text("receipt_type").notNull(), warehouse: text("warehouse").notNull(), gate: text("gate").notNull(),
  supplier: text("supplier").notNull(), carrier: text("carrier").notNull(), invoiceNumber: text("invoice_number").notNull(),
  vehiclePlate: text("vehicle_plate").notNull(), driver: text("driver").notNull().default(""),
  status: text("status").notNull().default("AGUARDANDO"),
  hasDivergence: integer("has_divergence", { mode: "boolean" }).notNull().default(false),
  divergenceDescription: text("divergence_description").notNull().default(""), notes: text("notes").notNull().default(""),
  createdBy: text("created_by").notNull(), completedAt: text("completed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`), updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("receipts_supplier_invoice_unique").on(table.supplier, table.invoiceNumber),
  index("receipts_status_idx").on(table.status),
  index("receipts_date_idx").on(table.receiptDate),
]);
