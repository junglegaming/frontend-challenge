declare module '@/mocks/infra/placeholder-art.mjs' {
  export function tile(seed: number, label: string): string
  export function avatar(seed: number, initials: string): string
  export function fnv1a(value: string): number
}
