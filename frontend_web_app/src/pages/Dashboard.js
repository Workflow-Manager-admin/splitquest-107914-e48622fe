import React from 'react';
import { Link } from 'react-router-dom';

// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Main dashboard: Welcomes user, shows groups, recent expenses,
   * and a progress hint for achievements/gamification.
   */
  return (
    <div style={{maxWidth:"710px",margin:"0 auto",padding:"2rem"}}>
      <h1>Welcome to SplitQuest! 🧾</h1>
      <p style={{color: 'var(--color-primary, #4F8A8B)',fontWeight:500}}>
        Transform bills and group expenses into fun!
      </p>
      <div style={{display:"flex",gap:"2rem",flexWrap:"wrap"}}>
        <Link to="/groups" className="sq-dashboard-card">
          <div>👥</div>
          <span>My Groups</span>
        </Link>
        <Link to="/expenses" className="sq-dashboard-card">
          <div>💸</div>
          <span>Recent Expenses</span>
        </Link>
        <Link to="/achievements" className="sq-dashboard-card">
          <div>🏅</div>
          <span>Achievements</span>
        </Link>
        <Link to="/analytics" className="sq-dashboard-card">
          <div>📊</div>
          <span>Expense Analytics</span>
        </Link>
      </div>
      <div className="sq-gamify-prompt" style={{
        marginTop:"2rem",background:"var(--color-secondary, #FBD46D)",borderRadius:"12px",
        padding:"1.5rem",color:"var(--color-accent, #FF5959)",fontWeight:600,
        boxShadow: "0 4px 18px #ffd27024"
      }}>
        <span role="img" aria-label="Party">🎉</span> Complete your profile & invite friends to unlock badges!
      </div>
    </div>
  );
}
