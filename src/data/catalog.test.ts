import { describe, expect, it } from 'vitest'
import { createSeededDatabase } from '../lib/storage'
import { freesSlot } from '../lib/types'
import {
  CATEGORIES,
  POPULAR_SERVICE_IDS,
  PROFESSIONALS,
  SERVICE_GROUPS,
  SERVICES,
  canPerform,
  namesLabel,
  professionalsForService,
} from './catalog'

/** Conferência com a lista de serviços enviada pela gestão. */
describe('catálogo', () => {
  const namesOf = (groupId: string) =>
    SERVICES.filter((service) => service.groupId === groupId).map((service) => service.name)

  it('tem os 39 serviços, nos cinco grupos da lista', () => {
    expect(SERVICES).toHaveLength(39)
    expect(namesOf('podologia')).toEqual([
      'Procedimento básico',
      'Unha encravada com 2 curativos',
      'Olho de peixe',
      'Hidratação podal com ozônio',
      'Órteses',
      'Eletrocautério (unidade)',
      'Tratamento de micose com laser',
    ])
    expect(namesOf('mao-e-pe')).toEqual([
      'Esmaltação pé e mão',
      'Mão',
      'Pé',
      'Esmaltação pé e mão com esfoliação',
      'Esfoliação pé e mão',
      'SPA dos pés',
    ])
    expect(namesOf('depilacao-feminina')).toHaveLength(12)
    expect(namesOf('depilacao-feminina')).toContain('Buço · Feminina')
    expect(namesOf('depilacao-feminina')).toContain('Nádegas · Feminina')
    expect(namesOf('depilacao-masculina')).toHaveLength(8)
    expect(namesOf('depilacao-masculina')).not.toContain('Sobrancelha · Masculina')
    expect(namesOf('cabeleireiro')).toEqual([
      'Lavagem',
      'Escova',
      'Corte',
      'Hidratação',
      'Coloração',
      'Mechas/Luzes',
    ])
  })

  it('não tem preço em nenhum serviço', () => {
    for (const service of SERVICES) expect(Object.keys(service)).not.toContain('price')
  })

  it('cada profissional só atende as categorias dela', () => {
    const who = (serviceId: string) => namesLabel(professionalsForService(serviceId))
    expect(who('podologia-procedimento-basico')).toBe('Simone')
    expect(who('mao')).toBe('Simone e Cris')
    expect(who('depilacao-feminina-axila')).toBe('Simone e Cris')
    expect(who('depilacao-masculina-torax')).toBe('Simone e Cris')
    expect(who('corte')).toBe('Claudia')
    expect(canPerform('cris', 'podologia-procedimento-basico')).toBe(false)
    expect(canPerform('claudia', 'mao')).toBe(false)
    expect(canPerform('simone', 'corte')).toBe(false)
  })

  it('ids únicos, referências válidas e durações que a agenda aceita', () => {
    const ids = SERVICES.map((service) => service.id)
    expect(new Set(ids).size).toBe(ids.length)
    const groups = new Set(SERVICE_GROUPS.map((group) => group.id))
    const categories = new Set(CATEGORIES.map((category) => category.id))
    for (const service of SERVICES) {
      expect(groups.has(service.groupId)).toBe(true)
      expect(categories.has(service.categoryId)).toBe(true)
      // Todo serviço tem ao menos uma profissional.
      expect(professionalsForService(service.id).length).toBeGreaterThan(0)
      expect(service.durationMin % 5).toBe(0)
      expect(service.durationMin).toBeGreaterThanOrEqual(15)
      expect(service.durationMin).toBeLessThanOrEqual(240)
    }
    for (const professional of PROFESSIONALS) expect(professional.categories.length).toBeGreaterThan(0)
    for (const id of POPULAR_SERVICE_IDS) expect(ids).toContain(id)
  })

  it('a demonstração respeita as categorias e não sobrepõe horários', () => {
    const { appointments } = createSeededDatabase()
    for (const item of appointments) expect(canPerform(item.professionalId, item.serviceId)).toBe(true)
    const busy = appointments.filter((item) => !freesSlot(item.status))
    for (const a of busy) {
      for (const b of busy) {
        if (a.id >= b.id || a.professionalId !== b.professionalId || a.dateISO !== b.dateISO) continue
        const overlap = a.startMin < b.startMin + b.durationMin && b.startMin < a.startMin + a.durationMin
        expect(overlap, `${a.id} x ${b.id}`).toBe(false)
      }
    }
  })
})
