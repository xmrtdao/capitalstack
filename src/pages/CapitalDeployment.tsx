import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  DollarSign, 
  TrendingUp, 
  Building, 
  FileText, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  ArrowRight,
  PieChart
} from 'lucide-react'

interface CapitalDeployment {
  tranche_id: string
  name: string
  total_amount: number
  deployed_amount: number
  remaining_amount: number
  deployment_pct: number
  status: 'active' | 'deploying' | 'complete' | 'paused'
  last_updated: string
  deployments: Deployment[]
}

interface Deployment {
  id: string
  property_address: string
  amount: number
  date: string
  status: 'completed' | 'pending' | 'in_review'
  type: 'drawdown' | 'disbursement' | 'reserve'
}

interface FinancingProgram {
  id: string
  name: string
  category: 'Federal Loan' | 'State Loan' | 'Federal Tax' | 'State Tax' | 'Federal Grant' | 'State Grant' | 'State Program'
  max_amount: number
  deployed: number
  pipeline: number
  status: 'active' | 'pipeline' | 'exhausted'
  icon: string
}

const MOCK_CAPITAL_DEPLOYMENT: CapitalDeployment[] = [
  {
    tranche_id: 'cpace',
    name: 'C-PACE Retrofit',
    total_amount: 25500000,
    deployed_amount: 18360000,
    remaining_amount: 7140000,
    deployment_pct: 72,
    status: 'deploying',
    last_updated: '2026-06-24T15:30:00Z',
    deployments: [
      { id: 'd1', property_address: '123 Main St, Stamford CT', amount: 2500000, date: '2026-06-15', status: 'completed', type: 'drawdown' },
      { id: 'd2', property_address: '456 Broad St, Bridgeport CT', amount: 1800000, date: '2026-06-10', status: 'completed', type: 'drawdown' },
      { id: 'd3', property_address: '789 State St, New Haven CT', amount: 3200000, date: '2026-05-28', status: 'completed', type: 'drawdown' },
      { id: 'd4', property_address: '321 Park Ave, Hartford CT', amount: 1500000, date: '2026-06-20', status: 'in_review', type: 'drawdown' },
    ],
  },
  {
    tranche_id: 'sba_priv',
    name: 'SBA 504 Private',
    total_amount: 2750000,
    deployed_amount: 1925000,
    remaining_amount: 825000,
    deployment_pct: 70,
    status: 'deploying',
    last_updated: '2026-06-23T10:00:00Z',
    deployments: [
      { id: 'd5', property_address: '555 Commerce Dr, Norwalk CT', amount: 950000, date: '2026-06-01', status: 'completed', type: 'disbursement' },
      { id: 'd6', property_address: '777 Industrial Way, Danbury CT', amount: 975000, date: '2026-05-15', status: 'completed', type: 'disbursement' },
    ],
  },
  {
    tranche_id: 'sba_cdc',
    name: 'SBA 504 CDC',
    total_amount: 2200000,
    deployed_amount: 1540000,
    remaining_amount: 660000,
    deployment_pct: 70,
    status: 'deploying',
    last_updated: '2026-06-23T10:00:00Z',
    deployments: [
      { id: 'd7', property_address: '555 Commerce Dr, Norwalk CT', amount: 760000, date: '2026-06-01', status: 'completed', type: 'disbursement' },
      { id: 'd8', property_address: '777 Industrial Way, Danbury CT', amount: 780000, date: '2026-05-15', status: 'completed', type: 'disbursement' },
    ],
  },
  {
    tranche_id: 'dao_reit',
    name: 'DAO-REIT Equity',
    total_amount: 550000,
    deployed_amount: 165000,
    remaining_amount: 385000,
    deployment_pct: 30,
    status: 'active',
    last_updated: '2026-06-25T09:00:00Z',
    deployments: [
      { id: 'd9', property_address: 'Treasury Reserve', amount: 165000, date: '2026-06-20', status: 'completed', type: 'reserve' },
    ],
  },
]

const FINANCING_PROGRAMS: FinancingProgram[] = [
  { id: 'fp1', name: 'C-PACE CT', category: 'State Loan', max_amount: 25500000, deployed: 18360000, pipeline: 5100000, status: 'active', icon: '🏦' },
  { id: 'fp2', name: 'SBA 504 First Lien', category: 'Federal Loan', max_amount: 2750000, deployed: 1925000, pipeline: 550000, status: 'active', icon: '🏛️' },
  { id: 'fp3', name: 'SBA 504 CDC', category: 'Federal Loan', max_amount: 2200000, deployed: 1540000, pipeline: 440000, status: 'active', icon: '🏛️' },
  { id: 'fp4', name: 'Historic Tax Credit', category: 'Federal Tax', max_amount: 3000000, deployed: 0, pipeline: 3000000, status: 'pipeline', icon: '📋' },
  { id: 'fp5', name: 'New Markets Tax Credit', category: 'Federal Tax', max_amount: 2500000, deployed: 0, pipeline: 2500000, status: 'pipeline', icon: '📋' },
  { id: 'fp6', name: 'Opportunity Zone', category: 'Federal Tax', max_amount: 5000000, deployed: 0, pipeline: 5000000, status: 'pipeline', icon: '📋' },
  { id: 'fp7', name: 'CT DECD Grant', category: 'State Grant', max_amount: 500000, deployed: 0, pipeline: 500000, status: 'pipeline', icon: '🎁' },
  { id: 'fp8', name: 'EDA Public Works', category: 'Federal Grant', max_amount: 1500000, deployed: 0, pipeline: 1500000, status: 'pipeline', icon: '🎁' },
]

