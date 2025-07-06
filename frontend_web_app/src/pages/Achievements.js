import React, { useState } from "react";
import {
  FaMedal,
  FaTrophy,
  FaBolt,
  FaStar,
  FaCrown,
  FaWallet,
  FaCoins,
} from "react-icons/fa";
import "./Achievements.css";

// PUBLIC_INTERFACE
export default function Achievements() {
  /**
   * Achievements: Badges grid, pop/fade animation & level, with progress bars for demo gamification.
   * Unlock in demo via state; each badge has title, level, playful icon, animated transition, and a progress bar/ring.
   */
  // Demo/mock achievement data
  const ACHIEVEMENTS = [
    {
      key: "first_split",
      title: "First Split",
      level: 1,
      goal: 1, // e.g., 1 expense added
      current: 1, // demo: already unlocked
      icon: <FaBolt />,
      color: "#ff8f43",
      bg: "linear-gradient(100deg,#FFE09E 40%,#fffee7 99%)",
    },
    {
      key: "hundred_expenses",
      title: "100 Expenses Logged",
      level: 1,
      goal: 100,
      current: 37, // demo: incomplete
      icon: <FaWallet />,
      color: "#24BDAA",
      bg: "linear-gradient(110deg,#b4ffe2 50%,#e1fae8 100%)",
    },
    {
      key: "paymaster",
      title: "Paymaster",
      level: 2,
      goal: 10,
      current: 10,
      icon: <FaCoins />,
      color: "#FFD046",
      bg: "linear-gradient(120deg,#fff5c4 50%,#f9e8ac 100%)",
    },
    {
      key: "first_group",
      title: "First Group",
      level: 1,
      goal: 1,
      current: 1,
      icon: <FaMedal />,
      color: "#d07cff",
      bg: "linear-gradient(110deg,#f6e8ff 50%,#eceaff 100%)",
    },
    {
      key: "high_roller",
      title: "High Roller",
      level: 3,
      goal: 50000,
      current: 19780,
      icon: <FaTrophy />,
      color: "#44a7ff",
      bg: "linear-gradient(120deg,#f0f8ff 60%,#bcd8fa 100%)",
    },
    {
      key: "legend",
      title: "Legend Level",
      level: 5,
      goal: 1000,
      current: 555,
      icon: <FaCrown />,
      color: "#fd436c",
      bg: "linear-gradient(110deg,#ffd1df 60%,#ffe6f5 100%)",
    },
    {
      key: "super_star",
      title: "Super Star",
      level: 1,
      goal: 1,
      current: 0, // locked
      icon: <FaStar />,
      color: "#f5c958",
      bg: "linear-gradient(120deg,#fffbe0 50%,#fff5c4 100%)",
    },
  ];

  // Simulate achievements state for demo: unlock with click
  const [userProgress, setUserProgress] = useState(
    ACHIEVEMENTS.reduce(
      (acc, a) => {
        acc[a.key] = {
          unlocked: a.current >= a.goal,
          current: a.current,
        };
        return acc;
      },
      {}
    )
  );

  function unlockBadge(key) {
    setUserProgress(up =>
      ({
        ...up,
        [key]: { unlocked: true, current: ACHIEVEMENTS.find(a => a.key === key).goal },
      })
    );
  }

  // Responsive/badges grid style
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(215px, 1fr))",
    gap: "1.55rem",
    marginTop: "2.5rem",
    marginBottom: "2rem",
  };

  return (
    <div style={{
      maxWidth: 780,
      margin: "0 auto",
      padding: "2rem 1.2rem 2rem 1.2rem"
    }}>
      <h2 className="sq-header" style={{
        color: "var(--color-accent, #FF5959)",
        fontSize: "2.18rem",
        fontWeight: 800,
        letterSpacing: "1px",
        marginBottom: 0,
      }}>
        Achievements <span role="img" aria-label="Achievements">🏅</span>
      </h2>
      <div style={{ color: "#4F8A8B", fontSize: "1.09rem", marginTop: 7 }}>
        Collect badges by completing actions! Unlocked badges animate and show your progress.
      </div>
      <div style={gridStyle}>
        {ACHIEVEMENTS.map((a, i) => (
          <AchievementBadgeCard
            key={a.key}
            title={a.title}
            level={a.level}
            icon={a.icon}
            color={a.color}
            bg={a.bg}
            unlocked={userProgress[a.key] && userProgress[a.key].unlocked}
            progress={Math.min(1, (userProgress[a.key]?.current || 0) / a.goal)}
            current={userProgress[a.key]?.current || 0}
            goal={a.goal}
            onDemoUnlock={
              !userProgress[a.key]?.unlocked
                ? () => unlockBadge(a.key)
                : undefined
            }
            animateDelay={i * 0.07}
          />
        ))}
      </div>
      <div style={{ marginTop: 36, color: "#aaa", fontSize: "0.99em", textAlign: "center" }}>
        <span role="img" aria-label="info">ℹ️</span> These are demo badges. Unlock them by clicking on a locked badge!
      </div>
    </div>
  );
}

