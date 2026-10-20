import { Link } from 'react-router-dom'
import { BrandMark } from '../components/ClientShell'

export function NotFound() {
  return (
    <div className="min-h-dvh bg-canvas">
      <div className="mx-auto flex w-full max-w-[560px] flex-col items-center gap-4 px-4 py-16 text-center">
        <BrandMark />
        <h1 className="text-[26px] text-ink">Página não encontrada</h1>
        <p className="text-[13px] leading-relaxed text-ink-muted">
          O endereço acessado não existe neste protótipo. Use a navegação para voltar ao início.
        </p>
        <Link to="/" className="btn-primary">
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
