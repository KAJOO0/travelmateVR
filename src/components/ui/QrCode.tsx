import { useEffect, useState } from 'react';

/** QR code rendered locally (no third-party service sees the booking reference). */
export function QrCode({ value, label }: { value: string; label: string }) {
  const [svg, setSvg] = useState('');
  useEffect(() => {
    let alive = true;
    void import('qrcode').then(QR => QR.toString(value, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0f2c3f', light: '#ffffff' } })).then(s => { if (alive) setSvg(s); });
    return () => { alive = false; };
  }, [value]);
  return <div className="qr" role="img" aria-label={label} dangerouslySetInnerHTML={{ __html: svg }} />;
}
