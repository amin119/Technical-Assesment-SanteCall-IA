import type { SVGProps } from 'react'

// One small icon set, drawn on a 20px grid with a 1.6px stroke, so every icon has the same weight.
const PATHS = {
  search: 'M8.5 14a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11Zm4.5-1 4 4',
  close: 'M5 5l10 10M15 5L5 15',
  locate: 'M17 3 3 8.5l5.5 2L10.5 17 17 3Z',
  map: 'M3 5.5 7.5 4l5 1.5L17 4v10.5L12.5 16l-5-1.5L3 16V5.5ZM7.5 4v10.5M12.5 5.5V16',
  list: 'M7 5h10M7 10h10M7 15h10M3.5 5h.01M3.5 10h.01M3.5 15h.01',
  arrow: 'M4 10h12m-4.5-4.5L16 10l-4.5 4.5',
  seat: 'M6 3.5h8v6H6v-6ZM4.5 9.5h11V13h-11V9.5ZM6 13v3.5M14 13v3.5',
  check: 'M4.5 10.5l3.5 3.5 7.5-8',
  external: 'M8 4H4.5v11.5H16V12M11 4h5v5M16 4l-7 7',
  image: 'M3.5 4.5h13v11h-13v-11ZM3.5 13l4-4 3 3 2-2 4 4M13 8h.01',
} as const

export type IconName = keyof typeof PATHS

interface Props extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName
  size?: number
}

/** Decorative by default (`aria-hidden`): put the meaning in text next to it. */
export function Icon({ name, size = 18, ...rest }: Props) {
  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
