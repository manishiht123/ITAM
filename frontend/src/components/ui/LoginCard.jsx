export default function LoginCard({ children, style = {} }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        background: "#ffffff",
        width: 420,
        ...style
      }}
    >
      {children}
    </div>
  );
}

