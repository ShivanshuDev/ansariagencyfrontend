<template>
  <v-card class="pa-6" style="margin:12px;" elevation="6">
    <!-- Header -->
    <v-row align="center" justify="space-between" class="mb-4">
      <v-col cols="12" md="6" class="d-flex align-center">
        <v-avatar size="48" class="mr-3"><v-img src="/assets/logo-placeholder.png" /></v-avatar>
        <div>
          <h2 class="mb-0">Create Invoice</h2>
          <div class="subtitle-2 text--secondary">Quick billing • GST-ready • Print & export</div>
        </div>
      </v-col>

      <v-col cols="12" md="6" class="text-right">
        <v-btn icon @click="togglePreview"><v-icon>{{ preview ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon></v-btn>
        <v-btn class="ml-2" color="primary" elevation="2" @click="printInvoice" :disabled="!selectedItems.length"><v-icon left>mdi-printer</v-icon> Print</v-btn>
        <v-btn class="ml-2" color="success" elevation="2" @click="saveInvoice" :disabled="!selectedItems.length"><v-icon left>mdi-content-save</v-icon> Save</v-btn>
      </v-col>
    </v-row>

    <v-row dense>
      <!-- Left column (form) -->
      <v-col cols="12" md="4">
        <v-sheet class="pa-4 rounded-lg" elevation="2">
          <v-row>
            <!-- Vendor select -->
            <v-col cols="12">
              <v-select
                :items="vendors"
                item-text="name"
                item-value="pk"
                label="Select vendor"
                v-model="selectedVendorKey"
                dense
                outlined
                clearable
                :loading="loadingVendors"
                @change="onVendorChange"
              />
            </v-col>

            <!-- Vendor card -->
            <v-col cols="12" v-if="selectedVendor" class="pt-0">
              <v-row no-gutters align="center">
                <v-col cols="9">
                  <div class="font-weight-medium">{{ selectedVendor.name }}</div>
                  <div class="text--secondary">{{ selectedVendor.billing?.line1 }}, {{ selectedVendor.billing?.city }}, {{ selectedVendor.billing?.state }}</div>
                </v-col>
                <v-col cols="3" class="text-right">
                  <v-chip small outlined>{{ selectedVendor.gstin || '—' }}</v-chip>
                </v-col>
              </v-row>
            </v-col>

            <!-- Inventory select -->
            <v-col cols="12" class="mt-3">
              <v-select
                :items="availableInventories"
                item-text="label"
                item-value="__key"
                label="Search / select inventory"
                v-model="selectedInventoryKey"
                dense
                outlined
                clearable
                :loading="loadingInventories"
              />
            </v-col>

            <!-- Item form -->
            <v-col cols="12" class="mt-3">
              <v-form ref="itemFormRef" v-model="itemFormValid" lazy-validation>
                <v-row>
                  <v-col cols="12" md="6">
                    <v-text-field v-model.number="itemForm.price" label="Price (per unit)" type="number" dense outlined prepend-inner-icon="mdi-currency-inr" />
                  </v-col>

                  <v-col cols="12" md="6">
                    <v-text-field v-model.number="itemForm.quantity" label="Quantity" type="number" dense outlined />
                  </v-col>

                  <v-col cols="12" md="6" class="mt-2">
                    <v-row>
                      <v-col cols="6">
                        <v-text-field v-model.number="itemForm.discount" label="Discount (₹)" type="number" dense outlined min="0" />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field v-model="itemForm.hsn" label="HSN" type="text" dense outlined />
                      </v-col>
                    </v-row>
                  </v-col>

                  <!-- Only CGST & SGST -->
                  <v-col cols="12" md="6" class="mt-2">
                    <v-row>
                      <v-col cols="6">
                        <v-text-field v-model.number="itemForm.cgst" label="CGST (%)" type="number" dense outlined />
                      </v-col>
                      <v-col cols="6">
                        <v-text-field v-model.number="itemForm.sgst" label="SGST (%)" type="number" dense outlined />
                      </v-col>
                    </v-row>
                  </v-col>

                  <!-- Kit checkbox -->
                  <v-col cols="12" class="mt-2">
                    <v-checkbox v-model="itemForm.kitGiven" label="Kit given" dense hide-details />
                  </v-col>

                  <v-col cols="12" class="text-right mt-3">
                    <v-btn color="primary" elevation="3" @click="onAddOrUpdate" :disabled="!canAddItem">
                      <v-icon left>{{ isEditing ? 'mdi-check' : 'mdi-plus' }}</v-icon>
                      {{ isEditing ? 'Update item' : 'Add to invoice' }}
                    </v-btn>

                    <v-btn v-if="isEditing" text class="ml-2" @click="cancelEdit">Cancel</v-btn>
                  </v-col>
                </v-row>
              </v-form>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>

      <!-- Right column (summary + payment) -->
      <v-col cols="12" md="8">
        <v-sheet class="pa-4 rounded-lg" elevation="2">
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

          <!-- scrollable table container with sticky header -->
          <div class="fixed-table-container elevation-1">
            <v-simple-table dense>
              <thead>
                <tr>
                  <th class="text-left">Item</th>
                  <th class="text-left">HSN</th>
                  <th class="text-center">Kit</th>
                  <th class="text-right">Qty</th>
                  <th class="text-right">Discount</th>
                  <th class="text-right">CGST</th>
                  <th class="text-right">SGST</th>
                  <th class="text-right">Total</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>

              <!-- <tbody>
                <tr v-for="it in selectedItems" :key="it.id">
                  <td>
                    <div>
                      <div class="font-weight-medium">{{ it.label }}</div>
                      <div class="text--secondary caption" style="margin-top:4px;">
                        <div>Chassis: {{ it.chassisNumber || '—' }}</div>
                        <div>Engine: {{ it.engineNumber || '—' }}</div>
                        <div>Color: {{ it.color || '—' }}</div>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div class="text-left">{{ it.hsn || '—' }}</div>
                  </td>

                  <td class="text-center">{{ it.kitGiven ? 'Yes' : 'No' }}</td>

                  <td class="text-right">{{ it.quantity }} × ₹{{ formatMoney(it.price) }}</td>

                  <td class="text-right">{{ formatMoney(it.discount) }}</td>

                  <td class="text-right">{{ (it.cgst || 0) }}%</td>

                  <td class="text-right">{{ (it.sgst || 0) }}%</td>

                  <td class="text-right font-weight-medium">₹{{ formatMoney(it.totalWithTax) }}</td>

                  <td class="text-right">
                    <v-btn icon small color="primary" @click="editItem(it)"><v-icon small>mdi-pencil</v-icon></v-btn>
                    <v-btn icon small color="red" @click="removeItemAndRestore(it)"><v-icon small>mdi-delete</v-icon></v-btn>
                  </td>
                </tr>
              </tbody> -->
              <tbody>
  <template v-for="it in selectedItems">
    <!-- main row -->
    <tr :key="it.id">
      <td>
        <div>
          <div class="font-weight-medium">{{ it.label }}</div>
        </div>
      </td>

      <td>
        <div class="text-left">{{ it.hsn || '—' }}</div>
      </td>

      <td class="text-center">{{ it.kitGiven ? 'Yes' : 'No' }}</td>

      <td class="text-right">{{ it.quantity }} × ₹{{ formatMoney(it.price) }}</td>

      <td class="text-right">{{ formatMoney(it.discount) }}</td>

      <td class="text-right">{{ (it.cgst || 0) }}%</td>

      <td class="text-right">{{ (it.sgst || 0) }}%</td>

      <td class="text-right font-weight-medium">₹{{ formatMoney(it.totalWithTax) }}</td>

      <td class="text-right">
        <v-btn icon small color="primary" @click="editItem(it)"><v-icon small>mdi-pencil</v-icon></v-btn>
        <v-btn icon small color="red" @click="removeItemAndRestore(it)"><v-icon small>mdi-delete</v-icon></v-btn>
      </td>
    </tr>

    <!-- details full-width row -->
    <tr :key="`${it.id}-details`">
      <td colspan="9" style="padding:6px 12px 12px 12px; background: #fafafa;">
        <div style="width:100%; display:flex; flex-direction:row; font-size:12px; color:rgba(0,0,0,0.6);">
          <div style="margin-bottom:4px;">Chassis: {{ it.chassisNumber || '—' }}</div> &nbsp;&nbsp;&nbsp;&nbsp;
          <div style="margin-bottom:4px;">Engine: {{ it.engineNumber || '—' }}</div> &nbsp;&nbsp;&nbsp;&nbsp;
          <div>Color: {{ it.color || '—' }}</div>
        </div>
      </td>
    </tr>
  </template>
</tbody>

            </v-simple-table>
          </div>

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

          <!-- Payment section -->
          <v-divider class="my-3" />
          <v-row class="align-center">
            <v-col cols="12" md="4">
              <v-text-field
                v-model.number="amountPaid"
                label="Amount paid (₹)"
                type="number"
                min="0"
                dense
                outlined
                @input="onAmountPaidChange"
              />
            </v-col>

            <v-col cols="12" md="4">
              <v-select
                :items="paymentTypes"
                label="Payment type"
                v-model="paymentType"
                dense
                outlined
                clearable
              />
            </v-col>

            <v-col cols="12" md="4" class="text-right">
              <div>Due amount: <strong>₹{{ formatMoney(dueAmount) }}</strong></div>
              <div v-if="changeDue>0" class="text-success">Change: ₹{{ formatMoney(changeDue) }}</div>
            </v-col>
          </v-row>

          <v-row class="mt-4" justify="end">
            <v-col cols="12" md="6" class="text-right">
              <v-btn text small @click="clearAll">Clear</v-btn>
              <v-btn class="ml-2" color="secondary" @click="downloadPdf" :disabled="!selectedItems.length">Export PDF</v-btn>
            </v-col>
          </v-row>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- Invoice preview / print area -->
    <v-dialog v-model="preview" width="900">
      <v-card>
        <v-card-title>
          <span class="headline">Invoice preview</span>
          <v-spacer />
          <v-btn icon @click="preview=false"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>

        <v-card-text>
          <div id="print-area" class="pa-2">
            <div class="d-flex justify-space-between mb-4">
              <div style="width:100%;">
                <div style="display:flex; gap:8px; justify-content:space-between; align-items:center; border-bottom:1px solid #ddd; padding-bottom:8px;">
                  <div>
                    <h3 class="mb-1">{{ selectedVendor?.name || 'Vendor' }}</h3>
                    <div class="text--secondary">{{ selectedVendor?.billing?.line1 }}, {{ selectedVendor?.billing?.city }}, {{ selectedVendor?.billing?.state }}</div>
                    <div class="text--secondary">GSTIN: {{ selectedVendor?.gstin || '' }}</div>
                  </div>

                  <div style="text-align:right">
                    <h3 class="mb-1">Invoice</h3>
                    <div>No: {{ invoiceNumber }}</div>
                    <div>Date: {{ invoiceDate }}</div>
                  </div>
                </div>

                <div style="display:flex; justify-content:space-between; margin-top:12px;">
                  <div style="width:50%;">
                    <strong>Shipping from:</strong>
                    <div class="text--secondary">
                      ANSARI AUTOMOBILE, <br />
                      Badi Kamhariya, <br />
                      Near over bridge, Bypass road<br />
                      Mau, Uttar Pradesh, India
                    </div>
                  </div>

                  <div style="width:50%; text-align:right;">
                    <strong>Shipping to: {{ selectedVendor?.name }}</strong>
                    <div class="text--secondary">
                      {{ selectedVendor?.shipping?.name }}<br />
                      {{ selectedVendor?.shipping?.line1 }} {{ selectedVendor?.shipping?.line2 }}<br />
                      {{ selectedVendor?.shipping?.city }} - {{ selectedVendor?.shipping?.pincode }}, {{ selectedVendor?.shipping?.state }}<br />
                      {{ selectedVendor?.phone || selectedVendor?.altphone }}
                    </div>
                    <div class="text--secondary">GSTIN: {{ selectedVendor?.gstin || '' }}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- items table for preview/pdf -->
            <div style="height:500px; overflow:auto; width:100%; margin-top:12px;">
              <v-simple-table style="width:100%;">
                <thead>
                  <tr>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:left; padding:0 12px;">Item</th>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:left; padding:0 12px;">HSN</th>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:center; padding:0 12px;">Kit</th>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:right; padding:0 12px;">Qty</th>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:right; padding:0 12px;">Rate</th>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:right; padding:0 12px;">Discount</th>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:right; padding:0 12px;">CGST</th>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:right; padding:0 12px;">SGST</th>
                    <th style="height:50px; line-height:50px; font-size:16px; text-align:right; padding:0 12px;">Total</th>
                  </tr>
                </thead>

                <!-- <tbody>
                  <tr v-for="it in selectedItems" :key="it.id" style="height:50px; line-height:50px; font-size:14px;">
                    <td style="padding:0 12px;">
                      <div>{{ it.label }}</div>
                      <div class="text--secondary caption" style="margin-top:4px;">
                        Chassis: {{ it.chassisNumber || '—' }} | Engine: {{ it.engineNumber || '—' }} | Color: {{ it.color || '—' }}
                      </div>
                    </td>
                    <td style="padding:0 12px;">{{ it.hsn }}</td>
                    <td style="padding:0 12px; text-align:center;">{{ it.kitGiven ? 'Yes' : 'No' }}</td>
                    <td style="padding:0 12px; text-align:right;">{{ it.quantity }}</td>
                    <td style="padding:0 12px; text-align:right;">₹{{ formatMoney(it.price) }}</td>
                    <td style="padding:0 12px; text-align:right;">₹{{ formatMoney(it.discount) }}</td>
                    <td style="padding:0 12px; text-align:right;">{{ it.cgst }}% + {{ it.sgst }}%</td>
                    <td style="padding:0 12px; text-align:right;">₹{{ formatMoney(it.totalWithTax) }}</td>
                  </tr>
                </tbody> -->
                <tbody>
  <template v-for="it in selectedItems">
    <!-- main row (keeps your inline styles) -->
    <tr :key="it.id" style="height:50px; line-height:50px; font-size:14px;">
      <td style="padding:0 12px;">
        <div>{{ it.label }}</div>
      </td>
      <td style="padding:0 12px;">{{ it.hsn }}</td>
      <td style="padding:0 12px; text-align:center;">{{ it.kitGiven ? 'Yes' : 'No' }}</td>
      <td style="padding:0 12px; text-align:right;">{{ it.quantity }}</td>
      <td style="padding:0 12px; text-align:right;">₹{{ formatMoney(it.price) }}</td>
      <td style="padding:0 12px; text-align:right;">₹{{ formatMoney(it.discount) }}</td>
      <td style="padding:0 12px; text-align:right;">{{ it.cgst }}%</td>
      <td style="padding:0 12px; text-align:right;">{{ it.sgst }}%</td>
      <td style="padding:0 12px; text-align:right;">₹{{ formatMoney(it.totalWithTax) }}</td>
    </tr>

    <!-- details full-width row -->
    <tr :key="`${it.id}-details`">
      <td colspan="9" style="padding:6px 12px 12px 12px; background:#fafafa;">
        <div style="width:100%; display:flex; font-size:13px; color:rgba(0,0,0,0.65);">
          <div style="margin-bottom:4px;">Chassis: {{ it.chassisNumber || '—' }}</div> &nbsp;&nbsp;&nbsp;&nbsp;
          <div style="margin-bottom:4px;">Engine: {{ it.engineNumber || '—' }}</div> &nbsp;&nbsp;&nbsp;&nbsp;
          <div>Color: {{ it.color || '—' }}</div>
        </div>
      </td>
    </tr>
  </template>
</tbody>

              </v-simple-table>
            </div>

            <div style="width:100%; display:flex; flex-direction:row; justify-content:space-between; margin-top:12px;">
              <div style="width:50%;">
                <div>Subtotal: ₹{{ formatMoney(subtotal) }}</div>
                <div>Discount: ₹{{ formatMoney(totalDiscount) }}</div>
                <div>Tax: ₹{{ formatMoney(totalTax) }}</div>
                <div>Payment Type: {{ paymentType || '—' }}</div>
              </div>
              <div style="text-align:right;">
                <div class="font-weight-bold">Grand Total: ₹{{ formatMoney(grandTotal) }}</div>
                <div>Amount Paid: ₹{{ formatMoney(amountPaid) }}</div>
                <div>Due: ₹{{ formatMoney(dueAmount) }}</div>
                <div v-if="changeDue > 0" class="text-success">Change: ₹{{ formatMoney(changeDue) }}</div>
              </div>
            </div>

          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="printInvoice">Print</v-btn>
          <v-btn text @click="preview=false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import axios from 'axios'

export default {
  name: 'InvoiceItemSelector',
  data() {
    return {
      vendors: [],
      availableInventories: [],
      inventoriesMap: {},                // key -> original inventory object
      inventoryKeyField: 'id',
      selectedVendorKey: null,
      selectedInventoryKey: null,

      // item form (hsn and kitGiven included)
      itemForm: { price: 0, quantity: 1, discount: 0, cgst: 0, sgst: 0, hsn: '', kitGiven: false },
      itemFormValid: true,

      // selected items on invoice
      selectedItems: [],

      // editing support
      isEditing: false,
      editingBackup: null,               // holds the original item while editing (so cancel restores it)

      // payments
      amountPaid: 0,
      paymentType: null,
      paymentTypes: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'],

      // ui
      preview: false,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000+1000)}`,
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      loadingVendors: false,
      loadingInventories: false
    }
  },

  computed: {
    selectedVendor() {
      return this.vendors.find(v => v.pk === this.selectedVendorKey) || null
    },

    subtotal() {
      // sum of price * qty (without taxes and discounts)
      return this.selectedItems.reduce((s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)), 0)
    },

    totalDiscount() {
      return this.selectedItems.reduce((s, it) => s + Number(it.discount || 0), 0)
    },

    totalCgst() {
      return this.selectedItems.reduce((s, it) => {
        const taxable = Number(it.price || 0) * Number(it.quantity || 0)
        return s + (taxable * (Number(it.cgst || 0) / 100))
      }, 0)
    },

    totalSgst() {
      return this.selectedItems.reduce((s, it) => {
        const taxable = Number(it.price || 0) * Number(it.quantity || 0)
        return s + (taxable * (Number(it.sgst || 0) / 100))
      }, 0)
    },

    totalTax() {
      return this.totalCgst + this.totalSgst
    },

    grandTotal() {
      // We store row.totalWithTax precomputed on every item; sum it
      return this.selectedItems.reduce((s, it) => s + Number(it.totalWithTax || 0), 0)
    },

    dueAmount() {
      const due = Number(this.grandTotal) - Number(this.amountPaid || 0)
      return due > 0 ? Number(due.toFixed(2)) : 0
    },

    changeDue() {
      const change = Number(this.amountPaid || 0) - Number(this.grandTotal)
      return change > 0 ? Number(change.toFixed(2)) : 0
    },

    canAddItem() {
      return Boolean(this.selectedInventoryKey) && Number(this.itemForm.price) > 0 && Number(this.itemForm.quantity) > 0
    }
  },

  created() {
    this.fetchVendors()
    this.fetchInventories()
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

    async fetchInventories() {
      this.loadingInventories = true
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInventry')
        const items = (res.data?.items || []).map(i => ({ ...i }))

        // detect id-like field on first item
        const first = items[0] || {}
        const possible = ['id', '_id', 'inventoryId', 'pk', 'sku', 'uid']
        const found = possible.find(k => first[k] !== undefined)
        this.inventoryKeyField = found || 'id'

        // build map and assign __key for selects
        this.inventoriesMap = {}
        this.availableInventories = items.map(it => {
          const key = it[this.inventoryKeyField] ?? it.id ?? it._id ?? it.pk ?? `g_${Math.random().toString(36).slice(2,8)}`
          this.inventoriesMap[key] = it
          return { ...it, __key: key, label: it.label || it.modelName || it.name || it.modelName || 'Item' }
        })

        // sort for convenience
        this.availableInventories.sort((a,b) => (a.label||'').localeCompare(b.label||''))
      } catch (e) {
        console.warn('Failed to fetch inventories', e)
      } finally {
        this.loadingInventories = false
      }
    },

    formatMoney(v) { return Number(v || 0).toFixed(2) },

    // ---------- helpers for inventory availability ----------
    ensureInventoryInAvailable(key) {
      if (!key) return
      if (!this.availableInventories.some(a => a.__key === key) && this.inventoriesMap[key]) {
        const orig = this.inventoriesMap[key]
        this.availableInventories.push({ ...orig, __key: key, label: orig.label || orig.modelName || orig.name || 'Item' })
        this.availableInventories.sort((a,b) => (a.label||'').localeCompare(b.label||''))
      }
    },

    removeInventoryFromAvailable(key) {
      if (!key) return
      this.availableInventories = this.availableInventories.filter(a => a.__key !== key)
    },

    // ---------- form & item computations ----------
    resolveSelectedInventory() {
      if (!this.selectedInventoryKey) return null
      return this.inventoriesMap[this.selectedInventoryKey] || this.availableInventories.find(it => it.__key === this.selectedInventoryKey) || null
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
      // store rounded values
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
      // ensure additional inventory details exist (may be undefined)
      row.chassisNumber = row.chassisNumber || row.chassisNo || row.chassis || ''
      row.engineNumber = row.engineNumber || row.engineNo || row.engine || ''
      row.color = row.color || ''
    },

    buildItemFromForm() {
      const inv = this.resolveSelectedInventory()
      if (!inv) return null
      const hsnVal = (this.itemForm.hsn && String(this.itemForm.hsn).trim()) ? String(this.itemForm.hsn).trim() : (inv.hsn || '')
      return {
        id: `${inv[this.inventoryKeyField] ?? this.selectedInventoryKey}-${Date.now()}`,
        inventoryId: inv[this.inventoryKeyField] ?? this.selectedInventoryKey,
        label: inv.label || inv.modelName || inv.name || inv.modelName || 'Item',
        hsn: hsnVal,
        unit: inv.unit || '',
        image: inv.image || '',
        // NEW: include chassis, engine, color from inventory object (if present)
        chassisNumber: inv.chassisNumber || inv.gsisk3 || inv.chassisNo || inv.chassis || '',
        engineNumber: inv.engineNumber || inv.engineNo || inv.engine || '',
        color: inv.color || '',
        price: Number(this.itemForm.price || 0),
        quantity: Number(this.itemForm.quantity || 1),
        discount: Number(this.itemForm.discount || 0),
        cgst: Number(this.itemForm.cgst || 0),
        sgst: Number(this.itemForm.sgst || 0),
        kitGiven: !!this.itemForm.kitGiven
      }
    },

    // unified handler for add or update (edit)
    onAddOrUpdate() {
      if (!this.canAddItem) return
      if (this.isEditing && this.editingBackup) {
        // Update existing (preserve ID)
        const inv = this.resolveSelectedInventory()
        if (!inv) return
        // create updated object preserving id; prefer inventory fields for chassis/engine/color
        const updated = {
          ...this.editingBackup,
          inventoryId: inv[this.inventoryKeyField] ?? this.selectedInventoryKey,
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
          kitGiven: !!this.itemForm.kitGiven
        }
        this.computeRowTotals(updated)

        // replace existing
        const idx = this.selectedItems.findIndex(i => i.id === this.editingBackup.id)
        if (idx >= 0) {
          this.$set(this.selectedItems, idx, updated)
        } else {
          this.selectedItems.push(updated)
        }

        // cleanup: remove inventory from available list (it was restored when editing started)
        this.removeInventoryFromAvailable(updated.inventoryId)
        this.clearFormAndEditing()
        return
      }

      // Add new item
      const newItem = this.buildItemFromForm()
      if (!newItem) return
      this.computeRowTotals(newItem)

      // If same inventory already exists (unlikely because we remove from available), merge quantities and prefer latest details
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
        this.computeRowTotals(existing)
      } else {
        this.selectedItems.push(newItem)
      }

      // remove inventory from available list
      this.removeInventoryFromAvailable(newItem.inventoryId)
      this.clearFormAndEditing()
    },

    // when edit clicked
    editItem(row) {
      // ensure inventory is visible in select (so user can re-select or update)
      this.ensureInventoryInAvailable(row.inventoryId)

      // remove the row from selectedItems and keep a backup to restore on cancel
      this.selectedItems = this.selectedItems.filter(i => i.id !== row.id)
      this.editingBackup = { ...row }

      // populate form with row data
      this.selectedInventoryKey = row.inventoryId
      this.itemForm.price = Number(row.price || 0)
      this.itemForm.quantity = Number(row.quantity || 1)
      this.itemForm.discount = Number(row.discount || 0)
      this.itemForm.cgst = Number(row.cgst || 0)
      this.itemForm.sgst = Number(row.sgst || 0)
      this.itemForm.hsn = row.hsn || ''
      this.itemForm.kitGiven = !!row.kitGiven

      this.isEditing = true
    },

    cancelEdit() {
      // if there is a backup, restore it to selectedItems
      if (this.editingBackup) {
        this.selectedItems.push({ ...this.editingBackup })
        // remove the inventory entry we added to availableInventories while editing (so inventory remains removed)
        this.removeInventoryFromAvailable(this.editingBackup.inventoryId)
      }
      this.clearFormAndEditing()
    },

    clearFormAndEditing() {
      this.selectedInventoryKey = null
      this.itemForm = { price: 0, quantity: 1, discount: 0, cgst: 0, sgst: 0, hsn: '', kitGiven: false }
      this.isEditing = false
      this.editingBackup = null
    },

    recomputeRow(it) {
      this.computeRowTotals(it)
    },

    removeItemAndRestore(it) {
      // remove item
      this.selectedItems = this.selectedItems.filter(i => i.id !== it.id)
      // restore inventory option
      this.ensureInventoryInAvailable(it.inventoryId)
      // reset payments if none left
      if (!this.selectedItems.length) {
        this.amountPaid = 0
        this.paymentType = null
      }
    },

    clearAll() {
      // restore available inventories for all selected items
      this.selectedItems.forEach(i => {
        if (this.inventoriesMap[i.inventoryId]) {
          this.ensureInventoryInAvailable(i.inventoryId)
        }
      })
      this.selectedItems = []
      // reset payments
      this.amountPaid = 0
      this.paymentType = null
      this.clearFormAndEditing()
    },

    togglePreview() {
      this.preview = !this.preview
    },

    onAmountPaidChange() {
      if (this.amountPaid === '' || this.amountPaid == null) this.amountPaid = 0
      this.amountPaid = Number(this.amountPaid || 0)
    },

    // ---------- printing / pdf ----------
    printInvoice() {
      const printArea = document.getElementById('print-area')
      if (!printArea) return window.print()
      const newWin = window.open('', '_blank', 'width=900,height=700')
      newWin.document.write('<html><head><title>Invoice</title>')
      newWin.document.write('<style>body{font-family:Arial;padding:20px;} table{width:100%;border-collapse:collapse;border-bottom:1px solid #ddd;} th,td{border-bottom:1px solid #ddd;padding:3px;text-align:left}</style>')
      newWin.document.write('</head><body>')
      newWin.document.write(printArea.innerHTML)
      newWin.document.write('</body></html>')
      newWin.document.close()
      newWin.print()
    },

    downloadPdf() {
      const el = document.getElementById('print-area')
      if (!el) { alert('Nothing to export'); return }
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
        items: this.selectedItems.map(it => ({
          inventoryId: it.inventoryId,
          label: it.label,
          hsn: it.hsn,
          chassisNumber: it.chassisNumber || '',
          engineNumber: it.engineNumber || '',
          color: it.color || '',
          price: it.price,
          quantity: it.quantity,
          discount: it.discount,
          cgst: it.cgst,
          sgst: it.sgst,
          kitGiven: !!it.kitGiven,
          taxable: it.taxable,
          taxAmount: it.taxAmount,
          totalWithTax: it.totalWithTax
        })),
        totals: {
          subtotal: this.subtotal,
          discountTotal: this.totalDiscount,
          tax: this.totalTax,
          grandTotal: this.grandTotal
        },
        payment: {
          amountPaid: Number(this.amountPaid || 0),
          dueAmount: Number(this.dueAmount || 0),
          change: Number(this.changeDue || 0),
          paymentType: this.paymentType || null
        }
      }
      console.log('Saving invoice:', JSON.stringify(payload, null, 2))
      this.$emit('save', payload)
      this.$vuetify.goTo && this.$vuetify.goTo(0)
      this.$toast && this.$toast.success && this.$toast.success('Invoice saved')
    }
  }
}
</script>

<style scoped>
.rounded-lg { border-radius: 12px }
.pa-4 { padding: 16px }
.display-1 { font-size: 28px }

/* scrollable invoice summary table */
.fixed-table-container {
  height: 420px;
  max-height: 420px;
  overflow: auto;
  border-radius: 6px;
}

/* Ensure table stretches */
.fixed-table-container table {
  width: 100%;
  border-collapse: collapse;
}

/* Sticky header */
.fixed-table-container thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  backdrop-filter: blur(2px);
  box-shadow: 0 2px 4px rgba(0,0,0,0.04);
  padding-top: 12px;
  padding-bottom: 12px;
}

/* Small caption style for details */
.caption { font-size: 12px; }
</style>
