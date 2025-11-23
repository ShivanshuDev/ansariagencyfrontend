<template>
  <div>
    <!-- Open button inside the child -->
    <v-btn
      color="secondary"
      size="small"
      class="mb-2"
      :disabled="!invoiceNumber || !chassisNumber"
      @click="onOpen"
    >
      Show Item History
    </v-btn>

    <v-dialog v-model="open" max-width="1100">
      <v-card class="rounded" elevation="10">
        <!-- Colorful gradient header -->
        <div class="history-toolbar">
          <div class="title">
            History — {{ invoiceNumber }} / {{ chassisNumber }}
          </div>
          <div class="actions">
            <v-btn icon variant="text" @click="fetchHistory" :loading="loading">
              <v-icon>mdi-refresh</v-icon>
            </v-btn>
            <v-btn icon variant="text" @click="open = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>

        <v-divider />

        <v-card-text class="pa-4">
          <v-skeleton-loader
            v-if="loading"
            type="list-item-two-line, list-item-two-line, list-item-two-line"
          />
          <v-alert v-else-if="error" type="error" variant="tonal" border="start" class="mb-2">
            {{ error }}
          </v-alert>

          <!-- If nothing changed at all -->
          <v-alert
            v-else-if="!filteredItems.length"
            type="info"
            variant="tonal"
            border="start"
            class="mb-2"
          >
            No changes detected for this item.
          </v-alert>

          <!-- Only show items with changes -->
          <v-timeline v-else side="end" density="compact">
            <v-timeline-item
              v-for="(ev, idx) in filteredItems"
              :key="ev.pk + ev.sk + idx"
              :dot-color="chipColor(ev.action)"
              :icon="actionIcon(ev.action)"
              size="small"
            >
              <template #opposite>
                <div class="caption text-medium-emphasis">
                  {{ formatDate(ev.at) }}
                </div>
              </template>

              <v-card class="event-card mb-4" elevation="0">
                <div class="event-head">
                  <div class="badges">
                    <v-chip class="mr-2 mb-2" size="small" :color="chipColor(ev.action)" dark>
                      {{ (ev.action || 'EVENT').toUpperCase() }}
                    </v-chip>

                    <v-chip
                      v-if="statusOf(ev)"
                      class="mr-2 mb-2"
                      size="small"
                      :color="statusColor(statusOf(ev))"
                      variant="elevated"
                    >
                      {{ statusOf(ev) }}
                    </v-chip>

                    <!-- quick badge of how many fields changed -->
                    <v-chip class="mr-2 mb-2" size="small" color="deep-purple">
                      {{ Object.keys(ev.diff || {}).length }} change(s)
                    </v-chip>
                  </div>

                  <div class="actor">
                    <div class="actor-name">{{ ev.actor || 'System' }}</div>
                    <div class="actor-label">Actor</div>
                  </div>
                </div>

                <v-divider class="my-3" />

                <!-- Colorful diff pills -->
                <div class="changes-wrap">
                  <div class="change-row" v-for="(chg, key) in ev.diff" :key="key">
                    <v-chip :color="keyColor(key)" size="small" class="key-chip">
                      {{ key }}
                    </v-chip>
                    <div class="arrow">
                      <span class="from">{{ pretty(chg.from, key) }}</span>
                      <v-icon size="16" class="mx-2">mdi-arrow-right</v-icon>
                      <span class="to">{{ pretty(chg.to, key) }}</span>
                    </div>
                  </div>
                </div>

                <!-- Optional: show only the fields that changed from the snapshot (colorful grid) -->
                <div v-if="ev.snapshot" class="snapshot-grid mt-4">
                  <div
                    v-for="(chg, key) in ev.diff"
                    :key="key + '-snap'"
                    class="snap-tile"
                  >
                    <div class="snap-key">{{ key }}</div>
                    <div class="snap-val">
                      {{ pretty(ev.snapshot?.[key], key) }}
                    </div>
                  </div>
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
import { ref, watch, computed } from 'vue';

const props = defineProps({
  invoiceNumber: { type: [String, Number], required: true },
  chassisNumber: { type: String, required: true },
  baseUrl: { type: String, default: '' }, // if you need it later
  inventoryEndpoint: { type: String, default: 'historyInventryHistory' } // GET with query
});

const open = ref(false);
const items = ref([]);
const loading = ref(false);
const error = ref('');

const onOpen = async () => {
  if (!props.invoiceNumber || !props.chassisNumber) {
    error.value = 'invoiceNumber and chassisNumber are required';
    return;
  }
  open.value = true;
  await fetchHistory();
};

function hasChanges(ev) {
  return ev?.diff && Object.keys(ev.diff).length > 0;
}

const filteredItems = computed(() =>
  (items.value || [])
    .filter(hasChanges)
    .sort((a, b) => (b.at ?? 0) - (a.at ?? 0))
);

function statusOf(ev) {
  return ev?.snapshot?.status || ev?.status || null;
}

