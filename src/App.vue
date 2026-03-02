<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { usePlateStore } from './stores/plateStore'
import { 
  Dna, 
  Trash2, 
  Download, 
  ChevronRight, 
  Settings2, 
  History,
  Scan,
  LayoutGrid,
  Users
} from 'lucide-vue-next'

const store = usePlateStore()
const barcodeInput = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

onMounted(() => {
  store.initPlate()
  focusInput()
})

const focusInput = () => {
  inputRef.value?.focus()
}

const handleScan = () => {
  if (barcodeInput.value.trim()) {
    store.logBarcode(barcodeInput.value.trim())
    barcodeInput.value = ''
    focusInput()
  }
}

const handleKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Enter') {
    handleScan()
  } else if (e.key === 'Tab' || e.key === 'ArrowRight') {
    e.preventDefault()
    store.skipWell()
  }
}

// Keep focus on input unless explicitly clicking something else
watch(() => store.currentWellId, () => {
  focusInput()
})

const recentScans = ref<any[]>([])
watch(() => store.plate, (newPlate) => {
  const allScanned = Object.values(newPlate)
    .filter(w => w.barcode)
    .sort((a, b) => new Date(b.timestamp!).getTime() - new Date(a.timestamp!).getTime())
  recentScans.value = allScanned.slice(0, 5)
}, { deep: true })

</script>

