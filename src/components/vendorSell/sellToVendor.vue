<template>
  <v-card class="pa-6" elevation="6">
    <!-- Action Bar -->
    <v-col cols="12">
      <span style="font-size:20px;">Sell to vendor & invoice process</span> &nbsp; &nbsp;
      <v-btn variant="tonal" color="primary" @click="togglePreview">
        <v-icon start>mdi-eye</v-icon> Show
      </v-btn>
    </v-col>

    <v-row dense>
      <v-col style="display:flex; flex-direction:row;" cols="12" md="12">
        <div style="width:100%;">
          <v-sheet class="pa-4 rounded-lg" elevation="2">
            <!-- VendorSelect -->
            <v-row>
              <v-col cols="12" md="3">
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
                  @change="fetchVendors"
                  hide-details
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  :items="cmcs_categories"
                  item-text="label"
                  item-value="value"
                  label="Category"
                  v-model="cmcs_categoryLocal"
                  dense
                  outlined
                  clearable
                  hide-details
                  @change="cmcs_onCategoryChange"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-if="cmcs_modelsForCategory.length"
                  :items="cmcs_modelsForCategory"
                  item-text="label"
                  item-value="value"
                  label="Model"
                  v-model="cmcs_modelLocal"
                  dense
                  outlined
                  clearable
                  hide-details
                  @change="cmcs_onModelChange"
                />
              </v-col>
              <v-col cols="12" md="3">
                <v-select
                  v-if="cmcs_chassisForModel.length"
                  :items="cmcs_chassisForModel"
                  item-text="label"
                  item-value="value"
                  label="Select chassis / inventory"
                  v-model="selectedModelKey"
                  dense
                  outlined
                  clearable
                  hide-details
                  @change="onChassisSelected(selectedModelKey)"
                />
              </v-col>
            </v-row>

            <!-- ItemForm -->
            <div cols="12" md="6" class="mt-6">
              <div v-if="selectedModelLabel" class="mb-3">
                <div class="caption text--secondary">Selected item</div>
                <div class="font-weight-medium">{{ selectedModelLabel }}</div>
              </div>

              <v-form ref="itemFormRef" v-model="itemFormValid" lazy-validation>
                <v-row>
                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model.lazy.number="itemForm.price"
                      label="Price (per unit)"
                      type="number"
                      dense
                      outlined
                      hide-details
                      prepend-inner-icon="mdi-currency-inr"
                      @change="itemForm_onFieldChange"
                    />
                  </v-col>

                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model.lazy.number="itemForm.quantity"
                      label="Quantity"
                      type="number"
                      hide-details
                      dense
                      outlined
                      @change="itemForm_onFieldChange"
                    />
                  </v-col>

                  <!-- Discount removed from form (but still supported in model if you re-enable later) -->

                  <v-col cols="12" md="2">
                    <v-text-field
                      v-model.lazy="itemForm.hsn"
                      label="HSN"
                      type="text"
                      dense
                      outlined
                      @change="itemForm_onFieldChange"
                    />
                  </v-col>
                  <v-col cols="12" md="1">
                    <v-text-field
                      v-model.lazy.number="itemForm.cgst"
                      label="CGST (%)"
                      type="number"
                      dense
                      outlined
                      @change="itemForm_onFieldChange"
                    />
                  </v-col>
                  <v-col cols="12" md="1">
                    <v-text-field
                      v-model.lazy.number="itemForm.sgst"
                      label="SGST (%)"
                      type="number"
                      dense
                      outlined
                      @change="itemForm_onFieldChange"
                    />
                  </v-col>
                  <v-col cols="12" md="1">
                    <v-btn
                      color="primary"
                      elevation="3"
                      class="mr-2"
                      @click="itemForm_onAddOrUpdateClicked"
                      :disabled="!canAddItem || !itemFormValid"
                    >
                      <v-icon left>{{ isEditing ? 'mdi-check' : 'mdi-plus' }}</v-icon>
                      {{ isEditing ? 'Update item' : 'Add to invoice' }}
                    </v-btn>

                    <v-btn
                      v-if="isEditing"
                      variant="text"
                      color="secondary"
                      @click="cancelEdit()"
                    >
                      Cancel
                    </v-btn>
                  </v-col>
                </v-row>
              </v-form>
            </div>
          </v-sheet>
        </div>
      </v-col>

      <!-- INVOICE SUMMARY + TABLE: only show when there is at least one item -->
      <v-col cols="12" md="12" v-if="selectedItems.length">
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

          <!-- InvoiceTable -->
          <div
            class="fixed-table-container elevation-1"
            :class="{ scrollable: selectedItems.length > 5 }"
          >
            <v-simple-table dense>
              <thead>
                <tr>
                  <th class="w-sl">S.No</th>
                  <th class="text-left">Item</th>
                  <th class="text-left table-col-narrow">HSN</th>
                  <th class="text-left table-col-narrow">Price</th>
                  <th class="text-left table-col-narrow">Qty</th>
                  <th class="text-left table-col-narrow">CGST</th>
                  <th class="text-left table-col-narrow">SGST</th>
                  <th class="text-right">Total</th>
                  <th class="text-right">Actions</th>
                </tr>
              </thead>

              <!-- INLINE EDIT TABLE BODY -->
              <tbody>
                <template v-for="(it, idx) in selectedItems">
                  <!-- main row -->
                  <tr :key="it.id">
                    <td class="text-center">{{ idx + 1 }}</td>

                    <!-- Item label (read-only) -->
                    <td>
                      <div class="font-weight-medium">{{ it.label }}</div>
                    </td>

                    <!-- HSN -->
                    <td class="text-left table-col-narrow">
                      <template v-if="inlineEditIndex === idx">
                        <v-text-field
                          v-model="it.hsn"
                          dense
                          hide-details
                          class="table-col-narrow table-edit-field table-input-xs"
                          @change="onRowFieldChange(it)"
                        />
                      </template>
                      <template v-else>
                        {{ it.hsn }}
                      </template>
                    </td>

                    <!-- Price -->
                    <td class="text-left table-col-narrow">
                      <template v-if="inlineEditIndex === idx">
                        <v-text-field
                          v-model.number="it.price"
                          type="number"
                          dense
                          hide-details
                          class="table-col-narrow table-edit-field table-input-xs"
                          @change="onRowFieldChange(it)"
                        />
                      </template>
                      <template v-else>
                        {{ formatMoney(it.price) }}
                      </template>
                    </td>

                    <!-- Quantity -->
                    <td class="text-left table-col-narrow">
                      <template v-if="inlineEditIndex === idx">
                        <v-text-field
                          v-model.number="it.quantity"
                          type="number"
                          dense
                          hide-details
                          class="table-col-narrow table-edit-field table-input-xs"
                          @change="onRowFieldChange(it)"
                        />
                      </template>
                      <template v-else>
                        {{ it.quantity }}
                      </template>
                    </td>

                    <!-- CGST -->
                    <td class="text-left table-col-narrow">
                      <template v-if="inlineEditIndex === idx">
                        <v-text-field
                          v-model.number="it.cgst"
                          type="number"
                          dense
                          hide-details
                          class="table-col-narrow table-edit-field table-input-xs"
                          suffix="%"
                          @change="onRowFieldChange(it)"
                        />
                      </template>
                      <template v-else>
                        {{ it.cgst }}%
                      </template>
                    </td>

                    <!-- SGST -->
                    <td class="text-left table-col-narrow">
                      <template v-if="inlineEditIndex === idx">
                        <v-text-field
                          v-model.number="it.sgst"
                          type="number"
                          dense
                          hide-details
                          class="table-col-narrow table-edit-field table-input-xs"
                          suffix="%"
                          @change="onRowFieldChange(it)"
                        />
                      </template>
                      <template v-else>
                        {{ it.sgst }}%
                      </template>
                    </td>

                    <!-- Total (read-only) -->
                    <td class="text-left font-weight-medium">
                      ₹{{ formatMoney(it.totalWithTax) }}
                    </td>

                    <!-- Actions -->
                    <td class="text-right">
                      <template v-if="inlineEditIndex === idx">
                        <v-btn
                          small
                          color="primary"
                          class="mr-1"
                          @click.stop="saveInlineEdit(idx)"
                        >
                          <v-icon left small>mdi-content-save</v-icon>
                          Save
                        </v-btn>
                        <v-btn
                          small
                          text
                          color="secondary"
                          @click.stop="cancelInlineEdit"
                        >
                          <v-icon left small>mdi-cancel</v-icon>
                          Cancel
                        </v-btn>
                      </template>
                      <template v-else>
                        <v-btn
                          icon
                          small
                          color="primary"
                          class="mr-1"
                          @click.stop="startInlineEdit(idx)"
                        >
                          <v-icon small>mdi-pencil</v-icon>
                        </v-btn>
                        <v-btn
                          icon
                          small
                          color="red"
                          @click.stop="removeItemAndRestore(it)"
                        >
                          <v-icon small>mdi-delete</v-icon>
                        </v-btn>
                      </template>
                    </td>
                  </tr>

                  <!-- details row (unchanged) -->
                  <tr :key="`${it.id}-details`">
                    <td
                      colspan="9"
                      style="padding:6px 12px 12px 12px; background: #fafafa;"
                    >
                      <div
                        style="width:100%; display:flex; flex-direction:row; font-size:12px; color:rgba(0,0,0,0.6);"
                      >
                        <div style="margin-bottom:4px;">
                          Chassis: {{ it.chassisNumber || '—' }}
                        </div>
                        &nbsp;&nbsp;&nbsp;&nbsp;
                        <div style="margin-bottom:4px;">
                          Engine: {{ it.engineNumber || '—' }}
                        </div>
                        &nbsp;&nbsp;&nbsp;&nbsp;
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
              <div class="text--secondary">Tax breakdown</div>
              <div class="mt-2">CGST: ₹{{ formatMoney(totalCgst) }}</div>
              <div>SGST: ₹{{ formatMoney(totalSgst) }}</div>
            </v-col>

            <v-col cols="12" md="6" class="text-right">
              <div class="subtitle-2 text--secondary">Grand total</div>
              <div class="display-1 font-weight-bold">
                ₹{{ formatMoney(grandTotal) }}
              </div>
              <div class="text--secondary caption">
                (Inclusive of taxes)
              </div>
            </v-col>
          </v-row>

          <v-divider class="my-3" />
          <!-- SummaryPayment -->
          <div>
            <v-row class="mt-4" justify="end">
              <v-col cols="12" md="6" class="text-right">
                <v-btn text small @click="openClearConfirm">Clear</v-btn>
                <v-btn variant="tonal" color="primary" @click="togglePreview">
                  <v-icon start>mdi-eye</v-icon> Show
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-sheet>
      </v-col>
    </v-row>

    <!-- InvoicePreview (same structure as original so PDF/export stays correct) -->
    <v-dialog v-model="preview" max-width="1200" persistent>
      <v-card class="pa-0" style="overflow: hidden;">
        <br />
        <v-card-text class="invoice-root" ref="invoiceCard">
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
                <div class="small">
                  State : {{ buyer.stateName || '—' }}
                  &nbsp; Code : {{ buyer.stateCode || '—' }}
                </div>
              </div>
            </div>
            <div class="col">
              <div class="blk-head">SHIP TO - {{ consignee.name || '—' }}</div>
              <div class="blk-body">
                <div class="small">{{ formatAddressPlain(consignee.address) }} </div>
                <div class="small">GSTIN : {{ consignee.gstin || '—' }}</div>
                <div class="small">
                  State : {{ consignee.stateName || '—' }}
                  &nbsp; Code : {{ consignee.stateCode || '—' }}
                </div>
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
                  <div class="bold">{{ it.label }} - {{ it.color }}</div>
                  <div v-if="it.note" class="small text-dim">{{ it.note }}</div>
                </td>
                <td class="text-center">{{ it.hsn || '—' }}</td>
                <td class="text-center">{{ fmtQty(it.qty) }}</td>
                <td class="text-right">{{ money(it.rate) }}</td>
                <td class="text-right">{{ money(it.taxable) }}</td>
                <td style="white-space: nowrap; text-align: right;">
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span style="text-align: left;">{{ pct(it.cgstRate) }}</span>
                    <span style="text-align: right;">{{ money(it.cgstAmt) }}</span>
                  </div>
                </td>
                <td style="white-space: nowrap;">
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span style="text-align: left;">{{ pct(it.sgstRate) }}</span>
                    <span style="text-align: right;">{{ money(it.sgstAmt) }}</span>
                  </div>
                </td>
                <td class="text-right bold">{{ money(it.lineTotal) }}</td>
              </tr>
              <tr class="total-row">
                <td colspan="5" class="text-left bold">
                  AMOUNT (IN WORDS) :
                  <b>{{ amountInWords }} Rupees Only</b>
                </td>
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
                <h3 style="margin-left:200px; margin-top:10px;">for ANSARI AUTOMOBILES</h3>
                <br/>
                <h4 style="margin-left:200px; margin-top:10px; border-top:2px solid black; text-align:center;">
                  Authorised Signatory
                </h4>
              </div>
            </div>
          </div>

          <div class="declare">
            <div class="small">
              <h4>
                Declaration : *** We declare that this invoice shows the actual price of the goods
                described and that all particulars are true and correct. ***
              </h4>
            </div>
          </div>
        </v-card-text>

        <!-- Hidden Gate Pass -->
        <div
          ref="gatePassCard"
          style="padding:16px; background:#fff; color:#000; font-family: Arial, Helvetica, sans-serif; font-size:12px; display:none;"
        >
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <img style="height:40px; width:140px;" src="@/assets/newLogoTVS.png" />
              <div>
                <div style="font-weight:700; font-size:16px;">ANSARI AUTOMOBILES</div>
                <div style="font-size:11px;">BADI KAMHARIYA BY PASS ROAD, MAU</div>
                <div style="font-size:11px;">GSTIN/UIN - 09AJBPA4037B1ZY</div>
              </div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:700; font-size:18px; letter-spacing:.5px;">GATE PASS</div>
              <div style="font-size:11px;">Date: {{ meta.dated || '' }}</div>
              <div v-if="invoiceNumber" style="font-size:11px;">Ref: {{ invoiceNumber }}</div>
            </div>
          </div>

          <div style="margin:10px 0; padding:8px; border:1px solid #000; font-weight:700; background:#eee;">
            Selected Units
          </div>

          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="border:1px solid #000; padding:6px; background:#f2f2f2; text-align:center; width:44px;">
                  S.No
                </th>
                <th style="border:1px solid #000; padding:6px; background:#f2f2f2; text-align:left;">Category</th>
                <th style="border:1px solid #000; padding:6px; background:#f2f2f2; text-align:left;">Model No</th>
                <th style="border:1px solid #000; padding:6px; background:#f2f2f2; text-align:left;">Chassis No</th>
                <th style="border:1px solid #000; padding:6px; background:#f2f2f2; text-align:left;">Engine No</th>
                <th style="border:1px solid #000; padding:6px; background:#f2f2f2; text-align:left;">Color</th>
                <th style="border:1px solid #000; padding:6px; background:#f2f2f2; text-align:left;">Location</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(r, i) in gatePassRows" :key="r.key">
                <td style="border:1px solid #000; padding:6px; text-align:center;">{{ i + 1 }}</td>
                <td style="border:1px solid #000; padding:6px;">{{ r.category || '—' }}</td>
                <td style="border:1px solid #000; padding:6px;">{{ r.model || '—' }}</td>
                <td style="border:1px solid #000; padding:6px;">{{ r.chassis || '—' }}</td>
                <td style="border:1px solid #000; padding:6px;">{{ r.engine || '—' }}</td>
                <td style="border:1px solid #000; padding:6px;">{{ r.color || '—' }}</td>
                <td style="border:1px solid #000; padding:6px;">{{ r.warehouse || '—' }}</td>
              </tr>
            </tbody>
          </table>

          <div style="display:flex; justify-content:space-between; margin-top:24px;">
            <div>
              <div style="font-weight:700; margin-bottom:6px;">Issued By</div>
              <div style="height:40px; border-bottom:1px solid #000; width:220px;"></div>
            </div>
            <div>
              <div style="font-weight:700; margin-bottom:6px;">Received By</div>
              <div style="height:40px; border-bottom:1px solid #000; width:220px;"></div>
            </div>
          </div>
        </div>

        <v-card-actions class="pa-3" style="gap:8px; flex-wrap: wrap;">
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

          <v-btn
            variant="flat"
            color="secondary"
            :disabled="gatePassRows.length === 0"
            @click="downloadGatePass"
          >
            <v-icon start>mdi-download-box</v-icon> Download Gate Pass
          </v-btn>

          <v-divider vertical class="mx-1" />

          <v-btn variant="text" @click="downloadPdfFromPreview">
            <v-icon start>mdi-download</v-icon>Download
          </v-btn>
          <v-btn variant="text" @click="printPdf">
            <v-icon start>mdi-printer</v-icon>Print
          </v-btn>
          <v-spacer />
          <v-btn variant="text" @click="preview = false">Close</v-btn>
        </v-card-actions>

        <v-snackbar v-model="snack.show" :color="snack.color" timeout="2500">
          {{ snack.text }}
        </v-snackbar>
      </v-card>
    </v-dialog>

    <!-- Clear Confirmation Dialog -->
    <v-dialog v-model="clearDialog" max-width="480">
      <v-card class="pa-4">
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon class="mr-2" color="red">mdi-alert</v-icon>
          Confirm Clear
        </v-card-title>
        <v-card-text class="text-body-2">
          Are you sure you want to clear all the entries? <br />
          <strong>Once cleared, filled data will be lost.</strong>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn variant="text" @click="cancelClear">Cancel</v-btn>
          <v-btn color="red" variant="flat" @click="confirmClear">
            <v-icon start>mdi-trash-can</v-icon> Clear all
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script>
import axios from 'axios'
import html2pdf from 'html2pdf.js'

