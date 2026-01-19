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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const notification: CloudPaymentsNotification = await req.json();

    console.log('CloudPayments webhook received:', {
      TransactionId: notification.TransactionId,
      InvoiceId: notification.InvoiceId,
      Status: notification.Status,
      Amount: notification.Amount,
    });

    const invoiceId = notification.InvoiceId;

    if (!invoiceId) {
      console.log('No InvoiceId in notification');
      return new Response(
        JSON.stringify({ code: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('yookassa_payment_id', invoiceId)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('Payment not found for InvoiceId:', invoiceId, paymentError);
      return new Response(
        JSON.stringify({ code: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let newStatus = 'pending';
    if (notification.Status === 'Completed' || notification.Status === 'Authorized') {
      newStatus = 'succeeded';
    } else if (notification.Status === 'Declined' || notification.Status === 'Cancelled') {
      newStatus = 'failed';
    }

    console.log('Updating payment status to:', newStatus);

    const { error: updateError } = await supabase
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
      console.error('Failed to update payment:', updateError);
      return new Response(
        JSON.stringify({ code: 13 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (newStatus === 'succeeded') {
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

      console.log('Processing successful payment:', { paymentType, userId, tier, courseId });

      if (paymentType === 'subscription') {
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 1);

        const { error: subError } = await supabase.from('subscriptions').upsert({
          user_id: userId,
          tier: tier,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
        }, {
          onConflict: 'user_id',
        });

        if (subError) {
          console.error('Failed to create subscription:', subError);
        } else {
          console.log('Subscription created successfully');
        }
      } else if (paymentType === 'course' && courseId) {
        const { error: purchaseError } = await supabase.from('course_purchases').insert({
          user_id: userId,
          course_id: courseId,
          amount_paid: payment.amount,
          payment_id: payment.id,
        });

        if (purchaseError) {
          console.error('Failed to create course purchase:', purchaseError);
        } else {
          console.log('Course purchase created successfully');
        }
      }
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
