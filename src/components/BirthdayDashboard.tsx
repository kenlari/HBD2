import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Cake, Gift, MessageCircle, ChevronRight, CreditCard, Sparkles, Check, DollarSign, X, ShieldCheck } from "lucide-react";
import { Friend } from "../types";

interface BirthdayDashboardProps {
  friends: Friend[];
  userName: string;
  onViewFriend: (friendId: string) => void;
  onOpenGiftAI: (friendId: string) => void;
}

function daysUntil(birthdayStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bDate = new Date(birthdayStr);
  let next = new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate());
  if (next < today) next.setFullYear(today.getFullYear() + 1);
  return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(birthdayStr: string): string {
  const d = new Date(birthdayStr);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}

function getDaysLabel(days: number): string {
  if (days === 0) return "🎂 Today";
  if (days === 1) return "Tomorrow";
  return `${days} Days Left`;
}

export function BirthdayDashboard({ friends, userName, onViewFriend, onOpenGiftAI }: BirthdayDashboardProps) {
  const sorted = [...friends]
    .filter((f) => f.id !== "alex")
    .sort((a, b) => daysUntil(a.birthday) - daysUntil(b.birthday));

  const todayBirthdays = sorted.filter((f) => daysUntil(f.birthday) === 0);
  const soonBirthdays = sorted.filter((f) => { const d = daysUntil(f.birthday); return d > 0 && d <= 30; });
  const laterBirthdays = sorted.filter((f) => daysUntil(f.birthday) > 30);
  const firstName = userName.split(" ")[0];

  // Paystack Billing/Contribution Simulation States
  const [contributeTarget, setContributeTarget] = React.useState<Friend | null>(null);
  const [contribAmount, setContribAmount] = React.useState<string>("50");
  const [customAmount, setCustomAmount] = React.useState<string>("");
  const [contribMethod, setContribMethod] = React.useState<string>("Mobile Money");
  const [paystackChecking, setPaystackChecking] = React.useState<boolean>(false);
  const [paystackSuccess, setPaystackSuccess] = React.useState<boolean>(false);
  const [activityMessage, setActivityMessage] = React.useState<string | null>(null);

  const triggerPaystackGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeTarget) return;

    setPaystackChecking(true);
    // Simulate real Paystack overlay delay
    setTimeout(() => {
      setPaystackChecking(false);
      setPaystackSuccess(true);
      const finalAmount = customAmount ? `GHS ${customAmount}` : `GHS ${contribAmount}`;
      
      const successMsg = `Successfully sent contribution of ${finalAmount} to ${contributeTarget.name}'s Birthday Pool via automated Paystack gateway! 💳`;
      setActivityMessage(successMsg);
      
      // Store pool contribution in localStorage
      const savedContribs = JSON.parse(localStorage.getItem("hbd_pool_contributions") || "[]");
      savedContribs.push({
        id: `pool-${Date.now()}`,
        friendId: contributeTarget.id,
        friendName: contributeTarget.name,
        amount: finalAmount,
        method: contribMethod,
        date: new Date().toISOString()
      });
      localStorage.setItem("hbd_pool_contributions", JSON.stringify(savedContribs));

      // Append contribution activities to simulator logs
      const currentLogs = JSON.parse(localStorage.getItem("birthday_log_dashboard") || "[]");
      currentLogs.unshift(`[${new Date().toLocaleTimeString()}] Secure Contribution: Received ${finalAmount} via Paystack for ${contributeTarget.name}'s milestone.`);
      localStorage.setItem("birthday_log_dashboard", JSON.stringify(currentLogs));
    }, 2400);
  };

  const closePaystackPortal = () => {
    setContributeTarget(null);
    setPaystackSuccess(false);
    setPaystackChecking(false);
    setCustomAmount("");
    setContribAmount("50");
    setActivityMessage(null);
  };

  return (
    <div className="space-y-6">

      {/* Welcome Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-[#FF4D00]/10 blur-xl pointer-events-none" />
        <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-[#7C3AED]/10 blur-xl pointer-events-none" />

        <div className="flex items-center gap-4 text-left relative z-10">
          <div className="w-12 h-12 bg-gradient-to-tr from-[#FF4D00] to-[#7C3AED] rounded-2xl flex items-center justify-center text-white font-extrabold text-base shrink-0 shadow-lg">
            {firstName ? firstName[0].toUpperCase() : "U"}
          </div>
          <div>
            <h2 className="font-extrabold text-slate-100 text-base leading-tight">Hey {firstName}! Welcome to HBD Loop 👋</h2>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {sorted.length === 0 
                ? "Add friends to start tracking recurring milestones & secure gift contributions." 
                : `${sorted.length} Active milestone pipelines connected & monitored.`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6 relative z-10">
          {[
            { label: "Milestones Tracked", value: sorted.length, grad: "from-[#FF4D00]/10 to-[#FF4D00]/20 text-[#FF4D00]" },
            { label: "Today Active", value: todayBirthdays.length, grad: "from-amber-500/10 to-amber-500/20 text-amber-400" },
            { label: "Pipeline (30d)", value: soonBirthdays.length, grad: "from-[#7C3AED]/10 to-[#7C3AED]/20 text-[#C4B5FD]" },
          ].map((s) => (
            <div key={s.label} className={`bg-gradient-to-br ${s.grad} border border-white/5 rounded-2xl p-4 text-center shadow-inner`}>
              <div className="text-3xl font-black">{s.value}</div>
              <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Today */}
      {todayBirthdays.length > 0 && (
        <Section label="Today's Gifting Milestones 🎉" dot="bg-[#FF4D00]">
          {todayBirthdays.map((f, i) => (
            <Card key={f.id} friend={f} days={0} index={i} onViewFriend={onViewFriend} onOpenContrib={setContributeTarget} />
          ))}
        </Section>
      )}

      {/* Coming soon */}
      {soonBirthdays.length > 0 && (
        <Section label="Upcoming Cycles" dot="bg-[#7C3AED]">
          {soonBirthdays.map((f, i) => (
            <Card key={f.id} friend={f} days={daysUntil(f.birthday)} index={i} onViewFriend={onViewFriend} onOpenContrib={setContributeTarget} />
          ))}
        </Section>
      )}

      {/* Later */}
      {laterBirthdays.length > 0 && (
        <Section label="Later Active Pipelines" dot="bg-slate-700">
          {laterBirthdays.map((f, i) => (
            <Card key={f.id} friend={f} days={daysUntil(f.birthday)} index={i} onViewFriend={onViewFriend} onOpenContrib={setContributeTarget} />
          ))}
        </Section>
      )}

      {/* Empty */}
      {sorted.length === 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl text-center py-20 px-6 space-y-4">
          <div className="w-14 h-14 bg-gradient-to-tr from-[#FF4D00]/10 to-[#7C3AED]/10 border border-white/5 rounded-2xl flex items-center justify-center mx-auto">
            <Cake className="w-6 h-6 text-slate-500 animate-pulse" />
          </div>
          <p className="text-sm font-extrabold text-slate-200">No milestone pipelines active</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Use the Buddies directory panel to add contacts and establish automatic loop monitors!
          </p>
        </div>
      )}

      {/* PAYSTACK CONTRIBUTION GATEWAY MODAL OVERLAY */}
      <AnimatePresence>
        {contributeTarget && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 text-slate-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
              <div className="absolute -right-12 -top-12 w-44 h-44 rounded-full bg-[#FF4D00]/10 blur-2xl pointer-events-none" />
              <div className="absolute -left-12 -bottom-12 w-44 h-44 rounded-full bg-[#7C3AED]/10 blur-2xl pointer-events-none" />

              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-emerald-500/15 text-emerald-400 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-500/20">
                      <ShieldCheck className="w-3 h-3" /> Secure Paystack Gateway
                    </span>
                  </div>
                  <h3 className="text-xl font-black mt-2 text-white">Gift Pool Contribution</h3>
                  <p className="text-xs text-slate-400 mt-1">Beneficiary: <span className="font-bold text-[#FF4D00]">{contributeTarget.name}</span></p>
                </div>
                <button
                  onClick={closePaystackPortal}
                  className="p-2 bg-slate-800 hover:bg-slate-700/80 text-slate-405 hover:text-white rounded-xl transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {!paystackSuccess ? (
                <form onSubmit={triggerPaystackGateway} className="space-y-5 text-left relative z-10">
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Countdown</span>
                      <span className="text-xs font-bold text-indigo-400 font-mono mt-0.5 block">{getDaysLabel(daysUntil(contributeTarget.birthday))} remaining</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Milestone date</span>
                      <span className="text-xs font-bold text-slate-200 mt-0.5 block">{formatDate(contributeTarget.birthday)}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Select Pool Share Amount</label>
                    <div className="grid grid-cols-4 gap-2">
                      {["20", "50", "100", "250"].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => {
                            setContribAmount(amt);
                            setCustomAmount("");
                          }}
                          className={`py-3 px-1 rounded-xl text-xs font-extrabold font-mono border transition duration-150 cursor-pointer text-center ${
                            contribAmount === amt && !customAmount
                              ? "bg-[#FF4D00]/25 text-[#FF4D00] border-[#FF4D00]"
                              : "bg-slate-950/60 border-slate-800 text-slate-350 hover:bg-slate-850"
                          }`}
                        >
                          GHS {amt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Or custom amount (GHS)</label>
                    <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden items-center px-4 focus-within:border-indigo-500 transition-all">
                      <span className="text-slate-400 font-bold text-xs select-none mr-2">GHS</span>
                      <input
                        type="number"
                        placeholder="Enter other sum..."
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full bg-transparent text-white text-xs outline-none py-3.5 font-bold font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase tracking-widest text-slate-400">Payment Channel</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Mobile Money", "Credit / Debit Card"].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setContribMethod(method)}
                          className={`py-3 text-xs font-bold border rounded-xl transition duration-150 cursor-pointer ${
                            contribMethod === method
                              ? "bg-slate-800 border-slate-700 text-white shadow-inner"
                              : "bg-slate-950/40 border-slate-800/80 text-slate-400 hover:bg-slate-950"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={paystackChecking}
                      className="w-full relative py-4 bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] text-white font-extrabold text-sm rounded-xl cursor-pointer shadow-[0_4px_24px_rgba(255,77,0,0.3)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase tracking-widest disabled:opacity-50"
                    >
                      {paystackChecking ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          <span>Connecting Paystack Engine...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-4 h-4" />
                          <span>Secure Pay with Paystack</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="py-8 text-center space-y-6 relative z-10">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce"
                  >
                    <Check className="w-8 h-8 stroke-[3]" />
                  </motion.div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black text-white">Payment Authorized!</h4>
                    <p className="text-xs text-slate-300 px-4 leading-relaxed">
                      {activityMessage}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-1">Transaction Ref: Ref-{Date.now().toString().slice(-8)} (Web Hook Registered)</p>
                  </div>
                  <div className="pt-4">
                    <button
                      onClick={closePaystackPortal}
                      className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                    >
                      Dismiss Gateway Portal
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

function Section({ label, dot, children }: { label: string; dot: string; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3.5 w-full text-left">
      <div className="flex items-center gap-2 px-1">
        <div className={`w-2 h-2 rounded-full ${dot}`} />
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{label}</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 space-y-0">
        {children}
      </div>
    </motion.div>
  );
}

function Card({ friend, days, index, onViewFriend, onOpenContrib }: {
  friend: Friend; days: number; index: number;
  onViewFriend: (id: string) => void;
  onOpenContrib: (f: Friend) => void;
}) {
  const isToday = days === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.04 }}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 hover:shadow-2xl transition-all duration-300 relative group overflow-hidden"
    >
      {/* Decorative Gradient Line for premium feel */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] opacity-80" />

      {/* Hexagonal glowing blob behind avatar on hover */}
      <div className="absolute -left-12 -top-12 w-24 h-24 bg-gradient-to-br from-[#7C3AED]/20 to-transparent rounded-full opacity-0 group-hover:opacity-100 blur-xl transition-all duration-300" />

      {/* Main Row / Header inside card */}
      <div className="flex items-start justify-between gap-4 relative z-10 text-left">
        <div className="flex gap-3 min-w-0">
          <div className={`w-10 h-10 ${friend.avatar || "bg-indigo-600"} rounded-xl flex items-center justify-center text-white font-extrabold text-sm shrink-0 border border-white/10 shadow-md`}>
            {friend.name.replace(" (You)", "")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-black text-sm text-slate-100 tracking-tight block truncate">{friend.name.replace(" (You)", "")}</span>
            <span className="text-[10px] text-slate-400 font-semibold tracking-wide block mt-0.5 capitalize">{friend.relationship}</span>
          </div>
        </div>

        {/* Days remaining badge - extremely high contrast neon styling */}
        <div className="shrink-0 text-right">
          {isToday ? (
            <span className="text-[9px] font-black bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg uppercase tracking-wide inline-flex items-center gap-1 border border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)] animate-pulse">
              🎉 Today
            </span>
          ) : (
            <div className="flex flex-col items-end">
              <span className={`text-[10px] font-mono font-black py-1 px-2 rounded-lg ${
                days <= 3 
                  ? "bg-rose-500/15 text-rose-400 border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.15)]" 
                  : days <= 7 
                  ? "bg-orange-500/15 text-orange-400 border border-orange-500/20" 
                  : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
              }`}>
                {getDaysLabel(days)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Info items / Wishlist status indicators */}
      <div className="my-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-left relative z-10">
        <div className="text-[10px] font-mono text-slate-400">
          <span className="block text-[8px] uppercase tracking-wider text-slate-500">Milestone Cycle</span>
          <span className="font-bold text-slate-300 mt-0.5 block">{formatDate(friend.birthday)}</span>
        </div>

        <div className="text-right">
          <span className="block text-[8px] uppercase tracking-wider text-slate-500">Registry Items</span>
          <span className="font-extrabold text-[#7C3AED] flex items-center gap-1 justify-end text-xs font-mono mt-0.5">
            <Gift className="w-3 nav-icon text-[#7C3AED]" /> {friend.wishlist?.length || 0} Listed
          </span>
        </div>
      </div>

      {/* NEON-ACCENTED ACTION BUTTON BUTTONS (Absolute neon glow buttons) */}
      <div className="space-y-2 pt-2 relative z-10">
        <button
          onClick={() => onOpenContrib(friend)}
          className="w-full relative py-3 px-4 bg-gradient-to-r from-[#FF4D00] to-[#7C3AED] hover:brightness-110 active:scale-[0.98] text-white font-extrabold text-[11px] rounded-xl shadow-[0_0_16px_rgba(255,77,0,0.25)] hover:shadow-[0_0_24px_rgba(255,77,0,0.45)] transition-all flex items-center justify-center gap-2 cursor-pointer uppercase tracking-widest leading-none border border-transparent"
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Contribute to Gift Pool</span>
        </button>

        <button
          onClick={() => onViewFriend(friend.id)}
          className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-850/80 text-indigo-300 hover:text-white font-bold text-[10.5px] rounded-xl transition duration-150 flex items-center justify-center gap-2 cursor-pointer border border-slate-800/80"
        >
          <span>View Registry Link</span>
          <ChevronRight className="w-3 h-3 text-indigo-400" />
        </button>
      </div>
    </motion.div>
  );
}
