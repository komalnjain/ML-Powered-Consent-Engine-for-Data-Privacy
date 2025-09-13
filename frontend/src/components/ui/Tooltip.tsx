import React from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, children }: TooltipProps) {
  // This is a placeholder component.
  // You will need to replace this with the actual Tooltip implementation.
  return (
    <div title={content}>
      {children}
    </div>
  );
} 