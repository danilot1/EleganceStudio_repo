import { ArrowRight, Database, KeyRound } from 'lucide-react'

/**
 * Tela exibida quando faltam as variáveis do Firebase.
 *
 * Sem elas o app não tem onde ler nem gravar: em vez de abrir com dados falsos, ele
 * explica o que falta e para de funcionar. Ver README → "Back-end (Firebase)".
 */
export function SetupRequired({ missing }: { missing: string[] }) {
  return (
    <div className="grid min-h-dvh place-items-center bg-canvas px-4 py-10">
      <div className="w-full max-w-[560px] space-y-4">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full bg-gold-tint text-gold">
            <Database className="size-5" aria-hidden />
          </span>
          <div>
            <p className="brand-wordmark text-[20px] leading-none">Elegance</p>
            <p className="brand-sub mt-1">Studio</p>
          </div>
        </div>

        <section className="card space-y-3">
          <h1 className="text-[22px] leading-tight text-ink">Falta configurar o Firebase</h1>
          <p className="text-[13px] leading-relaxed text-ink-soft">
            Este projeto não guarda mais dados no navegador: contas e agendamentos vivem no
            Firebase. Crie o arquivo <code className="font-mono text-[12px]">.env</code> na raiz com
            as chaves do seu projeto (modelo em{' '}
            <code className="font-mono text-[12px]">.env.example</code>) e reinicie o servidor.
          </p>

          <div className="space-y-1.5">
            <p className="eyebrow flex items-center gap-1.5">
              <KeyRound className="size-3.5" aria-hidden />
              Variáveis faltando
            </p>
            <ul className="space-y-1">
              {missing.map((name) => (
                <li
                  key={name}
                  className="rounded-[10px] border border-line bg-surface-2 px-2.5 py-1.5 font-mono text-[12px] text-ink-soft"
                >
                  {name}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[12px] leading-relaxed text-ink-muted">
            No console do Firebase: Configurações do projeto → Seus apps → Web → Configuração do
            SDK. Depois habilite Authentication (e-mail/senha) e crie o banco Firestore.
          </p>

          <a
            className="btn-primary w-full"
            href="https://console.firebase.google.com/"
            target="_blank"
            rel="noreferrer"
          >
            Abrir o console do Firebase
            <ArrowRight className="size-4" aria-hidden />
          </a>
        </section>
      </div>
    </div>
  )
}
