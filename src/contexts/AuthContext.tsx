import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../integrations/supabase/client'

export type InvestorTier = 'standard' | 'vc' | 'lead'

interface InvestorProfile {
  tier: InvestorTier
  accreditation_status: 'pending' | 'verified' | 'expired'
  kyc_status: 'pending' | 'approved' | 'rejected'
  capital_contributed: number
  investor_tier?: InvestorTier
  name?: string
}

interface AuthContextType {
  user: any
  investorProfile: InvestorProfile | null
  isLoading: boolean
  isInvestor: boolean
  isVC: boolean
  validateVCCode: (code: string) => Promise<boolean>
  unlockVCReturns: () => void
  lockVCReturns: () => void
  hasVCAccess: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [investorProfile, _setInvestorProfile] = useState<InvestorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasVCAccess, setHasVCAccess] = useState(false)

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const validateVCCode = async (code: string): Promise<boolean> => {
    // Check against hardcoded VC code
    if (code === import.meta.env.VITE_VC_CODE) {
      setHasVCAccess(true)
      return true
    }

    // Check against database
    const { data, error } = await supabase
      .from('investor_access_sessions')
      .select('vc_code')
      .eq('vc_code', code)
      .eq('is_active', true)
      .single()

    if (!error && data) {
      setHasVCAccess(true)
      return true
    }

    return false
  }

  const unlockVCReturns = () => setHasVCAccess(true)
  const lockVCReturns = () => setHasVCAccess(false)

  const isInvestor = !!investorProfile
  const isVC = investorProfile?.tier === 'vc' || investorProfile?.tier === 'lead'

  return (
    <AuthContext.Provider value={{
      user,
      investorProfile,
      isLoading,
      isInvestor,
      isVC,
      validateVCCode,
      unlockVCReturns,
      lockVCReturns,
      hasVCAccess,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
