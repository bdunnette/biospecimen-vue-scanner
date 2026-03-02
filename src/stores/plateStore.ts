import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import Papa from 'papaparse'

export interface WellData {
    id: string; // e.g., "A1"
    barcode: string | null;
    timestamp: string | null;
}

export const usePlateStore = defineStore('plate', () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    const cols = Array.from({ length: 12 }, (_, i) => (i + 1).toString())

    const plate = ref<Record<string, WellData>>({})
    const plateId = ref('')
    const currentWellId = ref('A1')
    const scanDirection = ref<'rows' | 'columns'>('rows')
    const autoAdvance = ref(true)
    const exportEmpty = ref(false)
    const rowSubjectIds = ref<Record<string, string>>({})
    const colSubjectIds = ref<Record<string, string>>({})

    // Initialize empty plate
    const initPlate = () => {
        const newPlate: Record<string, WellData> = {}
        rows.forEach(r => {
            cols.forEach(c => {
                const id = `${r}${c}`
                newPlate[id] = { id, barcode: null, timestamp: null }
            })
        })
        plate.value = newPlate
    }

    // Helper to get well ID by indices
    const getWellId = (rowIndex: number, colIndex: number) => {
        if (rowIndex < 0 || rowIndex >= rows.length || colIndex < 0 || colIndex >= cols.length) return null
        return `${rows[rowIndex]}${cols[colIndex]}`
    }

    // Advance to next well logic
    const advance = () => {
        const rIdx = rows.indexOf(currentWellId.value[0])
        const cIdx = parseInt(currentWellId.value.substring(1)) - 1

        let nextId: string | null = null

        if (scanDirection.value === 'rows') {
            // A1, A2... A12, B1...
            if (cIdx < 11) {
                nextId = getWellId(rIdx, cIdx + 1)
            } else if (rIdx < 7) {
                nextId = getWellId(rIdx + 1, 0)
            }
        } else {
            // A1, B1... H1, A2... (or as user requested: H1, G1, F1 - wait, user said "H1, G1, F1" which is backward columns)
            // Re-reading: "allow scanning to proceed in rows (A1, A2) or columns (H1, G1, F1)"
            // "H1, G1, F1" is bottom-up in column 1.
            if (rIdx > 0) {
                nextId = getWellId(rIdx - 1, cIdx)
            } else if (cIdx < 11) {
                nextId = getWellId(7, cIdx + 1)
            }
        }

        if (nextId) currentWellId.value = nextId
    }

    const logBarcode = (barcode: string) => {
        if (plate.value[currentWellId.value]) {
            plate.value[currentWellId.value].barcode = barcode
            plate.value[currentWellId.value].timestamp = new Date().toISOString()

            if (autoAdvance.value) {
                advance()
            }
        }
    }

    const skipWell = () => {
        advance()
    }

    const clearPlate = () => {
        if (confirm('Are you sure you want to clear all data?')) {
            initPlate()
            currentWellId.value = 'A1'
            plateId.value = ''
            rowSubjectIds.value = {}
            colSubjectIds.value = {}
        }
    }

    const exportCSV = () => {
        let wells = Object.values(plate.value)

        if (!exportEmpty.value) {
            wells = wells.filter(w => w.barcode !== null)
        }

        const data = wells.map(w => {
            const rowLetter = w.id[0]
            const colNum = parseInt(w.id.substring(1))
            const rowNum = rows.indexOf(rowLetter) + 1

            let subjectId = ''
            if (scanDirection.value === 'rows') {
                subjectId = rowSubjectIds.value[rowLetter] || ''
            } else {
                subjectId = colSubjectIds.value[colNum.toString()] || ''
            }

            return {
                PlateID: plateId.value,
                SubjectID: subjectId,
                Vial: w.id,
                RowLetter: rowLetter,
                RowNum: rowNum,
                ColNum: colNum,
                Barcode: w.barcode || '',
                Timestamp: w.timestamp || ''
            }
        })

        const csv = Papa.unparse(data)
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        const url = URL.createObjectURL(blob)
        link.setAttribute('href', url)
        const filename = plateId.value.trim()
            ? `${plateId.value.trim()}_${new Date().toISOString().split('T')[0]}.csv`
            : `biospecimens_${new Date().toISOString().split('T')[0]}.csv`

        link.setAttribute('download', filename)
        link.style.visibility = 'hidden'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    const scannedCount = computed(() => {
        return Object.values(plate.value).filter(w => w.barcode !== null).length
    })

    const displayTopLabels = computed(() => {
        return scanDirection.value === 'columns' ? [...rows].reverse() : cols
    })

    const displaySideLabels = computed(() => {
        return scanDirection.value === 'columns' ? cols : rows
    })

    const gridConfig = computed(() => {
        return scanDirection.value === 'columns'
            ? { cols: 8, rows: 12 }
            : { cols: 12, rows: 8 }
    })

    const displayWells = computed(() => {
        const orderedWells: WellData[] = []

        if (scanDirection.value === 'rows') {
            // Standard layout: Rows A-H on Y, Cols 1-12 on X
            rows.forEach(r => {
                cols.forEach(c => {
                    const well = plate.value[`${r}${c}`]
                    if (well) orderedWells.push(well)
                })
            })
        } else {
            // Transposed layout: Rows H-A on X, Cols 1-12 on Y
            const revRows = [...rows].reverse()
            cols.forEach(c => {
                revRows.forEach(r => {
                    const well = plate.value[`${r}${c}`]
                    if (well) orderedWells.push(well)
                })
            })
        }
        return orderedWells
    })

    return {
        rows,
        cols,
        plate,
        plateId,
        currentWellId,
        scanDirection,
        autoAdvance,
        exportEmpty,
        rowSubjectIds,
        colSubjectIds,
        initPlate,
        logBarcode,
        skipWell,
        clearPlate,
        exportCSV,
        scannedCount,
        displayTopLabels,
        displaySideLabels,
        gridConfig,
        displayWells
    }
})
