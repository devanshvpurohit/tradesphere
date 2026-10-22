'use client';

import React, { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, X, Download, Film, Sparkles, CheckCircle2 } from 'lucide-react';

interface VideoDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHAPTERS = [
  { time: 0, label: '0:00 Intro & Brand Vision' },
  { time: 10, label: '0:10 NSE & BSE Live Feed' },
  { time: 21, label: '0:21 Pro Candlestick Desk' },
  { time: 33, label: '0:33 Autonomous Multi-LLM Agents' },
  { time: 51, label: '0:51 Institutional F&O Greeks' },
  { time: 62, label: '1:02 Outro & Virtual Balance' },
];

export function VideoDemoModal({ isOpen, onClose }: VideoDemoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(70.5);

  if (!isOpen) return null;

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const jumpTo = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = seconds;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const toggleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-[#0B0F19] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl shadow-blue-500/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                TradeSphere Platform Showcase
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                  1080p 60fps
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Institutional-grade virtual trading simulator & autonomous quant execution
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/tradesphere_demo.mp4"
              download="TradeSphere_Showcase.mp4"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              Download MP4
            </a>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="relative bg-black aspect-video flex items-center justify-center overflow-hidden group">
          <video
            ref={videoRef}
            src="/tradesphere_demo.mp4"
            className="w-full h-full object-contain"
            onTimeUpdate={() => {
              if (videoRef.current) {
                setCurrentTime(videoRef.current.currentTime);
                setDuration(videoRef.current.duration || 70.5);
              }
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            autoPlay
            playsInline
          />

          {/* Overlay Play/Pause Big Button */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/40 group-hover:bg-black/20 transition-all"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/90 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 hover:scale-110 transition-transform">
                <Play className="w-8 h-8 ml-1 fill-slate-950" />
              </div>
            </button>
          )}

          {/* Bottom Bar Controls inside player */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-3 text-white">
            <div className="flex items-center gap-3">
              <button onClick={togglePlay} className="p-1.5 hover:text-emerald-400 transition-colors">
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
              </button>
              <button onClick={toggleMute} className="p-1.5 hover:text-emerald-400 transition-colors">
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <span className="text-xs font-mono text-slate-300">
                {Math.floor(currentTime / 60)}:{(Math.floor(currentTime % 60)).toString().padStart(2, '0')} / 1:10
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleFullscreen}
                className="p-1.5 hover:text-emerald-400 transition-colors"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Chapters Strip */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/40">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            Quick Navigation Chapters
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {CHAPTERS.map((ch, idx) => {
              const isActive = currentTime >= ch.time && (idx === CHAPTERS.length - 1 || currentTime < CHAPTERS[idx + 1].time);
              return (
                <button
                  key={ch.time}
                  onClick={() => jumpTo(ch.time)}
                  className={`text-left px-2.5 py-2 rounded-lg text-xs font-mono transition-all border ${
                    isActive
                      ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-400 font-semibold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="truncate">{ch.label}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
