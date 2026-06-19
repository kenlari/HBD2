import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight, ArrowLeft, Check, Sparkles, User, AtSign,
  Cake, Lock, Phone, Palette, Heart, Eye, EyeOff, CheckCircle2,
  Mail, ShieldCheck, Users, Calendar
} from "lucide-react";
import { auth, db } from "../firebase";
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification,
  updatePassword
} from "firebase/auth";
import { doc, getDoc, setDoc, collection, getDocs, query, where } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface SignUpSession {
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
  phoneNumber?: string;
  countryCode?: string;
  currency?: string;
}

interface SignUpFlowProps {
  onComplete: (session: SignUpSession) => void;
  onGoToLogin: () => void;
  triggerToast: (title: string, message: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Data (31 Comprehensive Global Countries)
// ─────────────────────────────────────────────────────────────────────────────
export const COUNTRIES = [
  { code: 'GH', name: 'Ghana', dialCode: '+233', currency: 'GHS', flag: '🇬🇭' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', currency: 'NGN', flag: '🇳🇬' },
  { code: 'US', name: 'United States', dialCode: '+1', currency: 'USD', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', currency: 'GBP', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', currency: 'CAD', flag: '🇨🇦' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', currency: 'ZAR', flag: '🇿🇦' },
  { code: 'KE', name: 'Kenya', dialCode: '+254', currency: 'KES', flag: '🇰🇪' },
  { code: 'DE', name: 'Germany', dialCode: '+49', currency: 'EUR', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', currency: 'EUR', flag: '🇫🇷' },
  { code: 'IN', name: 'India', dialCode: '+91', currency: 'INR', flag: '🇮🇳' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', currency: 'AED', flag: '🇦🇪' },
  { code: 'AU', name: 'Australia', dialCode: '+61', currency: 'AUD', flag: '🇦🇺' },
  { code: 'NZ', name: 'New Zealand', dialCode: '+64', currency: 'NZD', flag: '🇳🇿' },
  { code: 'SG', name: 'Singapore', dialCode: '+65', currency: 'SGD', flag: '🇸🇬' },
  { code: 'IE', name: 'Ireland', dialCode: '+353', currency: 'EUR', flag: '🇮🇪' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', currency: 'EUR', flag: '🇳🇱' },
  { code: 'CH', name: 'Switzerland', dialCode: '+41', currency: 'CHF', flag: '🇨🇭' },
  { code: 'SE', name: 'Sweden', dialCode: '+46', currency: 'SEK', flag: '🇸🇪' },
  { code: 'NO', name: 'Norway', dialCode: '+47', currency: 'NOK', flag: '🇳🇴' },
  { code: 'DK', name: 'Denmark', dialCode: '+45', currency: 'DKK', flag: '🇩🇰' },
  { code: 'JP', name: 'Japan', dialCode: '+81', currency: 'JPY', flag: '🇯🇵' },
  { code: 'KR', name: 'South Korea', dialCode: '+82', currency: 'KRW', flag: '🇰🇷' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', currency: 'EGP', flag: '🇪🇬' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', currency: 'BRL', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', currency: 'MXN', flag: '🇲🇽' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', currency: 'SAR', flag: '🇸🇦' },
  { code: 'CN', name: 'China', dialCode: '+86', currency: 'CNY', flag: '🇨🇳' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', currency: 'RWF', flag: '🇷🇼' },
  { code: 'CI', name: 'Côte d\'Ivoire', dialCode: '+225', currency: 'XOF', flag: '🇨🇮' },
  { code: 'SN', name: 'Senegal', dialCode: '+221', currency: 'XOF', flag: '🇸🇳' },
  { code: 'CM', name: 'Cameroon', dialCode: '+237', currency: 'XAF', flag: '🇨🇲' }
];

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/^@/, "").replace(/\s+/g, "_");
}

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
  const [email, setEmail] = useState("");
  
  // Checking uniqueness handles
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [birthday, setBirthday] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("+233");
  const [whatsapp, setWhatsapp] = useState("+233");
  const [avatar, setAvatar] = useState("bg-indigo-500");
  const [interests, setInterests] = useState<string[]>([]);
  const [selectedCountryCode, setSelectedCountryCode] = useState("GH");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [rawPhone, setRawPhone] = useState("");
  const [contactsPermission, setContactsPermission] = useState(true);
  const [calendarPermission, setCalendarPermission] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isWaitingForVerification, setIsWaitingForVerification] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  const [savedSessionTemp, setSavedSessionTemp] = useState<SignUpSession | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Mark signup session as active to prevent App.tsx premature redirects
  useEffect(() => {
    localStorage.setItem("signup_in_progress", "true");
    return () => {
      localStorage.removeItem("signup_in_progress");
    };
  }, []);

  // Focus effect
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 350);
  }, [step]);

  const handleGoToLoginClean = () => {
    setName("");
    setUsername("");
    setEmail("");
    setBirthday("");
    setPassword("");
    setRawPhone("");
    setPhone("+233");
    setWhatsapp("+233");
    setInterests([]);
    setUsernameError("");
    setEmailError("");
    setPhoneError("");
    setIsCheckingUsername(false);
    setIsCheckingEmail(false);
    setIsCheckingPhone(false);
    setIsCompleting(false);
    
    onGoToLogin();
  };

  const go = (next: number) => {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const toggleInterest = (label: string) => {
    setInterests(prev =>
      prev.includes(label) ? prev.filter(i => i !== label) : [...prev, label]
    );
  };

  // Verify unique handles
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 1800): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
  };

