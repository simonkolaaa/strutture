import type { SVGProps } from 'react'

/*
 * Vocabe's mark, the same geometry as scripts/icon-source.svg (512 grid, cropped
 * to the glyph). Kept inline rather than loaded from the PNGs so it takes the
 * surrounding colour and stays sharp at any size — change both files together.
 */
const ARM_LEFT = 'M160 116h78L268 330H250Z'
const ARM_RIGHT = 'M316 116h52L268 330H250Z'

/** Glyph only, in `currentColor`. */
export function Logo({ size = 24, ...props }: { size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="120 90 280 294"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d={ARM_LEFT} />
      <path d={ARM_RIGHT} />
      <rect x="130" y="100" width="122" height="18" />
      <rect x="296" y="100" width="94" height="18" />
      <rect x="196" y="360" width="120" height="14" rx="7" opacity="0.55" />
    </svg>
  )
}

/**
 * The mark as it appears on the home screen: amber on the dark tile.
 *
 * The tile is the same #1c1917 as the app icon, which in dark mode is also the
 * page background — hence the hairline edge, so the tile still reads as a tile
 * instead of dissolving into the page.
 */
export function LogoTile({ size = 80, radius = 0.22 }: { size?: number; radius?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden="true">
      <rect width="512" height="512" rx={512 * radius} fill="#1c1917" />
      <rect
        x="4"
        y="4"
        width="504"
        height="504"
        rx={512 * radius - 4}
        fill="none"
        stroke="#3f3a35"
        strokeWidth="8"
      />
      <g fill="#fbbf24">
        <path d={ARM_LEFT} />
        <path d={ARM_RIGHT} />
        <rect x="130" y="100" width="122" height="18" />
        <rect x="296" y="100" width="94" height="18" />
      </g>
      <rect x="196" y="360" width="120" height="14" rx="7" fill="#b45309" />
    </svg>
  )
}
