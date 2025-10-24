<template>
  <v-dialog v-model="previewLocal" max-width="1200" persistent>
    <v-card class="pa-0" style="overflow: hidden;">
      <br />
      <v-card-text class="invoice-root" ref="invoiceCard">
        <!-- ===== YOUR INVOICE MARKUP (unchanged) ===== -->
        <div class="top-header">
          <div class="top-header-left">
            <img style="height:40px; width:140px;" src="@/assets/newLogoTVS.png" />
          </div>
          <div class="top-header-right">
            <h3>ANSARI AUTOMOBILES</h3>
            <h4>BADI KAMHARIYA BY PASS ROAD, MAU</h4>
            <h5>GSTIN/UIN - 09AJBPA4037B1ZY</h5>
            <h5>STATE NAME: UTTAR PRADESH CODE 09</h5>
          </div>
        </div>

        <div class="top-strip" style="background-color:#b9b8b8d6; font-weight:600; font-size:12px;">
          <div class="label">BILL INVOICE</div>
        </div>

        <div class="header-row" style="margin-top:0px;">
          <div class="cell left">
            <div class="row">
              <div class="cell-key">Invoice No.</div>
              <div class="cell-val bold">{{ invoiceNumber || '—' }}</div>
            </div>
          </div>
          <div class="right" style="height:50px; width:100%; text-align:right;">
            <div class="row" style="display:flex; flex-direction:row; justify-content:right; padding-top:6px;">
              <div class="cell-key">&nbsp;&nbsp;&nbsp;&nbsp;Invoice Date</div>
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
              <div class="small">{{ formatAddressPlain(consignee.address) }} </div>
              <div class="small">GSTIN : {{ consignee.gstin || '—' }}</div>
              <div class="small">State : {{ consignee.stateName || '—' }} &nbsp; Code : {{ consignee.stateCode || '—' }}</div>
            </div>
          </div>
        </div>

        <table class="items bordered">
          <thead style="font-size:11px;">
            <tr>
              <th class="w-sl">S.NO.</th>
              <th>DESCRIPTION</th>
              <th class="w-hsn">HSN CODE</th>
              <th class="w-qty">QTY</th>
              <th class="w-rate">RATE</th>
              <th class="w-taxable">Taxable Value</th>
              <th class="w-gst" style="white-space: nowrap;">CGST <br /> Rate-Amt</th>
              <th class="w-gst" style="white-space: nowrap;">SGST <br /> Rate-Amt</th>
              <th class="w-total">TOTAL</th>
            </tr>
          </thead>
          <tbody style="font-size:10px;">
            <tr v-for="(it, i) in normalizedItems" :key="it._key">
              <td class="text-center">{{ i + 1 }}</td>
              <td>
                <div class="bold">{{ it.label }} - {{it.color}}</div>
                <div v-if="it.note" class="small text-dim">{{ it.note }}</div>
              </td>
              <td class="text-center">{{ it.hsn || '—' }}</td>
              <td class="text-center">{{ fmtQty(it.qty) }}</td>
              <td class="text-right">{{ money(it.rate) }}</td>
              <td class="text-right">{{ money(it.taxable) }}</td>
              <!-- <td class="text-right" style="white-space: nowrap;"><span style="text-align:left; border:1px solid green;">{{ pct(it.cgstRate) }}</span> -<span> {{ money(it.cgstAmt) }} </span></td> -->
              <td style="white-space: nowrap; text-align: right;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span style="text-align: left;">{{ pct(it.cgstRate) }}</span>
                  <span style="text-align: right;">{{ money(it.cgstAmt) }}</span>
                </div>
              </td>

              <!-- <td class="text-right" style="white-space: nowrap;">{{ pct(it.sgstRate) }} - {{ money(it.sgstAmt) }}</td> -->
              <td style="white-space: nowrap;">
                <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                  <span style="text-align: left;">{{ pct(it.sgstRate) }}</span>
                  <span style="text-align: right;">{{ money(it.sgstAmt) }}</span>
                </div>
              </td>

              <td class="text-right bold">{{ money(it.lineTotal) }}</td>
            </tr>
            <tr class="total-row">
              <!-- <td class="text-right bold">TOTAL</td> -->
              <td colspan="5" class="text-left bold">AMOUNT (IN WORDS) : <b>{{ amountInWords }} Rupees Only</b></td>
              <td class="text-right bold">{{ money(sum.taxable) }}</td>
              <td class="text-right bold">{{ money(sum.cgst) }}</td>
              <td class="text-right bold">{{ money(sum.sgst) }}</td>
              <td class="text-right bold">{{ money(sum.grand) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="bottom-grid">
          <div class="left bordered pad">
            <div class="bank mt8">
              <h4>Company Bank details </h4>
              <div style="font-size:11px;">
                <div class="bold">BANK A/C  : 766204935</div>
                <div class="bold">BANK IFSC : MAYUR BIHAR IDIB000M102</div>
                <div class="bold">BANK NAME : INDIAN BANK - CURRENT</div>
              </div>
            </div>
          </div>

          <div style="display:flex; flex-direction:row; height:90px;">
            <div style="display:flex; flex-direction:column; justify-content:center;">
              <h3 style="margin-left:200px; margin-top:10px;">for ANSARI AUTOMOBILES</h3> <br/>
              <h4 style="margin-left:200px; margin-top:10px; border-top:2px solid black; text-align:center;">Authorised Signatory</h4>
            </div>
          </div>
        </div>

        <div class="declare ">
          <div class="small">
            <h4>Declaration : *** We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. ***</h4>
          </div>
        </div>
      </v-card-text>

      <v-card-actions class="pa-3" style="gap:8px; flex-wrap: wrap;">
        <!-- Status + Save -->
        <v-select
          v-model="statusType"
          :items="statusOptions"
          label="Status"
          density="comfortable"
          variant="outlined"
          hide-details
          style="max-width: 220px"
        />
        <v-btn
          variant="flat"
          color="primary"
          :loading="saving"
          :disabled="!canSave || saving"
          @click="saveStatus"
        >
          <v-icon start>mdi-content-save</v-icon> Save
        </v-btn>

        <v-divider vertical class="mx-1" />

        <v-btn variant="text" @click="downloadPdf"><v-icon start>mdi-download</v-icon>Download</v-btn>
        <v-btn variant="text" @click="printPdf"><v-icon start>mdi-printer</v-icon>Print</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="previewLocal = false">Close</v-btn>
      </v-card-actions>

      <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">
        {{ snack.text }}
      </v-snackbar>
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

    /** Bulk-aware API endpoint */
    updateEndpoint: { type: String, default: process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateInventoryItem' },

    /** Presign endpoint (same as your image uploader) */
    presignEndpoint: { type: String, default: process.env.VUE_APP_AGENCY_BACKEND_URL + 'uploadImages' },

    /** Optional single-record fallback */
    itemPk: { type: String, default: null },
    itemSk: { type: String, default: null },
  },
  emits: ['update:preview', 'exported', 'saved'],
  data () {
    return {
      statusType: null, // UI model: we still call it statusType in UI but we send item.status
      statusOptions: ['BIKE','SOLD','BOOKED','INTRANSIT','DELIVERED','RETURNED'],
      saving: false,
      snack: { show: false, text: '', color: 'success' },
      billFileLocation:'',
    }
  },
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

    meta () { return { dated: this.invoiceDate || '', paymentTerms: this.paymentType || '' } },

    /** Normalize for UI + capture chassisNumber for bulk update */
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
          color: raw.color,
          label: raw.label || raw.modelName || 'Item',
          note: (raw.chassisNumber || raw.engineNumber)
            ? `Chassis: ${raw.chassisNumber || raw.chassis || '—'}  |  Engine: ${raw.engineNumber || '—'}`
            : '',
          hsn: raw.hsn || '',
          qty,
          rate: entered,
          taxable: round2(base),
          cgstRate, cgstAmt: round2(cgstAmt),
          sgstRate, sgstAmt: round2(sgstAmt),
          igstRate, igstAmt: round2(igstAmt),
          cessAmt: round2(Number(raw.cess ?? 0)),
          lineTotal: round2(gross),
          chassisNumber: raw.chassisNumber || raw.chassis || null
        }
      })
    },

    /** Unique chassis numbers from all items (bulk payload) */
    allChassisNumbers () {
      const s = new Set()
      for (const it of this.normalizedItems) {
        const ch = it.chassisNumber && String(it.chassisNumber).trim()
        if (ch) s.add(ch)
      }
      return Array.from(s)
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

    amountInWords () { return this.toCurrencyWords(this.sum.grand) || 'Zero' },

    /** Enable Save only when a status is chosen and we have identifiers */
    canSave () {
      const hasBulk = this.allChassisNumbers.length > 0
      const hasFallback = !!(this.itemPk && this.itemSk)
      return !!this.statusType && (hasBulk || hasFallback)
    }
  },

  methods: {
    fmtQty (q) { return Number(q).toFixed(Number(q) % 1 ? 2 : 0) },
    pct (n) { const v = Number(n || 0); return v ? `${(v % 1 ? v.toFixed(2) : v)}%` : '' },
    money (v) { return `₹${Number(v || 0).toFixed(2)}` },
    formatAddressPlain (a) { if (!a) return ''; return String(a).replace(/\s+/g,' ').replace(/\s*,\s*/g, ', ').trim() },

    /** Save: bulk by chassisNumbers; fallback to pk/sk. Then export & upload the PDF to S3. */
    async saveStatus () {
      if (!this.canSave) {
        this.showSnack('Select a status first.', 'error')
        return
      }

      const payload = this.allChassisNumbers.length > 0
        ? { chassisNumbers: this.allChassisNumbers, item: { status: this.statusType } } // <-- update "status" only
        : { pk: this.itemPk, sk: this.itemSk, item: { status: this.statusType } }

      this.saving = true
      try {
        // 1) Update inventory
        const res = await fetch(this.updateEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'Update failed')

        // Feedback for update
        if (Array.isArray(data?.results)) {
          const ok = data.results.filter(r => r.ok).length
          const fail = data.results.length - ok
          this.showSnack(`Status updated. Success: ${ok}${fail ? `, Failed: ${fail}` : ''}.`, fail ? 'warning' : 'success')
        } else {
          this.showSnack('Status updated successfully.', 'success')
        }
        this.$emit('saved', data)

        // 2) Export PDF as Blob
        const exported = await this.renderPdf('export') // returns { blob, filename }
        if (!exported || !exported.blob) throw new Error('PDF export failed')
        // 3) Upload to S3 via presigned URL
        const uploadOk = await this.uploadPdfToS3(exported.blob)
        this.saveInvoice();
        if (uploadOk) {
          this.showSnack('Invoice PDF uploaded to S3.', 'success')
        } else {
          this.showSnack('Status saved, but PDF upload failed.', 'warning')
        }
      } catch (e) {
        this.showSnack(`Failed: ${e.message}`, 'error')
      } finally {
        this.saving = false
      }
    },

    /** Request presigned URL then PUT the PDF blob */
    async uploadPdfToS3 (pdfBlob) {
      try {
        const vendor = (this.company?.name || 'UnknownVendor').trim()
        const folder = vendor.replace(/[^\w\-./]/g, '_') || 'UnknownVendor'
        const cleanInvoice = (this.invoiceNumber ? String(this.invoiceNumber) : 'invoice').replace(/[^\w\-./]/g, '_')
        const objectKey = `${folder}/${cleanInvoice}.pdf` // location/vendor + file name
        this.billFileLocation = objectKey;
        // Step 1: get presigned URL
        const presignRes = await fetch(this.presignEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ body: { fileName: objectKey, fileType: 'application/pdf' } })
        })
        if (!presignRes.ok) {
          console.error('Failed to get presigned URL', await presignRes.text())
          return false
        }
        const presignJson = await presignRes.json()
        const url = presignJson?.url
        if (!url) {
          console.error('Presigned URL missing in response:', presignJson)
          return false
        }

        // Step 2: PUT the PDF blob
        const putRes = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/pdf' },
          body: pdfBlob
        })
        return putRes.ok
      } catch (err) {
        console.error('PDF upload failed:', err)
        return false
      }
    },

    // ========== NEW: Save Invoice + Upload PDF ==========
    async saveInvoice() {
      this.creating = true
      console.log('billFileLocation', this.billFileLocation)
      try {
        // 1️⃣ Build the full invoice metadata
        const invoice = {
          vendorName: this.company.name,
          invoiceNumber: this.invoiceNumber,
          invoiceDate: this.invoiceDate,
          paymentType: this.paymentType,
          billFileLocation: this.billFileLocation,
          buyer: this.buyer,
          consignee: this.consignee,
          items: this.normalizedItems,
          totals: {
            taxable: this.sum.taxable,
            cgst: this.sum.cgst,
            sgst: this.sum.sgst,
            igst: this.sum.igst,
            grand: this.sum.grand,
            discount: this.totalDiscountComputed
          },
          status: this.statusType,
          notes: null
        }

        // 2️⃣ Create/Upsert invoice + get presigned PUT URL from backend
        const presignRes = await fetch(`${process.env.VUE_APP_AGENCY_BACKEND_URL}bill`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoice,
            pdf: { contentType: 'application/pdf' }
          })
        })
        this.showSnack('Invoice saved & PDF uploaded successfully.', 'success')
        // this.$emit('invoice-saved', patchJson.invoice)
      } catch (e) {
        this.showSnack(`Save invoice failed: ${e.message}`, 'error')
        console.error('Invoice save failed:', e)
      } finally {
        this.creating = false
      }
    },


    showSnack (text, color = 'success') {
      this.snack.text = text
      this.snack.color = color
      this.snack.show = true
    },

    /**
     * Single source of truth for PDF generation.
     * action: 'save' | 'print' | 'export'
     * - For 'export', this returns { blob, filename } so callers can upload.
     */
    async renderPdf (action = 'save') {
      const node = this.$refs.invoiceCard
      if (!node || typeof html2pdf === 'undefined') return null

      const filename = `${(this.invoiceNumber || 'invoice')}.pdf`
      const opt = {
        margin: [3, 10, 3, 10],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: node.scrollWidth
        },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' },
        pagebreak: { mode: ['css', 'legacy'] }
      }

      const worker = html2pdf().set(opt).from(node).toPdf()
      const pdf = await worker.get('pdf')
      const totalPages = pdf.internal.getNumberOfPages()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Watermark on each page
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
        return null
      }

      if (action === 'print') {
        pdf.autoPrint({ variant: 'non-conform' })
        const blobUrl = pdf.output('bloburl')
        const w = window.open(blobUrl, '_blank')
        if (w) w.onload = () => w.print()
        return null
      }

      if (action === 'export') {
        const blob = pdf.output('blob')
        const out = { blob, filename }
        this.$emit('exported', out)
        return out
      }

      return null
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

/* ===== Bordered helper ===== */
.bordered{border:1px solid #000}

/* ===== Items Table ===== */
.items{width:100%;border-collapse:collapse;margin-top:6px}
.items th,.items td{border:1px solid #000;padding:4px 5px;vertical-align:top}
.items thead th{background:#eee;font-weight:700;text-align:center}
.items .w-sl{width:44px}
.items .w-hsn{width:90px}
.items .w-uom{width:60px}
.items .w-qty{width:35px}
.items .w-rate{width:80px}
.items .w-scheme{width:70px}
.items .w-disc{width:80px}
.items .w-taxable{width:95px}
.items .w-gst{width:95px}
.items .w-amt{width:70px}
.items .w-cess{width:70px}
.items .w-total{width:90px}
.items .total-row td{font-weight:700}

/* ===== Bottom section: flex, 50% + 50%, fixed height ===== */
.bottom-grid{
  width: 100%;
  display: flex;
  gap: 8px;
  margin-top: 6px;
  align-items: stretch;
}

.bottom-grid > .left,
.bottom-grid > .right{
  flex: 0 0 calc(50% - 4px);
  width: calc(50% - 4px);
  height: 90px;
  box-sizing: border-box;
  overflow: auto;
}

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
