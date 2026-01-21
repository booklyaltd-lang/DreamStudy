import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, Content-Hmac',
};

interface CloudPaymentsNotification {
  TransactionId: number;
  Amount: number;
  Currency: string;
  DateTime: string;
  CardFirstSix?: string;
  CardLastFour?: string;
  CardType?: string;
  Status: string;
  StatusCode?: number;
  OperationType?: string;
  InvoiceId?: string;
  AccountId?: string;
  Email?: string;
  Data?: any;
  TestMode?: boolean;
  Token?: string;
  Name?: string;
  IpAddress?: string;
  IpCountry?: string;
  IpCity?: string;
  IpRegion?: string;
  IpDistrict?: string;
  Description?: string;
  AuthCode?: string;
  PaymentAmount?: number;
  PaymentCurrency?: string;
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
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const notification: CloudPaymentsNotification = await req.json();

    console.log('=== CloudPayments Webhook Received ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Full notification:', JSON.stringify(notification, null, 2));
    console.log('Transaction ID:', notification.TransactionId);
    console.log('Invoice ID:', notification.InvoiceId);
    console.log('Status:', notification.Status);
    console.log('Amount:', notification.Amount);
    console.log('Currency:', notification.Currency);
    console.log('Data:', notification.Data);
    console.log('Test Mode:', notification.TestMode);

    const invoiceId = notification.InvoiceId;

