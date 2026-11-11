import type { Category, Professional, Service } from '../lib/types'

/**
 * Catálogo do estúdio, conforme o folheto "Nossos Serviços" (@elegancestudio2.5).
 *
 * Preços: o folheto não traz valores, então nenhum serviço tem `price` aqui e as telas
 * mostram "Sob consulta". A gestão pode definir o valor de cada serviço na aba
 * Serviços do painel, que grava um ajuste sem mexer neste arquivo.
 *
 * Durações: o folheto também não traz o tempo de cada serviço. Os valores abaixo são
 * estimativas para montar a agenda e devem ser conferidos pela gestão no painel.
 *
 * Profissionais: nomes e avaliações ainda são os do protótipo, à espera dos dados reais.
 */

export const CATEGORIES: Category[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'maos-pes', label: 'Mãos & Pés' },
  { id: 'podologia', label: 'Podologia' },
  { id: 'depilacao', label: 'Depilação' },
]

export interface ServiceGroup {
  id: string
  label: string
  /** Profissional responsável pelo grupo; vazio quando o grupo é do próprio estúdio. */
  professionalId?: string
  /** Rótulo fixo exibido quando o grupo não pertence a um profissional específico. */
  studioLabel?: string
}

export const SERVICE_GROUPS: ServiceGroup[] = [
  { id: 'servicos-basicos', label: 'Serviços Básicos', professionalId: 'cris' },
  { id: 'podologia', label: 'Podologia', professionalId: 'simone' },
  { id: 'depilacao-feminina', label: 'Depilação Feminina', professionalId: 'beatriz' },
  { id: 'depilacao-masculina', label: 'Depilação Masculina', professionalId: 'beatriz' },
]

export const PROFESSIONALS: Professional[] = [
  {
    id: 'cris',
    name: 'Cris',
    role: 'Manicure & Pedicure',
    specialties: ['Mãos', 'Pés'],
    rating: 4.8,
    reviews: 96,
    chair: 'Cadeira 01',
    accent: '#b08c4f',
  },
  {
    id: 'simone',
    name: 'Simone',
    role: 'Podóloga',
    specialties: ['Podologia', 'Pés'],
    rating: 4.9,
    reviews: 74,
    chair: 'Sala 02',
    accent: '#8b6b2e',
  },
  {
    id: 'beatriz',
    name: 'Beatriz Lima',
    role: 'Depiladora',
    specialties: ['Depilação', 'Sobrancelhas'],
    rating: 4.7,
    reviews: 43,
    chair: 'Sala 01',
    accent: '#9c7a45',
  },
]

