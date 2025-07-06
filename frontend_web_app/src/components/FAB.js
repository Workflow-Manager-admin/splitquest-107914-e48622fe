import React from "react";

// PUBLIC_INTERFACE
export function FAB({ icon, label, onClick, style = {}, ...props }) {
  /**
   * Floating Action Button. Fixed in bottom right on mobile.
   * Usage: <FAB icon="+" label="Add" onClick={...} />
   */
  return (
    <button
      className="sq-fab"
      style={style}
      aria-label={label}
      title={label}
      onClick={onClick}
      {...props}
    >
      {icon}
      <span style={{
        position: "absolute",
        left: "-9999px",
        width: "1px",
        height: "1px",
        overflow: "hidden"
      }}>{label}</span>
    </button>
  );
}

export default FAB;
