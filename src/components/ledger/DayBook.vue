<template>
  <div class="pa-1">
    <v-card class="rounded-lg elevation-2">
      <!-- Header -->
      <v-sheet class="daybook-header rounded-t-lg" color="indigo darken-4" dark>
        <div class="d-flex align-center" style="padding:5px 20px;">
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
                :value="formatDDMMYYYY(from)"
                label="From"
                dense
                outlined
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                class="mr-2 mb-2"
                style="max-width:170px"
                clearable
                @click:clear="from = ''"
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
                :value="formatDDMMYYYY(to)"
                label="To"
                dense
                outlined
                hide-details
                readonly
                prepend-inner-icon="mdi-calendar"
                class="mr-2 mb-2"
                style="max-width:170px"
                clearable
                @click:clear="to = ''"
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

          <!-- Sold To (client-side) -->
          <v-select
            v-model="soldTo"
            :items="soldToItems"
            item-text="text"
            item-value="value"
            dense
            outlined
            hide-details
            clearable
            class="mr-2 mb-2"
            label="Sold To"
            style="max-width:150px"
          />

          <!-- Type -->
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

          <!-- Mode -->
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

          <!-- Source -->
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
            style="max-width:205px"
          />

          <v-btn
            color="primary"
            class="mb-2 mr-0"
            :loading="loading"
            @click="load(true)"
          >
            <v-icon left>mdi-refresh</v-icon>Load
          </v-btn>

          <v-spacer />

          <!-- Export buttons -->
          <v-btn class="mb-2 mr-2" color="blue accent-4"
            dark @click="exportCsv" :disabled="!rows.length">
            <v-icon left>mdi-download</v-icon>Excel
          </v-btn>
          <v-btn
            color="black accent-4"
            dark
            class="mb-2 mr-2"
            @click="downloadPdf"
            :disabled="!rows.length"
          >
            <v-icon left>mdi-file-pdf-box</v-icon>PDF
          </v-btn>

        </div>

        <!-- Status line -->
        <div class="mt-1 mb-3 grey--text text--darken-1">
          <v-chip small label class="mr-2">
            Range:
            <b class="ml-1">{{ formatDDMMYYYY(from) || '—' }}</b> — <b>{{ formatDDMMYYYY(to) || '—' }}</b>
          </v-chip>
          <v-chip small label class="mr-2">
            Preset:
            <b class="ml-1">{{ presetLabel }}</b>
          </v-chip>
          <v-chip v-if="type" small label class="mr-2">
            Type: <b class="ml-1">{{ type }}</b>
          </v-chip>
          <v-chip v-if="soldTo" small label class="mr-2">
            Sold To: <b class="ml-1">{{ soldTo }}</b>
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
          :items-per-page="13"
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

          <!-- Sold column -->
          <template #item.sold="{ item }">
            {{ item.sold || '' }}
          </template>

          <template #no-data>
            <div class="pa-6 grey--text text--darken-1">
              No entries for this day/range.
            </div>
          </template>
        </v-data-table>
      </div>
    </v-card>

    <!-- HIDDEN PDF AREA (kept for compatibility) -->
    <div
      ref="pdfArea"
      class="pdf-root"
      style="position:absolute; left:-9999px; top:-9999px;"
    >
      <!-- pdf preview (kept for compatibility) -->
    </div>
  </div>
</template>

