import { BuildingOfficeIcon, PhoneIcon, MapPinIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

export default function SitesList({ sites, onSelect, onDelete }) {
  if (!sites || sites.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <BuildingOfficeIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
        <p>Nessun cantiere estratto ancora</p>
        <p className="text-sm mt-2">Carica la prima foto per iniziare!</p>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    const badges = {
      completed: { icon: <CheckCircleIcon className="w-4 h-4" />, label: 'Completato', color: 'bg-green-100 text-green-800' },
      processing: { icon: '⏳', label: 'In elaborazione', color: 'bg-yellow-100 text-yellow-800' },
      failed: { icon: <XCircleIcon className="w-4 h-4" />, label: 'Fallito', color: 'bg-red-100 text-red-800' },
      pending: { icon: '⏸️', label: 'In attesa', color: 'bg-gray-100 text-gray-800' }
    }
    const badge = badges[status] || badges.pending
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.icon}
        {badge.label}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {sites.map((site) => (
        <div
          key={site.id}
          className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white"
          onClick={() => onSelect(site)}
        >
          <div className="flex gap-4">
            {/* Thumbnail */}
            <div className="flex-shrink-0">
              <img
                src={`http://localhost:5002/${site.image_path}`}
                alt="Cartello cantiere"
                className="w-24 h-24 object-cover rounded-lg border border-gray-200"
              />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                    {site.company_name || 'Azienda non identificata'}
                  </h3>
                  {site.legal_name && site.legal_name !== site.company_name && (
                    <p className="text-sm text-gray-600 break-words">{site.legal_name}</p>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(site.extraction_status)}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700">
                {site.phone_number && (
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${site.phone_number}`} className="hover:text-primary-600">
                      {site.phone_number}
                    </a>
                  </div>
                )}

                {site.city && (
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="w-4 h-4 text-gray-400" />
                    <span>{site.city}{site.province && ` (${site.province})`}</span>
                  </div>
                )}

                {site.vat_number && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🆔</span>
                    <span>P.IVA: {site.vat_number}</span>
                  </div>
                )}

                {site.construction_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">🏗️</span>
                    <span className="truncate">{site.construction_type}</span>
                  </div>
                )}
              </div>

              {/* Meta info */}
              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Caricato: {new Date(site.created_at).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                {site.perplexity_enriched && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    🌐 Arricchito
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(site.id)
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Elimina"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
