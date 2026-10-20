import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { App } from './App'

// `globals` está desligado no Vitest, então a limpeza do DOM precisa ser explícita.
afterEach(cleanup)

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

/**
 * Escolhe o primeiro dia que ainda tenha horário livre e o primeiro horário disponível.
 * O teste não pode assumir "hoje", porque à noite ou no fim do expediente de sábado
 * a grade do dia já está toda no passado — a falha era do teste, não do app.
 */
async function pickFirstAvailableSlot(user: ReturnType<typeof userEvent.setup>) {
  const dayGroup = await screen.findByRole('group', { name: 'Escolha o dia' })
  const days = within(dayGroup).getAllByRole('button')

  for (const day of days) {
    if (/Lotado/.test(day.textContent ?? '')) continue
    await user.click(day)
    const slot = screen
      .queryAllByRole('button')
      .find((button) => /^\d{2}:\d{2}até \d{2}:\d{2}$/.test(button.textContent ?? ''))
    if (slot) {
      await user.click(slot)
      return
    }
  }

  throw new Error('Nenhum horário livre encontrado na semana exibida pelo agendamento.')
}

function loginAsAdmin() {
  window.localStorage.setItem(
    'elegance-studio:session',
    JSON.stringify({
      userId: 'user-gestao',
      name: 'Gestão Elegance',
      email: 'gestao@elegance.com',
      role: 'admin',
    }),
  )
}

function loginAsClient() {
  window.localStorage.setItem(
    'elegance-studio:session',
    JSON.stringify({
      userId: 'user-mariana',
      name: 'Mariana Silveira',
      email: 'mariana@exemplo.com',
      role: 'cliente',
    }),
  )
}

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

describe('renderização das telas', () => {
  it('Home mostra serviços populares e informações do estúdio', async () => {
    renderRoute('/')
    expect(
      await screen.findByRole('heading', { level: 1, name: /Realize sua beleza natural/i }),
    ).toBeTruthy()
    expect(screen.getByText('Serviços Populares')).toBeTruthy()
    expect(screen.getByText(/Corte & Visagismo Feminino/)).toBeTruthy()
    expect(screen.getByText('Onde Estamos & Horários')).toBeTruthy()
    expect(screen.getByRole('link', { name: /Agendar agora/i })).toBeTruthy()
  })

  it('Serviços lista o catálogo agrupado e permite buscar', async () => {
    const user = userEvent.setup()
    renderRoute('/servicos')
    expect(await screen.findByText('Podologia Especializada')).toBeTruthy()
    expect(screen.getByText('Podologia Completa & Terapêutica')).toBeTruthy()

    await user.type(screen.getByLabelText('Buscar serviço'), 'manicure')
    expect(screen.getAllByText('Manicure Clássica').length).toBeGreaterThan(0)
    expect(screen.queryByText('Podologia Completa & Terapêutica')).toBeNull()
  })

  it('Entrar mostra o formulário e as contas de demonstração', async () => {
    renderRoute('/entrar')
    expect(await screen.findByRole('heading', { name: 'EleganceStudio' })).toBeTruthy()
    expect(screen.getByLabelText('E-mail')).toBeTruthy()
    expect(screen.getByLabelText('Senha')).toBeTruthy()
    expect(screen.getByText('Acesso de demonstração')).toBeTruthy()
  })

  it('Criar conta mostra medidor de senha e termos', async () => {
    renderRoute('/criar-conta')
    expect(await screen.findByRole('heading', { name: 'Crie sua Conta' })).toBeTruthy()
    expect(screen.getByText(/Segurança:/)).toBeTruthy()
    expect(screen.getByLabelText('Telefone / WhatsApp')).toBeTruthy()
  })

  it('Recuperar senha tem os canais e-mail e WhatsApp', async () => {
    const user = userEvent.setup()
    renderRoute('/recuperar-senha')
    expect(await screen.findByRole('heading', { name: 'Recuperar Senha' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: /WhatsApp/ }))
    expect(screen.getByLabelText('WhatsApp cadastrado')).toBeTruthy()
  })

  it('Meus agendamentos sem sessão redireciona para a tela de entrar', async () => {
    renderRoute('/meus-agendamentos')
    expect(await screen.findByText('Acesso de demonstração')).toBeTruthy()
    expect(screen.getByLabelText('E-mail')).toBeTruthy()
  })

  it('Meus agendamentos mostra as abas Próximos e Histórico para a cliente', async () => {
    loginAsClient()
    renderRoute('/meus-agendamentos')
    expect(await screen.findByRole('button', { name: /Próximos/ })).toBeTruthy()
    expect(screen.getByRole('button', { name: /Histórico/ })).toBeTruthy()
    expect(screen.getAllByText(/Corte & Visagismo Feminino/).length).toBeGreaterThan(0)
  })

  it('Painel bloqueia cliente e libera a gestão', async () => {
    loginAsClient()
    const { unmount } = renderRoute('/painel')
    expect(await screen.findByText('Área restrita à gestão')).toBeTruthy()
    unmount()

    window.localStorage.clear()
    loginAsAdmin()
    renderRoute('/painel')
    expect(await screen.findByText('Painel Executivo')).toBeTruthy()
    expect(screen.getByText('Linha do Tempo')).toBeTruthy()
    expect(screen.getByText(/horários livres hoje/)).toBeTruthy()
  })

  it('rota inexistente cai na página 404', async () => {
    renderRoute('/nao-existe')
    expect(await screen.findByText('Página não encontrada')).toBeTruthy()
  })
})