    if (!invoiceId) {
      console.error('ERROR: No InvoiceId in notification - cannot process payment');
      console.error('This means CloudPayments sent notification without InvoiceId');
      console.error('Make sure you are passing invoiceId when creating payment');
      return new Response(
        JSON.stringify({ code: 0, message: 'No InvoiceId provided' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Searching for payment with InvoiceId:', invoiceId);

    const { data: payment, error: paymentError } = await supabaseClient
      .from('payments')
      .select('*')
      .eq('yookassa_payment_id', invoiceId)
      .maybeSingle();

    if (paymentError) {
      console.error('ERROR: Database error searching for payment:', paymentError);
      return new Response(
        JSON.stringify({ code: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!payment) {
      console.error('ERROR: Payment not found in database for InvoiceId:', invoiceId);
      console.error('Possible reasons:');
      console.error('1. Payment was not created before webhook arrived');
      console.error('2. InvoiceId mismatch between create-payment and webhook');
      console.error('3. Payment was deleted from database');
      console.error('Searching all payments to debug...');

      const { data: allPayments } = await supabaseClient
        .from('payments')
        .select('yookassa_payment_id, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      console.error('Recent payments in database:', allPayments);

      return new Response(
        JSON.stringify({ code: 0, message: 'Payment not found in database' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Payment found:', {
      id: payment.id,
      user_id: payment.user_id,
      amount: payment.amount,
      status: payment.status,
      payment_type: payment.payment_type,
      course_id: payment.course_id
    });

    let newStatus = 'pending';
    if (notification.Status === 'Completed' || notification.Status === 'Authorized') {
      newStatus = 'succeeded';
      console.log('Payment succeeded!');
    } else if (notification.Status === 'Declined' || notification.Status === 'Cancelled') {
      newStatus = 'failed';
      console.log('Payment failed or cancelled');
    }

    console.log('Updating payment status from', payment.status, 'to', newStatus);

    const { error: updateError } = await supabaseClient
      .from('payments')
      .update({
        status: newStatus,
        metadata: {
          ...payment.metadata,
          cloudpayments_transaction_id: notification.TransactionId,
          cloudpayments_status: notification.Status,
          card_first_six: notification.CardFirstSix,
          card_last_four: notification.CardLastFour,
          card_type: notification.CardType,
          data: notification.Data,
        }
      })
      .eq('yookassa_payment_id', invoiceId);

    if (updateError) {
      console.error('ERROR: Failed to update payment status:', updateError);
      return new Response(
        JSON.stringify({ code: 13 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Payment status updated successfully to:', newStatus);

    if (newStatus === 'succeeded') {
      console.log('=== Processing successful payment ===');
      const metadata = payment.metadata || {};
      let dataObj = metadata;

      if (notification.Data) {
        try {
          if (typeof notification.Data === 'string') {
            dataObj = JSON.parse(notification.Data);
          } else {
            dataObj = notification.Data;
          }
        } catch (e) {
          console.error('Failed to parse Data field:', e);
        }
      }

      const paymentType = payment.payment_type;
      const userId = payment.user_id;
      const tier = dataObj.tier || metadata.tier || 'basic';
      const courseId = payment.course_id || dataObj.course_id;

      console.log('Payment type:', paymentType);
      console.log('User ID:', userId);
      console.log('Tier:', tier);
      console.log('Course ID:', courseId);

      if (paymentType === 'subscription') {
        console.log('--- Processing SUBSCRIPTION payment ---');
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);
        console.log('Subscription end date:', endDate.toISOString());

        const { data: existingSubscription } = await supabaseClient
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', userId)
          .eq('is_active', true)
          .maybeSingle();

        if (existingSubscription) {
          console.log('Found existing subscription, updating:', existingSubscription.id);
          const { error: updateError } = await supabaseClient
            .from('user_subscriptions')
            .update({
              tier: tier,
              end_date: endDate.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingSubscription.id);

          if (updateError) {
            console.error('ERROR: Failed to update subscription:', updateError);
          } else {
            console.log('SUCCESS: Subscription updated');
          }
        } else {
          console.log('No existing subscription, creating new one');
          const { data: newSubscription, error: subError } = await supabaseClient
            .from('user_subscriptions')
            .insert({
              user_id: userId,
              tier: tier,
              start_date: new Date().toISOString(),
              end_date: endDate.toISOString(),
              is_active: true,
            })
            .select()
            .single();

          if (subError) {
            console.error('ERROR: Failed to create subscription:', subError);
          } else {
            console.log('SUCCESS: Subscription created:', newSubscription?.id);
            if (newSubscription) {
              const { error: linkError } = await supabaseClient
                .from('payments')
                .update({ subscription_id: newSubscription.id })
                .eq('id', payment.id);

              if (linkError) {
                console.error('ERROR: Failed to link payment to subscription:', linkError);
              } else {
                console.log('Payment linked to subscription');
              }
            }
          }
        }

        console.log('Updating user profile with subscription tier');
        const { error: profileError } = await supabaseClient
          .from('profiles')
          .update({
            subscription_tier: tier,
            subscription_expires_at: endDate.toISOString(),
          })
          .eq('id', userId);

        if (profileError) {
          console.error('ERROR: Failed to update profile:', profileError);
        } else {
          console.log('SUCCESS: Profile updated with subscription tier');
        }
      } else if (paymentType === 'course' && courseId) {
        console.log('--- Processing COURSE payment ---');
        console.log('Creating course purchase for course:', courseId);

        const { error: purchaseError } = await supabaseClient.from('course_purchases').insert({
          user_id: userId,
          course_id: courseId,
          price_paid: parseFloat(payment.amount),
          purchased_at: new Date().toISOString(),
        });

        if (purchaseError) {
          console.error('ERROR: Failed to create course purchase:', purchaseError);
        } else {
          console.log('SUCCESS: Course purchase created');
          const { error: linkError } = await supabaseClient
            .from('payments')
            .update({ course_id: courseId })
            .eq('id', payment.id);

          if (linkError) {
            console.error('ERROR: Failed to link payment to course:', linkError);
          } else {
            console.log('Payment linked to course');
          }
        }
      } else {
        console.log('WARNING: Unknown payment type or missing course_id');
      }

      console.log('=== Payment processing completed successfully ===');
    }

    return new Response(
      JSON.stringify({ code: 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ code: 13 }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
