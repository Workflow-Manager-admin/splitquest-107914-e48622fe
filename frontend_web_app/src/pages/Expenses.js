import React, { useState, useMemo } from "react";
import { useGroups } from "../GroupsContext";
import AddExpenseModal from "../components/AddExpenseModal";
import { FAB } from "../components/FAB";
import { FaPlus, FaTrash, FaEdit, FaMoneyBillWave, FaCalendarAlt, FaUser, FaUsers } from "react-icons/fa";

/**
 * Expenses page: modern, playful, responsive UI for adding and viewing group expenses.
 * - Floating "+" button opens modal form for adding a new expense.
 * - Expenses are split equally, breakdown shown with emojis/icons.
 * - Expenses saved to local state, editable/deletable.
 * - Responsive card layout for mobile/desktop.
 * - All group members selectable for splits.
 * - Modern, card-based, playful style.
 */

// Helper for date formatting
function formatDate(dt) {
  if (!dt) return "";
  try {
    const d = new Date(dt);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return dt;
  }
}

// Card style
const expenseCardStyle = {
  background: "var(--card-bg,#fff)",
  borderRadius: "19px",
  boxShadow: "0 3px 13px 0 #ffbe4e18, 0 1.5px 7px #4f8a8b12",
  padding: "1.2rem 1.7rem 1.2rem 1.3rem",
  marginBottom: "1.17rem",
  minWidth: 0,
  display: "flex",
  flexDirection: "column",
  gap: "0.6rem",
  position: "relative",
  transition: "box-shadow .17s cubic-bezier(.23,1,.32,1), transform .19s",
};

const cardActionsStyle = {
  display: "flex",
  gap: 10,
  marginLeft: "auto",
  marginTop: 5
};

