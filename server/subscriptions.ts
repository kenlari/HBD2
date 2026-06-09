import { Router } from "express";
import fs from "fs";
import path from "path";
import admin from "firebase-admin";
import { getApps, initializeApp, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const router = Router();

// Load Firebase Config securely for server-side usage
let appletConfig: any = {};
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
  }
} catch (e) {
  console.error("Failed to parse secure firebase-applet-config.json: ", e);
}

const app = getApps().length === 0
  ? initializeApp({ projectId: appletConfig.projectId || process.env.FIREBASE_PROJECT_ID || "hbdd-498407" })
  : getApp();

// Initialize using custom Firestore database ID to support multi-database setups
const db = getFirestore(app, appletConfig.firestoreDatabaseId || undefined);

// Core Multiplier Conversion Anchors from Environment Variables
const EXCHANGE_RATE_USD_TO_GHS = Number(process.env.EXCHANGE_RATE_USD_TO_GHS) || 14.5;
const AFRICA_MONTHLY_USD = 1.50;
const AFRICA_YEARLY_USD = 14.00;
const WESTERN_MONTHLY_USD = 3.00;
const WESTERN_YEARLY_USD = 29.00;

// List of African countries (ISO 2-letter codes) for regional tiered calculation
const AFRICAN_COUNTRIES = [
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM", "CD", "CG",
  "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM", "GH", "GN", "GW", "KE",
  "LS", "LR", "LY", "MG", "MW", "ML", "MR", "MU", "MA", "MZ", "NA", "NE", "NG",
  "RW", "ST", "SN", "SC", "SL", "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG",
  "ZM", "ZW"
];

enum OperationType {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  LIST = "list",
  GET = "get",
  WRITE = "write",
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  };
}

// System security-compliant Firestore error handler
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, userId?: string): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: userId || null,
    },
    operationType,
    path,
  };
  console.error("Firestore Error: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Tiered regional pricing helper with Monthly and Yearly calculations
 * Returns price in GH¢ (GHS)
 */
function calculateSubscriptionPriceGHS(countryCode: string | undefined, billingCycle: "monthly" | "yearly"): number {
  const isYearly = billingCycle === "yearly";
  const code = countryCode ? countryCode.toUpperCase().trim() : "";
  
  if (code === "GH") {
    return isYearly ? 99.00 : 10.00; // Local Ghana flat pricing
  }
  
  // Dynamic conversions inside fail-safe try/catch logic
  try {
    const isAfrica = AFRICAN_COUNTRIES.includes(code);
    const usdRate = isAfrica
      ? (isYearly ? AFRICA_YEARLY_USD : AFRICA_MONTHLY_USD)
      : (isYearly ? WESTERN_YEARLY_USD : WESTERN_MONTHLY_USD);
      
    const totalCalculated = usdRate * EXCHANGE_RATE_USD_TO_GHS;
    
    if (isNaN(totalCalculated) || totalCalculated <= 0) {
      throw new Error("Calculation output is invalid or non-positive.");
    }
    
    return totalCalculated;
  } catch (err) {
    console.warn(`[Pricing Calculation Fail-safe Triggered] Fallback applied for country '${code}' under '${billingCycle}' billing.`, err);
    // Safe backup charge amount: GHS 45 for monthly international, GHS 435 for yearly international
    return isYearly ? 435.00 : 45.00;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint: POST /api/subscriptions/initialize
// ─────────────────────────────────────────────────────────────────────────────
router.post("/initialize", async (req, res) => {
  try {
    const { userId, email, billingCycle } = req.body;

    if (!userId || !email) {
      return res.status(400).json({ error: "Missing required properties: userId and email." });
    }

    const cycle: "monthly" | "yearly" = (billingCycle === "yearly" || billingCycle === "annual") ? "yearly" : "monthly";

    // 1. Fetch user profile from Firestore to check countryCode (secure Admin SDK fetch)
    let userSnap;
    const userRef = db.collection("users").doc(userId);
    try {
      userSnap = await userRef.get();
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `users/${userId}`, userId);
    }

    if (!userSnap.exists) {
      return res.status(404).json({ error: "User profile not found in Firestore." });
    }

    const userData = userSnap.data();
    const countryCode = userData?.countryCode || "GH";

    // 2. Compute regional GHS amount
    const priceGHS = calculateSubscriptionPriceGHS(countryCode, cycle);
    const amountPesewas = Math.round(priceGHS * 100);

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!paystackSecretKey) {
      return res.status(500).json({ 
        error: "Paystack is currently unconfigured. Please configure your PAYSTACK_SECRET_KEY secret in Settings if you want to complete payments."
      });
    }

    // 3. Command authorization with Paystack API
    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${paystackSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        amount: amountPesewas,
        currency: "GHS",
        metadata: {
          userId,
          billingCycle: cycle,
          countryCode,
          type: "hbd_premium_upgrade",
        },
      }),
    });

    const responseData = await paystackResponse.json();

    if (!paystackResponse.ok || !responseData.status) {
      return res.status(400).json({ 
        error: responseData.message || "Failed to initialize premium invoice generation with Paystack gateway." 
      });
    }

    // Return the authorization link and transaction lookup key to client
    return res.json({
      authorization_url: responseData.data.authorization_url,
      reference: responseData.data.reference,
    });

  } catch (err: any) {
    console.error("Subscription initialization error:", err);
    return res.status(500).json({ error: err.message || "Unhandled server exception." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Endpoint: POST /api/subscriptions/webhook
// ─────────────────────────────────────────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  try {
    const body = req.body;
    if (!body || !body.event) {
      return res.status(400).send("No event body elements detected.");
    }

    // Capture payment notification from Paystack
    if (body.event === "charge.success") {
      const transactionData = body.data;
      const metadata = transactionData?.metadata;

      if (metadata && metadata.type === "hbd_premium_upgrade" && metadata.userId) {
        const userId = metadata.userId;
        const billingCycle = metadata.billingCycle || "monthly";

        // Determine expiration window
        const expirationDays = billingCycle === "yearly" ? 365 : 30;
        const now = new Date();
        const expiresAt = new Date(now.getTime() + expirationDays * 24 * 60 * 60 * 1000);

        // Perform privileged update on User document using Admin SDK
        const userRef = db.collection("users").doc(userId);
        try {
          await userRef.update({
            plan: "pro",
            planStatus: "active",
            billingCycle: billingCycle,
            planExpiresAt: expiresAt.toISOString(),
            updatedAt: new Date().toISOString()
          });
          console.log(`[Paystack Webhook] User ${userId} upgraded to premium pro tier (${billingCycle}) successfully.`);
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`, userId);
        }
      }
    }

    return res.status(200).send("Webhook executed successfully.");
  } catch (err: any) {
    console.error("Paystack Webhook processing failure:", err);
    return res.status(500).send("Processing error occurred.");
  }
});

export default router;
