import React from 'react';

interface ButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'lg' | 'md';
  disabled?: boolean;
  fontScale?: number;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fontScale = 1,
}) => {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-300 hover:bg-gray-400 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  const sizes = {
    lg: `px-6 py-4 text-lg`,
    md: `px-4 py-2 text-base`,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variants[variant]}
        ${sizes[size]}
        rounded-lg
        font-semibold
        transition-colors
        disabled:opacity-50
        disabled:cursor-not-allowed
      `}
      style={{
        fontSize: `${(size === 'lg' ? 18 : 16) * fontScale}px`,
        padding: `${(size === 'lg' ? 16 : 8) * fontScale}px ${(size === 'lg' ? 24 : 16) * fontScale}px`,
      }}
    >
      {children}
    </button>
  );
};
