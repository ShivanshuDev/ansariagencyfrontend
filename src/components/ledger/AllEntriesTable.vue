<template>
  <div class="pa-3">
    <v-card class="elevation-2 rounded-lg">
      <!-- Header -->
      <v-sheet color="indigo darken-4" dark class="pa-3 rounded-t-lg gradient-header">
        <div class="d-flex align-center">
          <div class="d-flex align-center">
            <v-avatar size="36" class="mr-3" v-if="brandLogo">
              <img :src="brandLogo" alt="Logo">
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ brandName }}</div>
              <div class="caption">{{ brandSubtitle }}</div>
            </div>
          </div>
          <v-spacer />
          <div class="text-right">
            <div class="overline">Client Ledger</div>
            <div class="caption">Refreshed {{ fmtDateTime(new Date().toISOString()) }}</div>
          </div>
        </div>
      </v-sheet>

      <!-- Filters -->
      <div class="px-4 pt-4">
        <div class="d-flex align-center flex-wrap">
          <v-btn-toggle v-model="preset" class="mr-3 mb-2" mandatory rounded>
            <v-btn value="today" class="preset-btn">Today</v-btn>
            <v-btn value="week" class="preset-btn">Week</v-btn>
            <v-btn value="month" class="preset-btn">Month</v-btn>
            <v-btn value="year" class="preset-btn">Year</v-btn>
            <v-btn value="custom" class="preset-btn">Custom</v-btn>
          </v-btn-toggle>

          <!-- From -->
          <v-menu v-model="fromMenu" :close-on-content-click="false" transition="scale-transition" offset-y max-width="290" min-width="290">
            <template v-slot:activator="{ on, attrs }">
              <v-text-field v-bind="attrs" v-on="on" v-model="from" dense outlined hide-details readonly
                label="From" prepend-inner-icon="mdi-calendar" class="mr-2 mb-2" style="max-width: 180px" clearable
                @click:clear="from=''" />
            </template>
            <v-date-picker v-model="from" :max="to || undefined" @input="fromMenu=false" scrollable no-title/>
          </v-menu>

          <!-- To -->
          <v-menu v-model="toMenu" :close-on-content-click="false" transition="scale-transition" offset-y max-width="290" min-width="290">
            <template v-slot:activator="{ on, attrs }">
              <v-text-field v-bind="attrs" v-on="on" v-model="to" dense outlined hide-details readonly
                label="To" prepend-inner-icon="mdi-calendar" class="mr-2 mb-2" style="max-width: 180px" clearable
                @click:clear="to=''" />
            </template>
            <v-date-picker v-model="to" :min="from || undefined" @input="toMenu=false" scrollable no-title/>
          </v-menu>

          <v-select
            v-model="type"
            :items="typeItems"
            item-text="text" item-value="value"
            dense outlined hide-details clearable class="mr-2 mb-2" style="max-width:180px"
            label="Type"
          />
          <v-select
            v-model="sign"
            :items="signItems"
            item-text="text" item-value="value"
            dense outlined hide-details clearable class="mr-2 mb-2" style="max-width:180px"
            label="Amount"
          />

          <v-btn color="primary" class="mb-2" :loading="loading" @click="load(true)">
            <v-icon left>mdi-refresh</v-icon>Load
          </v-btn>

          <v-spacer />

          <v-btn class="mb-2 mr-2" @click="exportSummaryCsv" :disabled="!clientRows.length">
            <v-icon left>mdi-download</v-icon>CSV
          </v-btn>
        </div>

        <div class="mt-1 mb-3 grey--text text--darken-1">
          <v-chip small label class="mr-2">Range: <strong class="ml-1">{{ from || '—' }}</strong> — <strong>{{ to || '—' }}</strong></v-chip>
          <v-chip small label class="mr-2">Preset: <strong class="ml-1">{{ presetLabel }}</strong></v-chip>
          <v-chip v-if="type" small label class="mr-2">Type: <strong class="ml-1">{{ type }}</strong></v-chip>
          <v-chip v-if="sign" small label>Amount: <strong class="ml-1">{{ signLabel }}</strong></v-chip>
        </div>
      </div>

      <!-- Summary table -->
      <div class="px-2 pb-4">
        <v-data-table
          :headers="summaryHeaders"
          :items="clientRows"
          :items-per-page="10"
          :loading="loading"
          dense
          item-key="clientId"
          class="elevation-1 rounded-lg ledger-table"
          @click:row="openClient"
        >
          <template #loading>
            <div class="pa-6 grey--text text--darken-1">Fetching entries…</div>
          </template>

          <template #item.totalDebit="{ item }">
            <span class="debit-cell">{{ money(item.totalDebit) }}</span>
          </template>

          <template #item.totalCredit="{ item }">
            <span class="credit-cell">{{ money(item.totalCredit) }}</span>
          </template>

          <template #item.net="{ item }">
            <v-chip x-small :color="item.net >= 0 ? 'green lighten-4' : 'red lighten-4'">
              <span :class="item.net >= 0 ? 'green--text text--darken-2' : 'red--text text--darken-2'">
                {{ money(item.net) }}
              </span>
            </v-chip>
          </template>

          <template #item.latestBalance="{ item }">
            <v-chip small :color="item.latestBalance >= 0 ? 'green lighten-4' : 'red lighten-4'">
              <span :class="item.latestBalance >= 0 ? 'green--text text--darken-2' : 'red--text text--darken-2'">
                {{ money(item.latestBalance) }}
              </span>
            </v-chip>
          </template>

          <template #no-data>
            <div class="pa-6 grey--text text--darken-1">No entries for the selected filters.</div>
          </template>
        </v-data-table>
        </div>
    </v-card>

    <!-- CLIENT DIALOG -->
    <v-dialog v-model="dialog" max-width="1700px" scrollable>
      <v-card class="rounded-lg">
        <v-toolbar flat dense class="rounded-t-lg client-toolbar">
          <v-toolbar-title class="subtitle-1">
            <div class="d-flex align-center">
              <v-icon left color="indigo darken-3" class="mr-2">mdi-account</v-icon>
              <div>
                <div><strong>{{ activeClient?.clientId || '—' }}</strong></div>
                <div v-if="activeClientName" class="caption grey--text">{{ activeClientName }}</div>
              </div>
            </div>
          </v-toolbar-title>
          <v-spacer/>
          <v-btn icon @click="dialog=false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-card-text>
          <!-- Dialog Filter Row -->
          <v-sheet class="rounded pa-3 mb-3" color="grey lighten-4">
            <div class="d-flex align-center flex-wrap">
              <v-btn-toggle v-model="d.preset" class="mr-2 mb-2" mandatory rounded>
                <v-btn small value="today">Today</v-btn>
                <v-btn small value="week">Week</v-btn>
                <v-btn small value="month">Month</v-btn>
                <v-btn small value="year">Year</v-btn>
                <v-btn small value="custom">Custom</v-btn>
              </v-btn-toggle>

              <v-menu v-model="d.fromMenu" :close-on-content-click="false" transition="scale-transition" offset-y max-width="290" min-width="290">
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field v-bind="attrs" v-on="on" v-model="d.from" dense outlined readonly hide-details label="From"
                    prepend-inner-icon="mdi-calendar" class="mr-2 mb-2" style="max-width:150px"/>
                </template>
                <v-date-picker v-model="d.from" :max="d.to || undefined" @input="d.fromMenu=false" scrollable no-title/>
              </v-menu>

              <v-menu v-model="d.toMenu" :close-on-content-click="false" transition="scale-transition" offset-y max-width="290" min-width="290">
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field v-bind="attrs" v-on="on" v-model="d.to" dense outlined readonly hide-details label="To"
                    prepend-inner-icon="mdi-calendar" class="mr-2 mb-2" style="max-width:150px"/>
                </template>
                <v-date-picker v-model="d.to" :min="d.from || undefined" @input="d.toMenu=false" scrollable no-title/>
              </v-menu>

              <v-select v-model="d.type" :items="typeItems" item-text="text" item-value="value" dense outlined hide-details
                class="mr-2 mb-2" style="max-width:140px" label="Type"/>
              <v-select v-model="d.sign" :items="signItems" item-text="text" item-value="value" dense outlined hide-details
                class="mr-2 mb-2" style="max-width:140px" label="Amount"/>

              <v-btn small color="primary" class="mb-2 mr-2" :loading="d.loading" @click="loadClient(true)">
                <v-icon left small>mdi-refresh</v-icon>Load
              </v-btn>

              <v-spacer />

              <!-- Exports -->
              <v-btn small class="mb-2 mr-2" @click="exportClientCsv" :disabled="!d.rows.length">
                <v-icon left small>mdi-download</v-icon>CSV
              </v-btn>
              <v-btn small class="mb-2 mr-2" @click="exportClientSummaryCsv" :disabled="!d.rows.length">
                <v-icon left small>mdi-file-document</v-icon>Summary CSV
              </v-btn>
              <v-btn small color="deep-purple accent-4" dark class="mb-2" @click="downloadClientPdf" :disabled="!d.rows.length">
                <v-icon left small>mdi-file-pdf-box</v-icon>PDF
              </v-btn>
            </div>

            <!-- Key Stats -->
            <div class="d-flex flex-wrap mt-2">
              <v-card outlined class="pa-3 mr-3 mb-2 stat-card">
                <div class="caption grey--text text--darken-1">Opening</div>
                <div class="text-subtitle-2" :class="openingBalance >= 0 ? 'green--text text--darken-2' : 'red--text text--darken-2'">
                  {{ money(openingBalance) }}
                </div>
              </v-card>
              <v-card outlined class="pa-3 mr-3 mb-2 stat-card">
                <div class="caption grey--text text--darken-1">Debit</div>
                <div class="text-subtitle-2 debit-cell">{{ money(d.totals.debit) }}</div>
              </v-card>
              <v-card outlined class="pa-3 mr-3 mb-2 stat-card">
                <div class="caption grey--text text--darken-1">Credit</div>
                <div class="text-subtitle-2 credit-cell">{{ money(d.totals.credit) }}</div>
              </v-card>
              <v-card outlined class="pa-3 mb-2 stat-card">
                <div class="caption grey--text text--darken-1">Closing</div>
                <div class="text-subtitle-2" :class="d.latestBalance >= 0 ? 'green--text text--darken-2' : 'red--text text--darken-2'">
                  {{ money(d.latestBalance) }}
                </div>
              </v-card>
            </div>
          </v-sheet>

          <!-- Detail table -->
          <v-expand-transition>
            <div v-if="showTable">
              <v-data-table
                :headers="detailHeaders"
                :items="d.rows"
                :items-per-page="12"
                :loading="d.loading"
                dense
                item-key="sk"
                class="elevation-1 rounded-lg ledger-table"
              >
                <template #loading>
                  <div class="pa-6 grey--text text--darken-1">Fetching entries…</div>
                </template>

                <template #item.amount="{ item }">
                  <span :class="item.entryType==='DEBIT' ? 'debit-cell' : 'credit-cell'">{{ money(item.amount) }}</span>
                </template>

                <template #item.runningBalance="{ item }">
                  <span :class="item.runningBalance>=0 ? 'green--text text--darken-2' : 'red--text text--darken-2'">
                    {{ money(item.runningBalance) }}
                  </span>
                </template>

                <template #item.createdAt="{ item }">
                  {{ fmtDateTime(item.createdAt) }}
                </template>

                <template #no-data>
                  <div class="pa-6 grey--text text--darken-1">No entries for this client in the selected range.</div>
                </template>
              </v-data-table>
            </div>
          </v-expand-transition>

          <!-- PDF Canvas: modern ledger layout -->
          <div ref="pdfArea" class="pdf-root mt-6">
            <!-- PDF header -->
            <div class="pdf-header">
              <div class="pdf-brand">
                <img v-if="brandLogo" :src="brandLogo" class="pdf-logo" />
                <div>
                  <div class="pdf-brand-title">{{ brandName }}</div>
                  <div class="pdf-brand-sub">{{ brandSubtitle }}</div>
                  <!-- in the main header/filter bar, next to the Load / CSV buttons -->
                  <v-btn class="mb-2 mr-2" outlined @click="toggleTable">
                    <v-icon left>{{ showTable ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon>
                    {{ showTable ? 'Hide Table' : 'Show Table' }}
                  </v-btn>

                </div>
              </div>
              <div class="pdf-meta">
                <div><b>Client:</b> {{ activeClient?.clientId || '—' }} <span v-if="activeClientName">({{ activeClientName }})</span></div>
                <div><b>Range:</b> {{ d.from || '—' }} — {{ d.to || '—' }}</div>
                <div><b>Generated:</b> {{ fmtDateTime(new Date().toISOString()) }}</div>
              </div>
            </div>

            <!-- Opening/summary row -->
            <div class="pdf-summary">
              <div class="pill">Opening: <b :class="openingBalance>=0 ? 'plus' : 'minus'">{{ money(openingBalance) }}</b></div>
              <div class="pill debit">Debit: <b>{{ money(d.totals.debit) }}</b></div>
              <div class="pill credit">Credit: <b>{{ money(d.totals.credit) }}</b></div>
              <div class="pill">Closing: <b :class="d.latestBalance>=0 ? 'plus' : 'minus'">{{ money(d.latestBalance) }}</b></div>
            </div>

            <!-- Ledger table (debit/credit split) -->
            <table class="pdf-table">
              <thead>
                <tr>
                  <th class="w-when">When</th>
                  <th class="w-narration">Narration</th>
                  <th class="w-type">Type</th>
                  <th class="w-money bg-debit">Debit (₹)</th>
                  <th class="w-money bg-credit">Credit (₹)</th>
                  <th class="w-money">Running (₹)</th>
                  <th class="w-ref">Ref</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(r,i) in d.rows" :key="r.sk || i">
                  <td>{{ fmtDateTime(r.createdAt) }}</td>
                  <td>{{ r.narration || '' }}</td>
                  <td class="text-center">{{ r.entryType }}</td>
                  <td class="text-right debit-cell">{{ r.entryType==='DEBIT' ? money(r.amount) : '—' }}</td>
                  <td class="text-right credit-cell">{{ r.entryType==='CREDIT' ? money(r.amount) : '—' }}</td>
                  <td class="text-right" :class="Number(r.runningBalance||0) >= 0 ? 'plus' : 'minus'">
                    {{ money(r.runningBalance) }}
                  </td>
                  <td>{{ (r.sourceType || '') + (r.sourceId ? ' / '+r.sourceId : '') }}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="3" class="text-right"><b>Totals:</b></td>
                  <td class="text-right debit-cell"><b>{{ money(d.totals.debit) }}</b></td>
                  <td class="text-right credit-cell"><b>{{ money(d.totals.credit) }}</b></td>
                  <td class="text-right" :class="d.latestBalance>=0 ? 'plus' : 'minus'"><b>{{ money(d.latestBalance) }}</b></td>
                  <td></td>
                </tr>
              </tfoot>
            </table>

            <div class="pdf-footnote">
              * Debit reduces customer wallet/advance; Credit increases it. Running is the live balance after each entry.
            </div>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer/>
          <v-btn text @click="dialog=false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
// npm i html2pdf.js
import html2pdf from 'html2pdf.js'
import { ledgerApi } from '@/services/ledgerApi'

export default {
  name: 'ClientLedgerPro',
  props: {
    brandName: { type: String, default: 'Ansari Automobiles' },
    brandSubtitle: { type: String, default: 'Client Ledger' },
    brandLogo: { type: String, default: '' } // optional: pass your logo path
  },
  data () {
    return {
      showTable: JSON.parse(localStorage.getItem('ledger_showTable') || 'true'),
      // global filters
      from: '',
      to: '',
      type: '',
      sign: '',
      preset: 'month',

      fromMenu: false,
      toMenu: false,
      loading: false,

      allRows: [],
      clientRows: [],

      // dialog
      dialog: false,
      activeClient: null,
      activeClientName: '',
      d: {
        from: '',
        to: '',
        type: '',
        sign: '',
        preset: 'month',
        fromMenu: false,
        toMenu: false,
        loading: false,
        rows: [],
        latestBalance: 0,
        totals: { debit: 0, credit: 0 }
      },

      typeItems: [
        { text: 'All', value: '' },
        { text: 'DEBIT', value: 'DEBIT' },
        { text: 'CREDIT', value: 'CREDIT' }
      ],
      signItems: [
        { text: 'All Amounts', value: '' },
        { text: 'Positive Only', value: 'POS' },
        { text: 'Negative Only', value: 'NEG' }
      ],

      summaryHeaders: [
        { text: 'Client ID', value: 'clientId' },
        { text: 'Total Debit', value: 'totalDebit', align: 'end' },
        { text: 'Total Credit', value: 'totalCredit', align: 'end' },
        { text: 'Net (DR-CR)', value: 'net', align: 'end' },
        { text: 'Latest Balance', value: 'latestBalance', align: 'end' },
        { text: 'Entries', value: 'count', align: 'end' }
      ],
      detailHeaders: [
        { text: 'When', value: 'createdAt' },
        { text: 'Type', value: 'entryType' },
        { text: 'Amount', value: 'amount', align: 'end' },
        { text: 'Running', value: 'runningBalance', align: 'end' },
        { text: 'Narration', value: 'narration' },
        { text: 'Status', value: 'status' },
        { text: 'Ref', value: 'sourceId' }
      ],

      _debounceT: null,
      _lastQuery: ''
    }
  },

  computed: {
    presetLabel () {
      return { today:'Today', week:'This Week', month:'This Month', year:'This Year', custom:'Custom' }[this.preset] || 'Custom'
    },
    signLabel () {
      return { '':'All', POS:'Positive', NEG:'Negative' }[this.sign]
    },
    // Opening balance derived from first row in-range
    openingBalance () {
      if (!this.d.rows.length) return 0
      const first = this.d.rows[0]
      const rb = Number(first.runningBalance || 0)
      const delta = first.entryType === 'DEBIT' ? Number(first.amount || 0) : -Number(first.amount || 0)
      return Number((rb - delta).toFixed(2))
    }
  },

  created () {
    this.applyPreset('month')
    this.applyDialogPreset('month')
    this.load(true)
  },

  watch: {
    from () { this.load() },
    to () { this.load() },
    type () { this.load() },
    sign () { this.load() },
    preset (n) { this.applyPreset(n); this.load(true) },
    'd.from' () { this.loadClient() },
    'd.to' () { this.loadClient() },
    'd.type' () { this.loadClient() },
    'd.sign' () { this.loadClient() },
    'd.preset' (n) { this.applyDialogPreset(n); this.loadClient(true) }
  },

  methods: {
    toggleTable () {
    this.showTable = !this.showTable
    localStorage.setItem('ledger_showTable', JSON.stringify(this.showTable))
  },
    // Date helpers
    toStr (d) {
      const pad = n => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    },
    applyPreset (key) {
      const today = new Date()
      if (key === 'today') {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        this.from = this.toStr(d); this.to = this.toStr(d)
      } else if (key === 'week') {
        const start = new Date(today)
        const dow = start.getDay() === 0 ? 6 : start.getDay() - 1
        start.setDate(start.getDate() - dow)
        const end = new Date(start); end.setDate(start.getDate() + 6)
        this.from = this.toStr(start); this.to = this.toStr(end)
      } else if (key === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        this.from = this.toStr(start); this.to = this.toStr(end)
      } else if (key === 'year') {
        const start = new Date(today.getFullYear(), 0, 1)
        const end = new Date(today.getFullYear(), 11, 31)
        this.from = this.toStr(start); this.to = this.toStr(end)
      }
    },
    applyDialogPreset (key) {
      const today = new Date()
      if (key === 'today') {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate())
        this.d.from = this.toStr(d); this.d.to = this.toStr(d)
      } else if (key === 'week') {
        const start = new Date(today)
        const dow = start.getDay() === 0 ? 6 : start.getDay() - 1
        start.setDate(start.getDate() - dow)
        const end = new Date(start); end.setDate(start.getDate() + 6)
        this.d.from = this.toStr(start); this.d.to = this.toStr(end)
      } else if (key === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1)
        const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        this.d.from = this.toStr(start); this.d.to = this.toStr(end)
      } else if (key === 'year') {
        const start = new Date(today.getFullYear(), 0, 1)
        const end = new Date(today.getFullYear(), 11, 31)
        this.d.from = this.toStr(start); this.d.to = this.toStr(end)
      }
    },

    // Formatters
    money (v) {
      const n = Number(v || 0)
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(n)
    },
    fmtDateTime (iso) {
      if (!iso) return ''
      const d = new Date(iso)
      return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
    },

    // Loaders (summary)
    debounced (fn, delay=350) { clearTimeout(this._debounceT); this._debounceT = setTimeout(fn, delay) },
    async load (immediate=false) {
      const exec = async () => {
        const sig = JSON.stringify({ from:this.from, to:this.to, type:this.type, sign:this.sign })
        if (!immediate && sig === this._lastQuery) return
        this._lastQuery = sig

        this.loading = true
        try {
          const res = await ledgerApi.getAllEntries({
            from: this.from || undefined,
            to: this.to || undefined,
            type: this.type || undefined
          })
          const items = Array.isArray(res.items) ? res.items : []

          // Filter by sign
          const filtered = items.filter(x => {
            const s = (typeof x.signedAmount === 'number')
              ? x.signedAmount
              : (x.entryType === 'DEBIT' ? +(x.amount||0) : -(x.amount||0))
            if (this.sign === 'POS') return s > 0
            if (this.sign === 'NEG') return s < 0
            return true
          })

          this.allRows = filtered
          this.clientRows = this.buildClientSummary(filtered)
        } catch (e) {
          this.$emit('notify', { text: e.message || 'Failed to load', color: 'error' })
        } finally {
          this.loading = false
        }
      }
      if (immediate) return exec()
      this.debounced(exec)
    },

    buildClientSummary (rows) {
      const byClient = new Map()
      for (const r of rows) {
        const cid = r.clientId || 'UNKNOWN'
        if (!byClient.has(cid)) {
          byClient.set(cid, {
            clientId: cid,
            totalDebit: 0,
            totalCredit: 0,
            net: 0,
            latestBalance: 0,
            count: 0,
            _latestTs: -Infinity,
            _latestBal: 0
          })
        }
        const agg = byClient.get(cid)
        if (r.entryType === 'DEBIT') agg.totalDebit += Number(r.amount || 0)
        else if (r.entryType === 'CREDIT') agg.totalCredit += Number(r.amount || 0)

        const ts = r.createdAt ? new Date(r.createdAt).getTime() : 0
        if (ts >= agg._latestTs) {
          agg._latestTs = ts
          agg._latestBal = Number(r.runningBalance || 0)
        }
        agg.count++
      }

      const out = []
      for (const rec of byClient.values()) {
        rec.net = Number((rec.totalDebit - rec.totalCredit).toFixed(2))
        rec.latestBalance = Number(rec._latestBal.toFixed(2))
        out.push(rec)
      }
      out.sort((a,b)=> String(a.clientId).localeCompare(String(b.clientId)))
      return out
    },

    // Open client dialog
    async openClient (item) {
      this.activeClient = item
      this.activeClientName = ''
      this.d.preset = this.preset
      this.applyDialogPreset(this.d.preset)
      this.d.type = this.type
      this.d.sign = this.sign
      this.dialog = true
      await this.loadClient(true)
      this.lookupClientNameSilently(item.clientId)
    },

    async lookupClientNameSilently (clientId) {
      try {
        const base = (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '')
        const r = await fetch(`${base}/getClientByClientId/${encodeURIComponent(clientId)}`)
        const data = await r.json().catch(()=>({}))
        const first = Array.isArray(data?.items) ? data.items[0] : (data?.item || data)
        const name = first?.name || first?.clientName
        if (name) this.activeClientName = name
      } catch (e) { /* ignore */ }
    },

    // Loaders (client dialog)
    async loadClient (immediate=false) {
      const exec = async () => {
        if (!this.activeClient) return
        this.d.loading = true
        try {
          const res = await ledgerApi.getAllEntries({
            from: this.d.from || undefined,
            to: this.d.to || undefined,
            type: this.d.type || undefined
          })
          let items = Array.isArray(res.items) ? res.items : []
          items = items.filter(x => (x.clientId || 'UNKNOWN') === this.activeClient.clientId)

          if (this.d.sign) {
            items = items.filter(x => {
              const s = (typeof x.signedAmount === 'number')
                ? x.signedAmount
                : (x.entryType === 'DEBIT' ? +(x.amount||0) : -(x.amount||0))
              return this.d.sign === 'POS' ? s > 0 : s < 0
            })
          }

          // sort chronological
          items.sort((a,b)=> new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
          this.d.rows = items

          // totals + latest balance
          const totals = items.reduce((acc, r) => {
            if (r.entryType === 'DEBIT') acc.debit += Number(r.amount||0)
            else if (r.entryType === 'CREDIT') acc.credit += Number(r.amount||0)
            return acc
          }, { debit: 0, credit: 0 })
          this.d.totals = totals
          this.d.latestBalance = items.length ? Number(items[items.length-1].runningBalance || 0) : 0
        } catch (e) {
          this.$emit('notify', { text: e.message || 'Failed to load client entries', color: 'error' })
        } finally {
          this.d.loading = false
        }
      }
      if (immediate) return exec()
      this.debounced(exec)
    },

    // CSV Exports
    exportSummaryCsv () {
      const rows = this.clientRows
      const headers = ['Client ID','Total Debit','Total Credit','Net (DR-CR)','Latest Balance','Entries']
      const lines = [headers.join(',')]
      for (const r of rows) {
        lines.push([
          this.csv(r.clientId),
          this.csv(r.totalDebit),
          this.csv(r.totalCredit),
          this.csv(r.net),
          this.csv(r.latestBalance),
          this.csv(r.count)
        ].join(','))
      }
      this.downloadCsv(lines.join('\n'), `client_summary_${this.from||'na'}_${this.to||'na'}.csv`)
    },
    exportClientSummaryCsv () {
      const r = this.activeClient || {}
      const lines = [
        ['Client ID','From','To','Total Debit','Total Credit','Opening','Closing'].join(','),
        [
          this.csv(r.clientId || ''),
          this.csv(this.d.from || ''),
          this.csv(this.d.to || ''),
          this.csv(this.d.totals.debit),
          this.csv(this.d.totals.credit),
          this.csv(this.openingBalance),
          this.csv(this.d.latestBalance)
        ].join(',')
      ]
      this.downloadCsv(lines.join('\n'), `client_${r.clientId || 'client'}_summary_${this.d.from||'na'}_${this.d.to||'na'}.csv`)
    },
    exportClientCsv () {
      const rows = this.d.rows
      const headers = ['When','Type','Amount','Running','Narration','Status','SourceType','SourceId','Client ID']
      const lines = [headers.join(',')]
      for (const r of rows) {
        lines.push([
          this.csv(this.fmtDateTime(r.createdAt)),
          this.csv(r.entryType),
          this.csv(r.amount),
          this.csv(r.runningBalance),
          this.csv(r.narration),
          this.csv(r.status),
          this.csv(r.sourceType),
          this.csv(r.sourceId),
          this.csv(r.clientId)
        ].join(','))
      }
      const id = this.activeClient?.clientId || 'client'
      this.downloadCsv(lines.join('\n'), `client_${id}_${this.d.from||'na'}_${this.d.to||'na'}.csv`)
    },
    csv (v) { const s = (v==null) ? '' : String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s },
    downloadCsv (content, filename) {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = filename
      document.body.appendChild(a); a.click()
      document.body.removeChild(a); URL.revokeObjectURL(url)
    },

    // PDF
    async downloadClientPdf () {
      if (!this.$refs.pdfArea) return
      const id = this.activeClient?.clientId || 'client'
      const filename = `passbook_${id}_${this.d.from||'na'}_${this.d.to||'na'}.pdf`
      const opt = {
        margin: [14, 18, 14, 18],
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
/* ---------- Header aesthetics ---------- */
.gradient-header {
  background: linear-gradient(135deg, #1a237e, #283593);
}
.preset-btn {
  text-transform: none;
}

/* ---------- Tables ---------- */
.ledger-table >>> thead th {
  background: #f4f6fb;
  color: #2a2a2a;
  font-weight: 700 !important;
}
.ledger-table >>> tbody tr:hover {
  background: #f9fbff !important;
}
.debit-cell { color: #c62828; font-weight: 600; }
.credit-cell { color: #2e7d32; font-weight: 600; }
.stat-card { min-width: 140px }

/* ---------- PDF styles ---------- */
.pdf-root {
  background: #fff;
  color: #000;
  font-family: Inter, Arial, Helvetica, sans-serif;
  font-size: 12px;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
}
.pdf-header {
  display:flex; justify-content:space-between; align-items:flex-start;
  border-bottom:1px solid #111; padding-bottom:8px; margin-bottom:10px;
}
.pdf-brand { display:flex; align-items:center; gap:10px; }
.pdf-logo { width:38px; height:38px; object-fit:contain; }
.pdf-brand-title { font-weight:800; font-size:16px; }
.pdf-brand-sub { font-size:11px; color:#666; }
.pdf-meta { text-align:right; font-size:11px; }
.pdf-summary { display:flex; flex-wrap:wrap; gap:8px; margin:8px 0 12px; }
.pill {
  padding:6px 5px; border-radius:16px; background:#f6f7fb; border:1px solid #e6e8f3;
  font-size:11px;
}
.pill.debit { background:#ffebee; border-color:#ffcdd2; }
.pill.credit { background:#e8f5e9; border-color:#c8e6c9; }
.plus { color:#2e7d32; }
.minus { color:#c62828; }
.text-center { text-align:center; }
.text-right  { text-align:right; }

.pdf-table {
  width:100%;
  border-collapse:separate;
  border-spacing:0;
  font-size:11px;
}
.pdf-table thead th {
  position: sticky; top: 0;
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
  padding:6px; font-weight:700; background:#f6f7fb;
}
.bg-debit  { background:#ffebee; }
.bg-credit { background:#e8f5e9; }
.w-when { width: 140px; }
.w-narration { width: 220px; }
.w-type { width: 70px; }
.w-money { width: 110px; }
.w-ref { width: 170px; }

.pdf-footnote { margin-top:8px; font-size:10.5px; color:#666; }
</style>
