import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, ArrowLeft, Check, Sparkles, User, AtSign,
  Cake, Lock, Phone, Palette, Heart, Eye, EyeOff, CheckCircle2,
  Mail, ShieldCheck
} from "lucide-react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface SignUpSession {
  uid: string;
  name: string;
  username: string;
  email: string;
  birthday: string;
  avatar: string;
  interests: string[];
  phone: string;
  whatsapp: string;
  password?: string;
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

const TOTAL_STEPS = 9;

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
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [inputCodeError, setInputCodeError] = useState("");
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

  const handleSendVerificationCode = () => {
    // Generate a beautiful, readable 4-digit code
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(code);
    setInputCodeError("");
    setVerificationCode("");
    triggerToast("Verification Code Sent! ✉️", `Simulated code to ${email}: ${code}`);
    go(3); // move to verification code input step
  };

  const handleComplete = async () => {
    try {
      // 1. Create a real account in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password.trim());
      const uid = userCredential.user.uid;

      // 2. Build the exact matching User entity schema (omitting raw passwords from database storage for security)
      const session: SignUpSession = {
        uid,
        name: name.trim(),
        username: username.trim().replace(/^@/, ""),
        email: email.trim().toLowerCase(),
        birthday,
        avatar,
        interests,
        phone: phone.trim(),
        whatsapp: whatsapp.trim() || phone.trim(),
      };

      // 3. Persist profile document in Firestore database
      await setDoc(doc(db, "users", uid), {
        ...session,
        walletBalance: 0,
        createdAt: new Date().toISOString()
      });

      // Maintain client caching fallback
      localStorage.setItem("birthday_authenticated_user", JSON.stringify(session));

      onComplete(session);
      triggerToast("Welcome to BloomBirth! 🥳", "Your secure cloud profile is synchronized and active.");
    } catch (error: any) {
      console.error("Firebase SignUp Error: ", error);
      let errorMsg = "Could not register your account. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMsg = "This email address is already registered. Try logging in instead.";
      } else if (error.code === "auth/weak-password") {
        errorMsg = "Your password is too weak. Please choose a safer password.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "Please verify your email format.";
      }
      triggerToast("Registration Failed ❌", errorMsg);
    }
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
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
      subtitle: "This is how your friends will see you on the registry.",
      content: (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && name.trim().length >= 2 && go(1)}
            placeholder="Your full name"
            className="w-full bg-slate-900 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:bg-slate-800 transition-all placeholder:text-white/20"
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
      subtitle: "Your unique handler. Friends will find you with this.",
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
              placeholder="username_handle"
              className="w-full bg-slate-900 border border-white/10 text-white text-lg font-semibold rounded-2xl pl-10 pr-5 py-4 outline-none focus:border-indigo-400 focus:bg-slate-800 transition-all placeholder:text-white/20 font-mono"
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

    // STEP 2 — Email Section (NEW!)
    {
      icon: <Mail className="w-6 h-6" />,
      emoji: "✉️",
      title: "What's your email?",
      subtitle: "This is crucial to secure your workspace account.",
      content: (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === "Enter" && validateEmail(email) && handleSendVerificationCode()}
            placeholder="name@example.com"
            className="w-full bg-slate-900 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:bg-slate-800 transition-all placeholder:text-white/20 font-mono"
          />
          <p className="text-xs text-white/40 px-1">We will send a 4-digit code to complete security verification.</p>
        </div>
      ),
      canNext: validateEmail(email),
      onNext: handleSendVerificationCode,
    },

    // STEP 3 — Email Verification Code (NEW!)
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      emoji: "🔑",
      title: "Verify your email",
      subtitle: `Enter the 4-digit code sent to ${email || "your address"}`,
      content: (
        <div className="space-y-4">
          <div className="bg-indigo-950/60 border border-indigo-800/80 rounded-2xl p-4 text-center">
            <span className="text-[10px] block text-indigo-300 font-extrabold uppercase tracking-widest mb-1.5">📬 Device Code Simulator</span>
            <span className="text-2xl font-mono tracking-[0.25em] font-black text-emerald-400 select-all">{generatedCode || "1234"}</span>
          </div>
          <input
            ref={inputRef}
            type="text"
            maxLength={4}
            value={verificationCode}
            onChange={e => {
              const val = e.target.value.replace(/[^0-9]/g, "");
              setVerificationCode(val);
              if (val.length === 4) {
                if (val === (generatedCode || "1234")) {
                  setInputCodeError("");
                } else {
                  setInputCodeError("Incorrect verification code code. Try again.");
                }
              }
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && verificationCode === (generatedCode || "1234")) {
                go(4);
              }
            }}
            placeholder="• • • •"
            className="w-full text-center bg-slate-900 border border-white/10 text-white text-2xl font-black rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:bg-slate-800 transition-all tracking-[0.4em]"
          />
          {inputCodeError && (
            <p className="text-xs text-rose-400 font-bold text-center">{inputCodeError}</p>
          )}
          {verificationCode.length === 4 && verificationCode === (generatedCode || "1234") && (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex justify-center items-center gap-1.5 text-emerald-400 text-xs font-bold"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Email verified successfully!</span>
            </motion.div>
          )}
        </div>
      ),
      canNext: verificationCode === (generatedCode || "1234"),
      onNext: () => {
        triggerToast("Email Verified! 🎉", "Your workspace email is secured.");
        go(4);
      },
    },

    // STEP 4 — Birthday
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
            className="w-full bg-slate-900 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:bg-slate-800 transition-all cursor-pointer box-border"
            style={{ colorScheme: "dark" }}
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
      onNext: () => go(5),
    },

    // STEP 5 — Password
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
              onKeyDown={e => e.key === "Enter" && password.length >= 6 && go(6)}
              placeholder="Min. 6 characters"
              className="w-full bg-slate-900 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 pr-14 py-4 outline-none focus:border-indigo-400 focus:bg-slate-800 transition-all placeholder:text-white/20 font-mono"
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
      onNext: () => go(6),
    },

    // STEP 6 — Phone Number (UPDATED: Just one phone number input field, WhatsApp mirroring is automated)
    {
      icon: <Phone className="w-6 h-6" />,
      emoji: "📱",
      title: "Your phone number",
      subtitle: "For WhatsApp birthday alerts and smart synchronization.",
      content: (
        <div className="space-y-3">
          <input
            ref={inputRef}
            type="tel"
            value={phone}
            onChange={e => {
              setPhone(e.target.value);
              setWhatsapp(e.target.value); // Mirror to whatsapp implicitly
            }}
            onKeyDown={e => e.key === "Enter" && phone.trim().length >= 4 && go(7)}
            placeholder="+233 24 123 4567"
            className="w-full bg-slate-900 border border-white/10 text-white text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-400 focus:bg-slate-800 transition-all placeholder:text-white/20 font-mono"
          />
          <p className="text-xs text-white/40 px-1">We will send safe, beautiful birthday countdown alerts here.</p>
        </div>
      ),
      canNext: phone.trim().length >= 4,
      onNext: () => {
        setWhatsapp(phone.trim());
        go(7);
      },
    },

    // STEP 7 — Avatar
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
                  className="absolute inset-0 flex items-center justify-center animate-pulse"
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
      onNext: () => go(8),
    },

    // STEP 8 — Interests
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
              {[name, username, email, birthday, password, phone].filter(Boolean).map((_, i) => (
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
