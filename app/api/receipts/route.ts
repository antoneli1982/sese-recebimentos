import { and, desc, eq, like, or } from "drizzle-orm";
import { getDb } from "@/db";
import { ensureReceiptsSchema } from "@/db/ensure";
import { receipts } from "@/db/schema";

const allowedStatuses = new Set(["AGUARDANDO", "NO_GATE", "ENCAMINHADO", "NO_ALMOXARIFADO", "CONCLUIDO"]);
const clean = (value: unknown) => typeof value === "string" ? value.trim() : "";
function errorMessage(error: unknown) { const message = error instanceof Error ? error.message : "Falha inesperada"; return message.includes("no such table") ? "O banco ainda está sendo preparado. Tente novamente em alguns instantes." : message; }

export async function GET(request: Request) {
  try {
    await ensureReceiptsSchema();
    const url = new URL(request.url); const conditions = [];
    const status = clean(url.searchParams.get("status")); const gate = clean(url.searchParams.get("gate"));
    const shift = clean(url.searchParams.get("shift")); const origin = clean(url.searchParams.get("origin"));
    const search = clean(url.searchParams.get("search"));
    if (status) conditions.push(eq(receipts.status, status)); if (gate) conditions.push(eq(receipts.gate, gate));
    if (shift) conditions.push(eq(receipts.shift, shift)); if (origin) conditions.push(eq(receipts.origin, origin));
    if (search) { const term = `%${search}%`; conditions.push(or(like(receipts.invoiceNumber, term), like(receipts.supplier, term), like(receipts.carrier, term), like(receipts.vehiclePlate, term), like(receipts.seseId, term))!); }
    const rows = await getDb().select().from(receipts).where(conditions.length ? and(...conditions) : undefined).orderBy(desc(receipts.createdAt)).limit(300);
    return Response.json({ receipts: rows });
  } catch (error) { return Response.json({ error: errorMessage(error) }, { status: 500 }); }
}

export async function POST(request: Request) {
  try {
    await ensureReceiptsSchema();
    const payload = (await request.json()) as Record<string, unknown>;
    const required = ["receiptDate", "arrivalTime", "seseId", "shift", "origin", "receiptType", "warehouse", "gate", "supplier", "carrier", "invoiceNumber", "vehiclePlate"];
    if (required.some((field) => !clean(payload[field]))) return Response.json({ error: "Preencha todos os campos obrigatórios." }, { status: 400 });
    const db = getDb(); const supplier = clean(payload.supplier).toUpperCase(); const invoiceNumber = clean(payload.invoiceNumber).toUpperCase();
    const duplicate = await db.select({ id: receipts.id }).from(receipts).where(and(eq(receipts.supplier, supplier), eq(receipts.invoiceNumber, invoiceNumber))).limit(1);
    if (duplicate.length) return Response.json({ error: "Esta nota fiscal já foi registrada para o fornecedor informado." }, { status: 409 });
    const now = new Date().toISOString();
    const record = { id: crypto.randomUUID(), receiptDate: clean(payload.receiptDate), arrivalTime: clean(payload.arrivalTime), seseId: clean(payload.seseId).toUpperCase(), shift: clean(payload.shift), origin: clean(payload.origin), receiptType: clean(payload.receiptType), warehouse: clean(payload.warehouse), gate: clean(payload.gate), supplier, carrier: clean(payload.carrier).toUpperCase(), invoiceNumber, vehiclePlate: clean(payload.vehiclePlate).toUpperCase(), driver: clean(payload.driver).toUpperCase(), status: "AGUARDANDO", hasDivergence: Boolean(payload.hasDivergence), divergenceDescription: clean(payload.divergenceDescription), notes: clean(payload.notes), createdBy: request.headers.get("oai-authenticated-user-email") ?? (clean(payload.createdBy) || "Usuário SESÉ"), completedAt: null, createdAt: now, updatedAt: now };
    await db.insert(receipts).values(record); return Response.json({ receipt: record }, { status: 201 });
  } catch (error) { return Response.json({ error: errorMessage(error) }, { status: 500 }); }
}

export async function PATCH(request: Request) {
  try {
    await ensureReceiptsSchema();
    const payload = (await request.json()) as Record<string, unknown>; const id = clean(payload.id); const status = clean(payload.status);
    if (!id || !allowedStatuses.has(status)) return Response.json({ error: "Atualização inválida." }, { status: 400 });
    const now = new Date().toISOString(); await getDb().update(receipts).set({ status, updatedAt: now, completedAt: status === "CONCLUIDO" ? now : null }).where(eq(receipts.id, id));
    return Response.json({ ok: true });
  } catch (error) { return Response.json({ error: errorMessage(error) }, { status: 500 }); }
}
