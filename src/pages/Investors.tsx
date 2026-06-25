'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Lock, Unlock, TrendingUp, DollarSign, PieChart, Shield } from 'lucide-react'

interface CapitalStackLayer {
  layer_key: string
  name: string
  sub_label: string
  amount_m: number
  pct_of_total: number
  color: string
  seniority: number
  yield_score: number
  coverage: number
  description: string
  details: string
  is_open: boolean
}

interface FinancingProgram {
  program_key: string
  name: string
  category: string
  administering_entity: string
  headline: string
  amount_range: string | null
  rate_or_credit: string | null
  is_active: boolean
}

interface DistributionRecord {
  id: string
  period_start: string
  period_end: string
  pro_rata_share: number
  distribution_usd: number | null
  status: string
}

export default function InvestorsPage() {
  const { investorProfile, isVC, validateVCCode, unlockVCReturns, lockVCReturns } = useAuth()
  const { toast } = useToast()
  
  const [vcCode, setVcCode] = useState('')
  const [vcAccessGranted, setVcAccessGranted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [capitalStack, setCapitalStack] = useState<CapitalStackLayer[]>([])
  const [financingPrograms, setFinancingPrograms] = useState<FinancingProgram[]>([])
  const [distributions, setDistributions] = useState<DistributionRecord[]>([])
  const [totalDeployed, setTotalDeployed] = useState(0)

  useEffect(() => {
    // Check for existing VC access in session
    const hasAccess = sessionStorage.getItem('vc_access') === '1'
    if (hasAccess) {
      setVcAccessGranted(true)
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load capital stack
      const { data: stackData } = await supabase
        .from('capital_stack')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (stackData) {
        setCapitalStack(stackData as CapitalStackLayer[])
        const deployed = stackData.reduce((sum, layer) => sum + layer.amount_m, 0)
        setTotalDeployed(deployed)
      }

      // Load financing programs
      const { data: programsData } = await supabase
        .from('financing_programs')
        .select('*')
        .eq('is_active', true)
        .order('display_order')

      if (programsData) {
        setFinancingPrograms(programsData as FinancingProgram[])
      }

      // Load distributions if authenticated investor
      if (investorProfile) {
        const { data: distData } = await supabase
          .from('distribution_records')
          .select('*')
          .eq('investor_tier', investorProfile.tier)
          .order('period_end', { ascending: false })

        if (distData) {
          setDistributions(distData as DistributionRecord[])
        }
      }
    } catch (error) {
      console.error('Error loading investor data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVcUnlock = async (e: React.FormEvent) => {
    e.preventDefault()
    const valid = await validateVCCode(vcCode)
    
    if (valid) {
      await unlockVCReturns()
      setVcAccessGranted(true)
      toast({
        title: 'VC Access Granted',
        description: 'Welcome to the investor briefing room.',
      })
    } else {
      toast({
        title: 'Invalid Access Code',
        description: 'Please check your code and try again.',
        variant: 'destructive',
      })
      setVcCode('')
    }
  }

  const handleLock = async () => {
    await lockVCReturns()
    setVcAccessGranted(false)
    toast({
      title: 'VC Access Locked',
      description: 'Returns section is now hidden.',
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading investor portal...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investor Portal</h1>
          <p className="text-muted-foreground">
            Tributary AI Campus DAO-REIT — Capital Deployment & Returns
          </p>
        </div>
        {investorProfile && (
          <Badge variant={isVC ? 'default' : 'secondary'}>
            {(investorProfile.investor_tier || investorProfile.tier || 'STANDARD').toUpperCase()}
          </Badge>
        )}
      </div>

      {/* VC Access Banner */}
      {vcAccessGranted && (
        <div className="flex items-center justify-between p-4 border border-green-500/30 bg-green-500/10 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-400 font-mono">
              VC ACCESS GRANTED — CONFIDENTIAL
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLock}>
            <Lock className="w-4 h-4 mr-2" />
            Lock
          </Button>
        </div>
      )}

      <Tabs defaultValue="capital" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="capital">Capital Stack</TabsTrigger>
          <TabsTrigger value="financing">Financing Programs</TabsTrigger>
          <TabsTrigger value="returns" disabled={!vcAccessGranted}>
            Returns {vcAccessGranted && <Unlock className="w-3 h-3 ml-1" />}
          </TabsTrigger>
          <TabsTrigger value="distributions" disabled={!investorProfile}>
            My Distributions
          </TabsTrigger>
        </TabsList>

        {/* Capital Stack Tab */}
        <TabsContent value="capital" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="w-5 h-5" />
                Capital Stack — ${totalDeployed}M Total
              </CardTitle>
              <CardDescription>
                Financing structure for 420,460 sqft AI datacenter campus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {capitalStack.map((layer) => (
                  <div
                    key={layer.layer_key}
                    className="p-4 border rounded-lg"
                    style={{ borderLeft: `4px solid ${layer.color}` }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{layer.name}</h3>
                        <p className="text-sm text-muted-foreground">{layer.sub_label}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">${layer.amount_m}M</div>
                        <div className="text-sm text-muted-foreground">
                          {layer.pct_of_total}% of total
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{layer.description}</p>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Seniority:</span>
                        <span className="ml-2 font-mono">{layer.seniority.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Yield Score:</span>
                        <span className="ml-2 font-mono">{layer.yield_score.toFixed(3)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Coverage:</span>
                        <span className="ml-2 font-mono">{layer.coverage.toFixed(3)}</span>
                      </div>
                    </div>
                    {layer.is_open && (
                      <Badge className="mt-3" variant="default">
                        Open for Investment
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financing Programs Tab */}
        <TabsContent value="financing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Available Financing Programs
              </CardTitle>
              <CardDescription>
                {financingPrograms.length} federal and state programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Rate/Credit</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financingPrograms.map((program) => (
                    <TableRow key={program.program_key}>
                      <TableCell className="font-medium">
                        <div>{program.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {program.administering_entity}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{program.category}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">
                        {program.amount_range || 'TBD'}
                      </TableCell>
                      <TableCell className="font-mono">
                        {program.rate_or_credit || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {program.is_active ? (
                          <Badge variant="secondary" className="bg-green-500/20 text-green-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inactive</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returns Tab (VC-Gated) */}
        <TabsContent value="returns" className="space-y-4">
          {vcAccessGranted ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Return Projections — 2030 Scenarios
                  </CardTitle>
                  <CardDescription>
                    DAO-REIT equity only · Conservative to exponential upside
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    {/* Base Case */}
                    <div className="p-6 border rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-2">BASE CASE</div>
                      <div className="text-4xl font-bold mb-1">4.2×</div>
                      <div className="text-sm text-muted-foreground mb-4">Multiple on invested capital</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IRR</span>
                          <span className="font-mono">21.9%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Equity Value</span>
                          <span className="font-mono">$2.31M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Annual NOI</span>
                          <span className="font-mono">$185K</span>
                        </div>
                      </div>
                    </div>

                    {/* Target Case */}
                    <div className="p-6 border-2 border-primary rounded-lg bg-primary/5">
                      <div className="text-sm text-primary mb-2">TARGET CASE</div>
                      <div className="text-4xl font-bold mb-1 text-primary">7.3×</div>
                      <div className="text-sm text-muted-foreground mb-4">Multiple on invested capital</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IRR</span>
                          <span className="font-mono text-primary">34.2%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Equity Value</span>
                          <span className="font-mono text-primary">$4.02M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Annual NOI</span>
                          <span className="font-mono text-primary">$420K</span>
                        </div>
                      </div>
                    </div>

                    {/* Upside Case */}
                    <div className="p-6 border rounded-lg bg-muted/50">
                      <div className="text-sm text-muted-foreground mb-2">UPSIDE CASE</div>
                      <div className="text-4xl font-bold mb-1">12.8×</div>
                      <div className="text-sm text-muted-foreground mb-4">Multiple on invested capital</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">IRR</span>
                          <span className="font-mono">48.7%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Equity Value</span>
                          <span className="font-mono">$7.04M</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Annual NOI</span>
                          <span className="font-mono">$890K</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 border rounded-lg bg-muted/30">
                    <div className="grid grid-cols-4 gap-6 text-center">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Base Case IRR</div>
                        <div className="text-2xl font-bold">21.9%</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Target Multiple</div>
                        <div className="text-2xl font-bold">7.3×</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">All-In Basis</div>
                        <div className="text-2xl font-bold">$34M</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Target Exit</div>
                        <div className="text-2xl font-bold">2031</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      Forward-looking projections, not guarantees. DAO-REIT equity participation only.
                      Consult your legal counsel.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Legal Distinction */}
              <div className="grid md:grid-cols-2 gap-4">
                <Card className="border-green-500/30">
                  <CardHeader>
                    <CardTitle className="text-green-400 text-sm">DAO-REIT Returns — What This Is</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      These projections represent potential returns on{' '}
                      <strong className="text-foreground">direct equity participation in the Tributary AI Campus DAO-REIT</strong> — a Delaware Series LLC with tokenized real estate ownership. This is a property investment with capital appreciation and NOI distributions.
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-pink-500/30">
                  <CardHeader>
                    <CardTitle className="text-pink-400 text-sm">CAC Protocol — What This Is NOT</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      CAC (Constitutional Agent License) is a{' '}
                      <strong className="text-foreground">prepaid compute credential</strong> — not a security, equity interest, or investment contract. CAC does not carry these return projections. The 4.5% APY on CAC balance is a savings rate, not an investment return.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Lock className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">VC Briefing Materials</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Return projections are restricted to direct equity participants in Cuttlefish Labs.
                    Not for public distribution.
                  </p>
                  <form onSubmit={handleVcUnlock} className="max-w-sm mx-auto space-y-4">
                    <Input
                      type="password"
                      placeholder="ENTER ACCESS CODE"
                      value={vcCode}
                      onChange={(e) => setVcCode(e.target.value.toUpperCase())}
                      className="text-center font-mono tracking-widest"
                    />
                    <Button type="submit" className="w-full">
                      <Unlock className="w-4 h-4 mr-2" />
                      Access Returns
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-6">
                    Request access: nav@cuttlefishlabs.com
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Distributions Tab (Investor Only) */}
        <TabsContent value="distributions" className="space-y-4">
          {investorProfile ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  My Distributions
                </CardTitle>
                <CardDescription>
                  Pro-rata returns for {investorProfile.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {distributions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead>Pro-Rata Share</TableHead>
                        <TableHead>Distribution (USD)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {distributions.map((dist) => (
                        <TableRow key={dist.id}>
                          <TableCell>
                            {new Date(dist.period_start).toLocaleDateString()} - {new Date(dist.period_end).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-mono">
                            {(dist.pro_rata_share * 100).toFixed(4)}%
                          </TableCell>
                          <TableCell className="font-mono">
                            ${dist.distribution_usd?.toLocaleString() ?? 'TBD'}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={dist.status === 'paid' ? 'default' : 'secondary'}
                              className={dist.status === 'paid' ? 'bg-green-500/20 text-green-400' : ''}
                            >
                              {dist.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No distributions yet. Returns will appear here after capital deployment.
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">Investor Login Required</h3>
                  <p className="text-muted-foreground">
                    Sign in to view your distribution records.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
