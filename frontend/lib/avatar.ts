export function getAvatarUrl(image?: string | null): string {
  if (!image) return ""
  if (image.startsWith("http") || image.startsWith("data:")) return image
  const raw = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
  const base = raw.replace(/\/api\/?$/, "").replace(/\/$/, "")
  return `${base}/storage/${image}`
}