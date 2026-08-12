/**
 * lib/utils/time.ts
 * Cambodia timezone utilities (UTC+7 / Asia/Phnom_Penh)
 */

export function formatCambodiaTime(rawStr: string): { date: string; time: string } {
  if (!rawStr) return { date: "", time: "" }

  try {
    const hasTimezone =
      rawStr.endsWith("Z") ||
      /[+-]\d{2}:\d{2}$/.test(rawStr)

    if (hasTimezone) {
      const d = new Date(rawStr)

      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Phnom_Penh",
        year:     "numeric",
        month:    "2-digit",
        day:      "2-digit",
      }).format(d)

      const time = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Phnom_Penh",
        hour:     "2-digit",
        minute:   "2-digit",
        hour12:   true,
      }).format(d)

      return { date, time }
    }

    const [datePart, timePart = "00:00:00"] = rawStr.replace("T", " ").split(" ")
    const [hh, mm] = timePart.split(":")
    const hour = parseInt(hh, 10)
    const ampm = hour >= 12 ? "PM" : "AM"
    const h12  = hour % 12 === 0 ? 12 : hour % 12

    return {
      date: datePart,
      time: `${String(h12).padStart(2, "0")}:${mm} ${ampm}`,
    }
  } catch {
    return { date: rawStr.slice(0, 10), time: rawStr.slice(11, 16) }
  }
}

export function extractCambodiaDate(rawStr: string): string {
  if (!rawStr) return ""

  const hasTimezone =
    rawStr.endsWith("Z") ||
    /[+-]\d{2}:\d{2}$/.test(rawStr)

  if (hasTimezone) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Phnom_Penh",
    }).format(new Date(rawStr))
  }

  return rawStr.slice(0, 10)
}

export function toApiDateParam(dateStr: string, isEnd = false): string {
  if (!dateStr) return ""
  const time = isEnd ? "T23:59:59+07:00" : "T00:00:00+07:00"
  return dateStr + time
}