import { useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ClientShell } from './components/ClientShell'
import { ForgotPassword } from './routes/ForgotPassword'
import { Home } from './routes/Home'
import { Login } from './routes/Login'
import { MyAppointments } from './routes/MyAppointments'
import { NotFound } from './routes/NotFound'
import { Services } from './routes/Services'
import { SignUp } from './routes/SignUp'
import { AdminAgenda } from './routes/admin/AdminAgenda'
import { BookingConfirmed } from './routes/booking/BookingConfirmed'
import { BookingLayout } from './routes/booking/BookingLayout'
import { StepDateTime } from './routes/booking/StepDateTime'
import { StepExpert } from './routes/booking/StepExpert'
import { StepReview } from './routes/booking/StepReview'
import { StepService } from './routes/booking/StepService'
import { AppStateProvider } from './state/AppState'
import { BookingProvider } from './state/BookingContext'

/** Sobe a página ao trocar de rota (o protótipo é navegado como um app). */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])
  return null
}

export function App() {
  return (
    <AppStateProvider>
      <BookingProvider>
        <ScrollToTop />
        <Routes>
          {/* Área do cliente e da gestão, com barra de navegação inferior */}
          <Route element={<ClientShell />}>
            <Route path="/" element={<Home />} />
            <Route path="/servicos" element={<Services />} />
            <Route path="/meus-agendamentos" element={<MyAppointments />} />
            <Route path="/painel" element={<AdminAgenda />} />
            <Route path="/agendar" element={<BookingLayout />}>
              <Route index element={<Navigate to="servico" replace />} />
              <Route path="servico" element={<StepService />} />
              <Route path="expert" element={<StepExpert />} />
              <Route path="horario" element={<StepDateTime />} />
              <Route path="revisao" element={<StepReview />} />
              <Route path="confirmado" element={<BookingConfirmed />} />
            </Route>
          </Route>

          {/* Telas de acesso, sem barra inferior */}
          <Route path="/entrar" element={<Login />} />
          <Route path="/criar-conta" element={<SignUp />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BookingProvider>
    </AppStateProvider>
  )
}

export default App