function chipColor(a) {
  const x = String(a || '').toUpperCase();
  if (x === 'CREATED') return 'pink';
  if (x === 'UPDATED') return 'primary';
  if (x === 'STATUS_CHANGED') return 'indigo';
  if (x === 'SOLD') return 'green';
  return 'grey';
}
function actionIcon(a) {
  const x = String(a || '').toUpperCase();
  if (x === 'CREATED') return 'mdi-plus';
  if (x === 'UPDATED') return 'mdi-pencil';
  if (x === 'STATUS_CHANGED') return 'mdi-transition';
  if (x === 'SOLD') return 'mdi-cash-check';
  return 'mdi-dots-horizontal';
}
function statusColor(s) {
  const v = String(s || '').toLowerCase();
  if (['done','completed','sold','delivered'].includes(v)) return 'green';
  if (['inprogress','in-progress','processing'].includes(v)) return 'blue';
  if (['new','created','draft'].includes(v)) return 'purple';
  if (['cancelled','rejected','failed'].includes(v)) return 'red';
  return 'grey';
}
function keyColor(key) {
  const k = String(key || '').toLowerCase();
  if (k.includes('status')) return 'indigo';
  if (k.includes('warehouse')) return 'teal';
  if (k.includes('model') || k.includes('hsn')) return 'deep-purple';
  if (k.includes('color')) return 'cyan';
  if (k.includes('price') || k.includes('amount')) return 'orange';
  if (k.includes('sold')) return 'green';
  return 'blue';
}

/**
 * Format epoch/epoch-like value into DD/MM/YYYY HH:mm:ss
 * Accepts seconds or milliseconds.
 */
function formatDateTime(epoch) {
  const n = Number(epoch);
  if (!Number.isFinite(n) || n <= 0) return '—';

  // If value looks like seconds (1e9 range), convert to ms
  const ms = n < 1e12 ? n * 1000 : n;

  const d = new Date(ms);
  const pad = v => String(v).padStart(2, '0');

  const day = pad(d.getDate());
  const month = pad(d.getMonth() + 1);
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Used in the timeline header for each event (at).
 */
function formatDate(epoch) {
  return formatDateTime(epoch);
}

/**
 * Pretty-print for values shown in diff/snapshot.
 * If key suggests time/date (lastModified, updatedAt, createdAt, ...),
 * and value is numeric, we format it using formatDateTime.
 */
function pretty(val, key) {
  if (val === null || val === undefined || val === '') return '—';

  const lowerKey = String(key || '').toLowerCase();
  const looksLikeTimeField = /time|date|at|created|updated|modified/.test(lowerKey);

  if (looksLikeTimeField) {
    const num = Number(val);
    if (Number.isFinite(num) && num > 0) {
      return formatDateTime(num);
    }
  }

  return typeof val === 'object' ? JSON.stringify(val) : String(val);
}

async function fetchHistory() {
  loading.value = true;
  error.value = '';
  items.value = [];
  try {
    const base = process.env.VUE_APP_AGENCY_BACKEND_URL || '';
    // keep existing behavior (do not break current URLs)
    const endpoint = props.inventoryEndpoint.startsWith('')
      ? props.inventoryEndpoint
      : `/${props.inventoryEndpoint}`;
    const url =
      `${base}${endpoint}` +
      `?invoiceNumber=${encodeURIComponent(props.invoiceNumber)}` +
      `&chassisNumber=${encodeURIComponent(props.chassisNumber)}`;
    console.log('url', url);
    const res = await fetch(url, { method: 'GET' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json(); // { items: [...] }
    items.value = Array.isArray(data?.items) ? data.items : [];
  } catch (e) {
    error.value = e?.message || String(e);
  } finally {
    loading.value = false;
  }
}

// Refresh if props change while dialog is open
watch(() => [props.invoiceNumber, props.chassisNumber], () => {
  if (open.value) fetchHistory();
});
</script>

<style scoped>
/* Gradient toolbar for color pop */
.history-toolbar{
  display:flex; align-items:center; justify-content:space-between;
  padding:14px 18px;
  background: linear-gradient(90deg, #7c3aed, #2563eb, #06b6d4);
  color: white;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.history-toolbar .title{
  font-weight: 700;
  letter-spacing: .3px;
}
.history-toolbar .actions :deep(.v-btn){
  color: white;
}

/* Card + timeline aesthetics */
.event-card{
  background: linear-gradient(180deg, #ffffff, #fafcff);
  border: 1px solid #edf2f7;
  border-radius: 16px;
  padding: 14px;
  box-shadow: 0 4px 18px rgba(24,39,75,.06), 0 1px 2px rgba(24,39,75,.04);
}

.event-head{
  display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap;
}
.badges{ display:flex; flex-wrap:wrap; align-items:center; }
.actor{ text-align:right; min-width:120px; }
.actor-name{ font-weight:600; }
.actor-label{ font-size:12px; opacity:.7; }

/* Diff line with colorful key chip */
.changes-wrap{ display:flex; flex-direction:column; gap:10px; }
.change-row{
  display:flex; align-items:center; flex-wrap:wrap;
  background: #f8fafc;
  border: 1px dashed #e2e8f0;
  border-radius: 12px;
  padding: 8px 10px;
}
.key-chip{ margin-right:8px; color:white; }
.arrow{ display:flex; align-items:center; gap:6px; font-size:13px; }
.from{ color:#b42318; }
.to{ color:#05603a; font-weight:700; }

/* Snapshot: only changed keys, colorful tiles */
.snapshot-grid{
  display:grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 10px;
}
.snap-tile{
  background: linear-gradient(180deg, #f5f3ff, #eef2ff);
  border: 1px solid #e9d5ff;
  border-radius: 12px;
  padding: 10px;
}
.snap-key{ font-size:12px; color:#6b21a8; font-weight:700; margin-bottom:4px; text-transform: capitalize; }
.snap-val{ font-size:13px; color:#111827; }

/* Small polish */
:deep(.v-timeline-item__body){ margin-top: 0 !important; }
:deep(.v-chip){ letter-spacing:.2px; }
</style>
