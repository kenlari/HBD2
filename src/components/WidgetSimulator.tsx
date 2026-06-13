import React, { useState } from "react";
import { motion } from "motion/react";
import { Friend } from "../types";
import { Smartphone, Check, Upload, Sliders, SmartphoneNfc, AppWindow, Sparkles } from "lucide-react";

interface WidgetSimulatorProps {
  friends: Friend[];
}

// Preset visual mock photos that users can choose for their Locket widget (since Locket is about showcase photos)
const PRESET_LOCKET_PHOTOS = [
  {
    id: "photo1",
    label: "Specialty Cafe",
    url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&auto=format&fit=crop&q=80",
    theme: "Cozy Warm"
  },
  {
    id: "photo2",
    label: "Art Canvas & Paint",
    url: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=80",
    theme: "Creative Pastel"
  },
  {
    id: "photo3",
    label: "Outdoor Mountain Trail",
    url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&auto=format&fit=crop&q=80",
    theme: "Nature Green"
  },
  {
    id: "photo4",
    label: "Retro Vinyl Player",
    url: "https://images.unsplash.com/photo-1539628390323-30913ec41857?w=400&auto=format&fit=crop&q=80",
    theme: "Vintage Amber"
  },
  {
    id: "photo5",
    label: "Sourdough Loaf Fresh",
    url: "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=400&auto=format&fit=crop&q=80",
    theme: "Baking Rose"
  },
  {
    id: "photo6",
    label: "Cozy Workspace Minimal",
    url: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&auto=format&fit=crop&q=80",
    theme: "Dark Slate"
  }
];

