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

    console.log('Payment type:', paymentType);
    console.log('Tier:', tier);
    console.log('User ID:', user.id);

    if (paymentType === 'subscription' && tier) {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      console.log('Processing subscription for user:', user.id, 'tier:', tier);
      console.log('End date:', endDate.toISOString());

      const { data: existingSubscription, error: subFetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (subFetchError) {
        console.error('Error fetching existing subscription:', subFetchError);
        return new Response(
          JSON.stringify({ error: 'Failed to check existing subscription', details: subFetchError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      if (existingSubscription) {
        console.log('Updating existing subscription:', existingSubscription.id);
        const { error: subUpdateError } = await supabase
          .from('user_subscriptions')
          .update({
            tier: tier,
            end_date: endDate.toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingSubscription.id);

        if (subUpdateError) {
          console.error('Error updating subscription:', subUpdateError);
          return new Response(
            JSON.stringify({ error: 'Failed to update subscription', details: subUpdateError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        console.log('Subscription updated successfully');
      } else {
        console.log('Creating new subscription');
        const { data: newSubscription, error: subInsertError } = await supabase
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

        if (subInsertError) {
          console.error('Error inserting subscription:', subInsertError);
          return new Response(
            JSON.stringify({ error: 'Failed to create subscription', details: subInsertError.message }),
            {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
          );
        }
        console.log('New subscription created:', newSubscription?.id);

        if (newSubscription) {
          const { error: paymentLinkError } = await supabase
            .from('payments')
            .update({ subscription_id: newSubscription.id })
            .eq('id', payment.id);

          if (paymentLinkError) {
            console.error('Error linking payment to subscription:', paymentLinkError);
          }
        }
      }

      console.log('Updating profile for user:', user.id);
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          subscription_tier: tier,
          subscription_expires_at: endDate.toISOString(),
        })
        .eq('id', user.id);

      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update profile', details: profileUpdateError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      console.log('Profile updated successfully');
    } else if (paymentType === 'course' && courseId) {
      console.log('Creating course purchase for user:', user.id, 'course:', courseId);
      const { error: purchaseError } = await supabase
        .from('course_purchases')
        .insert({
          user_id: user.id,
          course_id: courseId,
          price_paid: parseFloat(payment.amount),
          purchased_at: new Date().toISOString(),
        });

      if (purchaseError) {
        console.error('Error creating course purchase:', purchaseError);
        return new Response(
          JSON.stringify({ error: 'Failed to create course purchase', details: purchaseError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      console.log('Course purchase created successfully');

      const { error: paymentLinkError } = await supabase
        .from('payments')
        .update({ course_id: courseId })
        .eq('id', payment.id);

      if (paymentLinkError) {
        console.error('Error linking payment to course:', paymentLinkError);
      }
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
