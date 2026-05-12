import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ElectricityPage from './pages/ElectricityPage';
import WaterPage from './pages/WaterPage';
import PredictionsPage from './pages/PredictionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AlertsPage from './pages/AlertsPage';
import SettingsPage from './pages/SettingsPage';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LandingPage />} />
      <Route path="/*" element={
        <ProtectedRoute>
          <Layout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/electricity" element={<ElectricityPage />} />
              <Route path="/water" element={<WaterPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/predictions" element={<PredictionsPage />} />
              <Route path="/alerts" element={<AlertsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </Layout>
        </ProtectedRoute>
      } />
    </Routes>
  );
}
