import { describe, expect, it } from 'vitest'
import { PROFESSIONALS, SERVICE_GROUPS, SERVICES, POPULAR_SERVICE_IDS } from './catalog'

/** Conferência com o folheto "Nossos Serviços" (sem preços). */
describe('catálogo do folheto', () => {
  const byGroup = (groupId: string) =>
    SERVICES.filter((service) => service.groupId === groupId).map((service) => service.name)

  it('tem os 30 serviços, nos quatro grupos do folheto', () => {
    expect(SERVICES).toHaveLength(30)
    expect(byGroup('servicos-basicos')).toHaveLength(6)
    expect(byGroup('podologia')).toHaveLength(7)
    expect(byGroup('depilacao-feminina')).toHaveLength(9)
    expect(byGroup('depilacao-masculina')).toHaveLength(8)
    expect(byGroup('podologia')).toContain('Unha encravada com 2 (dois) curativos')
    expect(byGroup('depilacao-feminina')).toContain('X2 · Feminina')
    expect(byGroup('depilacao-masculina')).toContain('Tórax · Masculina')
  })

  it('não inventa preço: nenhum serviço tem valor no catálogo', () => {
    expect(SERVICES.filter((service) => service.price !== undefined)).toEqual([])
  })

  it('ids únicos e referências válidas', () => {
    const ids = SERVICES.map((service) => service.id)
    expect(new Set(ids).size).toBe(ids.length)
    const groups = new Set(SERVICE_GROUPS.map((group) => group.id))
    const professionals = new Set(PROFESSIONALS.map((professional) => professional.id))
    for (const service of SERVICES) {
      expect(groups.has(service.groupId)).toBe(true)
      expect(professionals.has(service.professionalId)).toBe(true)
      // A agenda trabalha em passos de 5 minutos, entre 15 e 240.
      expect(service.durationMin % 5).toBe(0)
      expect(service.durationMin).toBeGreaterThanOrEqual(15)
    }
    for (const id of POPULAR_SERVICE_IDS) expect(ids).toContain(id)
  })
})
