<template>
  <v-dialog v-model="isOpen" max-width="900" scrollable>
    <v-card>
      <v-toolbar flat dense>
        <v-toolbar-title class="text-subtitle-1">
          {{ title }} <span v-if="identifier" class="grey--text">• {{ identifier }}</span>
        </v-toolbar-title>
        <v-spacer />
        <v-btn icon @click="isOpen=false"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-divider />

      <v-card-text class="pa-0">
        <div v-if="loading" class="pa-6 d-flex align-center justify-center">
          <v-progress-circular indeterminate /><span class="ml-3">Loading…</span>
        </div>

        <div v-else-if="events.length===0" class="pa-6 grey--text">
          No history found.
        </div>

        <div v-else class="pa-4">
          <div v-for="(h, i) in events" :key="h.sk || i" class="mb-4">
            <v-sheet elevation="1" class="pa-4 rounded-lg">
              <!-- top row -->
              <div class="d-flex align-start">
                <div class="d-flex align-center flex-wrap">
                  <v-chip small :color="eventColor(h.eventType)" text-color="white" class="mr-2 mb-1">
                    {{ prettyEvent(h.eventType) }}
                  </v-chip>
                  <v-chip
                    v-if="statusFrom(h)"
                    small
                    :color="statusColor(statusFrom(h))"
                    text-color="white"
                    class="mr-2 mb-1"
                  >{{ prettyStatus(statusFrom(h)) }}</v-chip>
                </div>
                <v-spacer />
                <div class="text-right">
                  <div class="caption grey--text">{{ formatDateTime(h.at) }}</div>
                  <div v-if="h.actor" class="caption mt-1">
                    <b>{{ h.actor.name || h.actor.email || 'User' }}</b>
                    <span class="grey--text" v-if="h.actor.role">&nbsp;• {{ h.actor.role }}</span>
                  </div>
                </div>
              </div>

              <v-divider class="my-3" />

              <!-- body -->
              <div class="mb-1 caption grey--text">Assigned To:</div>
              <div class="mb-3">
                <a v-if="assigneeEmail(h)" :href="`mailto:${assigneeEmail(h)}`">{{ assigneeEmail(h) }}</a>
                <span v-else>—</span>
              </div>

              <ul class="mb-2">
                <li v-for="(v,k) in (h.diff?.after || {})" :key="k">
                  <b>{{ labelize(k) }}</b>
                  <span v-if="h.diff.before && h.diff.before[k] !== undefined">
                    &nbsp;set to&nbsp;<b>{{ printable(v) }}</b>
                    <span class="grey--text">&nbsp;(was {{ printable(h.diff.before[k]) }})</span>
                  </span>
                  <span v-else>&nbsp;set to&nbsp;<b>{{ printable(v) }}</b></span>
                </li>
                <li v-if="!h.diff || !Object.keys(h.diff.after||{}).length">
                  {{ h.summary || 'Record updated' }}
                </li>
              </ul>

              <div v-if="footerTags(h)" class="mt-2">
                <div class="caption grey--text">Issue Type:</div>
                <v-chip x-small color="deep-purple" text-color="white" class="mt-1">
                  {{ footerTags(h).issueType }}
                </v-chip>
              </div>
            </v-sheet>
          </div>
        </div>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <v-spacer />
        <v-btn color="primary" @click="isOpen=false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import axios from 'axios';

