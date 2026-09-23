import { logOrder, type AffiliateOrder } from './business-intelligence.js';

type ImportResult = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; error: string }>;
  orders: AffiliateOrder[];
};

const normalizeHeader = (value: string) => value.trim().toLowerCase().replace(/[\s-]+/g, '_');

const aliases: Record<string, string[]> = {
  order_id: ['order_id', 'orderid', 'order', 'transaction_id', 'transactionid'],
  content_id: ['content_id', 'contentid', 'creative_id', 'creativeid'],
  product_id: ['product_id', 'productid', 'sku', 'item_id', 'itemid'],
  click_id: ['click_id', 'clickid', 'tracking_id', 'trackingid'],
  affiliate_network: ['affiliate_network', 'network', 'affiliate', 'source'],
  order_timestamp: ['order_timestamp', 'order_date', 'orderdate', 'date', 'timestamp'],
  order_status: ['order_status', 'status'],
  order_value: ['order_value', 'order_amount', 'amount', 'sale_amount', 'sale_value'],
  commission: ['commission', 'commission_amount', 'earnings', 'payout'],
  commission_status: ['commission_status', 'payout_status'],
  currency: ['currency', 'curr'],
};

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cell += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === ',' && !quoted) {
      cells.push(cell.trim());
      cell = '';
    } else {
      cell += ch;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function splitCsv(csv: string): string[][] {
  const rows: string[][] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      current += ch;
      if (quoted && csv[i + 1] === '"') { current += csv[++i]; }
      else quoted = !quoted;
    } else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (current.trim()) rows.push(parseCsvLine(current));
      current = '';
      if (ch === '\r' && csv[i + 1] === '\n') i++;
    } else {
      current += ch;
    }
  }
  if (current.trim()) rows.push(parseCsvLine(current));
  return rows;
}

function pick(row: Record<string, string>, key: string): string {
  for (const alias of aliases[key] ?? [key]) {
    const value = row[normalizeHeader(alias)];
    if (value != null && value.trim() !== '') return value.trim();
  }
  return '';
}

function numberValue(value: string, field: string, required = false): number | undefined {
  if (!value) {
    if (required) throw new Error(field + ' is required');
    return undefined;
  }
  const cleaned = value.replace(/[₹$,\s]/g, '');
  const n = Number(cleaned);
  if (!Number.isFinite(n)) throw new Error(field + ' must be a number');
  return n;
}

function validStatus(value: string): AffiliateOrder['orderStatus'] {
  const normalized = value.toLowerCase();
  if (normalized === 'pending' || normalized === 'confirmed' || normalized === 'cancelled' || normalized === 'returned') return normalized;
  throw new Error('order_status must be pending, confirmed, cancelled, or returned');
}

export async function importAffiliateCsv(csv: string): Promise<ImportResult> {
  if (Buffer.byteLength(csv, 'utf8') > 2 * 1024 * 1024) throw new Error('CSV exceeds 2 MB limit');
  const rows = splitCsv(csv);
  if (rows.length < 2) throw new Error('CSV must contain a header row and at least one data row');

  const headers = rows[0].map(normalizeHeader);
  const result: ImportResult = { imported: 0, skipped: 0, errors: [], orders: [] };

  for (let i = 1; i < rows.length; i++) {
    const values = rows[i];
    if (values.every(v => !v.trim())) continue;
    const row = Object.fromEntries(headers.map((h, index) => [h, values[index] ?? '']));
    try {
      const orderId = pick(row, 'order_id');
      const network = pick(row, 'affiliate_network');
      const orderTimestamp = pick(row, 'order_timestamp');
      const status = pick(row, 'order_status');
      const orderValue = numberValue(pick(row, 'order_value'), 'order_value', true);
      const commission = numberValue(pick(row, 'commission'), 'commission', true);
      if (!orderId) throw new Error('order_id is required');
      if (!network) throw new Error('affiliate_network is required');
      if (!orderTimestamp) throw new Error('order_timestamp is required');
      if (!status) throw new Error('order_status is required');

      const order = await logOrder({
        order_id: orderId,
        content_id: pick(row, 'content_id') || undefined,
        product_id: pick(row, 'product_id') || undefined,
        click_id: pick(row, 'click_id') || undefined,
        affiliate_network: network,
        orderTimestamp,
        orderStatus: validStatus(status),
        orderValue,
        commission,
        commissionStatus: pick(row, 'commission_status') || (status.toLowerCase() === 'confirmed' ? 'confirmed' : 'pending'),
        currency: pick(row, 'currency') || 'INR',
      });
      result.imported++;
      result.orders.push(order);
    } catch (error) {
      result.skipped++;
      result.errors.push({ row: i + 1, error: error instanceof Error ? error.message : 'Invalid row' });
    }
  }
  return result;
}
