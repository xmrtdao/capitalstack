import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import CapitalStackSection from './components/sections/CapitalStackSection'
import TrustGraphSection from './components/sections/TrustGraphSection'
import AgentsSection from './components/sections/AgentsSection'
import Investors from './pages/Investors'

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="text-xl font-bold">
                CapitalStack
              </Link>
              <div className="flex items-center gap-6">
                <a href="#capital-stack" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Capital
                </a>
                <a href="#trustgraph" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  TrustGraph
                </a>
                <a href="#agents" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Agents
                </a>
                <Link to="/investors" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Investors
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main>
          <Routes>
            <Route path="/" element={
              <>
                <CapitalStackSection />
                <TrustGraphSection />
                <AgentsSection />
              </>
            } />
            <Route path="/investors" element={<Investors />} />
          </Routes>
        </main>

        {/* Footer */}
        <footer className="border-t py-8 mt-16">
          <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
            <p>Built by XMRT DAO · AI-Native Infrastructure</p>
            <p className="mt-2">
              <a href="https://mobilemonero.com" className="hover:text-foreground">mobilemonero.com</a>
              {' · '}
              <a href="https://partyfavorphoto.com" className="hover:text-foreground">partyfavorphoto.com</a>
              {' · '}
              <a href="https://31harbor.com" className="hover:text-foreground">31harbor.com</a>
            </p>
          </div>
        </footer>
      </div>
    </Router>
  )
}

export default App
