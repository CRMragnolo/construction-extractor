import { useState, useEffect } from 'react'
import axios from 'axios'
import ImageUploader from './components/ImageUploader'
import SitesList from './components/SitesList'
import SiteDetailsModal from './components/SiteDetailsModal'
import StatsCard from './components/StatsCard'
import { DocumentMagnifyingGlassIcon, BuildingOfficeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002'

function App() {
  const [sites, setSites] = useState([])
  const [stats, setStats] = useState(null)
  const [selectedSite, setSelectedSite] = useState(null)
  const [loading, setLoading] = useState(false)
  const [currentView, setCurrentView] = useState('upload') // 'upload' | 'list'

  // Carica lista cantieri
  const loadSites = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/sites`)
      setSites(response.data.sites || [])
    } catch (error) {
      console.error('Errore caricamento cantieri:', error)
    }
  }

  // Carica statistiche
  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/api/stats`)
      setStats(response.data.overall)
    } catch (error) {
      console.error('Errore caricamento stats:', error)
    }
  }

  useEffect(() => {
    loadSites()
    loadStats()
  }, [])

  const handleUploadSuccess = (newSite) => {
    loadSites()
    loadStats()
    setCurrentView('list')
  }

  const handleDelete = async (id) => {
    if (!confirm('Eliminare questo cantiere?')) return

    try {
      await axios.delete(`${API_BASE}/api/sites/${id}`)
      loadSites()
      loadStats()
    } catch (error) {
      alert('Errore durante eliminazione')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BuildingOfficeIcon className="w-10 h-10 text-primary-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Estrattore Info Cantieri
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  Carica foto di cartelli di cantiere e ottieni info automaticamente
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView('upload')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
              currentView === 'upload'
                ? 'bg-white text-primary-600 shadow-md'
                : 'bg-white/50 text-gray-600 hover:bg-white/70'
            }`}
          >
            📸 Carica Foto
          </button>
          <button
            onClick={() => setCurrentView('list')}
            className={`px-6 py-3 rounded-t-lg font-medium transition-all ${
              currentView === 'list'
                ? 'bg-white text-primary-600 shadow-md'
                : 'bg-white/50 text-gray-600 hover:bg-white/70'
            }`}
          >
            📋 Cantieri Estratti ({sites.length})
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 pb-12 sm:px-6 lg:px-8">
        <div className="bg-white rounded-b-lg rounded-tr-lg shadow-lg p-8">

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatsCard
                icon={<DocumentMagnifyingGlassIcon className="w-6 h-6" />}
                label="Totale Estratti"
                value={stats.total || 0}
                color="blue"
              />
              <StatsCard
                icon={<CheckCircleIcon className="w-6 h-6" />}
                label="Completati"
                value={stats.completed || 0}
                color="green"
              />
              <StatsCard
                icon={<XCircleIcon className="w-6 h-6" />}
                label="Falliti"
                value={stats.failed || 0}
                color="red"
              />
              <StatsCard
                icon={<BuildingOfficeIcon className="w-6 h-6" />}
                label="Arricchiti"
                value={stats.enriched || 0}
                color="purple"
              />
            </div>
          )}

          {/* Upload View */}
          {currentView === 'upload' && (
            <div>
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Carica Foto Cartello Cantiere
                </h2>
                <p className="text-gray-600">
                  Supporta JPG, PNG, WEBP, HEIC - Max 10MB
                </p>
              </div>

              <ImageUploader onSuccess={handleUploadSuccess} />

              <div className="mt-8 border-t pt-6">
                <h3 className="text-lg font-semibold mb-3">Come funziona?</h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>📸 <strong>Scatta o carica</strong> una foto del cartello di cantiere</li>
                  <li>🤖 <strong>L'AI analizza</strong> l'immagine ed estrae: nome ditta, P.IVA, telefono, indirizzo</li>
                  <li>🌐 <strong>Perplexity arricchisce</strong> i dati con info aggiuntive dall'azienda</li>
                  <li>💾 <strong>Tutto viene salvato</strong> nel database per consultazioni future</li>
                </ol>
              </div>
            </div>
          )}

          {/* List View */}
          {currentView === 'list' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Cantieri Estratti
                </h2>
                <button
                  onClick={loadSites}
                  className="btn-secondary text-sm"
                >
                  🔄 Ricarica
                </button>
              </div>

              <SitesList
                sites={sites}
                onSelect={setSelectedSite}
                onDelete={handleDelete}
              />
            </div>
          )}
        </div>
      </main>

      {/* Modal Dettagli */}
      {selectedSite && (
        <SiteDetailsModal
          site={selectedSite}
          onClose={() => setSelectedSite(null)}
        />
      )}
    </div>
  )
}

export default App
