import { useState, useEffect, useCallback } from 'react'

/**
 * useFormDraft — persists form state across page refreshes / app switches
 * Saves to sessionStorage on every change, restores on mount
 */
export function useFormDraft(key, initialState = {}) {
  const storageKey = `cerberus_draft_${key}`

  // Initialize from sessionStorage or default
  const [form, setFormRaw] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed && parsed._hasDraft) {
          // Remove stripped base64 media/document entries
          if (parsed.media && Array.isArray(parsed.media)) {
            parsed.media = parsed.media.filter(m => m.url && m.url !== '[base64-stripped]')
          }
          if (parsed.documents && Array.isArray(parsed.documents)) {
            parsed.documents = parsed.documents.filter(d => d.url && d.url !== '[base64-stripped]')
          }
          return parsed
        }
      }
    } catch {}
    return { ...initialState, _hasDraft: false }
  })

  const [modalState, setModalStateRaw] = useState(() => {
    try {
      const saved = sessionStorage.getItem(storageKey + '_modal')
      return saved || null
    } catch { return null }
  })

  // Save to sessionStorage on every form change
  // Strip large base64 data to avoid exceeding storage limits
  useEffect(() => {
    try {
      if (form._hasDraft) {
        const toSave = { ...form }
        // Keep media/doc URLs but strip base64 data
        if (toSave.media && Array.isArray(toSave.media)) {
          toSave.media = toSave.media.map(m => ({
            ...m,
            url: m.url?.startsWith('data:') ? '[base64-stripped]' : m.url,
          }))
        }
        if (toSave.documents && Array.isArray(toSave.documents)) {
          toSave.documents = toSave.documents.map(d => ({
            ...d,
            url: d.url?.startsWith('data:') ? '[base64-stripped]' : d.url,
          }))
        }
        sessionStorage.setItem(storageKey, JSON.stringify(toSave))
      }
    } catch {}
  }, [form, storageKey])

  useEffect(() => {
    try {
      if (modalState) {
        sessionStorage.setItem(storageKey + '_modal', modalState)
      } else {
        sessionStorage.removeItem(storageKey + '_modal')
      }
    } catch {}
  }, [modalState, storageKey])

  // Set form with draft flag
  const setForm = useCallback((newForm) => {
    if (typeof newForm === 'function') {
      setFormRaw(prev => ({ ...newForm(prev), _hasDraft: true }))
    } else {
      setFormRaw({ ...newForm, _hasDraft: true })
    }
  }, [])

  // Update single field
  const setField = useCallback((key, value) => {
    setFormRaw(prev => ({ ...prev, [key]: value, _hasDraft: true }))
  }, [])

  // Set modal state
  const setModalState = useCallback((state) => {
    setModalStateRaw(state)
  }, [])

  // Clear draft (call after successful save)
  const clearDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(storageKey)
      sessionStorage.removeItem(storageKey + '_modal')
    } catch {}
    setFormRaw({ ...initialState, _hasDraft: false })
    setModalStateRaw(null)
  }, [storageKey, initialState])

  // Check if there's a restored draft
  const hasDraft = form._hasDraft && modalState

  return { form, setForm, setField, modalState, setModalState, clearDraft, hasDraft }
}
