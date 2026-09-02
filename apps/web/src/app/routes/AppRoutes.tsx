import { Navigate, Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProfileSearchPage } from '../../features/profile-search/pages/ProfileSearchPage';
import { NotFoundPage } from '../../pages/NotFoundPage';

const ProfileAnalyticsPage = lazy(() =>
  import('../../features/profile-analytics/pages/ProfileAnalyticsPage').then(
    (module) => ({ default: module.ProfileAnalyticsPage }),
  ),
);
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/search" replace />} />
      <Route path="/search" element={<ProfileSearchPage />} />
      <Route
        path="/analytics"
        element={
          <Suspense fallback={<p role="status">Loading analytics…</p>}>
            <ProfileAnalyticsPage />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
