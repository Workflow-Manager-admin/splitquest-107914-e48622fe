import React from "react";

/**
 * Renders a dashboard summary card with custom icon, value, label, and color.
 * Usage:
 *   <SummaryCard icon={...} value={50} label="You Owe" color="#FF5959" />
 */
// PUBLIC_INTERFACE
export default function SummaryCard({
  icon,
  value,
  label,
  color,
  onClick,
  loading = false,
  ...props
}) {
  const cardStyle = {
    background: `linear-gradient(110deg, ${color}20 60%, #fff9)`,
    borderRadius: "22px",
    boxShadow: `0 4px 32px 0 ${color}21, 0 1.5px 7px #4f8a8b10`,
    color: "#222",
    padding: "1.5rem 1.6rem",
    minWidth: 150,
    minHeight: 120,
    flex: "1 1 170px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    cursor: onClick ? "pointer" : "default",
    position: "relative",
    overflow: "hidden",
    transition:
      "box-shadow 0.18s cubic-bezier(.23,1,.32,1), transform 0.2s, background 0.22s",
    outline: "none",
    border: "none",
    userSelect: "none",
  };
  const iconStyle = {
    fontSize: 38,
    color,
    marginBottom: 5,
    filter: "drop-shadow(0 2px 9px #fff6)",
    transition: "transform 0.25s cubic-bezier(.23,1,.32,1)",
    opacity: loading ? 0.5 : 1,
  };
  const valueStyle = {
    fontSize: "2.1rem",
    fontWeight: 800,
    lineHeight: 1.08,
    color,
    opacity: loading ? 0.44 : 1,
    fontFamily: "inherit",
    marginBottom: 3,
    transition: "color 0.21s, opacity 0.18s",
  };
  const labelStyle = {
    fontWeight: 700,
    fontSize: "1.08rem",
    color: "#222",
    letterSpacing: 0.1,
    opacity: 0.88,
    textShadow: "0 1px 10px #fff3",
    fontFamily: "inherit",
    marginTop: 2,
    marginBottom: 0,
    textAlign: "center",
    transition: "color 0.21s",
  };
  return (
    <button
      type="button"
      className="sq-dashboard-summary-card"
      style={cardStyle}
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      {...props}
    >
      <div style={iconStyle}>{icon}</div>
      <div style={valueStyle}>{loading ? "…" : value}</div>
      <div style={labelStyle}>{label}</div>
    </button>
  );
}