describe('fluxo de agendamento', () => {
  it('percorre as 4 etapas e grava o agendamento no armazenamento local', async () => {
    const user = userEvent.setup()
    renderRoute('/')

    // Etapa 1: escolher o serviço direto do cartão de destaque
    const chooseButtons = await screen.findAllByRole('button', { name: 'Escolher' })
    expect(chooseButtons.length).toBeGreaterThan(0)
    await user.click(chooseButtons[0]!)
    expect(await screen.findByText('Etapa 2 de 4')).toBeTruthy()

    // Etapa 2: profissional sugerida
    await user.click(screen.getByRole('button', { name: /Ver horários disponíveis/i }))
    // A tela da etapa 3 não usa o rótulo "Etapa 3 de 4" (segue o print), então
    // verificamos pelo título da seção de data.
    expect(await screen.findByText('Data do Atendimento')).toBeTruthy()

    // Etapa 3: escolher um dia com vaga e o primeiro horário livre
    await pickFirstAvailableSlot(user)

    const continueButton = screen.getByRole('button', { name: /Continuar para Revisão/i })
    expect((continueButton as HTMLButtonElement).disabled).toBe(false)
    await user.click(continueButton)

    // Etapa 4: revisar e confirmar
    expect(await screen.findByText('Etapa 4 de 4')).toBeTruthy()
    await user.type(screen.getByLabelText(/Para quem é o agendamento/), 'Cliente Teste')
    await user.click(screen.getByRole('button', { name: /Confirmar Agendamento/i }))

    expect(await screen.findByText('Agendamento registrado')).toBeTruthy()

    const stored = JSON.parse(
      window.localStorage.getItem('elegance-studio:v1') ?? '{"appointments":[]}',
    ) as { appointments: Array<{ clientName: string; status: string }> }
    const created = stored.appointments.find((item) => item.clientName === 'Cliente Teste')
    expect(created).toBeTruthy()
    expect(created?.status).toBe('aguardando')
  })

  it('exige nome antes de confirmar', async () => {
    const user = userEvent.setup()
    renderRoute('/agendar/servico')
    const candidates = await screen.findAllByRole('button', { name: 'Escolher' })
    await user.click(candidates[0]!)
    await user.click(screen.getByRole('button', { name: /Escolher profissional/i }))
    await user.click(await screen.findByRole('button', { name: /Ver horários disponíveis/i }))

    await pickFirstAvailableSlot(user)
    await user.click(screen.getByRole('button', { name: /Continuar para Revisão/i }))

    await user.click(await screen.findByRole('button', { name: /Confirmar Agendamento/i }))
    expect(await screen.findByRole('alert')).toBeTruthy()
  })
})

