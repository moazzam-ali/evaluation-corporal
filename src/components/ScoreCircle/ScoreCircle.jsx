"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp } from "lucide-react";

function getStatusColor(status) {
  switch (status) {
    case "good":
      return { stroke: "#22c55e", bg: "bg-green-50", text: "text-green-600" };
    case "normal":
      return { stroke: "#f59e0b", bg: "bg-amber-50", text: "text-amber-600" };
    case "needs_attention":
      return { stroke: "#ef4444", bg: "bg-red-50", text: "text-red-600" };
    default:
      return { stroke: "#6b7280", bg: "bg-gray-50", text: "text-gray-600" };
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
      className={`flex flex-col items-center rounded-xl border p-4 ${bg} transition-shadow hover:shadow-md cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="relative mb-3">
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
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
      <p className="mb-1 text-center text-sm font-semibold">{label}</p>
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
