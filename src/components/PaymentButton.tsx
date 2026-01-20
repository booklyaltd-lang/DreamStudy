import React, { useState, useEffect } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PaymentButtonProps {
  amount: number;
  paymentType: 'subscription' | 'course';
  tier?: 'basic' | 'premium';
  courseId?: string;
  description: string;
  buttonText?: string;
  disabled?: boolean;
  className?: string;
}

declare global {
  interface Window {
    cp?: any;
  }
}

export default function PaymentButton({
  amount,
  paymentType,
  tier,
  courseId,
  description,
  buttonText = 'Оплатить',
  disabled = false,
  className = '',
}: PaymentButtonProps) {
  const { refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    if (!document.getElementById('cloudpayments-widget')) {
      const script = document.createElement('script');
      script.id = 'cloudpayments-widget';
      script.src = 'https://widget.cloudpayments.ru/bundles/cloudpayments.js';
      script.async = true;
      script.onload = () => setWidgetLoaded(true);
      document.body.appendChild(script);
    } else {
      setWidgetLoaded(true);
    }
  }, []);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Необходимо войти в систему');
        return;
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`;

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          payment_type: paymentType,
          tier,
          course_id: courseId,
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Payment creation failed:', {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details
        });

        if (data.error && (data.error.includes('credentials not configured') || data.error.includes('Payment system is disabled'))) {
          setError('Платежная система не настроена. Обратитесь к администратору.');
        } else if (data.details) {
          setError(`${data.error || 'Ошибка при создании платежа'}: ${data.details}`);
        } else {
          setError(data.error || 'Ошибка при создании платежа');
        }
        return;
      }

      console.log('Payment creation response:', data);
      console.log('Has widget_data?', !!data.widget_data);
      console.log('Has confirmation_url?', !!data.confirmation_url);
      console.log('Widget loaded?', widgetLoaded);
      console.log('window.cp exists?', !!window.cp);

      if (data.widget_data) {
        if (!widgetLoaded || !window.cp) {
          setError('Виджет оплаты не загружен. Пожалуйста, обновите страницу.');
          setLoading(false);
          return;
        }

        console.log('Creating CloudPayments widget...');
        console.log('window.cp:', window.cp);
        console.log('window.cp.CloudPayments:', window.cp.CloudPayments);

        try {
          console.log('Full widget_data:', JSON.stringify(data.widget_data, null, 2));

          const widget = new window.cp.CloudPayments();
          console.log('Widget created:', widget);
          console.log('typeof widget.pay:', typeof widget.pay);

          const invoiceId = data.widget_data.invoiceId;
          const payOptions = {
            publicId: data.widget_data.publicId,
            description: data.widget_data.description,
            amount: data.widget_data.amount,
            currency: data.widget_data.currency,
            invoiceId: invoiceId,
            accountId: data.widget_data.accountId,
            email: data.widget_data.email,
            skin: "mini",
            data: data.widget_data.data,
          };

          console.log('Pay options:', payOptions);

          const callbacks = {
            onSuccess: async function(options: any) {
              console.log('[PaymentButton] CloudPayments success callback:', options);
              console.log('[PaymentButton] Invoice ID:', invoiceId);

              try {
                const { data: { session } } = await supabase.auth.getSession();

                if (!session) {
                  console.error('[PaymentButton] No session found after payment');
                  alert('Ошибка: сессия истекла. Пожалуйста, войдите снова.');
                  setLoading(false);
                  return;
                }

                console.log('[PaymentButton] Session found, calling confirm-payment');

                const confirmUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`;

                console.log('[PaymentButton] Confirm URL:', confirmUrl);
                console.log('[PaymentButton] Payment ID:', invoiceId);

                const confirmResponse = await fetch(confirmUrl, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    payment_id: invoiceId,
                  }),
                });

                console.log('[PaymentButton] Confirm response status:', confirmResponse.status);

                if (!confirmResponse.ok) {
                  const errorText = await confirmResponse.text();
                  console.error('[PaymentButton] Confirm payment failed:', errorText);
                  alert(`Ошибка подтверждения платежа: ${errorText}`);
                  setLoading(false);
                  return;
                }

                const confirmResult = await confirmResponse.json();
                console.log('[PaymentButton] Confirm payment result:', confirmResult);

                if (!confirmResult.success) {
                  console.error('[PaymentButton] Payment confirmation returned false');
                  alert(`Ошибка: ${confirmResult.error || 'Не удалось подтвердить платеж'}`);
                  setLoading(false);
                  return;
                }

                console.log('[PaymentButton] Payment confirmed successfully, refreshing profile');
                await refreshProfile();
                console.log('[PaymentButton] Profile refreshed, redirecting');
              } catch (err) {
                console.error('[PaymentButton] Error confirming payment:', err);
                alert(`Ошибка при обработке платежа: ${(err as Error).message}`);
                setLoading(false);
                return;
              }

              setLoading(false);
              window.location.href = '/payment-success';
            },
            onFail: function(reason: string, options: any) {
              console.error('Payment failed:', reason, options);
              setError(`Ошибка оплаты: ${reason}`);
              setLoading(false);
            },
            onComplete: function(paymentResult: any, options: any) {
              console.log('Payment complete:', paymentResult, options);
            }
          };

          console.log('About to call widget.pay...');

          widget.pay('charge', payOptions, callbacks);

          console.log('Widget.pay called - waiting for callbacks...');
        } catch (err) {
          console.error('Error with CloudPayments widget:', err);
          console.error('Error stack:', (err as Error).stack);
          setError('Ошибка при открытии окна оплаты: ' + (err as Error).message);
          setLoading(false);
        }
        return;
      } else if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        setError('Не получен URL для оплаты');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Произошла ошибка при создании платежа');
    } finally {
      if (!error) {
        setLoading(false);
      }
    }
  };

  return (
    <div>
      <button
        onClick={handlePayment}
        disabled={disabled || loading}
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
          disabled || loading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        } ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Обработка...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-5 h-5" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {error && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