<script>
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
      type: '',
      mode: '',
      source: '',
      q: '',
      soldTo: '',               // client-side filter

      fromMenu: false,
      toMenu: false,

      loading: false,
      rows: [],                 // final displayed rows (single per logical transaction)
      opening: 0,
      totals: { debit: 0, credit: 0 },
      modeTotals: {},

      // buffer of normalized fetched items (before client-side filters)
      fetchedItems: [],

      // selects
      typeItems: [
        { text: 'All', value: '' },
        { text: 'DEBIT', value: 'DEBIT' },
        { text: 'CREDIT', value: 'CREDIT' }
      ],
      soldToItems: [
        { text: 'All', value: '' },
        { text: 'Customer', value: 'Customer' },
        { text: 'Vendor', value: 'Vendor' }
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
      sourceItems: [
        { text: 'All', value: '' },
        { text: 'DEPOSIT', value: 'DEPOSIT' },
        { text: 'WITHDRAW', value: 'WITHDRAW' },
        { text: 'TRANSFER', value: 'TRANSFER' }
      ],

      // headers (S.No. first column)
      headers: [
        { text: 'S.No.', value: 'sno', sortable: false, align: 'center' },
        { text: 'Time', value: 'createdAt' },
        { text: 'Account', value: 'clientId' },
        { text: 'Sold', value: 'sold' },
        { text: 'Narration', value: 'narration' },
        { text: 'Type', value: 'entryType' },
        { text: 'Debit (₹)', value: 'debit', align: 'end' },
        { text: 'Credit (₹)', value: 'credit', align: 'end' },
        { text: 'Mode', value: 'mode' }
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
    // soldTo is client-side filter only; do not change server request parameters
    soldTo () { this.applyFilters() },
    preset (n) {
      this.applyPreset(n)
      this.load(true)
    }
  },

  methods: {
    rowClass (item) {
      if (!item || !item.entryType) return ''
      return item.entryType === 'DEBIT' ? 'row-debit' : 'row-credit'
    },

    // --- date helpers ---
    toStr (d) {
      const p = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    },

    formatDDMMYYYY (isoOrYmd) {
      if (!isoOrYmd) return ''
      const iso = String(isoOrYmd)
      const ymdMatch = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
      if (ymdMatch) {
        return `${ymdMatch[3]}/${ymdMatch[2]}/${ymdMatch[1]}`
      }
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      const p = n => String(n).padStart(2, '0')
      return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
    },

    applyPreset (key) {
      const today = new Date()

      if (key === 'today') {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        this.from = this.toStr(d)
        this.to = this.toStr(d)
      } else if (key === 'week') {
        const start = new Date(today)
        const dow = start.getDay() === 0 ? 6 : start.getDay() - 1
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

    // DATE as dd/mm/yyyy everywhere (with time kept)
    fmtDateTime (isoOrMs) {
      if (!isoOrMs && isoOrMs !== 0) return ''
      const d = new Date(isoOrMs)
      if (Number.isNaN(d.getTime())) return ''
      const p = n => String(n).padStart(2, '0')
      const dateStr = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
      const timeStr = d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      })
      return `${dateStr}, ${timeStr}`
    },

    debounced (fn, delay = 350) {
      clearTimeout(this._debounceT)
      this._debounceT = setTimeout(fn, delay)
    },

    // DEDUPE: pick single logical row for mirrored groups while preserving DEBIT/CREDIT
    dedupeItems (items) {
      const groups = new Map()
      for (const it of items) {
        // stable key: sourceType|sourceId|amount|createdAt
        const srcId = it.sourceId || (it.meta && it.meta.sourceId) || ''
        const key = `${it.sourceType || ''}|${srcId}|${Number(it.amount || 0).toFixed(2)}|${it.createdAt || ''}`
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(it)
      }

      const chosen = []
      for (const [k, group] of groups.entries()) {
        if (group.length === 1) {
          chosen.push(group[0])
          continue
        }

        // helpers
        const isCash = (row) => String(row.clientId || '').toUpperCase() === 'CASH_OR_BANK'
        const isAccountLike = (row) => /^ACCOUNT/i.test(String(row.clientId || '')) || /SALES_ACCOUNT/i.test(String(row.clientId || ''))
        // find non-cash debit
        const nonCashDebit = group.find(r => !isCash(r) && r.entryType === 'DEBIT')
        if (nonCashDebit) { chosen.push(nonCashDebit); continue }

        // find non-cash credit
        const nonCashCredit = group.find(r => !isCash(r) && r.entryType === 'CREDIT')
        if (nonCashCredit) { chosen.push(nonCashCredit); continue }

        // else prefer any non-cash (prefer account-like)
        const nonCash = group.filter(r => !isCash(r))
        if (nonCash.length) {
          const accLike = nonCash.find(isAccountLike)
          chosen.push(accLike || nonCash[0])
          continue
        }

        // else no non-cash rows; prefer DEBIT if present
        const anyDebit = group.find(r => r.entryType === 'DEBIT')
        if (anyDebit) { chosen.push(anyDebit); continue }

        // fallback to first
        chosen.push(group[0])
      }

      return chosen
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
          // soldTo intentionally not included here (client-side)
        })
        if (!immediate && sig === this._lastSig) return
        this._lastSig = sig

        this.loading = true
        try {
          this.opening = 0

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

          if (res.startISO) this.from = res.startISO
          if (res.endISO) this.to = res.endISO

          let items = Array.isArray(res.items) ? res.items : []

          // normalize items
          items = items.map((r, idx) => {
            const created =
              typeof r.createdAt === 'number'
                ? r.createdAt * 1000
                : r.createdAt

            const soldLabel =
              r.type === 'SALE_TO_CUSTOMER' ? 'Customer' :
              r.type === 'SALE_TO_VENDOR' || r.type === 'DEPOSIT' ? 'Vendor' : ''

            return {
              ...r,
              entryType: r.leg,
              clientId: r.accountId,
              sold: soldLabel,
              mode: r.meta?.paymentType,
              extra: {
                ...(r.extra || {}),
                paymentType: r.meta?.paymentType
              },
              sourceType: r.type,
              sourceId: r.meta?.sourceId || (r.meta && r.meta.sourceId) || '',
              createdAt: created,
              _fetchedIndex: idx
            }
          })

          // dedupe mirrored rows but keep correct DEBIT/CREDIT row per group
          items = this.dedupeItems(items)

          // store raw fetched items (unfiltered)
          this.fetchedItems = items

          // apply filters and compute rows/totals
          this.applyFilters()
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

    applyFilters () {
      let items = Array.isArray(this.fetchedItems) ? [...this.fetchedItems] : []

      if (this.type) items = items.filter(r => r.entryType === this.type)
      if (this.mode) items = items.filter(r => r.mode === this.mode)
      if (this.source) items = items.filter(r => (r.sourceType || '') === this.source)

      if (this.soldTo) items = items.filter(r => r.sold === this.soldTo)

      if (this.q && this.q.trim()) {
        const ql = this.q.trim().toLowerCase()
        items = items.filter(r =>
          String(r.clientId || '').toLowerCase().includes(ql) ||
          String(r.narration || '').toLowerCase().includes(ql) ||
          String(r.sourceId || '').toLowerCase().includes(ql)
        )
      }

      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      // add serial number for UI and PDF & Excel
      items = items.map((r, idx) => ({ ...r, sno: idx + 1 }))

      this.rows = items

      const totals = items.reduce((acc, r) => {
        if (r.entryType === 'DEBIT') acc.debit += Number(r.amount || 0)
        else if (r.entryType === 'CREDIT') acc.credit += Number(r.amount || 0)
        return acc
      }, { debit: 0, credit: 0 })
      this.totals = totals

      const modeTotals = {}
      for (const r of items) {
        const m = r.mode
        if (m) modeTotals[m] = (modeTotals[m] || 0) + Number(r.amount || 0)
      }
      this.modeTotals = modeTotals
    },

    // kept for compatibility (not used by Excel anymore, but does not break anything)
    csv (v) {
      const s = (v == null) ? '' : String(v)
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    },

    escapeHtml (txt) {
      return String(txt == null ? '' : txt)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    },

    // SAME NAME (exportCsv) but now generates EXCEL .xls file
    exportCsv () {
      const headers = [
        'S.No.',
        'Date & Time',
        'Account',
        'Sold',
        'Narration',
        'Entry Type',
        'Debit',
        'Credit',
        'Mode',
        'Source Type',
        'Source Id'
      ]

      let html = '<table border="1"><thead><tr>' +
        headers.map(h => `<th>${this.escapeHtml(h)}</th>`).join('') +
        '</tr></thead><tbody>'

      for (let i = 0; i < this.rows.length; i++) {
        const r = this.rows[i]
        const sno = r.sno || (i + 1)
        const debit = r.entryType === 'DEBIT' ? (r.amount || 0) : ''
        const credit = r.entryType === 'CREDIT' ? (r.amount || 0) : ''

        const dateTime = this.fmtDateTime(r.createdAt)

        html += '<tr>' +
          `<td>${this.escapeHtml(sno)}</td>` +
          `<td>${this.escapeHtml(dateTime)}</td>` +
          `<td>${this.escapeHtml(r.clientId || '')}</td>` +
          `<td>${this.escapeHtml(r.sold || '')}</td>` +
          `<td>${this.escapeHtml(r.narration || '')}</td>` +
          `<td>${this.escapeHtml(r.entryType || '')}</td>` +
          `<td>${this.escapeHtml(debit)}</td>` +
          `<td>${this.escapeHtml(credit)}</td>` +
          `<td>${this.escapeHtml(r.mode || '')}</td>` +
          `<td>${this.escapeHtml(r.sourceType || '')}</td>` +
          `<td>${this.escapeHtml(r.sourceId || '')}</td>` +
          '</tr>'
      }

      html += '</tbody></table>'

      const fullHtml =
        '<html><head><meta charset="UTF-8"></head><body>' +
        html +
        '</body></html>'

      const blob = new Blob([fullHtml], {
        type: 'application/vnd.ms-excel;charset=utf-8;'
      })

      const name = `daybook_${this.from || 'na'}_${this.to || 'na'}.xls`
      this.downloadCsv(blob, name)
    },

    // re-used name, but now expects BLOB and filename (works fine)
    downloadCsv (blobOrContent, filename) {
      let blob = blobOrContent
      if (!(blobOrContent instanceof Blob)) {
        blob = new Blob([blobOrContent], {
          type: 'application/vnd.ms-excel;charset=utf-8;'
        })
      }
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    },

    async downloadPdf () {
      const pageSize = 38

      // dd/mm/yyyy for PDF dates
      const formatDate = (value) => {
        if (!value && value !== 0) return ''
        const d = new Date(value)
        if (Number.isNaN(d.getTime())) return ''
        const p = n => String(n).padStart(2, '0')
        return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
      }

      const formatAmount = (v) => {
        const n = Number(v || 0)
        return n.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      }

      const safe = (txt) =>
        String(txt == null ? '' : txt)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')

      const rowsForPdf = Array.isArray(this.rows) ? [...this.rows] : []

      // split rows into pages of `pageSize`
      const pages = []
      for (let i = 0; i < rowsForPdf.length; i += pageSize) {
        pages.push(rowsForPdf.slice(i, i + pageSize))
      }

      // build HTML for pages
      const pagesHtml = pages.map((rows, pageIndex) => {
        const pageNo = pageIndex + 1
        const totalPages = pages.length
        const isLast = pageIndex === totalPages - 1

        const rowsHtml = rows.map(r => `
          <tr>
            <td class="col-sno">${safe(r.sno || '')}</td>
            <td class="col-date">${safe(formatDate(r.createdAt))}</td>
            <td class="col-journal">${safe(r.sourceType || '')}</td>
            <td class="col-ref">${safe(r.sourceId || '')}</td>
            <td class="col-desc">${safe(r.narration || '')}</td>
            <td class="col-sold">${safe(r.sold || '')}</td>
            <td class="col-debit">${r.entryType === 'DEBIT' ? formatAmount(r.amount) : ''}</td>
            <td class="col-credit">${r.entryType === 'CREDIT' ? formatAmount(r.amount) : ''}</td>
          </tr>
        `).join('')

        const footerHtml = isLast
          ? `
            <tfoot>
              <tr>
                <td class="col-sno"></td>
                <td class="col-date"></td>
                <td class="col-journal"></td>
                <td class="col-ref"></td>
                <td class="col-desc ledger-totals-label">TOTALS</td>
                <td class="col-sold"></td>
                <td class="col-debit">${formatAmount(this.totals.debit)}</td>
                <td class="col-credit">${formatAmount(this.totals.credit)}</td>
              </tr>
            </tfoot>`
          : ''

        return `
          <div class="ledger-page">
            <div class="ledger-top-row">
              <span>Page: ${pageNo} of ${totalPages}</span>
              <span>As of: ${safe(formatDate(this.to || this.nowIso))}</span>
            </div>
            <div class="ledger-top-row">
              <span>Report: R-4-3</span>
              <span></span>
            </div>

            <div class="ledger-title"><h2>Ansari Automobiles</h2></div>
            <div class="ledger-subtitle">BADI KAMHARIYA BY PASS ROAD MAU</div>
            <div class="ledger-subtitle">GSTIN/UIN- 09AJBPA4037B1ZY</div>
            <div class="ledger-subtitle">GENERAL LEDGER TRANSACTIONS</div>
            <div class="ledger-subtitle">
              All transactions for (${safe(this.from || 'Start')} to ${safe(this.to || 'End')})
            </div>

            <table class="ledger-table">
              <thead>
                <tr class="ledger-header-row">
                  <th class="col-sno">S.NO.</th>
                  <th class="col-date">DATE</th>
                  <th class="col-journal">JOURNL</th>
                  <th class="col-ref">REFERENCE</th>
                  <th class="col-desc">DESCRIPTION</th>
                  <th class="col-sold">SOLD</th>
                  <th class="col-debit">DEBIT</th>
                  <th class="col-credit">CREDIT</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              ${footerHtml}
            </table>
          </div>
        `
      }).join('')

      // container with styles
      const container = document.createElement('div')
      container.innerHTML = `
        <style>
          .ledger-root {
            font-family: "Courier New", Courier, monospace;
            font-size: 10px;
            color: #000;
            background: #fff;
            padding: 18px;
          }
          .ledger-page { page-break-after: always; }
          .ledger-page:last-child { page-break-after: auto; }
          .ledger-top-row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .ledger-title { text-align: center; font-weight: bold; margin-top: 8px; }
          .ledger-subtitle { text-align: center; margin-bottom: 8px; }

          .ledger-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10px;
          }
          .ledger-table th,
          .ledger-table td {
            padding: 2px 6px;
            white-space: nowrap;
            border: none;
          }
          .ledger-header-row th {
            border-bottom: 1px solid #000;
            background: #f4f6fb;
            color: #2a2a2a;
            font-weight: 700 !important;
          }

          .ledger-table tfoot td {
            padding-top: 6px;
            font-weight: 700;
            background: #f6f7fb;
          }

          .ledger-totals-label { text-align: right; padding-right: 6px; }

          .col-sno    { width: 40px; text-align: center; }
          .col-date   { width: 70px; }
          .col-journal{ width: 60px; }
          .col-ref    { width: 70px; }
          .col-desc   { width: 330px; }
          .col-account{ width: 110px; }
          .col-sold   { width: 70px; text-align: center; }
          .col-debit  { width: 80px; text-align: right; }
          .col-credit { width: 80px; text-align: right; }
        </style>

        <div class="ledger-root">
          ${pagesHtml}
        </div>
      `

      document.body.appendChild(container)

      const filename = `daybook_${this.from || 'na'}_${this.to || 'na'}.pdf`

      // 🔥 HIGH QUALITY SETTINGS
      const deviceScale = window.devicePixelRatio || 1.5
      const opt = {
        margin: [16, 18, 16, 18],
        filename,
        image: {
          type: 'png',   // PNG + high scale = very crisp
          quality: 1.0   // max quality
        },
        html2canvas: {
          scale: Math.max(2, deviceScale * 2), // typically 3–4 on modern screens
          useCORS: true,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' }
      }

      try {
        const worker = html2pdf().set(opt).from(container).toPdf()
        const pdf = await worker.get('pdf')
        const blobUrl = pdf.output('bloburl')
        window.open(blobUrl, '_blank')
      } finally {
        document.body.removeChild(container)
      }
    }

  }
}
</script>

<style scoped>
.pdf-table .w-sold { width: 80px; text-align: center; }

.daybook-header { background: linear-gradient(135deg, #1a237e, #283593); }
.preset-btn { text-transform: none; }
.stat-card { min-width: 150px; }

.ledger-table >>> thead th { background: #f4f6fb; color: #2a2a2a; font-weight: 700 !important; }
.ledger-table >>> tbody tr:hover { background: #f9fbff !important; }

.debit-cell { color: #c62828; font-weight: 600; }
.credit-cell { color: #2e7d32; font-weight: 600; }

/* PDF */
.pdf-root { background:#fff; color:#000; font-family: Inter, Arial, Helvetica, sans-serif; border:1px solid #e8eaf0; border-radius: 10px; padding: 16px; }
.pdf-header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #111; padding-bottom:8px; margin-bottom:10px; }
.pdf-brand { display:flex; align-items:center; gap:10px; }
.pdf-logo { width:38px; height:38px; object-fit:contain; }
.pdf-brand-title { font-weight:800; font-size:16px; }
.pdf-brand-sub { font-size:11px; color:#666; }
.pdf-meta { text-align:right; font-size:11px; }
.pdf-summary { display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 12px; }
.pill { padding:6px 10px; border-radius:16px; background:#f6f7fb; border:1px solid #e6e8f3; font-size:11px; }
.pill.debit { background:#ffebee; border-color:#ffcdd2; }
.pill.credit { background:#e8f5e9; border-color:#c8e6c9; }
.plus { color:#2e7d32; } .minus { color:#c62828; }

.pdf-table { width:100%; border-collapse:separate; border-spacing:0; font-size:11px; }
.pdf-table thead th { background:#f0f2f8; border:1px solid #aeb7c6; padding:6px; text-align:left; font-weight:700; }
.pdf-table tbody td { border:1px solid #cfd6e2; padding:6px; }
.pdf-table tfoot td { border:1px solid #aeb7c6; padding:6px; background:#f6f7fb; font-weight:700; }
.bg-debit  { background:#ffebee; } .bg-credit { background:#e8f5e9; }
.text-center { text-align:center; } .text-right  { text-align:right; }
.w-sno { width: 40px; } .w-when { width: 120px; } .w-client { width: 110px; } .w-narration { width: 220px; }
.w-type { width: 60px; } .w-money { width: 110px; } .w-mode { width: 110px; } .w-ref { width: 170px; }

.pdf-modes { display:flex; flex-wrap:wrap; gap:8px; margin-top:8px; }
.pdf-sign { display:flex; justify-content:space-between; gap:18px; margin-top:18px; }
.sig { flex:1; } .sig-line { border-bottom:1px solid #000; height:38px; } .sig-label { text-align:center; font-size:11px; margin-top:4px; color:#333; }

.ledger-table >>> .row-debit { background-color: rgba(255, 0, 0, 0.07) !important; }
.ledger-table >>> .row-credit { background-color: rgba(0, 128, 0, 0.07) !important; }
.ledger-table >>> .row-debit td { color: #b00000; }
.ledger-table >>> .row-credit td { color: #0a7f00; }
</style>
