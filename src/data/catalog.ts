import type { Category, CategoryId, Professional, Service } from '../lib/types'

/**
 * Catálogo do estúdio, conforme a lista enviada pela gestão.
 *
 * Sem preços: o site não mostra valor em nenhum lugar, então nenhum serviço tem preço.
 *
 * Durações: a lista não traz o tempo de cada serviço. Os valores abaixo são estimativas
 * para montar a agenda e devem ser conferidos pela gestão na aba Serviços do painel.
 *
 * Quem atende: cada profissional declara as categorias que faz (`categories`). O
 * agendamento só oferece, para um serviço, as profissionais daquela categoria.
 */

export const CATEGORIES: Category[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'podologia', label: 'Podologia' },
  { id: 'maos-pes', label: 'Mão e Pé' },
  { id: 'depilacao', label: 'Depilação' },
  { id: 'cabelos', label: 'Cabeleireiro' },
]

export interface ServiceGroup {
  id: string
  label: string
  /** Categoria do grupo: define quais profissionais aparecem no cabeçalho. */
  categoryId: CategoryId
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  { id: 'podologia', label: 'Podologia', categoryId: 'podologia' },
  { id: 'mao-e-pe', label: 'Mão e Pé', categoryId: 'maos-pes' },
  { id: 'depilacao-feminina', label: 'Depilação Feminina', categoryId: 'depilacao' },
  { id: 'depilacao-masculina', label: 'Depilação Masculina', categoryId: 'depilacao' },
  { id: 'cabeleireiro', label: 'Cabeleireiro', categoryId: 'cabelos' },
]

export const PROFESSIONALS: Professional[] = [
  {
    id: 'simone',
    name: 'Simone',
    role: 'Podóloga',
    categories: ['podologia', 'maos-pes', 'depilacao'],
    specialties: ['Podologia', 'Mão e Pé', 'Depilação'],
    rating: 4.9,
    reviews: 74,
    chair: 'Sala 02',
    accent: '#8b6b2e',
  },
  {
    id: 'cris',
    name: 'Cris',
    role: 'Manicure & Depiladora',
    categories: ['maos-pes', 'depilacao'],
    specialties: ['Mão e Pé', 'Depilação'],
    rating: 4.8,
    reviews: 96,
    chair: 'Cadeira 01',
    accent: '#b08c4f',
  },
  {
    id: 'claudia',
    name: 'Claudia',
    role: 'Cabeleireira',
    categories: ['cabelos'],
    specialties: ['Cabeleireiro'],
    accent: '#a9825a',
  },
]

