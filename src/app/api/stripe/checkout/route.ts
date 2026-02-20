import { NextRequest, NextResponse } from 'next/server';
import { stripe, PLAN_PRICE_MAP, SINGLE_PURCHASE_CREDITS, COIN_PACK_MAP } from '@/lib/stripe';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, planId, itemId, quantity = 1, packId } = body;

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    // ── Stripe Customer の取得または作成 ──
    const admin = await createAdminClient();
    const { data: customerRow } = await admin
        .from('stripe_customers')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .maybeSingle();

    let customerId = customerRow?.stripe_customer_id;
    if (!customerId) {
        const customer = await stripe.customers.create({
            email: user.email,
            metadata: { user_id: user.id },
        });
        customerId = customer.id;
        await admin.from('stripe_customers').insert({
            user_id: user.id,
            stripe_customer_id: customerId,
        });
    }

    // ── サブスクリプション ──
    if (type === 'subscription') {
        if (!planId || !PLAN_PRICE_MAP[planId]) {
            return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: PLAN_PRICE_MAP[planId], quantity: 1 }],
            success_url: `${origin}/app/shop?success=1&plan=${planId}`,
            cancel_url: `${origin}/app/shop?canceled=1`,
            locale: 'ja',
            metadata: {
                type: 'subscription',
                user_id: user.id,
                plan_id: planId,
            },
            subscription_data: {
                metadata: {
                    user_id: user.id,
                    plan_id: planId,
                },
            },
        });

        return NextResponse.json({ url: session.url });
    }

    // ── コインパック購入 ──
    if (type === 'coin_pack') {
        const pack = COIN_PACK_MAP[packId];
        if (!pack) {
            return NextResponse.json({ error: 'Invalid coin pack' }, { status: 400 });
        }

        const { data: txRow, error: txError } = await admin
            .from('payment_transactions')
            .insert({
                user_id: user.id,
                type: 'coin_pack',
                product_id: packId,
                amount_jpy: pack.priceYen,
                coins_granted: pack.coins,
                status: 'pending',
                metadata: {
                    pack_id: packId,
                    coins: pack.coins,
                    bonus_percent: pack.bonus,
                },
            })
            .select('id')
            .single();

        if (txError || !txRow) {
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'payment',
            line_items: [{ price: pack.stripePriceId, quantity: 1 }],
            success_url: `${origin}/app/shop?success=1&coins=${pack.coins}`,
            cancel_url: `${origin}/app/shop?canceled=1`,
            locale: 'ja',
            metadata: {
                type: 'coin_pack',
                user_id: user.id,
                transaction_id: txRow.id,
                pack_id: packId,
                coins_to_grant: String(pack.coins),
            },
        });

        await admin
            .from('payment_transactions')
            .update({ stripe_session_id: session.id })
            .eq('id', txRow.id);

        return NextResponse.json({ url: session.url });
    }

    // ── 単品購入（移行期間中：旧フロー） ──
    if (type === 'single') {
        const creditDef = SINGLE_PURCHASE_CREDITS[itemId];
        if (!creditDef) {
            return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
        }

        const unitAmount = 100;
        const totalAmount = unitAmount * quantity;
        const totalCredits = creditDef.amount * quantity;

        const { data: txRow, error: txError } = await admin
            .from('payment_transactions')
            .insert({
                user_id: user.id,
                type: 'single_purchase',
                product_id: itemId,
                amount_jpy: totalAmount,
                coins_granted: 0,
                status: 'pending',
                metadata: {
                    item_id: itemId,
                    quantity,
                    credits_column: creditDef.column,
                    credits_amount: totalCredits,
                },
            })
            .select('id')
            .single();

        if (txError || !txRow) {
            return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
        }

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'payment',
            line_items: [{
                price_data: {
                    currency: 'jpy',
                    unit_amount: unitAmount,
                    product_data: {
                        name: `PolyLang クレジット (${itemId})`,
                        description: `${creditDef.amount * quantity}クレジット付与`,
                    },
                },
                quantity,
            }],
            success_url: `${origin}/app/shop?success=1&item=${itemId}`,
            cancel_url: `${origin}/app/shop?canceled=1`,
            locale: 'ja',
            metadata: {
                type: 'single_purchase',
                user_id: user.id,
                transaction_id: txRow.id,
                item_id: itemId,
                quantity: String(quantity),
                credits_column: creditDef.column,
                credits_amount: String(totalCredits),
            },
        });

        await admin
            .from('payment_transactions')
            .update({ stripe_session_id: session.id })
            .eq('id', txRow.id);

        return NextResponse.json({ url: session.url });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (err: any) {
        console.error('[checkout] Error:', err?.message ?? err);
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}
