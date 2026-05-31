'use client';

import { useState, useTransition } from 'react';
import { updateOrderStatusForm } from './actions';
import { OrderStatus } from '@prisma/client';

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#FF9900',
  PROCESSING: '#C9A84C',
  SHIPPED: '#3399FF',
  DELIVERED: '#33CC66',
  CANCELLED: '#FF3333',
};

const ALL_STATUSES: OrderStatus[] = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function OrderStatusSelect({ orderId, current }: { orderId: string; current: OrderStatus }) {
  const [status, setStatus] = useState<OrderStatus>(current);
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as OrderStatus;
    setStatus(newStatus);
    startTransition(async () => {
      const action = updateOrderStatusForm.bind(null, orderId, newStatus);
      await action(new FormData());
    });
  };

  return (
    <select
      value={status}
      onChange={handleChange}
      disabled={isPending}
      style={{
        background: `${STATUS_COLORS[status] ?? '#888'}15`,
        border: `1px solid ${STATUS_COLORS[status] ?? '#888'}44`,
        color: STATUS_COLORS[status] ?? '#888',
        padding: '6px 10px',
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 600,
        outline: 'none',
        cursor: isPending ? 'wait' : 'pointer',
        letterSpacing: '0.06em',
        transition: 'all 0.2s',
        opacity: isPending ? 0.7 : 1,
      }}
    >
      {ALL_STATUSES.map((st) => (
        <option key={st} value={st} style={{ background: '#141414', color: STATUS_COLORS[st] }}>
          {st}
        </option>
      ))}
    </select>
  );
}