describe('gestão do atendimento', () => {
  it('inicia e conclui um atendimento confirmado da agenda de hoje', async () => {
    const user = userEvent.setup()
    loginAsAdmin()
    renderRoute('/painel')

    const timeline = await screen.findByText('Linha do Tempo')
    expect(timeline).toBeTruthy()

    const startButtons = screen.getAllByRole('button', { name: /Iniciar Atendimento/i })
    expect(startButtons.length).toBeGreaterThan(0)
    await user.click(startButtons[0]!)
    expect(screen.getAllByText('Em Atendimento').length).toBeGreaterThan(0)

    const finishButtons = screen.getAllByRole('button', { name: /Concluir Atendimento/i })
    await user.click(finishButtons[0]!)
    expect(screen.getAllByText('Concluído').length).toBeGreaterThan(0)
  })

  it('mostra o no-show calculado e permite reverter uma falta registrada', async () => {
    const user = userEvent.setup()
    loginAsAdmin()
    renderRoute('/painel')

    expect(await screen.findByText(/Qualidade da agenda/)).toBeTruthy()
    // 1 falta em 4 atendimentos concluídos + 1 falta = 20% (dados de exemplo do dia).
    expect(screen.getByText('20% no-show')).toBeTruthy()

    const cards = await screen.findAllByRole('article')
    const card = cards.find((item) => /Paula Andrade/.test(item.textContent ?? ''))
    expect(card).toBeTruthy()
    expect(within(card!).getByText('Faltou')).toBeTruthy()

    await user.click(within(card!).getByRole('button', { name: 'Editar atendimento' }))
    await user.click(within(card!).getByRole('button', { name: /Reverter falta/i }))

    const stored = JSON.parse(
      window.localStorage.getItem('elegance-studio:v1') ?? '{"appointments":[]}',
    ) as { appointments: Array<{ id: string; status: string }> }
    expect(stored.appointments.find((item) => item.id === 'apt-hoje-12')?.status).toBe('confirmado')
  })

  it('cliente cancela um agendamento futuro', async () => {
    const user = userEvent.setup()
    loginAsClient()
    renderRoute('/meus-agendamentos')

    // Escolhe um card que ainda não começou (o primeiro pode já ter passado hoje).
    const cards = await screen.findAllByRole('article')
    const card = cards.find((item) => /Limpeza de Pele/.test(item.textContent ?? ''))!
    expect(card).toBeTruthy()
    await user.click(within(card).getByRole('button', { name: /Cancelar Agendamento/i }))
    await user.click(within(card).getByRole('button', { name: 'Cancelar' }))

    const stored = JSON.parse(
      window.localStorage.getItem('elegance-studio:v1') ?? '{"appointments":[]}',
    ) as { appointments: Array<{ id: string; status: string }> }
    expect(stored.appointments.some((item) => item.status === 'cancelado')).toBe(true)
  })
})

describe('autenticação local', () => {
  it('recusa senha incorreta', async () => {
    const user = userEvent.setup()
    renderRoute('/entrar')
    await user.type(await screen.findByLabelText('E-mail'), 'mariana@exemplo.com')
    await user.type(screen.getByLabelText('Senha'), 'senha-errada')
    await user.click(screen.getByRole('button', { name: /Entrar na conta/i }))
    expect(await screen.findByRole('alert')).toBeTruthy()
  })

  it('entra com a conta de demonstração e vê os próprios agendamentos', async () => {
    const user = userEvent.setup()
    renderRoute('/entrar')
    await user.click(await screen.findByRole('button', { name: /mariana@exemplo\.com/ }))
    await user.click(screen.getByRole('button', { name: /Entrar na conta/i }))
    expect(await screen.findByRole('button', { name: /Próximos/ })).toBeTruthy()
  })
})
