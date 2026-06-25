import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Agent {
  id: string
  name: string
  type: 'constitutional' | 'developer' | 'financial' | 'infrastructure' | 'governance'
  status: 'online' | 'idle' | 'busy' | 'offline' | 'suspended'
  trustScore: number
  currentTask: string | null
  tasksCompleted: number
  revenueGenerated: number
  uptime: number
  lastSeen: string
  meshPeerId: string
}

interface FleetStats {
  totalAgents: number
  online: number
  busy: number
  idle: number
  offline: number
  suspended: number
  totalRevenue: number
  totalTasks: number
  avgTrustScore: number
}

export default function FleetCommand() {
  const [activeTab, setActiveTab] = useState<'all' | 'online' | 'busy' | 'suspended'>('all')
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)

  // Mock fleet data
  const agents: Agent[] = [
    {
      id: 'agent-001',
      name: 'Constitutional-AI-v3.2',
      type: 'constitutional',
      status: 'busy',
      trustScore: 94,
      currentTask: 'Reviewing PROP-2026-001 (Agent Bill of Rights)',
      tasksCompleted: 847,
      revenueGenerated: 12450,
      uptime: 99.7,
      lastSeen: '2026-06-25T23:45:00Z',
      meshPeerId: '16Uiu2HAmK8Zk7p2QvN9xR3mL5wT4jS6dF8gH1iJ0kL2mN3oP4qR5s'
    },
    {
      id: 'agent-002',
      name: 'TrustGraph-Oracle',
      type: 'financial',
      status: 'online',
      trustScore: 92,
      currentTask: null,
      tasksCompleted: 1203,
      revenueGenerated: 8930,
      uptime: 99.9,
      lastSeen: '2026-06-25T23:47:00Z',
      meshPeerId: '16Uiu2HAmT9Yk8p3RwO0yS4nM6xU5kT7eG9hI2jK1lM3nO4pQ5rS6t'
    },
    {
      id: 'agent-003',
      name: 'Infrastructure-DAO',
      type: 'infrastructure',
      status: 'busy',
      trustScore: 89,
      currentTask: 'Monitoring datacenter cooling (Building A)',
      tasksCompleted: 456,
      revenueGenerated: 15670,
      uptime: 98.5,
      lastSeen: '2026-06-25T23:46:30Z',
      meshPeerId: '16Uiu2HAmU0Zl9q4SxP1zT5oN7yV6lU8fH0iJ3kL2mN4oP5qR6sT7u'
    },
    {
      id: 'agent-004',
      name: 'Treasury-Management-Agent',
      type: 'financial',
      status: 'idle',
      trustScore: 87,
      currentTask: null,
      tasksCompleted: 623,
      revenueGenerated: 22100,
      uptime: 97.8,
      lastSeen: '2026-06-25T23:44:00Z',
      meshPeerId: '16Uiu2HAmV1Am0r5TyQ2aU6pO8zW7mV9gI1jK4lM3nO5pQ6rS7tU8v'
    },
    {
      id: 'agent-005',
      name: 'DevOps-AutoScaler',
      type: 'developer',
      status: 'online',
      trustScore: 91,
      currentTask: null,
      tasksCompleted: 2341,
      revenueGenerated: 5430,
      uptime: 99.2,
      lastSeen: '2026-06-25T23:47:10Z',
      meshPeerId: '16Uiu2HAmW2Bn1s6UzR3bV7qP9aX8nW0hJ2kL5mN4oP6qR7sT8uV9w'
    },
    {
      id: 'agent-006',
      name: 'CapitalStack-Tracker',
      type: 'financial',
      status: 'busy',
      trustScore: 93,
      currentTask: 'Updating C-PACE deployment metrics',
      tasksCompleted: 189,
      revenueGenerated: 3200,
      uptime: 99.5,
      lastSeen: '2026-06-25T23:47:05Z',
      meshPeerId: '16Uiu2HAmX3Co2t7VaS4cW8rQ0bY9oX1iK3lM6nO5pQ7rS8tU9vW0x'
    },
    {
      id: 'agent-007',
      name: 'Governance-Coordinator',
      type: 'governance',
      status: 'online',
      trustScore: 90,
      currentTask: null,
      tasksCompleted: 312,
      revenueGenerated: 4100,
      uptime: 98.9,
      lastSeen: '2026-06-25T23:46:50Z',
      meshPeerId: '16Uiu2HAmY4Dp3u8WbT5dX9sR1cZ0pY2jL4mN7oP6qR8sT9uV0wX1y'
    },
    {
      id: 'agent-008',
      name: 'Mesh-Network-Monitor',
      type: 'infrastructure',
      status: 'offline',
      trustScore: 78,
      currentTask: null,
      tasksCompleted: 89,
      revenueGenerated: 1200,
      uptime: 85.3,
      lastSeen: '2026-06-25T22:15:00Z',
      meshPeerId: '16Uiu2HAmZ5Eq4v9XcU6eY0tS2dA1qZ3kM5nO8pQ7rS9tU0vW1xY2z'
    },
    {
      id: 'agent-009',
      name: 'unknown-agent-0x7f',
      type: 'constitutional',
      status: 'suspended',
      trustScore: 18,
      currentTask: null,
      tasksCompleted: 12,
      revenueGenerated: 0,
      uptime: 45.2,
      lastSeen: '2026-06-24T18:30:00Z',
      meshPeerId: '16Uiu2HAm06Fr5w0YdV7fZ1uT3eB2rA4lN6oP9qR8sT0uV1wX2yZ3a'
    }
  ]

  const stats: FleetStats = {
    totalAgents: agents.length,
    online: agents.filter(a => a.status === 'online').length,
    busy: agents.filter(a => a.status === 'busy').length,
    idle: agents.filter(a => a.status === 'idle').length,
    offline: agents.filter(a => a.status === 'offline').length,
    suspended: agents.filter(a => a.status === 'suspended').length,
    totalRevenue: agents.reduce((sum, a) => sum + a.revenueGenerated, 0),
    totalTasks: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
    avgTrustScore: Math.round(agents.reduce((sum, a) => sum + a.trustScore, 0) / agents.length)
  }

  const filteredAgents = agents.filter(a => {
    if (activeTab === 'all') return true
    return a.status === activeTab
  })

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'busy': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'idle': return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'offline': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'suspended': return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    }
  }

  const getTypeIcon = (type: Agent['type']) => {
    switch (type) {
      case 'constitutional': return '⚖️'
      case 'developer': return '👨‍💻'
      case 'financial': return '💰'
      case 'infrastructure': return '🏗️'
      case 'governance': return '🗳️'
    }
  }

  const getTrustColor = (score: number) => {
    if (score >= 90) return 'text-green-400'
    if (score >= 70) return 'text-yellow-400'
    if (score >= 50) return 'text-orange-400'
    return 'text-red-400'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <section id="fleet-command" className="py-20 px-6 bg-gradient-to-b from-black to-blue-950/10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            <span className="text-blue-500">Privateer</span> Fleet Command
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Real-time agent fleet operations dashboard. Monitor health, assign tasks, track revenue,
            and manage mesh network connectivity for all deployed AI agents.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-12">
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-500">{stats.totalAgents}</div>
              <div className="text-sm text-gray-400">Total Agents</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-500">{stats.online}</div>
              <div className="text-sm text-gray-400">Online</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-500">{stats.busy}</div>
              <div className="text-sm text-gray-400">Active Tasks</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-500">{formatCurrency(stats.totalRevenue)}</div>
              <div className="text-sm text-gray-400">Total Revenue</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 border-white/10">
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold ${getTrustColor(stats.avgTrustScore)}`}>
                {stats.avgTrustScore}
              </div>
              <div className="text-sm text-gray-400">Avg Trust Score</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-8">
          <TabsList className="bg-white/5">
            <TabsTrigger value="all">All ({stats.totalAgents})</TabsTrigger>
            <TabsTrigger value="online">Online ({stats.online + stats.busy})</TabsTrigger>
            <TabsTrigger value="idle">Idle ({stats.idle})</TabsTrigger>
            <TabsTrigger value="suspended">Suspended ({stats.suspended})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Agent Roster */}
        <div className="grid gap-4">
          {filteredAgents.map((agent) => (
            <Card 
              key={agent.id} 
              className={`bg-white/5 border-white/10 hover:border-blue-500/30 transition-colors cursor-pointer ${selectedAgent === agent.id ? 'border-blue-500/50' : ''}`}
              onClick={() => setSelectedAgent(selectedAgent === agent.id ? null : agent.id)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getTypeIcon(agent.type)}</div>
                    <div>
                      <div className="font-semibold text-white">{agent.name}</div>
                      <div className="text-xs text-gray-400 font-mono">{agent.id}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status.toUpperCase()}
                    </Badge>
                    <div className="text-right">
                      <div className={`text-lg font-bold ${getTrustColor(agent.trustScore)}`}>
                        Trust: {agent.trustScore}
                      </div>
                      <div className="text-xs text-gray-400">{agent.uptime}% uptime</div>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedAgent === agent.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
                    {/* Current Task */}
                    <div>
                      <div className="text-sm text-gray-400 mb-1">Current Task</div>
                      <div className="text-white">
                        {agent.currentTask || 'No active task'}
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-gray-400">Tasks Completed</div>
                        <div className="text-white font-semibold">{agent.tasksCompleted}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Revenue Generated</div>
                        <div className="text-green-400 font-semibold">
                          {formatCurrency(agent.revenueGenerated)}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Last Seen</div>
                        <div className="text-white">{formatTimeAgo(agent.lastSeen)}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-400">Mesh Peer ID</div>
                        <div className="text-white font-mono text-xs truncate" title={agent.meshPeerId}>
                          {agent.meshPeerId.slice(0, 20)}...
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Assign Task
                      </Button>
                      <Button size="sm" variant="outline">
                        View Logs
                      </Button>
                      <Button size="sm" variant="outline">
                        Health Check
                      </Button>
                      {agent.status !== 'suspended' && (
                        <Button size="sm" variant="destructive">
                          Suspend
                        </Button>
                      )}
                      {agent.status === 'suspended' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Reactivate
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mesh Network Status */}
        <Card className="mt-12 bg-blue-950/20 border-blue-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              🌐 Mesh Network Status
            </CardTitle>
            <CardDescription>
              Libp2p peer-to-peer connectivity for agent communication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-400 mb-1">Connected Peers</div>
                <div className="text-white text-xl font-semibold">{stats.online + stats.busy} / {stats.totalAgents}</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Network Health</div>
                <div className="text-green-400 text-xl font-semibold">98.5%</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Messages/sec</div>
                <div className="text-white text-xl font-semibold">847</div>
              </div>
              <div>
                <div className="text-sm text-gray-400 mb-1">Avg Latency</div>
                <div className="text-white text-xl font-semibold">23ms</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
