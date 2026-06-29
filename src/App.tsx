import React, { useState, useEffect, useRef, useMemo } from "react";
import masterLogoUrl from "./assets/images/hbd_master_logo_1781644319362.jpg";
import { INITIAL_FRIENDS, ALL_ACHIEVEMENTS_LIST } from "./data";
import { Friend, WishlistItem, Achievement, GiftSuggestion, InAppNotification, SentGift, ReceivedGift, WishlistFeedItem } from "./types";
import { MOCK_EXTERNAL_PROFILES, MockProfile } from "./mockProfiles";
import { QrScanner } from "./components/QrScanner";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut, sendPasswordResetEmail } from "firebase/auth";
import { collection, doc, setDoc, deleteDoc, getDoc, onSnapshot, query, limit as firestoreLimit, where, getDocs, serverTimestamp } from "firebase/firestore";
import { 
  Gift, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash, 
  Check, 
  ExternalLink, 
  Share2, 
  Heart, 
  Smile, 
  Clock, 
  Smartphone, 
  X, 
  Wand2, 
  Edit3, 
  AlertCircle, 
  UserPlus, 
  CheckCircle2, 
  Info,
  GiftIcon,
  Cake,
  Bookmark,
  Award,
  Users,
  Home,
  Activity,
  Search,
  CheckCheck,
  User,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Settings,
  Bell,
  Phone,
  Mail,
  MessageSquare,
  CheckCircle,
  HelpCircle,
  Volume2,
  Camera,
  QrCode,
  Lock,
  EyeOff,
  Sun,
  Moon,
  Upload,
  BookOpen,
  Copy,
  ShieldCheck,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LoginPage } from "./components/LoginPage";
import { BirthdayDashboard } from "./components/BirthdayDashboard";
import { SignUpFlow } from "./components/SignUpFlow";
import { MandatoryOnboarding } from "./components/MandatoryOnboarding";
import { ChatPage } from "./components/ChatPage";
import { ConfettiBurst } from "./components/ConfettiBurst";
import { WishlistFeed } from "./components/WishlistFeed";

interface StoreGiftItem {
  id: string;
  name: string;
  type: string;
  emoji: string;
  usdPrice: number;
  category: string;
  description: string;
}

const GIFT_INVENTORY: StoreGiftItem[] = [
  {
    id: "rose_regular",
    name: "Premium Red Rose",
    type: "rose",
    emoji: "🌹",
    usdPrice: 5,
    category: "Classic Token",
    description: "A single hand-picked dark crimson velvet rose. Expresses timeless elegance, affection, and personal dedication."
  },
  {
    id: "bouquet_luxe",
    name: "Vibrant Celebration Bouquet",
    type: "bouquet",
    emoji: "💐",
    usdPrice: 25,
    category: "Deluxe Floral",
    description: "A luxurious wrapped arrangement of tulips, crimson baby-breath, and orchids. Perfect as a gorgeous, high-class surprise statement."
  },
  {
    id: "cake_deluxe",
    name: "Deluxe Birthday Cake",
    type: "cake",
    emoji: "🎂",
    usdPrice: 15,
    category: "Gourmet Confection",
    description: "A fresh multi-layered vanilla buttercream frosting cake with decorative candles, sparkles, and direct interactive wishes."
  },
  {
    id: "chocolate_artisan",
    name: "Artisan Chocolate Box",
    type: "chocolate",
    emoji: "🍫",
    usdPrice: 12,
    category: "Gourmet Sweet",
    description: "A handcrafted collection of imported Belgian dark and milk chocolate pralines wrapped in a sleek satin ribbon presentation."
  },
  {
    id: "champagne_celebration",
    name: "Premium Champagne",
    type: "beverage",
    emoji: "🍾",
    usdPrice: 35,
    category: "Luxury Drink",
    description: "A chilled bottle of premium vintage sparkling champagne. Uncork the perfect visual pop and raise a digital toast to major milestones!"
  },
  {
    id: "teddy_bear",
    name: "Cute Velvet Teddy",
    type: "teddy",
    emoji: "🧸",
    usdPrice: 18,
    category: "Cute Keepsake",
    description: "An ultra-soft cuddly companion buddy dressed in a custom celebration sash. Keeps workspace desks cozy & cheerful."
  },
  {
    id: "money_sack",
    name: "Golden Cash Present Sacks",
    type: "money",
    emoji: "💰",
    usdPrice: 100,
    category: "Prestige Cash",
    description: "Send direct digital funds value into your buddy's registered wallet. The companion is instantly notified of dynamic deposit approval."
  },
  {
    id: "card_digital",
    name: "Visual Dedication Card",
    type: "card",
    emoji: "✉️",
    usdPrice: 2,
    category: "Message Plus",
    description: "An interactive full-viewport card theme option complete with animations, sparkles background, and custom chimes."
  }
];

const BrandTypingLogo = () => {
  const fullText = "HBD LOOP";
  const [displayedText, setDisplayedText] = useState("");
  const [cursorVisible, setCursorVisible] = useState(true);
  const [typingComplete, setTypingComplete] = useState(false);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayedText((prev) => prev + fullText[index]);
        index++;
      } else {
        clearInterval(interval);
        setTypingComplete(true);
        // Fade out cursor after completion
        setTimeout(() => {
          setCursorVisible(false);
        }, 600);
      }
    }, 120); // 120ms per letter: 8 letters * 120ms = ~960ms total typing time

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-center font-sans">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight select-none">
        <span className="text-slate-900">
          {displayedText.substring(0, Math.min(displayedText.length, 4))}
        </span>
        {displayedText.length > 4 && (
          <span className="text-[#FF4D00]">
            {displayedText.substring(4)}
          </span>
        )}
        <span 
          className={`ml-1 text-slate-400 font-light transition-opacity duration-300 ${
            cursorVisible ? "opacity-100" : "opacity-0"
          } ${!typingComplete ? "animate-pulse" : ""}`}
        >
          |
        </span>
      </h1>
    </div>
  );
};

