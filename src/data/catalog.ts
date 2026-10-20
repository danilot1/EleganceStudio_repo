import type { Category, Professional, Service } from '../lib/types'

/**
 * Catálogo extraído da tela "Serviços" do protótipo.
 * Durações vêm do print. Preços: os que aparecem em alguma tela do protótipo estão
 * marcados sem `priceEstimated`; os demais foram estimados (ver STATUS.md).
 */

export const CATEGORIES: Category[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'cabelos', label: 'Cabelos' },
  { id: 'maos-pes', label: 'Mãos & Pés' },
  { id: 'podologia', label: 'Podologia' },
  { id: 'estetica', label: 'Estética' },
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
  { id: 'cuidados-capilares', label: 'Cuidados Capilares', professionalId: 'cris' },
  { id: 'unhas-manicure', label: 'Unhas & Manicure', professionalId: 'cris' },
  { id: 'podologia', label: 'Podologia Especializada', professionalId: 'simone' },
  { id: 'design-estetica', label: 'Design & Estética', studioLabel: 'Elegance Studio' },
]

export const PROFESSIONALS: Professional[] = [
  {
    id: 'cris',
    name: 'Cris',
    role: 'Hair Stylist & Nail Artist',
    specialties: ['Cabelos', 'Unhas'],
    rating: 4.8,
    reviews: 96,
    chair: 'Cadeira 01',
    accent: '#b08c4f',
  },
  {
    id: 'simone',
    name: 'Simone',
    role: 'Podóloga & Nail Designer',
    specialties: ['Podologia', 'Unhas'],
    rating: 4.9,
    reviews: 74,
    chair: 'Sala 02',
    accent: '#8b6b2e',
  },
  {
    id: 'camila',
    name: 'Camila Rodrigues',
    role: 'Hair Stylist Master',
    specialties: ['Visagismo'],
    rating: 4.9,
    reviews: 128,
    chair: 'Cadeira 03',
    accent: '#c9a96a',
  },
  {
    id: 'juliana',
    name: 'Juliana M.',
    role: 'Colorista',
    specialties: ['Coloração', 'Mechas'],
    rating: 4.8,
    reviews: 61,
    chair: 'Cadeira 02',
    accent: '#a9825a',
  },
  {
    id: 'beatriz',
    name: 'Beatriz Lima',
    role: 'Esteticista',
    specialties: ['Estética Facial', 'Sobrancelhas'],
    rating: 4.7,
    reviews: 43,
    chair: 'Sala 01',
    accent: '#9c7a45',
  },
]

