<template>
  <div class="invoice-generator">
    <h2>Create Inventry Bill</h2>
    <!-- Client Selection -->
    <div style="display:flex; flex-direction:row;">
      <div style="margin-bottom:20px;">
        <label for="client-select">Client:</label>
        <select style="width:250px; margin-left:20px; margin-right:94px;" id="client-select" v-model="selectedClient" @change="fillClientAddress">
          <option value="" disabled>Select Client</option>
          <option v-for="client in clients" :key="client.clientId" :value="client.name">
            {{ client.name }}
          </option>
        </select>
      </div>

      <div class="form-group item-search" style="position: relative; display: flex; align-items: flex-start;">
        <div>
          <label for="inventory-search">Search Inventory:</label>
          <input
            id="inventory-search"
            type="text"
            v-model="inventoryQuery"
            placeholder="Enter inventory model or chassis"
            @input="searchInventory"
            autocomplete="off"
            style="height:50px; width:250px; padding:8px; border:3px solid black; border-radius:5px;"
          />
          <ul v-if="searchResults.length" class="suggestions-list" style="position: absolute; background: white; border: 1px solid #ccc; z-index: 10; width: 250px; max-height: 180px; overflow-y: auto;">
            <li
              v-for="item in searchResults"
              :key="item.chassisNumber"
              @click="selectInventoryItem(item)"
              class="suggestion-item"
              style="padding: 6px; cursor: pointer;"
            >
              {{ item.modelName }} ({{ item.chassisNumber }})
            </li>
          </ul>
        </div>

        <div style="display: flex; flex-direction: column; margin-left: 20px; margin-top: 24px;">
          <label><input type="checkbox" v-model="toolsKit" /> Tools Kit</label>
          <label><input type="checkbox" v-model="serviceBook" /> Service Book</label>
          <label><input type="checkbox" v-model="accessories" /> Accessories</label>
        </div>
      </div>
    </div>

    <button @click="addItem" class="btn-add" :disabled="!selectedItem" style="margin-top: 10px;">Add Item</button>

    <!-- Items Table -->
    <table class="items-table" style="width: 100%; margin-top: 20px; border-collapse: collapse;">
      <thead>
        <tr>
          <th>#</th>
          <th>Particulars</th>
          <th>Chassis Number</th>
          <th>Engine Number</th>
          <th>Qty</th>
          <th>Rate</th>
          <th>Discount</th>
          <th>Taxable</th>
          <th>HSN</th>
          <th>SGST</th>
          <th>CGST</th>
          <th>Tools Kit</th>
          <th>Service Book</th>
          <th>Accessories</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(item, index) in billItems" :key="index" style="border-top: 1px solid #ddd;">
          <td>{{ index + 1 }}</td>
          <td>{{ item.modelName }}</td>
          <td>{{ item.chassisNumber }}</td>
          <td>{{ item.engineNumber }}</td>
          <td>{{ item.qty }}</td>
          <td>
            <input type="number" step="0.01" v-model.number="item.rate" min="0" @input="updateTotals" style="width: 80px;" />
          </td>
          <td>
            <input type="number" step="0.01" v-model.number="item.discount" min="0" @input="updateTotals" style="width: 80px;" />
          </td>
          <td>
            <input type="number" step="0.01" v-model.number="item.taxable" min="0" :max="item.qty * item.rate" @input="updateTotals" style="width: 80px;" />
          </td>
          <td>
            <input type="text" v-model="item.hsn" style="width: 80px;" />
          </td>
          <td>
            <input type="number" step="0.01" v-model.number="item.sgst" min="0" @input="updateTotals" style="width: 80px;" />
          </td>
          <td>
            <input type="number" step="0.01" v-model.number="item.cgst" min="0" @input="updateTotals" style="width: 80px;" />
          </td>
          <td>{{ item.toolsKit ? "Yes" : "No" }}</td>
          <td>{{ item.serviceBook ? "Yes" : "No" }}</td>
          <td>{{ item.accessories ? "Yes" : "No" }}</td>
          <td>
            {{ ((item.taxable || (item.qty * item.rate - item.discount)) + item.sgst + item.cgst).toFixed(2) }}
          </td>
        </tr>
        <tr v-if="billItems.length === 0">
          <td colspan="15" class="empty-row" style="text-align: center;">No items added</td>
        </tr>
      </tbody>
    </table>

    <!-- Totals -->
    <div class="totals" style="margin-top: 20px;">
      <p>Item Count {{ billItems.length }}</p>
      <div>
        <label>PAYMENT METHOD</label>
        <select style="width:250px; margin-left:20px; margin-right:84px;">
          <option>SELECT PAYMENT TYPE</option>
          <option>CHEQUE</option>
          <option>CASH</option>
          <option>CARD</option>
          <option>CREDIT</option>
        </select>
      </div>
      <div>
        <label>Amount Paid</label>
        <input
          style="width:250px; height:45px; border-radius:5px; margin-left:20px; margin-right:94px; border:1px solid black;"
          type="number"
          step="0.01"
          v-model="amountPaind"
          min="0"
          @input="amountPaindData"
        />
      </div>
      <div>
        <label>Due Amount</label>
        <input
          style="width:250px; height:45px; border-radius:5px; margin-left:20px; margin-right:94px; border:1px solid black;"
          type="number"
          step="0.01"
          v-model="amountPaind"
          min="0"
        />
      </div>
      <p><strong>Grand Total:</strong> ₹{{ grandTotal.toFixed(2) }}</p>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      inventoryQuery: "",
      searchResults: [],
      selectedItem: null,
      clients: [],
      selectedClient: null,
      inventoryList: [],
      billItems: [],
      partsTotal: 0,
      labourTotal: 0,
      toolsKit: false,
      serviceBook: false,
      accessories: false,
      amountPaind: 0,
    };
  },
  mounted() {
    this.fetchInventory();
    this.fetchClients();
  },
  methods: {
    async searchInventory() {
      if (!this.inventoryQuery || this.inventoryQuery.length < 2) {
        this.searchResults = [];
        return;
      }
      try {
        const res = await axios.get(
          `${process.env.VUE_APP_AGENCY_BACKEND_URL}searchInventoryByChassis`,
          {
            params: { query: this.inventoryQuery },
          }
        );
        this.searchResults = res.data.items || [];
      } catch (err) {
        console.error("Inventory Search API error:", err);
        this.searchResults = [];
      }
    },

    selectInventoryItem(item) {
      this.selectedItem = item;
      this.inventoryQuery = `${item.modelName} (${item.chassisNumber})`;
      this.searchResults = [];
    },
    async fetchInventory() {
      try {
        const res = await axios.get(
          `${process.env.VUE_APP_AGENCY_BACKEND_URL}getAllInventry`
        );
        this.inventoryList = res.data.items || [];
      } catch (err) {
        console.error("Failed to fetch inventory:", err);
      }
    },
    async fetchClients() {
      try {
        const res = await axios.get(
          `${process.env.VUE_APP_AGENCY_BACKEND_URL}getAllClient`
        );
        this.clients = res.data.items || [];
      } catch (err) {
        console.error("Failed to fetch clients:", err);
      }
    },
    fillClientAddress() {
      console.log("Selected client:", this.selectedClient);
    },
    addItem() {
      this.inventoryQuery = "";
      if (!this.selectedItem) return;
      const rate = parseFloat(this.selectedItem.rate) || 0;
      const qty = 1;
      const discount = parseFloat(this.selectedItem.discount || 0);
      const taxable = qty * rate - discount;

      const item = {
        modelName: this.selectedItem.modelName,
        chassisNumber: this.selectedItem.chassisNumber,
        engineNumber: this.selectedItem.engineNumber,
        rate,
        qty,
        discount,
        taxable,
        hsn: this.selectedItem.hsn || "",
        sgst: parseFloat(this.selectedItem.sgst || 0),
        cgst: parseFloat(this.selectedItem.cgst || 0),
        toolsKit: this.toolsKit,
        serviceBook: this.serviceBook,
        accessories: this.accessories,
      };

      this.billItems.push(item);
      this.selectedItem = null;

      // Clear checkboxes after adding item
      this.toolsKit = false;
      this.serviceBook = false;
      this.accessories = false;

      this.updateTotals();
    },
    updateTotals() {
      this.partsTotal = this.billItems.reduce((sum, i) => {
        const taxableValue = i.taxable || i.qty * i.rate - i.discount;
        return sum + taxableValue;
      }, 0);
      this.labourTotal = 0;
    },
    amountPaindData() {
      // Logic for handling amount paid or due can be added here
    },
  },
  computed: {
    grandTotal() {
      const taxes = this.billItems.reduce((sum, i) => sum + i.sgst + i.cgst, 0);
      return this.partsTotal + this.labourTotal + taxes;
    },
  },
};
</script>