export const WidgetSimulator: React.FC<WidgetSimulatorProps> = ({ friends }) => {
  const [selectedPlatform, setSelectedPlatform] = useState<"ios" | "android">("ios");
  const [selectedSize, setSelectedSize] = useState<"lockscreen" | "small" | "medium">("small");
  const [selectedStyle, setSelectedStyle] = useState<"locket" | "countdown" | "minimal" | "upcoming">("locket");
  const [selectedFriendId, setSelectedFriendId] = useState<string>("taylor");
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string>(PRESET_LOCKET_PHOTOS[3].url);
  const [userUploadedFile, setUserUploadedFile] = useState<string | null>(null);

  const selectedFriend = friends.find((f) => f.id === selectedFriendId) || friends[0] || {
    id: "default",
    name: "No buddy selected",
    birthday: "2026-06-03",
    relationship: "Self",
    age: "0",
    avatar: "bg-indigo-500",
    wishlist: [],
    achievements: [],
    interests: []
  };

  // Helper to calculate days remaining
  const calculateDaysRemaining = (birthdayStr: string) => {
    const today = new Date("2026-06-03"); // Unified mocked date for consistency
    const birthDate = new Date(birthdayStr);
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();

    let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysLeft = calculateDaysRemaining(selectedFriend.birthday);

  // Sort friends (companions) by their upcoming birthdate relative to 2026-06-03
  const sortedUpcomingFriends = [...friends].sort((a, b) => {
    return calculateDaysRemaining(a.birthday) - calculateDaysRemaining(b.birthday);
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setUserUploadedFile(result);
        setCustomPhotoUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="widget-simulator-section">
      {/* Widget Customizer Controls */}
      <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-zinc-100 shadow-sm flex flex-col justify-between" id="widget-config-card">
        <div>
          <div className="flex items-center gap-2 mb-6">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-semibold text-lg text-zinc-900">Widget Studio</h3>
              <p className="text-xs text-zinc-500">Pick format, customize layouts, and lock screens</p>
            </div>
          </div>

          {/* 1. Target Friend */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Showcase Birthday Of</label>
            <div className="grid grid-cols-2 gap-2">
              {friends.filter(f => f.id !== 'alex' && f.connectedBack === true).map((friend) => (
                <button
                  key={friend.id}
                  onClick={() => setSelectedFriendId(friend.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                    selectedFriendId === friend.id
                      ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium"
                      : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                  }`}
                >
                  <span className={`w-3 h-3 rounded-full ${friend.avatar}`} />
                  <span className="text-xs truncate">{friend.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Platform Selector */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Device Interface</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setSelectedPlatform("ios");
                  if (selectedSize === "lockscreen") setSelectedSize("small");
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedPlatform === "ios"
                    ? "bg-zinc-900 border-zinc-900 text-white"
                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span> iOS 17</span>
              </button>
              <button
                onClick={() => {
                  setSelectedPlatform("android");
                  if (selectedSize === "lockscreen") setSelectedSize("small");
                }}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                  selectedPlatform === "android"
                    ? "bg-indigo-950 border-indigo-950 text-white"
                    : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                <span>🤖 Android 14</span>
              </button>
            </div>
          </div>

          {/* 3. Widget Sizes & Complications */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Widget Format & Location</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => {
                  setSelectedSize("lockscreen");
                  setSelectedStyle("minimal");
                }}
                className={`py-2 px-1 rounded-xl border text-[11px] font-semibold text-center transition-all ${
                  selectedSize === "lockscreen"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Lock complication
              </button>
              <button
                onClick={() => {
                  setSelectedSize("small");
                  if (selectedStyle === "minimal") setSelectedStyle("locket");
                }}
                className={`py-2 px-1 rounded-xl border text-[11px] font-semibold text-center transition-all ${
                  selectedSize === "small"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                Home Square (1x1)
              </button>
              <button
                onClick={() => {
                  setSelectedSize("medium");
                  if (selectedStyle === "minimal") setSelectedStyle("locket");
                }}
                className={`py-2 px-1 rounded-xl border text-[11px] font-semibold text-center transition-all ${
                  selectedSize === "medium"
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                Home Wide (2x1)
              </button>
            </div>
          </div>

          {/* 4. Choose Style */}
          {selectedSize !== "lockscreen" && (
            <div className="mb-5">
              <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wider">Layout Template</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedStyle("locket")}
                  className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    selectedStyle === "locket"
                      ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                      : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-[10px]">📸 Locket Visual</span>
                </button>
                <button
                  onClick={() => setSelectedStyle("countdown")}
                  className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    selectedStyle === "countdown"
                      ? "bg-amber-50 border-amber-200 text-amber-800 font-bold"
                      : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-[10px]">⏳ Countdown</span>
                </button>
                <button
                  onClick={() => setSelectedStyle("upcoming")}
                  className={`py-2 px-1 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    selectedStyle === "upcoming"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800 font-bold"
                      : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                  }`}
                >
                  <span className="text-[10px]">🎉 Upcoming List</span>
                </button>
              </div>
            </div>
          )}

          {/* 5. Locket Photo Source (Only if size != lockscreen and style == locket) */}
          {selectedSize !== "lockscreen" && selectedStyle === "locket" && (
            <div className="space-y-3" id="locket-photo-picker">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-zinc-500 uppercase tracking-wider">Locket Photo Asset</label>
                <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded-md">Shows real live vibe</span>
              </div>
              
              {/* Grid of presets */}
              <div className="grid grid-cols-3 gap-2">
                {PRESET_LOCKET_PHOTOS.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => {
                      setUserUploadedFile(null);
                      setCustomPhotoUrl(photo.url);
                    }}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      customPhotoUrl === photo.url && !userUploadedFile
                        ? "border-indigo-600 scale-95 ring-2 ring-indigo-100"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={photo.url} alt={photo.label} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 px-1 truncate text-[8px] text-white text-center">
                      {photo.label}
                    </div>
                  </button>
                ))}
              </div>

              {/* Upload dynamic file button */}
              <div className="pt-1">
                <label className="flex items-center justify-center gap-2 border border-dashed border-zinc-300 hover:border-indigo-500 rounded-xl p-2.5 cursor-pointer transition-all bg-zinc-50 hover:bg-indigo-50/20">
                  <Upload className="w-4 h-4 text-zinc-500" />
                  <span className="text-xs font-medium text-zinc-600">Upload Live Friend Photo...</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Integration Instructions */}
        <div className="mt-6 pt-4 border-t border-zinc-100 text-zinc-500 text-xs leading-relaxed space-y-1">
          <p className="font-semibold text-zinc-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" /> Lock Screen Integration
          </p>
          <p>This Widget broadcasts countdown coordinates automatically. On iOS, swipe left to customize and add the Circular complications. On Android, tap & hold home to launch the Material You list frame.</p>
        </div>
      </div>

      {/* Modern Device Render Preview */}
      <div className="lg:col-span-7 flex flex-col items-center justify-center text-center" id="device-preview-card">
        <h4 className="text-sm font-semibold text-zinc-600 mb-2 flex items-center gap-1">
          <Smartphone className="w-4 h-4 text-zinc-500" />
          Live Simulator: {selectedPlatform === "ios" ? "iPhone 15 Pro Max" : "Google Pixel 8 Pro"}
        </h4>

        {/* Outer Phone shell */}
        <div className="relative w-[310px] h-[610px] bg-zinc-950 rounded-[48px] p-3.5 shadow-2xl border-[5px] border-zinc-800 ring-10 ring-zinc-900/10 flex flex-col overflow-hidden">
          {/* Dynamic Island / Punch Hole */}
          {selectedPlatform === "ios" ? (
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20 flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-950 border border-zinc-900/40 ml-4 inline-block" />
            </div>
          ) : (
            <div className="absolute top-5 left-1/2 transform -translate-x-1/2 w-4.5 h-4.5 bg-black rounded-full z-20" />
          )}

          {/* Phone Screen Display Area */}
          <div 
            className="w-full h-full rounded-[36px] overflow-hidden relative flex flex-col justify-between p-6 select-none"
            style={{
              backgroundImage: selectedSize === "lockscreen" 
                ? "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400&q=80')" 
                : "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80')",
              backgroundSize: "cover",
              backgroundPosition: "center"
            }}
          >
            {/* Screen Glass effect Overlay */}
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[1px] z-0" />

            {/* Top Status Indicators */}
            <div className="relative z-10 flex justify-between items-center text-[11px] text-white font-medium px-2">
              <span>{new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false })}</span>
              <div className="flex items-center gap-1.5">
                <span>5G</span>
                <div className="w-5 h-2.5 border border-white/70 rounded-md p-[1px] flex items-center">
                  <div className="w-3/4 h-full bg-white rounded-xs" />
                </div>
              </div>
            </div>

            {/* LOCK SCREEN VIEW */}
            {selectedSize === "lockscreen" ? (
              <div className="relative z-10 w-full h-full flex flex-col justify-start items-center pt-8">
                {/* Clock */}
                <div className="text-center mb-1 text-white">
                  <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-100">Wednesday, June 3</div>
                  <div className="text-6xl font-light tracking-tight mt-1">19:07</div>
                </div>

                {/* Simulated lock screen complication row */}
                <div className="flex gap-4 justify-center items-center mt-3 p-1.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10">
                  <div className="flex items-center gap-1 text-[11px] text-white">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Locket Sync Live</span>
                  </div>

                  <div className="h-4 w-[1px] bg-white/20" />

                  {/* Circular widget complication */}
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-white/60 bg-black/40 flex flex-col items-center justify-center p-0.5 relative">
                    <span className="text-[8px] font-bold text-white text-center">{selectedFriend.name.slice(0, 2).toUpperCase()}</span>
                    <span className="text-[8px] font-semibold text-rose-300">-{daysLeft}d</span>
                  </div>
                </div>

                {/* Center unlock icons / notifications */}
                <div className="mt-auto w-full mb-12 flex flex-col items-center">
                  <div className="w-full bg-black/40 backdrop-blur-lg rounded-2xl p-3 border border-white/10 text-left">
                    <p className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Birthday Bud Notification</p>
                    <p className="text-xs text-white font-semibold mt-0.5">{selectedFriend.name}'s birthday is in {daysLeft} days!</p>
                    <p className="text-[10px] text-zinc-300 truncate">Swipe to open wishlists and buy custom gifts.</p>
                  </div>

                  {/* Lock icon */}
                  <span className="mt-4 text-[11px] text-white/70">Swipe up to unlock</span>
                </div>
              </div>
            ) : (
              /* HOME SCREEN VIEW WITH ACTUAL APP WIDGETS */
              <div className="relative z-10 w-full h-full flex flex-col justify-around">
                {/* Simulated Home Screen Icon grid */}
                <div className="grid grid-cols-4 gap-4 px-2 my-2 opacity-50 text-center">
                  {["Mail", "Photos", "Safari", "Maps"].map((app, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur-md border border-white/5 flex items-center justify-center text-[10px] text-white">
                        {app.slice(0, 1)}
                      </div>
                      <span className="text-[8px] text-white">{app}</span>
                    </div>
                  ))}
                </div>

                {/* THE SELECTED CUSTOM WIDGET */}
                <div className="my-auto py-4 flex justify-center">
                  {selectedSize === "small" ? (
                    /* SQUARE WIDGET (1x1) */
                    <motion.div 
                      layout
                      className={`w-[140px] h-[140px] rounded-[24px] ${
                        selectedStyle === "locket" 
                          ? "bg-zinc-950 border border-zinc-800 text-white" 
                          : selectedStyle === "upcoming"
                          ? "bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white border border-indigo-800/40"
                          : "bg-gradient-to-br from-indigo-950 to-purple-950 text-white"
                      } p-3 flex flex-col justify-between shadow-xl relative overflow-hidden`}
                    >
                      {/* Widget Style 1: LOCKET visual portrait */}
                      {selectedStyle === "locket" ? (
                        <>
                          {/* Locket Live Image Background */}
                          <div className="absolute inset-0 z-0">
                            <img src={customPhotoUrl} alt="Live friend locket" className="w-full h-full object-cover brightness-[0.7] contrast-[1.05]" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/40" />
                          </div>

                          {/* Top: Countdown overlay */}
                          <div className="relative z-10 flex justify-between items-start">
                            <span className="text-[9px] font-bold text-white bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                              Locket
                            </span>
                            <span className="text-[9px] font-bold text-rose-300 bg-red-950/70 backdrop-blur-md px-1.5 py-0.5 rounded-full flex items-center gap-0.5 animate-pulse">
                              ⏳ {daysLeft} Days
                            </span>
                          </div>

                          {/* Bottom: Friends details */}
                          <div className="relative z-10">
                            <h5 className="font-bold text-[11px] truncate text-white">{selectedFriend.name}</h5>
                            <p className="text-[9px] text-zinc-300 font-medium truncate">Turns {selectedFriend.age} • {selectedFriend.relationship}</p>
                          </div>
                        </>
                      ) : selectedStyle === "countdown" ? (
                        /* Widget Style 2: AESTHETIC COUNTDOWN */
                        <>
                          <div className="flex justify-between items-start">
                            <span className="p-1 bg-amber-500/20 text-amber-300 rounded-lg text-[9px] font-bold uppercase">
                              Days Left
                            </span>
                            <span className="text-[9px] text-purple-300">{selectedFriend.birthday.split('-')[1]}/{selectedFriend.birthday.split('-')[2]}</span>
                          </div>

                          <div className="my-2">
                            <h2 className="text-3xl font-extrabold text-amber-300 tracking-tight">{daysLeft}</h2>
                            <p className="text-[10px] text-purple-200 mt-0.5 font-semibold truncate">Until {selectedFriend.name}'s cake!</p>
                          </div>

                          <div className="text-[8px] text-zinc-300 leading-tight">
                            Wishlist lists {selectedFriend.wishlist.length} gift items waiting
                          </div>
                        </>
                      ) : (
                        /* Widget Style 3: UPCOMING LIST */
                        <>
                          <div className="flex justify-between items-center mb-1 pb-0.5 border-b border-indigo-500/35">
                            <span className="text-[9px] font-extrabold text-indigo-300 uppercase tracking-wider">
                              🎂 Birthdays
                            </span>
                            <span className="text-[8px] text-cyan-300 font-bold font-mono">List</span>
                          </div>

                          <div className="flex-1 flex flex-col justify-center py-1 space-y-1.5 text-left">
                            {sortedUpcomingFriends.slice(0, 3).map((friend, idx) => {
                              const days = calculateDaysRemaining(friend.birthday);
                              const isUpcomingOne = idx === 0;
                              return (
                                <div 
                                  key={friend.id} 
                                  className={`flex justify-between items-center px-1.5 py-0.5 rounded ${
                                    isUpcomingOne 
                                      ? "bg-amber-400 text-slate-950 font-black border border-amber-300 shadow-sm" 
                                      : "text-zinc-200 bg-white/5 text-[9.5px]"
                                  }`}
                                >
                                  <span className={`truncate text-[9.5px] ${isUpcomingOne ? "font-black" : "font-normal"}`}>
                                    {isUpcomingOne ? `👑 ${friend.name.split(" ")[0]}` : friend.name.split(" ")[0]}
                                  </span>
                                  <span className={`text-[8.5px] font-mono shrink-0 whitespace-nowrap ml-1 ${isUpcomingOne ? "font-black" : "text-zinc-400"}`}>
                                    {days}d
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </motion.div>
                  ) : (
                    /* WIDE MEDIUM WIDGET (2x1) */
                    <motion.div 
                      layout
                      className="w-[280px] h-[140px] rounded-[28px] bg-zinc-900 border border-zinc-800 text-white p-3.5 flex shadow-xl relative overflow-hidden"
                    >
                      {selectedStyle === "locket" ? (
                        <>
                          {/* Left: Beautiful live Locket visual */}
                          <div className="w-1/2 rounded-2xl overflow-hidden relative mr-3 border border-zinc-800 bg-zinc-950">
                            <img src={customPhotoUrl} alt="Locket image" className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 text-center">
                              <span className="text-[8px] text-zinc-200 uppercase tracking-widest font-black">Locket Daily</span>
                            </div>
                          </div>

                          {/* Right: Birthday status details and wishlist sneak peek */}
                          <div className="w-1/2 flex flex-col justify-between">
                            <div>
                              <div className="flex justify-between items-center bg-zinc-850 px-1.5 py-0.5 rounded-lg border border-zinc-800">
                                <span className="text-[8px] uppercase tracking-wider font-extrabold text-rose-400">Next Up</span>
                                <span className="text-[9px] font-bold text-white bg-rose-600 px-1.5 rounded-full">-{daysLeft}d</span>
                              </div>
                              <h5 className="font-bold text-xs mt-1 text-white truncate">{selectedFriend.name}</h5>
                              <p className="text-[9px] text-zinc-400">{selectedFriend.relationship} • Turns {selectedFriend.age}</p>
                            </div>

                            <div className="bg-zinc-950 rounded-xl p-1.5 border border-zinc-800 mt-1">
                              <span className="text-[8px] text-zinc-400 block mb-0.5 uppercase tracking-wide font-medium">Top Wants ({selectedFriend.wishlist.length}):</span>
                              <div className="text-[9px] font-bold text-indigo-300 truncate">
                                🎁 {selectedFriend.wishlist[0]?.title || "Generic Gifts"}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : selectedStyle === "countdown" ? (
                        /* Countdown text style */
                        <div className="w-full flex justify-between h-full">
                          <div className="w-1/2 flex flex-col justify-between">
                            <div className="text-rose-400 text-[10px] font-bold uppercase tracking-wider">Countdown</div>
                            <div>
                              <div className="text-4xl font-black text-rose-500">{daysLeft} days</div>
                              <div className="text-[11px] font-medium text-zinc-300">Until {selectedFriend.name}'s special day</div>
                            </div>
                            <div className="text-[9px] text-zinc-400">Current active theme: Elegant Rose</div>
                          </div>
                          
                          <div className="w-1/2 bg-zinc-950 rounded-2xl border border-zinc-800 p-3 flex flex-col justify-between">
                            <div className="text-[9px] font-semibold text-zinc-400 uppercase tracking-wider">Interests Tracker</div>
                            <div className="flex flex-wrap gap-1 my-1">
                              {selectedFriend.interests.slice(0, 2).map((interest, i) => (
                                <span key={i} className="text-[8px] bg-zinc-800 text-zinc-200 px-1.5 py-0.5 rounded-md">
                                  #{interest}
                                </span>
                              ))}
                            </div>
                            <div className="text-[9px] text-indigo-300 font-semibold truncate hover:underline">
                              See Wishlist list...
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Upcoming Birthdays List Style representing all friends */
                        <div className="w-full h-full flex gap-3 text-left">
                          {/* Left Pane: Spotlight of the upcoming friend - BOLD highlight */}
                          <div className="w-1/2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-2.5 flex flex-col justify-between border border-amber-300/60 shadow-xs text-slate-950">
                            <div>
                              <div className="flex justify-between items-center">
                                <span className="bg-slate-950/20 text-[8px] text-slate-950 font-black px-1.5 py-0.5 rounded uppercase tracking-wider">
                                  🌟 NEXT UP
                                </span>
                                <span className="text-[9.5px] font-black font-mono">
                                  {calculateDaysRemaining(sortedUpcomingFriends[0]?.birthday)}d
                                </span>
                              </div>
                              
                              <h5 className="font-black text-[13px] text-slate-950 mt-1 leading-tight tracking-tight truncate">
                                {sortedUpcomingFriends[0]?.name}
                              </h5>
                              <p className="text-[8.5px] text-slate-900/80 font-bold">
                                Turns {sortedUpcomingFriends[0]?.age} • {sortedUpcomingFriends[0]?.relationship}
                              </p>
                            </div>
                            
                            <div className="bg-white/45 rounded-lg p-1 text-[8px] font-extrabold border border-white/30 truncate select-none">
                              🎁 Wants: {sortedUpcomingFriends[0]?.wishlist[0]?.title || "Generic Gifts"}
                            </div>
                          </div>

                          {/* Right Pane: Scroll/compact list of other friends' upcoming birthdays */}
                          <div className="w-1/2 bg-zinc-950 rounded-2xl border border-zinc-855 p-2.5 flex flex-col justify-between">
                            <span className="text-[8px] text-zinc-400 uppercase font-bold tracking-wider block border-b border-[#27272a] pb-1 mb-1">
                              Upcoming List
                            </span>
                            <div className="flex-1 flex flex-col justify-start gap-1 py-0.5 overflow-hidden">
                              {sortedUpcomingFriends.slice(1, 4).map((friend) => {
                                const days = calculateDaysRemaining(friend.birthday);
                                return (
                                  <div key={friend.id} className="flex justify-between items-center text-[9px] text-zinc-300 bg-white/5 rounded px-1.5 py-0.5">
                                    <span className="truncate max-w-[70px] font-medium">{friend.name.split(" ")[0]}</span>
                                    <span className="font-mono text-zinc-400 shrink-0">{days}d</span>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="text-[8px] text-indigo-300 mt-1 text-center font-bold">
                              {friends.length} Buddies Synced
                            </div>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>

                {/* Bottom Dock apps */}
                <div className="relative z-10 w-full mt-auto px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5 flex justify-around items-center">
                  {["Phone", "Messages", "BirthdayBud", "Music"].map((app, idx) => (
                    <div 
                      key={idx} 
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
                        app === "BirthdayBud" ? "bg-indigo-600 text-white font-extrabold border-2 border-indigo-200" : "bg-white/10 text-white"
                      }`}
                    >
                      {app === "BirthdayBud" ? "🎂" : app.slice(0, 1)}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Informatic label */}
        <p className="text-xs text-zinc-400 italic mt-3 max-w-sm">
          Simulated preview reflecting true pixel sizing and lock-screen widget complications. On a real device, the widgets refresh automatically via background workers.
        </p>
      </div>
    </div>
  );
};
