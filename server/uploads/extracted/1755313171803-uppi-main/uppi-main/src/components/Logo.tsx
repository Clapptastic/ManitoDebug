
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="/lovable-uploads/1aadd98e-cc87-4624-8703-906a9626a486.png" 
        alt="Uppi.ai Logo" 
        className="h-8 mr-2"
      />
      <span className="text-xl font-bold">Uppi.ai</span>
    </div>
  );
};

export default Logo;
