import { useState } from 'react'
import Sidebar from './components/Sidebar'
import Header  from './components/Header'
import Overview         from './pages/Overview'
import GestantesListagem from './pages/GestantesListagem'
import AltoRiscoListagem from './pages/AltoRiscoListagem'
import Hipertensao           from './pages/Hipertensao'
import HipertensaoListagem   from './pages/HipertensaoListagem'
import Sifilis          from './pages/Sifilis'
import SifilisListagem  from './pages/SifilisListagem'
import Instrutivo       from './pages/Instrutivo'

export const PAGES = [
  { id: 'overview',    label: 'Vis\u00e3o Geral', icon: 'LayoutDashboard' },
  { id: 'alto-risco',  label: 'Alto Risco',       icon: 'AlertTriangle'   },
  { id: 'hipertensao', label: 'Hipertens\u00e3o', icon: 'HeartPulse'      },
  { id: 'sifilis',     label: 'S\u00edfilis',     icon: 'FlaskConical'    },
  { id: 'instrutivo',  label: 'Instrutivo',       icon: 'BookOpen'        },
]

function PageContent({ active, setActive }) {
  switch (active) {
    case 'overview':               return <Overview onListagem={() => setActive('gestantes-listagem')} />
    case 'gestantes-listagem':      return <GestantesListagem onBack={() => setActive('overview')} />
    case 'alto-risco':          return <AltoRiscoListagem />
    case 'hipertensao':          return <Hipertensao onListagem={() => setActive('hipertensao-listagem')} />
    case 'hipertensao-listagem': return <HipertensaoListagem onBack={() => setActive('hipertensao')} />
    case 'sifilis':           return <Sifilis onListagem={() => setActive('sifilis-listagem')} />
    case 'sifilis-listagem':  return <SifilisListagem onBack={() => setActive('sifilis')} />
    case 'instrutivo':        return <Instrutivo />
    default:                  return <Overview />
  }
}

export default function App() {
  const [active, setActive] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar active={active} setActive={setActive} pages={PAGES} open={sidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          active={active}
          pages={PAGES}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(s => !s)}
        />
        <main className="flex-1 overflow-y-auto p-6">
          <PageContent active={active} setActive={setActive} />
        </main>
      </div>
    </div>
  )
}
