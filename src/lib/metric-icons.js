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
    color: "#8D9A84",
    borderClass: "border-l-[#8D9A84]",
  },
  concerns: {
    icon: AlertTriangle,
    color: "#9B8573",
    borderClass: "border-l-[#9B8573]",
  },
  lifestyle: {
    icon: Leaf,
    color: "#C7A977",
    borderClass: "border-l-[#C7A977]",
  },
  goals: {
    icon: Target,
    color: "#2F2F2B",
    borderClass: "border-l-primary",
  },
};
