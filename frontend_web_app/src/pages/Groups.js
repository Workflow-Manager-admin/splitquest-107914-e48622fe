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

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        background: "#f8f9fa",
        padding: "1rem",
        borderRadius: 13,
        marginBottom: 16,
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <input
          required
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          style={{ marginRight: 10, width: 200 }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <label>
          <b>Number of Members:</b>
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
            style={{ marginLeft: 10, width: 60 }}
            required
          />
        </label>
        <span style={{ color: "#999", marginLeft: 8, fontSize: "0.98em" }}>(min 2)</span>
      </div>
      <div style={{ marginBottom: 8 }}>
        <b>Members:</b>
        <div>
          {Array.from({ length: numMembers }).map((_, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <input
                style={{ marginRight: 6, width: 160 }}
                placeholder="Name"
                required
                value={members[idx]?.name || ""}
                onChange={e => handleMemberChange(idx, "name", e.target.value)}
                data-testid={`member-name-input-${idx}`}
              />
              <input
                style={{ marginRight: 6, width: 120 }}
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
          {/* Add/Remove buttons are not needed; number controlled above */}
        </div>
      </div>
      {error && (
        <div style={{ color: "#FF5959", marginBottom: 6 }}>{error}</div>
      )}
      <button className="theme-toggle" type="submit" style={{ marginTop: 6 }}>
        Create Group
      </button>
    </form>
  );
}
