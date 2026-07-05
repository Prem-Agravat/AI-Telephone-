import { useState, useEffect } from "react";
import { Track } from "./types";
import { MusicPlayer, tracks } from "./components/MusicPlayer";
import { SnakeGame } from "./components/SnakeGame";
import { LogoDesigner } from "./components/LogoDesigner";
import { synth } from "./lib/synth";
import { Radio, Swords, Sparkles, Cpu, Clock, Github, VolumeX, HelpCircle } from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"arcade" | "logo">("arcade");
  const [currentTrack, setCurrentTrack] = useState<Track>(tracks[0]);
  const [musicPlaying, setMusicPlaying] = useState<boolean>(false);
  const [pulseTrigger, setPulseTrigger] = useState<number>(0);
  const [gameScore, setGameScore] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<string>("");

  // Clock tick
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Listen to synth beat pulses for global sound reactivity
  useEffect(() => {
    synth.setOnBeat((step) => {
      setPulseTrigger((prev) => prev + 1);
    });
    return () => {
      synth.setOnBeat(() => {});
    };
  }, []);

  // Sync state if audio plays externally/stops
  useEffect(() => {
    return () => {
      synth.stop();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#07080a] text-white font-sans selection:bg-cyan-500 selection:text-black pb-12">
      {/* Primary Top Bar */}
      <header className="relative border-b border-[#1a1c22] bg-[#0d0f14]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center gap-3.5">
          <div className="p-2 bg-[#11141b] border border-[#222731] rounded-xl shadow-md">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-sans font-black tracking-widest text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              NEON RETRO ARCADE
            </h1>
            <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">Synth Player • Snake • Logo Studio</p>
          </div>
        </div>

        {/* Global Nav Tabs */}
        <nav className="flex items-center gap-1 bg-[#11141b] p-1 rounded-xl border border-[#222731]">
          <button
            onClick={() => setActiveTab("arcade")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2.5 transition-all ${
              activeTab === "arcade"
                ? "bg-[#0d0f14] border border-[#222731] text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Swords className="w-4.5 h-4.5" />
            Vapor Arcade
          </button>
          <button
            onClick={() => setActiveTab("logo")}
            className={`px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-2.5 transition-all ${
              activeTab === "logo"
                ? "bg-[#0d0f14] border border-[#222731] text-fuchsia-400 font-bold shadow-[0_0_10px_rgba(217,70,239,0.1)]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            AI Logo Studio
          </button>
        </nav>

        {/* Status Indicators */}
        <div className="hidden md:flex items-center gap-5 font-mono text-[10px] text-gray-500">
          <div className="flex items-center gap-1.5 bg-[#11141b] px-3 py-1.5 rounded-lg border border-[#222731]">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-gray-400">{currentTime || "00:00:00"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${musicPlaying ? "bg-cyan-400 animate-pulse" : "bg-gray-700"}`} />
            <span className="text-gray-500 uppercase tracking-wider">{musicPlaying ? "TRACKING ACTIVE" : "SYNTH IDLE"}</span>
          </div>
        </div>
      </header>

      {/* Main Panel Content Canvas */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-20">
        
        {activeTab === "arcade" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* LEFT COLUMN: Neon Music Synthesizer Player */}
            <div className="lg:col-span-4 h-full">
              <MusicPlayer
                currentTrack={currentTrack}
                isPlaying={musicPlaying}
                onTrackChange={setCurrentTrack}
                onPlayingChange={setMusicPlaying}
                pulseTrigger={pulseTrigger}
              />
            </div>

            {/* CENTER COLUMN: Retro Vapor-Snake Game Grid */}
            <div className="lg:col-span-5 h-full">
              <SnakeGame
                onScoreChange={setGameScore}
                musicPlaying={musicPlaying}
                pulseTrigger={pulseTrigger}
              />
            </div>

            {/* RIGHT COLUMN: Instructions and Neon Specs Panel */}
            <div className="lg:col-span-3 flex flex-col gap-6">
              {/* Instructions Board */}
              <div className="bg-[#0d0f14] border border-[#1a1c22] rounded-2xl p-5 shadow-lg">
                <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3 border-b border-[#1e232d] pb-2">
                  System Parameters
                </h3>
                <ul className="space-y-3.5 text-xs text-gray-500">
                  <li className="flex gap-2.5 items-start">
                    <span className="text-cyan-400 font-bold">1.</span>
                    <p>Select tracks in the playlist. The Web Audio synthesizer generates authentic 8-step basslines and arpeggios on-the-fly!</p>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="text-fuchsia-500 font-bold">2.</span>
                    <p>Press the <strong className="text-gray-300 font-medium">Start Game</strong> button. The snake grid glows and bounces to the actual tempo of the active song!</p>
                  </li>
                  <li className="flex gap-2.5 items-start">
                    <span className="text-blue-400 font-bold">3.</span>
                    <p>Consume food notes (<span className="text-fuchsia-400 font-mono">🎵</span>), loops (<span className="text-cyan-400 font-mono">💾</span>), and stars (<span className="text-yellow-400 font-mono">⭐</span>) to score points and trigger sound beeps.</p>
                  </li>
                </ul>
              </div>

              {/* Live Arcade Log Stats */}
              <div className="bg-[#0d0f14] border border-[#1a1c22] rounded-2xl p-5 shadow-lg flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-mono text-fuchsia-400 uppercase tracking-widest mb-3 border-b border-[#1e232d] pb-2">
                    Retro Core Status
                  </h3>
                  <div className="space-y-2 font-mono text-[11px]">
                    <div className="flex justify-between py-1 border-b border-[#11141b]">
                      <span className="text-gray-600">SYSTEM STATE:</span>
                      <span className="text-cyan-400">ONLINE</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#11141b]">
                      <span className="text-gray-600">TEMPO (BPM):</span>
                      <span className="text-fuchsia-400">{currentTrack.tempo}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#11141b]">
                      <span className="text-gray-600">CORE SINE:</span>
                      <span className="text-cyan-400">{currentTrack.baseNote} HZ</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-gray-600">ACTIVE CHANNELS:</span>
                      <span className="text-fuchsia-400">4 CH</span>
                    </div>
                  </div>
                </div>

                {/* Score badge at bottom right column */}
                <div className="mt-6 bg-[#11141b] p-3.5 rounded-xl border border-[#222731] flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase">Current Session</span>
                    <h4 className="text-xs font-bold text-gray-400">Arcade Score</h4>
                  </div>
                  <div className="text-2xl font-sans font-black text-fuchsia-500">
                    {gameScore}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* TAB 2: AI Logo design and animation canvas */
          <LogoDesigner />
        )}
      </main>

      {/* Page Footer */}
      <footer className="mt-16 text-center border-t border-[#1a1c22] pt-6">
        <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
          Neon Retro Cabin • Crafted with premium React, Tailwind & Google GenAI Models
        </p>
      </footer>
    </div>
  );
}
