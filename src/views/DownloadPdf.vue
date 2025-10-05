<template>
  <v-btn color="success" :disabled="!items.length" @click="downloadPdf">
    Download PDF
  </v-btn>
</template>

<script>
// npm install jspdf jspdf-autotable
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // <- import the function

export default {
  name: 'DownloadPdf',
  props: {
    items: {
      type: Array,
      required: true,
      default: () => [],
    },
    headers: {
      type: Array,
      required: true,
      default: () => [],
    },
  },
  methods: {
    downloadPdf() {
      if (!this.items || !this.items.length) return;
      console.log('items', JSON.stringify(this.items, null, 2))
      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4',
      });

      // Add "S.N" as the first column header
      const head = [[ 'S.N', ...this.headers.map(h => (h && h.text) ? h.text : '') ]];

      // Add serial number to each row
      const body = this.items.map((row, index) => [
        index + 1, // serial number
        ...this.headers.map(h => {
          const key = h && h.value;
          const val = key != null ? row[key] : undefined;
          return (val !== undefined && val !== null) ? String(val) : '-';
        })
      ]);

      autoTable(doc, {
        head,
        body,
        styles: { fontSize: 8 },
        startY: 10,
        theme: 'grid',
        headStyles: { fillColor: [41, 128, 185] },
        margin: { top: 20 },
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      doc.save(`Inventory_${dateStr}.pdf`);
    },
  },
};
</script>
