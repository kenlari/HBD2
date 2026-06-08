import React, { useState, useEffect } from "react";
import { INITIAL_FRIENDS, ALL_ACHIEVEMENTS_LIST } from "./data";
import { Friend, WishlistItem, Achievement, GiftSuggestion, InAppNotification, SentGift } from "./types";
import { WidgetSimulator } from "./components/WidgetSimulator";
import { MOCK_EXTERNAL_PROFILES, MockProfile } from "./mockProfiles";
import { QrScanner } from "./components/QrScanner";
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
  Moon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { LoginPage } from "./components/LoginPage";
import { BirthdayDashboard } from "./components/BirthdayDashboard";
import { SignUpFlow } from "./components/SignUpFlow";
import { ChatPage } from "./components/ChatPage";

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

export default function App() {
  // --- AUTHENTICATED USER SESSION STATE ---
  const [userSession, setUserSession] = useState<{
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

  // Dynamic search input inside the Dashboard Executive Deck to discover others
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState<string>("");

  // Friends list loaded from local storage or defaults
  const [friends, setFriends] = useState<Friend[]>(() => {
    const saved = localStorage.getItem("birthday_friends_list");
    return saved ? JSON.parse(saved) : INITIAL_FRIENDS;
  });

  // Dynamic update of "alex" self-profile based on custom session
  useEffect(() => {
    if (userSession) {
      setFriends(prev => {
        const hasAlex = prev.find(f => f.id === "alex");
        if (!hasAlex) return prev;
        return prev.map(f => {
          if (f.id === "alex") {
            return {
              ...f,
              name: `${userSession.name} (You)`,
              birthday: userSession.birthday,
              avatar: userSession.avatar,
              interests: userSession.interests
            };
          }
          return f;
        });
      });
    } else {
      // Revert to Alex Patel representation if log out occurs
      setFriends(prev => {
        return prev.map(f => {
          if (f.id === "alex") {
            return {
              ...f,
              name: "Alex Patel (You)",
              birthday: "1997-06-25",
              avatar: "bg-teal-500",
              interests: ["Photography", "Specialty Coffee", "Cyberpunk Novels", "Mechanic Keyboards"]
            };
          }
          return f;
        });
      });
    }
  }, [userSession]);

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
  const [signInBirthday, setSignInBirthday] = useState<string>("1997-06-25");
  const [signInAvatar, setSignInAvatar] = useState<string>("bg-indigo-600");
  const [signInInterests, setSignInInterests] = useState<string[]>(["Photography", "Specialty Coffee"]);

  // Track the active interactive workspace section
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "registry" | "ai-lab" | "ai-lab-legacy-hidden" | "gift-store" | "my-wishlist" | "widgets" | "achievements" | "profile" | "settings" | "upgrade" | "chat"
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

  // --- IN-APP GIFT STORE MANAGEMENT STATES ---
  const [giftStoreTab, setGiftStoreTab] = useState<"gallery" | "ledger">("gallery");
  const [customGiftStoreItem, setCustomGiftStoreItem] = useState<{ id: string; name: string; type: string; usdPrice: number } | null>(null);
  const [giftRecipientId, setGiftRecipientId] = useState<string>("");
  const [giftRevealDate, setGiftRevealDate] = useState<string>("");
  const [giftRecipientMessage, setGiftRecipientMessage] = useState<string>("");
  const [giftPaymentMethod, setGiftPaymentMethod] = useState<"momo" | "card" | "points">("momo");
  const [isGiftProcessing, setIsGiftProcessing] = useState<boolean>(false);
  const [giftProcessingStep, setGiftProcessingStep] = useState<string>("");

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
    globalCurrency,
    confettiOnBirthdays,
    userRegion
  ]);

  // Sync sent gifts
  useEffect(() => {
    localStorage.setItem("hbd_sent_gifts_log", JSON.stringify(sentGifts));
  }, [sentGifts]);

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
      "[10:42 AM] Connected to BloomBirth cloud system workspace.",
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
  const [profileSubTab, setProfileSubTab] = useState<"settings" | "profile" | "wishlist" | "widgets" | "trophies">("settings");
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [registrySubTab, setRegistrySubTab] = useState<"list" | "wishlist" | "widgets" | "trophies" | "connect" | "requests">("list");
  const [connectMethod, setConnectMethod] = useState<"contacts" | "username">("contacts");
  const [usernameSearch, setUsernameSearch] = useState<string>("");
  const [showRelationModal, setShowRelationModal] = useState<boolean>(false);
  const [pendingConnectProfile, setPendingConnectProfile] = useState<MockProfile | null>(null);

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
        title: "BloomBirth Sync Status",
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

  const selectedFriend = friends.find((f) => f.id === selectedFriendId) || friends[1] || friends[0];

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
      const dateParts = f.birthday.split("-");
      if (dateParts.length < 3) return false;
      const bMonth = parseInt(dateParts[1], 10) - 1; // 0-indexed month
      const bDay = parseInt(dateParts[2], 10);
      return bMonth === monthIdx && bDay === dayNum;
    });
  };

  const getUpcomingSorted = () => {
    return [...friends].sort((a, b) => {
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
      setActiveSection("registry");
      setRegistrySubTab("list");
    } else if (activeSection === "widgets") {
      setActiveSection("registry");
      setRegistrySubTab("widgets");
    } else if (activeSection === "achievements") {
      setActiveSection("registry");
      setRegistrySubTab("trophies");
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
  const handleImportInitiate = (profile: MockProfile) => {
    // Check if duplicate Name exists to guard roster integrity
    if (friends.some((f) => f.id === profile.id || f.name.toLowerCase() === profile.name.toLowerCase())) {
      triggerToast("Already Synchronized 🤝", `${profile.name} has already been registered to your Circle roster.`);
      return;
    }
    setPendingConnectProfile(profile);
    setShowRelationModal(true);
  };

  const handlePostWishlistAutomatically = (friendId: string) => {
    const mockProf = MOCK_EXTERNAL_PROFILES.find(p => p.id === friendId);
    if (!mockProf) return;

    setFriends(prev => {
      const alreadyHas = prev.find(f => f.id === friendId);
      if (!alreadyHas) return prev;
      return prev.map(f => {
        if (f.id === friendId) {
          return {
            ...f,
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
      title: "🎁 Birthday Wishlist Posted!",
      message: `${mockProf.name} just published their wishlist. Check out their premium desires and secure slot!`,
      friendId: friendId,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: false
    };

    setNotifications(prev => {
      const next = [newNotif, ...prev];
      localStorage.setItem("birthday_in_app_notifications", JSON.stringify(next));
      return next;
    });

    appendLog(`📢 Notification: ${mockProf.name} published their birthday list with ${mockProf.wishlistToPost.length} gift items.`);
    triggerToast("Wishlist Posted! 📣", `${mockProf.name} just published their wishlist. Tap to see.`);
  };

  const handleConnectAndSave = (relationshipType: string) => {
    if (!pendingConnectProfile) return;
    const profile = pendingConnectProfile;

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

    // Add to friends with empty wishlist
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
      phone: profile.phone || "+233241234567",
      snapchat: profile.username || "friend_snap",
      connectedBack: true
    };

    setFriends(prev => [...prev, newFriend]);
    appendLog(`🤝 Connected: ${profile.name} added (Relation: ${relationshipType})`);

    // Set countdown timer to simulate friend posting list in 12 seconds
    setPendingPostingTimers(prev => ({
      ...prev,
      [nextId]: 12
    }));

    setShowRelationModal(false);
    setPendingConnectProfile(null);

    // If user is inside the connect view, we want to immediately switch back or let them observe
    triggerToast(
      "Connection Synced 🤝",
      `${profile.name} added. Their wishlist schedule trigger will deploy in 12s.`
    );
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
      `${newFriendName} is added. Open the AI lab or widgets section to connect.`
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
      const matchesSearch = friend.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            friend.interests.some(i => i.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = filterRelationship === "All" || friend.relationship === filterRelationship;
      return matchesSearch && matchesCategory;
    });
  };

  const sortedUpcoming = getUpcomingSorted();
  const nextTarget = sortedUpcoming.find((f) => f.id !== "alex") || sortedUpcoming[0];
  const nextTargetDays = calculateDaysRemaining(nextTarget.birthday);

  // Statistics summaries for executive deck
  const totalBuddiesCount = friends.filter(f => f.id !== "alex").length;
  const claimedWishesCount = friends.reduce((sum, f) => {
    return sum + f.wishlist.filter(w => w.isClaimed).length;
  }, 0);
  const totalWishesCount = friends.reduce((sum, f) => {
    return sum + f.wishlist.length;
  }, 0);
  const unlockLevel = (friends.find(f => f.id === 'alex')?.achievements.length || 0) * 2 + 1;

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

  return (
    <div className="w-full min-h-screen bg-[#F1F5F9] flex flex-col lg:flex-row font-sans text-slate-800" id="bloom-app-root">
      
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
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md cursor-pointer hover:bg-indigo-500 transition-colors">
                B
              </span>
              <div>
                <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-1.5">
                  BloomBirth <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded font-mono uppercase">Pro</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Birthday &amp; Wishlist Suite</p>
              </div>
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
                {friends.filter(f => f.id !== "alex" && f.connectedBack === false).length || ""}
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
        <div className="p-4 border-t border-slate-800 text-slate-500 text-[10.5px]" id="sidebar-footer">
          <p className="font-semibold text-slate-400">Scheduled Landmark</p>
          <div className="flex justify-between items-center mt-1">
            <span className="truncate">{nextTarget.name}</span>
            <span className="font-semibold text-indigo-400">In {nextTargetDays}d</span>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 pb-28 lg:pb-0 lg:max-w-[1100px] lg:mx-auto" id="main-canvas-wrapper">
        
        {/* TOP STATUS BAR ROW */}
        <header className={`bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-4 justify-between items-start lg:items-center gap-4 z-10 text-left relative ${activeSection === "dashboard" ? "flex flex-col lg:flex-row" : "hidden"}`} id="main-workspace-header">
          
          {/* Mobile-only Branding Bar at top */}

          <div className="flex w-full md:w-auto items-center justify-between md:justify-start gap-4">
            <div>
              <span className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-black block">Your Space</span>
              <h2 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                {activeSection === "dashboard" && "Home"}
                {activeSection === "registry" && "Buddies"}
                {activeSection === "ai-lab" && "Gift Ideas"}
                {activeSection === "my-wishlist" && "My Wishlist"}
                {activeSection === "widgets" && "Widgets"}
                {activeSection === "achievements" && "Achievements"}
                {activeSection === "profile" && "Profile"}
                {activeSection === "settings" && "Settings"}
                {activeSection === "upgrade" && "Plans"}
                {activeSection === "chat" && "Chat & Wishes"}
              </h2>
            </div>
          </div>

          {/* Quick Header actions integration */}
          <div className="flex flex-wrap md:flex-nowrap items-center gap-3 w-full md:w-auto">
            {/* Real-time Notification Bell Widget */}
            <button
              onClick={() => setShowNotificationDrawer(true)}
              className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer inline-flex items-center justify-center border border-slate-200"
              title="Open Notification Feed"
              id="notification-bell-btn"
            >
              <Bell className="w-4 h-4" />
              {notifications.filter(n => !n.isRead).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 bg-rose-600 text-[9px] font-black text-white rounded-full flex items-center justify-center px-1 font-mono animate-pulse border border-white">
                  {notifications.filter(n => !n.isRead).length}
                </span>
              )}
            </button>

            {/* Premium / Upgrade Badge */}
            {accountType === "Free" && (
              <button
                type="button"
                onClick={() => setActiveSection("upgrade")}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-400 text-slate-900 rounded-xl text-xs font-extrabold cursor-pointer hover:from-amber-500 hover:to-amber-600 transition-all font-sans shadow-xs shrink-0"
                id="header-premium-badge"
              >
                <span>✨ Upgrade</span>
              </button>
            )}

            {accountType === "Pro" && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-[10px] uppercase font-black font-mono tracking-wider select-none shrink-0"
                id="header-premium-badge"
              >
                <span>PRO</span>
              </div>
            )}

            {accountType === "Business" && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] uppercase font-black font-mono tracking-wider select-none shrink-0"
                id="header-premium-badge"
              >
                <span>BIZ</span>
              </div>
            )}



            <button
              onClick={() => {
                setShowAddProfile(true);
                setIsQrScannerActive(false);
              }}
              className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-150 transition-all cursor-pointer active:scale-95"
              id="header-profile-add-btn"
            >
              <UserPlus className="w-4 h-4" />
              <span>New Buddy</span>
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
                          id: scannedProfile.snapchat || `scanned_${Date.now()}`,
                          name: scannedProfile.name,
                          username: scannedProfile.snapchat,
                          phone: scannedProfile.phone || scannedProfile.whatsapp || "",
                          birthday: scannedProfile.birthday,
                          age: scannedProfile.age,
                          avatar: "bg-teal-500",
                          interests: scannedProfile.interests ? scannedProfile.interests.split(",").map((t: string) => t.trim()) : [],
                          wishlistToPost: []
                        };
                        setPendingConnectProfile(mockProf);
                        setShowRelationModal(true);
                        setShowAddProfile(false);
                        setIsQrScannerActive(false);
                        triggerToast("QR Profile Scanned! ✨", `Choose relationship style with ${scannedProfile.name}.`);
                        appendLog(`🍀 Scanned profile QR card: Synced local state parameters of ${scannedProfile.name}.`);
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
                    <span>Optional simulated Email delivery sync</span>
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
        <div className="flex-1 overflow-y-auto p-6 md:p-8" id="workspace-viewport">
          
          {/* ==================== SCREEN 1: EXECUTIVE COMMAND CENTER ==================== */}
          {activeSection === "dashboard" && (
            <div className="space-y-6" id="view-dashboard-hull">
              {/* Upcoming Birthdays Dashboard Grid */}
              <BirthdayDashboard 
                friends={friends}
                userName={userSession ? userSession.name : "Alex Patel"}
                onViewFriend={(friendId) => {
                  setSelectedFriendId(friendId);
                  setActiveSection("registry");
                }}
                onOpenGiftAI={(friendId) => {
                  setSelectedFriendId(friendId);
                  setActiveSection("ai-lab");
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
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Immediate Simulation Matches ({MOCK_EXTERNAL_PROFILES.filter(p => p.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) || p.username.toLowerCase().includes(dashboardSearchQuery.toLowerCase()) || p.interests.some(i => i.toLowerCase().includes(dashboardSearchQuery.toLowerCase()))).length + friends.filter(f => f.id !== "alex" && f.name.toLowerCase().includes(dashboardSearchQuery.toLowerCase())).length} accounts)
                      </div>

                      {(() => {
                        const query = dashboardSearchQuery.toLowerCase().trim();
                        
                        // Filter external mock database profiles
                        const matchExternal = MOCK_EXTERNAL_PROFILES.filter(p => 
                          p.name.toLowerCase().includes(query) ||
                          p.username.toLowerCase().includes(query) ||
                          p.interests.some(i => i.toLowerCase().includes(query))
                        );

                        // Filter existing circle friends (excluding self)
                        const matchCircle = friends.filter(f => 
                          f.id !== "alex" && (
                            f.name.toLowerCase().includes(query) ||
                            f.interests.some(i => i.toLowerCase().includes(query))
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
                                    {ext.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                                  </div>
                                  <div className="min-w-0 flex-1 flex flex-col justify-between h-full">
                                    <div>
                                      <h5 className="font-extrabold text-xs text-slate-900 leading-tight block">{ext.name}</h5>
                                      <span className="text-[10px] text-indigo-500 font-bold block">@{ext.username}</span>
                                    </div>
                                    
                                    {/* Hobbies list */}
                                    <div className="flex flex-wrap gap-1 mt-1.5 leading-none">
                                      {ext.interests.slice(0, 3).map(interest => (
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

                    <div className="space-y-2 max-h-[290px] overflow-y-auto pr-1">
                      {sortedUpcoming.map((friend) => {
                        const days = calculateDaysRemaining(friend.birthday);
                        const isAlex = friend.id === "alex";

                        return (
                          <div 
                            key={friend.id}
                            className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                              friend.id === nextTarget.id 
                                ? "bg-amber-50/50 border-amber-300"
                                : "bg-slate-50/50 border-slate-100 hover:bg-slate-150"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-8 h-8 rounded-xl ${friend.avatar} text-white flex items-center justify-center font-bold text-xs`}>
                                {friend.name.split(" ").map(n => n[0]).join("")}
                              </span>
                              <div>
                                <span className="font-bold text-xs text-slate-850 block">{friend.name}</span>
                                <span className="text-[10px] text-slate-400 block">{friend.relationship} • Turns {friend.age}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-black text-xs text-indigo-700 block">
                                {isAlex ? "🎁 (You)" : `In ${days} Days`}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold block">{formatBirthdayDate(friend.birthday)}</span>
                            </div>
                          </div>
                        );
                      })}
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
          )}

          {/* ==================== SCREEN 2: BUDDIES REGISTRY CRM ==================== */}
          {activeSection === "registry" && (
            <div className="space-y-6 text-left" id="view-registry-hull">

              {/* Universal Buddies Navigation Bar */}

             <div className="flex bg-slate-200/80 p-1.5 rounded-2xl w-full border border-slate-300/40 shadow-xs gap-1" id="registry-segmented-tabs">
<button
  type="button"
  onClick={() => setRegistrySubTab("list")}
  className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
    registrySubTab === "list"
      ? "bg-white text-slate-900 shadow-md"
      : "text-slate-500 hover:text-slate-900"
  }`}
>
  <Users className="w-3 h-3" />
  <span>Buddies</span>
</button>
<button
  type="button"
  onClick={() => setRegistrySubTab("connect")}
  className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 ${
    registrySubTab === "connect"
      ? "bg-white text-slate-900 shadow-md"
      : "text-slate-500 hover:text-slate-900"
  }`}
>
  <UserPlus className="w-3 h-3" />
  <span>Connect</span>
</button>
<button
  type="button"
  onClick={() => setRegistrySubTab("requests")}
  className={`flex-1 py-2 text-[11px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1 relative ${
    registrySubTab === "requests"
      ? "bg-white text-slate-900 shadow-md"
      : "text-slate-500 hover:text-slate-900"
  }`}
>
  <UserPlus className="w-3 h-3 text-rose-500" />
  <span>Requests</span>
  {friends.filter(f => f.id !== "alex" && f.connectedBack === false).length > 0 && (
    <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[8px] font-black rounded-full flex items-center justify-center">
      {friends.filter(f => f.id !== "alex" && f.connectedBack === false).length}
    </span>
  )}
</button>

              </div>

              {/* Dynamic sections based on selected subtab */}
              {(registrySubTab === "list" || registrySubTab === "connect" || registrySubTab === "requests") ? (
                <div className={viewingBuddyProfile ? "block" : "grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"}>
                  {/* Left Column (SPAN 5) */}
                  <div className={`${viewingBuddyProfile ? "hidden" : "lg:col-span-5"} space-y-4`}>
                    {/* --- TAB A: MY CURRENT ROSTER CIRCLES (ORIGINAL LIST VIEW) --- */}
                    {registrySubTab === "list" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3">                     
                      {/* Search Bar */}
                      <div className="relative mb-4">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="text"
                          placeholder="Search companions by names or tags..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9.5 pr-3 py-2 text-xs focus:ring-2 focus:outline-none"
                        />
                      </div>

                      {/* Relationship category filters */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-5 px-5">
                        {["All", "Best Friend", "College Buddy", "Work Colleague", "Family Relative", "Gym Partner", "Configure Later"].map(cat => (
                          <button
                            key={cat}
                            onClick={() => setFilterRelationship(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition-all border shrink-0 whitespace-nowrap ${
                              filterRelationship === cat
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100"
                            }`}
                          >
                            {cat === "Configure Later" ? "Unconfigured ⚠️" : cat}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Buddies Directory Card List */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Buddies Matches ({getFilteredFriends().length})</span>
                        <button 
                          onClick={() => setShowAddProfile(true)}
                          className="text-[11px] text-indigo-600 hover:underline font-extrabold"
                        >
                          Add Custom Buddy +
                        </button>
                      </div>
                      <div className="space-y-2">
                        {getFilteredFriends().length === 0 ? (
                          <div className="py-8 text-center text-slate-400">
                            <Search className="w-8 h-8 text-slate-300 mx-auto stroke-1" />
                            <p className="text-xs font-semibold mt-1">No matching roster items</p>
                          </div>
                        ) : (
                          getFilteredFriends().map(friend => {
                            const days = calculateDaysRemaining(friend.birthday);
                            const isSel = friend.id === selectedFriendId;
                            const isSelf = friend.id === "alex";

                            return (
                              <div
                                key={friend.id}
                                onClick={() => { setSelectedFriendId(friend.id); setViewingBuddyProfile(true); }}
                                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between cursor-pointer transition-all duration-200 ${
                                  isSel
                                    ? "bg-indigo-600 border-indigo-600 text-white shadow-md"
                                    : "bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white ${friend.avatar}`}>
                                    {friend.name.split(" ").map(n => n[0]).join("")}
                                  </span>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className={`text-xs font-bold block truncate ${isSel ? "text-white" : "text-slate-800"}`}>
                                        {friend.name}
                                      </span>
                                      {isSelf ? (
                                        <span className={`text-[9.5px] font-extrabold px-1 py-0.2 rounded font-mono shrink-0 uppercase tracking-wide ${
                                          isSel ? "bg-indigo-500/40 text-indigo-200" : "bg-slate-200/60 text-slate-600"
                                        }`}>
                                          Host
                                        </span>
                                      ) : friend.connectedBack ? (
                                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded font-mono shrink-0 flex items-center gap-0.5 ${
                                          isSel 
                                            ? "bg-indigo-500/30 text-emerald-200" 
                                            : "bg-emerald-50 text-emerald-700"
                                        }`}>
                                          🤝 Linked
                                        </span>
                                      ) : (
                                        <span className={`text-[9.5px] font-extrabold px-1.5 py-0.2 rounded font-mono shrink-0 flex items-center gap-0.5 ${
                                          isSel 
                                            ? "bg-indigo-500/30 text-amber-200" 
                                            : "bg-amber-50 text-amber-700"
                                        }`}>
                                          🔒 Locked
                                        </span>
                                      )}
                                    </div>
                                    <span className={`text-[10px] font-semibold block ${isSel ? "text-indigo-200" : "text-slate-500"}`}>
                                      {friend.relationship === "Configure Later" ? "⚠️ Configure Relation" : `${friend.relationship} • Turns ${friend.age}`}
                                    </span>
                                    {/* Gift badge if any gift is sent */}
                                    {(() => {
                                      const giftCount = sentGifts.filter(g => g.friendId === friend.id).length;
                                      if (giftCount > 0) {
                                        return (
                                          <span className={`inline-flex items-center gap-1 mt-1 text-[9px] font-black px-1.5 py-0.5 rounded font-mono uppercase tracking-wide shrink-0 ${
                                            isSel ? "bg-rose-500/40 text-rose-100 border border-rose-400/30" : "bg-rose-50 text-rose-600 border border-rose-100"
                                          }`}>
                                            🎁 {giftCount} {giftCount === 1 ? 'gift' : 'gifts'}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`text-[10px] font-black block ${isSel ? "text-white" : "text-indigo-600"}`}>
                                    {isSelf ? "🎁 You" : `In ${days} Days`}
                                  </span>
                                  <span className={`text-[9px] block ${isSel ? "text-indigo-200" : "text-slate-400"}`}>
                                    {formatBirthdayDate(friend.birthday)}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* --- TAB B: CONNECT & IMPORT HUB (ADDRESS BOOK & USERNAME LOOKUP) --- */}
                {registrySubTab === "connect" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="space-y-3 text-left">

                      {/* Pill Method selector */}
                      <div className="flex bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold font-sans">
                        <button
                          onClick={() => setConnectMethod("contacts")}
                          className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer text-center ${
                            connectMethod === "contacts"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-505 hover:text-slate-800"
                          }`}
                        >
                          Contacts Address Book
                        </button>
                        <button
                          onClick={() => setConnectMethod("username")}
                          className={`flex-1 py-1.5 rounded-lg transition-colors cursor-pointer text-center ${
                            connectMethod === "username"
                              ? "bg-indigo-600 text-white"
                              : "text-slate-550 hover:text-slate-800"
                          }`}
                        >
                          Username Lookup
                        </button>
                      </div>

                      {/* Case 1: Contacts Address Book */}
                      {connectMethod === "contacts" && (
                        <div className="space-y-3">
                          <p className="text-[10.5px] text-slate-500 font-medium">
                            BloomBirth scanner has located <strong>{MOCK_EXTERNAL_PROFILES.length} core matches</strong> in your local device phonebook. Tap to sync profiles:
                          </p>

                          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {MOCK_EXTERNAL_PROFILES.map(p => {
                              const isConnected = friends.some(f => f.id === p.id);
                              
return (
  <div
    key={p.id}
    className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition"
  >
    <div className="flex items-center gap-2.5">
      <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs text-white font-bold ${p.avatar}`}>
        {p.name.split(" ").map(n => n[0]).join("")}
      </span>
      <div>
        <span className="text-xs font-bold text-slate-800 block">{p.name}</span>
        <span className="text-[10px] text-indigo-500 font-mono">@{p.username}</span>
      </div>
    </div>
    {isConnected ? (
      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
        Connected
      </span>
    ) : (
      <button
        onClick={() => handleImportInitiate(p)}
        className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl cursor-pointer"
      >
        Import +
      </button>
    )}
  </div>
);
                            })}
                          </div>
                        </div>
                      )}

                      {/* Case 2: Username Lookup */}
                      {connectMethod === "username" && (
                        <div className="space-y-3">
                          <label className="block text-[10px] font-bold uppercase text-indigo-800">Lookup user handle</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={usernameSearch}
                              onChange={(e) => setUsernameSearch(e.target.value)}
                              placeholder="Type handle e.g. elena_zen, biker_zoe..."
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:outline-none"
                            />
                            {usernameSearch && (
                              <button 
                                onClick={() => setUsernameSearch("")} 
                                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-650"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>

                          <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 pt-1">
                            {MOCK_EXTERNAL_PROFILES
                              .filter(p => {
                                if (!usernameSearch.trim()) return true; // show all handles by default to let user browse
                                return p.username.toLowerCase().includes(usernameSearch.toLowerCase()) || p.name.toLowerCase().includes(usernameSearch.toLowerCase());
                              })
                              .map(p => {
                                const isConnected = friends.some(f => f.id === p.id);

                                return (
<div
  key={p.id}
  className="flex items-center justify-between p-3 rounded-2xl border border-slate-100 hover:bg-slate-50 transition"
>
  <div className="flex items-center gap-2.5">
    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs text-white font-bold ${p.avatar}`}>
      {p.name.split(" ").map(n => n[0]).join("")}
    </span>
    <div>
      <span className="text-xs font-bold text-slate-800 block">{p.name}</span>
      <span className="text-[10px] text-indigo-500 font-mono">@{p.username}</span>
    </div>
  </div>
  {isConnected ? (
    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
      Connected
    </span>
  ) : (
    <button
      onClick={() => handleImportInitiate(p)}
      className="text-[10px] font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-xl cursor-pointer"
    >
      Connect +
    </button>
  )}
</div>
);
})}
</div>
</div>
)}
                    </div>


                  </motion.div>
                )}
                {/* --- TAB C: FRIEND REQUESTS --- */}
{registrySubTab === "requests" && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="space-y-3"
  >
    {friends.filter(f => f.id !== "alex" && f.connectedBack === false).length === 0 ? (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
        <UserPlus className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <p className="text-xs font-bold text-slate-500">No pending friend requests</p>
      </div>
    ) : (
      friends.filter(f => f.id !== "alex" && f.connectedBack === false).map(f => (
        <div key={f.id} className="bg-white rounded-2xl border border-indigo-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className={`w-10 h-10 rounded-xl ${f.avatar} text-white flex items-center justify-center font-bold text-sm`}>
              {f.name.split(" ").map(n => n[0]).join("")}
            </span>
            <div>
              <span className="text-sm font-bold text-slate-800 block">{f.name}</span>
              <span className="text-[10px] text-slate-400">{f.relationship}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFriends(prev => prev.map(p => p.id === f.id ? {...p, connectedBack: true} : p))}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl cursor-pointer"
            >Accept</button>
            <button
              onClick={() => setFriends(prev => prev.filter(p => p.id !== f.id))}
              className="px-3 py-1.5 bg-slate-100 hover:bg-rose-100 text-slate-600 hover:text-rose-600 text-xs font-bold rounded-xl cursor-pointer"
            >Decline</button>
          </div>
        </div>
      ))
    )}
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
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-stretch gap-4 pb-6 border-b border-slate-200">
                    <div className="flex gap-4 items-center">
                      <div className={`w-14 h-14 rounded-2xl ${selectedFriend.avatar} text-white flex items-center justify-center font-bold font-serif text-2xl shadow-sm`}>
                        {selectedFriend.name.split(" ").map(n => n[0]).join("")}
                      </div>

                      {(selectedFriend.id === 'alex' || selectedFriend.connectedBack) && (
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight">{selectedFriend.name}</h3>
                          <p className="text-xs text-slate-500 font-semibold">
                            Relationship: <span className="text-zinc-800 font-bold">{selectedFriend.relationship}</span>
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">Birthday: <span className="text-indigo-600 font-bold">{formatBirthdayDate(selectedFriend.birthday)} ({selectedFriend.birthday})</span></p>

                          {/* Elegant coordinates tray */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-left">
                            <div className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2 py-1 flex items-center gap-1 text-[10.5px] font-semibold text-slate-700">
                              <Phone className="w-3 h-3 text-blue-500" />
                              <span className="text-slate-400 font-medium">Phone:</span>
                              <span className="font-mono text-slate-800">{selectedFriend.phone || "+233241234567"}</span>
                            </div>
                            <div className="bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-lg px-2 py-1 flex items-center gap-1 text-[10.5px] font-semibold text-slate-700">
                              <MessageSquare className="w-3 h-3 text-emerald-500" />
                              <span className="text-slate-400 font-medium">WhatsApp:</span>
                              <span className="font-mono text-slate-800">{selectedFriend.whatsapp || "+233241234567"}</span>
                            </div>
                            <div className="bg-amber-50/50 hover:bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 flex items-center gap-1 text-[10.5px] font-semibold">
                              <span className="text-amber-600 font-bold">Snapchat:</span>
                              <span className="font-mono text-amber-800 font-bold">@{selectedFriend.snapchat || "friend_snap"}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {(selectedFriend.id === 'alex' || selectedFriend.connectedBack) && (
                      <div className="flex flex-col justify-end gap-2 text-right">
                        <div className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1 rounded-xl text-xs font-semibold w-fit self-end flex items-center gap-1 bg-opacity-60">
                          <Clock className="w-3.5 h-3.5" />
                          <span>In {calculateDaysRemaining(selectedFriend.birthday)} Days</span>
                        </div>
                        
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={() => setIsEditingFriend(!isEditingFriend)}
                            className="px-3 py-1 text-[11px] font-bold text-slate-700 hover:text-indigo-600 bg-slate-150 rounded"
                          >
                            {isEditingFriend ? "Close Editor" : "Edit Profile Details"}
                          </button>
                          {selectedFriend.id !== 'alex' && (
                            <button
                              onClick={() => handleDeleteFriendProfile(selectedFriend.id)}
                              className="p-1 px-1.5 bg-rose-50 text-rose-600 rounded text-[11px]"
                              title="Delete companion profile"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
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
                              .map(gift => (
                                <div 
                                  key={gift.id}
                                  className="bg-[#FFFDFD] hover:bg-[#FFF9F9] border border-rose-100/85 hover:border-rose-200 p-3 rounded-2xl text-left flex flex-col justify-between gap-2.5 transition relative overflow-hidden"
                                >
                                  <div className="flex items-start gap-2">
                                    <span className="text-2xl mt-0.5 shrink-0">
                                      {gift.giftType === "rose" && "🌹"}
                                      {gift.giftType === "bouquet" && "💐"}
                                      {gift.giftType === "money" && "💰"}
                                    </span>
                                    <div className="min-w-0">
                                      <h5 className="font-extrabold text-xs text-slate-900 truncate">{gift.giftName}</h5>
                                      <span className="text-[10px] text-emerald-600 font-mono font-black block">{gift.price} • Delivered</span>
                                    </div>
                                  </div>

                                  <div className="bg-slate-50 p-1.5 rounded-lg text-[10.5px] italic text-slate-600 leading-snug border border-slate-100/50 line-clamp-2">
                                    "{gift.message}"
                                  </div>

                                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-400 pt-1 border-t border-rose-100/40">
                                    <span>Sent: {gift.dateSent}</span>
                                    <span className="text-emerald-500 font-bold uppercase tracking-wider">● Secure Locker</span>
                                  </div>
                                </div>
                              ))}
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
              </div>
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
                {registrySubTab === "widgets" && (
                  <div className="space-y-6 animate-fade-in" id="profile-subtab-widgets">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 text-left header-explain-widgets">
                      <h3 className="font-black text-lg text-slate-900">Interactive Device Complication Simulator</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Adjust preferences on the customizer control panel to see live lock screen complications or homescreen frames automatically synchronized dynamically.
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-[2rem] border border-slate-200/50 p-2 md:p-4">
                      <WidgetSimulator friends={friends} />
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="ai-lab-suggestions-feed">
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
                                if (soundEffectsEnabled) {
                                  try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                                }
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
                                if (soundEffectsEnabled) {
                                  try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                                }
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
                              if (soundEffectsEnabled) {
                                try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                              }
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
                            if (soundEffectsEnabled) {
                              try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                            }
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
                            try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
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
                            if (soundEffectsEnabled) {
                              try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                            }
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
                            if (soundEffectsEnabled) {
                              try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                            }
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
                            if (soundEffectsEnabled) {
                              try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                            }
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
                          name: signInName.trim(),
                          username: signInUsername.trim().replace(/^@/, ""),
                          email: signInEmail.trim(),
                          phone: signInPhone.trim(),
                          whatsapp: signInWhatsApp.trim(),
                          birthday: signInBirthday || "1997-06-25",
                          avatar: signInAvatar || "bg-indigo-600",
                          interests: signInInterests
                        };
                        localStorage.setItem("birthday_authenticated_user", JSON.stringify(sessionObj));
                        // Save to multi-account registry
                        const existingAccounts = localStorage.getItem("hbd_all_accounts");
                        const accountsArray = existingAccounts ? JSON.parse(existingAccounts) : [];
                        const filteredAccounts = accountsArray.filter((a: any) => a.email !== sessionObj.email);
                        localStorage.setItem("hbd_all_accounts", JSON.stringify([...filteredAccounts, sessionObj]));
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
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=115x115&data=${encodeURIComponent(JSON.stringify({
                              hbd: true,
                              name: userSession ? userSession.name : "Alex Patel",
                              birthday: userSession ? userSession.birthday : "1997-06-25",
                              age: "28",
                              relationship: "Work Colleague",
                              phone: userSession && "phone" in userSession ? (userSession as any).phone : "+233241234567",
                              whatsapp: userSession && "whatsapp" in userSession ? (userSession as any).whatsapp : "+233241234567",
                              email: userSession ? userSession.email : "alex@example.com",
                              snapchat: userSession ? userSession.username : "alex_snap",
                              interests: userSession ? userSession.interests.join(", ") : "Cyberpunk, Mechanic Keyboards",
                              connectedBack: true
                            }))}`}
                            alt="Your HBD Profile QR Code Pass"
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
                            Show this private token to other HBD dashboard workspace users. Once scanned, your coordinates will populate instantly with mutual 🤝 connections enabled!
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

                  <div className="p-5 space-y-5">
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
                      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black uppercase tracking-wider text-slate-500">Email Birthday Alerts</span>
                          <input
                            type="checkbox"
                            checked={enableEmailReminders}
                            onChange={(e) => setEnableEmailReminders(e.target.checked)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                          />
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

                    <div className="border-t border-slate-200 pt-4 space-y-3">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem("birthday_authenticated_user");
                          setUserSession(null);
                          setIsProfileSettingsOpen(false);
                          triggerToast("Logged Out", "Your profile session has been signed out.");
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
            <div className="space-y-6 text-left animate-fade-in" id="view-gift-store-hull">
              {/* My Wallet Card */}
              <div className="bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm text-left relative overflow-hidden transition-all duration-300 hover:shadow-md" id="wallet-card-container">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">👛</span>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white">My Wallet</h3>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">Available Balance</span>
                      <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                        GHS {walletBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-md italic font-sans">
                      Gifts received on your birthday are paid into your wallet automatically
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDepositForm(!showDepositForm);
                        setShowWithdrawForm(false);
                      }}
                      className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition duration-200 cursor-pointer ${
                        showDepositForm 
                          ? "bg-indigo-105 text-indigo-700 bg-indigo-50 border border-indigo-200" 
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
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
                      className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition duration-200 cursor-pointer ${
                        showWithdrawForm 
                          ? "bg-slate-205 text-slate-800 bg-slate-100 border border-slate-300" 
                          : "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                      }`}
                    >
                      Withdraw ↙
                    </button>
                  </div>
                </div>

                {/* Expanded Deposit Form */}
                {showDepositForm && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-down space-y-3 max-w-md">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Amount to Deposit (GHS)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 50"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const amt = parseFloat(depositAmount);
                          if (!amt || amt <= 0 || isNaN(amt)) {
                            triggerToast("Error", "Please enter a valid positive deposit amount.");
                            return;
                          }
                          setWalletBalance(prev => prev + amt);
                          triggerToast("Deposit Successful 🎉", `Added GHS ${amt.toFixed(2)} to your wallet balance.`);
                          setDepositAmount("");
                          setShowDepositForm(false);
                          if (soundEffectsEnabled) {
                            try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                          }
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        Confirm Deposit
                      </button>
                    </div>
                  </div>
                )}

                {/* Expanded Withdraw Form */}
                {showWithdrawForm && (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-slide-down space-y-3 max-w-md">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Amount to Withdraw (GHS)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="1"
                        placeholder="e.g. 20"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-indigo-500"
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
                          setWalletBalance(prev => prev - amt);
                          triggerToast("Withdrawal Successful 💸", `Withdrew GHS ${amt.toFixed(2)} from your wallet balance.`);
                          setWithdrawAmount("");
                          setShowWithdrawForm(false);
                          if (soundEffectsEnabled) {
                            try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                          }
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition cursor-pointer"
                      >
                        Confirm Withdraw
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sub Navigation Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-2xl w-full border border-slate-200 shadow-sm max-w-sm" id="store-tabs-wrapper">
                <button
                  type="button"
                  onClick={() => setGiftStoreTab("gallery")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    giftStoreTab === "gallery"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Gift className="w-3.5 h-3.5 text-rose-505" />
                  <span>Send Gifts</span>
                </button>
                <button
                  type="button"
                  onClick={() => setGiftStoreTab("ledger")}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    giftStoreTab === "ledger"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-indigo-505" />
                  <span>Sent Gifts ({sentGifts.length})</span>
                </button>
              </div>

              {/* TAB 1: BOUTIQUE GALLERY */}
              {giftStoreTab === "gallery" && (
                <div className="space-y-6">
                  {/* Grid layout */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {GIFT_INVENTORY.map((item) => (
                      <div key={item.id} className="bg-white border border-rose-100 hover:border-rose-300 shadow-xs p-6 rounded-[2rem] flex flex-col justify-between transition-all group hover:shadow-lg hover:-translate-y-1 relative overflow-hidden text-left">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-50/50 rounded-bl-full pointer-events-none -mr-4 -mt-4 transition-colors group-hover:bg-rose-100/30" />
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-3xl filter drop-shadow-xs">{item.emoji}</span>
                            <span className="bg-rose-50 text-rose-700 text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider border border-rose-100/40">
                              {item.category}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-black text-base text-zinc-900 group-hover:text-rose-700 transition-colors flex items-center gap-1.5">
                              <span>{item.name}</span>
                            </h4>
                            <p className="text-[11px] text-zinc-500 font-sans mt-1.5 leading-relaxed">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block pb-0.5">Unit Cost</span>
                            <span className="text-base font-black text-rose-600 font-mono">
                              {getFormattedPrice(item.usdPrice)}
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setCustomGiftStoreItem({ id: item.id, name: item.name, type: item.type, usdPrice: item.usdPrice });
                              
                              // Select default recipient
                              if (friends.length > 0) {
                                setGiftRecipientId(friends[0].id);
                                
                                // Default reveal date to friend's birthday (mapped to next year occurrence or today)
                                const yr = new Date().getFullYear();
                                const bdy = friends[0].birthday;
                                if (bdy) {
                                  const parts = bdy.split("-");
                                  if (parts.length === 3) {
                                    setGiftRevealDate(`${yr}-${parts[1]}-${parts[2]}`);
                                  } else {
                                    setGiftRevealDate(getTodayDateString());
                                  }
                                } else {
                                  setGiftRevealDate(getTodayDateString());
                                }
                              } else {
                                setGiftRecipientId("");
                                setGiftRevealDate(getTodayDateString());
                              }
                              setGiftRecipientMessage(`Sending this lovely ${item.emoji} ${item.name} with warm celebration wishes! ✨🎁`);
                              setGiftPaymentMethod("momo");
                            }}
                            className="bg-indigo-600 hover:bg-rose-600 text-white font-black text-xs px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 group-hover:shadow-md"
                          >
                            Send {item.emoji}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Aesthetic Guarantee Alert Card */}
                  <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-4 text-left">
                    <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shrink-0 animate-pulse">
                      ℹ️
                    </div>
                    <div>
                      <span className="text-xs font-black text-zinc-800 block">Workspace Delivery &amp; Scheduler Guarantee</span>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Whenever you purchase a gift, you can configure a specific **scheduled reveal date**. The present will remain securely locked in localStorage/the platform registry until the chosen date. Once reached, is automatic-unlocked, sending instant chimes &amp; in-app dashboard signals!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SENT GIFT LEDGER */}
              {giftStoreTab === "ledger" && (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 space-y-6 text-left shadow-xs">
                  <div>
                    <h4 className="font-extrabold text-sm text-zinc-900 flex items-center gap-2">
                      <Activity className="w-4.5 h-4.5 text-indigo-600 animate-pulse" />
                      <span>Sent Gifts History</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Check live statuses or recall dedications sent via Mobile Money or Secure Credit Cards.
                    </p>
                  </div>

                  {sentGifts.length === 0 ? (
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
                                  id: "gift_tx_" + Date.now(),
                                  friendId: selectedFriend.id,
                                  friendName: selectedFriend.name,
                                  giftType: customGiftStoreItem.type,
                                  giftName: customGiftStoreItem.name,
                                  price: formattedPriceString,
                                  status: "Delivered",
                                  message: giftRecipientMessage.trim() || `Sent a lovely ${customGiftStoreItem.name}!`,
                                  dateSent: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
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
                                if (soundEffectsEnabled) {
                                  try { new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav").play(); } catch(e){}
                                }

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
                            Proceed &amp; Authorize Sandbox Transaction
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
          {activeSection === "upgrade" && (
            <div className="space-y-6 text-left animate-fade-in" id="view-upgrade-hull">
              {/* Top Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-3xl text-left text-white shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-indigo-500/10 pointer-events-none blur-3xl opacity-30" />
                <h3 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-indigo-400" />
                  <span>Plans</span>
                </h3>
                <p className="text-xs text-indigo-200 mt-1.5 leading-relaxed max-w-xl font-sans">
                  Manage your subscription level, toggle email reminders settings, customize handles, or bulk-import members for corporate campaigns.
                </p>
              </div>

              {/* Two-Column Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Column 1: Pricing Tiers & Subscription (Span 7) */}
                <div className="lg:col-span-7 bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
                  <div>
                             </div>

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

                    {/* Manual Location Selection */}
                    <div className="w-full sm:w-auto text-left sm:text-right">
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Location Tier</span>
                      <select
                        value={userRegion}
                        onChange={(e) => {
                          const val = e.target.value as any;
                          setUserRegion(val);
                          triggerToast("Region Saved 🌍", `Prices adjusted automatically to match localization rules.`);
                        }}
                        className="bg-white border border-slate-300 rounded-xl px-2.5 py-1 text-[10px] font-extrabold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-150 shadow-xs cursor-pointer"
                      >
                        <option value="Ghana">🇬🇭 Ghana (GHS)</option>
                        <option value="Other Africa">🌍 Other Africa (USD)</option>
                        <option value="USA/Western">🗽 USA &amp; Western (USD)</option>
                        <option value="Default">🌐 Global default (USD)</option>
                      </select>
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
                            {userRegion === "Ghana" ? "GHS 0" : "$0"}
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
                            {userRegion === "Ghana" 
                              ? (billingCycle === "monthly" ? "GHS 10" : "GHS 99")
                              : userRegion === "USA/Western"
                                ? (billingCycle === "monthly" ? "$3" : "$29")
                                : (billingCycle === "monthly" ? "$1.50" : "$14")
                            }
                          </span>
                          <span className="text-[10px] text-slate-400">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                          {billingCycle === "annual" && (
                            <span className="absolute -top-4 right-0 bg-emerald-100 text-emerald-800 text-[8px] font-bold px-1 py-0.2 rounded">
                              {userRegion === "Ghana" ? "Save 17%" : userRegion === "USA/Western" ? "Save 19%" : "Save 22%"}
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
                        onClick={() => {
                          setAccountType("Pro");
                          const activePrice = userRegion === "Ghana" 
                            ? (billingCycle === "monthly" ? "GHS 10/mo" : "GHS 99/yr")
                            : userRegion === "USA/Western"
                              ? (billingCycle === "monthly" ? "$3/mo" : "$29/yr")
                              : (billingCycle === "monthly" ? "$1.50/mo" : "$14/yr");
                          triggerToast("Upgraded to Pro VIP 👑", `Unlocked infinite buddy profiles, alerts warnings and email syncing matching ${activePrice}.`);
                          appendLog(`💳 Transaction: Member plan upgraded to Pro VIP (${activePrice}).`);
                        }}
                        className={`w-full py-1.8 mt-4 rounded-xl text-[10px] font-bold ${accountType === "Pro" ? "bg-indigo-600 text-white cursor-default" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-700 cursor-pointer"}`}
                      >
                        {accountType === "Pro" ? "Active Plan 👑" : "Upgrade to Pro"}
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
                            {userRegion === "Ghana" 
                              ? (billingCycle === "monthly" ? "GHS 200" : "GHS 1,999")
                              : userRegion === "USA/Western"
                                ? (billingCycle === "monthly" ? "$40" : "$399")
                                : (billingCycle === "monthly" ? "$20" : "$199")
                            }
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
                        onClick={() => {
                          setAccountType("Business");
                          const activePrice = userRegion === "Ghana" 
                            ? (billingCycle === "monthly" ? "GHS 200/mo" : "GHS 1,999/yr")
                            : userRegion === "USA/Western"
                              ? (billingCycle === "monthly" ? "$40/mo" : "$399/yr")
                              : (billingCycle === "monthly" ? "$20/mo" : "$199/yr");
                          triggerToast("Upgraded to Business Elite 💼", `Bulk importer activated, configured with ${activePrice}.`);
                          appendLog(`💳 Transaction: Member plan changed to Business Elite (${activePrice}).`);
                        }}
                        className={`w-full py-1.8 mt-4 rounded-xl text-[10px] font-bold ${accountType === "Business" ? "bg-emerald-600 text-white cursor-default" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"}`}
                      >
                        {accountType === "Business" ? "Active Plan 💼" : "Upgrade Business"}
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
                          Process &amp; Bulk Import Roster ({bulkImportText.split("\n").filter(l => l.trim().length > 0).length} records)
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Column 2: User Settings & Alerts Config (Span 5) */}
                <div className="lg:col-span-12 xl:col-span-5 bg-white rounded-[2rem] border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 uppercase tracking-wide flex items-center gap-2">
                      🛠 flex 🛠️ Personal Credentials &amp; Alerts Settings
                    </h4>
                    <p className="text-xs text-slate-500 font-sans">
                      Inputs are taken during signup or profile sessions and used to customize pre-filled greeting links.
                    </p>
                  </div>

                  {/* Form fields for settings */}
                  <div className="space-y-4 font-sans">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">My Username</label>
                      <input 
                        type="text" 
                        value={snapchatUsername}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSnapchatUsername(val);
                          if (userSession) {
                            const nextSess = { ...userSession, snapchatUsername: val };
                            setUserSession(nextSess);
                            localStorage.setItem("birthday_authenticated_user", JSON.stringify(nextSess));
                          }
                          triggerToast("Settings Update", "Custom username updated.");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:outline-[#818CF8] font-mono text-zinc-850"
                        placeholder="alex_snap"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">My WhatsApp Phone</label>
                      <input 
                        type="text" 
                        value={whatsappNumber}
                        onChange={(e) => {
                          const val = e.target.value;
                          setWhatsappNumber(val);
                          if (userSession) {
                            const nextSess = { ...userSession, whatsappNumber: val };
                            setUserSession(nextSess);
                            localStorage.setItem("birthday_authenticated_user", JSON.stringify(nextSess));
                          }
                          triggerToast("Settings Update", "Custom WhatsApp phone updated.");
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-indigo-100 focus:outline-[#818CF8] font-mono text-zinc-850"
                        placeholder="+233241234567"
                      />
                    </div>

                    {/* Checkbox toggle option alerts */}
                    <div className="pt-2 border-t border-slate-100">
                      <label className="flex items-start gap-3 p-3.5 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-200 transition-all cursor-pointer">
                        <input
                          type="checkbox"
                          checked={enableEmailReminders}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setEnableEmailReminders(val);
                            if (userSession) {
                              const nextSess = { ...userSession, enableEmailReminders: val };
                              setUserSession(nextSess);
                              localStorage.setItem("birthday_authenticated_user", JSON.stringify(nextSess));
                            }
                            triggerToast(
                              val ? "Email Alerts Enabled 📧" : "Email Alerts Disabled 🔇", 
                              val ? "Warnings will simulate sending email reminders 7 days and 1 day prior." : "Alerts will remain strictly sandbox in-app notifications."
                            );
                            appendLog(`⚙️ Config: Email alert warning dispatcher is set to ${val ? "active" : "inactive"}.`);
                          }}
                          className="indigo-checkbox w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mt-0.5 cursor-pointer"
                        />
                        <div>
                          <span className="text-xs font-black text-slate-900 block leading-tight">Enable Simulated Email Reminders</span>
                          <span className="text-[10px] text-slate-500 mt-1 leading-relaxed block">
                            Once enabled, a copy of 7-day warning alerts and 1-day warnings we parse on load will simulate delivery to <strong>{userSession?.email || "thefitfola@gmail.com"}</strong>.
                          </span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Operational Status overview */}
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10.5px] text-slate-550 leading-relaxed font-semibold">
                    💡 <strong>Simulate Warnings:</strong> When you modify settings or register others, the load checker triggers alerts automatically. Open your notification drawer in the top right header navigation bar to inspect active alerting logs.
                  </div>
                </div>

              </div>
            </div>
          )}

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
          {friends.filter(f => f.id !== "alex" && f.connectedBack === false).length > 0 && (
            <span className="absolute top-1 right-3.5 bg-rose-600 text-[8px] px-1 rounded text-white font-mono font-bold scale-75 border border-slate-700/60">
              {friends.filter(f => f.id !== "alex" && f.connectedBack === false).length}
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

    </div>
  );
}
