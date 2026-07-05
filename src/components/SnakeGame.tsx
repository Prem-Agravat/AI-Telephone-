import React, { useState, useEffect, useRef } from "react";
import { GameState, SnakeSegment, Direction } from "../types";
import { Play, RotateCcw, Award, Zap, ShieldAlert, Square, Swords } from "lucide-react";

interface SnakeGameProps {
  onScoreChange: (score: number) => void;
  musicPlaying: boolean;
  pulseTrigger: number; // updates on beat to pulsate walls
}

const GRID_SIZE = 20;

export const SnakeGame: React.FC<SnakeGameProps> = ({ onScoreChange, musicPlaying, pulseTrigger }) => {
  const [snake, setSnake] = useState<SnakeSegment[]>([
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
  ]);
  const [food, setFood] = useState<SnakeSegment>({ x: 5, y: 5 });
  const [foodType, setFoodType] = useState<"note" | "disc" | "power">("note");
  const [direction, setDirection] = useState<Direction>("UP");
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    return parseInt(localStorage.getItem("vapor_snake_high") || "0", 10);
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(120); // ms per tick

  const gameIntervalRef = useRef<any>(null);
  const directionRef = useRef<Direction>("UP");

  // Keep direction state in sync with ref to avoid closure issues in intervals
  useEffect(() => {
    directionRef.current = direction;
  }, [direction]);

  // Generate random food coordinate
  const generateRandomFood = (currentSnake: SnakeSegment[]): SnakeSegment => {
    let newFood: SnakeSegment;
    let attempts = 0;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
      attempts++;
    } while (
      currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y) &&
      attempts < 100
    );

    const types: ("note" | "disc" | "power")[] = ["note", "disc", "power"];
    setFoodType(types[Math.floor(Math.random() * types.length)]);

    return newFood;
  };

  // Play retro retro-arcade audio beep on client
  const playBeep = (freq: number, duration: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Ignored if blocked
    }
  };

  // Main game tick
  const gameTick = () => {
    if (isGameOver || isPaused || !isPlaying) return;

    setSnake((prevSnake) => {
      const head = { ...prevSnake[0] };
      const currentDir = directionRef.current;

      // Calculate next position
      switch (currentDir) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      // 1. Collision Check (Wall or Self)
      if (
        head.x < 0 ||
        head.x >= GRID_SIZE ||
        head.y < 0 ||
        head.y >= GRID_SIZE ||
        prevSnake.some((segment) => segment.x === head.x && segment.y === head.y)
      ) {
        setIsPlaying(false);
        setIsGameOver(true);
        playBeep(180, 0.4); // Sad retro crash sound
        return prevSnake;
      }

      const nextSnake = [head, ...prevSnake];

      // 2. Consume Food check
      if (head.x === food.x && head.y === food.y) {
        // High frequency reward sound
        const soundFreq = foodType === "note" ? 523.25 : foodType === "disc" ? 659.25 : 783.99;
        playBeep(soundFreq, 0.15);

        // Update score
        const points = foodType === "power" ? 30 : foodType === "disc" ? 20 : 10;
        setScore((prevScore) => {
          const nextScore = prevScore + points;
          onScoreChange(nextScore);
          
          if (nextScore > highScore) {
            setHighScore(nextScore);
            localStorage.setItem("vapor_snake_high", nextScore.toString());
          }
          return nextScore;
        });

        // Setup new food
        setFood(generateRandomFood(prevSnake));
      } else {
        nextSnake.pop(); // remove tail segment
      }

      return nextSnake;
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying || isPaused || isGameOver) return;
      const currentDir = directionRef.current;

      switch (e.key) {
        case "ArrowUp":
        case "w":
        case "W":
          if (currentDir !== "DOWN") setDirection("UP");
          break;
        case "ArrowDown":
        case "s":
        case "S":
          if (currentDir !== "UP") setDirection("DOWN");
          break;
        case "ArrowLeft":
        case "a":
        case "A":
          if (currentDir !== "RIGHT") setDirection("LEFT");
          break;
        case "ArrowRight":
        case "d":
        case "D":
          if (currentDir !== "LEFT") setDirection("RIGHT");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPlaying, isPaused, isGameOver]);

  // Set up game loop interval
  useEffect(() => {
    if (isPlaying && !isPaused && !isGameOver) {
      gameIntervalRef.current = setInterval(gameTick, speed);
    } else {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    }

    return () => {
      if (gameIntervalRef.current) {
        clearInterval(gameIntervalRef.current);
      }
    };
  }, [isPlaying, isPaused, isGameOver, food, foodType, speed]);

  // Reset Game
  const resetGame = () => {
    setSnake([
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ]);
    const initialSnake = [
      { x: 10, y: 10 },
      { x: 10, y: 11 },
      { x: 10, y: 12 },
    ];
    setDirection("UP");
    setScore(0);
    onScoreChange(0);
    setFood(generateRandomFood(initialSnake));
    setIsGameOver(false);
    setIsPaused(false);
    setIsPlaying(true);
    playBeep(440, 0.15); // retro start beep
  };

  // Grid Cell Rendering Helper
  const getCellClassName = (x: number, y: number) => {
    const isHead = snake[0].x === x && snake[0].y === y;
    const snakeSegmentIndex = snake.findIndex((segment) => segment.x === x && segment.y === y);
    const isSnake = snakeSegmentIndex !== -1;
    const isFood = food.x === x && food.y === y;

    if (isHead) {
      return "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] rounded-sm scale-105 z-10 border border-cyan-300/30";
    }
    if (isSnake) {
      if (snakeSegmentIndex === 1) return "bg-cyan-500/80 rounded-sm scale-95";
      if (snakeSegmentIndex === 2) return "bg-cyan-600/60 rounded-sm scale-90";
      if (snakeSegmentIndex === 3) return "bg-[#d946ef]/60 rounded-sm scale-90";
      return "bg-[#d946ef]/30 rounded-sm scale-85";
    }
    if (isFood) {
      switch (foodType) {
        case "note":
          return "bg-[#d946ef] shadow-[0_0_20px_rgba(217,70,239,1)] rounded-full animate-pulse scale-110";
        case "disc":
          return "bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.8)] rounded-full animate-pulse scale-110";
        case "power":
          return "bg-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.8)] rounded-full scale-115 animate-bounce";
      }
    }
    return "bg-transparent";
  };

  // Food Character Icon Helper
  const renderFoodIcon = () => {
    switch (foodType) {
      case "note":
        return "🎵";
      case "disc":
        return "💾";
      case "power":
        return "⭐";
    }
  };

  return (
    <div className="bg-[#0d0f14] border border-[#1a1c22] rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col items-center h-full text-white">
      {/* Game Header */}
      <div className="w-full flex items-center justify-between border-b border-[#1a1c22] pb-4 mb-5">
        <div className="flex items-center gap-3">
          <Swords className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-sans font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              VAPOR-SNAKE GRID
            </h2>
            <p className="text-[10px] font-mono text-gray-500 uppercase">Synthwave Arcade Module</p>
          </div>
        </div>
        
        {/* Difficulties */}
        <div className="flex items-center gap-1.5 bg-[#11141b] border border-[#222731] p-1.5 rounded-lg">
          <button
            onClick={() => setSpeed(160)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${speed === 160 ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-[0_0_8px_rgba(6,182,212,0.4)]" : "text-gray-500 hover:text-white"}`}
          >
            Chill
          </button>
          <button
            onClick={() => setSpeed(110)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${speed === 110 ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-semibold shadow-[0_0_8px_rgba(217,70,239,0.4)]" : "text-gray-500 hover:text-white"}`}
          >
            Retro
          </button>
          <button
            onClick={() => setSpeed(70)}
            className={`px-2 py-1 rounded text-[10px] font-mono transition-all ${speed === 70 ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white font-semibold shadow-[0_0_8px_rgba(147,51,234,0.4)]" : "text-gray-500 hover:text-white"}`}
          >
            Hyper
          </button>
        </div>
      </div>

      {/* Scores */}
      <div className="w-full grid grid-cols-2 gap-4 mb-4">
        <div className="bg-[#11141b] border border-[#222731] rounded-xl p-3 flex items-center justify-between">
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Score</span>
          <span className="text-xl font-sans font-black tracking-tight text-fuchsia-500">
            {score}
          </span>
        </div>
        <div className="bg-[#11141b] border border-[#222731] rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Award className="w-4.5 h-4.5 text-yellow-500" />
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">Record</span>
          </div>
          <span className="text-xl font-sans font-black tracking-tight text-cyan-400">
            {highScore}
          </span>
        </div>
      </div>

      {/* Arcade Grid Frame */}
      <div 
        className={`relative w-full aspect-square max-w-[340px] rounded-xl overflow-hidden border-2 p-1 transition-all duration-300 ${
          musicPlaying && pulseTrigger % 4 === 0 
            ? "border-fuchsia-500 shadow-[0_0_20px_rgba(217,70,239,0.4)]" 
            : "border-[#1e232d] shadow-inner"
        }`}
        style={{
          backgroundImage: "radial-gradient(#1e232d 1.5px, transparent 1.5px)",
          backgroundSize: "16px 16px",
          backgroundColor: "#0a0c10"
        }}
      >
        {/* Retro Grid Backing Line Visualizer */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(34,211,238,0.03),rgba(217,70,239,0.03))] bg-[length:100%_4px,6px_100%] opacity-80 pointer-events-none" />

        {/* Outer cells layout */}
        <div className="relative w-full h-full bg-transparent rounded-lg grid grid-cols-20 grid-rows-20 gap-[1px]">
          {Array.from({ length: GRID_SIZE }).map((_, y) =>
            Array.from({ length: GRID_SIZE }).map((_, x) => (
              <div
                key={`${x}-${y}`}
                className={`w-full h-full transition-all duration-75 relative flex items-center justify-center ${getCellClassName(x, y)}`}
              >
                {/* Specific overlay icons for Food */}
                {food.x === x && food.y === y && (
                  <span className="text-xs absolute z-20 pointer-events-none filter drop-shadow-[0_0_6px_rgba(0,0,0,0.8)]">
                    {renderFoodIcon()}
                  </span>
                )}
              </div>
            ))
          )}

          {/* Pause / Start / Game Over Screen Overlays */}
          {!isPlaying && !isGameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-400 rounded-full flex items-center justify-center text-cyan-400 mb-4 animate-pulse">
                <Play className="w-6 h-6 translate-x-0.5 fill-cyan-400" />
              </div>
              <h3 className="font-sans font-bold tracking-wide text-lg text-cyan-300">VAPOR-SNAKE READY</h3>
              <p className="text-xs text-gray-400 mt-2 max-w-[200px]">
                Control with <span className="text-cyan-400 font-mono">WASD</span> or <span className="text-cyan-400 font-mono">ARROWS</span>. Eat glowing notes and discs!
              </p>
              <button
                onClick={resetGame}
                className="mt-5 px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-lg hover:scale-105 transition-all text-xs tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                START GAME
              </button>
            </div>
          )}

          {isGameOver && (
            <div className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="w-14 h-14 bg-fuchsia-500/10 border border-fuchsia-400 rounded-full flex items-center justify-center text-fuchsia-500 mb-4 animate-bounce">
                <Zap className="w-6 h-6 fill-fuchsia-500" />
              </div>
              <h3 className="font-sans font-bold tracking-widest text-lg text-fuchsia-500 uppercase">SYSTEM CRASH</h3>
              <p className="text-xs text-gray-400 mt-1">Retro core collapsed.</p>
              <div className="mt-3 bg-[#11141b] border border-[#222731] px-4 py-2 rounded-lg text-xs text-cyan-300 font-mono">
                FINAL SCORE: <span className="text-fuchsia-500 font-bold">{score}</span>
              </div>
              <button
                onClick={resetGame}
                className="mt-5 px-6 py-2 bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold rounded-lg hover:scale-105 transition-all text-xs tracking-wider shadow-[0_0_15px_rgba(217,70,239,0.4)]"
              >
                INSERT COIN (RETRY)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* On-screen Directional Pad (Mobile/Iframe Friendly) */}
      <div className="mt-5 w-full max-w-[200px] flex flex-col items-center gap-1 bg-[#11141b] border border-[#222731] p-2.5 rounded-xl">
        <button
          onClick={() => isPlaying && direction !== "DOWN" && setDirection("UP")}
          className="w-11 h-11 bg-[#0d0f14] border border-[#222731] hover:border-cyan-500/40 active:border-cyan-400 rounded-lg flex items-center justify-center transition-all text-gray-300 shadow-md font-mono text-xs"
        >
          ▲
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => isPlaying && direction !== "RIGHT" && setDirection("LEFT")}
            className="w-11 h-11 bg-[#0d0f14] border border-[#222731] hover:border-cyan-500/40 active:border-cyan-400 rounded-lg flex items-center justify-center transition-all text-gray-300 shadow-md font-mono text-xs"
          >
            ◀
          </button>
          <div className="w-11 h-11 flex items-center justify-center text-[10px] text-gray-600 font-mono">
            PAD
          </div>
          <button
            onClick={() => isPlaying && direction !== "LEFT" && setDirection("RIGHT")}
            className="w-11 h-11 bg-[#0d0f14] border border-[#222731] hover:border-cyan-500/40 active:border-cyan-400 rounded-lg flex items-center justify-center transition-all text-gray-300 shadow-md font-mono text-xs"
          >
            ▶
          </button>
        </div>
        <button
          onClick={() => isPlaying && direction !== "UP" && setDirection("DOWN")}
          className="w-11 h-11 bg-[#0d0f14] border border-[#222731] hover:border-cyan-500/40 active:border-cyan-400 rounded-lg flex items-center justify-center transition-all text-gray-300 shadow-md font-mono text-xs"
        >
          ▼
        </button>
      </div>
    </div>
  );
};
