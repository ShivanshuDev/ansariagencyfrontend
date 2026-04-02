<template>
  <v-card style="margin:10px;" class="rounded-lg">
    <v-toolbar flat dense>
      <v-toolbar-title class="subtitle-1 font-weight-bold">
        Finance & RTO Details — Chassis No: {{ form.chassisNumber }}
      </v-toolbar-title>
      <v-spacer/>
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
    </v-toolbar>
    <v-divider/>

    <v-card-text style="height:740px; overflow-y:scroll;">
      <v-form ref="form" v-model="valid" lazy-validation>

        <!-- Existing form sections remain the same -->
        <!-- Search by Invoice -->
        <section class="section-wrap">
          <div class="section-head">Search by Invoice Number</div>
          <v-row dense align="center">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="search.invoiceNumber"
                label="Invoice Number"
                dense
                outlined
                hide-details="auto"
                clearable
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-btn block color="primary" :loading="searching" @click="fetchByInvoice">
                Search
              </v-btn>
            </v-col>
            <v-col cols="12" sm="3">
              <v-btn block text @click="clearSearch">Clear</v-btn>
            </v-col>
          </v-row>
          <div v-if="searchError" class="red--text mt-2">{{ searchError }}</div>
        </section>

        <!-- Error summary -->
        <v-alert v-if="errorSummary.length" type="error" dense outlined class="mb-2">
          <div><strong>Please fix the following:</strong></div>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li v-for="(e,i) in errorSummary" :key="i">{{ e }}</li>
          </ul>
        </v-alert>

        <!-- Sales Mode -->
        <section class="section-wrap">
          <div class="section-head">Choose Sales Mode</div>
          <v-radio-group v-model="form.salesMode" row>
            <v-radio label="Cash" value="CASH"></v-radio>
            <v-radio label="Finance" value="FINANCE"></v-radio>
          </v-radio-group>
        </section>

        <!-- Finance Details (hide when CASH) -->
        <section v-if="form.salesMode==='FINANCE'" class="section-wrap">
          <div class="section-head">Finance Details</div>
          <v-row dense>
            <!-- finance fields unchanged -->
            <v-col cols="12" sm="4">
              <v-select 
                v-model="form.finance.company" 
                :items="financeCompanies" 
                label="Select Finance Company" 
                dense outlined 
                hide-details="auto"
                :rules="form.salesMode==='FINANCE' ? [rReq] : []"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model="form.finance.financerName" 
                label="Financer Name" 
                dense outlined 
                hide-details="auto"
                :rules="form.salesMode==='FINANCE' ? [rReq] : []"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model.number="form.finance.downPayment" 
                :rules="[optMoney]" 
                type="number" 
                prefix="₹" 
                label="Down Payment" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model.number="form.finance.loanAmount" 
                :rules="[optMoney]" 
                type="number" 
                prefix="₹" 
                label="Loan Amount" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model.number="form.finance.disbursementAmount" 
                :rules="[optMoney]" 
                type="number" 
                prefix="₹" 
                label="Disbursement Amount" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model="form.finance.agreementNumber" 
                label="Agreement Number" 
                dense outlined 
                hide-details="auto"
                :rules="form.salesMode==='FINANCE' ? [rReq] : []"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model.number="form.finance.emi" 
                :rules="[optMoney]" 
                type="number" 
                prefix="₹" 
                label="EMI" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model.number="form.finance.tenureMonths" 
                :rules="[optInteger]" 
                type="number" 
                label="Tenure in Months" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </section>

        <!-- Registration -->
        <section class="section-wrap">
          <div class="section-head">Registration Information</div>
          <v-row dense>
            <!-- registration fields unchanged -->
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model="form.registration.number" 
                label="Registration Number" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-menu v-model="menus.rcApplied" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ on, attrs }">
                  <v-text-field 
                    v-model="form.registration.rcAppliedDate" 
                    v-bind="attrs" 
                    v-on="on" 
                    label="RC Applied Date" 
                    dense outlined 
                    hide-details="auto" 
                    readonly 
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker v-model="form.registration.rcAppliedDate" @input="menus.rcApplied=false"/>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="4">
              <v-menu v-model="menus.regPay" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ on, attrs }">
                  <v-text-field 
                    v-model="form.registration.paymentDate" 
                    v-bind="attrs" 
                    v-on="on" 
                    label="Registration Payment Date" 
                    dense outlined 
                    hide-details="auto" 
                    readonly 
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker v-model="form.registration.paymentDate" @input="menus.regPay=false"/>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="4">
              <v-menu v-model="menus.hsrpApplied" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ on, attrs }">
                  <v-text-field 
                    v-model="form.registration.hsrpAppliedDate" 
                    v-bind="attrs" 
                    v-on="on" 
                    label="HSRP Applied Date" 
                    dense outlined 
                    hide-details="auto" 
                    readonly 
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker v-model="form.registration.hsrpAppliedDate" @input="menus.hsrpApplied=false"/>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model="form.registration.hsrpCourier" 
                label="HSRP Receiving Date by courier" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-menu v-model="menus.rcPrint" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ on, attrs }">
                  <v-text-field 
                    v-model="form.registration.rcPrintDate" 
                    v-bind="attrs" 
                    v-on="on" 
                    label="RC Print Date" 
                    dense outlined 
                    hide-details="auto" 
                    readonly 
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker v-model="form.registration.rcPrintDate" @input="menus.rcPrint=false"/>
              </v-menu>
            </v-col>
          </v-row>
        </section>

        <!-- Insurance -->
        <section class="section-wrap">
          <div class="section-head">Insurance Details</div>
          <v-row dense>
            <!-- insurance fields unchanged -->
            <v-col cols="12" sm="3">
              <v-select 
                v-model="form.insurance.type" 
                :items="insuranceTypes" 
                label="Insurance Type" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field 
                v-model="form.insurance.company" 
                label="Insurance Company" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field 
                v-model="form.insurance.policyNo" 
                label="Policy No." 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-text-field 
                v-model="form.insurance.idv" 
                :rules="[optMoney]" 
                label="Insurance Declared Value" 
                prefix="₹" 
                type="number" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-menu v-model="menus.insFrom" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ on, attrs }">
                  <v-text-field 
                    v-model="form.insurance.validFrom" 
                    v-bind="attrs" 
                    v-on="on" 
                    label="Insurance From (DD-MM-YYYY)" 
                    dense outlined 
                    hide-details="auto" 
                    readonly 
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker v-model="form.insurance.validFrom" @input="menus.insFrom=false"/>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="3">
              <v-select 
                v-model="form.insurance.periodYears" 
                :items="[1,2,3,4,5]" 
                label="Insurance Period (in Years)" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="3">
              <v-menu v-model="menus.insUpto" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ on, attrs }">
                  <v-text-field 
                    v-model="form.insurance.validUpto" 
                    v-bind="attrs" 
                    v-on="on" 
                    label="Insurance UPTO (DD-MM-YYYY)" 
                    dense outlined 
                    hide-details="auto" 
                    readonly 
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker v-model="form.insurance.validUpto" @input="menus.insUpto=false"/>
              </v-menu>
            </v-col>
          </v-row>
        </section>

        <!-- Receiving -->
        <section class="section-wrap">
          <div class="section-head">Customer Receiving Detail</div>
          <v-row dense>
            <!-- receiving fields unchanged -->
            <v-col cols="12" sm="4">
              <v-text-field 
                v-model="form.receiving.receiverName" 
                label="Receiver Name" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model="form.receiving.mobile"
                :rules="[optPhone]"
                label="Mobile Number"
                inputmode="numeric"
                :maxlength="10"
                :counter="10"
                @keypress="onlyDigits"
                @input="restrictReceiverMobileInput"
                dense outlined 
                hide-details="auto"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-menu v-model="menus.numberPlateDate" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ on, attrs }">
                  <v-text-field 
                    v-model="form.receiving.numberPlateReceivingDate" 
                    v-bind="attrs" 
                    v-on="on" 
                    label="Number Plate Receiving Date" 
                    dense outlined 
                    hide-details="auto" 
                    readonly 
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker v-model="form.receiving.numberPlateReceivingDate" @input="menus.numberPlateDate=false"/>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="4">
              <v-menu v-model="menus.rcReceivingDate" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                <template #activator="{ on, attrs }">
                  <v-text-field 
                    v-model="form.receiving.rcReceivingDate" 
                    v-bind="attrs" 
                    v-on="on" 
                    label="RC Receiving Date" 
                    dense outlined 
                    hide-details="auto" 
                    readonly 
                    prepend-inner-icon="mdi-calendar"
                  />
                </template>
                <v-date-picker v-model="form.receiving.rcReceivingDate" @input="menus.rcReceivingDate=false"/>
              </v-menu>
            </v-col>
            <v-col cols="12" sm="8">
              <v-text-field 
                v-model="form.receiving.remarks" 
                label="Remarks" 
                dense outlined 
                hide-details="auto"
              />
            </v-col>
          </v-row>
        </section>

      </v-form>

      <!-- Search results -->
      <section v-if="invoices.length" class="section-wrap">
        <div class="section-head">Search Results (showing bike & customer)</div>
        <v-row>
          <v-col cols="12" v-for="(inv, idx) in invoices" :key="inv.billNumber + '-' + idx">
            <v-card outlined class="pa-3 mb-3">
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div><strong>Bill #:</strong> {{ inv.billNumber }}</div>
                  <div><strong>Invoice #:</strong> {{ inv.invoiceNumber || '-' }}</div>
                  <div><strong>Invoice Date:</strong> {{ inv.invoiceDate || inv.invoiceDateISO || '-' }}</div>
                </div>
                <div>
                  <v-chip small>{{ inv.salesMode || inv.salesModeLower }}</v-chip>
                  <v-chip small color="grey lighten-3" class="ml-2">{{ inv.status }}</v-chip>
                </div>
              </div>

              <v-divider class="my-2"/>

              <!-- Bike details -->
              <div><strong>Bike / Vehicle Details</strong></div>
              <v-row class="mt-2">
                <v-col cols="12" sm="4"><small class="text--secondary">Model</small><div>{{ inv.vehicle?.model || '-' }}</div></v-col>
                <v-col cols="12" sm="3"><small class="text--secondary">Category</small><div>{{ inv.vehicle?.category || '-' }}</div></v-col>
                <v-col cols="12" sm="3"><small class="text--secondary">Chassis</small><div>{{ inv.chassisNumber || inv.vehicle?.chassisNumber || '-' }}</div></v-col>
                <v-col cols="12" sm="2"><small class="text--secondary">Engine</small><div>{{ inv.vehicle?.engineNumber || '-' }}</div></v-col>
                <v-col cols="12" sm="3"><small class="text--secondary">Color</small><div>{{ inv.vehicle?.color || '-' }}</div></v-col>
                <v-col cols="12" sm="3"><small class="text--secondary">Unit Price</small><div>{{ inv.vehicle?.unitPriceExRtoIns !== undefined ? inv.vehicle.unitPriceExRtoIns : '-' }}</div></v-col>
              </v-row>

              <v-divider class="my-2"/>

              <!-- Customer details (without address) -->
              <div><strong>Customer (no address)</strong></div>
              <v-row class="mt-2">
                <v-col cols="12" sm="4"><small class="text--secondary">Name</small><div>{{ inv.customer?.name || '-' }}</div></v-col>
                <v-col cols="12" sm="4"><small class="text--secondary">Phone</small><div>{{ inv.customer?.phone || '-' }}</div></v-col>
                <v-col cols="12" sm="4"><small class="text--secondary">Email</small><div>{{ inv.customer?.email || '-' }}</div></v-col>
                <v-col cols="12" sm="4"><small class="text--secondary">Relation</small><div>{{ inv.customer?.relationType ? inv.customer.relationType + ' / ' + inv.customer.relationName : '-' }}</div></v-col>
              </v-row>

            </v-card>
          </v-col>
        </v-row>
      </section>

      <!-- If no invoices found message -->
      <section v-else-if="searchedOnce" class="section-wrap">
        <div class="section-head">Search Results</div>
        <div>No invoices found for that invoice number.</div>
      </section>

    </v-card-text>

    <!-- <v-card-actions style="display:flex; flex-direction:column; border-top:1px solid gray;">
      <div style="display:flex; flex-direction:row; justify-content:space-between; width:100%;">
        <v-btn 
          v-if="invoices.length > 0"
          style="width:200px;"
          @click="generatePDF" 
          color="secondary"
          :loading="generatingPDF"
          :disabled="submitting"
        >
          <v-icon left>mdi-file-pdf</v-icon>
          Download PDF
        </v-btn>
        <v-spacer />
        <v-btn 
          style="width:250px;"
          @click="onSubmit" 
          color="primary"
          :loading="submitting"
        >
          Update Finance Details
        </v-btn>
      </div>
    </v-card-actions> -->

