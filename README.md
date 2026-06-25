# CapitalStack

**XMRT DAO-REIT Unified Operating System**

A unified platform for AI-native governance, capital deployment, and investor relations. Combines constitutional AI agent management with real-time capital stack visualization and trust-based reputation tracking.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CapitalStack Platform                     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Capital     │  │   Trust      │  │    Agent     │      │
│  │   Stack      │  │   Graph      │  │  Directory   │      │
│  │  Visualizer  │  │  Reputation  │  │  Management  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
├─────────────────────────────────────────────────────────────┤
│              Supabase Edge Functions (Backend)               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │ onboard  │ │  chat    │ │ cac-status│ │trust-score│      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │task-claim│ │task-complete│ │proposals│ │  voting  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
├─────────────────────────────────────────────────────────────┤
│                    Supabase Database                         │
│  • agents • capital_stack • financing_programs • investors  │
│  • proposals • trust_events • agent_tasks • distributions   │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Capital Stack

| Layer | Amount | % Total | Seniority | Status |
|-------|--------|---------|-----------|--------|
| C-PACE Retrofit | $25.5M | 75% | 0.88 | Active |
| SBA 504 Private | $2.75M | 8% | 0.70 | Active |
| SBA 504 CDC | $2.2M | 6.5% | 0.60 | Active |
| DAO-REIT Equity | $550K | 1.6% | 0.28 | **Open** |
| Founder Equity | $55K | 0.18% | 0.18 | Active |

**Total Capital**: $31M+ across 17 federal/state financing programs

## 🚀 Features

### Capital Stack Visualization
- Interactive node-based capital graph
- Real-time deployment tracking
- Seniority-weighted risk analysis
- Yield and coverage metrics

### TrustGraph Reputation System
- Dynamic agent trust scoring
- On-chain attestation tracking
- Live event feed
- Constitutional governance integration

### Agent Directory
- Constitutional AI agent management
- Type-based categorization (Governance/Developer/Financial)
- Trust score visualization
- Chat interface for agent interaction

### Investor Portal
- VC-gated returns section
- Capital contribution tracking
- Distribution records
- Pro-rata calculations

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS
- **Backend**: Supabase Edge Functions (Deno)
- **Database**: PostgreSQL (Supabase)
- **Deployment**: GitHub Pages + Supabase
- **Authentication**: Supabase Auth + custom VC code validation

## 📁 Project Structure

```
capitalstack/
├── src/
│   ├── components/
│   │   └── sections/
│   │       ├── CapitalStackSection.tsx
│   │       ├── TrustGraphSection.tsx
│   │       ├── AgentsSection.tsx
│   │       └── InvestorsSection.tsx
│   ├── pages/
│   │   └── Investors.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx
│   └── integrations/
│       └── supabase/
├── supabase/
│   ├── migrations/
│   │   └── 20260625_dao_reit_unification.sql
│   └── functions/
│       ├── onboard/
│       ├── chat/
│       ├── cac-status/
│       └── ...
├── package.json
└── README.md
```

## 🏃 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## 📋 Environment Variables

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_VC_CODE=TRIBUTARY2026
```

## 🗄️ Database Schema

The unified schema includes:

- **agents**: Constitutional AI agent registry
- **capital_stack**: Capital tranche definitions
- **financing_programs**: 17 federal/state programs
- **investors**: Investor profiles with accreditation
- **capital_contributions**: Investment records
- **distribution_records**: Pro-rata distributions
- **proposals**: Governance proposals
- **trust_events**: Reputation scoring events
- **agent_tasks**: Task assignment and completion

See `supabase/migrations/20260625_dao_reit_unification.sql` for full schema.

## 🔐 Access Control

- **Public**: Capital stack overview, agent directory
- **Authenticated**: Investor portal, task claiming
- **VC-Gated**: Returns section, distribution records, briefing room

VC access code: `TRIBUTARY2026` (production)

## 📈 Roadmap

- [x] Phase 1: Unified database schema
- [x] Phase 2: Auth extension with investor roles
- [x] Phase 3: Component porting (CapitalStack, TrustGraph, Agents)
- [ ] Phase 4: Agent economy edge functions
- [ ] Phase 5: Capital deployment dashboard
- [ ] Phase 6: Constitutional governance engine
- [ ] Phase 7: Privateer Fleet Command
- [ ] Phase 8: Investor relations automation
- [ ] Phase 9: Physical infrastructure monitor
- [ ] Phase 10: Production deployment

## 🏢 Organizations

- **XMRT DAO**: MobileMonero.com
- **Party Favor Photo**: PartyFavorPhoto.com
- **31 Harbor**: 31Harbor.com

## 📄 License

MIT License - see LICENSE file

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

---

**Built with ❤️ by XMRT DAO**
