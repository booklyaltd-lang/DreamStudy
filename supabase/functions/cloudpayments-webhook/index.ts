import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {corsHeaders} from '../_shared/cors.ts'

serve(async (req) => {
  try {
    // CORS заголовки
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Получение секретного ключа для валидации
    const CLOUDPAYMENTS_SECRET = Deno.env.get('CLOUDPAYMENTS_SECRET')
    if (!CLOUDPAYMENTS_SECRET) {
      return new Response(JSON.stringify({ error: 'Missing CloudPayments secret' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Чтение тела запроса
    const body = await req.text()
    
    // Валидация подписи запроса
    const signature = req.headers.get('Content-HMAC') || req.headers.get('X-Content-HMAC')
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Webhook received:', body)
    
    // Определение типа уведомления
    const notificationType = req.headers.get('CloudPayments-Notification-Type')
    
    // Обработка уведомления об успешной оплате
    if (notificationType === 'pay') {
      const payload = JSON.parse(body)
      const transactionId = payload.TransactionId
      const accountId = payload.AccountId // email пользователя
      const invoiceId = payload.InvoiceId // ID заказа
      const amount = payload.Amount
      const description = payload.Description
      
      // Поиск пользователя по email
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', accountId)
        .single()
      
      if (userError || !user) {
        console.error('User not found:', userError)
        return new Response(JSON.stringify({ error: 'User not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Поиск заказа для определения типа покупки
      const { data: order, error: orderError } = await supabase
        .from('payments')
        .select(`
          id,
          course_id,
          pricing_tier_id,
          amount,
          status
        `)
        .eq('invoice_id', invoiceId)
        .single()

      if (orderError || !order) {
        console.error('Order not found:', orderError)
        return new Response(JSON.stringify({ error: 'Order not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Обновление статуса платежа
      const { error: updatePaymentError } = await supabase
        .from('payments')
        .update({
          status: 'completed',
          transaction_id: transactionId.toString(),
          payment_data: payload,
          updated_at: new Date().toISOString()
        })
        .eq('id', order.id)

      if (updatePaymentError) {
        console.error('Error updating payment status:', updatePaymentError)
        return new Response(JSON.stringify({ error: 'Failed to update payment status' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      // Если куплен курс
      if (order.course_id) {
        const { error: purchaseError } = await supabase
          .from('course_purchases')
          .upsert({
            user_id: user.id,
            course_id: order.course_id,
            payment_id: order.id,
            purchased_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,course_id'
          })

        if (purchaseError) {
          console.error('Error recording course purchase:', purchaseError)
          return new Response(JSON.stringify({ error: 'Failed to record course purchase' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }
      
      // Если оформлена подписка
      if (order.pricing_tier_id) {
        // Рассчитываем дату окончания подписки (1 месяц)
        const now = new Date()
        const endDate = new Date(now)
        endDate.setMonth(endDate.getMonth() + 1)

        const { error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: user.id,
            pricing_tier_id: order.pricing_tier_id,
            payment_id: order.id,
            starts_at: now.toISOString(),
            ends_at: endDate.toISOString(),
            status: 'active'
          }, {
            onConflict: 'user_id,pricing_tier_id'
          })

        if (subscriptionError) {
          console.error('Error recording subscription:', subscriptionError)
          return new Response(JSON.stringify({ error: 'Failed to record subscription' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      }

      console.log('Payment processed successfully for user:', accountId)
      
      // Успешный ответ для CloudPayments
      return new Response(JSON.stringify({ code: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
    
    console.log('Unhandled notification type:', notificationType)
    return new Response(JSON.stringify({ code: 0, message: 'Notification type not handled' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})