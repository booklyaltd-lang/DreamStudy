import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface PaymentRequest {
  amount: number;
  payment_type: 'subscription' | 'course';
  tier?: 'basic' | 'premium';
  course_id?: string;
  description: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const body: PaymentRequest = await req.json();
    const { amount, payment_type, tier, course_id, description } = body;

    if (!amount || !payment_type || !description) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get payment settings from database
    const { data: settings, error: settingsError } = await supabase
      .from('site_settings')
      .select('payment_provider, payment_enabled, payment_cloudpayments_public_id, payment_cloudpayments_api_password, payment_api_key, payment_secret_key')
      .maybeSingle();

    if (settingsError || !settings) {
      return new Response(
        JSON.stringify({ error: 'Failed to load payment settings' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!settings.payment_enabled) {
      return new Response(
        JSON.stringify({ error: 'Payment system is disabled' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const provider = settings.payment_provider || 'yookassa';

    // CloudPayments
    if (provider === 'cloudpayments') {
      console.log('Processing CloudPayments payment for user:', user.id);

      const publicId = settings.payment_cloudpayments_public_id;

      if (!publicId) {
        console.error('CloudPayments Public ID not configured');
        return new Response(
          JSON.stringify({
            error: 'CloudPayments credentials not configured',
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const invoiceId = crypto.randomUUID();
      console.log('Generated invoice ID:', invoiceId);

      let userEmail = 'user@example.com';

      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }

        userEmail = profile?.email || user.email || 'user@example.com';
        console.log('User email:', userEmail);
      } catch (err) {
        console.error('Error getting user email:', err);
      }

      try {
        const { error: dbError } = await supabase.from('payments').insert({
          user_id: user.id,
          yookassa_payment_id: invoiceId,
          amount: amount,
          currency: 'RUB',
          status: 'pending',
          payment_type: payment_type,
          course_id: course_id || null,
          metadata: {
            provider: 'cloudpayments',
            tier,
            description,
          },
        });

        if (dbError) {
          console.error('Database error inserting payment:', dbError);
          return new Response(
            JSON.stringify({
              error: 'Failed to create payment record',
              details: dbError.message
            }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
      } catch (err) {
        console.error('Exception inserting payment:', err);
        return new Response(
          JSON.stringify({
            error: 'Failed to create payment record',
            details: err.message
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      console.log('Payment record created successfully');

      return new Response(
        JSON.stringify({
          payment_id: invoiceId,
          status: 'pending',
          widget_data: {
            publicId: publicId,
            description: description,
            amount: amount,
            currency: 'RUB',
            invoiceId: invoiceId,
            accountId: user.id,
            email: userEmail,
            data: {
              user_id: user.id,
              payment_type,
              ...(tier && { tier }),
              ...(course_id && { course_id }),
            },
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // YooKassa (default)
    const yookassaShopId = Deno.env.get('YOOKASSA_SHOP_ID') || settings.payment_api_key;
    const yookassaSecretKey = Deno.env.get('YOOKASSA_SECRET_KEY') || settings.payment_secret_key;

    if (!yookassaShopId || !yookassaSecretKey) {
      return new Response(
        JSON.stringify({
          error: 'YooKassa credentials not configured',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const idempotenceKey = crypto.randomUUID();
    const yookassaAuth = btoa(`${yookassaShopId}:${yookassaSecretKey}`);

    const paymentData = {
      amount: {
        value: amount.toFixed(2),
        currency: 'RUB',
      },
      confirmation: {
        type: 'redirect',
        return_url: `${req.headers.get('origin') || supabaseUrl}/payment-success`,
      },
      capture: true,
      description: description,
      metadata: {
        user_id: user.id,
        payment_type,
        ...(tier && { tier }),
        ...(course_id && { course_id }),
      },
    };

    const yookassaResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotence-Key': idempotenceKey,
        'Authorization': `Basic ${yookassaAuth}`,
      },
      body: JSON.stringify(paymentData),
    });

    if (!yookassaResponse.ok) {
      const errorText = await yookassaResponse.text();
      console.error('YooKassa error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment', details: errorText }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const yookassaPayment = await yookassaResponse.json();

    const { error: dbError } = await supabase.from('payments').insert({
      user_id: user.id,
      yookassa_payment_id: yookassaPayment.id,
      amount: amount,
      currency: 'RUB',
      status: 'pending',
      payment_type: payment_type,
      course_id: course_id || null,
      metadata: {
        provider: 'yookassa',
        tier,
        description,
      },
    });

    if (dbError) {
      console.error('Database error:', dbError);
    }

    return new Response(
      JSON.stringify({
        payment_id: yookassaPayment.id,
        confirmation_url: yookassaPayment.confirmation.confirmation_url,
        status: yookassaPayment.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
