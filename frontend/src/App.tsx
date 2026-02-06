import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import AppLayout from './layouts/AppLayout';
import BatchesPage from './pages/BatchesPage';
import ExceptionsPage from './pages/ExceptionsPage';
import PricingRulesPage from './pages/PricingRulesPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/batches" replace />} />
          <Route path="batches" element={<BatchesPage />} />
          <Route path="exceptions" element={<ExceptionsPage />} />
          <Route path="pricing-rules" element={<PricingRulesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
