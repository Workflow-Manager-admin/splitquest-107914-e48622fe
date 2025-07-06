import React, { useState } from "react";
import { useGroups } from "../GroupsContext";
import GroupDashboard from "./GroupDashboard";

// PUBLIC_INTERFACE
export default function Groups() {
  /**
   * Group management: list groups, create/new group, see per-group dashboard.
   */

  const {
    groups,
    addGroup,
    getMembersForGroup,
    getAllUsers,
    currentUserId,
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
            allUsers={getAllUsers()}
            addGroup={addGroup}
            onDone={() => setShowCreate(false)}
            currentUserId={currentUserId}
          />
        )}
        <div style={{ marginTop: "1.2rem" }}>
          <GroupList
            groups={groups}
            onSelect={setSelectedGroup}
            getMembersForGroup={getMembersForGroup}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Lists user groups with name, size, and selects group for dashboard.
 */
function GroupList({ groups, onSelect, getMembersForGroup }) {
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
              {getMembersForGroup(g).map((m) => m.name).join(", ")}
            </div>
          </div>
          <span style={{ fontSize: "1.8rem" }}>▶️</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Creation form for a group, with user multi-select.
 */
function CreateGroupForm({ allUsers, addGroup, onDone, currentUserId }) {
  const [groupName, setGroupName] = useState("");
  const [memberIds, setMemberIds] = useState([currentUserId]);
  const [error, setError] = useState("");

  function toggleMember(id) {
    setMemberIds((prev) =>
      prev.includes(id)
        ? prev.filter((uid) => uid !== id)
        : [...prev, id]
    );
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!groupName.trim() || memberIds.length < 2) {
      setError("Enter group name and choose at least two members.");
      return;
    }
    addGroup(groupName.trim(), memberIds);
    setGroupName("");
    setMemberIds([currentUserId]);
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
        {allUsers.map((u) => (
          <label key={u.id} style={{ marginLeft: 10 }}>
            <input
              type="checkbox"
              checked={memberIds.includes(u.id)}
              onChange={() => toggleMember(u.id)}
            />{" "}
            {u.name}
          </label>
        ))}
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
