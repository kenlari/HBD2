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
    <div className="space-y-5">
      <section className="bg-white border border-slate-200 rounded-[2rem] p-5 md:p-6 shadow-xs text-left">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-violet-500 text-white flex items-center justify-center font-extrabold text-lg shrink-0 shadow-sm">
            {firstName[0]?.toUpperCase() || "H"}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Milestone overview</p>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Hey {firstName}!</h2>
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {sorted.length === 0
                ? "Add a buddy to start tracking birthdays in one calm dashboard."
                : "Here is the compact view of the birthdays that matter next."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
          <Stat label="Milestones" value={sorted.length} tone="text-indigo-600" bg="bg-indigo-50" />
          <Stat label="Today" value={todayBirthdays.length} tone="text-amber-600" bg="bg-amber-50" />
          <Stat label="30-day pipeline" value={pipeline30.length} tone="text-violet-600" bg="bg-violet-50" />
          <Stat label="Missing birthday" value={missingBirthdays.length} tone="text-slate-600" bg="bg-slate-100" />
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xs text-left">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Next milestones</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Only the closest dates appear here.</p>
          </div>
          <button
            type="button"
            onClick={() => onViewFriend(sorted[0]?.id || "")}
            disabled={sorted.length === 0}
            className="text-[11px] font-black text-indigo-600 disabled:text-slate-300 disabled:cursor-not-allowed inline-flex items-center gap-1"
          >
            Open directory <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {sorted.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Cake className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No milestones tracked yet</p>
            <p className="text-xs text-slate-500 mt-1">Add a buddy from the directory to see upcoming birthdays here.</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 ios-scroll-safe">
            {urgent.map((friend, index) => {
              const days = daysUntil(friend.birthday);
              return (
                <button
                  key={`${friend.id}-${index}`}
                  type="button"
                  onClick={() => onViewFriend(friend.id)}
                  className="min-w-[210px] max-w-[210px] rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left hover:border-indigo-200 hover:bg-indigo-50/40 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className={`w-11 h-11 rounded-2xl ${friend.avatar || "bg-indigo-500"} text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0`}>
                      {friend.name.replace(" (You)", "").split(" ").map((part) => part[0]).slice(0, 2).join("")}
                    </div>
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full shrink-0 ${
                      days === 0 ? "bg-amber-100 text-amber-700" : "bg-white text-slate-500 border border-slate-200"
                    }`}>
                      {getDaysLabel(days)}
                    </span>
                  </div>
                  <div className="mt-4">
                    <p className="text-sm font-black text-slate-900 truncate">{friend.name}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{formatDate(friend.birthday)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-bold text-slate-500">
                    <span>{friend.wishlist?.length || 0} wishlist items</span>
                    <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {missingBirthdays.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-[2rem] p-5 shadow-xs text-left">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Birthday missing</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">These local celebrants need a birthday before they appear in milestone views.</p>
            </div>
          </div>
          <div className="space-y-2">
            {missingBirthdays.slice(0, 5).map((friend) => (
              <button
                key={friend.id}
                type="button"
                onClick={() => onViewFriend(friend.id)}
                className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-left hover:bg-amber-50 hover:border-amber-200 transition"
              >
                <span className="text-sm font-black text-slate-800 truncate">{friend.name}</span>
                <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-1 rounded-full">Add date</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value, tone, bg }: { label: string; value: number; tone: string; bg: string }) {
  return (
    <div className={`${bg} rounded-2xl p-3 text-center border border-slate-100`}>
      <div className={`text-xl md:text-2xl font-black ${tone}`}>{value}</div>
      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-0.5">{label}</div>
    </div>
  );
}
