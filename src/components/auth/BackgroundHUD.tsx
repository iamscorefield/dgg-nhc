'use client';

import React, { useState, useEffect } from 'react';

const VIDEO_SLIDES = [
  '/assets/videos/slide-1.mp4',
  '/assets/videos/slide-2.mp4',
  '/assets/videos/slide-3.mp4',
  '/assets/videos/slide-4.mp4'
];

const TYPING_PHRASES = [
  'Welcome to the DGG Nexus-Hub Ecosystem...',
  'Where Remote Job-Seekers are connected,',
  'Startup Owner/Entreprenuer trust to hire...',
  'Active Tri-Party Startup Negotiation Rooms Online...',
];

export default function BackgroundHUD() {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [timeStr, setTimeStr] = useState('00:00:00 WAT');
  const [dateStr, setDateStr] = useState('Sep 13, 2026');

  // Background 3-second presentation video slide switcher
  useEffect(() => {
    const slideTimer = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % VIDEO_SLIDES.length);
    }, 3000);
    return () => clearInterval(slideTimer);
  }, []);

  // Multi-sentence typing engine loop
  useEffect(() => {
    const currentPhrase = TYPING_PHRASES[phraseIndex];
    let typingSpeed = isDeleting ? 35 : 75;

    if (!isDeleting && typedText === currentPhrase) {
      typingSpeed = 2000; // Hold full sentence for 2 seconds
    } else if (isDeleting && typedText === '') {
      setIsDeleting(false);
      setPhraseIndex((prev) => (prev + 1) % TYPING_PHRASES.length);
      typingSpeed = 300;
    }

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (typedText !== currentPhrase) {
          setTypedText(currentPhrase.substring(0, typedText.length + 1));
        } else {
          setIsDeleting(true);
        }
      } else {
        setTypedText(currentPhrase.substring(0, typedText.length - 1));
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [typedText, isDeleting, phraseIndex]);

  // Live real-time clock & calendar engine
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          timeZone: 'Africa/Lagos',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }) + ' WAT'
      );
      setDateStr(
        now.toLocaleDateString('en-US', {
          timeZone: 'Africa/Lagos',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* 4-Slide HTML5 Video Background Layer */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-[#07020d]/50 via-[#07020d]/30 to-transparent z-10" />
        {VIDEO_SLIDES.map((src, idx) => (
          <video
            key={src}
            autoPlay
            muted
            loop
            playsInline
            src={src}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
              idx === currentSlideIndex ? 'opacity-35' : 'opacity-0'
            }`}
          />
        ))}
      </div>

      {/* Top HUD Bar */}
      <header className="absolute top-0 inset-x-0 z-20 p-4 sm:p-6 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none w-full">
        {/* Left: Typing Brand Terminal */}
        <div className="bg-black/55 border border-white/10 px-4 py-2 rounded-2xl backdrop-blur-md flex items-center h-9 pointer-events-auto shadow-md">
          <span className="text-[11px] font-mono-tech font-bold text-white tracking-wider flex items-center">
            <span>{typedText}</span>
            <span className="inline-block w-1.5 h-3.5 bg-[#f2b42c] ml-1 animate-pulse" />
          </span>
        </div>

        {/* Right: Weather & WAT Live Clock */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 pointer-events-auto w-full md:w-auto">
          <div className="bg-black/55 border border-white/10 px-3 sm:px-4 py-1.5 rounded-xl backdrop-blur-md text-left shadow-md">
            <p className="text-[9px] font-black tracking-wider text-[#f2b42c] uppercase leading-none">
              Lagos, NG
            </p>
            <p className="text-[9px] font-mono-tech text-white/60 mt-1">29°C · Scattered</p>
          </div>
          <div className="bg-black/55 border border-white/10 px-3 sm:px-4 py-1.5 rounded-xl backdrop-blur-md flex flex-col justify-center text-right min-w-[130px] sm:min-w-[145px] h-[38px] shadow-md">
            <span className="text-[11px] sm:text-xs font-mono-tech font-bold text-white tracking-wide leading-none">
              {timeStr}
            </span>
            <span className="text-[8px] font-bold text-white/50 tracking-widest uppercase mt-1 leading-none">
              {dateStr}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}