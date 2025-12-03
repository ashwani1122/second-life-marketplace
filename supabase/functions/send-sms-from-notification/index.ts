// index.ts - Supabase Edge Function - SMS only (Deno compatible)
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Required environment variables (set in Supabase Functions UI)
 * - PROJECT_URL
 * - SERVICE_ROLE_KEY
 * - TWILIO_ACCOUNT_SID
 * - TWILIO_AUTH_TOKEN
 * - TWILIO_FROM_NUMBER
 *
 * Optional:
 * - TEST_MODE="1"  -> function will log what would be sent instead of calling Twilio
 */

const PROJECT_URL = Deno.env.get("PROJECT_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID")!;
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN")!;
const TWILIO_FROM_NUMBER = Deno.env.get("TWILIO_FROM_NUMBER")!;
const TEST_MODE = Deno.env.get("TEST_MODE") === "1";

if (!PROJECT_URL || !SERVICE_ROLE_KEY) throw new Error("Missing PROJECT_URL or SERVICE_ROLE_KEY");
if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) throw new Error("Missing Twilio env vars");

const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

/** safe JSON parse */
function safeParse(v: any) {
  if (!v) return null;
  if (typeof v === "object") return v;
  try { return JSON.parse(v); } catch { return v; }
}

/** Normalize phone to E.164-ish string or return null if clearly invalid.
 *  This is intentionally conservative: accepts digits, optional leading +, 8-15 digits.
 */
function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  // strip whitespace and separators, leave + and digits
  const cleaned = s.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+")) {
    const rest = cleaned.slice(1);
    if (/^\d{8,15}$/.test(rest)) return "+" + rest;
    return null;
  }
  if (cleaned.startsWith("00")) {
    const rest = cleaned.replace(/^00/, "");
    if (/^\d{8,15}$/.test(rest)) return "+" + rest;
    return null;
  }
  // plain digits (maybe already include country code). Accept if length plausible
  if (/^\d{8,15}$/.test(cleaned)) return "+" + cleaned;
  return null;
}

/** Call Twilio REST API via fetch (Deno-compatible) */
async function sendSmsViaTwilio(to: string, body: string) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: to,
        From: TWILIO_FROM_NUMBER,
        Body: body,
      }),
    });

    const json = await res.json().catch(() => ({}));
    console.log("Twilio response:", json);

    if (!res.ok) {
      return { ok: false, status: res.status, error: json?.message || JSON.stringify(json) };
    }
    return { ok: true, sid: json?.sid ?? null };
  } catch (err) {
    console.error("Twilio fetch error:", err);
    return { ok: false, error: String(err) };
  }
}

/** Optionally fetch product title to craft friendlier message */
async function getProductTitle(productId: string | null | undefined) {
  if (!productId) return null;
  try {
    const { data, error } = await supabase
      .from("products")
      .select("title")
      .eq("id", productId)
      .maybeSingle();
    if (error || !data) return null;
    return data.title ?? null;
  } catch (err) {
    console.warn("getProductTitle error", err);
    return null;
  }
}

/** Main handler */
serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const bodyJson = await req.json().catch(() => ({}));
    const notificationId = bodyJson?.notification_id;
    if (!notificationId) {
      return new Response("Missing notification_id", { status: 400 });
    }

    // load notification row
    const { data: notif, error: notifErr } = await supabase
      .from("notifications")
      .select("id, user_id, type, title, body, payload, data, created_at")
      .eq("id", notificationId)
      .maybeSingle();

    if (notifErr || !notif) {
      console.error("Notification not found or error:", notifErr);
      return new Response("Notification not found", { status: 404 });
    }

    const userId = notif.user_id;
    if (!userId) {
      console.warn("Notification has no user_id");
      return new Response("No user_id", { status: 200 });
    }

    // load profile (phone + opt-in)
    const { data: profile, error: profErr } = await supabase
      .from("profiles")
      .select("phone, sms_notifications_enabled")
      .eq("id", userId)
      .maybeSingle();

    if (profErr) {
      console.error("Error loading profile", profErr);
      return new Response("Profile error", { status: 200 });
    }
    if (!profile || !profile.phone) {
      console.log("User has no phone");
      return new Response("No phone", { status: 200 });
    }

    if (profile.sms_notifications_enabled === false) {
      console.log("User opted out of SMS");
      return new Response("SMS disabled", { status: 200 });
    }

    // normalize phone
    const normalizedPhone = normalizePhone(profile.phone);
    if (!normalizedPhone) {
      console.warn("Invalid phone format, skipping SMS:", profile.phone);
      return new Response("Invalid phone format", { status: 200 });
    }

    // Compose message text (short)
    let text = notif.body || notif.title || "You have a new notification from our marketplace.";
    const extra = safeParse(notif.payload) || safeParse(notif.data) || {};

    // If payload has product_id, try to show product title
    let productTitle = null;
    if (extra?.product_id) {
      productTitle = await getProductTitle(extra.product_id);
    }

    if (!notif.body) {
      if (notif.title && productTitle) {
        text = `${notif.title}: ${productTitle}`;
      } else if (notif.title && extra?.booking_id) {
        text = `${notif.title}: booking ${extra.booking_id}`;
      }
    }

    // Keep SMS reasonably short
    if (text.length > 300) text = text.slice(0, 300) + "...";

    // TEST_MODE: log & return without sending
    if (TEST_MODE) {
      console.log("[TEST_MODE] Would send SMS", {
        to: normalizedPhone,
        text,
        notificationId,
      });
      return new Response("[TEST_MODE] OK", { status: 200 });
    }

    // send SMS
    const res = await sendSmsViaTwilio(normalizedPhone, text);
    if (!res.ok) {
      console.error("SMS send failed", res);
      // Return 200 to avoid automated retries from trigger; adjust to 500 if you prefer hard failure
      return new Response("SMS failed", { status: 200 });
    }

    console.log("SMS sent OK", { sid: res.sid, to: normalizedPhone, notificationId });
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Function error", err);
    return new Response("Internal error", { status: 500 });
  }
});
