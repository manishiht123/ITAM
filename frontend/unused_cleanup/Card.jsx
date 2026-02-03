export default function Card({ title, children, style = {} }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: 16,
        background: "#ffffff",
        ...style
      }}
    >
      {title && (
        <h4 style={{ marginBottom: 16, fontWeight: 600 }}>
          {title}
        </h4>
      )}
      {children}
    </div>
  );
}

