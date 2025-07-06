import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FaReceipt, FaHome, FaUsers, FaMoneyBillWave, FaMedal, FaChartBar, FaBell, FaUserPlus
} from 'react-icons/fa';
import './Sidebar.css';

// PUBLIC_INTERFACE
export default function Sidebar() {
  /**
   * Sidebar navigation for the app.
   * Modern flat icons, animated states, and accessible layout for a playful experience.
   */
  const location = useLocation();

  // Define sidebar items
  const menu = [
    {
      path: '/',
      exact: true,
      icon: <FaUsers size={20} />,
      label: 'Groups',
      tag: 'sq-tab-groups'
    },
    {
      path: '/achievements',
      icon: <FaMedal size={20} />,
      label: 'Achievements',
      tag: 'sq-tab-achievements'
    },
    {
      path: '/analytics',
      icon: <FaChartBar size={20} />,
      label: 'Analytics',
      tag: 'sq-tab-analytics'
    },
    {
      path: '/notifications',
      icon: <FaBell size={19} />,
      label: 'Notifications',
      tag: 'sq-tab-notifications'
    }
  ];
  return (
    <nav className="sq-sidebar" aria-label="Main Navigation">
      <div className="sq-sidebar__brand" tabIndex={0}>
        <FaReceipt style={{ verticalAlign: "middle", marginRight: 8 }} size={25} />
        <div className="sq-sidebar__title">SplitQuest</div>
      </div>
      <ul className="sq-sidebar__nav">
        {menu.map(item => (
          <li key={item.label}>
            <NavLink
              to={item.path}
              end={item.exact}
              className={({ isActive }) =>
                isActive ? `active ${item.tag}` : item.tag
              }
            >
              <span className="sq-sidebar__icon">{item.icon}</span>
              <span className="sq-sidebar__text">{item.label}</span>
              {/* Animated accent background for active tab */}
              {location.pathname === item.path && (
                <span className="sq-sidebar__active-glider" aria-hidden="true" />
              )}
            </NavLink>
          </li>
        ))}
        <li className="sq-invite">
          <NavLink to="/invite" className={({ isActive }) =>
            isActive ? "active sq-tab-invite" : "sq-tab-invite"
          }>
            <span className="sq-sidebar__icon">
              <FaUserPlus size={19} />
            </span>
            <span className="sq-sidebar__text">Invite Friends</span>
            {location.pathname === "/invite" && (
              <span className="sq-sidebar__active-glider" aria-hidden="true" />
            )}
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
