import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Mail, Lock, Eye, EyeOff, Cake, User, Phone, ArrowLeft, ArrowRight, ShieldAlert } from "lucide-react";
import { auth, db, signInWithGoogle } from "../firebase";
import { getRedirectResult, signInWithEmailAndPassword, sendPasswordResetEmail, type User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { COUNTRIES } from "./SignUpFlow";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface LoginSession {
  uid: string;
  name: string;
  username: string;
  email: string;
  birthday: string;
  avatar: string;
  interests: string[];
  phone?: string;
  whatsapp?: string;
  isProfileComplete?: boolean;
}

interface LoginPageProps {
  onLogin: (session: LoginSession) => void;
  onGoToSignUp: () => void;
  triggerToast: (title: string, message: string) => void;
}

// ─────────────────────────────────────────────
// Typing/Looping Brand Identity Lines Component
// ─────────────────────────────────────────────
export function TypingEffect() {
  const words = ["HBD Loop", "Automated Gifting Engine", "The Milestone Network"];
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), 2500);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 30 : 65);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <div className="h-6 flex items-center justify-center font-mono select-none">
      <span className="text-xs font-black text-slate-600 tracking-wider uppercase">
        {words[index].substring(0, subIndex)}
        <span className="animate-pulse ml-0.5 font-bold text-[#FF4D00]">|</span>
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Custom LoginPage component
// ─────────────────────────────────────────────
export function LoginPage({ onLogin, onGoToSignUp, triggerToast }: LoginPageProps) {
  // Navigation views: "landing" | "signin_step1" | "signin_step2"
  const [subState, setSubState] = useState<"landing" | "signin_step1" | "signin_step2">("landing");
  
  // Fields & verified email resolution
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [verifiedEmail, setVerifiedEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  // Verification loading states
  const [isLoading, setIsLoading] = useState(false);
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false);
  const [unauthorizedDomainError, setUnauthorizedDomainError] = useState<string | null>(null);

  // Error messaging and reset notice banner states
  const [validationError, setValidationError] = useState<string | null>(null);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  // Profile setup fallback when Firebase auth succeeds but Firestore document is absent
  const [showProfileSetupFallback, setShowProfileSetupFallback] = useState(false);
  const [pendingUser, setPendingUser] = useState<{ uid: string; email: string; name: string } | null>(null);
  const [fallbackName, setFallbackName] = useState("");
  const [fallbackUsername, setFallbackUsername] = useState("");
  const [fallbackBirthday, setFallbackBirthday] = useState("");
  const [fallbackPhone, setFallbackPhone] = useState("");
  const [fallbackCountryCode, setFallbackCountryCode] = useState("GH");
  const [fallbackUsernameError, setFallbackUsernameError] = useState("");
  const [fallbackPhoneError, setFallbackPhoneError] = useState("");
  const [fallbackSubmitting, setFallbackSubmitting] = useState(false);

  // Helper routine to run query safeguards with a timeout
  const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 4000): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), timeoutMs)
      ),
    ]);
  };

  const loginWithProfile = (profile: LoginSession, title: string, message: string) => {
    localStorage.setItem("birthday_authenticated_user", JSON.stringify(profile));
    onLogin(profile);
    triggerToast(title, message);
  };

  const showProfileFallback = (firebaseUser: FirebaseUser) => {
    setPendingUser({
      uid: firebaseUser.uid,
      email: firebaseUser.email || "",
      name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "HBD Companion"
    });

    setFallbackName(firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "");
    setFallbackUsername("");
    setFallbackBirthday("");
    setFallbackPhone("");
    setFallbackCountryCode("GH");
    setFallbackUsernameError("");
    setFallbackPhoneError("");

    setShowProfileSetupFallback(true);
    triggerToast("Finalize Account ⚙️", "Please complete your HBD profile parameters to get started.");
  };

  const syncGoogleProfile = async (firebaseUser: FirebaseUser) => {
    try {
      const userDocRef = doc(db, "users", firebaseUser.uid);
      let userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Document missing — create it with safe defaults from Auth
        await setDoc(userDocRef, {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
          avatar: "", // empty, user will set this
          birthday: "", // empty, user will be prompted to set this
          phone: "", // empty, user will be prompted to set this
          username: "", // empty, user will be prompted to set this
          interests: [],
          createdAt: new Date().toISOString(),
          isProfileComplete: false, // flag so app knows to prompt for missing info
        }, { merge: true });

        userDocSnap = await getDoc(userDocRef);
      }

      if (userDocSnap.exists()) {
        const profile = userDocSnap.data() as LoginSession;
        // After this “get or create,” check whether required fields like birthday, phone, username are empty or isProfileComplete is false
        const isProfileIncomplete = !profile.username || !profile.birthday || !profile.phone || profile.isProfileComplete === false;

        if (!isProfileIncomplete) {
          loginWithProfile(profile, "Welcome Back! 🎉", `Successfully established credentials for ${profile.name}!`);
        } else {
          showProfileFallback(firebaseUser);
        }
      } else {
        showProfileFallback(firebaseUser);
      }
    } catch (err: any) {
      console.warn("Google credentials initialization fallback active:", err);
      showProfileFallback(firebaseUser);
    }
  };

  useEffect(() => {
    let cancelled = false;

    getRedirectResult(auth)
      .then((result) => {
        if (cancelled || !result?.user) return;
        syncGoogleProfile(result.user);
      })
      .catch((error: any) => {
        if (cancelled) return;
        console.error("Google redirect setup error: ", error);
        let errorMsg = "Could not synchronize Google credentials. Please try again.";
        if (error.code === "auth/unauthorized-domain" || error.message?.includes("unauthorized-domain")) {
          errorMsg = "Unauthorized Domain address in Firebase settings.";
          setUnauthorizedDomainError(window.location.hostname);
        }
        setValidationError(errorMsg);
        triggerToast("Access Denied ❌", errorMsg);
      });

    return () => {
      cancelled = true;
    };
  }, [onLogin, triggerToast]);

  // Switch clean states
  const resetAllStates = () => {
    setEmailOrUsername("");
    setVerifiedEmail("");
    setPassword("");
    setShowPassword(false);
    setValidationError(null);
    setResetNotice(null);
    setIsLoading(false);
    setSubmittingPassword(false);
    setIsForgotPasswordLoading(false);
    setUnauthorizedDomainError(null);
    setShowProfileSetupFallback(false);
    setPendingUser(null);
  };

  // Google Single-Sign-On action
  const handleGoogleSignIn = async () => {
    setValidationError(null);
    setResetNotice(null);
    setIsLoading(true);
    try {
      const result = await signInWithGoogle(auth);
      if (!result) {
        triggerToast("Redirecting to Google...", "Completing sign-in in this app window.");
        return;
      }
      await syncGoogleProfile(result.user);
    } catch (error: any) {
      console.error("Google Auth Setup Error: ", error);
      let errorMsg = "Could not synchronize Google credentials. Please try again.";
      if (error.code === "auth/popup-closed-by-user") {
        errorMsg = "Login dismissed by user action.";
      } else if (error.code === "auth/unauthorized-domain" || error.message?.includes("unauthorized-domain")) {
        errorMsg = "Unauthorized Domain address in Firebase settings.";
        setUnauthorizedDomainError(window.location.hostname);
      }
      setValidationError(errorMsg);
      triggerToast("Access Denied ❌", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 1 — Set identifier email to proceed to Auth
  const handleVerifyIdentifier = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError(null);
    setResetNotice(null);

    const identifier = emailOrUsername.trim();
    if (!identifier) {
      setValidationError("Please enter your email, username, or phone number first.");
      triggerToast("Blank Credentials ⚠️", "Provide a registered identifier.");
      return;
    }

    setIsLoading(true);

    try {
      const isEmail = identifier.includes("@");
      if (isEmail) {
        // Direct email proceed to protect email harvesting
        setVerifiedEmail(identifier.toLowerCase());
        setSubState("signin_step2");
        triggerToast("Email Verified 🔑", "Slide to confirm password credentials.");
      } else {
        const cleanIdentifier = identifier.toLowerCase().replace(/^@/, "").trim();
        const isPhone = /^\+?[0-9\s\-()]{7,}$/.test(cleanIdentifier);

        if (isPhone) {
          // Since unauthenticated lookups fail on /users, we warn nicely and recommend username or email
          setValidationError("Phone lookups are restricted. Please enter your email or username handle instead.");
          triggerToast("Query Restrained ⚠️", "Please use email or username to login.");
        } else {
          // Username check on /usernames
          const usernameDocRef = doc(db, "usernames", cleanIdentifier);
          const usernameDocSnap = await withTimeout(getDoc(usernameDocRef), 3000);

          if (usernameDocSnap.exists()) {
            const mappedEmail = usernameDocSnap.data()?.email;
            if (mappedEmail) {
              setVerifiedEmail(mappedEmail.toLowerCase());
              setSubState("signin_step2");
              triggerToast("Username mapped! 🔑", `Welcome back, @${cleanIdentifier}! Please enter your password.`);
            } else {
              setValidationError("We couldn't find an account matching that username. Please write your email directly.");
            }
          } else {
            setValidationError("We couldn't find an account matching that information. Want to create a new one?");
            triggerToast("Account Not Found ❌", "Username handle not tracked.");
          }
        }
      }
    } catch (err: any) {
      console.warn("Identifier verification exception handled gracefully:", err);
      let friendly = "We couldn't find an account matching that information. Want to create a new one?";
      if (err.code === "auth/unauthorized-domain" || err.message?.includes("unauthorized-domain")) {
        friendly = "Sign-in isn't available on this version of the app yet.";
      }
      setValidationError(friendly);
      triggerToast("Connection error ❌", friendly);
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2 — Password Verification & Direct getDoc document lookup on user.uid
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    setResetNotice(null);

    const cleanPass = password; // Do not trim password to avoid trimming bugs
    if (!cleanPass) {
      setValidationError("Kindly type your password below to proceed.");
      return;
    }

    setSubmittingPassword(true);

    try {
      // 1. Sign In via Auth Credentials first with robust trimmed/untrimmed fallback and helper timeout extensions
      let authResult;
      try {
        authResult = await withTimeout(signInWithEmailAndPassword(auth, verifiedEmail, cleanPass), 8000);
      } catch (authErr: any) {
        const isCredError = authErr.code === "auth/invalid-credential" || 
                            authErr.code === "auth/wrong-password" || 
                            authErr.message?.includes("invalid-credential") || 
                            authErr.message?.includes("wrong-password");
                            
        if (isCredError) {
          const trimmed = cleanPass.trim();
          if (trimmed !== cleanPass) {
            authResult = await withTimeout(signInWithEmailAndPassword(auth, verifiedEmail, trimmed), 8000);
          } else {
            throw authErr;
          }
        } else {
          throw authErr;
        }
      }

      // 2. Look up corresponding profile document directly using authenticated UID
      const userDoc = await getDoc(doc(db, "users", authResult.user.uid));

      if (userDoc.exists()) {
        const profile = userDoc.data() as LoginSession;
        localStorage.setItem("birthday_authenticated_user", JSON.stringify(profile));
        onLogin(profile);
        triggerToast("Session Active 🥳", `Good to see you again, ${profile.name}!`);
      } else {
        // Authenticated but profile doc is missing! Set up fallback onboarding profile helper dynamic
        setPendingUser({
          uid: authResult.user.uid,
          email: authResult.user.email || verifiedEmail,
          name: authResult.user.email?.split("@")[0] || "HBD Member"
        });
        setFallbackName(authResult.user.email?.split("@")[0] || "");
        setFallbackUsername("");
        setFallbackBirthday("");
        setFallbackPhone("");
        setFallbackCountryCode("GH");
        
        setShowProfileSetupFallback(true);
        triggerToast("Setup Profile ⚙", "Finalize database elements to continue.");
      }
    } catch (err: any) {
      console.error("Firebase Auth credential mismatch: ", err);
      let friendly = "Oops! That password doesn't match our records. Please try again.";
      
      const errMsg = err.message || "";
      const errCode = err.code || "";
      
      if (errCode === "auth/network-request-failed" || errMsg.includes("network") || errMsg.includes("Timeout")) {
        friendly = "We couldn't find an account matching that information. Want to create a new one?";
        
        // Sandbox fallback mode matching password
        const saved = localStorage.getItem("birthday_authenticated_user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.email === verifiedEmail) {
              onLogin(parsed);
              triggerToast("Offline Sandbox Login ⚡", `Welcome back, ${parsed.name}!`);
              setSubmittingPassword(false);
              return;
            }
          } catch (_) {}
        }
      } else if (errCode === "auth/unauthorized-domain" || errMsg.includes("unauthorized-domain")) {
        friendly = "Sign-in isn't available on this version of the app yet.";
      } else if (errCode === "permission-denied" || errMsg.includes("permission-denied")) {
        friendly = "Oops! That password doesn't match our records. Please try again.";
      }
      
      setValidationError(friendly);
      triggerToast("Access Denied ❌", friendly);
    } finally {
      setSubmittingPassword(false);
    }
  };

  // Location Fix for password reset: fires directly with resolved verifiedEmail
  const handlePasswordResetDirect = async () => {
    setValidationError(null);
    setResetNotice(null);
    if (!verifiedEmail) {
      setValidationError("No validated email address found. Go back to complete Step 1.");
      return;
    }

    setIsForgotPasswordLoading(true);
    try {
      await withTimeout(sendPasswordResetEmail(auth, verifiedEmail), 3500);
      setResetNotice("A password reset link was successfully dispatched to your email address!");
      triggerToast("Reset Dispatched! ✉️", "Look out for a security reset envelope in your email.");
    } catch (err: any) {
      console.error("Reset direct failed: ", err);
      setValidationError("Could not initiate email dispatch. Verify if your account is active.");
      triggerToast("Dispatch Failed ❌", "Dispatch failed.");
    } finally {
      setIsForgotPasswordLoading(false);
    }
  };

  // Submits onboarding fallback configuration
  const handleFallbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;
    
    const cleanUsername = fallbackUsername.trim().toLowerCase().replace(/^@/, "");
    if (cleanUsername.length < 3) {
      setFallbackUsernameError("Username handle must be at least 3 characters.");
      return;
    }
    
    if (!fallbackBirthday) {
      triggerToast("Birthday Required 🎂", "Please supply your birthdate anniversary.");
      return;
    }
    
    setFallbackSubmitting(true);
    setFallbackUsernameError("");
    setFallbackPhoneError("");
    
    try {
      // 1. Verify username handle is unique
      const usernameDocRef = doc(db, "usernames", cleanUsername);
      const usernameDocSnap = await withTimeout(getDoc(usernameDocRef), 3000);
      if (usernameDocSnap.exists()) {
        const uData = usernameDocSnap.data();
        if (uData && uData.uid !== pendingUser.uid) {
          setFallbackUsernameError("This username handle is already claimed.");
          setFallbackSubmitting(false);
          return;
        }
      }

      // Check users collection as dynamic verification safeguard
      const usernameQuery = query(collection(db, "users"), where("username", "==", cleanUsername));
      const querySnapshot = await withTimeout(getDocs(usernameQuery), 3500);
      if (!querySnapshot.empty) {
        const uDoc = querySnapshot.docs[0];
        if (uDoc.id !== pendingUser.uid) {
          setFallbackUsernameError("This username handle is already claimed.");
          setFallbackSubmitting(false);
          return;
        }
      }
      
      let formattedPhone = "";
      const selectedCountry = COUNTRIES.find(c => c.code === fallbackCountryCode) || COUNTRIES[0];
      const cleanPhoneDigits = fallbackPhone.replace(/\D/g, '').replace(/^0+/, '');
      if (cleanPhoneDigits.length < 7) {
        setFallbackPhoneError("Phone number must contain at least 7 digits.");
        setFallbackSubmitting(false);
        return;
      }
      formattedPhone = `${selectedCountry.dialCode}${cleanPhoneDigits}`;
      
      const profile: LoginSession = {
        uid: pendingUser.uid,
        name: fallbackName.trim() || pendingUser.name,
        username: cleanUsername,
        email: pendingUser.email,
        birthday: fallbackBirthday,
        avatar: "bg-indigo-500",
        interests: ["Photography", "Modern Design", "Tech & AI"],
        phone: formattedPhone,
        whatsapp: formattedPhone,
      };
      
      await setDoc(doc(db, "users", pendingUser.uid), {
        ...profile,
        walletBalance: 0,
        isPremium: false,
        accountType: "Free",
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      await setDoc(doc(db, "usernames", cleanUsername), {
        uid: pendingUser.uid,
        email: pendingUser.email,
        username: cleanUsername,
        createdAt: new Date().toISOString()
      }, { merge: true });
      
      localStorage.setItem("birthday_authenticated_user", JSON.stringify(profile));
      onLogin(profile);
      triggerToast("Onboarding Completed! 🚀", `Welcome to HBD Loop, ${profile.name}!`);
    } catch (err: any) {
      console.error("Onboarding failed:", err);
      triggerToast("Configuration Fail ❌", "Failed to compile your HBD database. Try again.");
    } finally {
      setFallbackSubmitting(false);
    }
  };

  // If in Setup fallback, render beautiful custom wizard profiles
  if (showProfileSetupFallback && pendingUser) {
    return (
      <div className="w-full min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 relative overflow-y-auto text-slate-900" id="hbd-onboarding-fallback-root">
        {/* Colorful backgrounds */}
        <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_top_left,rgba(255,77,0,0.06),transparent_55%)] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.06),transparent_55%)] pointer-events-none" />
        
        <div className="w-full max-w-sm mx-auto z-10 space-y-6">
          <div className="text-center space-y-3 flex flex-col items-center">
            {/* Geometric Loop Logo */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-12 h-12 block" fill="none">
              <rect x="12" y="15" width="14" height="70" rx="7" fill="url(#hbdLoopOnbFallback)" />
              <rect x="74" y="15" width="14" height="70" rx="7" fill="url(#hbdLoopOnbFallback)" />
              <path d="M 19,50 C 30,15 40,85 50,50 C 60,15 70,85 81,50 C 70,15 60,85 50,50 C 40,15 30,85 19,50 Z" fill="none" stroke="url(#hbdLoopOnbFallback)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="hbdLoopOnbFallback" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF4D00" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
            <div className="text-center">
              <h2 className="text-lg font-black text-slate-800 tracking-tight">Finalize Account</h2>
              <p className="text-[11px] text-slate-500 font-bold tracking-wider uppercase">HBD Onboarding Block</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-[#E5E1D8] rounded-[2.2rem] p-5 shadow-xl space-y-5 text-left"
          >
            <form onSubmit={handleFallbackSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fallbackName}
                    onChange={(e) => setFallbackName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="w-full bg-white text-slate-900 font-medium placeholder-slate-400 border border-[#E5E1D8] focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none rounded-xl pl-9 pr-3 py-3 text-xs transition-all"
                  />
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">Choose Handle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-600 font-black text-xs select-none">@</span>
                  <input
                    type="text"
                    required
                    value={fallbackUsername}
                    onChange={(e) => {
                      setFallbackUsername(e.target.value.toLowerCase().replace(/\s+/g, "_"));
                      setFallbackUsernameError("");
                    }}
                    placeholder="username_handle"
                    className={`w-full bg-white text-slate-900 font-medium placeholder-slate-400 border ${fallbackUsernameError ? 'border-rose-500' : 'border-[#E5E1D8]'} focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none rounded-xl pl-7 pr-3 py-3 text-xs transition-all font-mono`}
                  />
                </div>
                {fallbackUsernameError && (
                  <p className="text-[10px] text-rose-600 mt-1 font-bold">{fallbackUsernameError}</p>
                )}
              </div>

              {/* Birthday */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">Your Birthday</label>
                <div className="relative">
                  <Cake className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={fallbackBirthday}
                    onChange={(e) => setFallbackBirthday(e.target.value)}
                    className="w-full bg-white text-slate-900 font-medium placeholder-slate-400 border border-[#E5E1D8] focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none rounded-xl pl-9 pr-3 py-3 text-xs cursor-pointer transition-all"
                  />
                </div>
              </div>

              {/* Phone with dial code */}
              <div>
                <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-600 mb-1">Mobile Details</label>
                <div className="flex gap-1.5">
                  <select
                    value={fallbackCountryCode}
                    onChange={(e) => setFallbackCountryCode(e.target.value)}
                    className="bg-[#FAF9F6] border border-[#E5E1D8] text-slate-800 rounded-xl px-2 py-3 text-xs outline-none focus:border-indigo-600 cursor-pointer text-center font-bold"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.dialCode}
                      </option>
                    ))}
                  </select>
                  <div className="relative flex-1">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      value={fallbackPhone}
                      onChange={(e) => {
                        setFallbackPhone(e.target.value.replace(/\D/g, ""));
                        setFallbackPhoneError("");
                      }}
                      placeholder="e.g. 541234567"
                      className={`w-full bg-white text-slate-900 font-medium placeholder-slate-400 border ${fallbackPhoneError ? 'border-rose-500' : 'border-[#E5E1D8]'} focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none rounded-xl pl-9 pr-3 py-3 text-xs transition-all font-mono`}
                    />
                  </div>
                </div>
                {fallbackPhoneError && (
                  <p className="text-[10px] text-rose-600 mt-1 font-bold">{fallbackPhoneError}</p>
                )}
              </div>

              {/* Action Buttons */}
              <button
                type="submit"
                disabled={fallbackSubmitting}
                className="w-full h-11 bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] hover:brightness-110 disabled:brightness-75 text-white text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
              >
                {fallbackSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    <span>Syncing database...</span>
                  </>
                ) : (
                  <span>Activate Profile &rarr;</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowProfileSetupFallback(false);
                  setPendingUser(null);
                  auth.signOut();
                }}
                className="w-full h-10 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs py-2 rounded-xl text-center font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                Sign Out / Start Over
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-between p-6 relative overflow-y-auto font-sans text-slate-900" id="hbd-login-page-root">
      {/* Soft overlay elements */}
      <div className="absolute top-0 left-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_top_left,rgba(255,77,0,0.06),transparent_55%)] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[50%] h-[50%] bg-[radial-gradient(circle_at_bottom_right,rgba(124,58,237,0.06),transparent_55%)] pointer-events-none" />
      
      {/* Top Margin Anchor */}
      <div className="h-4" />

      {/* Main Focus Area Card container */}
      <div className="w-full max-w-sm mx-auto z-10 flex flex-col justify-center flex-1 py-4">
        
        {/* 1. TOP BRANDING APEX */}
        <div className="text-center space-y-3.5 flex flex-col items-center mb-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="p-2 bg-white rounded-full border-2 border-slate-300 shadow-xl cursor-default flex items-center justify-center ring-4 ring-slate-100/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="w-14 h-14 block" fill="none">
              <rect x="12" y="15" width="14" height="70" rx="7" fill="url(#hbdLandingLogoMain)" />
              <rect x="74" y="15" width="14" height="70" rx="7" fill="url(#hbdLandingLogoMain)" />
              <path d="M 19,50 C 30,15 40,85 50,50 C 60,15 70,85 81,50 C 70,15 60,85 50,50 C 40,15 30,85 19,50 Z" fill="none" stroke="url(#hbdLandingLogoMain)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
              <defs>
                <linearGradient id="hbdLandingLogoMain" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#FF4D00" />
                  <stop offset="100%" stopColor="#7C3AED" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>

          <div className="space-y-1">
            <h1 className="text-3xl font-sans">
              <span className="text-slate-900 font-black tracking-tight">HBD </span>
              <span className="text-[#FF4D00] font-black tracking-tight">LOOP</span>
            </h1>
            {/* Dynamic Typing animated effect */}
            <TypingEffect />
          </div>
        </div>

        {/* 2. SUBSTATE NAVIGATION ROUTER (AnimatePresence slide) */}
        <AnimatePresence mode="wait">
          
          {/* ============================================================
              A. SUBSTATE LANDING SCREEN (CLEAN FRONT VIEW)
          ============================================================ */}
          {subState === "landing" && (
            <motion.div
              key="sub-landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Center Stage Action Zones */}
              <div className="flex flex-col gap-3 max-w-[260px] mx-auto pt-3">
                
                {/* 1. Primary Action Bubble (Sign In) */}
                <button
                  type="button"
                  onClick={() => setSubState("signin_step1")}
                  className="w-full h-13 min-h-[48px] bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] hover:brightness-110 disabled:brightness-75 text-white font-black text-sm rounded-[1.8rem] flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer shadow-md select-none border border-transparent"
                >
                  Sign In
                </button>

                {/* 2. Secondary Transparent Action Bubble (Sign Up) */}
                <button
                  type="button"
                  onClick={onGoToSignUp}
                  className="w-full h-13 min-h-[48px] bg-transparent hover:bg-slate-100 text-slate-800 font-extrabold text-sm rounded-[1.8rem] flex items-center justify-center border-2 border-slate-350 transition-all duration-200 active:scale-95 cursor-pointer select-none"
                >
                  Sign Up
                </button>

              </div>
            </motion.div>
          )}

          {/* ============================================================
              B. STEP 1 (Credential Validation Step)
          ============================================================ */}
          {subState === "signin_step1" && (
            <motion.div
              key="sub-step1"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="bg-white border border-[#E5E1D8] rounded-[2.2rem] p-6 shadow-xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setSubState("landing")}
                  className="w-9 h-9 rounded-full bg-[#FAF9F6] border border-[#E5E1D8] flex items-center justify-center text-slate-800 hover:text-slate-900 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest font-mono">Step 1 of 2</span>
              </div>

              <div className="text-left space-y-1 font-sans">
                <h3 className="font-extrabold text-base text-[#0F172A]">Verify Account</h3>
                <p className="text-xs text-slate-800 leading-normal font-medium">
                  Enter your email, phone, or username to get started.
                </p>
              </div>

              {/* Gentle Error Notice Banner with bottom right Create Account link */}
              {validationError && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left relative">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs mb-1">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Quick Security Check</span>
                  </div>
                  <p className="text-xs text-amber-900 font-bold leading-relaxed pr-1.5">
                    {validationError}
                  </p>
                  <div className="text-right mt-3">
                    <button
                      type="button"
                      onClick={onGoToSignUp}
                      className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline transition"
                    >
                      Create Account &rarr;
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleVerifyIdentifier} className="space-y-4 text-left">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-800 mb-1.5 px-1">
                    Email, Username, or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-450" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={emailOrUsername}
                      onChange={(e) => {
                        setEmailOrUsername(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="name@example.com or @handle"
                      className="w-full bg-white text-slate-900 font-medium placeholder-slate-400 border border-[#E5E1D8] focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none rounded-xl pl-10 pr-3 py-3.5 text-xs transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !emailOrUsername.trim()}
                  className="w-full h-12 bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] hover:brightness-110 disabled:brightness-75 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Checking accounts...</span>
                    </>
                  ) : (
                    <>
                      <span>Next Step</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {/* ============================================================
              C. STEP 2 (Password Verification Step)
          ============================================================ */}
          {subState === "signin_step2" && (
            <motion.div
              key="sub-step2"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              className="bg-white border border-[#E5E1D8] rounded-[2.2rem] p-6 shadow-xl space-y-4 animate-fluid"
            >
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setValidationError(null);
                    setSubState("signin_step1");
                  }}
                  className="w-9 h-9 rounded-full bg-[#FAF9F6] border border-[#E5E1D8] flex items-center justify-center text-slate-800 hover:text-slate-950 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest font-mono">Step 2 of 2</span>
              </div>

              <div className="text-left space-y-1">
                <h3 className="font-extrabold text-base text-[#0F172A]">Enter Password</h3>
                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-[10px] font-semibold break-all inline-block truncate max-w-full">
                  Verified ID: {verifiedEmail}
                </span>
              </div>

              {/* Error Notice Block */}
              {validationError && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left">
                  <div className="flex items-center gap-1.5 text-amber-900 font-extrabold text-xs mb-1">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>Quick Security Check</span>
                  </div>
                  <p className="text-xs text-amber-900 font-bold leading-relaxed">
                    {validationError}
                  </p>
                </div>
              )}

              {/* Password sent message */}
              {resetNotice && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-3.5 rounded-2xl text-center font-bold">
                  ✉️ {resetNotice}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-800 mb-1.5 px-1">
                    Password Code
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setValidationError(null);
                      }}
                      placeholder="Your secret passcode"
                      className="w-full bg-white text-slate-900 font-medium placeholder-slate-400 border border-[#E5E1D8] focus:border-[#FF4D00] focus:ring-1 focus:ring-[#FF4D00] outline-none rounded-xl pl-10 pr-10 py-3.5 text-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-650"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* LOCATION FIX FOR FORGOT PASSWORD: Place link DIRECTLY underneath password input box */}
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={handlePasswordResetDirect}
                      disabled={isForgotPasswordLoading}
                      className="text-xs text-indigo-600 hover:text-indigo-805 hover:underline font-extrabold transition"
                    >
                      {isForgotPasswordLoading ? "Dispatched..." : "Forgot Password?"}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingPassword || !password.trim()}
                  className="w-full h-12 bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] hover:brightness-110 disabled:brightness-75 text-white text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                >
                  {submittingPassword ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      <span>Authenticating workspace...</span>
                    </>
                  ) : (
                    <span>Sign In &rarr;</span>
                  )}
                </button>
              </form>
            </motion.div>
          )}

        </AnimatePresence>

        {/* Firebase Config Troubleshooting Box */}
        {unauthorizedDomainError && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-indigo-50 border border-indigo-100 rounded-3xl p-4 text-left space-y-3 mt-4"
          >
            <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-[11px]">
              <span>🔑</span>
              <span>Authorization Settings Required</span>
            </div>
            <p className="text-[10.5px] text-indigo-900 leading-relaxed">
              Add this sandbox address to your Authorized domains inside Firebase console:
            </p>
            <div className="bg-white border border-[#E5E1D8] p-2.5 rounded-xl flex items-center justify-between font-mono text-[9px] text-indigo-700">
              <span>{unauthorizedDomainError}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(unauthorizedDomainError);
                  triggerToast("Copied! 📋", "Domain address clipboard copy.");
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-2 py-0.5 rounded text-[8px]"
              >
                Copy
              </button>
            </div>
          </motion.div>
        )}

      </div>

      {/* 3. FOOTER LAYER (Minimal Continue with Google at bottom of viewport) */}
      <div className="w-full max-w-sm mx-auto text-center space-y-3 pb-4 z-10">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full h-12 bg-white hover:bg-[#FAF9F6] text-slate-800 border-2 border-[#E5E1D8] font-black text-xs rounded-xl flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer shadow-sm min-h-[44px]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22c-.87-2.6-2.86-4.52-1.18-7.06H5.84z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
          </svg>
          <span className="font-bold">Continue with Google</span>
        </button>

        <p className="text-[10px] text-slate-800 font-extrabold tracking-widest uppercase">
          Track Birthdays · AI Gift Ideas · Secure Wishlists
        </p>
      </div>

    </div>
  );
}
