import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift, Share2 } from "lucide-react";
import { WishlistFeedItem } from "../types";

interface WishlistFeedProps {
  wishlistFeedItems: WishlistFeedItem[];
  setWishlistFeedItems: React.Dispatch<React.SetStateAction<WishlistFeedItem[]>>;
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  getFormattedPrice: (usdAmount: number) => string;
  appendLog: (message: string) => void;
  triggerToast: (title: string, message: string) => void;
  onAddWishlist: () => void;
}

export const WishlistFeed: React.FC<WishlistFeedProps> = ({
  wishlistFeedItems,
  setWishlistFeedItems,
  walletBalance,
  setWalletBalance,
  getFormattedPrice,
  appendLog,
  triggerToast,
  onAddWishlist,
}) => {
  const [activeContributingItem, setActiveContributingItem] = useState<WishlistFeedItem | null>(null);

  return (
    <div className="space-y-4 max-w-xl mx-auto font-sans" id="wishlist-feed-root">
      {/* Feed Header */}
      <div className="bg-white rounded-3xl border border-slate-100 p-4 text-left shadow-premium">
        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-0.5">What your friends want</h3>
        <p className="text-[11px] text-slate-400 mt-0.5 leading-normal font-medium">Chip in toward your friends' wishlists</p>
      </div>

      {/* Feed Stream or Empty State */}
      {wishlistFeedItems.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-6 text-center shadow-premium">
          <span className="text-2xl block mb-2" role="img" aria-label="gift">🎁</span>
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Nothing here yet</h4>
          <p className="text-[11px] text-slate-400 mt-1 leading-normal font-medium">When your friends add to their wishlists, you'll see them here.</p>
          <button
            type="button"
            onClick={onAddWishlist}
            className="h-8 px-4 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 mt-3.5 inline-flex items-center justify-center hover:bg-slate-50 transition active:scale-[0.98] cursor-pointer"
          >
            Add to my wishlist →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {wishlistFeedItems.map((item) => {
            const percent = Math.min(100, Math.round((item.raised / item.price) * 100));
            const isCompleted = item.raised >= item.price;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-100 p-4 text-left space-y-3.5 relative overflow-hidden shadow-premium"
                id={`wish-feed-card-${item.id}`}
              >
                {/* Success completed ribbon */}
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] font-bold uppercase px-2.5 py-1 rounded-bl-xl shadow-sm">
                    Funded!
                  </div>
                )}

                {/* Card Header: micro avatar + name + timestamp */}
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <div className={`w-6 h-6 rounded-lg ${item.userAvatar || "bg-indigo-500"} text-white flex items-center justify-center font-bold text-[9px] shrink-0 shadow-sm`}>
                      {(item.userName || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <span className="font-bold text-slate-700 text-xs truncate">{item.userName}</span>
                  </div>
                  <span className="shrink-0 font-mono text-[9px] font-semibold text-slate-400">1h ago</span>
                </div>

                {/* Wish Details */}
                <div>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">{item.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5 font-medium">{item.description}</p>
                </div>

                {/* Funding Progress: ultra-clean minimalist progress line */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full transition-all duration-500 rounded-full ${isCompleted ? "bg-emerald-500" : "bg-gradient-to-r from-indigo-500 to-purple-500"}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center pl-0.5">
                      {item.contributors.slice(0, 3).map((c, idx) => (
                        <div
                          key={idx}
                          className={`w-4.5 h-4.5 rounded-full bg-indigo-100 border border-white text-indigo-600 flex items-center justify-center text-[7px] font-bold ${idx > 0 ? "-ml-1.5" : ""}`}
                        >
                          {c[0]?.toUpperCase()}
                        </div>
                      ))}
                      {item.contributors.length > 0 && (
                        <span className="ml-1.5 text-[10px] text-slate-400 font-medium">
                          {percent}% funded
                        </span>
                      )}
                      {item.contributors.length === 0 && <span className="font-medium">{percent}% funded</span>}
                    </div>
                    <span className="font-bold text-slate-500 font-mono">
                      GHS {item.raised * 12} / {item.price * 12}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-0.5">
                  {isCompleted ? (
                    <div className="w-full py-2 bg-emerald-50/50 text-emerald-700 text-xs font-bold rounded-xl text-center border border-emerald-100/50">
                      Fully funded
                    </div>
                  ) : activeContributingItem?.id === item.id ? (
                    <div className="bg-slate-50/40 p-3 rounded-2xl border border-slate-50 space-y-2.5">
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-slate-500 uppercase tracking-wider pl-0.5">Select amount (GHS)</span>
                        <button
                          type="button"
                          onClick={() => setActiveContributingItem(null)}
                          className="text-slate-400 hover:text-slate-600 cursor-pointer font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[5, 10, 25, 50].map((preset) => {
                          const presetsInGhs = preset * 12;
                          const hasEnough = walletBalance >= presetsInGhs;
                          return (
                            <button
                              key={`preset-${preset}`}
                              type="button"
                              disabled={!hasEnough}
                              onClick={() => {
                                setWalletBalance((prev) => Math.max(0, prev - presetsInGhs));
                                setWishlistFeedItems((prev) =>
                                  prev.map((p) => {
                                    if (p.id === item.id) {
                                      const updatedContributors = p.contributors.includes("You")
                                        ? p.contributors
                                        : ["You", ...p.contributors];
                                      return {
                                        ...p,
                                        raised: p.raised + preset,
                                        contributors: updatedContributors,
                                        totalContributors: p.contributors.includes("You")
                                          ? p.totalContributors
                                          : p.totalContributors + 1,
                                      };
                                    }
                                    return p;
                                  })
                                );
                                appendLog(`Contributed GHS ${presetsInGhs} to ${item.userName}'s wish "${item.title}".`);
                                triggerToast("Thank You! 🎁", `You chipped in GHS ${presetsInGhs} to ${item.userName}'s wishlist!`);
                                setActiveContributingItem(null);
                              }}
                              className={`h-7 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                                hasEnough
                                  ? "bg-white border-slate-150 hover:bg-slate-50 text-slate-800 shadow-sm active:scale-[0.95]"
                                  : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed opacity-50"
                              }`}
                            >
                              +{presetsInGhs}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveContributingItem(item)}
                        className="h-8 px-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:brightness-105 text-white text-xs font-bold rounded-xl cursor-pointer transition active:scale-[0.98] shadow-sm"
                      >
                        Contribute
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: item.title, text: `Check out ${item.userName}'s wish!` }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(`Check out ${item.userName}'s wish: ${item.title}`);
                            triggerToast("Link copied", "Wishlist link copied to clipboard");
                          }
                        }}
                        className="h-8 px-3.5 text-slate-500 hover:text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition flex items-center justify-center gap-1 hover:bg-slate-50"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Share</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
