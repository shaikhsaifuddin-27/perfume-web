export default function AdminLoading() {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 128px)',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#C9A84C',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: '50%',
            border: '2px solid #2a2a2a',
            borderTopColor: '#C9A84C',
            animation: 'admin-spin 0.8s linear infinite',
          }}
        />
        <span style={{ fontSize: 12, color: '#666', letterSpacing: '0.08em' }}>
          Loading
        </span>
      </div>
      <style>{`
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
