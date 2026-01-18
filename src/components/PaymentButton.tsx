import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        if (data.error && data.error.includes('YooKassa credentials not configured')) {
          setError('Платежная система не настроена. Обратитесь к администратору.');
        } else {
          setError(data.error || 'Ошибка при создании платежа');
        }
        return;
      }

      if (data.confirmation_url) {
        window.location.href = data.confirmation_url;
      } else {
        setError('Не получен URL для оплаты');
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError('Произошла ошибка при создании платежа');
    } finally {
      setLoading(false);
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
