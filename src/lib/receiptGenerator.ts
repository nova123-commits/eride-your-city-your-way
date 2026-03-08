import { type FareBreakdown, formatCurrency, type CurrencyCode } from '@/lib/currency';

interface ReceiptData {
  tripId: string;
  date: string;
  pickup: string;
  dropoff: string;
  distance: string;
  duration: string;
  driverName: string;
  breakdown: FareBreakdown;
  currency: CurrencyCode;
}

export function downloadReceiptAsImage(data: ReceiptData): void {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const w = 600;
  const h = 820;
  canvas.width = w;
  canvas.height = h;

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Header band
  const grad = ctx.createLinearGradient(0, 0, w, 80);
  grad.addColorStop(0, '#22c55e');
  grad.addColorStop(1, '#16a34a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, 80);

  // Logo
  ctx.font = 'bold 28px system-ui, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('eRide', 30, 52);

  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textAlign = 'right';
  ctx.fillText('Digital Receipt', w - 30, 42);
  ctx.fillText(`#${data.tripId}`, w - 30, 60);
  ctx.textAlign = 'left';

  let y = 110;

  // Date
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#6b7280';
  ctx.fillText(data.date, 30, y);
  y += 30;

  // Route
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('Route', 30, y);
  y += 22;

  ctx.beginPath();
  ctx.arc(40, y - 4, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#22c55e';
  ctx.fill();
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = '#374151';
  ctx.fillText(data.pickup, 55, y);
  y += 20;

  ctx.beginPath();
  ctx.arc(40, y - 4, 5, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();
  ctx.fillStyle = '#374151';
  ctx.fillText(data.dropoff, 55, y);
  y += 16;

  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.fillText(`${data.distance} · ${data.duration} · Driver: ${data.driverName}`, 55, y);
  y += 35;

  // Divider
  ctx.setLineDash([4, 3]);
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(30, y);
  ctx.lineTo(w - 30, y);
  ctx.stroke();
  ctx.setLineDash([]);
  y += 25;

  // Fare breakdown
  const rows: [string, string, boolean?][] = [
    ['Base Fare', formatCurrency(data.breakdown.baseFare, data.currency)],
    ['Distance Charge', formatCurrency(data.breakdown.distanceCharge, data.currency)],
  ];
  if (data.breakdown.waitingFee > 0) {
    rows.push(['Waiting Fee', formatCurrency(data.breakdown.waitingFee, data.currency)]);
  }
  rows.push(
    ['Subtotal', formatCurrency(data.breakdown.subtotal, data.currency), true],
    ['VAT (16%)', formatCurrency(data.breakdown.vat, data.currency)],
    ['Housing Levy (1.5%)', formatCurrency(data.breakdown.housingLevy, data.currency)],
  );

  rows.forEach(([label, value, bold]) => {
    ctx.font = bold ? 'bold 14px system-ui, sans-serif' : '13px system-ui, sans-serif';
    ctx.fillStyle = bold ? '#111827' : '#6b7280';
    ctx.fillText(label, 30, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#111827';
    ctx.fillText(value, w - 30, y);
    ctx.textAlign = 'left';
    y += 24;
  });

  // Total line
  y += 4;
  ctx.strokeStyle = '#e5e7eb';
  ctx.beginPath();
  ctx.moveTo(30, y);
  ctx.lineTo(w - 30, y);
  ctx.stroke();
  y += 25;

  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillStyle = '#111827';
  ctx.fillText('Total', 30, y);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#22c55e';
  ctx.fillText(formatCurrency(data.breakdown.total, data.currency), w - 30, y);
  ctx.textAlign = 'left';
  y += 45;

  // Footer
  ctx.font = '10px system-ui, sans-serif';
  ctx.fillStyle = '#9ca3af';
  ctx.textAlign = 'center';
  ctx.fillText('This is a tax-compliant digital receipt per KRA regulations 2026.', w / 2, y);
  y += 16;
  ctx.fillText('Thank you for riding with eRide — sustainable mobility for Kenya.', w / 2, y);
  ctx.textAlign = 'left';

  // Download
  const link = document.createElement('a');
  link.download = `eRide-Receipt-${data.tripId}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
