<template>
  <div class="pa-3">
    <v-card class="rounded-lg elevation-2">
      <!-- Header -->
      <v-sheet class="daybook-header rounded-t-lg" color="indigo darken-4" dark>
        <div class="d-flex align-center">
          <div class="d-flex align-center">
            <v-avatar size="36" class="mr-3" v-if="brandLogo">
              <img :src="brandLogo" :alt="brandName">
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ brandName }}</div>
              <div class="caption">{{ brandSubtitle }}</div>
            </div>
          </div>
          <v-spacer/>
          <div class="text-right">
            <div class="overline">Day Book</div>
            <div class="caption">Updated {{ fmtDateTime(nowIso) }}</div>
          </div>
        </div>
      </v-sheet>

      <!-- Controls -->
      <div class="px-4 pt-4">
        <div class="d-flex align-center flex-wrap">
          <!-- Presets -->
          <v-btn-toggle v-model="preset" class="mr-3 mb-2" mandatory rounded>
            <v-btn class="preset-btn" value="today">Today</v-btn>
            <v-btn class="preset-btn" value="week">Week</v-btn>
            <v-btn class="preset-btn" value="month">Month</v-btn>
            <v-btn class="preset-btn" value="year">Year</v-btn>
            <v-btn class="preset-btn" value="custom">Custom</v-btn>
          </v-btn-toggle>

          <!-- From -->
          <v-menu
            v-model="fromMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            max-width="290"
            min-width="290"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-bind="attrs"
                v-on="on"
                v-model="from"
                label="From"
                dense
                outlined
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                class="mr-2 mb-2"
                style="max-width:170px"
                clearable
                @click:clear="from=''"
              />
            </template>
            <v-date-picker
              v-model="from"
              :max="to || undefined"
              @input="fromMenu=false"
              scrollable
              no-title
            />
          </v-menu>

          <!-- To -->
          <v-menu
            v-model="toMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            max-width="290"
            min-width="290"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                v-bind="attrs"
                v-on="on"
                v-model="to"
                label="To"
                dense
                outlined
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                class="mr-2 mb-2"
                style="max-width:170px"
                clearable
                @click:clear="to=''"
              />
            </template>
            <v-date-picker
              v-model="to"
              :min="from || undefined"
              @input="toMenu=false"
              scrollable
              no-title
            />
          </v-menu>

          <!-- Type (DEBIT/CREDIT) -->
          <v-select
            v-model="type"
            :items="typeItems"
            item-text="text"
            item-value="value"
            dense
            outlined
            hide-details
            clearable
            class="mr-2 mb-2"
            label="Type"
            style="max-width:150px"
          />

          <!-- Mode (CASH/UPI/etc) -->
          <v-select
            v-model="mode"
            :items="modeItems"
            item-text="text"
            item-value="value"
            dense
            outlined
            hide-details
            clearable
            class="mr-2 mb-2"
            label="Mode"
            style="max-width:170px"
          />

          <!-- Source (DEPOSIT/WITHDRAW/etc) -->
          <v-select
            v-model="source"
            :items="sourceItems"
            item-text="text"
            item-value="value"
            dense
            outlined
            hide-details
            clearable
            class="mr-2 mb-2"
            label="Source"
            style="max-width:170px"
          />

          <!-- Search -->
          <v-text-field
            v-model="q"
            label="Search (account/ref/narration)"
            dense
            outlined
            hide-details
            clearable
            prepend-inner-icon="mdi-magnify"
            class="mr-2 mb-2"
            style="max-width:260px"
          />

          <v-btn
            color="primary"
            class="mb-2 mr-2"
            :loading="loading"
            @click="load(true)"
          >
            <v-icon left>mdi-refresh</v-icon>Load
          </v-btn>

          <v-spacer />

          <!-- Export buttons -->
          <v-btn class="mb-2 mr-2" @click="exportCsv" :disabled="!rows.length">
            <v-icon left>mdi-download</v-icon>CSV
          </v-btn>
          <v-btn
            color="deep-purple accent-4"
            dark
            class="mb-2 mr-2"
            @click="downloadPdf"
            :disabled="!rows.length"
          >
            <v-icon left>mdi-file-pdf-box</v-icon>PDF
          </v-btn>

          <!-- Optional: Lock day -->
          <v-btn
            outlined
            color="indigo darken-2"
            class="mb-2"
            @click="$emit('lock-day', { from, to })"
          >
            <v-icon left>mdi-lock-check</v-icon>Mark As Verified
          </v-btn>
        </div>

        <!-- Status line -->
        <div class="mt-1 mb-3 grey--text text--darken-1">
          <v-chip small label class="mr-2">
            Range:
            <b class="ml-1">{{ from || '—' }}</b> — <b>{{ to || '—' }}</b>
          </v-chip>
          <v-chip small label class="mr-2">
            Preset:
            <b class="ml-1">{{ presetLabel }}</b>
          </v-chip>
          <v-chip v-if="type" small label class="mr-2">
            Type: <b class="ml-1">{{ type }}</b>
          </v-chip>
          <v-chip v-if="mode" small label class="mr-2">
            Mode: <b class="ml-1">{{ mode }}</b>
          </v-chip>
          <v-chip v-if="source" small label>
            Source: <b class="ml-1">{{ source }}</b>
          </v-chip>
        </div>
      </div>

      <!-- Summary stats -->
      <div class="px-4">
        <div class="d-flex flex-wrap">
          <v-card
            outlined
            class="pa-1 mr-1 mb-2 stat-card"
            style="height:50px;"
          >
            <div class="caption grey--text text--darken-1">Opening</div>
            <div
              :class="opening>=0 ? 'green--text text--darken-2' : 'red--text text--darken-2'"
            >
              {{ money(opening) }}
            </div>
          </v-card>

          <v-card
            outlined
            class="pa-1 mr-1 mb-2 stat-card"
            style="height:50px;"
          >
            <div class="caption grey--text text--darken-1">Debit</div>
            <div class="debit-cell">{{ money(totals.debit) }}</div>
          </v-card>

          <v-card
            outlined
            class="pa-1 mr-1 mb-2 stat-card"
            style="height:50px;"
          >
            <div class="caption grey--text text--darken-1">Credit</div>
            <div class="credit-cell">{{ money(totals.credit) }}</div>
          </v-card>

          <v-card
            outlined
            class="pa-1 mr-1 mb-2 stat-card"
            style="height:50px;"
          >
            <div class="caption grey--text text--darken-1">Closing</div>
            <div
              :class="closing>=0 ? 'green--text text--darken-2' : 'red--text text--darken-2'"
            >
              {{ money(closing) }}
            </div>
          </v-card>

          <!-- Mode splits -->
          <v-card outlined class="pa-2 mb-2 stat-card">
            <div class="d-flex flex-wrap mt-1">
              <v-chip
                v-for="m in modeKeys"
                :key="m"
                small
                class="mr-2 mb-1"
                label
              >
                {{ m }}: <b class="ml-1">{{ money(modeTotals[m] || 0) }}</b>
              </v-chip>
            </div>
          </v-card>
        </div>
      </div>

      <!-- Table -->
      <div class="px-2 pb-4">
        <v-data-table
          :headers="headers"
          :items="rows"
          :items-per-page="15"
          :loading="loading"
          dense
          class="elevation-1 rounded-lg ledger-table"
          item-key="sk"
          :item-class="rowClass"
        >
          <template #loading>
            <div class="pa-6 grey--text text--darken-1">Fetching entries…</div>
          </template>

          <template #item.debit="{ item }">
            <span
              v-if="item.entryType==='DEBIT'"
              class="debit-cell"
            >
              {{ money(item.amount) }}
            </span>
            <span v-else>—</span>
          </template>

          <template #item.credit="{ item }">
            <span
              v-if="item.entryType==='CREDIT'"
              class="credit-cell"
            >
              {{ money(item.amount) }}
            </span>
            <span v-else>—</span>
          </template>

          <template #item.createdAt="{ item }">
            {{ fmtDateTime(item.createdAt) }}
          </template>

          <template #item.flags="{ item }">
            <v-chip
              v-if="item._dupRef"
              x-small
              color="red lighten-4"
              class="mr-1"
            >
              Duplicate Ref
            </v-chip>
            <v-chip
              v-if="item._large"
              x-small
              color="amber lighten-4"
            >
              Large
            </v-chip>
          </template>

          <template #no-data>
            <div class="pa-6 grey--text text--darken-1">
              No entries for this day/range.
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <!-- HIDDEN PDF AREA (used by html2pdf) -->
    <div
      ref="pdfArea"
      class="pdf-root"
      style="position:absolute; left:-9999px; top:-9999px;"
    >
      <div class="pdf-header">
        <div class="pdf-brand">
          <img
            v-if="brandLogo"
            :src="brandLogo"
            :alt="brandName"
            class="pdf-logo"
          />
          <div>
            <div class="pdf-brand-title">{{ brandName }}</div>
            <div class="pdf-brand-sub">{{ brandSubtitle }}</div>
          </div>
        </div>
        <div class="pdf-meta">
          <div><b>Day Book</b></div>
          <div>Range: {{ from || '—' }} — {{ to || '—' }}</div>
          <div>Generated: {{ fmtDateTime(nowIso) }}</div>
        </div>
      </div>

      <div class="pdf-summary">
        <div class="pill">
          Preset: <b>{{ presetLabel }}</b>
        </div>
        <div class="pill">
          Opening:
            <span :class="opening>=0 ? 'plus' : 'minus'">
              {{ money(opening) }}
            </span>
        </div>
        <div class="pill debit">
          Debit: <span class="minus">{{ money(totals.debit) }}</span>
        </div>
        <div class="pill credit">
          Credit: <span class="plus">{{ money(totals.credit) }}</span>
        </div>
        <div class="pill">
          Closing:
          <span :class="closing>=0 ? 'plus' : 'minus'">
            {{ money(closing) }}
          </span>
        </div>
      </div>

      <div class="pdf-modes" v-if="modeKeys.length">
        <div
          class="pill"
          v-for="m in modeKeys"
          :key="m"
        >
          {{ m }}: <b>{{ money(modeTotals[m] || 0) }}</b>
        </div>
      </div>

      <table class="pdf-table">
        <thead>
          <tr>
            <th class="w-when">Time</th>
            <th class="w-client">Account</th>
            <th class="w-narration">Narration</th>
            <th class="w-type text-center">Type</th>
            <th class="w-money text-right">Debit (₹)</th>
            <th class="w-money text-right">Credit (₹)</th>
            <th class="w-mode">Mode</th>
            <th class="w-ref">Ref</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in rows" :key="r.sk || r.id">
            <td class="w-when">{{ fmtDateTime(r.createdAt) }}</td>
            <td class="w-client">{{ r.clientId || '' }}</td>
            <td class="w-narration">{{ r.narration || '' }}</td>
            <td class="w-type text-center">{{ r.entryType || '' }}</td>
            <td
              class="w-money text-right"
              :class="r.entryType==='DEBIT' ? 'bg-debit' : ''"
            >
              {{ r.entryType==='DEBIT' ? money(r.amount) : '' }}
            </td>
            <td
              class="w-money text-right"
              :class="r.entryType==='CREDIT' ? 'bg-credit' : ''"
            >
              {{ r.entryType==='CREDIT' ? money(r.amount) : '' }}
            </td>
            <td class="w-mode">{{ r.mode || '' }}</td>
            <td class="w-ref">
              {{ (r.sourceType || '') + (r.sourceId ? (' #' + r.sourceId) : '') }}
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td colspan="4" class="text-right">Totals</td>
            <td class="w-money text-right">{{ money(totals.debit) }}</td>
            <td class="w-money text-right">{{ money(totals.credit) }}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>

      <div class="pdf-sign">
        <div class="sig">
          <div class="sig-line"></div>
          <div class="sig-label">Prepared By</div>
        </div>
        <div class="sig">
          <div class="sig-line"></div>
          <div class="sig-label">Verified By</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// npm i html2pdf.js
