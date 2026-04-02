<template>
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

      <tbody>
        <!-- IMPORTANT: no :key on the <template> -->
        <template v-for="it in items">
          <!-- real elements have keys -->
          <tr :key="it.id">
            <td><div class="font-weight-medium">{{ it.label }}</div></td>
            <td class="text-left">{{ it.hsn || '—' }}</td>
            <td class="text-center">{{ it.kitGiven ? 'Yes' : 'No' }}</td>
            <td class="text-right">{{ it.quantity }} × ₹{{ formatMoney(it.price) }}</td>
            <td class="text-right">{{ formatMoney(it.discount) }}</td>
            <td class="text-right">{{ (it.cgst || 0) }}%</td>
            <td class="text-right">{{ (it.sgst || 0) }}%</td>
            <td class="text-right font-weight-medium">₹{{ formatMoney(it.totalWithTax) }}</td>
            <td class="text-right">
              <v-btn icon small color="primary" @click="$emit('edit', it)"><v-icon small>mdi-pencil</v-icon></v-btn>
              <v-btn icon small color="red" @click="$emit('remove', it)"><v-icon small>mdi-delete</v-icon></v-btn>
            </td>
          </tr>

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
</template>

<script>
export default {
  name: 'InvoiceTable',
  props: {
    items: { type: Array, default: () => [] }
  },
  methods: {
    formatMoney(v) { return Number(v || 0).toFixed(2) }
  }
}
</script>

<style scoped>
.fixed-table-container { height: 300px; max-height: 420px; overflow: auto; border-radius: 6px; }
</style>
