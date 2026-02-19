import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Calculations from './pages/Calculations';
import AggregatedCalculations from './pages/AggregatedCalculations';
import Reports from './pages/Reports';
import LeaveManagement from './pages/LeaveManagement';
import Settings from './pages/Settings';
import PendingAmounts from './pages/PendingAmounts';
import BackupRestore from './pages/BackupRestore';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="calculations" element={<Calculations />} />
            <Route path="aggregated-calculations" element={<AggregatedCalculations />} />
            <Route path="reports" element={<Reports />} />
            <Route path="leave-management" element={<LeaveManagement />} />
            <Route path="settings" element={<Settings />} />
            <Route path="pending-amounts" element={<PendingAmounts />} />
            <Route path="backup-restore" element={<BackupRestore />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
