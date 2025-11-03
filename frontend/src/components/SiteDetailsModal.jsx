import { XMarkIcon } from '@heroicons/react/24/outline'
import { useEffect, useState } from 'react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002'

export default function SiteDetailsModal({ site, onClose }) {
  const [fullData, setFullData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadFullData = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/sites/${site.id}`)
        setFullData(response.data.site)
      } catch (error) {
        console.error('Errore caricamento dettagli:', error)
      } finally {
        setLoading(false)
      }
    }
    loadFullData()
  }, [site.id])

  const data = fullData || site

  const InfoRow = ({ label, value, icon }) => {
    if (!value) return null
    return (
      <div className="py-2 border-b border-gray-100 last:border-0">
        <div className="flex gap-2">
          {icon && <span className="text-gray-400">{icon}</span>}
          <div className="flex-1">
            <span className="text-sm text-gray-500">{label}</span>
            <p className="text-gray-900 font-medium">{value}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {data.company_name || 'Dettagli Cantiere'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Caricamento dettagli...</p>
            </div>
          ) : (
            <>
              {/* Immagine */}
              <div className="rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={`${API_BASE}/${data.image_path}`}
                  alt="Cartello cantiere"
                  className="w-full h-auto"
                />
              </div>

              {/* Informazioni Azienda */}
              <div className="card">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">🏢 Informazioni Azienda</h3>
                <div className="space-y-1">
                  <InfoRow label="Nome Commerciale" value={data.company_name} icon="📛" />
                  <InfoRow label="Ragione Sociale" value={data.legal_name} icon="🏛️" />
                  <InfoRow label="Partita IVA" value={data.vat_number} icon="🆔" />
                  <InfoRow label="Codice Fiscale" value={data.tax_code} icon="📄" />
                  <InfoRow label="Telefono" value={data.phone_number} icon="☎️" />
                  <InfoRow label="Cellulare" value={data.mobile_number} icon="📱" />
                  <InfoRow label="Email" value={data.email} icon="✉️" />
                  <InfoRow label="Sito Web" value={data.website} icon="🌐" />
                </div>
              </div>

              {/* Indirizzo */}
              {(data.address || data.city) && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📍 Indirizzo</h3>
                  <div className="space-y-1">
                    <InfoRow label="Indirizzo Completo" value={data.address} />
                    <InfoRow label="Città" value={data.city} />
                    <InfoRow label="Provincia" value={data.province} />
                    <InfoRow label="CAP" value={data.postal_code} />
                  </div>
                </div>
              )}

              {/* Dettagli Cantiere */}
              {(data.construction_type || data.construction_description) && (
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">🏗️ Dettagli Cantiere</h3>
                  <div className="space-y-1">
                    <InfoRow label="Tipo Lavori" value={data.construction_type} />
                    <InfoRow label="Descrizione" value={data.construction_description} />
                    <InfoRow label="Nome Progetto" value={data.project_name} />
                    {data.project_amount && (
                      <InfoRow
                        label="Importo Lavori"
                        value={`€ ${parseFloat(data.project_amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}`}
                        icon="💰"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Dati Arricchiti Perplexity */}
              {data.perplexity_enriched && (
                <div className="card bg-purple-50 border-2 border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4">🌐 Dati Arricchiti (Perplexity)</h3>
                  <div className="space-y-1">
                    <InfoRow label="Descrizione" value={data.company_description} />
                    <InfoRow label="Dimensione Azienda" value={data.company_size} />
                    <InfoRow label="Anno Fondazione" value={data.company_founded_year} />
                    <InfoRow label="Numero Dipendenti" value={data.company_employees} />
                    <InfoRow label="Settore" value={data.company_sector} />

                    {data.company_certifications && JSON.parse(data.company_certifications).length > 0 && (
                      <div className="py-2">
                        <span className="text-sm text-gray-500">Certificazioni</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {JSON.parse(data.company_certifications).map((cert, i) => (
                            <span key={i} className="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                              {cert}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Testo Grezzo */}
              {data.raw_text && (
                <div className="card bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Testo Estratto (Raw)</h3>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-white p-4 rounded border border-gray-200">
                    {data.raw_text}
                  </pre>
                </div>
              )}

              {/* Metadati */}
              <div className="card bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Metadati</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID Cantiere</span>
                    <p className="font-mono">{data.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Stato Estrazione</span>
                    <p className="font-semibold capitalize">{data.extraction_status}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Confidence Score</span>
                    <p>{data.confidence_score ? (data.confidence_score * 100).toFixed(0) + '%' : 'N/D'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tempo Elaborazione</span>
                    <p>{data.processing_time_ms ? (data.processing_time_ms / 1000).toFixed(2) + 's' : 'N/D'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Data Caricamento</span>
                    <p>{new Date(data.created_at).toLocaleString('it-IT')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Dimensione Immagine</span>
                    <p>{data.image_width} × {data.image_height}px</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end">
          <button onClick={onClose} className="btn-primary">
            Chiudi
          </button>
        </div>
      </div>
    </div>
  )
}