const STATUS_COLORS: Record<string, string> = {
  active: '#44ffaa',
  deploying: '#ffbb33',
  complete: '#00ffcc',
  paused: '#ff8800',
  pipeline: '#aa88ff',
  exhausted: '#666666',
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(2)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount}`
}

export default function CapitalDeploymentDashboard() {
  const [deployments, setDeployments] = useState<CapitalDeployment[]>([])
  const [programs, setPrograms] = useState<FinancingProgram[]>([])
  const [selectedTranche, setSelectedTranche] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDeployments(MOCK_CAPITAL_DEPLOYMENT)
      setPrograms(FINANCING_PROGRAMS)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const totalDeployed = deployments.reduce((sum, t) => sum + t.deployed_amount, 0)
  const totalRemaining = deployments.reduce((sum, t) => sum + t.remaining_amount, 0)
  const totalCapital = totalDeployed + totalRemaining

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading capital deployment...</p>
        </div>
      </div>
    )
  }

  return (
    <section id="capital-deployment" className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Capital Deployment Dashboard</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Real-time tracking of capital deployment across all tranches and financing programs.
          Monitor drawdowns, disbursements, and pipeline status.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Capital</CardDescription>
            <CardTitle className="text-3xl">{formatCurrency(totalCapital)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Deployed</CardDescription>
            <CardTitle className="text-3xl text-green-500">{formatCurrency(totalDeployed)}</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={(totalDeployed / totalCapital) * 100} className="h-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Remaining</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">{formatCurrency(totalRemaining)}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active Programs</CardDescription>
            <CardTitle className="text-3xl">
              {programs.filter(p => p.status === 'active').length} / {programs.length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tranche Deployment */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <PieChart className="w-5 h-5" />
          Tranche Deployment Status
        </h3>
        {deployments.map((tranche) => (
          <Card key={tranche.tranche_id} className="cursor-pointer" onClick={() => setSelectedTranche(selectedTranche === tranche.tranche_id ? null : tranche.tranche_id)}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ background: STATUS_COLORS[tranche.status] }}
                  />
                  <div>
                    <CardTitle className="text-lg">{tranche.name}</CardTitle>
                    <CardDescription>
                      {formatCurrency(tranche.deployed_amount)} of {formatCurrency(tranche.total_amount)} deployed
                    </CardDescription>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">{tranche.deployment_pct}%</div>
                  <Badge variant="outline" style={{ borderColor: STATUS_COLORS[tranche.status], color: STATUS_COLORS[tranche.status] }}>
                    {tranche.status.toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={tranche.deployment_pct} className="h-3 mb-4" />
              
              {selectedTranche === tranche.tranche_id && (
                <div className="space-y-3 mt-4 pt-4 border-t">
                  <h4 className="font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Recent Deployments
                  </h4>
                  <div className="space-y-2">
                    {tranche.deployments.map((dep) => (
                      <div
                        key={dep.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {dep.status === 'completed' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : dep.status === 'in_review' ? (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-orange-500" />
                          )}
                          <div>
                            <div className="text-sm font-medium">{dep.property_address}</div>
                            <div className="text-xs text-muted-foreground">
                              {dep.type} • {new Date(dep.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{formatCurrency(dep.amount)}</div>
                          <div className="text-xs text-muted-foreground capitalize">{dep.status.replace('_', ' ')}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financing Programs Pipeline */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Building className="w-5 h-5" />
          Financing Programs Pipeline
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {programs.map((program) => (
            <Card key={program.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{program.icon}</div>
                    <div>
                      <div className="font-semibold">{program.name}</div>
                      <div className="text-xs text-muted-foreground">{program.category}</div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    style={{ borderColor: STATUS_COLORS[program.status], color: STATUS_COLORS[program.status] }}
                  >
                    {program.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deployed</span>
                    <span className="font-medium">{formatCurrency(program.deployed)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Pipeline</span>
                    <span className="font-medium">{formatCurrency(program.pipeline)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Max</span>
                    <span className="font-medium">{formatCurrency(program.max_amount)}</span>
                  </div>
                  <Progress
                    value={(program.deployed / program.max_amount) * 100}
                    className="h-2 mt-2"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage capital deployment and financing programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <TrendingUp className="w-4 h-4 mr-2" />
              Record Drawdown
            </Button>
            <Button variant="outline">
              <ArrowRight className="w-4 h-4 mr-2" />
              Initiate Disbursement
            </Button>
            <Button variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Add to Pipeline
            </Button>
            <Button variant="outline">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Close Program
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
