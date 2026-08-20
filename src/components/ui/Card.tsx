import React, { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'glass' | 'highlight' | 'iris';
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'rounded-2xl transition-all duration-200 border';

  const variantStyles = {
    default: 'bg-white border-slate-200 text-slate-900 shadow-sm shadow-slate-200/50',
    elevated: 'bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/80',
    glass: 'bg-white/90 backdrop-blur-md border-slate-200/90 text-slate-900 shadow-sm',
    highlight: 'bg-gradient-to-b from-white via-purple-50/20 to-pink-50/20 border-purple-200 text-slate-900 shadow-sm shadow-purple-500/5',
    iris: 'bg-white border-slate-200 hover:border-purple-300 relative overflow-hidden text-slate-900 shadow-sm',
  };

  const hoverStyles = hoverEffect
    ? 'hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-0.5'
    : '';

  return (
    <div className={`${baseStyles} ${variantStyles[variant]} ${hoverStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}> = ({ title, subtitle, action, icon, children, className = '' }) => {
  if (children) {
    return <div className={`p-5 pb-3.5 border-b border-slate-100 ${className}`}>{children}</div>;
  }

  return (
    <div className={`p-5 pb-3.5 flex items-start justify-between gap-4 border-b border-slate-100 ${className}`}>
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5 text-purple-600 flex-shrink-0">{icon}</div>}
        <div>
          {title && <h3 className="text-base font-bold text-slate-900 tracking-tight">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`p-5 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{
  children: ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return <div className={`p-5 pt-3.5 border-t border-slate-100 ${className}`}>{children}</div>;
};
