/**
 * Registro de imagens.
 *
 * O protótipo usa fotos (hero, serviços, ambiente, avatares). Nenhuma imagem do Stitch
 * veio junto dos prints, então cada posição começa como placeholder desenhado em CSS.
 *
 * Para usar as fotos reais:
 *   1. coloque os arquivos em `public/images/` (ex.: `public/images/home-hero.jpg`);
 *   2. troque o valor abaixo pelo caminho público iniciando em `/images/`.
 *
 * Nada mais precisa ser alterado — o componente <Photo /> passa a renderizar a imagem.
 */
export const IMAGE_SOURCES: Record<string, string | undefined> = {
  homeHero: undefined,
  homeLounge: undefined,
  homeServiceHair: undefined,
  homeServiceNails: undefined,
  homeServicePedicure: undefined,
  homeServiceBrows: undefined,
  loginHero: undefined,
  professionalCamila: undefined,
  professionalCris: undefined,
  professionalSimone: undefined,
  professionalJuliana: undefined,
  professionalBeatriz: undefined,
  clientAvatar: undefined,
}
