import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
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
  OperationType?: string;
  InvoiceId?: string;
  AccountId?: string;
  Email?: string;
  Data?: string;
  TestMode?: boolean;
  Token?: string;
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

    console.log('CloudPayments webhook received:', notification);

    const invoiceId = notification.InvoiceId;
    const status = notification.Status;

    if (!invoiceId) {
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
      console.error('Payment not found:', invoiceId);
      return new Response(
        JSON.stringify({ code: 0 }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let newStatus = 'pending';
    if (status === 'Completed' || status === 'Authorized') {
      newStatus = 'succeeded';
    } else if (status === 'Declined' || status === 'Cancelled') {
      newStatus = 'failed';
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: newStatus,
        metadata: {
          ...payment.metadata,
          cloudpayments_transaction_id: notification.TransactionId,
          cloudpayments_status: status,
          card_first_six: notification.CardFirstSix,
          card_last_four: notification.CardLastFour,
          card_type: notification.CardType,
        }
      })
      .eq('yookassa_payment_id', invoiceId);

    if (updateError) {
      console.error('Failed to update payment:', updateError);
    }

    if (newStatus === 'succeeded') {
      const metadata = payment.metadata || {};
      const paymentType = payment.payment_type;
      const userId = payment.user_id;

      if (paymentType === 'subscription') {
        const tier = metadata.tier || 'basic';
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
        }
      } else if (paymentType === 'course' && payment.course_id) {
        const { error: purchaseError } = await supabase.from('course_purchases').insert({
          user_id: userId,
          course_id: payment.course_id,
          amount_paid: payment.amount,
          payment_id: payment.id,
        });

        if (purchaseError) {
          console.error('Failed to create course purchase:', purchaseError);
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
      JSON.stringify({ code: 0 }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
