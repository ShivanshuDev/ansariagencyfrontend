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

    <v-card-actions style="display:flex; flex-direction:column; border-top:1px solid gray;">
      <div style="display:flex; flex-direction:row; justify-content:space-between; width:100%;">
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
      searching: false,
      searchedOnce: false,
      searchError: '',
      invoices: [],           // store invoices returned by /getByInvoice
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
      // validation rules
      rReq: v => !!(v && String(v).trim()) || 'Required',
      optMoney: v => (v==='' || v===null || (!isNaN(Number(v)) && Number(v)>=0)) || 'Enter ≥ 0',
      optInteger: v => (v==='' || v===null || (/^\d+$/.test(String(v)))) || 'Enter integer',
      optPhone: v => (!v || /^\d{10}$/.test(String(v))) || '10-digit only'
    }
  },
  computed: {
    BASE () {
      return (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '');
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
      }
      if (data.registration) {
        this.form.registration = { ...this.form.registration, ...data.registration };
      }
      if (data.insurance) {
        this.form.insurance = { ...this.form.insurance, ...data.insurance };
      }
      if (data.receiving) {
        this.form.receiving = { ...this.form.receiving, ...data.receiving };
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
        // If a specific invoice exists (use first one by default), merge it.
        let baseInvoice = null;
        if (this.invoices && this.invoices.length > 0) {
          baseInvoice = { ...this.invoices[0] }; // shallow clone first invoice
        }

        // Build the merged payload — keep most invoice fields, but override sections we edited
        const mergedPayload = baseInvoice
          ? {
              ...baseInvoice,
              billNumber: baseInvoice.billNumber || baseInvoice.invoiceNumber || undefined,
              invoiceNumber: baseInvoice.invoiceNumber || baseInvoice.billNumber || undefined,
              chassisNumber: this.form.chassisNumber || baseInvoice.chassisNumber || (baseInvoice.vehicle && baseInvoice.vehicle.chassisNumber),
              salesMode: this.form.salesMode || baseInvoice.salesMode,
              finance: { ...(baseInvoice.finance || {}), ...this.form.finance },
              registration: { ...(baseInvoice.registration || {}), ...this.form.registration },
              insurance: { ...(baseInvoice.insurance || {}), ...this.form.insurance },
              receiving: { ...(baseInvoice.receiving || {}), ...this.form.receiving },
              customer: baseInvoice.customer || {},
              vehicle: baseInvoice.vehicle || {},
              totals: baseInvoice.totals || {},
              tax: baseInvoice.tax || {},
              status: baseInvoice.status || 'CREATED',
              meta: baseInvoice.meta || {},
              pk: baseInvoice.pk,
              sk: baseInvoice.sk,
              gsi1pk: baseInvoice.gsi1pk,
              updatedAt: new Date().toISOString()
            }
          : {
              // No invoice found — send a payload with chassis + all form data
              chassisNumber: this.form.chassisNumber,
              salesMode: this.form.salesMode,
              finance: this.form.finance,
              registration: this.form.registration,
              insurance: this.form.insurance,
              receiving: this.form.receiving,
              updatedAt: new Date().toISOString()
            };

        console.log('Sending payload to updateCustomerInvoice:', mergedPayload);

        // POST to update endpoint (use fetch to keep parity with original code)
        const response = await fetch(`${this.BASE}/updateCustomerInvoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mergedPayload)
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

        // Emit event so parent can refresh
        this.$emit('updated', mergedPayload);
        this.$emit('close');

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

    // --- Fetch invoice by bill/invoice number ---
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
        const billNumber = invoiceNumber;
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'getByInvoice',
          { params: { billNumber } }
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

          if (inv.finance) this.form.finance = { ...this.form.finance, ...inv.finance };
          if (inv.registration) this.form.registration = { ...this.form.registration, ...inv.registration };
          if (inv.insurance) this.form.insurance = { ...this.form.insurance, ...inv.insurance };
          if (inv.receiving) this.form.receiving = { ...this.form.receiving, ...inv.receiving };

          if (this.form.receiving.mobile) {
            const m = String(this.form.receiving.mobile).replace(/\D/g, '').slice(0, 10);
            this.$set(this.form.receiving, 'mobile', m);
          }

          console.log('Prefilled form from invoice:', inv);
        } else {
          // multiple invoices returned — UI shows cards, user can choose which one to use
          console.log('Multiple invoices returned:', found.length);
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
