import { useState, useEffect } from 'react';
import { Shield, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SubscriptionStatusProps {
  userId: string;
}

interface Subscription {
  id: string;
  tier: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export function SubscriptionStatus({ userId }: SubscriptionStatusProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    loadSubscription();
  }, [userId]);

  const loadSubscription = async () => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSubscription(data);
        const endDate = new Date(data.end_date);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(diffDays);
      }
    } catch (error) {
      console.error('Ошибка загрузки подписки:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'basic':
        return 'Базовый';
      case 'premium':
        return 'Премиум';
      default:
        return 'Бесплатный';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'premium':
        return 'from-yellow-500 to-orange-500';
      case 'basic':
        return 'from-blue-500 to-indigo-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-gray-400" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Бесплатный тариф
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              У вас нет активной подписки. Оформите подписку для доступа к премиум контенту.
            </p>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                window.dispatchEvent(new CustomEvent('navigate', { detail: 'pricing' }));
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              Выбрать тариф
            </a>
          </div>
        </div>
      </div>
    );
  }

  const isExpiringSoon = daysRemaining <= 7 && daysRemaining > 0;
  const isExpired = daysRemaining <= 0;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      <div className={`bg-gradient-to-r ${getTierColor(subscription.tier)} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-6 h-6" />
              <h3 className="text-xl font-bold">
                Тариф: {getTierLabel(subscription.tier)}
              </h3>
            </div>
            <p className="text-white/90 text-sm">
              Активная подписка
            </p>
          </div>
          <CheckCircle className="w-12 h-12 text-white/80" />
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start space-x-3">
          <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Дата начала</p>
            <p className="text-base font-medium text-gray-900">
              {formatDate(subscription.start_date)}
            </p>
          </div>
        </div>

        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Действует до</p>
            <p className="text-base font-medium text-gray-900">
              {formatDate(subscription.end_date)}
            </p>
          </div>
        </div>

        {isExpired && (
          <div className="flex items-start space-x-3 bg-red-50 border border-red-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 mb-1">
                Подписка истекла
              </p>
              <p className="text-sm text-red-700 mb-3">
                Ваша подписка закончилась. Продлите её для доступа к премиум контенту.
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'pricing' }));
                }}
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
              >
                Продлить подписку
              </a>
            </div>
          </div>
        )}

        {isExpiringSoon && !isExpired && (
          <div className="flex items-start space-x-3 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 mb-1">
                Подписка скоро истечёт
              </p>
              <p className="text-sm text-yellow-700 mb-3">
                До окончания подписки осталось {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}.
              </p>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent('navigate', { detail: 'pricing' }));
                }}
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Продлить подписку
              </a>
            </div>
          </div>
        )}

        {!isExpired && !isExpiringSoon && (
          <div className="flex items-start space-x-3 bg-green-50 border border-green-200 rounded-lg p-4">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-900">
                Подписка активна
              </p>
              <p className="text-sm text-green-700">
                Осталось {daysRemaining} {daysRemaining === 1 ? 'день' : daysRemaining < 5 ? 'дня' : 'дней'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
