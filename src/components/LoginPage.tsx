import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, X, Mail, Lock, Eye, EyeOff, Cake } from "lucide-react";
import masterLogoUrl from "../assets/images/hbd_master_logo_1781644319362.jpg";
import lightIconUrl from "../assets/images/hbd_light_icon_1781644333470.jpg";
import darkIconUrl from "../assets/images/hbd_dark_icon_1781644346932.jpg";
import { auth, db } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, query, collection, where, getDocs } from "firebase/firestore";

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
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const identifier = emailOrUsername.trim();
    if (!identifier || !password.trim()) {
      triggerToast("Missing Fields ⚠️", "Please enter your email/username and password.");
      return;
    }
    setIsLoading(true);

    try {
      let resolvedEmail = identifier;
      
      // Detailed detection matching both normal addresses and custom handles
      const isEmail = identifier.includes("@");
      
      if (!isEmail) {
        const cleanUsername = identifier.toLowerCase().replace(/^@/, "").trim();
        // 1. Initial lookup via usernames flat collection
        const usernameDocRef = doc(db, "usernames", cleanUsername);
        const usernameDocSnap = await getDoc(usernameDocRef);
        
        if (usernameDocSnap.exists()) {
          const uDocData = usernameDocSnap.data();
          if (uDocData && uDocData.email) {
            resolvedEmail = uDocData.email;
          } else {
            throw { code: "auth/missing-email-username" };
          }
        } else {
          // 2. Fallback to querying the users collection
          const usernameQuery = query(collection(db, "users"), where("username", "==", cleanUsername));
          const querySnapshot = await getDocs(usernameQuery);
          
          if (querySnapshot.empty) {
            throw { code: "auth/user-not-found-username" };
          }
          
          const userData = querySnapshot.docs[0].data();
          if (!userData.email) {
            throw { code: "auth/missing-email-username" };
          }
          resolvedEmail = userData.email;
        }
      }

      // 1. Sign in with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, resolvedEmail, password.trim());
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
          name: firebaseUser.displayName || resolvedEmail.split("@")[0],
          username: resolvedEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, "_"),
          email: firebaseUser.email || resolvedEmail,
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
      if (error.code === "auth/user-not-found-username") {
        errorMsg = "Username not found. Please verify the handle typed, or sign up for a new account by clicking 'Create Account' below.";
      } else if (
        error.code === "auth/invalid-credential" || 
        error.code === "auth/user-not-found" || 
        error.code === "auth/wrong-password"
      ) {
        errorMsg = "Incorrect email/username or password. Please verify your details, or sign up for a new account by clicking 'Create Account' below.";
      } else if (error.code === "auth/missing-email-username") {
        errorMsg = "This username is registered but is missing a valid email reference.";
      } else if (error.code === "auth/invalid-email") {
        errorMsg = "The email address is invalid.";
      }
      setLoginError(errorMsg);
      triggerToast("Sign In Failed ❌", "Invalid Credentials.");
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
          className="text-center space-y-4 flex flex-col items-center"
        >
          <div className="flex justify-center items-center">
            <motion.div 
              whileHover={{ scale: 1.04, rotate: 0.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
              className="cursor-default"
            >
              <div style={{ display: "inline-flex", alignItems: "center", gap: "14px", backgroundColor: "transparent" }}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{ width: "44px", height: "44px", display: "block" }} fill="none">
                  <rect x="12" y="15" width="14" height="70" rx="7" fill="url(#hbdLoopGrad)" />
                  <rect x="74" y="15" width="14" height="70" rx="7" fill="url(#hbdLoopGrad)" />
                  <path d="M 19,50 C 30,15 40,85 50,50 C 60,15 70,85 81,50 C 70,15 60,85 50,50 C 40,15 30,85 19,50 Z" fill="none" stroke="url(#hbdLoopGrad)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                  <defs>
                    <linearGradient id="hbdLoopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FF4D00" />
                      <stop offset="100%" stopColor="#7C3AED" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, textAlign: "left" }}>
                  <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "28px", fontWeight: 900, letterSpacing: "3px", color: "#FAF8F4" }}>HBD<span style={{ color: "#FF4D00" }}>LOOP</span></span>
                  <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "9px", fontWeight: 700, letterSpacing: "2px", color: "#6B7280", textTransform: "uppercase", marginTop: "2px" }}>Automated Gifting Engine</span>
                </div>
              </div>
            </motion.div>
          </div>
          <p className="text-xs font-bold text-indigo-400 leading-relaxed uppercase tracking-wider">
            The Recurring Milestone &amp; Gifting Network.
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
              Log in to your HBD Loop account
            </p>
          </div>

          {loginError && (
            <motion.div 
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-3.5 space-y-2 border-dashed"
            >
              <div className="flex items-center gap-2 text-rose-400 font-extrabold text-xs">
                <span>⚠️ Invalid Credentials</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                {loginError}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onGoToSignUp}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-[9.5px] font-black px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email or Username */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Email or Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  placeholder="e.g. alex@example.com or @alex"
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
