import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { isSupabaseConfigured } from './lib/supabase';
import { SetupScreen } from './SetupScreen';
import { Dashboard } from './pages/Dashboard';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { RestaurantPage } from './pages/RestaurantPage';
import { Button } from './components/atoms/Button';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

function App() {
  // Show setup screen if Supabase is not configured
  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/restaurant" element={<RestaurantPage />} />
          <Route path="/history" element={<PlaceholderPage title="Histórico" />} />
          <Route path="/settings" element={<PlaceholderPage title="Configuración" />} />
        </Routes>

        {/* Dev Nav */}
        <div style={{ position: 'fixed', bottom: 10, right: 10, opacity: 0.5, zIndex: 9999 }}>
          <Link to="/restaurant" style={{ marginRight: '10px' }}>
            <Button variant="ghost" size="sm">Restaurant</Button>
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">Dashboard</Button>
          </Link>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
