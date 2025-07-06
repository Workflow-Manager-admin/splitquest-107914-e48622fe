import React, { useState, useEffect } from "react";

/**
 * Modal form for adding a new expense in a group.
 * Fields: annotator (name), title, amount, payer, date, selectable split members.
 * Splits are auto-calculated equally among selected members.
 */
// PUBLIC_INTERFACE
export default function AddExpenseModal({
  members = [],
  currentUserId,
  onSubmit,
  onClose,
  open,
}) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [payer, setPayer] = useState(currentUserId || "");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [splitMembers, setSplitMembers] = useState(
    members.map((m) => m.id)
  ); // Default: all selected
  const [showError, setShowError] = useState("");
  const [animClass, setAnimClass] = useState("");

  useEffect(() => {
    if (open) {
      // Reset form on open
      setTitle("");
      setAmount("");
      setPayer(currentUserId || "");
      setDate(new Date().toISOString().slice(0, 10));
      setSplitMembers(members.map((m) => m.id));
      setShowError("");
      setAnimClass("sq-modal-in");
    }
  }, [open, members, currentUserId]);

  if (!open) return null;

  // Utility to get member object/name by id
  const getName = (id) => members.find((m) => m.id === id)?.name || id;

  // ---- Modern, fixed centering & overlay modal logic:
  // .sq-modal-outer: fixed, inset 0, z-index very high, pointer-events all
  // .sq-modal-backdrop: fixed, inset 0, background rgba(0,0,0,0.5), z-index one below modal
  // .sq-modal-content: centered card, max-width responsive, touch safe, border-radius

  // Handle checkbox toggle for splitting
  function handleSplitMemberToggle(id) {
    setSplitMembers((prev) =>
      prev.includes(id)
        ? prev.filter((mid) => mid !== id)
        : [...prev, id]
    );
  }

  // Calculate equal split preview
  const amountNum = Number(amount);
  const validSplit =
    amountNum > 0 && splitMembers.length > 0 && !isNaN(amountNum);
  const splitValue = validSplit
    ? Math.round((amountNum / splitMembers.length) * 100) / 100
    : 0;

  function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) {
      setShowError("Expense title is required.");
      return;
    }
    if (!amountNum || amountNum <= 0 || isNaN(amountNum)) {
      setShowError("Valid amount required.");
      return;
    }
    if (!payer) {
      setShowError("Payer selection is required.");
      return;
    }
    if (!splitMembers.length) {
      setShowError("Select at least one member to split with.");
      return;
    }
    if (!date) {
      setShowError("Please enter a valid date.");
      return;
    }
    setShowError("");
    // PUBLIC_INTERFACE: Returned payload shape
    onSubmit({
      title: title.trim(),
      amount: amountNum,
      payer,
      date,
      splitWith: splitMembers,
      annotator: getName(currentUserId),
    });
  }

  // Modal fadeout on close
  function handleClose() {
    setAnimClass("sq-modal-out");
    setTimeout(() => {
      setShowError("");
      if (onClose) onClose();
    }, 180);
  }

  // Simple inline modal style
  return (
    <div className={`sq-modal-outer ${animClass}`} tabIndex={-1} aria-modal="true" role="dialog">
      {/* Centered, always fixed backdrop layered below the modal */}
      <div className="sq-modal-backdrop" onClick={handleClose} />
      <form
        className="sq-form-card sq-modal-content"
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          width: "100%",
          maxWidth: 380,
          minWidth: 0,
          transform: "translate(-50%,-50%)",
          zIndex: 2210,
          background: "#fff",
          borderRadius: 18,
          padding: "2.1rem 1.6rem 1.6rem 1.6rem",
          boxShadow: "0 4px 36px #FFD27046, 0 2px 7px #FFD2701b",
          display: "flex",
          flexDirection: "column",
          gap: "1.1rem",
          animation: animClass === "sq-modal-out"
            ? "modalOut 0.18s linear both"
            : "modalIn 0.21s linear both",
        }}
        aria-modal="true"
        role="dialog"
        onSubmit={handleSubmit}
        autoComplete="off"
        tabIndex={0}
      >
        <h3
          className="sq-header"
          style={{
            marginBottom: 3,
            color: "var(--color-accent, #FF5959)",
            fontWeight: 800,
            fontSize: "1.45rem",
          }}
        >
          Add Expense
        </h3>
        <label>
          Annotator
          <input
            type="text"
            value={getName(currentUserId)}
            readOnly
            style={{
              marginLeft: 8,
              minWidth: 160,
              border: "1.5px solid #dadada",
              borderRadius: 7,
              background: "#f3f3fc",
              color: "#b8b2bd",
              fontWeight: 600,
            }}
          />
        </label>
        <label>
          Title
          <input
            type="text"
            required
            placeholder="Expense Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              marginLeft: 8,
              minWidth: 120,
            }}
          />
        </label>
        <label>
          Amount
          <input
            type="number"
            required
            placeholder="Amount (₹)"
            min={0}
            step={0.01}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              marginLeft: 8,
              minWidth: 70,
            }}
          />
        </label>
        <label>
          Paid by
          <select
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            required
            style={{
              marginLeft: 8,
              minWidth: 90,
            }}
          >
            <option value="" disabled>
              --Choose--
            </option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{
              marginLeft: 8,
            }}
          />
        </label>
        <label>
          Split With
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 13,
              marginTop: 5,
            }}
          >
            {members.map((m) => (
              <label key={m.id} style={{ fontWeight: 500 }}>
                <input
                  type="checkbox"
                  checked={splitMembers.includes(m.id)}
                  onChange={() => handleSplitMemberToggle(m.id)}
                  disabled={members.length < 2}
                  style={{ marginRight: 5 }}
                />
                {m.name}
              </label>
            ))}
          </div>
        </label>
        {validSplit && (
          <div
            style={{
              fontSize: "0.98em",
              color: "#4F8A8B",
              background: "#f9ecec",
              borderRadius: 6,
              padding: "7px 12px",
              margin: "5px 0",
            }}
          >
            Each selected member pays <b>₹{splitValue}</b>
          </div>
        )}
        {showError && (
          <div style={{ color: "#FF5959", marginBottom: 4 }}>{showError}</div>
        )}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 13,
            marginTop: 7,
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="theme-toggle"
            style={{
              background: "var(--color-primary,#4F8A8B)",
              minWidth: 90,
              color: "#fff",
            }}
            onClick={handleClose}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="theme-toggle"
            style={{
              background: "var(--color-accent,#FF5959)",
              minWidth: 110,
              color: "#fff",
            }}
          >
            Add Expense
          </button>
        </div>
      </form>
      <style>{`
        /* --- Modal & Overlay Styling for AddExpenseModal --- */
        .sq-modal-outer {
          z-index: 9999; /* higher than everything else */
          position: fixed;
          inset: 0;
          pointer-events: all;
          display: flex;
          justify-content: center;
          align-items: center;
          background: none !important;
        }
        .sq-modal-backdrop {
          position: fixed;
          inset: 0;
          width: 100vw; height: 100vh;
          background: rgba(0,0,0,0.5);
          z-index: 9998;
          pointer-events: all;
          touch-action: none;
          /* Optionally, subtle blur for more focus */
          backdrop-filter: blur(2.5px);
          transition: background 0.22s;
        }
        .sq-modal-content {
          box-sizing: border-box;
          width: 95vw;
          max-width: 380px;
          min-width: 0;
          margin: 0 auto;
          border-radius: 18px;
          padding: 2.1rem 1.6rem 1.6rem 1.6rem;
          background: #fff;
          z-index: 10000;
          /* Box shadow matches playful card style, pops above overlay */
          box-shadow:
            0 4px 36px #FFD27046,
            0 2px 7px #FFD2701b;
          outline: none;
          touch-action: manipulation;
          /* Animate pop/fade */
        }
        @media (max-width: 900px) {
          .sq-modal-content {
            width: 99vw;
            max-width: 97vw;
            min-width: 0;
            padding: 1.5rem 0.7rem 1.15rem 0.7rem;
            border-radius: 14px;
          }
        }
        @media (max-width: 520px) {
          .sq-modal-content {
            padding: 1.25rem 2vw 1.01rem 2vw !important;
            border-radius: 12px;
          }
        }
        @media (max-width: 370px) {
          .sq-modal-content {
            padding: 0.95rem 1vw 0.8rem 1vw !important;
            border-radius: 9px;
          }
        }
        @keyframes modalIn {
          from{ opacity: 0; transform: scale(0.97) translate(-50%,-46%);}
          to{ opacity: 1; transform: scale(1) translate(-50%,-50%);}
        }
        @keyframes modalOut {
          from{ opacity: 1; transform: scale(1) translate(-50%,-50%);}
          to{ opacity: 0; transform: scale(0.98) translate(-50%,-48%);}
        }
        .sq-modal-in { animation: modalIn 0.21s both;}
        .sq-modal-out { animation: modalOut 0.18s both;}
      `}</style>
    </div>
  );
}
