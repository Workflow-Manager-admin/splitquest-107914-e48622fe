import React, { useMemo, useState } from "react";
import { useGroups } from "../GroupsContext";
import GroupLeaderboard from "./GroupLeaderboard";
import { useTheme } from "../theme";
import { FAB } from "../components/FAB";
import { FaPlus, FaUser, FaUsers, FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa";

// Utility to format datetime strings
function formatTimestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleString();
}

/**
 * GroupDashboard with Add Expense: Embedded in-page add form, floating FAB,
 * all expense handlers and Add Expense state logic, responsive and clean.
 */
// PUBLIC_INTERFACE
export default function GroupDashboard({ groupId, onBack }) {
  const {
    getGroupById,
    calculateNetBalances,
    currentUserId,
    addExpense
  } = useGroups();
  const group = getGroupById(groupId);
  const members = group ? group.members : [];

  // State for FAB/form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseFields, setExpenseFields] = useState({
    title: "",
    amount: "",
    payer: members[0]?.id ?? "",
    date: (new Date()).toISOString().slice(0,10),
    splitWith: members.map(m => m.id)
  });
  const [addError, setAddError] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingBreakdown, setPendingBreakdown] = useState(null);

  // Payment settlement log for this group (array of {from, to, amount, timestamp})
  // Persist per group, volatile only for demo purposes (refresh = gone)
  const [settlements, setSettlements] = useState(() =>
    group && group.settlements ? group.settlements : []
  );

  // Utility to reset form state
  function resetExpenseForm() {
    setExpenseFields({
      title: "",
      amount: "",
      payer: members[0]?.id ?? "",
      date: (new Date()).toISOString().slice(0,10),
      splitWith: members.map(m => m.id)
    });
    setAddError("");
    setShowConfirmation(false);
    setPendingBreakdown(null);
  }

  // When members change, keep payer and splitWith valid
  React.useEffect(() => {
    setExpenseFields(e => ({
      ...e,
      payer: members[0]?.id ?? "",
      splitWith: members.map(m => m.id)
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members.length]);

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

  // Embedded Add Expense logic
  function handleAddExpenseStart() {
    setShowAddExpense(true);
    resetExpenseForm();
  }
  function handleAddExpenseCancel() {
    setShowAddExpense(false);
    resetExpenseForm();
  }

  // Validate and collect split breakdown before confirmation
  function handlePreviewBreakdown(e) {
    e.preventDefault();
    setAddError("");
    // Validate
    if (!expenseFields.title.trim() || !expenseFields.amount || !expenseFields.payer || !expenseFields.date || !expenseFields.splitWith.length) {
      setAddError("Fill all fields and choose at least one member.");
      return;
    }
    const amount = Number(expenseFields.amount);
    if (isNaN(amount) || amount <= 0) {
      setAddError("Enter a valid amount.");
      return;
    }
    const payer = expenseFields.payer;
    const splitWith = expenseFields.splitWith;
    if (!splitWith.includes(payer)) {
      setAddError("Payer must be among the split members.");
      return;
    }
    const perPerson = Math.round((amount / splitWith.length) * 100) / 100;
    const owedDetails = splitWith.map(mid => ({
      id: mid,
      name: members.find(m => m.id === mid)?.name || mid,
      owed: perPerson,
      isPayer: mid === payer
    }));
    setPendingBreakdown({
      ...expenseFields,
      amount,
      owedDetails,
      perPerson
    });
    setShowConfirmation(true);
  }

  // Confirm and actually add expense to group context
  function handleConfirmAddExpense() {
    if (!pendingBreakdown) return;
    // Call GroupsContext API
    addExpense(group.id, {
      title: pendingBreakdown.title.trim(),
      amount: Number(pendingBreakdown.amount),
      payer: pendingBreakdown.payer,
      date: pendingBreakdown.date,
      splitWith: pendingBreakdown.splitWith
    });
    setShowAddExpense(false);
    resetExpenseForm();
  }

  const { theme, toggleTheme } = useTheme();

  if (!group) return <div>Group not found.</div>;

  // Get inline form for adding
  function AddExpenseForm() {
    // Responsive: form is a clean card
    return (
      <form
        className="sq-form-card"
        style={{
          background: "#fff",
          padding: "2rem 1.5rem 1.5rem 1.5rem",
          boxShadow: "0 4px 27px #FFD27035, 0 1.5px 7px #4f8a8b14",
          borderRadius: 17,
          margin: "2.1rem auto 1.8rem auto",
          maxWidth: 420,
          width: "100%",
          position: "relative",
          zIndex: 2100,
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem"
        }}
        autoComplete="off"
        onSubmit={handlePreviewBreakdown}
        aria-label="Add expense form"
      >
        <h3
          className="sq-header"
          style={{
            margin: 0,
            color: "var(--color-accent, #FF5959)",
            fontWeight: 800,
            fontSize: "1.29rem"
          }}
        >
          Add Expense <FaMoneyBillWave style={{marginLeft:6}}/>
        </h3>
        <div style={{display:"flex", flexDirection:"column", gap:6, marginBottom:5}}>
          <input
            type="text"
            placeholder="Title, e.g. Dinner"
            value={expenseFields.title}
            onChange={e => setExpenseFields(f => ({...f, title: e.target.value }))}
            required
            style={{padding:"0.65em",fontSize:"1.04em", border:"1.5px solid #e9ecef", borderRadius:8, width:"100%"}}
          />
          <input
            type="number"
            placeholder="Amount (₹)"
            value={expenseFields.amount}
            onChange={e => setExpenseFields(f => ({...f, amount: e.target.value }))}
            required
            min={1}
            style={{padding:"0.65em",fontSize:"1.04em", border:"1.5px solid #e9ecef", borderRadius:8, width:"100%"}}
          />
          <div style={{display:"flex", gap:10}}>
            <label style={{flex:"1 1 auto", fontSize:"0.97em"}}>
              Payer
              <select
                value={expenseFields.payer}
                onChange={e => setExpenseFields(f=>({...f, payer: e.target.value}))}
                required
                style={{marginLeft:7, borderRadius:7, padding:"0.5em", border:"1.5px solid #e9ecef"}}
              >
                {members.map(m => (
                  <option value={m.id} key={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label style={{flex:"1 1 auto", fontSize:"0.97em"}}>
              Date
              <input
                type="date"
                value={expenseFields.date}
                max={new Date().toISOString().slice(0,10)}
                onChange={e => setExpenseFields(f=>({...f, date: e.target.value}))}
                required
                style={{marginLeft:7, borderRadius:7, padding:"0.5em", border:"1.5px solid #e9ecef"}}
              />
            </label>
          </div>
          <label style={{marginBottom:3, fontWeight:500, fontSize:"0.97em"}}>
            Split With:
            <span style={{ marginLeft: 7 }}>
              {members.map(m => (
                <label key={m.id} style={{marginRight:14,fontWeight:400, fontSize:"0.98em"}}>
                  <input
                    type="checkbox"
                    checked={expenseFields.splitWith.includes(m.id)}
                    onChange={e => {
                      // Add or remove from array
                      if (e.target.checked) setExpenseFields(f=>({...f, splitWith:[...f.splitWith, m.id]}));
                      else setExpenseFields(f=>({...f, splitWith:f.splitWith.filter(id=>id !== m.id)}));
                    }}
                    required
                    style={{marginRight:4}}
                  />
                  {m.name}
                </label>
              ))}
            </span>
          </label>
        </div>
        {addError && <div style={{color:"#FF5959",marginBottom:3}}>{addError}</div>}
        <div style={{display:"flex",gap:14,justifyContent:"flex-end",alignItems:"center"}}>
          <button
            type="button"
            className="theme-toggle"
            style={{background:"var(--color-primary,#4F8A8B)",minWidth:75,color:"#fff"}}
            onClick={handleAddExpenseCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="theme-toggle"
            style={{background:"var(--color-accent,#FF5959)",minWidth:110, color:"#fff"}}
          >
            Preview & Confirm
          </button>
        </div>
      </form>
    );
  }

  // Inline breakdown summary before confirmation
  function BreakdownConfirmation() {
    const { title, amount, payer, date, splitWith, owedDetails, perPerson } = pendingBreakdown;
    const getName = (id) => members.find(m => m.id === id)?.name || id;
    return (
      <div
        className="sq-form-card"
        style={{
          margin: "1.2rem auto",
          maxWidth: 420,
          width: "100%",
          background: "#fff",
          borderRadius: 17,
          boxShadow: "0 5px 32px #FFD27018, 0 1.5px 7px #4F8A8B10",
          padding: "2rem 1.3rem 1.3rem 1.3rem",
          display: "flex",
          flexDirection: "column",
          gap: "1rem"
        }}
      >
        <h4 style={{ color:"var(--color-accent,#FF5959)", fontWeight:800, margin:"0 0 0.7rem 0" }}>
          Confirm Split <FaUsers style={{marginLeft:7,marginBottom:-3}}/>
        </h4>
        <div style={{background:"#f9f9f9", borderRadius:10, padding:"11px 0.8em", color:"#4F8A8B", fontWeight:500, fontSize:"1.08em", marginBottom:4}}>
          <b>{title}</b> — <span style={{color:"#FF5959"}}>₹{amount}</span> <br/>
          Paid by: <span style={{color:"#19b859"}}>{getName(payer)}</span> | Split with: <b>{splitWith.length}</b> <br />
          Date: {date}
        </div>
        <div style={{ background: "#f8f0fa", padding: "8px", borderRadius: 8, marginBottom: 2, fontSize:"1.02em" }}>
          <b>Each pays:</b>
          <span style={{marginLeft:9, color:"#FF5959", fontWeight:600}}>₹{perPerson}</span>
          <ul style={{margin:"0 0 0.8em 0.8em", padding:0,listStyle:"none", fontSize:"0.97em"}}>
            {owedDetails.map(o =>
              <li key={o.id} style={{color: o.isPayer ? "#19b859" : "#333", fontWeight: o.isPayer ? 700 : 600 }}>
                {o.isPayer
                  ? <>🧍‍♂️ {o.name} (payer): <span style={{ color: "#19b859" }}>gets reimbursed</span></>
                  : <><span role="img" aria-label="owes">🧍</span> {o.name} pays <b style={{ color: "#FF5959" }}>₹{o.owed}</b> to {getName(payer)} <span style={{ fontSize: "1.1em" }}>💸</span></>
                }
              </li>
            )}
          </ul>
        </div>
        <div style={{display:"flex", gap:15, justifyContent:"flex-end"}}>
          <button
            type="button"
            className="theme-toggle"
            style={{background:"var(--color-primary,#4F8A8B)",minWidth:80,color:"#fff"}}
            onClick={() => setShowConfirmation(false)}
          >
            Edit
          </button>
          <button
            className="theme-toggle"
            style={{background:"var(--color-accent,#FF5959)",minWidth:132,color:"#fff"}}
            onClick={handleConfirmAddExpense}
          >
            Confirm & Add
          </button>
        </div>
      </div>
    );
  }

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

      {/* --- Add Expense Embedded UI (FAB, form, confirmation) --- */}
      <div style={{ minHeight: 40 }}>
        {/* Floating Action Button */}
        {!showAddExpense && !showConfirmation && (
          <FAB
            icon={<FaPlus />}
            label="Add Expense"
            onClick={handleAddExpenseStart}
            style={{
              position: "fixed",
              bottom: "2.1rem",
              right: "2.1rem",
              zIndex: 2000
            }}
            data-testid="add-expense-fab"
          />
        )}

        {/* Add Expense Form */}
        {showAddExpense && !showConfirmation && (
          <AddExpenseForm />
        )}

        {/* Breakdown confirmation */}
        {showConfirmation && pendingBreakdown && (
          <BreakdownConfirmation />
        )}
      </div>

      <h3 style={{ marginTop: "2rem" }}>Expenses</h3>
      <ExpenseList expenses={group.expenses} members={members} />

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
      {/* Embedded FAB form responsive styling */}
      <style>{`
        .sq-fab {
          right: 2.1rem; bottom: 2.1rem;
        }
        @media (max-width: 900px) {
          .sq-fab { right: 1rem !important; bottom: 1.2rem !important; width: 52px; height: 52px; font-size: 1.5rem; }
        }
        @media (max-width: 480px) {
          .sq-fab { right: 0.3rem !important; bottom: 0.5rem !important; }
          .sq-form-card { padding: 1.09rem 0.72rem 1.2rem 0.81rem !important; }
        }
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
 * Per-person owed summary confirmation UI: after form submit, before final add.
 * Shows a summary of the calculated splits and lets user confirm adding the expense.
 */
function PerPersonOwedSummary({ expense, members, onConfirm, onCancel }) {
  const { title, amount, payer, date, splitWith, owedDetails, perPerson } = expense;
  // Get member name
  const getName = (id) => members.find((m) => m.id === id)?.name || id;
  return (
    <div
      className="sq-form-card"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        width: 380,
        maxWidth: "97vw",
        transform: "translate(-50%,-50%)",
        zIndex: 2300,
        background: "#fff",
        borderRadius: 17,
        padding: "2.1rem 1.7rem 1.7rem 1.7rem",
        boxShadow: "0 4px 38px #FFD27069, 0 2px 9px #FFD2702b",
        display: "flex",
        flexDirection: "column",
        gap: "1.05rem",
        alignItems: "center",
        animation: "modalIn 0.16s linear both",
      }}
      tabIndex={-1}
    >
      <h3 style={{
        color: "var(--color-accent, #FF5959)",
        fontWeight: 900,
        fontSize: "1.4rem",
        marginBottom: 6
      }}>
        Confirm Split <span role="img" aria-label="summary">🧾</span>
      </h3>
      <div style={{
        width: "100%",
        fontWeight: 500,
        color: "#4F8A8B",
        background: "#f5fdff",
        padding: "8px 14px",
        borderRadius: 8,
        marginBottom: 7,
      }}>
        <b>{title}</b> &mdash; <span style={{color:"#FF5959"}}>₹{amount}</span> <br />
        Paid by: <span style={{color:"#19b859"}}>{getName(payer)}</span>{" "}|{" "}
        Split between <b>{splitWith.length}</b> member{splitWith.length > 1 ? "s" : ""} <br />
        Date: {date}
      </div>
      <div style={{
        width: "100%",
        marginBottom: 6,
        borderRadius: 7,
        background: "#f8f0fa",
        fontSize: "1.01em",
        padding: "10px 10px 7px 10px"
      }}>
        <b>Each member owes:</b>
        <ul style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 7,
          marginTop: 6,
        }}>
          {owedDetails.map((o) => (
            <li key={o.id} style={{ color: o.isPayer ? "#19b859" : "#333", fontWeight: o.isPayer ? 700 : 600 }}>
              {o.isPayer
                ? <>🟢 {o.name} (payer): <span style={{color:"#19b859"}}>gets reimbursed</span></>
                : <>{o.name} pays <span style={{fontWeight:700}}>₹{o.owed}</span></>
              }
            </li>
          ))}
        </ul>
      </div>
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 16,
        marginTop: 9,
        alignItems: "center",
        width: "100%",
        justifyContent: "flex-end"
      }}>
        <button
          className="theme-toggle"
          style={{
            background: "var(--color-primary,#4F8A8B)",
            color: "#fff",
            minWidth: 90,
          }}
          onClick={onCancel}
        >
          Edit
        </button>
        <button
          className="theme-toggle"
          style={{
            background: "var(--color-accent,#FF5959)",
            color: "#fff",
            minWidth: 130,
          }}
          onClick={onConfirm}
        >
          Confirm & Add
        </button>
      </div>
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