import html2pdf from 'html2pdf.js'

export default {
  name: 'DayBook',
  props: {
    brandName: { type: String, default: 'ANSARI AUTOMOBILES' },
    brandSubtitle: { type: String, default: 'Daily Cash & Journal' },
    brandLogo: { type: String, default: '' }
  },
  data () {
    return {
      // filters
      preset: 'today',
      from: '',
      to: '',
      type: '',      // DEBIT / CREDIT
      mode: '',      // CASH / UPI / ...
      source: '',    // DEPOSIT / etc (based on backend "type")
      q: '',

      fromMenu: false,
      toMenu: false,

      loading: false,
      rows: [],
      opening: 0,
      totals: { debit: 0, credit: 0 },
      modeTotals: {},

      // selects
      typeItems: [
        { text: 'All', value: '' },
        { text: 'DEBIT', value: 'DEBIT' },
        { text: 'CREDIT', value: 'CREDIT' }
      ],
      modeItems: [
        { text: 'All', value: '' },
        { text: 'CASH', value: 'CASH' },
        { text: 'UPI', value: 'UPI' },
        { text: 'CARD', value: 'CARD' },
        { text: 'BANK TRANSFER', value: 'BANK_TRANSFER' },
        { text: 'CHEQUE', value: 'CHEQUE' },
        { text: 'OTHER', value: 'OTHER' }
      ],
      // tweak based on your actual "type" values in DynamoDB
      sourceItems: [
        { text: 'All', value: '' },
        { text: 'DEPOSIT', value: 'DEPOSIT' },
        { text: 'WITHDRAW', value: 'WITHDRAW' },
        { text: 'TRANSFER', value: 'TRANSFER' }
      ],

      headers: [
        { text: 'Time', value: 'createdAt' },
        { text: 'Account', value: 'clientId' },
        { text: 'Narration', value: 'narration' },
        { text: 'Type', value: 'entryType' },
        { text: 'Debit (₹)', value: 'debit', align: 'end' },
        { text: 'Credit (₹)', value: 'credit', align: 'end' },
        { text: 'Mode', value: 'mode' },
        { text: 'Flags', value: 'flags' }
      ],

      _debounceT: null,
      _lastSig: '',
      nowIso: new Date().toISOString()
    }
  },

  computed: {
    presetLabel () {
      return {
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
        year: 'This Year',
        custom: 'Custom'
      }[this.preset] || 'Custom'
    },
    closing () {
      return Number((this.opening + this.totals.debit - this.totals.credit).toFixed(2))
    },
    modeKeys () {
      return Object.keys(this.modeTotals)
    }
  },

  created () {
    this.applyPreset('today')
    this.load(true)
    this._tick = setInterval(() => {
      this.nowIso = new Date().toISOString()
    }, 30_000)
  },

  beforeDestroy () {
    clearInterval(this._tick)
  },

  watch: {
    from () {
      if (this.preset === 'custom') this.load()
    },
    to () {
      if (this.preset === 'custom') this.load()
    },
    type () { this.load() },
    mode () { this.load() },
    source () { this.load() },
    q () { this.load() },
    preset (n) {
      this.applyPreset(n)
      this.load(true)
    }
  },

  methods: {
    rowClass(item) {
      if (!item || !item.entryType) return ''
      return item.entryType === 'DEBIT' ? 'row-debit' : 'row-credit'
    },

    // --- date helpers ---
    toStr (d) {
      const p = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    },

    applyPreset (key) {
      const today = new Date()

      if (key === 'today') {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        this.from = this.toStr(d)
        this.to = this.toStr(d)
      } else if (key === 'week') {
        // Monday–Sunday of current week
        const start = new Date(today)
        const dow = start.getDay() === 0 ? 6 : start.getDay() - 1 // 0=Sun → 6
        start.setDate(start.getDate() - dow)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        this.from = this.toStr(start)
        this.to = this.toStr(end)
      } else if (key === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        this.from = this.toStr(start)
        this.to = this.toStr(end)
      } else if (key === 'year') {
        const y = today.getFullYear()
        const start = new Date(y, 0, 1)
        const end = new Date(y, 11, 31)
        this.from = this.toStr(start)
        this.to = this.toStr(end)
      }
    },

    // --- formatters ---
    money (v) {
      const n = Number(v || 0)
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2
      }).format(n)
    },

    fmtDateTime (isoOrMs) {
      if (!isoOrMs && isoOrMs !== 0) return ''
      const d = new Date(isoOrMs)
      if (Number.isNaN(d.getTime())) return ''
      return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    },

    // --- data loaders ---
    debounced (fn, delay = 350) {
      clearTimeout(this._debounceT)
      this._debounceT = setTimeout(fn, delay)
    },

    async load (immediate = false) {
      const exec = async () => {
        const sig = JSON.stringify({
          preset: this.preset,
          from: this.from,
          to: this.to,
          type: this.type,
          mode: this.mode,
          source: this.source,
          q: this.q
        })
        if (!immediate && sig === this._lastSig) return
        this._lastSig = sig

        this.loading = true
        try {
          // 1) Opening balance (placeholder for now)
          this.opening = 0

          // 2) Build params for /getDayBook
          const params = { pageSize: 1000 }

          if (this.from && this.to && this.from === this.to) {
            params.date = this.from
          } else {
            if (this.from) params.fromDate = this.from
            if (this.to) params.toDate = this.to
          }

          const qs = new URLSearchParams(params).toString()
          const base = (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '')
          const url = `${base}/getDayBook${qs ? `?${qs}` : ''}`

          const resp = await fetch(url)
          if (!resp.ok) {
            const text = await resp.text().catch(() => '')
            throw new Error(text || `Failed to fetch day book (${resp.status})`)
          }
          const res = await resp.json()

          // sync UI date range with backend
          if (res.startISO) this.from = res.startISO
          if (res.endISO) this.to = res.endISO

          let items = Array.isArray(res.items) ? res.items : []

          // Normalize backend data → table shape
          items = items.map(r => {
            const created =
              typeof r.createdAt === 'number'
                ? r.createdAt * 1000   // epoch seconds -> ms
                : r.createdAt

            return {
              ...r,
              entryType: r.leg,               // 'DEBIT' / 'CREDIT'
              clientId: r.accountId,          // show accountId in Account column
              mode: r.meta?.paymentType,      // for Mode column
              extra: {
                ...(r.extra || {}),
                paymentType: r.meta?.paymentType
              },
              sourceType: r.type,             // e.g. 'DEPOSIT'
              sourceId: r.meta?.sourceId,     // e.g. 'DEP-2025...'
              createdAt: created
            }
          })

          // 3) Client-side filters
          if (this.type) {
            items = items.filter(r => r.entryType === this.type)
          }

          if (this.mode) {
            items = items.filter(r => r.mode === this.mode)
          }

          if (this.source) {
            items = items.filter(r => (r.sourceType || '') === this.source)
          }

          if (this.q && this.q.trim()) {
            const ql = this.q.trim().toLowerCase()
            items = items.filter(r =>
              String(r.clientId || '').toLowerCase().includes(ql) ||
              String(r.narration || '').toLowerCase().includes(ql) ||
              String(r.sourceId || '').toLowerCase().includes(ql)
            )
          }

          // 4) Sort latest first
          items.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )


          // 5) Flags (duplicate ref & large amounts)
          const refSeen = new Set()
          for (const it of items) {
            const ref = `${it.sourceType || ''}#${it.sourceId || ''}`
            if (it.sourceType && it.sourceId) {
              it._dupRef = refSeen.has(ref)
              refSeen.add(ref)
            }
            it._large = Number(it.amount || 0) >= 100000
          }

          this.rows = items

          // 6) Totals
          const totals = items.reduce((acc, r) => {
            if (r.entryType === 'DEBIT') acc.debit += Number(r.amount || 0)
            else if (r.entryType === 'CREDIT') acc.credit += Number(r.amount || 0)
            return acc
          }, { debit: 0, credit: 0 })
          this.totals = totals

          // Mode-wise totals
          const modeTotals = {}
          for (const r of items) {
            const m = r.mode
            if (m) modeTotals[m] = (modeTotals[m] || 0) + Number(r.amount || 0)
          }
          this.modeTotals = modeTotals
        } catch (e) {
          this.$emit('notify', {
            text: e.message || 'Failed to load day book',
            color: 'error'
          })
        } finally {
          this.loading = false
        }
      }
      if (immediate) return exec()
      this.debounced(exec)
    },

    // --- CSV helpers ---
    csv (v) {
      const s = (v == null) ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    },

    exportCsv () {
      const headers = [
        'Time',
        'Account',
        'EntryType',
        'Debit',
        'Credit',
        'Mode',
        'Narration',
        'SourceType',
        'SourceId'
      ]
      const lines = [headers.join(',')]
      for (const r of this.rows) {
        const debit = r.entryType === 'DEBIT' ? r.amount : ''
        const credit = r.entryType === 'CREDIT' ? r.amount : ''
        lines.push([
          this.csv(this.fmtDateTime(r.createdAt)),
          this.csv(r.clientId),
          this.csv(r.entryType),
          this.csv(debit),
          this.csv(credit),
          this.csv(r.mode || ''),
          this.csv(r.narration || ''),
          this.csv(r.sourceType || ''),
          this.csv(r.sourceId || '')
        ].join(','))
      }
      const name = `daybook_${this.from || 'na'}_${this.to || 'na'}.csv`
      this.downloadCsv(lines.join('\n'), name)
    },

    downloadCsv (content, filename) {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    // --- PDF ---
    async downloadPdf () {
      if (!this.$refs.pdfArea) return
      const filename = `daybook_${this.from || 'na'}_${this.to || 'na'}.pdf`
      const opt = {
        margin: [16, 18, 16, 18],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }
      await html2pdf().set(opt).from(this.$refs.pdfArea).save()
    }
  }
}
</script>

