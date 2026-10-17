const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

/** R$ 180,00 */
export function formatBRL(value: number): string {
  return currency.format(value)
}

/** Máscara de telefone brasileiro usada no cadastro: (11) 98765-4321 */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10)
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '')
}

/** E-mail válido em formato básico (validação de cliente, não de servidor). */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
}

export type PasswordStrength = 'fraca' | 'regular' | 'boa' | 'forte'

/** Medidor de força exibido no cadastro ("Segurança: Regular"). */
export function passwordStrength(value: string): PasswordStrength {
  let score = 0
  if (value.length >= 8) score += 1
  if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1
  if (/\d/.test(value)) score += 1
  if (/[^A-Za-z0-9]/.test(value)) score += 1
  if (value.length < 8) return 'fraca'
  if (score <= 2) return 'regular'
  if (score === 3) return 'boa'
  return 'forte'
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]![0] : ''
  return `${first}${last}`.toUpperCase()
}

export function firstNameOf(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name
}
