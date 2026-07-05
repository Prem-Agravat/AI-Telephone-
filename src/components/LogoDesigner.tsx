import React, { useState, useRef } from "react";
import { LogoConfig, VideoGenerationState } from "../types";
import { Sparkles, Image as ImageIcon, Upload, Download, RefreshCw, Eye, Play, Sliders, Layers, Film } from "lucide-react";

export const LogoDesigner: React.FC = () => {
  // Input states
  const [companyName, setCompanyName] = useState<string>("RetroSynth Labs");
  const [slogan, setSlogan] = useState<string>("Soundwaves of the Future");
  const [description, setDescription] = useState<string>(
    "A sleek electronic music brand with glowing neon mountain peaks and a retro cassette tape icon inside a circle."
  );

  // Logo config state (Dynamic SVG)
  const [logoConfig, setLogoConfig] = useState<LogoConfig | null>({
    theme: "synthwave",
    backgroundColor: "#0a0a0f",
    primaryColor: "#ff007f",
    secondaryColor: "#00f0ff",
    accentColor: "#ffff00",
    shapes: [
      {
        type: "circle",
        cx: 250,
        cy: 220,
        r: 140,
        stroke: "secondary",
        strokeWidth: 4,
        fill: "none",
        glow: true,
        animation: "pulse",
        animationDuration: "4s",
      },
      {
        type: "polygon",
        points: "250,130 160,280 340,280",
        stroke: "primary",
        strokeWidth: 5,
        fill: "none",
        glow: true,
        animation: "flicker",
        animationDuration: "5s",
      },
      {
        type: "path",
        d: "M 150 250 L 350 250 M 150 220 L 350 220 M 150 190 L 350 190",
        stroke: "secondary",
        strokeWidth: 2,
        fill: "none",
        glow: false,
        animation: "float",
        animationDuration: "3s",
      },
      {
        type: "text",
        textContent: "RETROSYNTH",
        x: 250,
        y: 400,
        fontSize: 38,
        fontFamily: "Space Grotesk, sans-serif",
        fontWeight: "900",
        fill: "primary",
        textAnchor: "middle",
        glow: true,
        animation: "none",
      },
      {
        type: "text",
        textContent: "SOUNDWAVES OF THE FUTURE",
        x: 250,
        y: 435,
        fontSize: 14,
        fontFamily: "JetBrains Mono, monospace",
        fontWeight: "500",
        fill: "secondary",
        textAnchor: "middle",
        glow: false,
        animation: "none",
      },
    ],
    developerNotes: "Default retro synthwave starter preset.",
  });

  const [activeTab, setActiveTab] = useState<"vector" | "raster" | "video">("vector");
  const [isDesigning, setIsDesigning] = useState<boolean>(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  // Raster Image Logo State
  const [rasterPrompt, setRasterPrompt] = useState<string>(
    "A gorgeous high-tech neon corporate logo, dark dark vector aesthetics, glowing purple neon mountains, clean flat design style, centered, black background"
  );
  const [imageSize, setImageSize] = useState<"1K" | "2K" | "4K">("1K");
  const [rasterLogoUrl, setRasterLogoUrl] = useState<string | null>(null);
  const [isGeneratingRaster, setIsGeneratingRaster] = useState<boolean>(false);

  // Veo Video Generation States
  const [videoPrompt, setVideoPrompt] = useState<string>(
    "The logo emblem slowly rotates and flares with volumetric neon light. Cyberpunk city grids drift underneath. Volumetric smoke and particles, 4k resolution, smooth cinematography"
  );
  const [videoAspectRatio, setVideoAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null); // base64
  const [uploadedPhotoMime, setUploadedPhotoMime] = useState<string>("image/png");
  const [videoState, setVideoState] = useState<VideoGenerationState>({
    operationName: null,
    status: "idle",
    progressMessage: "",
    videoUrl: null,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Formulate active logo representation for video starting frame
  const getLogoBase64Source = () => {
    // If user uploaded a photo explicitly, use it!
    if (uploadedPhoto) return uploadedPhoto;
    // Fallback or use raster logo
    if (rasterLogoUrl) return rasterLogoUrl;
    return null;
  };

  // 1. Generate Vector SVG Config Logo from Gemini
  const handleGenerateVectorLogo = async () => {
    setIsDesigning(true);
    setLogoError(null);
    try {
      const response = await fetch("/api/generate-logo-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: description,
          companyName: companyName,
          slogan: slogan,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to parse design layout.");
      }

      const data: LogoConfig = await response.json();
      setLogoConfig(data);

      // Pre-populate raster prompt based on generated aesthetics
      setRasterPrompt(
        `A high-end futuristic neon corporate logo for "${companyName}". Features ${description}. Dark clean minimalist vector aesthetic, high contrast glow, black background`
      );
    } catch (err: any) {
      console.error(err);
      setLogoError(err.message || "Could not generate vector layout. Try again.");
    } finally {
      setIsDesigning(false);
    }
  };

  // 2. Generate High-Quality Raster Logo Image using gemini-3-pro-image
  const handleGenerateRasterLogo = async () => {
    setIsGeneratingRaster(true);
    setLogoError(null);
    try {
      const response = await fetch("/api/generate-logo-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: rasterPrompt,
          size: imageSize,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Image generation model failed.");
      }

      const data = await response.json();
      setRasterLogoUrl(data.imageUrl);
    } catch (err: any) {
      console.error(err);
      setLogoError(err.message || "Failed to generate high-resolution image.");
    } finally {
      setIsGeneratingRaster(false);
    }
  };

  // 3. File Upload Drag and Drop handlers
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedPhotoMime(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 4. Start Veo Video Generation (veo-3.1-fast-generate-preview)
  const handleStartVideoGeneration = async () => {
    setVideoState({
      operationName: null,
      status: "starting",
      progressMessage: "Establishing neural framework for animation stream...",
      videoUrl: null,
      error: null,
    });

    const activeImage = getLogoBase64Source();

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: videoPrompt,
          image: activeImage,
          mimeType: activeImage ? (uploadedPhoto ? uploadedPhotoMime : "image/png") : undefined,
          aspectRatio: videoAspectRatio,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Failed to initialize Veo operation.");
      }

      const data = await response.json();
      const operationName = data.operationName;

      setVideoState((prev) => ({
        ...prev,
        operationName,
        status: "polling",
        progressMessage: "Volumetric spatial coherence lock established. Initiating video generation stream...",
      }));

      // Start status polling
      startPollingVideo(operationName);
    } catch (err: any) {
      console.error(err);
      setVideoState({
        operationName: null,
        status: "failed",
        progressMessage: "",
        videoUrl: null,
        error: err.message || "Failed to launch cinematic video generation.",
      });
    }
  };

  // 5. Polling Loop for Video Status
  const startPollingVideo = (operationName: string) => {
    const logs = [
      "Synthesizing motion lattices across temporal buffers...",
      "Injecting dynamic neon chromatic dispersion...",
      "Optimizing spatial rendering nodes...",
      "Volumetric atmosphere passes calculating...",
      "Consolidating video frames into a fluid stream...",
      "Injecting high-fidelity temporal coherence...",
    ];
    let logIndex = 0;

    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/video-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ operationName }),
        });

        if (!response.ok) {
          throw new Error("Failed to poll status.");
        }

        const data = await response.json();

        if (data.done) {
          clearInterval(interval);
          if (data.error) {
            throw new Error(data.error.message || "Model failed to produce video due to safety or capacity constraints.");
          }

          // Trigger download phase
          downloadVideo(operationName);
        } else {
          // Update log message dynamically to improve UX
          const nextMsg = logs[logIndex % logs.length];
          logIndex++;
          setVideoState((prev) => ({
            ...prev,
            progressMessage: `${nextMsg} (This may take 1-2 minutes)`,
          }));
        }
      } catch (err: any) {
        clearInterval(interval);
        setVideoState({
          operationName: null,
          status: "failed",
          progressMessage: "",
          videoUrl: null,
          error: err.message || "Polling failed. High load on the server. Try again later.",
        });
      }
    }, 8000);
  };

  // 6. Download Video Binary and Create local URL
  const downloadVideo = async (operationName: string) => {
    setVideoState((prev) => ({
      ...prev,
      status: "downloading",
      progressMessage: "Compilation complete. Downloading cinematic video stream...",
    }));

    try {
      const response = await fetch("/api/video-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operationName }),
      });

      if (!response.ok) {
        throw new Error("Failed to stream video file.");
      }

      const blob = await response.blob();
      const videoUrl = URL.createObjectURL(blob);

      setVideoState((prev) => ({
        ...prev,
        status: "ready",
        progressMessage: "Dynamic retro animation ready!",
        videoUrl,
      }));
    } catch (err: any) {
      console.error(err);
      setVideoState({
        operationName: null,
        status: "failed",
        progressMessage: "",
        videoUrl: null,
        error: err.message || "Failed to download and decode final video binary.",
      });
    }
  };

  // Helper: map named colors to hexadecimal colors from active logo config
  const resolveColor = (colorName?: string) => {
    if (!colorName || !logoConfig) return "#ffffff";
    if (colorName === "primary") return logoConfig.primaryColor;
    if (colorName === "secondary") return logoConfig.secondaryColor;
    if (colorName === "accent") return logoConfig.accentColor;
    if (colorName === "none") return "none";
    return colorName;
  };

  return (
    <div className="bg-[#0d0f14] border border-[#1a1c22] rounded-2xl p-6 shadow-lg text-white h-full flex flex-col md:flex-row gap-6">
      {/* LEFT: Logo Specifications & Form */}
      <div className="w-full md:w-5/12 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-sans font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            LOGO DESIGN STUDIO
          </h2>
          <p className="text-xs text-gray-500 font-mono mt-1">Design, Render & Animate with Gemini & Veo</p>
        </div>

        {/* Global Inputs */}
        <div className="space-y-3 bg-[#11141b] border border-[#222731] p-4 rounded-xl">
          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Company / Brand Name</label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full bg-[#0d0f14] border border-[#222731] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-semibold"
              placeholder="e.g. RetroSynth Labs"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Brand Slogan</label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => setSlogan(e.target.value)}
              className="w-full bg-[#0d0f14] border border-[#222731] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
              placeholder="e.g. Soundwaves of the Future"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Logo Concept / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#0d0f14] border border-[#222731] focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              placeholder="Describe icons, shapes, layout, colors, grids..."
            />
          </div>

          {/* Quick Design Action */}
          <button
            onClick={handleGenerateVectorLogo}
            disabled={isDesigning || !companyName || !description}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-[#11141b] disabled:to-[#11141b] disabled:text-gray-600 text-white font-semibold rounded-lg text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2"
          >
            {isDesigning ? (
              <>
                <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                Drafting Brand Geometry...
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5 fill-white" />
                Draft Vector Logo (Instant)
              </>
            )}
          </button>
        </div>

        {/* Dynamic Context Parameters depending on active workspace tab */}
        {activeTab === "raster" && (
          <div className="space-y-3 bg-[#11141b] border border-[#222731] p-4 rounded-xl mt-1">
            <h3 className="text-xs font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 border-b border-cyan-500/10 pb-1.5">
              <ImageIcon className="w-4 h-4" />
              Gemini Pro Image Settings
            </h3>
            
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Creative Prompt (AI Image)</label>
              <textarea
                value={rasterPrompt}
                onChange={(e) => setRasterPrompt(e.target.value)}
                rows={2}
                className="w-full bg-black/60 border border-gray-800 focus:border-cyan-500 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            {/* Size Affordance Constraint */}
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Image Resolution Output</label>
              <div className="grid grid-cols-3 gap-2 bg-[#0d0f14] p-1 rounded-lg border border-[#222731]">
                {(["1K", "2K", "4K"] as const).map((sz) => (
                  <button
                    key={sz}
                    onClick={() => setImageSize(sz)}
                    className={`py-1.5 rounded font-mono text-[10px] uppercase transition-all ${
                      imageSize === sz
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                        : "text-gray-400 hover:text-white hover:bg-[#11141b]"
                    }`}
                  >
                    {sz} (HQ)
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerateRasterLogo}
              disabled={isGeneratingRaster || !rasterPrompt}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:from-[#11141b] disabled:to-[#11141b] disabled:text-gray-600 text-white font-semibold rounded-lg text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)]"
            >
              {isGeneratingRaster ? (
                <div className="flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating {imageSize} Logo...
                </div>
              ) : (
                "Generate HQ Raster Image"
              )}
            </button>
          </div>
        )}

        {activeTab === "video" && (
          <div className="space-y-3 bg-[#11141b] border border-[#222731] p-4 rounded-xl mt-1">
            <h3 className="text-xs font-mono text-fuchsia-400 uppercase tracking-wider flex items-center gap-1.5 mb-2 border-b border-fuchsia-500/10 pb-1.5">
              <Film className="w-4 h-4" />
              Veo Cinematic Animator
            </h3>

            {/* Drag Drop Photo Upload Support */}
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Starting Image Source</label>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#222731] hover:border-fuchsia-500/40 bg-[#0d0f14] hover:bg-[#11141b] rounded-lg p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all mb-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                {uploadedPhoto ? (
                  <div className="flex items-center gap-2 text-fuchsia-400">
                    <Eye className="w-4 h-4" />
                    <span className="text-xs font-mono truncate max-w-[150px]">Custom Image Loaded</span>
                  </div>
                ) : rasterLogoUrl ? (
                  <div className="flex items-center gap-2 text-cyan-400">
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-xs font-mono">Using Generated Raster Logo</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-gray-500">
                    <Upload className="w-5 h-5 text-gray-400" />
                    <p className="text-[10px] font-medium text-center">Drag / Click to upload reference photo</p>
                    <p className="text-[9px] text-gray-600">(Or generates video from prompt directly)</p>
                  </div>
                )}
              </div>

              {uploadedPhoto && (
                <button
                  onClick={() => setUploadedPhoto(null)}
                  className="text-[9px] font-mono text-fuchsia-500/80 hover:text-fuchsia-400 underline block mb-3 text-right"
                >
                  Clear custom image upload
                </button>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Veo Motion Prompt</label>
              <textarea
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                rows={2}
                className="w-full bg-[#0d0f14] border border-[#222731] focus:border-fuchsia-500 rounded-lg px-3 py-2 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 transition-all"
              />
            </div>

            {/* Aspect Ratio Selector Constraint */}
            <div>
              <label className="block text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1.5">Aspect Ratio (Landscape/Portrait)</label>
              <div className="grid grid-cols-2 gap-2 bg-[#0d0f14] p-1 rounded-lg border border-[#222731]">
                {(["16:9", "9:16"] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setVideoAspectRatio(ratio)}
                    className={`py-1.5 rounded font-mono text-[10px] transition-all ${
                      videoAspectRatio === ratio
                        ? "bg-gradient-to-r from-fuchsia-500 to-purple-600 text-white font-bold shadow-[0_0_8px_rgba(217,70,239,0.4)]"
                        : "text-gray-400 hover:text-white hover:bg-[#11141b]"
                    }`}
                  >
                    {ratio === "16:9" ? "16:9 Landscape" : "9:16 Portrait"}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartVideoGeneration}
              disabled={videoState.status === "starting" || videoState.status === "polling" || videoState.status === "downloading"}
              className="w-full py-2.5 bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-semibold rounded-lg text-xs tracking-wider uppercase transition-all shadow-[0_0_15px_rgba(217,70,239,0.3)] flex items-center justify-center gap-2"
            >
              <Film className="w-4 h-4" />
              Generate Cinematic Video
            </button>
          </div>
        )}
      </div>

      {/* RIGHT: Active Viewer Canvas Screen */}
      <div className="w-full md:w-7/12 flex flex-col gap-4">
        {/* Tab View Selection */}
        <div className="flex border-b border-[#222731] gap-1 bg-[#11141b] p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("vector")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === "vector"
                ? "bg-[#0d0f14] border border-[#222731] text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Layers className="w-4 h-4" />
            Interactive Vector
          </button>
          <button
            onClick={() => setActiveTab("raster")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === "raster"
                ? "bg-[#0d0f14] border border-[#222731] text-cyan-400 font-bold shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            AI Raster Image
          </button>
          <button
            onClick={() => setActiveTab("video")}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all ${
              activeTab === "video"
                ? "bg-[#0d0f14] border border-[#222731] text-fuchsia-500 font-bold shadow-[0_0_10px_rgba(217,70,239,0.1)]"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            <Film className="w-4 h-4" />
            Veo Animator
          </button>
        </div>

        {/* Central Display Screen */}
        <div 
          className="flex-1 min-h-[380px] rounded-2xl border border-[#1e232d] flex flex-col items-center justify-center relative overflow-hidden p-6 shadow-inner"
          style={{
            backgroundImage: "radial-gradient(#1e232d 1.5px, transparent 1.5px)",
            backgroundSize: "16px 16px",
            backgroundColor: "#0a0c10"
          }}
        >
          {/* Scanline overlay for aesthetic feel */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(34,211,238,0.03),rgba(217,70,239,0.03))] bg-[length:100%_4px,6px_100%] pointer-events-none z-10 opacity-85" />

          {/* Errors display */}
          {logoError && (
            <div className="absolute top-4 left-4 right-4 bg-red-950/80 border border-red-500 text-red-200 p-3 rounded-lg text-xs z-20 font-mono">
              <p className="font-semibold">CORE DIAGNOSTIC ERROR:</p>
              <p className="mt-1">{logoError}</p>
            </div>
          )}

          {/* TAB 1: Vector SVG Renderer */}
          {activeTab === "vector" && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {logoConfig ? (
                <div 
                  className="w-full max-w-[340px] aspect-square rounded-xl flex items-center justify-center relative transition-all shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-cyan-500/20"
                  style={{ backgroundColor: logoConfig.backgroundColor }}
                >
                  <svg
                    viewBox="0 0 500 500"
                    className="w-full h-full p-4"
                  >
                    {/* Glow filter definition */}
                    <defs>
                      <filter id="neon-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* Shapes Parser */}
                    {logoConfig.shapes.map((shape, i) => {
                      const colorFill = resolveColor(shape.fill);
                      const colorStroke = resolveColor(shape.stroke);
                      const filterEffect = shape.glow ? "url(#neon-glow)" : undefined;

                      // Animation styles class mappings
                      let animationClass = "";
                      if (shape.animation === "spin") animationClass = "animate-spin origin-center";
                      if (shape.animation === "pulse") animationClass = "animate-pulse";
                      if (shape.animation === "float") animationClass = "animate-bounce";

                      const inlineStyles = shape.animationDuration ? {
                        animationDuration: shape.animationDuration
                      } : undefined;

                      if (shape.type === "circle") {
                        return (
                          <circle
                            key={i}
                            cx={shape.cx}
                            cy={shape.cy}
                            r={shape.r}
                            fill={colorFill}
                            stroke={colorStroke}
                            strokeWidth={shape.strokeWidth}
                            filter={filterEffect}
                            className={animationClass}
                            style={inlineStyles}
                          />
                        );
                      }

                      if (shape.type === "rect") {
                        return (
                          <rect
                            key={i}
                            x={shape.x}
                            y={shape.y}
                            width={shape.width}
                            height={shape.height}
                            rx={shape.rx}
                            ry={shape.ry}
                            fill={colorFill}
                            stroke={colorStroke}
                            strokeWidth={shape.strokeWidth}
                            filter={filterEffect}
                            className={animationClass}
                            style={inlineStyles}
                          />
                        );
                      }

                      if (shape.type === "polygon") {
                        return (
                          <polygon
                            key={i}
                            points={shape.points}
                            fill={colorFill}
                            stroke={colorStroke}
                            strokeWidth={shape.strokeWidth}
                            filter={filterEffect}
                            className={animationClass}
                            style={inlineStyles}
                          />
                        );
                      }

                      if (shape.type === "path") {
                        return (
                          <path
                            key={i}
                            d={shape.d}
                            fill={colorFill}
                            stroke={colorStroke}
                            strokeWidth={shape.strokeWidth}
                            filter={filterEffect}
                            className={animationClass}
                            style={inlineStyles}
                          />
                        );
                      }

                      if (shape.type === "text") {
                        return (
                          <text
                            key={i}
                            x={shape.x}
                            y={shape.y}
                            fontSize={shape.fontSize}
                            fontFamily={shape.fontFamily}
                            fontWeight={shape.fontWeight}
                            fill={colorFill}
                            textAnchor={shape.textAnchor}
                            filter={filterEffect}
                            className={animationClass}
                            style={inlineStyles}
                          >
                            {shape.textContent}
                          </text>
                        );
                      }

                      return null;
                    })}
                  </svg>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <Layers className="w-12 h-12 mx-auto text-purple-600/30 mb-3 animate-pulse" />
                  <p className="text-sm">Initiate brand draft config on the left panel.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Raster HQ Image Viewer */}
          {activeTab === "raster" && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {rasterLogoUrl ? (
                <div className="relative group max-w-[340px] aspect-square rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                  <img
                    src={rasterLogoUrl}
                    alt="AI Generated Company Logo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-4">
                    <a
                      href={rasterLogoUrl}
                      download={`${companyName}_logo.png`}
                      className="flex items-center gap-2 bg-cyan-500 text-black font-semibold text-xs px-3 py-1.5 rounded-lg ml-auto hover:bg-cyan-400 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Save {imageSize} PNG
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 p-6">
                  <ImageIcon className="w-12 h-12 mx-auto text-cyan-500/20 mb-3" />
                  <p className="text-sm font-sans">No HQ Raster Image Generated yet.</p>
                  <p className="text-[11px] text-gray-600 max-w-[250px] mt-2">
                    Adjust prompt and size on left panel, then trigger generate content.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Veo Animator Screen */}
          {activeTab === "video" && (
            <div className="w-full h-full flex flex-col items-center justify-center">
              {videoState.status === "idle" && !videoState.videoUrl && (
                <div className="text-center text-gray-500 p-6">
                  <Film className="w-12 h-12 mx-auto text-pink-500/20 mb-3" />
                  <p className="text-sm font-sans">Veo Cinemagraph Module</p>
                  <p className="text-[11px] text-gray-600 max-w-[300px] mt-2 leading-relaxed">
                    Animates static logos or uploaded photos into beautiful looping 3D scene videos. Uses model: <span className="text-pink-500/80 font-mono text-[10px]">veo-3.1-fast-generate-preview</span>.
                  </p>
                </div>
              )}

              {/* Loader with styled Progress logs */}
              {(videoState.status === "starting" ||
                videoState.status === "polling" ||
                videoState.status === "downloading") && (
                <div className="text-center p-6 bg-gray-950/60 rounded-2xl border border-pink-500/25 max-w-[360px] relative overflow-hidden">
                  <div className="w-16 h-16 border-2 border-pink-500/20 border-t-pink-500 rounded-full animate-spin mx-auto mb-5" />
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-pink-500/10 border border-pink-500/30 font-mono text-[9px] text-pink-400 uppercase tracking-widest mb-3 animate-pulse">
                    Veo Generative Phase
                  </span>
                  <p className="text-xs text-white font-medium">{videoState.progressMessage}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-3 leading-relaxed">
                    Veo operations are extensive. Please remain patient while the frames are compiled.
                  </p>
                </div>
              )}

              {videoState.status === "failed" && (
                <div className="text-center p-6 bg-red-950/20 border border-red-500/30 rounded-2xl max-w-[320px]">
                  <Film className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-red-400">VEOPROCESS_FAILED</h4>
                  <p className="text-xs text-gray-400 mt-2">{videoState.error || "An unexpected error occurred during rendering."}</p>
                  <button
                    onClick={handleStartVideoGeneration}
                    className="mt-4 px-4 py-1.5 bg-red-500 text-black font-semibold text-xs rounded hover:bg-red-400 transition-all"
                  >
                    RETRY GENERATION
                  </button>
                </div>
              )}

              {/* Ready Video player! */}
              {videoState.status === "ready" && videoState.videoUrl && (
                <div className="relative w-full max-w-[420px] rounded-2xl overflow-hidden border border-pink-500/30 shadow-[0_0_30px_rgba(236,72,153,0.25)] flex flex-col items-center">
                  <video
                    src={videoState.videoUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-auto object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-black/70 px-2 py-0.5 rounded border border-pink-500/30 font-mono text-[9px] text-pink-400 uppercase">
                    Veo Rendered (1080p)
                  </div>
                  <div className="w-full bg-gray-950/80 p-3.5 border-t border-gray-900 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-pink-400">Cinematic Animation Loop</p>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Model: veo-3.1-fast-generate-preview</p>
                    </div>
                    <a
                      href={videoState.videoUrl}
                      download={`${companyName}_animated.mp4`}
                      className="p-2 bg-pink-500 text-black rounded-lg hover:scale-105 transition-all flex items-center gap-1 text-xs font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Save MP4
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