export const SERVICES: Service[] = [
  // ---------------------------------------------------------------- Cuidados Capilares
  {
    id: 'lavagem-especial',
    name: 'Lavagem Especial & Finalização',
    groupId: 'cuidados-capilares',
    categoryId: 'cabelos',
    professionalId: 'cris',
    durationMin: 50,
    price: 90,
    priceEstimated: true,
    description:
      'Massagem capilar revigorante com shampoo botânico nutritivo e secagem fluida.',
  },
  {
    id: 'escova-modeladora',
    name: 'Escova Modeladora',
    groupId: 'cuidados-capilares',
    categoryId: 'cabelos',
    professionalId: 'cris',
    durationMin: 45,
    price: 130,
    description: 'Secagem fluida e modelagem com protetor térmico para um acabamento natural.',
    popular: true,
  },
  {
    id: 'corte-visagismo',
    name: 'Corte & Visagismo Feminino',
    groupId: 'cuidados-capilares',
    categoryId: 'cabelos',
    professionalId: 'camila',
    durationMin: 50,
    price: 180,
    description:
      'Análise de linhas faciais, corte sob medida e finalização personalizada.',
    featured: true,
    popular: true,
  },
  {
    id: 'hidratacao-profunda',
    name: 'Hidratação & Nutrição Profunda',
    groupId: 'cuidados-capilares',
    categoryId: 'cabelos',
    professionalId: 'cris',
    durationMin: 50,
    price: 160,
    priceEstimated: true,
    description: 'Reposição de massa capilar com ativos de alta performance para fios sedosos.',
  },
  {
    id: 'coloracao-glow',
    name: 'Coloração Glow',
    groupId: 'cuidados-capilares',
    categoryId: 'cabelos',
    professionalId: 'juliana',
    durationMin: 90,
    price: 250,
    priceEstimated: true,
    description: 'Cobertura impecável com pigmentação de alto reflexo e proteção da fibra capilar.',
  },
  {
    id: 'mechas-luzes',
    name: 'Mechas · Luzes Iluminadas',
    groupId: 'cuidados-capilares',
    categoryId: 'cabelos',
    professionalId: 'juliana',
    durationMin: 150,
    price: 390,
    priceEstimated: true,
    description: 'Tons sob medida com técnica de iluminação que realça o movimento natural.',
    popular: true,
  },
  {
    id: 'botox-capilar',
    name: 'Botox Capilar Vinilador',
    groupId: 'cuidados-capilares',
    categoryId: 'cabelos',
    professionalId: 'cris',
    durationMin: 105,
    price: 280,
    priceEstimated: true,
    description: 'Controle absoluto de frizz, redução suave de volume e selagem dos cutículos.',
  },
  {
    id: 'progressiva-organica',
    name: 'Progressiva Orgânica',
    groupId: 'cuidados-capilares',
    categoryId: 'cabelos',
    professionalId: 'cris',
    durationMin: 180,
    price: 450,
    priceEstimated: true,
    description:
      'Alisamento sem formol com compostos de amidos vegetais e resultado natural, sem agredir os fios.',
  },

  // ---------------------------------------------------------------- Unhas & Manicure
  {
    id: 'manicure-classica',
    name: 'Manicure Clássica',
    groupId: 'unhas-manicure',
    categoryId: 'maos-pes',
    professionalId: 'cris',
    durationMin: 40,
    price: 75,
    description: 'Cutilagem precisa, esmaltação impecável e finalização com óleo nutritivo.',
    popular: true,
  },
  {
    id: 'pedicure-spa',
    name: 'Pedicure Spa',
    groupId: 'unhas-manicure',
    categoryId: 'maos-pes',
    professionalId: 'simone',
    durationMin: 45,
    price: 95,
    priceEstimated: true,
    description: 'Esfoliação perfumada, massagem com aromaterapia e hidratação profunda dos pés.',
  },
  {
    id: 'combo-pes-mao',
    name: 'Combo Pés e Mão',
    groupId: 'unhas-manicure',
    categoryId: 'maos-pes',
    professionalId: 'simone',
    durationMin: 75,
    price: 150,
    priceEstimated: true,
    description: 'Spa dos pés natural e corte preciso de unhas e cutículas para pés e mãos.',
  },

  // ---------------------------------------------------------------- Podologia Especializada
  {
    id: 'podologia-completa',
    name: 'Podologia Completa & Terapêutica',
    groupId: 'podologia',
    categoryId: 'podologia',
    professionalId: 'simone',
    durationMin: 60,
    price: 220,
    priceEstimated: true,
    description:
      'Higienização profunda, remoção de calosidades e tratamento de unhas encravadas e desidrose, com protocolo humanizado e indolor.',
    note: 'Atendimento individual estéril com autoclave médica',
  },

  // ---------------------------------------------------------------- Design & Estética
  {
    id: 'design-sobrancelha',
    name: 'Design de Sobrancelha',
    groupId: 'design-estetica',
    categoryId: 'estetica',
    professionalId: 'beatriz',
    durationMin: 35,
    price: 70,
    priceEstimated: true,
    description: 'Mapeamento facial com pontos de referência personalizados e traço perfeito.',
  },
  {
    id: 'depilacao-facial',
    name: 'Depilação Facial & Delicada',
    groupId: 'design-estetica',
    categoryId: 'estetica',
    professionalId: 'beatriz',
    durationMin: 40,
    price: 110,
    priceEstimated: true,
    description: 'Técnica suave com presença e leveza a cada sessão, respeitando a sua pele.',
  },
  {
    // Serviço citado em "Meus Agendamentos"; a seção de estética aparece cortada no
    // print do catálogo, por isso a contagem do filtro "Todos" fica 15 e não 14.
    id: 'limpeza-pele-led',
    name: 'Limpeza de Pele Profunda & LED',
    groupId: 'design-estetica',
    categoryId: 'estetica',
    professionalId: 'beatriz',
    durationMin: 60,
    price: 210,
    description: 'Higienização profunda, extração cuidadosa e fototerapia LED para renovar a pele.',
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
  'corte-visagismo',
  'mechas-luzes',
  'escova-modeladora',
  'manicure-classica',
]
