import { formatDateTime } from '@/lib/dateFormat';

const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

const money = (amount, currency) => `${currency} ${Number(amount ?? 0).toFixed(2)}`;

// Derives the display fields shared by `printReceipt` and
// `buildReceiptMessage` from a booking detail shape + one of its payments.
const getReceiptData = (booking, payment) => {
  const tenant = booking.Tenant ?? {};
  const branch = booking.Branch ?? {};
  const customer = booking.Customer ?? {};
  const lineItems = booking.bookingServices ?? [];
  const currency = payment.currency || lineItems[0]?.Service?.currency || 'GH¢';

  const totalPaid = (booking.Payments ?? [])
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + Number(p.amount), 0);
  const balanceDue = Math.round(Math.max(Number(booking.totalAmount) - totalPaid, 0) * 100) / 100;

  const receiverName = payment.receiver
    ? `${payment.receiver.firstName ?? ''} ${payment.receiver.lastName ?? ''}`.trim()
    : null;

  const servedBy = [
    ...new Set(
      (booking.assignments ?? [])
        .map((a) => `${a.Employee?.firstName ?? ''} ${a.Employee?.lastName ?? ''}`.trim())
        .filter(Boolean)
    ),
  ];

  return { tenant, branch, customer, lineItems, currency, balanceDue, receiverName, servedBy };
};

