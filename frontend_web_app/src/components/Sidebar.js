import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

// PUBLIC_INTERFACE
export default function Sidebar() {
  /**
   * Sidebar navigation for the app.
   * Quick links for dashboard, groups, expenses, achievements, analytics,
   * and playful iconography.
   */
  return (
    <nav className="sq-sidebar" aria-label="Main Navigation">
      <div className="sq-sidebar__brand">
        <span role="img" aria-label="logo">🧾</span>
        <div className="sq-sidebar__title">SplitQuest</div>
      </div>
      <ul className="sq-sidebar__nav">
        <li>
          <NavLink to="/" end>
            <span role="img" aria-label="Dashboard">🏠</span> Dashboard
          </NavLink>
        </li>
        <li>
          <NavLink to="/groups">
            <span role="img" aria-label="Groups">👥</span> Groups
          </NavLink>
        </li>
        <li>
          <NavLink to="/expenses">
            <span role="img" aria-label="Expenses">💸</span> Expenses
          </NavLink>
        </li>
        <li>
          <NavLink to="/achievements">
            <span role="img" aria-label="Achievements">🏅</span> Achievements
          </NavLink>
        </li>
        <li>
          <NavLink to="/analytics">
            <span role="img" aria-label="Analytics">📊</span> Analytics
          </NavLink>
        </li>
        <li>
          <NavLink to="/notifications">
            <span role="img" aria-label="Notifications">🔔</span> Notifications
          </NavLink>
        </li>
        <li className="sq-invite">
          <NavLink to="/invite">
            <span role="img" aria-label="Invite">➕</span> Invite Friends
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
