import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageTransition } from '@/components/PageTransition';

import Index from '@/pages/Index';
import Auth from '@/pages/Auth';
import Demo from '@/pages/Demo';
import Dashboard from '@/pages/Dashboard';
import Players from '@/pages/Players';
import NewPlayer from '@/pages/NewPlayer';
import PlayerDetail from '@/pages/PlayerDetail';
import PlayerComparison from '@/pages/PlayerComparison';
import Reports from '@/pages/Reports';
import ReportsAnalytics from '@/pages/ReportsAnalytics';
import NewReport from '@/pages/NewReport';
import ReportDetail from '@/pages/ReportDetail';
import AdminDashboard from '@/pages/AdminDashboard';
import TeamsAdmin from '@/pages/TeamsAdmin';
import GdprConsent from '@/pages/GdprConsent';
import Settings from '@/pages/Settings';
import Pricing from '@/pages/Pricing';
import Watchlists from '@/pages/Watchlists';
import TeamFeed from '@/pages/TeamFeed';
import TeamAnalytics from '@/pages/TeamAnalytics';
import Install from '@/pages/Install';
import NotFound from '@/pages/NotFound';

export function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/demo" element={<PageTransition><Demo /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/gdpr-consent" element={<PageTransition><GdprConsent /></PageTransition>} />
        
        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><PageTransition><Dashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/players" element={<ProtectedRoute><PageTransition><Players /></PageTransition></ProtectedRoute>} />
        <Route path="/players/new" element={<ProtectedRoute><PageTransition><NewPlayer /></PageTransition></ProtectedRoute>} />
        <Route path="/players/compare" element={<ProtectedRoute><PageTransition><PlayerComparison /></PageTransition></ProtectedRoute>} />
        <Route path="/players/:id" element={<ProtectedRoute><PageTransition><PlayerDetail /></PageTransition></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><PageTransition><Reports /></PageTransition></ProtectedRoute>} />
        <Route path="/reports/analytics" element={<ProtectedRoute><PageTransition><ReportsAnalytics /></PageTransition></ProtectedRoute>} />
        <Route path="/reports/new" element={<ProtectedRoute><PageTransition><NewReport /></PageTransition></ProtectedRoute>} />
        <Route path="/reports/:id" element={<ProtectedRoute><PageTransition><ReportDetail /></PageTransition></ProtectedRoute>} />
        <Route path="/watchlists" element={<ProtectedRoute><PageTransition><Watchlists /></PageTransition></ProtectedRoute>} />
        <Route path="/team-feed" element={<ProtectedRoute><PageTransition><TeamFeed /></PageTransition></ProtectedRoute>} />
        <Route path="/team-analytics" element={<ProtectedRoute><PageTransition><TeamAnalytics /></PageTransition></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/teams" element={<ProtectedRoute requireAdmin><PageTransition><TeamsAdmin /></PageTransition></ProtectedRoute>} />
        <Route path="/teams-admin" element={<ProtectedRoute requireTeamOwnerOrAdmin><PageTransition><TeamsAdmin /></PageTransition></ProtectedRoute>} />
        
        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
}
