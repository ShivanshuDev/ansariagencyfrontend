<template>
    <v-data-table
      ref="datatable"
      :headers="headers"
      :items="rows"
      :items-per-page="itemsPerPage"
      show-select
      v-model="localSelection"
      item-key="invoiceNumber"
      :loading="loading"
      class="invoice-table"
      :footer-props="{
        'items-per-page-options': [10, 25, 50, { text: 'All', value: -1 }],
        'items-per-page-text': 'Rows per page'
      }"
    >
      <template v-slot:item.invoiceNumber="{ item }">
        <span class="font-weight-medium">{{ item.invoiceNumber || '-' }}</span>
      </template>

      <template v-slot:item.invoiceDate="{ item }">
        <span>{{ item.invoiceDate || '-' }}</span>
      </template>

      <template v-slot:item.actions="{ item }">
        <v-btn
          color="primary"
          small
          class="ma-1"
          @click="$emit('show-invoice', item)"
          :disabled="loading"
        >Show</v-btn>
      </template>

      <template v-slot:loading>
        <div class="d-flex align-center justify-center fill-height">
          <v-progress-circular indeterminate color="primary" />
        </div>
      </template>
    </v-data-table>
</template>

<script>
export default {
  name: 'InvoiceTable',
  props: {
    headers: { type: Array, required: true },
    rows: { type: Array, default: () => [] },
    value: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    itemsPerPage: { type: Number, default: 10 }
  },
  data() {
    return {
      rowHeightPx: 56 // increased default row height
    };
  },
  computed: {
    localSelection: {
      get() { return this.value; },
      set(v) { this.$emit('input', v); }
    },
    cardStyle() {
      return {
        '--row-height': `${this.rowHeightPx}px`,
        '--items-per-page': `${this.itemsPerPage}`
      };
    }
  }
};
</script>

<style scoped>
/* ✅ Custom table header styles */
::v-deep(.v-data-table-header) {
  background-color: #040891; /* deep blue header background */
}

::v-deep(.v-data-table-header th) {
  color: white !important;      /* white text */
  font-size: 1rem !important;   /* larger header font */
  font-weight: 600;             /* bold look */
  text-transform: uppercase;    /* optional for professional style */
  letter-spacing: 0.5px;
  padding: 16px 12px;           /* slightly more spacing */
}
</style>
