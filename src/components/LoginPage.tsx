import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Mail, Lock, Eye, EyeOff, Cake } from "lucide-react";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// ─────────────────────────────────────────────
// LoginPage — drop this into your src/components/ folder
// Props:
// onLogin(session) → called when user logs in successfully
// onGoToSignUp() → switch back to the registration form
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
}

interface LoginPageProps {
  onLogin: (session: LoginSession) => void;
  onGoToSignUp: () => void;
  triggerToast: (title: string, message: string) => void;
}

export function LoginPage({ onLogin, onGoToSignUp, triggerToast }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      triggerToast("Missing Fields ⚠️", "Please enter your email and password.");
      return;
    }
    setIsLoading(true);

    try {
      // 1. Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
      const firebaseUser = userCredential.user;

      // 2. Fetch the corresponding profile schema document from Firestore with safety
      let profile: LoginSession | null = null;
      try {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          profile = userDocSnap.data() as LoginSession;
        }
      } catch (dbError) {
        console.warn("Could not retrieve Firestore profile document (offline/permission error):", dbError);
        // Fallback to checking local storage
        const saved = localStorage.getItem("birthday_authenticated_user");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed.uid === firebaseUser.uid) {
              profile = parsed;
            }
          } catch (e) {
            // silent ignore
          }
        }
      }

      if (profile) {
        // Keep localized state in local storage as fallback/cache if helpful
        localStorage.setItem("birthday_authenticated_user", JSON.stringify(profile));
        
        onLogin(profile);
        triggerToast("Welcome back! 🎉", `Good to see you again, ${profile.name}!`);
      } else {
        // If Auth exists but document shape is missing or unreachable, formulate it dynamically from user session
        const fallbackProfile: LoginSession = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || email.split("@")[0],
          username: email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_"),
          email: firebaseUser.email || email,
          birthday: "1997-06-25",
          avatar: "bg-indigo-500",
          interests: ["Photography", "Specialty Coffee"]
        };
        localStorage.setItem("birthday_authenticated_user", JSON.stringify(fallbackProfile));
        onLogin(fallbackProfile);
        triggerToast("First Boot 🎉", `Creating profile workspace container, ${fallbackProfile.name}!`);
      }
    } catch (error: any) {
      console.error("Firebase Login Error: ", error);
      let errorMsg = "Something went wrong. Please check your credentials.";
      if (error.code === "auth/invalid-credential" || error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        errorMsg = "Incorrect email or password. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "The email address is invalid.";
      }
      triggerToast("Sign In Failed ❌", errorMsg);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="w-full min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow blobs */}
      <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-sm w-full z-10 space-y-6">
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-2"
        >
          <span className="inline-flex w-14 h-14 bg-indigo-600 text-white rounded-2xl items-center justify-center text-2xl font-black">
            B
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">
            BloomBirth
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Never miss a friend's birthday. Welcome back!
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4"
        >
          <div>
            <h3 className="font-extrabold text-sm text-slate-100">Sign In</h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              Log in to your BloomBirth account
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@example.com"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-xs outline-none focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-xs font-black py-3 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Signing In...
                </>
              ) : (
                "Sign In →"
              )}
            </button>
          </form>

          {/* Go to Sign Up */}
          <div className="text-center pt-2">
            <p className="text-[11px] text-slate-500">
              Don't have an account yet?{" "}
              <button
                type="button"
                onClick={onGoToSignUp}
                className="text-indigo-400 font-bold hover:text-indigo-300 transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </p>
          </div>
        </motion.div>

        {/* Feature hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 text-[10px] text-slate-600"
        >
          <Cake className="w-3 h-3" />
          <span>Track birthdays · AI gift ideas · Share wishlists</span>
        </motion.div>
      </div>
    </div>
  );
}
