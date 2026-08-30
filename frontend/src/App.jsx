import { Routes, Route } from 'react-router-dom';
import TopBar from './components/shell/TopBar';
import Sidebar from './components/shell/Sidebar';
import BitcoinDashboard from './pages/bitcoin/BitcoinDashboard';
import InvestigateTransaction from './pages/bitcoin/InvestigateTransaction';
import NetworkExplorer from './pages/bitcoin/NetworkExplorer';
import FraudRingExplorer from './pages/bitcoin/FraudRingExplorer';
import ModelComparison from './pages/bitcoin/ModelComparison';

function Shell({ children }) {
  return (
    <div className="flex flex-col h-screen bg-canvas overflow-hidden">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
          <div className="max-w-[1440px] mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Shell>
      <Routes>
        <Route path="/" element={<BitcoinDashboard />} />
        <Route path="/investigate" element={<InvestigateTransaction />} />
        <Route path="/network" element={<NetworkExplorer />} />
        <Route path="/rings" element={<FraudRingExplorer />} />
        <Route path="/models" element={<ModelComparison />} />
      </Routes>
    </Shell>
  );
}