<style scoped>
.invoice-generator {
  max-width: 1800px;
  margin: 32px auto;
  padding: 24px;
  background: white;
  color: #111;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
  border-radius: 8px;
}

h2 {
  font-weight: 700;
  color: #000;
  margin-bottom: 24px;
  text-align: center;
  letter-spacing: 0.03em;
}

.form-group {
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
}

label {
  font-weight: 600;
  color: #222;
  min-width: 90px;
}

select {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1.5px solid #222;
  border-radius: 6px;
  background-color: #fff;
  font-size: 1rem;
  color: #222;
  outline: none;
  transition: border-color 0.3s ease;
}

select:focus {
  border-color: #000;
}

.item-select {
  gap: 8px;
}

.btn-add {
  background-color: #000;
  border: none;
  color: #fff;
  font-weight: 700;
  padding: 8px 18px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-add:disabled {
  background-color: #555;
  cursor: not-allowed;
}

.btn-add:hover:not(:disabled) {
  background-color: #222;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 28px;
  font-size: 0.95rem;
  color: #111;
  box-shadow: 0 0 12px rgb(0 0 0 / 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.items-table th,
.items-table td {
  border: 1px solid #ddd;
  padding: 10px 12px;
  text-align: center;
  vertical-align: middle;
  width: 8.33%; /* 12 columns */
  box-sizing: border-box;
}

.items-table th {
  background-color: #000;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.items-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

.items-table tbody tr:nth-child(even) {
  background-color: #f9f9f9;
}

/* Wrap the tbody in a scrollable container */
.items-table tbody {
  display: block;
  max-height: 400px;
  overflow-y: auto;
}

/* Make thead fixed */
.items-table thead,
.items-table tbody tr {
  display: table;
  width: 100%;
  table-layout: fixed;
}

.items-table thead {
  width: calc(100% - 1em); /* scrollbar width */
  background-color: #000;
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.02em;
  position: sticky;
  top: 0;
  z-index: 10;
}

.items-table input[type="number"],
.items-table input[type="text"] {
  width: 80px;
  padding: 4px 6px;
  border-radius: 4px;
  border: 1px solid #aaa;
  font-size: 0.9rem;
  text-align: center;
  color: #222;
  outline: none;
}

.items-table input[type="text"] {
  width: 100px;
  text-align: left;
}

.items-table input[type="number"]:focus,
.items-table input[type="text"]:focus {
  border-color: #000;
}

.empty-row {
  text-align: center;
  font-style: italic;
  color: #666;
  padding: 16px 0;
}

.totals {
  margin-top: 32px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #111;
  display: flex;
  justify-content: space-around;
  gap: 48px;
}

.totals p {
  margin: 0;
}
.suggestions-list {
  border: 1px solid #ccc;
  max-height: 150px;
  overflow-y: auto;
  position: absolute;
  background: #fff;
  width: 300px;
  z-index: 10;
  list-style: none;
  border: 1px solid green;
  margin-top:10px;
  margin-left:400px;
  padding: 0;
}
.suggestion-item {
  padding: 8px;
  cursor: pointer;
}
.suggestion-item:hover {
  background-color: #eee;
}

</style>