export default {
  name: 'SellToVendor',
  data () {
    return {
      // Vendors / inventories
      vendors: [],
      loadingVendors: false,
      availableModel: [], // inventory entries with __key
      inventoriesMap: {}, // __key -> inventory
      loadingModel: false,
      // CMCS (CategoryModelChassisSelect) locals
      cmcs_categoryLocal: null,
      cmcs_modelLocal: null,
      // Selection + item form
      selectedVendorKey: null,
      selectedModelKey: null,
      // CGST & SGST default 9%, but user can change
      itemForm: {
        price: 0,
        quantity: 1,
        discount: 0,
        cgst: 9,
        sgst: 9,
        hsn: ''
      },
      itemFormValid: true,

      // Editing state (form-based editing largely unused now)
      isEditing: false,
      editingBackup: null,
      _editTempAddedKey: null,
      revealPrice: false,

      // Invoice lines + payment
      selectedItems: [],
      amountPaid: 0,
      paymentType: null,
      paymentTypes: ['Cash', 'Card', 'UPI', 'Bank Transfer', 'Other'],
      // Invoice meta
      preview: false,
      invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
      invoiceDate: new Date().toLocaleDateString('en-GB'),
      // Preview/save status
      statusType: null,
      statusOptions: ['SOLD'],
      saving: false,
      snack: { show: false, text: '', color: 'success' },
      billFileLocation: '',
      creating: false,
      ledgering: false,
      // Clear dialog
      clearDialog: false,
      // Endpoints
      updateEndpoint: process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateInventoryItem',
      presignEndpoint: process.env.VUE_APP_AGENCY_BACKEND_URL + 'uploadImages',

      // Inline edit state for table
      inlineEditIndex: null,
      inlineEditBackup: null
    }
  },

  async created () {
    await Promise.all([this.fetchVendors(), this.fetchInventories()])

    const invoiceNumber = this.$route.query.invoiceNumber
    if (invoiceNumber) {
      await this.loadSellToVendorForEdit(invoiceNumber)
    }
  },

  computed: {
    /* ---------- SELL PAGE TOTALS ---------- */
    subtotal () {
      return this.selectedItems.reduce(
        (s, it) => s + (Number(it.price || 0) * Number(it.quantity || 0)),
        0
      )
    },
    totalDiscount () {
      return this.selectedItems.reduce(
        (s, it) => s + Number(it.discount || 0),
        0
      )
    },
    totalCgst () {
      return this.selectedItems.reduce(
        (s, it) => s + Number(it.cgstAmount || 0),
        0
      )
    },
    totalSgst () {
      return this.selectedItems.reduce(
        (s, it) => s + Number(it.sgstAmount || 0),
        0
      )
    },
    totalTax () {
      return this.totalCgst + this.totalSgst
    },
    grandTotal () {
      return this.selectedItems.reduce(
        (s, it) => s + Number(it.totalWithTax || 0),
        0
      )
    },

    selectedVendor () {
      return this.vendors.find(v => v.pk === this.selectedVendorKey) || null
    },

    dueAmount () {
      const due = Number(this.grandTotal) - Number(this.amountPaid || 0)
      return due > 0 ? Number(due.toFixed(2)) : 0
    },
    changeDue () {
      const change = Number(this.amountPaid || 0) - Number(this.grandTotal)
      return change > 0 ? Number(change.toFixed(2)) : 0
    },
    canAddItem () {
      return (
        Boolean(this.selectedModelKey) &&
        Number(this.itemForm.price) > 0 &&
        Number(this.itemForm.quantity) > 0
      )
    },

    /* ---------- CMCS computed ---------- */
    cmcs_categories () {
      const m = {}
      this.availableModel.forEach(it => {
        const cat = (it.categoryName || 'Uncategorized').trim()
        if (!m[cat]) m[cat] = true
      })
      return Object.keys(m)
        .sort()
        .map(k => ({ label: k, value: k }))
    },
    cmcs_modelsForCategory () {
      if (!this.cmcs_categoryLocal) return []
      const m = {}
      this.availableModel.forEach(it => {
        if ((it.categoryName || '').trim() !== this.cmcs_categoryLocal) return
        const model = (it.modelName || it.label || 'Unknown Model').trim()
        if (!m[model]) m[model] = true
      })
      return Object.keys(m)
        .sort()
        .map(k => ({ label: k, value: k }))
    },
    cmcs_chassisForModel () {
      if (!this.cmcs_categoryLocal || !this.cmcs_modelLocal) return []
      const rows = (this.availableModel || [])
        .filter(it => {
          const categoryMatch =
            (it.categoryName || '').trim() === this.cmcs_categoryLocal
          const modelMatch =
            (it.modelName || it.label || '').trim() === this.cmcs_modelLocal
          const statusMatch = (it.status || '').toUpperCase() === 'ACTIVE'
          return categoryMatch && modelMatch && statusMatch
        })
        .map(it => {
          const labelParts = []
          const chassis = it.chassisNumber || it.gsisk3 || it.sk || '—'
          if (chassis) labelParts.push(String(chassis))
          if (it.warehouse) labelParts.push(String(it.warehouse))
          if (it.color) labelParts.push(String(it.color))
          return { label: labelParts.join(' • '), value: it.__key }
        })

      const seen = new Set()
      const uniq = []
      for (const r of rows) {
        if (!seen.has(r.value)) {
          seen.add(r.value)
          uniq.push(r)
        }
      }
      return uniq
    },

    /* ---------- PREVIEW computed ---------- */
    company () {
      const v = this.selectedVendor || {}
      return {
        name: v.name || '',
        addressLine1: v.billing?.line1 || '',
        cityState: v.billing?.city
          ? `${v.billing.city}, ${v.billing.state}`
          : '',
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
        clientId: v.shipping?.clientId || v.clientId || '',
        name: v.shipping?.name || v.name || '',
        address: v.shipping?.line1
          ? `${v.shipping.line1}${
              v.shipping.line2 ? ', ' + v.shipping.line2 : ''
            }, ${v.shipping.city || ''}, ${v.shipping.state || ''} ${
              v.shipping.pincode || ''
            }`
          : v.billing?.line1 || '',
        phone: v.shipping?.phone || v.phone || '',
        gstin: v.gstin || '',
        stateName: v.shipping?.state || v.billing?.state || '',
        stateCode: v.shipping?.stateCode || v.billing?.stateCode || ''
      }
    },
    buyer () {
      return { ...this.consignee }
    },
    meta () {
      return { dated: this.invoiceDate || '', paymentTerms: this.paymentType || '' }
    },

    normalizedItems () {
      const round2 = v =>
        Number(
          (Math.round((v + Number.EPSILON) * 100) / 100).toFixed(2)
        )
      return (this.selectedItems || []).map((raw, idx) => {
        const qty = Number(raw.quantity ?? raw.qty ?? 1)
        const entered = Number(raw.price ?? raw.rate ?? 0)
        const gross = qty * entered
        const cgstRate = Number(raw.cgst ?? 0)
        const sgstRate = Number(raw.sgst ?? 0)
        const igstRate = Number(raw.igst ?? 0)
        const totalGstRate = cgstRate + sgstRate + igstRate
        const base = totalGstRate ? gross / (1 + totalGstRate / 100) : gross
        const cgstAmt = base * (cgstRate / 100)
        const sgstAmt = base * (sgstRate / 100)
        const igstAmt = base * (igstRate / 100)

        return {
          _key: raw.id ?? idx,
          color: raw.color,
          label: raw.label || raw.modelName || 'Item',
          note:
            raw.chassisNumber || raw.engineNumber
              ? `Chassis: ${
                  raw.chassisNumber || raw.chassis || '—'
                }  |  Engine: ${raw.engineNumber || '—'}`
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
          lineTotal: round2(gross),
          chassisNumber: raw.chassisNumber || raw.chassis || null
        }
      })
    },
    allChassisNumbers () {
      const s = new Set()
      for (const it of this.normalizedItems) {
        const ch = it.chassisNumber && String(it.chassisNumber).trim()
        if (ch) s.add(ch)
      }
      return Array.from(s)
    },
    sum () {
      return this.normalizedItems.reduce(
        (acc, it) => {
          acc.taxable += it.taxable
          acc.cgst += it.cgstAmt
          acc.sgst += it.sgstAmt
          acc.igst += it.igstAmt
          acc.cess += it.cessAmt
          acc.grand += it.lineTotal
          return acc
        },
        {
          taxable: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
          cess: 0,
          grand: 0
        }
      )
    },
    totalDiscountComputed () {
      const fromItems = this.normalizedItems.reduce(
        (s, it) => s + (it.discAmt || 0),
        0
      )
      return this.totalDiscount || fromItems
    },
    amountInWords () {
      return this.toCurrencyWords(this.sum.grand) || 'Zero'
    },
    canSave () {
      const hasBulk = this.allChassisNumbers.length > 0
      const hasFallback = false
      return !!this.statusType && (hasBulk || hasFallback)
    },

    gatePassRows () {
      return (this.selectedItems || [])
        .filter(r => r?.chassisNumber || r?.chassis)
        .map((raw, idx) => ({
          key: raw.id ?? `${raw.chassisNumber || raw.chassis}-${idx}`,
          category: raw.category || raw.type || raw.segment || '',
          model:
            raw.modelNumber ||
            raw.modelNo ||
            raw.modelName ||
            raw.label ||
            '',
          chassis: raw.chassisNumber || raw.chassis || '',
          engine: raw.engineNumber || raw.engine || '',
          color: raw.color || '',
          warehouse:
            raw.warehouse || raw.location || raw.locationName || ''
        }))
    },

    selectedModelLabel () {
      if (!this.selectedModelKey) return null
      const inv = this.inventoriesMap[this.selectedModelKey]
      return (
        (inv && (inv.modelName || inv.label || inv.model || inv.name)) ||
        null
      )
    }
  },

  watch: {
    selectedModelKey (newKey) {
      if (!newKey) return
      const inv = this.inventoriesMap[newKey] || null
      if (!inv) return
      this.itemForm.hsn = inv.hsn || this.itemForm.hsn || ''
      if (!this.isEditing) {
        this.itemForm.price = Number(0)
      }
    },
    '$route.query.invoiceNumber': {
      async handler (inv) {
        if (!inv) return
        if (
          !this.vendors.length ||
          !Object.keys(this.inventoriesMap).length
        ) {
          await Promise.all([this.fetchVendors(), this.fetchInventories()])
        }
        await this.loadSellToVendorForEdit(inv)
      }
    }
  },

  methods: {
    async loadSellToVendorForEdit (invoiceNumber) {
      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}getselltovendorbyinvoicenumber/${encodeURIComponent(
          invoiceNumber
        )}`
        const res = await fetch(url)
        const j = await res.json().catch(() => ({}))
        if (!res.ok || !j?.item) {
          throw new Error(j?.message || 'Invoice not found')
        }

        const r = j.item

        this.isEditing = false
        this.editingBackup = null
        this._editTempAddedKey = null

        this.invoiceNumber = r.invoiceNumber
        this.invoiceDate =
          (r.invoiceDate &&
            new Date(r.invoiceDate).toLocaleDateString('en-GB')) ||
          new Date().toLocaleDateString('en-GB')
        this.statusType = r.meta?.statusType || 'SOLD'
        this.selectedVendorKey = r.vendorKey || null

        this.amountPaid = Number(r.payment?.amountPaid || 0)
        this.paymentType = r.payment?.paymentType || null

        this.selectedItems = (r.items || []).map((it, idx) => {
          const row = {
            id: it.id || `edit-${idx}-${Date.now()}`,
            inventoryId: it.inventoryId || it.chassisNumber || `inv-${idx}`,
            label: it.label || it.modelName || 'Item',
            hsn: it.hsn || '',
            chassisNumber: it.chassisNumber || '',
            engineNumber: it.engineNumber || '',
            color: it.color || '',
            price: Number(it.price || 0),
            quantity: Number(it.quantity || 1),
            discount: Number(it.discount || 0),
            // default CGST/SGST to 9% if not provided; keep stored values if present
            cgst:
              it.cgst == null
                ? 9
                : Number(it.cgst),
            sgst:
              it.sgst == null
                ? 9
                : Number(it.sgst),
            taxable: Number(it.taxable || 0),
            cgstAmount: Number(it.cgstAmount || 0),
            sgstAmount: Number(it.sgstAmount || 0),
            totalWithTax: Number(it.totalWithTax || 0),
            kitGiven: !!it.kitGiven
          }
          this.computeRowTotals(row)
          return row
        })
      } catch (e) {
        this.showSnack(`Failed to load invoice: ${e.message}`, 'error')
      }
    },

    ensureInvoiceNumber () {
      const clientId =
        (this.buyer?.clientId && String(this.buyer.clientId).trim()) ||
        'UNKNOWN'
      const epochSec = Math.floor(Date.now() / 1000).toString()
      const last9 = epochSec.slice(-9)
      this.invoiceNumber = `INV${last9}${clientId}`
      return this.invoiceNumber
    },

    mapItemsForSellToVendor () {
      return (this.selectedItems || []).map(r => ({
        inventoryId: r.inventoryId,
        label: r.label,
        category: r.category || r.type || r.segment || '',
        modelName: r.modelName || r.modelNo || r.model || r.label || '',
        hsn: r.hsn || '',
        chassisNumber: r.chassisNumber || r.chassis || '',
        engineNumber: r.engineNumber || r.engine || '',
        color: r.color || '',

        quantity: Number(r.quantity || 0),
        price: Number(r.price || 0),
        discount: Number(r.discount || 0),
        cgst: Number(r.cgst || 0),
        sgst: Number(r.sgst || 0),

        taxable: Number(r.taxable || 0),
        cgstAmount: Number(r.cgstAmount || 0),
        sgstAmount: Number(r.sgstAmount || 0),
        totalWithTax: Number(r.totalWithTax || 0),
        kitGiven: !!r.kitGiven
      }))
    },

    async addSellToVendor () {
      const invoiceNumber = this.ensureInvoiceNumber()
      const payload = {
        invoiceNumber,
        clientId:
          (this.buyer?.clientId &&
            String(this.buyer.clientId).trim()) || 'UNKNOWN',
        vendorKey: this.selectedVendorKey || null,
        vendorName: this.company?.name || null,
        invoiceDate: new Date().toISOString(),

        payment: {
          amountPaid: Number(this.amountPaid || 0),
          paymentType: this.paymentType || null,
          dueAmount: Number(this.dueAmount || 0),
          changeDue: Number(this.changeDue || 0)
        },

        items: this.mapItemsForSellToVendor(),

        totals: {
          subtotal: Number(this.subtotal || 0),
          discount: Number(this.totalDiscount || 0),
          cgst: Number(this.totalCgst || 0),
          sgst: Number(this.totalSgst || 0),
          tax: Number(this.totalTax || 0),
          grandTotal: Number(this.grandTotal || 0)
        },

        meta: {
          statusType: this.statusType || null,
          soldType: 'VENDOR'
        },

        buyer: {
          name: this.buyer?.name || '',
          gstin: this.buyer?.gstin || '',
          stateName: this.buyer?.stateName || '',
          stateCode: this.buyer?.stateCode || '',
          address: this.formatAddressPlain(this.buyer?.address || ''),
          phone: this.buyer?.phone || ''
        },

        consignee: {
          name: this.consignee?.name || '',
          gstin: this.consignee?.gstin || '',
          stateName: this.consignee?.stateName || '',
          stateCode: this.consignee?.stateCode || '',
          address: this.formatAddressPlain(this.consignee?.address || ''),
          phone: this.consignee?.phone || ''
        }
      }

      const res = await fetch(
        process.env.VUE_APP_AGENCY_BACKEND_URL + 'addselltovendor',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      )
      const json = await res.json().catch(() => ({}))
      if (!res.ok || json?.ok === false) {
        throw new Error(json?.message || 'Sell-to-vendor save failed')
      }
      return true
    },

    /* -------- fetch -------- */
    async fetchVendors () {
      this.loadingVendors = true
      try {
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllClient'
        )
        this.vendors = (res.data?.items || []).map(v => ({ ...v }))
      } catch (e) {
        console.warn('Failed to fetch vendors', e)
      } finally {
        this.loadingVendors = false
      }
    },

    async fetchInventories () {
      this.loadingModel = true
      try {
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'getAllInventry'
        )
        const items = (res.data?.items || []).map(i => ({ ...i }))

        this.inventoriesMap = {}
        this.availableModel = items.map(it => {
          const key =
            (it.chassisNumber && String(it.chassisNumber).trim()) ||
            (it.gsisk3 && String(it.gsisk3).trim()) ||
            (it.sk && String(it.sk).trim()) ||
            `inv_${Math.random()
              .toString(36)
              .slice(2, 8)}`
          const copy = {
            ...it,
            __key: key,
            label: it.modelName || it.label || it.model || 'Item'
          }
          this.inventoriesMap[key] = copy
          return copy
        })
        this.availableModel.sort((a, b) =>
          (a.label || '').localeCompare(b.label || '')
        )
      } catch (e) {
        console.warn('Failed to fetch inventories', e)
      } finally {
        this.loadingModel = false
      }
    },

    /* -------- helpers -------- */
    formatMoney (v) {
      return Number(v || 0).toFixed(2)
    },
    onChassisSelected (chassisKey) {
      this.selectedModelKey = chassisKey
    },
    togglePreview () {
      this.preview = !this.preview
    },
    onAmountPaidChange () {
      if (this.amountPaid === '' || this.amountPaid == null) {
        this.amountPaid = 0
      }
      this.amountPaid = Number(this.amountPaid || 0)
    },

    /* -------- CMCS handlers -------- */
    cmcs_onCategoryChange () {
      this.cmcs_modelLocal = null
      this.selectedModelKey = null
    },
    cmcs_onModelChange () {
      this.selectedModelKey = null
    },

    /* -------- ItemForm handlers -------- */
    itemForm_onFieldChange () {
      clearTimeout(this._debounceTimer)
      this._debounceTimer = setTimeout(() => {}, 300)
    },

    itemForm_onAddOrUpdateClicked () {
      const price = Number(this.itemForm.price || 0)
      const qty = Number(this.itemForm.quantity || 0)
      if (!(price >= 0 && qty > 0)) {
        this.$refs.itemFormRef &&
          this.$refs.itemFormRef.validate &&
          this.$refs.itemFormRef.validate()
        return
      }
      if (!this.canAddItem) return

      // ADD logic; table handles editing
      const newItem = this.buildItemFromForm()
      if (!newItem) return
      this.computeRowTotals(newItem)
      const existing = this.selectedItems.find(
        i => i.inventoryId === newItem.inventoryId
      )
      if (existing) {
        existing.quantity = Number(existing.quantity || 0) + newItem.quantity
        existing.price = newItem.price
        existing.discount = newItem.discount
        existing.cgst = newItem.cgst
        existing.sgst = newItem.sgst
        existing.hsn = newItem.hsn
        existing.chassisNumber = newItem.chassisNumber
        existing.engineNumber = newItem.engineNumber
        existing.color = newItem.color
        this.computeRowTotals(existing)
      } else {
        this.selectedItems.push(newItem)
      }
      this.removeInventoryFromAvailable(newItem.inventoryId)
      this.clearFormAndEditing()
    },

    // Inline table edit handler
    onRowFieldChange (row) {
      this.computeRowTotals(row)
    },

    resolveSelectedInventory () {
      if (!this.selectedModelKey) return null
      return (
        this.inventoriesMap[this.selectedModelKey] ||
        this.availableModel.find(it => it.__key === this.selectedModelKey) ||
        null
      )
    },

    buildItemFromForm () {
      const inv = this.resolveSelectedInventory()
      if (!inv) return null

      const hsnVal =
        this.itemForm.hsn && String(this.itemForm.hsn).trim()
          ? String(this.itemForm.hsn).trim()
          : inv.hsn || ''

      const category =
        inv.categoryName || inv.category || inv.type || inv.segment || ''
      const warehouse =
        inv.warehouse ||
        inv.location ||
        inv.locationName ||
        inv.store ||
        ''

      return {
        id: `${inv.__key ?? this.selectedModelKey}-${Date.now()}`,
        inventoryId: inv.__key ?? this.selectedModelKey,

        label: inv.label || inv.modelName || inv.name || 'Item',
        hsn: hsnVal,
        unit: inv.unit || '',
        image: inv.image || '',

        chassisNumber:
          inv.chassisNumber ||
          inv.gsisk3 ||
          inv.chassisNo ||
          inv.chassis ||
          '',
        engineNumber:
          inv.engineNumber || inv.engineNo || inv.engine || '',
        color: inv.color || '',

        category,
        warehouse,

        price: Number(this.itemForm.price || 0),
        quantity: Number(this.itemForm.quantity || 1),
        discount: Number(this.itemForm.discount || 0),
        cgst:
          this.itemForm.cgst == null
            ? 9
            : Number(this.itemForm.cgst || 0),
        sgst:
          this.itemForm.sgst == null
            ? 9
            : Number(this.itemForm.sgst || 0),

        kitGiven: false
      }
    },

    computeRowTotals (row) {
      const price = Number(row.price || 0)
      const qty = Number(row.quantity || 0)
      const cgstRate = Number(row.cgst || 0)
      const sgstRate = Number(row.sgst || 0)
      const totalGstRate = cgstRate + sgstRate

      const lineTotal = price * qty
      const base =
        totalGstRate > 0
          ? lineTotal / (1 + totalGstRate / 100)
          : lineTotal
      const cgstAmt = base * (cgstRate / 100)
      const sgstAmt = base * (sgstRate / 100)
      const discount = Number(row.discount || 0)

      row.taxable = Number(base.toFixed(2))
      row.cgstAmount = Number(cgstAmt.toFixed(2))
      row.sgstAmount = Number(sgstAmt.toFixed(2))
      row.taxAmount = Number((cgstAmt + sgstAmt).toFixed(2))
      row.totalWithTax = Number((lineTotal - discount).toFixed(2))
      row.price = price
      row.quantity = qty
      row.discount = discount
      row.cgst = cgstRate
      row.sgst = sgstRate
    },

    ensureInventoryInAvailable (key) {
      if (!key) return
      if (
        !this.availableModel.some(a => a.__key === key) &&
        this.inventoriesMap[key]
      ) {
        const orig = this.inventoriesMap[key]
        this.availableModel.push({
          ...orig,
          __key: key,
          label:
            orig.label || orig.modelName || orig.name || 'Item'
        })
        this.availableModel.sort((a, b) =>
          (a.label || '').localeCompare(b.label || '')
        )
      }
    },

    removeInventoryFromAvailable (key) {
      if (!key) return
      this.availableModel = this.availableModel.filter(
        a => a.__key !== key
      )
    },

    cancelEdit (silent = false) {
      if (this._editTempAddedKey) {
        const stillUsed = this.selectedItems.some(
          r => r.inventoryId === this._editTempAddedKey
        )
        if (stillUsed) this.removeInventoryFromAvailable(this._editTempAddedKey)
      }
      this.clearFormAndEditing()
      if (!silent) this.showSnack('Edit cancelled.', 'warning')
    },

    clearFormAndEditing () {
      this.selectedModelKey = null
      this.itemForm = {
        price: 0,
        quantity: 1,
        discount: 0,
        cgst: 9,
        sgst: 9,
        hsn: ''
      }
      this.isEditing = false
      this.editingBackup = null
      this._editTempAddedKey = null
      this.revealPrice = false
    },

    // INLINE EDIT HELPERS
    startInlineEdit (index) {
      if (this.inlineEditIndex !== null && this.inlineEditIndex !== index) {
        this.cancelInlineEdit()
      }
      const row = this.selectedItems[index]
      if (!row) return
      this.inlineEditIndex = index
      this.inlineEditBackup = { ...row }
    },

    saveInlineEdit (index) {
      const row = this.selectedItems[index]
      if (!row) return

      this.onRowFieldChange(row)

      this.inlineEditIndex = null
      this.inlineEditBackup = null
      this.showSnack('Row updated successfully.', 'success')
    },

    cancelInlineEdit () {
      if (this.inlineEditIndex === null || !this.inlineEditBackup) {
        this.inlineEditIndex = null
        this.inlineEditBackup = null
        return
      }

      this.$set(this.selectedItems, this.inlineEditIndex, {
        ...this.inlineEditBackup
      })

      this.inlineEditIndex = null
      this.inlineEditBackup = null
    },

    removeItemAndRestore (it) {
      // adjust inline edit index if we delete the edited row
      const idx = this.selectedItems.findIndex(i => i.id === it.id)
      if (this.inlineEditIndex !== null && idx !== -1) {
        if (idx === this.inlineEditIndex) {
          this.inlineEditIndex = null
          this.inlineEditBackup = null
        } else if (idx < this.inlineEditIndex) {
          this.inlineEditIndex = this.inlineEditIndex - 1
        }
      }

      this.selectedItems = this.selectedItems.filter(
        i => i.id !== it.id
      )
      this.ensureInventoryInAvailable(it.inventoryId)
      if (!this.selectedItems.length) {
        this.amountPaid = 0
        this.paymentType = null
      }
      if (this.editingBackup && this.editingBackup.id === it.id) {
        this.clearFormAndEditing()
      }
    },

    // -------- Clear with confirm dialog ----------
    openClearConfirm () {
      this.clearDialog = true
    },
    cancelClear () {
      this.clearDialog = false
    },
    confirmClear () {
      this.clearDialog = false
      this.clearAll()
    },
    clearAll () {
      this.selectedItems.forEach(i => {
        if (this.inventoriesMap[i.inventoryId]) {
          this.ensureInventoryInAvailable(i.inventoryId)
        }
      })
      this.selectedItems = []
      this.amountPaid = 0
      this.paymentType = null
      this.clearFormAndEditing()
    },

    downloadPdf () {
      const el = this.$refs.invoiceCard
      if (!el) return
      try {
        const opt = {
          margin: [3, 10, 3, 10],
          filename: `${this.invoiceNumber}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2 },
          jsPDF: {
            unit: 'pt',
            format: 'a4',
            orientation: 'landscape'
          }
        }
        if (typeof html2pdf === 'undefined') return window.print()
        html2pdf()
          .set(opt)
          .from(el)
          .save()
      } catch (e) {
        console.warn('html2pdf failed', e)
        window.print()
      }
    },

    /* -------- PREVIEW methods -------- */
    fmtQty (q) {
      return Number(q).toFixed(Number(q) % 1 ? 2 : 0)
    },
    pct (n) {
      const v = Number(n || 0)
      return v ? `${v % 1 ? v.toFixed(2) : v}%` : ''
    },
    money (v) {
      return `₹${Number(v || 0).toFixed(2)}`
    },
    formatAddressPlain (a) {
      if (!a) return ''
      return String(a)
        .replace(/\s+/g, ' ')
        .replace(/\s*,\s*/g, ', ')
        .trim()
    },
    showSnack (text, color = 'success') {
      this.snack.text = text
      this.snack.color = color
      this.snack.show = true
    },

    async saveStatus () {
      if (!this.canSave) {
        this.showSnack('Select a status first.', 'error')
        return
      }

      const isEdit = !!(
        this.isEditing || this.$route?.query?.invoiceNumber
      )

      const payload = this.allChassisNumbers.length > 0
        ? {
            chassisNumbers: this.allChassisNumbers,
            item: { status: this.statusType, soldType: 'VENDOR' }
          }
        : { item: { status: this.statusType, soldType: 'VENDOR' } }

      this.saving = true
      try {
        const res = await fetch(this.updateEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data?.message || 'Update failed')

        if (Array.isArray(data?.results)) {
          const ok = data.results.filter(r => r.ok).length
          const fail = data.results.length - ok
          this.showSnack(
            `Status updated. Success: ${ok}${
              fail ? `, Failed: ${fail}` : ''
            }.`,
            fail ? 'warning' : 'success'
          )
        } else {
          this.showSnack('Status updated successfully.', 'success')
        }

        let upsertOk = false
        if (isEdit) {
          upsertOk = await this.updateSellToVendor()
          if (upsertOk) this.showSnack('Sell-to-vendor updated.', 'success')
        } else {
          upsertOk = await this.addSellToVendor()
          if (upsertOk) this.showSnack('Sell-to-vendor saved.', 'success')
        }

        const exported = await this.renderPdf('export')
        if (!exported || !exported.blob) {
          throw new Error('PDF export failed')
        }
        const uploadOk = await this.uploadPdfToS3(exported.blob)

        const invoiceOk = await this.saveInvoiceRecord()
        if (uploadOk) {
          this.showSnack('Invoice PDF uploaded to S3.', 'success')
        } else {
          this.showSnack(
            'Status saved, but PDF upload failed.',
            'warning'
          )
        }

        if (invoiceOk) {
          await this.createLedgerEntry()
        }
      } catch (e) {
        this.showSnack(`Failed: ${e.message}`, 'error')
      } finally {
        this.saving = false
      }
    },

    async updateSellToVendor () {
      const body = {
        invoiceNumber: this.invoiceNumber,
        vendorName: this.company?.name || null,
        meta: {
          statusType: this.statusType || null,
          soldType: 'VENDOR'
        },
        payment: {
          amountPaid: Number(this.amountPaid || 0),
          paymentType: this.paymentType || null,
          dueAmount: Number(this.dueAmount || 0),
          changeDue: Number(this.changeDue || 0)
        }
      }
      const res = await fetch(
        `${process.env.VUE_APP_AGENCY_BACKEND_URL}updateselltovendor`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        }
      )
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j?.message || 'Update failed')
      return true
    },

    async uploadPdfToS3 (pdfBlob) {
      try {
        const vendor = (this.company?.name || 'UnknownVendor').trim()
        const folder =
          vendor.replace(/[^\w\-./]/g, '_') || 'UnknownVendor'
        const cleanInvoice = (this.invoiceNumber
          ? String(this.invoiceNumber)
          : 'invoice'
        ).replace(/[^\w\-./]/g, '_')
        const objectKey = `${folder}/${cleanInvoice}.pdf`
        this.billFileLocation = objectKey

        const presignRes = await fetch(this.presignEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            body: {
              fileName: objectKey,
              fileType: 'application/pdf'
            }
          })
        })
        if (!presignRes.ok) return false
        const presignJson = await presignRes.json()
        const url = presignJson?.url
        if (!url) return false

        const putRes = await fetch(url, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/pdf' },
          body: pdfBlob
        })
        return putRes.ok
      } catch {
        return false
      }
    },

    async saveInvoiceRecord () {
      this.creating = true
      try {
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

        const res = await fetch(
          `${process.env.VUE_APP_AGENCY_BACKEND_URL}bill`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              invoice,
              pdf: { contentType: 'application/pdf' }
            })
          }
        )
        if (!res.ok) {
          const j = await res.json().catch(() => ({}))
          throw new Error(j?.message || 'Save invoice failed')
        }
        this.showSnack(
          'Invoice saved & PDF uploaded successfully.',
          'success'
        )
        return true
      } catch (e) {
        this.showSnack(`Save invoice failed: ${e.message}`, 'error')
        return false
      } finally {
        this.creating = false
      }
    },

    async createLedgerEntry () {
      this.ledgering = true
      try {
        const clientId =
          (this.buyer?.clientId &&
            String(this.buyer.clientId).trim()) || 'UNKNOWN'

        const payload = {
          clientId,
          clientName: this.buyer?.name || null,
          amount: Number(this.sum.grand || 0),
          entryType: 'DEBIT',
          narration: `Invoice ${this.invoiceNumber} - ${this.company.name}`,
          date: new Date().toISOString(),
          sourceType: 'INVOICE',
          sourceId: this.invoiceNumber || `INV-${Date.now()}`,
          status: this.statusType,
          link: this.billFileLocation || null,
          extra: { paymentType: this.paymentType }
        }

        this.showSnack('Ledger entry created.', 'success')
        return true
      } catch (e) {
        this.showSnack(`Ledger entry error: ${e.message}`, 'warning')
        return false
      } finally {
        this.ledgering = false
      }
    },

    async renderPdf (action = 'save') {
      const node = this.$refs.invoiceCard
      if (!node || typeof html2pdf === 'undefined') return null

      const filename = `${this.invoiceNumber || 'invoice'}.pdf`
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
        jsPDF: {
          unit: 'pt',
          format: 'a4',
          orientation: 'landscape'
        },
        pagebreak: { mode: ['css', 'legacy'] }
      }

      const worker = html2pdf()
        .set(opt)
        .from(node)
        .toPdf()
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
        pdf.text(
          'Ansari Automobile',
          pageWidth,
          pageHeight / 2,
          { align: 'left', angle: 10 }
        )
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
        return { blob, filename }
      }
      return null
    },
    downloadPdfFromPreview () {
      return this.renderPdf('save')
    },
    printPdf () {
      return this.renderPdf('print')
    },

    async downloadGatePass () {
      const node = this.$refs.gatePassCard
      if (!node || typeof html2pdf === 'undefined') return
      const prev = node.style.display
      node.style.display = 'block'

      const filename = `GatePass_${
        this.invoiceNumber ||
        new Date().toISOString().slice(0, 10)
      }.pdf`
      const opt = {
        margin: [10, 12, 10, 12],
        filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: '#ffffff',
          windowWidth: node.scrollWidth
        },
        jsPDF: {
          unit: 'pt',
          format: 'a4',
          orientation: 'landscape'
        },
        pagebreak: { mode: ['css', 'legacy'] }
      }

      const worker = html2pdf()
        .set(opt)
        .from(node)
        .toPdf()
      const pdf = await worker.get('pdf')
      const totalPages = pdf.internal.getNumberOfPages()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.saveGraphicsState()
        pdf.setGState(new pdf.GState({ opacity: 0.06 }))
        pdf.setTextColor(150, 150, 150)
        pdf.setFontSize(60)
        pdf.setFont('helvetica', 'bold')
        pdf.text(
          'Ansari Automobile',
          pageWidth / 2,
          pageHeight / 2,
          { align: 'center', angle: 30 }
        )
        pdf.restoreGraphicsState()
      }

      pdf.save(filename)
      node.style.display = prev || 'none'
    },

    toCurrencyWords (amount) {
      const n = Math.round(Number(amount || 0))
      if (!n) return ''
      const a = [
        '',
        'One',
        'Two',
        'Three',
        'Four',
        'Five',
        'Six',
        'Seven',
        'Eight',
        'Nine',
        'Ten',
        'Eleven',
        'Twelve',
        'Thirteen',
        'Fourteen',
        'Fifteen',
        'Sixteen',
        'Seventeen',
        'Eighteen',
        'Nineteen'
      ]
      const b = [
        '',
        '',
        'Twenty',
        'Thirty',
        'Forty',
        'Fifty',
        'Sixty',
        'Seventy',
        'Eighty',
        'Ninety'
      ]
      const crore = Math.floor(n / 10000000)
      const lakh = Math.floor((n % 10000000) / 100000)
      const thousand = Math.floor((n % 100000) / 1000)
      const hundred = Math.floor((n % 1000) / 100)
      const rest = n % 100
      const two = x =>
        x < 20
          ? a[x]
          : b[Math.floor(x / 10)] + (x % 10 ? ' ' + a[x % 10] : '')
      const seg = (x, name) =>
        x
          ? (x < 100
              ? two(x)
              : a[Math.floor(x / 100)] +
                ' Hundred' +
                (x % 100 ? ' ' + two(x % 100) : '')) +
            ' ' +
            name +
            ' '
          : ''
      const head =
        (crore ? seg(crore, 'Crore') : '') +
        (lakh ? seg(lakh, 'Lakh') : '') +
        (thousand ? seg(thousand, 'Thousand') : '') +
        (hundred ? a[hundred] + ' Hundred ' : '')
      return (head + (rest ? two(rest) : '')).trim()
    }
  }
}
</script>

