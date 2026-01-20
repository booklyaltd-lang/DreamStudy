import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface ConfirmPaymentRequest {
  payment_id: string;
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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

    const body: ConfirmPaymentRequest = await req.json();
    const { payment_id } = body;

    if (!payment_id) {
      return new Response(
        JSON.stringify({ error: 'Missing payment_id' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('yookassa_payment_id', payment_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (fetchError || !payment) {
      console.error('Payment not found:', payment_id);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (payment.status === 'succeeded') {
      return new Response(
        JSON.stringify({ success: true, message: 'Payment already confirmed' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: 'succeeded' })
      .eq('id', payment.id);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update payment' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const metadata = payment.metadata || {};
    const paymentType = payment.payment_type;
    const tier = metadata.tier || 'basic';
    const courseId = payment.course_id;

    if (paymentType === 'subscription' && tier) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const { data: existingSubscription } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (existingSubscription) {
        await supabase
          .from('user_subscriptions')
          .update({
            tier: tier,
            end_date: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id);
      } else {
        const { data: newSubscription } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            tier: tier,
            start_date: new Date().toISOString(),
            end_date: endDate.toISOString(),
            is_active: true,
          })
          .select()
          .single();

        if (newSubscription) {
          await supabase
            .from('payments')
            .update({ subscription_id: newSubscription.id })
            .eq('id', payment.id);
        }
      }

      await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_expires_at: endDate.toISOString(),
        })
        .eq('id', user.id);
    } else if (paymentType === 'course' && courseId) {
      await supabase
        .from('course_purchases')
        .insert({
          user_id: user.id,
          course_id: courseId,
          price_paid: parseFloat(payment.amount),
          purchased_at: new Date().toISOString(),
        });

      await supabase
        .from('payments')
        .update({ course_id: courseId })
        .eq('id', payment.id);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Payment confirmed successfully' }),
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
