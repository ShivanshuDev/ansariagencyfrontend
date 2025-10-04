<template>
  <v-card>
    <v-card-title>
      Spares Details - {{ partNumber || '—' }}
    </v-card-title>

    <v-card-text>
      <div v-if="item">
        <p><strong>Part Number:</strong> {{ item.partNumber }}</p>
        <p><strong>Part Name:</strong> {{ item.partName }}</p>
        <p><strong>Quantity:</strong> {{ item.quantity }}</p>
        <p><strong>Price:</strong> {{ item.price }}</p>
        <p><strong>Invoice Number:</strong> {{ item.invoiceNumber }}</p>
        <p><strong>Invoice Date:</strong> {{ item.invoiceDate }}</p>
        <!-- add more fields as needed -->
      </div>
      <div v-else>
        Loading...
      </div>
    </v-card-text>
  </v-card>
</template>

<script>
import axios from 'axios';
export default {
  name: 'SparesDetails',
  data() {
    return {
      partNumber: this.$route.params.partNumber || null,
      item: null,
    };
  },
  async created() {
    if (this.partNumber) {
      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}parts/${this.partNumber}`;
        const res = await axios.get(url);
        // backend may return object or array
        this.item = Array.isArray(res.data) ? res.data[0] : res.data;
      } catch (err) {
        console.error(err);
      }
    } else {
      // optional: load something else or show message
    }
  },
};
</script>
