import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Plus, Trash2, Save, CreditCard, Key, Check, X } from 'lucide-react';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface PricingTier {
  id: string;
  name: string;
  slug: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  is_active: boolean;
  sort_order: number;
}

interface PaymentSettings {
  payment_provider: string;
  payment_api_key: string;
  payment_secret_key: string;
  payment_webhook_secret: string;
  payment_enabled: boolean;
}

export function FinancialManagement() {
  const [activeSection, setActiveSection] = useState<'pricing' | 'payment'>('pricing');

  return (
    <div>
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'pricing', name: 'Тарифные планы', icon: CreditCard },
            { id: 'payment', name: 'Платежная система', icon: Key }
          ].map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id as 'pricing' | 'payment')}
                className={`flex items-center space-x-2 py-3 border-b-2 transition-colors ${
                  activeSection === section.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{section.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {activeSection === 'pricing' && <PricingManagement />}
      {activeSection === 'payment' && <PaymentManagement />}
    </div>
  );
}

function PricingManagement() {
  const [tiers, setTiers] = useState<PricingTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setTiers(data || []);
    } catch (error) {
      console.error('Ошибка загрузки тарифов:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот тарифный план?')) return;

    try {
      const { error } = await supabase.from('pricing_tiers').delete().eq('id', id);
      if (error) throw error;
      fetchTiers();
    } catch (error: any) {
      alert('Ошибка удаления: ' + error.message);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка тарифов...</div>;
  }

  if (showForm) {
    return (
      <TierForm
        tier={editingTier}
        onClose={() => {
          setShowForm(false);
          setEditingTier(null);
          fetchTiers();
        }}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Тарифные планы</h2>
          <p className="text-sm text-gray-600 mt-1">Управление ценами и возможностями тарифов</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5" />
          <span>Добавить тариф</span>
        </button>
      </div>

      {tiers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">Тарифы не найдены</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`border-2 rounded-xl p-6 ${
                tier.is_active
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{tier.name}</h3>
                  <p className="text-sm text-gray-600">/{tier.slug}</p>
                </div>
                <div className="flex items-center space-x-2">
                  {tier.is_active ? (
                    <span className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      <Check className="h-3 w-3" />
                      <span>Активен</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1 px-2 py-1 bg-gray-200 text-gray-600 rounded text-xs font-medium">
                      <X className="h-3 w-3" />
                      <span>Неактивен</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {tier.price_monthly} ₽
                  <span className="text-lg font-normal text-gray-600">/мес</span>
                </div>
                <div className="text-sm text-gray-600">
                  {tier.price_yearly} ₽/год
                </div>
              </div>

              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Возможности:</p>
                <ul className="space-y-2">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start space-x-2 text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setEditingTier(tier);
                    setShowForm(true);
                  }}
                  className="flex-1 px-4 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 font-medium"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => handleDelete(tier.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  title="Удалить тариф"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TierForm({ tier, onClose }: { tier: PricingTier | null; onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    slug: tier?.slug || '',
    price_monthly: tier?.price_monthly || 0,
    price_yearly: tier?.price_yearly || 0,
    features: tier?.features || [],
    is_active: tier?.is_active ?? true,
    sort_order: tier?.sort_order || 0
  });
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addFeature = () => {
    if (newFeature.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, newFeature.trim()]
      });
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (tier) {
        const { error } = await supabase
          .from('pricing_tiers')
          .update(formData)
          .eq('id', tier.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('pricing_tiers')
          .insert([formData]);
        if (error) throw error;
      }
      onClose();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {tier ? 'Редактировать тариф' : 'Создать тариф'}
        </h2>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-600 hover:text-gray-900"
        >
          Отмена
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Название тарифа</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Premium"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Slug (URL)</label>
          <input
            type="text"
            required
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="premium"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Цена в месяц (₽)</label>
          <input
            type="number"
            required
            value={formData.price_monthly}
            onChange={(e) => setFormData({ ...formData, price_monthly: Number(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Цена в год (₽)</label>
          <input
            type="number"
            required
            value={formData.price_yearly}
            onChange={(e) => setFormData({ ...formData, price_yearly: Number(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Порядок сортировки</label>
          <input
            type="number"
            required
            value={formData.sort_order}
            onChange={(e) => setFormData({ ...formData, sort_order: Number(e.target.value) })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Статус</label>
          <select
            value={formData.is_active ? 'active' : 'inactive'}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Активен</option>
            <option value="inactive">Неактивен</option>
          </select>
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Возможности тарифа</label>
          <div className="flex space-x-2 mb-3">
            <input
              type="text"
              value={newFeature}
              onChange={(e) => setNewFeature(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Введите возможность..."
            />
            <button
              type="button"
              onClick={addFeature}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          <div className="space-y-2">
            {formData.features.map((feature, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm text-gray-700">{feature}</span>
                <button
                  type="button"
                  onClick={() => removeFeature(index)}
                  className="text-red-600 hover:bg-red-50 p-1 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="button"
          onClick={onClose}
          className="px-6 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-100"
        >
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {saving ? 'Сохранение...' : tier ? 'Обновить' : 'Создать'}
        </button>
      </div>
    </form>
  );
}

function PaymentManagement() {
  const [settings, setSettings] = useState<PaymentSettings>({
    payment_provider: 'stripe',
    payment_api_key: '',
    payment_secret_key: '',
    payment_webhook_secret: '',
    payment_enabled: false
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKeys, setShowKeys] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('payment_provider, payment_api_key, payment_secret_key, payment_webhook_secret, payment_enabled')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          payment_provider: data.payment_provider || 'stripe',
          payment_api_key: data.payment_api_key || '',
          payment_secret_key: data.payment_secret_key || '',
          payment_webhook_secret: data.payment_webhook_secret || '',
          payment_enabled: data.payment_enabled || false
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update(settings)
        .eq('id', (await supabase.from('site_settings').select('id').maybeSingle()).data?.id);

      if (error) throw error;
      alert('Настройки платежной системы сохранены');
    } catch (error: any) {
      alert('Ошибка сохранения: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Загрузка настроек...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Настройка платежной системы</h2>
        <p className="text-sm text-gray-600">
          Подключите платежную систему для приема оплаты от пользователей
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Key className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Безопасность API ключей</h3>
            <p className="text-sm text-blue-700">
              API ключи хранятся в зашифрованном виде. Никогда не делитесь ими с третьими лицами.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 bg-white p-6 rounded-lg border border-gray-200">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Провайдер платежей</label>
          <select
            value={settings.payment_provider}
            onChange={(e) => setSettings({ ...settings, payment_provider: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="stripe">Stripe</option>
            <option value="yookassa">ЮKassa (Яндекс.Касса)</option>
            <option value="paypal">PayPal</option>
            <option value="cloudpayments">CloudPayments</option>
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">API Key (Публичный ключ)</label>
            <button
              type="button"
              onClick={() => setShowKeys(!showKeys)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {showKeys ? 'Скрыть' : 'Показать'}
            </button>
          </div>
          <input
            type={showKeys ? 'text' : 'password'}
            value={settings.payment_api_key}
            onChange={(e) => setSettings({ ...settings, payment_api_key: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="pk_live_..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Secret Key (Секретный ключ)</label>
          <input
            type={showKeys ? 'text' : 'password'}
            value={settings.payment_secret_key}
            onChange={(e) => setSettings({ ...settings, payment_secret_key: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="sk_live_..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Webhook Secret</label>
          <input
            type={showKeys ? 'text' : 'password'}
            value={settings.payment_webhook_secret}
            onChange={(e) => setSettings({ ...settings, payment_webhook_secret: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="whsec_..."
          />
          <p className="text-xs text-gray-500 mt-1">
            Используется для проверки подлинности вебхуков от платежной системы
          </p>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.payment_enabled}
              onChange={(e) => setSettings({ ...settings, payment_enabled: e.target.checked })}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <span className="text-sm font-medium text-gray-900">Включить прием платежей</span>
              <p className="text-xs text-gray-500">Пользователи смогут оплачивать подписки и курсы</p>
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          <Save className="h-5 w-5" />
          <span>{saving ? 'Сохранение...' : 'Сохранить настройки'}</span>
        </button>
      </div>
    </div>
  );
}
