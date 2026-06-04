'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function OrderActionButtonClient({
  orderId,
  action,
  label,
}: {
  orderId: string;
  action: 'cancel' | 'return' | 'refund';
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [reason, setReason] = useState('');

  const executeAction = async (inputReason?: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: inputReason ? JSON.stringify({ reason: inputReason }) : undefined,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Failed to ${action} order.`);
      }
      toast.success(data.message ?? `Successfully requested ${action}.`);
      setShowModal(false);
      setReason('');
      router.refresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleClick = () => {
    if (action === 'cancel') {
      if (confirm('Are you sure you want to cancel this order?')) {
        executeAction();
      }
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <button onClick={handleClick} className="btn-gold" disabled={loading} style={{ cursor: loading ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Processing...' : label}
      </button>

      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 99999,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div
            style={{
              background: '#0F0F0F',
              border: '1px solid rgba(201, 168, 76, 0.3)',
              borderRadius: 12,
              padding: 28,
              width: '90%',
              maxWidth: 450,
              boxShadow: '0 24px 48px rgba(0,0,0,0.9)',
              color: '#F5F0E8',
              fontFamily: 'var(--font-sans), sans-serif',
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-serif), serif',
                fontSize: 22,
                fontWeight: 300,
                color: '#C9A84C',
                margin: '0 0 16px 0',
                letterSpacing: '0.04em',
              }}
            >
              {label}
            </h3>
            <p style={{ fontSize: 13, color: '#aaa', lineHeight: '1.6', margin: '0 0 16px 0' }}>
              Please provide a brief reason for your {action} request (minimum 5 characters).
            </p>

            <textarea
              className="input-luxury"
              placeholder="Reason for request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              style={{
                width: '100%',
                background: '#050505',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 8,
                padding: 12,
                color: '#F5F0E8',
                fontSize: 13,
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
                marginBottom: 20,
              }}
            />

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowModal(false);
                  setReason('');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#888',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 16px',
                }}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={() => executeAction(reason)}
                style={{
                  background: '#C9A84C',
                  color: '#050505',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '8px 20px',
                }}
                disabled={loading || reason.trim().length < 5}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
