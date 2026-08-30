import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { DashboardPage } from './pages/Dashboard';
import { SocietePage } from './pages/Societe';
import { UploadPage } from './pages/Upload';
import { ControlePage } from './pages/Controle';
import { ExportPage } from './pages/Export';
import { LayoutDashboard, Building2, Upload, FileCheck, FileOutput } from 'lucide-react';

const nav = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/societes', label: 'Sociétés', icon: Building2 },
  { to: '/upload', label: 'Fiche navette', icon: Upload },
  { to: '/controle', label: 'Contrôle', icon: FileCheck },
  { to: '/export', label: 'Export Sage GA', icon: FileOutput },
];

function NavBar() {
  const loc = useLocation();
  return (
    <nav className="flex gap-1 border-b bg-white px-4 py-2">
      {nav.map(n => {
        const Icon = n.icon;
        const active = loc.pathname === n.to || (n.to !== '/' && loc.pathname.startsWith(n.to));
        return (
          <Link key={n.to} to={n.to}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Icon size={16} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b bg-white px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-bold text-blue-700">BAUD</h1>
        <span className="text-xs text-gray-400">Automatisation Paie</span>
      </header>
      <NavBar />
      <main className="max-w-7xl mx-auto p-4">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/societes" element={<SocietePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/controle" element={<ControlePage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </main>
    </div>
  );
}
