import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/layout/MainLayout'
import { Dashboard } from '@/pages/Dashboard'
import { Projects } from '@/pages/Projects'
import { Tasks } from '@/pages/Tasks'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<Projects />} />
          {/* Tarefas de um projeto específico */}
          <Route path="projects/:projectId/tasks" element={<Tasks />} />
          {/* Todas as tarefas */}
          <Route path="tasks" element={<Tasks />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
