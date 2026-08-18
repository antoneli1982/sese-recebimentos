import { getDb } from "@/db";
import { ensureReceiptsSchema } from "@/db/ensure";
import { receipts } from "@/db/schema";

const required = [
  "receiptDate", "arrivalTime", "seseId", "shift", "origin", "receiptType",
  "warehouse", "gate", "supplier", "carrier", "invoiceNumber", "vehiclePlate",
] as const;

const statuses = new Set(["AGUARDANDO", "NO_GATE", "ENCAMINHADO", "NO_ALMOXARIFADO", "CONCLUIDO"]);
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";

function chunks<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

export async function POST(request: Request) {
  try {
    await ensureReceiptsSchema();
    const payload = (await request.json()) as { records?: Array<Record<string, unknown>> };
    const rows = Array.isArray(payload.records) ? payload.records.slice(0, 1000) : [];
    if (!rows.length) return Response.json({ error: "A planilha não possui registros para importar." }, { status: 400 });

    const createdBy = request.headers.get("oai-authenticated-user-email") ?? "Importação Excel";
    const now = new Date().toISOString();
    const seen = new Set<string>();
    let invalid = 0;
    let repeatedInFile = 0;

    const validRows = rows.flatMap((row) => {
      if (required.some((field) => !clean(row[field]))) {
        invalid += 1;
        return [];
      }
      const supplier = clean(row.supplier).toUpperCase();
      const invoiceNumber = clean(row.invoiceNumber).toUpperCase();
      const uniqueKey = `${supplier}\u0000${invoiceNumber}`;
      if (seen.has(uniqueKey)) {
        repeatedInFile += 1;
        return [];
      }
      seen.add(uniqueKey);
      const importedStatus = clean(row.status).toUpperCase();
      return [{
        id: crypto.randomUUID(), receiptDate: clean(row.receiptDate), arrivalTime: clean(row.arrivalTime),
        seseId: clean(row.seseId).toUpperCase(), shift: clean(row.shift).toUpperCase(), origin: clean(row.origin).toUpperCase(),
        receiptType: clean(row.receiptType).toUpperCase(), warehouse: clean(row.warehouse).toUpperCase(), gate: clean(row.gate).toUpperCase(),
        supplier, carrier: clean(row.carrier).toUpperCase(), invoiceNumber, vehiclePlate: clean(row.vehiclePlate).toUpperCase(),
        driver: clean(row.driver).toUpperCase(), status: statuses.has(importedStatus) ? importedStatus : "AGUARDANDO",
        hasDivergence: Boolean(row.hasDivergence), divergenceDescription: clean(row.divergenceDescription), notes: clean(row.notes),
        createdBy, completedAt: null, createdAt: now, updatedAt: now,
      }];
    });

    let inserted = 0;
    const db = getDb();
    for (const group of chunks(validRows, 25)) {
      if (!group.length) continue;
      const saved = await db.insert(receipts).values(group).onConflictDoNothing().returning({ id: receipts.id });
      inserted += saved.length;
    }

    const duplicates = validRows.length - inserted + repeatedInFile;
    return Response.json({ inserted, duplicates, invalid, received: rows.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Não foi possível importar a planilha.";
    return Response.json({ error: message }, { status: 500 });
  }
}
