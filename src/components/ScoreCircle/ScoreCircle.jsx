"use client";

import { motion } from "framer-motion";

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

export default function ScoreCircle({ score, status, label, insight, delay = 0 }) {
  const { stroke, bg, text } = getStatusColor(status);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`flex flex-col items-center rounded-xl border p-4 ${bg} transition-shadow hover:shadow-md`}
    >
      <div className="relative mb-3">
        <svg width="88" height="88" viewBox="0 0 88 88">
          {/* Background circle */}
          <circle
            cx="44"
            cy="44"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          {/* Score arc */}
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
    </motion.div>
  );
}
