import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send, MessageSquare, Search, Cake, Gift, Calendar, Sparkles, Check, CheckCheck,
  Phone, Video, MoreVertical, Trash2, Heart, ArrowLeft, ArrowUpRight, Smile, Sparkle, ShoppingBag, CheckCircle2,
  Paperclip, Mic, Plus, Flame, Star, Info, Moon, Sun, AlertCircle, X, Compass, Palette
} from "lucide-react";
import { Friend, WishlistItem } from "../types";

interface ChatPageProps {
  friends: Friend[];
  toggleClaimWishlistItem: (friendId: string, wishId: string) => void;
  triggerToast: (title: string, message: string) => void;
  mobileView: "list" | "detail";
  setMobileView: (view: "list" | "detail") => void;
}

interface ChatMessage {
  id: string;
  sender: "me" | "friend";
  text: string;
  timestamp: string;
  status: "sent" | "delivered" | "read";
}

export const ChatPage: React.FC<ChatPageProps> = ({
  friends,
  toggleClaimWishlistItem,
  triggerToast,
  mobileView,
  setMobileView,
}) => {
  // We want to exclude "Self" (alex) from the chat partners list and only show accepted friends
  const activeChatFriends = friends.filter((f) => f.id !== "alex" && f.connectedBack === true);
  
  const [selectedFriendId, setSelectedFriendId] = useState<string>(() => {
    return activeChatFriends.length > 0 ? activeChatFriends[0].id : "";
  });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeCall, setActiveCall] = useState<{ type: "audio" | "video"; name: string } | null>(null);
  
  // Custom theme wallpaper preferences for the Snapchat/WhatsApp hybrid
  const [chatTheme, setChatTheme] = useState<"whatsapp-dark" | "snapchat-neon" | "bloom-purple">("whatsapp-dark");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Chat Histories store
  const [chats, setChats] = useState<Record<string, ChatMessage[]>>(() => {
    const saved = localStorage.getItem("hbd_chat_histories");
    if (saved) return JSON.parse(saved);

    const nowStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const seed: Record<string, ChatMessage[]> = {};
    
    // Seed Jamie Chen
    seed["jamie"] = [
      {
        id: "msg-j-1",
        sender: "friend",
        text: "Hey! Just updating my birthday list for this year. Realized I need some cozy watercolor gear. 🎨",
        timestamp: "Yesterday",
        status: "read",
      },
      {
        id: "msg-j-2",
        sender: "me",
        text: "Ooh watercolor sounds amazing! I saw that in your interests drawer.",
        timestamp: "Yesterday",
        status: "read",
      },
      {
        id: "msg-j-3",
        sender: "friend",
        text: "Yes! Can't wait for my birthday. Did you check out my wishlist on HBD Loop yet? 🎂✨",
        timestamp: nowStr,
        status: "delivered",
      }
    ];

    // Seed Jordan Lee
    seed["jordan"] = [
      {
        id: "msg-jr-1",
        sender: "friend",
        text: "Yo! Trail running session tomorrow? 🏃‍♂️ Also planning my birthday running target list haha.",
        timestamp: nowStr,
        status: "read",
      }
    ];
    
    return seed;
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const selectedFriend = friends.find((f) => f.id === selectedFriendId) || activeChatFriends[0] || {
    id: "default",
    name: "No buddy selected",
    birthday: "2026-06-03",
    relationship: "Friend",
    age: "0",
    avatar: "bg-[#111b21]",
    wishlist: [],
    achievements: [],
    interests: [],
    phone: "",
    whatsapp: "",
    email: "",
    snapchat: ""
  };

  useEffect(() => {
    localStorage.setItem("hbd_chat_histories", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chats, selectedFriendId, isTyping]);

  // Handle send message
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedFriend) return;

    const userMsgText = messageText.trim();
    const newMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: "me",
      text: userMsgText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "sent"
    };

    setChats((prev) => ({
      ...prev,
      [selectedFriend.id]: [...(prev[selectedFriend.id] || []), newMsg],
    }));

    setMessageText("");
    setShowEmojiPicker(false);
    setIsTyping(true);

    // Simulate double blue checks transitions
    setTimeout(() => {
      setChats(prev => {
        const list = prev[selectedFriend.id] || [];
        return {
          ...prev,
          [selectedFriend.id]: list.map(m => m.id === newMsg.id ? { ...m, status: "delivered" } : m)
        };
      });
    }, 450);

    // Friend Typing and reply
    setTimeout(() => {
      setChats(prev => {
        const list = prev[selectedFriend.id] || [];
        return {
          ...prev,
          [selectedFriend.id]: list.map(m => m.id === newMsg.id ? { ...m, status: "read" } : m)
        };
      });

      const respText = getSimulatedResponse(selectedFriend, userMsgText);
      const friendMsg: ChatMessage = {
        id: `msg-friend-${Date.now()}`,
        sender: "friend",
        text: respText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        status: "read",
      };

      setChats((prev) => ({
        ...prev,
        [selectedFriend.id]: [...(prev[selectedFriend.id] || []), friendMsg],
      }));
      setIsTyping(false);
      
      triggerToast(`Snap from ${selectedFriend.name}`, respText.slice(0, 40) + "...");
    }, 1200 + Math.random() * 800);
  };

  // Helper response generator
  const getSimulatedResponse = (friend: Friend, query: string): string => {
    const text = query.toLowerCase();
    
    if (text.includes("wishlist") || text.includes("wishes") || text.includes("wish") || text.includes("want") || text.includes("gift")) {
      if (friend.wishlist.length > 0) {
        const itemNames = friend.wishlist.map(w => `"${w.title}"`).join(", ");
        return `Ooh! Yes! My wishlist is saved right here on my Bloom profile 💝. I've been eyeing ${itemNames}. Hop on over to the 'Wishes' tab above checking them out!`;
      } else {
        return `Ah, I haven't added specific items to my wishlist yet. I love anything related to ${friend.interests.slice(0, 3).join(", ")} though! Any creative surprise fits my style perfectly! 😊`;
      }
    }

    if (text.includes("birthday") || text.includes("party") || text.includes("celebrate")) {
      const bday = new Date(friend.birthday).toLocaleDateString("en-US", { month: "long", day: "numeric" });
      return `My birthday is on ${bday}! Let's definitely do some cozy get-together! We should snap back and forth about plans. 🎉`;
    }

    for (const interest of friend.interests) {
      if (text.includes(interest.toLowerCase().split(" ")[0])) {
        if (interest.includes("Paint") || interest.includes("Water")) {
          return "Yes! Watercolor and painting portraits is my absolute passion! 🎨 It keeps me super grounded. Would love something artistic!";
        }
        if (interest.includes("Matcha") || interest.includes("Coffee")) {
          return "Ahhh matcha is life! 🍵 Cozying up in a quiet specialty café is my happy state. Let's do a café date soon!";
        }
        if (interest.includes("Running") || interest.includes("Hiking")) {
          return "Haha totally! Mountain trail vibes are unreal. 🏃‍♂️💨 Wish list map tracking is my goal for this year!";
        }
        return `Omg yes, I am absolutely obsessed with ${interest}! One of my main daily vibes. State of the art! ✨`;
      }
    }

    if (friend.relationship.includes("Best")) {
      return `Aww, you're the best! Let's chat about doing something legendary for my birthday. 🥳`;
    }

    return `Love that energy! Let's celebrate soon. 🎂🎈`;
  };

  const quickPrompts = [
    "Hey! Coordinate a time to get together? 🥳",
    "What are you up to this weekend? ✨",
    "Have any birthday plans yet? 🎂"
  ];

  const clearChatHistory = (friendId: string) => {
    setChats(prev => ({
      ...prev,
      [friendId] : []
    }));
    triggerToast("Chat cleared 🧼", "Your chat history has been cleared.");
  };

  const triggerMockCall = (type: "audio" | "video") => {
    if (!selectedFriend) return;
    setActiveCall({ type, name: selectedFriend.name });
    triggerToast(`Calling ${selectedFriend.name}`, `Initiating high-fidelity ${type} call...`);
  };

  const filteredFriends = activeChatFriends.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.relationship.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const emojiList = ["👍", "❤️", "🔥", "😂", "🎂", "🎉", "🎁", "🎨", "🍵", "🏃‍♂️", "✨", "🙌", "🤩", "👑", "👀"];

  return (
    <div className={`w-full flex flex-col md:flex-row bg-[#0c1317] overflow-hidden relative fixed md:relative left-0 right-0 top-0 z-[45] font-sans md:z-auto ${mobileView === "list" ? "bottom-16" : "bottom-0"} md:h-[calc(100vh-140px)] md:min-h-[650px] md:border md:border-slate-800 md:rounded-3xl md:shadow-2xl md:bottom-auto`} id="chat-workspace-root">
      
      {/* FULL SCREEN MOCK CALL SCREEN OVERLAY */}
      <AnimatePresence>
        {activeCall && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 z-50 bg-[#121b22]/95 backdrop-blur-md flex flex-col justify-between p-8 text-center text-white"
          >
            <div className="pt-12 space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-rose-400 mx-auto flex items-center justify-center text-4xl font-extrabold animate-pulse shadow-2xl ring-4 ring-indigo-500/30">
                {activeCall.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
              </div>
              <h2 className="text-xl font-black tracking-tight">{activeCall.name}</h2>
              <div className="flex items-center justify-center gap-1.5 text-emerald-400 font-mono text-xs font-bold animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Ringing dynamically via BloomNet...</span>
              </div>
            </div>

            {activeCall.type === "video" && (
              <div className="max-w-xs mx-auto border border-slate-800 rounded-3xl overflow-hidden shadow-xl aspect-video bg-slate-900 flex items-center justify-center relative">
                <p className="text-[10px] font-mono text-slate-500">Camera preview enabled</p>
                <div className="absolute bottom-2 right-2 w-16 h-10 bg-slate-950 rounded border border-slate-800" />
              </div>
            )}

            <div className="pb-12 space-y-6">
              <p className="text-slate-450 text-[11px] max-w-xs mx-auto leading-relaxed">
                Connect and coordinate wishlist gifts with high-fidelity sound cues!
              </p>
              <div className="flex justify-center gap-6">
                <button
                  type="button"
                  onClick={() => setActiveCall(null)}
                  className="bg-rose-500 hover:bg-rose-600 font-mono text-white text-xs font-black px-6 py-4 rounded-full flex items-center gap-2 shadow-2xl transition-all hover:scale-105 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>Decline / Hang up</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT FRIEND SELECTOR COLUMN */}
      <div className={`w-full md:w-80 lg:w-[340px] shrink-0 border-r border-[#222e35] bg-[#111b21] flex flex-col h-full ${
        mobileView === "list" ? "flex" : "hidden md:flex"
      }`} id="chat-sidebar">
        
        {/* Chats Header */}
        <div className="p-3 bg-gradient-to-r from-indigo-950 to-[#121b22] border-b border-[#222e35] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200">Chats</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Theme picker trigger */}
            <button
              onClick={() => {
                const next: Record<string, "whatsapp-dark" | "snapchat-neon" | "bloom-purple"> = {
                  "whatsapp-dark": "snapchat-neon",
                  "snapchat-neon": "bloom-purple",
                  "bloom-purple": "whatsapp-dark"
                };
                setChatTheme(next[chatTheme]);
                triggerToast("Wallpaper Switched", `Now styling chats using ${next[chatTheme]} aesthetic.`);
              }}
              className="p-1 px-2.5 rounded bg-slate-905 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-350 flex items-center gap-1 cursor-pointer transition-all shrink-0"
              title="Switch Chat UI Template Theme"
            >
              <Palette className="w-3 h-3 text-indigo-400" />
              <span className="hidden xs:inline uppercase">{chatTheme.split("-")[0]}</span>
            </button>
          </div>
        </div>

        {/* Search header without extra filters */}
        <div className="p-3 border-b border-[#222e35]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search chat lockers or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#202c33] border-none text-[11px] rounded-xl pl-9 pr-4 py-2.5 outline-none focus:ring-1 focus:ring-indigo-500 text-slate-250 placeholder-slate-450"
            />
          </div>
        </div>

        {/* Friends WhatsApp-style selection list */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#222e35]" id="chat-buddy-list">
          {filteredFriends.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <Smile className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="text-[11px] text-slate-500 font-bold">No active chat partners</p>
            </div>
          ) : (
            filteredFriends.map((f) => {
              const lastMsgs = chats[f.id] || [];
              const lastMsg = lastMsgs[lastMsgs.length - 1];
              const isSelected = f.id === selectedFriendId;
              
              return (
                <button
                  key={f.id}
                  onClick={() => {
                    setSelectedFriendId(f.id);
                    setMobileView("detail");
                  }}
                  className={`w-full p-3 flex items-center gap-3 transition-all text-left relative cursor-pointer group ${
                    isSelected
                      ? "bg-[#2a3942]/60"
                      : "hover:bg-[#202c33]/30"
                  }`}
                >
                  {/* WhatsApp/Snapchat Avatar with Status indicators */}
                  <div className="relative shrink-0 select-none">
                    <div className={`w-11 h-11 rounded-full ${f.avatar} flex items-center justify-center text-white font-extrabold text-sm shadow-md ring-2 ring-slate-900/30`}>
                      {f.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    {/* Ring wrapper for online */}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-[#111b21] flex items-center justify-center" />
                  </div>

                  {/* Text details */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-100 truncate">
                        {f.name}
                      </span>
                      <span className="text-[9px] text-[#8696a0] font-mono">
                        {lastMsg ? lastMsg.timestamp : "Online"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[11px]">
                      <div className="flex items-center gap-1 truncate text-slate-400">
                        {/* Status Checkmark icon like WhatsApp */}
                        {lastMsg && lastMsg.sender === "me" && (
                          <span className="shrink-0">
                            {lastMsg.status === "read" ? (
                              <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                            ) : lastMsg.status === "delivered" ? (
                              <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                            ) : (
                              <Check className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </span>
                        )}
                        <p className="truncate text-[10.5px]">
                          {lastMsg ? lastMsg.text : `${f.relationship} • Birthday ${f.birthday}`}
                        </p>
                      </div>

                      {/* Snap/Streak indicator */}
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        {isSelected && (
                          <span className="w-2 h-2 bg-[#00a884] rounded-full" />
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT CONVERSATION & WISHES WORKSPACE */}
      <div className={`flex-1 bg-[#0b141a] flex flex-col h-full ${
        mobileView === "detail" ? "flex" : "hidden md:flex"
      }`} id="chat-conversation-area">
        {selectedFriend ? (
          <>
            {/* WHATSAPP WEB STYLE ACTIVE FRIEND HEADER */}
            <div className="p-3 bg-[#202c33] border-b border-[#222e35] flex justify-between items-center shadow-lg relative z-20">
              
              <div className="flex items-center gap-3 min-w-0">
                {/* Back button on Mobile */}
                <button
                  type="button"
                  onClick={() => setMobileView("list")}
                  className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer mr-0.5 shrink-0"
                  title="Back to companion list"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                
                <div className={`w-10 h-10 rounded-full ${selectedFriend.avatar} flex items-center justify-center text-white font-extrabold text-sm shrink-0 shadow`}>
                  {selectedFriend.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </div>
                
                <div className="text-left min-w-0">
                  <h4 className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
                    <span className="truncate max-w-[140px] xs:max-w-none">{selectedFriend.name}</span>
                    <span className="bg-slate-900 border border-slate-800 text-[8px] px-1.5 py-0.5 rounded-full text-indigo-400 font-bold shrink-0">
                      {selectedFriend.relationship}
                    </span>
                  </h4>
                  <p className="text-[9.5px] text-[#00a884] font-bold leading-none mt-1 animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span>{isTyping ? "Typing..." : "online"}</span>
                  </p>
                </div>
              </div>

              {/* High-fidelity call action tray */}
              <div className="flex items-center gap-3">
                
                {/* CALL BUTTONS */}
                <div className="hidden xs:flex items-center gap-1">
                  <button
                    onClick={() => triggerMockCall("audio")}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
                    title="Start Voice Call"
                  >
                    <Phone className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => triggerMockCall("video")}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-all cursor-pointer"
                    title="Start Video Call"
                  >
                    <Video className="w-4 h-4" />
                  </button>
                </div>
                
              </div>
            </div>

            {/* CHAT CONVERSATION */}
            <div 
              className={`flex-1 flex flex-col justify-between overflow-hidden min-h-0 relative ${
                chatTheme === "whatsapp-dark" 
                  ? "bg-[#0b141a] bg-opacity-[0.98]" 
                  : chatTheme === "snapchat-neon" 
                  ? "bg-gradient-to-b from-[#120a21] via-slate-950 to-[#2c0b2b]"
                  : "bg-[#180f2d]"
              }`} 
              id="chat-messages-container"
            >
              
              {/* Whatsapp doodle theme graphic overlay effect */}
              {chatTheme === "whatsapp-dark" && (
                <div className="absolute inset-0 opacity-[0.025] pointer-events-none mix-blend-color-dodge bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=500&q=60')" }} />
              )}

              {/* Messages Viewport Panel */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10" id="whatsapp-bubbles-hull">
                {(chats[selectedFriend.id] || []).length === 0 ? (
                  <div className="text-center py-16 px-6 max-w-xs mx-auto space-y-3 bg-[#111b21]/70 rounded-3xl border border-slate-800/50 mt-10 shadow-xl">
                    <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <MessageSquare className="w-5 h-5 text-indigo-400 animate-pulse" />
                    </div>
                    <h5 className="font-bold text-xs text-slate-100 uppercase tracking-wider">Start a Chat</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Say hello to {selectedFriend.name.split(" ")[0]}! Exchanging friendly messages is a great way to stay connected.
                    </p>
                  </div>
                ) : (
                    (chats[selectedFriend.id] || []).map((msg) => {
                      const isMe = msg.sender === "me";
                      return (
                        <div
                          key={msg.id}
                          className={`flex max-w-[85%] md:max-w-[70%] group/bubble transition-all ${
                            isMe ? "ml-auto justify-end" : "mr-auto justify-start"
                          }`}
                        >
                          <div className={`p-3 rounded-2xl relative shadow-md text-left flex flex-col ${
                            isMe 
                              ? "bg-[#005c4b] text-[#e9edef] rounded-tr-none border-t border-[#00705a]/60" 
                              : "bg-[#202c33] text-[#e9edef] rounded-tl-none border-t border-[#2d3b45]/60"
                          }`}>
                            
                            {/* Snapchat Friend name watermark for group chat style */}
                            {!isMe && (
                              <span className="text-[8.5px] font-black text-rose-300 block mb-0.5 tracking-tight uppercase">
                                {selectedFriend.name.split(" ")[0]}
                              </span>
                            )}

                            {/* Main payload text */}
                            <p className="text-xs font-medium leading-relaxed whitespace-pre-wrap select-text pr-2 py-0.5">
                              {msg.text}
                            </p>

                            {/* Timestamp / Read receipt element inline like WhatsApp wrapper */}
                            <div className="flex items-center justify-end gap-1 mt-1 text-[8.5px] text-slate-400 self-end select-none font-mono">
                              <span>{msg.timestamp}</span>
                              {isMe && (
                                <span className="shrink-0">
                                  {msg.status === "read" ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                                  ) : msg.status === "delivered" ? (
                                    <CheckCheck className="w-3.5 h-3.5 text-slate-450" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5 text-slate-450" />
                                  )}
                                </span>
                              )}
                            </div>

                          </div>
                        </div>
                      );
                    })
                  )}

                  {/* Typing Bubble */}
                  {isTyping && (
                    <div className="flex items-center gap-1 text-slate-500 text-xs font-semibold max-w-[80%]">
                      <div className="bg-[#202c33] border border-[#2d3b45]/40 px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1 shadow">
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-100" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-200" />
                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-300" />
                        <span className="text-[9.5px] font-mono text-slate-400 ml-1.5 font-bold uppercase tracking-wider">{selectedFriend.name.split(" ")[0]} is typing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* EMOJI FAST ACCESS BAR OVERLAY */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-16 left-4 right-4 bg-[#1f2c34] border border-[#2d3d46] rounded-2xl p-3 z-30 shadow-2xl space-y-2 text-left"
                    >
                      <div className="flex justify-between items-center px-1">
                        <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Fast Snapchat Emojis drawer</span>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-slate-400 hover:text-white"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="grid grid-cols-8 gap-2">
                        {emojiList.map((emo) => (
                          <button
                            key={emo}
                            type="button"
                            onClick={() => {
                              setMessageText(prev => prev + emo);
                            }}
                            className="p-1 px-1.5 rounded-xl hover:bg-slate-800 text-base transition-all active:scale-125 cursor-pointer text-center"
                          >
                            {emo}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Bottom WhatsApp bar */}
                <div className="p-3 bg-[#1f2c34] border-t border-[#222e35] space-y-3.5 relative z-10 select-none">
                  
                  {/* Quick companion suggestions */}
                  <div className="flex flex-wrap gap-1.5 items-center">
                    <span className="text-[8.5px] font-black uppercase text-indigo-400 tracking-wider font-mono mr-1 shrink-0">Suggestions:</span>
                    <div className="flex gap-1.5 flex-wrap flex-1 max-h-[80px] overflow-y-auto pr-2">
                      {quickPrompts.map((p) => (
                        <button
                          key={p}
                          onClick={() => {
                            if (p.includes(" streaks")) {
                              setMessageText("🔥 Sent a dynamic streaks snap pack! Let's check our registry rank!");
                            } else {
                              setMessageText(p);
                            }
                          }}
                          className="bg-[#111b21] hover:bg-[#202c33] text-[#8696a0] hover:text-white border border-[#2f3d47] text-[9.5px] font-bold px-2.5 py-1 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => clearChatHistory(selectedFriend.id)}
                      title="Clear snap drawer history"
                      className="ml-auto text-slate-500 hover:text-rose-400 p-1 bg-slate-900/40 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* WhatsApp/Snapchat Input Form Drawer */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
                    
                    <div className="flex-1 flex items-center bg-[#2a3942] rounded-2xl px-3 border border-[#2f3d47]/80 group">
                      
                      {/* Emoji smile switch */}
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className="p-1 text-slate-400 hover:text-[#00a884] transition-all cursor-pointer mr-1.5 shrink-0"
                        title="Pick dynamic emojis"
                      >
                        <Smile className="w-5 h-5" />
                      </button>

                      {/* Attachment Clip icon */}
                      <button
                        type="button"
                        onClick={() => {
                          triggerToast("Media attachments disabled 📎", "HBD Loop restricts custom attachments to verified registry links.");
                        }}
                        className="p-1 text-slate-400 hover:text-indigo-400 transition-all cursor-pointer mr-1.5 shrink-0"
                        title="Upload media snap"
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {/* Real text input */}
                      <input
                        type="text"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder={`Snap or chat message ${selectedFriend.name.split(" ")[0]}...`}
                        className="flex-1 bg-transparent border-none text-xs py-3.5 outline-none text-white placeholder-slate-400 focus:ring-0"
                      />

                    </div>

                    {/* Microphone voice note or real Send Button */}
                    {messageText.trim() ? (
                      <button
                        type="submit"
                        className="w-11 h-11 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#009675] shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                      >
                        <Send className="w-4.5 h-4.5" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          triggerToast("Voice recording locked 🎙️", "Bloom voice note sync requires the premium companion package.");
                        }}
                        className="w-11 h-11 rounded-full bg-[#2a3942] text-slate-300 flex items-center justify-center hover:bg-[#202c33] transition-all active:scale-95 shrink-0 cursor-pointer"
                        title="Record Snapchat style audio log"
                      >
                        <Mic className="w-4.5 h-4.5 text-indigo-400" />
                      </button>
                    )}

                  </form>
                </div>
              </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-center space-y-3 bg-[#0b141a]">
            <MessageSquare className="w-12 h-12 text-slate-700 animate-pulse" />
            <h5 className="font-extrabold text-sm text-slate-400 uppercase tracking-widest">Select a Chat companion</h5>
            <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
              No chat companion selected. Click any synced companion on the left sidebar list to exchange messages and coordinate wishes!
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