// PUBLIC_INTERFACE
export default function Expenses() {
  /**
   * The Expenses page - add, view, edit, and delete expenses in a playful,
   * mobile-friendly, card-based UI. Saves to local context (reset on reload).
   */
  const {
    groups,
    getAllUsers,
    currentUserId,
    calculateNetBalances
  } = useGroups();
  // For demo: we'll pick the *first* group (can enhance for real group selection)
  const group = groups[0];
  const groupId = group ? group.id : null;
  const members = group ? group.members : [];

  // Local state for expenses (shadow copy for UI edits)
  const [expenses, setExpenses] = useState(() =>
    group?.expenses ? [...group.expenses] : []
  );

  // Track modal state, editing
  const [showModal, setShowModal] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState(null);
  const [pendingBreakdown, setPendingBreakdown] = useState(null);

  // Re-sync to context changes in group.expenses
  React.useEffect(() => {
    if (group?.expenses) setExpenses([...group.expenses]);
  }, [group]);

  // Modal "onSubmit": add or edit expense
  function handleAddExpense(newExpense) {
    // Prepare breakdown before final save
    const splitNum = Number(newExpense.amount);
    const splitWith = newExpense.splitWith;
    const perPerson = Math.round((splitNum / splitWith.length) * 100) / 100;
    const owedDetails = splitWith.map(id => {
      const m = members.find(mem => mem.id === id);
      return {
        id,
        name: m ? m.name : id,
        owed: perPerson,
        isPayer: id === newExpense.payer
      };
    });
    setPendingBreakdown({
      ...newExpense,
      owedDetails,
      perPerson,
    });
    setShowModal(false);
  }

  // Confirm breakdown: save expense to state
  function handleConfirmAddExpense() {
    if (!pendingBreakdown) return;
    if (editExpenseId) {
      setExpenses(prev =>
        prev.map(exp =>
          exp.id === editExpenseId
            ? { ...pendingBreakdown, id: editExpenseId }
            : exp
        )
      );
      setEditExpenseId(null);
    } else {
      // Assign ID
      const newId = "e" + (Date.now() + Math.floor(Math.random() * 100000));
      setExpenses(prev =>
        [
          ...prev,
          { ...pendingBreakdown, id: newId, createdAt: new Date().toISOString() }
        ]
      );
    }
    setPendingBreakdown(null);
  }

  function handleEditExpense(exp) {
    setEditExpenseId(exp.id);
    setPendingBreakdown({
      ...exp
    });
    setShowModal(true);
  }

  function handleDeleteExpense(id) {
    setExpenses(prev => prev.filter(exp => exp.id !== id));
  }

  function handleCancelBreakdown() {
    setPendingBreakdown(null);
    setShowModal(true);
    setEditExpenseId(null);
  }

  // Responsive card grid
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
    gap: "1.7rem",
    marginTop: "2.1rem",
    marginBottom: "1.4rem"
  };

  // Helper to get name from id
  const getName = id => members.find(m => m.id === id)?.name || id;

  // Save state to browser (for local-demo persistence)
  React.useEffect(() => {
    window.localStorage.setItem("demo-expenses", JSON.stringify(expenses));
  }, [expenses]);

  // Load from localstorage on mount for demo-resume
  React.useEffect(() => {
    const saved = window.localStorage.getItem("demo-expenses");
    if (saved) {
      try {
        const arr = JSON.parse(saved);
        if (Array.isArray(arr)) setExpenses(arr);
      } catch { }
    }
  }, []);

  // UI
  return (
    <div style={{
      maxWidth: 888,
      margin: "0 auto",
      padding: "2.5rem 1.2rem",
      position: "relative"
    }}>
      <h2 className="sq-header" style={{
        color: "var(--color-accent, #FF5959)",
        fontWeight: 900,
        fontSize: "2.11rem",
        letterSpacing: 0.8,
        marginBottom: 8
      }}>
        Expenses <span role="img" aria-label="Expenses">💸</span>
      </h2>
      <div style={{ color: "#4F8A8B", fontSize: "1.09rem", marginBottom: 20 }}>
        Add expenses for your group and watch the playful breakdown! Everything here is local in your browser for demo purposes.
      </div>
      {!groupId ? (
        <div style={{
          padding: "2.2rem 1.6rem", background: "#fff4f4",
          borderRadius: 15, color: "#FF5959", fontWeight: 600
        }}>
          Create a group and add members to use Expenses!
        </div>
      ) : (
        <>
          {/* Expenses Card List */}
          <div style={gridStyle}>
            {expenses.length ? expenses
              .slice()
              .sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date))
              .map(exp => (
                <div key={exp.id || exp.title}
                  className="sq-card"
                  style={{
                    ...expenseCardStyle,
                    borderLeft: "7px solid #FF5959",
                    minHeight: "152px",
                    position: "relative"
                  }}
                >
                  <div style={{
                    display: "flex", alignItems: "center",
                    marginBottom: 6
                  }}>
                    <span style={{ fontWeight: 700, fontSize: "1.14em", color: "#FF5959", marginRight: 7 }}>
                      {exp.title} <FaMoneyBillWave style={{ marginLeft: 4 }} />
                    </span>
                    <span style={{fontSize:"0.92em", marginLeft: 13, color:"#8b8381"}} title="Timestamp">
                      <FaCalendarAlt style={{marginRight:2, opacity:0.9}}/>{formatDate(exp.date || exp.createdAt)}
                    </span>
                  </div>
                  <div style={{fontSize:"1.13em",marginBottom:9}}>
                    <span>💸 <b>₹{exp.amount}</b> spent by <span style={{ color: "#19b859" }}>{getName(exp.payer)}</span></span>
                  </div>
                  <div style={{
                    background: "#f6fbff",
                    padding: "0.69rem 1.1rem",
                    borderRadius: 8,
                    marginBottom: 7
                  }}>
                    {/* Show breakdown */}
                    <span style={{color:"#6f63cf",fontWeight:700,fontSize:"1.025em"}}>
                      Split <FaUsers />: {" "}
                      {exp.splitWith.map(getName).join(", ")}
                    </span>
                    <ul style={{
                      margin: "0.75em 0 0 0.8em",
                      padding: 0,
                      fontSize: "0.98em",
                      color: "#222",
                      listStyle: "none",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4
                    }}>
                      {/* Show playful breakdown */}
                      {exp.splitWith.map(mid => (
                        <li key={mid} style={{
                          display: "flex",
                          alignItems: "center",
                        }}>
                          {mid === exp.payer
                            ? <span title="Payer" aria-label="Payer" style={{ color: "#19b859", marginRight: 7 }}>🧍‍♂️</span>
                            : <span role="img" aria-label="Owes" style={{ marginRight: 7 }}>🧍</span>
                          }
                          <span>
                            <b>{getName(mid)}</b> {mid === exp.payer ? "paid" : "owes"}
                            {mid !== exp.payer && (
                              <>
                                <span style={{ color: "#FF5959", fontWeight: 700 }}> ₹{Math.round((exp.amount / exp.splitWith.length) * 100) / 100}</span>
                                {" "}to <b style={{ color: "#19b859" }}>{getName(exp.payer)}</b>
                              </>
                            )}
                            {mid === exp.payer &&
                              <span style={{ color: "#19b859", fontWeight: 700, marginLeft: 5 }}>
                                {exp.splitWith.length > 1 ? ` gets reimbursed` : ""}
                              </span>
                            }
                            <span style={{ fontSize: "1.1em", marginLeft: 5 }}>💸</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={cardActionsStyle}>
                    <button
                      style={{
                        background: "var(--fab-bg,#FF5959)",
                        color: "#000",
                        borderRadius: 6,
                        border: "none",
                        padding: "6px 13px",
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: "1.01em",
                      }}
                      aria-label="Edit"
                      title="Edit"
                      onClick={() => handleEditExpense(exp)}
                    ><FaEdit /> Edit</button>
                    <button
                      style={{
                        background: "var(--color-primary,#4F8A8B)",
                        color: "#fff",
                        borderRadius: 6,
                        border: "none",
                        padding: "6px 13px",
                        cursor: "pointer",
                        fontWeight: 500,
                        fontSize: "1.01em"
                      }}
                      aria-label="Delete"
                      title="Delete"
                      onClick={() => handleDeleteExpense(exp.id)}
                    ><FaTrash style={{marginRight:2}} />Delete</button>
                  </div>
                </div>
              )) : (
              <div style={{
                color: "#aaa", padding: "2.2rem 1rem", background: "#fbfbfb",
                borderRadius: 17, textAlign: "center", fontSize: "1.17em"
              }}>
                No expenses yet! Click the <b>+</b> below to add your first group expense.
              </div>
            )}
          </div>
          {/* Floating Action Button */}
          <FAB
            icon={<FaPlus />}
            label="Add Expense"
            onClick={() => {
              setShowModal(true);
              setEditExpenseId(null);
              setPendingBreakdown(null);
            }}
            style={{
              position: "fixed",
              bottom: "2.1rem",
              right: "2.1rem",
              zIndex: 2000
            }}
            data-testid="add-expense-fab"
          />

          {/* Add/Edit Expense Modal */}
          <AddExpenseModal
            members={members}
            currentUserId={currentUserId}
            open={showModal}
            onClose={() => {
              setShowModal(false);
              setEditExpenseId(null);
            }}
            onSubmit={handleAddExpense}
          />

          {/* Breakdown Confirmation */}
          {pendingBreakdown && (
            <BreakdownConfirm
              expense={pendingBreakdown}
              members={members}
              onConfirm={handleConfirmAddExpense}
              onCancel={handleCancelBreakdown}
              isEdit={Boolean(editExpenseId)}
            />
          )}

        </>
      )}
      {/* Responsive styles for bottom drawer/modal on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .sq-fab { right: 1rem !important; bottom: 1.2rem !important; width: 52px; height: 52px; font-size: 1.5rem; }
        }
        @media (max-width: 480px) {
          .sq-fab { right: 0.3rem !important; bottom: 0.5rem !important; }
          .sq-card { padding: 1.09rem 0.72rem 1.2rem 0.81rem !important; }
        }
      `}</style>
    </div>
  );
}

/**
 * Modal showing a breakdown of the split, confirmation before saving expense.
 */
function BreakdownConfirm({ expense, members, onConfirm, onCancel, isEdit }) {
  const { title, amount, payer, date, splitWith, owedDetails, perPerson } = expense;
  const getName = id => members.find(m => m.id === id)?.name || id;
  return (
    <div className="sq-form-card"
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        width: 370,
        maxWidth: "97vw",
        transform: "translate(-50%,-50%)",
        zIndex: 2101,
        background: "#fff",
        borderRadius: 17,
        padding: "2.1rem 1.5rem 1.5rem 1.5rem",
        boxShadow: "0 4px 36px #FFD27059, 0 2px 9px #FFD2702b",
        display: "flex",
        flexDirection: "column",
        gap: "1.1rem",
        alignItems: "center",
        animation: "modalIn 0.15s linear both",
      }}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      <h3 style={{
        color: "var(--color-accent, #FF5959)",
        fontWeight: 800,
        fontSize: "1.24rem",
        marginBottom: 6
      }}>
        {isEdit ? "Update" : "Confirm"} Split <span role="img" aria-label="summary">🧾</span>
      </h3>
      <div style={{
        width: "100%",
        fontWeight: 500,
        color: "#4F8A8B",
        background: "#f5fdff",
        padding: "8px 12px",
        borderRadius: 8,
        marginBottom: 7,
        fontSize: "1.04em"
      }}>
        <b>{title}</b> &mdash; <span style={{ color: "#FF5959" }}>₹{amount}</span> <br />
        Paid by: <span style={{ color: "#19b859" }}>{getName(payer)}</span>
        <span>{" | "}Split: <b>{splitWith.length}</b> <FaUsers style={{marginBottom:-2}} /></span> <br />
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
        <b>Each pays:</b><span style={{marginLeft:9, color:"#FF5959", fontWeight:600}}>₹{perPerson}</span>
        <ul style={{
          listStyle: "none",
          padding: 0,
          margin: "7px 0 0 0.8em",
          display: "flex",
          flexDirection: "column",
          gap: 6
        }}>
          {owedDetails.map(o => (
            <li key={o.id} style={{ color: o.isPayer ? "#19b859" : "#333", fontWeight: o.isPayer ? 700 : 600 }}>
              {o.isPayer
                ? <>🧍‍♂️ {o.name} (payer): <span style={{ color: "#19b859" }}>gets reimbursed</span></>
                : <><span role="img" aria-label="owes">🧍</span> {o.name} pays <span style={{ fontWeight: 700, color: "#FF5959" }}>₹{o.owed}</span> to {getName(payer)} <span style={{ fontSize: "1.1em" }}>💸</span></>
              }
            </li>
          ))}
        </ul>
      </div>
      <div style={{
        display: "flex",
        flexDirection: "row",
        gap: 13,
        marginTop: 7,
        justifyContent: "flex-end",
        width: "100%"
      }}>
        <button
          type="button"
          className="theme-toggle"
          style={{
            background: "var(--color-primary,#4F8A8B)",
            minWidth: 90,
            color: "#fff"
          }}
          onClick={onCancel}
        >
          Edit
        </button>
        <button
          className="theme-toggle"
          style={{
            background: "var(--color-accent,#FF5959)",
            minWidth: 130,
            color: "#fff"
          }}
          onClick={onConfirm}
        >
          {isEdit ? "Update Expense" : "Confirm & Add"}
        </button>
      </div>
    </div>
  );
}
