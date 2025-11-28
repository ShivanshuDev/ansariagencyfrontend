<template>
  <v-btn color="success" :disabled="!items.length" @click="downloadPdf">
    Download PDF
  </v-btn>
</template>

<script>
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default {
  name: 'DownloadPdf',
  props: {
    items: Array,
    headers: Array
  },
  methods: {
    downloadPdf () {
      console.log('this.items', JSON.stringify(this.items, null, 2))
      if (!this.items?.length) return

      const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      // Use Courier (closest to Courier New)
      doc.setFont('courier', 'normal')
      const pageWidth = doc.internal.pageSize.getWidth()

      // Take invoice details from first item
      const firstItem = this.items[0] || {}
      const invoiceNumber = firstItem.invoiceNumber || ''
      const invoiceDateStr = this.formatInvoiceDate(firstItem.invoiceDate)

      // Build header row
      const head = [[
        'S.NO',
        ...this.headers.map(h => h.text || '')
      ]]

      // Build body rows
      const body = this.items.map((row, index) => [
        index + 1,
        ...this.headers.map(h =>
          row[h.value] != null ? String(row[h.value]) : '-'
        )
      ])

      autoTable(doc, {
        head,
        body,
        startY: 32,
        theme: 'plain',   // NO BORDERS
        margin: { top: 26, left: 10, right: 10 },
        styles: {
          font: 'courier',
          fontSize: 8,
          cellPadding: 1,
          textColor: 0,
          lineWidth: 0,
          halign: 'left'
        },
        headStyles: {
          font: 'courier',
          fontStyle: 'bold',
          lineWidth: 0,
          textColor: 0
        },
        didDrawPage: (data) => {
          // ---------- TOP HEADER ----------
          doc.setFont('courier', 'bold')
          doc.setFontSize(12)
          doc.text('Ansari Automobiles', pageWidth / 2, 10, { align: 'center' })

          doc.setFont('courier', 'normal')
          doc.setFontSize(9)
          doc.text('BADI KAMHARIYA BY PASS ROAD MAU', pageWidth / 2, 14, { align: 'center' })

          // ---------- Generated + invoice ----------
          const now = new Date()
          const generatedStr = `${now.toLocaleDateString()} ${now.toLocaleTimeString()}`

          let genLine = `Generated: ${generatedStr}`
          if (invoiceNumber) {
            genLine += `, INVOICE NUMBER: ${invoiceNumber}`
          }
          if (invoiceDateStr) {
            genLine += `, INVOICE DATE: ${invoiceDateStr}`
          }

          doc.setFontSize(7)
          doc.text(genLine, data.settings.margin.left, 24)

          // ---------- Page Number ----------
          const pageStr = `Page ${data.pageNumber}`
          const width = doc.getTextWidth(pageStr)
          doc.text(
            pageStr,
            pageWidth - data.settings.margin.right - width,
            24
          )
        }
      })

      // Open PDF in new tab
      const blobUrl = doc.output('bloburl')
      window.open(blobUrl, '_blank')
    },

    // Helper: convert 'YYYY-MM-DD' -> 'DD/MM/YYYY'
    formatInvoiceDate (val) {
      if (!val) return ''
      try {
        const str = String(val)
        if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
          const [y, m, d] = str.split('-')
          return `${d}/${m}/${y}`
        }
        return str
      } catch {
        return ''
      }
    }
  }
}
</script>
