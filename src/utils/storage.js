import initialData from '../data/initialData.json'

const STORAGE_KEYS = {
  AGENDAMENTOS: 'lab_agendamentos',
  CONVENIOS: 'lab_convenios',
  FAILOVER_MODE: 'lab_failover_active',
}

export function getStorageData(key, fallbackData) {
  try {
    const data = localStorage.getItem(key)
    if (!data) {
      localStorage.setItem(key, JSON.stringify(fallbackData))
      return fallbackData
    }
    return JSON.parse(data)
  } catch (error) {
    console.error(`[STORAGE ERROR] Falha ao ler ${key}. Ativando recuperação após falha.`, error)
    localStorage.setItem(STORAGE_KEYS.FAILOVER_MODE, 'true')
    // Restaura os dados padrões em caso de corrupção
    localStorage.setItem(key, JSON.stringify(fallbackData))
    return fallbackData
  }
}

export function setStorageData(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    console.error(`[STORAGE ERROR] Falha ao salvar em ${key}:`, error)
  }
}

export function isFailoverActive() {
  return localStorage.getItem(STORAGE_KEYS.FAILOVER_MODE) === 'true'
}

export function resetStorageToDefaults() {
  localStorage.setItem(STORAGE_KEYS.AGENDAMENTOS, JSON.stringify(initialData.agendamentos))
  localStorage.setItem(STORAGE_KEYS.CONVENIOS, JSON.stringify(initialData.convenios))
  localStorage.removeItem(STORAGE_KEYS.FAILOVER_MODE)
  window.location.reload()
}

export { STORAGE_KEYS }