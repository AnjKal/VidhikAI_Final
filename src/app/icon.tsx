import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
      // ImageResponse JSX element
      <div
        style={{
          background: 'hsl(25 95% 53%)', // Orange background
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '5px',
          padding: '4px',
        }}
      >
        {/* Simplified inline SVG for the Vidhik logo */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 200 150"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="white"
            d="M20 10 L100 130 L180 10 L155 10 L100 80 L45 10 Z"
          />
          <g
            stroke="white"
            strokeWidth="8"
            fill="none"
          >
            <path d="M50 30 H 150" />
            <path d="M100 30 V 50" />
          </g>
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  )
}
