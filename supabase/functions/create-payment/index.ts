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
    const yookassaShopId = Deno.env.get('YOOKASSA_SHOP_ID');
    const yookassaSecretKey = Deno.env.get('YOOKASSA_SECRET_KEY');

    if (!yookassaShopId || !yookassaSecretKey) {
      return new Response(
        JSON.stringify({
          error: 'YooKassa credentials not configured. Please set YOOKASSA_SHOP_ID and YOOKASSA_SECRET_KEY environment variables.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

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
        tier,
        description,
      },
    });

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response(
        JSON.stringify({ error: 'Failed to save payment', details: dbError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
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