  useEffect(() => {
    const targetedUsername = normalizeUsername(username);
    if (targetedUsername.length < 3) {
      setUsernameError("");
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsCheckingUsername(true);
      setUsernameError("");
      try {
        const usernameDocSnap = await withTimeout(getDoc(doc(db, "usernames", targetedUsername)), 2500);
        if (usernameDocSnap.exists()) {
          setUsernameError("This username handle is already claimed.");
        }
      } catch (err: any) {
        console.error("Username availability check error:", err);
        setUsernameError("Could not verify username uniqueness right now.");
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [username]);

  const handleUsernameNext = async () => {
    const targetedUsername = normalizeUsername(username);
    if (targetedUsername.length < 3) {
      setUsernameError("Username should be at least 3 characters.");
      triggerToast("Invalid Handle ❌", "Username should be at least 3 characters.");
      return;
    }
    
    setIsCheckingUsername(true);
    setUsernameError("");
    try {
      // 1. Check usernames flat collection first
      const usernameDocRef = doc(db, "usernames", targetedUsername);
      const usernameDocSnap = await withTimeout(getDoc(usernameDocRef), 2500);
      if (usernameDocSnap.exists()) {
        setUsernameError("This username handle is already claimed.");
        triggerToast("Username Taken ❌", "This username handle is already claimed.");
        setIsCheckingUsername(false);
        return;
      }

      setIsCheckingUsername(false);
      go(2);
    } catch (err: any) {
      console.error("Username query verification error:", err);
      setUsernameError("Verification failed due to a network or database issue. Please try again.");
      triggerToast("Query Failed ❌", "Could not verify username uniqueness.");
      setIsCheckingUsername(false);
    }
  };

  const handleEmailNext = async () => {
    const targetedEmail = email.trim().toLowerCase();
    if (!validateEmail(targetedEmail)) {
      setEmailError("Please enter a valid email address.");
      triggerToast("Invalid Email ❌", "Please enter a valid email address.");
      return;
    }
    
    setIsCheckingEmail(true);
    setEmailError("");
    try {
      const emailQuery = query(collection(db, "users"), where("email", "==", targetedEmail));
      const querySnapshot = await withTimeout(getDocs(emailQuery), 2500);
      
      if (!querySnapshot.empty) {
        setEmailError("This email address is already registered.");
        triggerToast("Email Registered ❌", "This email address is already registered.");
        setIsCheckingEmail(false);
        return;
      }
      
      setIsCheckingEmail(false);
      go(3);
    } catch (err: any) {
      console.error("Email verification check error: ", err);
      setEmailError("Verification failed due to a network or database issue. Please try again.");
      triggerToast("Query Failed ❌", "Could not verify email uniqueness.");
      setIsCheckingEmail(false);
    }
  };

  const handlePhoneNext = async () => {
    const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];
    const cleanPhoneDigits = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
    const formattedPhone = `${selectedCountry.dialCode}${cleanPhoneDigits}`;

    if (cleanPhoneDigits.length < 7) {
      setPhoneError("Phone number must be at least 7 digits.");
      triggerToast("Invalid Phone ❌", "Phone number must be at least 7 digits.");
      return;
    }

    setIsCheckingPhone(true);
    setPhoneError("");
    try {
      const phoneQuery1 = query(collection(db, "users"), where("phone", "==", formattedPhone));
      const phoneQuery2 = query(collection(db, "users"), where("whatsapp", "==", formattedPhone));
      const phoneQuery3 = query(collection(db, "users"), where("phoneNumber", "==", formattedPhone));
      
      const [snap1, snap2, snap3] = await withTimeout(Promise.all([
        getDocs(phoneQuery1),
        getDocs(phoneQuery2),
        getDocs(phoneQuery3)
      ]), 3000);
      
      if (!snap1.empty || !snap2.empty || !snap3.empty) {
        setPhoneError("This phone number is already linked to an account.");
        triggerToast("Phone Registered ❌", "This phone number is already registered.");
        setIsCheckingPhone(false);
        return;
      }

      setIsCheckingPhone(false);
      go(5);
    } catch (err: any) {
      console.error("Phone query validation error: ", err);
      setPhoneError("Verification failed due to a network or database issue. Please try again.");
      triggerToast("Query Failed ❌", "Could not verify phone number uniqueness.");
      setIsCheckingPhone(false);
    }
  };



  const handleSelectCountry = (c: typeof COUNTRIES[0]) => {
    setSelectedCountryCode(c.code);
    setIsCountryDropdownOpen(false);
    setCountrySearchQuery(""); // clear
    
    // Dynamically update states
    const formatted = `${c.dialCode}${rawPhone}`;
    setPhone(formatted);
    setWhatsapp(formatted);
  };

  const handlePhoneInput = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setRawPhone(clean);
    const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];
    const formatted = `${selectedCountry.dialCode}${clean}`;
    setPhone(formatted);
    setWhatsapp(formatted);
  };

