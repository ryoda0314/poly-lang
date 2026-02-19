-- ============================================================
-- Stripe 決済テーブル + profiles.subscription_plan カラム
-- ============================================================

-- 1. profiles に subscription_plan カラム追加（まだなければ）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'subscription_plan'
    ) THEN
        ALTER TABLE public.profiles
            ADD COLUMN subscription_plan text DEFAULT 'free';
    END IF;
END $$;

-- 1b. profiles に欠落していたクレジットカラムを追加
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS pronunciation_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS speaking_credits integer DEFAULT 0 NOT NULL;
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS kanji_hanja_credits integer DEFAULT 0 NOT NULL;

-- 2. stripe_customers: ユーザー ↔ Stripe Customer マッピング
CREATE TABLE IF NOT EXISTS public.stripe_customers (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id text NOT NULL,
    created_at  timestamptz DEFAULT now(),
    CONSTRAINT stripe_customers_user_id_key UNIQUE (user_id),
    CONSTRAINT stripe_customers_stripe_customer_id_key UNIQUE (stripe_customer_id)
);

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own stripe_customers"
    ON public.stripe_customers FOR SELECT
    USING (auth.uid() = user_id);

-- 3. user_subscriptions: サブスクリプション状態
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
    id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id                 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_subscription_id  text NOT NULL,
    stripe_customer_id      text NOT NULL,
    plan_id                 text NOT NULL DEFAULT 'free',
    status                  text NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active','past_due','canceled','unpaid','trialing')),
    current_period_start    timestamptz,
    current_period_end      timestamptz,
    cancel_at_period_end    boolean DEFAULT false,
    created_at              timestamptz DEFAULT now(),
    updated_at              timestamptz DEFAULT now(),
    CONSTRAINT user_subscriptions_user_id_key UNIQUE (user_id),
    CONSTRAINT user_subscriptions_stripe_subscription_id_key UNIQUE (stripe_subscription_id)
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own user_subscriptions"
    ON public.user_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

-- 4. payment_transactions: 決済トランザクション（コインパック / 単品購入）
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id                      uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id                 uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type                    text NOT NULL
                            CHECK (type IN ('coin_pack','single_purchase','subscription_payment')),
    product_id              text NOT NULL,
    amount_jpy              integer NOT NULL,
    coins_granted           integer NOT NULL DEFAULT 0,
    status                  text NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','completed','failed','refunded')),
    stripe_session_id       text,
    stripe_payment_intent_id text,
    metadata                jsonb DEFAULT '{}'::jsonb,
    created_at              timestamptz DEFAULT now(),
    completed_at            timestamptz,
    CONSTRAINT payment_transactions_stripe_session_id_key UNIQUE (stripe_session_id)
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own payment_transactions"
    ON public.payment_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id
    ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status
    ON public.payment_transactions(status);
