export interface Track {
  id: string;
  title: string;
  artist: string;
  genre: string;
  duration: string;
  tempo: number;
  baseNote: number; // Hz for synthesizer base pitch
  patternType: "chill" | "cyber" | "midnight";
}

export interface SnakeSegment {
  x: number;
  y: number;
}

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export interface GameState {
  snake: SnakeSegment[];
  food: SnakeSegment;
  score: number;
  highScore: number;
  isPlaying: boolean;
  isGameOver: boolean;
  speed: number; // ms interval
  direction: Direction;
  paused: boolean;
}

export interface LogoShape {
  type: "circle" | "rect" | "polygon" | "path" | "text";
  cx?: number;
  cy?: number;
  r?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rx?: number;
  ry?: number;
  points?: string;
  d?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  glow?: boolean;
  animation?: "spin" | "pulse" | "float" | "flicker" | "none";
  animationDuration?: string;
  textContent?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  textAnchor?: "start" | "middle" | "end";
}

export interface LogoConfig {
  theme: "synthwave" | "cyberpunk" | "neon_minimalist" | "retro_arcade";
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  shapes: LogoShape[];
  developerNotes?: string;
}

export interface VideoGenerationState {
  operationName: string | null;
  status: "idle" | "starting" | "polling" | "downloading" | "ready" | "failed";
  progressMessage: string;
  videoUrl: string | null;
  error: string | null;
}
