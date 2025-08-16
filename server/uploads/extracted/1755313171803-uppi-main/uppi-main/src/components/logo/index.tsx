
import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'white';
}

const Logo: React.FC<LogoProps> = ({ size = 'md', variant = 'default' }) => {
  const sizeClasses = {
    sm: 'h-6',
    md: 'h-8',
    lg: 'h-10'
  };
  
  const textColor = variant === 'white' ? 'text-white' : 'text-primary';
  
  return (
    <div className="flex items-center gap-2">
      <img 
        src="/lovable-uploads/1aadd98e-cc87-4624-8703-906a9626a486.png" 
        alt="Uppi.ai Logo" 
        className={sizeClasses[size]}
      />
      <div className={`font-bold ${textColor} ${sizeClasses[size]}`}>
        Uppi.ai
      </div>
    </div>
  );
};

export default Logo;
