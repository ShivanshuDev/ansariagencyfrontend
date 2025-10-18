<template>
  <v-dialog v-model="previewLocal" max-width="900" persistent>
    <v-card style="height:900px; overflow-y:scroll;">
      <v-card-text class="invoice-card p-4" ref="invoiceCard">
        <!-- ===== TITLE (centered) ===== -->
        <div class="doc-title">Tax Invoice</div>

        <!-- ===== HEADER GRID (Left: company + consignee/buyer | Right: meta table) ===== -->
        <div class="header-grid">
          <!-- LEFT STACK -->
          <div class="left-stack bordered">
            <div class="company-block">
              <div class="company-name">ANSARI AUTOMOBILES</div>
              <div class="company-addr">
                Badi Kamharia Bye Pass Road, Near Over Bridge,<br />
                Mau 275101, Uttar Pradesh, Ph:8090231724, <br />
                Dlr GST .:09AJBPA4037B1ZY
              </div>
            </div>
            <div class="party titled">
              <div class="title-sm">Consignee (Ship to)</div>
              <div class="party-body">
                <div class="font-weight-medium">{{ consignee.name || '—' }}</div>
                <div class="small">{{ formatAddressPlain(consignee.address) }}</div>
                <div class="small">Mob:-{{ consignee.phone || '—' }}, GSTIN/UIN : {{ consignee.gstin || '—' }}</div>
                <div class="small">State Name : {{ consignee.stateName }}, Code : {{ consignee.stateCode }}</div>
              </div>
            </div>
            <div class="party titled">
              <div class="title-sm">Buyer (Bill to)</div>
              <div class="party-body">
                <div class="font-weight-medium">{{ buyer.name || '—' }}</div>
                <div class="small">{{ formatAddressPlain(buyer.address) }}</div>
                <div class="small">Mob:-{{ buyer.phone || '—' }}, GSTIN/UIN : {{ buyer.gstin || '—' }}</div>
                <div class="small">State Name : {{ buyer.stateName }}, Code : {{ buyer.stateCode }}</div>
              </div>
            </div>
          </div>

          <!-- RIGHT META TABLE -->
          <div class="right-meta bordered">
            <table class="meta-table">
              <tbody>
                <tr>
                  <td>Invoice No.</td>
                  <td class="text-right">{{ invoiceNumber || '—' }}</td>
                </tr>
                <tr>
                  <td>Dated</td>
                  <td class="text-right">{{ meta.dated || '—' }}</td>
                </tr>
                <tr>
                  <td>Delivery Note</td>
                  <td class="text-right">{{ meta.deliveryNote || '—' }}</td>
                </tr>
                <tr>
                  <td>Mode/Terms of Payment</td>
                  <td class="text-right">{{ meta.paymentTerms || '—' }}</td>
                </tr>
                <tr>
                  <td>Reference No. & Date.</td>
                  <td class="text-right">{{ meta.reference || '—' }}</td>
                </tr>
                <tr>
                  <td>Buyer's Order No.</td>
                  <td class="text-right">{{ meta.buyersOrder || '—' }}</td>
                </tr>
                <tr>
                  <td>Dispatch Doc No.</td>
                  <td class="text-right">{{ meta.dispatchDoc || '—' }}</td>
                </tr>
                <tr>
                  <td>Delivery Note Date</td>
                  <td class="text-right">{{ meta.deliveryNoteDate || '—' }}</td>
                </tr>
                <tr>
                  <td>Dispatched through</td>
                  <td class="text-right">{{ meta.dispatchedThrough || '—' }}</td>
                </tr>
                <tr>
                  <td>Destination</td>
                  <td class="text-right">{{ meta.destination || '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ===== ITEMS TABLE (exact column order from image) ===== -->
        <table class="items-table bordered mt-8">
          <thead>
            <tr>
              <th class="w-sl">Sl_No.</th>
              <th>Description_of_Goods</th>
              <th class="w-hsn">HSN/SAC</th>
              <th class="w-qty">Quantity</th>
              <th class="w-rate text-right">Rate</th>
              <th class="w-per text-center">per</th>
              <th class="w-disc text-right">Disc. %</th>
              <th class="w-amount text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(it, i) in items" :key="it.id || i">
              <td>{{ i + 1 }}</td>
              <td>
                <span class="bold">{{ it.label || it.modelName || 'Item' }}</span>
                <div class="small text--secondary" v-if="it.chassisNumber || it.engineNumber">
                  Chassis: {{ it.chassisNumber || '—' }} | Engine: {{ it.engineNumber || '—' }}
                </div>
              </td>
              <td class="text-right">{{ it.hsn || '—' }}</td>
              <td class="text-right">{{ displayQty(it) }}</td>
              <td class="text-right">₹{{ formatMoney(it.price) }}</td>
              <td class="text-center">{{ it.unit || 'Nos' }}</td>
              <td class="text-right">{{ displayPercent(it.discountPercent) }}</td>
              <td class="text-right">₹{{ formatMoney(lineAmount(it)) }}</td>
            </tr>

            <!-- Subtotal & tax lines like sample -->
            <tr class="no-btm">
              <td colspan="7" class="text-right bold pr-4">&nbsp;</td>
              <td class="text-right bold">₹{{ formatMoney(subtotal) }}</td>
            </tr>
            <tr class="no-btm">
              <td colspan="7" class="text-right bold pl-8">CGST</td>
              <td class="text-right">₹{{ formatMoney(totalCgst) }}</td>
            </tr>
            <tr>
              <td colspan="7" class="text-right bold pl-8">SGST</td>
              <td class="text-right">₹{{ formatMoney(totalSgst) }}</td>
            </tr>
            <tr class="total-row">
              <td colspan="7" class="text-right bold">Total</td>
              <td class="text-right bold">₹{{ formatMoney(grandTotal) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- ===== AMOUNT IN WORDS & E&O E ===== -->
        <div class="amount-words-row bordered">
          <div>
            <div class="small">Amount Chargeable (in words)</div>
            <div class="amount-words">{{ amountInWords }}</div>
          </div>
          <div class="small eo">E. & O. E</div>
        </div>

        <!-- ===== HSN/SAC SUMMARY (with amount + rate columns like image) ===== -->
        <table class="hsn-table bordered">
          <thead>
            <tr>
              <th>HSN/SAC</th>
              <th class="text-right">Taxable Value</th>
              <th class="text-right">CGST_Amount</th>
              <th class="text-right">Rate</th>
              <th class="text-right">SGST/UTGST_Amount</th>
              <th class="text-right">Rate</th>
              <th class="text-right">Tax Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, i) in hsnSummaryWithRates" :key="i">
              <td>{{ r.hsn || '—' }}</td>
              <td class="text-right">₹{{ formatMoney(r.taxable) }}</td>
              <td class="text-right">₹{{ formatMoney(r.cgst) }}</td>
              <td class="text-right">{{ formatRate(r.cgstRate) }}</td>
              <td class="text-right">₹{{ formatMoney(r.sgst) }}</td>
              <td class="text-right">{{ formatRate(r.sgstRate) }}</td>
              <td class="text-right">₹{{ formatMoney((r.cgst||0)+(r.sgst||0)) }}</td>
            </tr>
            <tr class="total-row">
              <td>Total</td>
              <td class="text-right">₹{{ formatMoney(subtotal) }}</td>
              <td class="text-right">₹{{ formatMoney(totalCgst) }}</td>
              <td class="text-right">—</td>
              <td class="text-right">₹{{ formatMoney(totalSgst) }}</td>
              <td class="text-right">—</td>
              <td class="text-right">₹{{ formatMoney(totalTax) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- ===== TAX AMOUNT IN WORDS ===== -->
        <div class="amount-words-row bordered">
          <div>
            <div class="small">Tax Amount (in words) :</div>
            <div class="amount-words">{{ taxAmountInWords }}</div>
          </div>
        </div>

        <!-- ===== FOOTER: PAN + BANK + SIGNATURE like image ===== -->
        <div class="footer_section" style="width: 100%; height:200px; display:flex; flex-direction:column; justify-contenct:space-between;">
            <div  style="width: 100%; display:flex; flex-direction:row; justify-contenct:space-between;">
                <div style="width:50%;" class="left">
                    <div class="small"><strong>Company's PAN</strong> : {{ company.pan }}</div>
                    <div class="small title-sm mt-4">Declaration</div>
                    <div class="small">
                        We declare that this invoice shows the actual price of the goods described and<br /> that all particulars are true and correct.
                    </div>
                </div>
                <div style="width:50%;" class="right">
                    <div class="title-sm">Company's Bank Details</div>
                    <div class="small">
                    Bank Name : {{ company.bank.name }}<br />
                    A/c No. : {{ company.bank.account }}<br />
                    Branch & IFS Code : {{ company.bank.branch }} & {{ company.bank.ifsc }}
                    </div>
                    <div class="sign-area">
                    <div>for ANSARI AUTOMOBILES</div>
                    <div class="sign-space">Authorised Signatory</div>
                    </div>
                </div>
            </div>
        </div>

      </v-card-text>

      <v-card-actions>
        <v-btn text @click="downloadPdf"><v-icon left>mdi-download</v-icon>Download</v-btn>
        <v-btn text @click="openPrint"><v-icon left>mdi-printer</v-icon>Print</v-btn>
        <v-spacer />
        <v-btn text @click="previewLocal = false">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import html2pdf from 'html2pdf.js'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'


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
    amountPaid: { type: Number, default: 0 },
    paymentType: { default: null },
    inventoryMap: { type: Object, default: () => ({}) }
  },
  computed: {
    previewLocal: { get() { return this.preview }, set(v) { this.$emit('update:preview', v) } },

    company() {
      const base = this.selectedVendor || {}
      return {
        name: base.name || 'S.M.G.C.V Enterprises-UP',
        addressLine1: base.billing?.line1 || '355, Ecotech-III, Udyog Kendra-I, Noida, Gautam Buddh Nagar,',
        cityState: base.billing?.city ? `${base.billing.city}, ${base.billing.state}` : 'Uttar Pradesh-201306',
        gstin: base.gstin || '09ASBPM9691C1ZG',
        stateName: base.billing?.state || 'Uttar Pradesh',
        stateCode: base.billing?.stateCode || '09',
        email: base.email || 'ganeshmanu07@gmail.com',
        pan: base.pan || 'ASBPM9691C',
        bank: { name: 'INDIAN BANK - CURRENT', account: '766204935', branch: 'MAYUR BIHAR', ifsc: 'IDIB000M102' }
      }
    },

    consignee() {
      const v = this.selectedVendor || {}
      return {
        name: v.shipping?.name || v.name || '',
        address: v.shipping?.line1 ? `${v.shipping.line1}${v.shipping.line2 ? ', ' + v.shipping.line2 : ''}, ${v.shipping.city || ''}, ${v.shipping.state || ''} ${v.shipping.pincode || ''}` : (v.billing?.line1 || ''),
        phone: v.shipping?.phone || v.phone || v.altphone || '',
        gstin: v.gstin || '',
        stateName: v.shipping?.state || v.billing?.state || '',
        stateCode: v.shipping?.stateCode || v.billing?.stateCode || ''
      }
    },

    buyer() { return { ...this.consignee } },

    meta() {
      return {
        deliveryNote: '',
        reference: '',
        buyersOrder: '',
        buyersOrderDate: '',
        dispatchDoc: '',
        dispatchedThrough: '',
        paymentTerms: this.paymentType || '',
        dated: this.invoiceDate || '',
        deliveryNoteDate: '',
        destination: '',
        termsOfDelivery: ''
      }
    },

    // HSN aggregation
    hsnSummary() {
      const map = {}
      this.items.forEach(it => {
        const h = it.hsn || '—'
        const qty = Number(it.quantity || 1)
        const price = Number(it.price || 0)
        const gross = qty * price
        const discAmt = it.discount != null ? Number(it.discount) : 0
        const taxable = Number(it.taxable ?? (gross - discAmt))
        const cgRate = Number(it.cgst || 0)
        const sgRate = Number(it.sgst || 0)
        const cg = it.cgstAmount != null ? Number(it.cgstAmount) : taxable * cgRate / 100
        const sg = it.sgstAmount != null ? Number(it.sgstAmount) : taxable * sgRate / 100
        if (!map[h]) map[h] = { hsn: h, taxable: 0, cgst: 0, sgst: 0 }
        map[h].taxable += taxable
        map[h].cgst += cg
        map[h].sgst += sg
      })
      return Object.values(map)
    },

    hsnSummaryWithRates() {
      return this.hsnSummary.map(r => ({
        ...r,
        cgstRate: r.taxable ? (r.cgst / r.taxable) * 100 : 0,
        sgstRate: r.taxable ? (r.sgst / r.taxable) * 100 : 0
      }))
    },

    amountInWords() {
      return this.toCurrencyWords(this.grandTotal) ? `INR ${this.toCurrencyWords(this.grandTotal)} Only` : 'INR Zero only'
    },
    taxAmountInWords() {
      return this.toCurrencyWords(this.totalTax) ? `INR ${this.toCurrencyWords(this.totalTax)} Only` : 'INR Zero only'
    }
  },
  methods: {
    lineAmount(it) {
      const qty = Number(it.quantity || 1)
      const price = Number(it.price || 0)
      const gross = qty * price
      const discAmt = it.discount != null ? Number(it.discount) : 0
      return gross - discAmt
    },
    displayQty(it) {
      const q = Number(it.quantity || 1)
      const u = it.unit || 'Nos'
      return `${q % 1 === 0 ? q.toFixed(0) : q} ${u}`
    },
    displayPercent(p) {
      if (p == null || p === '') return ''
      const n = Number(p)
      if (Number.isNaN(n)) return ''
      return `${n}%`
    },
    formatRate(r) {
      const n = Number(r || 0)
      return n ? `${n.toFixed(n % 1 ? 2 : 0)}%` : ''
    },
    formatMoney(v) { return Number(v || 0).toFixed(2) },
    formatAddressPlain(a) { if (!a) return ''; return String(a).replace(/\s+/g,' ').replace(/\s*,\s*/g, ', ').trim() },

    openPrint() {
      const node = this.$el.querySelector('.invoice-card')
      if (!node) return window.print()
      const w = window.open('', '_blank', 'width=900,height=700')
      w.document.write('<html><head><title>Invoice</title>')
      w.document.write('<style>body{font-family:Arial,Helvetica,sans-serif;padding:18px;color:#222} .doc-title{text-align:center;font-weight:700} table{width:100%;border-collapse:collapse} th,td{border:1px solid #000;padding:6px;font-size:11px} .small{font-size:11px;color:#000} .amount-words{font-weight:600;margin-top:3px} .sign-space{margin-top:24px;border-top:1px solid #000;padding-top:6px;display:inline-block}</style>')
      w.document.write('</head><body>')
      w.document.write(node.innerHTML)
      w.document.write('</body></html>')
      w.document.close(); w.focus(); w.print()
    },

    // downloadPdf() {
    //   const node = this.$el.querySelector('.invoice-card')
    //   if (!node) return this.openPrint()
    //   if (typeof html2pdf === 'undefined') return this.openPrint()
    //   const opt = { margin: 10, filename: `${this.invoiceNumber || 'invoice'}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' } }
    //   html2pdf().set(opt).from(node).save()
    // },


downloadPdf() {
    console.log('clling this function')
  const node = this.$refs.invoiceCard
  if (!node || typeof html2pdf === 'undefined') return

  const opt = {
    margin: 10,
    filename: `${this.invoiceNumber || 'invoice'}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
  }

  html2pdf().set(opt).from(node).save()
},

    toCurrencyWords(amount) {
      const n = Math.round(Number(amount || 0) * 100)
      if (!n) return ''
      const rupees = Math.floor(n/100)
      const paise = n % 100
      const words = this.numberToWords(rupees)
      const paiseWords = paise ? ' and ' + this.numberToWords(paise) + ' paise' : ''
      return words + paiseWords
    },
    numberToWords(num) {
      if (num === 0) return 'Zero'
      const a = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
      const b = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
      const twoDigit = (n) => { if (n < 20) return a[n]; const t = Math.floor(n/10); const r = n%10; return b[t] + (r ? ' ' + a[r] : '') }
      const threeDigit = (n) => { const h = Math.floor(n/100); const r = n%100; return (h ? a[h] + ' Hundred ' : '') + (r ? twoDigit(r) : '') }
      let out = ''
      let crore = Math.floor(num / 10000000); num = num % 10000000
      let lakh = Math.floor(num / 100000); num = num % 100000
      let thousand = Math.floor(num / 1000); num = num % 1000
      const hundred = Math.floor(num / 100); const rem = num % 100
      if (crore) out += threeDigit(crore) + ' Crore '
      if (lakh) out += threeDigit(lakh) + ' Lakh '
      if (thousand) out += threeDigit(thousand) + ' Thousand '
      if (hundred) out += (hundred ? a[hundred] + ' Hundred ' : '')
      if (rem) out += twoDigit(rem) + ' '
      return out.trim()
    }
  }
}
</script>

<style scoped>
.invoice-card{background:#fff;color:#000}
.doc-title{font-weight:700;text-align:center;margin-bottom:6px}

/* HEADER GRID */
.header-grid{display:grid;grid-template-columns:1.2fr 1fr;gap:8px;align-items:start}
.bordered{border:1px solid #000}
.left-stack{display:flex;flex-direction:column}
.company-block{padding:8px;border-bottom:1px solid #000}
.company-name{font-weight:700}
.company-addr{font-size:11px;margin-top:2px}
.company-small{font-size:11px;margin-top:6px}
.party{padding:8px;border-top:1px solid #000}
.title-sm{font-weight:700;margin-bottom:4px}
.party-body .small{font-size:11px;line-height:1.3}

.right-meta{padding:0}
.meta-table{width:100%;border-collapse:collapse}
.meta-table td{border:1px solid #000;padding:3px;font-size:11px}

/* ITEMS TABLE */
.mt-8{margin-top:8px}
.items-table{width:100%;border-collapse:collapse}
.items-table th,.items-table td{border:1px solid #000;padding:6px;font-size:11px;vertical-align:top}
.items-table thead th{font-weight:700;text-align:left}
.bold{font-weight:700}
.w-sl{width:42px}
.w-hsn{width:90px}
.w-qty{width:100px}
.w-rate{width:110px}
.w-per{width:70px}
.w-disc{width:80px}
.w-amount{width:130px}
.no-btm td{border-bottom:none}
.total-row td{font-weight:700}
.text-right{text-align:right}
.text-center{text-align:center}
.pr-4{padding-right:16px}
.pl-8{padding-left:32px}

/* AMOUNT IN WORDS + EOE */
.amount-words-row{display:flex;justify-content:space-between;align-items:flex-start;margin-top:4px;padding:4px}
.amount-words{font-weight:600;margin-top:2px; font-size:10px;}
.eo{align-self:center}

/* HSN TABLE */
.hsn-table{width:100%;border-collapse:collapse;margin-top:8px}
.hsn-table th,.hsn-table td{border:1px solid #000;padding:6px;font-size:10px}

/* FOOTER */
.footer-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px; width: 100%;}
.footer-grid .left,.footer-grid .right{padding:8px; width: 50%;}
.sign-area{margin-top:18px}
.sign-space{margin-top:24px;display:inline-block;border-top:1px solid #000;padding-top:6px}

.bottom-note{text-align:center;margin-top:6px}

.text--secondary{color:#333}
.font-weight-medium{font-weight:600}
.small{font-size:11px}
/* ======= COMPACT (PDF-only) ======= */
.invoice-card.compact { 
  /* reduce the p-4 padding the dialog adds */
  padding: 6px !important;
  font-size: 11px;           /* base text smaller */
  line-height: 1.2;
}
.invoice-card.compact .small { font-size: 10px; line-height: 1.2; }

/* Thinner borders everywhere */
.invoice-card.compact .bordered,
.invoice-card.compact .items-table th,
.invoice-card.compact .items-table td,
.invoice-card.compact .hsn-table th,
.invoice-card.compact .hsn-table td,
.invoice-card.compact .meta-table td,
.invoice-card.compact .sign-space {
  border-width: 0.2px !important; /* ~hairline but still visible in PDF */
  border-color: #000 !important;
}

/* Tighter table cell padding */
.invoice-card.compact .items-table th,
.invoice-card.compact .items-table td,
.invoice-card.compact .hsn-table th,
.invoice-card.compact .hsn-table td,
.invoice-card.compact .meta-table td {
  padding: 2px !important;
  font-size: 10px;
}

/* Header & section spacing tightened */
.invoice-card.compact .doc-title { margin-bottom: 4px; font-size: 13px; }
.invoice-card.compact .company-name { font-size: 12px; }
.invoice-card.compact .company-addr,
.invoice-card.compact .company-small { font-size: 10px; }

.invoice-card.compact .header-grid { gap: 4px !important; }
.invoice-card.compact .company-block { padding: 6px !important; }
.invoice-card.compact .party { padding: 6px !important; }
.invoice-card.compact .title-sm { margin-bottom: 2px !important; }

/* Items table spacing */
.invoice-card.compact .mt-8 { margin-top: 4px !important; }
.invoice-card.compact .bold { font-weight: 600; }
.invoice-card.compact .w-sl { width: 36px; }
.invoice-card.compact .w-hsn { width: 80px; }
.invoice-card.compact .w-qty { width: 80px; }
.invoice-card.compact .w-rate { width: 90px; }
.invoice-card.compact .w-per { width: 60px; }
.invoice-card.compact .w-disc { width: 70px; }
.invoice-card.compact .w-amount { width: 110px; }

/* Amount-in-words & HSN blocks closer together */
.invoice-card.compact .amount-words-row { 
  margin-top: 4px !important; 
  padding: 6px !important; 
}
.invoice-card.compact .amount-words { font-size: 11px; margin-top: 2px; }

/* HSN summary spacing */
.invoice-card.compact .hsn-table { margin-top: 2px !important; }

/* Footer tighter */
.invoice-card.compact .footer-grid { gap: 0px !important; margin-top: 6px !important; }
.invoice-card.compact .footer-grid .left, 
.invoice-card.compact .footer-grid .right { padding: 6px !important; }
.invoice-card.compact .sign-area { margin-top: 12px !important; }
.invoice-card.compact .sign-space { margin-top: 16px !important; padding-top: 4px !important; }

/* Bottom note closer */
.invoice-card.compact .bottom-note { margin-top: 4px !important; font-size: 10px; }

/* Kill stray vertical whitespace between stacked sections */
.invoice-card.compact .parties-row,
.invoice-card.compact .items-area,
.invoice-card.compact .lower-row { margin-top: 6px !important; }

/* Ensure tables pack tightly and don’t add unexpected gaps */
.invoice-card.compact .items-table,
.invoice-card.compact .hsn-table,
.invoice-card.compact .meta-table { border-collapse: collapse !important; }

</style>