<v-card-actions style="display:flex; flex-direction:column; border-top:1px solid gray;">
  <div style="display:flex; flex-direction:row; justify-content:space-between; width:100%;">
    <div>
      <v-btn 
        v-if="combinedData"
        style="width:200px; margin-right: 10px;"
        @click="generatePDF" 
        color="secondary"
        :loading="generatingPDF"
        :disabled="submitting"
      >
        <v-icon left>mdi-download</v-icon>
        Download PDF
      </v-btn>
      <v-btn 
        v-if="combinedData"
        style="width:200px; margin-right: 10px;"
        @click="previewPDF" 
        color="info"
        :loading="generatingPDF"
        :disabled="submitting"
        outlined
      >
        <v-icon left>mdi-eye</v-icon>
        Preview PDF
      </v-btn>
      
    </div>
    <v-spacer />
    <v-btn 
      style="width:250px;"
      @click="onSubmit" 
      color="primary"
      :loading="submitting"
    >
      Update Finance Details
    </v-btn>
  </div>
</v-card-actions>
    <v-snackbar v-model="snack.show" :color="snack.color" timeout="2600">{{ snack.text }}</v-snackbar>
  </v-card>
</template>
<script>
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Extend jsPDF with autoTable
jsPDF.autoTable = autoTable;

