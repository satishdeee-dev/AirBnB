// Edge function: create-payment
// Builds an invoice via MyFatoorah's SendPayment endpoint for the caller's
// pending cart items, returns the InvoiceURL the frontend redirects to.
//
// Required Supabase secrets:
//   MYFATOORAH_API_KEY     — Bearer token from your test/live MyFatoorah portal
//   MYFATOORAH_BASE_URL    — defaults to https://apitest.myfatoorah.com
//   SITE_URL               — used to build the CallBackUrl (e.g. https://stayly-beryl.vercel.app)

// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const apiKey = Deno.env.get("MYFATOORAH_API_KEY");
    if (!apiKey) return json({ error: "MYFATOORAH_API_KEY not configured" }, 500);

    const baseUrl = Deno.env.get("MYFATOORAH_BASE_URL") || "https://apitest.myfatoorah.com";
    const siteUrl = Deno.env.get("SITE_URL") || "https://stayly-beryl.vercel.app";

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Missing Authorization header" }, 401);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const cartItemIds: string[] = Array.isArray(body.cartItemIds) ? body.cartItemIds : [];
    if (cartItemIds.length === 0) return json({ error: "cartItemIds required" }, 400);

    // Fetch the cart items (RLS ensures only the caller's pending rows return).
    const { data: items, error } = await supabase
      .from("cart_items")
      .select("id, total, listing_id, check_in, check_out, guests, status")
      .in("id", cartItemIds)
      .eq("status", "pending");
    if (error) return json({ error: "Cart fetch failed", detail: error.message }, 500);
    if (!items || items.length === 0) return json({ error: "No pending cart items found" }, 400);

    const total = items.reduce((s, i: any) => s + Number(i.total), 0);

    // Profile gives us a friendly name + email for MyFatoorah.
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .maybeSingle();

    const customerName = profile?.name || user.email?.split("@")[0] || "Stayly Guest";
    const customerEmail = profile?.email || user.email || "guest@stayly.local";
    const cartIdsParam = cartItemIds.join(",");
    const callbackUrl = `${siteUrl}/#/payment-callback?cartIds=${encodeURIComponent(cartIdsParam)}`;

    const mfResp = await fetch(`${baseUrl}/v2/SendPayment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        CustomerName: customerName,
        CustomerEmail: customerEmail,
        NotificationOption: "LNK",
        InvoiceValue: Number(total.toFixed(2)),
        DisplayCurrencyIso: "AED",
        CallBackUrl: callbackUrl,
        ErrorUrl: callbackUrl,
        UserDefinedField: cartIdsParam,
        Language: "EN",
      }),
    });
    const mfText = await mfResp.text();
    let mfData: any;
    try { mfData = JSON.parse(mfText); } catch {
      return json({
        error: "MyFatoorah returned a non-JSON response (likely an auth or routing problem).",
        status: mfResp.status,
        body: mfText.slice(0, 400),
        hint: "Set MYFATOORAH_API_KEY to a valid token via: supabase secrets set MYFATOORAH_API_KEY=<token> --project-ref peyakimjlmkcjwixtzfi"
      }, 502);
    }
    if (!mfData.IsSuccess) {
      return json({ error: mfData.Message || "MyFatoorah error", detail: mfData }, 502);
    }

    // Persist the InvoiceId on each cart item so the callback can match it.
    const invoiceId = String(mfData.Data.InvoiceId);
    await supabase
      .from("cart_items")
      .update({ invoice_id: invoiceId })
      .in("id", cartItemIds);

    return json({
      url: mfData.Data.InvoiceURL,
      invoiceId,
      total,
    });
  } catch (err: any) {
    return json({ error: err?.message || String(err) }, 500);
  }
});