export default function App() {
  // --- AUTHENTICATED USER SESSION STATE ---
  const [userSession, setUserSession] = useState<{
    uid: string;
    name: string;
    username: string;
    email: string;
    birthday: string;
    avatar: string;
    interests: string[];
  } | null>(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [splashVisible, setSplashVisible] = useState<boolean>(true);
  const [splashFadeOut, setSplashFadeOut] = useState<boolean>(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setSplashFadeOut(true);
    }, 2000);

    const unmountTimer = setTimeout(() => {
      setSplashVisible(false);
    }, 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  const [registryUsers, setRegistryUsers] = useState<any[]>([]);

  // Dynamic search input inside the Dashboard Executive Deck to discover others
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState<string>("");
  const [firestoreSearchResults, setFirestoreSearchResults] = useState<any[]>([]);
  const [isSearchingFirestore, setIsSearchingFirestore] = useState<boolean>(false);

  // Home layout dual-tab system and dynamic real-time crowd-gifting feed linked directly to wallet
  const [dashboardTab, setDashboardTab] = useState<"timeline" | "wishlist">("timeline");
  const [wishlistFeedItems, setWishlistFeedItems] = useState<WishlistFeedItem[]>(() => {
    return [];
  });

  useEffect(() => {
    localStorage.setItem("hbd_wishlist_feed_items", JSON.stringify(wishlistFeedItems));
  }, [wishlistFeedItems]);

  const [activeContributingItem, setActiveContributingItem] = useState<any>(null);
  const [contributionInput, setContributionInput] = useState<string>("");

  useEffect(() => {
    const searchVal = dashboardSearchQuery.trim().toLowerCase();
    if (searchVal.length < 1) {
      setFirestoreSearchResults([]);
      return;
    }

    setIsSearchingFirestore(true);
    const q = query(
      collection(db, "users"),
      where("username", ">=", searchVal),
      where("username", "<=", searchVal + "\uf8ff")
    );

    const timer = setTimeout(async () => {
      try {
        const querySnapshot = await getDocs(q);
        const results: any[] = [];
        querySnapshot.forEach((doc) => {
          results.push({ id: doc.id, ...doc.data() });
        });
        setFirestoreSearchResults(results);
      } catch (err) {
        console.error("Firestore username search query failed: ", err);
      } finally {
        setIsSearchingFirestore(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [dashboardSearchQuery]);

  // Friends list loaded from local storage or defaults
  const [friends, setFriends] = useState<Friend[]>([]);

  // --- SIGN IN FORM STATE CONTROLLERS ---
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(true);
  const [signInPassword, setSignInPassword] = useState<string>("");
  const [signInName, setSignInName] = useState<string>("");
  const [signInUsername, setSignInUsername] = useState<string>(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.username || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  });
  const [signInEmail, setSignInEmail] = useState<string>(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.email || "";
      } catch (e) {
        return "";
      }
    }
    return "";
  });
  const [signInPhone, setSignInPhone] = useState<string>(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.phone || "+233241234567";
      } catch (e) {
        return "+233241234567";
      }
    }
    return "+233241234567";
  });
  const [signInWhatsApp, setSignInWhatsApp] = useState<string>(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.whatsapp || "+233241234567";
      } catch (e) {
        return "+233241234567";
      }
    }
    return "+233241234567";
  });
  const [signInBirthday, setSignInBirthday] = useState<string>("");
  const [signInAvatar, setSignInAvatar] = useState<string>("bg-indigo-600");
  const [signInInterests, setSignInInterests] = useState<string[]>(["Photography", "Specialty Coffee"]);

  // Track the active interactive workspace section
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "registry" | "ai-lab" | "ai-lab-legacy-hidden" | "gift-store" | "my-wishlist" | "achievements" | "profile" | "settings" | "upgrade" | "chat"
  >("dashboard");

  const [chatMobileView, setChatMobileView] = useState<"list" | "detail">("list");

  // Global theme state & persistence sync
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("hbd_theme_mode");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add("dark");
      localStorage.setItem("hbd_theme_mode", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("hbd_theme_mode", "light");
    }
  }, [isDarkMode]);

  // Important Configuration Settings
  const [notifyWhatsApp, setNotifyWhatsApp] = useState<boolean>(() => {
    const saved = localStorage.getItem("hbd_settings_notify_whatsapp");
    return saved ? saved === "true" : true;
  });
  const [notifySnapchat, setNotifySnapchat] = useState<boolean>(() => {
    const saved = localStorage.getItem("hbd_settings_notify_snapchat");
    return saved ? saved === "true" : true;
  });
  const [notifyAdvanceDays, setNotifyAdvanceDays] = useState<number>(() => {
    const saved = localStorage.getItem("hbd_settings_advance_days");
    return saved ? parseInt(saved, 10) : 3;
  });
  const [globalVisibility, setGlobalVisibility] = useState<"Public" | "Linked" | "Private">(() => {
    const saved = localStorage.getItem("hbd_settings_visibility");
    return (saved as "Public" | "Linked" | "Private") || "Linked";
  });
  const [autoApproveHandshakes, setAutoApproveHandshakes] = useState<boolean>(() => {
    const saved = localStorage.getItem("hbd_settings_auto_approve");
    return saved ? saved === "true" : true;
  });
  const [showAgeInProfile, setShowAgeInProfile] = useState<boolean>(() => {
    const saved = localStorage.getItem("hbd_settings_show_age");
    return saved ? saved === "true" : true;
  });
  const [soundEffectsEnabled, setSoundEffectsEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("hbd_settings_sounds_enabled");
    return saved ? saved === "true" : true;
  });
  const [reminderChime, setReminderChime] = useState<string>(() => {
    return localStorage.getItem("hbd_settings_reminder_chime") || "default";
  });
  const [userRegion, setUserRegion] = useState<"Ghana" | "Other Africa" | "USA/Western" | "Default">(() => {
    const saved = localStorage.getItem("hbd_pricing_region");
    if (saved) return saved as any;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Accra") || tz.includes("Ghana")) return "Ghana";
      if (
        tz.includes("Lagos") ||
        tz.includes("Nairobi") ||
        tz.includes("Kigali") ||
        tz.includes("Dar_es_Salaam") ||
        tz.includes("Kampala") ||
        tz.includes("Lusaka") ||
        tz.includes("Harare") ||
        tz.includes("Johannesburg") ||
        tz.includes("Cairo") ||
        tz.includes("Abidjan") ||
        tz.includes("Africa")
      ) {
        return "Other Africa";
      }
      if (
        tz.includes("New_York") ||
        tz.includes("Los_Angeles") ||
        tz.includes("Chicago") ||
        tz.includes("London") ||
        tz.includes("Paris") ||
        tz.includes("Berlin") ||
        tz.includes("Toronto") ||
        tz.includes("Sydney") ||
        tz.includes("Europe") ||
        tz.includes("America")
      ) {
        return "USA/Western";
      }
    } catch(e) {}
    return "Default";
  });
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [isAiLabOpen, setIsAiLabOpen] = useState<boolean>(false);

  const [globalCurrency, setGlobalCurrency] = useState<string>(() => {
    const saved = localStorage.getItem("hbd_settings_currency");
    if (saved) return saved;
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      if (tz.includes("Accra") || tz.includes("Ghana")) return "GHS";
    } catch (e) {}
    return "USD";
  });
  const [confettiOnBirthdays, setConfettiOnBirthdays] = useState<boolean>(() => {
    const saved = localStorage.getItem("hbd_settings_confetti");
    return saved ? saved === "true" : true;
  });

  // Sent Gifts log state
  const [sentGifts, setSentGifts] = useState<SentGift[]>(() => {
    const saved = localStorage.getItem("hbd_sent_gifts_log");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Received Gifts log state
  const [receivedGifts, setReceivedGifts] = useState<ReceivedGift[]>(() => {
    const saved = localStorage.getItem("hbd_received_gifts_log");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {
        // Fall through
      }
    }
    return [
      {
        id: "gift_rx_1",
        senderId: "taylor_id",
        senderName: "Taylor (Best Friend)",
        giftType: "rose",
        giftName: "Crimson Velvet Rose",
        price: "GH¢ 120.00",
        status: "Delivered",
        message: "Happy early birthday! Hope you love this premium crimson rose! 💖",
        dateReceived: "Jun 14, 2026"
      },
      {
        id: "gift_rx_2",
        senderId: "alex_patel",
        senderName: "Alex Patel (Classmate)",
        giftType: "money",
        giftName: "Birthday Cash Token",
        price: "GH¢ 250.05",
        status: "Delivered",
        message: "Here's a little birthday cash to grab whatever you want from your wishlist! 🎉 Enjoy your day!",
        dateReceived: "Jun 15, 2026"
      }
    ];
  });

  // Filtered list of received gifts to hide surprise gifts until the user's actual birthday
  const visibleReceivedGifts = useMemo(() => {
    return receivedGifts.filter(gift => {
      if (!gift.isSurprise) return true;
      if (!userSession || !userSession.birthday) return false;
      try {
        const today = new Date();
        const parts = userSession.birthday.split("-");
        if (parts.length >= 3) {
          const bdMonth = parseInt(parts[1], 10) - 1;
          const bdDate = parseInt(parts[2], 10);
          return today.getMonth() === bdMonth && today.getDate() === bdDate;
        }
      } catch (e) {}
      return false;
    });
  }, [receivedGifts, userSession?.birthday]);

  const [ledgerSubTab, setLedgerSubTab] = useState<"sent" | "received">("sent");

  // --- IN-APP GIFT STORE MANAGEMENT STATES ---
  const [giftStoreTab, setGiftStoreTab] = useState<"gallery" | "pools" | "ledger">("gallery");
  const [giftCarouselIndex, setGiftCarouselIndex] = useState<number>(0);
  const [giftSwipeStartX, setGiftSwipeStartX] = useState<number | null>(null);
  const [giftContributionAmount, setGiftContributionAmount] = useState<string>("50");
  const giftAmountMin = 5;
  const giftAmountMax = 500;
  const selectedStoreGift = GIFT_INVENTORY[giftCarouselIndex] || GIFT_INVENTORY[0];
  const [customGiftStoreItem, setCustomGiftStoreItem] = useState<{ id: string; name: string; type: string; usdPrice: number } | null>(null);
  const [giftRecipientId, setGiftRecipientId] = useState<string>("");
  const [giftRevealDate, setGiftRevealDate] = useState<string>("");
  const [giftRecipientMessage, setGiftRecipientMessage] = useState<string>("");
  const [giftPaymentMethod, setGiftPaymentMethod] = useState<"momo" | "card" | "points">("momo");
  const [isGiftProcessing, setIsGiftProcessing] = useState<boolean>(false);
  const [giftProcessingStep, setGiftProcessingStep] = useState<string>( "");
  const [giftIsSurprise, setGiftIsSurprise] = useState<boolean>(true);

  // Shake & Confetti premium interactions
  const [shakingGiftId, setShakingGiftId] = useState<string | null>(null);
  const [activeConfettiGiftId, setActiveConfettiGiftId] = useState<string | null>(null);
  const [showPurchaseConfetti, setShowPurchaseConfetti] = useState<boolean>(false);

  const [walletBalance, setWalletBalance] = useState<number>(() => {
    const saved = localStorage.getItem("hbd_wallet_balance");
    return saved ? parseFloat(saved) : 0;
  });
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [showDepositForm, setShowDepositForm] = useState<boolean>(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem("hbd_wallet_balance", String(walletBalance));
  }, [walletBalance]);

  // Helper to format currency values based on global settings
  const getFormattedPrice = (usdAmount: number) => {
    switch (globalCurrency) {
      case "GHS":
        return `₵${usdAmount * 12}`;
      case "EUR":
        return `€${(usdAmount * 0.92).toFixed(2)}`;
      case "GBP":
        return `£${(usdAmount * 0.78).toFixed(2)}`;
      case "CAD":
        return `C$${(usdAmount * 1.37).toFixed(2)}`;
      default:
        return `$${usdAmount}`;
    }
  };

  // Automatically sync settings
  useEffect(() => {
    localStorage.setItem("hbd_settings_notify_whatsapp", String(notifyWhatsApp));
    localStorage.setItem("hbd_settings_notify_snapchat", String(notifySnapchat));
    localStorage.setItem("hbd_settings_advance_days", String(notifyAdvanceDays));
    localStorage.setItem("hbd_settings_visibility", globalVisibility);
    localStorage.setItem("hbd_settings_auto_approve", String(autoApproveHandshakes));
    localStorage.setItem("hbd_settings_show_age", String(showAgeInProfile));
    localStorage.setItem("hbd_settings_sounds_enabled", String(soundEffectsEnabled));
    localStorage.setItem("hbd_settings_reminder_chime", reminderChime);
    localStorage.setItem("hbd_settings_currency", globalCurrency);
    localStorage.setItem("hbd_settings_confetti", String(confettiOnBirthdays));
    localStorage.setItem("hbd_pricing_region", userRegion);
  }, [
    notifyWhatsApp,
    notifySnapchat,
    notifyAdvanceDays,
    globalVisibility,
    autoApproveHandshakes,
    showAgeInProfile,
    soundEffectsEnabled,
    reminderChime,
    globalCurrency,
    confettiOnBirthdays,
    userRegion
  ]);

  // Sync sent gifts
  useEffect(() => {
    localStorage.setItem("hbd_sent_gifts_log", JSON.stringify(sentGifts));
  }, [sentGifts]);

  // Sync received gifts
  useEffect(() => {
    localStorage.setItem("hbd_received_gifts_log", JSON.stringify(receivedGifts));
  }, [receivedGifts]);

  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Poll to reveal scheduled gifts whose reveal date has arrived
  useEffect(() => {
    let changed = false;
    const todayStr = getTodayDateString();
    
    const updatedGifts = sentGifts.map(gift => {
      if (gift.status === "Scheduled" && gift.revealDate && gift.revealDate <= todayStr) {
        changed = true;
        
        // Add Notification
        const newSysNotification = {
          id: "notif_reveal_" + Date.now() + "_" + Math.random(),
          type: "system" as const,
          title: `🎁 Scheduled Gift Delivered!`,
          message: `The scheduled gift "${gift.giftName}" for ${gift.friendName} has been unlocked and delivered today!`,
          timestamp: "Just Now",
          isRead: false
        };
        setNotifications(prevNotifs => [newSysNotification, ...prevNotifs]);
        
        appendLog(`[Scheduler] "${gift.giftName}" scheduled reveal for ${gift.friendName} triggered. Status updated to Delivered.`);
        
        return {
          ...gift,
          status: "Delivered"
        };
      }
      return gift;
    });
    
    if (changed) {
      setSentGifts(updatedGifts);
      localStorage.setItem("hbd_sent_gifts_log", JSON.stringify(updatedGifts));
      triggerToast("Scheduled Gift Revealed! 🎁", `Gifts scheduled for delivery have been opened for recipients.`);
    }
  }, [sentGifts]);

  // Local state for the search bar inside the integrated Sign In Page
  const [signinSearchQuery, setSigninSearchQuery] = useState<string>("");

  // --- MONTHLY CALENDAR VIEW STATE ---
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(5); // 0-indexed, so 5 = June (today's month)
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<{ day: number; month: number; year: number }>({ day: 3, month: 5, year: 2026 });

  // Selected friend in registry/AI picker
  const [selectedFriendId, setSelectedFriendId] = useState<string>("taylor");
  const [viewingBuddyProfile, setViewingBuddyProfile] = useState<boolean>(false);
  const [revealPhone, setRevealPhone] = useState<boolean>(false);
  const [revealWhatsApp, setRevealWhatsApp] = useState<boolean>(false);

  useEffect(() => {
    setRevealPhone(false);
    setRevealWhatsApp(false);
  }, [selectedFriendId]);


  // --- PREMIUM & FREEMIUM SYSTEM STATE VARIABLES ---
  const [accountType, setAccountType] = useState<"Free" | "Pro" | "Business">(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.accountType || "Free";
      } catch (e) {
        return "Free";
      }
    }
    return "Free";
  });

  // Automatically sync updated accountType tier status to localStorage coordinates
  useEffect(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.accountType !== accountType) {
          parsed.accountType = accountType;
          localStorage.setItem("birthday_authenticated_user", JSON.stringify(parsed));
        }
      } catch (e) {
        // Safe catch
      }
    }
  }, [accountType]);

  const [snapchatUsername, setSnapchatUsername] = useState<string>(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.snapchatUsername || "alex_snap";
      } catch (e) {
        return "alex_snap";
      }
    }
    return "alex_snap";
  });

  const [whatsappNumber, setWhatsappNumber] = useState<string>(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.whatsappNumber || "+233241234567";
      } catch (e) {
        return "+233241234567";
      }
    }
    return "+233241234567";
  });

  const [enableEmailReminders, setEnableEmailReminders] = useState<boolean>(() => {
    const saved = localStorage.getItem("birthday_authenticated_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.enableEmailReminders !== false; // default true
      } catch (e) {
        return true;
      }
    }
    return true;
  });

  // Modal Dialog flags
  const [showUpgradePromptModal, setShowUpgradePromptModal] = useState<boolean>(false);
  const [showSendGiftModal, setShowSendGiftModal] = useState<boolean>(false);
  const [selectedGiftItem, setSelectedGiftItem] = useState<{
    friendId: string;
    wishId: string;
    title: string;
    price: string;
    friendName: string;
  } | null>(null);

  // Bulk import textarea state
  const [bulkImportText, setBulkImportText] = useState<string>("");

  // Paystack Billing & Upgrades
  const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const handlePaymentUpgrade = async (targetPlan: "pro" | "business") => {
    if (!userSession) {
      triggerToast("Authentication Required", "Please sign in or create an account before billing.");
      return;
    }
    
    setIsPaymentLoading(true);
    try {
      const uId = userSession.uid || (userSession as any).userId || "";
      const email = userSession.email || "";
      const rawApiBase = ((import.meta as any).env.VITE_API_URL || "").trim();
      const apiBase = rawApiBase.replace(/\/+$/, "");
      let subscriptionEndpoint = "/api/subscriptions/initialize";

      if (apiBase) {
        const isAbsolute = /^https?:\/\//i.test(apiBase);
        const url = isAbsolute ? new URL(apiBase) : null;
        const segments = url ? url.pathname.split("/").filter(Boolean) : apiBase.split("/").filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        const hasApiSegment = segments.includes("api");
        const hasSubscriptionsSegment = segments.includes("subscriptions");

        if (lastSegment === "initialize" && hasApiSegment && hasSubscriptionsSegment) {
          subscriptionEndpoint = apiBase;
        } else if (lastSegment === "subscriptions" && hasApiSegment) {
          subscriptionEndpoint = `${apiBase}/initialize`;
        } else if (lastSegment === "api") {
          subscriptionEndpoint = `${apiBase}/subscriptions/initialize`;
        } else if (hasApiSegment && hasSubscriptionsSegment) {
          subscriptionEndpoint = `${apiBase}/initialize`;
        } else if (hasApiSegment) {
          subscriptionEndpoint = `${apiBase}/subscriptions/initialize`;
        } else {
          subscriptionEndpoint = `${apiBase}/api/subscriptions/initialize`;
        }
      }
      
      const response = await fetch(subscriptionEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: uId,
          email: email,
          billingCycle: billingCycle, // "monthly" or "annual"
          targetPlan,
          countryCode: (userSession as any).countryCode || "GH",
        }),
      });
      
      const contentType = response.headers.get("content-type") || "";
      let resData: any;
      try {
        resData = await response.json();
      } catch (jsonError) {
        throw new Error(`Payment endpoint returned non-JSON response (${response.status}). Check that ${subscriptionEndpoint} is a real API route.`);
      }
      
      if (!response.ok || !resData.authorization_url) {
        throw new Error(resData.error || `Payment endpoint returned HTTP ${response.status}.`);
      }
      
      triggerToast("Redirecting to Paystack... 💳", "Preparing secure checkout window.");
      window.location.href = resData.authorization_url;
    } catch (err: any) {
      console.error("Payment upgrade error:", err);
      triggerToast("Gateway Error ✕", err.message || "Unable to reach payment authorization gateway.");
    } finally {
      setIsPaymentLoading(false);
    }
  };

  // Sub-states for adding or editing phone/snapchat handles for companions
  const [newFriendPhone, setNewFriendPhone] = useState<string>("");
  const [newFriendWhatsApp, setNewFriendWhatsApp] = useState<string>("");
  const [newFriendEmail, setNewFriendEmail] = useState<string>("");
  const [newFriendSnapchat, setNewFriendSnapchat] = useState<string>("");
  const [editFriendPhone, setEditFriendPhone] = useState<string>("");
  const [editFriendWhatsApp, setEditFriendWhatsApp] = useState<string>("");
  const [editFriendEmail, setEditFriendEmail] = useState<string>("");
  const [editFriendSnapchat, setEditFriendSnapchat] = useState<string>("");

  // Custom activity log feed state to show live interactive operation records
  const [logs, setLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem("birthday_activity_logs");
    return saved ? JSON.parse(saved) : [
      "[10:42 AM] Connected to HBD cloud system workspace.",
      "[11:15 AM] Jamie Chen's birthday wishlist updated with Matcha Bowl.",
      "[02:30 PM] Synchronized widget coordinates with iOS lock screen complication.",
      "[04:12 PM] Riley Cooper's birthday profile synchronized. Sourdough added."
    ];
  });

  // Helper code to format system log actions
  const appendLog = (actionMsg: string) => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const formatted = `[${timeStr}] ${actionMsg}`;
    setLogs(prev => {
      const next = [formatted, ...prev].slice(0, 50); // limit to 50 logs
      localStorage.setItem("birthday_activity_logs", JSON.stringify(next));
      return next;
    });
  };

  // Synchronized synthesizer helper to play custom notification sounds in sandbox or client
  const playSynthesizedChimeObj = (chimeType: string) => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;
      
      if (chimeType === "bell") {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.frequency.setValueAtTime(523.25, now);
        osc2.frequency.setValueAtTime(783.99, now);

        gain1.gain.setValueAtTime(0.08, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
        gain2.gain.setValueAtTime(0.05, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc1.connect(gain1);
        osc2.connect(gain2);
        gain1.connect(ctx.destination);
        gain2.connect(ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
      } else if (chimeType === "marimba") {
        const notes = [523.25, 659.25, 783.99];
        notes.forEach((freq, index) => {
          const delay = index * 0.08;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + delay);
          
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.setValueAtTime(0.08, now + delay);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.25);
        });
      } else if (chimeType === "digital") {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(1400, now + 0.08);

        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.12);
      } else if (chimeType === "sweet") {
        const notes = [587.33, 880.00];
        notes.forEach((freq, index) => {
          const delay = index * 0.1;
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + delay);

          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.setValueAtTime(0.06, now + delay);
          gainNode.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.45);

          osc.connect(gainNode);
          gainNode.connect(ctx.destination);

          osc.start(now + delay);
          osc.stop(now + delay + 0.45);
        });
      } else {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc.frequency.setValueAtTime(880, now);
        gainNode.gain.setValueAtTime(0.08, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch (e) {
      console.warn("Chime synthesis played with errors", e);
    }
  };

  // Helper to trigger selected pre-configured audio chimes
  const playNotificationSound = (force = false) => {
    if (!soundEffectsEnabled && !force) return;
    playSynthesizedChimeObj(reminderChime);
  };

  // Helper to trigger opening/unwrapping interactive gifts
  const handleOpenGift = (giftId: string) => {
    if (shakingGiftId) return; // Prevent double trigger
    
    setShakingGiftId(giftId);
    playNotificationSound(); // Play lovely dispatch chime
    
    setTimeout(() => {
      setShakingGiftId(null);
      setActiveConfettiGiftId(giftId);
      
      setSentGifts((prev) => 
        prev.map((g) => (g.id === giftId ? { ...g, isOpened: true } : g))
      );
    }, 620);
  };

  // AI custom suggestion panel properties
  const [aiBudget, setAiBudget] = useState<string>("under $50");
  const [aiRelationship, setAiRelationship] = useState<string>("Best Friend");
  const [aiAge, setAiAge] = useState<string>("28");
  const [customInterest, setCustomInterest] = useState<string>("");

  // AI suggestions result list
  const [aiSuggestions, setAiSuggestions] = useState<GiftSuggestion[]>([]);
  const [isLoadingAi, setIsLoadingAi] = useState<boolean>(false);
  const [aiNote, setAiNote] = useState<string>("");

  // Manage custom friend profile editing on the spot (Registry Mode)
  const [isEditingFriend, setIsEditingFriend] = useState<boolean>(false);
  const [editFriendName, setEditFriendName] = useState<string>("");
  const [editFriendBirthday, setEditFriendBirthday] = useState<string>("");
  const [editFriendRelationship, setEditFriendRelationship] = useState<string>("Best Friend");
  const [editFriendAge, setEditFriendAge] = useState<string>("25");
  const [editFriendAvatar, setEditFriendAvatar] = useState<string>("bg-indigo-500");

  // Creating a new wish states
  const [newItemTitle, setNewItemTitle] = useState<string>("");
  const [newItemPrice, setNewItemPrice] = useState<string>("");
  const [newItemUrl, setNewItemUrl] = useState<string>("");
  const [isAddingWish, setIsAddingWish] = useState<boolean>(false);

  // States for editing a specific wishlist item in selected buddy profile
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [editingWishTitle, setEditingWishTitle] = useState<string>("");
  const [editingWishPrice, setEditingWishPrice] = useState<string>("");
  const [editingWishUrl, setEditingWishUrl] = useState<string>("");

  // Registering a new Buddy profile dialog modal state
  const [showAddProfile, setShowAddProfile] = useState<boolean>(false);
  const [newFriendName, setNewFriendName] = useState<string>("");
  const [newFriendBirthday, setNewFriendBirthday] = useState<string>("");
  const [newFriendRelationship, setNewFriendRelationship] = useState<string>("Best Friend");
  const [newFriendAge, setNewFriendAge] = useState<string>("25");
  const [newFriendInterestsText, setNewFriendInterestsText] = useState<string>("");
  const [isQrScannerActive, setIsQrScannerActive] = useState<boolean>(false);
  const [newFriendConnectedBack, setNewFriendConnectedBack] = useState<boolean>(false);

  // Global search and relationship type filtering states (Registry panel)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filterRelationship, setFilterRelationship] = useState<string>("All");

  // System custom alert toast state
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>("");
  const [toastTitle, setToastTitle] = useState<string>("");

  const triggerToast = (title: string, msg: string) => {
    setToastTitle(title);
    setToastMessage(msg);
    setShowToast(true);
  };

  // --- CONNECT & IMPORT WORKSPACE STATES ---
  const [profileSubTab, setProfileSubTab] = useState<"settings" | "profile" | "wishlist" | "trophies">("settings");
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [isPasswordResetLoading, setIsPasswordResetLoading] = useState<boolean>(false);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState<boolean>(false);

  const handlePasswordReset = async () => {
    if (!auth.currentUser) {
      triggerToast("Not Authenticated ⚠️", "Please verify your sign in session first.");
      return;
    }

    const userEmail = auth.currentUser.email;
    if (!userEmail) {
      triggerToast("Email Missing ⚠️", "This account does not have an email address for password recovery.");
      return;
    }

    setIsPasswordResetLoading(true);
    setPasswordResetSuccess(false);
    try {
      await sendPasswordResetEmail(auth, userEmail);
      setPasswordResetSuccess(true);
      triggerToast("Check your inbox", "We sent a password reset link to your email.");
    } catch (error: any) {
      console.error("Password reset error:", error);
      triggerToast("Reset Failed ❌", error.message || "We could not send the password reset email.");
    } finally {
      setIsPasswordResetLoading(false);
    }
  };
  const [registrySubTab, setRegistrySubTab] = useState<"list" | "wishlist" | "trophies" | "connect" | "requests">("list");
  const [connectMethod, setConnectMethod] = useState<"contacts" | "username">("contacts");
  const [usernameSearch, setUsernameSearch] = useState<string>("");
  const [showRelationModal, setShowRelationModal] = useState<boolean>(false);
  const [pendingConnectProfile, setPendingConnectProfile] = useState<MockProfile | null>(null);

  // Mobile device contacts synchronization states
  const [contactsSynced, setContactsSynced] = useState<boolean>(() => {
    const saved = localStorage.getItem("hbd_contacts_synced");
    return saved === "true";
  });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showContactSimulator, setShowContactSimulator] = useState<boolean>(false);
  const [showMockList, setShowMockList] = useState<boolean>(false);
  const [isDraggingContactFile, setIsDraggingContactFile] = useState<boolean>(false);

  interface SyncedContact {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    birthday?: string;
    avatar: string;
    source: string;
  }

  const [syncedContacts, setSyncedContacts] = useState<SyncedContact[]>(() => {
    const saved = localStorage.getItem("hbd_synced_contacts_list");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("hbd_contacts_synced", contactsSynced ? "true" : "false");
  }, [contactsSynced]);

  useEffect(() => {
    localStorage.setItem("hbd_synced_contacts_list", JSON.stringify(syncedContacts));
  }, [syncedContacts]);

  const parseVCF = (text: string): { name: string; phone?: string; email?: string; birthday?: string; avatar: string }[] => {
    const contacts: any[] = [];
    const bgColors = ["bg-teal-500", "bg-emerald-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-pink-500", "bg-orange-500"];
    
    // Split on BEGIN:VCARD and handle each card block
    const cards = text.split("BEGIN:VCARD");
    for (const card of cards) {
      if (!card.trim()) continue;
      let name = "";
      let phone = "";
      let email = "";
      let birthday = "";

      const lines = card.split(/\r?\n/);
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.toUpperCase().startsWith("FN:")) {
          name = trimmed.substring(3).trim();
        } else if (trimmed.toUpperCase().startsWith("N:") && !name) {
          const parts = trimmed.substring(2).split(";");
          const first = parts[1] || "";
          const last = parts[0] || "";
          name = `${first} ${last}`.trim();
        } else if (trimmed.toUpperCase().startsWith("TEL")) {
          const colonIdx = trimmed.indexOf(":");
          if (colonIdx !== -1) {
            phone = trimmed.substring(colonIdx + 1).trim();
          }
        } else if (trimmed.toUpperCase().startsWith("EMAIL")) {
          const colonIdx = trimmed.indexOf(":");
          if (colonIdx !== -1) {
            email = trimmed.substring(colonIdx + 1).trim();
          }
        } else if (trimmed.toUpperCase().startsWith("BDAY")) {
          const colonIdx = trimmed.indexOf(":");
          if (colonIdx !== -1) {
            let bdayVal = trimmed.substring(colonIdx + 1).trim().replace(/[^0-9-]/g, "");
            if (bdayVal.length === 8 && !bdayVal.includes("-")) {
              birthday = `${bdayVal.substring(0, 4)}-${bdayVal.substring(4, 6)}-${bdayVal.substring(6, 8)}`;
            } else if (bdayVal.startsWith("--")) {
              birthday = `1995-${bdayVal.substring(2)}`;
            } else {
              birthday = bdayVal;
            }
          }
        }
      }
      
      if (name) {
        const avatar = bgColors[Math.floor(Math.random() * bgColors.length)];
        contacts.push({ name, phone, email, birthday, avatar });
      }
    }
    return contacts;
  };

  const parseCSV = (text: string): { name: string; phone?: string; email?: string; birthday?: string; avatar: string }[] => {
    const contacts: any[] = [];
    const bgColors = ["bg-teal-500", "bg-emerald-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-pink-500", "bg-orange-500"];
    
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/["']/g, ""));
    const findIndex = (keywords: string[]) => {
      return headers.findIndex(h => keywords.some(k => h.includes(k)));
    };

    const nameIdx = findIndex(["name", "display name", "first name", "fn"]);
    const phoneIdx = findIndex(["phone", "tel", "mobile", "contact", "phone number"]);
    const emailIdx = findIndex(["email", "mail", "email address"]);
    const bdayIdx = findIndex(["birthday", "dob", "birth", "bday", "date of birth"]);

    for (let i = 1; i < lines.length; i++) {
      const row = lines[i].split(",").map(val => val.trim().replace(/["']/g, ""));
      const name = nameIdx !== -1 && row[nameIdx] ? row[nameIdx] : "";
      if (!name) continue;

      const phone = phoneIdx !== -1 && row[phoneIdx] ? row[phoneIdx] : "";
      const email = emailIdx !== -1 && row[emailIdx] ? row[emailIdx] : "";
      let birthday = bdayIdx !== -1 && row[bdayIdx] ? row[bdayIdx] : "";

      if (birthday) {
        birthday = birthday.replace(/\//g, "-");
        const parts = birthday.split("-");
        if (parts.length === 3) {
          let year = parts[0];
          let month = parts[1];
          let day = parts[2];
          if (year.length !== 4 && day.length === 4) {
            year = parts[2];
            month = parts[0];
            day = parts[1];
          }
          if (month.length === 1) month = "0" + month;
          if (day.length === 1) day = "0" + day;
          birthday = `${year}-${month}-${day}`;
        }
      }

      const avatar = "bg-indigo-500";
      contacts.push({ name, phone, email, birthday, avatar });
    }
    return contacts;
  };

  const handleImportedContacts = (newContacts: any[]) => {
    if (newContacts.length === 0) {
      triggerToast("No Contacts Found", "We couldn't recognize contact names or valid headers in this sync action.");
      return;
    }
    
    setSyncedContacts(prev => {
      const merged = [...prev];
      let added = 0;
      newContacts.forEach(nc => {
        const exists = merged.some(mc => 
          mc.name.toLowerCase().trim() === nc.name.toLowerCase().trim() ||
          (nc.phone && mc.phone === nc.phone) ||
          (nc.email && mc.email === nc.email)
        );
        if (!exists) {
          merged.push({
            id: nc.id || `contact-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name: nc.name,
            phone: nc.phone || "",
            email: nc.email || "",
            birthday: nc.birthday || "",
            avatar: nc.avatar || "bg-indigo-500",
            source: nc.source || "File Backup"
          });
          added++;
        }
      });
      triggerToast(
        "Contacts Synced 📱", 
        `Address book synchronized. Successfully integrated ${added} new offline companion records.`
      );
      return merged;
    });
    setContactsSynced(true);
  };

  const handleContactFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;
      
      let parsed: any[] = [];
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension === 'vcf') {
        parsed = parseVCF(text);
      } else if (extension === 'csv') {
        parsed = parseCSV(text);
      } else {
        triggerToast("Unsupported File", "Please export contacts into standard .csv or .vcf formats.");
        return;
      }
      handleImportedContacts(parsed);
    };
    reader.readAsText(file);
  };

  const handleWebContactPicker = async () => {
    if (!("contacts" in navigator && "select" in (navigator as any).contacts)) {
      triggerToast("Sandbox Simulation Mode ✨", "Secure browser Contacts interface was requested. Launching Picker Simulation!");
      setShowContactSimulator(true);
      return;
    }

    try {
      setIsSyncing(true);
      const props = ["name", "tel", "email", "birthday"];
      const opts = { multiple: true };
      const selectedContacts = await (navigator as any).contacts.select(props, opts);
      
        const mapped = selectedContacts.map((c: any) => {
          const name = c.name && c.name[0] ? c.name[0] : "Unnamed Contact";
          const phone = c.tel && c.tel[0] ? c.tel[0] : "";
          const email = c.email && c.email[0] ? c.email[0] : "";
          const birthdayValue = c.birthday;
          const birthday = birthdayValue
            ? (birthdayValue instanceof Date ? birthdayValue.toISOString().split("T")[0] : String(birthdayValue).split("T")[0])
            : "";

          return {
            name,
            phone,
            email,
            birthday,
            avatar: "bg-indigo-500",
            source: "Device Address Book"
          };
        });

      handleImportedContacts(mapped);
    } catch (err: any) {
      console.error("Web Contacts Picker failed: ", err);
      if (err.name === "SecurityError" || err.message?.includes("iframe")) {
        triggerToast("Sandbox Protocol Routing ✨", "Opening secure container simulation matching.");
        setShowContactSimulator(true);
      } else {
        triggerToast("Sync Canceled", "Device sync process was dismissed.");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportLocalContact = (sc: SyncedContact) => {
    const nextId = sc.id;
    
    // Check Freemium tier constraints
    const companionCount = friends.filter(f => f.id !== "alex").length;
    if (accountType === "Free" && companionCount >= 5) {
      setShowUpgradePromptModal(true);
      triggerToast("Friend Limit Reached 👑", "Free account tier is capped at 5 additions. Upgrade for unlimited!");
      return;
    }

    const newFriend: Friend = {
      id: nextId,
      name: sc.name,
      birthday: sc.birthday || "",
      relationship: "Local Celebrant",
      age: "",
      interests: [],
      avatar: sc.avatar || "bg-indigo-500",
      wishlist: [],
      achievements: [],
      phone: sc.phone || "",
      email: sc.email || "",
      whatsapp: sc.phone || "",
      connectedBack: false,
      incomingRequest: false,
      requestType: "local_celebrant",
      notOnHbd: true
    };

    setFriends(prev => [...prev, newFriend]);
    appendLog(`🎂 Imported Local Celebrant: ${sc.name} is tracked privately and is not on HBD yet.`);
    triggerToast("Local Tracker Added! 🎂", `${sc.name} was added as a private local celebrant. They are not on HBD yet.`);
  };

  // Automatically populate edit profile input fields when user session gets loaded/edited
  useEffect(() => {
    if (userSession) {
      setSignInName(userSession.name || "");
      setSignInUsername(userSession.username || "");
      setSignInEmail(userSession.email || "");
      setSignInPhone((userSession as any).phone || "");
      setSignInWhatsApp((userSession as any).whatsapp || "");
      setSignInBirthday(userSession.birthday || "");
      setSignInAvatar(userSession.avatar || "bg-indigo-500");
      setSignInInterests(userSession.interests || []);
    }
  }, [userSession]);

  // Helper to retrieve all searchable accounts (Preset mocks + dynamic registered users)
  const getSearchableProfiles = useMemo(() => {
    const buildSearchableProfiles = () => {
    const saved = localStorage.getItem("hbd_all_accounts");
    let registeredList: any[] = [];
    if (saved) {
      try {
        registeredList = JSON.parse(saved);
      } catch (e) {}
    }
    
    // Convert registered accounts into standard MockProfile shape
    const convertedRegistered = registeredList.map((acc: any, i: number) => ({
      id: acc.username || `user-${acc.email || i}`,
      name: acc.name,
      username: acc.username,
      phone: acc.phone || "+233241234567",
      whatsapp: acc.whatsapp || "+233241234567",
      email: acc.email || `${acc.username}@hbd.app`,
      birthday: acc.birthday || "1997-06-25",
      age: "28", // default fallback age representation
      avatar: acc.avatar || "bg-indigo-500",
      interests: acc.interests || [],
      wishlistToPost: acc.wishlist || []
    }));

    // Exclude the currently logged in user handle to prevent self-addition
    const currentUsername = userSession?.username || "";
    const filteredMocks = MOCK_EXTERNAL_PROFILES.filter(p => p.username !== currentUsername);
    const filteredRegistered = convertedRegistered.filter((p: any) => p.username !== currentUsername);

    // Map filteredMocks to include required parameters for compatibility
    const convertedMocks = filteredMocks.map(m => ({
      id: m.id,
      name: m.name,
      username: m.username,
      phone: m.phone,
      whatsapp: m.phone,
      email: `${m.username}@example.com`,
      birthday: m.birthday,
      age: m.age,
      avatar: m.avatar,
      interests: m.interests,
      wishlistToPost: m.wishlistToPost
    }));

    // Merge registered handles first, then pack preset mocks to avoid username duplication
    const merged = [...filteredRegistered];
    convertedMocks.forEach(mock => {
      if (!merged.some(m => m.username === mock.username)) {
        merged.push(mock);
      }
    });

    return merged;
    };

    return buildSearchableProfiles;
  }, [userSession?.username, friends.length, syncedContacts.length]);

  const profileQrPayload = useMemo(() => {
    if (!userSession) return null;
    return JSON.stringify({
      hbd: true,
      uid: userSession.uid,
      username: userSession.username,
      name: userSession.name
    });
  }, [userSession?.uid, userSession?.username, userSession?.name]);

  const getProfileQrUrl = (size = 200) => {
    if (!profileQrPayload) return "";
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(profileQrPayload)}`;
  };

  // Posted status map
  const [postedLists, setPostedLists] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("birthday_posted_wishlists");
    return saved ? JSON.parse(saved) : {};
  });

  // Track ticking live timers
  const [pendingPostingTimers, setPendingPostingTimers] = useState<Record<string, number>>({});

  // Notification lists state
  const [notifications, setNotifications] = useState<InAppNotification[]>(() => {
    const saved = localStorage.getItem("birthday_in_app_notifications");
    return saved ? JSON.parse(saved) : [
      {
        id: "sys-welcome",
        type: "system",
        title: "HBD Sync Status",
        message: "Your address book and username listener is initialized and streaming in real-time.",
        timestamp: "Active",
        isRead: false
      }
    ];
  });
  const [showNotificationDrawer, setShowNotificationDrawer] = useState<boolean>(false);

  // Sync notifications to local storage
  useEffect(() => {
    localStorage.setItem("birthday_in_app_notifications", JSON.stringify(notifications));
  }, [notifications]);

  // Sync posted lists status map
  useEffect(() => {
    localStorage.setItem("birthday_posted_wishlists", JSON.stringify(postedLists));
  }, [postedLists]);

  // Refs to control real-time synchronization diff operations and prevent feedback cycles
  const isSyncingFromFirestoreRef = useRef<boolean>(false);
  const prevFriendsRef = useRef<Friend[]>([]);
  const prevGiftsRef = useRef<SentGift[]>([]);
  const prevReceivedGiftsRef = useRef<ReceivedGift[]>([]);
  const prevNotifsRef = useRef<InAppNotification[]>([]);

  // Firebase Authentication State Listener Flow
  useEffect(() => {
    const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 1800): Promise<T> => {
      return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout")), timeoutMs)
        )
      ]);
    };

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userRef = doc(db, "users", firebaseUser.uid);
          let userDocSnap = await withTimeout(getDoc(userRef));
          
          if (!userDocSnap.exists()) {
            // Document missing — create it with safe defaults from Auth
            await withTimeout(setDoc(userRef, {
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "",
              avatar: "", // empty, user will set this
              birthday: "", // empty, user will be prompted to set this
              phone: "", // empty, user will be prompted to set this
              username: "", // empty, user will be prompted to set this
              interests: [],
              createdAt: serverTimestamp(),
              isProfileComplete: false, // flag so app knows to prompt for missing info
            }, { merge: true }));
            
            // Re-fetch document after inserting to ensure local copy is populated
            userDocSnap = await withTimeout(getDoc(userRef));
          }

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserSession(data as any);
            if (data.walletBalance !== undefined) {
              setWalletBalance(data.walletBalance);
            }
          }
        } catch (error: any) {
          console.log("Firebase auth profile loader (handled gracefully offline):", error?.message || error);
          // Fallback to localStorage offline safe cache
          const savedSession = localStorage.getItem("birthday_authenticated_user");
          if (savedSession) {
            try {
              const parsed = JSON.parse(savedSession);
              if (parsed && parsed.uid === firebaseUser.uid) {
                setUserSession(parsed);
                setAuthLoading(false);
                return;
              }
            } catch (jsonErr) {}
          }
          setUserSession(null);
        }
      } else {
        setUserSession(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // System-wide registered discovery list listener (replacing LocalStorage arrays with cloud streams)
  useEffect(() => {
    if (authLoading) return;
    if (!userSession?.uid || !auth.currentUser || userSession.uid !== auth.currentUser.uid) {
      setRegistryUsers([]);
      return;
    }

    const unsubscribe = onSnapshot(
      query(collection(db, "users"), firestoreLimit(100)),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.uid !== userSession.uid && data.username) {
            list.push(data);
          }
        });
        setRegistryUsers(list);
      },
      (error) => {
        console.warn("[Registry Listener] Firestore snapshot reading denied or unauthenticated:", error.message || error);
      }
    );

    return () => unsubscribe();
  }, [userSession?.uid, authLoading]);

  // Firestore Real-Time Subcollection Subscriptions Flow
  useEffect(() => {
    if (authLoading) return;
    if (!userSession?.uid || !auth.currentUser || userSession.uid !== auth.currentUser.uid) {
      setFriends([]);
      return;
    }

    const unsubFriends = onSnapshot(
      collection(db, "users", userSession.uid, "friends"),
      (snapshot) => {
        isSyncingFromFirestoreRef.current = true;
        const list: Friend[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Friend);
        });
        setFriends(list);
        prevFriendsRef.current = list;
        setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 80);
      },
      (error) => {
        console.warn("[Friends Listener] Firestore subscription denied or unauthenticated:", error.message || error);
      }
    );

    const unsubGifts = onSnapshot(
      collection(db, "users", userSession.uid, "sent_gifts"),
      (snapshot) => {
        isSyncingFromFirestoreRef.current = true;
        const list: SentGift[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as SentGift);
        });
        setSentGifts(list);
        prevGiftsRef.current = list;
        setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 80);
      },
      (error) => {
        console.warn("[Gifts Listener] Firestore subscription denied or unauthenticated:", error.message || error);
      }
    );

    const unsubReceivedGifts = onSnapshot(
      collection(db, "users", userSession.uid, "received_gifts"),
      (snapshot) => {
        isSyncingFromFirestoreRef.current = true;
        const list: ReceivedGift[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ReceivedGift);
        });
        if (list.length > 0) {
          setReceivedGifts(list);
          prevReceivedGiftsRef.current = list;
        }
        setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 80);
      },
      (error) => {
        console.warn("[Received Gifts Listener] Firestore subscription denied or unauthenticated:", error.message || error);
      }
    );

    const unsubNotifs = onSnapshot(
      collection(db, "users", userSession.uid, "notifications"),
      (snapshot) => {
        isSyncingFromFirestoreRef.current = true;
        const list: InAppNotification[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as InAppNotification);
        });
        setNotifications(list);
        prevNotifsRef.current = list;
        setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 80);
      },
      (error) => {
        console.warn("[Notifications Listener] Firestore subscription denied or unauthenticated:", error.message || error);
      }
    );

    const unsubUserDoc = onSnapshot(
      doc(db, "users", userSession.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data.walletBalance !== undefined && data.walletBalance !== walletBalance) {
            isSyncingFromFirestoreRef.current = true;
            setWalletBalance(data.walletBalance);
            setTimeout(() => { isSyncingFromFirestoreRef.current = false; }, 80);
          }
          // Real-time plan status synchronization
          if (data.plan === "pro" && data.planStatus === "active") {
            setAccountType("Pro");
          } else if (data.plan === "business" && data.planStatus === "active") {
            setAccountType("Business");
          } else if (data.accountType) {
            setAccountType(data.accountType);
          }
          // Merge deep updates into the user session state
          setUserSession(prev => {
            if (!prev) return data as any;
            if (JSON.stringify(prev) !== JSON.stringify(data)) {
              return { ...prev, ...data };
            }
            return prev;
          });
        }
      },
      (error) => {
        console.warn("[UserDoc Listener] Firestore subscription denied or unauthenticated:", error.message || error);
      }
    );

    return () => {
      unsubFriends();
      unsubGifts();
      unsubReceivedGifts();
      unsubNotifs();
      unsubUserDoc();
    };
  }, [userSession?.uid, authLoading]);

  // State-to-Cloud Auto-Synchronizer Engine (Dirty State Interceptors)
  useEffect(() => {
    if (!userSession?.uid || !auth.currentUser) return;
    if (isSyncingFromFirestoreRef.current) return;

    const syncWork = async () => {
      const prevFriends = prevFriendsRef.current;
      prevFriendsRef.current = friends;

      // Handle Deleted Friends
      for (const prevF of prevFriends) {
        if (!friends.find(f => f.id === prevF.id)) {
          try {
            await deleteDoc(doc(db, "users", userSession.uid, "friends", prevF.id));
          } catch (e) { console.error(e); }
        }
      }

      // Handle New / Updated Friends
      for (const friend of friends) {
        const prevF = prevFriends.find(f => f.id === friend.id);
        if (prevF && JSON.stringify(prevF) === JSON.stringify(friend)) continue;
        
        try {
          await setDoc(doc(db, "users", userSession.uid, "friends", friend.id), friend, { merge: true });
        } catch (e) { console.error(e); }
      }
    };

    syncWork();
  }, [friends, userSession?.uid]);

  // Sync Sent Gift Logs to Cloud
  useEffect(() => {
    if (!userSession?.uid || !auth.currentUser) return;
    if (isSyncingFromFirestoreRef.current) return;

    const syncGifts = async () => {
      const prevGifts = prevGiftsRef.current;
      prevGiftsRef.current = sentGifts;

      for (const prevG of prevGifts) {
        if (!sentGifts.find(g => g.id === prevG.id)) {
          try {
            await deleteDoc(doc(db, "users", userSession.uid, "sent_gifts", prevG.id));
          } catch (e) { console.error(e); }
        }
      }

      for (const gift of sentGifts) {
        const prevG = prevGifts.find(g => g.id === gift.id);
        if (prevG && JSON.stringify(prevG) === JSON.stringify(gift)) continue;
        try {
          await setDoc(doc(db, "users", userSession.uid, "sent_gifts", gift.id), gift, { merge: true });
        } catch (e) { console.error(e); }
      }
    };

    syncGifts();
  }, [sentGifts, userSession?.uid]);

  // Sync Received Gift Logs to Cloud
  useEffect(() => {
    if (!userSession?.uid || !auth.currentUser) return;
    if (isSyncingFromFirestoreRef.current) return;

    const syncReceivedGifts = async () => {
      const prevReceived = prevReceivedGiftsRef.current;
      prevReceivedGiftsRef.current = receivedGifts;

      for (const prevR of prevReceived) {
        if (!receivedGifts.find(g => g.id === prevR.id)) {
          try {
            await deleteDoc(doc(db, "users", userSession.uid, "received_gifts", prevR.id));
          } catch (e) { console.error(e); }
        }
      }

      for (const gift of receivedGifts) {
        const prevR = prevReceived.find(g => g.id === gift.id);
        if (prevR && JSON.stringify(prevR) === JSON.stringify(gift)) continue;
        try {
          await setDoc(doc(db, "users", userSession.uid, "received_gifts", gift.id), gift, { merge: true });
        } catch (e) { console.error(e); }
      }
    };

    syncReceivedGifts();
  }, [receivedGifts, userSession?.uid]);

  // Sync In-App Alert Notifications to Cloud
  useEffect(() => {
    if (!userSession?.uid || !auth.currentUser) return;
    if (isSyncingFromFirestoreRef.current) return;

    const syncNotifs = async () => {
      const prevNotifs = prevNotifsRef.current;
      prevNotifsRef.current = notifications;

      for (const prevN of prevNotifs) {
        if (!notifications.find(n => n.id === prevN.id)) {
          try {
            await deleteDoc(doc(db, "users", userSession.uid, "notifications", prevN.id));
          } catch (e) { console.error(e); }
        }
      }

      for (const notif of notifications) {
        const prevN = prevNotifs.find(n => n.id === notif.id);
        if (prevN && JSON.stringify(prevN) === JSON.stringify(notif)) continue;
        try {
          await setDoc(doc(db, "users", userSession.uid, "notifications", notif.id), notif, { merge: true });
        } catch (e) { console.error(e); }
      }
    };

    syncNotifs();
  }, [notifications, userSession?.uid]);

  // Sync User Profile Preferences & Wallet balances
  useEffect(() => {
    if (!userSession?.uid || !auth.currentUser) return;
    if (isSyncingFromFirestoreRef.current) return;

    const syncProfileMeta = async () => {
      try {
        await setDoc(doc(db, "users", userSession.uid), {
          walletBalance: walletBalance
        }, { merge: true });
      } catch (e) { console.error(e); }
    };

    syncProfileMeta();
  }, [walletBalance, userSession?.uid]);


  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Persist buddy data on edit update
  useEffect(() => {
    localStorage.setItem("birthday_friends_list", JSON.stringify(friends));
  }, [friends]);

  const selectedFriend = friends.find((f) => f.id === selectedFriendId) || friends[1] || friends[0] || {
    id: "default",
    name: "No buddy selected",
    birthday: "2026-06-03",
    relationship: "Self",
    age: "0",
    avatar: "bg-indigo-505",
    wishlist: [],
    achievements: [],
    interests: [],
    phone: "",
    whatsapp: "",
    email: "",
    snapchat: ""
  };

  // Current system mock benchmark clock date: Wednesday June 3, 2026
  const today = new Date("2026-06-03");

  // Helper logic: calculating days remaining until next birthday relative to June 3, 2026
  const calculateDaysRemaining = (birthdayStr: string) => {
    const birthDate = new Date(birthdayStr);
    const birthMonth = birthDate.getMonth();
    const birthDay = birthDate.getDate();

    let nextBirthday = new Date(today.getFullYear(), birthMonth, birthDay);
    if (nextBirthday < today) {
      nextBirthday.setFullYear(today.getFullYear() + 1);
    }

    const diffTime = nextBirthday.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Nice readable birthday label
  const formatBirthdayDate = (birthdayStr: string) => {
    const date = new Date(birthdayStr);
    return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
  };

  // Extract all companions with active birthdays matching a specific 0-indexed month and day
  const getCelebrants = (monthIdx: number, dayNum: number) => {
    return friends.filter(f => {
      if (!f.birthday) return false;
      if (f.id !== "alex" && f.connectedBack !== true) return false;
      const dateParts = f.birthday.split("-");
      if (dateParts.length < 3) return false;
      const bMonth = parseInt(dateParts[1], 10) - 1; // 0-indexed month
      const bDay = parseInt(dateParts[2], 10);
      return bMonth === monthIdx && bDay === dayNum;
    });
  };

  const getUpcomingSorted = () => {
    return [...friends]
      .filter(f => f.id === "alex" || f.connectedBack === true)
      .sort((a, b) => {
        return calculateDaysRemaining(a.birthday) - calculateDaysRemaining(b.birthday);
      });
  };

  // Synchronize AI Form attributes whenever user selects a companion
  useEffect(() => {
    if (selectedFriend) {
      setAiAge(selectedFriend.age);
      setAiRelationship(selectedFriend.relationship === "Self" ? "Best Friend" : selectedFriend.relationship);
      setAiSuggestions([]);
      setEditingWishId(null);
      
      // Sync editing form defaults
      setEditFriendName(selectedFriend.name);
      setEditFriendBirthday(selectedFriend.birthday);
      setEditFriendRelationship(selectedFriend.relationship);
      setEditFriendAge(selectedFriend.age);
      setEditFriendAvatar(selectedFriend.avatar);
      setEditFriendPhone(selectedFriend.phone || "+233241234567");
      setEditFriendWhatsApp(selectedFriend.whatsapp || "+233241234567");
      setEditFriendEmail(selectedFriend.email || "friend@example.com");
      setEditFriendSnapchat(selectedFriend.snapchat || "friend_snap");
      setIsEditingFriend(false);
    }
  }, [selectedFriendId]);

  // Compatibility Router Redirects for Profile subsections integration
  useEffect(() => {
    if (activeSection === "my-wishlist") {
      setActiveSection("profile");
      setProfileSubTab("wishlist");
    } else if (activeSection === "achievements") {
      setActiveSection("profile");
      setProfileSubTab("trophies");
    } else if (activeSection === "profile") {
      setProfileSubTab("profile");
    } else if (activeSection === "settings") {
      setProfileSubTab("settings");
    }
  }, [activeSection]);

  // Handle Personalized Gemini Suggestions from backend
  const handleGetGiftSuggestions = async () => {
    setIsLoadingAi(true);
    try {
      const response = await fetch("/api/gift-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interests: selectedFriend.interests,
          relationship: aiRelationship,
          age: aiAge,
          budget: aiBudget
        })
      });
      const data = await response.json();
      setAiSuggestions(data.suggestions || []);
      setAiNote(data.note || "");
      
      unlockAchievement("Gemini Genie", "alex");
      appendLog(`Generated Gemini gift catalog for ${selectedFriend.name} using tags: [${selectedFriend.interests.join(", ")}].`);
      triggerToast(
        "AI suggestions ready ✨", 
        `Custom matching gifts generated for ${selectedFriend.name}.`
      );
    } catch (e) {
      console.error(e);
      triggerToast("Service Warning", "Offline generator called. Using stored local matches.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Unlock Milestone Achievements
  const unlockAchievement = (title: string, targetId: string = "alex") => {
    const updated = friends.map((f) => {
      if (f.id === targetId) {
        const alreadyHas = f.achievements.some((a) => a.title === title);
        if (alreadyHas) return f;

        const preset = ALL_ACHIEVEMENTS_LIST.find((item) => item.title === title);
        const newAch: Achievement = {
          id: `ach-unlocked-${Date.now()}`,
          title: title,
          description: preset?.description || "Completed landmark milestone",
          iconName: preset?.iconName || "Sparkles",
          dateAwarded: "2026-06-03"
        };
        appendLog(`🥇 Unlocked achievement: "${title}"!`);
        return {
          ...f,
          achievements: [...f.achievements, newAch]
        };
      }
      return f;
    });
    setFriends(updated);
  };

  // Claiming / unclaiming wishlist items
  const toggleClaimWishlistItem = (friendId: string, wishId: string) => {
    const updated = friends.map((friend) => {
      if (friend.id === friendId) {
        const updatedWishlist = friend.wishlist.map((wish) => {
          if (wish.id === wishId) {
            const currentlyClaimed = wish.isClaimed;
            return {
              ...wish,
              isClaimed: !currentlyClaimed,
              claimedBy: currentlyClaimed ? undefined : "Alex Patel (You)"
            };
          }
          return wish;
        });
        return { ...friend, wishlist: updatedWishlist };
      }
      return friend;
    });
    setFriends(updated);

    const fProfile = updated.find(f => f.id === friendId);
    if (fProfile) {
      const wish = fProfile.wishlist.find((w) => w.id === wishId);
      if (wish) {
        const stateMsg = wish.isClaimed ? "claimed" : "unclaimed";
        appendLog(`${stateMsg === "claimed" ? "🎁 Claimed" : "🔓 Released"} "${wish.title}" from ${fProfile.name}'s registry.`);
        triggerToast(
          `${wish.title}`,
          `Item marked as ${stateMsg}. Other synced friends can see this update on their lockers.`
        );

        if (wish.isClaimed) {
          unlockAchievement("Generous Giver", "alex");
        }
      }
    }
  };

  // Add custom wish to companion's wishlist
  const addWishlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim()) return;

    const newWish: WishlistItem = {
      id: `wish-${Date.now()}`,
      title: newItemTitle,
      price: newItemPrice || "N/A",
      url: newItemUrl || "",
      isClaimed: false
    };

    const isSelfWishlist = profileSubTab === "wishlist";
    const targetFriendId = isSelfWishlist ? "alex" : selectedFriendId;

    const updated = friends.map((f) => {
      if (f.id === targetFriendId) {
        return { ...f, wishlist: [...f.wishlist, newWish] };
      }
      return f;
    });

    const targetFriend = updated.find((f) => f.id === targetFriendId) || selectedFriend;

    setFriends(updated);
    appendLog(`Added item "${newItemTitle}" to ${targetFriend.name}'s desires directory.`);
    setNewItemTitle("");
    setNewItemPrice("");
    setNewItemUrl("");
    setIsAddingWish(false);
    triggerToast("Desire Saved", `Added to ${targetFriend.name}'s wishlist folder.`);

    const selfUser = updated.find((f) => f.id === "alex");
    if (selfUser && selfUser.wishlist.length >= 3) {
      unlockAchievement("Perfect Wishlist", "alex");
    }
  };

  // Edit existing wishlist item
  const saveEditedWishlistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWishTitle.trim()) return;

    const updated = friends.map((f) => {
      if (f.id === selectedFriendId) {
        const updatedWishlist = f.wishlist.map((wish) => {
          if (wish.id === editingWishId) {
            return {
              ...wish,
              title: editingWishTitle,
              price: editingWishPrice || "N/A",
              url: editingWishUrl
            };
          }
          return wish;
        });
        return { ...f, wishlist: updatedWishlist };
      }
      return f;
    });

    setFriends(updated);
    appendLog(`Updated wishlist item parameters for "${editingWishTitle}".`);
    setEditingWishId(null);
    triggerToast("Item Modified", "Saved updated values cleanly.");
  };

  const startEditingWishlistItem = (wish: WishlistItem) => {
    setEditingWishId(wish.id);
    setEditingWishTitle(wish.title);
    setEditingWishPrice(wish.price);
    setEditingWishUrl(wish.url);
  };

  const deleteWishlistItem = (wishId: string) => {
    const friendTarget = friends.find(f => f.id === selectedFriendId);
    const itemTarget = friendTarget?.wishlist.find(w => w.id === wishId);
    
    const updated = friends.map((f) => {
      if (f.id === selectedFriendId) {
        return {
          ...f,
          wishlist: f.wishlist.filter((w) => w.id !== wishId)
        };
      }
      return f;
    });
    setFriends(updated);
    appendLog(`Deleted item "${itemTarget?.title || 'Wish'}" from ${selectedFriend.name}'s registry.`);
    triggerToast("Item Deleted", "Removed item representation.");
  };

  // Edit Friend Profile details (CRM Registry mode)
  const handleSaveFriendProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFriendName.trim() || !editFriendBirthday) {
      triggerToast("Missing Fields", "Ensure you provide a name and birthday");
      return;
    }

    const updated = friends.map((f) => {
      if (f.id === selectedFriendId) {
        return {
          ...f,
          name: editFriendName,
          birthday: editFriendBirthday,
          relationship: editFriendRelationship,
          age: editFriendAge || "25",
          avatar: editFriendAvatar,
          phone: editFriendPhone,
          whatsapp: editFriendWhatsApp,
          email: editFriendEmail,
          snapchat: editFriendSnapchat
        };
      }
      return f;
    });

    setFriends(updated);
    setIsEditingFriend(false);
    appendLog(`Updated companion profile details for ${editFriendName}`);
    triggerToast("Profile Saved", `${editFriendName}'s configuration has been saved.`);
  };

  // --- CONNECT INTERACTIVE SYSTEM HANDLERS ---
  const hasFriendIdentity = (profile: any) => {
    const profileId = profile.id || profile.uid || profile.username;
    return friends.some((f) =>
      f.id === profileId ||
      f.id === profile.uid ||
      f.snapchat === profile.username ||
      f.name.toLowerCase() === profile.name.toLowerCase()
    );
  };

  const handleImportInitiate = (profile: MockProfile) => {
    // Check if duplicate Name exists to guard roster integrity
    if (hasFriendIdentity(profile)) {
      triggerToast("Already Synchronized 🤝", `${profile.name} has already been registered to your Circle roster.`);
      return;
    }
    setPendingConnectProfile(profile);
    setShowRelationModal(true);
  };

  const handlePostWishlistAutomatically = (friendId: string) => {
    const mockProf = getSearchableProfiles().find(p => p.id === friendId);
    if (!mockProf) return;

    setFriends(prev => {
      const alreadyHas = prev.find(f => f.id === friendId);
      if (!alreadyHas) return prev;
      return prev.map(f => {
        if (f.id === friendId) {
          return {
            ...f,
            connectedBack: true, // Simulated profile accepting the sent request
            wishlist: mockProf.wishlistToPost
          };
        }
        return f;
      });
    });

    setPostedLists(prev => {
      const next = { ...prev, [friendId]: true };
      localStorage.setItem("birthday_posted_wishlists", JSON.stringify(next));
      return next;
    });

    // Award achievement on first import post!
    unlockAchievement("Early Bird Reminded", "alex");

    const newNotif: InAppNotification = {
      id: `notif-${Date.now()}`,
      type: "birthday_list_posted",
      title: "🤝 Request Accepted!",
      message: `${mockProf.name} accepted your friend request and published their wishlist! Check out their desires.`,
      friendId: friendId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    setNotifications(prev => {
      const next = [newNotif, ...prev];
      localStorage.setItem("birthday_in_app_notifications", JSON.stringify(next));
      return next;
    });

    appendLog(`📢 Notification: ${mockProf.name} accepted friend request and published their birthday list with ${mockProf.wishlistToPost.length} gift items.`);
    triggerToast("Wishlist Posted! 📣", `${mockProf.name} just published their wishlist. Tap to see.`);
  };

  const handleConnectAndSave = async (relationshipType: string) => {
    if (!pendingConnectProfile) return;
    const profile = pendingConnectProfile;

    if ((profile as any).localOnly || (profile as any).notOnHbd) {
      const localContact: SyncedContact = {
        id: `local-${(profile as any).username || Date.now().toString()}`,
        name: profile.name || "Demo Buddy",
        phone: (profile as any).phone || "",
        email: (profile as any).email || "",
        birthday: (profile as any).birthday || "",
        avatar: (profile as any).avatar || "bg-indigo-500",
        source: "QR Simulator"
      };
      handleImportLocalContact(localContact);
      setShowRelationModal(false);
      setPendingConnectProfile(null);
      return;
    }

    // Free account friend limit check
    const companionCount = friends.filter(f => f.id !== "alex").length;
    if (accountType === "Free" && companionCount >= 5) {
      setShowUpgradePromptModal(true);
      triggerToast("Friend Limit Reached 👑", "Free account tier is capped at 5 additions. Upgrade for unlimited!");
      setShowRelationModal(false);
      setPendingConnectProfile(null);
      return;
    }

    const nextId = profile.id;
    if (hasFriendIdentity(profile)) {
      triggerToast("Request Already Sent", `${profile.name} is already connected or waiting for acceptance.`);
      setShowRelationModal(false);
      setPendingConnectProfile(null);
      return;
    }
    const newFriend: Friend = {
      id: nextId,
      name: profile.name,
      birthday: profile.birthday,
      relationship: relationshipType, // Can be "Configure Later"
      age: profile.age,
      interests: profile.interests,
      avatar: profile.avatar,
      wishlist: [], // EMPTY initially!
      achievements: [],
      phone: profile.phone || "",
      snapchat: profile.username || "",
      connectedBack: false,
      incomingRequest: false,
      requestType: "friend_request"
    };

    setFriends(prev => [...prev, newFriend]);
    appendLog(`🕒 Request Sent: Friend request sent to ${profile.name} (Relation: ${relationshipType})`);

    // Persist to our own Firestore roster if logged in
    if (userSession?.uid) {
      try {
        await setDoc(doc(db, "users", userSession.uid, "friends", nextId), newFriend, { merge: true });
      } catch (e) {
        console.error("Error saving pending friend request to own roster:", e);
      }
    }

    // Write real request to recipient if they are a registered user
    const matchingRealUser = registryUsers.find(r => r.username === profile.username || r.uid === profile.id);
    const recipientUid = matchingRealUser?.uid;

    if (recipientUid && recipientUid !== userSession?.uid) {
      try {
        const outFriendData = {
          id: userSession.uid,
          name: userSession.name || "A Co-celebrant",
          birthday: userSession.birthday || "",
          relationship: "Registry Connection",
          age: (userSession as any).age || "25",
          interests: userSession.interests || ["Gifts", "Parties"],
          avatar: userSession.avatar || "bg-indigo-600",
          wishlist: [],
          achievements: [],
          phone: (userSession as any).phone || "",
          connectedBack: false,
          incomingRequest: true,
          requestType: "friend_request"
        };
        await setDoc(doc(db, "users", recipientUid, "friends", userSession.uid), outFriendData, { merge: true });
        
        // Also add a friendly notification for them
        await setDoc(doc(db, "users", recipientUid, "notifications", `notif-${Date.now()}`), {
          id: `notif-${Date.now()}`,
          type: "system",
          recipientUid,
          title: "📥 New Friend Request!",
          message: `${userSession.name} sent you a buddy request sync!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          senderUid: userSession.uid
        });
      } catch (err) {
        console.error("Error setting multi-directional friend request:", err);
      }
    } else {
      appendLog(`🕒 Sandbox Simulation: Sent request to simulated buddy ${profile.name}. Outstanding accepting token generated.`);
    }

    setShowRelationModal(false);
    setPendingConnectProfile(null);

    triggerToast(
      "Request Sent! ✉️",
      `Friend request sent to ${profile.name}. Pending acceptance.`
    );
  };

  const handleAcceptFriendRequest = async (f: Friend) => {
    // 1. Update our local state
    setFriends(prev => prev.map(p => p.id === f.id ? { ...p, connectedBack: true } : p));
    
    // 2. If they are a registered user, update both rosters to accepted!
    const matchingRealUser = registryUsers.find(r => r.username === f.id || r.uid === f.id);
    const recipientUid = matchingRealUser?.uid || f.id;
    if (recipientUid && recipientUid !== "alex" && userSession?.uid) {
      try {
        // Update our own friend document in Firestore
        await setDoc(doc(db, "users", userSession.uid, "friends", recipientUid), {
          connectedBack: true
        }, { merge: true });

        // Update recipient's document in Firestore of us
        await setDoc(doc(db, "users", recipientUid, "friends", userSession.uid), {
          connectedBack: true
        }, { merge: true });
        
        // Also add a friendly notification for them!
        await setDoc(doc(db, "users", recipientUid, "notifications", `notif-${Date.now()}`), {
          id: `notif-${Date.now()}`,
          type: "system",
          recipientUid,
          title: "🤝 Friend Request Accepted!",
          message: `${userSession.name || "A buddy"} agreed to be friends and is now linked to your circles!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isRead: false,
          senderUid: userSession.uid
        });
      } catch (e) {
        console.error("Error setting multi-directional friend agreement:", e);
      }
    }
    
    triggerToast("Request Accepted 🤝", `You are now connected with ${f.name}!`);
    appendLog(`🤝 Accepted friend request from ${f.name}`);
  };

  const handleDeclineFriendRequest = async (f: Friend) => {
    setFriends(prev => prev.filter(p => p.id !== f.id));
    
    // Delete the incoming request from our Firestore as well
    if (userSession?.uid) {
      try {
        await deleteDoc(doc(db, "users", userSession.uid, "friends", f.id));
      } catch (e) {
        console.error("Error deleting friend request:", e);
      }
    }
    
    triggerToast("Request Declined", `Friend request from ${f.name} was declined.`);
    appendLog(`❌ Declined friend request from ${f.name}`);
  };

  const handleSimulateAccept = (f: Friend) => {
    // Determine the simulated registry/profile
    const mockProf = getSearchableProfiles().find(p => p.id === f.id || p.username === f.snapchat);
    const wishlistToLoad = mockProf?.wishlistToPost || [];

    setFriends(prev => prev.map(p => {
      if (p.id === f.id) {
        return {
          ...p,
          connectedBack: true,
          wishlist: wishlistToLoad
        };
      }
      return p;
    }));

    triggerToast("Mock Accepted! 🤝", `${f.name} simulated profile has formally accepted your request!`);
    appendLog(`🤝 Simulation Handshake: ${f.name} accepted your friend request and posted a wishlist of ${wishlistToLoad.length} items.`);
  };

  // Timer runner
  useEffect(() => {
    const activeTimers = Object.entries(pendingPostingTimers);
    if (activeTimers.length === 0) return;

    const interval = setInterval(() => {
      setPendingPostingTimers(prev => {
        const next = { ...prev };
        let didUpdate = false;

        Object.keys(next).forEach(friendId => {
          if (next[friendId] > 1) {
            next[friendId] -= 1;
            didUpdate = true;
          } else {
            delete next[friendId];
            didUpdate = true;
            // Run on timeout
            setTimeout(() => {
              handlePostWishlistAutomatically(friendId);
            }, 10);
          }
        });

        return didUpdate ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pendingPostingTimers]);

  // Add new friend to list
  const handleCreateFriend = (e: React.FormEvent) => {
    e.preventDefault();

    // Check Freemium tier constraints
    const companionCount = friends.filter(f => f.id !== "alex").length;
    if (accountType === "Free" && companionCount >= 5) {
      setShowUpgradePromptModal(true);
      triggerToast("Friend Limit Reached 👑", "Free account tier is capped at 5 additions. Upgrade for unlimited!");
      setShowAddProfile(false);
      return;
    }

    if (!newFriendName.trim() || !newFriendBirthday) {
      triggerToast("Missing Fields", "Please make sure you provide a name and birthday.");
      return;
    }

    const nextId = newFriendName.toLowerCase().replace(/\s+/g, "-");
    const avatarBackgrounds = ["bg-teal-500", "bg-emerald-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-pink-500"];
    const randomBg = avatarBackgrounds[Math.floor(Math.random() * avatarBackgrounds.length)];

    const interestArr = newFriendInterestsText
      ? newFriendInterestsText.split(",").map((s) => s.trim()).filter(Boolean)
      : ["Camera Decor", "Coffee Specialties", "Indie Music"];

    const newFriend: Friend = {
      id: nextId,
      name: newFriendName,
      birthday: newFriendBirthday,
      relationship: newFriendRelationship,
      age: newFriendAge || "25",
      interests: interestArr,
      avatar: randomBg,
      wishlist: [],
      achievements: [],
      phone: newFriendPhone.trim() || "+233241234567",
      whatsapp: newFriendWhatsApp.trim() || "+233241234567",
      email: newFriendEmail.trim() || "friend@example.com",
      snapchat: newFriendSnapchat.trim() || "friend_snap",
      connectedBack: newFriendConnectedBack
    };

    setFriends([...friends, newFriend]);
    appendLog(`Added a new Buddy Profile: ${newFriendName} (Relationship: ${newFriendRelationship})`);
    
    // reset form fields
    setNewFriendName("");
    setNewFriendBirthday("");
    setNewFriendAge("25");
    setNewFriendInterestsText("");
    setNewFriendPhone("");
    setNewFriendWhatsApp("");
    setNewFriendEmail("");
    setNewFriendSnapchat("");
    setNewFriendConnectedBack(false);
    setIsQrScannerActive(false);
    setShowAddProfile(false);
    setSelectedFriendId(nextId);
    
    triggerToast(
      "Buddy Welcomed!",
      `${newFriendName} is added. Open the AI lab section to connect.`
    );
  };

  // Delete buddy completely
  const handleDeleteFriendProfile = (friendId: string) => {
    if (friendId === "alex") {
      triggerToast("Forbidden", "You cannot delete your own profile.");
      return;
    }
    const target = friends.find(f => f.id === friendId);
    if (window.confirm(`Are you sure you want to delete ${target?.name} from your dashboard circles?`)) {
      const remaining = friends.filter(f => f.id !== friendId);
      setFriends(remaining);
      appendLog(`Deleted companion profile: ${target?.name}`);
      setSelectedFriendId(remaining[0]?.id || "alex");
      triggerToast("Buddy Removed", `${target?.name} has been deleted.`);
    }
  };

  // Manage companion interests/tags
  const handleAddInterestTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInterest.trim()) return;

    const updated = friends.map((f) => {
      if (f.id === selectedFriendId) {
        if (!f.interests.includes(customInterest.trim())) {
          return {
            ...f,
            interests: [...f.interests, customInterest.trim()]
          };
        }
      }
      return f;
    });

    setFriends(updated);
    appendLog(`Tagged ${selectedFriend.name} with: #${customInterest.trim()}`);
    setCustomInterest("");
    triggerToast("Tag Added", `Saved hobby indicator: #${customInterest}`);
  };

  const handleRemoveInterestTag = (tagToRemove: string) => {
    const updated = friends.map((f) => {
      if (f.id === selectedFriendId) {
        return {
          ...f,
          interests: f.interests.filter(tag => tag !== tagToRemove)
        };
      }
      return f;
    });
    setFriends(updated);
    appendLog(`Removed tag #${tagToRemove} from ${selectedFriend.name}.`);
    triggerToast("Tag Removed", `Removed interest modifier.`);
  };

  // Quick Action to directly save an AI recommendation into selected user's wishlist
  const saveAiSuggestionToWishlist = (gift: GiftSuggestion) => {
    const newWish: WishlistItem = {
      id: `wish-${Date.now()}`,
      title: gift.name,
      price: gift.estimatedPrice || "$40.00",
      url: "https://example.com/gift-finder",
      isClaimed: false
    };
    
    const updated = friends.map(f => {
      if (f.id === selectedFriend.id) {
        return { ...f, wishlist: [...f.wishlist, newWish] };
      }
      return f;
    });
    setFriends(updated);
    appendLog(`Linked AI Choice "${gift.name}" into ${selectedFriend.name}'s registry.`);
    triggerToast("Wishlist Synced", "Saved AI choice directly into companion wishlist.");
  };

  // Clear log history
  const handleClearLogs = () => {
    const freshLogs = [`[${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}] Workspace record feed initialized.`];
    setLogs(freshLogs);
    localStorage.setItem("birthday_activity_logs", JSON.stringify(freshLogs));
    triggerToast("Logs Audited", "Record ledger reset successfully.");
  };

  // Filter buddies list according to query and relationship group
  const getFilteredFriends = () => {
    return friends.filter(friend => {
      if (friend.id === "alex") return false;
      if (friend.connectedBack !== true) return false;
      const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            friend.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterRelationship === "All" || friend.relationship === filterRelationship;
      return matchesSearch && matchesCategory;
    });
  };

  const sortedUpcoming = getUpcomingSorted();
  const activeGiftPools = sortedUpcoming.filter((f) => f.id !== "alex");
  const nextTarget = sortedUpcoming.find((f) => f.id !== "alex") || sortedUpcoming[0] || { id: "", name: "No buddies yet", birthday: "2026-01-01", relationship: "", age: "0", avatar: "bg-slate-400", wishlist: [], achievements: [], interests: [] };
  const nextTargetDays = nextTarget ? calculateDaysRemaining(nextTarget.birthday) : 0;

  // Statistics summaries for executive deck
  const totalBuddiesCount = friends.filter(f => f.id !== "alex" && f.connectedBack === true).length;
  const claimedWishesCount = friends.reduce((sum, f) => {
    return sum + f.wishlist.filter(w => w.isClaimed).length;
  }, 0);
  const totalWishesCount = friends.reduce((sum, f) => {
    return sum + f.wishlist.length;
  }, 0);
  const unlockLevel = (friends.find(f => f.id === 'alex')?.achievements.length || 0) * 2 + 1;

  if (authLoading || splashVisible) {
    return (
      <div 
        className={`w-full min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center p-4 relative overflow-hidden transition-opacity duration-[600ms] ease-in-out z-[9999] ${
          splashFadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
        id="hbd-splash-screen"
      >
        <div className="flex flex-col items-center gap-4 text-center select-none">
          <BrandTypingLogo />
        </div>
      </div>
    );
  }

  if (!userSession) {
    if (isLoggingIn) {
      return (
        <LoginPage 
          onLogin={(session) => {
            localStorage.setItem("birthday_authenticated_user", JSON.stringify(session));
            setUserSession(session);
            setActiveSection("dashboard");
          }}
          onGoToSignUp={() => setIsLoggingIn(false)}
          triggerToast={triggerToast}
        />
      );
    }

    return (
      <SignUpFlow
        onComplete={(session) => {
          localStorage.setItem("birthday_authenticated_user", JSON.stringify(session));
          setUserSession(session);
          setActiveSection("dashboard");
          triggerToast("Welcome to HBD! 🎉", `Account created for ${session.name}!`);
        }}
        onGoToLogin={() => setIsLoggingIn(true)}
        triggerToast={triggerToast}
      />
    );
  }

  // Mandatory gating onboarding process collects and validates a unique username, DOB, and phone number
  const isOnboardingIncomplete = userSession && (
    !userSession.username || 
    !userSession.birthday || 
    !(userSession as any).phone
  );

  if (isOnboardingIncomplete) {
    return (
      <MandatoryOnboarding
        userSession={userSession as any}
        onComplete={(updatedSession) => {
          localStorage.setItem("birthday_authenticated_user", JSON.stringify(updatedSession));
          setUserSession(updatedSession);
          setActiveSection("dashboard");
        }}
        triggerToast={triggerToast}
      />
    );
  }

  return (
    <div className="w-full h-screen h-dvh overflow-hidden bg-[#FDFBF7] flex flex-col lg:flex-row font-sans text-slate-800" id="hbd-app-root">
      
      {/* Toast Alert Prompt Overlay */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 right-6 left-6 md:left-auto md:w-96 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-white/10 z-50 flex items-start gap-3 text-left"
            id="global-toast-el"
          >
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h5 className="font-bold text-xs text-indigo-400 uppercase tracking-widest">{toastTitle}</h5>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">{toastMessage}</p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-zinc-500 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WORKSPACE LEFT VERTICAL SIDEBAR NAVIGATION PANEL */}
      <aside className="hidden lg:flex w-72 bg-slate-900 text-slate-200 flex-col justify-between shrink-0 border-r border-slate-850 shadow-xl" id="sidebar-panel">
        <div>
          {/* Workspace Branding Header */}
          <div className="p-6 border-b border-slate-800" id="sidebar-title-cell">
            <div className="flex flex-col justify-center items-start">
              <div className="w-full flex justify-start items-center">
                <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", backgroundColor: "transparent" }}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" style={{ width: "36px", height: "36px", display: "block" }} fill="none">
                    <rect x="12" y="15" width="14" height="70" rx="7" fill="url(#hbdLoopGradSide)" />
                    <rect x="74" y="15" width="14" height="70" rx="7" fill="url(#hbdLoopGradSide)" />
                    <path d="M 19,50 C 30,15 40,85 50,50 C 60,15 70,85 81,50 C 70,15 60,85 50,50 C 40,15 30,85 19,50 Z" fill="none" stroke="url(#hbdLoopGradSide)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
                    <defs>
                      <linearGradient id="hbdLoopGradSide" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF4D00" />
                        <stop offset="100%" stopColor="#7C3AED" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, textAlign: "left" }}>
                    <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "22px", fontWeight: 900, letterSpacing: "2px", color: "#0F172A" }}>HBD<span style={{ color: "#FF4D00" }}>LOOP</span></span>
                    <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif", fontSize: "8px", fontWeight: 700, letterSpacing: "1px", color: "#6B7280", textTransform: "uppercase", marginTop: "1px" }}>Automated Gifting Engine</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold tracking-normal mt-3 px-1 text-left leading-snug">The Recurring Milestone &amp; Gifting Network.</p>
            </div>

            {/* Desktop clock widget showing mocked benchmark */}
            <div className="mt-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-left flex justify-between items-center bg-opacity-40">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-[11px] font-mono text-zinc-300 font-semibold uppercase tracking-wide">June 3, 2026</span>
              </div>
              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase">Active</span>
            </div>

            {/* Dynamic Authenticated Session Display Desk */}
            {userSession && (
              <div className="mt-3.5 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 flex items-center justify-between shadow-inner">
                <div className="flex items-center gap-2 min-w-0 font-sans">
                  <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs text-white shrink-0 ${userSession.avatar}`}>
                    {userSession.name.split(" ").map(n => n[0]).join("")}
                  </span>
                  <div className="min-w-0">
                    <span className="text-xs font-black text-white block truncate leading-tight">{userSession.name}</span>
                    <span className="text-[10px] text-indigo-400 block truncate font-mono">@{userSession.username}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem("birthday_authenticated_user");
                    setUserSession(null);
                    triggerToast("Logged Out Successfully ✅", "Session closed. Reverted workspace to default Guest Profile.");
                  }}
                  className="bg-slate-900 hover:bg-rose-950/30 text-zinc-400 hover:text-rose-400 font-black text-[9px] p-1.5 px-2.5 rounded-lg border border-slate-800 transition cursor-pointer shrink-0"
                  title="Switch and Logout current user details"
                >
                  Logout
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links Group */}
          <nav className="p-4 space-y-1.5 text-left" id="sidebar-navigation">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-3 py-1.5 block">Navigation</p>

            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeSection === "dashboard"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </button>

            <button
              onClick={() => setActiveSection("registry")}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeSection === "registry"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Buddies</span>
              <span className="ml-auto bg-slate-800 text-[10px] px-2 py-0.5 rounded text-indigo-300 font-mono">
                {friends.filter(f => f.id !== "alex" && f.connectedBack === false && f.incomingRequest === true).length || ""}
              </span>
            </button>



            <button
              onClick={() => setActiveSection("gift-store")}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeSection === "gift-store"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Gift className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>Gifts</span>
            </button>

            <button
              onClick={() => {
                setProfileSubTab("profile");
                setActiveSection("profile");
              }}
              className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-3 ${
                activeSection === "profile"
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/30 font-extrabold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <User className="w-4 h-4 text-sky-400" />
              <span>Profile</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Details */}
        <div className="pt-7 pb-4 px-4 border-t border-slate-800/60 text-slate-500 text-[10.5px]" id="sidebar-footer">
          <p className="font-semibold text-slate-400">Scheduled Landmark</p>
          <div className="flex justify-between items-center mt-1">
            <span className="truncate">{nextTarget.name}</span>
            <span className="font-semibold text-indigo-400">In {nextTargetDays}d</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 min-h-0 flex flex-col min-w-0 pb-28 lg:pb-0 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-y-auto ios-scroll-safe" id="main-canvas-wrapper">
        
        {/* TOP STATUS BAR ROW */}
        <header className={`bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3 justify-between items-center gap-3 z-10 text-left relative ${activeSection === "dashboard" ? "flex flex-row" : "hidden"}`} id="main-workspace-header">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-semibold text-slate-900 tracking-tight">
              Hey, {userSession ? userSession.name.split(" ")[0] : "Buddy"} 👋
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {accountType === "Free" && (
              <button
                type="button"
                onClick={() => setActiveSection("upgrade")}
                className="h-9 px-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 rounded-lg text-xs font-semibold hover:from-amber-500 hover:to-amber-600 transition-all shadow-xs inline-flex items-center justify-center w-auto cursor-pointer"
                id="header-premium-badge"
              >
                Upgrade
              </button>
            )}
            <button
              onClick={() => {
                setShowAddProfile(true);
                setIsQrScannerActive(false);
              }}
              className="h-9 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 shadow-xs transition-all w-auto cursor-pointer"
              id="header-profile-add-btn"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>New Buddy</span>
            </button>
            <button
              onClick={() => setShowNotificationDrawer(true)}
              className="relative w-9 h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center border border-slate-200"
              title="Open Notification Feed"
              id="notification-bell-btn"
            >
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-rose-600 text-[10px] font-semibold text-white rounded-full flex items-center justify-center px-1">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* MODAL DIALOG POPUP: Create New Buddy Profile */}
        <AnimatePresence>
          {showAddProfile && (
            <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-100 shadow-2xl relative text-left"
                id="create-friend-dialog-card"
              >
                <button 
                  onClick={() => setShowAddProfile(false)} 
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2.5 mb-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">New Birthday Circle Bud</h3>
                    <p className="text-xs text-slate-500">Add an interactive companion card to monitor registries</p>
                  </div>
                </div>

                {/* Primary Camera/Simulation QR Handshake Trigger */}
                <div className="mb-4">
                  {!isQrScannerActive ? (
                    <button
                      type="button"
                      onClick={() => setIsQrScannerActive(true)}
                      className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-750 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer border border-indigo-500/10 active:scale-95"
                    >
                      <Camera className="w-4 h-4 text-indigo-200" />
                      <span>Scan Buddy profile QR card</span>
                      <span className="bg-indigo-500 text-[8.5px] uppercase font-mono tracking-widest px-1.5 py-0.5 rounded-full text-indigo-100 shrink-0 font-extrabold">Instant</span>
                    </button>
                  ) : (
                    <QrScanner
                      onScan={(scannedProfile) => {
                        const mockProf: MockProfile = {
                          id: scannedProfile.uid || scannedProfile.username || `scanned_${Date.now()}`,
                          name: scannedProfile.name || scannedProfile.username || "Scanned Contact",
                          username: scannedProfile.username || "",
                          phone: "",
                          birthday: "",
                          age: "",
                          avatar: "bg-teal-500",
                          interests: [],
                          wishlistToPost: []
                        };
                        setPendingConnectProfile(mockProf);
                        setShowRelationModal(true);
                        setShowAddProfile(false);
                        setIsQrScannerActive(false);
                        triggerToast("QR Profile Scanned! ✨", `Choose relationship style with ${mockProf.name}.`);
                        appendLog(`🍀 Scanned profile QR card: pending request prepared for ${mockProf.name}.`);
                      }}
                      onClose={() => setIsQrScannerActive(false)}
                    />
                  )}
                </div>
              </motion.div>
            </div>
          )}

          {/* ==================== MODAL DIALOG POPUP: FREEMIUM CAPACITY ALERT ==================== */}
          {showUpgradePromptModal && (
            <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full border border-slate-100 shadow-2xl relative text-left space-y-4"
                id="upgrade-limit-dialog-card"
              >
                <button 
                  onClick={() => setShowUpgradePromptModal(false)} 
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">👑 Expand Companion Capacity</h3>
                    <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Free Plan Maximum Limit Reached</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-sans mt-2">
                  Standard Free accounts are limited to tracking a maximum of <strong>5 friends</strong>. Upgrade to our signature <strong>Pro VIP plan (GHS 15/month)</strong> to unlock:
                </p>

                <ul className="text-xs space-y-1.5 pl-1 font-semibold">
                  <li className="flex items-center gap-2 text-indigo-950 font-bold">
                    <span className="text-indigo-500 text-sm">✦</span>
                    <span>Track Infinite Companions &amp; Circles</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-500 text-xs">✦</span>
                    <span>Automated warnings 7-days &amp; 1-day prior</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-indigo-500 text-xs">✦</span>
                    <span>Automated Email notifications &amp; briefings</span>
                  </li>
                </ul>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[10px] text-slate-500 italic">
                  * Ghana sandbox gateway parses instant mobile credits (no physical card charges required).
                </div>

                <div className="flex flex-col gap-2 pt-1 font-sans">
                  <button
                    onClick={() => {
                      setShowUpgradePromptModal(false);
                      setAccountType("Pro");
                      setActiveSection("upgrade");
                      triggerToast("Upgraded successfully! 👑", "Infinite slots unlocked. Active alert configurations updated.");
                      appendLog("💳 Transaction: Member plan upgraded to Pro VIP (GHS 15.00/month) via limit dialog.");
                    }}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-lg shadow-indigo-150 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Upgrade to Pro VIP (GHS 15)</span>
                    <span className="text-sm">&rarr;</span>
                  </button>
                  <button
                    onClick={() => setShowUpgradePromptModal(false)}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-605 font-bold rounded-xl text-[10.5px] transition cursor-pointer text-center"
                  >
                    Keep 5 buddies for now
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* ==================== MODAL DIALOG POPUP: SEND Simulated GIFT ==================== */}
          {showSendGiftModal && selectedGiftItem && (
            <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[2rem] p-6 md:p-8 max-w-sm w-full border border-slate-100 shadow-2xl relative text-left space-y-3.5"
                id="send-gift-simulator-card"
              >
                <button 
                  onClick={() => setShowSendGiftModal(false)} 
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Gift className="w-5 h-5 animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">🚢 Send simulated Gift Package</h3>
                    <p className="text-[10px] text-indigo-500 font-semibold">{selectedGiftItem.friendName}&#39;s Wishlist Simulator</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-left space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block font-sans">Selected Desire Tag</span>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-extrabold text-xs text-slate-800 leading-tight block truncate max-w-[200px]">{selectedGiftItem.title}</span>
                    <span className="font-black text-xs text-emerald-600 whitespace-nowrap">{selectedGiftItem.price}</span>
                  </div>
                </div>

                {/* Simulated Delivery Logistics Configuration */}
                <div className="space-y-3 font-sans">
                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-450 uppercase mb-1">Simulated shipment agency or carrier</label>
                    <select 
                      id="logistics-carrier-field"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs focus:ring-1 focus:ring-indigo-300 focus:outline-none"
                    >
                      <option value="DHS Post Office">DHS Post Office (Simulated Ghana Post)</option>
                      <option value="Deliver in Person">Interactive Meetup (Hand Delivery)</option>
                      <option value="FediEX Express Courier">FediEX Express Courier (Simulated Courier)</option>
                      <option value="Voucher Code Direct SMS">Digital Gift Card Voucher code (Direct SMS/Inbox)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9.5px] font-bold text-slate-450 mb-1">Interactive Wrap Styling theme</label>
                    <select 
                      id="wrap-styling-field"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.8 text-xs focus:ring-1 focus:ring-indigo-300 focus:outline-none font-semibold"
                    >
                      <option value="Cosmic Slate Simple">Cosmic Slate Simple Design Theme</option>
                      <option value="Lavender Velvet Knot">Lavender Velvet Knot (High Craft)</option>
                      <option value="Yellow Solar Orbit Sparkle">Yellow Solar Orbit Sparkle (Warm tone)</option>
                      <option value="Retro Polka Dot Cardboard">Retro Polka Dot Cardboard Wrap</option>
                    </select>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-450 italic mt-1 leading-normal font-sans">
                  * Submitting claims simulated bookings: It reserves the selection, locks claims, and updates milestones.
                </div>

                <div className="flex gap-2 pt-1 font-sans">
                  <button
                    onClick={() => {
                      const carrier = (document.getElementById("logistics-carrier-field") as HTMLSelectElement)?.value || "Meetup Delivery";
                      const wrap = (document.getElementById("wrap-styling-field") as HTMLSelectElement)?.value || "Simple Slate";
                      
                      // Claim in state!
                      const friendId = selectedGiftItem.friendId;
                      const wishId = selectedGiftItem.wishId;
                      
                      const updated = friends.map(f => {
                        if (f.id === friendId) {
                          return {
                            ...f,
                            wishlist: f.wishlist.map(wish => {
                              if (wish.id === wishId) {
                                return { ...wish, isClaimed: true };
                              }
                              return wish;
                            })
                          };
                        }
                        return f;
                      });

                      setFriends(updated);
                      setShowSendGiftModal(false);
                      triggerToast("Gift Selection Dispatched! 🚢", `Successfully purchased ${selectedGiftItem.title} wrapped with ${wrap}! Sent via ${carrier}.`);
                      appendLog(`🚢 Sandbox Ship: Ordered "${selectedGiftItem.title}" (${selectedGiftItem.price}) for ${selectedGiftItem.friendName}. Shipment logistics set to ${carrier} using ${wrap}.`);
                      unlockAchievement("Generous Giver", "alex");
                    }}
                    className="flex-1 py-2.5 bg-indigo-650 hover:bg-indigo-505 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-lg shadow-indigo-150 cursor-pointer text-center"
                  >
                    Confirm Dispatch 🎁
                  </button>
                  <button
                    onClick={() => setShowSendGiftModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* MODAL DIALOG POPUP: Select Relationship on Connection */}
          {showRelationModal && pendingConnectProfile && (
            <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-slate-150 shadow-2xl relative text-left"
                id="relation-chooser-dialog-card"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Define Relationship Accent</h3>
                    <p className="text-xs text-slate-500">How do you know {pendingConnectProfile.name}?</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Establish a category for <strong>{pendingConnectProfile.name}</strong> to configure notifications and organize your deck, or configure it later yourself.
                </p>

                <div className="space-y-2">
                  {[
                    { type: "Best Friend", desc: "For priority locket view & immediate alerts" },
                    { type: "College Buddy", desc: "For reunion updates and school ties" },
                    { type: "Work Colleague", desc: "For synchronized professional calendars" },
                    { type: "Family Relative", desc: "For core celebration alarms and card tags" },
                    { type: "Gym Partner", desc: "For workout milestone syncing and health desires" }
                  ].map(rel => (
                    <button
                      key={rel.type}
                      onClick={() => handleConnectAndSave(rel.type)}
                      className="w-full text-left p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-indigo-400 transition-all font-semibold text-xs flex justify-between items-center group cursor-pointer"
                    >
                      <div>
                        <span className="text-slate-900 font-bold block">{rel.type}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">{rel.desc}</span>
                      </div>
                      <span className="text-[10px] text-indigo-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">Select &rarr;</span>
                    </button>
                  ))}

                  <button
                    onClick={() => handleConnectAndSave("Configure Later")}
                    className="w-full text-center py-2.5 rounded-xl text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors cursor-pointer mt-2"
                  >
                    Configure later yourself
                  </button>

                  <button
                    onClick={() => {
                      setShowRelationModal(false);
                      setPendingConnectProfile(null);
                    }}
                    className="w-full text-center py-2 text-xs font-bold text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
                  >
                    Cancel Connection
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* MODAL DIALOG POPUP: Interactive Address Book Simulator fallback */}
          {showContactSimulator && (
            <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full border border-slate-150 shadow-2xl relative text-left flex flex-col max-h-[90vh]"
                id="contact-simulator-modal"
              >
                <button
                  onClick={() => setShowContactSimulator(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-3 mb-4 shrink-0">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Virtual Device Contacts Picker</h3>
                    <p className="text-xs text-slate-500">Pick companions from your mock sim-phone status cache</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed shrink-0">
                  Select which contacts you would like to synchronize from your phonebook address deck, or customize their parameters below:
                </p>

                {/* Simulated Custom Contact Creator Form */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 mb-4 space-y-3 shrink-0">
                  <span className="text-[10px] font-black uppercase text-indigo-800 tracking-wider block">Add Custom Simulated Contact</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[9px] text-slate-500 font-semibold mb-1">Full Name</label>
                      <input
                        type="text"
                        id="sim-new-name"
                        placeholder="John Doe"
                        className="w-full bg-white border border-slate-205 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-semibold mb-1">Phone Number</label>
                      <input
                        type="text"
                        id="sim-new-phone"
                        placeholder="+233..."
                        className="w-full bg-white border border-slate-205 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] text-slate-500 font-semibold mb-1">Birthday</label>
                      <input
                        type="date"
                        id="sim-new-bday"
                        className="w-full bg-white border border-slate-205 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => {
                        const nameEl = document.getElementById("sim-new-name") as HTMLInputElement;
                        const phoneEl = document.getElementById("sim-new-phone") as HTMLInputElement;
                        const bdayEl = document.getElementById("sim-new-bday") as HTMLInputElement;
                        
                        if (!nameEl?.value.trim()) {
                          triggerToast("Missing Name", "Simulated contact must have a name.");
                          return;
                        }
                        
                        const newContact = {
                          name: nameEl.value.trim(),
                          phone: phoneEl?.value.trim() || "+233240001122",
                          email: `${nameEl.value.trim().toLowerCase().replace(/\s+/g, "")}@example.com`,
                          birthday: bdayEl?.value || "",
                          avatar: "bg-teal-500",
                          source: "Manual Sim"
                        };
                        
                        handleImportedContacts([newContact]);
                        setShowContactSimulator(false);
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[10px] rounded-lg transition-all"
                    >
                      Insert & Sync
                    </button>
                  </div>
                </div>

                {/* Preset List option behind button to avoid initial mockups */}
                {!showMockList ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-center shrink-0">
                    <p className="text-[11px] text-slate-500 mb-2 font-medium">
                      Need pre-constructed profiles to test? You can load virtual sandbox companions.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowMockList(true)}
                      className="px-4 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 font-extrabold text-[10px] rounded-lg hover:bg-indigo-110 transition cursor-pointer"
                    >
                      💡 Load Sandbox Contact Presets
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-y-auto space-y-2 border border-slate-100 rounded-2xl p-2 bg-slate-50/50 mb-4 max-h-[160px]">
                      {[
                        { name: "Benjamin Quansah", phone: "+233246781234", email: "ben@example.com", birthday: "1994-11-12", avatar: "bg-indigo-500" },
                        { name: "Eunice Mensah", phone: "+233551122334", email: "eunice.m@example.com", birthday: "1997-04-18", avatar: "bg-emerald-500" },
                        { name: "Kofi Boateng", phone: "+233209876543", email: "kofi@example.com", birthday: "1996-03-02", avatar: "bg-amber-500" },
                        { name: "Abena Pokua", phone: "+233271239876", email: "abena@hbd.app", birthday: "1999-08-21", avatar: "bg-teal-500" },
                        { name: "Sena Tsikata", phone: "+233243110984", email: "sena@example.com", birthday: "1995-12-14", avatar: "bg-rose-500" },
                        { name: "Sylvester Tetteh", phone: "+233544009988", email: "sly@example.com", birthday: "1998-07-06", avatar: "bg-pink-500" },
                        { name: "Araba Attah", phone: "+233261234567", email: "araba.attah@example.com", birthday: "1997-01-30", avatar: "bg-purple-500" },
                        { name: "Kwame Nkrumah Jr", phone: "+233241857390", email: "kwame.nk@example.com", birthday: "2000-09-21", avatar: "bg-orange-500" }
                      ].map((c, i) => {
                        const isSelected = syncedContacts.some(sc => sc.name === c.name || sc.phone === c.phone);
                        return (
                          <div
                            key={i}
                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-3xs"
                          >
                            <div className="flex items-center gap-2.5">
                              <span className={`w-8 h-8 rounded-lg text-[10px] text-white font-bold flex items-center justify-center ${c.avatar}`}>
                                {c.name.split(" ").map(n => n[0] || "").join("")}
                              </span>
                              <div>
                                <span className="text-xs font-bold text-slate-800 block">{c.name}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">{c.phone} &bull; {c.birthday}</span>
                              </div>
                            </div>
                            {isSelected ? (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                Synced
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  handleImportedContacts([{
                                    name: c.name,
                                    phone: c.phone,
                                    email: c.email,
                                    birthday: c.birthday,
                                    avatar: c.avatar,
                                    source: "Address Book Sim"
                                  }]);
                                  setShowContactSimulator(false);
                                }}
                                className="text-[9px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1 rounded-md transition-all active:scale-95 cursor-pointer"
                              >
                                Sync Single
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Import All Preset Button */}
                    <div className="flex gap-2 shrink-0 mb-4">
                      <button
                        type="button"
                        onClick={() => {
                          const presetsList = [
                            { name: "Benjamin Quansah", phone: "+233246781234", email: "ben@example.com", birthday: "1994-11-12", avatar: "bg-indigo-500" },
                            { name: "Eunice Mensah", phone: "+233551122334", email: "eunice.m@example.com", birthday: "1997-04-18", avatar: "bg-emerald-500" },
                            { name: "Kofi Boateng", phone: "+233209876543", email: "kofi@example.com", birthday: "1996-03-02", avatar: "bg-amber-500" },
                            { name: "Abena Pokua", phone: "+233271239876", email: "abena@hbd.app", birthday: "1999-08-21", avatar: "bg-teal-500" },
                            { name: "Sena Tsikata", phone: "+233243110984", email: "sena@example.com", birthday: "1995-12-14", avatar: "bg-rose-500" },
                            { name: "Sylvester Tetteh", phone: "+233544009988", email: "sly@example.com", birthday: "1998-07-06", avatar: "bg-pink-500" },
                            { name: "Araba Attah", phone: "+233261234567", email: "araba.attah@example.com", birthday: "1997-01-30", avatar: "bg-purple-500" },
                            { name: "Kwame Nkrumah Jr", phone: "+233241857390", email: "kwame.nk@example.com", birthday: "2000-09-21", avatar: "bg-orange-500" }
                          ];
                          const unselected = presetsList.filter(c => !syncedContacts.some(sc => sc.name === c.name));
                          if (unselected.length === 0) {
                            triggerToast("All Presets Synced", "All contacts are already imported into your synced address deck.");
                            return;
                          }
                          const mapped = unselected.map(c => ({
                            ...c,
                            source: "Address Book Sim All"
                          }));
                          handleImportedContacts(mapped);
                          setShowContactSimulator(false);
                        }}
                        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all text-center active:scale-95 cursor-pointer"
                      >
                        Sync All Presets
                      </button>
                    </div>
                  </>
                )}

                <div className="flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowContactSimulator(false)}
                    className="py-2 px-6 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* SLIDING RIGHT-SIDE NOTIFICATION DRAWER */}
          {showNotificationDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end">
              {/* Backdrop */}
              <div 
                onClick={() => setShowNotificationDrawer(false)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              />
              
              {/* Drawer Container */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="relative w-full max-w-sm h-full bg-white shadow-2xl border-l border-slate-100 p-6 flex flex-col text-left z-10"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4 bg-slate-50 -mx-6 -mt-6 p-6">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Notifications Desk</h3>
                      <p className="text-[10px] text-slate-500">Live birthday and wishlist updates</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowNotificationDrawer(false)}
                    className="p-1 px-2 rounded-lg bg-slate-150 hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Notifications list */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {notifications.length === 0 ? (
                    <div className="py-12 text-center text-slate-405">
                      <Bell className="w-10 h-10 mx-auto text-slate-300 stroke-1 mb-2" />
                      <p className="text-xs font-semibold">All caught up!</p>
                      <p className="text-[10px] text-slate-400">Newly connected contacts' wishlist posts will register here.</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => {
                          // Mark as read
                          setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                          if (notif.friendId) {
                            setSelectedFriendId(notif.friendId);
                            setActiveSection("registry");
                            setRegistrySubTab("list");
                          }
                          setShowNotificationDrawer(false);
                          triggerToast("Roster Selected", `Faceted view to target profile.`);
                        }}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative text-left leading-tight ${
                          notif.isRead 
                            ? "bg-white border-slate-150 hover:bg-slate-50 opacity-75" 
                            : "bg-indigo-50/50 border-indigo-200 hover:border-indigo-400 shadow-xs"
                        }`}
                      >
                        {!notif.isRead && (
                          <span className="absolute top-3.5 right-3.5 w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                        )}
                        <span className="text-[11px] font-black text-indigo-950 uppercase block tracking-wider mb-1 flex items-center gap-1">
                          {notif.type === "birthday_list_posted" ? "🎁 Wishlist alert" : "⚙️ System status"}
                        </span>
                        <p className="text-xs font-bold text-slate-800 leading-snug">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 mt-1 leading-normal">{notif.message}</p>
                        <div className="flex items-center justify-between mt-2.5">
                          <span className="text-[9px] font-mono font-bold text-indigo-500 uppercase tracking-wide bg-indigo-50 px-1.5 py-0.5 rounded">
                            {notif.timestamp}
                          </span>
                          <span className="text-[10px] text-indigo-600 font-extrabold hover:underline">View Wishlist &rarr;</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 bg-slate-50 -mx-6 -mb-6 p-4 text-center">
                  <button
                    onClick={() => {
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                      triggerToast("Marked All as Read", "Archived active alert drawer inbox.");
                    }}
                    className="text-xs text-indigo-600 hover:underline font-extrabold"
                  >
                    Mark all as read
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* PRIMARY SUBCOL VIEWS PORTAL */}
        <div className="flex-1 p-6 md:p-8" id="workspace-viewport">
          
          {/* ==================== SCREEN 1: EXECUTIVE COMMAND CENTER ==================== */}
          {activeSection === "dashboard" && (
            <div className="space-y-6" id="view-dashboard-hull">
              {/* Premium Segmented Tab Selector */}
              <div className="flex border-b border-slate-200 w-full max-w-md mx-auto h-9 mb-4">
                <button
                  type="button"
                  onClick={() => setDashboardTab("timeline")}
                  className={`flex-1 text-center h-full text-[13px] transition-all cursor-pointer relative ${
                    dashboardTab === "timeline"
                      ? "font-semibold text-slate-900 border-b-2 border-indigo-600"
                      : "font-normal text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-btn-timeline"
                >
                  Birthdays
                </button>
                <button
                  type="button"
                  onClick={() => setDashboardTab("wishlist")}
                  className={`flex-1 text-center h-full text-[13px] transition-all cursor-pointer relative ${
                    dashboardTab === "wishlist"
                      ? "font-semibold text-slate-900 border-b-2 border-indigo-600"
                      : "font-normal text-slate-500 hover:text-slate-800"
                  }`}
                  id="tab-btn-wishfeed"
                >
                  Wish Feed
                </button>
              </div>

              {dashboardTab === "timeline" ? (
                <div className="space-y-6">
                  {/* Upcoming Birthdays Dashboard Grid */}
              <BirthdayDashboard 
                friends={friends}
                userName={userSession ? userSession.name : "Alex Patel"}
                onViewFriend={(friendId) => {
                  setSelectedFriendId(friendId);
                  setActiveSection("registry");
                }}
              />

              {/* Top Greeting Message */}

              {/* ==================== UNIVERSAL SEARCH & DISCOVERY CENTER ==================== */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs text-left space-y-4" id="dashboard-discovery-deck">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Search className="w-4 h-4" />
                    </div>
                    <h4 className="font-black text-sm text-slate-900">Sync &amp; Discover Celebrants</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 font-sans">
                    Search buddies, family, or colleagues by name, handle username, or hobby interest tags to register claims or inspect registries.
                  </p>
                </div>

                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-slate-400" />
                  </span>
                  <input
                    type="text"
                    value={dashboardSearchQuery}
                    onChange={(e) => setDashboardSearchQuery(e.target.value)}
                    placeholder="Search by name, handle username (like @clara, david) or hobbies (like photography, vinyl)..."
                    className="w-full bg-slate-50 hover:bg-slate-100/60 transition-colors focus:bg-white border border-slate-200 rounded-2xl pl-10 pr-10 py-3 text-xs focus:ring-2 focus:ring-indigo-100 focus:outline-[#818CF8]"
                  />
                  {dashboardSearchQuery && (
                    <button
                      onClick={() => setDashboardSearchQuery("")}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-650 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Search query matches box */}
                <AnimatePresence>
                  {dashboardSearchQuery.trim().length > 0 ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 pt-1"
                    >
                      {/* Real-time Registered Matches section */}
                      <div className="space-y-2 pb-2">
                        <div className="text-[10px] uppercase font-bold text-[#FF4D00] tracking-wider flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-[#FF4D00] rounded-full animate-ping" />
                          Real-Time Cloud Profiles Found ({firestoreSearchResults.length})
                          {isSearchingFirestore && (
                            <span className="text-[9px] text-slate-400 capitalize animate-pulse font-normal">(Searching...)</span>
                          )}
                        </div>
                        {firestoreSearchResults.length === 0 ? (
                          <div className="text-[10px] text-slate-400 font-sans italic pl-1">
                            {isSearchingFirestore ? "Searching the secure user directory..." : "No active real-time username matches found in cloud database."}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-b border-dashed border-slate-100 pb-3">
                            {firestoreSearchResults.map((usr) => {
                              // Calculate upcoming birthday remaining days
                              const bday = usr.birthday || "2000-01-01";
                              const calculateUpcomingDays = (bstr: string) => {
                                try {
                                  const today = new Date();
                                  today.setHours(0,0,0,0);
                                  const bd = new Date(bstr);
                                  let next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
                                  if (next < today) next.setFullYear(today.getFullYear() + 1);
                                  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                } catch (_) {
                                  return 365;
                                }
                              };
                              const daysLeft = calculateUpcomingDays(bday);

                              return (
                                <div
                                  key={`db-user-${usr.uid}`}
                                  className="bg-orange-50/25 p-3 rounded-2xl border border-orange-100/70 hover:border-[#FF4D00]/50 hover:shadow-2xs transition-all text-left flex items-start justify-between gap-3 relative"
                                >
                                  <div className="flex items-start gap-3 min-w-0 flex-1">
                                    <div className={`w-9 h-9 rounded-xl ${usr.avatar || "bg-[#FF4D00]"} text-white font-serif font-black flex items-center justify-center shrink-0`}>
                                      {(usr.name || usr.username || "U").split(" ").map((n:any)=>n[0]).slice(0,2).join("").toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <h5 className="font-extrabold text-xs text-slate-900 leading-tight truncate">{usr.name || usr.username}</h5>
                                      <span className="text-[10px] text-[#FF4D00] font-black block">@{usr.username}</span>
                                      <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">
                                        {usr.birthday ? `${daysLeft} days until birthday` : "No birthday saved yet"}
                                      </span>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      // Add user to local circle or view
                                      const newFriend: Friend = {
                                        id: usr.uid,
                                        name: usr.name || usr.username,
                                        birthday: usr.birthday || "2000-01-01",
                                        avatar: usr.avatar || "bg-indigo-600",
                                        relationship: "Mutual Loop Buddy",
                                        wishlist: usr.wishlist || [],
                                        interests: usr.interests || [],
                                        phone: usr.phone || usr.phoneNumber || "",
                                        whatsapp: usr.whatsapp || usr.phoneNumber || "",
                                        snapchat: usr.username,
                                        achievements: [],
                                        age: "25",
                                        connectedBack: true
                                      };
                                      
                                      setFriends((prev) => {
                                        if (prev.some(f => f.id === usr.uid)) return prev;
                                        const updated = [...prev, newFriend];
                                        localStorage.setItem("birthday_countdown_friends", JSON.stringify(updated));
                                        return updated;
                                      });

                                      setSelectedFriendId(usr.uid);
                                      setActiveSection("registry");
                                      setDashboardSearchQuery("");
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                      triggerToast("Buddy Added 🤝", `Added ${usr.name || usr.username} to your circle workspace!`);
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] px-2.5 py-1.5 rounded-xl cursor-pointer shrink-0"
                                  >
                                    View Loop
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Immediate Simulation Matches ({getSearchableProfiles().filter(p => p.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) || p.username.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) || p.interests.some((i:string) => i.toLowerCase().includes(dashboardSearchQuery.toLowerCase()))).length + friends.filter(f => f.id !== "alex" && f.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())).length} accounts)
                      </div>

                      {(() => {
                        const query = dashboardSearchQuery.toLowerCase().trim();
                        
                        // Filter external mock database profiles
                        const matchExternal = getSearchableProfiles().filter(p => 
                          p.name.toLowerCase().includes(query) ||
                          p.username.toLowerCase().includes(query) ||
                          p.interests.some((i:string) => i.toLowerCase().includes(query))
                        );

                        // Filter existing circle friends (excluding self)
                        const matchCircle = friends.filter(f => 
                          f.id !== "alex" && (
                            f.name.toLowerCase().includes(query) ||
                            f.interests.some((i:string) => i.toLowerCase().includes(query))
                          )
                        );

                        if (matchExternal.length === 0 && matchCircle.length === 0) {
                          return (
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-400 font-semibold py-9">
                              No matching celebrity accounts or friends found. Try typing another tag like &#39;baking&#39;, &#39;coffee&#39;, &#39;david&#39; or &#39;clara&#39;.
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {/* Match existing circle buds */}
                            {matchCircle.map((fc) => {
                              const remaining = calculateDaysRemaining(fc.birthday);
                              return (
                                <div
                                  key={`circle-${fc.id}`}
                                  className="bg-white p-3.5 rounded-2xl border border-slate-250 hover:border-indigo-250 hover:shadow-2xs transition-all text-left flex items-start gap-3 relative overflow-hidden"
                                >
                                  <div className="absolute top-2 right-2 bg-indigo-50 text-[9px] px-1.5 py-0.5 rounded text-indigo-600 font-mono font-bold uppercase tracking-wider scale-95 border border-indigo-100">
                                    In Circle 🤝
                                  </div>
                                  <div className={`w-9 h-9 rounded-xl ${fc.avatar} text-white font-serif font-black flex items-center justify-center shrink-0`}>
                                    {fc.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h5 className="font-extrabold text-xs text-slate-900 leading-tight block">{fc.name}</h5>
                                    <span className="text-[10px] text-zinc-400 font-semibold block">{fc.relationship} • Birthday in {remaining}d</span>
                                    
                                    {/* Hobbies list */}
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {fc.interests.slice(0, 3).map(interest => (
                                        <span key={interest} className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded font-bold">
                                          #{interest}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setSelectedFriendId(fc.id);
                                      setActiveSection("registry");
                                      setDashboardSearchQuery("");
                                      window.scrollTo({ top: 0, behavior: "smooth" });
                                    }}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[9px] self-end px-2.5 py-1.5 rounded-xl cursor-pointer"
                                  >
                                    View Wishlist
                                  </button>
                                </div>
                              );
                            })}

                            {/* Match external mock library */}
                            {matchExternal.map((ext) => {
                              // Check if already connected (has friend with this id)
                              const isAlreadyConnected = friends.some(f => f.id === ext.id);
                              if (isAlreadyConnected) return null; // handled in group above

                              return (
                                <div
                                  key={`external-${ext.id}`}
                                  className="bg-[#FAF9FF] p-3.5 rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:shadow-2xs transition-all text-left flex items-start gap-3 relative"
                                >
                                  <div className="absolute top-2 right-2 bg-emerald-50 text-[9px] px-1.5 py-0.5 rounded text-emerald-600 font-mono font-bold uppercase tracking-wider scale-95 border border-emerald-100">
                                    Discoverable 🌐
                                  </div>
                                  <div className={`w-9 h-9 rounded-xl ${ext.avatar} text-white font-serif font-black flex items-center justify-center shrink-0`}>
                                    {ext.name.split(" ").map((n: string) => n[0] || "").slice(0,2).join("")}
                                  </div>
                                  <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                                    <div>
                                      <h5 className="font-extrabold text-xs text-slate-900 leading-tight block">{ext.name}</h5>
                                      <span className="text-[10px] text-indigo-500 font-bold block">@{ext.username}</span>
                                    </div>
                                    
                                    {/* Hobbies list */}
                                    <div className="flex flex-wrap gap-1 mt-1.5 leading-none">
                                      {ext.interests.slice(0, 3).map((interest:string) => (
                                        <span key={interest} className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded font-extrabold">
                                          #{interest}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      setPendingConnectProfile(ext);
                                      setShowRelationModal(true);
                                      setDashboardSearchQuery("");
                                    }}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[9px] self-end px-3 py-1.5 rounded-xl cursor-pointer shadow-sm active:scale-95 transition-all"
                                  >
                                    + Connect
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Statistics Panel Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" id="dashboard-system-stats">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Buddies Active</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">{totalBuddiesCount}</span>
                    <span className="text-xs font-semibold text-indigo-600 font-mono">Synced Profiles</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Gifts Registry Status</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">{claimedWishesCount}/{totalWishesCount}</span>
                    <span className="text-xs font-semibold text-emerald-600 font-mono">
                      {totalWishesCount > 0 ? Math.round((claimedWishesCount / totalWishesCount) * 100) : 0}% Claimed
                    </span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Landmark System Level</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-slate-900">Lvl {unlockLevel}</span>
                    <span className="text-xs font-semibold text-amber-600 font-mono">Gift Master</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 text-left">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Soonest Countdown</span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-black text-rose-600">{nextTargetDays}d</span>
                    <span className="text-xs font-semibold text-slate-500 truncate">For {nextTarget.name.split(" ")[0]}</span>
                  </div>
                </div>
              </div>

              {/* Main split row layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-desk-row">
                
                {/* Nearest Birthday Party Spotlight detail */}
                <div className="lg:col-span-4 bg-gradient-to-b from-amber-50 to-amber-100/50 rounded-3xl p-6 border border-amber-200 text-left flex flex-col justify-between min-h-[340px]" id="spotlight-card">
                  <div>
                    <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block">
                      ⏰ Next Spotlight Circle
                    </span>
                    
                    <div className="mt-5 flex gap-3.5 items-center">
                      <div className={`w-12 h-12 rounded-2xl ${nextTarget.avatar} text-white font-serif flex items-center justify-center font-black text-lg shadow-sm border border-white/20`}>
                        {nextTarget.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-[17px] text-slate-900 tracking-tight leading-tight">{nextTarget.name}</h4>
                        <p className="text-xs text-slate-500 font-semibold">{nextTarget.relationship} • Turning {nextTarget.age}</p>
                      </div>
                    </div>

                    <div className="my-5">
                      <h2 className="text-5xl font-black text-amber-600 tracking-tighter">{nextTargetDays} Days</h2>
                      <p className="text-xs text-slate-600 font-semibold mt-1">Calendar date: <span className="font-extrabold">{formatBirthdayDate(nextTarget.birthday)}</span> ({nextTarget.birthday})</p>
                    </div>

                    <div className="bg-white/80 p-3 rounded-2xl border border-amber-300 text-[11px] font-medium leading-relaxed">
                      <span className="font-extrabold text-amber-900 flex items-center gap-1 mb-1">
                        <Gift className="w-3.5 h-3.5 text-amber-600" /> Wishlist Target Wants
                      </span>
                      {nextTarget.wishlist && nextTarget.wishlist.length > 0 ? (
                        <p className="font-bold text-slate-800 truncate">🎁 {nextTarget.wishlist[0].title} ({nextTarget.wishlist[0].price})</p>
                      ) : (
                        <p className="text-slate-500 italic">No desires listed yet. Generate AI suggestions below.</p>
                      )}
                    </div>

                    {/* Spotlight Gift Status */}
                    {(() => {
                      const nextTargetGifts = sentGifts.filter(g => g.friendId === nextTarget.id).length;
                      if (nextTargetGifts > 0) {
                        return (
                          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-2.5 px-3.5 text-[10.5px] font-medium leading-relaxed mt-2.5 flex items-center gap-2">
                            <span className="text-lg">🎁</span>
                            <div className="min-w-0">
                              <span className="font-extrabold text-rose-900 block leading-tight">Boutique Gift Dispatched!</span>
                              <span className="text-rose-600 font-bold block text-[10px] truncate">{nextTargetGifts} gift {nextTargetGifts === 1 ? 'locker item' : 'locker items'} sent.</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  <div className="pt-4 flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedFriendId(nextTarget.id);
                        setActiveSection("registry");
                      }}
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold text-center transition-colors"
                    >
                      Open Registry Profile
                    </button>
                    <button
                      onClick={() => {
                        setSelectedFriendId(nextTarget.id);
                        setActiveSection("ai-lab");
                      }}
                      className="p-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl"
                      title="Generate Gift Recommendations"
                    >
                      <Wand2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Calendar Schedule list chronological */}
                <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 text-left flex flex-col justify-between" id="calendar-board">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-slate-500" /> Circle Birthday Calendars
                      </h4>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">Chronological</span>
                    </div>

                    <div className="space-y-4 max-h-[290px] overflow-y-auto pr-1">
                      {(() => {
                        const groupedByMonth: { [key: string]: typeof sortedUpcoming } = {};
                        const orderedMonths: string[] = [];
                        
                        sortedUpcoming.forEach((friend) => {
                          if (!friend.birthday) return;
                          const parts = friend.birthday.split("-");
                          if (parts.length < 2) return;
                          const monthIdx = parseInt(parts[1], 10) - 1;
                          const monthNames = [
                            "January", "February", "March", "April", "May", "June",
                            "July", "August", "September", "October", "November", "December"
                          ];
                          const mName = monthNames[monthIdx] || "Unknown";
                          if (!groupedByMonth[mName]) {
                            groupedByMonth[mName] = [];
                            orderedMonths.push(mName);
                          }
                          groupedByMonth[mName].push(friend);
                        });

                        if (orderedMonths.length === 0) {
                          return (
                            <div className="text-center py-8 text-xs text-slate-400 font-sans">
                              No buddies tracked in chronological queue yet.
                            </div>
                          );
                        }

                        return orderedMonths.map((mName) => (
                          <div key={mName} className="space-y-1.5 font-sans">
                            {/* Month Header Banner */}
                            <div className="flex items-center gap-2 px-1 py-0.5 sticky top-0 bg-white/95 backdrop-blur z-5">
                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{mName}</span>
                              <div className="h-px bg-slate-100 flex-1" />
                            </div>

                            {/* Rounded Spacious Rows */}
                            <div className="space-y-2">
                              {groupedByMonth[mName].map((friend) => {
                                const days = calculateDaysRemaining(friend.birthday);
                                const isAlex = friend.id === "alex";
                                const handle = "@" + (friend.snapchat || (friend as any).username || friend.name.toLowerCase().replace(/[^a-z0-9]/g, "") + "_loop");

                                return (
                                  <div 
                                    key={friend.id}
                                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all hover:scale-[1.01] ${
                                      friend.id === nextTarget.id 
                                        ? "bg-indigo-50/50 border-indigo-200"
                                        : "bg-slate-50/50 border-slate-100 hover:bg-slate-100"
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {/* User Avatar Bubble */}
                                      <div className={`w-8 h-8 rounded-full ${friend.avatar || "bg-indigo-600"} text-white flex items-center justify-center font-black text-[10px] select-none hover:rotate-6 transition shrink-0`}>
                                        {friend.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                                      </div>
                                      
                                      <div className="space-y-0.5">
                                        <div className="font-extrabold text-xs text-slate-850 leading-tight">
                                          {friend.name}
                                        </div>
                                        {/* Unique User Handle */}
                                        <div className="text-[9.5px] text-slate-400 font-bold font-mono leading-none">
                                          {handle}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Remaining Time Tracking Metric */}
                                    <div className="text-right space-y-0.5 shrink-0">
                                      <span className="font-extrabold text-[10.5px] text-indigo-600 leading-none block">
                                        {isAlex ? "🎁 Me" : `${days} days left`}
                                      </span>
                                      <span className="text-[9px] text-slate-400 font-bold block leading-none">
                                        Turns {friend.age} • {formatBirthdayDate(friend.birthday)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  <div className="pt-4 text-center">
                    <button 
                      onClick={() => setActiveSection("registry")}
                      className="text-xs text-indigo-600 hover:underline font-extrabold inline-flex items-center gap-1"
                    >
                      <span>Manage buddies directory cards</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>


              </div>

              {/* ==================== MONTHLY CALENDAR VIEW SECTION ==================== */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xs text-left space-y-5" id="dashboard-monthly-calendar">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Calendar className="w-4.5 h-4.5" />
                      </div>
                      <h4 className="font-extrabold text-sm text-slate-900">Monthly Celebrations Planner</h4>
                    </div>
                    <p className="text-[11px] text-slate-500 font-sans">
                      Visualize companion birthdates in a grid format. Navigate months freely and click any day to inspect specific companion targets.
                    </p>
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center gap-2 self-start sm:self-center bg-slate-50 p-1.5 rounded-xl border border-slate-200/65">
                    <button
                      onClick={() => {
                        setCalendarMonth(prev => {
                          if (prev === 0) {
                            setCalendarYear(y => y - 1);
                            return 11;
                          }
                          return prev - 1;
                        });
                      }}
                      className="p-1.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 cursor-pointer transition-colors"
                      title="Previous Month"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <span className="text-xs font-black text-slate-800 min-w-[100px] text-center font-sans tracking-tight">
                      {[
                        "January", "February", "March", "April", "May", "June",
                        "July", "August", "September", "October", "November", "December"
                      ][calendarMonth]} {calendarYear}
                    </span>

                    <button
                      onClick={() => {
                        setCalendarMonth(prev => {
                          if (prev === 11) {
                            setCalendarYear(y => y + 1);
                            return 0;
                          }
                          return prev + 1;
                        });
                      }}
                      className="p-1.5 bg-white rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-950 cursor-pointer transition-colors"
                      title="Next Month"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Quick Reset back to Benchmark Today - June 2026 */}
                    {(calendarYear !== 2026 || calendarMonth !== 5) && (
                      <button
                        onClick={() => {
                          setCalendarYear(2026);
                          setCalendarMonth(5);
                        }}
                        className="ml-1 px-2.5 py-1 text-[9.5px] font-black text-indigo-600 bg-indigo-50 border border-indigo-150 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        Reset To June
                      </button>
                    )}
                  </div>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
                  {/* Weekday Labels */}
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((wd) => (
                    <div key={wd} className="text-center text-[10px] uppercase font-extrabold text-slate-400 py-1 font-mono tracking-wider">
                      {wd}
                    </div>
                  ))}

                  {/* Days */}
                  {(() => {
                    const cells = [];
                    const firstDay = new Date(calendarYear, calendarMonth, 1).getDay();
                    const numDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
                    const prevNumDays = new Date(calendarYear, calendarMonth, 0).getDate();

                    // Prepend preceding month padded days (using standard grey text / unclickable)
                    for (let i = firstDay - 1; i >= 0; i--) {
                      const d = prevNumDays - i;
                      cells.push({
                        dayNumber: d,
                        isCurrentMonth: false,
                        monthIndex: calendarMonth === 0 ? 11 : calendarMonth - 1,
                        yearValue: calendarMonth === 0 ? calendarYear - 1 : calendarYear,
                      });
                    }

                    // Add active calendar days
                    for (let d = 1; d <= numDays; d++) {
                      cells.push({
                        dayNumber: d,
                        isCurrentMonth: true,
                        monthIndex: calendarMonth,
                        yearValue: calendarYear,
                      });
                    }

                    // Pad after calendar index to complete regular weeks
                    const totalCellsNeeded = 42;
                    const nextMonthPaddingCount = totalCellsNeeded - cells.length;
                    for (let d = 1; d <= nextMonthPaddingCount; d++) {
                      cells.push({
                        dayNumber: d,
                        isCurrentMonth: false,
                        monthIndex: calendarMonth === 11 ? 0 : calendarMonth + 1,
                        yearValue: calendarMonth === 11 ? calendarYear + 1 : calendarYear,
                      });
                    }

                    return cells.map((cell, idx) => {
                      const isCurrent = cell.isCurrentMonth;
                      const d = cell.dayNumber;
                      const m = cell.monthIndex;
                      const y = cell.yearValue;

                      // Check benchmark clock today matching: June 3, 2026
                      const isTodayCell = y === 2026 && m === 5 && d === 3 && isCurrent;

                      // Fetch matching celebrants
                      const celCount = isCurrent ? getCelebrants(m, d) : [];
                      const hasCelebrants = celCount.length > 0;

                      // Selection active checking
                      const isSelected = selectedCalendarDay && selectedCalendarDay.day === d && selectedCalendarDay.month === m && selectedCalendarDay.year === y && isCurrent;

                      return (
                        <div
                          key={idx}
                          role="button"
                          tabIndex={isCurrent ? 0 : -1}
                          onClick={() => {
                            if (isCurrent) {
                              setSelectedCalendarDay({ day: d, month: m, year: y });
                            }
                          }}
                          className={`min-h-[55px] sm:min-h-[75px] p-2 rounded-2xl border transition-all text-left flex flex-col justify-between ${
                            isCurrent 
                              ? "bg-white border-slate-150 hover:bg-slate-50/50 hover:border-slate-250 cursor-pointer" 
                              : "bg-slate-50/30 border-transparent text-slate-350 pointer-events-none"
                          } ${
                            isTodayCell ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-white" : ""
                          } ${
                            isSelected ? "bg-indigo-50/10 border-indigo-500 ring-2 ring-indigo-500/20" : ""
                          } ${
                            hasCelebrants && !isSelected ? "bg-amber-50/30 border-amber-250/60" : ""
                          }`}
                        >
                          {/* Inner Day Numerals and Micro Badge Indicators */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[10.5px] font-black ${
                              isCurrent 
                                ? isTodayCell 
                                  ? "bg-indigo-600 text-white w-5 h-5 rounded-lg flex items-center justify-center font-mono font-bold shrink-0 shadow-sm" 
                                  : isSelected
                                    ? "text-indigo-600"
                                    : "text-slate-800"
                                : "text-slate-300"
                            }`}>
                              {d}
                            </span>

                            {isTodayCell && (
                              <span className="text-[7px] uppercase font-black tracking-tight text-indigo-500 font-mono hidden sm:inline bg-indigo-50 border border-indigo-150 px-1 py-0.2 rounded leading-none select-none">
                                Now
                              </span>
                            )}

                            {hasCelebrants && (
                              <span className="text-[7.5px] uppercase font-black text-amber-700 bg-amber-55/70 border border-amber-200/50 px-1 py-0.2 rounded font-sans leading-none">
                                🎂 {celCount.length}
                              </span>
                            )}
                          </div>

                          {/* Avatar Micro Badging Row */}
                          <div className="mt-1 flex -space-x-1 sm:-space-x-1.5 overflow-hidden justify-items-start leading-none mb-1">
                            {hasCelebrants && celCount.slice(0, 3).map((friend) => (
                              <button
                                key={friend.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedFriendId(friend.id);
                                  setActiveSection("registry");
                                  window.scrollTo({ top: 0, behavior: "smooth" });
                                }}
                                className={`w-4.5 h-4.5 sm:w-6 sm:h-6 rounded-md border border-white text-white text-[8px] font-bold flex items-center justify-center shrink-0 hover:scale-110 active:scale-90 transition-transform cursor-pointer relative z-1 ${friend.avatar}`}
                                title={`${friend.name} (${friend.relationship}) — Click to jump to details`}
                              >
                                {friend.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>

                {/* Celebrants ledger for selected day */}
                <AnimatePresence>
                  {(() => {
                    const sel = selectedCalendarDay;
                    const celebrants = getCelebrants(sel.month, sel.day);

                    return (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 text-left space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-200/60">
                          <div>
                            <h5 className="font-extrabold text-xs text-slate-800">
                              Celebration List: {[
                                "January", "February", "March", "April", "May", "June",
                                "July", "August", "September", "October", "November", "December"
                              ][sel.month]} {sel.day}, {sel.year}
                            </h5>
                            <p className="text-[10px] text-slate-500 font-sans mt-0.5">
                              {celebrants.length === 0 
                                ? "No birthday events are scheduled on this date in your circle." 
                                : `We discovered ${celebrants.length} companion celebrants matching this calendar day.`}
                            </p>
                          </div>

                          {celebrants.length > 0 && (
                            <span className="text-[9px] font-extrabold text-pink-600 bg-pink-50 border border-pink-200 px-2.5 py-0.5 rounded-full select-none shrink-0 self-start sm:self-center">
                              🎯 Celebration Target Detected
                            </span>
                          )}
                        </div>

                        {celebrants.length === 0 ? (
                          <div className="text-center py-4 bg-white/40 border border-dashed border-slate-200 rounded-xl">
                            <p className="text-xs text-slate-400 italic">No birthdays on this day. Tap any day with a 🎂 icon to see birthday companion details.</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-1">
                            {celebrants.map((f) => {
                              const days = calculateDaysRemaining(f.birthday);
                              const isAlex = f.id === "alex";

                              return (
                                <div
                                  key={f.id}
                                  className="p-3 bg-white border border-slate-150 rounded-2xl flex items-center justify-between gap-3 text-left hover:shadow-2xs transition-all"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[11px] text-white shrink-0 ${f.avatar}`}>
                                      {f.name.split(" ").map(n => n[0]).join("")}
                                    </span>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="text-xs font-black text-slate-900 truncate leading-tight block">{f.name}</span>
                                        <span className="text-[9px] shrink-0 font-bold px-1.5 py-0.2 bg-slate-100 border border-slate-200 rounded text-slate-500 uppercase">
                                          {f.relationship}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">🍰 Birthday: {formatBirthdayDate(f.birthday)} (Turning {f.age})</span>
                                    </div>
                                  </div>

                                  <div className="text-right shrink-0 flex items-center gap-2">
                                    <span className="text-[10px] font-extrabold text-indigo-600 font-mono block">
                                      {isAlex ? "🎁 (You)" : `In ${days}d`}
                                    </span>
                                    <button
                                      onClick={() => {
                                        setSelectedFriendId(f.id);
                                        setActiveSection("registry");
                                        window.scrollTo({ top: 0, behavior: "smooth" });
                                      }}
                                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[9.5px] px-2.5 py-1.2 rounded-lg transition-colors cursor-pointer shadow-sm active:scale-95"
                                    >
                                      Wishlist
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </motion.div>
                    );
                  })()}
                </AnimatePresence>

              </div>
              </div>
              ) : (
                <WishlistFeed
                  wishlistFeedItems={wishlistFeedItems}
                  setWishlistFeedItems={setWishlistFeedItems}
                  walletBalance={walletBalance}
                  setWalletBalance={setWalletBalance}
                  getFormattedPrice={getFormattedPrice}
                  appendLog={appendLog}
                  triggerToast={triggerToast}
                  onAddWishlist={() => {
                    setActiveSection("profile");
                    setProfileSubTab("wishlist");
                  }}
                />
              )}

            </div>
          )}

          {/* ==================== SCREEN 2: BUDDIES REGISTRY CRM ==================== */}
          {activeSection === "registry" && (
            <div className="space-y-6 text-left" id="view-registry-hull">
              {/* Clean Buddies Card Header */}
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 text-left">
                <h3 className="text-[15px] font-semibold text-slate-900">Buddies</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Manage your friends and celebration loops</p>
              </div>

              {/* Clean 3-tab bar: 36px tall, 3 equal sections, 13px font, underline indicator on active tab */}
              <div className="flex border-b border-slate-200 h-9 w-full" id="registry-segmented-tabs">
                <button
                  type="button"
                  onClick={() => setRegistrySubTab("list")}
                  className={`flex-1 h-full text-[13px] font-semibold transition-all cursor-pointer relative flex items-center justify-center ${
                    registrySubTab === "list"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Friends
                </button>

                <button
                  type="button"
                  onClick={() => setRegistrySubTab("connect")}
                  className={`flex-1 h-full text-[13px] font-semibold transition-all cursor-pointer relative flex items-center justify-center ${
                    registrySubTab === "connect"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Add
                </button>

                <button
                  type="button"
                  onClick={() => setRegistrySubTab("requests")}
                  className={`flex-1 h-full text-[13px] font-semibold transition-all cursor-pointer relative flex items-center justify-center gap-1.5 ${
                    registrySubTab === "requests"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>Requests</span>
                  {(() => {
                    const count = friends.filter(f => f.id !== "alex" && f.connectedBack === false && f.incomingRequest === true).length;
                    return count > 0 ? (
                      <span className="w-4 h-4 bg-rose-600 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                        {count}
                      </span>
                    ) : null;
                  })()}
                </button>
              </div>

              {(registrySubTab === "list" || registrySubTab === "connect" || registrySubTab === "requests") ? (
                <>
                  <div className="space-y-3">
                    {/* Tab 1: Friends */}
                    {registrySubTab === "list" && (
                      <div className="space-y-3">
                        {(() => {
                          const listFriends = friends.filter(f => f.notOnHbd !== true && f.id !== "alex");
                          if (listFriends.length === 0) {
                            return (
                              <div className="py-8 text-center text-slate-400 space-y-1">
                                <span className="text-[24px] block mb-1" role="img" aria-label="users">👥</span>
                                <p className="text-[13px] font-semibold text-slate-700">No friends added yet</p>
                                <p className="text-[11px] text-slate-400">Switch to the Add tab to connect with friends.</p>
                              </div>
                            );
                          }
                          return (
                            <div className="flex flex-col gap-2">
                              {listFriends.map(friend => {
                                const days = calculateDaysRemaining(friend.birthday);
                                const initials = friend.name.split(" ").map(n => n[0] || "").join("").toUpperCase();
                                return (
                                  <div
                                    key={friend.id}
                                    onClick={() => {
                                      setSelectedFriendId(friend.id);
                                      setViewingBuddyProfile(true);
                                    }}
                                    className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                                  >
                                    <div className="flex items-center gap-2.5 truncate">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[11px] text-white shrink-0 ${friend.avatar || "bg-rose-500"}`}>
                                        {initials}
                                      </div>
                                      <div className="truncate">
                                        <p className="text-[13px] font-semibold text-slate-900 truncate">{friend.name}</p>
                                        <p className="text-[11px] text-slate-400 truncate">@{friend.id}</p>
                                      </div>
                                    </div>
                                    <span className="text-[11px] font-semibold text-indigo-600 font-mono shrink-0">
                                      {days === 0 ? "Today! 🎉" : `in ${days}d`}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Tab 2: Add */}
                    {registrySubTab === "connect" && (
                      <div className="space-y-4">
                        <div className="relative">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search by username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-9 bg-slate-50 border border-slate-300 rounded-lg pl-9 pr-3 text-[13px] outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                          />
                        </div>

                        <div className="space-y-2">
                          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Suggested Contacts</h4>
                          <div className="flex flex-col gap-2">
                            {[
                              { name: "Sophia Mitchell", phone: "+1 415-382-9421", initials: "SM" },
                              { name: "Liam Nkrumah", phone: "+233 24-412-3456", initials: "LN" },
                              { name: "Chloe Henderson", phone: "+44 7700-900077", initials: "CH" },
                              { name: "Julian Alcaraz", phone: "+34 600-123456", initials: "JA" },
                              { name: "Amara Diop", phone: "+221 77-512-3456", initials: "AD" }
                            ].filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((contact, idx) => (
                              <div key={idx} className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2.5 truncate">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold flex items-center justify-center shrink-0">
                                    {contact.initials}
                                  </div>
                                  <div className="truncate">
                                    <p className="text-[13px] font-semibold text-slate-900 truncate">{contact.name}</p>
                                    <p className="text-[11px] font-mono text-slate-400">{contact.phone}</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => triggerToast("Invitation Sent", `SMS invite sent to ${contact.name}`)}
                                  className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                                >
                                  Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tab 3: Requests */}
                    {registrySubTab === "requests" && (
                      <div className="space-y-4">
                        {(() => {
                          const incoming = friends.filter(f => f.id !== "alex" && f.connectedBack === false && f.incomingRequest === true);
                          const outgoing = friends.filter(f => f.id !== "alex" && f.connectedBack === false && f.incomingRequest !== true);

                          if (incoming.length === 0 && outgoing.length === 0) {
                            return (
                              <div className="py-8 text-center text-slate-400 space-y-1">
                                <span className="text-[24px] block mb-1" role="img" aria-label="mail">📬</span>
                                <p className="text-[13px] font-semibold text-slate-700">No pending requests</p>
                                <p className="text-[11px] text-slate-400">Incoming and outgoing friend requests will appear here.</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-4">
                              {incoming.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Incoming Requests</h4>
                                  <div className="flex flex-col gap-2">
                                    {incoming.map(f => (
                                      <div key={f.id} className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 truncate">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[11px] text-white shrink-0 ${f.avatar || "bg-indigo-600"}`}>
                                            {f.name.split(" ").map(n => n[0] || "").join("").toUpperCase()}
                                          </div>
                                          <div className="truncate">
                                            <p className="text-[13px] font-semibold text-slate-900 truncate">{f.name}</p>
                                            <p className="text-[11px] text-slate-400 truncate">@{f.id}</p>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 shrink-0">
                                          <button
                                            type="button"
                                            onClick={() => handleAcceptFriendRequest(f)}
                                            className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-[12px] font-semibold rounded-lg cursor-pointer transition-colors"
                                          >
                                            Accept
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleDeclineFriendRequest(f)}
                                            className="h-8 px-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[12px] font-semibold rounded-lg cursor-pointer transition-colors"
                                          >
                                            Decline
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {outgoing.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Outgoing Requests</h4>
                                  <div className="flex flex-col gap-2">
                                    {outgoing.map(f => (
                                      <div key={f.id} className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 truncate">
                                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-[11px] text-white shrink-0 ${f.avatar || "bg-slate-500"}`}>
                                            {f.name.split(" ").map(n => n[0] || "").join("").toUpperCase()}
                                          </div>
                                          <div className="truncate">
                                            <p className="text-[13px] font-semibold text-slate-900 truncate">{f.name}</p>
                                            <p className="text-[11px] text-slate-400 truncate">Pending acceptance</p>
                                          </div>
                                        </div>
                                        <span className="text-[11px] font-semibold text-slate-400 shrink-0">Sent</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                            Invite to Loop
                          </button>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
              {/* Right Companion Detail cockpit area (SPAN 7) */}
              <div className={viewingBuddyProfile ? "fixed inset-0 bg-white z-50 overflow-y-auto p-6" : "hidden"}>
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
                  {viewingBuddyProfile && (
  <button
    onClick={() => setViewingBuddyProfile(false)}
    className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-indigo-600 transition-colors cursor-pointer mb-2"
  >
    <ChevronLeft className="w-4 h-4" />
    <span>Back to Buddies</span>
  </button>
)}

                  {/* Banner Profile Summary */}
                  <div className="flex flex-col items-center text-center pb-8 border-b border-slate-100 w-full animate-fade-in">
                    {/* Centered Large Avatar */}
                    <div className={`w-24 h-24 rounded-full ${selectedFriend.avatar} text-white flex items-center justify-center font-bold font-serif text-4xl shadow-md mb-4`}>
                      {selectedFriend.name.split(" ").map(n => n[0] || "").join("").toUpperCase()}
                    </div>

                    {/* Large Centered Name */}
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedFriend.name}</h3>

                    {/* Cleaner and smaller metadata layout */}
                    {(selectedFriend.id === 'alex' || selectedFriend.connectedBack) && (
                      <div className="flex flex-wrap justify-center items-center gap-2 mt-2.5 text-xs">
                        <span className="text-[11px] text-slate-650 font-bold bg-slate-100 px-2.5 py-1 rounded-full">
                          {selectedFriend.relationship}
                        </span>
                        <span className="text-[11px] text-indigo-700 font-extrabold bg-indigo-50/60 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Cake className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>{formatBirthdayDate(selectedFriend.birthday)} ({selectedFriend.birthday})</span>
                        </span>
                        <span className="text-[11px] text-purple-700 font-bold bg-purple-50/50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span>In {calculateDaysRemaining(selectedFriend.birthday)} Days</span>
                        </span>
                      </div>
                    )}

                    {/* Row of 3 clickable icon buttons */}
                    {(selectedFriend.id === 'alex' || selectedFriend.connectedBack) && (
                      <div className="flex justify-center items-center gap-4 mt-6">
                        {/* Phone Button */}
                        <a
                          href={`tel:${selectedFriend.phone || "+233241234567"}`}
                          className="w-12 h-12 rounded-full bg-slate-50 hover:bg-indigo-50 text-slate-650 hover:text-indigo-600 border border-slate-200/80 hover:border-indigo-200 flex items-center justify-center shadow-3xs transition-all active:scale-90"
                          title="Call phone number"
                        >
                          <Phone className="w-5 h-5" />
                        </a>

                        {/* WhatsApp Button */}
                        <a
                          href={`https://wa.me/${(selectedFriend.whatsapp || selectedFriend.phone || "+233241234567").replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-12 h-12 rounded-full bg-slate-50 hover:bg-emerald-50 text-slate-650 hover:text-emerald-600 border border-slate-200/80 hover:border-emerald-200 flex items-center justify-center shadow-3xs transition-all active:scale-90"
                          title="Message on WhatsApp"
                        >
                          <MessageSquare className="w-5 h-5" />
                        </a>

                        {/* Username copy to clipboard Button */}
                        <button
                          onClick={() => {
                            const handle = selectedFriend.snapchat || (selectedFriend as any).username || "friend_user";
                            navigator.clipboard.writeText(handle);
                            triggerToast("Copied 📋", `Username @${handle} copied to clipboard!`);
                          }}
                          className="w-12 h-12 rounded-full bg-slate-50 hover:bg-amber-50 text-slate-650 hover:text-amber-600 border border-slate-200/80 hover:border-amber-200 flex items-center justify-center shadow-3xs transition-all cursor-pointer active:scale-90"
                          title="Copy Username"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                      </div>
                    )}

                    {/* Action buttons (Edit, Delete) cleanly matching below */}
                    {(selectedFriend.id === 'alex' || selectedFriend.connectedBack) && (
                      <div className="flex gap-2 mt-5">
                        <button
                          onClick={() => setIsEditingFriend(!isEditingFriend)}
                          className="px-3.5 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200/70 border border-slate-200 rounded-lg transition-all"
                        >
                          {isEditingFriend ? "Close Editor" : "Edit Profile Details"}
                        </button>
                        {selectedFriend.id !== 'alex' && (
                          <button
                            onClick={() => handleDeleteFriendProfile(selectedFriend.id)}
                            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-lg transition-all"
                            title="Delete companion profile"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* UNCONFIGURED RELATIONSHIP PROMPT: CONFIGURE LATER */}
                  {selectedFriend.relationship === "Configure Later" && (
                    <div className="bg-amber-50/70 border border-amber-300 rounded-2xl p-4.5 text-slate-800 text-left">
                      <div className="flex items-center gap-2 mb-2 text-amber-900 font-extrabold text-xs">
                        <AlertCircle className="w-4 h-4 text-amber-600 animate-pulse" />
                        <span>Establish Relationship Category Role</span>
                      </div>
                      <p className="text-[11px] text-slate-650 leading-relaxed mb-3">
                        This profile was imported using "Configure Later" option. Set their role now to organize custom locket views and activate alarms.
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {["Best Friend", "College Buddy", "Work Colleague", "Family Relative", "Gym Partner"].map(rel => (
                          <button
                            key={rel}
                            onClick={() => {
                              setFriends(prev => prev.map(f => f.id === selectedFriend.id ? { ...f, relationship: rel } : f));
                              appendLog(`🤝 Relations Configured: Assigned "${rel}" role to ${selectedFriend.name}`);
                              triggerToast("Role Established 🤝", `Set relationship style for ${selectedFriend.name} to ${rel}`);
                            }}
                            className="bg-white hover:bg-slate-50 border border-amber-250 hover:border-amber-450 text-slate-700 font-bold px-2.5 py-1.5 text-[10px] rounded-xl transition-all cursor-pointer shadow-2xs"
                          >
                            {rel}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Inline Profile Editor Mode */}
                  {isEditingFriend && (
                    <form onSubmit={handleSaveFriendProfile} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 uppercase">Interactive Profile Customizer</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Edit Companion Name</label>
                          <input 
                            type="text" 
                            value={editFriendName} 
                            onChange={(e) => setEditFriendName(e.target.value)} 
                            className="bg-white border rounded p-1 px-2 text-xs w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Edit Birthdate</label>
                          <input 
                            type="date" 
                            value={editFriendBirthday} 
                            onChange={(e) => setEditFriendBirthday(e.target.value)} 
                            className="bg-white border rounded p-1 px-2 text-xs w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Edit Turning Age</label>
                          <input 
                            type="number" 
                            value={editFriendAge} 
                            onChange={(e) => setEditFriendAge(e.target.value)} 
                            className="bg-white border rounded p-1 px-2 text-xs w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Edit Relationship</label>
                          <select 
                            value={editFriendRelationship} 
                            onChange={(e) => setEditFriendRelationship(e.target.value)} 
                            className="bg-white border rounded p-1 px-2 text-xs w-full"
                          >
                            <option value="Best Friend">Best Friend</option>
                            <option value="College Buddy">College Buddy</option>
                            <option value="Work Colleague">Work Colleague</option>
                            <option value="Family Relative">Family Relative</option>
                            <option value="Gym Partner">Gym Partner</option>
                            <option value="Self">Self</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Edit Phone Number</label>
                          <input 
                            type="text" 
                            value={editFriendPhone} 
                            onChange={(e) => setEditFriendPhone(e.target.value)} 
                            className="bg-white border rounded p-1 px-2 text-xs w-full font-mono text-slate-850"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Edit WhatsApp Number</label>
                          <input 
                            type="text" 
                            value={editFriendWhatsApp} 
                            onChange={(e) => setEditFriendWhatsApp(e.target.value)} 
                            className="bg-white border rounded p-1 px-2 text-xs w-full font-mono text-slate-850"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Edit Email Address</label>
                          <input 
                            type="email" 
                            value={editFriendEmail} 
                            onChange={(e) => setEditFriendEmail(e.target.value)} 
                            className="bg-white border rounded p-1 px-2 text-xs w-full font-mono text-slate-855"
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-0.5">Edit Username</label>
                          <input 
                            type="text" 
                            value={editFriendSnapchat} 
                            onChange={(e) => setEditFriendSnapchat(e.target.value)} 
                            className="bg-white border rounded p-1 px-2 text-xs w-full font-mono text-indigo-700 font-bold"
                          />
                        </div>
                      </div>

                      {/* Avatar backdrop background selector */}
                      <div>
                        <label className="block text-[9px] font-semibold text-slate-500 uppercase mb-1">Modify Avatar Theme Accent</label>
                        <div className="flex gap-2">
                          {["bg-teal-500", "bg-emerald-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500", "bg-rose-500", "bg-pink-500"].map(col => (
                            <button
                              key={col}
                              type="button"
                              onClick={() => setEditFriendAvatar(col)}
                              className={`w-6 h-6 rounded-full border-1.5 ${col} ${
                                editFriendAvatar === col ? "ring-2 ring-indigo-500 scale-110" : "ring-0"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1 border-t mt-3">
                        <button type="button" onClick={() => setIsEditingFriend(false)} className="px-3 py-1 bg-slate-200 text-slate-700 text-[10px] rounded font-semibold cursor-pointer">Cancel</button>
                        <button type="submit" className="px-3 py-1 bg-indigo-600 text-white text-[10px] rounded font-semibold cursor-pointer">Save Profile Modifications</button>
                      </div>
                    </form>
                  )}

                  {/* Circle Interests, Tag Shelf & Wishlist Panel Conditionally Gated */}
                  {selectedFriend.id !== 'alex' && !selectedFriend.connectedBack ? (
                    <div className="border-t border-slate-200 pt-8" id="mutual-connection-gate">
                      <h4 className="text-base font-black text-slate-900">@{selectedFriend.name.toLowerCase().replace(/\s+/g, "_")}</h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1">Connect with this person to see their full profile, interests, and wishlist.</p>
                    </div>
                  ) : (
                    <>
                      {/* Circle Interests / Tag Shelf */}
                      <div className="text-left">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Smile className="w-3.5 h-3.5 text-indigo-400" /> Circle Interests &amp; Tags
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {selectedFriend.interests.length === 0 ? (
                            <p className="text-xs text-slate-405 italic">No tagging descriptors bounded to registration cards.</p>
                          ) : (
                            selectedFriend.interests.map((tag, idx) => (
                              <div 
                                key={idx}
                                className="bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-colors border border-slate-150"
                              >
                                <span>#{tag}</span>
                                <button 
                                  onClick={() => handleRemoveInterestTag(tag)}
                                  className="text-slate-450 hover:text-rose-500 transition-colors cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Tag form adder */}
                        <form onSubmit={handleAddInterestTag} className="flex gap-2 max-w-sm">
                          <input 
                            type="text" 
                            placeholder="Attach hobby descriptors..." 
                            value={customInterest}
                            onChange={(e) => setCustomInterest(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs flex-grow focus:outline-none focus:ring-1 focus:ring-indigo-150 focus:bg-white"
                          />
                          <button 
                            type="submit" 
                            className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl block cursor-pointer"
                          >
                            Add Tag
                          </button>
                        </form>
                      </div>

                      {/* Companion Interactive Gift Locker Section */}
                      <div className="text-left border-t border-slate-200 pt-6">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <Gift className="w-3.5 h-3.5 text-rose-500 animate-pulse" /> Celebration Gift Locker
                          </span>
                          <span className="text-[10px] bg-rose-50 font-mono px-2 py-0.5 rounded font-extrabold text-rose-600">
                            {sentGifts.filter(g => g.friendId === selectedFriend.id).length} Items Received
                          </span>
                        </div>

                        {sentGifts.filter(g => g.friendId === selectedFriend.id).length === 0 ? (
                          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-150 text-center text-slate-500 text-xs shadow-3xs">
                            <p className="font-semibold text-slate-650">No boutique gifts received by {selectedFriend.name.split(" ")[0]} yet.</p>
                            <p className="text-[10.5px] text-slate-400 mt-1 font-sans">Surprise them with a classic red rose, floral bouquet or cash present sack!</p>
                            <button
                              type="button"
                              onClick={() => {
                                setGiftRecipientId(selectedFriend.id);
                                setGiftStoreTab("gallery");
                                setActiveSection("gift-store");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-750 text-white font-extrabold text-[10.5px] rounded-xl cursor-pointer transition active:scale-95 shadow-sm"
                            >
                              <span>Browse Gift Store 🌹</span>
                            </button>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                            {sentGifts
                              .filter(g => g.friendId === selectedFriend.id)
                              .map(gift => {
                                const isUnopened = gift.isOpened === false;
                                if (isUnopened) {
                                  return (
                                    <motion.div 
                                      key={gift.id}
                                      onClick={() => handleOpenGift(gift.id)}
                                      animate={{
                                        x: shakingGiftId === gift.id ? [0, -6, 6, -6, 6, -3, 3, -1, 1, 0] : 0,
                                        scale: shakingGiftId === gift.id ? 1.03 : 1,
                                      }}
                                      whileHover={{ scale: shakingGiftId === gift.id ? 1.03 : 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      transition={{ duration: 0.5 }}
                                      className="bg-gradient-to-br from-rose-50 to-indigo-50/50 hover:from-rose-100/80 hover:to-indigo-100/40 border border-rose-200/60 p-3.5 rounded-2xl text-left flex flex-col justify-between gap-3 transition-colors relative overflow-hidden shadow-2xs cursor-pointer group"
                                    >
                                      {/* Target Confetti Burst inside this card */}
                                      <ConfettiBurst active={activeConfettiGiftId === gift.id} onComplete={() => setActiveConfettiGiftId(null)} count={35} />

                                      <div className="absolute top-0 right-0 w-16 h-16 bg-rose-200/20 rounded-bl-full pointer-events-none -mr-4 -mt-4 group-hover:scale-110 transition-transform" />

                                      <div className="flex items-center gap-3">
                                        <span className="text-3xl shrink-0 animate-bounce" style={{ animationDuration: "2s" }}>
                                          🎁
                                        </span>
                                        <div>
                                          <h5 className="font-extrabold text-xs text-slate-800">Unopened Celebration Present</h5>
                                          <span className="text-[10px] text-rose-600 font-extrabold tracking-tight block mt-0.5">Dispatched securely on: {gift.dateSent}</span>
                                        </div>
                                      </div>

                                      <div className="bg-white p-2 text-center rounded-xl border border-rose-100/40 text-[10px] font-black text-indigo-600 hover:text-rose-600 uppercase tracking-wider transition-colors">
                                        ✨ Click to Tap & Unwrap SURPRISE! ✨
                                      </div>

                                      <div className="flex justify-between items-center text-[9px] font-mono text-slate-400">
                                        <span>Status: Sealed Locker</span>
                                        <span className="text-indigo-600 font-bold uppercase tracking-wider">● Unwrap Me</span>
                                      </div>
                                    </motion.div>
                                  );
                                }

                                return (
                                  <motion.div 
                                    key={gift.id}
                                    initial={{ opacity: 0, scale: 0.94 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.4 }}
                                    className="bg-[#FFFDFD] hover:bg-[#FFF9F9] border border-rose-100/85 hover:border-rose-200 p-3 rounded-2xl text-left flex flex-col justify-between gap-2.5 transition relative overflow-hidden"
                                  >
                                    <ConfettiBurst active={activeConfettiGiftId === gift.id} onComplete={() => setActiveConfettiGiftId(null)} count={30} />

                                    <div className="flex items-start gap-2">
                                      <span className="text-2xl mt-0.5 shrink-0">
                                        {gift.giftType === "rose" && "🌹"}
                                        {gift.giftType === "bouquet" && "💐"}
                                        {gift.giftType === "money" && "💰"}
                                      </span>
                                      <div className="min-w-0">
                                        <h5 className="font-extrabold text-xs text-slate-900 truncate">{gift.giftName}</h5>
                                        <span className="text-[10px] text-emerald-600 font-mono font-black block">{gift.price} • Opened</span>
                                      </div>
                                    </div>

                                    <div className="bg-slate-50 p-1.5 rounded-lg text-[10.5px] italic text-slate-600 leading-snug border border-slate-100/50 line-clamp-2">
                                      "{gift.message}"
                                    </div>

                                    <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1 border-t border-rose-100/40">
                                      <span>Sent: {gift.dateSent}</span>
                                      <span className="text-emerald-500 font-bold uppercase tracking-wider">● Unwrapped</span>
                                    </div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        )}
                      </div>

                      {/* Registered Wishlist Items Panel */}
                      <div className="text-left border-t border-slate-200 pt-6">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-extrabold text-[15px] text-slate-850 flex items-center gap-1.5">
                            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" /> Wishlist Desires Folder
                          </h4>
                          <span className="text-[10px] bg-slate-100 font-mono px-2 py-0.5 rounded font-extrabold text-slate-505">
                            {selectedFriend.wishlist.length} Items Listed
                          </span>
                        </div>

                        {/* Edit Wish Box inline */}
                        {editingWishId && (
                          <form onSubmit={saveEditedWishlistItem} className="bg-amber-50/50 p-4 rounded-2xl border border-amber-200 mb-4 space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Editing Selected Desire Entry</span>
                              <button type="button" onClick={() => setEditingWishId(null)} className="text-slate-505">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              <input 
                                type="text" 
                                required 
                                value={editingWishTitle} 
                                onChange={(e) => setEditingWishTitle(e.target.value)} 
                                placeholder="Desire Name" 
                                className="bg-white border rounded px-2.5 py-1 text-xs"
                              />
                              <input 
                                type="text" 
                                value={editingWishPrice} 
                                onChange={(e) => setEditingWishPrice(e.target.value)} 
                                placeholder="Estimated Pricing (e.g. $25)" 
                                className="bg-white border rounded px-2.5 py-1 text-xs"
                              />
                            </div>
                            <input 
                              type="text" 
                              value={editingWishUrl} 
                              onChange={(e) => setEditingWishUrl(e.target.value)} 
                              placeholder="Optional purchase link" 
                              className="bg-white border rounded px-2.5 py-1 text-xs w-full"
                            />
                            <div className="flex gap-2 justify-end pt-1">
                              <button type="button" onClick={() => setEditingWishId(null)} className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-[10.5px] cursor-pointer">Cancel</button>
                              <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded text-[10.5px] cursor-pointer">Save Changes</button>
                            </div>
                          </form>
                        )}

                        {/* Wishlist item catalogs */}
                        <div className="space-y-2.5 max-h-[290px] overflow-y-auto pr-1">
                          {selectedFriend.wishlist.length === 0 ? (
                            <div className="py-8 text-center text-zinc-450 bg-slate-50 rounded-2xl border border-slate-100">
                              <GiftIcon className="w-10 h-10 mx-auto text-zinc-400 stroke-1 mb-2 animate-pulse" />
                              <p className="text-xs font-semibold">No wishes defined inside companion folder registry.</p>
                              <button 
                                onClick={() => setIsAddingWish(true)} 
                                className="text-[11px] text-indigo-600 hover:underline font-bold mt-2"
                              >
                                Add desire item +
                              </button>
                            </div>
                          ) : (
                            selectedFriend.wishlist.map(wish => (
                              <div 
                                key={wish.id}
                                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-1.5 ${
                                  wish.isClaimed 
                                    ? "bg-slate-50/70 border-slate-200 opacity-80" 
                                    : "bg-white border-slate-150 hover:border-slate-300"
                                }`}
                              >
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1">
                                    <span className="text-xs font-bold text-slate-800 break-words">{wish.title}</span>
                                    <div className="flex items-center gap-3 mt-1.5">
                                      <span className="text-xs font-extrabold text-emerald-600 font-mono">{wish.price}</span>
                                      {wish.url && (
                                        <a 
                                          href={wish.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-[10px] text-indigo-600 hover:underline flex items-center gap-0.5 font-bold"
                                        >
                                          Purchase Platform <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-1.5 items-end justify-end shrink-0">
                                    {selectedFriend.id !== 'alex' ? (
                                      <button
                                        onClick={() => toggleClaimWishlistItem(selectedFriend.id, wish.id)}
                                        className={`px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-0.5 ${
                                          wish.isClaimed
                                            ? "bg-slate-200 text-slate-705 hover:bg-rose-100 hover:text-rose-600"
                                            : "bg-indigo-600 text-white hover:bg-indigo-750"
                                        }`}
                                      >
                                        {wish.isClaimed ? "Reserved Guide" : "Claim Gift"}
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-zinc-400 font-bold bg-zinc-100 px-1.5 py-0.5 rounded uppercase">Self Registry</span>
                                    )}

                                    <div className="flex gap-1.5 font-semibold">
                                      <button
                                        onClick={() => startEditingWishlistItem(wish)}
                                        className="p-1 text-slate-505 hover:text-indigo-600 hover:bg-indigo-50 rounded cursor-pointer"
                                        title="Edit wishlist card parameters"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => deleteWishlistItem(wish.id)}
                                        className="p-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                        title="Delete wishlist card parameters"
                                      >
                                        <Trash className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {wish.isClaimed && (
                                  <p className="text-[9.5px] italic font-semibold text-slate-500 bg-slate-100 rounded-lg p-1.5 px-2.5 w-fit">
                                    🎁 Commitment claimed by: {wish.claimedBy}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Inline desire adding drawer */}
                        {!isAddingWish && (
                          <button
                            onClick={() => setIsAddingWish(true)}
                            className="mt-4 w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl text-xs font-bold transition-all border border-dashed border-slate-200 flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add customized desire option</span>
                          </button>
                        )}

                        {isAddingWish && (
                          <form onSubmit={addWishlistItem} className="mt-4 bg-slate-50 p-4 border border-slate-200 rounded-2xl text-left space-y-3">
                            <div className="flex justify-between items-center bg-slate-150 p-1.5 rounded-lg">
                              <h5 className="text-[11px] font-bold text-slate-700 uppercase">Save New Desire Option</h5>
                              <button type="button" onClick={() => setIsAddingWish(false)} className="text-slate-400 hover:text-slate-650">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Desire Name / Description</label>
                                <input
                                  type="text"
                                  required
                                  placeholder="e.g. Saffron Bonsai Plant Pot (Standard size)"
                                  value={newItemTitle}
                                  onChange={(e) => setNewItemTitle(e.target.value)}
                                  className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Estimated Price Label</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. $30.00"
                                    value={newItemPrice}
                                    onChange={(e) => setNewItemPrice(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[9px] font-bold text-slate-500 uppercase mb-0.5">Store / Platform URL</label>
                                  <input
                                    type="text"
                                    placeholder="e.g. https://amazon.com/..."
                                    value={newItemUrl}
                                    onChange={(e) => setNewItemUrl(e.target.value)}
                                    className="w-full bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs focus:ring-1 focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              className="w-full py-2 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-colors"
                            >
                              Save Desire
                            </button>
                          </form>
                        )}
                      </div>
                    </>
                  )}

                </div>
              </div>
            </>
          ) : (
              <div className="w-full">
                {registrySubTab === "wishlist" && (
                  <div className="space-y-6 animate-fade-in" id="profile-subtab-wishlist">
                    {/* User profile details ribbon */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row justify-between items-stretch gap-6 shadow-xs text-left" id="my-profile-banner">
                      <div className="flex gap-4 items-center">
                        <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-black text-2xl font-serif">
                          {userSession ? userSession.name.split(" ").map(n => n[0]).join("") : "AP"}
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">{userSession ? userSession.name : "Alex Patel (You)"}</h3>
                          <p className="text-xs text-slate-500 font-semibold">Registered Status: <span className="font-extrabold text-indigo-600 font-mono">Self Account</span> • Username: <span className="font-extrabold text-indigo-600">@{userSession ? userSession.username : "alex"}</span></p>
                          <p className="text-xs text-slate-400">Current calendar birthday: <span className="font-semibold text-indigo-600 font-mono">{userSession ? userSession.birthday : "1997-06-25"}</span></p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-row items-center gap-6 justify-between flex-1 md:flex-initial">
                        <div className="flex items-center gap-4">
                          <div className="bg-teal-50 p-4 rounded-2xl border border-teal-150 text-left min-w-[130px]">
                            <span className="text-[9px] font-bold text-teal-800 uppercase block select-none">Desires bound</span>
                            <span className="text-xl font-bold text-slate-900 block font-mono">{friends.find(f => f.id === 'alex')?.wishlist.length} items</span>
                          </div>
                          <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-150 text-left min-w-[130px]">
                            <span className="text-[9px] font-bold text-indigo-800 uppercase block select-none">Claimed by friends</span>
                            <span className="text-xl font-bold text-slate-900 block font-mono">
                              {friends.find(f => f.id === 'alex')?.wishlist.filter(w => w.isClaimed).length} items
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-center gap-2 pl-0 md:pl-6 border-t pt-4 sm:pt-0 sm:border-t-0 md:border-t-0 md:border-l md:border-slate-150 w-full sm:w-auto min-w-[160px]">
                          <button
                            type="button"
                            onClick={() => setIsShareModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Share QR Pass</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const username = userSession ? userSession.username : "alex";
                              const shareUrl = `${window.location.origin}/?user=${username}`;
                              navigator.clipboard.writeText(shareUrl);
                              triggerToast("Copied External Link! 🔗", "Ready to share with friends outside the app.");
                            }}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Copy Share Link</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Private desires workspace table panel */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 text-left">
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="font-bold text-base text-slate-800 flex items-center gap-2">
                          <Gift className="w-5 h-5 text-rose-500 animate-pulse" /> My Public Wishlist Folders
                        </h4>
                        <p className="text-xs text-slate-400">Claims made on this screen simulation represent companions reserving gifts for your landmark day.</p>
                      </div>

                      {/* Grid items */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.find(f => f.id === 'alex')?.wishlist.map(wish => (
                          <div 
                            key={wish.id}
                            className="p-4 rounded-2xl border border-slate-150 bg-slate-50 flex justify-between items-start gap-4 transition-all hover:bg-slate-100/50"
                          >
                            <div className="flex-1">
                              <span className="text-xs font-bold text-slate-800 block">{wish.title}</span>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs font-black text-emerald-600 font-mono">{wish.price}</span>
                                {wish.url && (
                                  <a 
                                    href={wish.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[10px] text-indigo-650 font-bold hover:underline flex items-center gap-0.5"
                                  >
                                    Store reference <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>

                              {wish.isClaimed && (
                                <div className="mt-3 bg-teal-500/10 border border-teal-500/20 text-teal-800 text-[9.5px] font-bold p-1 px-2.5 rounded-lg w-fit">
                                  🔒 Reserved in secret by {wish.claimedBy}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 items-end shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedFriendId("alex");
                                  startEditingWishlistItem(wish);
                                  setRegistrySubTab("list");
                                }}
                                className="p-1 px-2 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded block font-semibold cursor-pointer"
                              >
                                Modify Entry
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFriendId("alex");
                                  deleteWishlistItem(wish.id);
                                }}
                                className="p-1 px-2 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 rounded block mt-1 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

{/* Trigger to quick add wishes */}
<div className="pt-6 border-t border-slate-150 mt-6">
  {!isAddingWish ? (
    <button
      onClick={() => {
        setIsAddingWish(true);
      }}
      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      <span>Add to my wishlist</span>
    </button>
  ) : (
    <form onSubmit={addWishlistItem} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex justify-between items-center">
        <h5 className="text-[11px] font-bold text-slate-700 uppercase">New Wish Item</h5>
        <button type="button" onClick={() => setIsAddingWish(false)} className="text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        type="text"
        required
        placeholder="Item name e.g. Nike Air Max"
        value={newItemTitle}
        onChange={(e) => setNewItemTitle(e.target.value)}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Price e.g. $50"
          value={newItemPrice}
          onChange={(e) => setNewItemPrice(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Store URL (optional)"
          value={newItemUrl}
          onChange={(e) => setNewItemUrl(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
      >
        Save to Wishlist
      </button>
    </form>
  )}
</div>
                    </div>
                  </div>
                )}

                {registrySubTab === "trophies" && (
                  <div className="space-y-6 text-left animate-fade-in" id="profile-subtab-trophies">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                      <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block font-mono">Gamification Analyzer</span>
                          <h3 className="text-xl font-extrabold text-slate-900 mt-1">{userSession ? userSession.name.split(" ")[0] : "Alexander"}'s Pro Gift-Giving Milestones</h3>
                          <p className="text-xs text-slate-500 mt-0.5 animate-pulse">Collect trophies by creating active lists and claiming companion wishes</p>
                        </div>

                        <div className="mt-6 space-y-2">
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-extrabold text-indigo-600 uppercase tracking-wider">Level Progression</span>
                            <span className="font-black text-indigo-700 font-mono">Level {unlockLevel} (Gift Master Rank)</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${Math.min((friends.find(f => f.id === 'alex')?.achievements.length || 0) * 20, 100)}%` }}
                            />
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-zinc-400 font-semibold gap-1">
                            <span>{(friends.find(f => f.id === 'alex')?.achievements.length || 0)} milestones unlocked</span>
                            <span>•</span>
                            <span>{6 - (friends.find(f => f.id === 'alex')?.achievements.length || 0)} left to max prestige</span>
                          </div>
                        </div>
                      </div>

                      <div className="md:col-span-4 bg-emerald-50 rounded-3xl border border-emerald-150 p-6 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-emerald-950 text-sm">Coordinator Roster</h4>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            Share achievements securely with your other sync groups by clicking each awarded badge copy.
                          </p>
                        </div>
                        <div className="bg-white/80 rounded-2xl p-3 border border-emerald-250 text-[11px] font-semibold">
                          🏆 Prestige Ranks: 
                          <ul className="list-disc pl-4 mt-1 font-normal text-slate-500 space-y-0.5">
                            <li>Novice Coordinator (Lvl 1 - 3)</li>
                            <li>Expert Scheduler (Lvl 4 - 7)</li>
                            <li>Elite Gift Master (Lvl 8 - 12)</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Badges Grid */}
                    <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">Milestones Achievements Directory</span>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="badges-grid-roster">
                        {ALL_ACHIEVEMENTS_LIST.map((ach) => {
                          const isUnlocked = friends.find(f => f.id === 'alex')?.achievements.some(a => a.title === ach.title);
                          
                          return (
                            <div
                              key={ach.title}
                              onClick={() => {
                                if (isUnlocked) {
                                  const copyText = `🎉 Unlocked Achievement: "${ach.title}" — ${ach.description}`;
                                  navigator.clipboard.writeText(copyText).then(() => {
                                    triggerToast("Copied to Clipboard!", "Social sharing text saved successfully in clipboard.");
                                  });
                                } else {
                                  triggerToast("Locked Milestone", "Complete wishlist directories or claim tasks to award this badge.");
                                }
                              }}
                              className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                                isUnlocked 
                                  ? "bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-emerald-350 hover:border-emerald-500 cursor-pointer shadow-xs" 
                                  : "bg-slate-50 border-slate-150 opacity-60"
                              }`}
                              title={isUnlocked ? "Click to copy achievement to clipboard" : "Milestone Locked"}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm font-serif shrink-0 border ${
                                isUnlocked ? "bg-emerald-500 text-white border-emerald-350" : "bg-slate-200 text-slate-400 border-slate-300"
                              }`}>
                                {isUnlocked ? "🏆" : "🔒"}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-black text-slate-900 leading-tight block truncate">{ach.title}</p>
                                <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{ach.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
            </div>
          )}

          {/* ==================== SCREEN 3: SMART AI GIFT LAB ==================== */}
          {activeSection === "ai-lab" && (
            <div className="bg-white rounded-[2rem] border border-slate-200 p-8 text-center space-y-6 max-w-xl mx-auto my-12 shadow-sm" id="view-ai-lab-hull">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-xs">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 leading-tight font-sans">Gemini Spark AI Ideas</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                The AI Gift Suggestions feature is now a global floating Sparkle Assistant! You can launch it instantly from the bottom right corner of any view, so you never lose your place.
              </p>
              <div className="pt-2">
                <button
                  onClick={() => setIsAiLabOpen(true)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2 border-none"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Summon Spark Assistant</span>
                </button>
              </div>
            </div>
          )}

          {activeSection === "ai-lab-legacy-hidden" && (
            <div className="bg-indigo-50/50 rounded-[2rem] border border-indigo-100 p-6 md:p-8 space-y-6 text-left" id="view-ai-lab-hull">
              
              {/* Header explanation banner */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-indigo-100/60 pb-6">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow">
                    <Wand2 className="w-6 h-6 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-lg text-indigo-950">Smart Spark AI Ideas Lab</h3>
                    <p className="text-xs text-slate-500">Query the Gemini LLM pipeline to find inspired gift matches based on companion parameters</p>
                  </div>
                </div>

                <div className="bg-indigo-100 text-indigo-750 font-bold px-3 py-1 text-xs rounded-full border border-indigo-200">
                  Model Ref: Gemini 3.5 Flash
                </div>
              </div>

              {/* Form parameters workbench */}
              <div className="bg-white rounded-3xl p-6 border border-indigo-100/60 grid grid-cols-1 md:grid-cols-12 gap-5 items-end">
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Target Companion Context</label>
                  <select
                    value={selectedFriendId}
                    onChange={(e) => setSelectedFriendId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-150 font-bold text-slate-800"
                  >
                    {friends.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} (Turns {f.age})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Relation Parameter</label>
                  <input
                    type="text"
                    value={aiRelationship}
                    onChange={(e) => setAiRelationship(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Target Age Group</label>
                  <input
                    type="text"
                    value={aiAge}
                    onChange={(e) => setAiAge(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">Matching Budget Bracket</label>
                  <select
                    value={aiBudget}
                    onChange={(e) => setAiBudget(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3 py-2 text-xs focus:outline-none font-semibold text-slate-800"
                  >
                    <option value="under $20">under $20 (Essential)</option>
                    <option value="under $50">under $50 (Standard tier)</option>
                    <option value="under $100">under $100 (Premium tier)</option>
                    <option value="above $200">above $200 (Luxury limit)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    onClick={handleGetGiftSuggestions}
                    disabled={isLoadingAi}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isLoadingAi ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Querying...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Trigger AI</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Tag previews indicator from target user */}
              <div className="flex gap-2 items-center text-xs">
                <span className="font-bold text-slate-500">Loaded companion interests:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedFriend.interests.map((i, idx) => (
                    <span key={idx} className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded">
                      #{i}
                    </span>
                  ))}
                  {selectedFriend.interests.length === 0 && <span className="text-slate-400 italic">None bound. Tweak in Buddies Registry to feed AI.</span>}
                </div>
              </div>

              {/* Suggestions Results Feed */}
              <div className="space-y-4">
                {isLoadingAi ? (
                  <div className="py-16 flex flex-col items-center justify-center text-indigo-600 gap-3 text-center bg-white rounded-3xl border border-indigo-100/60 shadow-xs">
                    <span className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500 animate-pulse">Consulting Gemini Flash with profile tag scores...</p>
                  </div>
                ) : aiSuggestions.length === 0 ? (
                  <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-indigo-200">
                    <GiftIcon className="w-12 h-12 text-indigo-400/80 mx-auto stroke-1 mb-2 animate-bounce" />
                    <p className="font-bold text-slate-800 text-xs text-slate-700">Ready to initiate recommendations query</p>
                    <p className="text-[10px] text-slate-400 mt-1">Configure criteria cards above and trigger the processor to list curated gifts.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="ai-lab-suggestions-feed">
                    {aiSuggestions.map((gift, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-indigo-100 hover:border-indigo-300 shadow-sm p-5 rounded-2xl flex flex-col justify-between transition-colors text-left"
                      >
                        <div className="space-y-3">
                          <div className="flex justify-between items-start gap-1">
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase">
                              {gift.category || "Gift Option"}
                            </span>
                            <span className="text-xs font-extrabold text-emerald-600 font-mono">{gift.estimatedPrice}</span>
                          </div>
                          
                          <h5 className="font-black text-xs text-indigo-950 mb-1 flex items-center gap-1">
                            🎁 {gift.name}
                          </h5>
                          
                          <p className="text-[11px] text-slate-500 leading-relaxed font-normal">
                            {gift.reason}
                          </p>
                        </div>
                        
                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                          <span className="text-[10px] text-emerald-600 font-extrabold">98% Match Rating</span>
                          <button 
                            onClick={() => saveAiSuggestionToWishlist(gift)}
                            className="text-[11px] text-indigo-600 font-black hover:underline cursor-pointer"
                          >
                            Save to Registry +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {aiNote && !isLoadingAi && (
                  <div className="flex items-center gap-2 mt-4 bg-white p-3 text-[10.5px] rounded-xl text-slate-500 border border-indigo-100 shadow-xs">
                    <Info className="w-4 h-4 text-indigo-500 shrink-0" />
                    <span>{aiNote}</span>
                  </div>
                )}
              </div>

            </div>
          )}


          {/* Screens 4, 5, and 6 are beautifully integrated and consolidated as interactive subsections inside the redone unified My Profile tab view */}

          {/* ==================== SCREEN 7: MY PROFILE & WORKSPACE SETTINGS ==================== */}
          {activeSection === "profile" && (
            <div className="space-y-6 text-left" id="view-signin-custom-hull">
              
              {/* Introduction Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-left text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
                <button
  type="button"
  onClick={() => setIsDarkMode(prev => !prev)}
  className="absolute right-16 top-4 inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/20 transition"
  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
>
  {isDarkMode ? (
    <Sun className="w-5 h-5 text-amber-400" />
  ) : (
    <Moon className="w-5 h-5" />
  )}
</button>

                <button
                  type="button"
                  onClick={() => setIsProfileSettingsOpen(true)}
                  className="absolute right-4 top-4 inline-flex items-center justify-center h-10 w-10 rounded-2xl bg-white/10 text-white hover:bg-white/20 border border-white/20 transition"
                  title="Open profile settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" />
                  <span>My Profile</span>
                </h3>
                <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed max-w-2xl font-sans">
                  A single page for your account info, wishlist items, widget preview, and trophies.
                </p>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 border border-slate-200">
                <button onClick={() => setProfileSubTab("profile")} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${profileSubTab === "profile" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900"}`}>
                  <User className="w-3.5 h-3.5" /><span>My Profile</span>
                </button>
                <button onClick={() => setProfileSubTab("wishlist")} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${profileSubTab === "wishlist" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900"}`}>
                  <Heart className="w-3.5 h-3.5" /><span>My Wishlist</span>
                </button>
                <button onClick={() => setProfileSubTab("trophies")} className={`flex-1 py-2 text-xs font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${profileSubTab === "trophies" ? "bg-white text-slate-900 shadow-md" : "text-slate-500 hover:text-slate-900"}`}>
                  <Award className="w-3.5 h-3.5" /><span>Trophies</span>
                </button>
              </div>


              {false && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-fade-in" id="profile-subtab-settings-deck">
                  {/* Left preferences pane */}
                  <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-xs space-y-6 flex flex-col justify-between">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <Bell className="w-4.5 h-4.5 text-indigo-600" />
                          <span>Notification Channels &amp; Reminders</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Configure how and when the system alerts you in advance of companion special landmarks.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-250 rounded-xl text-left">
                          <div className="text-left">
                            <span className="text-xs font-black text-slate-800 block">WhatsApp Notification Gateway</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">Attempt custom pre-formatted direct messages for active celebrations.</span>
                          </div>
                          <div className="flex items-center">
                            <input 
                              type="checkbox"
                              checked={notifyWhatsApp}
                              onChange={(e) => {
                                setNotifyWhatsApp(e.target.checked);
                                playNotificationSound();
                                triggerToast("Preference Synced", `WhatsApp messaging is now ${e.target.checked ? "Enabled" : "Disabled"}.`);
                              }}
                              className="w-4.5 h-4.5 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-250 rounded-xl text-left">
                          <div className="text-left">
                            <span className="text-xs font-black text-slate-800 block">Snapchat Swipe Reminders</span>
                            <span className="text-[10px] text-slate-500 mt-1 block">Toggle reminders to snap buddies and send quick AR filter links.</span>
                          </div>
                          <div className="flex items-center">
                            <input 
                              type="checkbox"
                              checked={notifySnapchat}
                              onChange={(e) => {
                                setNotifySnapchat(e.target.checked);
                                playNotificationSound();
                                triggerToast("Preference Synced", `Snapchat reminders are now ${e.target.checked ? "Enabled" : "Disabled"}.`);
                              }}
                              className="w-4.5 h-4.5 text-indigo-600 border-slate-350 rounded focus:ring-indigo-505 cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Advance Days Selector */}
                        <div className="space-y-2 pt-2 text-left">
                          <div className="flex justify-between items-center text-xs font-bold text-slate-800">
                            <span>Advance Landmark Alert Lead-time</span>
                            <span className="bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded font-mono font-black">{notifyAdvanceDays} Days Before</span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            The number of days prior to a birthday that notifications are queued in your activity center feed.
                          </p>
                          <input 
                            type="range"
                            min="1"
                            max="14"
                            value={notifyAdvanceDays}
                            onChange={(e) => setNotifyAdvanceDays(parseInt(e.target.value, 10))}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                          />
                          <div className="flex justify-between text-[9px] text-slate-400 font-bold font-mono">
                            <span>1 Day (Urgent)</span>
                            <span>7 Days (Weekly)</span>
                            <span>14 Days (Biweekly)</span>
                          </div>
                        </div>
                      </div>

                      {/* Display Preferences */}
                      <div className="border-t border-slate-150 pt-5 space-y-4 text-left">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                            <Sliders className="w-4.5 h-4.5 text-indigo-600" />
                            <span>System &amp; Display Options</span>
                          </h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Currency</label>
                            <select 
                              value={globalCurrency}
                              onChange={(e) => {
                                setGlobalCurrency(e.target.value);
                                triggerToast("Currency Preference", `System cash display changed to ${e.target.value}.`);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 text-slate-850 rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="GHS">GHS (Ghana Cedi - ₵)</option>
                              <option value="USD">USD (US Dollar - $)</option>
                              <option value="EUR">EUR (Euro - €)</option>
                              <option value="GBP">GBP (British Pound - £)</option>
                              <option value="CAD">CAD (Canadian Dollar - $)</option>
                            </select>
                          </div>

                          <div className="space-y-3 pt-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Chime Sound Effects</span>
                              <input 
                                type="checkbox"
                                checked={soundEffectsEnabled}
                                onChange={(e) => setSoundEffectsEnabled(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-slate-355 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-700">Fun Confetti</span>
                              <input 
                                type="checkbox"
                                checked={confettiOnBirthdays}
                                onChange={(e) => setConfettiOnBirthdays(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-slate-355 rounded focus:ring-indigo-500 cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-slate-150 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm("Are you sure you want to reset all custom companion data and settings back to system defaults?")) {
                            localStorage.clear();
                            triggerToast("System Rebuilt ✅", "Reloaded page and wiped custom preferences memory cache.");
                            setTimeout(() => {
                              window.location.reload();
                            }, 1200);
                          }
                        }}
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 py-3 rounded-2xl text-xs font-black text-center cursor-pointer transition-colors"
                      >
                        Reset System Memory Cache to Default
                      </button>
                    </div>
                  </div>

                  {/* Right side Security, Privacy & Diagnostic controls */}
                  <div className="lg:col-span-5 bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col justify-between space-y-6 text-left">
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                          <EyeOff className="w-4.5 h-4.5 text-indigo-600" />
                          <span>Privacy &amp; Mutual Sync Rules</span>
                        </h4>
                        <p className="text-[11px] text-zinc-500 mt-0.5">
                          Control how your profile coordinates are viewed by other workspace members.
                        </p>
                      </div>

                      <div className="space-y-4 text-left">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">My Profile Visibility Status</label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { key: "Public", desc: "Visible to All" },
                              { key: "Linked", desc: "Buddies Only" },
                              { key: "Private", desc: "Fully Stealth" }
                            ].map(item => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => {
                                  setGlobalVisibility(item.key as any);
                                  triggerToast("Privacy State Changed", `Your profile visibility is set to: ${item.key}`);
                                }}
                                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                                  globalVisibility === item.key
                                    ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm"
                                    : "bg-slate-50 border-slate-205 text-slate-600 text-[10.5px] hover:bg-slate-100"
                                }`}
                              >
                                <span className="text-xs block leading-tight">{item.key}</span>
                                <span className={`text-[8.5px] block mt-0.5 ${globalVisibility === item.key ? "text-indigo-200" : "text-zinc-400"}`}>{item.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-slate-150 pt-4 space-y-3">
                          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left">
                            <div className="text-left">
                              <span className="text-xs font-extrabold text-slate-800 block">Hide Age</span>
                              <p className="text-[10px] text-slate-500 mt-0.5">Hide your actual age value inside searchable widgets and digital passes.</p>
                            </div>
                            <input 
                              type="checkbox"
                              checked={!showAgeInProfile}
                              onChange={(e) => setShowAgeInProfile(!e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>

                          <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 text-left">
                            <div className="text-left">
                              <span className="text-xs font-extrabold text-slate-800 block">Auto Friend Sync</span>
                              <p className="text-[10px] text-slate-500 mt-0.5">Automatically toggle "Mutual Hands" back when people scan your digital pass.</p>
                            </div>
                            <input 
                              type="checkbox"
                              checked={autoApproveHandshakes}
                              onChange={(e) => setAutoApproveHandshakes(e.target.checked)}
                              className="w-4 h-4 text-indigo-600 border-slate-350 rounded focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Active Connection & Workspace Status Panel */}
                      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-3 text-left">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-600 block">Stats</span>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Companions Registered:</span>
                            <span className="font-extrabold text-slate-800">{friends.length} Buddies</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Notifications Sent:</span>
                            <span className="font-extrabold text-slate-800">{notifications.length} Logs</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-500">Direct Message State:</span>
                            <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                              <span>Ready to Connect</span>
                            </span>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200">
                          <button
                            type="button"
                            onClick={() => {
                              playNotificationSound();
                              triggerToast("Ping sent 🔔", "A fun notification sound just played.");
                            }}
                            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-black rounded-lg transition-colors cursor-pointer text-center"
                          >
                            Diagnose Chime &amp; Test Banner Alert
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 p-4 rounded-2xl text-left text-white space-y-1.5 relative overflow-hidden border border-indigo-900">
                      <span className="text-[8px] uppercase tracking-widest font-black text-indigo-400 block font-mono">Privacy</span>
                      <p className="text-xs font-black text-white leading-tight">Private Local Sandbox Active</p>
                      <p className="text-[10px] text-indigo-200 leading-normal">
                        All configuration keys, settings, and companion birthdays are stored locally. No sensitive account tokens exit your viewport browser canvas.
                      </p>
                    </div>
                  </div>
                </div>

                {/* SMART OPTIMIZATION RECOMMENDATIONS BOARD */}
                <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 md:p-8 space-y-6 text-left shadow-sm mt-8">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 border-slate-200">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-indigo-650 animate-pulse" />
                        <span>Help & Tips</span>
                      </h4>
                      <p className="text-xs text-slate-500">
                        Dynamic workspace attributes analyzed in real-time. Optimize alerts, privacy boundaries, and media delivery.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Diagnosis State:</span>
                      {(!soundEffectsEnabled || notifyAdvanceDays < 7 || globalVisibility === "Public" || !confettiOnBirthdays || !autoApproveHandshakes) ? (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                          <span>Actionable Suggestions Ready</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 font-mono text-[10px] font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>100% Fully Optimized</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Suggestion 1: Advance lead time */}
                    {notifyAdvanceDays < 7 && (
                      <div className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-300">
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded tracking-wide">Urgency Alert</span>
                          <p className="text-xs font-bold text-slate-800">Landmark Alert Lead-Time is Short (Current: {notifyAdvanceDays} Days)</p>
                          <p className="text-[11px] text-slate-500">Altering alerts to a shorter warning than a week might delay processing custom deliveries from your workspace gift boutique. Adjusting to at least 7 days is suggested.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNotifyAdvanceDays(7);
                            triggerToast("Lead-time Optimized", "Adjusted advance warning lead-time to 7 days for boutique preparation.");
                            playNotificationSound();
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          Optimize to 7 Days
                        </button>
                      </div>
                    )}

                    {/* Suggestion 2: Chime Sound Effects */}
                    {!soundEffectsEnabled && (
                      <div className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-300">
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded tracking-wide">Acoustic Chimes</span>
                          <p className="text-xs font-bold text-slate-800">Chime Sound Effects Muted</p>
                          <p className="text-[11px] text-slate-500">Enable comforting auditory chime feedback when saving gifts, scanning QR handshakes, and completing workspace updates.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSoundEffectsEnabled(true);
                            triggerToast("Acoustics Optimized", "Auditory sound effect chimes have been enabled.");
                            playNotificationSound(true);
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          Enable Sound Chimes
                        </button>
                      </div>
                    )}

                    {/* Suggestion 3: Privacy Visibility */}
                    {globalVisibility === "Public" && (
                      <div className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-300">
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-50 px-2 py-0.5 rounded tracking-wide">Security &amp; Stealth</span>
                          <p className="text-xs font-bold text-slate-800">Broad Public Discoverability is Active</p>
                          <p className="text-[11px] text-slate-500">If your workspace is private, limit discoverability to Linked Buddies Only to restrict global search queries and secure your identity card.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setGlobalVisibility("Linked");
                            triggerToast("Privacy Tuned", "Discoverability restricted to Linked Buddies Only.");
                            playNotificationSound();
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          Restrict to Linked Only
                        </button>
                      </div>
                    )}

                    {/* Suggestion 4: Confetti celebrate */}
                    {!confettiOnBirthdays && (
                      <div className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-300">
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-black uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded tracking-wide">Festivity Chimes</span>
                          <p className="text-xs font-bold text-slate-800">Celebration Confetti Disallowed</p>
                          <p className="text-[11px] text-slate-500">Allow gorgeous aesthetic confetti explosions when viewing interactive companion countdowns and milestones.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setConfettiOnBirthdays(true);
                            triggerToast("Festivals Enabled", "Milestone confetti explosion triggers have been enabled.");
                            playNotificationSound();
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          Enable Confetti
                        </button>
                      </div>
                    )}

                    {/* Suggestion 5: Auto handshake reciprocating */}
                    {!autoApproveHandshakes && (
                      <div className="p-4 bg-white border border-slate-150 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-slate-300">
                        <div className="space-y-1 text-left">
                          <span className="text-[9px] font-black uppercase text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded tracking-wide">Sync Automation</span>
                          <p className="text-xs font-bold text-slate-800">Reciprocal QR Handshakes are Manual</p>
                          <p className="text-[11px] text-slate-500">Automatically connect back and mirror mutual buddies when people scan your digital pass to streamline workspace synchronization.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAutoApproveHandshakes(true);
                            triggerToast("QR Sync Automation Activated", "Handshake reciprocity set to auto-mirror.");
                            playNotificationSound();
                          }}
                          className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.02] text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-xs shrink-0"
                        >
                          Activate Reciprocity
                        </button>
                      </div>
                    )}

                    {/* All optimised banner */}
                    {soundEffectsEnabled && notifyAdvanceDays >= 7 && globalVisibility !== "Public" && confettiOnBirthdays && autoApproveHandshakes && (
                      <div className="p-8 bg-gradient-to-br from-indigo-950 to-indigo-900 border border-indigo-800 text-white rounded-3xl flex flex-col md:flex-row items-center gap-6 shadow-md">
                        <div className="w-14 h-14 bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-400 shrink-0 border border-indigo-500/20">
                          <Check className="w-7 h-7 text-indigo-400 animate-bounce" />
                        </div>
                        <div className="space-y-1.5 text-left">
                          <h5 className="font-extrabold text-base text-white">All Workspace Diagnostics in Perfect Alignment!</h5>
                          <p className="text-[11px] leading-relaxed text-indigo-200">
                            Your companion notifications, audio feedback, reciprocity handshakes, display options, and security privacy filters are fully tuned to maximize digital integration. Great job managing your workspace!
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
              )}

              {activeSection === "profile" && profileSubTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                
                {/* COLUMN 1: Active user session configuration form (Span 6) */}
                <div className="lg:col-span-6 bg-white rounded-[2rem] border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                        <Sliders className="w-4.5 h-4.5 text-indigo-600" />
                        <span>Edit Profile</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Keep your name, username, birthday, and contact info up to date.
                      </p>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!signInName.trim() || !signInUsername.trim() || !signInEmail.trim() || !signInPhone.trim() || !signInWhatsApp.trim()) {
                          triggerToast("Missing Fields ⚠️", "Please fill in your full name, username, phone, WhatsApp, and email.");
                          return;
                        }
                        const sessionObj = {
                          uid: userSession?.uid || "",
                          name: signInName.trim(),
                          username: signInUsername.trim().replace(/^@/, ""),
                          email: signInEmail.trim(),
                          phone: signInPhone.trim(),
                          whatsapp: signInWhatsApp.trim(),
                          birthday: signInBirthday || "1997-06-25",
                          avatar: signInAvatar || "bg-indigo-600",
                          interests: signInInterests,
                        };
                        localStorage.setItem("birthday_authenticated_user", JSON.stringify(sessionObj));
                        // Save to multi-account registry
                        const existingAccounts = localStorage.getItem("hbd_all_accounts");
                        const accountsArray = existingAccounts ? JSON.parse(existingAccounts) : [];
                        const filteredAccounts = accountsArray.filter((a: any) => a.email !== sessionObj.email);
                        localStorage.setItem("hbd_all_accounts", JSON.stringify([...filteredAccounts, sessionObj]));
                        
                        // Write to Firestore as single source of truth
                        (async () => {
                          try {
                            const { doc, setDoc } = await import("firebase/firestore");
                            await setDoc(doc(db, "users", sessionObj.uid), sessionObj, { merge: true });
                          } catch (e) {
                            console.error(e);
                          }
                        })();

                        setUserSession(sessionObj);
                        triggerToast("Session Restructured", `Your active workspace handle is synced to @${sessionObj.username}!`);
                        appendLog(`🔐 Session Updated: Handle configured to @${sessionObj.username}.`);
                      }}
                      className="space-y-3.5 text-left"
                    >
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full Name</label>
                        <input
                          type="text"
                          required
                          value={signInName}
                          onChange={(e) => setSignInName(e.target.value)}
                          placeholder="e.g. Alex Patel"
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-sans">Username</label>
                          <input
                            type="text"
                            required
                            value={signInUsername}
                            onChange={(e) => setSignInUsername(e.target.value)}
                            placeholder="e.g. alex_snap"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Your Birthday</label>
                          <input
                            type="date"
                            required
                            value={signInBirthday}
                            onChange={(e) => setSignInBirthday(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-1.5 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-sans">Phone Number</label>
                          <input
                            type="text"
                            required
                            value={signInPhone}
                            onChange={(e) => setSignInPhone(e.target.value)}
                            placeholder="e.g. +233241234567"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-sans">WhatsApp Number</label>
                          <input
                            type="text"
                            required
                            value={signInWhatsApp}
                            onChange={(e) => setSignInWhatsApp(e.target.value)}
                            placeholder="e.g. +233241234567"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1 font-sans">Email Address</label>
                          <input
                            type="email"
                            required
                            value={signInEmail}
                            onChange={(e) => setSignInEmail(e.target.value)}
                            placeholder="e.g. alex@example.com"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-xl px-3.5 py-2 text-xs font-semibold outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                        </div>
                      </div>

                      {/* Avatar Palette Selection */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Favorite Avatar Accent</label>
                        <div className="flex gap-2">
                          {[
                            { bg: "bg-teal-500", name: "Teal" },
                            { bg: "bg-indigo-500", name: "Indigo" },
                            { bg: "bg-amber-500", name: "Amber" },
                            { bg: "bg-rose-500", name: "Rose" },
                            { bg: "bg-emerald-500", name: "Emerald" },
                            { bg: "bg-pink-500", name: "Plum" }
                          ].map(pal => (
                            <button
                              key={pal.bg}
                              type="button"
                              onClick={() => setSignInAvatar(pal.bg)}
                              className={`w-7 h-7 rounded-lg transition-transform hover:scale-110 flex items-center justify-center cursor-pointer relative ${pal.bg} ${
                                signInAvatar === pal.bg ? "ring-2 ring-indigo-600 ring-offset-2 ring-offset-white scale-105" : "opacity-75"
                              }`}
                              title={pal.name}
                            >
                              {signInAvatar === pal.bg && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Dynamic Interests Choice Box */}
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">Select Main Interest Niches</label>
                        <div className="flex flex-wrap gap-1.5 font-sans">
                          {[
                            "Photography", "Specialty Coffee", "Cyberpunk Novels", "Mechanic Keyboards",
                            "Yoga & Zen", "Hiking & Trails", "Baking Cakes", "Guitar Instrumental", "Modern Design"
                          ].map(tag => {
                            const isChosen = signInInterests.includes(tag);
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => {
                                  if (isChosen) {
                                    setSignInInterests(prev => prev.filter(t => t !== tag));
                                  } else {
                                    setSignInInterests(prev => [...prev, tag]);
                                  }
                                }}
                                className={`px-2 py-1.5 rounded-lg text-[9px] font-bold font-sans tracking-tight transition-colors cursor-pointer border ${
                                  isChosen 
                                    ? "bg-indigo-50 text-indigo-600 border-indigo-200 font-extrabold" 
                                    : "bg-slate-50 text-slate-500 border-slate-200 hover:text-slate-800"
                                }`}
                              >
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full text-center bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white py-3 rounded-2xl font-black text-xs transition-all shadow-xl shadow-indigo-150 tracking-wide cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <CheckCheck className="w-4 h-4" />
                        <span>Update Workspace Session</span>
                      </button>
                    </form>

                    {/* HBD Digital Member QR Pass Card */}
                    <div className="mt-6 border-t border-slate-150 pt-5 space-y-3 text-left">
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 px-2 bg-indigo-50 text-indigo-600 rounded-lg font-black text-[9px] tracking-wide uppercase">QR Handshake System</span>
                        <h5 className="font-extrabold text-[12px] text-slate-800">My Handshake Profile QR Pass</h5>
                      </div>
                      
                      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-[1.5rem] p-4.5 relative overflow-hidden shadow-sm flex flex-col sm:flex-row items-center gap-4.5 border border-indigo-950/40">
                        {/* Interactive backdrop glows */}
                        <div className="absolute -right-12 -top-12 w-28 h-28 rounded-full bg-indigo-550/20 blur-2xl pointer-events-none" />
                        <div className="absolute -left-12 -bottom-12 w-28 h-28 rounded-full bg-teal-550/10 blur-2xl pointer-events-none" />
                        
                        <div className="bg-white p-2 rounded-xl shrink-0 shadow-md">
                          <img 
                            src={getProfileQrUrl(115)}
                            alt="Your HBD Loop Profile QR Code Pass"
                            className="w-[100px] h-[100px] block"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        <div className="text-center sm:text-left space-y-1.5 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                            <span className="text-[8.5px] uppercase font-bold text-indigo-400 tracking-wider font-mono">My Digital Pass</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-100 block truncate">{userSession ? userSession.name : "Alex Patel"}</span>
                            <span className="text-[11px] font-mono text-emerald-400 font-bold block">@{userSession ? userSession.username : "alex_patel"}</span>
                          </div>
                          <p className="text-[10px] text-slate-350 leading-relaxed max-w-sm">
                            Show this profile QR to other HBD users. Scanning it sends a pending buddy request.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

              {/* ==================== SUB-TAB 2: MY PUBLIC WISHLIST ==================== */}
              {activeSection === "profile" && profileSubTab === "wishlist" && (
                <div className="space-y-6 animate-fade-in" id="profile-subtab-wishlist">
                  {/* User profile details ribbon */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 flex flex-col md:flex-row justify-between items-stretch gap-6 shadow-xs text-left" id="my-profile-banner">
                    <div className="flex gap-4 items-center">
                      <div className="w-14 h-14 rounded-2xl bg-teal-500 text-white flex items-center justify-center font-black text-2xl font-serif">
                        {userSession ? userSession.name.split(" ").map(n => n[0]).join("") : "AP"}
                      </div>
                      <div>
                        <h3 className="text-2xl font-black text-slate-905">{userSession ? userSession.name : "Alex Patel (You)"}</h3>
                        <p className="text-xs text-slate-500 font-semibold">Registered Status: <span className="font-extrabold text-indigo-600 font-mono">Self Account</span> • Username: <span className="font-extrabold text-indigo-600">@{userSession ? userSession.username : "alex"}</span></p>
                        <p className="text-xs text-slate-400">Current calendar birthday: <span className="font-semibold text-indigo-600 font-mono">{userSession ? userSession.birthday : "1997-06-25"}</span></p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row md:flex-row items-center gap-6 justify-between flex-1 md:flex-initial">
                      <div className="flex items-center gap-4">
                        <div className="bg-teal-50 p-4 rounded-2xl border border-teal-150 text-left min-w-[130px]">
                          <span className="text-[9px] font-bold text-teal-800 uppercase block select-none">Desires bound</span>
                          <span className="text-xl font-bold text-slate-900 block font-mono">{friends.find(f => f.id === 'alex')?.wishlist.length} items</span>
                        </div>
                        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-150 text-left min-w-[130px]">
                          <span className="text-[9px] font-bold text-indigo-800 uppercase block select-none">Claimed by friends</span>
                          <span className="text-xl font-bold text-slate-900 block font-mono">
                            {friends.find(f => f.id === 'alex')?.wishlist.filter(w => w.isClaimed).length} items
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center gap-2 pl-0 md:pl-6 border-t pt-4 sm:pt-0 sm:border-t-0 md:border-t-0 md:border-l md:border-slate-150 w-full sm:w-auto min-w-[160px]">
                        <button
                          type="button"
                          onClick={() => setIsShareModalOpen(true)}
                          className="bg-indigo-600 hover:bg-indigo-755 text-white text-xs font-black py-2.5 px-4 rounded-xl shadow cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Share QR Pass</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const username = userSession ? userSession.username : "alex";
                            const shareUrl = `${window.location.origin}/?user=${username}`;
                            navigator.clipboard.writeText(shareUrl);
                            triggerToast("Copied External Link! 🔗", "Ready to share with friends outside the app.");
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold py-1.5 px-3 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Copy Share Link</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Private desires workspace table panel */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 text-left">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="font-bold text-base text-slate-850 flex items-center gap-2">
                        <GiftIcon className="w-5 h-5 text-rose-500 animate-pulse" /> My Public Wishlist Folders
                      </h4>
                      <p className="text-xs text-slate-400">Claims made on this screen simulation represent companions reserving gifts for your landmark day.</p>
                    </div>

                    {/* Grid items */}
                    {((friends.find(f => f.id === 'alex')?.wishlist?.length || 0) === 0) ? (
                      <div className="text-center py-12 px-6 bg-slate-50 border border-dashed border-slate-200 rounded-[1.5rem] flex flex-col items-center justify-center space-y-3">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center animate-pulse">
                          <GiftIcon className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-sm text-slate-800">Your Birthday Wishlist is Empty</h5>
                          <p className="text-xs text-slate-500 max-w-sm">
                            Add some gift items or desires so your companions know exactly how to celebrate and surprise you on your special day!
                          </p>
                        </div>
                        {!isAddingWish && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedFriendId("alex");
                              setIsAddingWish(true);
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Create First Wish</span>
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {friends.find(f => f.id === 'alex')?.wishlist.map(wish => (
                          <div 
                            key={wish.id}
                            className="p-4 rounded-2xl border border-slate-150 bg-slate-50 flex justify-between items-start gap-4 transition-all hover:bg-slate-100/50"
                          >
                            <div className="flex-1">
                              <span className="text-xs font-bold text-slate-850 block">{wish.title}</span>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-xs font-black text-emerald-600 font-mono">{wish.price}</span>
                                {wish.url && (
                                  <a 
                                    href={wish.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-[10px] text-indigo-600 font-bold hover:underline flex items-center gap-0.5"
                                  >
                                    Store reference <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>

                              {wish.isClaimed && (
                                <div className="mt-3 bg-teal-500/10 border border-teal-500/20 text-teal-850 text-[9.5px] font-bold p-1 px-2.5 rounded-lg w-fit">
                                  🔒 Reserved in secret by {wish.claimedBy}
                                </div>
                              )}
                            </div>

                            <div className="flex flex-col gap-1 items-end shrink-0">
                              <button
                                onClick={() => {
                                  setSelectedFriendId("alex");
                                  startEditingWishlistItem(wish);
                                  setActiveSection("registry");
                                }}
                                className="p-1 px-2 text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 rounded block font-semibold cursor-pointer"
                              >
                                Modify Entry
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedFriendId("alex");
                                  deleteWishlistItem(wish.id);
                                }}
                                className="p-1 px-2 text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-650 rounded block mt-1 cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

{/* Trigger to quick add wishes to Alexa self */}
<div className="pt-6 border-t border-slate-150 mt-6">
  {!isAddingWish ? (
    <button
      onClick={() => {
        setSelectedFriendId("alex");
        setIsAddingWish(true);
      }}
      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      <Plus className="w-4 h-4" />
      <span>Add to my wishlist</span>
    </button>
  ) : (
    <form onSubmit={addWishlistItem} className="bg-slate-50 p-4 border border-slate-200 rounded-2xl space-y-3">
      <div className="flex justify-between items-center">
        <h5 className="text-[11px] font-bold text-slate-700 uppercase">New Wish Item</h5>
        <button type="button" onClick={() => setIsAddingWish(false)} className="text-slate-400 hover:text-slate-600">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <input
        type="text"
        required
        placeholder="Item name e.g. Nike Air Max"
        value={newItemTitle}
        onChange={(e) => setNewItemTitle(e.target.value)}
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:outline-none"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          placeholder="Price e.g. $50"
          value={newItemPrice}
          onChange={(e) => setNewItemPrice(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Store URL (optional)"
          value={newItemUrl}
          onChange={(e) => setNewItemUrl(e.target.value)}
          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
      >
        Save to Wishlist
      </button>
    </form>
  )}
</div>
                  </div>
                </div>
              )}


              {/* ==================== SUB-TAB 4: TROPHIES & LOGS ==================== */}
              {activeSection === "profile" && profileSubTab === "trophies" && (
                <div className="space-y-6 text-left animate-fade-in" id="profile-subtab-trophies">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
                    <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">Gamification Analyzer</span>
                        <h3 className="text-xl font-extrabold text-slate-900 mt-1">{userSession ? userSession.name.split(" ")[0] : "Alexander"}'s Pro Gift-Giving Milestones</h3>
                        <p className="text-xs text-slate-500 mt-0.5 animate-pulse">Collect trophies by creating active lists and claiming companion wishes</p>
                      </div>

                      <div className="mt-6 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-extrabold text-indigo-600 uppercase tracking-wider">Level Progression</span>
                          <span className="font-black text-indigo-755 font-mono">Level {unlockLevel} (Gift Master Rank)</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((friends.find(f => f.id === 'alex')?.achievements.length || 0) * 20, 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-zinc-400 font-semibold gap-1">
                          <span>{(friends.find(f => f.id === 'alex')?.achievements.length || 0)} milestones unlocked</span>
                          <span>•</span>
                          <span>{6 - (friends.find(f => f.id === 'alex')?.achievements.length || 0)} left to max prestige</span>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-4 bg-emerald-50 rounded-3xl border border-emerald-150 p-6 flex flex-col justify-between">
                      <div>
                        <h4 className="font-extrabold text-emerald-950 text-sm">Coordinator Roster</h4>
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                          Share achievements securely with your other sync groups by clicking each awarded badge copy.
                        </p>
                      </div>
                      <div className="bg-white/80 rounded-2xl p-3 border border-emerald-250 text-[11px] font-semibold">
                        🏆 Prestige Ranks: 
                        <ul className="list-disc pl-4 mt-1 font-normal text-slate-500 space-y-0.5">
                          <li>Novice Coordinator (Lvl 1 - 3)</li>
                          <li>Expert Scheduler (Lvl 4 - 7)</li>
                          <li>Elite Gift Master (Lvl 8 - 12)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Badges Grid */}
                  <div className="bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">Milestones Achievements Directory</span>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="badges-grid-roster">
                      {ALL_ACHIEVEMENTS_LIST.map((ach) => {
                        const isUnlocked = friends.find(f => f.id === 'alex')?.achievements.some(a => a.title === ach.title);
                        
                        return (
                          <div
                            key={ach.title}
                            onClick={() => {
                              if (isUnlocked) {
                                const copyText = `🎉 Unlocked Achievement: "${ach.title}" — ${ach.description}`;
                                navigator.clipboard.writeText(copyText).then(() => {
                                  triggerToast("Copied to Clipboard!", "Social sharing text saved successfully in clipboard.");
                                });
                              } else {
                                triggerToast("Locked Milestone", "Complete wishlist directories or claim tasks to award this badge.");
                              }
                            }}
                            className={`p-4 rounded-2xl border transition-all flex items-center gap-3.5 ${
                              isUnlocked 
                                ? "bg-gradient-to-br from-emerald-50 to-emerald-100/40 border-emerald-350 hover:border-emerald-500 cursor-pointer shadow-xs" 
                                : "bg-slate-50 border-slate-150 opacity-60"
                            }`}
                            title={isUnlocked ? "Click to copy achievement to clipboard" : "Milestone Locked"}
                          >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm font-serif shrink-0 border ${
                              isUnlocked ? "bg-emerald-500 text-white border-emerald-350" : "bg-slate-200 text-slate-400 border-slate-300"
                            }`}>
                              {isUnlocked ? "🏆" : "🔒"}
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-black text-slate-900 leading-tight block truncate">{ach.title}</p>
                              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">{ach.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              </div>
            )}

            {isProfileSettingsOpen && (
              <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/50 p-4 md:p-6" onClick={() => setIsProfileSettingsOpen(false)}>
                <div className="w-full max-w-3xl rounded-t-3xl bg-white shadow-2xl overflow-hidden border border-slate-200" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <div>
                      <h3 className="text-base font-black text-slate-900">Profile Settings</h3>
                      <p className="text-xs text-slate-500 mt-1">Edit your name, username, phone, notification toggles, region pricing, or sign out.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProfileSettingsOpen(false)}
                      className="text-slate-500 hover:text-slate-900 rounded-full transition"
                      aria-label="Close settings"
                    >
                      <span className="text-lg">×</span>
                    </button>
                  </div>

                  <div className="max-h-[88dvh] overflow-y-auto p-5 space-y-5 ios-scroll-safe">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Full name</label>
                        <input
                          value={signInName}
                          onChange={(e) => setSignInName(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                          placeholder="Alex Patel"
                          type="text"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Username</label>
                        <input
                          value={signInUsername}
                          onChange={(e) => setSignInUsername(e.target.value.replace(/^@/, ""))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 font-mono"
                          placeholder="alex_snap"
                          type="text"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Phone</label>
                        <input
                          value={signInPhone}
                          onChange={(e) => setSignInPhone(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 font-mono"
                          placeholder="+233241234567"
                          type="tel"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <div className="mb-3">
                        <h4 className="text-sm font-black text-slate-900">Notifications</h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">Choose how birthday briefings and reminder cues are delivered.</p>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-4">
                        <label className="flex items-start gap-3 p-3.5 bg-white rounded-2xl border border-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enableEmailReminders}
                            onChange={(e) => setEnableEmailReminders(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer mt-0.5"
                          />
                          <div>
                            <span className="text-xs font-black text-slate-900 block leading-tight">Email birthday alerts &amp; briefings</span>
                            <span className="text-[10px] text-slate-500 mt-1 leading-relaxed block">
                              Send 7-day and 1-day roster summaries to <strong>{userSession?.email || "your email"}</strong>.
                            </span>
                          </div>
                        </label>

                        <div className="border-t border-slate-200/80 pt-3">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Reminder Chime Sound</label>
                          <select
                            value={reminderChime}
                            onChange={(e) => {
                              const selected = e.target.value;
                              setReminderChime(selected);
                              try {
                                playSynthesizedChimeObj(selected);
                              } catch(err){}
                            }}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-indigo-500 cursor-pointer mt-1"
                          >
                            <option value="default">Joyful Ping (Default)</option>
                            <option value="bell">Classic Bell Resonance</option>
                            <option value="marimba">Elegant Marimba Melody</option>
                            <option value="digital">Modern Bubble Pop</option>
                            <option value="sweet">Gentle Glockenspiel</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Region</label>
                          <select
                            value={userRegion}
                            onChange={(e) => setUserRegion(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                          >
                            <option value="Ghana">Ghana</option>
                            <option value="Other Africa">Other Africa</option>
                            <option value="USA/Western">USA / Western</option>
                            <option value="Default">Default</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Currency</label>
                          <select
                            value={globalCurrency}
                            onChange={(e) => setGlobalCurrency(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500"
                          >
                            <option value="GHS">GHS</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="CAD">CAD</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    {/* Password Recovery Zone (Requires active authentication) */}
                    <div className="bg-slate-50 border border-slate-250 rounded-3xl p-4 md:p-5 space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                          {auth.currentUser?.providerData?.some(p => p.providerId === "google.com") 
                            ? "Set Up Login Password" 
                            : "Password Security"}
                        </span>
                        <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {auth.currentUser?.providerData?.some(p => p.providerId === "google.com")
                          ? "This account is authenticated via Google. You can secure a fallback password for direct credentials login."
                          : "Send a secure password reset link to the email attached to this account. Google-linked accounts can use this to add a password."}
                      </p>

                      {passwordResetSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-xs p-3 rounded-2xl">
                          We've sent a secure setup link straight to your email inbox!
                        </div>
                      )}

                      {!passwordResetSuccess && (
                        <div className="flex justify-end pt-1">
                          <button
                            type="button"
                            onClick={handlePasswordReset}
                            disabled={isPasswordResetLoading || !userSession?.email}
                            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-[11px] font-extrabold px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-2 animate-bounce-short"
                          >
                            {isPasswordResetLoading ? (
                              <>
                                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                <span>Sending...</span>
                              </>
                            ) : (
                              auth.currentUser?.providerData?.some(p => p.providerId === "google.com")
                                ? "Set Up an Account Password"
                                : "Set / Reset Password"
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <button
                        type="button"
                        onClick={async () => {
                          if (!signInName.trim() || !signInUsername.trim()) {
                            triggerToast("Invalid Inputs ⚠️", "Please fill in your name and username.");
                            return;
                          }
                          const updatedSess = {
                            ...userSession,
                            name: signInName.trim(),
                            username: signInUsername.trim(),
                            phone: signInPhone.trim(),
                            enableEmailReminders: enableEmailReminders,
                          };

                          // Save to local storage
                          localStorage.setItem("birthday_authenticated_user", JSON.stringify(updatedSess));
                          setUserSession(updatedSess as any);

                          // Save to Firestore
                          if (userSession?.uid) {
                            try {
                              const { doc, setDoc } = await import("firebase/firestore");
                              await setDoc(doc(db, "users", userSession.uid), {
                                name: signInName.trim(),
                                username: signInUsername.trim(),
                                phone: signInPhone.trim(),
                                enableEmailReminders: enableEmailReminders,
                              }, { merge: true });
                              triggerToast("Settings Saved! 💾", "Your profile and configuration changes are securely stored.");
                              setIsProfileSettingsOpen(false);
                              appendLog(`⚙️ Config: Updated profile settings for @${signInUsername.trim()}.`);
                            } catch (e) {
                              console.error(e);
                              triggerToast("Sync Error ⚠️", "Saved locally, but failed to sync to cloud database.");
                            }
                          } else {
                            triggerToast("Settings Saved! 💾", "Your offline profile changes have been applied.");
                            setIsProfileSettingsOpen(false);
                          }
                        }}
                        className="w-full bg-indigo-650 hover:bg-indigo-700 text-white py-3 rounded-2xl font-black text-sm transition cursor-pointer text-center block shadow-3xs"
                      >
                        Save Profile Changes
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await signOut(auth);
                            localStorage.removeItem("birthday_authenticated_user");
                            setUserSession(null);
                            setIsProfileSettingsOpen(false);
                            triggerToast("Logged Out", "Your profile session has been signed out.");
                          } catch (e) {
                            console.error("SignOut error", e);
                            triggerToast("Sign Out Failed ❌", "Please try again.");
                          }
                        }}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white py-3 rounded-2xl font-black text-sm transition"
                      >
                        Log Out
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsProfileSettingsOpen(false)}
                        className="w-full bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 rounded-2xl font-black text-sm transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* ==================== SCREEN 7.5: IN-APP GIFT STORE ==================== */}
          {activeSection === "gift-store" && (
            <div className="space-y-6 text-left animate-fade-in relative" id="view-gift-store-hull">
              <ConfettiBurst active={showPurchaseConfetti} mode="rain" onComplete={() => setShowPurchaseConfetti(false)} />
              {/* My Wallet Card */}
              <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 text-left space-y-3" id="wallet-card-container">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 font-normal block truncate">Available Balance</span>
                    <div className="text-[24px] font-semibold text-slate-900 font-mono mt-0.5">
                      GHS {walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                  <span className="text-[24px]" role="img" aria-label="wallet">👛</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDepositForm(!showDepositForm);
                      setShowWithdrawForm(false);
                    }}
                    className={`flex-1 h-10 px-3 rounded-lg font-semibold text-[12px] transition-colors cursor-pointer ${
                      showDepositForm
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                        : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    Deposit ↗
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawForm(!showWithdrawForm);
                      setShowDepositForm(false);
                    }}
                    className={`flex-1 h-10 px-3 rounded-lg font-semibold text-[12px] transition-colors cursor-pointer border ${
                      showWithdrawForm
                        ? "bg-slate-100 text-slate-800 border-slate-300"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-300"
                    }`}
                  >
                    Withdraw ↙
                  </button>
                </div>

                {/* Expanded Deposit Form */}
                {showDepositForm && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Amount to Deposit (GHS)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 50"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="flex-1 h-9 bg-slate-50 border border-slate-300 rounded-lg px-3 text-[13px] font-mono outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(depositAmount);
                          if (!amt || amt <= 0 || isNaN(amt)) {
                            triggerToast("Error", "Please enter a valid positive deposit amount.");
                            return;
                          }
                          setWalletBalance((prev) => prev + amt);
                          triggerToast("Deposit Successful", `Added GHS ${amt.toFixed(2)} to your wallet balance.`);
                          setDepositAmount("");
                          setShowDepositForm(false);
                          playNotificationSound();
                        }}
                        className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-[12px] px-3 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Withdraw Form */}
                {showWithdrawForm && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Amount to Withdraw (GHS)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 20"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 h-9 bg-slate-50 border border-slate-300 rounded-lg px-3 text-[13px] font-mono outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(withdrawAmount);
                          if (!amt || amt <= 0 || isNaN(amt)) {
                            triggerToast("Error", "Please enter a valid positive withdrawal amount.");
                            return;
                          }
                          if (amt > walletBalance) {
                            triggerToast("Insufficient Funds", "You do not have enough balance to withdraw this amount.");
                            return;
                          }
                          setWalletBalance((prev) => prev - amt);
                          triggerToast("Withdrawal Successful", `Withdrew GHS ${amt.toFixed(2)} from your wallet balance.`);
                          setWithdrawAmount("");
                          setShowWithdrawForm(false);
                          playNotificationSound();
                        }}
                        className="h-9 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-[12px] px-3 rounded-lg transition-colors cursor-pointer shrink-0"
                      >
                        Confirm
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub Navigation Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-lg w-full h-9" id="store-tabs-wrapper">
                <button
                  type="button"
                  onClick={() => setGiftStoreTab("gallery")}
                  className={`flex-1 h-full text-[12px] font-semibold rounded transition-all cursor-pointer flex items-center justify-center ${
                    giftStoreTab === "gallery"
                      ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => setGiftStoreTab("ledger")}
                  className={`flex-1 h-full text-[12px] font-semibold rounded transition-all cursor-pointer flex items-center justify-center ${
                    giftStoreTab === "ledger"
                      ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Sent ({sentGifts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGiftStoreTab("pools")}
                  className={`flex-1 h-full text-[12px] font-semibold rounded transition-all cursor-pointer flex items-center justify-center ${
                    giftStoreTab === "pools"
                      ? "bg-white text-slate-900 shadow-[0_1px_2px_rgba(0,0,0,0.06)]"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Pools
                </button>
              </div>

              {/* TAB 1: BOUTIQUE GALLERY */}
              {giftStoreTab === "gallery" && (
                <div className="space-y-3">
                  {/* Swipeable single-gift carousel */}
                  <motion.div
                    key={selectedStoreGift.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    onPointerDown={(e) => setGiftSwipeStartX(e.clientX)}
                    onPointerUp={(e) => {
                      if (giftSwipeStartX === null) return;
                      const delta = e.clientX - giftSwipeStartX;
                      if (Math.abs(delta) > 48) {
                        setGiftCarouselIndex((prev) => (delta < 0
                          ? (prev + 1) % GIFT_INVENTORY.length
                          : (prev - 1 + GIFT_INVENTORY.length) % GIFT_INVENTORY.length));
                      }
                      setGiftSwipeStartX(null);
                    }}
                    className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 text-left space-y-3 relative overflow-hidden"
                  >
                    {/* Header: emoji 24px + title 14px semibold + category hint */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-400 font-normal uppercase tracking-wider block">
                          {selectedStoreGift.category}
                        </span>
                        <div className="flex items-center gap-2 mt-1 truncate">
                          <span className="text-[24px] shrink-0" role="img" aria-label={selectedStoreGift.name}>{selectedStoreGift.emoji}</span>
                          <h4 className="text-[14px] font-semibold text-slate-900 truncate">{selectedStoreGift.name}</h4>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{selectedStoreGift.description}</p>
                      </div>
                      <span className="text-[12px] font-semibold text-indigo-600 font-mono shrink-0">
                        {getFormattedPrice(selectedStoreGift.usdPrice)}
                      </span>
                    </div>

                    {/* Contribution Input Area */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Contribution Amount (GHS)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={giftAmountMin}
                          max={giftAmountMax}
                          value={giftContributionAmount}
                          onChange={(e) => setGiftContributionAmount(e.target.value)}
                          className="flex-1 h-9 bg-slate-50 border border-slate-300 rounded-lg px-3 text-[13px] font-mono outline-none focus:border-indigo-600 focus:bg-white transition-colors"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Any amount from GHS {giftAmountMin} to GHS {giftAmountMax}
                      </p>
                    </div>

                    {/* Send Button */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const amount = Number(giftContributionAmount);
                          if (!amount || amount < giftAmountMin || amount > giftAmountMax) {
                            triggerToast("Invalid Amount", `Enter GHS ${giftAmountMin} to GHS ${giftAmountMax}.`);
                            return;
                          }
                          setCustomGiftStoreItem({ id: selectedStoreGift.id, name: selectedStoreGift.name, type: selectedStoreGift.type, usdPrice: selectedStoreGift.usdPrice });
                          if (friends.length > 0) {
                            setGiftRecipientId(friends[0].id);
                            const yr = new Date().getFullYear();
                            const bdy = friends[0].birthday;
                            if (bdy) {
                              const parts = bdy.split("-");
                              setGiftRevealDate(parts.length === 3 ? `${yr}-${parts[1]}-${parts[2]}` : getTodayDateString());
                            } else {
                              setGiftRevealDate(getTodayDateString());
                            }
                          } else {
                            setGiftRecipientId("");
                            setGiftRevealDate(getTodayDateString());
                          }
                          setGiftRecipientMessage(`Sending ${selectedStoreGift.emoji} ${selectedStoreGift.name} celebration gift.`);
                          setGiftPaymentMethod("momo");
                        }}
                        className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[13px] rounded-lg cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        Send this gift →
                      </button>
                    </div>

                    {/* Dot Indicators */}
                    <div className="flex items-center justify-center gap-1.5 pt-2">
                      {GIFT_INVENTORY.map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setGiftCarouselIndex(index)}
                          className={`h-1.5 rounded-full transition-all cursor-pointer ${
                            index === giftCarouselIndex ? "w-5 bg-indigo-600" : "w-1.5 bg-slate-200 hover:bg-slate-300"
                          }`}
                          aria-label={`Go to slide ${index + 1}`}
                        />
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}

              {/* TAB 2: ACTIVE GIFT POOLS */}
              {giftStoreTab === "pools" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-5 text-left shadow-xs">
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
                      <Gift className="w-4.5 h-4.5 text-violet-600" />
                      <span>Active Gift Pools</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Browse every tracked buddy with an upcoming milestone. Gift-pool actions stay out of Home and live here or inside an individual buddy profile.
                    </p>
                  </div>

                  {activeGiftPools.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl p-10 text-center">
                      <div className="text-4xl">🎁</div>
                      <h5 className="text-xs font-black text-zinc-700 mt-3">No active pools yet</h5>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto">
                        Add a buddy with an upcoming birthday to create a pool entry here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeGiftPools.map((friend) => (
                        <div key={friend.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-11 h-11 rounded-2xl ${friend.avatar || "bg-indigo-500"} text-white flex items-center justify-center font-black text-sm shrink-0`}>
                              {friend.name.split(" ").map((n) => n[0] || "").slice(0, 2).join("")}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-900 truncate">{friend.name}</p>
                              <p className="text-[11px] text-slate-500 mt-0.5">
                                {formatBirthdayDate(friend.birthday)} • {calculateDaysRemaining(friend.birthday)} days left
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFriendId(friend.id);
                                setActiveSection("registry");
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="text-[11px] font-black text-violet-700 bg-violet-50 hover:bg-violet-100 border border-violet-100 px-3 py-2 rounded-xl"
                            >
                              Manage
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFriendId(friend.id);
                                setGiftStoreTab("gallery");
                                setActiveSection("gift-store");
                                triggerToast("Gift Pool Opened 🎁", `Choose a gift for ${friend.name}.`);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                              className="text-[11px] font-black text-white bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-xl"
                            >
                              Send gift
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: SENT & RECEIVED GIFT LEDGERS */}
              {giftStoreTab === "ledger" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 text-left shadow-xs">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
                        <Activity className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                        <span>Interactive Gift Registry Ledger</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Track live statuses and recall precious dedications sent or received in real time.
                      </p>
                    </div>

                    {/* Sub-tab Pill Navigation */}
                    <div className="flex bg-slate-100/80 p-1 rounded-xl self-start md:self-center">
                      <button
                        type="button"
                        onClick={() => setLedgerSubTab("sent")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          ledgerSubTab === "sent"
                            ? "bg-white text-indigo-600 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>Sent Gifts</span>
                        <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {sentGifts.length}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLedgerSubTab("received")}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          ledgerSubTab === "received"
                            ? "bg-white text-indigo-600 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <span>Received Gifts</span>
                        <span className="bg-slate-200 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                          {visibleReceivedGifts.length}
                        </span>
                      </button>
                    </div>
                  </div>

                  {ledgerSubTab === "sent" ? (
                    sentGifts.length === 0 ? (
                      <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl animate-fade-in">
                        <div className="text-4xl">🛍️</div>
                        <h5 className="text-xs font-black text-zinc-700 mt-3">No Gifts Dispatched Yet</h5>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto font-sans leading-relaxed text-center">
                          Navigate to our Boutique Inventory tab and purchase premium roses, tulips bouquets, or cash presents to fill this ledger section.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-zinc-850 font-sans border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 text-left">
                              <th className="pb-3 pl-2">Recipient Buddy</th>
                              <th className="pb-3">Gift Item</th>
                              <th className="pb-3">Paid Price</th>
                              <th className="pb-3">Greetings Card Message</th>
                              <th className="pb-3">Dispatched Date</th>
                              <th className="pb-3 pr-2 text-right">Transfer Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {sentGifts.map((gift) => (
                              <tr key={gift.id} className="border-b border-slate-50 text-[11.5px] hover:bg-slate-50/50 transition">
                                <td className="py-4 pl-2 font-black text-zinc-900 flex items-center gap-2 text-left">
                                  <span className="bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">@sync_link</span>
                                  <span>{gift.friendName}</span>
                                </td>
                                <td className="py-4 font-bold text-slate-700">
                                  {gift.giftType === "rose" && "🌹 "}
                                  {gift.giftType === "bouquet" && "💐 "}
                                  {gift.giftType === "money" && "💰 "}
                                  {gift.giftName}
                                </td>
                                <td className="py-4 font-mono font-black text-indigo-650">
                                  {gift.price}
                                </td>
                                <td className="py-4 max-w-xs text-zinc-500 leading-tight">
                                  <div className="truncate" title={gift.message}>
                                    "{gift.message}"
                                  </div>
                                </td>
                                <td className="py-4 text-slate-400 font-mono text-[10px]">
                                  {gift.dateSent}
                                </td>
                                <td className="py-4 pr-2 text-right">
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full animate-ping" />
                                    <span>{gift.status}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  ) : (
                    visibleReceivedGifts.length === 0 ? (
                      <div className="p-12 text-center border-2 border-dashed border-slate-200 bg-slate-50/50 rounded-2xl animate-fade-in">
                        <div className="text-4xl">🎁</div>
                        <h5 className="text-xs font-black text-zinc-700 mt-3">No Received Gifts Yet</h5>
                        <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto font-sans leading-relaxed text-center">
                          Gifts dispatched by companion profiles or outer network users directly destination mapped to your profile will populate this catalog list real time.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto animate-fade-in">
                        <table className="w-full text-zinc-850 font-sans border-collapse">
                          <thead>
                            <tr className="border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 text-left">
                              <th className="pb-3 pl-2">Sender Buddy</th>
                              <th className="pb-3">Gift Item</th>
                              <th className="pb-3">Valued Cost</th>
                              <th className="pb-3">Greetings Card Message</th>
                              <th className="pb-3">Received Date</th>
                              <th className="pb-3 pr-2 text-right">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {visibleReceivedGifts.map((gift) => (
                              <tr key={gift.id} className="border-b border-slate-50 text-[11.5px] hover:bg-slate-50/50 transition">
                                <td className="py-4 pl-2 font-black text-zinc-900 flex items-center gap-2 text-left">
                                  <span className="bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap">@received_sync</span>
                                  <span>{gift.senderName}</span>
                                </td>
                                <td className="py-4 font-bold text-slate-700">
                                  {gift.giftType === "rose" && "🌹 "}
                                  {gift.giftType === "bouquet" && "💐 "}
                                  {gift.giftType === "money" && "💰 "}
                                  {gift.giftName}
                                </td>
                                <td className="py-4 font-mono font-black text-rose-600">
                                  {gift.price}
                                </td>
                                <td className="py-4 max-w-xs text-zinc-500 leading-tight">
                                  <div className="italic text-slate-500 font-serif leading-relaxed" title={gift.message}>
                                    "{gift.message}"
                                  </div>
                                </td>
                                <td className="py-4 text-slate-400 font-mono text-[10px]">
                                  {gift.dateReceived}
                                </td>
                                <td className="py-4 pr-2 text-right">
                                  <span className="bg-rose-100 text-rose-800 text-[9px] font-black uppercase px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                                    <span className="w-1 h-1 bg-rose-500 rounded-full" />
                                    <span>{gift.status}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* CHECKOUT SYSTEM SLIDE-OVER OVERLAY MODAL */}
              {customGiftStoreItem && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[9999] animate-fade-in">
                  <div className="bg-white w-full max-w-lg rounded-3xl border border-rose-100 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    {/* Header bar */}
                    <div className="bg-gradient-to-r from-rose-900 to-indigo-950 p-5 text-left text-white flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {customGiftStoreItem.type === "rose" && "🌹"}
                          {customGiftStoreItem.type === "bouquet" && "💐"}
                          {customGiftStoreItem.type === "money" && "💰"}
                        </span>
                        <div>
                          <h4 className="font-extrabold text-sm text-white">Interactive Gift Dispatch Panel</h4>
                          <span className="text-[10px] text-rose-200 uppercase font-mono font-bold tracking-wide">
                            Checkout Present: {customGiftStoreItem.name}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setCustomGiftStoreItem(null)}
                        className="p-1 px-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer transition border border-white/10"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Modal Main Form Content */}
                    <div className="p-6 md:p-8 space-y-5 text-left max-h-[75vh] overflow-y-auto">
                      {isGiftProcessing ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center space-y-4">
                          <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" />
                          <h5 className="text-sm font-black text-zinc-900 mt-2">Active Sandbox Gateway Link Established</h5>
                          <span className="text-xs text-indigo-650 font-mono font-bold bg-indigo-50 px-3 py-1 rounded-lg">
                            {giftProcessingStep}
                          </span>
                          <p className="text-[10.5px] text-slate-400 font-normal leading-normal max-w-xs font-sans text-center">
                            Authorizing instant credit and preparing hand-wrapped companion parcel. Chimes will fire upon confirmation signal...
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Pick Buddy Dropdown */}
                          <div className="space-y-1.5 text-left">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Recipient Companion Buddy
                            </label>
                            {friends.length === 0 ? (
                              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                                ⚠️ No active companion profile found in registry index! Register a buddy profile before gifting.
                              </div>
                            ) : (
                              <select
                                value={giftRecipientId}
                                onChange={(e) => setGiftRecipientId(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-205 rounded-xl px-3.5 py-3 text-xs font-semibold outline-none focus:border-indigo-650 cursor-pointer"
                              >
                                {friends.map((f) => (
                                  <option key={f.id} value={f.id}>
                                    👤 {f.name} (Upcoming Celebration: {f.birthday})
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Greetings message cards input */}
                          <div className="space-y-1.5 text-left">
                            <div className="flex justify-between items-center">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                Greetings Card Dedication Message
                              </label>
                              <span className="text-[9.5px] font-mono font-bold text-slate-400">
                                {giftRecipientMessage.length}/150 Chars
                              </span>
                            </div>
                            <textarea
                              rows={3}
                              maxLength={150}
                              value={giftRecipientMessage}
                              onChange={(e) => setGiftRecipientMessage(e.target.value)}
                              placeholder="Write a sweet dedications note about special landmark memories..."
                              className="w-full bg-slate-50 border border-slate-205 rounded-xl p-3 text-xs outline-none focus:border-indigo-650 resize-none font-sans"
                            />
                          </div>

                          {/* Payment method selector */}
                          <div className="space-y-3 pt-2">
                            <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left">
                              Select Payment Source / Sandbox Token
                            </span>
                            <div className="grid grid-cols-3 gap-3">
                              {/* Option 1: MOMO */}
                              <button
                                type="button"
                                onClick={() => setGiftPaymentMethod("momo")}
                                className={`p-3 rounded-xl border flex flex-col justify-between h-20 text-left cursor-pointer transition-all ${
                                  giftPaymentMethod === "momo"
                                    ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <span className="text-xs font-bold leading-tight block text-left">Mobile Money</span>
                                <span className={`text-[8.5px] font-mono leading-none ${giftPaymentMethod === "momo" ? "text-indigo-200" : "text-slate-400"}`}>
                                  GH Momo Portal
                                </span>
                              </button>

                              {/* Option 2: CARD */}
                              <button
                                type="button"
                                onClick={() => setGiftPaymentMethod("card")}
                                className={`p-3 rounded-xl border flex flex-col justify-between h-20 text-left cursor-pointer transition-all ${
                                  giftPaymentMethod === "card"
                                    ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <span className="text-xs font-bold leading-tight block text-left">Credit Card</span>
                                <span className={`text-[8.5px] font-mono leading-none ${giftPaymentMethod === "card" ? "text-indigo-200" : "text-slate-400"}`}>
                                  Visa / MasterCard
                                </span>
                              </button>

                              {/* Option 3: Points wrapper */}
                              <button
                                type="button"
                                onClick={() => setGiftPaymentMethod("points")}
                                className={`p-3 rounded-xl border flex flex-col justify-between h-20 text-left cursor-pointer transition-all ${
                                  giftPaymentMethod === "points"
                                    ? "bg-indigo-600 border-indigo-600 text-white font-extrabold shadow-sm"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <span className="text-xs font-bold leading-tight block text-left">HBD Points</span>
                                <span className={`text-[8.5px] font-mono leading-none ${giftPaymentMethod === "points" ? "text-indigo-200" : "text-slate-400"}`}>
                                  Unlimited Sandbox
                                </span>
                              </button>
                            </div>
                          </div>

                          {/* Price calculation block */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div>
                              <span className="text-[10px] text-slate-400 block font-bold uppercase text-left">Authorized Price</span>
                              <span className="text-slate-500 font-extrabold text-xs text-left block">Full Checkout Total</span>
                            </div>
                            <span className="text-lg font-black text-indigo-700 font-mono">
                              {getFormattedPrice(customGiftStoreItem.usdPrice)}
                            </span>
                          </div>

                          {/* Secret Surprise Gift Toggle Option */}
                          <div className="bg-[#FAF9F6] p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="text-left space-y-0.5 pr-3">
                              <span className="text-[10px] text-indigo-600 font-black uppercase tracking-wider block">Secret Surprise Milestone</span>
                              <span className="text-xs font-black text-slate-900 block">Hide tracking until birthday</span>
                              <p className="text-[9.5px] text-slate-400 font-bold leading-normal font-sans">
                                Bypasses public stream and isolates tracking logic from peer view until celebration date!
                              </p>
                            </div>
                            <input
                              type="checkbox"
                              checked={giftIsSurprise}
                              onChange={(e) => setGiftIsSurprise(e.target.checked)}
                              className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                            />
                          </div>

                          {/* Insufficient balance validation card */}
                          {walletBalance < (customGiftStoreItem.usdPrice * 12) && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-center gap-2 animate-pulse">
                              <span>⚠️</span>
                              <span>Insufficient balance — please deposit first</span>
                            </div>
                          )}

                          {/* Error block if no friends */}
                          {friends.length === 0 && (
                            <p className="text-[10px] text-rose-600 font-bold">
                              * You must have at least 1 registered buddy in your Registry Console to transmit celebration cards.
                            </p>
                          )}

                          {/* Submit button */}
                          <button
                            type="button"
                            disabled={friends.length === 0 || walletBalance < (customGiftStoreItem.usdPrice * 12)}
                            onClick={() => {
                              setIsGiftProcessing(true);
                              setGiftProcessingStep("Linking with Secure Momo Node...");
                              
                              setTimeout(() => {
                                setGiftProcessingStep("Encrypting Greetings Card Dedication...");
                              }, 1100);

                              setTimeout(() => {
                                setGiftProcessingStep("Delivering Token parcel to Buddy locker...");
                              }, 2200);

                              setTimeout(() => {
                                // Finalize checkout
                                const selectedFriend = friends.find(f => f.id === giftRecipientId) || friends[0];
                                const priceInGhs = customGiftStoreItem.usdPrice * 12;
                                
                                // Deduct from wallet balance
                                setWalletBalance(prev => Math.max(0, prev - priceInGhs));

                                const formattedPriceString = getFormattedPrice(customGiftStoreItem.usdPrice);
                                const newGiftLog: SentGift = {
                                  isOpened: false,
                                  id: "gift_tx_" + Date.now(),
                                  friendId: selectedFriend.id,
                                  friendName: selectedFriend.name,
                                  giftType: customGiftStoreItem.type,
                                  giftName: customGiftStoreItem.name,
                                  price: formattedPriceString,
                                  status: "Delivered",
                                  message: giftRecipientMessage.trim() || `Sent a lovely ${customGiftStoreItem.name}!`,
                                  dateSent: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                                  isSurprise: giftIsSurprise
                                };

                                const updatedGifts = [newGiftLog, ...sentGifts];
                                setSentGifts(updatedGifts);
                                localStorage.setItem("hbd_sent_gifts_log", JSON.stringify(updatedGifts));

                                // Add Notification
                                const newSysNotification = {
                                  id: "notif_g_" + Date.now(),
                                  type: "system" as const,
                                  title: `🎁 Gift Token Dispatched!`,
                                  message: `Successfully transmitted "${customGiftStoreItem.name}" to ${selectedFriend.name} registry locker (${formattedPriceString}).`,
                                  timestamp: "Just Now",
                                  isRead: false
                                };
                                setNotifications(prevNotifs => [newSysNotification, ...prevNotifs]);

                                // Post log
                                appendLog(`Dispatched Interactive ${customGiftStoreItem.name} Present to ${selectedFriend.name} via ${giftPaymentMethod === "momo" ? "Mobile Money" : "Secure Node Pay"}.`);

                                // Fire audio if available
                                playNotificationSound();
                                setShowPurchaseConfetti(true);

                                setIsGiftProcessing(false);
                                setCustomGiftStoreItem(null);
                                setGiftStoreTab("ledger");
                                triggerToast("Gift Token Sent Successfully! 🎉", `Delivered velvet bundle to ${selectedFriend.name} with custom greeting!`);
                              }, 3500);
                            }}
                            className={`w-full py-3.5 text-center text-xs font-black rounded-xl text-white transition-all cursor-pointer ${
                              (friends.length === 0 || walletBalance < (customGiftStoreItem.usdPrice * 12))
                                ? "bg-slate-300 font-bold"
                                : "bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-200"
                            }`}
                          >
                            Proceed & Authorize Sandbox Transaction
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* ==================== SCREEN 8: PREMIUM PLANS & SYSTEM CONFIGURATION ==================== */}
          {activeSection === "upgrade" && (() => {
            const AFRICAN_COUNTRIES = [
              "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CD", "CG",
              "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE",
              "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
              "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
              "ZM", "ZW"
            ];

            const countryCode = (userSession as any)?.countryCode || "GH";
            const isGhana = countryCode.toUpperCase() === "GH";
            const isAfrica = AFRICAN_COUNTRIES.includes(countryCode.toUpperCase());

            const isYearly = billingCycle === "annual";

            let proPriceFormatted = "";
            let businessPriceFormatted = "";
            let savePercentagePro = "";
            
            if (isGhana) {
              proPriceFormatted = isYearly ? "GHS 99" : "GHS 10";
              businessPriceFormatted = isYearly ? "GHS 1,999" : "GHS 200";
              savePercentagePro = "Save 17%";
            } else if (isAfrica) {
              proPriceFormatted = isYearly ? "$14" : "$1.50";
              businessPriceFormatted = isYearly ? "$199" : "$20";
              savePercentagePro = "Save 22%";
            } else {
              proPriceFormatted = isYearly ? "$29" : "$3";
              businessPriceFormatted = isYearly ? "$399" : "$40";
              savePercentagePro = "Save 19%";
            }

            return (
              <div className="space-y-6 text-left animate-fade-in" id="view-upgrade-hull">
                {/* Top Banner */}
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-left text-white shadow-xl relative overflow-hidden">
                  <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 pointer-events-none blur-3xl opacity-30" />
                  <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-indigo-400" />
                    <span>Plans</span>
                  </h3>
                    <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed max-w-xl font-sans">
                      Manage your subscription level, billing region, and payment method.
                    </p>
                </div>

                {/* Two-Column Workspace */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Column 1: Pricing Tiers & Subscription (Span 7) */}
                  <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
                    
                    {/* Location & Billing Integrated Settings Selector */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Billing Cycle Toggle */}
                      <div className="text-left w-full sm:w-auto">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Cycle</span>
                        <div className="flex bg-slate-200/80 p-0.5 rounded-xl border border-slate-300 w-fit">
                          <button
                            type="button"
                            onClick={() => setBillingCycle("monthly")}
                            className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer ${
                              billingCycle === "monthly" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Monthly
                          </button>
                          <button
                            type="button"
                            onClick={() => setBillingCycle("annual")}
                            className={`px-3 py-1 text-[10px] font-extrabold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                              billingCycle === "annual" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            <span>Annual</span>
                            <span className="bg-emerald-500 text-white text-[8px] font-black px-1.5 rounded-full scale-90">Saves 19%+</span>
                          </button>
                        </div>
                      </div>

                      {/* Auto Detected Location Display */}
                      <div className="w-full sm:w-auto text-left sm:text-right">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Billing Region</span>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[10px] font-extrabold text-indigo-800 shadow-xs">
                          <span className="text-xs">🌏</span>
                          <span>Auto-detect ({countryCode}) • {isGhana ? "GHS Pricing" : isAfrica ? "Pan-African USD" : "Western Global USD"}</span>
                        </div>
                      </div>
                    </div>

                    {/* TRY HBD PRO - ELITE PROMOTIONAL LAYOUT */}
                    <div className="rounded-3xl p-5 md:p-6 border border-violet-200 bg-gradient-to-br from-violet-50 via-white to-orange-50 shadow-xs relative overflow-hidden font-sans">
                      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-violet-200/20 pointer-events-none blur-3xl opacity-60" />
                      <div className="flex flex-col md:flex-row items-stretch justify-between gap-6 relative z-10">
                        <div className="space-y-4 max-w-md">
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-violet-100 border border-violet-200 rounded-full text-[9px] uppercase tracking-widest font-black text-violet-700">
                              Pro upgrade
                            </div>
                            <h4 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-1.5">
                              <span>Try HBD Pro</span>
                              <span className="text-amber-500">★</span>
                            </h4>
                            <p className="text-[11px] text-slate-600 leading-normal">
                              Unlock automated milestone tools and coordinate group gifting loops with less manual work.
                            </p>
                          </div>

                          {/* Advantages List */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-[10.5px] font-semibold text-slate-600">
                            <div className="flex items-center gap-2">
                              <span className="text-violet-600 text-xs font-bold">✦</span>
                              <span>Unlimited Milestone Tracking</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-violet-600 text-xs font-bold">✦</span>
                              <span>Group Gifting Pool Activation</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-violet-600 text-xs font-bold">✦</span>
                              <span>Custom Push Alarm Reminders</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-violet-600 text-xs font-bold">✦</span>
                              <span>Premium Group Card Designs</span>
                            </div>
                          </div>
                        </div>

                        {/* Payment / Pricing Actions Inline */}
                        <div className="flex flex-col justify-center bg-white/80 p-4 border border-slate-200 rounded-2xl md:w-56 shrink-0 text-left space-y-3 shadow-sm">
                          <div>
                            <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 block">Pro Premium Price</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="text-xl md:text-2xl font-black text-slate-900 font-sans">
                                {isGhana ? (isYearly ? "GHS 99" : "GHS 10") : isAfrica ? (isYearly ? "$14" : "$1.50") : (isYearly ? "$29" : "$3")}
                              </span>
                              <span className="text-[9px] text-slate-500">/{isYearly ? "yr" : "mo"}</span>
                            </div>
                            {isYearly && (
                              <span className="text-[8px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                Saves 19%+ with Annual billing
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            disabled={isPaymentLoading}
                            onClick={() => handlePaymentUpgrade("pro")}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-[11px] py-2.5 px-3 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                          >
                            {isPaymentLoading ? (
                              <>
                                <div className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                                <span>Processing...</span>
                              </>
                            ) : (
                              <>
                                <span>Secure pay with Paystack</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>

                          <div className="text-[8.5px] text-slate-500 leading-tight flex items-start gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-tight">Webhooks encrypted to: <code className="text-[8px] break-all font-mono font-bold block text-violet-700">https://mybuddiesbirthday.up.railway.app/webhook/paystack</code></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Grid of Plans */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Free Plan */}
                      <div className={`p-5 rounded-2xl border flex flex-col justify-between ${accountType === "Free" ? "bg-amber-500/5 border-amber-400 ring-2 ring-amber-400" : "bg-slate-50 border-slate-200 opacity-80"}`}>
                        <div>
                          {accountType === "Free" && <span className="bg-amber-500 text-slate-950 font-black tracking-widest text-[8px] uppercase px-2 py-0.5 rounded-full block w-fit mb-3">Active Now</span>}
                          <h5 className="font-extrabold text-sm text-slate-900">Free Tier</h5>
                          <p className="text-[10px] text-slate-500 mt-1">For basic tracking needs.</p>
                          <div className="my-3">
                            <span className="text-xl font-black text-slate-900">
                              {isGhana ? "GHS 0" : "$0"}
                            </span>
                            <span className="text-[10px] text-slate-400">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                          </div>
                          <ul className="text-[10px] space-y-1.5 text-slate-600 font-semibold leading-tight">
                            <li className="flex items-center gap-1"><span className="text-emerald-500 text-xs">✓</span> Max 5 friends</li>
                            <li className="flex items-center gap-1"><span className="text-emerald-500 text-xs">✓</span> In-app alerts</li>
                            <li className="flex items-center gap-1 text-slate-400"><span className="text-slate-300">✕</span> Email Reminders</li>
                            <li className="flex items-center gap-1 text-slate-400"><span className="text-slate-300">✕</span> Bulk CSV imports</li>
                          </ul>
                        </div>
                        <button 
                          disabled={accountType === "Free"}
                          onClick={() => {
                            setAccountType("Free");
                            triggerToast("Switched to Free plan", "Reverted account to standard Free limit.");
                            appendLog("💳 Transaction: Member plan changed to Free.");
                          }}
                          className={`w-full py-1.8 mt-4 rounded-xl text-[10px] font-bold ${accountType === "Free" ? "bg-amber-400 text-slate-950 cursor-default" : "bg-slate-200 hover:bg-slate-300 text-slate-700 pointer-events-auto cursor-pointer"}`}
                        >
                          {accountType === "Free" ? "Active" : "Downgrade"}
                        </button>
                      </div>

                      {/* Pro Plan */}
                      <div className={`p-5 rounded-2xl border flex flex-col justify-between ${accountType === "Pro" ? "bg-[#FAF9FF] border-indigo-500 ring-2 ring-indigo-500" : "bg-slate-50 border-slate-200"}`}>
                        <div>
                          {accountType === "Pro" && <span className="bg-indigo-600 text-white font-black tracking-widest text-[8px] uppercase px-2 py-0.5 rounded-full block w-fit mb-3">Active Now</span>}
                          <h5 className="font-extrabold text-sm text-slate-900">Pro VIP</h5>
                          <p className="text-[10px] text-slate-500 mt-1">For true gift organizers.</p>
                          <div className="my-3 relative">
                            <span className="text-xl font-black text-slate-900">
                              {proPriceFormatted}
                            </span>
                            <span className="text-[10px] text-slate-400">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                            {billingCycle === "annual" && (
                              <span className="absolute -top-4 right-0 bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1 py-0.2 rounded">
                                {savePercentagePro}
                              </span>
                            )}
                          </div>
                          <ul className="text-[10px] space-y-1.5 text-slate-600 font-semibold leading-tight">
                            <li className="flex items-center gap-1 text-indigo-950 font-bold"><span className="text-emerald-500 text-xs">✓</span> Unlimited friends</li>
                            <li className="flex items-center gap-1"><span className="text-emerald-500 text-xs">✓</span> 7d and 1d warnings</li>
                            <li className="flex items-center gap-1"><span className="text-emerald-500 text-xs">✓</span> 📧 Optional Email alerts</li>
                            <li className="flex items-center gap-1 text-slate-400"><span className="text-slate-300">✕</span> Bulk CSV imports</li>
                          </ul>
                        </div>
                        <button 
                          disabled={accountType === "Pro" || isPaymentLoading}
                          onClick={() => handlePaymentUpgrade("pro")}
                          className={`w-full py-1.8 mt-4 rounded-xl text-[10px] font-bold transition-all ${
                            accountType === "Pro" 
                              ? "bg-indigo-600 text-white cursor-default" 
                              : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"
                          } ${isPaymentLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isPaymentLoading ? "Initializing..." : accountType === "Pro" ? "Active Plan 👑" : "Upgrade to Pro"}
                        </button>
                      </div>

                      {/* Business Plan */}
                      <div className={`p-5 rounded-2xl border flex flex-col justify-between ${accountType === "Business" ? "bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500" : "bg-slate-50 border-slate-200"}`}>
                        <div>
                          {accountType === "Business" && <span className="bg-emerald-600 text-white font-black tracking-widest text-[8px] uppercase px-2 py-0.5 rounded-full block w-fit mb-3">Active Now</span>}
                          <h5 className="font-extrabold text-sm text-slate-900">Business Elite</h5>
                          <p className="text-[10px] text-slate-500 mt-1">For clubs &amp; retail circles.</p>
                          <div className="my-3 relative">
                            <span className="text-xl font-black text-slate-900">
                              {businessPriceFormatted}
                            </span>
                            <span className="text-[10px] text-slate-400">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                          </div>
                          <ul className="text-[10px] space-y-1.5 text-slate-600 font-semibold leading-tight">
                            <li className="flex items-center gap-1 text-emerald-950 font-bold"><span className="text-emerald-500 text-xs">✓</span> Unlimited friends</li>
                            <li className="flex items-center gap-1"><span className="text-emerald-500 text-xs">✓</span> Email &amp; Mass alerts</li>
                            <li className="flex items-center gap-1 text-emerald-900"><span className="text-emerald-500 text-xs">✓</span> 💼 Customers Bulk Import</li>
                            <li className="flex items-center gap-1"><span className="text-emerald-500 text-xs">✓</span> Custom design templates</li>
                          </ul>
                        </div>
                        <button 
                          disabled={accountType === "Business" || isPaymentLoading}
                          onClick={() => handlePaymentUpgrade("business")}
                          className={`w-full py-1.8 mt-4 rounded-xl text-[10px] font-bold transition-all ${
                            accountType === "Business" 
                              ? "bg-emerald-600 text-white cursor-default" 
                              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                          } ${isPaymentLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                        >
                          {isPaymentLoading ? "Initializing..." : accountType === "Business" ? "Active Plan 💼" : "Upgrade Business"}
                        </button>
                      </div>
                    </div>

                  {/* 💼 BUSINESS BULK BIRTHDAYS IMPORTER SUB CARD */}
                  <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3 text-left">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide flex items-center gap-2">
                      <Users className="w-4 h-4 text-emerald-600" />
                      <span>💼 Business Customer/Member Bulk Importer</span>
                    </span>
                    <p className="text-[11px] text-slate-500 leading-normal font-sans">
                      Copy and paste customer/member birthday rosters to register lists in bulk. Paste one record per line as: <code className="bg-slate-200 px-1 py-0.5 rounded text-indigo-700 text-[10px] font-mono">Full Name, Birthday (YYYY-MM-DD), WhatsApp Phone, Username, Category</code>
                    </p>

                    {accountType !== "Business" ? (
                      <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-200 text-left space-y-2 font-sans">
                        <p className="text-[11.5px] text-amber-900 font-bold">🔒 Feature Locked to Business Elite Plan</p>
                        <p className="text-[10.5px] text-slate-600">
                          Bulk roster importing is exclusively unlocked for Business Elite members (GHS 200/month) to track customer lists effortlessly.
                        </p>
                        <button 
                          onClick={() => {
                            setAccountType("Business");
                            triggerToast("Upgraded successfully! 💼", "Unlocked Business Bulk Importer.");
                          }}
                          className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs cursor-pointer shadow-xs transition-all animate-bounce"
                        >
                          Upgrade Plan to Business (GHS 200/mo)
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 font-sans">
                        <textarea
                          rows={4}
                          value={bulkImportText}
                          onChange={(e) => setBulkImportText(e.target.value)}
                          placeholder="e.g.&#10;Kofi Mensah, 1994-06-12, +233241112222, kofi_snap, VIP Customer&#10;Ama Serwaa, 1996-06-15, +233243334444, ama_serwaa_snap, Member"
                          className="w-full bg-white border border-slate-250 rounded-xl p-3 text-xs font-mono text-zinc-805 text-zinc-800 focus:outline-[#818CF8]"
                        />
                        <button
                          onClick={() => {
                            if (!bulkImportText.trim()) {
                              triggerToast("Empty Roster Data", "Ensure pasting at least one valid line first.");
                              return;
                            }
                            
                            const lines = bulkImportText.split("\n").filter(l => l.trim() !== "");
                            let countImported = 0;
                            const createdFriends: Friend[] = [];

                            lines.forEach(line => {
                              const segments = line.split(",").map(s => s.trim());
                              if (segments.length >= 2) {
                                const name = segments[0];
                                const bday = segments[1];
                                const rawPhone = segments[2];
                                const rawSnap = segments[3];
                                const rawRel = segments[4];
                                const companionId = name.toLowerCase().replace(/\s+/g, "-");
                                
                                // Simple date check YYYY-MM-DD
                                if (bday && bday.match(/^\d{4}-\d{2}-\d{2}$/)) {
                                  createdFriends.push({
                                    id: companionId,
                                    name: name,
                                    birthday: bday,
                                    phone: rawPhone || "+233241234567",
                                    snapchat: rawSnap || "customer_snap",
                                    relationship: rawRel || "Customer",
                                    interests: ["Specialty Coffee", "Local Crafts", "Corporate Events"],
                                    age: "30",
                                    avatar: "bg-indigo-600",
                                    wishlist: [
                                      {
                                        id: `wish-bulk-${Date.now()}-${countImported}`,
                                        title: "Corporate Recognition Package",
                                        price: "GHS 100.00",
                                        url: "",
                                        isClaimed: false
                                      }
                                    ],
                                    achievements: []
                                  });
                                  countImported++;
                                }
                              }
                            });

                            if (countImported > 0) {
                              setFriends(prev => [...prev, ...createdFriends]);
                              setBulkImportText("");
                              triggerToast(`Successfully Imported! 🎉`, `Added ${countImported} members/customers cleanly to your active list roster.`);
                              appendLog(`💼 Bulk import: Processed ${countImported} customer records into buddies registry list.`);
                            } else {
                              triggerToast("Import Parsing Error", "No lines matched the exact pattern (Name, YYYY-MM-DD). Please check commas.");
                            }
                          }}
                          className="px-4.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer"
                        >
                          Process &amp; Bulk Import Roster ({bulkImportText.split("\n").filter((l) => l.trim().length > 0).length} records)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                </div>
              </div>
            );
          })()}

        </div>

      </main>

      {/* MOBILE STICKY BOTTOM NAVIGATION BAR */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-900 border-t border-slate-800 flex justify-around items-center px-1 z-40 shadow-2xl pb-6 pt-2" id="mobile-bottom-navigation">
        <button
          onClick={() => {
            setActiveSection("dashboard");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all cursor-pointer ${
            activeSection === "dashboard" ? "text-indigo-400 font-black scale-105" : "text-slate-400 hover:text-slate-200"
          }`}
          title="Home"
        >
          <Home className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tight">Home</span>
        </button>

        <button
          onClick={() => {
            setActiveSection("registry");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 relative transition-all cursor-pointer ${
            activeSection === "registry" ? "text-indigo-400 font-black scale-105" : "text-slate-400 hover:text-slate-200"
          }`}
          title="Buddies Registry"
        >
                    <Users className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tight">Buddies</span>
          {friends.filter(f => f.id !== "alex" && f.connectedBack === false && f.incomingRequest === true).length > 0 && (
            <span className="absolute top-1 right-3.5 bg-rose-600 text-[8px] px-1 rounded text-white font-mono font-bold scale-75 border border-slate-700/60">
              {friends.filter(f => f.id !== "alex" && f.connectedBack === false && f.incomingRequest === true).length}
            </span>
          )}


        </button>

        <button
          onClick={() => {
            setActiveSection("gift-store");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all cursor-pointer ${
            activeSection === "gift-store" ? "text-indigo-400 font-black scale-105" : "text-slate-400 hover:text-slate-200"
          }`}
          title="Gifts"
        >
          <Gift className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tight">Gifts</span>
        </button>

        <button
          onClick={() => {
            setProfileSubTab("profile");
            setActiveSection("profile");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 transition-all cursor-pointer ${
            activeSection === "profile" && profileSubTab !== "settings" ? "text-indigo-400 font-black scale-105" : "text-slate-400 hover:text-slate-200"
          }`}
          title="Profile"
        >
          <User className="w-4.5 h-4.5 mb-0.5" />
          <span className="text-[9px] font-bold tracking-tight">Profile</span>
        </button>





      </nav>

      {/* Floating Spark AI Gift Suggestions Bubble (Bottom Right) */}
      <div className="fixed bottom-20 md:bottom-6 right-6 z-[9990] animate-bounce">
        <button
          onClick={() => {
            setIsAiLabOpen(true);
            // Auto Select first buddy if none active
            if (!selectedFriendId && friends.length > 0) {
              setSelectedFriendId(friends[0].id);
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 text-white p-4 rounded-full shadow-2xl flex items-center justify-center gap-2 cursor-pointer transition-all border border-indigo-500 duration-200"
          title="Spark AI Gift Suggestions"
        >
          <Sparkles className="w-5 h-5 animate-pulse" />
          <span className="text-xs font-black tracking-tight pr-1">Ask AI</span>
        </button>
      </div>

      {/* SLIDE-UP AI GIFT RECS MODAL / DRAWER */}
      <AnimatePresence>
        {isAiLabOpen && (
          <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
            {/* Backdrop with elegant blur */}
            <div 
              onClick={() => setIsAiLabOpen(false)}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity"
            />
            
            {/* Main Dialog Modal Container */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="relative bg-white border border-slate-150 rounded-[2rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 text-left z-10 flex flex-col space-y-6"
              id="global-ai-lab-modal"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-indigo-100/60 pb-4 bg-slate-50 -mx-6 -mt-6 p-6 md:-mx-8 md:-mt-8 md:p-8 rounded-t-[2rem]">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </span>
                  <div>
                    <h3 className="font-extrabold text-sm md:text-base text-slate-900 leading-tight">Gemini Spark AI Ideas Labs</h3>
                    <p className="text-[10px] md:text-xs text-slate-500">Curated, bespoke gift ideas matched precisely to buddy credentials</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsAiLabOpen(false)}
                  className="p-1 px-2.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-800 transition cursor-pointer text-xs font-bold"
                >
                  Close &times;
                </button>
              </div>

              {/* Body Elements */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-end bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="md:col-span-3">
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Companion Match</label>
                  <select
                    value={selectedFriendId}
                    onChange={(e) => {
                      setSelectedFriendId(e.target.value);
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none font-bold text-slate-800 cursor-pointer"
                  >
                    {friends.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} (Turns {f.age})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Relation</label>
                  <input
                    type="text"
                    value={aiRelationship}
                    onChange={(e) => setAiRelationship(e.target.value)}
                    className="w-full bg-white border border-slate-205 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Age Bracket</label>
                  <input
                    type="text"
                    value={aiAge}
                    onChange={(e) => setAiAge(e.target.value)}
                    className="w-full bg-white border border-slate-205 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none font-semibold text-slate-800"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[9px] font-bold uppercase text-slate-500 mb-1">Budget Threshold</label>
                  <select
                    value={aiBudget}
                    onChange={(e) => setAiBudget(e.target.value)}
                    className="w-full bg-white border border-slate-205 rounded-xl px-2.5 py-2 text-xs focus:outline-none font-semibold text-slate-800 cursor-pointer"
                  >
                    <option value="under $20">under $20 (Essential)</option>
                    <option value="under $50">under $50 (Standard)</option>
                    <option value="under $100">under $100 (Premium)</option>
                    <option value="above $200">above $200 (Luxury Limit)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <button
                    onClick={handleGetGiftSuggestions}
                    disabled={isLoadingAi}
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-755 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none"
                  >
                    {isLoadingAi ? (
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Spark Recs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Target Interests Pill previews */}
              <div className="flex gap-2 items-center text-[11px] px-1">
                <span className="font-bold text-slate-500">Buddy Interests tags:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedFriend?.interests?.map((i, idx) => (
                    <span key={idx} className="bg-indigo-100 text-indigo-755 text-[9px] font-bold px-2 py-0.5 rounded-md">
                      #{i}
                    </span>
                  ))}
                  {(!selectedFriend?.interests || selectedFriend.interests.length === 0) && (
                    <span className="text-slate-400 italic">None bound. Tweak in Buddies Registry to feed AI.</span>
                  )}
                </div>
              </div>

              {/* Recommendations Results Feed */}
              <div className="space-y-4 pt-2 w-full">
                {isLoadingAi ? (
                  /* Pulsing card Skeleton loaders of content cards — strictly non-AI looking, clean progress indicator */
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 animate-pulse w-full">
                    {[1, 2, 3].map(id => (
                      <div key={id} className="bg-slate-50/80 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4 text-left">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="h-4 bg-slate-200 rounded w-1/3" />
                            <div className="h-4 bg-slate-200 rounded w-1/6" />
                          </div>
                          <div className="h-3.5 bg-slate-200 rounded w-4/5" />
                          <div className="h-3 bg-slate-200 rounded w-full" />
                          <div className="h-3 bg-slate-200 rounded w-5/6" />
                        </div>
                        <div className="h-1 bg-slate-100 w-full pt-1" />
                        <div className="flex justify-between items-center pt-2">
                          <div className="h-3 bg-slate-200 rounded w-1/4" />
                          <div className="h-3 bg-slate-200 rounded w-1/3" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : aiSuggestions.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-250 w-full">
                    <Gift className="w-10 h-10 text-slate-400 mx-auto stroke-1 mb-2" />
                    <p className="font-bold text-slate-700 text-xs">Ready to initiate query builder</p>
                    <p className="text-[10px] text-slate-505 text-slate-500 mt-1">Configure criteria tags and press "Spark Recs" for Gemini-analyzed matches.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">
                    {aiSuggestions.map((gift, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-sm p-4.5 rounded-2xl flex flex-col justify-between transition-all text-left"
                      >
                        <div className="space-y-2.5">
                          <div className="flex justify-between items-start gap-1">
                            <span className="bg-rose-50 border border-rose-100 text-rose-700 font-black text-[9px] px-2 py-0.5 rounded-md uppercase">
                              {gift.category || "Gift Option"}
                            </span>
                            <span className="text-xs font-bold text-emerald-600 font-mono tracking-tight">{gift.estimatedPrice}</span>
                          </div>
                          
                          <h5 className="font-bold text-xs text-slate-800 mb-0.5 flex items-center gap-1">
                            🎁 {gift.name}
                          </h5>
                          
                          <p className="text-[10.5px] text-slate-500 leading-normal font-normal">
                            {gift.reason}
                          </p>
                        </div>
                        
                        <div className="mt-5 pt-3.5 border-t border-slate-100 flex justify-between items-center bg-slate-50 -mx-4.5 -mb-4.5 p-3.5 rounded-b-2xl">
                          <span className="text-[9px] text-emerald-600 font-extrabold font-mono">98% Match Rating</span>
                          <button 
                            onClick={() => saveAiSuggestionToWishlist(gift)}
                            className="text-[10.5px] text-indigo-600 font-bold hover:underline cursor-pointer bg-transparent border-none"
                          >
                            Save to Registry +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {aiNote && !isLoadingAi && (
                  <div className="flex items-center gap-2 mt-4 bg-slate-50 p-3 text-[10px] font-semibold rounded-xl text-slate-500 border border-slate-200 shadow-xs">
                    <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{aiNote}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLOBAL SHARE QR & LINK MODAL */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop with elegant blur */}
            <div 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="relative bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl max-w-md w-full p-6 md:p-8 text-center z-10 flex flex-col space-y-6"
              id="hbd-share-card-modal"
            >
              {/* Header */}
              <div className="flex justify-between items-center -mt-2 -mr-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 font-mono">My Handshake Pass</span>
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 px-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-650 transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* QR Image Frame */}
              <div className="flex flex-col items-center space-y-3.5 bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-[2rem] text-white relative overflow-hidden">
                <div className="absolute -right-8 -top-8 w-24 h-24 rounded-full bg-indigo-500/10 pointer-events-none blur-xl" />
                <div className="absolute -left-8 -bottom-8 w-24 h-24 rounded-full bg-teal-500/10 pointer-events-none blur-xl" />

                <div className="bg-white p-2.5 rounded-2xl shadow-lg border border-white/20">
                  <img 
                    src={getProfileQrUrl(200)}
                    alt="Scan HBD Loop QR Handshake"
                    className="w-[160px] h-[160px] block"
                    referrerPolicy="no-referrer"
                  />
                </div>

                <div className="text-center">
                  <h4 className="text-base font-extrabold text-white tracking-tight">{userSession ? userSession.name : "Alex Patel"}</h4>
                  <p className="text-xs text-indigo-300 font-medium">@{userSession ? userSession.username : "alex_patel"}</p>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed font-normal max-w-[280px]">
                  Scan this profile QR to send a pending buddy request. Acceptance is required before either roster is linked.
                </p>
              </div>

              {/* Share link input */}
              <div className="space-y-2 text-left">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400">Share Link Outside App</label>
                <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1.5 rounded-2xl">
                  <div className="flex-1 px-2.5 text-xs text-slate-600 font-mono truncate select-all">
                    {`${window.location.origin}/?user=${userSession ? userSession.username : "alex"}`}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const username = userSession ? userSession.username : "alex";
                      const shareUrl = `${window.location.origin}/?user=${username}`;
                      navigator.clipboard.writeText(shareUrl);
                      triggerToast("Copied External Link! 🔗", "Ready to share with people outside the app.");
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-850 text-white p-2.5 rounded-xl transition duration-150 flex items-center gap-1 cursor-pointer text-xs font-black shrink-0"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="px-0.5 text-[10px]">Copy</span>
                  </button>
                </div>
                <p className="text-[9.5px] text-slate-400 font-semibold italic text-center">
                  Let friends easily locate your landing birthday dashboard page.
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