export default {
  name: 'HistoryDialogSimple',

  // Support BOTH :open.sync and v-model
  // v-model uses prop `value` + event `input`
  model: { prop: 'value', event: 'input' },

  props: {
    // for v-model
    value: { type: Boolean, default: false },
    // for :open.sync
    open: { type: Boolean, default: false },

    mode: { type: String, default: 'ITEM' },             // 'ITEM' | 'INVENTORY_INVOICE' | 'SELL2VENDOR' | 'SELL2CUSTOMER'
    chassisNumber: { type: String, default: '' },        // for ITEM
    invoiceNumber: { type: String, default: '' },        // for others
    basePath: { type: String, default: '/api/history' }, // GET only
    limit: { type: Number, default: 100 }
  },

  data: () => ({
    loading: false,
    events: []
  }),

  computed: {
    // Single computed that reads from either `open` or `value`
    // and emits BOTH events so either parent pattern works.
    isOpen: {
      get() {
        return this.open !== undefined ? this.open : this.value;
      },
      set(v) {
        this.$emit('update:open', v); // support :open.sync
        this.$emit('input', v);       // support v-model
      }
    },
    title() {
      switch (this.mode) {
        case 'ITEM': return 'History';
        case 'INVENTORY_INVOICE': return 'Invoice History';
        case 'SELL2VENDOR': return 'Vendor Invoice History';
        case 'SELL2CUSTOMER': return 'Customer Invoice History';
        default: return 'History';
      }
    },
    identifier() {
      return this.mode === 'ITEM' ? this.chassisNumber : this.invoiceNumber;
    },
    hasRequiredId() {
      return this.mode === 'ITEM'
        ? !!(this.chassisNumber && this.chassisNumber.trim())
        : !!(this.invoiceNumber && this.invoiceNumber.trim());
    }
  },

  mounted() {
    // If opened initially, fetch right away
    if (this.isOpen) this.load();
  },

  watch: {
    isOpen(v) { if (v) this.load(); },
    mode() { if (this.isOpen) this.load(); },
    chassisNumber() { if (this.isOpen) this.load(); },
    invoiceNumber() { if (this.isOpen) this.load(); }
  },

  methods: {
    async load() {
      // Debug logs to confirm flow
      console.log('[HistoryDialogSimple] load called', {
        isOpen: this.isOpen, mode: this.mode, chassisNumber: this.chassisNumber, invoiceNumber: this.invoiceNumber
      });

      if (!this.isOpen || !this.hasRequiredId) {
        this.events = [];
        return;
      }

      this.loading = true;
      try {
        const params = { kind: this.mode, limit: this.limit, order: 'desc' };
        if (this.mode === 'ITEM') params.chassisNumber = this.chassisNumber.trim();
        else params.invoiceNumber = this.invoiceNumber.trim();

        console.log('[HistoryDialogSimple] GET', this.basePath, params);
        const { data } = await axios.get(this.basePath, { params });

        this.events = Array.isArray(data?.items) ? data.items : [];
      } catch (e) {
        console.error('[HistoryDialogSimple] load failed', e);
        this.events = [];
      } finally {
        this.loading = false;
      }
    },

    // --- UI helpers (unchanged) ---
    statusFrom(h) { return h?.context?.statusType || h?.diff?.after?.statusType || h?.meta?.statusType || null; },
    assigneeEmail(h) { return h?.context?.assigneeEmail || h?.actor?.email || h?.context?.assignedTo || null; },
    footerTags(h) { const t = h?.context?.issueType || h?.meta?.issueType; return t ? { issueType: t } : null; },
    prettyEvent(e='') { return e.replace(/_/g,' '); },
    eventColor(e='') { e=e.toUpperCase(); if (e.includes('CREATED')) return 'green'; if (e.includes('UPDATED')) return 'blue'; if (e.includes('SOLD')) return 'purple'; if (e.includes('REMOVED')) return 'orange'; if (e.includes('AMENDED')) return 'teal'; return 'grey darken-1'; },
    statusColor(s='') { s=s.toUpperCase(); if (s.includes('COMPLETED')||s==='DONE') return 'green'; if (s.includes('PROGRESS')||s==='INPROGRESS') return 'blue'; if (s.includes('NEW')||s==='ACTIVE') return 'indigo'; if (s.includes('CANCEL')) return 'red'; if (s.includes('PENDING')) return 'orange'; return 'grey'; },
    prettyStatus(s='') { return s.replace(/_/g,' ').replace(/([A-Z])/g,' $1').trim().replace(/^./,m=>m.toUpperCase()); },
    labelize(k) { return String(k).replace(/([A-Z])/g,' $1').replace(/_/g,' ').replace(/\s+/g,' ').replace(/^./,m=>m.toUpperCase()); },
    printable(v) { if (v===null||v===undefined) return '—'; return typeof v==='object' ? JSON.stringify(v) : String(v); },
    formatDateTime(ts) { if (!ts) return ''; const d=new Date(ts); const dd=String(d.getDate()).padStart(2,'0'); const mm=String(d.getMonth()+1).padStart(2,'0'); const yyyy=d.getFullYear(); const hh=String(d.getHours()).padStart(2,'0'); const mi=String(d.getMinutes()).padStart(2,'0'); return `${dd}/${mm}/${yyyy} ${hh}:${mi}`; }
  }
};
</script>


<style scoped>
.rounded-lg { border-radius: 14px; }
</style>
