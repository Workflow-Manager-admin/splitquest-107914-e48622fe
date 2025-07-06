import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FAB from '../components/FAB';
import SummaryCard from '../components/SummaryCard';
import { FaHandHoldingUsd, FaCoins, FaWallet } from "react-icons/fa";
import { useGroups } from '../GroupsContext';

// PUBLIC_INTERFACE
export default function Dashboard() {
  /**
   * Main dashboard: Welcomes user, shows groups, recent expenses,
   * summary cards, and gamified prompt.
   */
  const navigate = useNavigate();

  // Use GroupsContext to get relevant financial stats for the user
  const { groups, getAllUsers, calculateNetBalances, currentUserId } = useGroups();
  // Flat array of all (member) expenses user is part of
  const allExpenses = useMemo(
    () => groups.flatMap(g => g.expenses.map(e => ({ ...e, groupId: g.id }))),
    [groups]
  );
  // All unique groups the user is a member of
  const userGroups = useMemo(
    () =>
      groups.filter(g => g.members.includes(currentUserId)),
    [groups, currentUserId]
  );
  // Calculate "global" values: owe, owed, spent
  // (if user in multiple groups, sum across all)
  const { totalOwe, totalOwed, totalSpent } = useMemo(() => {
    let owe = 0, owed = 0, spent = 0;
    userGroups.forEach(group => {
      const members = getAllUsers().filter(u => group.members.includes(u.id));
      const balances = calculateNetBalances(group.expenses, members);
      const bal = balances[currentUserId];
      if (!bal) return;
      // You Owe: total you owe TO OTHERS (sum of .owes amounts)
      owe += (bal.owes || []).reduce((sum, o) => sum + o.amount, 0);
      // You Are Owed: total OTHERS owe you (sum of .gets amounts)
      owed += (bal.gets || []).reduce((sum, o) => sum + o.amount, 0);
      // Total Spent: sum of all expenses paid by you in group
      spent += group.expenses
        .filter(e => e.payer === currentUserId)
        .reduce((sum, e) => sum + e.amount, 0);
    });
    // Round for display
    return {
      totalOwe: Math.round(owe * 100) / 100,
      totalOwed: Math.round(owed * 100) / 100,
      totalSpent: Math.round(spent * 100) / 100
    };
  }, [userGroups, getAllUsers, calculateNetBalances, currentUserId]);

  return (
    <div style={{ maxWidth: "710px", margin: "0 auto", padding: "2rem", position: "relative" }}>
      <h1 className="sq-header" style={{ fontFamily: 'var(--header-font)', fontWeight: 800, fontSize: "2.4rem" }}>
        Welcome to SplitQuest! 🧾
      </h1>
      <p style={{
        color: 'var(--color-primary, #4F8A8B)',
        fontWeight: 500,
        fontSize: "1.16rem",
        fontFamily: 'var(--body-font)'
      }}>
        Transform bills and group expenses into fun!
      </p>

      {/* Summary Cards Row */}
      <div className="sq-dashboard-summary-row"
        style={{
          display: "flex",
          gap: "1.4rem",
          margin: "25px 0 16px 0",
          flexWrap: "wrap",
          alignItems: "stretch",
          justifyContent: "center"
        }}
      >
        <SummaryCard
          icon={<FaHandHoldingUsd />}
          value={totalOwe === undefined ? "…" : `₹${totalOwe}`}
          label="You Owe"
          color="#FF5959"
          tabIndex={0}
        />
        <SummaryCard
          icon={<FaCoins />}
          value={totalOwed === undefined ? "…" : `₹${totalOwed}`}
          label="You Are Owed"
          color="#11c447"
          tabIndex={0}
        />
        <SummaryCard
          icon={<FaWallet />}
          value={totalSpent === undefined ? "…" : `₹${totalSpent}`}
          label="Total Spent"
          color="#2d7ef0"
          tabIndex={0}
        />
      </div>

      {/* Quick links to groups, expenses, achievements, analytics */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
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
        marginTop: "2rem",
        background: "var(--color-secondary, #FBD46D)",
        borderRadius: "12px",
        padding: "1.5rem",
        color: "var(--color-accent, #FF5959)",
        fontWeight: 600,
        boxShadow: "0 4px 18px #ffd27024",
        fontSize: "1.1rem"
      }}>
        <span role="img" aria-label="Party">🎉</span> Complete your profile & invite friends to unlock badges!
      </div>
      {/* FAB for adding group or expense on mobile */}
      <div className="sq-dashboard-fab" style={{}}>
        <FAB icon="➕" label="Add Expense" style={{display:"none"}} onClick={()=>navigate('/expenses')} />
      </div>
    </div>
  );
}
