import {
  Droplets,
  Palette,
  Eye,
  Sparkles,
  Shield,
  Droplet,
  CircleDot,
  Feather,
  Waves,
  Layers,
  Moon,
  CheckCircle,
  AlertTriangle,
  Leaf,
  Target,
} from "lucide-react";

export const METRIC_ICONS = {
  oily_skin: Droplets,
  uneven_skin_tone: Palette,
  eye_wrinkles: Eye,
  crows_feet: Eye,
  radiance: Sparkles,
  firmness: Shield,
  hydration: Droplet,
  dark_spots: CircleDot,
  smoothness: Feather,
  fine_lines_wrinkles: Waves,
  texture: Layers,
  dark_circles: Moon,
};

export const INSIGHT_CATEGORIES = {
  strengths: {
    icon: CheckCircle,
    color: "#2E8B6B",
    borderClass: "border-l-[#2E8B6B]",
  },
  concerns: {
    icon: AlertTriangle,
    color: "#2C5BFF",
    borderClass: "border-l-[#2C5BFF]",
  },
  lifestyle: {
    icon: Leaf,
    color: "#C68A2E",
    borderClass: "border-l-[#C68A2E]",
  },
  goals: {
    icon: Target,
    color: "hsl(240, 27%, 14%)",
    borderClass: "border-l-primary",
  },
};
