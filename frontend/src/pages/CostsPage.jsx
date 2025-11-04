import { useEffect, useState } from 'react'
import { CurrencyDollarIcon, ChartBarIcon, ClockIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002'

export default function CostsPage() {
  const [loading, setLoading] = useState(true)
  const [costData, setCostData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchCosts()
  }, [])

  const fetchCosts = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_BASE}/api/costs`)
      const data = await response.json()

      if (!data.success) {
        throw new Error('Errore caricamento costi')
      }

      setCostData(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getServiceName = (service) => {
    const names = {
      google_vision: '🔍 Google Vision',
      gemini: '🤖 Gemini 2.5',
      perplexity: '🌐 Perplexity Sonar'
    }
    return names[service] || service
  }

  const getServiceColor = (service) => {
    const colors = {
      google_vision: 'bg-blue-100 text-blue-800',
      gemini: 'bg-purple-100 text-purple-800',
      perplexity: 'bg-green-100 text-green-800'
    }
    return colors[service] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento statistiche costi...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">❌ {error}</p>
          <button
            onClick={fetchCosts}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Riprova
          </button>
        </div>
      </div>
    )
  }

  const { current_month } = costData

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">💰 Costi & Usage API</h1>
          <p className="text-gray-600">Monitora i costi delle API in tempo reale</p>
        </div>

        {/* Totale mese corrente */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border-l-4 border-primary-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Costo Totale Mese Corrente</p>
              <p className="text-4xl font-bold text-gray-900">
                ${current_month.total_cost_usd.toFixed(4)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {current_month.total_requests} richieste API totali
              </p>
            </div>
            <CurrencyDollarIcon className="w-16 h-16 text-primary-500 opacity-20" />
          </div>
        </div>

        {/* Crediti Perplexity */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl shadow-md p-6 mb-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-900 mb-1">🎁 Crediti Gratuiti Perplexity Pro</p>
              <p className="text-3xl font-bold text-green-700">
                ${current_month.perplexity_free_credits_remaining.toFixed(2)}
              </p>
              <p className="text-sm text-green-600 mt-1">
                rimanenti dei $5.00 mensili inclusi
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">Spesi questo mese</div>
              <div className="text-2xl font-semibold text-gray-800">
                ${(5 - current_month.perplexity_free_credits_remaining).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="bg-green-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-green-600 h-full transition-all duration-500"
                style={{
                  width: `${((5 - current_month.perplexity_free_credits_remaining) / 5) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Breakdown per servizio */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="w-6 h-6 text-primary-600" />
            Breakdown per Servizio
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {current_month.breakdown.map((service) => (
              <div
                key={service.service}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${getServiceColor(service.service)}`}>
                  {getServiceName(service.service)}
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      ${service.total_cost_usd.toFixed(4)}
                    </p>
                    <p className="text-xs text-gray-500">costo totale</p>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Richieste:</span>
                      <span className="font-medium">{service.request_count}</span>
                    </div>
                    {service.tokens_input > 0 && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Token input:</span>
                          <span className="font-medium">{service.tokens_input.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Token output:</span>
                          <span className="font-medium">{service.tokens_output.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ultime richieste */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="w-6 h-6 text-primary-600" />
            Ultime Richieste API
          </h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Servizio</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Azienda</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Costo</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Token</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Ora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {costData.recent_usage.map((usage, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getServiceColor(usage.service)}`}>
                        {getServiceName(usage.service)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {usage.company_name || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      ${usage.cost_usd.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {usage.tokens_input > 0 ? (
                        <span>{usage.tokens_input} → {usage.tokens_output}</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(usage.timestamp).toLocaleString('it-IT')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Link dashboard API reali */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🔗 Dashboard API Ufficiali</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="https://console.cloud.google.com/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div>
                <p className="font-medium text-gray-900 group-hover:text-primary-600">Google Cloud Billing</p>
                <p className="text-sm text-gray-500">Vision & Gemini API</p>
              </div>
              <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </a>

            <a
              href="https://www.perplexity.ai/settings/api"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div>
                <p className="font-medium text-gray-900 group-hover:text-primary-600">Perplexity API</p>
                <p className="text-sm text-gray-500">Usage & Billing</p>
              </div>
              <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </a>

            <a
              href="https://dashboard.render.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:shadow-md transition-all group"
            >
              <div>
                <p className="font-medium text-gray-900 group-hover:text-primary-600">Render Dashboard</p>
                <p className="text-sm text-gray-500">Hosting & Logs</p>
              </div>
              <ArrowTopRightOnSquareIcon className="w-5 h-5 text-gray-400 group-hover:text-primary-600" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
