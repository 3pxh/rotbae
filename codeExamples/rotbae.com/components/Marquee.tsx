import React from 'react';

interface MarqueeProps {
  text: string;
  speed?: number;
}

const Marquee: React.FC<MarqueeProps> = ({ text }) => {
  return (
    <div className="w-full bg-black text-white py-2 overflow-hidden border-b-2 border-white">
      <div className="marquee-container font-mono text-sm tracking-widest font-bold">
        <div className="marquee-content">
          {text} &nbsp; // &nbsp; {text} &nbsp; // &nbsp; {text} &nbsp; // &nbsp; {text}
        </div>
      </div>
    </div>
  );
};

export default Marquee;