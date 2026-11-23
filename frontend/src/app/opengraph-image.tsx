import { ImageResponse } from 'next/og';

export const alt =
  'DigiRoute — Sovereign Micro-Addressing & DIGIPIN Navigation';

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

/**
 * Dynamic Open Graph Social Card
 *
 * Styled in DigiRoute's Refined Utilitarian dark mode palette
 * (Zinc #09090b base, Amber #f97316 accent, 4px crisp borders).
 */
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#09090b',
          color: '#fafafa',
          padding: '60px',
          fontFamily: 'sans-serif',
          border: '8px solid #18181b',
        }}
      >
        {/* Top Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '6px',
                backgroundColor: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 900,
                fontSize: '24px',
              }}
            >
              D
            </div>
            <div
              style={{
                fontSize: '34px',
                fontWeight: 800,
                letterSpacing: '-0.5px',
                color: '#ffffff',
              }}
            >
              DigiRoute
            </div>
          </div>
          <div
            style={{
              padding: '8px 18px',
              borderRadius: '4px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#f97316',
              fontSize: '15px',
              fontWeight: 700,
              fontFamily: 'monospace',
              letterSpacing: '1px',
            }}
          >
            INDIA POST DIGIPIN
          </div>
        </div>

        {/* Center Main Value Proposition */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div
            style={{
              fontSize: '54px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-1.5px',
              color: '#ffffff',
              maxWidth: '920px',
            }}
          >
            Sovereign Micro-Addressing for the Last 50 Meters.
          </div>
          <div
            style={{
              fontSize: '22px',
              lineHeight: 1.4,
              color: '#a1a1aa',
              maxWidth: '860px',
            }}
          >
            Pairing verified 10-character India Post DIGIPIN spatial coordinates
            with on-site doorway visual lock photos for instant doorstep resolution.
          </div>
        </div>

        {/* Bottom Feature Badges */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            4m × 4m Coordinate Grid
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Doorway Visual Lock
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Offline Sub-2ms Math
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '4px',
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              color: '#e4e4e7',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Zero-Dependency PWA
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
