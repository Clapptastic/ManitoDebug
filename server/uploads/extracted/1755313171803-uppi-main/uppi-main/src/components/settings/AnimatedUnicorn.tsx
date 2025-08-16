
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AnimatedUnicorn() {
  const [isFlying, setIsFlying] = useState(false);
  const [showGlitter, setShowGlitter] = useState(false);

  useEffect(() => {
    // Function to handle unicorn fly change events from other components
    const handleUnicornFlyChange = (event: CustomEvent) => {
      setIsFlying(event.detail);
    };

    // Listen for fly state changes from other components
    window.addEventListener('unicornFlyChange', handleUnicornFlyChange as EventListener);

    // Check initial state when component mounts
    const checkInitialState = () => {
      const customEvent = new CustomEvent('getUnicornState');
      window.dispatchEvent(customEvent);
    };
    checkInitialState();
    
    return () => {
      window.removeEventListener('unicornFlyChange', handleUnicornFlyChange as EventListener);
    };
  }, []);

  useEffect(() => {
    if (isFlying) {
      setShowGlitter(true);
      setTimeout(() => setShowGlitter(false), 2000);
    }
  }, [isFlying]);

  const handleFlyClick = () => {
    const newFlyingState = !isFlying;
    setIsFlying(newFlyingState);
    window.dispatchEvent(new CustomEvent('unicornFlyChange', { detail: newFlyingState }));
  };

  const glitterColors = ["✨", "💖", "💙", "💛", "💜", "💚"];
  const glitterElements = Array.from({ length: 50 }).map((_, index) => (
    <motion.div
      key={index}
      className="absolute text-3xl"
      style={{
        left: `${Math.random() * 100}%`,
        top: "-50px",
      }}
      initial={{ opacity: 1, y: -50 }}
      animate={{ opacity: 0, y: window.innerHeight }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      {glitterColors[Math.floor(Math.random() * glitterColors.length)]}
    </motion.div>
  ));

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden p-4">
      {showGlitter && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {glitterElements}
        </div>
      )}
      <div className="relative w-32 h-32 lg:w-40 lg:h-40 bg-white/10 backdrop-blur-lg rounded-full flex items-center justify-center shadow-xl border-4 border-unicorn-primary text-4xl lg:text-5xl">
        {!isFlying && "🦄"}
      </div>
      <Button 
        className="mt-6 bg-unicorn-primary hover:bg-unicorn-primary/90" 
        onClick={handleFlyClick}
      >
        {isFlying ? "Land" : "Fly!"}
      </Button>
    </div>
  );
}
