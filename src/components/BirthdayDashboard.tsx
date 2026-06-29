import React from "react";
import { Cake, ChevronRight } from "lucide-react";
import { Friend } from "../types";

interface BirthdayDashboardProps {
  friends: Friend[];
  userName: string;
  onViewFriend: (friendId: string) => void;
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

function getDaysLabel(days: number): string {
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

export function BirthdayDashboard({ friends, userName, onViewFriend }: BirthdayDashboardProps) {
  const sorted = [...friends]
    .filter((f) => f.id !== "alex" && f.birthday)
    .sort((a, b) => daysUntil(a.birthday) - daysUntil(b.birthday));

  const missingBirthdays = friends.filter((f) => f.id !== "alex" && !f.birthday);
  const urgent = sorted.slice(0, 3);
  const todayBirthdays = sorted.filter((f) => daysUntil(f.birthday) === 0);
  const pipeline30 = sorted.filter((f) => {
    const days = daysUntil(f.birthday);
    return days > 0 && days <= 30;
  });
  const firstName = userName.split(" ")[0] || "there";

  return (
    <div className="space-y-4">
      {/* Greeting card */}
      <section className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 text-left flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-violet-500 text-white flex items-center justify-center font-semibold text-[13px] shrink-0">
          {firstName[0]?.toUpperCase() || "H"}
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[15px] font-semibold text-slate-900 truncate">Hey {firstName}!</h2>
          <p className="text-[11px] text-slate-400 truncate">
            {sorted.length === 0
              ? "Add a buddy to start tracking birthdays"
              : "Here are your upcoming birthdays overview"}
          </p>
        </div>
      </section>

      {/* Stats row: 3 compact stats <= 56px height */}
      <div className="grid grid-cols-3 gap-2 max-h-14">
        <Stat label="Birthdays tracked" value={sorted.length} />
        <Stat label="Today" value={todayBirthdays.length} />
        <Stat label="This month" value={pipeline30.length} />
      </div>

      {/* Next milestones */}
      <section className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 text-left">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-[15px] font-semibold text-slate-900">Upcoming birthdays</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Closest upcoming celebrations</p>
          </div>
          <button
            type="button"
            onClick={() => onViewFriend(sorted[0]?.id || "")}
            disabled={sorted.length === 0}
            className="text-[13px] font-semibold text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed inline-flex items-center gap-1"
          >
            Directory <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-4 text-center">
            <Cake className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-[13px] font-semibold text-slate-800">No birthdays tracked yet</p>
            <p className="text-[11px] text-slate-400 mt-1">Add a buddy from directory to track celebrations.</p>
          </div>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1 ios-scroll-safe">
            {urgent.map((friend, index) => {
              const days = daysUntil(friend.birthday);
              return (
                <button
                  key={`${friend.id}-${index}`}
                  type="button"
                  onClick={() => onViewFriend(friend.id)}
                  className="min-w-[180px] max-w-[180px] rounded-xl border border-slate-100 bg-slate-50 p-3 text-left hover:bg-indigo-50/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`w-8 h-8 rounded-full ${friend.avatar || "bg-indigo-500"} text-white flex items-center justify-center font-semibold text-[11px] shrink-0`}>
                      {friend.name.replace(" (You)", "").split(" ").map((part) => part[0]).slice(0, 2).join("")}
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
                      days === 0 ? "bg-amber-100 text-amber-700" : "bg-slate-200 text-slate-600"
                    }`}>
                      {getDaysLabel(days)}
                    </span>
                  </div>
                  <div className="mt-3">
                    <p className="text-[13px] font-semibold text-slate-900 truncate">{friend.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{formatDate(friend.birthday)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {missingBirthdays.length > 0 && (
        <section className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 text-left">
          <div className="mb-3">
            <h3 className="text-[15px] font-semibold text-slate-900">Missing birthdays</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Add birth dates to track upcoming celebrations</p>
          </div>
          <div className="space-y-2">
            {missingBirthdays.slice(0, 5).map((friend) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => onViewFriend(friend.id)}
                className="w-full flex items-center justify-between gap-3 rounded-lg border border-slate-100 bg-slate-50 p-2 text-left hover:bg-amber-50 transition"
              >
                <span className="text-[13px] text-slate-800 truncate">{friend.name}</span>
                <span className="text-[10px] font-semibold uppercase text-amber-700 bg-amber-100 px-2 py-1 rounded-md">Add date</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-2 text-center flex flex-col justify-center h-14">
      <span className="text-[10px] text-slate-400 font-normal truncate block leading-tight">{label}</span>
      <span className="text-[18px] font-semibold text-slate-900 block leading-tight mt-0.5">{value}</span>
    </div>
  );
}

