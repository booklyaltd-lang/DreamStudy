import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface YooKassaNotification {
  type: string;
  event: string;
  object: {
    id: string;
    status: string;
    amount: {
      value: string;
      currency: string;
    };
    metadata: {
      user_id: string;
      payment_type: string;
      tier?: string;
      course_id?: string;
    };
  };
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

    const notification: YooKassaNotification = await req.json();

    console.log('Received webhook:', notification);

    if (notification.event !== 'payment.succeeded' && notification.event !== 'payment.canceled') {
      return new Response(
        JSON.stringify({ message: 'Event ignored' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const paymentId = notification.object.id;
    const status = notification.object.status;
    const metadata = notification.object.metadata;

    const { data: payment, error: fetchError } = await supabase
      .from('payments')
      .select('*')
      .eq('yookassa_payment_id', paymentId)
      .maybeSingle();

    if (fetchError || !payment) {
      console.error('Payment not found:', paymentId);
      return new Response(
        JSON.stringify({ error: 'Payment not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: status })
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

    if (status === 'succeeded') {
      if (metadata.payment_type === 'subscription' && metadata.tier) {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const { data: existingSubscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', metadata.user_id)
          .eq('is_active', true)
          .maybeSingle();

        if (existingSubscription) {
          await supabase
            .from('user_subscriptions')
            .update({
              tier: metadata.tier,
              end_date: endDate.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id);
        } else {
          const { data: newSubscription, error: subError } = await supabase
            .from('user_subscriptions')
            .insert({
              user_id: metadata.user_id,
              tier: metadata.tier,
              start_date: new Date().toISOString(),
              end_date: endDate.toISOString(),
              is_active: true,
            })
            .select()
            .single();

          if (newSubscription && !subError) {
            await supabase
              .from('payments')
              .update({ subscription_id: newSubscription.id })
              .eq('id', payment.id);
          }
        }
      } else if (metadata.payment_type === 'course' && metadata.course_id) {
        const { error: purchaseError } = await supabase
          .from('course_purchases')
          .insert({
            user_id: metadata.user_id,
            course_id: metadata.course_id,
            price_paid: parseFloat(notification.object.amount.value),
            purchased_at: new Date().toISOString(),
          });

        if (!purchaseError) {
          await supabase
            .from('payments')
            .update({ course_id: metadata.course_id })
            .eq('id', payment.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ message: 'Webhook processed successfully' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
