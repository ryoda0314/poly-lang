import { NextRequest, NextResponse } from 'next/server';
import { getStripe, PLAN_PRICE_MAP, COIN_PACK_MAP } from '@/lib/stripe';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { type, planId, packId } = body;

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
        const customer = await getStripe().customers.create({
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

        // 既存のアクティブなサブスクリプションがあれば拒否（プラン変更はStripeポータルから）
        const { data: existingSub } = await admin
            .from('user_subscriptions')
            .select('plan_id, status')
            .eq('user_id', user.id)
            .in('status', ['active', 'trialing'])
            .maybeSingle();

        if (existingSub) {
            return NextResponse.json(
                { error: 'すでにサブスクリプションに加入中です。プラン変更は管理画面から行ってください。' },
                { status: 400 }
            );
        }

        const session = await getStripe().checkout.sessions.create({
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

        const session = await getStripe().checkout.sessions.create({
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

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    } catch (err: any) {
        console.error('[checkout] Error:', err?.message ?? err);
        return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 });
    }
}
