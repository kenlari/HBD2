import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, ArrowLeft, Check, Sparkles, User, AtSign,
  Cake, Lock, Phone, Palette, Heart, Eye, EyeOff, CheckCircle2
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface SignUpSession {
  name: string;
  username: string;
  email: string;
  birthday: string;
  avatar: string;
  interests: string[];
  phone: string;
  whatsapp: string;
  password: string;
}

interface SignUpFlowProps {
  onComplete: (session: SignUpSession) => void;
  onGoToLogin: () => void;
  triggerToast: (title: string, message: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────────────
const INTEREST_OPTIONS = [
  { label: "Photography", emoji: "📸" },
  { label: "Specialty Coffee", emoji: "☕" },
  { label: "Cyberpunk Novels", emoji: "📖" },
  { label: "Mechanic Keyboards", emoji: "⌨️" },
  { label: "Yoga & Zen", emoji: "🧘" },
  { label: "Hiking & Trails", emoji: "🥾" },
  { label: "Baking Cakes", emoji: "🎂" },
  { label: "Guitar", emoji: "🎸" },
  { label: "Modern Design", emoji: "✏️" },
  { label: "Afrobeats", emoji: "🎵" },
  { label: "Gaming", emoji: "🎮" },
  { label: "Travel", emoji: "✈️" },
  { label: "Fitness", emoji: "💪" },
  { label: "Cooking", emoji: "🍳" },
  { label: "Movies", emoji: "🎬" },
  { label: "Fashion", emoji: "👗" },
  { label: "Tech & AI", emoji: "🤖" },
  { label: "Football", emoji: "⚽" },
];

const AVATAR_COLORS = [
  { bg: "bg-teal-500", hex: "#14b8a6", name: "Teal" },
  { bg: "bg-indigo-500", hex: "#6366f1", name: "Indigo" },
  { bg: "bg-amber-500", hex: "#f59e0b", name: "Amber" },
  { bg: "bg-rose-500", hex: "#f43f5e", name: "Rose" },
  { bg: "bg-emerald-500", hex: "#10b981", name: "Emerald" },
  { bg: "bg-pink-500", hex: "#ec4899", name: "Pink" },
  { bg: "bg-violet-500", hex: "#8b5cf6", name: "Violet" },
  { bg: "bg-orange-500", hex: "#f97316", name: "Orange" },
];

const TOTAL_STEPS = 7;

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────
function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1.5 items-center justify-center">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 20 : 6,
            opacity: i <= current ? 1 : 0.3,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className={`h-1.5 rounded-full ${i <= current ? "bg-indigo-400" : "bg-slate-700"}`}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function SignUpFlow({ onComplete, onGoToLogin, triggerToast }: SignUpFlowProps) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = back

  // Form state
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("+233");
  const [whatsapp, setWhatsapp] = useState("+233");
  const [avatar, setAvatar] = useState("bg-indigo-500");
  const [interests, setInterests] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 350);
  }, [step]);

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const toggleInterest = (label: string) => {
    setInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  const handleComplete = () => {
    const session: SignUpSession = {
      name: name.trim(),
      username: username.trim().replace(/^@/, ""),
      email: `${username.trim().toLowerCase().replace(/\s+/g, "")}@hbd.app`,
      birthday,
      avatar,
      interests,
      phone: phone.trim(),
      whatsapp: whatsapp.trim(),
      password: password.trim(),
    };

    // Save to localStorage
    localStorage.setItem("birthday_authenticated_user", JSON.stringify(session));
    const existing = localStorage.getItem("hbd_all_accounts");
    const accounts = existing ? JSON.parse(existing) : [];
    const filtered = accounts.filter((a: any) => a.username !== session.username);
    localStorage.setItem("hbd_all_accounts", JSON.stringify([...filtered, session]));

    onComplete(session);
  };

  // Slide variants
  const variants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0, scale: 0.97 }),
  };

  const transition = { type: "spring" as const, stiffness: 350, damping: 30 };

  // ── Steps ──────────────────────────────────────────────────────────────────
  const steps = [
    // STEP 0 — Name
    {
      icon: <User className="w-6 h-6" />,
      emoji: "👋",
      title: "What's your name?",
      subtitle: "This is how your friends will see you.",
      content: (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim() && go(1)}
            placeholder="Your full name"
            className="w-full bg-white/5 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:bg-white/10 transition-all placeholder:text-white/25"
          />
          <p className="text-xs text-white/40 px-1">e.g. Kenneth Ogunlari</p>
        </div>
      ),
      canNext: name.trim().length >= 2,
      onNext: () => go(1),
    },

    // STEP 1 — Username
    {
      icon: <AtSign className="w-6 h-6" />,
      emoji: "🪪",
      title: "Pick a username",
      subtitle: "Your unique handle. Friends will find you with this.",
      content: (
        <div className="space-y-3">
          <div className="relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-400 font-black text-lg">@</span>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"))}
              onKeyDown={e => e.key === "Enter" && username.trim().length >= 3 && go(2)}
              placeholder="your_handle"
              className="w-full bg-white/5 border border-white/10 text-white text-lg font-semibold rounded-2xl pl-10 pr-5 py-4 outline-none focus:border-indigo-400 focus:bg-white/10 transition-all placeholder:text-white/25 font-mono"
            />
            {username.trim().length >= 3 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </motion.div>
            )}
          </div>
          <p className="text-xs text-white/40 px-1">At least 3 characters. No spaces.</p>
        </div>
      ),
      canNext: username.trim().length >= 3,
      onNext: () => go(2),
    },

    // STEP 2 — Birthday
    {
      icon: <Cake className="w-6 h-6" />,
      emoji: "🎂",
      title: "When's your birthday?",
      subtitle: "So your friends can celebrate you too!",
      content: (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="date"
            value={birthday}
            onChange={e => setBirthday(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:bg-white/10 transition-all cursor-pointer"
          />
          {birthday && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-indigo-300 font-semibold px-1"
            >
              🎉 {new Date(birthday).toLocaleDateString("en-US", { month: "long", day: "numeric" })} — noted!
            </motion.p>
          )}
        </div>
      ),
      canNext: !!birthday,
      onNext: () => go(3),
    },

    // STEP 3 — Password
    {
      icon: <Lock className="w-6 h-6" />,
      emoji: "🔐",
      title: "Create a password",
      subtitle: "Make it strong. You'll need it to sign back in.",
      content: (
        <div className="space-y-3">
          <div className="relative">
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && password.length >= 6 && go(4)}
              placeholder="Min. 6 characters"
              className="w-full bg-white/5 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 pr-14 py-4 outline-none focus:border-indigo-400 focus:bg-white/10 transition-all placeholder:text-white/25 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Strength bar */}
          <div className="flex gap-1 px-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  password.length >= i * 3
                    ? password.length >= 10 ? "bg-emerald-400" : "bg-amber-400"
                    : "bg-white/10"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-white/40 px-1">
            {password.length === 0 ? "Start typing..." : password.length < 6 ? "Too short" : password.length < 10 ? "Good" : "Strong 💪"}
          </p>
        </div>
      ),
      canNext: password.length >= 6,
      onNext: () => go(4),
    },

    // STEP 4 — Phone
    {
      icon: <Phone className="w-6 h-6" />,
      emoji: "📱",
      title: "Your phone number",
      subtitle: "For WhatsApp birthday alerts. You can skip this.",
      content: (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === "Enter" && go(5)}
            placeholder="+233 24 123 4567"
            className="w-full bg-white/5 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:bg-white/10 transition-all placeholder:text-white/25 font-mono"
          />
          <input
            type="tel"
            value={whatsapp}
            onChange={e => setWhatsapp(e.target.value)}
            placeholder="WhatsApp number (if different)"
            className="w-full bg-white/5 border border-white/10 text-white text-base font-semibold rounded-2xl px-5 py-3.5 outline-none focus:border-indigo-400 focus:bg-white/10 transition-all placeholder:text-white/25 font-mono"
          />
        </div>
      ),
      canNext: true,
      onNext: () => go(5),
      skipLabel: "Skip",
    },

    // STEP 5 — Avatar
    {
      icon: <Palette className="w-6 h-6" />,
      emoji: "🎨",
      title: "Pick your color",
      subtitle: "This is your avatar accent. Choose your vibe.",
      content: (
        <div className="grid grid-cols-4 gap-3">
          {AVATAR_COLORS.map(col => (
            <button
              key={col.bg}
              type="button"
              onClick={() => setAvatar(col.bg)}
              className={`relative aspect-square rounded-2xl transition-all ${col.bg} ${
                avatar === col.bg ? "scale-110 ring-4 ring-white/60 ring-offset-2 ring-offset-slate-950" : "opacity-70 hover:opacity-100 hover:scale-105"
              }`}
            >
              {avatar === col.bg && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <Check className="w-6 h-6 text-white stroke-[3]" />
                </motion.div>
              )}
              <span className="absolute bottom-1.5 left-0 right-0 text-center text-[9px] text-white/70 font-bold">{col.name}</span>
            </button>
          ))}
        </div>
      ),
      canNext: !!avatar,
      onNext: () => go(6),
    },

    // STEP 6 — Interests
    {
      icon: <Heart className="w-6 h-6" />,
      emoji: "✨",
      title: "What are you into?",
      subtitle: "Pick at least 3. This powers AI gift suggestions.",
      content: (
        <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
          {INTEREST_OPTIONS.map(({ label, emoji }) => {
            const chosen = interests.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleInterest(label)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-bold transition-all border ${
                  chosen
                    ? "bg-indigo-600 border-indigo-500 text-white scale-105 shadow-lg shadow-indigo-900/40"
                    : "bg-white/5 border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                }`}
              >
                <span>{emoji}</span>
                <span>{label}</span>
                {chosen && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
            );
          })}
        </div>
      ),
      canNext: interests.length >= 3,
      onNext: handleComplete,
      nextLabel: "Let's go! 🎉",
    },
  ];

  const current = steps[step];

  return (
    <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-[100px]" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      <div className="w-full max-w-sm z-10 flex flex-col gap-6">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => step === 0 ? onGoToLogin() : go(step - 1)}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <StepDots current={step} total={TOTAL_STEPS} />

          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <span className="text-xs font-black text-white/30 font-mono">{step + 1}/{TOTAL_STEPS}</span>
          </div>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bg-slate-900/80 backdrop-blur-sm border border-white/8 rounded-3xl p-6 space-y-6"
            >
              {/* Step header */}
              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  className="text-4xl"
                >
                  {current.emoji}
                </motion.div>
                <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                  {current.title}
                </h2>
                <p className="text-sm text-white/45 leading-relaxed">
                  {current.subtitle}
                </p>
              </div>

              {/* Step content */}
              {current.content}

              {/* CTA */}
              <div className="flex gap-2 pt-1">
                {"skipLabel" in current && current.skipLabel && (
                  <button
                    type="button"
                    onClick={current.onNext}
                    className="flex-none px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white text-sm font-bold transition-all cursor-pointer"
                  >
                    Skip
                  </button>
                )}
                <button
                  type="button"
                  onClick={current.onNext}
                  disabled={!current.canNext}
                  className={`flex-1 py-3.5 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    current.canNext
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/50 active:scale-95"
                      : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
                  }`}
                >
                  {"nextLabel" in current && current.nextLabel ? (
                    current.nextLabel
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Preview card — shows what's been filled */}
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/3 border border-white/6 rounded-2xl px-4 py-3 flex items-center gap-3"
          >
            {avatar && (
              <div className={`w-9 h-9 rounded-xl ${avatar} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                {name ? name.split(" ").map(n => n[0]).join("").slice(0, 2) : "?"}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-black text-white/70 truncate">{name || "—"}</p>
              {username && <p className="text-[10px] font-mono text-indigo-400">@{username}</p>}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {[name, username, birthday, password].filter(Boolean).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Login link */}
        <p className="text-center text-xs text-white/30">
          Already have an account?{" "}
          <button
            type="button"
            onClick={onGoToLogin}
            className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
