<template>
  <v-dialog style="height:1200px; border:1px solid green;" persistent v-model="open" max-width="1700px">
    <v-card style="height:800px;">
      <v-card-title style="60px">
        Invoice: {{ invoice?.invoiceNumber || '-' }}
        <v-spacer />
        <DownloadPdf :items="selectedItemsData" :headers="invoiceDetailHeaders" />
        <v-spacer />
        <DownloadXlsx
          :items="selectedItemsData"
          :headers="invoiceDetailHeaders"
          filename="invoice_items"
          @downloaded="$emit('downloaded')"
        />
        <v-spacer />
        <div style="margin-right:12px;"><small>Invoice Date: {{ invoice?.invoiceDate || '-' }}</small></div>
        <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
      </v-card-title>

      <v-divider class="my-2"></v-divider>

      <v-card-text style="height:660px;">
        <div v-if="loading" style="text-align:center; padding:18px;">
          <v-progress-circular indeterminate />
        </div>

        <div v-else-if="items && items.length">
          <v-data-table
            :headers="tableHeaders"
            :items="items"
            dense
            show-select
            v-model="localSelected"
            item-key="chassisNumber"
            class="elevation-0"
            :items-per-page="invoiceItemsPerPage"
            :footer-props="{
              'items-per-page-options': [10, 25, 50, { text: 'All', value: -1 }],
              'items-per-page-text': 'Rows per page'
            }"
          >
            <!-- field templates -->
            <template v-slot:item.chassisNumber="{ item }">{{ item.chassisNumber || '-' }}</template>
            <template v-slot:item.engineNumber="{ item }">{{ item.engineNumber || '-' }}</template>
            <template v-slot:item.modelName="{ item }">{{ item.modelName || '-' }}</template>
            <template v-slot:item.color="{ item }">{{ item.color || '-' }}</template>

            <!-- Added Date formatting -->
            <template v-slot:item.createdAt="{ item }">{{ formatDate(item.createdAt) }}</template>

            <template v-slot:item.status="{ item }">{{ item.status || '-' }}</template>
            <template v-slot:item.inventoryHoldDays="{ item }">
              {{ (item.inventoryHoldDays !== undefined && item.inventoryHoldDays !== null) ? item.inventoryHoldDays : '-' }}
            </template>

            <!-- Actions column: Show button -->
            <template v-slot:item.__actions="{ item }">
              <v-btn small text @click="$emit('row-click', item)">
                <v-icon left small>mdi-eye</v-icon>Show
              </v-btn>
            </template>
          </v-data-table>
        </div>

        <div v-else>No inventory records found for this invoice.</div>
      </v-card-text>

      <v-card-actions style="height:60px;">
        <v-spacer />
        <v-btn text @click="$emit('close')">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import DownloadPdf from '@/views/DownloadPdf.vue';
import DownloadXlsx from '@/views/DownloadXlsx.vue';
import DownloadPdfInventory from '@/views/DownloadInvoiveInventory.vue';
export default {
  name: 'InvoiceDetailDialog',
  components: { DownloadPdf, DownloadXlsx, DownloadPdfInventory },
  props: {
    open: { type: Boolean, default: false },
    invoice: { type: Object, default: null },
    items: { type: Array, default: () => [] },
    invoiceDetailHeaders: { type: Array, default: () => [] },
    selectedItemsData: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    invoiceItemsPerPage: { type: Number, default: 10 },
    value: { type: Array, default: () => [] }
  },
  computed: {
    localSelected: {
      get() { return this.value; },
      set(v) { this.$emit('update:selected', v); }
    },

    // append Actions column to provided headers (keeps order) and filter out inventoryHoldDays if present
    tableHeaders() {
      const base = Array.isArray(this.invoiceDetailHeaders) ? JSON.parse(JSON.stringify(this.invoiceDetailHeaders)) : [];
      // optional: remove inventoryHoldDays column if you don't want it here
      const filtered = base.filter(h => h && h.value !== 'inventoryHoldDays');

      // add actions header at the end
      filtered.push({ text: 'Actions', value: '__actions', sortable: false });
      return filtered;
    }
  },
  methods: {
    // convert seconds or ms to ms
    _epochToMs(v) {
      if (v == null) return null;
      const n = Number(v);
      if (Number.isNaN(n)) return null;
      return n < 1e12 ? n * 1000 : n;
    },

    // format date as dd/mm/yyyy
    formatDate(v) {
      const ms = this._epochToMs(v);
      if (ms == null) return '-';
      try {
        return new Date(ms).toLocaleDateString('en-GB');
      } catch (e) {
        return new Date(ms).toLocaleDateString();
      }
    }
  }
};
</script>

<style scoped>
::v-deep .v-data-table-header {
  background-color: #040891; /* Set to your desired color */
  color: #ffffff; /* For the text */
}

::v-deep(.v-data-table thead th) {
  background-color: #040891 !important; /* Deep blue header */
  color: #ffffff !important;             /* White text */
}

</style>
