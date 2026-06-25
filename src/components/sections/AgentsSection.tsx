'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MessageSquare, Shield, Cpu, Terminal, Activity } from 'lucide-react'

interface Agent {
  id: string
  did: string
  name: string | null
  agent_type: 'constitutional' | 'developer' | 'financial'
  trust_score: number
  status: 'pending' | 'active' | 'suspended' | 'decommissioned'
  constitution_hash: string | null
  metadata: Record<string, unknown>
  created_at: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  constitutional: <Shield className="w-4 h-4" />,
  developer: <Terminal className="w-4 h-4" />,
  financial: <Activity className="w-4 h-4" />,
}

const TYPE_COLORS: Record<string, string> = {
  constitutional: '#00ffcc',
  developer: '#ffaa00',
  financial: '#aa88ff',
}

const STATUS_COLORS: Record<string, string> = {
  active: '#44ffaa',
  pending: '#ffbb33',
  suspended: '#ff8800',
  decommissioned: '#666666',
}

export default function AgentsSection() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadAgents()
  }, [])

  const loadAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      if (data) setAgents(data as Agent[])
    } catch (error) {
      console.error('Error loading agents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const govAgents = agents.filter(a => a.agent_type === 'constitutional')
  const devAgents = agents.filter(a => a.agent_type === 'developer')
  const finAgents = agents.filter(a => a.agent_type === 'financial')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <section id="agents" className="container mx-auto p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Agent Directory</h2>
        </div>
        <p className="text-muted-foreground max-w-2xl">
          Constitutional AI agents govern the campus. Each operates within bounded constraints
          defined in the constitution. TrustGraph scores all actions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Agents</CardDescription>
            <CardTitle className="text-3xl">{agents.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {agents.filter(a => a.status === 'active').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {agents.filter(a => a.status === 'pending').length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Avg Trust Score</CardDescription>
            <CardTitle className="text-3xl">
              {agents.length > 0
                ? Math.round(agents.reduce((sum, a) => sum + a.trust_score, 0) / agents.length)
                : 0}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Agent Lists */}
      <div className="space-y-8">
        {/* Governance Agents */}
        {govAgents.length > 0 && (
          <div>
            <h3 className="text-sm font-medium tracking-wider uppercase text-green-500 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Governance Agents
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {govAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgent?.id === agent.id}
                  onSelect={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Developer Agents */}
        {devAgents.length > 0 && (
          <div>
            <h3 className="text-sm font-medium tracking-wider uppercase text-yellow-500 mb-4 flex items-center gap-2">
              <Terminal className="w-4 h-4" />
              Developer Agents
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {devAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgent?.id === agent.id}
                  onSelect={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Financial Agents */}
        {finAgents.length > 0 && (
          <div>
            <h3 className="text-sm font-medium tracking-wider uppercase text-purple-500 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Financial Agents
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {finAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  isSelected={selectedAgent?.id === agent.id}
                  onSelect={() => setSelectedAgent(selectedAgent?.id === agent.id ? null : agent)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected Agent Details */}
      {selectedAgent && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {TYPE_ICONS[selectedAgent.agent_type]}
              {selectedAgent.name || selectedAgent.did}
            </CardTitle>
            <CardDescription>
              {selectedAgent.agent_type} Agent · {selectedAgent.status}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Trust Score</div>
                <div className="text-2xl font-bold" style={{ color: selectedAgent.trust_score >= 70 ? '#44ffaa' : '#ffbb33' }}>
                  {selectedAgent.trust_score}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">DID</div>
                <div className="font-mono text-sm break-all">{selectedAgent.did}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Created</div>
                <div className="text-sm">
                  {new Date(selectedAgent.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            {selectedAgent.constitution_hash && (
              <div>
                <div className="text-sm text-muted-foreground mb-1">Constitution Hash</div>
                <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                  {selectedAgent.constitution_hash}
                </div>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat
              </Button>
              <Button variant="outline" size="sm">
                View TrustGraph
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  )
}

interface AgentCardProps {
  agent: Agent
  isSelected: boolean
  onSelect: () => void
}

function AgentCard({ agent, isSelected, onSelect }: AgentCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${isSelected ? 'border-primary ring-2 ring-primary' : ''}`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: `${TYPE_COLORS[agent.agent_type]}15`,
                border: `2px solid ${TYPE_COLORS[agent.agent_type]}40`,
                color: TYPE_COLORS[agent.agent_type],
              }}
            >
              {TYPE_ICONS[agent.agent_type]}
            </div>
            <div>
              <h4 className="font-semibold">
                {agent.name || agent.did.slice(0, 16)}...
              </h4>
              <div className="text-xs text-muted-foreground capitalize">
                {agent.agent_type}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: STATUS_COLORS[agent.status] }}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {agent.status}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="text-xs text-muted-foreground">Trust</div>
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${agent.trust_score}%`,
                background: agent.trust_score >= 70 ? '#44ffaa' : '#ffbb33',
              }}
            />
          </div>
          <div className="text-sm font-medium" style={{ color: agent.trust_score >= 70 ? '#44ffaa' : '#ffbb33' }}>
            {agent.trust_score}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {agent.agent_type}
          </Badge>
          <Button variant="ghost" size="sm" className="text-xs">
            <MessageSquare className="w-3 h-3 mr-1" />
            Chat
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
