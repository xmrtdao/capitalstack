import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PieChart, DollarSign } from 'lucide-react'

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

const MOCK_CAPITAL_STACK: CapitalStackLayer[] = [
  {
    layer_key: 'cpace',
    name: 'C-PACE Retrofit',
    sub_label: 'Senior Debt',
    amount_m: 25.5,
    pct_of_total: 75,
    color: '#00ffcc',
    seniority: 0.88,
    yield_score: 0.72,
    coverage: 0.92,
    description: 'Commercial Property Assessed Clean Energy',
    details: 'Non-recourse senior financing for energy-efficient retrofits. 30-year term, fixed rate.',
    is_open: false,
  },
  {
    layer_key: 'sba_priv',
    name: 'SBA 504 Private',
    sub_label: 'First Lien',
    amount_m: 2.75,
    pct_of_total: 8,
    color: '#ffaa00',
    seniority: 0.70,
    yield_score: 0.60,
    coverage: 0.75,
    description: 'Private lender portion of SBA 504 loan',
    details: '50% of total SBA 504 financing. 25-year amortization.',
    is_open: false,
  },
  {
    layer_key: 'sba_cdc',
    name: 'SBA 504 CDC',
    sub_label: 'Second Lien (Gov)',
    amount_m: 2.2,
    pct_of_total: 6.5,
    color: '#ff8800',
    seniority: 0.60,
    yield_score: 0.68,
    coverage: 0.65,
    description: 'CDC/government portion of SBA 504',
    details: '40% of total SBA 504. Below-market fixed rate.',
    is_open: false,
  },
  {
    layer_key: 'dao_reit',
    name: 'DAO-REIT Equity',
    sub_label: 'Tokenized Equity',
    amount_m: 0.55,
    pct_of_total: 1.6,
    color: '#ff3399',
    seniority: 0.28,
    yield_score: 0.95,
    coverage: 0.30,
    description: 'Decentralized real estate investment trust',
    details: 'Open to accredited investors. Min $25K. On-chain distributions.',
    is_open: true,
  },
  {
    layer_key: 'founder',
    name: 'Founder Equity',
    sub_label: 'Sponsor Capital',
    amount_m: 0.055,
    pct_of_total: 0.18,
    color: '#aa88ff',
    seniority: 0.18,
    yield_score: 1.00,
    coverage: 0.20,
    description: 'Founder skin in the game',
    details: '$55K at risk. Delaware Series LLC. No personal guarantee.',
    is_open: false,
  },
]

const FINANCING_PROGRAMS = [
  { category: 'Federal Loans', count: 3, icon: '🏦' },
  { category: 'State Loans', count: 4, icon: '🏛️' },
  { category: 'Federal Tax', count: 3, icon: '📋' },
  { category: 'State Tax', count: 4, icon: '💰' },
  { category: 'Federal Grants', count: 4, icon: '🎁' },
  { category: 'State Programs', count: 1, icon: '⭐' },
]

export default function CapitalStackSection() {
  const [layers, setLayers] = useState<CapitalStackLayer[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLayers(MOCK_CAPITAL_STACK)
      setIsLoading(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [])

  const totalDeployed = layers.reduce((sum, layer) => sum + layer.amount_m, 0)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading capital stack...</p>
        </div>
      </div>
    )
  }

  return (
    <section id="capital-stack" className="container mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <PieChart className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Capital Stack</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Non-recourse debt structure with C-PACE retrofit financing.
          Minimal founder capital at risk. Property transfers encumbered debt.
          DAO-REIT equity tranche now open.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Capital</CardDescription>
            <CardTitle className="text-3xl">${totalDeployed.toFixed(1)}M</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Debt Tranches</CardDescription>
            <CardTitle className="text-3xl">
              {layers.filter(l => l.name.includes('C-PACE') || l.name.includes('SBA')).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Equity Open</CardDescription>
            <CardTitle className="text-3xl">
              {layers.filter(l => l.is_open).length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Seniority</CardDescription>
            <CardTitle className="text-3xl">
              {(layers.reduce((sum, l) => sum + l.seniority, 0) / layers.length).toFixed(2)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Stack Visualization */}
      <div className="space-y-2">
        {layers.map((layer) => (
          <div
            key={layer.layer_key}
            className="relative cursor-pointer transition-all duration-300 overflow-hidden"
            style={{
              height: `${Math.max(60, layer.pct_of_total * 4)}px`,
            }}
            onClick={() => setSelectedLayer(selectedLayer === layer.layer_key ? null : layer.layer_key)}
          >
            <div
              className="absolute inset-0 border transition-all hover:scale-[1.01]"
              style={{
                background: `${layer.color}15`,
                borderColor: selectedLayer === layer.layer_key ? layer.color : `${layer.color}40`,
              }}
            />
            <div className="relative p-4 flex items-center justify-between h-full">
              <div className="flex items-center gap-4">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: layer.color,
                    boxShadow: `0 0 8px ${layer.color}60`,
                  }}
                />
                <div>
                  <h3 className="font-semibold text-lg" style={{ color: layer.color }}>
                    {layer.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{layer.sub_label}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: layer.color }}>
                  ${layer.amount_m >= 1 ? layer.amount_m : Math.round(layer.amount_m * 1000)}{layer.amount_m >= 1 ? 'M' : 'K'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {layer.pct_of_total}% of total
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedLayer === layer.layer_key && (
              <div
                className="p-4 border-t animate-in slide-in-from-top-2"
                style={{ borderColor: `${layer.color}30` }}
              >
                <div className="grid md:grid-cols-3 gap-4 mt-2">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Seniority</div>
                    <div className="font-mono text-lg">{layer.seniority.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Yield Score</div>
                    <div className="font-mono text-lg">{layer.yield_score.toFixed(3)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Coverage</div>
                    <div className="font-mono text-lg">{layer.coverage.toFixed(3)}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">{layer.details}</p>
                {layer.is_open && (
                  <Badge className="mt-3 bg-green-500/20 text-green-400">
                    Open for Investment
                  </Badge>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Financing Programs Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Available Financing Programs
          </CardTitle>
          <CardDescription>
            17 federal and state programs available for deployment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {FINANCING_PROGRAMS.map((cat) => (
              <div
                key={cat.category}
                className="p-4 border rounded-lg flex items-center gap-3"
              >
                <div className="text-2xl">{cat.icon}</div>
                <div>
                  <div className="text-sm font-medium">{cat.category}</div>
                  <div className="text-2xl font-bold">{cat.count}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
