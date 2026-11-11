import type { ServicePatch } from './types'

/**
 * Validação dos ajustes de catálogo feitos pela gestão.
 *
 * Vive fora dos backends porque as duas implementações (local e Firestore) precisam
 * recusar exatamente os mesmos valores — a diferença entre elas é só onde gravam.
 * Retorna a mensagem de erro, ou `null` quando o ajuste é válido.
 */
export function validateServicePatch(patch: ServicePatch): string | null {
  if (patch.durationMin !== undefined) {
    if (
      !Number.isInteger(patch.durationMin) ||
      patch.durationMin < 15 ||
      patch.durationMin > 240 ||
      patch.durationMin % 5 !== 0
    ) {
      return 'A duração precisa ficar entre 15 e 240 minutos, em passos de 5.'
    }
  }


  return null
}
