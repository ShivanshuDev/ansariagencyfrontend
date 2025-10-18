<template>
  <div>
    <v-row class="align-center">
      <v-col cols="12" md="4">
        <v-text-field v-model.number="amountLocal" label="Amount paid (₹)" type="number" min="0" dense outlined @input="onAmount" />
      </v-col>

      <v-col cols="12" md="4">
        <v-select :items="paymentTypes" label="Payment type" v-model="paymentTypeLocal" dense outlined clearable />
      </v-col>

      <v-col cols="12" md="4" class="text-right">
        <div>Due amount: <strong>₹{{ formatMoney(dueAmount) }}</strong></div>
        <div v-if="changeDue>0" class="text-success">Change: ₹{{ formatMoney(changeDue) }}</div>
      </v-col>
    </v-row>

    <v-row class="mt-4" justify="end">
      <v-col cols="12" md="6" class="text-right">
        <v-btn text small @click="$emit('clear-all')">Clear</v-btn>
        <v-btn class="ml-2" color="secondary" @click="$emit('download-pdf')" :disabled="!hasItems">Export PDF</v-btn>
      </v-col>
    </v-row>
  </div>
</template>

<script>
export default {
  name: 'SummaryPayment',
  props: {
    amountPaid: { default: 0 },
    paymentType: { default: null },
    paymentTypes: { type: Array, default: () => [] },
    dueAmount: { default: 0 },
    changeDue: { default: 0 },
    hasItems: { type: Boolean, default: false }
  },
  data() { return { amountLocal: this.amountPaid, paymentTypeLocal: this.paymentType } },
  watch: {
    amountPaid(val) { this.amountLocal = val },
    paymentType(val) { this.paymentTypeLocal = val },
    amountLocal(val) { this.$emit('update:amountPaid', Number(val || 0)) },
    paymentTypeLocal(val) { this.$emit('update:paymentType', val) }
  },
  methods: { onAmount() { if (this.amountLocal===''||this.amountLocal==null) this.amountLocal=0 } , formatMoney(v){ return Number(v||0).toFixed(2) } }
}
</script>
