import React, { useMemo, useState } from "react";
import { useGroups } from "../GroupsContext";
import ReceiptScanner from "./ReceiptScanner";

// PUBLIC_INTERFACE
export default function GroupDashboard({ groupId, onBack }) {
  const {
    getGroupById,
    getMembersForGroup,
    calculateNetBalances,
    addExpense,
    currentUserId,
  } = useGroups();
  const group = getGroupById(groupId);
  const members = group ? getMembersForGroup(group) : [];
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showReceiptScanner, setShowReceiptScanner] = useState(false);

  const balances = useMemo(
    () => (group ? calculateNetBalances(group.expenses, members) : {}),
    [group, members]
  );

  if (!group) return <div>Group not found.</div>;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: "2rem",
        margin: "2rem 0",
        boxShadow: "0 2px 14px #4f8a8b1a",
      }}
    >
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
      <div>
        <div style={{ display: "flex", gap: "1rem", marginBottom: 20 }}>
          <button
            className="theme-toggle"
            onClick={() => {
              setShowAddExpense((v) => !v);
              setShowReceiptScanner(false);
            }}
            style={{ marginBottom: 0 }}
          >
            {showAddExpense ? "Cancel" : "+ Add Expense"}
          </button>
          <button
            className="theme-toggle"
            style={{ marginBottom: 0, background: "#11c447" }}
            onClick={() => {
              setShowReceiptScanner(true);
              setShowAddExpense(false);
            }}
            title="Use OCR to scan a bill or receipt and auto-extract items"
          >
            + Scan Receipt
          </button>
        </div>
        {showAddExpense && (
          <AddExpenseForm
            group={group}
            members={members}
            onAdd={addExpense}
            currentUserId={currentUserId}
            onDone={() => setShowAddExpense(false)}
          />
        )}
        {showReceiptScanner && (
          <ReceiptScanner
            groupId={group.id}
            onDone={() => setShowReceiptScanner(false)}
          />
        )}
      </div>
      <h3 style={{ marginTop: "2rem" }}>Expenses</h3>
      <ExpenseList expenses={group.expenses} members={members} />
      <h3 style={{ marginTop: "2rem" }}>Balances</h3>
      <BalancesView
        balances={balances}
        members={members}
        currentUserId={currentUserId}
      />
    </div>
  );
}

/**
 * Expense entry form, fields: title, amount, date, payer, splitWith.
 */
function AddExpenseForm({
  group,
  members,
  onAdd,
  currentUserId,
  onDone,
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [payer, setPayer] = useState(currentUserId);
  const [splitWith, setSplitWith] = useState(members.map((m) => m.id));
  const [error, setError] = useState("");

  function toggleSplitWith(id) {
    setSplitWith((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }
  function handleSubmit(e) {
    e.preventDefault();
    if (
      !title.trim() ||
      !amount ||
      isNaN(parseFloat(amount)) ||
      splitWith.length === 0
    ) {
      setError("Please enter all required fields.");
      return;
    }
    onAdd(group.id, {
      title: title.trim(),
      amount: parseFloat(amount),
      date: date || new Date().toISOString().slice(0, 10),
      payer,
      splitWith,
    });
    setTitle("");
    setAmount("");
    setDate("");
    setPayer(currentUserId);
    setSplitWith(members.map((m) => m.id));
    setError("");
    if (onDone) onDone();
  }
  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#f8f9fa",
        padding: "1rem",
        borderRadius: 12,
        marginBottom: 18,
      }}
    >
      <div>
        <input
          required
          style={{ marginBottom: 8, width: 180 }}
          placeholder="Expense Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          required
          type="number"
          step="0.01"
          style={{ marginBottom: 8, width: 100 }}
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="date"
          style={{ marginBottom: 8 }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: 8 }}>
        <b>Payer:</b>{" "}
        <select value={payer} onChange={(e) => setPayer(e.target.value)}>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 8 }}>
        <b>Split with:</b>
        {members.map((m) => (
          <label key={m.id} style={{ marginLeft: 8 }}>
            <input
              type="checkbox"
              checked={splitWith.includes(m.id)}
              onChange={() => toggleSplitWith(m.id)}
            />{" "}
            {m.name}
          </label>
        ))}
      </div>
      {error && <div style={{ color: "#FF5959" }}>{error}</div>}
      <button className="theme-toggle" type="submit" style={{ marginTop: 6 }}>
        Add Expense
      </button>
    </form>
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
 */
function BalancesView({ balances, members, currentUserId }) {
  if (!balances || !members.length) return null;
  function renderOwes(mid) {
    return balances[mid].owes.length
      ? balances[mid].owes.map((o) => (
          <span key={o.to}>{`Owes ₹${o.amount} to ${balances[o.to].name}`}</span>
        ))
      : "—";
  }
  function renderGets(mid) {
    return balances[mid].gets.length
      ? balances[mid].gets.map((g) => (
          <span key={g.from}>{`Gets ₹${g.amount} from ${
            balances[g.from].name
          }`}</span>
        ))
      : "—";
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
