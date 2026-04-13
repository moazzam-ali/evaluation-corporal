"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

function getStatusColor(status) {
  switch (status) {
    case "good":
      return { stroke: "#5B9A8B", bg: "bg-[#5B9A8B]/10", text: "text-[#5B9A8B]" };
    case "normal":
      return { stroke: "#D4A053", bg: "bg-[#D4A053]/10", text: "text-[#D4A053]" };
    case "needs_attention":
      return { stroke: "#E8728A", bg: "bg-[#E8728A]/10", text: "text-[#E8728A]" };
    default:
      return { stroke: "#8E8A9B", bg: "bg-[#8E8A9B]/10", text: "text-[#8E8A9B]" };
  }
}

export default function ScoreCircle({ score, status, label, insight, description, delay = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const { stroke, bg, text } = getStatusColor(status);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`flex flex-col items-center rounded-xl border p-4 shadow-sm ${bg} transition-all duration-200 hover:shadow-md cursor-pointer ${expanded ? "border-primary ring-1 ring-primary/20" : ""}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="relative mb-3">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="hsl(340, 15%, 90%)" strokeWidth="6" />
          <motion.circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke={stroke}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ delay: delay + 0.2, duration: 1, ease: "easeOut" }}
            transform="rotate(-90 44 44)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span
            className={`text-lg font-bold ${text}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.5 }}
          >
            {score}%
          </motion.span>
        </div>
      </div>
      <p className="mb-1 text-center text-sm font-semibold line-clamp-1">{label}</p>
      {insight && (
        <p className="text-center text-xs text-muted-foreground line-clamp-2">{insight}</p>
      )}

      {/* Expand/collapse indicator */}
      {description && (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </div>
      )}

      {/* Expanded description */}
      <AnimatePresence>
        {expanded && description && (
          <motion.p
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 overflow-hidden text-center text-xs text-muted-foreground border-t pt-2"
          >
            {description}
          </motion.p>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
