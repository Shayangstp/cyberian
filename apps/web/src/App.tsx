import { Route, Routes } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './pages/HomePage';

export function App() {
  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<HomePage />} />
      </Routes>
    </AppLayout>
  );
}
