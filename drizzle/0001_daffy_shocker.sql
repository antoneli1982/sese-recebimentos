CREATE UNIQUE INDEX `receipts_supplier_invoice_unique` ON `receipts` (`supplier`,`invoice_number`);--> statement-breakpoint
CREATE INDEX `receipts_status_idx` ON `receipts` (`status`);--> statement-breakpoint
CREATE INDEX `receipts_date_idx` ON `receipts` (`receipt_date`);