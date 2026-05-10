// Edge function: verify-payment
// Called by /payment-callback after MyFatoorah redirects back. Verifies the
// payment status with MyFatoorah's GetPaymentStatus endpoint, marks matching
// cart_items as paid, and creates bookings rows for each item.

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
    const paymentId: string | undefined = body.paymentId;
    const cartIds: string[] = Array.isArray(body.cartIds) ? body.cartIds : [];
    if (!paymentId && cartIds.length === 0) {
      return json({ error: "paymentId or cartIds required" }, 400);
    }

    // Ask MyFatoorah for the payment status using whichever key the caller has.
    let mfResp: Response;
    if (paymentId) {
      mfResp = await fetch(`${baseUrl}/v2/getPaymentStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ Key: paymentId, KeyType: "PaymentId" }),
      });
    } else {
      // Look up by InvoiceId tied to the cart items
      const { data: items } = await supabase
        .from("cart_items").select("invoice_id").in("id", cartIds).limit(1);
      const invoiceId = items?.[0]?.invoice_id;
      if (!invoiceId) return json({ error: "No invoice on cart items" }, 400);
      mfResp = await fetch(`${baseUrl}/v2/getPaymentStatus`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ Key: invoiceId, KeyType: "InvoiceId" }),
      });
    }
    const mfData = await mfResp.json();
    if (!mfData.IsSuccess) {
      return json({ error: mfData.Message || "MyFatoorah lookup failed", detail: mfData }, 502);
    }

    const status: string = mfData.Data?.InvoiceStatus || "Unknown";
    const paidWithLast4 = mfData.Data?.InvoiceTransactions?.[0]?.PaymentGateway || "MyFatoorah";
    const txnId = mfData.Data?.InvoiceTransactions?.[0]?.TransactionId || mfData.Data?.InvoiceId;

    // Decide which cart items this invoice covers
    const userDefined: string = mfData.Data?.UserDefinedField || "";
    const matchedIds = cartIds.length ? cartIds : userDefined.split(",").filter(Boolean);
    if (matchedIds.length === 0) return json({ error: "No matched cart items" }, 400);

    if (status !== "Paid") {
      return json({ status, paid: false, message: "Payment not completed" });
    }

    // Mark items paid + create one booking per item
    const { data: items } = await supabase
      .from("cart_items").select("*").in("id", matchedIds).eq("user_id", user.id);
    if (!items || items.length === 0) return json({ error: "No cart items found" }, 404);

    const now = new Date().toISOString();
    const bookingRows = items.map((it: any) => ({
      id: "b_" + Math.random().toString(36).slice(2, 10),
      user_id: user.id,
      listing_id: it.listing_id,
      check_in: it.check_in,
      check_out: it.check_out,
      guests: it.guests,
      adults: it.adults,
      children: it.children,
      total: it.total,
      meals: it.meals,
      status: "confirmed",
      payment: {
        brand: "myfatoorah",
        gateway: paidWithLast4,
        txnId: String(txnId),
        invoiceId: String(mfData.Data.InvoiceId),
      },
      created_at: now,
    }));

    const { error: bErr } = await supabase.from("bookings").insert(bookingRows);
    if (bErr) return json({ error: "Booking insert failed", detail: bErr.message }, 500);

    await supabase
      .from("cart_items")
      .update({ status: "paid", paid_at: now, payment_id: String(txnId) })
      .in("id", matchedIds);

    return json({ status, paid: true, bookingIds: bookingRows.map(b => b.id) });
  } catch (err: any) {
    return json({ error: err?.message || String(err) }, 500);
  }
});
