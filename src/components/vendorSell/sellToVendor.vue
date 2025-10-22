<template>
  <v-card class="pa-6" style="margin:12px;" elevation="6">
    <v-col cols="12" md="6" class="text-right">
      <action-bar
        :preview="preview"
        :has-items="selectedItems.length > 0"
        @toggle-preview="togglePreview"
        @print="printInvoice"
        @save="saveInvoice"
      />
    </v-col>

    <v-row dense>
      <v-col cols="12" md="4">
        <v-sheet class="pa-4 rounded-lg" elevation="2">
          <vendor-select
            :vendors="vendors"
            :loading="loadingVendors"
            :selected-key.sync="selectedVendorKey"
            @fetch-vendors="fetchVendors"
          />
         
          <!-- NEW complex selector -->
          <category-model-chassis-select
            :inventories="availableModel"
            v-model="selectedModelKey"
            @chassis-selected="onChassisSelected"
          />
           <br />
          <br />
          <item-form
            :selected-model-key="selectedModelKey"
            :inventories-map="inventoriesMap"
            :inventory-key-field="inventoryKeyField"
            :is-editing="isEditing"
            :item-form.sync="itemForm"
            :can-add-item="canAddItem"
            @add-or-update="onAddOrUpdate"
            @cancel-edit="cancelEdit"
          />
        </v-sheet>
      </v-col>

      <!-- right column unchanged -->
      <v-col cols="12" md="8">
        <!-- ... invoice summary, table, summary payment ... (unchanged) -->
        <v-sheet class="pa-4 rounded-lg" elevation="2">
          <!-- same content as before: header, invoice-table, totals, payment -->
          <!-- InvoiceTable uses same props / events -->
          <div class="d-flex justify-space-between align-center mb-3">
            <div>
              <div class="subtitle-1 font-weight-medium">Invoice summary</div>
              <div class="text--secondary">{{ selectedItems.length }} item(s)</div>
            </div>
            <div>
              <div class="caption text--secondary">Subtotal</div>
              <div class="font-weight-bold display-1">₹{{ formatMoney(subtotal) }}</div>
            </div>
          </div>

          <invoice-table
            :items="selectedItems"
            @edit="editItem"
            @remove="removeItemAndRestore"
          />

          <v-divider class="my-3" />
          <v-row>
            <v-col cols="12" md="6">
              <div class="text--secondary">Tax & discount breakdown</div>
              <div class="mt-2">CGST: ₹{{ formatMoney(totalCgst) }}</div>
              <div>SGST: ₹{{ formatMoney(totalSgst) }}</div>
              <div>Discount: ₹{{ formatMoney(totalDiscount) }}</div>
            </v-col>

            <v-col cols="12" md="6" class="text-right">
              <div class="subtitle-2 text--secondary">Grand total</div>
              <div class="display-1 font-weight-bold">₹{{ formatMoney(grandTotal) }}</div>
              <div class="text--secondary caption">(Inclusive of taxes, less discounts)</div>
            </v-col>
          </v-row>

          <v-divider class="my-3" />
          <summary-payment
            :amount-paid.sync="amountPaid"
            :payment-type.sync="paymentType"
            :payment-types="paymentTypes"
            :due-amount="dueAmount"
            :change-due="changeDue"
            :has-items="selectedItems.length>0"
            @clear-all="clearAll"
            @download-pdf="downloadPdf"
          />
        </v-sheet>
      </v-col>
    </v-row>

    <invoice-preview
      :preview.sync="preview"
      :selected-vendor="selectedVendor"
      :items="selectedItems"
      :invoice-number="invoiceNumber"
      :invoice-date="invoiceDate"
      :subtotal="subtotal"
      :total-discount="totalDiscount"
      :total-cgst="totalCgst"
      :total-sgst="totalSgst"
      :total-tax="totalTax"
      :grand-total="grandTotal"
      :amount-paid="amountPaid"
      :payment-type="paymentType"
      :inventory-map="inventoriesMap"
    />


  </v-card>
</template>

<script>
import axios from 'axios'
import VendorSelect from './VendorSelect.vue'
import CategoryModelChassisSelect from './CategoryModelChassisSelect.vue'
import ItemForm from './ItemForm.vue'
import InvoiceTable from './InvoiceTable.vue'
import SummaryPayment from './SummaryPayment.vue'
import InvoicePreview from './InvoicePreview.vue'
import ActionBar from './ActionBar.vue'

