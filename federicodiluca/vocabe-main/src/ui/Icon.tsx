import type { ReactNode, SVGProps } from 'react'

/**
 * Hand-tuned line icons, drawn on a 24px grid. Stroke follows `currentColor`;
 * a few use fill instead — those set it explicitly on the path.
 */
const ICONS: Record<string, ReactNode> = {
  // bottom nav
  book: (
    <path d="M12 6c-1.7-1.3-3.9-2-6.2-2-1 0-1.9.1-2.8.4v13.2c.9-.3 1.8-.4 2.8-.4 2.3 0 4.5.7 6.2 2m0-13.2c1.7-1.3 3.9-2 6.2-2 1 0 1.9.1 2.8.4v13.2c-.9-.3-1.8-.4-2.8-.4-2.3 0-4.5.7-6.2 2m0-13.2v13.2" />
  ),
  cards: (
    <>
      <rect x="3.5" y="6.5" width="12" height="13" rx="2" transform="rotate(-8 9.5 13)" />
      <path d="M11 5.7 19 8a2 2 0 0 1 1.4 2.5l-2.6 8.6" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20h16" />
      <path d="M7.5 20v-5M12 20V7.5M16.5 20v-8.5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 8h9M17 8h3M4 16h3M11 16h9" />
      <circle cx="15" cy="8" r="2.3" />
      <circle cx="9" cy="16" r="2.3" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M15.6 8.4 13.5 13.5 8.4 15.6 10.5 10.5Z" />
    </>
  ),
  // accents
  flame: (
    <path d="M12 2.5c1 3.4-1.6 5.1-1.6 7.9a3.4 3.4 0 0 0 5.6 2.6c.2 1.3-.2 2.7-1 3.8 1.6-.6 3-2 3.5-3.9.9 1.3 1.4 2.9 1.4 4.5a7.9 7.9 0 0 1-15.8 0c0-3.4 1.9-6 3.5-8.2C11 8 12 5.5 12 2.5Z" />
  ),
  check: <path d="M4.5 12.5 9 17 19.5 6.5" />,
  share: (
    <>
      <circle cx="6" cy="12" r="2.6" />
      <circle cx="18" cy="5.5" r="2.6" />
      <circle cx="18" cy="18.5" r="2.6" />
      <path d="M8.3 10.8 15.7 6.7M8.3 13.2l7.4 4.1" />
    </>
  ),
  sparkle: (
    <>
      <path
        d="M12 3.5c.6 3.3 1.7 4.4 5 5-3.3.6-4.4 1.7-5 5-.6-3.3-1.7-4.4-5-5 3.3-.6 4.4-1.7 5-5Z"
        fill="currentColor"
        stroke="none"
      />
      <path
        d="M18.5 13.5c.3 1.5.8 2 2.3 2.3-1.5.3-2 .8-2.3 2.3-.3-1.5-.8-2-2.3-2.3 1.5-.3 2-.8 2.3-2.3Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
  bulb: (
    <>
      <path d="M12 3.2a6 6 0 0 0-3.8 10.6c.7.6.9 1.1 1 2.2h5.6c.1-1.1.3-1.6 1-2.2A6 6 0 0 0 12 3.2Z" />
      <path d="M9.4 19h5.2M10.5 21.5h3" />
    </>
  ),
  trophy: (
    <>
      <path d="M7.5 4h9v3.5a4.5 4.5 0 0 1-9 0V4Z" />
      <path d="M7.5 5.5h-3v1.5a3.5 3.5 0 0 0 3.5 3.5M16.5 5.5h3v1.5a3.5 3.5 0 0 1-3.5 3.5" />
      <path d="M12 12v4M8.5 20.5c0-2 1.2-3 3.5-3s3.5 1 3.5 3Z" />
    </>
  ),
  medal: (
    <>
      <circle cx="12" cy="14.5" r="5" />
      <path d="M8.7 10 6 3.5M15.3 10 18 3.5" />
      <path d="M10 14.5l1.4 1.4 2.8-2.8" />
    </>
  ),
  lock: (
    <>
      <rect x="4.8" y="10" width="14.4" height="10.2" rx="2.4" />
      <path d="M8 10V7.2a4 4 0 0 1 8 0V10" />
    </>
  ),
  speaker: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  star: (
    <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z" />
  ),
  'star-filled': (
    <path
      d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9L12 3.5Z"
      fill="currentColor"
    />
  ),
  note: (
    <>
      <path d="M5 4h11l3 3v13H5V4Z" />
      <path d="M15 4v4h4M8 12h8M8 16h5" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  install: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M12 7.5v7M9 11.5l3 3 3-3M10.5 18.5h3" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
      <path d="M7.5 13.5h3M7.5 17h6" />
    </>
  ),
}

export type IconName = keyof typeof ICONS

export function Icon({
  name,
  size = 20,
  strokeWidth = 1.6,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {ICONS[name]}
    </svg>
  )
}