export const SERVICES: Service[] = [
  // ---------------------------------------------------------------- Podologia
  {
    id: 'podologia-procedimento-basico',
    name: 'Procedimento básico',
    groupId: 'podologia',
    categoryId: 'podologia',
    durationMin: 60,
    popular: true,
  },
  {
    id: 'unha-encravada',
    name: 'Unha encravada com 2 curativos',
    groupId: 'podologia',
    categoryId: 'podologia',
    durationMin: 60,
  },
  {
    id: 'olho-de-peixe',
    name: 'Olho de peixe',
    groupId: 'podologia',
    categoryId: 'podologia',
    durationMin: 45,
  },
  {
    id: 'hidratacao-podal-ozonio',
    name: 'Hidratação podal com ozônio',
    groupId: 'podologia',
    categoryId: 'podologia',
    durationMin: 40,
  },
  {
    id: 'orteses',
    name: 'Órteses',
    groupId: 'podologia',
    categoryId: 'podologia',
    durationMin: 45,
  },
  {
    id: 'eletrocauterio',
    name: 'Eletrocautério (unidade)',
    groupId: 'podologia',
    categoryId: 'podologia',
    durationMin: 30,
  },
  {
    id: 'micose-laser',
    name: 'Tratamento de micose com laser',
    groupId: 'podologia',
    categoryId: 'podologia',
    durationMin: 40,
  },

  // ---------------------------------------------------------------- Mão e Pé
  {
    id: 'esmaltacao-pe-mao',
    name: 'Esmaltação pé e mão',
    groupId: 'mao-e-pe',
    categoryId: 'maos-pes',
    durationMin: 40,
  },
  {
    id: 'mao',
    name: 'Mão',
    groupId: 'mao-e-pe',
    categoryId: 'maos-pes',
    durationMin: 40,
  },
  {
    id: 'pe',
    name: 'Pé',
    groupId: 'mao-e-pe',
    categoryId: 'maos-pes',
    durationMin: 50,
  },
  {
    id: 'esmaltacao-esfoliacao-pe-mao',
    name: 'Esmaltação pé e mão com esfoliação',
    groupId: 'mao-e-pe',
    categoryId: 'maos-pes',
    durationMin: 75,
  },
  {
    id: 'esfoliacao-pe-mao',
    name: 'Esfoliação pé e mão',
    groupId: 'mao-e-pe',
    categoryId: 'maos-pes',
    durationMin: 40,
  },
  {
    id: 'spa-dos-pes',
    name: 'SPA dos pés',
    groupId: 'mao-e-pe',
    categoryId: 'maos-pes',
    durationMin: 60,
    featured: true,
    popular: true,
  },

  // ---------------------------------------------------------------- Depilação Feminina
  {
    id: 'depilacao-feminina-meia-perna',
    name: 'Meia perna · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-feminina-coxa',
    name: 'Coxa · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-feminina-axila',
    name: 'Axila · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 15,
  },
  {
    id: 'depilacao-feminina-sobrancelha',
    name: 'Sobrancelha · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 20,
    popular: true,
  },
  {
    id: 'depilacao-feminina-cantinho',
    name: 'Cantinho · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 20,
  },
  {
    id: 'depilacao-feminina-buco',
    name: 'Buço · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 15,
  },
  {
    id: 'depilacao-feminina-rosto',
    name: 'Rosto · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-feminina-tricotomia',
    name: 'Tricotomia · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-feminina-nadegas',
    name: 'Nádegas · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-feminina-braco',
    name: 'Braço · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-feminina-x1',
    name: 'X1 · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-feminina-x2',
    name: 'X2 · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    durationMin: 45,
  },

  // ---------------------------------------------------------------- Depilação Masculina
  {
    id: 'depilacao-masculina-meia-perna',
    name: 'Meia perna · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-masculina-coxa',
    name: 'Coxa · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-masculina-axila',
    name: 'Axila · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    durationMin: 15,
  },
  {
    id: 'depilacao-masculina-torax',
    name: 'Tórax · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-masculina-barriga',
    name: 'Barriga · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    durationMin: 20,
  },
  {
    id: 'depilacao-masculina-tricotomia',
    name: 'Tricotomia · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-masculina-nadegas',
    name: 'Nádegas · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    durationMin: 30,
  },
  {
    id: 'depilacao-masculina-braco',
    name: 'Braço · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    durationMin: 30,
  },

  // ---------------------------------------------------------------- Cabeleireiro
  {
    id: 'lavagem',
    name: 'Lavagem',
    groupId: 'cabeleireiro',
    categoryId: 'cabelos',
    durationMin: 30,
  },
  {
    id: 'escova',
    name: 'Escova',
    groupId: 'cabeleireiro',
    categoryId: 'cabelos',
    durationMin: 45,
  },
  {
    id: 'corte',
    name: 'Corte',
    groupId: 'cabeleireiro',
    categoryId: 'cabelos',
    durationMin: 45,
    popular: true,
  },
  {
    id: 'hidratacao',
    name: 'Hidratação',
    groupId: 'cabeleireiro',
    categoryId: 'cabelos',
    durationMin: 60,
  },
  {
    id: 'coloracao',
    name: 'Coloração',
    groupId: 'cabeleireiro',
    categoryId: 'cabelos',
    durationMin: 120,
  },
  {
    id: 'mechas-luzes',
    name: 'Mechas/Luzes',
    groupId: 'cabeleireiro',
    categoryId: 'cabelos',
    durationMin: 180,
  },
]

export function findService(id: string | undefined): Service | undefined {
  return SERVICES.find((service) => service.id === id)
}

export function findProfessional(id: string | undefined): Professional | undefined {
  return PROFESSIONALS.find((professional) => professional.id === id)
}

export function findGroup(id: string | undefined): ServiceGroup | undefined {
  return SERVICE_GROUPS.find((group) => group.id === id)
}

/** Profissionais que atendem a categoria, na ordem do catálogo. */
export function professionalsFor(categoryId: CategoryId | undefined): Professional[] {
  return PROFESSIONALS.filter((professional) =>
    categoryId ? professional.categories.includes(categoryId) : false,
  )
}

/** Profissionais que fazem o serviço (as da categoria dele). */
export function professionalsForService(serviceId: string | undefined): Professional[] {
  return professionalsFor(findService(serviceId)?.categoryId)
}

/** A profissional atende a categoria deste serviço? */
export function canPerform(professionalId: string | undefined, serviceId: string | undefined) {
  return professionalsForService(serviceId).some((professional) => professional.id === professionalId)
}

/** "Simone", "Simone e Cris", "Ana, Bia e Cris". */
export function namesLabel(professionals: Professional[]): string {
  const names = professionals.map((professional) => professional.name)
  if (names.length <= 1) return names[0] ?? 'Elegance Studio'
  return `${names.slice(0, -1).join(', ')} e ${names.at(-1)}`
}

export function professionalLabel(professionalId: string | undefined): string {
  const professional = findProfessional(professionalId)
  return professional ? professional.name : 'Elegance Studio'
}

/** Serviços exibidos na Home em "Serviços Populares". */
export const POPULAR_SERVICE_IDS = [
  'podologia-procedimento-basico',
  'spa-dos-pes',
  'depilacao-feminina-sobrancelha',
  'corte',
]
