"use client";

import { motion } from "framer-motion";
import { BellRing } from "lucide-react";

export function SonarPing() {
  return (
    <div className="relative flex items-center justify-center h-48 w-48 mx-auto my-12">
      {/* Sonar waves */}
      <div className="absolute inset-0 rounded-full border-4 border-primary/40 animate-sonar" />
      <div className="absolute inset-4 rounded-full border-4 border-primary/60 animate-sonar" style={{ animationDelay: "0.5s" }} />
      <div className="absolute inset-8 rounded-full border-4 border-primary/80 animate-sonar" style={{ animationDelay: "1s" }} />
      
      {/* Center Icon */}
      <motion.div 
        className="w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/40 z-10"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
      >
        <BellRing className="w-10 h-10 text-white" />
      </motion.div>
    </div>
  );
}
