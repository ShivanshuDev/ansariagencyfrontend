<template>
  <v-data-table
    ref="datatable"
    :headers="computedHeaders"
    :items="rows"
    :items-per-page="itemsPerPage"
    show-select
    v-model="localSelection"
    item-key="invoiceNumber"
    :loading="loading"
    class="invoice-table"
    :page.sync="page"
    :footer-props="{
      'items-per-page-options': [15, 30, 45, { text: 'All', value: -1 }],
      'items-per-page-text': 'Rows per page'
    }"
  >
    <!-- ✅ Serial Number Column -->
    <template v-slot:item.serial="{ index }">
      <span class="font-weight-medium mono">{{ serialStart + index + 1 }}</span>
    </template>

    <template v-slot:item.invoiceNumber="{ item }">
      <span class="font-weight-medium">{{ item.invoiceNumber || '-' }}</span>
    </template>

    <template v-slot:item.invoiceDate="{ item }">
       <span>{{ formatDate(item.invoiceDate) }}</span>
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
      rowHeightPx: 50,
      page: 1
    };
  },
  computed: {
    localSelection: {
      get() { return this.value; },
      set(v) { this.$emit('input', v); }
    },
    computedHeaders() {
      // ✅ Add Serial Number as first column dynamically
      const serialHeader = { text: 'S.No', value: 'serial', sortable: false, align: 'start' };
      return [serialHeader, ...this.headers];
    },
    serialStart() {
      const ipp = Number(this.itemsPerPage) || 0;
      if (ipp <= 0) return 0; // "All" case
      return (this.page - 1) * ipp;
    }
  },
  methods: {
    formatDate(dateStr) {
      if (!dateStr) return "-";
      const date = new Date(dateStr);
      if (isNaN(date)) return "-";
      const dd = String(date.getDate()).padStart(2, "0");
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    }
  }

};
</script>

<style scoped>
/* ✅ Header background */
::v-deep(.v-data-table-header) {
  background-color: #dff3f79c !important;
}

/* ✅ Header cells */
::v-deep .v-data-table-header th {
  color: #000000 !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  text-transform: none;
  letter-spacing: 0;
  padding: 12px 10px;
}

/* ✅ Row height 50px */
::v-deep .v-data-table__wrapper thead tr > th,
::v-deep .v-data-table__wrapper tbody tr > td {
  height: 40px !important;
  padding-top: 1px !important;
  padding-bottom: 1px !important;
  vertical-align: middle !important;
}

/* ✅ Serial number style */
.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>