export default {
  name: 'InvoiceWrapper',
  components: { VendorSelect, CategoryModelChassisSelect, ItemForm, InvoiceTable, SummaryPayment, InvoicePreview, ActionBar },

  data() {
    return {
      vendors: [],
      availableModel: [],      // now list of individual inventory entries with __key (chassis-level)
      inventoriesMap: {},      // maps __key -> inventory object (chassis-level)
      inventoryKeyField: 'chassisNumber',
      selectedVendorKey: null,
      selectedModelKey: null,  // now holds chassis-key (same name preserved)
      itemForm: { price: 0, quantity: 1, discount: 0, cgst: 0, sgst: 0, hsn: '', kitGiven: false },
      itemFormValid: true,
      selectedItems: [],
      isEditing: false,
      editingBackup: null,
      amountPaid: 0,
      paymentType: null,
      paymentTypes: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'],
      preview: false,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000+1000)}`,
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      loadingVendors: false,
      loadingModel: false,


      preview: false,
      selectedItems: [],
    }
  },

  computed: {
    subtotal() {
      return this.selectedItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0);
    },
    totalDiscount() {
      return this.selectedItems.reduce((s, it) => s + Number(it.discount || 0), 0);
    },
    totalCgst() {
      return this.selectedItems.reduce((s, it) => s + Number(it.cgstAmount || 0), 0);
    },
    totalSgst() {
      return this.selectedItems.reduce((s, it) => s + Number(it.sgstAmount || 0), 0);
    },
    totalTax() {
      return this.totalCgst + this.totalSgst;
    },
    grandTotal() {
      return this.selectedItems.reduce((s, it) => s + Number(it.totalWithTax || 0), 0);
    },
    selectedVendor() { return this.vendors.find(v => v.pk === this.selectedVendorKey) || null },
    dueAmount() {
      const due = Number(this.grandTotal) - Number(this.amountPaid || 0)
      return due > 0 ? Number(due.toFixed(2)) : 0
    },
    changeDue() {
      const change = Number(this.amountPaid || 0) - Number(this.grandTotal)
      return change > 0 ? Number(change.toFixed(2)) : 0
    },
    canAddItem() {
      return Boolean(this.selectedModelKey) && Number(this.itemForm.price) > 0 && Number(this.itemForm.quantity) > 0
    }
  },

  created() {
    this.fetchVendors()
    this.fetchInventories()
  },

  watch: {
    selectedModelKey(newKey) {
      if (!newKey) return
      const inv = this.inventoriesMap[newKey] || null
      if (!inv) return
      this.itemForm.hsn = (inv.hsn || this.itemForm.hsn || '')
      if (!this.itemForm.price || this.itemForm.price === 0) this.itemForm.price = Number(inv.price || 0)
      this.itemForm.kitGiven = !!this.itemForm.kitGiven
    }
  },

  methods: {
    // ---------- fetch ----------
    async fetchVendors() {
      this.loadingVendors = true
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllClient')
        this.vendors = (res.data?.items || []).map(v => ({ ...v }))
      } catch (e) {
        console.warn('Failed to fetch vendors', e)
      } finally {
        this.loadingVendors = false
      }
    },

    // async fetchInventories() {
    //   this.loadingModel = true;
    //   try {
    //     const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInventry');
    //     const allItems = res.data?.items || [];

    //     // ✅ Filter only items with status ACTIVE
    //     const activeItems = allItems.filter(it => it.status === 'ACTIVE');

    //     // ✅ Map the filtered list
    //     this.inventoriesMap = {};
    //     this.availableModel = activeItems.map(it => {
    //       const key =
    //         (it.chassisNumber && String(it.chassisNumber).trim()) ||
    //         (it.gsisk3 && String(it.gsisk3).trim()) ||
    //         (it.sk && String(it.sk).trim()) ||
    //         `inv_${Math.random().toString(36).slice(2, 8)}`;

    //       const copy = {
    //         ...it,
    //         __key: key,
    //         label: it.modelName || it.label || it.model || 'Item'
    //       };

    //       this.inventoriesMap[key] = copy;
    //       return copy;
    //     });

    //     // ✅ Sort by label for consistent UI
    //     this.availableModel.sort((a, b) => (a.label || '').localeCompare(b.label || ''));
    //   } catch (e) {
    //     console.warn('Failed to fetch inventories', e);
    //   } finally {
    //     this.loadingModel = false;
    //   }
    // },
    async fetchInventories() {
      this.loadingModel = true
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInventry')
        const items = (res.data?.items || []).map(i => ({ ...i }))

        // build map keyed by chassisNumber (or sk fallback)
        this.inventoriesMap = {}
        this.availableModel = items.map(it => {
          // prefer chassisNumber or gsisk3 or sk as unique key; fallback to a generated id
          const key = (it.chassisNumber && String(it.chassisNumber).trim()) ||
                      (it.gsisk3 && String(it.gsisk3).trim()) ||
                      (it.sk && String(it.sk).trim()) ||
                      (`inv_${Math.random().toString(36).slice(2,8)}`)
          // store __key for v-select usage and preserve original fields used in builds
          const copy = { ...it, __key: key, label: it.modelName || it.label || it.model || 'Item' }
          this.inventoriesMap[key] = copy
          return copy
        })

        // sort for convenience
        this.availableModel.sort((a,b) => (a.label||'').localeCompare(b.label||''))
      } catch (e) {
        console.warn('Failed to fetch inventories', e)
      } finally {
        this.loadingModel = false
      }
    },

    formatMoney(v) { return Number(v || 0).toFixed(2) },

    resolveSelectedInventory() {
      if (!this.selectedModelKey) return null
      return this.inventoriesMap[this.selectedModelKey] || this.availableModel.find(it => it.__key === this.selectedModelKey) || null
    },

    computeRowTotals(row) {
      const price = Number(row.price || 0)
      const qty = Number(row.quantity || 0)
      const discount = Number(row.discount || 0)
      const taxable = price * qty
      const cgstAmt = taxable * (Number(row.cgst || 0) / 100)
      const sgstAmt = taxable * (Number(row.sgst || 0) / 100)
      let total = taxable + cgstAmt + sgstAmt - discount
      if (total < 0) total = 0
      row.taxable = Number(taxable.toFixed(2))
      row.cgstAmount = Number(cgstAmt.toFixed(2))
      row.sgstAmount = Number(sgstAmt.toFixed(2))
      row.taxAmount = Number((cgstAmt + sgstAmt).toFixed(2))
      row.totalWithTax = Number(total.toFixed(2))
      row.price = Number(price)
      row.quantity = Number(qty)
      row.discount = Number(discount)
      row.cgst = Number(row.cgst || 0)
      row.sgst = Number(row.sgst || 0)
      row.hsn = row.hsn || ''
      row.kitGiven = !!row.kitGiven
      row.chassisNumber = row.chassisNumber || row.chassisNo || row.chassis || ''
      row.engineNumber = row.engineNumber || row.engineNo || row.engine || ''
      row.color = row.color || ''
    },
    formatMoney(v) { return Number(v || 0).toFixed(2) },

    resolveSelectedInventory() {
      if (!this.selectedModelKey) return null
      return this.inventoriesMap[this.selectedModelKey] || this.availableModel.find(it => it.__key === this.selectedModelKey) || null
    },

    computeRowTotals(row) {
      const price = Number(row.price || 0); // price is GST-inclusive per unit
      const qty = Number(row.quantity || 0);
      const cgstRate = Number(row.cgst || 0);
      const sgstRate = Number(row.sgst || 0);
      const totalGstRate = cgstRate + sgstRate;

      // GST-inclusive total per line
      const lineTotal = price * qty;

      // Reverse calculate base
      const base = totalGstRate > 0 ? lineTotal / (1 + totalGstRate / 100) : lineTotal;

      // GST breakdown
      const cgstAmt = base * (cgstRate / 100);
      const sgstAmt = base * (sgstRate / 100);

      // Discount logic if any
      const discount = Number(row.discount || 0);

      // Final assignment
      row.taxable = Number(base.toFixed(2));
      row.cgstAmount = Number(cgstAmt.toFixed(2));
      row.sgstAmount = Number(sgstAmt.toFixed(2));
      row.taxAmount = Number((cgstAmt + sgstAmt).toFixed(2));
      row.totalWithTax = Number((lineTotal - discount).toFixed(2)); // user total minus discount
      row.price = price;
      row.quantity = qty;
      row.discount = discount;
      row.cgst = cgstRate;
      row.sgst = sgstRate;
    },


    buildItemFromForm() {
      const inv = this.resolveSelectedInventory()
      if (!inv) return null
      const hsnVal = (this.itemForm.hsn && String(this.itemForm.hsn).trim()) ? String(this.itemForm.hsn).trim() : (inv.hsn || '')
      return {
        id: `${inv.__key ?? this.selectedModelKey}-${Date.now()}`,
        inventoryId: inv.__key ?? this.selectedModelKey,
        label: inv.label || inv.modelName || inv.name || 'Item',
        hsn: hsnVal,
        unit: inv.unit || '',
        image: inv.image || '',
        chassisNumber: inv.chassisNumber || inv.gsisk3 || inv.chassisNo || inv.chassis || '',
        engineNumber: inv.engineNumber || inv.engineNo || inv.engine || '',
        color: inv.color || '',
        price: Number(this.itemForm.price || 0),
        quantity: Number(this.itemForm.quantity || 1),
        discount: Number(this.itemForm.discount || 0),
        cgst: Number(this.itemForm.cgst || 0),
        sgst: Number(this.itemForm.sgst || 0),
        kitGiven: !!this.itemForm.kitGiven,
        // carry attached pdf name if any (and file object)
        attachedPdfName: this.itemForm.attachedPdfName || '',
        attachedPdfFile: this.itemForm.attachedPdfFile || null
      }
    },

    // unified handler for add or update (edit)
    onAddOrUpdate() {
      if (!this.canAddItem) return
      if (this.isEditing && this.editingBackup) {
        const inv = this.resolveSelectedInventory()
        if (!inv) return
        const updated = {
          ...this.editingBackup,
          inventoryId: inv.__key ?? this.selectedModelKey,
          label: inv.label || inv.modelName || inv.name || this.editingBackup.label,
          hsn: (this.itemForm.hsn && String(this.itemForm.hsn).trim()) ? String(this.itemForm.hsn).trim() : (inv.hsn || ''),
          chassisNumber: inv.chassisNumber || inv.gsisk3 || inv.chassisNo || inv.chassis || this.editingBackup.chassisNumber || '',
          engineNumber: inv.engineNumber || inv.engineNo || inv.engine || this.editingBackup.engineNumber || '',
          color: inv.color || this.editingBackup.color || '',
          price: Number(this.itemForm.price || 0),
          quantity: Number(this.itemForm.quantity || 1),
          discount: Number(this.itemForm.discount || 0),
          cgst: Number(this.itemForm.cgst || 0),
          sgst: Number(this.itemForm.sgst || 0),
          kitGiven: !!this.itemForm.kitGiven,
          attachedPdfName: this.itemForm.attachedPdfName || this.editingBackup.attachedPdfName || '',
          attachedPdfFile: this.itemForm.attachedPdfFile || this.editingBackup.attachedPdfFile || null
        }
        this.computeRowTotals(updated)
        const idx = this.selectedItems.findIndex(i => i.id === this.editingBackup.id)
        if (idx >= 0) this.$set(this.selectedItems, idx, updated)
        else this.selectedItems.push(updated)
        this.removeInventoryFromAvailable(updated.inventoryId)
        this.clearFormAndEditing()
        return
      }

      const newItem = this.buildItemFromForm()
      if (!newItem) return
      this.computeRowTotals(newItem)
      const existing = this.selectedItems.find(i => i.inventoryId === newItem.inventoryId)
      if (existing) {
        existing.quantity = Number(existing.quantity || 0) + newItem.quantity
        existing.price = newItem.price
        existing.discount = newItem.discount
        existing.cgst = newItem.cgst
        existing.sgst = newItem.sgst
        existing.hsn = newItem.hsn
        existing.kitGiven = newItem.kitGiven
        existing.chassisNumber = newItem.chassisNumber
        existing.engineNumber = newItem.engineNumber
        existing.color = newItem.color
        existing.attachedPdfName = newItem.attachedPdfName || existing.attachedPdfName
        existing.attachedPdfFile = newItem.attachedPdfFile || existing.attachedPdfFile
        this.computeRowTotals(existing)
      } else {
        this.selectedItems.push(newItem)
      }
      this.removeInventoryFromAvailable(newItem.inventoryId)
      this.clearFormAndEditing()
    },

    ensureInventoryInAvailable(key) {
      if (!key) return
      if (!this.availableModel.some(a => a.__key === key) && this.inventoriesMap[key]) {
        const orig = this.inventoriesMap[key]
        this.availableModel.push({ ...orig, __key: key, label: orig.label || orig.modelName || orig.name || 'Item' })
        this.availableModel.sort((a,b) => (a.label||'').localeCompare(b.label||''))
      }
    },

    removeInventoryFromAvailable(key) {
      if (!key) return
      this.availableModel = this.availableModel.filter(a => a.__key !== key)
    },

    // when edit clicked
    editItem(row) {
      this.ensureInventoryInAvailable(row.inventoryId)
      this.selectedItems = this.selectedItems.filter(i => i.id !== row.id)
      this.editingBackup = { ...row }
      this.selectedModelKey = row.inventoryId
      this.itemForm.price = Number(row.price || 0)
      this.itemForm.quantity = Number(row.quantity || 1)
      this.itemForm.discount = Number(row.discount || 0)
      this.itemForm.cgst = Number(row.cgst || 0)
      this.itemForm.sgst = Number(row.sgst || 0)
      this.itemForm.hsn = row.hsn || ''
      this.itemForm.kitGiven = !!row.kitGiven
      this.itemForm.attachedPdfName = row.attachedPdfName || ''
      this.itemForm.attachedPdfFile = row.attachedPdfFile || null
      this.isEditing = true
    },

    cancelEdit() {
      if (this.editingBackup) {
        this.selectedItems.push({ ...this.editingBackup })
        this.removeInventoryFromAvailable(this.editingBackup.inventoryId)
      }
      this.clearFormAndEditing()
    },

    clearFormAndEditing() {
      this.selectedModelKey = null
      this.itemForm = { price: 0, quantity: 1, discount: 0, cgst: 0, sgst: 0, hsn: '', kitGiven: false, attachedPdfName: '', attachedPdfFile: null }
      this.isEditing = false
      this.editingBackup = null
    },

    recomputeRow(it) { this.computeRowTotals(it) },

    removeItemAndRestore(it) {
      this.selectedItems = this.selectedItems.filter(i => i.id !== it.id)
      this.ensureInventoryInAvailable(it.inventoryId)
      if (!this.selectedItems.length) { this.amountPaid = 0; this.paymentType = null }
    },

    clearAll() {
      this.selectedItems.forEach(i => { if (this.inventoriesMap[i.inventoryId]) this.ensureInventoryInAvailable(i.inventoryId) })
      this.selectedItems = []
      this.amountPaid = 0
      this.paymentType = null
      this.clearFormAndEditing()
    },

    togglePreview() { this.preview = !this.preview },

    onAmountPaidChange() { if (this.amountPaid === '' || this.amountPaid == null) this.amountPaid = 0; this.amountPaid = Number(this.amountPaid || 0) },
    printInvoice() {
      const printArea = document.getElementById('print-area')
      if (!printArea) return window.print()
      const newWin = window.open('', '_blank', 'width=900,height=700')
      newWin.document.write('<html><head><title>Invoice</title>')
      newWin.document.write('<style>body{font-family:Arial;padding:20px;} table{width:100%;border-collapse:collapse;} th,td{border:1px solid #ddd;padding:6px}</style>')
      newWin.document.write('</head><body>')
      newWin.document.write(printArea.innerHTML)
      newWin.document.write('</body></html>')
      newWin.document.close()
      newWin.print()
    },

    downloadPdf() {
      const el = document.getElementById('print-area')
      if (!el) { this.$toast && this.$toast.error && this.$toast.error('Nothing to export'); return }
      try {
        const opt = { margin: 10, filename: `${this.invoiceNumber}.pdf`, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2 }, jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' } }
        if (typeof html2pdf === 'undefined') { this.printInvoice(); return }
        html2pdf().set(opt).from(el).save()
      } catch (e) {
        console.warn('html2pdf failed', e)
        this.printInvoice()
      }
    },
    saveInvoice() {
      const payload = {
        invoiceNumber: this.invoiceNumber,
        date: this.invoiceDate,
        vendor: this.selectedVendor,
        items: this.selectedItems,
        totals: {
          subtotal: this.subtotal,
          tax: this.totalTax,
          grandTotal: this.grandTotal
        }
      }
      this.$emit('save', payload)
      this.$toast && this.$toast.success && this.$toast.success('Invoice saved')
    },
    
    onChassisSelected(chassisKey) {
      this.selectedModelKey = chassisKey
    }
  }
}
</script>

<style scoped>
.rounded-lg { border-radius: 12px }
.pa-4 { padding: 16px }
.display-1 { font-size: 28px }
.fixed-table-container { height: 420px; max-height: 420px; overflow: auto; border-radius: 6px; }
.fixed-table-container table { width: 100%; border-collapse: collapse; }
.fixed-table-container thead th { position: sticky; top: 0; z-index: 10; background: white; backdrop-filter: blur(2px); box-shadow: 0 2px 4px rgba(0,0,0,0.04); padding-top: 12px; padding-bottom: 12px; }
.caption { font-size: 12px; }
</style>
