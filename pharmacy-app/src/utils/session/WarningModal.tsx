type Props = {
  open: boolean;
  countdown: number;
  onContinue: () => void;
  onLogout: () => void;
};

export default function WarningModal({
  open,
  countdown,
  onContinue,
  onLogout,
}: Props) {
  if (!open) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>Session Expiring</h2>
          <span style={styles.badge}>{countdown}s</span>
        </div>

        <p style={styles.description}>
          You've been inactive for a while. Your session will expire soon.
        </p>

        <div style={styles.actions}>
          <button style={styles.primaryBtn} onClick={onContinue}>
            Continue Session
          </button>

          <button style={styles.secondaryBtn} onClick={onLogout}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed",
    inset: 0,
    backdropFilter: "blur(6px)",
    backgroundColor: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
    animation: "fadeIn 0.2s ease-out",
  },

  modal: {
    width: "100%",
    maxWidth: "380px",
    background: "#ffffff",
    borderRadius: "14px",
    padding: "24px 22px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
    animation: "scaleIn 0.2s ease-out",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },

  title: {
    margin: 0,
    fontSize: "18px",
    fontWeight: 600,
    color: "#111",
  },

  badge: {
    background: "#fee2e2",
    color: "#dc2626",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "13px",
    fontWeight: 600,
  },

  description: {
    fontSize: "14px",
    color: "#555",
    lineHeight: 1.5,
    marginBottom: "20px",
  },

  actions: {
    display: "flex",
    gap: "10px",
  },

  primaryBtn: {
    flex: 1,
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s ease",
  },

  secondaryBtn: {
    flex: 1,
    background: "#f3f4f6",
    color: "#111",
    border: "none",
    padding: "10px 12px",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 500,
    cursor: "pointer",
  },
};