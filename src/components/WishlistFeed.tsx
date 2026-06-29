import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Gift } from "lucide-react";
import { WishlistFeedItem } from "../types";

interface WishlistFeedProps {
  wishlistFeedItems: WishlistFeedItem[];
  setWishlistFeedItems: React.Dispatch<React.SetStateAction<WishlistFeedItem[]>>;
  walletBalance: number;
  setWalletBalance: React.Dispatch<React.SetStateAction<number>>;
  getFormattedPrice: (usdAmount: number) => string;
  appendLog: (message: string) => void;
  triggerToast: (title: string, message: string) => void;
}

export const WishlistFeed: React.FC<WishlistFeedProps> = ({
  wishlistFeedItems,
  setWishlistFeedItems,
  walletBalance,
  setWalletBalance,
  getFormattedPrice,
  appendLog,
  triggerToast,
}) => {
  const [activeContributingItem, setActiveContributingItem] = useState<WishlistFeedItem | null>(null);

  return (
    <div className="space-y-4 max-w-xl mx-auto" id="wishlist-feed-root">
      {/* Feed Header */}
      <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 text-left">
        <h3 className="text-[15px] font-semibold text-slate-900">What your friends want</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Chip in toward your friends' wishlists</p>
      </div>

      {/* Feed Stream or Empty State */}
      {wishlistFeedItems.length === 0 ? (
        <div className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 text-center">
          <span className="text-[32px] block mb-2" role="img" aria-label="gift">🎁</span>
          <h4 className="text-[15px] font-semibold text-slate-900">Nothing here yet</h4>
          <p className="text-[12px] text-slate-400 mt-1">When your friends add to their wishlists, you'll see them here.</p>
          <button
            type="button"
            onClick={onAddWishlist}
            className="h-9 px-4 border border-slate-300 rounded-lg text-[13px] font-semibold text-slate-700 mt-4 inline-flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Add to my wishlist →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {wishlistFeedItems.map((item) => {
            const percent = Math.min(100, Math.round((item.raised / item.price) * 100));
            const isCompleted = item.raised >= item.price;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-3 text-left space-y-3 relative overflow-hidden"
                id={`wish-feed-card-${item.id}`}
              >
                {/* Success completed ribbon */}
                {isCompleted && (
                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded-bl-lg">
                    Funded!
                  </div>
                )}

                {/* Card Header: 28px avatar + name + timestamp */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-2 truncate">
                    <div className={`w-7 h-7 rounded-full ${item.userAvatar || "bg-indigo-600"} text-white flex items-center justify-center font-semibold text-[10px] shrink-0`}>
                      {(item.userName || "U").split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                    </div>
                    <span className="font-semibold text-slate-700 text-[13px] truncate">{item.userName}</span>
                  </div>
                  <span className="shrink-0">1h ago</span>
                </div>

                {/* Wish Details */}
                <div>
                  <h4 className="text-[15px] font-semibold text-slate-900 line-clamp-2 leading-snug">{item.title}</h4>
                  <p className="text-[12px] text-slate-500 truncate mt-0.5">{item.description}</p>
                </div>

                {/* Funding Progress */}
                <div className="space-y-1.5">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percent}%` }}
                      className={`h-full transition-all duration-500 ${isCompleted ? "bg-emerald-500" : "bg-indigo-600"}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center pl-1">
                      {item.contributors.slice(0, 3).map((c, idx) => (
                        <div
                          key={idx}
                          className={`w-5 h-5 rounded-full bg-slate-400 border border-white text-white flex items-center justify-center text-[8px] font-semibold ${idx > 0 ? "-ml-1.5" : ""}`}
                        >
                          {c[0]?.toUpperCase()}
                        </div>
                      ))}
                      {item.contributors.length > 0 && (
                        <span className="ml-2 text-[11px] text-slate-400">
                          +{item.contributors.length} · {percent}% funded
                        </span>
                      )}
                      {item.contributors.length === 0 && <span>{percent}% funded</span>}
                    </div>
                    <span className="font-semibold text-slate-700">
                      GHS {item.raised * 12} of {item.price * 12}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-1">
                  {isCompleted ? (
                    <div className="w-full py-2 bg-emerald-50 text-emerald-800 text-[13px] font-semibold rounded-lg text-center">
                      Fully funded
                    </div>
                  ) : activeContributingItem?.id === item.id ? (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="font-semibold text-slate-700">Select amount (GHS)</span>
                        <button
                          type="button"
                          onClick={() => setActiveContributingItem(null)}
                          className="text-slate-400 hover:text-slate-700 cursor-pointer"
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
                              className={`h-8 rounded-lg border text-[12px] font-semibold transition-all cursor-pointer ${
                                hasEnough
                                  ? "bg-white border-slate-300 hover:bg-slate-50 text-slate-800"
                                  : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60"
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
                        className="h-8 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-[12px] font-semibold rounded-lg cursor-pointer transition-colors"
                      >
                        Contribute
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({ title: item.title, text: `Check out ${item.userName}'s wish!` }).catch(() => {});
                          } else {
                            triggerToast("Link copied", "Wishlist link copied to clipboard");
                          }
                        }}
                        className="h-8 px-2 text-slate-500 hover:text-slate-800 text-[12px] font-semibold rounded-lg cursor-pointer transition-colors"
                      >
                        Share
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
