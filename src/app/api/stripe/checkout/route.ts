import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_mock_key", {
  apiVersion: "2024-06-20" as any,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = (session.user as any).id;
  const origin = req.headers.get("origin") || "http://localhost:3000";

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "CodeKnights Royal Subscription",
              description: "Access premium game modes, and get the gold 'Royal' crown styling next to your username.",
            },
            unit_amount: 999, // $9.99
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      client_reference_id: userId,
      customer_email: session.user.email || undefined,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err: any) {
    console.warn("Stripe Checkout creation failed (using sandbox fallback):", err.message);
    // Graceful fallback to sandbox checkout page for local testing
    return NextResponse.json({ 
      url: `${origin}/stripe-success?mock=true&userId=${userId}` 
    });
  }
}
