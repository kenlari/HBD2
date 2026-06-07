import React from "react";
import { motion } from "motion/react";
import { Cake, Gift, MessageCircle, ChevronRight } from "lucide-react";
import { Friend } from "../types";

interface BirthdayDashboardProps {
  friends: Friend[];
  userName: string;
  onViewFriend: (friendId: string) => void;
  onOpenGiftAI: (friendId: string) => void;
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

function getUrgencyColor(days: number): string {
  if (days === 0) return "text-amber-700 bg-amber-50 border-amber-200";
  if (days <= 3) return "text-rose-600 bg-rose-50 border-rose-100";
  if (days <= 7) return "text-orange-600 bg-orange-50 border-orange-100";
  if (days <= 30) return "text-indigo-600 bg-indigo-50 border-indigo-100";
  return "text-slate-500 bg-slate-50 border-slate-100";
}

function getDaysLabel(days: number): string {
  if (days === 0) return "🎉 Today";
  if (days === 1) return "Tomorrow";
  return `${days} days`;
}

function openWhatsApp(friend: Friend) {
  const phone = (friend as any).whatsapp || (friend as any).phone || "";
  const msg = encodeURIComponent(
    `🎉 Happy Birthday ${friend.name.replace(" (You)", "")}! Wishing you an incredible day! 🎂💖`
  );
  if (phone) {
    window.open(`https://wa.me/${phone.replace(/\D/g, "")}?text=${msg}`, "_blank");
  } else {
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }
}

export function BirthdayDashboard({ friends, userName, onViewFriend, onOpenGiftAI }: BirthdayDashboardProps) {
  const sorted = [...friends]
    .filter((f) => f.id !== "alex")
    .sort((a, b) => daysUntil(a.birthday) - daysUntil(b.birthday));

  const todayBirthdays = sorted.filter((f) => daysUntil(f.birthday) === 0);
  const soonBirthdays = sorted.filter((f) => { const d = daysUntil(f.birthday); return d > 0 && d <= 30; });
  const laterBirthdays = sorted.filter((f) => daysUntil(f.birthday) > 30);
  const firstName = userName.split(" ")[0];

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="flex items-center gap-3 text-left">
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
            {firstName ? firstName[0].toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Hey {firstName}! 👋</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {sorted.length === 0 ? "Add friends to start tracking birthdays" : `Tracking ${sorted.length} friend${sorted.length > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: "Friends", value: sorted.length, color: "text-slate-800" },
            { label: "Today", value: todayBirthdays.length, color: "text-amber-600" },
            { label: "This Month", value: soonBirthdays.length, color: "text-indigo-600" },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-xl p-3 text-center">
              <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
              <div className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Today */}
      {todayBirthdays.length > 0 && (
        <Section label="Today's Birthdays 🎂" dot="bg-amber-500">
          {todayBirthdays.map((f, i) => (
            <Card key={f.id} friend={f} days={0} index={i} onViewFriend={onViewFriend} onOpenGiftAI={onOpenGiftAI} openWhatsApp={openWhatsApp} />
          ))}
        </Section>
      )}

      {/* Coming soon */}
      {soonBirthdays.length > 0 && (
        <Section label="Coming Up Soon" dot="bg-indigo-500">
          {soonBirthdays.map((f, i) => (
            <Card key={f.id} friend={f} days={daysUntil(f.birthday)} index={i} onViewFriend={onViewFriend} onOpenGiftAI={onOpenGiftAI} openWhatsApp={openWhatsApp} />
          ))}
        </Section>
      )}

      {/* Later */}
      {laterBirthdays.length > 0 && (
        <Section label="Later This Year" dot="bg-slate-300">
          {laterBirthdays.map((f, i) => (
            <Card key={f.id} friend={f} days={daysUntil(f.birthday)} index={i} onViewFriend={onViewFriend} onOpenGiftAI={onOpenGiftAI} openWhatsApp={openWhatsApp} />
          ))}
        </Section>
      )}

      {/* Empty */}
      {sorted.length === 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl text-center py-16 space-y-3">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto">
            <Cake className="w-5 h-5 text-slate-300" />
          </div>
          <p className="text-xs font-semibold text-slate-500">No friends added yet</p>
          <p className="text-[11px] text-slate-400 max-w-xs mx-auto leading-relaxed">
            Use the Buddies tab to add friends and track their birthdays.
          </p>
        </div>
      )}
    </div>
  );
}

function Section({ label, dot, children }: { label: string; dot: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
      <div className="flex items-center gap-2 px-1">
        <div className={`w-1.5 h-1.5 rounded-full ${dot}`} />
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</h3>
      </div>
      <div className="space-y-2">{children}</div>
    </motion.div>
  );
}

function Card({ friend, days, index, onViewFriend, onOpenGiftAI, openWhatsApp }: {
  friend: Friend; days: number; index: number;
  onViewFriend: (id: string) => void; onOpenGiftAI: (id: string) => void; openWhatsApp: (f: Friend) => void;
}) {
  const isToday = days === 0;
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      className={`bg-white border rounded-xl p-4 flex items-center justify-between gap-3 transition-all hover:border-slate-200 ${isToday ? "border-amber-100 bg-amber-50/20" : "border-slate-100"}`}
    >
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-9 h-9 ${friend.avatar || "bg-indigo-500"} rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0`}>
          {friend.name.replace(" (You)", "")[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-xs text-slate-900 truncate">{friend.name.replace(" (You)", "")}</span>
            {isToday && <span className="text-[8px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded uppercase">Today</span>}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-slate-400 flex-wrap">
            <span>{formatDate(friend.birthday)}</span>
            <span>·</span>
            <span>{friend.relationship}</span>
            {friend.wishlist?.length > 0 && (
              <><span>·</span><span className="text-indigo-500 flex items-center gap-0.5"><Gift className="w-2.5 h-2.5" />{friend.wishlist.length}</span></>
            )}
          </div>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-semibold px-2 py-1 rounded-lg border font-mono hidden sm:block ${getUrgencyColor(days)}`}>
          {getDaysLabel(days)}
        </span>
        <button onClick={() => openWhatsApp(friend)} title="WhatsApp"
          className="w-7 h-7 bg-green-50 hover:bg-green-500 text-green-600 hover:text-white border border-green-100 rounded-lg flex items-center justify-center transition-all cursor-pointer">
          <MessageCircle className="w-3 h-3" />
        </button>
        <button
          onClick={() => {
            const snapHandle = ((friend as any).snapchat || "").trim();
            const url = snapHandle ? `https://snapchat.com/add/${snapHandle}` : "https://snapchat.com";
            window.open(url, "_blank");
          }}
          title="Snapchat"
          className="w-7 h-7 bg-amber-50 hover:bg-amber-400 text-amber-700 hover:text-white border border-amber-100 rounded-lg flex items-center justify-center transition-all cursor-pointer"
        >
          <span className="text-[11px] font-black">👻</span>
        </button>
        <button onClick={() => onViewFriend(friend.id)} title="View profile"
          className="w-7 h-7 bg-slate-50 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-100 rounded-lg flex items-center justify-center transition-all cursor-pointer">
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
