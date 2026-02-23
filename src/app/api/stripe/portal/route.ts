import { NextRequest, NextResponse } from 'next/server';
import { getStripe, getOrCreateStripeCustomer } from '@/lib/stripe';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = await createAdminClient();
    const customerId = await getOrCreateStripeCustomer(admin, user.id, user.email);

    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const portalSession = await getStripe().billingPortal.sessions.create({
        customer: customerId,
        return_url: `${origin}/app/shop`,
    });

    return NextResponse.json({ url: portalSession.url });
}