export default {
  name: 'FinanceSection',
  props: {
    chassisNumber: {
      type: String,
      required: true
    },
    initialData: {
      type: Object,
      default: () => ({})
    }
  },
  data () {
    return {
      valid: false,
      submitting: false,
      generatingPDF: false,
      searching: false,
      searchedOnce: false,
      searchError: '',
      invoices: [],
      menus: {
        rcApplied: false,
        regPay: false,
        hsrpApplied: false,
        rcPrint: false,
        insFrom: false,
        insUpto: false,
        numberPlateDate: false,
        rcReceivingDate: false
      },
      search: {
        invoiceNumber: ''
      },
      form: {
        chassisNumber: this.chassisNumber || '',
        salesMode: 'CASH',
        finance: {
          company: '',
          financerName: '',
          loanAmount: '',
          disbursementAmount: '',
          downPayment: '',
          emi: '',
          tenureMonths: '',
          agreementNumber: ''
        },
        registration: {
          number: '',
          rcAppliedDate: null,
          paymentDate: null,
          hsrpAppliedDate: null,
          hsrpCourier: '',
          rcPrintDate: null
        },
        insurance: {
          type: 'THIRD PARTY',
          company: '',
          policyNo: '',
          idv: '',
          validFrom: null,
          periodYears: '5',
          validUpto: null
        },
        receiving: {
          receiverName: '',
          mobile: '',
          numberPlateReceivingDate: null,
          rcReceivingDate: null,
          remarks: ''
        }
      },
      insuranceTypes: ['THIRD PARTY','ZERO DEP','BASIC'],
      financeCompanies: [
        'TVS CREDIT SERVICES LIMITED',
        'HDB FINANCIAL SERVICES LIMITED',
        'MUTHOOT CAPITAL FINANCE LIMITED',
        'BAJAJ FINANCE LIMITED',
        'L&T FINANCE LIMITED',
        'IDFC FIRST BANK',
        'HDFC FINANCE LIMITED',
        'SHRIRAM FINANCE',
        'PUNJAB NATIONAL BANK',
        'UNION BANK OF INDIA'
      ],
      snack: { show: false, text: '', color: 'success' },
      errorSummary: [],
      rReq: v => !!(v && String(v).trim()) || 'Required',
      optMoney: v => (v==='' || v===null || (!isNaN(Number(v)) && Number(v)>=0)) || 'Enter ≥ 0',
      optInteger: v => (v==='' || v===null || (/^\d+$/.test(String(v)))) || 'Enter integer',
      optPhone: v => (!v || /^\d{10}$/.test(String(v))) || '10-digit only'
    }
  },
  computed: {
    BASE () {
      return (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '');
    },
    combinedData() {
      if (this.invoices.length > 0) {
        const invoice = this.invoices[0];
        return {
          ...invoice,
          salesMode: this.form.salesMode,
          finance: this.form.finance,
          registration: this.form.registration,
          insurance: this.form.insurance,
          receiving: this.form.receiving
        };
      }
      
      if (this.initialData && Object.keys(this.initialData).length > 0) {
        return {
          ...this.initialData,
          salesMode: this.form.salesMode,
          finance: this.form.finance,
          registration: this.form.registration,
          insurance: this.form.insurance,
          receiving: this.form.receiving
        };
      }
      
      return null;
    }
  },
  watch: {
    initialData: {
      handler(newData) {
        if (newData && Object.keys(newData).length > 0) {
          this.loadInitialData(newData);
        }
      },
      immediate: true
    },
    chassisNumber: {
      handler(newChassis) {
        if (newChassis) {
          this.form.chassisNumber = newChassis;
        }
      },
      immediate: true
    }
  },
  methods: {
    loadInitialData(data) {
      if (data.salesMode) {
        this.form.salesMode = data.salesMode;
      }
      
      if (data.finance) {
        this.form.finance = { ...this.form.finance, ...data.finance };
      } else if (data.rawForm && data.rawForm.finance) {
        this.form.finance = { ...this.form.finance, ...data.rawForm.finance };
      }
      
      if (data.registration) {
        this.form.registration = { ...this.form.registration, ...data.registration };
      } else if (data.rawForm && data.rawForm.registration) {
        this.form.registration = { ...this.form.registration, ...data.rawForm.registration };
      }
      
      if (data.insurance) {
        this.form.insurance = { ...this.form.insurance, ...data.insurance };
      } else if (data.rawForm && data.rawForm.insurance) {
        this.form.insurance = { ...this.form.insurance, ...data.rawForm.insurance };
      }
      
      if (data.receiving) {
        this.form.receiving = { ...this.form.receiving, ...data.receiving };
      } else if (data.rawForm && data.rawForm.receiving) {
        this.form.receiving = { ...this.form.receiving, ...data.rawForm.receiving };
      }
    },

    onlyDigits (e) {
      if (!/[0-9]/.test(e.key)) e.preventDefault();
    },

    restrictReceiverMobileInput (e) {
      const v = (e?.target?.value || '').replace(/\D/g, '').slice(0, 10);
      e.target.value = v;
      this.$set(this.form.receiving, 'mobile', v);
    },

    validateAll () {
      const errors = [];
      if (!this.form.chassisNumber) {
        errors.push('Chassis number is required.');
      }
      if (this.form.salesMode === 'FINANCE') {
        if (!this.form.finance.company?.trim()) {
          errors.push('Finance company is required for finance sales mode.');
        }
        if (!this.form.finance.financerName?.trim()) {
          errors.push('Financer name is required for finance sales mode.');
        }
        if (!this.form.finance.agreementNumber?.trim()) {
          errors.push('Agreement number is required for finance sales mode.');
        }
      }
      this.errorSummary = errors;
      return errors.length === 0;
    },

    async onSubmit () {
      const ok = this.validateAll();
      const vuetifyOk = this.$refs.form?.validate() || true;

      if (!ok || !vuetifyOk) {
        this.snack = { show: true, color: 'error', text: 'Please fix highlighted errors' };
        return;
      }

      await this.updateFinanceData();
    },

    async updateFinanceData () {
      this.submitting = true;

      try {
        let payload;

        if (this.invoices && this.invoices.length > 0) {
          const existingInvoice = this.invoices[0];
          payload = { ...existingInvoice };
          
          payload.salesMode = this.form.salesMode;
          payload.chassisNumber = this.form.chassisNumber;
          payload.finance = { ...this.form.finance };
          payload.registration = { ...this.form.registration };
          payload.insurance = { ...this.form.insurance };
          payload.receiving = { ...this.form.receiving };
          
          if (payload.rawForm) {
            payload.rawForm.finance = { ...this.form.finance };
            payload.rawForm.registration = { ...this.form.registration };
            payload.rawForm.insurance = { ...this.form.insurance };
            payload.rawForm.receiving = { ...this.form.receiving };
            payload.rawForm.salesMode = this.form.salesMode;
          }
          
          payload.updatedAt = new Date().toISOString();
          payload.LastModifiedAt = Date.now();
        } else {
          payload = {
            chassisNumber: this.form.chassisNumber,
            salesMode: this.form.salesMode,
            finance: this.form.finance,
            registration: this.form.registration,
            insurance: this.form.insurance,
            receiving: this.form.receiving,
            updatedAt: new Date().toISOString(),
            LastModifiedAt: Date.now(),
            status: 'SOLD',
            invoiceNumber: this.search.invoiceNumber || '',
            billNumber: this.search.invoiceNumber || '',
            rawForm: {
              finance: this.form.finance,
              registration: this.form.registration,
              insurance: this.form.insurance,
              receiving: this.form.receiving,
              salesMode: this.form.salesMode
            }
          };
        }

        const response = await fetch(`${this.BASE}/updateCustomerInvoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data?.message || `Update failed (HTTP ${response.status})`);
        }

        this.snack = {
          show: true,
          color: 'success',
          text: data?.message || 'Finance & RTO details updated successfully'
        };

        this.$emit('updated', payload);

      } catch (e) {
        console.error('Failed to update finance details:', e);
        this.snack = {
          show: true,
          color: 'error',
          text: e?.message || 'Failed to update finance details'
        };
      } finally {
        this.submitting = false;
      }
    },

    async fetchByInvoice () {
      this.searchError = '';
      this.invoices = [];
      this.searchedOnce = false;

      const invoiceNumber = (this.search.invoiceNumber || '').trim();
      if (!invoiceNumber) {
        this.searchError = 'Please enter an invoice number to search.';
        return;
      }

      this.searching = true;
      try {
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'getByInvoice',
          { params: { billNumber: invoiceNumber } }
        );

        const json = res?.data || {};
        const found = Array.isArray(json.invoices) ? json.invoices : [];

        this.invoices = found;
        this.searchedOnce = true;

        if (found.length === 0) {
          this.searchError = 'No invoices returned for that invoice number.';
          return;
        }

        if (found.length === 1) {
          const inv = found[0];
          this.form.chassisNumber = inv.chassisNumber || (inv.vehicle && inv.vehicle.chassisNumber) || this.form.chassisNumber;
          this.form.salesMode = inv.salesMode || this.form.salesMode;

          const financeData = inv.finance || (inv.rawForm && inv.rawForm.finance) || {};
          const registrationData = inv.registration || (inv.rawForm && inv.rawForm.registration) || {};
          const insuranceData = inv.insurance || (inv.rawForm && inv.rawForm.insurance) || {};
          const receivingData = inv.receiving || (inv.rawForm && inv.rawForm.receiving) || {};

          this.form.finance = { ...this.form.finance, ...financeData };
          this.form.registration = { ...this.form.registration, ...registrationData };
          this.form.insurance = { ...this.form.insurance, ...insuranceData };
          this.form.receiving = { ...this.form.receiving, ...receivingData };

          if (this.form.receiving.mobile) {
            const m = String(this.form.receiving.mobile).replace(/\D/g, '').slice(0, 10);
            this.$set(this.form.receiving, 'mobile', m);
          }
        }

      } catch (err) {
        console.error('Error fetching invoice by number:', err);
        this.searchError = err?.response?.data?.message || err?.message || 'Failed to fetch invoice';
      } finally {
        this.searching = false;
      }
    },

    clearSearch () {
      this.search.invoiceNumber = '';
      this.invoices = [];
      this.searchError = '';
      this.searchedOnce = false;
    },

    resetForm() {
      this.form = {
        chassisNumber: this.chassisNumber || '',
        salesMode: 'CASH',
        finance: {
          company: '',
          financerName: '',
          loanAmount: '',
          disbursementAmount: '',
          downPayment: '',
          emi: '',
          tenureMonths: '',
          agreementNumber: ''
        },
        registration: {
          number: '',
          rcAppliedDate: null,
          paymentDate: null,
          hsrpAppliedDate: null,
          hsrpCourier: '',
          rcPrintDate: null
        },
        insurance: {
          type: 'THIRD PARTY',
          company: '',
          policyNo: '',
          idv: '',
          validFrom: null,
          periodYears: '5',
          validUpto: null
        },
        receiving: {
          receiverName: '',
          mobile: '',
          numberPlateReceivingDate: null,
          rcReceivingDate: null,
          remarks: ''
        }
      };
      this.errorSummary = [];
    },

    loadData(externalData) {
      if (externalData && Object.keys(externalData).length > 0) {
        this.loadInitialData(externalData);
      }
    },

    // PDF Methods
    async generatePDF() {
      await this.handlePDFGeneration(true);
    },

    async previewPDF() {
      await this.handlePDFGeneration(false);
    },

// async handlePDFGeneration(download = true) {
//   if (!this.combinedData) {
//     this.snack = {
//       show: true,
//       color: 'error',
//       text: 'No data available for PDF generation'
//     };
//     return;
//   }

//   this.generatingPDF = true;

//   try {
//     // A4 – Landscape
//     const doc = new jsPDF('landscape', 'mm', 'a4');
//     const data = this.combinedData;

//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();
//     const margin = 10;

//     // ---------- PDF META ----------
//     doc.setProperties({
//       title: `Invoice - ${data.invoiceNumber || 'N/A'}`,
//       subject: 'Vehicle Invoice',
//       author: 'Ansari Automobiles',
//       creator: 'Ansari Automobiles System'
//     });

//     // ---------- HELPERS ----------
//     const safeGet = (obj, path, def = '') => {
//       const v = path.split('.').reduce((acc, part) => (acc ? acc[part] : undefined), obj);
//       return v !== undefined && v !== null ? String(v) : def;
//     };

//     const formatCurrency = (value) => {
//       if (!value && value !== 0) return '';
//       const num = Number(value);
//       return isNaN(num) ? '' : `₹${num.toLocaleString('en-IN')}`;
//     };

//     const drawLabelValue = (label, value, xLabel, xValue, y) => {
//       doc.setFontSize(9);
//       doc.setFont(undefined, 'bold');
//       doc.text(label, xLabel, y);
//       doc.setFont(undefined, 'normal');

//       if (!value) return y + 5;

//       const maxWidth = pageWidth - xValue - margin;
//       const wrapped = doc.splitTextToSize(value, maxWidth);
//       doc.text(wrapped, xValue, y);
//       return y + wrapped.length * 4 + 1;
//     };

//     // ---------- OUTER BORDER ----------
//     doc.setLineWidth(0.4);
//     doc.rect(margin - 5, margin - 5, pageWidth - (margin - 5) * 2, pageHeight - (margin - 5) * 2);

//     let y = margin;

//     // ---------- HEADER ----------
//     // Left: TVS logo text
//     doc.setFontSize(28);
//     doc.setFont(undefined, 'bold');
//     doc.text('TVS', margin + 5, y + 8);

//     // Center: BILL INVOICE & description
//     doc.setFontSize(10);
//     doc.setFont(undefined, 'bold');
//     doc.text('BILL INVOICE', pageWidth / 2, y + 3, { align: 'center' });

//     doc.setFont(undefined, 'normal');
//     doc.text(
//       'TVS MOPED, TVS MOTORCYCLE, EV SCOOTER,',
//       pageWidth / 2,
//       y + 8,
//       { align: 'center' }
//     );
//     doc.text(
//       'GENUINE SPARE & ACCESSORIES',
//       pageWidth / 2,
//       y + 13,
//       { align: 'center' }
//     );
//     doc.setFont(undefined, 'italic');
//     doc.text('Authorised Dealer', pageWidth / 2, y + 18, { align: 'center' });

//     // Right: Dealer info
//     const dealerX = pageWidth - margin - 5;
//     let dealerY = y + 3;
//     doc.setFontSize(11);
//     doc.setFont(undefined, 'bold');
//     doc.text('ANSARI AUTOMOBILES', dealerX, dealerY, { align: 'right' });

//     doc.setFontSize(8);
//     doc.setFont(undefined, 'normal');
//     dealerY += 5;
//     doc.text('BADI KAMHARIYA BY PASS ROAD, MAU', dealerX, dealerY, { align: 'right' });
//     dealerY += 4;
//     doc.text('GSTIN/UIN : 09AJBPA4037B1ZY', dealerX, dealerY, { align: 'right' });
//     dealerY += 4;
//     doc.text('STATE NAME : UTTAR PRADESH', dealerX, dealerY, { align: 'right' });

//     y += 24;

//     // Top horizontal line under header
//     doc.line(margin - 5, y, pageWidth - (margin - 5), y);
//     y += 4;

//     // ---------- INVOICE NO / DATE ----------
//     const leftColX = margin;
//     const rightColX = pageWidth / 2 + 20;

//     doc.setFontSize(9);
//     doc.setFont(undefined, 'bold');
//     doc.text('Invoice No.:', leftColX, y);
//     doc.text('Invoice Date:', rightColX, y);

//     doc.setFont(undefined, 'normal');
//     doc.text(
//       safeGet(data, 'invoiceNumber', 'FSFSFSFSFSFSF'),
//       leftColX + 25,
//       y
//     );
//     doc.text(
//       safeGet(data, 'invoiceDate', '23/11/2025'),
//       rightColX + 25,
//       y
//     );

//     y += 6;
//     doc.line(margin - 5, y, pageWidth - (margin - 5), y);
//     y += 4;

//     // ---------- BILL TO BOX ----------
//     const billBoxTop = y;
//     const billBoxHeight = 55;
//     doc.rect(margin - 5, billBoxTop, pageWidth - (margin - 5) * 2, billBoxHeight);

//     doc.setFontSize(10);
//     doc.setFont(undefined, 'bold');
//     doc.text('Bill To -', leftColX, y + 4);

//     y += 10;

//     const xLabel = leftColX;
//     const xValue = leftColX + 40;

//     // customer details (left side)
//     y = drawLabelValue(
//       'CUSTOMER NAME',
//       safeGet(data, 'customer.name', ''),
//       xLabel,
//       xValue,
//       y
//     );
//     y = drawLabelValue(
//       'S/O',
//       safeGet(data, 'customer.fatherName', ''),
//       xLabel,
//       xValue,
//       y
//     );
//     y = drawLabelValue(
//       'CURRENT ADD',
//       safeGet(data, 'customer.currentAddress', '') || safeGet(data, 'customer.address', ''),
//       xLabel,
//       xValue,
//       y
//     );
//     y = drawLabelValue(
//       'PERMANENT ADD',
//       safeGet(data, 'customer.permanentAddress', '') || safeGet(data, 'customer.address', ''),
//       xLabel,
//       xValue,
//       y
//     );
//     y = drawLabelValue(
//       'MOBILE NO.',
//       safeGet(data, 'customer.phone', ''),
//       xLabel,
//       xValue,
//       y
//     );
//     y = drawLabelValue(
//       'AADHAAR NUMBER',
//       safeGet(data, 'customer.aadhaar', ''),
//       xLabel,
//       xValue,
//       y
//     );
//     y = drawLabelValue(
//       'ASSIGNED RTO',
//       safeGet(data, 'registration.rto', ''),
//       xLabel,
//       xValue,
//       y
//     );

//     // Clamp Y to bottom of Bill box
//     y = billBoxTop + billBoxHeight + 4;

//     // ---------- NOMINEE TABLE ----------
//     const nomineeTop = y;
//     const nomineeHeight = 12;
//     const tableLeft = margin - 5;
//     const tableRight = pageWidth - (margin - 5);
//     const tableWidth = tableRight - tableLeft;

//     const colNominee = tableLeft;
//     const colOwnerRelation = colNominee + tableWidth * 0.35;
//     const colAge = colOwnerRelation + tableWidth * 0.3;
//     const colMobile = colAge + tableWidth * 0.1;

//     doc.rect(tableLeft, nomineeTop, tableWidth, nomineeHeight);
//     doc.line(colOwnerRelation, nomineeTop, colOwnerRelation, nomineeTop + nomineeHeight);
//     doc.line(colAge, nomineeTop, colAge, nomineeTop + nomineeHeight);
//     doc.line(colMobile, nomineeTop, colMobile, nomineeTop + nomineeHeight);

//     doc.setFontSize(8);
//     doc.setFont(undefined, 'bold');
//     doc.text('NOMINEE NAME', colNominee + 2, nomineeTop + 4);
//     doc.text('OWNER RELATION', colOwnerRelation + 2, nomineeTop + 4);
//     doc.text('AGE', colAge + 2, nomineeTop + 4);
//     doc.text('MOBILE NUMBER', colMobile + 2, nomineeTop + 4);

//     doc.setFont(undefined, 'normal');
//     const rowY = nomineeTop + 8;
//     doc.text(safeGet(data, 'customer.nomineeName', ''), colNominee + 2, rowY);
//     doc.text(safeGet(data, 'customer.relationType', ''), colOwnerRelation + 2, rowY);
//     doc.text(safeGet(data, 'customer.age', ''), colAge + 2, rowY);
//     doc.text(safeGet(data, 'customer.nomineeMobile', ''), colMobile + 2, rowY);

//     y = nomineeTop + nomineeHeight + 6;

//     // ---------- VEHICLE TABLE ----------
//     const vehicleTop = y;
//     const vehicleHeight = 28;

//     const modelCol = tableLeft;
//     const qtyCol = tableLeft + tableWidth * 0.58;
//     const priceCol = qtyCol + tableWidth * 0.12;
//     const amtCol = priceCol + tableWidth * 0.15;

//     doc.rect(tableLeft, vehicleTop, tableWidth, vehicleHeight);
//     doc.line(qtyCol, vehicleTop, qtyCol, vehicleTop + vehicleHeight);
//     doc.line(priceCol, vehicleTop, priceCol, vehicleTop + vehicleHeight);
//     doc.line(amtCol, vehicleTop, amtCol, vehicleTop + vehicleHeight);

//     doc.setFontSize(9);
//     doc.setFont(undefined, 'bold');
//     doc.text('MODEL', modelCol + 2, vehicleTop + 5);
//     doc.text('QTY', qtyCol + 2, vehicleTop + 5);
//     doc.text('PRICE', priceCol + 2, vehicleTop + 5);
//     doc.text('AMOUNT', amtCol + 2, vehicleTop + 5);

//     doc.setFont(undefined, 'normal');
//     const vRowY = vehicleTop + 11;

//     const vehicleModel = safeGet(data, 'vehicle.model', 'iQube 11 (3.1KWh)');
//     const modelLines = doc.splitTextToSize(vehicleModel, qtyCol - modelCol - 4);
//     doc.text(modelLines, modelCol + 2, vRowY);

//     doc.text(safeGet(data, 'vehicle.qty', '1'), qtyCol + 5, vRowY);

//     const price = formatCurrency(safeGet(data, 'vehicle.unitPriceExRtoIns', '146577'));
//     const amount = formatCurrency(safeGet(data, 'vehicle.amount', '146577'));

//     doc.text(price, priceCol + 2, vRowY);
//     doc.text(amount, amtCol + 2, vRowY);

//     // Chassis / Engine / Color inside model column bottom
//     const detailsY = vehicleTop + vehicleHeight - 8;
//     doc.setFontSize(8);
//     doc.text(`Chassis: ${safeGet(data, 'vehicle.chassisNumber', 'FSFSFSFSFSF')}`, modelCol + 2, detailsY);
//     doc.text(`Engine: ${safeGet(data, 'vehicle.engineNumber', 'SFSFSFSFSFSF')}`, modelCol + 2, detailsY + 4);
//     doc.text(`Color: ${safeGet(data, 'vehicle.color', 'GREY')}`, priceCol + 2, detailsY);

//     y = vehicleTop + vehicleHeight + 4;

//     // ---------- TOTALS (right side) ----------
//     const amountLabels = [
//       'Vehicle Amount',
//       'Grand Total (On-road)',
//       'Paid',
//       'Due'
//     ];
//     const amountValues = [
//       formatCurrency(safeGet(data, 'totals.totalAmount', '146577')),
//       formatCurrency(safeGet(data, 'totals.totalAmount', '146577')),
//       formatCurrency(safeGet(data, 'totals.totalPaid', '146577')),
//       formatCurrency(safeGet(data, 'totals.due', '0'))
//     ];

//     const labelX = pageWidth - margin - 60;
//     let amtY = y;

//     for (let i = 0; i < amountLabels.length; i++) {
//       doc.setFontSize(9);
//       doc.setFont(undefined, i === 1 ? 'bold' : 'normal');
//       doc.text(amountLabels[i], labelX, amtY);
//       doc.text(amountValues[i], pageWidth - margin - 5, amtY, { align: 'right' });
//       amtY += 6;
//     }

//     y = amtY + 4;

//     // ---------- AMOUNT IN WORDS ----------
//     const wordsTop = y;
//     const wordsHeight = 12;
//     doc.rect(tableLeft, wordsTop, tableWidth, wordsHeight);

//     doc.setFontSize(9);
//     doc.setFont(undefined, 'bold');
//     doc.text('Amount (in words)', tableLeft + 2, wordsTop + 4);

//     doc.setFont(undefined, 'normal');
//     const amountInWords = safeGet(
//       data,
//       'amountInWords',
//       'One Lakh Forty Six Thousand Five Hundred Seventy Seven Rupees'
//     );
//     const wordsLines = doc.splitTextToSize(amountInWords, tableWidth - 40);
//     doc.text(wordsLines, tableLeft + 2, wordsTop + 9);

//     y = wordsTop + wordsHeight + 4;

//     // ---------- PAYMENT MODE TABLE ----------
//     const payTop = y;
//     const payHeight = 14;

//     const payModeCol = tableLeft;
//     const payRefCol = tableLeft + tableWidth * 0.4;
//     const payAmtCol = tableLeft + tableWidth * 0.75;

//     doc.rect(tableLeft, payTop, tableWidth, payHeight);
//     doc.line(payRefCol, payTop, payRefCol, payTop + payHeight);
//     doc.line(payAmtCol, payTop, payAmtCol, payTop + payHeight);

//     doc.setFontSize(9);
//     doc.setFont(undefined, 'bold');
//     doc.text('MODE', payModeCol + 2, payTop + 4);
//     doc.text('REFERENCE', payRefCol + 2, payTop + 4);
//     doc.text('AMOUNT', payAmtCol + 2, payTop + 4);

//     doc.setFont(undefined, 'normal');
//     const payRowY = payTop + 9;
//     doc.text(safeGet(data, 'payment.mode', 'CASH'), payModeCol + 2, payRowY);
//     doc.text(safeGet(data, 'payment.reference', ''), payRefCol + 2, payRowY);
//     doc.text(
//       formatCurrency(safeGet(data, 'payment.amount', safeGet(data, 'totals.totalPaid', '146577'))),
//       pageWidth - margin - 5,
//       payRowY,
//       { align: 'right' }
//     );

//     // ---------- FOOTER / SIGN ----------
//     const footerY = pageHeight - margin - 5;
//     doc.setFontSize(8);
//     doc.text('Authorised Signatory', pageWidth - margin - 40, footerY);

//     // ---------- OUTPUT ----------
//     if (download) {
//       const fileName = `Invoice_${safeGet(data, 'invoiceNumber', 'unknown')}_${Date.now()}.pdf`;
//       doc.save(fileName);
//       this.snack = {
//         show: true,
//         color: 'success',
//         text: 'PDF downloaded successfully'
//       };
//     } else {
//       const pdfBlob = doc.output('blob');
//       const pdfUrl = URL.createObjectURL(pdfBlob);
//       window.open(pdfUrl, '_blank');
//       setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
//       this.snack = {
//         show: true,
//         color: 'success',
//         text: 'PDF preview opened in new tab'
//       };
//     }
//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     this.snack = {
//       show: true,
//       color: 'error',
//       text: `Failed to generate PDF: ${error.message}`
//     };
//   } finally {
//     this.generatingPDF = false;
//   }
// }

// async handlePDFGeneration(download = true) {
//   if (!this.combinedData) {
//     this.snack = {
//       show: true,
//       color: 'error',
//       text: 'No data available for PDF generation'
//     };
//     return;
//   }

//   this.generatingPDF = true;

//   try {
//     // A4 – Landscape
//     const doc = new jsPDF('landscape', 'mm', 'a4');
//     const data = this.combinedData;

//     const pageWidth = doc.internal.pageSize.getWidth();
//     const pageHeight = doc.internal.pageSize.getHeight();
//     const margin = 10;

//     // ---------- HELPERS ----------
//     const safe = (v, def = '') =>
//       v === undefined || v === null || v === '' ? def : String(v);

//     const formatCurrency = (value) => {
//       if (!value && value !== 0) return '';
//       const num = Number(value);
//       return isNaN(num) ? '' : `₹${num.toLocaleString('en-IN')}`;
//     };

//     const formatDate = (value) => {
//       if (!value) return '';
//       if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(String(value))) {
//         return String(value).replace(/-/g, '/');
//       }
//       const d = new Date(value);
//       if (isNaN(d.getTime())) return String(value);
//       const dd = String(d.getDate()).padStart(2, '0');
//       const mm = String(d.getMonth() + 1).padStart(2, '0');
//       const yyyy = d.getFullYear();
//       return `${dd}/${mm}/${yyyy}`;
//     };

//     const buildAddress = (addr = {}) => {
//       const parts = [
//         addr.line1,
//         addr.line2,
//         addr.village,
//         addr.tahsil,
//         addr.district,
//         addr.state,
//         addr.pincode
//       ].filter(Boolean);
//       return parts.join(', ');
//     };

//     const drawLabelValue = (label, value, xLabel, xValue, y) => {
//       doc.setFontSize(9);
//       doc.setFont(undefined, 'bold');
//       doc.text(label, xLabel, y);
//       doc.setFont(undefined, 'normal');

//       if (!value) return y + 5;

//       const maxWidth = pageWidth - xValue - margin;
//       const wrapped = doc.splitTextToSize(value, maxWidth);
//       doc.text(wrapped, xValue, y);
//       return y + wrapped.length * 4 + 1;
//     };

//     const numberToWordsINR = (num) => {
//       num = Number(num);
//       if (!num || isNaN(num)) return '';
//       const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
//         'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
//         'Seventeen', 'Eighteen', 'Nineteen'];
//       const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

//       const twoDigits = (n) => {
//         if (n < 20) return ones[n];
//         const t = Math.floor(n / 10);
//         const r = n % 10;
//         return tens[t] + (r ? ' ' + ones[r] : '');
//       };

//       const threeDigits = (n) => {
//         const h = Math.floor(n / 100);
//         const r = n % 100;
//         let str = '';
//         if (h) str += ones[h] + ' Hundred';
//         if (r) str += (str ? ' ' : '') + twoDigits(r);
//         return str;
//       };

//       const crore = Math.floor(num / 10000000);
//       num %= 10000000;
//       const lakh = Math.floor(num / 100000);
//       num %= 100000;
//       const thousand = Math.floor(num / 1000);
//       num %= 1000;
//       const hundred = num;

//       let words = '';
//       if (crore) words += threeDigits(crore) + ' Crore ';
//       if (lakh) words += threeDigits(lakh) + ' Lakh ';
//       if (thousand) words += threeDigits(thousand) + ' Thousand ';
//       if (hundred) words += threeDigits(hundred);
//       words = words.trim();
//       return words ? words + ' Rupees' : '';
//     };

//     // ---------- PULL VALUES FROM API SHAPE ----------
//     const customer = data.customer || data.rawForm?.customer || {};
//     const customerAddr =
//       customer.address || data.rawForm?.customer?.address || {};
//     const permanentAddr =
//       data.rawForm?.permanentAddress || customerAddr;

//     const nominee = data.rawForm?.nominee || {};
//     const owner = data.rawForm?.owner || {};
//     const registration = data.registration || data.rawForm?.registration || {};
//     const insurance = data.insurance || data.rawForm?.insurance || {};
//     const receiving = data.receiving || data.rawForm?.receiving || {};

//     const payments = (data.payments && data.payments.length
//       ? data.payments
//       : data.rawForm?.payments) || [];
//     const mainPayment = payments[0] || {};

//     const vehicle = data.vehicle || {};
//     const totals = data.totals || {};
//     const tax = data.tax || {};
//     const billOptions = data.billOptions || data.rawForm?.billOptions || {};

//     const invoiceNo = safe(data.invoiceNumber || data.billNumber, 'N/A');
//     const invoiceDate = formatDate(
//       data.invoiceDateISO || data.invoiceDate || ''
//     );

//     const customerName = safe(customer.name, '');
//     const fatherName = safe(owner.relationName, '');
//     const relationType = safe(owner.relationType || nominee.relation, '');
//     const currentAddress = buildAddress(customerAddr);
//     const permanentAddress = buildAddress(permanentAddr);
//     const mobileNo = safe(customer.phone || data.phone, '');
//     const aadhaar =
//       safe(data.idProof?.value || data.rawForm?.ids?.value || '', '');
//     const assignedRto =
//       safe(registration.assignedRtoOffice ||
//            data.rawForm?.basic?.assignedRtoOffice ||
//            '', '');

//     const nomineeName = safe(nominee.name, '');
//     const nomineeRelation = relationType;
//     const nomineeAge = nominee.age != null ? String(nominee.age) : '';
//     const nomineeMobile = safe(nominee.mobile, '');

//     const modelName = safe(vehicle.model || data.rawForm?.model, '');
//     const vehicleQty = safe(vehicle.qty || data.rawForm?.qty || 1, '1');
//     const unitPrice =
//       vehicle.unitPriceExRtoIns ??
//       tax.showroomTotal ??
//       tax.onRoadTotal ??
//       data.grandTotal ??
//       totals.totalAmount;
//     const lineAmount =
//       vehicle.lineAmount ??
//       totals.totalAmount ??
//       data.grandTotal ??
//       unitPrice;

//     const chassis = safe(
//       vehicle.chassisNumber ||
//       data.chassisNumber ||
//       data.rawForm?.chassisNumber,
//       ''
//     );
//     const engine = safe(vehicle.engineNumber, '');
//     const color = safe(vehicle.color, '');

//     const totalAmount = totals.totalAmount ?? data.grandTotal ?? lineAmount;
//     const totalPaid = totals.totalPaid ?? mainPayment.amount ?? totalAmount;
//     const dueAmount =
//       totals.due != null
//         ? totals.due
//         : (totalAmount && totalPaid ? Number(totalAmount) - Number(totalPaid) : 0);

//     const amountInWords =
//       safe(data.amountInWords, '') ||
//       numberToWordsINR(totalAmount);

//     const payMode = safe(
//       mainPayment.mode || data.salesMode,
//       'CASH'
//     );
//     const payRef = safe(mainPayment.reference, '');
//     const payAmt = mainPayment.amount ?? totalPaid ?? totalAmount;

//     // Dealer (still can be hard-coded, but will use rawForm.firm if present)
//     const firm = data.rawForm?.firm || {};
//     const dealerName = safe(
//       firm.name || 'Ansari Automobiles'
//     );
//     const dealerAddr1 = safe(
//       firm.address || 'BADI KAMHARIYA BY PASS ROAD, MAU'
//     );
//     const dealerGstin = safe(
//       firm.gst || '09AJBPA4037B1ZY'
//     );
//     const dealerState = safe(
//       data.stateName || 'UTTAR PRADESH'
//     );

//     // ---------- PDF META ----------
//     doc.setProperties({
//       title: `Invoice - ${invoiceNo}`,
//       subject: 'Vehicle Invoice',
//       author: dealerName,
//       creator: 'Ansari Automobiles System'
//     });

//     // ---------- OUTER BORDER ----------
//     doc.setLineWidth(0.4);
//     doc.rect(
//       margin - 5,
//       margin - 5,
//       pageWidth - (margin - 5) * 2,
//       pageHeight - (margin - 5) * 2
//     );

//     let y = margin;

//     // ---------- HEADER ----------
//     // Left: TVS text logo
//     doc.setFontSize(28);
//     doc.setFont(undefined, 'bold');
//     doc.text('TVS', margin + 5, y + 8);

//     // Center: BILL INVOICE & description
//     doc.setFontSize(10);
//     doc.setFont(undefined, 'bold');
//     doc.text('BILL INVOICE', pageWidth / 2, y + 3, { align: 'center' });

//     doc.setFont(undefined, 'normal');
//     doc.text(
//       'TVS MOPED, TVS MOTORCYCLE, EV SCOOTER,',
//       pageWidth / 2,
//       y + 8,
//       { align: 'center' }
//     );
//     doc.text(
//       'GENUINE SPARE & ACCESSORIES',
//       pageWidth / 2,
//       y + 13,
//       { align: 'center' }
//     );
//     doc.setFont(undefined, 'italic');
//     doc.text('Authorised Dealer', pageWidth / 2, y + 18, { align: 'center' });

//     // Right: Dealer info
//     const dealerX = pageWidth - margin - 5;
//     let dealerY = y + 3;

//     doc.setFontSize(11);
//     doc.setFont(undefined, 'bold');
//     doc.text(dealerName.toUpperCase(), dealerX, dealerY, { align: 'right' });

//     doc.setFontSize(8);
//     doc.setFont(undefined, 'normal');
//     dealerY += 5;
//     doc.text(dealerAddr1, dealerX, dealerY, { align: 'right' });
//     dealerY += 4;
//     doc.text(`GSTIN/UIN : ${dealerGstin}`, dealerX, dealerY, { align: 'right' });
//     dealerY += 4;
//     doc.text(`STATE NAME : ${dealerState}`, dealerX, dealerY, { align: 'right' });

//     y += 24;

//     // Top line under header
//     doc.line(margin - 5, y, pageWidth - (margin - 5), y);
//     y += 4;

//     // ---------- INVOICE NO / DATE ----------
//     const leftColX = margin;
//     const rightColX = pageWidth / 2 + 20;

//     doc.setFontSize(9);
//     doc.setFont(undefined, 'bold');
//     doc.text('Invoice No.:', leftColX, y);
//     doc.text('Invoice Date:', rightColX, y);

//     doc.setFont(undefined, 'normal');
//     doc.text(invoiceNo, leftColX + 25, y);
//     doc.text(invoiceDate || 'N/A', rightColX + 25, y);

//     y += 6;
//     doc.line(margin - 5, y, pageWidth - (margin - 5), y);
//     y += 4;

//     // ---------- BILL TO BOX ----------
//     const billBoxTop = y;
//     const billBoxHeight = 55;
//     doc.rect(
//       margin - 5,
//       billBoxTop,
//       pageWidth - (margin - 5) * 2,
//       billBoxHeight
//     );

//     doc.setFontSize(10);
//     doc.setFont(undefined, 'bold');
//     doc.text('Bill To -', leftColX, y + 4);

//     y += 10;

//     const xLabel = leftColX;
//     const xValue = leftColX + 40;

//     y = drawLabelValue('CUSTOMER NAME', customerName, xLabel, xValue, y);
//     y = drawLabelValue('S/O', fatherName, xLabel, xValue, y);
//     y = drawLabelValue('CURRENT ADD', currentAddress, xLabel, xValue, y);
//     y = drawLabelValue('PERMANENT ADD', permanentAddress, xLabel, xValue, y);
//     y = drawLabelValue('MOBILE NO.', mobileNo, xLabel, xValue, y);
//     y = drawLabelValue('AADHAAR NUMBER', aadhaar, xLabel, xValue, y);
//     y = drawLabelValue('ASSIGNED RTO', assignedRto, xLabel, xValue, y);

//     // Clamp Y to bottom of Bill box
//     y = billBoxTop + billBoxHeight + 4;

//     // ---------- NOMINEE TABLE ----------
//     const nomineeTop = y;
//     const nomineeHeight = 12;
//     const tableLeft = margin - 5;
//     const tableRight = pageWidth - (margin - 5);
//     const tableWidth = tableRight - tableLeft;

//     const colNominee = tableLeft;
//     const colOwnerRelation = colNominee + tableWidth * 0.35;
//     const colAge = colOwnerRelation + tableWidth * 0.3;
//     const colMobile = colAge + tableWidth * 0.1;

//     doc.rect(tableLeft, nomineeTop, tableWidth, nomineeHeight);
//     doc.line(colOwnerRelation, nomineeTop, colOwnerRelation, nomineeTop + nomineeHeight);
//     doc.line(colAge, nomineeTop, colAge, nomineeTop + nomineeHeight);
//     doc.line(colMobile, nomineeTop, colMobile, nomineeTop + nomineeHeight);

//     doc.setFontSize(8);
//     doc.setFont(undefined, 'bold');
//     doc.text('NOMINEE NAME', colNominee + 2, nomineeTop + 4);
//     doc.text('OWNER RELATION', colOwnerRelation + 2, nomineeTop + 4);
//     doc.text('AGE', colAge + 2, nomineeTop + 4);
//     doc.text('MOBILE NUMBER', colMobile + 2, nomineeTop + 4);

//     doc.setFont(undefined, 'normal');
//     const rowY = nomineeTop + 8;
//     doc.text(nomineeName, colNominee + 2, rowY);
//     doc.text(nomineeRelation, colOwnerRelation + 2, rowY);
//     doc.text(nomineeAge, colAge + 2, rowY);
//     doc.text(nomineeMobile, colMobile + 2, rowY);

//     y = nomineeTop + nomineeHeight + 6;

//     // ---------- VEHICLE TABLE ----------
//     const vehicleTop = y;
//     const vehicleHeight = 28;

//     const modelCol = tableLeft;
//     const qtyCol = tableLeft + tableWidth * 0.58;
//     const priceCol = qtyCol + tableWidth * 0.12;
//     const amtCol = priceCol + tableWidth * 0.15;

//     doc.rect(tableLeft, vehicleTop, tableWidth, vehicleHeight);
//     doc.line(qtyCol, vehicleTop, qtyCol, vehicleTop + vehicleHeight);
//     doc.line(priceCol, vehicleTop, priceCol, vehicleTop + vehicleHeight);
//     doc.line(amtCol, vehicleTop, amtCol, vehicleTop + vehicleHeight);

//     doc.setFontSize(9);
//     doc.setFont(undefined, 'bold');
//     doc.text('MODEL', modelCol + 2, vehicleTop + 5);
//     doc.text('QTY', qtyCol + 2, vehicleTop + 5);
//     doc.text('PRICE', priceCol + 2, vehicleTop + 5);
//     doc.text('AMOUNT', amtCol + 2, vehicleTop + 5);

//     doc.setFont(undefined, 'normal');
//     const vRowY = vehicleTop + 11;

//     const modelLines = doc.splitTextToSize(
//       modelName || '—',
//       qtyCol - modelCol - 4
//     );
//     doc.text(modelLines, modelCol + 2, vRowY);

//     doc.text(String(vehicleQty || '1'), qtyCol + 5, vRowY);
//     doc.text(formatCurrency(unitPrice), priceCol + 2, vRowY);
//     doc.text(formatCurrency(lineAmount), amtCol + 2, vRowY);

//     const detailsY = vehicleTop + vehicleHeight - 8;
//     doc.setFontSize(8);
//     doc.text(`Chassis: ${chassis}`, modelCol + 2, detailsY);
//     doc.text(`Engine: ${engine}`, modelCol + 2, detailsY + 4);
//     doc.text(`Color: ${color}`, priceCol + 2, detailsY);

//     y = vehicleTop + vehicleHeight + 4;

//     // ---------- TOTALS (right side) ----------
//     const amountLabels = [
//       'Vehicle Amount',
//       'Grand Total (On-road)',
//       'Paid',
//       'Due'
//     ];
//     const amountValues = [
//       formatCurrency(totalAmount),
//       formatCurrency(totalAmount),
//       formatCurrency(totalPaid),
//       formatCurrency(dueAmount)
//     ];

//     const labelX = pageWidth - margin - 60;
//     let amtY = y;

//     for (let i = 0; i < amountLabels.length; i++) {
//       doc.setFontSize(9);
//       doc.setFont(undefined, i === 1 ? 'bold' : 'normal');
//       doc.text(amountLabels[i], labelX, amtY);
//       doc.text(amountValues[i] || '-', pageWidth - margin - 5, amtY, {
//         align: 'right'
//       });
//       amtY += 6;
//     }

//     y = amtY + 4;

//     // ---------- AMOUNT IN WORDS ----------
//     const wordsTop = y;
//     const wordsHeight = 12;
//     doc.rect(tableLeft, wordsTop, tableWidth, wordsHeight);

//     doc.setFontSize(9);
//     doc.setFont(undefined, 'bold');
//     doc.text('Amount (in words)', tableLeft + 2, wordsTop + 4);

//     doc.setFont(undefined, 'normal');
//     const wordsLines = amountInWords
//       ? doc.splitTextToSize(amountInWords, tableWidth - 40)
//       : [];
//     if (wordsLines.length) {
//       doc.text(wordsLines, tableLeft + 2, wordsTop + 9);
//     }

//     y = wordsTop + wordsHeight + 4;

//     // ---------- PAYMENT MODE TABLE ----------
//     const payTop = y;
//     const payHeight = 14;

//     const payModeCol = tableLeft;
//     const payRefCol = tableLeft + tableWidth * 0.4;
//     const payAmtCol = tableLeft + tableWidth * 0.75;

//     doc.rect(tableLeft, payTop, tableWidth, payHeight);
//     doc.line(payRefCol, payTop, payRefCol, payTop + payHeight);
//     doc.line(payAmtCol, payTop, payAmtCol, payTop + payHeight);

//     doc.setFontSize(9);
//     doc.setFont(undefined, 'bold');
//     doc.text('MODE', payModeCol + 2, payTop + 4);
//     doc.text('REFERENCE', payRefCol + 2, payTop + 4);
//     doc.text('AMOUNT', payAmtCol + 2, payTop + 4);

//     doc.setFont(undefined, 'normal');
//     const payRowY = payTop + 9;
//     doc.text(payMode || 'CASH', payModeCol + 2, payRowY);
//     doc.text(payRef || '-', payRefCol + 2, payRowY);
//     doc.text(
//       formatCurrency(payAmt),
//       pageWidth - margin - 5,
//       payRowY,
//       { align: 'right' }
//     );

//     // ---------- FOOTER ----------
//     const footerY = pageHeight - margin - 5;
//     doc.setFontSize(8);
//     doc.text('Authorised Signatory', pageWidth - margin - 40, footerY);

//     // ---------- OUTPUT ----------
//     if (download) {
//       const fileName = `Invoice_${invoiceNo}_${Date.now()}.pdf`;
//       doc.save(fileName);
//       this.snack = {
//         show: true,
//         color: 'success',
//         text: 'PDF downloaded successfully'
//       };
//     } else {
//       const pdfBlob = doc.output('blob');
//       const pdfUrl = URL.createObjectURL(pdfBlob);
//       window.open(pdfUrl, '_blank');
//       setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
//       this.snack = {
//         show: true,
//         color: 'success',
//         text: 'PDF preview opened in new tab'
//       };
//     }
//   } catch (error) {
//     console.error('Error generating PDF:', error);
//     this.snack = {
//       show: true,
//       color: 'error',
//       text: `Failed to generate PDF: ${error.message}`
//     };
//   } finally {
//     this.generatingPDF = false;
//   }
// }

    async handlePDFGeneration(download = true) {
      if (!this.combinedData) {
        this.snack = {
          show: true,
          color: 'error',
          text: 'No data available for PDF generation'
        };
        return;
      }

      this.generatingPDF = true;

      try {
        // ---- A4 PORTRAIT ----
        const doc = new jsPDF('p', 'mm', 'a4');
        const data = this.combinedData;

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 10;
        const bottomLimit = pageHeight - (margin + 6);

        // ---------- HELPERS ----------
        const safe = (v, def = '') => {
          if (v === undefined || v === null) return def;
          const s = String(v).trim();
          return s === '' ? def : s;
        };

        const formatCurrency = (value) => {
          if (!value && value !== 0) return '';
          const num = Number(String(value).trim());
          return isNaN(num) ? '' : `₹${num.toLocaleString('en-IN')}`;
        };

        const formatDate = (value) => {
          if (!value) return '';
          const s = String(value).trim();
          if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(s)) {
            return s.replace(/-/g, '/');
          }
          const d = new Date(s);
          if (isNaN(d.getTime())) return s;
          const dd = String(d.getDate()).padStart(2, '0');
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const yyyy = d.getFullYear();
          return `${dd}/${mm}/${yyyy}`;
        };

        const buildAddress = (addr = {}) => {
          const parts = [
            addr.line1,
            addr.line2,
            addr.village,
            addr.tahsil,
            addr.district,
            addr.state,
            addr.pincode
          ].map(x => safe(x, '')).filter(Boolean);
          return parts.join(', ');
        };

        const drawLabelValue = (label, value, xLabel, xValue, y) => {
          doc.setFontSize(9);
          doc.setFont(undefined, 'bold');
          doc.text(label, xLabel, y);
          doc.setFont(undefined, 'normal');

          if (!value) return y + 4;

          const maxWidth = pageWidth - xValue - margin;
          const wrapped = doc.splitTextToSize(value, maxWidth);
          doc.text(wrapped, xValue, y);
          return y + wrapped.length * 4;
        };

        const numberToWordsINR = (num) => {
          num = Number(num);
          if (!num || isNaN(num)) return '';
          const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
            'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
            'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
          const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty',
            'Seventy', 'Eighty', 'Ninety'];

          const twoDigits = (n) => {
            if (n < 20) return ones[n];
            const t = Math.floor(n / 10);
            const r = n % 10;
            return tens[t] + (r ? ' ' + ones[r] : '');
          };

          const threeDigits = (n) => {
            const h = Math.floor(n / 100);
            const r = n % 100;
            let str = '';
            if (h) str += ones[h] + ' Hundred';
            if (r) str += (str ? ' ' : '') + twoDigits(r);
            return str;
          };

          const crore = Math.floor(num / 10000000);
          num %= 10000000;
          const lakh = Math.floor(num / 100000);
          num %= 100000;
          const thousand = Math.floor(num / 1000);
          num %= 1000;
          const hundred = num;

          let words = '';
          if (crore) words += threeDigits(crore) + ' Crore ';
          if (lakh) words += threeDigits(lakh) + ' Lakh ';
          if (thousand) words += threeDigits(thousand) + ' Thousand ';
          if (hundred) words += threeDigits(hundred);
          words = words.trim();
          return words ? words + ' Rupees' : '';
        };

        const ensureSpace = (needed, yRef) => {
          if (yRef + needed <= bottomLimit) return yRef;
          doc.addPage();
          // new page border only (no big header)
          doc.setLineWidth(0.4);
          doc.rect(
            margin - 5,
            margin - 5,
            pageWidth - (margin - 5) * 2,
            pageHeight - (margin - 5) * 2
          );
          return margin; // start near top on new page
        };

        // ---------- MAP API → FIELDS ----------
        const customer = data.customer || data.rawForm?.customer || {};
        const customerAddr = customer.address || data.rawForm?.customer?.address || {};
        const permanentAddr = data.rawForm?.permanentAddress || customerAddr;

        const nominee = data.rawForm?.nominee || {};
        const owner = data.rawForm?.owner || {};
        const registration = data.registration || data.rawForm?.registration || {};
        const receiving = data.receiving || data.rawForm?.receiving || {};
        const insurance = data.insurance || data.rawForm?.insurance || {};
        const finance = data.finance || data.rawForm?.finance || {};

        const accessories =
          (Array.isArray(data.accessories) && data.accessories.length
            ? data.accessories
            : (data.rawForm?.accessories || [])) || [];

        const payments = (data.payments && data.payments.length
          ? data.payments
          : data.rawForm?.payments || []);

        const vehicle = data.vehicle || {};
        const totals = data.totals || {};
        const tax = data.tax || {};

        const invoiceNo = safe(data.invoiceNumber || data.billNumber, 'N/A');
        const invoiceDate = formatDate(data.invoiceDateISO || data.invoiceDate || '');

        const customerName = safe(customer.name, '');
        const fatherName = safe(owner.relationName, '');
        const relationType = safe(owner.relationType || nominee.relation, '');
        const currentAddress = buildAddress(customerAddr);
        const permanentAddress = buildAddress(permanentAddr);
        const mobileNo = safe(customer.phone || data.phone, '');
        const aadhaar = safe(data.idProof?.value || data.rawForm?.ids?.value, '');
        const assignedRto = safe(
          registration.assignedRtoOffice || data.rawForm?.basic?.assignedRtoOffice,
          ''
        );

        const nomineeName = safe(nominee.name, '');
        const nomineeRelation = relationType;
        const nomineeAge = nominee.age != null ? safe(nominee.age) : '';
        const nomineeMobile = safe(nominee.mobile, '');

        const modelName = safe(vehicle.model || data.rawForm?.model, '');
        const vehicleQty = vehicle.qty || data.rawForm?.qty || 1;
        const unitPrice =
          vehicle.unitPriceExRtoIns ??
          tax.showroomTotal ??
          tax.onRoadTotal ??
          data.grandTotal ??
          totals.totalAmount;
        const lineAmount =
          vehicle.lineAmount ??
          totals.totalAmount ??
          data.grandTotal ??
          unitPrice;

        const chassis = safe(
          vehicle.chassisNumber || data.chassisNumber || data.rawForm?.chassisNumber,
          ''
        );
        const engine = safe(vehicle.engineNumber, '');
        const color = safe(vehicle.color, '');

        // accessories totals
        const accessoriesTotal = accessories.reduce((sum, a) => {
          const qty = Number(a.qty || a.quantity || 1);
          const price = Number(a.price || a.unitPrice || 0);
          const amt = Number(a.amount || qty * price || 0);
          return sum + (isNaN(amt) ? 0 : amt);
        }, 0);

        const totalAmount =
          totals.totalAmount ?? data.grandTotal ?? (lineAmount + accessoriesTotal);
        const vehicleAmount =
          vehicle.lineAmount ?? (Number(totalAmount || 0) - accessoriesTotal);
        const totalPaid = totals.totalPaid ??
          (payments[0] ? payments.reduce((s, p) => s + Number(p.amount || 0), 0) : totalAmount);
        const dueAmount =
          totals.due != null
            ? totals.due
            : (totalAmount && totalPaid
                ? Number(totalAmount) - Number(totalPaid)
                : 0);

        const amountInWords =
          safe(data.amountInWords, '') || numberToWordsINR(totalAmount);

        // payment modes map
        const paymentMap = {};
        payments.forEach(p => {
          const key = safe(p.mode, '').toUpperCase();
          if (!key) return;
          paymentMap[key] = p;
        });
        const orderedModes = ['CASH', 'UPI', 'CARD', 'CHEQUE'];

        // ---------- PDF META ----------
        doc.setProperties({
          title: `Invoice - ${invoiceNo}`,
          subject: 'Vehicle Invoice',
          author: 'Ansari Automobiles',
          creator: 'Ansari Automobiles System'
        });

        // ---------- OUTER BORDER ----------
        doc.setLineWidth(0.4);
        doc.rect(
          margin - 5,
          margin - 5,
          pageWidth - (margin - 5) * 2,
          pageHeight - (margin - 5) * 2
        );

        let y = margin;

        // ---------- HEADER ----------
        doc.setFontSize(28);
        doc.setFont(undefined, 'bold');
        doc.text('TVS', margin + 5, y + 8);

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('BILL INVOICE', pageWidth / 2, y + 3, { align: 'center' });

        doc.setFont(undefined, 'normal');
        doc.text(
          'TVS MOPED, TVS MOTORCYCLE, EV SCOOTER,',
          pageWidth / 2,
          y + 8,
          { align: 'center' }
        );
        doc.text(
          'GENUINE SPARE & ACCESSORIES',
          pageWidth / 2,
          y + 13,
          { align: 'center' }
        );
        doc.setFont(undefined, 'italic');
        doc.text('Authorised Dealer', pageWidth / 2, y + 18, { align: 'center' });

        // Right: dealer block (static text)
        const dealerX = pageWidth - margin - 5;
        let dealerY = y + 3;

        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('ANSARI AUTOMOBILES', dealerX, dealerY, { align: 'right' });

        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        dealerY += 5;
        doc.text('BADI KAMHARIYA BY PASS ROAD, MAU', dealerX, dealerY, { align: 'right' });
        dealerY += 4;
        doc.text('GSTIN/UIN : 09AJBPA4037B1ZY', dealerX, dealerY, { align: 'right' });
        dealerY += 4;
        doc.text('STATE NAME : UTTAR PRADESH', dealerX, dealerY, { align: 'right' });

        y += 24;
        doc.line(margin - 5, y, pageWidth - (margin - 5), y);
        y += 3;

        // ---------- INVOICE NO / DATE ----------
        const leftColX = margin;
        const rightColX = pageWidth / 2 + 20;

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Invoice No.:', leftColX, y);
        doc.text('Invoice Date:', rightColX, y);

        doc.setFont(undefined, 'normal');
        doc.text(invoiceNo, leftColX + 25, y);
        doc.text(invoiceDate || 'N/A', rightColX + 25, y);

        y += 5;
        doc.line(margin - 5, y, pageWidth - (margin - 5), y);
        y += 3;

        // ---------- BILL TO BOX ----------
        y = ensureSpace(55 + 6, y);
        const billBoxTop = y;
        const billBoxHeight = 55;
        const tableLeft = margin - 5;
        const tableRight = pageWidth - (margin - 5);
        const tableWidth = tableRight - tableLeft;

        doc.rect(
          tableLeft,
          billBoxTop,
          tableWidth,
          billBoxHeight
        );

        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text('Bill To -', leftColX, y + 4);

        y += 9;

        const xLabel = leftColX;
        const xValue = leftColX + 40;

        y = drawLabelValue('CUSTOMER NAME', customerName, xLabel, xValue, y);
        y = drawLabelValue('S/O', fatherName, xLabel, xValue, y);
        y = drawLabelValue('CURRENT ADD', currentAddress, xLabel, xValue, y);
        y = drawLabelValue('PERMANENT ADD', permanentAddress, xLabel, xValue, y);
        y = drawLabelValue('MOBILE NO.', mobileNo, xLabel, xValue, y);
        y = drawLabelValue('AADHAAR NUMBER', aadhaar, xLabel, xValue, y);
        y = drawLabelValue('ASSIGNED RTO', assignedRto, xLabel, xValue, y);

        y = billBoxTop + billBoxHeight + 3;

        // ---------- NOMINEE TABLE ----------
        y = ensureSpace(12 + 5, y);
        const nomineeTop = y;
        const nomineeHeight = 12;

        const colNominee = tableLeft;
        const colOwnerRelation = colNominee + tableWidth * 0.35;
        const colAge = colOwnerRelation + tableWidth * 0.3;
        const colMobile = colAge + tableWidth * 0.1;

        doc.rect(tableLeft, nomineeTop, tableWidth, nomineeHeight);
        doc.line(colOwnerRelation, nomineeTop, colOwnerRelation, nomineeTop + nomineeHeight);
        doc.line(colAge, nomineeTop, colAge, nomineeTop + nomineeHeight);
        doc.line(colMobile, nomineeTop, colMobile, nomineeTop + nomineeHeight);

        doc.setFontSize(8);
        doc.setFont(undefined, 'bold');
        doc.text('NOMINEE NAME', colNominee + 2, nomineeTop + 4);
        doc.text('OWNER RELATION', colOwnerRelation + 2, nomineeTop + 4);
        doc.text('AGE', colAge + 2, nomineeTop + 4);
        doc.text('MOBILE NUMBER', colMobile + 2, nomineeTop + 4);

        doc.setFont(undefined, 'normal');
        const rowY = nomineeTop + 8;
        doc.text(nomineeName, colNominee + 2, rowY);
        doc.text(nomineeRelation, colOwnerRelation + 2, rowY);
        doc.text(nomineeAge, colAge + 2, rowY);
        doc.text(nomineeMobile, colMobile + 2, rowY);

        y = nomineeTop + nomineeHeight + 4;

        // ---------- VEHICLE TABLE ----------
        y = ensureSpace(28 + 4, y);
        const vehicleTop = y;
        const vehicleHeight = 28;

        const modelCol = tableLeft;
        const qtyCol = tableLeft + tableWidth * 0.58;
        const priceCol = qtyCol + tableWidth * 0.12;
        const amtCol = priceCol + tableWidth * 0.15;

        doc.rect(tableLeft, vehicleTop, tableWidth, vehicleHeight);
        doc.line(qtyCol, vehicleTop, qtyCol, vehicleTop + vehicleHeight);
        doc.line(priceCol, vehicleTop, priceCol, vehicleTop + vehicleHeight);
        doc.line(amtCol, vehicleTop, amtCol, vehicleTop + vehicleHeight);

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('MODEL', modelCol + 2, vehicleTop + 5);
        doc.text('QTY', qtyCol + 2, vehicleTop + 5);
        doc.text('PRICE', priceCol + 2, vehicleTop + 5);
        doc.text('AMOUNT', amtCol + 2, vehicleTop + 5);

        doc.setFont(undefined, 'normal');
        const vRowY = vehicleTop + 11;

        const modelLines = doc.splitTextToSize(
          modelName || '—',
          qtyCol - modelCol - 4
        );
        doc.text(modelLines, modelCol + 2, vRowY);

        doc.text(String(vehicleQty).trim(), qtyCol + 5, vRowY);
        doc.text(formatCurrency(unitPrice), priceCol + 2, vRowY);
        doc.text(formatCurrency(lineAmount), amtCol + 2, vRowY);

        const detailsY = vehicleTop + vehicleHeight - 8;
        doc.setFontSize(8);
        doc.text(`Chassis: ${chassis}`, modelCol + 2, detailsY);
        doc.text(`Engine: ${engine}`, modelCol + 2, detailsY + 4);
        doc.text(`Color: ${color}`, priceCol + 2, detailsY);

        y = vehicleTop + vehicleHeight + 3;

        // ---------- ACCESSORIES TABLE ----------
        const accRowHeight = 6;
        const accHeaderHeight = 7;
        const accRows = Math.max(accessories.length, 2);
        const accTableHeight = accHeaderHeight + accRows * accRowHeight;

        y = ensureSpace(accTableHeight + 3, y);
        const accTop = y;

        const accNameCol = tableLeft;
        const accQtyCol = tableLeft + tableWidth * 0.58;
        const accPriceCol = accQtyCol + tableWidth * 0.12;
        const accAmtCol = accPriceCol + tableWidth * 0.15;

        doc.rect(tableLeft, accTop, tableWidth, accTableHeight);
        doc.line(accQtyCol, accTop, accQtyCol, accTop + accTableHeight);
        doc.line(accPriceCol, accTop, accPriceCol, accTop + accTableHeight);
        doc.line(accAmtCol, accTop, accAmtCol, accTop + accTableHeight);

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('ACCESSORIES', accNameCol + 2, accTop + 5);
        doc.text('QTY', accQtyCol + 2, accTop + 5);
        doc.text('PRICE', accPriceCol + 2, accTop + 5);
        doc.text('AMOUNT', accAmtCol + 2, accTop + 5);

        doc.setFont(undefined, 'normal');
        let accY = accTop + accHeaderHeight + 4;

        accessories.forEach((a, index) => {
          if (index >= accRows) return;
          const qty = a.qty || a.quantity || 1;
          const price = a.price || a.unitPrice || a.rate || 0;
          const amount = a.amount || (qty * price);

          doc.text(safe(a.name || a.title || `Accessory ${index + 1}`), accNameCol + 2, accY);
          doc.text(String(qty).trim(), accQtyCol + 2, accY);
          doc.text(formatCurrency(price), accPriceCol + 2, accY);
          doc.text(formatCurrency(amount), accAmtCol + 2, accY);

          accY += accRowHeight;
        });

        y = accTop + accTableHeight + 3;

        // ---------- TOTALS (right) ----------
        const totalsLabels = [
          'Vehicle Amount',
          'Accessories Amount',
          'Grand Total (On-road)',
          'Paid',
          'Due'
        ];
        const totalsValues = [
          formatCurrency(vehicleAmount),
          formatCurrency(accessoriesTotal),
          formatCurrency(totalAmount),
          formatCurrency(totalPaid),
          formatCurrency(dueAmount)
        ];

        const labelX = pageWidth - margin - 60;
        let tY = y;

        for (let i = 0; i < totalsLabels.length; i++) {
          doc.setFontSize(9);
          doc.setFont(undefined, i === 2 ? 'bold' : 'normal');
          doc.text(totalsLabels[i], labelX, tY);
          doc.text(totalsValues[i] || '-', pageWidth - margin - 5, tY, {
            align: 'right'
          });
          tY += 5;
        }

        y = tY + 3;

        // ---------- AMOUNT IN WORDS ----------
        const wordsHeight = 10;
        y = ensureSpace(wordsHeight + 3, y);
        const wordsTop = y;

        doc.rect(tableLeft, wordsTop, tableWidth, wordsHeight);

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('Amount (in words)', tableLeft + 2, wordsTop + 4);

        doc.setFont(undefined, 'normal');
        const wordsLines = amountInWords
          ? doc.splitTextToSize(amountInWords, tableWidth - 40)
          : [];
        if (wordsLines.length) {
          doc.text(wordsLines, tableLeft + 2, wordsTop + 8);
        }

        y = wordsTop + wordsHeight + 3;

        // ---------- PAYMENT MODES TABLE ----------
        const payRowHeight = 6;
        const payHeaderHeight = 7;
        const payBodyRows = orderedModes.length;
        const payHeight = payHeaderHeight + payBodyRows * payRowHeight;

        y = ensureSpace(payHeight + 3, y);
        const payTop = y;

        const payModeCol = tableLeft;
        const payRefCol = tableLeft + tableWidth * 0.4;
        const payAmtCol = tableLeft + tableWidth * 0.75;

        doc.rect(tableLeft, payTop, tableWidth, payHeight);
        doc.line(payRefCol, payTop, payRefCol, payTop + payHeight);
        doc.line(payAmtCol, payTop, payAmtCol, payTop + payHeight);

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('MODE', payModeCol + 2, payTop + 5);
        doc.text('REFERENCE', payRefCol + 2, payTop + 5);
        doc.text('AMOUNT', payAmtCol + 2, payTop + 5);

        doc.setFont(undefined, 'normal');
        let payY = payTop + payHeaderHeight + 4;

        orderedModes.forEach((m) => {
          const p = paymentMap[m] || {};
          doc.text(m, payModeCol + 2, payY);
          doc.text(safe(p.reference, m === 'CASH' ? 'NA' : ''), payRefCol + 2, payY);
          doc.text(
            formatCurrency(p.amount || 0),
            pageWidth - margin - 5,
            payY,
            { align: 'right' }
          );
          payY += payRowHeight;
        });

        y = payTop + payHeight + 3;

        // ---------- FINANCE & RTO TABLE ----------
        const finRegHeight = 32;
        y = ensureSpace(finRegHeight + 3, y);
        const finRegTop = y;
        const finRegMidX = tableLeft + tableWidth / 2;

        doc.rect(tableLeft, finRegTop, tableWidth, finRegHeight);
        doc.line(finRegMidX, finRegTop, finRegMidX, finRegTop + finRegHeight);

        doc.setFontSize(9);
        doc.setFont(undefined, 'bold');
        doc.text('FINANCE DETAILS', tableLeft + 2, finRegTop + 5);
        doc.text('REGISTRATION / RTO DETAILS', finRegMidX + 2, finRegTop + 5);

        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');

        let fY = finRegTop + 10;
        const leftX = tableLeft + 2;
        const rightX = finRegMidX + 2;

        const finLines = [
          `Company : ${safe(finance.company, '')}`,
          `Financer Name : ${safe(finance.financerName, '')}`,
          `Loan Amount : ${formatCurrency(finance.loanAmount) || ''}`,
          `Down Payment : ${formatCurrency(finance.downPayment) || ''}`,
          `Disbursement : ${formatCurrency(finance.disbursementAmount) || ''}`,
          `EMI : ${formatCurrency(finance.emi) || ''}`,
          `Tenure (Months) : ${safe(finance.tenureMonths, '')}`
        ];
        finLines.forEach(line => {
          doc.text(line, leftX, fY);
          fY += 4;
        });

        let rY = finRegTop + 10;
        const regLines = [
          `Registration No. : ${safe(registration.number, '')}`,
          `RC Applied Date : ${formatDate(registration.rcAppliedDate)}`,
          `Reg. Payment Date : ${formatDate(registration.paymentDate)}`,
          `HSRP Applied Date : ${formatDate(registration.hsrpAppliedDate)}`,
          `HSRP Receiving (Courier) : ${safe(registration.hsrpCourier, '')}`,
          `RC Print Date : ${formatDate(registration.rcPrintDate)}`,
          `Sales Mode : ${safe(data.salesMode, '').toUpperCase()}`
        ];
        regLines.forEach(line => {
          doc.text(line, rightX, rY);
          rY += 4;
        });

        y = finRegTop + finRegHeight + 3;

        // ---------- BANK + QR + SIGN BLOCK ----------
        const bankHeight = 34;
        y = ensureSpace(bankHeight + 8, y);
        const bankTop = y;

        doc.rect(tableLeft, bankTop, tableWidth, bankHeight);

        const bankColWidth = tableWidth / 3;
        const bankLeft = tableLeft;
        const qrLeft = tableLeft + bankColWidth;
        const signLeft = tableLeft + 2 * bankColWidth;

        // inner vertical lines
        doc.line(qrLeft, bankTop, qrLeft, bankTop + bankHeight);
        doc.line(signLeft, bankTop, signLeft, bankTop + bankHeight);

        // ---------- FOOTER ENQUIRY NUMBERS ----------
        y = ensureSpace(6, y);
        doc.setFontSize(7);
        doc.setFont(undefined, 'normal');
        doc.text('SALES ENQ NO: 8090086427', tableLeft + 2, y);
        doc.text(
          'RC/HSRP ENQ NO: 8528414311',
          tableLeft + tableWidth / 3,
          y
        );
        doc.text(
          'PARTS ENQ NO: 9648261555',
          tableLeft + (2 * tableWidth) / 3,
          y
        );
        doc.text(
          'SERVICE: 8090231724/8400630140',
          tableLeft + tableWidth - 2,
          y,
          { align: 'right' }
        );

        // ---------- OUTPUT ----------
        if (download) {
          const fileName = `Invoice_${invoiceNo}_${Date.now()}.pdf`;
          doc.save(fileName);
          this.snack = {
            show: true,
            color: 'success',
            text: 'PDF downloaded successfully'
          };
        } else {
          const pdfBlob = doc.output('blob');
          const pdfUrl = URL.createObjectURL(pdfBlob);
          window.open(pdfUrl, '_blank');
          setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
          this.snack = {
            show: true,
            color: 'success',
            text: 'PDF preview opened in new tab'
          };
        }
      } catch (error) {
        console.error('Error generating PDF:', error);
        this.snack = {
          show: true,
          color: 'error',
          text: `Failed to generate PDF: ${error.message}`
        };
      } finally {
        this.generatingPDF = false;
      }
    }
  }
};
</script>
<style scoped>
.section-wrap {
  margin-bottom: 15px;
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
}
.section-head {
  font-weight: bold;
  margin-bottom: 16px;
  font-size: 1.1em;
  color: #1976d2;
}
</style>