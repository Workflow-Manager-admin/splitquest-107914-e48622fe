import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, useTheme } from './theme';
import Sidebar from './components/Sidebar';
import './App.css';

// Lazy load pages for better performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Groups = React.lazy(() => import('./pages/Groups'));
const Expenses = React.lazy(() => import('./pages/Expenses'));
const Achievements = React.lazy(() => import('./pages/Achievements'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Invite = React.lazy(() => import('./pages/Invite'));
const Auth = React.lazy(() => import('./pages/Auth'));

function MainLayout() {
  // Theme toggling button in header
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`App`}>
      <Sidebar />
      <div className="sq-main-content">
        <header className="App-header sq-header-row">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
          </button>
        </header>
        <React.Suspense fallback={<div style={{textAlign:"center", padding:"3rem"}}>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/groups/*" element={<Groups />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/invite" element={<Invite />} />
            {/* Catch all unknown paths */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </React.Suspense>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  /**
   * App entrypoint, wraps ThemeProvider + layout, provides global router.
   * All main routes and navigation.
   */
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          {/* Auth page as root route when not logged in */}
          <Route path="/auth/*" element={
            <React.Suspense fallback={<div>Loading...</div>}>
              <Auth />
            </React.Suspense>
          }/>
          {/* All other pages use main layout */}
          <Route path="/*" element={<MainLayout />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
