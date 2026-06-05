import { useEffect } from 'react'
import { useAppData } from '../contexts/AppDataContext'
import { useAuth } from '../contexts/AuthContext'
import { normalizeCompanyProfile, type CompanyProfile } from '../lib/pdf'

/**
 * Retorna o perfil institucional da empresa, sempre atualizado.
 * Prioriza o registro fresco em `configuracoes` (company-profile) e usa o
 * bootstrap de autenticação como fallback enquanto a coleção carrega.
 */
export function useCompanyProfile(): CompanyProfile {
  const { bootstrap } = useAuth()
  const { collections, ensureCollection } = useAppData()

  useEffect(() => {
    void ensureCollection('configuracoes')
  }, [ensureCollection])

  const fromCollection = (collections.configuracoes ?? []).find((item) => item.id === 'company-profile')?.valor as
    | Record<string, unknown>
    | undefined

  return normalizeCompanyProfile(fromCollection ?? bootstrap.companyProfile)
}
