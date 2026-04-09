import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe, PLAN_MONTHLY_CREDITS } from '@/lib/stripe';
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
        event = getStripe().webhooks.constructEvent(rawBody, sig, webhookSecret);
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
                    const subId = typeof session.subscription === 'string'
                        ? session.subscription
                        : (session.subscription as any)?.id;
                    const custId = typeof session.customer === 'string'
                        ? session.customer
                        : (session.customer as any)?.id;

                    if (!subId) {
                        console.error('[webhook] No subscription ID in session');
                        break;
                    }

                    const subscription = await getStripe().subscriptions.retrieve(subId);
                    const sub = subscription as any;

                    // period dates: handle both unix timestamp and ISO string
                    const periodStart = sub.current_period_start
                        ? (typeof sub.current_period_start === 'number'
                            ? new Date(sub.current_period_start * 1000).toISOString()
                            : sub.current_period_start)
                        : new Date().toISOString();
                    const periodEnd = sub.current_period_end
                        ? (typeof sub.current_period_end === 'number'
                            ? new Date(sub.current_period_end * 1000).toISOString()
                            : sub.current_period_end)
                        : new Date().toISOString();

                    console.log('[webhook] checkout.session.completed subscription:', {
                        subId, custId, planId, status: subscription.status,
                        periodStart, periodEnd,
                    });

                    await admin.from('user_subscriptions').upsert({
                        user_id: userId,
                        stripe_customer_id: custId,
                        stripe_subscription_id: subscription.id,
                        plan_id: planId,
                        status: subscription.status,
                        current_period_start: periodStart,
                        current_period_end: periodEnd,
                        cancel_at_period_end: sub.cancel_at_period_end ?? false,
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
                    // 単品購入完了（移行期間中：旧フロー）→ extra_ credits を付与
                    const creditsColumn = meta.credits_column;
                    const extraColumn = creditsColumn ? `extra_${creditsColumn}` : null;
                    const creditsAmount = parseInt(meta.credits_amount ?? '0', 10);
                    const transactionId = meta.transaction_id;

                    if (extraColumn && creditsAmount > 0) {
                        const { data: profile } = await admin
                            .from('profiles')
                            .select(extraColumn as any)
                            .eq('id', userId)
                            .single();

                        const current = (profile as any)?.[extraColumn] ?? 0;
                        await admin.from('profiles')
                            .update({ [extraColumn]: current + creditsAmount })
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
            // 請求書支払完了 → 月間クレジット SET（加算ではなく上書き）
            // ────────────────────────────────────────────────────────────────
            case 'invoice.paid': {
                const invoice = event.data.object as Stripe.Invoice;
                const subscriptionId = (invoice as any).subscription as string;
                if (!subscriptionId) break;

                // 冪等性チェック: 同じ invoice.id で既に付与済みならスキップ
                const { data: existingTx } = await admin
                    .from('payment_transactions')
                    .select('id')
                    .eq('stripe_session_id', invoice.id)
                    .eq('type', 'subscription_credits')
                    .maybeSingle();
                if (existingTx) break;

                // サブスクリプションから plan_id / user_id を取得
                const sub = await getStripe().subscriptions.retrieve(subscriptionId);
                const userId = sub.metadata?.user_id;
                const planId = sub.metadata?.plan_id;
                if (!userId || !planId) break;

                const monthlyCredits = PLAN_MONTHLY_CREDITS[planId];
                if (!monthlyCredits) break;

                // プラン枠を月間配分量で SET（上書き = 毎月リセット）
                const updates: Record<string, number> = {};
                for (const [col, amount] of Object.entries(monthlyCredits)) {
                    updates[col] = amount;
                }

                await admin.from('profiles')
                    .update(updates)
                    .eq('id', userId);

                // 冪等性用のトランザクション記録
                await admin.from('payment_transactions').insert({
                    user_id: userId,
                    type: 'subscription_credits',
                    product_id: planId,
                    amount_jpy: 0,
                    coins_granted: 0,
                    status: 'completed',
                    stripe_session_id: invoice.id,
                    completed_at: new Date().toISOString(),
                    metadata: { plan_id: planId, credits_granted: monthlyCredits },
                });

                console.log(`[invoice.paid] SET monthly credits for plan=${planId} user=${userId}`);
                break;
            }

            // ────────────────────────────────────────────────────────────────
            // サブスクリプション更新 (プラン変更、更新、etc.)
            // ────────────────────────────────────────────────────────────────
            case 'customer.subscription.updated': {
                const sub = event.data.object as any;
                const userId = sub.metadata?.user_id;
                if (!userId) break;

                const planId = sub.metadata?.plan_id ?? 'free';
                const custId = typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

                const periodStart = sub.current_period_start
                    ? (typeof sub.current_period_start === 'number'
                        ? new Date(sub.current_period_start * 1000).toISOString()
                        : sub.current_period_start)
                    : new Date().toISOString();
                const periodEnd = sub.current_period_end
                    ? (typeof sub.current_period_end === 'number'
                        ? new Date(sub.current_period_end * 1000).toISOString()
                        : sub.current_period_end)
                    : new Date().toISOString();

                await admin.from('user_subscriptions').upsert({
                    user_id: userId,
                    stripe_customer_id: custId,
                    stripe_subscription_id: sub.id,
                    plan_id: planId,
                    status: sub.status,
                    current_period_start: periodStart,
                    current_period_end: periodEnd,
                    cancel_at_period_end: sub.cancel_at_period_end ?? false,
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

                // 無料プランに戻す + プラン枠クレジットを0にリセット
                // （extra_* 購入枠はそのまま残す）
                await admin.from('profiles')
                    .update({
                        subscription_plan: 'free',
                        audio_credits: 0,
                        pronunciation_credits: 0,
                        speaking_credits: 0,
                        explorer_credits: 0,
                        correction_credits: 0,
                        extraction_credits: 0,
                        explanation_credits: 0,
                        expression_credits: 0,
                        ipa_credits: 0,
                        kanji_hanja_credits: 0,
                        vocab_credits: 0,
                        grammar_credits: 0,
                        extension_credits: 0,
                        script_credits: 0,
                        chat_credits: 0,
                        sentence_credits: 0,
                        etymology_credits: 0,
                    })
                    .eq('id', userId);
                break;
            }

            // ────────────────────────────────────────────────────────────────
            // 返金処理
            // ────────────────────────────────────────────────────────────────
            case 'charge.refunded': {
                const charge = event.data.object as Stripe.Charge;
                const paymentIntentId = typeof charge.payment_intent === 'string'
                    ? charge.payment_intent
                    : (charge.payment_intent as any)?.id;

                if (!paymentIntentId) break;

                // 該当トランザクションを refunded に更新
                const { data: tx } = await admin
                    .from('payment_transactions')
                    .select('id, user_id, type, coins_granted, metadata, status')
                    .eq('stripe_payment_intent_id', paymentIntentId)
                    .maybeSingle();

                if (!tx || tx.status === 'refunded') break;

                await admin.from('payment_transactions')
                    .update({ status: 'refunded' })
                    .eq('id', tx.id);

                // コインパックの返金 → 付与済みコインを差し引く
                if (tx.type === 'coin_pack' && tx.coins_granted > 0) {
                    const { data: profile } = await admin
                        .from('profiles')
                        .select('coins')
                        .eq('id', tx.user_id)
                        .single();

                    if (profile) {
                        const newCoins = Math.max(0, (profile.coins ?? 0) - tx.coins_granted);
                        await admin.from('profiles')
                            .update({ coins: newCoins })
                            .eq('id', tx.user_id);
                    }
                }

                // 単品購入の返金 → 付与済みクレジットを差し引く
                if (tx.type === 'single_purchase') {
                    const meta = tx.metadata as any;
                    const extraColumn = meta?.credits_column ? `extra_${meta.credits_column}` : null;
                    const creditsAmount = parseInt(meta?.credits_amount ?? '0', 10);

                    if (extraColumn && creditsAmount > 0) {
                        const { data: profile } = await admin
                            .from('profiles')
                            .select(extraColumn as any)
                            .eq('id', tx.user_id)
                            .single();

                        if (profile) {
                            const current = (profile as any)?.[extraColumn] ?? 0;
                            await admin.from('profiles')
                                .update({ [extraColumn]: Math.max(0, current - creditsAmount) })
                                .eq('id', tx.user_id);
                        }
                    }
                }

                console.log(`[charge.refunded] Refunded transaction=${tx.id} user=${tx.user_id} type=${tx.type}`);
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