export const SERVICES: Service[] = [
  // ---------------------------------------------------------------- Serviços Básicos
  {
    id: 'pe',
    name: 'Pé',
    groupId: 'servicos-basicos',
    categoryId: 'maos-pes',
    professionalId: 'cris',
    durationMin: 50,
    description: 'Cuidado completo das unhas dos pés.',
    popular: true,
  },
  {
    id: 'mao',
    name: 'Mão',
    groupId: 'servicos-basicos',
    categoryId: 'maos-pes',
    professionalId: 'cris',
    durationMin: 40,
    description: 'Cuidado completo das unhas das mãos.',
    popular: true,
  },
  {
    id: 'esmaltacao-pe-mao',
    name: 'Esmaltação pé e mão',
    groupId: 'servicos-basicos',
    categoryId: 'maos-pes',
    professionalId: 'cris',
    durationMin: 40,
    description: 'Esmaltação das unhas dos pés e das mãos.',
  },
  {
    id: 'spa-dos-pes',
    name: 'SPA dos pés',
    groupId: 'servicos-basicos',
    categoryId: 'maos-pes',
    professionalId: 'cris',
    durationMin: 60,
    description: 'Ritual de cuidado e relaxamento para os pés.',
    featured: true,
    popular: true,
  },
  {
    id: 'esfoliacao-pe-mao',
    name: 'Esfoliação pé e mão',
    groupId: 'servicos-basicos',
    categoryId: 'maos-pes',
    professionalId: 'cris',
    durationMin: 40,
    description: 'Esfoliação dos pés e das mãos.',
  },
  {
    id: 'esmaltacao-esfoliacao-pe-mao',
    name: 'Esmaltação pé e mão com esfoliação',
    groupId: 'servicos-basicos',
    categoryId: 'maos-pes',
    professionalId: 'cris',
    durationMin: 75,
    description: 'Esmaltação das unhas dos pés e das mãos, com esfoliação.',
  },

  // ---------------------------------------------------------------- Podologia
  {
    id: 'podologia-procedimento-basico',
    name: 'Procedimento básico',
    groupId: 'podologia',
    categoryId: 'podologia',
    professionalId: 'simone',
    durationMin: 60,
    description: 'Atendimento podológico básico.',
    popular: true,
  },
  {
    id: 'unha-encravada',
    name: 'Unha encravada com 2 (dois) curativos',
    groupId: 'podologia',
    categoryId: 'podologia',
    professionalId: 'simone',
    durationMin: 60,
    description: 'Tratamento da unha encravada, com dois curativos incluídos.',
  },
  {
    id: 'olho-de-peixe',
    name: 'Olho de peixe',
    groupId: 'podologia',
    categoryId: 'podologia',
    professionalId: 'simone',
    durationMin: 45,
    description: 'Tratamento de olho de peixe.',
  },
  {
    id: 'hidratacao-podal-ozonio',
    name: 'Hidratação podal com ozônio',
    groupId: 'podologia',
    categoryId: 'podologia',
    professionalId: 'simone',
    durationMin: 40,
    description: 'Hidratação dos pés com ozônio.',
  },
  {
    id: 'orteses',
    name: 'Órteses',
    groupId: 'podologia',
    categoryId: 'podologia',
    professionalId: 'simone',
    durationMin: 45,
    description: 'Aplicação de órteses podológicas.',
  },
  {
    id: 'eletrocauterio',
    name: 'Eletrocautério (por unidade)',
    groupId: 'podologia',
    categoryId: 'podologia',
    professionalId: 'simone',
    durationMin: 30,
    description: 'Eletrocautério, cobrado por unidade.',
  },
  {
    id: 'micose-laser',
    name: 'Tratamento de micose com laser',
    groupId: 'podologia',
    categoryId: 'podologia',
    professionalId: 'simone',
    durationMin: 40,
    description: 'Tratamento de micose com laser.',
  },

  // ---------------------------------------------------------------- Depilação Feminina
  {
    id: 'depilacao-feminina-sobrancelha',
    name: 'Sobrancelha · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 20,
    description: 'Depilação feminina: sobrancelha.',
    popular: true,
  },
  {
    id: 'depilacao-feminina-braco',
    name: 'Braço · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação feminina: braço.',
  },
  {
    id: 'depilacao-feminina-axila',
    name: 'Axila · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 15,
    description: 'Depilação feminina: axila.',
  },
  {
    id: 'depilacao-feminina-tricotomia',
    name: 'Tricotomia · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação feminina: tricotomia.',
  },
  {
    id: 'depilacao-feminina-cantinho',
    name: 'Cantinho · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 20,
    description: 'Depilação feminina: cantinho.',
  },
  {
    id: 'depilacao-feminina-x1',
    name: 'X1 · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação feminina: modalidade X1.',
  },
  {
    id: 'depilacao-feminina-x2',
    name: 'X2 · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 45,
    description: 'Depilação feminina: modalidade X2.',
  },
  {
    id: 'depilacao-feminina-coxa',
    name: 'Coxa · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação feminina: coxa.',
  },
  {
    id: 'depilacao-feminina-meia-perna',
    name: 'Meia perna · Feminina',
    groupId: 'depilacao-feminina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação feminina: meia perna.',
  },

  // ---------------------------------------------------------------- Depilação Masculina
  {
    id: 'depilacao-masculina-sobrancelha',
    name: 'Sobrancelha · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 20,
    description: 'Depilação masculina: sobrancelha.',
  },
  {
    id: 'depilacao-masculina-braco',
    name: 'Braço · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação masculina: braço.',
  },
  {
    id: 'depilacao-masculina-axila',
    name: 'Axila · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 15,
    description: 'Depilação masculina: axila.',
  },
  {
    id: 'depilacao-masculina-tricotomia',
    name: 'Tricotomia · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação masculina: tricotomia.',
  },
  {
    id: 'depilacao-masculina-torax',
    name: 'Tórax · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação masculina: tórax.',
  },
  {
    id: 'depilacao-masculina-barriga',
    name: 'Barriga · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 20,
    description: 'Depilação masculina: barriga.',
  },
  {
    id: 'depilacao-masculina-coxa',
    name: 'Coxa · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação masculina: coxa.',
  },
  {
    id: 'depilacao-masculina-meia-perna',
    name: 'Meia perna · Masculina',
    groupId: 'depilacao-masculina',
    categoryId: 'depilacao',
    professionalId: 'beatriz',
    durationMin: 30,
    description: 'Depilação masculina: meia perna.',
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

export function professionalLabel(professionalId: string | undefined): string {
  const professional = findProfessional(professionalId)
  return professional ? professional.name : 'Elegance Studio'
}

/** Serviços exibidos na Home em "Serviços Populares". */
export const POPULAR_SERVICE_IDS = [
  'spa-dos-pes',
  'podologia-procedimento-basico',
  'mao',
  'depilacao-feminina-sobrancelha',
]