// -- Achievement Badge Card component
function AchievementBadgeCard({
  title,
  level,
  icon,
  color,
  bg,
  unlocked,
  progress,
  current,
  goal,
  onDemoUnlock,
  animateDelay = 0,
}) {
  // Animation state: pop effect if newly unlocked
  const [wasUnlocked, setWasUnlocked] = useState(unlocked);

  React.useEffect(() => {
    if (unlocked && !wasUnlocked) setWasUnlocked(true);
  }, [unlocked, wasUnlocked]);

  // Animations: scale/pop on unlock, fade in always
  const cardAnim = unlocked
    ? `badge-pop 0.55s cubic-bezier(.18,1.48,.54,1) ${animateDelay}s both, badge-fadein 0.5s ${animateDelay +
        0.12}s both`
    : `badge-lock-fadein 0.6s ${animateDelay}s both`;

  // Progress: if locked, show progress bar/ring (else subtle accent bar)
  return (
    <div
      tabIndex={0}
      aria-label={`${title}, Level ${level}. ${unlocked
        ? "Achievement unlocked"
        : `${Math.floor(progress * 100)}% completed`}`}
      className="badge-card"
      style={{
        background: bg,
        borderRadius: 17,
        boxShadow: unlocked
          ? `0 5px 26px 0 ${color}29, 0 1.5px 7px #4f8a8b09`
          : "0 1.5px 7px #4f8a8b10",
        padding: "1.22rem 1.16rem 1.1rem 1.16rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        cursor: onDemoUnlock ? "pointer" : "default",
        userSelect: "none",
        position: "relative",
        minHeight: 158,
        minWidth: 0,
        outline: "none",
        border: unlocked
          ? `2.2px solid ${color}`
          : "2.2px solid #e6e8ed66",
        filter: unlocked
          ? "none"
          : "grayscale(0.31) brightness(0.97)",
        transition:
          "box-shadow .21s, border .21s, background .23s, filter .3s",
        animation: cardAnim,
        willChange: "transform, opacity, box-shadow",
      }}
      onClick={onDemoUnlock}
      tabIndex={0}
    >
      <div
        style={{
          fontSize: 49,
          color: color,
          filter: unlocked
            ? "drop-shadow(0 2px 16px #fff6) brightness(1.22)"
            : "grayscale(0.5) opacity(0.75)",
          marginBottom: 5,
          marginTop: 1,
          transition: "filter .25s, color .23s",
          lineHeight: 1,
          animation: unlocked && wasUnlocked
            ? "badge-icon-pop 1.11s cubic-bezier(.18,1.41,.61,.84) both"
            : undefined,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontWeight: 800,
          letterSpacing: 0.4,
          color: "var(--color-accent, #FF5959)",
          fontSize: "1.13rem",
          marginBottom: 4,
          textAlign: "center",
          filter: unlocked ? "none" : "grayscale(35%) brightness(0.9)",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: "1.08rem",
          fontWeight: 600,
          color: color,
          marginBottom: 8,
          textAlign: "center",
          opacity: 0.88,
        }}
      >
        Level {level}
      </div>
      <div style={{ width: "100%", marginBottom: 7 }}>
        {!unlocked ? (
          <ProgressRing progress={progress} color={color} />
        ) : (
          <ProgressBar value={1} color={color} subtle />
        )}
      </div>
      {/* For locked, playful shadow/lock overlay */}
      {!unlocked && (
        <span style={{
          position: "absolute",
          top: 12,
          right: 18,
          fontSize: 21,
          opacity: 0.54,
          pointerEvents: "none",
          userSelect: "none",
          color: "#2A253A",
          textShadow: "0 2px 8px #fff9",
        }} aria-hidden>
          🔒
        </span>
      )}
      {/* Animate value label on lock: progress */}
      <div style={{
        fontSize: "0.99em",
        color: unlocked ? "#878787" : "#686868",
        opacity: 0.89,
        marginTop: 0,
        minHeight: 21,
        textAlign: "center",
        fontWeight: 500,
        letterSpacing: 0.1,
      }}>
        {unlocked
          ? <>Unlocked!</>
          : <>Progress: <span style={{ color }}>{current}</span> / {goal}</>
        }
      </div>
    </div>
  );
}

