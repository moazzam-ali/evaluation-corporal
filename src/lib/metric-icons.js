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
    color: "#5B9A8B",
    borderClass: "border-l-[#5B9A8B]",
  },
  concerns: {
    icon: AlertTriangle,
    color: "#E8728A",
    borderClass: "border-l-[#E8728A]",
  },
  lifestyle: {
    icon: Leaf,
    color: "#D4A053",
    borderClass: "border-l-[#D4A053]",
  },
  goals: {
    icon: Target,
    color: "hsl(240, 27%, 14%)",
    borderClass: "border-l-primary",
  },
};
