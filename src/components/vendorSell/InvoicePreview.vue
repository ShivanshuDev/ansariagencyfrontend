<template>
  <v-dialog v-model="previewLocal" max-width="1200" persistent>
    <v-card class="pa-0" style="overflow: hidden;">
      <br />
      <v-card-text class="invoice-root" ref="invoiceCard">
        <!-- ===== YOUR INVOICE MARKUP (unchanged) ===== -->
        <div class="top-header">
          <div class="top-header-left">
            <img style="height:60px; width:160px;" src="@/assets/newLogoTVS.png" />
          </div>
          <div class="top-header-right">
            <h2>ANSARI AUTOMOBILES</h2>
            <h3>BADI KAMHARIYA BY PASS ROAD, MAU</h3>
            <h4>GSTIN/UIN - 09AJBPA4037B1ZY</h4>
            <h4>STATE NAME: UTTAR PRADESH CODE 09</h4>
          </div>
        </div>

        <div class="top-strip" style="background-color:#b9b8b8d6; font-weight:600; font-size:12px;">
          <div class="label">BILL INVOICE</div>
        </div>

        <div class="header-row" style="margin-top:5px;">
          <div class="cell left">
            <div class="row">
              <div class="cell-key">Invoice No.</div>
              <div class="cell-val bold">{{ invoiceNumber || '—' }}</div>
            </div>
          </div>
          <div class=" right" style="height:30px; width:100%; text-align:right;">
            <div class="row" style="display:flex; flex-direction:row; justify-content:right;">
              <div class="cell-key"> &nbsp; &nbsp;&nbsp; &nbsp;  Invoice Date</div>
              <div class="cell-val bold">{{ meta.dated || '—' }}&nbsp;</div>
            </div>
          </div>
        </div>

        <div class="two-col">
          <div class="col">
            <div class="blk-head">BILL TO - {{ buyer.name || '—' }}</div>
            <div class="blk-body">
              <div class="small">{{ formatAddressPlain(buyer.address) }}</div>
              <div class="small">GSTIN : {{ buyer.gstin || '—' }}</div>
              <div class="small">State : {{ buyer.stateName || '—' }} &nbsp; Code : {{ buyer.stateCode || '—' }}</div>
            </div>
          </div>
          <div class="col">
            <div class="blk-head">SHIP TO - {{ consignee.name || '—' }}</div>
            <div class="blk-body">
              <div class="small">{{ formatAddressPlain(consignee.address) }}</div>
              <div class="small">GSTIN : {{ consignee.gstin || '—' }}</div>
              <div class="small">State : {{ consignee.stateName || '—' }} &nbsp; Code : {{ consignee.stateCode || '—' }}</div>
            </div>
          </div>
        </div>

        <table class="items bordered">
          <thead>
            <tr>
              <th class="w-sl">S. NO.</th>
              <th>DESCRIPTION</th>
              <th class="w-hsn">HSN CODE</th>
              <th class="w-qty">QTY</th>
              <th class="w-rate">RATE</th>
              <th class="w-taxable">Taxable<br/>Value</th>
              <th class="w-gst" style="white-space: nowrap;">CGST <br /> Rate-Amt</th>
              <th class="w-gst" style="white-space: nowrap;">SGST <br /> Rate-Amt</th>
              <th class="w-total">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, i) in normalizedItems" :key="it._key">
              <td class="text-center">{{ i + 1 }}</td>
              <td>
                <div class="bold">{{ it.label }}</div>
                <div v-if="it.note" class="small text-dim">{{ it.note }}</div>
              </td>
              <td class="text-center">{{ it.hsn || '—' }}</td>
              <td class="text-center">{{ fmtQty(it.qty) }}</td>
              <td class="text-right">{{ money(it.rate) }}</td>
              <td class="text-right">{{ money(it.taxable) }}</td>
              <td class="text-right" style="white-space: nowrap;">{{ pct(it.cgstRate) }}  -  {{ money(it.cgstAmt) }}</td>
              <td class="text-right" style="white-space: nowrap;">{{ pct(it.sgstRate) }}  -  {{ money(it.sgstAmt) }}</td>
              <td class="text-right bold">{{ money(it.lineTotal) }}</td>
            </tr>
            <tr class="total-row">
              <td class="text-right bold">TOTAL</td>
              <td colspan="4" class="text-right bold"></td>
              <td class="text-right bold">{{ money(sum.taxable) }}</td>
              <td class="text-right bold">{{ money(sum.cgst) }}</td>
              <td class="text-right bold">{{ money(sum.sgst) }}</td>
              <td class="text-right bold">{{ money(sum.grand) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="bottom-grid">
          <div class="left bordered pad">
            <div class="row-line">
              <div>Salesman/Broker</div>
              <div class="dash"></div>
            </div>
            <div class="row-line">
              <div>Transport</div>
              <div class="dash"></div>
            </div>

            <div class="bank mt8">
              <div class="bold">BANK A/C</div>
              <div>{{ company.bank.account }}</div>
              <div class="bold">BANK IFSC</div>
              <div>{{ company.bank.ifsc }}</div>
              <div class="bold">BANK NAME</div>
              <div>{{ company.bank.name }}</div>
            </div>

            <div class="amount-words mt8">
              <span class="bold">{{ amountInWords }} Rupees Only </span>
            </div>
          </div>

          <div style="display:flex; flex-direction:row;">
            <div class="bordered">
              <table class="summary">
                <tbody>
                  <tr>
                    <td>GROSS TOTAL</td>
                    <td class="text-right">{{ money(sum.taxable) }}</td>
                  </tr>
                  <tr>
                    <td>DISCOUNT RS.</td>
                    <td class="text-right">{{ money(totalDiscountComputed) }}</td>
                  </tr>
                  <tr>
                    <td class="bold">TOTAL AMOUNT BEFORE TAX</td>
                    <td class="text-right bold">{{ money(sum.taxable) }}</td>
                  </tr>
                  <tr>
                    <td>Add: CGST</td>
                    <td class="text-right">{{ money(sum.cgst) }}</td>
                  </tr>
                  <tr>
                    <td>Add: SGST</td>
                    <td class="text-right">{{ money(sum.sgst) }}</td>
                  </tr>
                  <tr class="grand">
                    <td class="bold">TOTAL AMOUNT AFTER TAX</td>
                    <td class="text-right bold">{{ money(sum.grand) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div style="display:flex; flex-direction:row; justify-content:center; align-items:center; width:260px;">
              <h3 style="margin-top:100px;">Signature</h3>
            </div>
          </div>
        </div>

        <div class="declare bordered pad">
          <div class="small">
            <h3>We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct.</h3>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-3">
        <v-btn variant="text" @click="downloadPdf"><v-icon start>mdi-download</v-icon>Download</v-btn>
        <v-btn variant="text" @click="printPdf"><v-icon start>mdi-printer</v-icon>Print</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="previewLocal = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import html2pdf from 'html2pdf.js'

export default {
  name: 'InvoicePreview',
  props: {
    preview: { type: Boolean, default: false },
    selectedVendor: { default: null },
    items: { type: Array, default: () => [] },
    invoiceNumber: { default: '' },
    invoiceDate: { default: '' },
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalCgst: { type: Number, default: 0 },
    totalSgst: { type: Number, default: 0 },
    totalTax: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    paymentType: { default: null },
  },
  emits: ['update:preview', 'exported'],
  computed: {
    previewLocal: { get() { return this.preview }, set(v) { this.$emit('update:preview', v) } },
    company () {
      const v = this.selectedVendor || {}
      return {
        name: v.name || '',
        addressLine1: v.billing?.line1 || '',
        cityState: v.billing?.city ? `${v.billing.city}, ${v.billing.state}` : '',
        gstin: v.gstin || '',
        stateName: v.billing?.state || ' ',
        stateCode: v.billing?.stateCode || ' ',
        pan: v.pan || '—',
        bank: {
          name: (v.bank && v.bank.name) || ' ',
          account: (v.bank && v.bank.account) || '',
          ifsc: (v.bank && v.bank.ifsc) || ''
        }
      }
    },
    consignee () {
      const v = this.selectedVendor || {}
      return {
        name: v.shipping?.name || v.name || '',
        address: v.shipping?.line1 ? `${v.shipping.line1}${v.shipping.line2 ? ', '+v.shipping.line2 : ''}, ${v.shipping.city || ''}, ${v.shipping.state || ''} ${v.shipping.pincode || ''}` : (v.billing?.line1 || ''),
        phone: v.shipping?.phone || v.phone || '',
        gstin: v.gstin || '',
        stateName: v.shipping?.state || v.billing?.state || '',
        stateCode: v.shipping?.stateCode || v.billing?.stateCode || ''
      }
    },
    buyer () { return { ...this.consignee } },
    meta () {
      return { dated: this.invoiceDate || '', paymentTerms: this.paymentType || '' }
    },
    normalizedItems () {
      const round2 = v => Number((Math.round((v + Number.EPSILON) * 100) / 100).toFixed(2))
      return (this.items || []).map((raw, idx) => {
        const qty = Number(raw.quantity ?? raw.qty ?? 1)
        const entered = Number(raw.price ?? raw.rate ?? 0)   // GST-inclusive price per unit
        const gross = qty * entered

        const cgstRate = Number(raw.cgst ?? 0)
        const sgstRate = Number(raw.sgst ?? 0)
        const igstRate = Number(raw.igst ?? 0)
        const totalGstRate = cgstRate + sgstRate + igstRate

        const base = totalGstRate ? gross / (1 + totalGstRate / 100) : gross
        const cgstAmt = base * cgstRate / 100
        const sgstAmt = base * sgstRate / 100
        const igstAmt = base * igstRate / 100

        return {
          _key: raw.id ?? idx,
          label: raw.label || raw.modelName || 'Item',
          note: (raw.chassisNumber || raw.engineNumber)
            ? `Chassis: ${raw.chassisNumber || '—'}  |  Engine: ${raw.engineNumber || '—'}`
            : '',
          hsn: raw.hsn || '',
          qty,
          rate: entered,
          taxable: round2(base),
          cgstRate,
          cgstAmt: round2(cgstAmt),
          sgstRate,
          sgstAmt: round2(sgstAmt),
          igstRate,
          igstAmt: round2(igstAmt),
          cessAmt: round2(Number(raw.cess ?? 0)),
          lineTotal: round2(gross) // GST-inclusive total
        }
      })
    },
    sum () {
      return this.normalizedItems.reduce((acc, it) => {
        acc.taxable += it.taxable
        acc.cgst += it.cgstAmt
        acc.sgst += it.sgstAmt
        acc.igst += it.igstAmt
        acc.cess += it.cessAmt
        acc.grand += it.lineTotal
        return acc
      }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, grand: 0 })
    },
    totalDiscountComputed () {
      if (this.totalDiscount) return Number(this.totalDiscount)
      const fromItems = this.normalizedItems.reduce((s, it) => s + (it.discAmt || 0), 0)
      return fromItems
    },
    amountInWords () {
      return this.toCurrencyWords(this.sum.grand) || 'Zero'
    }
  },
  methods: {
    fmtQty (q) { return Number(q).toFixed(Number(q) % 1 ? 2 : 0) },
    pct (n) { const v = Number(n || 0); return v ? `${(v % 1 ? v.toFixed(2) : v)}%` : '' },
    money (v) { return `₹${Number(v || 0).toFixed(2)}` },
    formatAddressPlain (a) { if (!a) return ''; return String(a).replace(/\s+/g,' ').replace(/\s*,\s*/g, ', ').trim() },

    /**
     * Single source of truth for PDF generation.
     * action: 'save' | 'print' | 'export'
     */
    async renderPdf (action = 'save') {
      const node = this.$refs.invoiceCard
      if (!node || typeof html2pdf === 'undefined') return

      const filename = `${this.invoiceNumber || 'invoice'}.pdf`

      // html2pdf/jspdf options
      const opt = {
        margin: [10, 10, 10, 10],                     // top, right, bottom, left (pt)
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: node.scrollWidth                 // reduce reflow differences
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' }, // keep your original orientation
        pagebreak: { mode: ['css', 'legacy'] }
      }

      // Build once
      const worker = html2pdf().set(opt).from(node).toPdf()

      // Add watermark + (optional) any PDF-level tweaks AFTER render
      const pdf = await worker.get('pdf')
      const totalPages = pdf.internal.getNumberOfPages()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.saveGraphicsState()
        pdf.setGState(new pdf.GState({ opacity: 0.08 }))
        pdf.setTextColor(150, 150, 150)
        pdf.setFontSize(70)
        pdf.setFont('helvetica', 'bold')
        pdf.text('Ansari Automobile', pageWidth, pageHeight / 2, { align: 'left', angle: 10 })
        pdf.restoreGraphicsState()
      }

      if (action === 'save') {
        pdf.save(filename)
        return
      }

      if (action === 'print') {
        // Open the same PDF and trigger print — identical layout to download
        pdf.autoPrint({ variant: 'non-conform' })
        const blobUrl = pdf.output('bloburl')
        const w = window.open(blobUrl, '_blank')
        // Some browsers auto-open print; this ensures it:
        if (w) w.onload = () => w.print()
        return
      }

      if (action === 'export') {
        // Emit Blob (and base64 too if you need). Parent can upload/store.
        const blob = pdf.output('blob')
        this.$emit('exported', { blob, filename })
        return
      }
    },

    downloadPdf () { return this.renderPdf('save') },
    printPdf () { return this.renderPdf('print') },
    exportPdf () { return this.renderPdf('export') },

    /* ====== Words (Indian system) ====== */
    toCurrencyWords (amount) {
      const n = Math.round(Number(amount || 0))
      if (!n) return ''
      const a = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
      const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
      const crore = Math.floor(n / 10000000)
      const lakh = Math.floor((n % 10000000) / 100000)
      const thousand = Math.floor((n % 100000) / 1000)
      const hundred = Math.floor((n % 1000) / 100)
      const rest = n % 100
      const two = (x)=> x<20 ? a[x] : b[Math.floor(x/10)] + (x%10? ' '+a[x%10]:'')
      const seg = (x, name)=> x? (x<100? two(x): a[Math.floor(x/100)]+' Hundred'+(x%100?' '+two(x%100):'')) + ' ' + name + ' ':''
      const head = (crore? seg(crore,'Crore'):'') + (lakh? seg(lakh,'Lakh'):'') + (thousand? seg(thousand,'Thousand'):'') + (hundred? a[hundred]+' Hundred ':'')
      return (head + (rest? two(rest):'')).trim()
    }
  }
}
</script>

<style scoped>
.top-header{
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
}
.top-header-left{
  width: 50%;
}
.top-header-right{
  width: 50%;
  text-align: right;
}
/* ===== Base ===== */
.invoice-root{
  color:#000;
  background:#fff;
  padding:10px 12px 12px;
  font-family: Arial, Helvetica, sans-serif;
  font-size:12px;
  line-height:1.25;
}
.bold{font-weight:700}
.small{font-size:11px}
.text-dim{color:#333}
.text-right{text-align:right}
.text-center{text-align:center}
.mt8{margin-top:8px}

/* ===== Top strip ===== */
.top-strip{
  border:1px solid #000;
  border-bottom:none;
  display:flex;justify-content:center;align-items:center;
  padding:4px 0;
}
.top-strip .label{font-weight:700;letter-spacing:.5px}

/* ===== Header row (invoice no/date) ===== */
.header-row{
  display:grid;grid-template-columns:1fr 1fr;
  border:1px solid #000;border-top:none;
  height: 20px;
  padding:10px;
}
.header-row .cell{padding:6px 8px;border-left:1px solid #000}
.header-row .cell.left{border-left:none}
.header-row .row{display:flex;gap:8px}
.header-row .cell-key{font-weight:600;min-width:95px}

/* ===== Two column (Bill/Ship) ===== */
.two-col{
  display:grid;grid-template-columns:1fr 1fr;gap:0;border-top:none;margin-top:0;
  border-left:1px solid #000;border-right:1px solid #000;border-bottom:none;
}
.two-col .col{border-bottom:1px solid #000;padding:6px 8px}
.two-col .col + .col{border-left:1px solid #000}
.blk-head{font-weight:700;margin-bottom:4px}

/* ===== Company bar (like image center row) ===== */
.company-bar{
  display:flex;justify-content:space-between;align-items:flex-start;
  border:1px solid #000;border-top:none;padding:6px 8px;
}
.company .name{font-weight:700}
.company .addr{margin-top:2px}
.ship-meta{text-align:right}

/* ===== Bordered helper ===== */
.bordered{border:1px solid #000}

/* ===== Items Table ===== */
.items{width:100%;border-collapse:collapse;margin-top:6px}
.items th,.items td{border:1px solid #000;padding:4px 5px;vertical-align:top}
.items thead th{background:#eee;font-weight:700;text-align:center}
.items .w-sl{width:44px}
.items .w-hsn{width:90px}
.items .w-uom{width:60px}
.items .w-qty{width:70px}
.items .w-rate{width:80px}
.items .w-scheme{width:70px}
.items .w-disc{width:80px}
.items .w-taxable{width:95px}
.items .w-gst{width:60px}
.items .w-amt{width:70px}
.items .w-cess{width:70px}
.items .w-total{width:90px}
.items .total-row td{font-weight:700}

/* ===== Bottom section: flex, 50% + 50%, fixed height ===== */
.bottom-grid{
  width: 100%;
  display: flex;
  gap: 8px;                 /* space between the two boxes */
  margin-top: 6px;
  align-items: stretch;     /* both boxes same height */
}

.bottom-grid > .left,
.bottom-grid > .right{
  flex: 0 0 calc(50% - 4px);/* each takes 50% minus half the gap */
  width: calc(50% - 4px);   /* keep width stable for print/PDF */
  height: 170px;            /* requested fixed height */
  box-sizing: border-box;
  overflow: auto;           /* scroll if content exceeds height */
}

/* keep your existing utilities */
.pad{ padding: 8px; }
.row-line{ display:flex; gap:8px; align-items:center; }
.row-line .dash{ flex:1; border-bottom:1px solid #000; height:1px; }

.summary{ width:100%; border-collapse:collapse; font-size: 11px; font-weight: 700; }
.summary td{ border-bottom:1px solid #000; padding:6px 8px; }
.summary tr:last-child td{ border-bottom:none; }
.summary .grand td{ background:#eee; }


/* ===== Declaration + Sign ===== */
.declare{
  height: 30px;
  width: 100%;
  display:flex;justify-content:space-between;gap:16px;margin-top:6px;
}
.declare .right{display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-end}
.declare .sign{margin-top:24px;border-top:1px solid #000;padding-top:6px}

/* ===== Terms ===== */
.terms{margin-top:6px;border:1px solid #000;padding:6px 8px}
</style>
