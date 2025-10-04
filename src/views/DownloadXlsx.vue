<template>
  <div>
    <v-btn :color="buttonColor" @click="download" :disabled="!hasRows" small>
      <v-icon left v-if="buttonIcon">{{ buttonIcon }}</v-icon>
      {{ buttonLabel }}
    </v-btn>
  </div>
</template>

<script>
import * as XLSX from 'xlsx';

export default {
  name: 'DownloadXlsx',
  props: {
    // rows to export (array of objects). Required.
    items: {
      type: Array,
      required: true
    },
    // headers array describing column order and labels. 
    // Example: [{ text: 'Invoice No', value: 'invoiceNumber' }, 'chassisNumber', ...]
    headers: {
      type: Array,
      default: () => []
    },
    // filename without extension (optional)
    filename: {
      type: String,
      default: () => `export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'_')}`
    },
    // button label/icon/style
    buttonLabel: {
      type: String,
      default: 'Download XLSX'
    },
    buttonIcon: {
      type: String,
      default: 'mdi-download'
    },
    buttonColor: {
      type: String,
      default: 'primary'
    },
    // Do we want to include header row (true usually)
    includeHeader: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    // array of column keys (value) in order
    columnOrder() {
      if (!this.headers || !this.headers.length) {
        // fallback to keys of first item
        return this.items && this.items.length ? Object.keys(this.items[0]) : [];
      }
      return this.headers.map(h => (typeof h === 'string' ? h : (h.value || h.text)));
    },
    // header labels to use (text if present else value)
    headerLabels() {
      if (!this.headers || !this.headers.length) {
        return this.columnOrder;
      }
      return this.headers.map(h => (typeof h === 'string' ? h : (h.text || h.value)));
    },
    hasRows() {
      return Array.isArray(this.items) && this.items.length > 0;
    }
  },
  methods: {
    // one-line epoch -> DD-MM-YYYY (handles seconds or ms)
    formatEpochOneLine(v) {
      if (v == null || v === '') return '';
      const n = Number(v);
      if (Number.isNaN(n)) return String(v);
      const ms = n < 1e12 ? n * 1000 : n;
      return new Date(ms).toLocaleDateString('en-GB').replace(/\//g, '-');
    },

    // prepare rows following header order and formatting date-like keys
    prepareRows(rows) {
      if (!rows || !rows.length) return [];
      const cols = this.columnOrder;
      return rows.map(r => {
        const out = {};
        for (const key of cols) {
          let val = r[key];

          // auto-format common date keys (createdAt, invoiceDate, date) — fallback: if numeric
          if (val != null && (key.toLowerCase().includes('date') || key.toLowerCase().includes('at') || key.toLowerCase().includes('time'))) {
            // try to parse numeric epoch
            const n = Number(val);
            if (!Number.isNaN(n)) {
              val = this.formatEpochOneLine(n);
            } else {
              // leave string dates as-is
              val = String(val);
            }
          }

          // normalize null/undefined
          out[key] = val == null ? '' : val;
        }
        return out;
      });
    },

    download() {
      if (!this.hasRows) {
        this.$emit('no-data');
        return;
      }

      // Use full items provided by parent
      const rows = this.prepareRows(this.items);

      // create worksheet from JSON
      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: true });

      // If includeHeader is true, write header labels on first row
      if (this.includeHeader && this.headerLabels && this.headerLabels.length) {
        XLSX.utils.sheet_add_aoa(ws, [this.headerLabels], { origin: 'A1' });
      }

      // create workbook and append sheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

      // write file
      const outName = `${this.filename}.xlsx`;
      XLSX.writeFile(wb, outName);

      this.$emit('downloaded', { filename: outName, count: rows.length });
    }
  }
};
</script>

<style scoped>
/* minor adjustments if needed */
</style>