<style scoped>
.rounded-lg {
  border-radius: 12px;
}
.pa-4 {
  padding: 16px;
}
.display-1 {
  font-size: 28px;
}

/* Table container + scroll behaviour */
.fixed-table-container {
  max-height: none;
  overflow: visible;
  border-radius: 6px;
}
.fixed-table-container.scrollable {
  max-height: 420px;
  overflow: auto;
}
.fixed-table-container table {
  width: 100%;
  border-collapse: collapse;
}
.fixed-table-container thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background: white;
  backdrop-filter: blur(2px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
  padding-top: 12px;
  padding-bottom: 12px;
}
.caption {
  font-size: 12px;
}

/* Subtle glass sheets and cleaner headings */
.v-sheet.rounded-lg {
  background: linear-gradient(
    180deg,
    rgba(255, 255, 255, 0.92),
    rgba(255, 255, 255, 0.98)
  );
  backdrop-filter: blur(3px);
}

/* Inputs spacing + sharper labels */
.v-input,
.v-select,
.v-text-field {
  margin-bottom: 8px;
}

/* Section titles */
.subtitle-1.font-weight-medium {
  letter-spacing: 0.2px;
}

/* Table: zebra rows + tighter cells + taller header (40px) */
.fixed-table-container tbody tr:nth-child(4n + 1) {
  background: #fcfcfc;
}
.fixed-table-container thead th {
  height: 40px;
  line-height: 40px;
  font-weight: 600;
}
.fixed-table-container td,
.fixed-table-container th {
  padding: 10px 12px;
}

