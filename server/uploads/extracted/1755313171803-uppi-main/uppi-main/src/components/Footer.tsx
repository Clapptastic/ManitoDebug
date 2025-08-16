
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} | All Rights Reserved
        </p>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">Terms</span>
          <span className="text-sm text-muted-foreground">Privacy</span>
          <span className="text-sm text-muted-foreground">Contact</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