<style scoped>
.daybook-header {
  background: linear-gradient(135deg, #1a237e, #283593);
}
.preset-btn { text-transform: none; }
.stat-card { min-width: 150px; }

.ledger-table >>> thead th {
  background: #f4f6fb;
  color: #2a2a2a;
  font-weight: 700 !important;
}
.ledger-table >>> tbody tr:hover {
  background: #f9fbff !important;
}

.debit-cell {
  color: #c62828;
  font-weight: 600;
}
.credit-cell {
  color: #2e7d32;
  font-weight: 600;
}

/* PDF */
.pdf-root {
  background:#fff;
  color:#000;
  font-family: Inter, Arial, Helvetica, sans-serif;
  border:1px solid #e8eaf0;
  border-radius: 10px;
  padding: 16px;
}
.pdf-header {
  display:flex;
  justify-content:space-between;
  align-items:flex-start;
  border-bottom:1px solid #111;
  padding-bottom:8px;
  margin-bottom:10px;
}
.pdf-brand {
  display:flex;
  align-items:center;
  gap:10px;
}
.pdf-logo {
  width:38px;
  height:38px;
  object-fit:contain;
}
.pdf-brand-title {
  font-weight:800;
  font-size:16px;
}
.pdf-brand-sub {
  font-size:11px;
  color:#666;
}
.pdf-meta {
  text-align:right;
  font-size:11px;
}
.pdf-summary {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin:8px 0 12px;
}
.pill {
  padding:6px 10px;
  border-radius:16px;
  background:#f6f7fb;
  border:1px solid #e6e8f3;
  font-size:11px;
}
.pill.debit {
  background:#ffebee;
  border-color:#ffcdd2;
}
.pill.credit {
  background:#e8f5e9;
  border-color:#c8e6c9;
}
.plus { color:#2e7d32; }
.minus { color:#c62828; }

.pdf-table {
  width:100%;
  border-collapse:separate;
  border-spacing:0;
  font-size:11px;
}
.pdf-table thead th {
  background:#f0f2f8;
  border:1px solid #aeb7c6;
  padding:6px;
  text-align:left;
  font-weight:700;
}
.pdf-table tbody td {
  border:1px solid #cfd6e2;
  padding:6px;
}
.pdf-table tfoot td {
  border:1px solid #aeb7c6;
  padding:6px;
  background:#f6f7fb;
  font-weight:700;
}
.bg-debit  { background:#ffebee; }
.bg-credit { background:#e8f5e9; }
.text-center { text-align:center; }
.text-right  { text-align:right; }
.w-when { width: 120px; }
.w-client { width: 110px; }
.w-narration { width: 220px; }
.w-type { width: 60px; }
.w-money { width: 110px; }
.w-mode { width: 110px; }
.w-ref { width: 170px; }

.pdf-modes {
  display:flex;
  flex-wrap:wrap;
  gap:8px;
  margin-top:8px;
}
.pdf-sign {
  display:flex;
  justify-content:space-between;
  gap:18px;
  margin-top:18px;
}
.sig { flex:1; }
.sig-line {
  border-bottom:1px solid #000;
  height:38px;
}
.sig-label {
  text-align:center;
  font-size:11px;
  margin-top:4px;
  color:#333;
}


/* Row background colors - use deep selector because of scoped styles */
.ledger-table >>> .row-debit {
  background-color: rgba(255, 0, 0, 0.07) !important; /* very light red */
}

.ledger-table >>> .row-credit {
  background-color: rgba(0, 128, 0, 0.07) !important; /* very light green */
}

/* Optional: tweak text color inside those rows */
.ledger-table >>> .row-debit td {
  color: #b00000;
}

.ledger-table >>> .row-credit td {
  color: #0a7f00;
}

</style>