/* Reduce body cell padding to shrink row height */
.fixed-table-container tbody td {
  padding: 4px 8px;
}

/* Action buttons in table look crisp */
.fixed-table-container td .v-btn.v-btn--icon {
  opacity: 0.9;
}
.fixed-table-container td .v-btn.v-btn--icon:hover {
  transform: translateY(-1px);
}

/* Invoice summary numbers pop a bit */
.display-1 {
  font-size: 28px;
  letter-spacing: 0.3px;
}

/* Dialog polish */
.v-dialog .v-card-title {
  letter-spacing: 0.2px;
}

/* Narrow table columns (HSN, Price, Qty, CGST, SGST) */
.table-col-narrow {
  max-width: 110px;
  min-width: 100px;
}

/* Narrow + short inputs inside table cells */
.table-input-xs {
  max-width: 80px;
}

::v-deep .table-input-xs .v-input__control {
  min-height: 28px;
}
::v-deep .table-input-xs .v-input__slot {
  min-height: 28px;
  padding: 0 6px !important;
}
::v-deep .table-input-xs input {
  text-align: right;
  padding-right: 4px;
}

/* Remove border & make edit fields look like plain text */
::v-deep .table-edit-field .v-input__slot {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}
::v-deep .table-edit-field .v-input__control {
  min-height: 24px;
}

