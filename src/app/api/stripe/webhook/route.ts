import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

// Next.js はデフォルトで request body をパースするため、
// Stripe の署名検証には raw body が必要 → bodyParser を無効化
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
    const rawBody = await req.text();
    const sig = req.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !webhookSecret) {
        return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    const admin = await createAdminClient();

    try {
        switch (event.type) {
            // ────────────────────────────────────────────────────────────────
            // チェックアウト完了
            // ────────────────────────────────────────────────────────────────
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                const meta = session.metadata ?? {};
                const userId = meta.user_id;
                if (!userId) break;

                if (meta.type === 'subscription') {
                    // サブスクリプション完了 → user_subscriptions を作成/更新
                    const planId = meta.plan_id;
                    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

                    await admin.from('user_subscriptions').upsert({
                        user_id: userId,
                        stripe_customer_id: session.customer as string,
                        stripe_subscription_id: subscription.id,
                        plan_id: planId,
                        status: subscription.status,
                        current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                        current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                        cancel_at_period_end: (subscription as any).cancel_at_period_end,
                    }, { onConflict: 'user_id' });

                    // profiles.subscription_plan を更新
                    await admin.from('profiles')
                        .update({ subscription_plan: planId })
                        .eq('id', userId);

                } else if (meta.type === 'coin_pack') {
                    // コインパック購入完了 → coins を付与
                    const coinsToGrant = parseInt(meta.coins_to_grant ?? '0', 10);
                    const transactionId = meta.transaction_id;

                    // 冪等性チェック: 既に完了済みならスキップ
                    if (transactionId) {
                        const { data: tx } = await admin
                            .from('payment_transactions')
                            .select('status')
                            .eq('id', transactionId)
                            .single();
                        if (tx?.status === 'completed') break;
                    }

                    if (coinsToGrant > 0) {
                        const { data: profile } = await admin
                            .from('profiles')
                            .select('coins')
                            .eq('id', userId)
                            .single();

                        const currentCoins = (profile as any)?.coins ?? 0;
                        await admin.from('profiles')
                            .update({ coins: currentCoins + coinsToGrant })
                            .eq('id', userId);
                    }

                    if (transactionId) {
                        await admin.from('payment_transactions')
                            .update({
                                status: 'completed',
                                stripe_session_id: session.id,
                                stripe_payment_intent_id: session.payment_intent as string | null,
                                completed_at: new Date().toISOString(),
                            })
                            .eq('id', transactionId);
                    }

                } else if (meta.type === 'single_purchase') {
                    // 単品購入完了（移行期間中：旧フロー）→ credits を付与
                    const creditsColumn = meta.credits_column;
                    const creditsAmount = parseInt(meta.credits_amount ?? '0', 10);
                    const transactionId = meta.transaction_id;

                    if (creditsColumn && creditsAmount > 0) {
                        const { data: profile } = await admin
                            .from('profiles')
                            .select(creditsColumn as any)
                            .eq('id', userId)
                            .single();

                        const current = (profile as any)?.[creditsColumn] ?? 0;
                        await admin.from('profiles')
                            .update({ [creditsColumn]: current + creditsAmount })
                            .eq('id', userId);
                    }

                    if (transactionId) {
                        await admin.from('payment_transactions')
                            .update({
                                status: 'completed',
                                stripe_session_id: session.id,
                                stripe_payment_intent_id: session.payment_intent as string | null,
                                completed_at: new Date().toISOString(),
                            })
                            .eq('id', transactionId);
                    }
                }
                break;
            }

            // ────────────────────────────────────────────────────────────────
            // サブスクリプション更新 (プラン変更、更新、etc.)
            // ────────────────────────────────────────────────────────────────
            case 'customer.subscription.updated': {
                const sub = event.data.object as Stripe.Subscription;
                const userId = sub.metadata?.user_id;
                if (!userId) break;

                const planId = sub.metadata?.plan_id ?? 'free';

                await admin.from('user_subscriptions').upsert({
                    user_id: userId,
                    stripe_customer_id: sub.customer as string,
                    stripe_subscription_id: sub.id,
                    plan_id: planId,
                    status: sub.status,
                    current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
                    current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
                    cancel_at_period_end: (sub as any).cancel_at_period_end,
                }, { onConflict: 'user_id' });

                // アクティブなら subscription_plan を更新
                if (sub.status === 'active') {
                    await admin.from('profiles')
                        .update({ subscription_plan: planId })
                        .eq('id', userId);
                }
                break;
            }

            // ────────────────────────────────────────────────────────────────
            // サブスクリプション解約
            // ────────────────────────────────────────────────────────────────
            case 'customer.subscription.deleted': {
                const sub = event.data.object as Stripe.Subscription;
                const userId = sub.metadata?.user_id;
                if (!userId) break;

                await admin.from('user_subscriptions')
                    .update({ status: 'canceled' })
                    .eq('stripe_subscription_id', sub.id);

                // 無料プランに戻す
                await admin.from('profiles')
                    .update({ subscription_plan: 'free' })
                    .eq('id', userId);
                break;
            }

            default:
                // 未処理のイベントは無視
                break;
        }
    } catch (err: any) {
        console.error(`Error handling ${event.type}:`, err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
