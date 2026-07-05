import React, { useState, useEffect, useRef } from "react";
import { Track } from "../types";
import { synth } from "../lib/synth";
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Music, Disc, Radio } from "lucide-react";

interface MusicPlayerProps {
  currentTrack: Track;
  isPlaying: boolean;
  onTrackChange: (track: Track) => void;
  onPlayingChange: (playing: boolean) => void;
  pulseTrigger: number; // updates on every beat
}

export const tracks: Track[] = [
  {
    id: "1",
    title: "Neon Dreamscape",
    artist: "AI Gen Synthwave",
    genre: "Synthwave / Outrun",
    duration: "Looping",
    tempo: 120,
    baseNote: 130.81, // C3
    patternType: "chill",
  },
  {
    id: "2",
    title: "Cyberpunk Chase",
    artist: "AI Gen Dark-synth",
    genre: "Darksynth / Cyber",
    duration: "Looping",
    tempo: 140,
    baseNote: 110.00, // A2
    patternType: "cyber",
  },
  {
    id: "3",
    title: "Midnight Drive",
    artist: "AI Gen Dreamwave",
    genre: "Chillwave",
    duration: "Looping",
    tempo: 100,
    baseNote: 146.83, // D3
    patternType: "midnight",
  },
];

export const MusicPlayer: React.FC<MusicPlayerProps> = ({
  currentTrack,
  isPlaying,
  onTrackChange,
  onPlayingChange,
  pulseTrigger,
}) => {
  const [volume, setVolume] = useState<number>(0.3);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visHeights, setVisHeights] = useState<number[]>(new Array(12).fill(10));

  // Initialize synth volume
  useEffect(() => {
    synth.setVolume(isMuted ? 0 : volume);
  }, [volume, isMuted]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (isPlaying) {
      synth.stop();
      onPlayingChange(false);
    } else {
      synth.play(currentTrack);
      onPlayingChange(true);
    }
  };

  // Handle Track Skip
  const handleSkip = (direction: "forward" | "backward") => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack.id);
    let nextIndex = currentIndex;

    if (direction === "forward") {
      nextIndex = (currentIndex + 1) % tracks.length;
    } else {
      nextIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    }

    const nextTrack = tracks[nextIndex];
    onTrackChange(nextTrack);

    if (isPlaying) {
      synth.play(nextTrack);
    }
  };

  // Re-start synth if track changes while playing
  useEffect(() => {
    if (isPlaying) {
      synth.play(currentTrack);
    }
  }, [currentTrack]);

  // Animate custom canvas-based equalizer/visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    const barCount = 16;
    const bars: { target: number; current: number }[] = Array.from({ length: barCount }, () => ({
      target: 10,
      current: 10,
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gradient for neon effect
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, "#00f0ff"); // Cyan
      gradient.addColorStop(0.5, "#ff007f"); // Pink
      gradient.addColorStop(1, "#ffff00"); // Yellow glow

      const barWidth = canvas.width / barCount - 3;

      for (let i = 0; i < barCount; i++) {
        const bar = bars[i];
        
        // Decay current heights slowly
        bar.current += (bar.target - bar.current) * 0.15;
        bar.target = Math.max(5, bar.target - 2);

        // Render glow shadow
        ctx.shadowBlur = isPlaying ? 10 : 0;
        ctx.shadowColor = "#ff007f";

        // Draw bar
        ctx.fillStyle = gradient;
        ctx.fillRect(
          i * (barWidth + 3),
          canvas.height - bar.current,
          barWidth,
          bar.current
        );
      }

      // Reset shadows
      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isPlaying]);

  // Handle pulse triggers (on every beat of the Synth)
  useEffect(() => {
    if (!isPlaying) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Pulse random bars upwards on beat
    const barCount = 16;
    const targets = Array.from({ length: barCount }, (_, index) => {
      // Create interesting dynamic visual patterns based on index
      const baseHeight = Math.random() * (canvas.height - 20) + 10;
      const syncMultiplier = (pulseTrigger % 4 === 0) ? 1.2 : 0.8;
      return baseHeight * syncMultiplier;
    });

    // Update heights state for visual bars in UI
    setVisHeights(targets.slice(0, 12).map(h => Math.max(10, h * 0.4)));

    // Directly mutate targets in animation loop context via an event if needed, 
    // but updating state or reference is easier. We will let the useEffect hook capture it.
  }, [pulseTrigger, isPlaying]);

  return (
    <div className="bg-[#0d0f14] border border-[#1a1c22] rounded-2xl p-5 shadow-[0_0_20px_rgba(0,0,0,0.5)] flex flex-col h-full text-white">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-[#1a1c22] pb-4 mb-5">
        <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
        <div>
          <h2 className="font-sans font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            NEON MUSIC DECK
          </h2>
          <p className="text-[10px] font-mono text-gray-500 uppercase">AI-Procedural Audio Synthesis</p>
        </div>
      </div>

      {/* Album Cover Art / Visualizer */}
      <div className="relative aspect-square w-full rounded-xl bg-[#0a0c10] border border-[#1e232d] mb-5 overflow-hidden flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(34,211,238,0.06),rgba(0,255,0,0.02),rgba(217,70,239,0.06))] bg-[length:100%_4px,6px_100%] pointer-events-none" />
        
        {/* Pulsing Neon Disc */}
        <div className="relative z-10 flex flex-col items-center justify-center p-4">
          <div className={`relative rounded-full border-2 border-cyan-500/50 p-6 shadow-[0_0_30px_rgba(34,211,238,0.3)] transition-transform duration-500 ${isPlaying ? "animate-spin [animation-duration:8s]" : ""}`}>
            <Disc className="w-16 h-16 text-cyan-400" />
            <div className="absolute top-1/2 left-1/2 w-3 h-3 bg-cyan-400 rounded-full transform -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          <div className="mt-4 text-center">
            <h3 className="font-sans font-semibold tracking-wide text-cyan-300 text-sm">
              {currentTrack.title}
            </h3>
            <p className="text-[11px] font-mono text-gray-400 mt-0.5">{currentTrack.artist}</p>
            <span className="inline-block mt-2 px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded text-[9px] font-mono text-cyan-400 uppercase">
              {currentTrack.genre}
            </span>
          </div>
        </div>

        {/* Visualizer bars at the bottom */}
        <canvas
          ref={canvasRef}
          width={280}
          height={60}
          className="absolute bottom-0 left-0 w-full h-[60px] opacity-80 pointer-events-none"
        />
      </div>

      {/* Audio Wave Bars UI Grid (Simulated mini visualizer) */}
      <div className="flex justify-center items-end gap-1.5 h-10 px-4 mb-4">
        {visHeights.map((h, i) => (
          <div
            key={i}
            className="w-1.5 bg-cyan-500/20 rounded-t transition-all duration-75"
            style={{
              height: isPlaying ? `${Math.max(4, h)}px` : "4px",
              backgroundColor: isPlaying ? (i % 2 === 0 ? "#22d3ee" : "#3b82f6") : "#1e232d",
              boxShadow: isPlaying ? `0 0 8px ${i % 2 === 0 ? "#22d3ee" : "#3b82f6"}` : "none",
            }}
          />
        ))}
      </div>

      {/* Playlist Selector */}
      <div className="flex-1 overflow-y-auto max-h-[140px] space-y-2 mb-4 scrollbar-thin scrollbar-thumb-cyan-500/20">
        {tracks.map((t) => {
          const isActive = t.id === currentTrack.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                onTrackChange(t);
                if (isPlaying) synth.play(t);
              }}
              className={`w-full flex items-center justify-between p-3 border text-left transition-all ${
                isActive
                  ? "bg-gradient-to-r from-[#11141b] to-transparent border-l-4 border-cyan-500 border-y-transparent border-r-transparent rounded-r-xl text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.08)] font-semibold"
                  : "bg-transparent border-transparent text-gray-400 hover:bg-[#11141b] hover:text-white rounded-xl"
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Music className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-cyan-400 animate-pulse" : "text-gray-500"}`} />
                <div className="truncate">
                  <p className="text-xs font-semibold truncate">{t.title}</p>
                  <p className="text-[10px] text-gray-600 truncate">{t.artist}</p>
                </div>
              </div>
              <div className="text-[9px] font-mono text-gray-500 flex-shrink-0 bg-[#11141b] px-1.5 py-0.5 rounded border border-[#222731]">
                {t.tempo} BPM
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls & Volume */}
      <div className="border-t border-[#1a1c22] pt-4 mt-auto">
        <div className="flex items-center justify-center gap-5 mb-4">
          <button
            onClick={() => handleSkip("backward")}
            className="p-1.5 rounded-full hover:bg-[#11141b] text-gray-500 hover:text-gray-300 transition-colors"
            title="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          <button
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-cyan-500 text-black flex items-center justify-center hover:bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all transform active:scale-95"
            title={isPlaying ? "Pause Track" : "Play Track"}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-black" /> : <Play className="w-6 h-6 fill-black translate-x-0.5" />}
          </button>
          <button
            onClick={() => handleSkip("forward")}
            className="p-1.5 rounded-full hover:bg-[#11141b] text-gray-500 hover:text-gray-300 transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-gray-400 hover:text-white transition-colors"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-cyan-400" /> : <Volume2 className="w-4 h-4 text-gray-500" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(parseFloat(e.target.value));
              if (isMuted) setIsMuted(false);
            }}
            className="w-full h-1 bg-[#1a1c22] rounded-lg appearance-none cursor-pointer accent-cyan-500 focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
};
