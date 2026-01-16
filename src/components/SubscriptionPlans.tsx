import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Crown, Check } from 'lucide-react';

interface PricingTier {
  id: string;
  tier: 'basic' | 'premium';
  name: string;
  price: number;
  duration_days: number;
  features: string[];
}

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PricingTier[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [plansResult, subscriptionResult] = await Promise.all([
        supabase
          .from('pricing_tiers')
          .select('*')
          .order('price', { ascending: true }),
        supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', user!.id)
          .eq('is_active', true)
          .maybeSingle()
      ]);

      if (plansResult.data) {
        setPlans(plansResult.data);
      }

      if (subscriptionResult.data) {
        setCurrentSubscription(subscriptionResult.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (tier: 'basic' | 'premium', durationDays: number) => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);

      if (currentSubscription) {
        const { error } = await supabase
          .from('user_subscriptions')
          .update({ is_active: false })
          .eq('id', currentSubscription.id);

        if (error) throw error;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .insert({
          user_id: user!.id,
          tier: tier,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          is_active: true
        });

      if (!error) {
        await loadData();
        alert('Подписка успешно активирована!');
      }
    } catch (error) {
      console.error('Error purchasing subscription:', error);
      alert('Ошибка при активации подписки');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Выберите тариф
          </h1>
          <p className="text-lg text-slate-600">
            Получите доступ ко всем возможностям платформы
          </p>
        </div>

        {currentSubscription && (
          <div className="max-w-2xl mx-auto mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  У вас активна подписка{' '}
                  <span className="font-bold">
                    {currentSubscription.tier === 'premium' ? 'Premium' : 'Basic'}
                  </span>
                </p>
                <p className="text-sm text-blue-700">
                  Действует до{' '}
                  {new Date(currentSubscription.end_date).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.tier === plan.tier;
            const isPremium = plan.tier === 'premium';

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg border-2 overflow-hidden transition-all hover:shadow-xl ${
                  isPremium
                    ? 'border-gradient-to-br from-purple-500 to-pink-500'
                    : 'border-slate-200'
                }`}
              >
                {isPremium && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                    Популярный
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      isPremium
                        ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                        : 'bg-blue-500'
                    }`}>
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-900">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {plan.duration_days} дней
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-slate-900">
                        {plan.price}
                      </span>
                      <span className="text-lg text-slate-600">₽</span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className={`w-5 h-5 flex-shrink-0 ${
                          isPremium ? 'text-purple-500' : 'text-blue-500'
                        }`} />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handlePurchase(plan.tier, plan.duration_days)}
                    disabled={isCurrentPlan}
                    className={`w-full py-3 rounded-lg font-semibold transition-all ${
                      isCurrentPlan
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : isPremium
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg hover:scale-105'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isCurrentPlan ? 'Текущий тариф' : 'Выбрать тариф'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <Crown className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Тарифы пока не настроены</p>
          </div>
        )}
      </div>
    </div>
  );
}