  const handleCheckEmailVerification = async (sessionParam: SignUpSession) => {
    setIsCheckingVerification(true);
    setVerificationError(null);
    try {
      if (!auth.currentUser) {
        throw new Error("No active credentials-based signup session found.");
      }
      
      await auth.currentUser.reload();
      
      if (auth.currentUser.emailVerified) {
        setIsCompleting(true);
        // Let's write the documents to Firestore & allow them in!
        try {
          await withTimeout(setDoc(doc(db, "users", sessionParam.uid), {
            ...sessionParam,
            walletBalance: 0,
            isPremium: false,
            accountType: "Free",
            createdAt: new Date().toISOString()
          }), 3000);

          if (sessionParam.username) {
            await withTimeout(setDoc(doc(db, "usernames", sessionParam.username.toLowerCase().trim()), {
              uid: sessionParam.uid,
              email: sessionParam.email.toLowerCase().trim(),
              username: sessionParam.username.toLowerCase().trim(),
              createdAt: new Date().toISOString()
            }, { merge: true }), 3000);
          }
        } catch (dbErr: any) {
          console.warn("Database storage sync issue handled offline:", dbErr);
        }

        localStorage.removeItem("signup_in_progress");
        localStorage.setItem("birthday_authenticated_user", JSON.stringify(sessionParam));
        
        setIsCompleting(false);
        setIsWaitingForVerification(false);
        onComplete(sessionParam);
        triggerToast("Welcome to HBD Loop! 🥳", "Your secure cloud profile is verified and active!");
      } else {
        setVerificationError("We haven't detected your email verification yet. Please find the validation link in your inbox and click it first.");
        triggerToast("Not Verified Yet ⚠️", "Please verify your email address via the link we sent, then try again.");
      }
    } catch (err: any) {
      console.error("Verification error:", err);
      setVerificationError(err.message || "An unexpected error occurred during email verification checking.");
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    // Collect country, digits, and fallback options upfront
    const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];
    const cleanPhoneDigits = rawPhone.replace(/\D/g, '').replace(/^0+/, '');
    const formattedPhone = `${selectedCountry.dialCode}${cleanPhoneDigits}`;
    
    // Check if we are already authenticated via passwordless email link
    const currentFirebaseUser = auth.currentUser;
    const fallbackUid = currentFirebaseUser?.uid || "";
    let uid = fallbackUid;

    // Pre-construct SignUpSession object
    const session: SignUpSession = {
      uid,
      name: name.trim(),
      username: normalizeUsername(username),
      email: email.trim().toLowerCase(),
      birthday,
      avatar,
      interests,
      phone: formattedPhone || phone,
      whatsapp: formattedPhone || whatsapp,
      phoneNumber: formattedPhone || phone,
      countryCode: selectedCountry.code,
      currency: selectedCountry.currency,
    };

    try {
      // 1. Create firebase user credentials if not already registered/verified
      if (currentFirebaseUser && currentFirebaseUser.email?.toLowerCase() === email.trim().toLowerCase()) {
        uid = currentFirebaseUser.uid;
        session.uid = uid;
        if (password.trim().length >= 6) {
          try {
            await withTimeout(updatePassword(currentFirebaseUser, password.trim()));
          } catch (passwordUpdateErr) {
            console.warn("Silent non-blocking password update on current linked user bypassed:", passwordUpdateErr);
          }
        }
      } else {
        const userCredential = await withTimeout(createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password.trim()), 5000);
        uid = userCredential.user.uid;
        session.uid = uid;

        // Instantly call sendEmailVerification
        try {
          await withTimeout(sendEmailVerification(userCredential.user), 4000);
        } catch (vErr) {
          console.warn("sendEmailVerification silent skipped:", vErr);
        }
      }

      setSavedSessionTemp(session);
      setIsCompleting(false);
      setIsWaitingForVerification(true);
      triggerToast("Verification Required ✉️", "We dispatched a secure verification link to your email inbox!");
    } catch (authErr: any) {
      setIsCompleting(false);
      if (authErr.code === "auth/email-already-in-use" || authErr.message?.includes("already") || authErr.code === "auth/credential-already-in-use") {
        triggerToast("Account Already Exists ❌", "This email is already registered. Please go to Log In instead.");
      } else {
        console.error("Auth registration error:", authErr);
        triggerToast("Registration Failed ❌", authErr.message || "Failed to create your account.");
      }
    }
  };

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  };

  // Slide transitions
  const variants = {
    enter: (dir: number) => ({ x: dir * 60, opacity: 0, scale: 0.97 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (dir: number) => ({ x: dir * -60, opacity: 0, scale: 0.97 }),
  };

  const transition = { type: "spring" as const, stiffness: 350, damping: 30 };

  // Global search filtering for Countries list
  const filteredCountries = COUNTRIES.filter(c => 
    c.name.toLowerCase().includes(countrySearchQuery.toLowerCase()) || 
    c.dialCode.includes(countrySearchQuery)
  );

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
            className="w-full bg-white border border-[#E5E1D8] text-[#1E293B] text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition-all placeholder:text-slate-400"
          />
          <p className="text-xs text-slate-500 px-1 text-left">e.g. Kenneth Ogunlari</p>
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
        <div className="space-y-3 text-left">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 font-extrabold text-lg select-none">@</span>
            <input
              ref={inputRef}
              type="text"
              value={username}
              onChange={e => {
                setUsername(normalizeUsername(e.target.value));
                setUsernameError("");
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && normalizeUsername(username).length >= 3 && !isCheckingUsername) {
                   await handleUsernameNext();
                }
              }}
              placeholder="username_handle"
              className={`w-full bg-white border ${usernameError ? 'border-rose-500' : 'border-[#E5E1D8]'} text-[#1E293B] text-lg font-semibold rounded-2xl pl-10 pr-12 py-4 outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 transition-all placeholder:text-slate-450 font-mono`}
            />
            {normalizeUsername(username).length >= 3 && !isCheckingUsername && !usernameError && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </motion.div>
            )}
            {isCheckingUsername && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              </div>
            )}
          </div>
          {usernameError ? (
            <div className="bg-rose-550 border border-rose-300 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-white font-extrabold text-xs">
                <span>⚠️ Handle Claimed</span>
              </div>
              <p className="text-xs text-rose-50 font-semibold leading-relaxed">
                This identifier is taken.{" "}
                <button
                  type="button"
                  onClick={handleGoToLoginClean}
                  className="underline font-black text-white hover:text-rose-100 transition-colors cursor-pointer"
                >
                  Click here to Sign In instead
                </button>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 px-1">At least 3 characters. No spaces.</p>
          )}
        </div>
      ),
      canNext: normalizeUsername(username).length >= 3 && !isCheckingUsername && !usernameError,
      onNext: handleUsernameNext,
    },

    // STEP 2 — Email
    {
      icon: <Mail className="w-6 h-6" />,
      emoji: "✉️",
      title: "What's your email?",
      subtitle: "This is crucial to secure your milestones account.",
      content: (
        <div className="space-y-3 text-left">
          <div className="relative">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                setEmailError("");
              }}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && validateEmail(email) && !isCheckingEmail) {
                  await handleEmailNext();
                }
              }}
              placeholder="name@example.com"
              className={`w-full bg-white border ${emailError ? "border-rose-500" : "border-[#E5E1D8]"} text-[#1E293B] text-lg font-semibold rounded-2xl pr-12 px-5 py-4 outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 transition-all placeholder:text-slate-400 font-mono`}
            />
            {validateEmail(email) && !isCheckingEmail && !emailError && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
              </motion.div>
            )}
            {isCheckingEmail && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
              </div>
            )}
          </div>
          {emailError ? (
            <div className="bg-rose-550 border border-rose-300 rounded-2xl p-4 space-y-3 shadow-md">
              <div className="flex items-center gap-2 text-white font-extrabold text-xs">
                <span>⚠️ Email Unavailable</span>
              </div>
              <p className="text-xs text-rose-50 font-semibold leading-relaxed">
                This identifier is taken.{" "}
                <button
                  type="button"
                  onClick={handleGoToLoginClean}
                  className="underline font-black text-white hover:text-rose-100 transition-colors cursor-pointer"
                >
                  Click here to Sign In instead
                </button>
              </p>
            </div>
          ) : (
            <p className="text-xs text-slate-500 px-1">We will secure your account with standard email credentials.</p>
          )}
        </div>
      ),
      canNext: validateEmail(email) && !isCheckingEmail,
      onNext: handleEmailNext,
    },

    // STEP 3 — Birthday
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
            className="w-full bg-white border border-[#E5E1D8] text-[#1E293B] text-lg font-semibold rounded-2xl px-5 py-4 outline-none focus:border-indigo-600 focus:bg-white focus:ring-1 focus:ring-indigo-600 transition-all cursor-pointer box-border"
          />
          {birthday && (
            <motion.p
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-sm text-indigo-700 font-semibold px-1 text-left"
            >
              🎉 {new Date(birthday).toLocaleDateString("en-US", { month: "long", day: "numeric" })} — noted!
            </motion.p>
          )}
        </div>
      ),
      canNext: !!birthday,
      onNext: () => go(4),
    },

    // STEP 4 — Country & Phone with searchable dynamic dropdown list
    {
      icon: <Phone className="w-6 h-6" />,
      emoji: "📞",
      title: "Country & Phone",
      subtitle: "Select your country and enter your mobile number.",
      content: (
        <div className="space-y-4 text-left">
          <div className="space-y-2 relative">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 px-1">Select Country</label>
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className="w-full bg-white border border-[#E5E1D8] text-slate-800 text-base font-semibold rounded-2xl px-4 py-3.5 outline-none focus:border-indigo-600 focus:bg-white transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{(COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0]).flag}</span>
                <span>{(COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0]).name}</span>
              </div>
              <span className="text-indigo-600 text-xs">▼</span>
            </button>
            <AnimatePresence>
              {isCountryDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute left-0 right-0 mt-2 max-h-56 overflow-y-auto bg-white border border-[#E5E1D8] rounded-2xl shadow-xl z-50 p-1 divide-y divide-slate-100 flex flex-col"
                >
                  {/* Country search text input box */}
                  <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0 backdrop-blur z-10 shrink-0">
                    <input
                      type="text"
                      value={countrySearchQuery}
                      onChange={(e) => setCountrySearchQuery(e.target.value)}
                      placeholder="Search country name or code..."
                      className="w-full bg-white border border-[#E5E1D8] text-[#1E293B] text-xs rounded-xl px-3 py-2 outline-none focus:border-indigo-600 font-medium placeholder:text-slate-400"
                      onClick={(e) => e.stopPropagation()} // Keep popover open
                    />
                  </div>
                  
                  {/* Scrollable list options */}
                  <div className="overflow-y-auto max-h-40 flex-1">
                    {filteredCountries.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">No matching countries</div>
                    ) : (
                      filteredCountries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleSelectCountry(c)}
                          className="w-full flex items-center gap-2.5 px-4 py-3 hover:bg-slate-50 text-slate-800 text-left transition-colors cursor-pointer text-sm font-semibold"
                        >
                          <span className="text-lg">{c.flag}</span>
                          <span className="flex-1">{c.name}</span>
                          <span className="text-xs text-indigo-600 font-mono font-bold">{c.dialCode}</span>
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-500 px-1">Phone Number</label>
            <div className={`flex bg-white border ${phoneError ? "border-rose-500" : "border-[#E5E1D8]"} rounded-2xl focus-within:border-indigo-600 focus-within:bg-white transition-all items-center overflow-hidden pr-4`}>
              <span className="pl-4 pr-1 text-indigo-600 font-extrabold text-lg select-none">
                {(COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0]).dialCode}
              </span>
              <input
                ref={inputRef}
                type="tel"
                value={rawPhone}
                onChange={e => {
                  handlePhoneInput(e.target.value);
                  setPhoneError("");
                }}
                onKeyDown={async (e) => {
                  if (e.key === "Enter" && rawPhone.replace(/\D/g, "").length >= 7 && !isCheckingPhone) {
                    await handlePhoneNext();
                  }
                }}
                placeholder="054 123 4567"
                className="w-full bg-transparent text-[#1E293B] text-lg font-semibold px-2 py-4 outline-none placeholder:text-slate-400 font-mono"
              />
              {rawPhone.replace(/\D/g, "").length >= 7 && !isCheckingPhone && !phoneError && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center shrink-0"
                >
                  <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                </motion.div>
              )}
              {isCheckingPhone && (
                <div className="shrink-0">
                  <div className="w-5 h-5 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
                </div>
              )}
            </div>
            {phoneError ? (
              <div className="bg-rose-550 border border-rose-300 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center gap-2 text-white font-extrabold text-xs">
                  <span>⚠️ Phone Linked</span>
                </div>
                <p className="text-xs text-rose-50 font-semibold leading-relaxed">
                  This identifier is taken.{" "}
                  <button
                    type="button"
                    onClick={handleGoToLoginClean}
                    className="underline font-black text-white hover:text-rose-100 transition-colors cursor-pointer"
                  >
                    Click here to Sign In instead
                  </button>
                </p>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 px-1">Digits only. Leading zeros are formatted out automatically.</p>
            )}
          </div>
        </div>
      ),
      canNext: rawPhone.replace(/\D/g, "").length >= 7 && !isCheckingPhone,
      onNext: handlePhoneNext,
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
              className="w-full bg-white border border-[#E5E1D8] text-[#1E293B] text-lg font-semibold rounded-2xl px-5 pr-14 py-4 outline-none focus:border-indigo-600 focus:bg-white transition-all placeholder:text-slate-400 font-mono"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Strength visualization bars */}
          <div className="flex gap-1 px-1">
            {[1, 2, 3, 4].map(i => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-all ${
                  password.length >= i * 3
                    ? password.length >= 10 ? "bg-emerald-500" : "bg-amber-500"
                    : "bg-slate-100"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 px-1 leading-normal text-left font-medium">
            {password.length === 0 ? "Start typing..." : password.length < 6 ? "Too short" : password.length < 10 ? "Good" : "Strong 💪"}
          </p>
        </div>
      ),
      canNext: password.length >= 6,
      onNext: () => go(6),
    },

    // STEP 6 — Interests
    {
      icon: <Heart className="w-6 h-6" />,
      emoji: "✨",
      title: "What are you into?",
      subtitle: "Optional — pick any of these topics to power personalized AI gift ideas.",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {INTEREST_OPTIONS.map(({ label, emoji }) => {
            const chosen = interests.includes(label);
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleInterest(label)}
                className={`flex items-center justify-between w-full h-12 px-4 rounded-xl text-xs sm:text-sm font-bold transition-all border ${
                  chosen
                    ? "bg-indigo-600 border-indigo-600 text-white scale-[1.02] shadow-md shadow-indigo-150"
                    : "bg-white border-[#E5E1D8] text-slate-700 hover:border-slate-400 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{emoji}</span>
                  <span>{label}</span>
                </div>
                {chosen && <Check className="w-3.5 h-3.5 text-white stroke-[3] shrink-0" />}
              </button>
            );
          })}
        </div>
      ),
      canNext: true,
      onNext: () => go(7),
      nextLabel: "Next Step ⚡",
    },

    // STEP 7 — Contacts & Calendar Sync Permission Cards that auto-stack responsively
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      emoji: "📱",
      title: "Sync & Permissions",
      subtitle: "Import birthdays from your address book & keep milestones synchronized beautifully.",
      content: (
        <div className="space-y-4 text-left font-sans">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            {/* Contacts Row Card */}
            <div className={`p-4 md:p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${contactsPermission ? "bg-indigo-50/50 border-indigo-200" : "bg-white border-[#E5E1D8]"}`}>
              <div className="space-y-3">
                <div className={`p-2.5 rounded-xl w-fit ${contactsPermission ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-500"} transition-colors`}>
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">Contacts Synced</div>
                  <div className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                    Find and follow existing buddies' birthdays from your master address book automatically.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setContactsPermission(!contactsPermission)}
                className={`w-full py-2.5 h-12 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${contactsPermission ? "bg-indigo-650 hover:bg-indigo-550 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"}`}
                style={{ minHeight: "48px" }}
              >
                {contactsPermission ? "✓ Synced" : "Sync Contacts"}
              </button>
            </div>

            {/* Calendar Row Card */}
            <div className={`p-4 md:p-5 rounded-3xl border transition-all flex flex-col justify-between gap-4 ${calendarPermission ? "bg-teal-50/50 border-teal-200" : "bg-white border-[#E5E1D8]"}`}>
              <div className="space-y-3">
                <div className={`p-2.5 rounded-xl w-fit ${calendarPermission ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-500"} transition-colors`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-slate-900">Calendar Integration</div>
                  <div className="text-[10px] text-slate-600 leading-relaxed font-semibold">
                    Import historical milestone data and anniversary trackers into HBD Loop in the background.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCalendarPermission(!calendarPermission)}
                className={`w-full py-2.5 h-12 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${calendarPermission ? "bg-teal-650 hover:bg-teal-550 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"}`}
                style={{ minHeight: "48px" }}
              >
                {calendarPermission ? "✓ Synced" : "Integrate Calendar"}
              </button>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-120 rounded-xl p-3 text-[10px] text-indigo-750 leading-relaxed text-center font-bold">
            🔒 All imported data is processed locally first and encrypted in transit to your HBD Loop workspace.
          </div>
        </div>
      ),
      canNext: true,
      onNext: handleComplete,
      nextLabel: "Continue 🚀",
    },
  ];

  const current = steps[step];

  if (isWaitingForVerification && savedSessionTemp) {
    return (
      <div className="w-full min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-5 relative overflow-hidden">
        {/* Soft, warm colorful ambient radial glows */}
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_top_left,rgba(255,77,0,0.06),transparent_55%)] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.06),transparent_55%)] pointer-events-none" />
        
        <div className="w-full max-w-md mx-auto sm:max-w-xl lg:max-w-4xl px-4 z-10 flex flex-col gap-6" id="hbd-verification-flow">
          {/* Logo Mark Inline SVG - Upgraded HBD Loop anchor */}
          <div className="flex justify-center mb-2">
            <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", backgroundColor: "transparent" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{ width: "44px", height: "44px", display: "block" }} fill="none">
                <rect x="12" y="15" width="14" height="70" rx="7" fill="url(#hbdLoopGradVerification)" />
                <rect x="74" y="15" width="14" height="70" rx="7" fill="url(#hbdLoopGradVerification)" />
                <path d="M 19,50 C 30,15 40,85 50,50 C 60,15 70,85 81,50 C 70,15 60,85 50,50 C 40,15 30,85 19,50 Z" fill="none" stroke="url(#hbdLoopGradVerification)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                <defs>
                  <linearGradient id="hbdLoopGradVerification" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF4D00" />
                    <stop offset="100%" stopColor="#7C3AED" />
                  </linearGradient>
                </defs>
              </svg>
              <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, textAlign: "left" }}>
                <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "28px", fontWeight: 900, letterSpacing: "3px", color: "#1E293B" }}>HBD<span style={{ color: "#FF4D00" }}>LOOP</span></span>
                <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "2px", color: "#64748B", textTransform: "uppercase", marginTop: "2px" }}>Automated Gifting Engine</span>
              </div>
            </div>
          </div>

          {/* Locked Verification View Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E1D8] rounded-3xl p-6 shadow-xl space-y-6 text-center max-w-sm mx-auto"
          >
            <div className="space-y-2">
              <div className="text-4xl">✉️</div>
              <h2 className="text-xl font-extrabold text-[#0F172A]">Verify Your Email</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                We've sent a secure verification link to <span className="font-bold text-[#1E293B]">{savedSessionTemp.email}</span>. Click the link in that email to proceed.
              </p>
            </div>

            {verificationError && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3.5 rounded-xl leading-relaxed text-left font-bold"
              >
                ⚠️ {verificationError}
              </motion.div>
            )}

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleCheckEmailVerification(savedSessionTemp)}
                disabled={isCheckingVerification}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-350 disabled:cursor-not-allowed text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer shadow-md"
              >
                {isCheckingVerification ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>I've Clicked the Link 🚀</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={async () => {
                  try {
                    if (auth.currentUser) {
                      await sendEmailVerification(auth.currentUser);
                      triggerToast("Email Dispatched! ✉️", "Verification link sent again. Check spam folders!");
                    } else {
                      triggerToast("Error ❌", "No session active.");
                    }
                  } catch (e: any) {
                    triggerToast("Error ❌", e.message || "Failed to resend.");
                  }
                }}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold transition block mx-auto cursor-pointer"
              >
                Resend verification email
              </button>
            </div>
          </motion.div>

          <p className="text-center text-xs text-slate-500">
            Want to start over?{" "}
            <button
              type="button"
              onClick={() => {
                setIsWaitingForVerification(false);
                setStep(0);
              }}
              className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors cursor-pointer"
            >
              Back to Start
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Soft, warm colorful ambient radial glows */}
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_top_left,rgba(255,77,0,0.06),transparent_55%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.06),transparent_55%)] pointer-events-none" />

      <div className="w-full max-w-md mx-auto sm:max-w-xl lg:max-w-4xl px-4 z-10 flex flex-col gap-6">

        {/* Header navigation bar */}
        <div className="flex items-center justify-between max-w-md w-full mx-auto">
          <button
            type="button"
            onClick={() => step === 0 ? handleGoToLoginClean() : go(step - 1)}
            className="w-9 h-9 rounded-xl bg-white hover:bg-slate-50 border border-[#E5E1D8] flex items-center justify-center text-slate-500 hover:text-slate-850 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <StepDots current={step} total={TOTAL_STEPS} />

          <div className="w-9 h-9 rounded-xl bg-white border border-[#E5E1D8] flex items-center justify-center shadow-sm">
            <span className="text-xs font-black text-slate-400 font-mono">{step + 1}/{TOTAL_STEPS}</span>
          </div>
        </div>

        {/* Onboarding steps layout with high transition polish */}
        <div className="relative overflow-hidden w-full max-w-md sm:max-w-xl lg:max-w-4xl mx-auto">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              className="bg-white border border-[#E5E1D8] rounded-3xl h-auto py-6 md:py-8 px-6 space-y-6 flex flex-col justify-between shadow-xl"
            >
              {/* Step info context */}
              <div className="space-y-2">
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 400 }}
                  className="text-4xl text-left"
                >
                  {current.emoji}
                </motion.div>
                <h2 className="text-2xl font-black text-[#0F172A] leading-tight tracking-tight text-left">
                  {current.title}
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed text-left font-medium">
                  {current.subtitle}
                </p>
              </div>

              {/* Steps visual input component */}
              {current.content}

              {/* CTA trigger controls */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={current.onNext}
                  disabled={!current.canNext || isCompleting}
                  className={`flex-1 h-12 rounded-xl text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm ${
                    current.canNext && !isCompleting
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white active:scale-95"
                      : "bg-slate-100 text-slate-350 cursor-not-allowed border border-slate-200"
                  }`}
                >
                  {isCompleting ? (
                    <div className="flex items-center gap-2 justify-center">
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Creating Profile...</span>
                    </div>
                  ) : "nextLabel" in current && current.nextLabel ? (
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

        {/* Reactive status preview footer */}
        {step > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-[#E5E1D8] shadow-sm rounded-2xl px-4 py-3 flex items-center gap-3 max-w-md w-full mx-auto"
          >
            {avatar && (
              <div className={`w-9 h-9 rounded-xl ${avatar} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                {name ? name.split(" ").map(n => n[0]).join("").slice(0, 2) : "?"}
              </div>
            )}
            <div className="min-w-0 text-left">
              <p className="text-xs font-black text-slate-800 truncate">{name || "—"}</p>
              {username && <p className="text-[10px] font-mono text-indigo-600 font-bold">@{username}</p>}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {[name, username, email, birthday, rawPhone, password].filter(Boolean).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              ))}
            </div>
          </motion.div>
        )}

        {/* Return selection links */}
        <p className="text-center text-xs text-slate-500">
          Already have an account?{" "}
          <button
            type="button"
            onClick={handleGoToLoginClean}
            className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors cursor-pointer"
          >
            Sign In
          </button>
        </p>
      </div>
    </div>
  );
}
