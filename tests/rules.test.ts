import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

/**
 * Testes das regras do Firestore.
 *
 * Rodam contra o emulador (`npm run test:rules`), não no `npm test`: exigem Java e
 * a porta do emulador. O `npm test` continua rápido e sem rede, cobrindo a lógica do
 * aplicativo; aqui o que está sob teste é a permissão.
 *
 * O objetivo é provar as três garantias que a tela sozinha não dá:
 *   1. uma cliente não lê nem altera o agendamento de outra;
 *   2. ninguém se promove a gestão pelo cadastro;
 *   3. catálogo e lista de clientes são da gestão.
 */

let environment: RulesTestEnvironment

const CLIENT_APPOINTMENT = {
  clientName: 'Cliente Teste',
  clientUserId: 'cliente-1',
  serviceId: 'corte-visagismo',
  title: null,
  professionalId: 'camila',
  dateISO: '2099-11-10',
  startMin: 600,
  durationMin: 60,
  price: 180,
  status: 'aguardando',
  payment: 'pendente',
  paymentMethod: null,
  origin: 'app',
  note: null,
}

const DAY = {
  professionalId: 'camila',
  dateISO: '2099-11-10',
  blocks: [{ appointmentId: 'apt-1', startMin: 600, durationMin: 60, status: 'aguardando' }],
}

beforeAll(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'elegance-rules-test',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await environment.cleanup()
})

beforeEach(async () => {
  await environment.clearFirestore()
  await environment.withSecurityRulesDisabled(async (context) => {
    const database = context.firestore()
    await setDoc(doc(database, 'users', 'cliente-1'), {
      name: 'Cliente Um',
      email: 'cliente1@exemplo.com',
      phone: '11999999999',
      role: 'cliente',
    })
    await setDoc(doc(database, 'users', 'cliente-2'), {
      name: 'Cliente Dois',
      email: 'cliente2@exemplo.com',
      phone: '11988888888',
      role: 'cliente',
    })
    await setDoc(doc(database, 'users', 'gestao-1'), {
      name: 'Gestão Elegance',
      email: 'gestao@elegance.com',
      phone: '2132321010',
      role: 'admin',
    })
    await setDoc(doc(database, 'appointments', 'apt-1'), CLIENT_APPOINTMENT)
    await setDoc(doc(database, 'appointments', 'apt-2'), {
      ...CLIENT_APPOINTMENT,
      clientUserId: 'cliente-2',
    })
    await setDoc(doc(database, 'agenda', 'camila__2099-11-10'), DAY)
  })
})

function asClient(uid = 'cliente-1') {
  return environment.authenticatedContext(uid).firestore()
}

function asAdmin() {
  return environment.authenticatedContext('gestao-1').firestore()
}

function asGuest() {
  return environment.unauthenticatedContext().firestore()
}

describe('agendamentos', () => {
  it('a cliente lê o próprio agendamento', async () => {
    await assertSucceeds(getDoc(doc(asClient(), 'appointments', 'apt-1')))
  })

  it('a cliente não lê o agendamento de outra pessoa', async () => {
    await assertFails(getDoc(doc(asClient(), 'appointments', 'apt-2')))
  })

  it('a gestão lê qualquer agendamento', async () => {
    await assertSucceeds(getDoc(doc(asAdmin(), 'appointments', 'apt-2')))
  })

  it('a cliente não cria agendamento em nome de outra pessoa', async () => {
    await assertFails(
      setDoc(doc(asClient(), 'appointments', 'novo'), {
        ...CLIENT_APPOINTMENT,
        clientUserId: 'cliente-2',
      }),
    )
  })

  it('a cliente cria o próprio agendamento', async () => {
    await assertSucceeds(
      setDoc(doc(asClient(), 'appointments', 'novo'), {
        ...CLIENT_APPOINTMENT,
        clientUserId: 'cliente-1',
      }),
    )
  })

  it('convidada agenda sem conta, como no protótipo', async () => {
    await assertSucceeds(
      setDoc(doc(asGuest(), 'appointments', 'novo'), {
        ...CLIENT_APPOINTMENT,
        clientUserId: null,
      }),
    )
  })

  it('a cliente não troca o dono do próprio agendamento', async () => {
    await assertFails(
      updateDoc(doc(asClient(), 'appointments', 'apt-1'), { clientUserId: 'cliente-2' }),
    )
  })

  it('a cliente altera o próprio agendamento', async () => {
    await assertSucceeds(
      updateDoc(doc(asClient(), 'appointments', 'apt-1'), { status: 'cancelado' }),
    )
  })
})

describe('perfis', () => {
  it('ninguém se promove a gestão pelo cadastro', async () => {
    await assertFails(
      updateDoc(doc(asClient(), 'users', 'cliente-1'), { role: 'admin' }),
    )
  })

  it('a cliente lê o próprio perfil', async () => {
    await assertSucceeds(getDoc(doc(asClient(), 'users', 'cliente-1')))
  })

  it('a cliente não lê o perfil de outra pessoa', async () => {
    await assertFails(getDoc(doc(asClient(), 'users', 'cliente-2')))
  })

  it('a gestão lê a lista de clientes', async () => {
    await assertSucceeds(getDoc(doc(asAdmin(), 'users', 'cliente-2')))
  })
})

describe('catálogo e agenda', () => {
  it('a cliente não altera o catálogo', async () => {
    await assertFails(
      setDoc(doc(asClient(), 'serviceOverrides', 'corte-visagismo'), { price: 1 }),
    )
  })

  it('a gestão altera o catálogo', async () => {
    await assertSucceeds(
      setDoc(doc(asAdmin(), 'serviceOverrides', 'corte-visagismo'), { price: 200 }),
    )
  })

  it('o catálogo é público para leitura', async () => {
    await assertSucceeds(
      getDoc(doc(asGuest(), 'serviceOverrides', 'corte-visagismo')),
    )
  })

  it('o documento do dia é legível e gravável na transação do cliente', async () => {
    const database = asClient()
    await assertSucceeds(getDoc(doc(database, 'agenda', 'camila__2099-11-10')))
    await assertSucceeds(
      setDoc(doc(database, 'agenda', 'camila__2099-11-11'), {
        ...DAY,
        dateISO: '2099-11-11',
      }),
    )
  })

  it('recusa documento de dia fora do formato esperado', async () => {
    await assertFails(
      setDoc(doc(asClient(), 'agenda', 'camila__2099-11-11'), {
        professionalId: 'camila',
        dateISO: '2099-11-11',
        blocks: 'não é lista',
      }),
    )
  })
})
