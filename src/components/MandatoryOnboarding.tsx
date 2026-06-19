import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { User, AtSign, Cake, Phone, ShieldCheck, Check, ArrowRight, AlertTriangle, LogOut } from "lucide-react";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { COUNTRIES } from "./SignUpFlow";
import { signOut } from "firebase/auth";

interface MandatoryOnboardingProps {
  userSession: {
    uid: string;
    name: string;
    username: string;
    email: string;
    birthday: string;
    avatar: string;
    interests: string[];
    phone?: string;
  };
  onComplete: (updatedSession: any) => void;
  triggerToast: (title: string, message: string) => void;
}

export function MandatoryOnboarding({ userSession, onComplete, triggerToast }: MandatoryOnboardingProps) {
  const [name, setName] = useState(userSession.name || "");
  const [username, setUsername] = useState("");
  const [birthday, setBirthday] = useState("");
  const [rawPhone, setRawPhone] = useState("");
  const [selectedCountryCode, setSelectedCountryCode] = useState("GH");

  // Error and Loading states
  const [usernameError, setUsernameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 3000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("birthday_authenticated_user");
      window.location.reload();
    } catch (err: any) {
      triggerToast("Logout Failed ❌", err.message || "Could not sign out session.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError("");
    setPhoneError("");

    const cleanUsername = username.trim().toLowerCase().replace(/^@/, "");
    if (cleanUsername.length < 3) {
      setUsernameError("Username handle must be at least 3 characters.");
      triggerToast("Invalid Handle ❌", "Username must be at least 3 characters.");
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_.]+$/;
    if (!usernameRegex.test(cleanUsername)) {
      setUsernameError("Usernames can only contain letters, numbers, underscores, and periods.");
      triggerToast("Invalid Handle ❌", "Usernames can only contain letters, numbers, underscores, and periods.");
      return;
    }

    if (!birthday) {
      triggerToast("Birthday Required 🎂", "Please select your date of birth.");
      return;
    }

    if (!rawPhone.trim()) {
      setPhoneError("Phone number is required.");
      triggerToast("Phone Required 📞", "Please enter your mobile phone number.");
      return;
    }

    const cleanPhoneDigits = rawPhone.replace(/\D/g, "").replace(/^0+/, "");
    if (cleanPhoneDigits.length < 7) {
      setPhoneError("Phone number must contain at least 7 digits.");
      triggerToast("Invalid Phone 📞", "Phone number must be at least 7 digits.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Verify username handle uniqueness
      const usernameDocRef = doc(db, "usernames", cleanUsername);
      const usernameDocSnap = await withTimeout(getDoc(usernameDocRef), 3000);
      if (usernameDocSnap.exists()) {
        const uData = usernameDocSnap.data();
        if (uData && uData.uid !== userSession.uid) {
          setUsernameError("This username handle is already claimed.");
          triggerToast("Username Taken ❌", "Choose another handle.");
          setIsSubmitting(false);
          return;
        }
      }

      // Check users collection snapshot for username safeguard
      const usernameQuery = query(collection(db, "users"), where("username", "==", cleanUsername));
      const usernameSnap = await withTimeout(getDocs(usernameQuery), 3500);
      if (!usernameSnap.empty) {
        const uDoc = usernameSnap.docs[0];
        if (uDoc.id !== userSession.uid) {
          setUsernameError("This username handle is already claimed.");
          triggerToast("Username Taken ❌", "Choose another handle.");
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Validate phone number uniqueness
      const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];
      const formattedPhone = `${selectedCountry.dialCode}${cleanPhoneDigits}`;

      const phoneQuery1 = query(collection(db, "users"), where("phone", "==", formattedPhone));
      const phoneQuery2 = query(collection(db, "users"), where("phoneNumber", "==", formattedPhone));
      const [snap1, snap2] = await withTimeout(Promise.all([
        getDocs(phoneQuery1),
        getDocs(phoneQuery2)
      ]), 3000);

      if (!snap1.empty || !snap2.empty) {
        // Enforce that the matched document doesn't belong to the current user
        const alreadyLinkedToAnother = [...snap1.docs, ...snap2.docs].some(d => d.id !== userSession.uid);
        if (alreadyLinkedToAnother) {
          setPhoneError("This phone number is already registered.");
          triggerToast("Phone Registered 📞", "This phone number is already registered.");
          setIsSubmitting(false);
          return;
        }
      }

      // 3. Assemble and save profile
      const finalProfile = {
        ...userSession,
        name: name.trim() || userSession.name || "HBD Companion",
        username: cleanUsername,
        birthday,
        phone: formattedPhone,
        whatsapp: formattedPhone,
        phoneNumber: formattedPhone,
        countryCode: selectedCountry.code,
        currency: selectedCountry.currency,
        avatar: userSession.avatar || "bg-indigo-500",
        interests: userSession.interests || [],
        walletBalance: 0,
        isPremium: false,
        accountType: "Free",
        createdAt: new Date().toISOString()
      };

      // Write user profile to Firestore users sub-collection
      await setDoc(doc(db, "users", userSession.uid), finalProfile, { merge: true });

      // Save username claim
      await setDoc(doc(db, "usernames", cleanUsername), {
        uid: userSession.uid,
        email: userSession.email.toLowerCase().trim(),
        username: cleanUsername,
        createdAt: new Date().toISOString()
      }, { merge: true });

      triggerToast("Profile Activated! 🥳", "Welcome to HBD Loop!");
      onComplete(finalProfile);
    } catch (err: any) {
      console.error("Onboarding activation error:", err);
      triggerToast("Onboarding Error ❌", err.message || "Failed to update your database profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCountry = COUNTRIES.find(c => c.code === selectedCountryCode) || COUNTRIES[0];

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 relative overflow-hidden" id="mandatory-onboarding">
      {/* Soft warm gradients */}
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_top_left,rgba(255,77,0,0.06),transparent_55%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.06),transparent_55%)] pointer-events-none" />

      <div className="w-full max-w-md mx-auto z-10 space-y-6">
        <div className="text-center space-y-3 flex flex-col items-center">
          {/* Loop Branding Logo SVG */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-14 h-14 block" fill="none">
            <rect x="12" y="15" width="14" height="70" rx="7" fill="url(#hbdOnbGradient)" />
            <rect x="74" y="15" width="14" height="70" rx="7" fill="url(#hbdOnbGradient)" />
            <path d="M 19,50 C 30,15 40,85 50,50 C 60,15 70,85 81,50 C 70,15 60,85 50,50 C 40,15 30,85 19,50 Z" fill="none" stroke="url(#hbdOnbGradient)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="hbdOnbGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF4D00" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Complete Your Profile</h1>
            <p className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Mandatory Safety &amp; Milestone Validation</p>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white border border-[#E5E1D8] rounded-[2.2rem] p-6 shadow-xl space-y-6 text-left"
        >
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-850">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold leading-relaxed">One Last Thing!</p>
              <p className="text-[11px] text-amber-700/90 font-semibold leading-normal">
                HBD Loop requires a secure handle, phone validation, and your verified birth date before you can access your peer-to-peer workspace dashboard.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Patel"
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] text-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs outline-none focus:border-indigo-600 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            {/* Choose Unique Username Handle */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Create Handle</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600 font-extrabold text-xs select-none">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                    setUsernameError("");
                  }}
                  placeholder="username_handle"
                  className={`w-full bg-[#FAF9F6] border ${usernameError ? 'border-rose-500' : 'border-[#E5E1D8]'} text-slate-800 rounded-xl pl-8 pr-4 py-3.5 text-xs outline-none focus:border-indigo-600 focus:bg-white transition-all font-mono font-bold`}
                />
              </div>
              {usernameError ? (
                <p className="text-[10px] text-rose-600 mt-1.5 font-bold flex items-center gap-1">⚠️ {usernameError}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1 px-1 font-semibold leading-normal">Unique id. At least 3 characters. No spaces.</p>
              )}
            </div>

            {/* Birthday */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Birthday Anniversary</label>
              <div className="relative">
                <Cake className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 font-semibold" />
                <input
                  type="date"
                  required
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                  className="w-full bg-[#FAF9F6] border border-[#E5E1D8] text-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs outline-none focus:border-indigo-600 focus:bg-white cursor-pointer transition-all font-semibold"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1 px-1 font-semibold leading-normal">Your birth date matches you with peer celebration tiers.</p>
            </div>

            {/* Phone (with country dial code dropdown) */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 mb-1.5">Mobile Registry (Required)</label>
              <div className="flex gap-2">
                <select
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value)}
                  className="bg-[#FAF9F6] border border-[#E5E1D8] text-slate-800 rounded-xl px-2.5 py-3.5 text-xs outline-none focus:border-indigo-600 cursor-pointer text-center font-bold"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.dialCode}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={rawPhone}
                    onChange={(e) => {
                      setRawPhone(e.target.value.replace(/\D/g, ""));
                      setPhoneError("");
                    }}
                    placeholder="e.g. 241234567"
                    className={`w-full bg-[#FAF9F6] border ${phoneError ? 'border-rose-500' : 'border-[#E5E1D8]'} text-slate-800 rounded-xl pl-10 pr-4 py-3.5 text-xs outline-none focus:border-indigo-600 focus:bg-white transition-all font-mono font-bold`}
                  />
                </div>
              </div>
              {phoneError ? (
                <p className="text-[10px] text-rose-600 mt-1.5 font-bold flex items-center gap-1">⚠️ {phoneError}</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1 px-1 font-semibold leading-normal">
                  Minimum 7 digits. Dial code <span className="font-bold text-indigo-700 font-mono">{selectedCountry.dialCode}</span> is prefixing.
                </p>
              )}
            </div>

            {/* Submission triggers */}
            <div className="pt-2 space-y-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-350 disabled:cursor-not-allowed text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md hover:shadow-lg active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>Synchronizing database Workspace...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm &amp; Reach Home Page</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full h-11 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-rose-600 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Current Session</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