// Playful circular progress ring (SVG)
function ProgressRing({ progress, color }) {
  // Draw ring: from 0 to 1 progress
  const R = 28, S = 5, C = 2 * Math.PI * R;
  return (
    <svg width={62} height={62} style={{ display: "block", margin: "0 auto" }}>
      <circle
        cx={31}
        cy={31}
        r={R}
        fill="none"
        stroke="#eee"
        strokeWidth={S}
      />
      <circle
        cx={31}
        cy={31}
        r={R}
        fill="none"
        stroke={color}
        strokeWidth={S}
        strokeDasharray={C}
        strokeDashoffset={C * (1 - progress)}
        style={{
          transition: "stroke-dashoffset .7s cubic-bezier(.39,1.69,.57,.99)",
          filter: "drop-shadow(0 0 6px #fff9)",
        }}
      />
      <text
        x="31"
        y="37"
        textAnchor="middle"
        fontSize="1.04em"
        fontWeight="bold"
        fill={color}
        style={{
          paintOrder: "stroke fill",
          textShadow: "0 2px 10px #fff9",
          filter: "brightness(1.04)",
          transition: "fill .23s",
        }}
      >
        {Math.round(progress * 100)}%
      </text>
    </svg>
  );
}

// Linear progress bar with playful color
function ProgressBar({ value = 1, color, subtle }) {
  return (
    <div style={{
      height: "11px",
      borderRadius: "7px",
      background: subtle ? "#e8eae9" : "#faecec",
      width: "100%",
      overflow: "hidden",
    }}>
      <div style={{
        width: `${Math.min(100, value * 100)}%`,
        height: "100%",
        borderRadius: "7px",
        background: `linear-gradient(90deg, ${color} 70%, #fff 99%)`,
        boxShadow: subtle ? "0 1.5px 7px #4f8a8b09" : "0 2px 8px #fff7",
        transition: "width .7s cubic-bezier(.39,1.69,.57,.99)"
      }} />
    </div>
  );
}

/* Animations for badge pop/fade etc. */
const badgeAnimStyle = `
@keyframes badge-pop {
  0% { transform: scale(0.85); opacity: 0; }
  70% { transform: scale(1.12) rotate(-5deg); opacity: 1; }
  85% { transform: scale(0.97) rotate(2deg); }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
@keyframes badge-fadein {
  0% { opacity: 0; transform: scale(0.9);}
  100% { opacity: 1; transform: scale(1);}
}
@keyframes badge-icon-pop {
  0% { transform: scale(1) rotate(-9deg);}
  40% { transform: scale(1.6) rotate(7deg);}
  75% { transform: scale(0.86);}
  100% { transform: scale(1);}
}
@keyframes badge-lock-fadein {
  from { opacity: 0; filter: blur(2.5px);}
  to { opacity: 1; filter: none;}
}
`;

// Mount animations onto head
if (typeof document !== "undefined" && !document.getElementById("badge-animations")) {
  const style = document.createElement('style');
  style.innerHTML = badgeAnimStyle;
  style.id = "badge-animations";
  document.head.appendChild(style);
}
