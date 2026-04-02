<template>
  <div>
    <!-- Self-activating button -->
    <v-btn
      color="primary"
      small
      class="mb-2"
      :disabled="!invoiceNumber"
      @click="onOpen"
    >
      Show History
    </v-btn>

    <v-dialog persistent v-model="open" max-width="1100">
      <v-card class="rounded-lg" elevation="8">
        <v-toolbar flat class="px-4">
          <v-toolbar-title class="subtitle-1 font-weight-bold">
            {{ titleText }}
          </v-toolbar-title>
          <v-spacer />
          <v-btn icon @click="fetchHistory" :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
          <v-btn icon @click="open = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-toolbar>

        <v-divider />

        <v-card-text class="pa-4">
          <v-skeleton-loader
            v-if="loading"
            type="list-item-two-line, list-item-two-line, list-item-two-line"
          />
          <v-alert v-else-if="error" type="error" outlined>
            {{ error }}
          </v-alert>
          <v-alert v-else-if="!items.length" type="info" outlined>
            No history found.
          </v-alert>

          <v-timeline v-else dense>
            <v-timeline-item
              v-for="(ev, idx) in items"
              :key="ev.pk + ev.sk + idx"
              :color="chipColor(ev.action)"
              small
            >
              <template v-slot:opposite>
                <div class="caption text--secondary">{{ formatDate(ev.at) }}</div>
              </template>

              <v-card class="pa-4 rounded-lg event-card" flat>
                <div class="d-flex align-center justify-space-between">
                  <div class="d-flex align-center flex-wrap">
                    <v-chip class="mr-2 mb-2" small :color="chipColor(ev.action)" dark>
                      {{ ev.action || 'EVENT' }}
                    </v-chip>
                    <v-chip
                      v-if="statusOf(ev)"
                      class="mr-2 mb-2"
                      small
                      :color="statusColor(statusOf(ev))"
                      outlined
                    >
                      {{ statusOf(ev) }}
                    </v-chip>
                  </div>
                  <div class="text-right caption text--secondary">
                    <div class="font-weight-medium">{{ ev.actor || 'System' }}</div>
                    <div>Actor</div>
                  </div>
                </div>

                <v-divider class="my-3" />

                <!-- Invoice CREATED with itemsBrief -->
                <div v-if="Array.isArray(ev.itemsBrief) && ev.itemsBrief.length">
                  <div class="body-2 font-weight-medium mb-2">Items ({{ ev.itemsBrief.length }})</div>
                  <div class="items-brief-grid">
                    <div v-for="(it, i) in ev.itemsBrief" :key="i" class="item-brief-tile">
                      <div class="tile-line"><span>Chassis:</span> {{ it.chassisNumber }}</div>
                      <div class="tile-line"><span>Engine:</span> {{ it.engineNumber || '-' }}</div>
                      <div class="tile-line"><span>Warehouse:</span> {{ it.warehouse || '-' }}</div>
                      <div class="tile-line"><span>Status:</span> {{ it.status || '-' }}</div>
                      <div class="tile-line"><span>Color:</span> {{ it.color || '-' }}</div>
                      <div class="tile-line"><span>HSN:</span> {{ it.hsn || '-' }}</div>
                    </div>
                  </div>
                </div>

                <!-- Diff-based updates -->
                <div v-else-if="ev.diff && Object.keys(ev.diff).length">
                  <div class="body-2 font-weight-medium mb-2">Changes</div>
                  <ul class="diff-list">
                    <li v-for="(chg, key) in ev.diff" :key="key">
                      <span class="diff-key">{{ key }}</span>:
                      <span class="diff-from">{{ pretty(chg.from) }}</span>
                      <v-icon small class="mx-1">mdi-arrow-right</v-icon>
                      <span class="diff-to">{{ pretty(chg.to) }}</span>
                    </li>
                  </ul>
                </div>

                <div v-else class="text--secondary body-2">
                  No additional details.
                </div>
              </v-card>
            </v-timeline-item>
          </v-timeline>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  entity: { type: String, default: 'INVOICE' },     // 'INVOICE' | 'INVENTORY'
  invoiceNumber: { type: [String, Number], required: true },
  chassisNumber: { type: String, default: '' },
  baseUrl: { type: String, default: '' },           // e.g. '/api'
  invoiceEndpoint: { type: String, default: 'historyInvoiceHistory' },
  inventoryEndpoint: { type: String, default: 'historyInventoryHistory' }
});

const open = ref(false);
const items = ref([]);
const loading = ref(false);
const error = ref('');

const titleText = computed(() =>
  props.entity === 'INVENTORY'
    ? `History — ${props.invoiceNumber} / ${props.chassisNumber}`
    : `History — Invoice #${props.invoiceNumber}`
);

const onOpen = async () => {
  if (!props.invoiceNumber) {
    error.value = 'Invoice number is required';
    return;
  }
  open.value = true;
  await fetchHistory();
};

// helpers
function statusOf(ev) { return ev?.snapshot?.status || ev?.status || null; }
function chipColor(a) {
  const x = String(a || '').toUpperCase();
  if (x === 'CREATED') return 'purple';
  if (x === 'UPDATED') return 'primary';
  if (x === 'STATUS_CHANGED') return 'indigo';
  if (x === 'SOLD') return 'green';
  return 'grey';
}
function statusColor(s) {
  const v = String(s || '').toLowerCase();
  if (['done','completed','sold','delivered'].includes(v)) return 'green';
  if (['inprogress','in-progress','processing'].includes(v)) return 'blue';
  if (['new','created','draft'].includes(v)) return 'purple';
  if (['cancelled','rejected','failed'].includes(v)) return 'red';
  return 'grey';
}
function pretty(val){ if (val===null||val===undefined||val==='') return '—'; return typeof val==='object'? JSON.stringify(val): String(val); }
function formatDate(epoch){ const n=Number(epoch); return n? new Date(n).toLocaleString(): '—'; }

// fetch
async function fetchHistory() {
  loading.value = true;
  error.value = '';
  items.value = [];
  try {
    let url = '';
    if (props.entity === 'INVENTORY') {
      if (!props.chassisNumber) throw new Error('chassisNumber required for INVENTORY history');
      url = `${props.baseUrl}${props.inventoryEndpoint}` +
            `?invoiceNumber=${encodeURIComponent(props.invoiceNumber)}` +
            `&chassisNumber=${encodeURIComponent(props.chassisNumber)}`;
    } else {
      url = process.env.VUE_APP_AGENCY_BACKEND_URL+`${props.invoiceEndpoint}` +
            `?invoiceNumber=${encodeURIComponent(props.invoiceNumber)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    items.value = Array.isArray(data?.items) ? data.items.sort((a,b)=>(b.at??0)-(a.at??0)) : [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

// refresh if props change while dialog open
watch(() => [props.invoiceNumber, props.chassisNumber], () => {
  if (open.value) fetchHistory();
});
</script>

<style scoped>
.event-card { background: #fafbfd; border: 1px solid #eef1f6; }
.items-brief-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
.item-brief-tile { border: 1px solid #e8ecf2; border-radius: 12px; padding: 10px 12px; background: white; box-shadow: 0 1px 0 rgba(16,24,40,.02); }
.tile-line { font-size: 12px; line-height: 18px; }
.tile-line span { color: #667085; width: 88px; display: inline-block; }
.diff-list { padding-left: 18px; margin: 0; }
.diff-list li { margin: 6px 0; font-size: 13px; }
.diff-key { font-weight: 600; color: #475467; }
.diff-from { color: #9e2a2b; }
.diff-to { color: #05603a; font-weight: 600; }
</style>