// Opens a printable payment receipt for `payment` against `booking` (full
// detail shape from `GET /bookings/:id`, including Tenant/Branch/Customer/
// bookingServices/assignments/Payments) — same window.print() pattern as
// `printTable` so staff can print it or "Save as PDF" to hand/send to the client.
export const printReceipt = ({ booking, payment }) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const { tenant, branch, customer, lineItems, currency, balanceDue, receiverName, servedBy } = getReceiptData(
    booking,
    payment
  );

  const itemRows = lineItems
    .map((bs) => {
      const unitPrice = Number(bs.priceAtBooking);
      return `<tr>
        <td>${escapeHtml(bs.Service?.name ?? 'Service')}</td>
        <td class="num">${bs.quantity}</td>
        <td class="num">${money(unitPrice, currency)}</td>
        <td class="num">${money(unitPrice * bs.quantity, currency)}</td>
      </tr>`;
    })
    .join('');

  const statusBadge =
    balanceDue <= 0
      ? '<span class="badge paid">Paid in full</span>'
      : '<span class="badge partial">Partially paid</span>';

  const address = branch.address || tenant.address;
  const contactParts = [branch.phone || tenant.phone, tenant.email].filter(Boolean);

  printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Receipt ${escapeHtml(payment.referenceNumber || booking.bookingNumber)}</title>
    <style>
      * { box-sizing: border-box; }
      body { font-family: -apple-system, Helvetica, Arial, sans-serif; color: #111; padding: 32px; }
      .receipt { max-width: 420px; margin: 0 auto; }
      .header { text-align: center; margin-bottom: 12px; }
      .logo { max-height: 56px; margin-bottom: 8px; }
      .business-name { font-size: 18px; font-weight: 700; margin: 0; }
      .business-meta { font-size: 12px; color: #555; margin: 2px 0 0; }
      .title {
        text-align: center; font-size: 13px; font-weight: 600; letter-spacing: 1px;
        text-transform: uppercase; margin: 16px 0 12px;
        border-top: 1px dashed #999; border-bottom: 1px dashed #999; padding: 8px 0;
      }
      .meta-row { display: flex; justify-content: space-between; font-size: 12px; margin: 2px 0; }
      .section-title { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #777; margin: 16px 0 4px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; margin-top: 4px; }
      th, td { padding: 4px 0; text-align: left; }
      th.num, td.num { text-align: right; }
      thead th { border-bottom: 1px solid #333; font-weight: 600; }
      .totals { margin-top: 8px; }
      .totals-row { display: flex; justify-content: space-between; font-size: 12px; padding: 2px 0; }
      .totals-row.grand { font-size: 14px; font-weight: 700; border-top: 1px solid #333; margin-top: 4px; padding-top: 6px; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; text-transform: uppercase; }
      .badge.paid { background: #dcfce7; color: #166534; }
      .badge.partial { background: #fef9c3; color: #854d0e; }
      .footer { text-align: center; margin-top: 24px; font-size: 11px; color: #777; }
      .capitalize { text-transform: capitalize; }
      @media print { body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="receipt">
      <div class="header">
        ${tenant.logoUrl ? `<img class="logo" src="${escapeHtml(tenant.logoUrl)}" alt="" />` : ''}
        <p class="business-name">${escapeHtml(tenant.name || 'Receipt')}</p>
        ${branch.name ? `<p class="business-meta">${escapeHtml(branch.name)}</p>` : ''}
        ${address ? `<p class="business-meta">${escapeHtml(address)}</p>` : ''}
        ${contactParts.length ? `<p class="business-meta">${escapeHtml(contactParts.join(' · '))}</p>` : ''}
      </div>

      <div class="title">Payment Receipt</div>

      <div class="meta-row"><span>Receipt #</span><span>${escapeHtml(payment.referenceNumber || '—')}</span></div>
      <div class="meta-row"><span>Date</span><span>${escapeHtml(formatDateTime(payment.paidAt))}</span></div>
      <div class="meta-row"><span>Booking #</span><span>${escapeHtml(booking.bookingNumber)}</span></div>

      <div class="section-title">Billed to</div>
      <div class="meta-row"><span>${escapeHtml(customer.name || 'Walk-in customer')}</span></div>
      ${
        [customer.phone, customer.email].filter(Boolean).length
          ? `<div class="meta-row"><span>${escapeHtml([customer.phone, customer.email].filter(Boolean).join(' · '))}</span></div>`
          : ''
      }

      <div class="section-title">Services</div>
      <table>
        <thead><tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr></thead>
        <tbody>${itemRows}</tbody>
      </table>

      <div class="totals">
        <div class="totals-row grand"><span>Total</span><span>${money(booking.totalAmount, currency)}</span></div>
      </div>

      <div class="section-title">Payment</div>
      <div class="meta-row"><span>Method</span><span class="capitalize">${escapeHtml((payment.method || '').replace('_', ' '))}</span></div>
      <div class="meta-row"><span>Amount paid</span><span>${money(payment.amount, currency)}</span></div>
      ${balanceDue > 0 ? `<div class="meta-row"><span>Balance due</span><span>${money(balanceDue, currency)}</span></div>` : ''}
      <div class="meta-row"><span>Status</span><span>${statusBadge}</span></div>
      ${receiverName ? `<div class="meta-row"><span>Received by</span><span>${escapeHtml(receiverName)}</span></div>` : ''}
      ${servedBy.length ? `<div class="meta-row"><span>Served by</span><span>${escapeHtml(servedBy.join(', '))}</span></div>` : ''}

      <div class="footer">
        <p>Thank you for choosing ${escapeHtml(tenant.name || 'us')}!</p>
      </div>
    </div>
  </body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

// Plain-text version of the receipt using WhatsApp's *bold*/```monospace```
// formatting, for `sendReceiptViaWhatsApp`.
const buildReceiptMessage = (booking, payment) => {
  const { tenant, branch, customer, lineItems, currency, balanceDue, receiverName, servedBy } = getReceiptData(
    booking,
    payment
  );
  const address = branch.address || tenant.address;
  const contact = [branch.phone || tenant.phone, tenant.email].filter(Boolean).join(' · ');

  const lines = [`*${tenant.name || 'Receipt'}*`];
  if (branch.name) lines.push(branch.name);
  if (address) lines.push(address);
  if (contact) lines.push(contact);
  lines.push('', '*Payment Receipt*');
  lines.push(`Receipt #: ${payment.referenceNumber || '—'}`);
  lines.push(`Date: ${formatDateTime(payment.paidAt)}`);
  lines.push(`Booking #: ${booking.bookingNumber}`);
  lines.push('', `Hi ${customer.name || 'there'}, thanks for visiting${tenant.name ? ` ${tenant.name}` : ''}!`, '');

  lines.push('```');
  lineItems.forEach((bs) => {
    const lineTotal = Number(bs.priceAtBooking) * bs.quantity;
    lines.push(`${bs.Service?.name ?? 'Service'} x${bs.quantity} - ${money(lineTotal, currency)}`);
  });
  lines.push('```');
  lines.push(`*Total: ${money(booking.totalAmount, currency)}*`, '');

  lines.push(`Payment method: ${(payment.method || '').replace('_', ' ')}`);
  lines.push(`Amount paid: ${money(payment.amount, currency)}`);
  if (balanceDue > 0) lines.push(`Balance due: ${money(balanceDue, currency)}`);
  lines.push(`Status: ${balanceDue <= 0 ? 'Paid in full' : 'Partially paid'}`);
  if (receiverName) lines.push(`Received by: ${receiverName}`);
  if (servedBy.length) lines.push(`Served by: ${servedBy.join(', ')}`);
  lines.push('', `Thank you for choosing ${tenant.name || 'us'}!`);

  return lines.join('\n');
};

// WhatsApp click-to-chat needs digits only, with country code and no leading
// 0. This product defaults to Ghana (GH¢ currency), so a local 0XXXXXXXXX
// number is assumed to be missing the +233 country code.
const normalizePhoneForWhatsApp = (phone) => {
  const digits = String(phone ?? '').replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('0') ? `233${digits.slice(1)}` : digits;
};

// Opens WhatsApp (web or app) with the receipt pre-filled as a message to the
// customer's phone number, so staff can review and send it. Falls back to
// WhatsApp's contact picker if the customer has no phone on file.
export const sendReceiptViaWhatsApp = ({ booking, payment }) => {
  const message = buildReceiptMessage(booking, payment);
  const phone = normalizePhoneForWhatsApp(booking.Customer?.phone);
  const url = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};
