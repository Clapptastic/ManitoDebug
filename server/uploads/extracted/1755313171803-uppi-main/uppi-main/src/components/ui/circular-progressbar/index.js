
import React from 'react';

export const CircularProgressbar = ({ value, text, styles }) => {
  return (
    <div className="circular-progressbar">
      <div className="circular-progressbar-path" style={{ width: `${value}%` }}></div>
      <div className="circular-progressbar-text">{text}</div>
    </div>
  );
};

export const buildStyles = (options) => {
  return options;
};
