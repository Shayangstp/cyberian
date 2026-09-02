import { Navigate, Route, Routes } from 'react-router-dom';
import { ProfileSearchPage } from '../../features/profile-search/pages/ProfileSearchPage';
import { NotFoundPage } from '../../pages/NotFoundPage';
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/search" replace />} />
      <Route path="/search" element={<ProfileSearchPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
