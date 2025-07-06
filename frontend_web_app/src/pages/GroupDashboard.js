import React, { useMemo, useState, useContext } from "react";
import { useGroups } from "../GroupsContext";
import GroupLeaderboard from "./GroupLeaderboard";
import { useTheme } from "../theme";
import AddExpenseModal from "../components/AddExpenseModal";
import { FAB } from "../components/FAB";
import { FaPlus } from "react-icons/fa";

// Utility to format datetime strings
function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

// PUBLIC_INTERFACE
export default function GroupDashboard({ groupId, onBack }) {
  const {
    getGroupById,
    calculateNetBalances,
    addExpense,
    currentUserId,
  } = useGroups();
  const group = getGroupById(groupId);
  const members = group ? group.members : [];

  // State: show add-expense modal
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Handler for adding an expense via modal
  function handleAddExpense(expense) {
    // expense: {title, amount, payer, date, splitWith, annotator}
    // We ignore annotator for backend but could log it
    addExpense(groupId, expense);
    setShowAddExpense(false);
  }

  // Payment settlement log for this group (array of {from, to, amount, timestamp})
  // Persist per group, volatile only for demo purposes (refresh = gone)
  const [settlements, setSettlements] = useState(() =>
    group && group.settlements ? group.settlements : []
  );

  // For balances, compute showing after excluding settled amounts
  // Recompute on every group/settlement update
  const balances = useMemo(() => {
    if (!group) return {};
    let original = calculateNetBalances(group.expenses, members);
    if (settlements && settlements.length) {
      // Shallow clone
      original = JSON.parse(JSON.stringify(original));
      settlements.forEach(({ from, to, amount }) => {
        // Remove 'owes' entry from 'from'
        if (original[from])
          original[from].owes = (original[from].owes || []).map(owe =>
            owe.to === to
              ? { ...owe, amount: Math.max(0, owe.amount - amount) }
              : owe
          );
        // Remove 'gets' entry from 'to'
        if (original[to])
          original[to].gets = (original[to].gets || []).map(gets =>
            gets.from === from
              ? { ...gets, amount: Math.max(0, gets.amount - amount) }
              : gets
          );
        // Adjust net balance
        if (original[from]) original[from].balance += amount;
        if (original[to]) original[to].balance -= amount;
      });
      // Remove any zero-amount owes/gets for cleaner display
      Object.keys(original).forEach(mid => {
        if (original[mid].owes) original[mid].owes = original[mid].owes.filter(o => o.amount > 0.009);
        if (original[mid].gets) original[mid].gets = original[mid].gets.filter(g => g.amount > 0.009);
        original[mid].balance = Math.round(original[mid].balance * 100) / 100;
      });
    }
    return original;
  }, [group, members, settlements, calculateNetBalances]);

  // When a settle up is performed, add to payment history
  function markSettleUp(from, to, amount) {
    amount = Math.round(amount * 100) / 100;
    setSettlements((prev) => [
      ...prev,
      {
        from,
        to,
        amount,
        timestamp: new Date().toISOString(),
      },
    ]);
  }

  const { theme, toggleTheme } = useTheme();

  if (!group) return <div>Group not found.</div>;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "2rem",
        margin: "2rem 0",
        boxShadow: "0 2px 14px #4f8a8b1a",
        position: "relative",
        minHeight: "88vh"
      }}
    >
      {/* Top-right action container */}
      <div className="sq-topbar-blur" style={{zIndex: 11}}>
        <div className="sq-action-buttons sq-topbar-actions" role="group" aria-label="Top right actions">
          {/* Only theme toggle remains here after CSV button removal */}
          <button
            className={`theme-toggle sq-topbar-btn${theme === "dark" ? " theme-toggle--dark" : ""}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            tabIndex={0}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>
        </div>
      </div>

      {/* Responsive: add space for header so buttons don't occlude content */}
      <div style={{ height: 58 }} />

      <button
        onClick={onBack}
        className="theme-toggle"
        style={{ marginBottom: 12 }}
      >
        &larr; Back to Groups
      </button>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>
        {group.name} <span role="img" aria-label="Group">👥</span>
      </h2>
      <div style={{ marginBottom: 20 }}>
        <strong>Members:</strong>{" "}
        {members.map((m) => (
          <span key={m.id} style={{ marginRight: 10 }}>
            {m.name}
          </span>
        ))}
      </div>

      <GroupLeaderboard group={group} members={members} balances={balances} />

      <h3 style={{ marginTop: "2rem" }}>Expenses</h3>
      <ExpenseList expenses={group.expenses} members={members} />

      {/* Add FAB for "Add Expense" */}
      <FAB
        icon={<FaPlus />}
        label="Add Expense"
        onClick={() => setShowAddExpense(true)}
        style={{
          position: "fixed",
          bottom: "2.1rem",
          right: "2.1rem",
          zIndex: 2100,
        }}
        data-testid="add-expense-fab"
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        members={members}
        currentUserId={currentUserId}
        open={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        onSubmit={handleAddExpense}
      />

      <h3 style={{ marginTop: "2rem" }}>Balances</h3>
      <BalancesView
        balances={balances}
        members={members}
        currentUserId={currentUserId}
        settlements={settlements}
        markSettleUp={markSettleUp}
      />
      <h3 style={{ marginTop: "2rem", marginBottom: 6 }}>Payment History</h3>
      <PaymentHistory settlements={settlements} members={members} />
      <div style={{marginTop:12, fontSize:"0.97em", color:"#aaa", textAlign:"right"}}>
        <span role="img" aria-label="info">ℹ️</span> Settlements are tracked locally in your browser only (for demo purposes).
      </div>
      {/* Responsive styling for mobile */}
      <style>{`
        @media (max-width: 640px) {
          .sq-action-buttons {
            top: 8px !important;
            right: 8px !important;
            gap: 9px !important;
          }
          .sq-fab {
            right: 1rem !important;
            bottom: 1.1rem !important;
          }
        }
        @media (max-width: 420px) {
          .sq-action-buttons {
            top: 2.5vw !important;
            right: 2.5vw !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Expense history list with details.
 */
function ExpenseList({ expenses, members }) {
  const getName = (id) => members.find((m) => m.id === id)?.name || id;
  if (!expenses || !expenses.length) return <div>No expenses yet.</div>;
  return (
    <table
      style={{
        width: "100%",
        marginTop: 12,
        background: "#fafafa",
        borderRadius: 8,
        boxShadow: "0 2px 8px #8883",
        fontSize: "1rem",
        borderCollapse: "collapse",
      }}
    >
      <thead>
        <tr>
          <th style={{ padding: "7px" }}>Title</th>
          <th>Amount</th>
          <th>Date</th>
          <th>Payer</th>
          <th>Split With</th>
        </tr>
      </thead>
      <tbody>
        {expenses.map((e) => (
          <tr key={e.id} style={{ borderBottom: "1px solid #e4e4e4" }}>
            <td>{e.title}</td>
            <td>₹{e.amount}</td>
            <td>{e.date}</td>
            <td>{getName(e.payer)}</td>
            <td>{e.splitWith.map(getName).join(", ")}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Displays the calculated balances per member.
 * Enhanced with Settle Up buttons to clear debts between users, triggers markSettleUp.
 */
function BalancesView({ balances, members, currentUserId, settlements, markSettleUp }) {
  const [uiFeedback, setUiFeedback] = useState({});
  if (!balances || !members.length) return null;

  function handleSettle(mid, toId, amount) {
    setUiFeedback({
      key: mid + "_" + toId,
      status: "settling",
    });
    setTimeout(() => {
      markSettleUp(mid, toId, amount);
      setUiFeedback({
        key: mid + "_" + toId,
        status: "settled",
      });
      setTimeout(() =>
        setUiFeedback({}), 1200
      );
    }, 350);
  }

  function renderOwes(mid) {
    if (!balances[mid].owes.length) return "—";
    return balances[mid].owes.map((o) =>
      o.amount > 0.009 ? (
        <div key={o.to} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>{`Owes ₹${o.amount} to ${balances[o.to].name}`}</span>
          {mid === currentUserId && (
            <button
              style={{
                background: "#ff8f43",
                color: "#fff",
                border: "none",
                borderRadius: "7px",
                fontSize: "0.97em",
                marginLeft: 8,
                cursor: "pointer",
                padding: "4px 16px",
                minHeight: 27,
                fontWeight: 500,
              }}
              disabled={uiFeedback.key === mid + "_" + o.to && uiFeedback.status === "settling"}
              onClick={() => handleSettle(mid, o.to, o.amount)}
              title="Mark this debt as settled"
            >
              {uiFeedback.key === mid + "_" + o.to && uiFeedback.status === "settling"
                ? "Settling..."
                : "Settle Up"}
            </button>
          )}
          {uiFeedback.key === mid + "_" + o.to && uiFeedback.status === "settled" && (
            <span style={{ color: "#32d972", fontWeight: 600, marginLeft: 4 }}>✓ Settled</span>
          )}
        </div>
      ) : null
    );
  }

  function renderGets(mid) {
    if (!balances[mid].gets.length) return "—";
    return balances[mid].gets.map((g) =>
      g.amount > 0.009 ? (
        <span key={g.from}>{`Gets ₹${g.amount} from ${balances[g.from].name}`}</span>
      ) : null
    );
  }
  return (
    <table
      style={{ width: "100%", background: "#f4f8fd", borderRadius: 8, marginTop: 8 }}
    >
      <thead>
        <tr>
          <th>Member</th>
          <th>Net Balance</th>
          <th>Owes</th>
          <th>Gets</th>
        </tr>
      </thead>
      <tbody>
        {members.map((m) => (
          <tr key={m.id}>
            <td>
              {m.name}
              {m.id === currentUserId && " (You)"}
            </td>
            <td style={{ color: balances[m.id].balance >= 0 ? "green" : "#FF5959" }}>
              {balances[m.id].balance >= 0 ? "+" : ""}
              ₹{balances[m.id].balance}
            </td>
            <td>{renderOwes(m.id)}</td>
            <td>{renderGets(m.id)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Shows payment history (settled debts/log) for a group.
 */
function PaymentHistory({ settlements, members }) {
  if (!settlements.length)
    return <div style={{ color: "#888", fontSize: "0.98em", paddingBottom: 10 }}>No payments have been settled yet for this group.</div>;

  return (
    <div
      style={{
        background: "#fbfdf8",
        borderRadius: 9,
        marginTop: 4,
        padding: "1.1rem",
        boxShadow: "0 2px 10px #4f8a8b13",
      }}
    >
      <table style={{ width: "100%", fontSize: "1.03em", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "5px" }}>Debtor</th>
            <th style={{ textAlign: "left" }}>Creditor</th>
            <th>Amount</th>
            <th>Settled At</th>
          </tr>
        </thead>
        <tbody>
          {settlements
            .slice()
            .reverse()
            .map((s, idx) => (
              <tr key={idx}>
                <td>{members.find((m) => m.id === s.from)?.name || s.from}</td>
                <td>{members.find((m) => m.id === s.to)?.name || s.to}</td>
                <td style={{ color: "#19b859", fontWeight: 600 }}>₹{s.amount}</td>
                <td style={{ color: "#a4a4a4" }}>{formatTimestamp(s.timestamp)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