<template>
  <div class="app-container">
    <header class="main-header glass-panel">
      <div class="brand">
        <div class="logo-icon">
          <Dna :size="24" color="var(--accent-primary)" />
        </div>
        <div class="brand-text">
          <h1>BioScanner <span>Pro</span></h1>
          <p>96-Well Specimen Intake</p>
        </div>
      </div>

      <div class="stats-overview">
        <div class="stat-card">
          <span class="label">Progress</span>
          <div class="progress-bar-container">
            <div 
              class="progress-fill" 
              :style="{ width: `${(store.scannedCount / 96) * 100}%` }"
            ></div>
          </div>
          <span class="value">{{ store.scannedCount }} / 96</span>
        </div>
      </div>

      <div class="header-actions">
        <button class="icon-btn" @click="store.clearPlate" title="Clear All">
          <Trash2 :size="20" />
        </button>
        <button class="primary-btn export-btn" @click="store.exportCSV">
          <Download :size="18" />
          <span>Export CSV</span>
        </button>
      </div>
    </header>

    <main class="content-grid">
      <!-- Left Sidebar: Controls -->
      <aside class="controls-panel">
        <div class="glass-panel panel-section scanner-box">
          <div class="section-header">
            <Scan :size="18" />
            <h2>Active Scan</h2>
          </div>

          <div class="plate-id-input">
            <label>Plate ID</label>
            <input 
              v-model="store.plateId"
              type="text"
              placeholder="Scan or enter plate ID..."
              class="plate-id-field"
            />
          </div>
          
          <div class="current-target">
            <div class="well-display">
              <span class="label">Target Well</span>
              <span class="id">{{ store.currentWellId }}</span>
            </div>
            <div class="well-status" :class="{ filled: store.plate[store.currentWellId]?.barcode }">
              {{ store.plate[store.currentWellId]?.barcode ? 'Occupied' : 'Ready' }}
            </div>
          </div>

          <div class="input-wrapper">
            <input 
              ref="inputRef"
              v-model="barcodeInput"
              type="text"
              placeholder="Scan barcode..."
              @keydown="handleKeydown"
            />
            <button class="submit-btn" @click="handleScan">
              <ChevronRight :size="20" />
            </button>
          </div>

          <div class="quick-actions">
            <button class="secondary-btn" @click="store.skipWell">
              Skip Well
              <span class="kb-hint">[Tab]</span>
            </button>
          </div>
        </div>

        <div class="glass-panel panel-section subjects-box">
          <div class="section-header">
            <Users :size="18" />
            <h2>Subject Assignment</h2>
          </div>
          <p class="subject-hint">Assign a subject ID for the entire {{ store.scanDirection === 'rows' ? 'row' : 'column' }}.</p>
          
          <div v-if="store.scanDirection === 'rows'" class="subject-grid">
            <div v-for="r in store.rows" :key="r" class="subject-item">
              <label>Row {{ r }}</label>
              <input 
                v-model="store.rowSubjectIds[r]" 
                type="text" 
                placeholder="Subject ID..." 
                class="subject-input"
              />
            </div>
          </div>
          <div v-else class="subject-grid">
            <div v-for="c in store.cols" :key="c" class="subject-item">
              <label>Col {{ c }}</label>
              <input 
                v-model="store.colSubjectIds[c]" 
                type="text" 
                placeholder="Subject ID..." 
                class="subject-input"
              />
            </div>
          </div>
        </div>

        <div class="glass-panel panel-section settings-box">
          <div class="section-header">
            <Settings2 :size="18" />
            <h2>Configuration</h2>
          </div>

          <div class="setting-item">
            <label>Scan Direction</label>
            <select v-model="store.scanDirection">
              <option value="rows">Rows (A1, A2, A3...)</option>
              <option value="columns">Columns (H1, G1, F1...)</option>
            </select>
          </div>

          <div class="setting-item toggle">
            <label class="checkbox-label">
              <input type="checkbox" v-model="store.autoAdvance">
              <span class="custom-checkbox"></span>
              Auto-advance
            </label>
          </div>

          <div class="setting-item toggle">
            <label class="checkbox-label">
              <input type="checkbox" v-model="store.exportEmpty">
              <span class="custom-checkbox"></span>
              Export empty wells
            </label>
          </div>
        </div>

        <div class="glass-panel panel-section history-box">
          <div class="section-header">
            <History :size="18" />
            <h2>Recent History</h2>
          </div>
          <ul class="history-list">
            <li v-for="scan in recentScans" :key="scan.id">
              <span class="h-well">{{ scan.id }}</span>
              <span class="h-barcode">{{ scan.barcode }}</span>
            </li>
            <li v-if="recentScans.length === 0" class="empty-state">No scans yet</li>
          </ul>
        </div>
      </aside>

      <!-- Right Side: Plate Visualization -->
      <section class="plate-view">
        <div class="glass-panel plate-card">
          <div class="section-header">
            <LayoutGrid :size="18" />
            <h2>96-Well Plate Layout</h2>
          </div>
          
          <div class="plate-grid-container">
            <div 
              class="grid-labels-top"
              :style="{ gridTemplateColumns: `40px repeat(${store.gridConfig.cols}, 1fr)` }"
            >
              <div class="spacer"></div>
              <div v-for="label in store.displayTopLabels" :key="label" class="col-label">{{ label }}</div>
            </div>
            
            <div class="grid-main">
              <div 
                class="grid-labels-left"
                :style="{ 
                  gridTemplateRows: `repeat(${store.gridConfig.rows}, 1fr)`,
                  gap: '0.4rem' 
                }"
              >
                <div v-for="label in store.displaySideLabels" :key="label" class="row-label">{{ label }}</div>
              </div>
              
              <div 
                class="wells-grid"
                :style="{ 
                  gridTemplateColumns: `repeat(${store.gridConfig.cols}, 1fr)`,
                  gridTemplateRows: `repeat(${store.gridConfig.rows}, 1fr)` 
                }"
              >
                <div 
                  v-for="well in store.displayWells" 
                  :key="well.id"
                  class="well-circle"
                  :class="{ 
                    active: store.currentWellId === well.id,
                    filled: well.barcode !== null
                  }"
                  @click="store.currentWellId = well.id"
                >
                  <span class="well-tooltip">{{ well.id }}: {{ well.barcode || 'Empty' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  height: 100vh;
}

.main-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 2rem;
  flex-shrink: 0;
}

