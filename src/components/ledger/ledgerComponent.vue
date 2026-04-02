<template>
  <v-card class="pa-6" elevation="4">
    <div class="headline mb-4">Vendor Ledger - ABC Traders</div>

    <!-- Transaction entry form (static/readonly for display) -->
    <v-form>
      <v-layout wrap>
        <v-flex xs4>
          <v-text-field label="Date" value="2025-10-15" readonly></v-text-field>
        </v-flex>
        <v-flex xs4>
          <v-select :items="types" label="Type" value="Invoice" disabled></v-select>
        </v-flex>
        <v-flex xs4>
          <v-text-field label="Reference No." value="INV-1001" readonly></v-text-field>
        </v-flex>
        <v-flex xs6>
          <v-text-field label="Description" value="Initial Purchase" readonly></v-text-field>
        </v-flex>
        <v-flex xs3>
          <v-text-field label="Debit (Payment)" value="0.00" readonly></v-text-field>
        </v-flex>
        <v-flex xs3>
          <v-text-field label="Credit (Invoice)" value="5000.00" readonly></v-text-field>
        </v-flex>
      </v-layout>
      <v-btn color="primary" class="mt-3" disabled>Add Entry</v-btn>
    </v-form>

    <v-divider class="my-4"></v-divider>

    <!-- Ledger table (static data) -->
    <v-data-table
      :headers="headers"
      :items="staticLedger"
      :footer-props="{ 'items-per-page-options': [10, 25, 50] }"
      disable-pagination
      hide-default-footer
    >
      <template v-slot:item.balance="{ item }">
        <span :class="item.balance < 0 ? 'text-error' : ''">₹{{ item.balance.toFixed(2) }}</span>
      </template>
    </v-data-table>

    <div class="mt-4 font-weight-bold">Current Balance: ₹{{ staticLedger[staticLedger.length-1].balance.toFixed(2) }}</div>
  </v-card>
</template>

<script>
export default {
  data() {
    return {
      types: [
        'Invoice',
        'Payment',
        'Credit Note',
        'Debit Note',
        'Return',
        'Other'
      ],
      headers: [
        { text: 'Date', value: 'date' },
        { text: 'Type', value: 'type' },
        { text: 'Reference', value: 'refNo' },
        { text: 'Description', value: 'description' },
        { text: 'Debit', value: 'debit' },
        { text: 'Credit', value: 'credit' },
        { text: 'Balance', value: 'balance' }
      ],
      staticLedger: [
        // Example entries (date, type, refNo, description, debit, credit, balance)
        { date: '2025-10-15', type: 'Invoice',    refNo: 'INV-1001', description: 'Initial Purchase', debit: 0,    credit: 5000, balance: 5000 },
        { date: '2025-10-18', type: 'Payment',    refNo: 'PAY-1001', description: 'Bank transfer',    debit: 1000, credit: 0,    balance: 4000 },
        { date: '2025-10-19', type: 'Invoice',    refNo: 'INV-1002', description: 'Parts Supply',      debit: 0,    credit: 3000, balance: 7000 },
        { date: '2025-10-20', type: 'Credit Note', refNo: 'CN-55',   description: 'Return/Discount',   debit: 500,  credit: 0,    balance: 6500 }
      ]
    }
  }
}
</script>

<style scoped>
.text-error { color: #b00020; }
</style>
