import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore, type Firestore } from 'firebase-admin/firestore'
import { agendaDocsFrom, blocksOf, mergeBlocks, type AgendaBlock, type AgendaDayDoc } from '../src/lib/agendaDoc'
import { createSeededDatabase } from '../src/lib/storage'
import type { Appointment } from '../src/lib/types'

/**
 * Seed de demonstração e backfill dos documentos de agenda.
 *
 * Por que um script com Admin SDK (e não a tela do aplicativo): as regras do Firestore
 * proíbem que alguém se torne gestão sozinho e que uma cliente escreva dados de outra.
 * Carregar a demonstração e criar as contas iniciais é justamente a operação que só o
 * dono do projeto pode fazer — o Admin SDK ignora as regras e é a ferramenta correta.
 * Ele nunca entra no bundle do navegador: o script roda no Node, fora do `src/`.
 *
 * Dois modos:
 *
 *   --demo      recria a demonstração inteira (apaga contas, agendamentos, ajustes de
 *               catálogo e agenda) e grava tudo de novo, derivando os documentos de
 *               agenda dos agendamentos.
 *   --backfill  (padrão) não apaga nada: lê os agendamentos existentes e reconstrói os
 *               documentos `agenda/{profissional}__{dia}` que faltam ou estão
 *               desatualizados. É o conserto dos agendamentos criados antes da fase 3,
 *               quando o documento de agenda ainda não era gravado.
 *
 * Como rodar (o emulador já define as variáveis de ambiente necessárias):
 *
 *   npm run seed:demo       # emulador limpo com a demonstração carregada
 *   npm run seed:backfill   # contra o emulador ou um projeto real
 *
 * Contra um projeto real, aponte as credenciais (GOOGLE_APPLICATION_CREDENTIALS) e o
 * GCLOUD_PROJECT. O modo --demo apaga dados, por isso ele só aceita rodar fora do
 * emulador com `--force` explícito.
 */

const USERS = 'users'
const APPOINTMENTS = 'appointments'
const AGENDA = 'agenda'
const SERVICE_OVERRIDES = 'serviceOverrides'
const BATCH_LIMIT = 400

/** Senha das contas de demonstração (a mesma do protótipo local). */
const DEMO_PASSWORD = 'elegance123'

function log(message: string): void {
  console.log(message)
}

function fail(message: string): never {
  console.error(`\n✖ ${message}\n`)
  process.exit(1)
}

function chunk<T>(items: T[], size: number): T[][] {
  const pages: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    pages.push(items.slice(index, index + size))
  }
  return pages
}

/** Grava (ou sobrescreve) documentos em lotes. */
async function writeAll(
  db: Firestore,
  collectionName: string,
  entries: Array<[string, Record<string, unknown>]>,
): Promise<void> {
  for (const page of chunk(entries, BATCH_LIMIT)) {
    const batch = db.batch()
    for (const [id, data] of page) batch.set(db.collection(collectionName).doc(id), data)
    await batch.commit()
  }
}

/** Apaga todos os documentos de uma coleção, em lotes. */
async function clearCollection(db: Firestore, collectionName: string): Promise<number> {
  let removed = 0
  for (;;) {
    const page = await db.collection(collectionName).limit(BATCH_LIMIT).get()
    if (page.empty) return removed
    const batch = db.batch()
    for (const document of page.docs) batch.delete(document.ref)
    await batch.commit()
    removed += page.size
  }
}

async function clearAuthUsers(): Promise<number> {
  const auth = getAuth()
  let removed = 0
  let pageToken: string | undefined
  do {
    const page = await auth.listUsers(1000, pageToken)
    const uids = page.users.map((user) => user.uid)
    if (uids.length > 0) {
      await auth.deleteUsers(uids)
      removed += uids.length
    }
    pageToken = page.pageToken
  } while (pageToken)
  return removed
}

/** Lê todos os agendamentos (paginado) no formato mínimo que a agenda usa. */
async function readAppointments(db: Firestore): Promise<Appointment[]> {
  const appointments: Appointment[] = []
  for (let offset = 0; ; offset += BATCH_LIMIT) {
    const page = await db.collection(APPOINTMENTS).limit(BATCH_LIMIT).offset(offset).get()
    for (const document of page.docs) {
      const data = document.data()
      appointments.push({
        id: document.id,
        clientName: String(data.clientName ?? ''),
        serviceId: String(data.serviceId ?? ''),
        professionalId: String(data.professionalId ?? ''),
        dateISO: String(data.dateISO ?? ''),
        startMin: Number(data.startMin ?? 0),
        durationMin: Number(data.durationMin ?? 0),
        status: (data.status as Appointment['status']) ?? 'aguardando',
        payment: (data.payment as Appointment['payment']) ?? 'pendente',
        origin: data.origin === 'balcao' ? 'balcao' : 'app',
      })
    }
    if (page.size < BATCH_LIMIT) return appointments
  }
}

