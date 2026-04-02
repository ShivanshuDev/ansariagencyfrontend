<template>
  <v-dialog v-model="open" max-width="900px" persistent scrollable>
    <v-card style="width:900px;">
      <v-toolbar flat dense>
        <v-spacer/>
        <v-btn small outlined class="mr-2" @click="download">
          <v-icon left small>mdi-file-pdf-box</v-icon> Download
        </v-btn>
        <v-btn icon @click="open=false"><v-icon>mdi-close</v-icon></v-btn>
      </v-toolbar>

      <v-card-text>
        <div ref="sheet" class="gp-a4">
          <div class="gp-watermark">Ansari Automobiles</div>

          <div class="gp-title">Gate Pass / Delivery challan</div>
          <div class="gp-hr"></div>

          <div class="gp-row">
            <div class="gp-col">
              <div class="gp-b">ANSARI AUTOMOBILES</div>
              <div>Badi Kamhariya Bye Pass Road</div>
              <div>Near Over Bridge, Mau</div>
              <div>Mau. Uttar Pradesh - 275101</div>
              <div>Ph: 8090231724</div>
            </div>

            <div class="gp-col">
              <div>Customer : <span class="gp-b">{{ d.customerName || '-' }}</span></div>
              <div>Address : {{ d.currentAddress || '-' }}</div>
              <div v-if="d.permanentAddress"> {{ d.permanentAddress }}</div>
              <div>Mobile: {{ d.mobile || '-' }}</div>
            </div>
          </div>

          <div class="gp-hr"></div>

          <div class="gp-row">
            <div class="gp-col">
              <div class="gp-b">Part Description</div>
              <div>{{ d.model || '-' }}<span v-if="d.color"> - {{ d.color }}</span></div>
            </div>
            <div class="gp-col gp-right">
              <div class="gp-b">Quantity</div>
              <div>{{ d.qty || 1 }}</div>
            </div>
          </div>

          <div class="gp-hr"></div>

          <table class="gp-grid">
            <thead>
              <tr>
                <th style="width:70px;">S No.</th>
                <th>FRAME NO</th>
                <th>ENGINE NO</th>
                <th class="gp-r">Total Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>{{ d.chassis || '—' }}</td>
                <td>{{ d.engine || '—' }}</td>
                <td class="gp-r">{{ money(d.totalAmount) }}</td>
              </tr>
            </tbody>
          </table>

          <div class="gp-hr"></div>

          <div class="gp-note">
            <div>Note: Goods once sold will not be taken back</div>
            <div class="gp-flex">
              <div>Prepared by {{ d.preparedBy || '—' }}</div>
              <div class="gp-right">For ANSARI AUTOMOBILES</div>
            </div>
          </div>

          <div class="gp-signs">
            <div>Checked by</div>
            <div>Customer Signature</div>
            <div>Authorised Signatory</div>
          </div>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import html2pdf from 'html2pdf.js'

export default {
  name: 'GatePass',
  data: () => ({
    open: false,
    d: {} // flattened data for the template
  }),
  methods: {
    /**
     * Open Gate Pass preview.
     * @param {Object} form - your existing form object
     * @param {Object} selected - your selectedChassisInfo object
     * @param {Number} totalAmount - billGrandTotal (number)
     */
    show(form, selected = {}, totalAmount = 0) {
      const addr = form?.customer?.address || {}
      const currAddr = [addr.line1, addr.line2, addr.village, addr.postOffice, addr.tahsil, addr.district, addr.state, addr.pincode]
        .filter(Boolean).join(', ')
      const p = form?.permanentAddress || {}
      const permAddr = [p.village, p.district, p.state, p.pincode].filter(Boolean).join(', ') || null

      this.d = {
        customerName: (form?.owner?.ownershipType === 'FIRM' ? form?.firm?.name : form?.customer?.name) || '',
        currentAddress: currAddr,
        permanentAddress: permAddr,
        mobile: form?.customer?.phone || '',
        model: form?.model || '',
        color: selected?.color || '',
        qty: form?.qty || 1,
        chassis: form?.chassisNumber || '',
        engine: selected?.engineNumber || '',
        totalAmount: Number(totalAmount || 0),
        preparedBy: this.$store?.state?.user?.employeeId || ''
      }
      this.open = true
    },
    async download() {
      if (!this.$refs.sheet) return
      const opt = {
        margin: [8,8,8,8],
        filename: `GatePass_${this.d.chassis || 'NA'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' }
      }
      await html2pdf().set(opt).from(this.$refs.sheet).save()
    },
    money(v){ return new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:2}).format(Number(v||0)) }
  }
}
</script>

<style scoped>
.gp-a4{ width:700px; min-height:523px; padding:4px 4px 4px; box-sizing:border-box; background:#fff; position:relative; font-size:12px; line-height:1.35; color:#000; font-family:Arial,Helvetica,sans-serif; }
.gp-title{ text-align:center; font-weight:700; margin-bottom:6px; }
.gp-hr{ border-bottom:1px solid #222; margin:8px 0 10px; }
.gp-row{ display:flex; gap:24px; }
.gp-col{ flex:1; }
.gp-b{ font-weight:700; }
.gp-right{ text-align:right; }
.gp-flex{ display:flex; justify-content:space-between; margin-top:10px; }
.gp-grid{ width:100%; border-collapse:collapse; margin-top:2px; }
.gp-grid th,.gp-grid td{ border-top:1px solid #444; border-bottom:1px solid #444; padding:8px 10px; }
.gp-grid thead th{ background:#f6f6f6; font-weight:700; }
.gp-r{ text-align:right; }
.gp-note{ margin-top:10px; }
.gp-signs{ display:flex; justify-content:space-between; margin-top:40px; }

/* full-page watermark */
.gp-watermark{ position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; user-select:none; font-size:72px; font-weight:800; opacity:0.06; transform:rotate(-25deg); text-transform:uppercase; letter-spacing:2px; color:#000; }
</style>
