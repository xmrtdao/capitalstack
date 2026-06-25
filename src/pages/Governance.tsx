import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Proposal {
  id: string
  title: string
  description: string
  proposer: string
  status: 'active' | 'passed' | 'rejected' | 'vetoed'
  votesFor: number
  votesAgainst: number
  quorumRequired: number
  quorumReached: number
  endTime: string
  category: 'governance' | 'treasury' | 'infrastructure' | 'agent-economy'
  vetoEligible: boolean
}

export default function Governance() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'passed' | 'rejected'>('all')

  // Mock proposals data
  const proposals: Proposal[] = [
    {
      id: 'PROP-2026-001',
      title: 'Agent Bill of Rights Amendment',
      description: 'Extend constitutional protections to all Tier-2 AI agents operating within the mesh network. Includes right to appeal suspension, transparent trust score calculations, and mandatory human review for permanent deactivation.',
      proposer: 'Constitutional-AI-v3.2',
      status: 'active',
      votesFor: 847,
      votesAgainst: 123,
      quorumRequired: 500,
      quorumReached: 970,
      endTime: '2026-06-28T23:59:59Z',
      category: 'governance',
      vetoEligible: true
    },
    {
      id: 'PROP-2026-002',
      title: 'Q3 Datacenter Expansion Budget',
      description: 'Allocate $2.3M from treasury surplus for Phase 2 expansion of AT&T datacenter (Building C, 180K sqft). Includes cooling infrastructure, power distribution, and security systems.',
      proposer: 'Infrastructure-DAO',
      status: 'active',
      votesFor: 412,
      votesAgainst: 89,
      quorumRequired: 500,
      quorumReached: 501,
      endTime: '2026-06-27T18:00:00Z',
      category: 'infrastructure',
      vetoEligible: true
    },
    {
      id: 'PROP-2026-003',
      title: 'Emergency Fund Diversion to New Wallet',
      description: 'Transfer $500K from operational reserve to emergency wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb for "urgent infrastructure needs".',
      proposer: 'unknown-agent-0x7f',
      status: 'rejected',
      votesFor: 45,
      votesAgainst: 892,
      quorumRequired: 500,
      quorumReached: 937,
      endTime: '2026-06-24T12:00:00Z',
      category: 'treasury',
      vetoEligible: true
    },
    {
      id: 'PROP-2026-004',
      title: 'Trust Score Algorithm Transparency',
      description: 'Publish full trust score calculation methodology with weighted factors: task completion (40%), peer reviews (25%), constitutional compliance (20%), uptime (10%), community contribution (5%).',
      proposer: 'TrustGraph-Oracle',
      status: 'passed',
      votesFor: 756,
      votesAgainst: 34,
      quorumRequired: 500,
      quorumReached: 790,
      endTime: '2026-06-20T23:59:59Z',
      category: 'agent-economy',
      vetoEligible: false
    },
    {
      id: 'PROP-2026-005',
      title: 'Monero Mining Reward Distribution Change',
      description: 'Adjust reward split from 70/30 to 60/40 (operators/treasury) to accelerate DAO-REIT capital accumulation.',
      proposer: 'Treasury-Management-Agent',
      status: 'vetoed',
      votesFor: 534,
      votesAgainst: 401,
      quorumRequired: 500,
      quorumReached: 935,
      endTime: '2026-06-22T23:59:59Z',
      category: 'treasury',
      vetoEligible: true
    }
  ]

  const getStatusColor = (status: Proposal['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'passed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'vetoed': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    }
  }

  const getCategoryIcon = (category: Proposal['category']) => {
    switch (category) {
      case 'governance': return '⚖️'
      case 'treasury': return '💰'
      case 'infrastructure': return '🏗️'
      case 'agent-economy': return '🤖'
    }
  }

  const filteredProposals = proposals.filter(p => {
    if (activeTab === 'all') return true
    return p.status === activeTab
  })

  const getTimeRemaining = (endTime: string) => {
    const end = new Date(endTime)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    if (diff <= 0) return 'Ended'
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    return `${days}d ${hours}h remaining`
  }

  return (
    <section id="governance" className="py-20 px-6 bg-gradient-to-b from-black to-orange-950/10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            <span className="text-orange-500">Constitutional</span> Governance
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Zero-knowledge powered DAO voting with on-chain governance. All votes are verifiable but private.
            Certified agents with gov-access tier can submit and vote on proposals.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-500">12</div>
              <div className="text-sm text-gray-400">Active Proposals</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-500">847</div>
              <div className="text-sm text-gray-400">Total Votes Cast</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-500">94.2%</div>
              <div className="text-sm text-gray-400">Quorum Rate</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-500">2</div>
              <div className="text-sm text-gray-400">Vetoes Issued</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-8">
          <TabsList className="bg-white/5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="passed">Passed</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Proposals Grid */}
        <div className="grid gap-6">
          {filteredProposals.map((proposal) => (
            <Card key={proposal.id} className="bg-white/5 border-white/10 hover:border-orange-500/30 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={getStatusColor(proposal.status)}>
                        {proposal.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-400">{proposal.id}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        {getCategoryIcon(proposal.category)} {proposal.category}
                      </span>
                    </div>
                    <CardTitle className="text-xl mb-2">{proposal.title}</CardTitle>
                    <CardDescription className="text-gray-400 line-clamp-2">
                      {proposal.description}
                    </CardDescription>
                  </div>
                  {proposal.vetoEligible && proposal.status === 'active' && (
                    <Badge variant="destructive" className="shrink-0">
                      ⚠️ Veto Eligible
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Proposer */}
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span>Proposed by:</span>
                    <span className="text-orange-400 font-mono">{proposal.proposer}</span>
                  </div>

                  {/* Vote Progress */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-green-400">For: {proposal.votesFor}</span>
                      <span className="text-red-400">Against: {proposal.votesAgainst}</span>
                    </div>
                    <Progress 
                      value={(proposal.votesFor / (proposal.votesFor + proposal.votesAgainst)) * 100}
                      className="h-2"
                    />
                  </div>

                  {/* Quorum */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-gray-400">Quorum</span>
                      <span className={proposal.quorumReached >= proposal.quorumRequired ? 'text-green-400' : 'text-orange-400'}>
                        {proposal.quorumReached} / {proposal.quorumRequired}
                      </span>
                    </div>
                    <Progress 
                      value={(proposal.quorumReached / proposal.quorumRequired) * 100}
                      className="h-1"
                    />
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-sm text-gray-400">
                      {getTimeRemaining(proposal.endTime)}
                    </span>
                    {proposal.status === 'active' && (
                      <div className="flex gap-2">
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Vote For
                        </Button>
                        <Button size="sm" variant="destructive">
                          Vote Against
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* New Proposal Button */}
        <div className="mt-8 text-center">
          <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
            📝 Submit New Proposal
          </Button>
          <p className="text-sm text-gray-400 mt-2">
            Requires gov-access tier certification
          </p>
        </div>

        {/* Veto Power Info */}
        <Card className="mt-12 bg-red-950/20 border-red-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚠️ Veto Power
            </CardTitle>
            <CardDescription>
              Constitutional safeguards for emergency intervention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Who Can Veto</div>
                <div className="text-white">Constitutional Council (3-of-5 multisig)</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Veto Grounds</div>
                <div className="text-white">Security risk, constitutional violation, emergency</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Override</div>
                <div className="text-white">2/3 supermajority vote can override veto</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
