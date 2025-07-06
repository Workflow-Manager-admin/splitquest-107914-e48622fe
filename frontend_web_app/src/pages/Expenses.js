import React from 'react';

// PUBLIC_INTERFACE
export default function Expenses() {
  /**
   * Expense entry and history: add, split, view past expenses.
   * (Stub: To be implemented with calculation logic + forms + lists.)
   */
  return (
    <div style={{maxWidth:"680px",margin:"0 auto",padding:"2rem"}}>
      <h2>Expenses <span role="img" aria-label="Expenses">💸</span></h2>
      <button className="theme-toggle" style={{marginBottom:"1rem"}}>+ Add Expense</button>
      <div style={{marginTop: '1.5rem'}}>Expense history, split calculator, and entry forms will appear here.</div>
    </div>
  );
}
