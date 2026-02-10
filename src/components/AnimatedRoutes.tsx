import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PageTransition } from '@/components/PageTransition';
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load pages for better performance
const Index = lazy(() => import('@/pages/Index'));
const Auth = lazy(() => import('@/pages/Auth'));
const Demo = lazy(() => import('@/pages/Demo'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Players = lazy(() => import('@/pages/Players'));
const NewPlayer = lazy(() => import('@/pages/NewPlayer'));
const PlayerDetail = lazy(() => import('@/pages/PlayerDetail'));
const PlayerComparison = lazy(() => import('@/pages/PlayerComparison'));
const Reports = lazy(() => import('@/pages/Reports'));
const ReportsAnalytics = lazy(() => import('@/pages/ReportsAnalytics'));
const NewReport = lazy(() => import('@/pages/NewReport'));
const ReportDetail = lazy(() => import('@/pages/ReportDetail'));
const AdminDashboard = lazy(() => import('@/pages/AdminDashboard'));
const AdminPromoCodes = lazy(() => import('@/pages/AdminPromoCodes'));
const AdminUsers = lazy(() => import('@/pages/AdminUsers'));
const AdminData = lazy(() => import('@/pages/AdminData'));
const GdprConsent = lazy(() => import('@/pages/GdprConsent'));
const Settings = lazy(() => import('@/pages/Settings'));
const Pricing = lazy(() => import('@/pages/Pricing'));
const Watchlists = lazy(() => import('@/pages/Watchlists'));
const Analysis = lazy(() => import('@/pages/Analysis'));
const Install = lazy(() => import('@/pages/Install'));
const ContactFeedback = lazy(() => import('@/pages/ContactFeedback'));

const PrivacyPolicy = lazy(() => import('@/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('@/pages/TermsOfService'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );
}

export function AnimatedRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<PageTransition><Index /></PageTransition>} />
        <Route path="/demo" element={<PageTransition><Demo /></PageTransition>} />
        <Route path="/pricing" element={<PageTransition><Pricing /></PageTransition>} />
        <Route path="/install" element={<PageTransition><Install /></PageTransition>} />
        
        <Route path="/auth" element={<PageTransition><Auth /></PageTransition>} />
        <Route path="/privacy-policy" element={<PageTransition><PrivacyPolicy /></PageTransition>} />
        <Route path="/terms-of-service" element={<PageTransition><TermsOfService /></PageTransition>} />
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
        <Route path="/analysis" element={<ProtectedRoute><PageTransition><Analysis /></PageTransition></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><PageTransition><Settings /></PageTransition></ProtectedRoute>} />
        <Route path="/contact" element={<ProtectedRoute><PageTransition><ContactFeedback /></PageTransition></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requireAdmin><PageTransition><AdminDashboard /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute requireAdmin><PageTransition><AdminUsers /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/data" element={<ProtectedRoute requireAdmin><PageTransition><AdminData /></PageTransition></ProtectedRoute>} />
        <Route path="/admin/promo-codes" element={<ProtectedRoute requireAdmin><PageTransition><AdminPromoCodes /></PageTransition></ProtectedRoute>} />
        
        {/* Catch-all */}
        <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
      </Routes>
    </Suspense>
  );
}