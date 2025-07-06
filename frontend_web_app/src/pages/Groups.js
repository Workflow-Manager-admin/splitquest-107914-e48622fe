import React, { useState } from "react";
import { useGroups } from "../GroupsContext";
import GroupDashboard from "./GroupDashboard";

// PUBLIC_INTERFACE
export default function Groups() {
  /**
   * Group management: list groups, create/new group, see per-group dashboard.
   * Now: user must enter group name and add people (name, optional phone number) on creation.
   */

  const {
    groups,
    addGroup,
    getMembersForGroup,
    // getAllUsers, // not needed for creation, each group can have arbitrary members
    // currentUserId, // not needed to check in form now
  } = useGroups();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Show dashboard
  if (selectedGroup)
    return (
      <GroupDashboard
        groupId={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );

  return (
    <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>
      <h2>
        Groups <span role="img" aria-label="Groups">👥</span>
      </h2>
      <div>
        <button
          className="theme-toggle"
          style={{ marginBottom: "1rem" }}
          onClick={() => setShowCreate((v) => !v)}
        >
          {showCreate ? "Cancel" : "+ Create New Group"}
        </button>
        {showCreate && (
          <CreateGroupForm
            addGroup={addGroup}
            onDone={() => setShowCreate(false)}
          />
        )}
        <div style={{ marginTop: "1.2rem" }}>
          <GroupList
            groups={groups}
            onSelect={setSelectedGroup}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Lists user groups with name, size, and selects group for dashboard.
 * Dynamically renders newest persisted member names for each group.
 */
function GroupList({ groups, onSelect }) {
  if (!groups.length)
    return <div>No groups yet. Create your first group above!</div>;
  return (
    <div>
      {groups.map((g) => (
        <div
          key={g.id}
          style={{
            background: "#fff",
            borderRadius: "11px",
            boxShadow: "0 2px 12px #2a8a2b0a",
            padding: "1rem",
            marginBottom: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
          onClick={() => onSelect(g.id)}
          title="View group dashboard"
        >
          <div>
            <strong>{g.name}</strong>
            <div style={{ fontSize: "0.96rem", color: "#888" }}>
              {g.members.map((m) => m.name).join(", ")}
            </div>
          </div>
          <span style={{ fontSize: "1.8rem" }}>▶️</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Creation form for a group, asks user for group name and a list of people (name/number).
 * Allows adding/removing members dynamically.
 */
function CreateGroupForm({ addGroup, onDone }) {
  const [groupName, setGroupName] = useState("");
  // Number of members input
  const [numMembers, setNumMembers] = useState(2);
  // Each member: { name: '', number: '' } - initially two, but now controlled by numMembers
  const [members, setMembers] = useState([
    { name: "", number: "" },
    { name: "", number: "" }
  ]);
  const [error, setError] = useState("");

  // Adjust the members input array as numMembers changes
  React.useEffect(() => {
    if (numMembers > members.length) {
      setMembers((prev) => [
        ...prev,
        ...Array(numMembers - prev.length).fill().map(() => ({ name: "", number: "" }))
      ]);
    } else if (numMembers < members.length) {
      setMembers((prev) => prev.slice(0, numMembers));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numMembers]);

  function handleMemberChange(idx, field, value) {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  }
  // No explicit add/removal buttons; controlled via numMembers
  function handleSubmit(e) {
    e.preventDefault();
    const validMembers = members
      .slice(0, numMembers)
      .map((m) => ({ ...m, name: (m.name ?? "").trim() }))
      .filter((m) => m.name.length > 0);
    // Minimum 2 members is a sensible restriction for a group
    if (!groupName.trim() || validMembers.length < 2) {
      setError("Enter a group name and at least two member names.");
      return;
    }
    addGroup(groupName.trim(), validMembers);
    setGroupName("");
    setMembers([
      { name: "", number: "" },
      { name: "", number: "" }
    ]);
    setNumMembers(2);
    setError("");
    if (onDone) onDone();
  }

  // Responsive inline style helpers
  const formWrapperStyle = {
    background: "#f8f9fa",
    padding: "1.25rem",
    borderRadius: 15,
    marginBottom: 18,
    maxWidth: 520,
    boxShadow: "0 1.5px 10px #4f8a8b12",
    border: "1px solid #ececec",
    display: "flex",
    flexDirection: "column",
    gap: 0,
    // Adapt padding/margin for mobile
  };

  const inputRowStyle = {
    marginBottom: 10,
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  };

  const memberRowStyle = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
    gap: 8
  };

  const buttonRowStyle = {
    marginTop: 17,
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 15,
    flexWrap: "wrap"
  };

  // Responsive: full width on small screens
  const responsiveButtonStyle = {
    fontWeight: 700,
    fontSize: "1.11rem",
    padding: "13px 0",
    borderRadius: "13px",
    minWidth: 140,
    background: "var(--color-accent,#FF5959)",
    color: "#fff",
    boxShadow: "0 3px 18px #ff595928,0 1.5px 7px #4f8a8b16",
    border: "none",
    letterSpacing: "0.01em",
    transition: "background 0.25s, box-shadow 0.19s, transform 0.15s",
    marginTop: 0,
    marginBottom: 0,
    cursor: "pointer"
  };

  // Apply colorful shadow and slight hover pop for primary action
  const createGroupBtnHover = {
    filter: "brightness(1.07)",
    boxShadow: "0 7px 30px #ff595950,0 2px 11px #4f8a8b1c",
    transform: "scale(1.033) translateY(-2.5px)"
  };

  // Responsive (CSS-in-JS media queries for fine tuning)
  const mobileMedia =
    "@media (max-width: 600px) { .sq-groupform-btn { width: 100% !important; min-width: 0 !important; font-size: 1.07rem; padding: 16px 0; } }";

  // Mount responsive style to head if not present (only once)
  React.useEffect(() => {
    const id = "group-create-mobile-style";
    if (typeof document !== "undefined" && !document.getElementById(id)) {
      const style = document.createElement("style");
      style.id = id;
      style.innerHTML = mobileMedia;
      document.head.appendChild(style);
    }
  }, []);

  return (
    <form
      onSubmit={handleSubmit}
      style={formWrapperStyle}
      autoComplete="off"
      aria-label="Create group form"
    >
      <div style={inputRowStyle}>
        <input
          required
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={{
            width: 200,
            marginRight: 10,
            border: "1.5px solid #dadada",
            borderRadius: 7,
            padding: "8px",
            fontSize: "1.02em",
            flex: "1 0 150px",
            background: "#fff"
          }}
        />
      </div>
      <div style={inputRowStyle}>
        <label style={{fontWeight: 500}}>
          Number of Members:
          <input
            type="number"
            min={2}
            step={1}
            value={numMembers}
            onChange={e => {
              let val = Number(e.target.value);
              if (isNaN(val) || val < 2) val = 2;
              if (val > 20) val = 20; // Arbitrary max for sanity
              setNumMembers(val);
            }}
            style={{
              marginLeft: 10,
              width: 60,
              border: "1.5px solid #dadada",
              borderRadius: 6,
              padding: "6px",
              fontSize: "1.01em",
              background: "#fff"
            }}
            required
          />
        </label>
        <span style={{ color: "#999", marginLeft: 8, fontSize: "0.98em" }}>(min 2)</span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <b>Members:</b>
        <div>
          {Array.from({ length: numMembers }).map((_, idx) => (
            <div key={idx} style={memberRowStyle}>
              <input
                style={{
                  marginRight: 6,
                  width: 160,
                  border: "1.5px solid #dadada",
                  borderRadius: 7,
                  padding: "8px",
                  fontSize: "1.00em",
                  background: "#fff"
                }}
                placeholder="Name"
                required
                value={members[idx]?.name || ""}
                onChange={e => handleMemberChange(idx, "name", e.target.value)}
                data-testid={`member-name-input-${idx}`}
              />
              <input
                style={{
                  marginRight: 6,
                  width: 120,
                  border: "1.5px solid #dadada",
                  borderRadius: 7,
                  padding: "8px",
                  fontSize: "1.00em",
                  background: "#fff"
                }}
                placeholder="Phone (optional)"
                value={members[idx]?.number || ""}
                onChange={e => handleMemberChange(idx, "number", e.target.value)}
                type="tel"
                inputMode="tel"
                pattern="[0-9+ ()-]*"
                data-testid={`member-number-input-${idx}`}
              />
            </div>
          ))}
        </div>
      </div>
      {error && (
        <div style={{ color: "#FF5959", marginBottom: 6 }}>{error}</div>
      )}
      <div style={buttonRowStyle}>
        <button
          className="sq-groupform-btn"
          type="submit"
          style={responsiveButtonStyle}
          onMouseOver={e => {
            // Slight shadow pop on hover for prominence
            Object.assign(e.currentTarget.style, createGroupBtnHover);
          }}
          onMouseOut={e => {
            // Restore original style on mouse out
            Object.keys(createGroupBtnHover).forEach(k =>
              e.currentTarget.style[k] = responsiveButtonStyle[k] || ""
            );
          }}
        >
          Create Group
        </button>
        {onDone && (
          <button
            type="button"
            className="sq-groupform-btn"
            style={{
              ...responsiveButtonStyle,
              background: "var(--color-primary,#4F8A8B)", // secondary color
              color: "#fff",
              minWidth: 100,
              boxShadow: "0 2px 8px #4f8a8b16",
              marginLeft: 5
            }}
            onClick={onDone}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
