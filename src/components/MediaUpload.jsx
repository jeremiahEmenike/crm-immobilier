import { useRef, useState } from 'react'
import { Upload, X, Image, Film, FileText, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Upload to Supabase Storage ────────────
async function uploadToStorage(bucket, file, tenantId) {
  const ext = file.name.split('.').pop()
  const path = `${tenantId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) throw error

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path)
  return urlData.publicUrl
}

// ─── Fallback: convert to base64 ───────────
function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ─── Photo/Video Upload ────────────────────
export function MediaUpload({ files = [], onChange, max = 10, tenantId, accept = 'image/*,video/*' }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    setUploading(true)

    const newFiles = [...files]

    for (const file of selected) {
      if (newFiles.length >= max) break
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) continue

      try {
        // Try Supabase Storage first, fallback to base64
        let url
        try {
          url = await uploadToStorage('property-images', file, tenantId)
        } catch {
          url = await toBase64(file)
        }

        newFiles.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          url,
          name: file.name,
          type: file.type,
          size: file.size,
        })
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    onChange(newFiles)
    setUploading(false)
    e.target.value = ''
  }

  const remove = (id) => onChange(files.filter(f => f.id !== id))

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-4 gap-2.5">
        {files.map((f) => (
          <div key={f.id} className="relative group aspect-square rounded-lg overflow-hidden bg-dark-500 border border-dark-400">
            {f.type?.startsWith('video/') ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                <Film size={20} className="text-dark-200" />
                <span className="text-[9px] text-dark-200 px-1 truncate max-w-full">{f.name}</span>
              </div>
            ) : (
              <img src={f.url} className="w-full h-full object-cover" alt={f.name} />
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />

            {/* Remove */}
            <button
              onClick={() => remove(f.id)}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
            >
              <X size={12} />
            </button>

            {/* Size badge */}
            {f.size && (
              <div className="absolute bottom-1.5 left-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                {formatSize(f.size)}
              </div>
            )}
          </div>
        ))}

        {/* Add button */}
        {files.length < max && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-dark-400 hover:border-dark-300 hover:bg-dark-500/50 flex flex-col items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 size={18} className="text-dark-200 animate-spin" />
            ) : (
              <>
                <Upload size={18} className="text-dark-200" />
                <span className="text-[10px] text-dark-200">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple
        hidden
        onChange={handleFiles}
      />

      {/* Counter */}
      <div className="flex items-center gap-3 mt-2.5 text-[11px] text-dark-200">
        <span className="flex items-center gap-1">
          <Image size={11} /> <Film size={11} />
          {files.length}/{max} fichiers
        </span>
        {uploading && <span className="text-brand-500">Upload en cours...</span>}
      </div>
    </div>
  )
}

// ─── Document Upload (for FAQs) ────────────
export function DocumentUpload({ files = [], onChange, max = 5, tenantId }) {
  const ref = useRef()
  const [uploading, setUploading] = useState(false)

  const handleFiles = async (e) => {
    const selected = Array.from(e.target.files)
    if (!selected.length) return
    setUploading(true)

    const newFiles = [...files]

    for (const file of selected) {
      if (newFiles.length >= max) break

      try {
        let url
        try {
          url = await uploadToStorage('faq-documents', file, tenantId)
        } catch {
          url = await toBase64(file)
        }

        newFiles.push({
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
          url,
          name: file.name,
          type: file.type,
          size: file.size,
        })
      } catch (err) {
        console.error('Upload error:', err)
      }
    }

    onChange(newFiles)
    setUploading(false)
    e.target.value = ''
  }

  const remove = (id) => onChange(files.filter(f => f.id !== id))

  const formatSize = (bytes) => {
    if (!bytes) return ''
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const getIcon = (type) => {
    if (type?.startsWith('image/')) return Image
    if (type?.includes('pdf')) return FileText
    return FileText
  }

  return (
    <div>
      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-2 mb-3">
          {files.map((f) => {
            const Icon = getIcon(f.type)
            return (
              <div key={f.id} className="flex items-center gap-3 bg-dark-500 rounded-lg px-3 py-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-dark-400 flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-dark-100" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">{f.name}</div>
                  <div className="text-[10px] text-dark-200">{formatSize(f.size)}</div>
                </div>
                <button
                  onClick={() => remove(f.id)}
                  className="p-1 rounded hover:bg-dark-400 text-dark-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Upload button */}
      {files.length < max && (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={uploading}
          className="w-full py-3 rounded-lg border-2 border-dashed border-dark-400 hover:border-dark-300 hover:bg-dark-500/50 flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 size={16} className="text-dark-200 animate-spin" />
          ) : (
            <>
              <Upload size={16} className="text-dark-200" />
              <span className="text-xs text-dark-200">Ajouter un document (PDF, image...)</span>
            </>
          )}
        </button>
      )}

      <input
        ref={ref}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp"
        multiple
        hidden
        onChange={handleFiles}
      />

      <div className="text-[11px] text-dark-200 mt-2">
        {files.length}/{max} documents · PDF, Word, Excel, Images
      </div>
    </div>
  )
}
