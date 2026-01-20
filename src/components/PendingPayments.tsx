import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

interface PendingPayment {
  id: string;
  yookassa_payment_id: string;
  amount: string;
  payment_type: string;
  created_at: string;
  metadata: any;
}

export default function PendingPayments() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadPendingPayments();
  }, []);

  const loadPendingPayments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error('Error loading pending payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmPayment = async (paymentId: string) => {
    try {
      setProcessing(paymentId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Необходимо войти в систему');
        return;
      }

      const confirmUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/confirm-payment`;

      console.log('Confirming payment:', paymentId);

      const response = await fetch(confirmUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_id: paymentId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('Confirm result:', result);

      if (result.success) {
        alert('Платеж успешно подтвержден!');
        await loadPendingPayments();
        window.location.reload();
      } else {
        alert(`Ошибка: ${result.error || 'Не удалось подтвердить платеж'}`);
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      alert(`Ошибка: ${(error as Error).message}`);
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (payments.length === 0) {
    return null;
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-semibold text-amber-900 mb-1">
            Ожидающие подтверждения платежи
          </h3>
          <p className="text-sm text-amber-800">
            У вас есть {payments.length} платеж(ей), ожидающих подтверждения.
            Если оплата прошла успешно, нажмите кнопку подтверждения.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {payments.map((payment) => (
          <div
            key={payment.id}
            className="bg-white rounded-lg p-4 flex items-center justify-between"
          >
            <div className="flex-1">
              <div className="font-medium text-slate-900">
                {payment.payment_type === 'subscription'
                  ? `Подписка (${payment.metadata?.tier || 'basic'})`
                  : 'Покупка курса'}
              </div>
              <div className="text-sm text-slate-600">
                {payment.amount} ₽ • {new Date(payment.created_at).toLocaleString('ru-RU')}
              </div>
              <div className="text-xs text-slate-500 font-mono mt-1">
                ID: {payment.yookassa_payment_id}
              </div>
            </div>

            <button
              onClick={() => confirmPayment(payment.yookassa_payment_id)}
              disabled={processing === payment.yookassa_payment_id}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {processing === payment.yookassa_payment_id ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Обработка...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Подтвердить</span>
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