/* Hide number spinners in table edit fields */
.table-edit-field input[type='number']::-webkit-outer-spin-button,
.table-edit-field input[type='number']::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.table-edit-field input[type='number'] {
  -moz-appearance: textfield;
}

/* -------- Invoice / Preview styles (unchanged) -------- */
.top-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  width: 100%;
}
.top-header-left {
  width: 50%;
}
.top-header-right {
  width: 50%;
  text-align: right;
}
.invoice-root {
  color: #000;
  background: #fff;
  padding: 10px 12px 12px;
  font-family: Arial, Helvetica, sans-serif;
  font-size: 12px;
  line-height: 1.25;
}
.bold {
  font-weight: 700;
}
.small {
  font-size: 11px;
}
.text-dim {
  color: #333;
}
.text-right {
  text-align: right;
}
.text-center {
  text-align: center;
}
.mt8 {
  margin-top: 8px;
}
.top-strip {
  border: 1px solid #000;
  border-bottom: none;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px 0;
}
.top-strip .label {
  font-weight: 700;
  letter-spacing: 0.5px;
}
.header-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border: 1px solid #000;
  border-top: none;
  height: 20px;
  padding: 10px;
}
.header-row .cell {
  padding: 6px 8px;
  border-left: 1px solid #000;
}
.header-row .cell.left {
  border-left: none;
}
.header-row .row {
  display: flex;
  gap: 8px;
}
.header-row .cell-key {
  font-weight: 600;
  min-width: 95px;
}
.two-col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0;
  border-top: none;
  margin-top: 0;
  border-left: 1px solid #000;
  border-right: 1px solid #000;
  border-bottom: none;
}
.two-col .col {
  border-bottom: 1px solid #000;
  padding: 6px 8px;
}
.two-col .col + .col {
  border-left: 1px solid #000;
}
.blk-head {
  font-weight: 700;
  margin-bottom: 4px;
}
.bordered {
  border: 1px solid #000;
}
.items {
  width: 100%;
  border-collapse: collapse;
  margin-top: 6px;
}
.items th,
.items td {
  border: 1px solid #000;
  padding: 4px 5px;
  vertical-align: top;
}
.items thead th {
  background: #eee;
  font-weight: 700;
  text-align: center;
}
.items .w-sl {
  width: 44px;
}
.items .w-hsn {
  width: 90px;
}
.items .w-qty {
  width: 35px;
}
.items .w-rate {
  width: 80px;
}
.items .w-taxable {
  width: 95px;
}
.items .w-gst {
  width: 95px;
}
.items .w-total {
  width: 90px;
}
.items .total-row td {
  font-weight: 700;
}
.bottom-grid {
  width: 100%;
  display: flex;
  gap: 8px;
  margin-top: 6px;
  align-items: stretch;
}
.bottom-grid > .left,
.bottom-grid > .right {
  flex: 0 0 calc(50% - 4px);
  width: calc(50% - 4px);
  height: 90px;
  box-sizing: border-box;
  overflow: auto;
}
.pad {
  padding: 8px;
}
.row-line {
  display: flex;
  gap: 8px;
  align-items: center;
}
.row-line .dash {
  flex: 1;
  border-bottom: 1px solid #000;
  height: 1px;
}
.summary {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
  font-weight: 700;
}
.summary td {
  border-bottom: 1px solid #000;
  padding: 6px 8px;
}
.summary tr:last-child td {
  border-bottom: none;
}
.summary .grand td {
  background: #eee;
}
.declare {
  height: 30px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 6px;
}
.declare .right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-end;
}
.declare .sign {
  margin-top: 24px;
  border-top: 1px solid #000;
  padding-top: 6px;
}
.terms {
  margin-top: 6px;
  border: 1px solid #000;
  padding: 6px 8px;
}

/* Remove all borders (including bottom underline) for table edit fields */
::v-deep .table-edit-field .v-input__slot {
  border: none !important;
  box-shadow: none !important;
  background: transparent !important;
}

/* Kill Vuetify bottom border/underline */
::v-deep .table-edit-field .v-input__slot::before,
::v-deep .table-edit-field .v-input__slot::after {
  border-bottom: none !important;
}

/* Just in case the native input has its own border */
::v-deep .table-edit-field input {
  border: none !important;
  box-shadow: none !important;
}

</style>
