<template>
  <div style="margin:10px;">
    <v-card class="pa-4" elevation="4">
      <!-- Toolbar -->
      <v-toolbar flat dense class="mb-3">
        <v-toolbar-title class="subtitle-1 font-weight-medium">
          Stock — All Records
        </v-toolbar-title>
        <v-spacer />

        <v-btn
          small
          depressed
          color="primary"
          @click="onRefresh"
          :loading="loading"
        >
          Refresh
        </v-btn>

        <v-btn
          small
          depressed
          color="black darken-1"
          class="ml-2"
          @click="downloadPdf"
        >
          <span style="color:white;"><v-icon left>mdi-file-pdf-box</v-icon> PDF</span>
        </v-btn>

        <v-btn
          small
          depressed
          color="green darken-1"
          class="ml-2"
          @click="downloadExcel"
        >
          Download Excel
        </v-btn>
      </v-toolbar>

      <!-- Filters -->
      <v-card class="pa-3 mb-4" outlined>
        <v-row dense>
          <v-col cols="12" md="3">
            <v-text-field
              dense
              outlined
              clearable
              hide-details
              v-model.trim="filters.modelName"
              label="Model name (partial)"
              prepend-inner-icon="mdi-cube"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              dense
              outlined
              clearable
              hide-details
              v-model.trim="filters.categoryName"
              label="Category"
              prepend-inner-icon="mdi-tag"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              dense
              outlined
              clearable
              hide-details
              v-model.trim="filters.chassisNumber"
              label="Chassis number"
              prepend-inner-icon="mdi-shield-car"
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              dense
              outlined
              clearable
              hide-details
              v-model.trim="filters.engineNumber"
              label="Engine number"
              prepend-inner-icon="mdi-engine"
            />
          </v-col>

          <!-- date range -->
          <v-col cols="12" md="3">
            <v-menu
              v-model="menus.from"
              :close-on-content-click="false"
              max-width="320"
              offset-y
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-bind="attrs"
                  v-on="on"
                  dense
                  outlined
                  readonly
                  clearable
                  hide-details
                  label="From (DD/MM/YYYY)"
                  prepend-inner-icon="mdi-calendar"
                  :value="displayDateSlash(filters.from)"
                  @click:clear="filters.from = null"
                />
              </template>
              <v-date-picker
                v-model="filters.from"
                @input="menus.from = false"
                scrollable
              />
            </v-menu>
          </v-col>

          <v-col cols="12" md="3">
            <v-menu
              v-model="menus.to"
              :close-on-content-click="false"
              max-width="320"
              offset-y
            >
              <template v-slot:activator="{ on, attrs }">
                <v-text-field
                  v-bind="attrs"
                  v-on="on"
                  dense
                  outlined
                  readonly
                  clearable
                  hide-details
                  label="To (DD/MM/YYYY)"
                  prepend-inner-icon="mdi-calendar"
                  :value="displayDateSlash(filters.to)"
                  @click:clear="filters.to = null"
                />
              </template>
              <v-date-picker
                v-model="filters.to"
                @input="menus.to = false"
                scrollable
              />
            </v-menu>
          </v-col>

          <!-- MULTI-SELECT STATUS -->
          <v-col cols="12" md="3">
            <v-select
              dense
              outlined
              clearable
              hide-details
              v-model="filters.status"
              :items="statusOptions"
              label="Status"
              prepend-inner-icon="mdi-flag"
              multiple
              chips
              small-chips
            />
          </v-col>

          <v-col cols="12" md="3">
            <v-text-field
              dense
              outlined
              clearable
              hide-details
              v-model.trim="filters.warehouse"
              label="Location / Warehouse"
              prepend-inner-icon="mdi-map-marker"
            />
          </v-col>

          <v-col cols="12" md="4">
            <v-text-field
              dense
              outlined
              clearable
              hide-details
              v-model.trim="globalSearch"
              label="Search (all columns)"
              prepend-inner-icon="mdi-magnify"
              @keyup.enter="onSearchEnter"
            />
          </v-col>

          <v-col cols="12" md="2" class="d-flex align-center">
            <v-btn color="primary" class="mr-2" @click="applyFilters">
              Search
            </v-btn>
            <v-btn text @click="resetFilters">Clear</v-btn>
          </v-col>
        </v-row>
      </v-card>

      <!-- Table -->
      <v-data-table
        :headers="headers"
        :items="filteredAndSorted"
        :loading="loading"
        :items-per-page="14"
        class="elevation-1"
        item-key="pk"
        dense
        :custom-sort="customSort"
        :sort-by="['invoiceDate']"
        :sort-desc="[true]"
      >
        <!-- 👇 S.No = visible row index + 1 (always 1..N) -->
        <template v-slot:item.serial="{ index }">
          {{ index + 1 }}
        </template>

        <template v-slot:item.modelName="{ item }">
          {{ item.modelName || '—' }}
        </template>

        <template v-slot:item.categoryName="{ item }">
          {{ item.categoryName || '—' }}
        </template>

        <template v-slot:item.chassisNumber="{ item }">
          {{ item.chassisNumber || '—' }}
        </template>

        <template v-slot:item.engineNumber="{ item }">
          {{ item.engineNumber || '—' }}
        </template>

        <!-- Invoice Number column in table -->
        <template v-slot:item.invoiceNumber="{ item }">
          {{ item.invoiceNumber || '—' }}
        </template>

        <template v-slot:item.invoiceDate="{ item }">
          {{ fmtDate(item.invoiceDate) }}
        </template>

        <template v-slot:item.stockDays="{ item }">
          {{ stockDays(item) }}
        </template>

        <template v-slot:item.warehouse="{ item }">
          {{ item.warehouse || '—' }}
        </template>

        <template v-slot:item.status="{ item }">
          <v-chip small :color="statusColor(item.status)" dark>
            {{ item.status || '—' }}
          </v-chip>
        </template>

        <template v-slot:no-data>
          <div class="pa-6 text-center grey--text">
            No records. Try changing filters or click Refresh.
          </div>
        </template>
      </v-data-table>

      <!-- GROUPED PDF CONTENT (used only for PDF export) -->
      <div
        ref="pdfContent"
        style="display:none; padding:16px; font-family:'Courier New', Courier, monospace; font-size:11px;"
      >
        <div
          v-for="(page, pageIndex) in pdfPages"
          :key="pageIndex"
          class="pdf-page"
        >
          <!-- Page number (top-right) -->
          <div
            style="display:flex; justify-content:flex-end; font-size:10px; margin-bottom:4px;"
          >
            Page {{ pageIndex + 1 }} of {{ pdfPages.length }}
          </div>

          <!-- Header (centered) -->
          <h3 style="text-align:center; margin-bottom:8px;">
            ANSARI AUTOMOBILES,<br />
            BADI KAMHARIYA BY PASS ROAD, MAU, UTTAR PRADESH<br />
            Stock — All Records
          </h3>

          <!-- Column headers: once per page (not on summary page) -->
          <div
            v-if="!page.isSummary"
            style="margin-left:24px; font-size:10px; display:flex; font-weight:600; margin-bottom:2px; border-bottom:1px solid #ccc;"
          >
            <div style="width:30px;"></div>
            <div style="flex:1;">
              Chassis
            </div>
            <div style="width:110px;">
              Engine
            </div>
            <!-- COLOR COLUMN -->
            <div style="width:70px; margin-left:8px;">
              Color
            </div>
            <div style="width:70px; text-align:right; margin-left:8px;">
              Stock days
            </div>
            <!-- Invoice No column in PDF header -->
            <div style="width:80px; margin-left:8px;">
              Invoice No
            </div>
            <div style="width:80px; text-align:right; margin-left:8px;">
              Invoice date
            </div>
            <div style="width:110px; margin-left:8px;">
              Location
            </div>
            <div style="width:80px; text-align:right; margin-left:8px;">
              Status
            </div>
          </div>

          <!-- Content blocks: category, model, items, summary -->
          <div v-for="(block, idx) in page.blocks" :key="idx">
            <!-- Category line -->
            <div
              v-if="block.type === 'category'"
              style="font-weight:700; margin-top:8px; margin-bottom:4px;"
            >
              {{ block.category }} ({{ block.totalCount }})
            </div>

            <!-- Model line -->
            <div v-else-if="block.type === 'model'">
              <div
                style="font-weight:600; margin-left:12px; margin-top:4px; margin-bottom:2px;"
              >
                {{ block.model }} ({{ block.count }})
              </div>
            </div>

            <!-- Vehicle row (serial, chassis, engine, color, stock days, invoice no, date, location, status) -->
            <div
              v-else-if="block.type === 'item'"
              style="margin-left:24px; font-size:10px; display:flex; align-items:flex-start; margin-bottom:2px;"
            >
              <!-- S.No within model group for PDF -->
              <div style="width:30px;">
                {{ block.serial }}
              </div>

              <!-- Chassis -->
              <div style="flex:1;">
                {{ block.item.chassisNumber || '—' }}
              </div>

              <!-- Engine -->
              <div style="width:110px;">
                {{ block.item.engineNumber || '—' }}
              </div>

              <!-- COLOR COLUMN -->
              <div style="width:70px; margin-left:8px;">
                {{ block.item.color || '—' }}
              </div>

              <!-- Stock days -->
              <div style="width:70px; text-align:right; margin-left:8px;">
                {{ stockDays(block.item) }}
              </div>

              <!-- Invoice No in PDF row -->
              <div style="width:80px; margin-left:8px;">
                {{ block.item.invoiceNumber || '—' }}
              </div>

              <!-- Invoice date -->
              <div style="width:80px; text-align:right; margin-left:8px;">
                {{ fmtDate(block.item.invoiceDate) }}
              </div>

              <!-- Location -->
              <div style="width:110px; margin-left:8px;">
                {{ block.item.warehouse || '—' }}
              </div>

              <!-- Status -->
              <div style="width:80px; text-align:right; margin-left:8px;">
                {{ block.item.status || '—' }}
              </div>
            </div>

            <!-- Summary page -->
            <div
              v-else-if="block.type === 'summary'"
              style="margin-top:16px; font-size:10px;"
            >
              <div style="font-weight:700; margin-bottom:8px;">
                Summary (Filtered Records)
              </div>

              <div style="display:flex; gap:40px;">
                <!-- Location summary -->
                <div style="flex:1;">
                  <div style="font-weight:600; margin-bottom:4px;">
                    By Location
                  </div>
                  <div
                    v-for="loc in block.locations"
                    :key="loc.location"
                    style="display:flex; justify-content:space-between; margin-bottom:2px;"
                  >
                    <span>{{ loc.location }}</span>
                    <span>{{ loc.count }}</span>
                  </div>
                </div>

                <!-- Model summary -->
                <div style="flex:1;">
                  <div style="font-weight:600; margin-bottom:4px;">
                    By Model
                  </div>
                  <div
                    v-for="m in block.models"
                    :key="m.model"
                    style="display:flex; justify-content:space-between; margin-bottom:2px;"
                  >
                    <span>{{ m.model }}</span>
                    <span>{{ m.count }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Page break -->
          <div
            v-if="pageIndex < pdfPages.length - 1"
            class="html2pdf__page-break"
          ></div>
        </div>
      </div>

      <v-snackbar v-model="snack.show" :color="snack.color" timeout="2200">
        {{ snack.text }}
      </v-snackbar>
    </v-card>
  </div>
</template>

<script>
import axios from 'axios'
import html2pdf from 'html2pdf.js'
import * as XLSX from 'xlsx'

export default {
  name: 'InventoryTable',

  data () {
    return {
      loading: false,
      rawItems: [],
      filters: {
        modelName: null,
        categoryName: null,
        chassisNumber: null,
        engineNumber: null,
        from: null,
        to: null,
        status: [],
        warehouse: null
      },
      menus: { from: false, to: false },
      globalSearch: '',
      snack: { show: false, color: 'success', text: '' },
      headers: [
        // S.No will always be 1..N via slot index
        { text: 'S.No', value: 'serial', width: 70, sortable: false },
        { text: 'Model', value: 'modelName' },
        { text: 'Category', value: 'categoryName' },
        { text: 'Chassis', value: 'chassisNumber', width: 180 },
        { text: 'Engine', value: 'engineNumber', width: 160 },
        // Invoice No column in table headers (before Invoice Date)
        { text: 'Invoice No', value: 'invoiceNumber', width: 140 },
        { text: 'Invoice Date', value: 'invoiceDate', width: 140 },
        { text: 'Stock by days', value: 'stockDays', width: 150 },
        { text: 'Location', value: 'warehouse', width: 160 },
        { text: 'Status', value: 'status', width: 90 }
      ],
      statusOptions: ['ACTIVE', 'DRAFT', 'PENDING', 'INACTIVE']
    }
  },

  created () {
    this.loadData()
  },

  computed: {
    filteredAndSorted () {
      const rows = (this.rawItems || []).slice()
      const lc = v => (v == null ? '' : String(v).toLowerCase())

      let out = rows.filter(it => {
        if (lc(it.status) === 'sold') return false

        if (this.filters.modelName && this.filters.modelName.trim()) {
          if (!lc(it.modelName).includes(lc(this.filters.modelName))) return false
        }
        if (this.filters.categoryName && this.filters.categoryName.trim()) {
          if (!lc(it.categoryName).includes(lc(this.filters.categoryName))) return false
        }
        if (this.filters.chassisNumber && this.filters.chassisNumber.trim()) {
          if (!lc(it.chassisNumber).includes(lc(this.filters.chassisNumber))) return false
        }
        if (this.filters.engineNumber && this.filters.engineNumber.trim()) {
          if (!lc(it.engineNumber).includes(lc(this.filters.engineNumber))) return false
        }
        if (this.filters.warehouse && this.filters.warehouse.trim()) {
          if (!lc(it.warehouse).includes(lc(this.filters.warehouse))) return false
        }

        if (Array.isArray(this.filters.status) && this.filters.status.length > 0) {
          const selected = this.filters.status.map(s => lc(s))
          if (!selected.includes(lc(it.status))) return false
        }

        if (this.filters.from || this.filters.to) {
          const itYmd = this.toYmd(it.invoiceDate || it.createdAt || it.lastModified)
          if (!itYmd) return false
          if (this.filters.from && this.filters.to) {
            if (itYmd < this.filters.from.slice(0, 10) || itYmd > this.filters.to.slice(0, 10)) return false
          } else if (this.filters.from) {
            if (itYmd < this.filters.from.slice(0, 10)) return false
          } else if (this.filters.to) {
            if (itYmd > this.filters.to.slice(0, 10)) return false
          }
        }

        if (this.globalSearch && this.globalSearch.trim()) {
          const q = lc(this.globalSearch).trim()
          const fields = [
            it.modelName, it.categoryName, it.chassisNumber, it.engineNumber,
            it.invoiceNumber, it.pk, it.sk, it.warehouse, it.status, it.color, it.source
          ]
          const found = fields.some(f => lc(f).includes(q))
          if (!found) return false
        }

        return true
      })

      // keep existing sorting behavior (by invoice date desc)
      out.sort((a, b) => {
        const ta = this.toTime(a.invoiceDate || a.createdAt || a.lastModified)
        const tb = this.toTime(b.invoiceDate || b.lastModified || b.createdAt)
        return tb - ta
      })

      return out
    },

    // Category -> Model -> Items, then paginated
    pdfGroups () {
      const src = this.filteredAndSorted || []
      const groups = []
      const catMap = new Map()

      for (const it of src) {
        const category = it.categoryName || 'Uncategorized'
        const model = it.modelName || 'Unknown Model'

        let catGroup = catMap.get(category)
        if (!catGroup) {
          catGroup = { category, totalCount: 0, models: [] }
          catMap.set(category, catGroup)
          groups.push(catGroup)
        }

        let modelGroup = catGroup.models.find(m => m.model === model)
        if (!modelGroup) {
          modelGroup = { model, items: [] }
          catGroup.models.push(modelGroup)
        }

        modelGroup.items.push(it)
        catGroup.totalCount++
      }

      return groups
    },

    pdfPages () {
      const maxLines = 55
      const pages = []
      let currentPage = { blocks: [], lineCount: 0, isSummary: false }

      const pushPage = () => {
        if (currentPage.blocks.length) {
          pages.push(currentPage)
          currentPage = { blocks: [], lineCount: 0, isSummary: false }
        }
      }

      const ensureCapacity = extra => {
        if (currentPage.lineCount + extra > maxLines) {
          pushPage()
        }
      }

      const groups = this.pdfGroups
      const src = this.filteredAndSorted || []

      groups.forEach(cat => {
        ensureCapacity(1)
        currentPage.blocks.push({
          type: 'category',
          category: cat.category,
          totalCount: cat.totalCount
        })
        currentPage.lineCount += 1

        cat.models.forEach(modelGroup => {
          // model line
          ensureCapacity(2)
          currentPage.blocks.push({
            type: 'model',
            category: cat.category,
            model: modelGroup.model,
            count: modelGroup.items.length
          })
          currentPage.lineCount += 2

          modelGroup.items.forEach((item, idx) => {
            ensureCapacity(1)
            currentPage.blocks.push({
              type: 'item',
              item,
              // serial within model group for PDF
              serial: idx + 1,
              model: modelGroup.model,
              category: cat.category
            })
            currentPage.lineCount += 1
          })
        })
      })

      pushPage()

      // Summary (counts by location and by model) as last page
      if (src.length) {
        const locMap = new Map()
        const modelMap = new Map()

        src.forEach(it => {
          const loc = it.warehouse || 'Unknown Location'
          const model = it.modelName || 'Unknown Model'

          locMap.set(loc, (locMap.get(loc) || 0) + 1)
          modelMap.set(model, (modelMap.get(model) || 0) + 1)
        })

        const locations = Array.from(locMap.entries())
          .map(([location, count]) => ({ location, count }))
          .sort((a, b) => a.location.localeCompare(b.location))

        const models = Array.from(modelMap.entries())
          .map(([model, count]) => ({ model, count }))
          .sort((a, b) => a.model.localeCompare(b.model))

        pages.push({
          blocks: [
            {
              type: 'summary',
              locations,
              models
            }
          ],
          lineCount: 0,
          isSummary: true
        })
      }

      return pages
    }
  },

  methods: {
    onRefresh () {
      this.resetFilters()
      this.menus = { from: false, to: false }
      this.loadData()
    },

    async loadData () {
      try {
        this.loading = true
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInventry')
        const items = (res.data && res.data.items) ? res.data.items : []
        this.rawItems = this.dedupeItems(items)

        // keep your original sorting (invoice date desc)
        this.rawItems.sort((a, b) => {
          const ta = this.toTime(a.invoiceDate || a.createdAt || a.lastModified)
          const tb = this.toTime(b.invoiceDate || b.lastModified || b.createdAt)
          return tb - ta
        })
      } catch (err) {
        console.error(err)
        this.showSnack('Failed to load inventory', 'error')
      } finally {
        this.loading = false
      }
    },

    dedupeItems (items) {
      if (!Array.isArray(items)) return []
      const map = new Map()
      for (const it of items) {
        const key = it.pk || it.id || (it.sk ? String(it.sk) : null)
        if (!key) continue
        if (!map.has(key)) {
          map.set(key, it)
        } else {
          const existing = map.get(key)
          const tExisting = this.toTime(existing.invoiceDate || existing.createdAt || existing.lastModified)
          const tNew = this.toTime(it.invoiceDate || it.createdAt || it.lastModified)
          if (tNew >= tExisting) {
            map.set(key, it)
          }
        }
      }
      return Array.from(map.values())
    },

    applyFilters () {},

    resetFilters () {
      this.filters = {
        modelName: null,
        categoryName: null,
        chassisNumber: null,
        engineNumber: null,
        from: null,
        to: null,
        status: [],
        warehouse: null
      }
      this.globalSearch = ''
    },

    fmtDate (isoOrYmd) {
      if (!isoOrYmd) return '—'
      try {
        if (typeof isoOrYmd === 'number') {
          const d = new Date(Number(isoOrYmd))
          if (isNaN(d.getTime())) return '—'
          return this._fmtDate(d)
        }
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(isoOrYmd))) {
          const [y, m, d] = String(isoOrYmd).slice(0, 10).split('-')
          return `${d}/${m}/${y}`
        }
        const d = new Date(isoOrYmd)
        if (isNaN(d.getTime())) return '—'
        return this._fmtDate(d)
      } catch {
        return '—'
      }
    },

    _fmtDate (d) {
      const dd = String(d.getDate()).padStart(2, '0')
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const yyyy = d.getFullYear()
      return `${dd}/${mm}/${yyyy}`
    },

    displayDateSlash (iso) {
      if (!iso) return ''
      try {
        if (/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) {
          const [y, m, d] = String(iso).slice(0, 10).split('-')
          return `${d}/${m}/${y}`
        }
        const d = new Date(iso)
        if (isNaN(d.getTime())) return ''
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      } catch {
        return ''
      }
    },

    toYmd (isoOrTimestamp) {
      if (!isoOrTimestamp) return null
      try {
        if (typeof isoOrTimestamp === 'string' && /^\d{4}-\d{2}-\d{2}/.test(isoOrTimestamp)) {
          return isoOrTimestamp.slice(0, 10)
        }
        const t = Number(isoOrTimestamp)
        const d = isNaN(t) ? new Date(isoOrTimestamp) : new Date(t)
        if (isNaN(d.getTime())) return null
        const yyyy = d.getFullYear()
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const dd = String(d.getDate()).padStart(2, '0')
        return `${yyyy}-${mm}-${dd}`
      } catch {
        return null
      }
    },

    toTime (isoOrTimestamp) {
      if (!isoOrTimestamp) return 0
      try {
        if (typeof isoOrTimestamp === 'number') return Number(isoOrTimestamp)
        if (typeof isoOrTimestamp === 'string' && /^\d{4}-\d{2}-\d{2}/.test(isoOrTimestamp)) {
          return new Date(isoOrTimestamp + 'T00:00:00').getTime()
        }
        const t = new Date(isoOrTimestamp).getTime()
        return isNaN(t) ? 0 : t
      } catch {
        return 0
      }
    },

    stockDaysNumber (item) {
      const ymd = this.toYmd(item && (item.invoiceDate || item.createdAt || item.lastModified))
      if (!ymd) return null
      try {
        const inv = new Date(ymd + 'T00:00:00').getTime()
        const today = new Date()
        const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
        const diffMs = utcToday - inv
        const days = Math.floor(diffMs / (24 * 60 * 60 * 1000))
        return days >= 0 ? days : 0
      } catch {
        return null
      }
    },

    stockDays (item) {
      const days = this.stockDaysNumber(item)
      if (days == null) return '—'
      return String(days)
    },

    statusColor (s) {
      const k = String(s || '').toUpperCase()
      if (k === 'SOLD') return 'green'
      if (k === 'DRAFT') return 'orange'
      if (k === 'ACTIVE') return 'blue'
      if (k === 'CANCELLED') return 'red'
      return 'grey'
    },

    pdfStatusColor (s) {
      const k = String(s || '').toUpperCase()
      if (k === 'SOLD') return '#2e7d32'
      if (k === 'DRAFT') return '#ef6c00'
      if (k === 'ACTIVE') return '#1976d2'
      if (k === 'CANCELLED') return '#d32f2f'
      if (k === 'PENDING') return '#fbc02d'
      if (k === 'INACTIVE') return '#757575'
      return '#000000'
    },

    pdfStatusStyle (s) {
      return {
        padding: '4px 6px',
        'font-weight': '600',
        color: this.pdfStatusColor(s)
      }
    },

    showSnack (txt, color = 'error') {
      this.snack = { show: true, color, text: txt }
    },

    onSearchEnter () {
      this.applyFilters()
    },

    customSort (items, sortBy, sortDesc) {
      if (!sortBy || !sortBy.length) return items

      const sortKey = sortBy[0]

      // never sort by S.No
      if (sortKey === 'serial') {
        return items
      }

      const desc = Array.isArray(sortDesc) ? !!sortDesc[0] : !!sortDesc

      const sorted = items.slice().sort((a, b) => {
        let valA
        let valB

        if (sortKey === 'stockDays') {
          valA = this.stockDaysNumber(a)
          valB = this.stockDaysNumber(b)
        } else if (sortKey === 'invoiceDate') {
          valA = this.toTime(a.invoiceDate || a.createdAt || a.lastModified)
          valB = this.toTime(b.invoiceDate || b.lastModified || b.createdAt)
        } else {
          valA = a[sortKey]
          valB = b[sortKey]
        }

        if (valA == null && valB == null) return 0
        if (valA == null) return desc ? 1 : -1
        if (valB == null) return desc ? -1 : 1

        if (valA < valB) return desc ? 1 : -1
        if (valA > valB) return desc ? -1 : 1
        return 0
      })

      return sorted
    },

    // OPEN PDF IN NEW TAB (A4 LANDSCAPE)
    downloadPdf () {
      if (!this.filteredAndSorted.length) {
        this.showSnack('No records to export', 'error')
        return
      }

      const el = this.$refs.pdfContent
      if (!el) return

      const prevDisplay = el.style.display
      el.style.display = 'block'

      const filename = `Stock_Records_${new Date().toISOString().slice(0, 10)}.pdf`

      const opt = {
        margin: [10, 10, 10, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: {
          unit: 'pt',
          format: 'a4',
          orientation: 'landscape'
        },
        pagebreak: {
          mode: ['css', 'legacy']
        }
      }

      html2pdf()
        .set(opt)
        .from(el)
        .toPdf()
        .get('pdf')
        .then(pdf => {
          try {
            pdf.setProperties({ title: filename })
          } catch (e) {
            // ignore if not supported
          }
          const blobUrl = pdf.output('bloburl')
          window.open(blobUrl, '_blank')
          el.style.display = prevDisplay || 'none'
        })
        .catch(err => {
          console.error('PDF export error:', err)
          el.style.display = prevDisplay || 'none'
          this.showSnack('Failed to export PDF', 'error')
        })
    },

    downloadExcel () {
      try {
        const rows = this.filteredAndSorted.map((it, index) => ({
          'S.No': index + 1, // same logic: 1..N in current order
          Model: it.modelName || '',
          Category: it.categoryName || '',
          Chassis: it.chassisNumber || '',
          Engine: it.engineNumber || '',
          'Invoice No': it.invoiceNumber || '',
          'Invoice Date': this.fmtDate(it.invoiceDate),
          'Stock Days': this.stockDays(it),
          'Location / Warehouse': it.warehouse || '',
          Status: it.status || ''
        }))

        const ws = XLSX.utils.json_to_sheet(rows)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Stock')

        const fileName = `Stock_Records_${new Date().toISOString().slice(0, 10)}.xlsx`
        XLSX.writeFile(wb, fileName)
      } catch (err) {
        console.error('Excel export error:', err)
        this.showSnack('Failed to export Excel', 'error')
      }
    }
  }
}
</script>

<style scoped>
.subtitle-1.font-weight-medium {
  letter-spacing: .2px;
}

.html2pdf__page-break {
  height: 0;
  page-break-after: always;
}

.pdf-page {
  width: 100%;
}
</style>
