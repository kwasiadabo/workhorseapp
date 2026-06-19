const MAX_EXPORT_PAGES = 50;
const EXPORT_PAGE_SIZE = 100;

// Fetches every page of a paginated list endpoint (up to a safety cap) so
// export/print can operate on the full filtered result set rather than just
// the currently-displayed page. `listFn` is a `*.api.js#list` function.
export const fetchAllPages = async (listFn, params = {}) => {
  let page = 1;
  let totalPages;
  const items = [];

  do {
    const res = await listFn({ ...params, page, limit: EXPORT_PAGE_SIZE });
    items.push(...(res.data ?? []));
    totalPages = res.meta?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages && page <= MAX_EXPORT_PAGES);

  return items;
};

const escapeCsvValue = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
};

// `columns`: [{ header, value: (row) => string | number }]
export const downloadCsv = (filename, columns, rows) => {
  const lines = [
    columns.map((col) => escapeCsvValue(col.header)).join(','),
    ...rows.map((row) => columns.map((col) => escapeCsvValue(col.value(row))).join(',')),
  ];

  const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

// `columns`: [{ header, value: (row) => string | number }]
// `totals` (optional): values aligned to `columns`, rendered as a bold footer row.
export const printTable = ({ title, subtitle, columns, rows, totals }) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const headerCells = columns.map((col) => `<th>${escapeHtml(col.header)}</th>`).join('');
  const bodyRows = rows
    .map((row) => `<tr>${columns.map((col) => `<td>${escapeHtml(col.value(row))}</td>`).join('')}</tr>`)
    .join('');
  const totalsRow = totals
    ? `<tr class="totals">${columns.map((_col, index) => `<td>${escapeHtml(totals[index] ?? '')}</td>`).join('')}</tr>`
    : '';

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 24px; color: #111; }
      h1 { font-size: 18px; margin: 0 0 4px; }
      .subtitle { font-size: 12px; color: #555; margin: 0 0 16px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      th { background: #f3f3f3; }
      tr.totals td { font-weight: 600; border-top: 2px solid #333; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ''}
    <table>
      <thead><tr>${headerCells}</tr></thead>
      <tbody>${bodyRows}${totalsRow}</tbody>
    </table>
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};
