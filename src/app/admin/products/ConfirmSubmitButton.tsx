'use client';

import type { CSSProperties, ReactNode } from 'react';

interface ConfirmSubmitButtonProps {
  message: string;
  children: ReactNode;
  style?: CSSProperties;
  title?: string;
}

export default function ConfirmSubmitButton({
  message,
  children,
  style,
  title,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      title={title}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
      style={style}
    >
      {children}
    </button>
  );
}
