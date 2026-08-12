export function fmt(value: number | null | undefined): string {
  if (value === null || value === undefined) return "$0.00"
  return "$" + value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}