/** Assinatura dos blocos, para só regravar o que mudou de verdade. */
function blocksKey(blocks: AgendaBlock[]): string {
  return blocks
    .map((block) => `${block.appointmentId}:${block.startMin}:${block.durationMin}:${block.status}`)
    .sort()
    .join('|')
}

/** Confere, relendo do Firestore, que cada bloco esperado está gravado. */
async function verifyAgenda(db: Firestore, expected: AgendaDayDoc[]): Promise<string[]> {
  const problems: string[] = []
  for (const day of expected) {
    const snapshot = await db.collection(AGENDA).doc(day.docId).get()
    if (!snapshot.exists) {
      problems.push(`${day.docId}: documento ausente`)
      continue
    }
    const stored = new Map(blocksOf(snapshot.data()).map((block) => [block.appointmentId, block]))
    for (const block of day.blocks) {
      const found = stored.get(block.appointmentId)
      if (!found) {
        problems.push(`${day.docId}: bloco ${block.appointmentId} ausente`)
      } else if (
        found.startMin !== block.startMin ||
        found.durationMin !== block.durationMin ||
        found.status !== block.status
      ) {
        problems.push(`${day.docId}: bloco ${block.appointmentId} divergente`)
      }
    }
  }
  return problems
}

async function seedDemo(db: Firestore): Promise<void> {
  log('• limpando a demonstração anterior…')
  const removedUsers = await clearAuthUsers()
  const removed: string[] = []
  for (const collectionName of [APPOINTMENTS, AGENDA, SERVICE_OVERRIDES, USERS]) {
    const count = await clearCollection(db, collectionName)
    removed.push(`${collectionName}: ${count}`)
  }
  log(`  contas removidas: ${removedUsers} | documentos removidos: ${removed.join(', ')}`)

  const seed = createSeededDatabase()
  const auth = getAuth()

  // As contas vão para o Firebase Auth; o documento em `users` guarda o papel que as
  // regras consultam (`role`). A senha nunca é gravada no Firestore.
  const uidBySeedId = new Map<string, string>()
  for (const user of seed.users) {
    const created = await auth.createUser({
      email: user.email,
      password: DEMO_PASSWORD,
      displayName: user.name,
      emailVerified: true,
    })
    uidBySeedId.set(user.id, created.uid)
    await db.collection(USERS).doc(created.uid).set({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAtISO: user.createdAtISO,
      createdAt: FieldValue.serverTimestamp(),
    })
  }
  log(`• contas criadas: ${seed.users.length} (senha "${DEMO_PASSWORD}")`)

  // O identificador da cliente de exemplo passa a ser o uid real do Firebase Auth.
  const appointments: Appointment[] = seed.appointments.map((item) => ({
    ...item,
    clientUserId: item.clientUserId ? uidBySeedId.get(item.clientUserId) : undefined,
  }))

  await writeAll(
    db,
    APPOINTMENTS,
    appointments.map((item) => [
      item.id,
      {
        clientName: item.clientName,
        clientUserId: item.clientUserId ?? null,
        serviceId: item.serviceId,
        title: item.title ?? null,
        professionalId: item.professionalId,
        dateISO: item.dateISO,
        startMin: item.startMin,
        durationMin: item.durationMin,
        status: item.status,
        payment: item.payment,
        paymentMethod: item.paymentMethod ?? null,
        origin: item.origin,
        note: item.note ?? null,
        seeded: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    ]),
  )

  const days = agendaDocsFrom(appointments)
  await writeAll(
    db,
    AGENDA,
    days.map((day) => [
      day.docId,
      {
        professionalId: day.professionalId,
        dateISO: day.dateISO,
        blocks: day.blocks,
        updatedAt: FieldValue.serverTimestamp(),
      },
    ]),
  )

  log(`• agendamentos gravados: ${appointments.length}`)
  log(`• documentos de agenda derivados: ${days.length}`)

  // Confere o que as regras vão consultar: o papel de gestão fica no documento `users`
  // criado aqui — se ele faltar, `isAdmin()` nega tudo no painel.
  const storedUsers = await db.collection(USERS).get()
  const admins = storedUsers.docs.filter((document) => document.data().role === 'admin')
  if (storedUsers.size !== seed.users.length || admins.length !== 1) {
    fail(
      `esperava ${seed.users.length} contas e 1 gestão em "${USERS}", encontrei ${storedUsers.size} conta(s) e ${admins.length} gestão(ões).`,
    )
  }
  const storedAppointments = await db.collection(APPOINTMENTS).get()
  if (storedAppointments.size !== appointments.length) {
    fail(
      `esperava ${appointments.length} agendamentos, encontrei ${storedAppointments.size}.`,
    )
  }

  const problems = await verifyAgenda(db, days)
  if (problems.length > 0) {
    console.error(problems.map((problem) => `  ✖ ${problem}`).join('\n'))
    fail(`a verificação falhou em ${problems.length} bloco(s).`)
  }
  log('✓ a agenda gravada confere com os agendamentos.')
}

async function backfillAgenda(db: Firestore): Promise<void> {
  const appointments = await readAppointments(db)
  if (appointments.length === 0) {
    log('Nenhum agendamento encontrado: não há documento de agenda para reconstruir.')
    return
  }

  const days = agendaDocsFrom(appointments)
  let created = 0
  let updated = 0
  let untouched = 0
  let keptBlocks = 0

  for (const day of days) {
    const reference = db.collection(AGENDA).doc(day.docId)
    const snapshot = await reference.get()
    const existing = snapshot.exists ? blocksOf(snapshot.data()) : []
    const merged = mergeBlocks(existing, day.blocks)
    keptBlocks += merged.length - day.blocks.length

    if (snapshot.exists && blocksKey(existing) === blocksKey(merged)) {
      untouched += 1
      continue
    }

    await reference.set({
      professionalId: day.professionalId,
      dateISO: day.dateISO,
      blocks: merged,
      updatedAt: FieldValue.serverTimestamp(),
    })
    if (snapshot.exists) updated += 1
    else created += 1
  }

  log(`• agendamentos lidos: ${appointments.length}`)
  log(`• documentos de agenda: ${days.length} (${created} criados, ${updated} corrigidos, ${untouched} já corretos)`)
  if (keptBlocks > 0) {
    log(`• blocos mantidos de atendimentos fora da leitura: ${keptBlocks}`)
  }

  const problems = await verifyAgenda(db, days)
  if (problems.length > 0) {
    console.error(problems.map((problem) => `  ✖ ${problem}`).join('\n'))
    fail(`o backfill deixou ${problems.length} bloco(s) divergente(s).`)
  }
  log('✓ todos os agendamentos têm bloco no documento do dia.')
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const demo = args.includes('--demo')
  const backfill = args.includes('--backfill')
  const force = args.includes('--force')

  if (demo && backfill) fail('Escolha um modo: --demo ou --backfill.')

  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST
  const emulator = Boolean(emulatorHost)
  const projectId =
    process.env.GCLOUD_PROJECT ??
    process.env.GOOGLE_CLOUD_PROJECT ??
    process.env.FIREBASE_PROJECT_ID

  if (!projectId) {
    fail(
      'Projeto não definido. Use o emulador (npm run seed:demo) ou exporte GCLOUD_PROJECT para o projeto Firebase.',
    )
  }
  if (demo && !emulator && !force) {
    fail(
      'O modo --demo apaga contas e atendimentos. Fora do emulador ele exige --force, para não destruir dados reais.',
    )
  }

  // No emulador não existe credencial de serviço: o Firestore do Admin SDK resolve pelo
  // host do emulador. O aviso "MetadataLookupWarning" na saída é a busca inofensiva por
  // credenciais do GCE, que não existem fora do Google Cloud.
  initializeApp({
    projectId,
    ...(emulator ? {} : { credential: applicationDefault() }),
  })
  const db = getFirestore()

  log(`\nElegance Studio — ${demo ? 'seed de demonstração' : 'backfill da agenda'}`)
  log(`projeto: ${projectId} | emulador: ${emulatorHost ?? 'não (projeto real)'}`)
  log('')

  if (demo) await seedDemo(db)
  else await backfillAgenda(db)

  log('')
}

main().catch((error: unknown) => {
  console.error('\n✖ Falha ao executar o script:', error)
  process.exit(1)
})
