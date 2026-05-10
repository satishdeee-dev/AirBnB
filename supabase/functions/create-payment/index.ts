// Edge function: create-payment
// Calls MyFatoorah's /v2/ExecutePayment with PaymentMethodId=1 (KNET) for the
// caller's pending cart items, returns the PaymentURL the frontend redirects to.
//
// Required Supabase secrets:
//   MYFATOORAH_API_KEY     — Bearer token from your MyFatoorah test/live portal
//   MYFATOORAH_BASE_URL    — defaults to https://apitest.myfatoorah.com (sandbox)
//   SITE_URL               — used to build CallBackUrl / ErrorUrl

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

// AED → KWD fixed conversion for the demo. Real apps should pull a live FX rate.
const AED_TO_KWD = 0.0833;

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

    const { data: items, error } = await supabase
      .from("cart_items")
      .select("id, total, listing_id, check_in, check_out, status")
      .in("id", cartItemIds)
      .eq("status", "pending");
    if (error) return json({ error: "Cart fetch failed", detail: error.message }, 500);
    if (!items || items.length === 0) return json({ error: "No pending cart items found" }, 400);

    const totalAed = items.reduce((s, i: any) => s + Number(i.total), 0);
    const totalKwd = Number((totalAed * AED_TO_KWD).toFixed(3));

    const { data: profile } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", user.id)
      .maybeSingle();

    const customerName = profile?.name || user.email?.split("@")[0] || "Stayly Guest";
    const customerEmail = profile?.email || user.email || "guest@stayly.local";
    const cartIdsParam = cartItemIds.join(",");
    const callBackUrl = `${siteUrl}/#/payment-success?cartIds=${encodeURIComponent(cartIdsParam)}`;
    const errorUrl    = `${siteUrl}/#/payment-failed?cartIds=${encodeURIComponent(cartIdsParam)}`;

    // ExecutePayment locks in PaymentMethodId=1 (KNET) and returns a PaymentURL
    const mfResp = await fetch(`${baseUrl}/v2/ExecutePayment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        PaymentMethodId: 1,
        CustomerName: customerName,
        DisplayCurrencyIso: "KWD",
        MobileCountryCode: "965",
        CustomerMobile: "50000000",
        CustomerEmail: customerEmail,
        InvoiceValue: totalKwd,
        CallBackUrl: callBackUrl,
        ErrorUrl: errorUrl,
        Language: "EN",
        CustomerReference: user.id.slice(0, 16),
        UserDefinedField: cartIdsParam,
        InvoiceItems: items.map((it: any) => ({
          ItemName: `Stayly stay (${it.listing_id})`,
          Quantity: 1,
          UnitPrice: Number((Number(it.total) * AED_TO_KWD).toFixed(3)),
        })),
      }),
    });

    const mfText = await mfResp.text();
    let mfData: any;
    try { mfData = JSON.parse(mfText); } catch {
      return json({
        error: "MyFatoorah returned a non-JSON response",
        status: mfResp.status,
        body: mfText.slice(0, 400),
      }, 502);
    }
    if (!mfData.IsSuccess) {
      return json({ error: mfData.Message || "MyFatoorah ExecutePayment failed", detail: mfData }, 502);
    }

    const paymentUrl = mfData.Data?.PaymentURL;
    const invoiceId = String(mfData.Data?.InvoiceId || "");
    if (!paymentUrl) return json({ error: "MyFatoorah did not return a PaymentURL", detail: mfData }, 502);

    await supabase
      .from("cart_items")
      .update({ invoice_id: invoiceId })
      .in("id", cartItemIds);

    return json({
      url: paymentUrl,
      invoiceId,
      totalAed,
      totalKwd,
    });
  } catch (err: any) {
    return json({ error: err?.message || String(err) }, 500);
  }
});
