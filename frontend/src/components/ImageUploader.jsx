import { useState, useRef } from 'react'
import axios from 'axios'
import { PhotoIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002'

export default function ImageUploader({ onSuccess }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Valida tipo file
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/heic']
    if (!validTypes.includes(selectedFile.type)) {
      setError('Tipo file non supportato. Usa JPG, PNG, WEBP o HEIC')
      return
    }

    // Valida dimensione (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File troppo grande. Max 10MB')
      return
    }

    setFile(selectedFile)
    setError(null)
    setResult(null)

    // Crea preview
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(selectedFile)
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)
    setProgress(0)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('image', file)

    try {
      const response = await axios.post(`${API_BASE}/api/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setProgress(percentCompleted)
        }
      })

      setResult(response.data)
      onSuccess?.(response.data)

      // Reset dopo 3 secondi
      setTimeout(() => {
        resetForm()
      }, 3000)

    } catch (err) {
      setError(err.response?.data?.message || 'Errore durante upload')
    } finally {
      setUploading(false)
    }
  }

  const resetForm = () => {
    setFile(null)
    setPreview(null)
    setProgress(0)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      // Simula evento change
      const event = { target: { files: [droppedFile] } }
      handleFileSelect(event)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      {!preview && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-all"
        >
          <PhotoIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Trascina qui la foto o clicca per selezionare
          </p>
          <p className="text-sm text-gray-500">
            JPG, PNG, WEBP, HEIC - Max 10MB
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Preview */}
      {preview && !result && (
        <div className="space-y-4">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-96 object-contain rounded-lg border-2 border-gray-200"
            />
            {!uploading && (
              <button
                onClick={resetForm}
                className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 text-sm"
              >
                ✕ Rimuovi
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <PhotoIcon className="w-5 h-5 text-gray-500" />
            <span className="text-sm text-gray-700 flex-1">{file.name}</span>
            <span className="text-xs text-gray-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>

          {!uploading && (
            <button
              onClick={handleUpload}
              className="w-full btn-primary py-4 text-lg font-semibold flex items-center justify-center gap-2"
            >
              <ArrowUpTrayIcon className="w-6 h-6" />
              🚀 Analizza Cartello
            </button>
          )}
        </div>
      )}

      {/* Progress */}
      {uploading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-700 font-medium">
              {progress < 100 ? '📤 Caricamento...' : '🤖 Analisi AI in corso...'}
            </span>
            <span className="text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-primary-600 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center">
            Questo può richiedere 10-30 secondi...
          </p>
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 space-y-3">
          <div className="flex items-center gap-2 text-green-700 text-lg font-semibold">
            ✅ Estrazione completata!
          </div>
          <div className="text-sm text-gray-700 space-y-1">
            <p>🏢 <strong>Azienda:</strong> {result.data.company_name || 'Non trovata'}</p>
            <p>📱 <strong>Telefono:</strong> {result.data.phone_number || 'N/D'}</p>
            <p>🆔 <strong>P.IVA:</strong> {result.data.vat_number || 'N/D'}</p>
            <p>⏱️ <strong>Tempo elaborazione:</strong> {(result.processing_time / 1000).toFixed(2)}s</p>
            {result.data.enriched?.found && (
              <p>🌐 <strong>Dati arricchiti:</strong> ✅ Sì</p>
            )}
          </div>
          <button
            onClick={resetForm}
            className="w-full btn-primary mt-4"
          >
            📸 Carica Altra Foto
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <p className="text-red-700 font-medium">❌ {error}</p>
          <button
            onClick={resetForm}
            className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
          >
            Riprova
          </button>
        </div>
      )}
    </div>
  )
}
