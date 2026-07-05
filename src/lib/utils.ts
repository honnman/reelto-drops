export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN')
}

export function formatDropDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).replace(',', ' ·')
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return '••••' + digits.slice(-4)
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, '')
  const normalized = digits.startsWith('91') ? digits : '91' + digits
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}
