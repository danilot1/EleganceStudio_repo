/**
 * Registro de imagens.
 *
 * Cada chave é uma posição de foto do protótipo (hero, serviços, ambiente, avatares).
 * O export do design não trouxe fotos, então as imagens em `public/images/` são fotos
 * de banco de imagens com licença CC0 (uso livre), usadas como imagem provisória —
 * ver `public/images/CREDITOS.md`.
 *
 * Para trocar pelas fotos reais do estúdio:
 *   1. substitua os arquivos em `public/images/` mantendo os mesmos nomes (ou use outros);
 *   2. ajuste o caminho abaixo, sempre começando em `/images/`.
 *
 * Nada mais precisa ser alterado — o componente <Photo /> passa a renderizar a imagem.
 * Chave com `undefined` continua mostrando o placeholder desenhado em CSS.
 */
export const IMAGE_SOURCES: Record<string, string | undefined> = {
  homeHero: '/images/home-hero.jpg',
  /** Foto real do estúdio: sala de podologia. */
  homeLounge: '/images/sala-podologia.jpg',
  /** O mapa ainda é placeholder: não existe imagem de mapa sem serviço de mapas. */
  homeMap: undefined,
  homeServiceHair: '/images/servico-cabelo.jpg',
  homeServiceNails: '/images/servico-unhas.jpg',
  homeServicePedicure: '/images/servico-pedicure.jpg',
  homeServiceBrows: '/images/servico-sobrancelhas.jpg',
  loginHero: '/images/login-hero.jpg',
  professionalCamila: undefined,
  professionalCris: undefined,
  professionalSimone: undefined,
  professionalJuliana: undefined,
  professionalBeatriz: undefined,
  clientAvatar: undefined,
}
