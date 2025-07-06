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
  // Each member: { name: '', number: '' }
  const [members, setMembers] = useState([
    { name: "", number: "" },
    { name: "", number: "" }
  ]);
  const [error, setError] = useState("");

  function handleMemberChange(idx, field, value) {
    setMembers((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  }
  function handleAddMember() {
    setMembers((prev) => [...prev, { name: "", number: "" }]);
  }
  function handleRemoveMember(idx) {
    setMembers((prev) => prev.filter((_, i) => i !== idx));
  }
  function handleSubmit(e) {
    e.preventDefault();
    const validMembers = members
      .map((m) => ({ ...m, name: m.name.trim() }))
      .filter((m) => m.name.length > 0);
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
      <div style={{ marginBottom: 8 }}>
        <b>Members:</b>
        <div>
          {members.map((m, idx) => (
            <div key={idx} style={{ display: "flex", alignItems: "center", marginBottom: 4 }}>
              <input
                style={{ marginRight: 6, width: 160 }}
                placeholder="Name"
                required
                value={m.name}
                onChange={e => handleMemberChange(idx, "name", e.target.value)}
              />
              <input
                style={{ marginRight: 6, width: 120 }}
                placeholder="Phone (optional)"
                value={m.number}
                onChange={e => handleMemberChange(idx, "number", e.target.value)}
                type="tel"
                inputMode="tel"
                pattern="[0-9+ ()-]*"
              />
              <button
                type="button"
                className="theme-toggle"
                style={{ fontSize: 14, padding: "5px 13px", background: "#FF5959", marginLeft: 2 }}
                aria-label="Remove"
                disabled={members.length <= 2}
                onClick={() => handleRemoveMember(idx)}
                tabIndex={0}
              >-</button>
            </div>
          ))}
          <button
            type="button"
            className="theme-toggle"
            onClick={handleAddMember}
            style={{marginTop: 3,background:"#4F8A8B",fontSize:14}}
          >+ Add Member</button>
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