.brand {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-icon {
  background: rgba(56, 189, 248, 0.1);
  padding: 0.75rem;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.brand-text h1 {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.01em;
}

.brand-text h1 span {
  background: var(--accent-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.brand-text p {
  font-size: 0.75rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stats-overview {
  flex: 1;
  max-width: 400px;
  margin: 0 2rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card .label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.progress-bar-container {
  flex: 1;
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid var(--border);
}

.progress-fill {
  height: 100%;
  background: var(--accent-gradient);
  transition: width 0.3s ease;
}

.stat-card .value {
  font-family: var(--font-mono);
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 60px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.icon-btn {
  background: transparent;
  color: var(--text-secondary);
  padding: 0.6rem;
  border-radius: 8px;
}

.icon-btn:hover {
  background: rgba(218, 54, 51, 0.1);
  color: var(--danger);
}

.primary-btn {
  background: var(--accent-gradient);
  color: white;
  padding: 0.6rem 1.25rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
}

.primary-btn:hover {
  box-shadow: 0 6px 16px rgba(56, 189, 248, 0.4);
  transform: translateY(-1px);
}

.content-grid {
  display: grid;
  grid-template-columns: 350px 1fr;
  gap: 1.5rem;
  flex: 1;
  min-height: 0; /* Important for flex child scrolling */
}

.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
  padding-bottom: 2rem;
}

.panel-section {
  padding: 1.25rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  color: var(--text-secondary);
}

.section-header h2 {
  font-size: 0.875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.current-target {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 1.25rem;
  background: rgba(255, 255, 255, 0.03);
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid var(--border);
}

.well-display .label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.well-display .id {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--accent-primary);
  font-family: var(--font-mono);
  line-height: 1;
}

.well-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.well-status.filled {
  background: rgba(35, 134, 54, 0.15);
  color: #3fb950;
}

.plate-id-input {
  margin-bottom: 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--border);
}

.plate-id-input label {
  display: block;
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.plate-id-field {
  width: 100%;
  border-color: var(--accent-secondary);
  background: rgba(129, 140, 248, 0.05);
}

.input-wrapper {
  position: relative;
  margin-bottom: 1rem;
}

.input-wrapper input {
  width: 100%;
  padding-right: 3rem;
  font-family: var(--font-mono);
  font-size: 1rem;
}

.submit-btn {
  position: absolute;
  right: 6px;
  top: 6px;
  bottom: 6px;
  width: 34px;
  background: var(--bg-primary);
  color: var(--accent-primary);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
}

.submit-btn:hover {
  background: var(--accent-primary);
  color: white;
}

.quick-actions .secondary-btn {
  width: 100%;
  background: var(--bg-secondary);
  color: var(--text-primary);
  padding: 0.75rem;
  border-radius: 8px;
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.kb-hint {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 1px 4px;
  border-radius: 4px;
  border: 1px solid var(--border);
}

.quick-actions .secondary-btn:hover {
  background: rgba(255, 255, 255, 0.05);
}

.subjects-box {
  display: flex;
  flex-direction: column;
}

.subject-hint {
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 1rem;
}

.subject-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.subject-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.subject-item label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.subject-input {
  width: 100%;
  padding: 0.4rem 0.5rem;
  font-size: 0.8125rem;
}

.setting-item {
  margin-bottom: 1rem;
}

.setting-item label {
  display: block;
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.setting-item select {
  width: 100%;
}

.setting-item.toggle {
  margin-top: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  font-size: 0.875rem;
  user-select: none;
}

.checkbox-label input {
  display: none;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border);
  border-radius: 6px;
  position: relative;
  transition: all 0.2s;
}

.checkbox-label input:checked + .custom-checkbox {
  background: var(--accent-primary);
  border-color: var(--accent-primary);
}

.checkbox-label input:checked + .custom-checkbox::after {
  content: '';
  position: absolute;
  left: 6px;
  top: 2px;
  width: 5px;
  height: 10px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.history-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.history-list li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid var(--border);
}

.h-well {
  font-family: var(--font-mono);
  font-weight: 700;
  color: var(--accent-secondary);
  min-width: 30px;
}

.h-barcode {
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  text-align: center;
  color: var(--text-muted);
  font-size: 0.8125rem;
  padding: 1rem !important;
}

/* Plate Visualization */
.plate-view {
  display: flex;
  flex-direction: column;
}

.plate-card {
  padding: 1rem;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.plate-grid-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  margin-top: 0.25rem;
  overflow: auto;
}

.grid-labels-top {
  display: grid;
  grid-template-columns: 40px repeat(12, 1fr);
  margin-bottom: 0.5rem;
  gap: 0.4rem;
  justify-items: center;
}

.col-label {
  text-align: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.grid-main {
  display: flex;
  flex: 1;
}

.grid-labels-left {
  display: grid;
  width: 40px;
  align-items: center;
  justify-items: center;
}

.row-label {
  height: 1fr;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 600;
}

.wells-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-template-rows: repeat(8, 1fr);
  gap: 0.4rem;
}

.well-circle {
  aspect-ratio: 1;
  background: var(--well-empty);
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.well-circle:hover {
  border-color: var(--accent-primary);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.2);
}

.well-circle.filled {
  background: var(--accent-gradient);
  border-color: var(--well-filled);
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.2);
}

.well-circle.active {
  background: var(--well-active);
  border-color: white;
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
  transform: scale(1.1);
  z-index: 2;
}

.well-circle.active::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid var(--accent-primary);
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.25); opacity: 0; }
}

.well-tooltip {
  visibility: hidden;
  position: absolute;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-primary);
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  white-space: nowrap;
  z-index: 10;
  border: 1px solid var(--border);
  box-shadow: 0 4px 12px rgba(0,0,0,0.5);
  pointer-events: none;
}

.well-circle:hover .well-tooltip {
  visibility: visible;
}
</style>
