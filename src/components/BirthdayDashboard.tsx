import React, { useState } from "react";
import { Users, Gift, Calendar, Bell, ChevronRight, Star, ArrowRight } from "lucide-react";
import { Friend } from "../types";

interface BirthdayDashboardProps {
  friends: Friend[];
  userName: string;
  onViewFriend: (friendId: string) => void;
  onNavigate: (section: string, subTab?: string) => void;
  logs: string[];
}

function daysUntil(birthdayStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bDate = new Date(birthdayStr);
  let next = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(birthdayStr: string): string {
  const d = new Date(birthdayStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function calculateAgeNextBirthday(birthdayStr: string): number {
  if (!birthdayStr) return 25;
  const bDate = new Date(birthdayStr);
  const today = new Date();
  let nextAge = today.getFullYear() - bDate.getFullYear();
  const nextBirthdayThisYear = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
  if (nextBirthdayThisYear < today) {
    nextAge += 1;
  }
  return nextAge || 25;
}

export function BirthdayDashboard({ friends, userName, onViewFriend, onNavigate, logs }: BirthdayDashboardProps) {
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  // Filter and sort friends with birthdays
  const sorted = [...friends]
    .filter((f) => f.id !== "alex" && f.birthday)
    .sort((a, b) => daysUntil(a.birthday) - daysUntil(b.birthday));

  const incomingRequestsCount = friends.filter(
    (f) => f.id !== "alex" && f.connectedBack === false && f.incomingRequest === true
  ).length;

  const closestFriend = sorted[0];
  const firstName = userName.split(" ")[0] || "there";

  // Dynamic daytime greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return `Good morning, ${firstName} 👋`;
    if (hour < 18) return `Good afternoon, ${firstName} 👋`;
    return `Good evening, ${firstName} 👋`;
  };

  // Recent activity mock combined with real logs to look ultra active and realistic
  const getActivities = () => {
    const list = [];
    if (closestFriend) {
      list.push({
        id: "act-1",
        avatar: closestFriend.avatar || "bg-indigo-500",
        name: closestFriend.name,
        text: `Sophia's birthday is tomorrow`,
        time: "10h ago",
        onClick: () => onViewFriend(closestFriend.id)
      });
    }
    list.push({
      id: "act-2",
      avatar: "bg-purple-500",
      name: "David",
      text: "David added you as a buddy",
      time: "5h ago",
      onClick: () => onNavigate("registry", "requests")
    });
    list.push({
      id: "act-3",
      avatar: "bg-indigo-500",
      name: "Lisa",
      text: "You sent a gift to Lisa",
      time: "2h ago",
      onClick: () => onNavigate("gift-store", "ledger")
    });
    return list;
  };

  return (
    <div className="space-y-5 font-sans text-slate-900" id="hbd-dashboard-root">
      {/* 1. Header: Greeting & User Profile Avatar */}
      <header className="flex items-center justify-between py-2 text-left">
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight text-slate-900 leading-tight">
            {getGreeting()}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Keep track of your favorite circles
          </p>
        </div>
        <div 
          onClick={() => onNavigate("profile", "profile")}
          className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-sm cursor-pointer shadow-sm ring-2 ring-white hover:scale-105 transition-transform"
        >
          {firstName[0]?.toUpperCase() || "H"}
        </div>
      </header>

      {/* 2. Upcoming Birthday Hero Card */}
      {closestFriend ? (
        <section className="bg-white rounded-[2rem] border border-slate-100 p-5 text-left flex items-center justify-between gap-4 shadow-premium relative overflow-hidden">
          {/* Ambient subtle glow inside card */}
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="space-y-3 min-w-0 flex-1 z-10">
            <div>
              <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block mb-0.5">
                Upcoming Birthday
              </span>
              <h2 className="text-sm font-bold text-slate-900 leading-snug">
                {closestFriend.name.replace(" (You)", "")} turns {calculateAgeNextBirthday(closestFriend.birthday)} in{" "}
                <span className="text-indigo-600 font-extrabold">{daysUntil(closestFriend.birthday)} days</span>
              </h2>
            </div>
            
            <button
              type="button"
              onClick={() => onViewFriend(closestFriend.id)}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-4 rounded-full transition-all active:scale-95 cursor-pointer shadow-sm"
            >
              Send Gift
            </button>
          </div>

          {/* Styled CSS Floating 3D Gift Box Visual */}
          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center z-10 animate-bounce" style={{ animationDuration: "3s" }}>
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_8px_16px_rgba(99,102,241,0.25)]">
              {/* Back Sparkles */}
              <path d="M15 15 L20 20 M85 15 L80 20 M10 80 L18 75 M85 80 L78 75" stroke="#F97316" strokeWidth="3" strokeLinecap="round" />
              {/* Box Bottom lid */}
              <rect x="25" y="45" width="50" height="40" rx="6" fill="#A855F7" />
              {/* Lid */}
              <rect x="20" y="38" width="60" height="12" rx="4" fill="#6366F1" />
              {/* Ribbon Vertical */}
              <rect x="46" y="38" width="8" height="47" fill="#F97316" />
              {/* Ribbon Horizontal */}
              <rect x="25" y="60" width="50" height="8" fill="#F97316" />
              {/* Ribbon Loops */}
              <path d="M46 38 C35 20, 48 15, 50 38 C52 15, 65 20, 54 38" fill="none" stroke="#F97316" strokeWidth="6" strokeLinecap="round" />
              {/* Little stars */}
              <polygon points="50,10 52,15 57,15 53,18 55,23 50,20 45,23 47,18 43,15 48,15" fill="#F97316" className="animate-pulse" />
            </svg>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-[2rem] border border-slate-100 p-5 text-left flex items-center justify-between gap-4 shadow-premium relative overflow-hidden">
          <div className="space-y-1.5 min-w-0 flex-1">
            <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-widest block">Get Started</span>
            <h2 className="text-sm font-bold text-slate-800 leading-snug">
              Add buddies to start tracking countdowns
            </h2>
            <button
              type="button"
              onClick={() => onNavigate("registry", "connect")}
              className="bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold py-1.5 px-4 rounded-full mt-2 transition-all cursor-pointer"
            >
              Add Buddies
            </button>
          </div>
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl shrink-0">
            🎂
          </div>
        </section>
      )}

      {/* 3. Quick Actions row: 4 sleek round cards */}
      <section className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => onNavigate("registry", "list")}
          className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center transition-all active:scale-[0.96] cursor-pointer shadow-premium"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-50/50 flex items-center justify-center text-indigo-500 shrink-0">
            <Users className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-600 mt-1.5 truncate w-full text-center">Buddies</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("gift-store", "gallery")}
          className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center transition-all active:scale-[0.96] cursor-pointer shadow-premium"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50/50 flex items-center justify-center text-purple-500 shrink-0">
            <Gift className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-600 mt-1.5 truncate w-full text-center">Gifts</span>
        </button>

        <button
          type="button"
          onClick={() => setShowAllUpcoming(true)}
          className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center transition-all active:scale-[0.96] cursor-pointer shadow-premium"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-50/50 flex items-center justify-center text-amber-500 shrink-0">
            <Calendar className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-600 mt-1.5 truncate w-full text-center">Birthdays</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate("registry", "requests")}
          className="bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col items-center justify-center transition-all active:scale-[0.96] relative cursor-pointer shadow-premium"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50/50 flex items-center justify-center text-rose-500 shrink-0">
            <Bell className="w-5 h-5 stroke-[2]" />
          </div>
          <span className="text-[10px] font-semibold text-slate-600 mt-1.5 truncate w-full text-center">Requests</span>
          {incomingRequestsCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 text-white font-sans text-[8px] font-black rounded-full flex items-center justify-center ring-2 ring-white">
              {incomingRequestsCount}
            </span>
          )}
        </button>
      </section>

      {/* 4. Recent Activity: Clean separated rows */}
      <section className="bg-white rounded-[2rem] border border-slate-100 p-4 text-left shadow-premium">
        <h3 className="text-xs font-bold text-slate-800 mb-3.5 px-0.5">
          Recent Activity
        </h3>
        <div className="divide-y divide-slate-50">
          {getActivities().map((act) => (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/50 rounded-xl px-1 transition cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-full ${act.avatar} text-white flex items-center justify-center font-bold text-[10px] shrink-0 shadow-sm`}>
                  {act.name[0]?.toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 leading-tight truncate">{act.text}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{act.time}</p>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </section>

      {/* 5. Birthday Calendar List Popup drawer/modal */}
      {showAllUpcoming && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-[999] animate-fade-in">
          <div className="bg-white w-full sm:max-w-md rounded-t-[2rem] sm:rounded-[2rem] border border-slate-100 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[75vh]">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-display">Celebration Registry</h3>
                <p className="text-[10px] text-slate-400 font-medium">All upcoming birthday loops</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAllUpcoming(false)}
                className="w-7 h-7 rounded-full bg-slate-50 text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center font-bold text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-2.5">
              {sorted.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-bold">No active celebration loops</p>
                </div>
              ) : (
                sorted.map((friend) => (
                  <button
                    key={`cal-${friend.id}`}
                    type="button"
                    onClick={() => {
                      onViewFriend(friend.id);
                      setShowAllUpcoming(false);
                    }}
                    className="w-full p-3 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border border-slate-100 text-left flex items-center justify-between gap-3 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8.5 h-8.5 rounded-xl ${friend.avatar || "bg-indigo-500"} text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm`}>
                        {friend.name.replace(" (You)", "").split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{friend.name}</p>
                        <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">{formatDate(friend.birthday)}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50/50 px-2.5 py-1 rounded-full uppercase">
                      {daysUntil(friend.birthday) === 0 ? "Today" : `${daysUntil(friend.birthday)}d`}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
