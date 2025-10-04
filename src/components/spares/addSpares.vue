<template>
  <div class="add-spare-form">
    <h2>Add Spares / Parts</h2>

    <!-- COMMON INVOICE -->
    <div style="margin-bottom: 20px; display:flex; flex-direction:row; justify-content:space-between;">
      <div style="display:flex; flex-direction:row;">
        <div class="field-details">
          <label>Invoice Number *</label>
          <input
            type="text"
            v-model="commonInvoiceNumber"
            placeholder="Invoice Number *"
          />
          <div v-if="commonErrors.invoiceNumber" class="error-msg">{{ commonErrors.invoiceNumber }}</div>
        </div>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <div class="field-details">
          <label>Invoice Date *</label>
          <input
            type="date"
            v-model="commonInvoiceDate"
            placeholder="Invoice Date *"
          />
          <div v-if="commonErrors.invoiceDate" class="error-msg">{{ commonErrors.invoiceDate }}</div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="actions" style="align-items:flex-end;">
        <button type="button" class="add-btn" @click="onReset">Reset Form</button>
      </div>
    </div>

    <!-- SINGLE-SPARE FORM (one spare item at a time) -->
    <div class="row">
      <div class="form-fields" style="width:100%; padding:0px 10px; margin:10px 0px 20px 0px;">
        <div class="fields-row">

          <div class="field-detail" :class="{'field-error': singleSpareErrors.partNumber}">
            <label>Part Number *</label>
            <input type="text" v-model="spareForm.partNumber" placeholder="Part Number *" />
            <div v-if="singleSpareErrors.partNumber" class="error-msg">{{ singleSpareErrors.partNumber }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': singleSpareErrors.partName}">
            <label>Part Name *</label>
            <input type="text" v-model="spareForm.partName" placeholder="Part Name *" />
            <div v-if="singleSpareErrors.partName" class="error-msg">{{ singleSpareErrors.partName }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': singleSpareErrors.price}">
            <label>Price *</label>
            <input type="number" v-model.number="spareForm.price" placeholder="Price *" min="0" />
            <div v-if="singleSpareErrors.price" class="error-msg">{{ singleSpareErrors.price }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': singleSpareErrors.rakNumber}">
            <label>Rak Number *</label>
            <input type="text" v-model="spareForm.rakNumber" placeholder="Rak Number *" />
            <div v-if="singleSpareErrors.rakNumber" class="error-msg">{{ singleSpareErrors.rakNumber }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': singleSpareErrors.qty}">
            <label>Qty *</label>
            <input type="number" v-model.number="spareForm.qty" placeholder="Qty *" min="1" />
            <div v-if="singleSpareErrors.qty" class="error-msg">{{ singleSpareErrors.qty }}</div>
          </div>

          <div style="flex:1; display:flex; align-items:flex-end; justify-content:flex-end; padding-top:9px;">
            <button class="create-btn" @click="saveSpareToTable" :disabled="isSavingSpare">
              {{ isSavingSpare ? 'Saving...' : 'Save Part' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <hr />

    <!-- TABLE OF ADDED SPARES -->
    <section>
      <h3>Added Parts</h3>
      <div v-if="addedSpares.length === 0" style="color:#666; margin-bottom:12px;">
        No parts added yet. Fill the form above and click <strong>Save Part</strong>.
      </div>

      <div v-else class="table-wrapper">
        <table class="spares-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No</th>
              <th>Invoice Date</th>
              <th>Part No</th>
              <th>Part Name</th>
              <th>Price</th>
              <th>Rak No</th>
              <th>Qty</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(s, idx) in addedSpares" :key="s._localId">
              <td>{{ idx + 1 }}</td>
              <td>{{ s.invoiceNumber }}</td>
              <td>{{ formatDate(s.invoiceDate) }}</td>
              <td>{{ s.partNumber }}</td>
              <td>{{ s.partName }}</td>
              <td>{{ s.price }}</td>
              <td>{{ s.rakNumber }}</td>
              <td>{{ s.qty }}</td>
              <td>
                <button class="remove-btn" @click="removeFromTable(idx)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <br />

    <!-- SUBMIT / CANCEL -->
    <section style="display:flex; justify-content:flex-end; gap:12px;">
      <button type="button" class="cancel-btn" @click="onResetEverything">Cancel</button>
      <button
        type="button"
        class="create-btn"
        @click="onClickSubmitAll"
        :disabled="isSubmitting || addedSpares.length === 0"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit All Parts' }}
      </button>
    </section>

    <!-- Confirmation Dialog for Submit All -->
    <v-dialog persistent v-model="showConfirmation" max-width="520px">
      <v-card>
        <v-card-title>
          Save confirmation
          <v-spacer />
          <v-btn icon @click="noConfirmation"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          Are you sure you want to save {{ addedSpares.length }} part(s)?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="submitAll">Yes</v-btn>
          <v-btn color="Alert" @click="noConfirmation">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      location="top right"
      :color="snackbar.color"
      variant="tonal"
    >
      {{ snackbar.message }}

      <template v-slot:actions>
        <v-btn icon @click="snackbar.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import axios from "axios";
import { v4 as uuidv4 } from "uuid";

export default {
  name: "AddSpareSingleForm",
  data() {
    return {
      userName: "",
      // common invoice fields
      commonInvoiceNumber: "",
      commonInvoiceDate: "",
      // form for a single spare item
      spareForm: this.getEmptySpareForm(),
      // collection of added spares (table)
      addedSpares: [],
      // parts master (for v-select)
      parts: [], // each part: { partNumber, partName, price, rakNumber, ... }
      // errors
      singleSpareErrors: {},
      commonErrors: {},
      // UI state
      isSavingSpare: false,
      isSubmitting: false,
      showConfirmation: false,
      snackbar: {
        show: false,
        message: "",
        timeout: 3000,
        color: "success",
      },
    };
  },
  mounted() {
    // load user from localStorage if exists
    const storedStr = localStorage.getItem("auth_user");
    if (storedStr) {
      try {
        const stored = JSON.parse(storedStr);
        if (stored && stored.userId) {
          this.userName = stored.userId;
          this.spareForm.addedBy = this.userName;
        }
      } catch (e) {
        console.warn("Error parsing auth_user from localStorage", e);
      }
    }

    this.fetchParts();
  },
  watch: {
    // keep the invoice fields for form in sync with common ones
    commonInvoiceNumber(newVal) {
      this.spareForm.invoiceNumber = newVal;
    },
    commonInvoiceDate(newVal) {
      this.spareForm.invoiceDate = newVal;
    },
    userName(newVal) {
      if (!this.spareForm.addedBy) this.spareForm.addedBy = newVal;
    },
  },
  methods: {
    getEmptySpareForm() {
      return {
        _localId: Date.now() + Math.floor(Math.random() * 1000),
        invoiceNumber: this.commonInvoiceNumber || "",
        invoiceDate: this.commonInvoiceDate || "",
        partNumber: "",
        partName: "",
        price: 0,
        rakNumber: "",
        qty: 1,
        addedBy: this.userName || "",
        notes: "",
        statusType: "DRAFT",
      };
    },

    formatDate(d) {
      if (!d) return "";
      return d;
    },

    ensureFormDefaults() {
      if (this.commonInvoiceNumber) this.spareForm.invoiceNumber = this.commonInvoiceNumber;
      if (this.commonInvoiceDate) this.spareForm.invoiceDate = this.commonInvoiceDate;
      if (this.userName) this.spareForm.addedBy = this.userName;
    },

    async fetchParts() {
      try {
        // example endpoint - change if needed
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + "getAllInventry");
        // Expecting an array of inventory items with fields like { partNumber, partName, price, rakNumber }
        if (res.data && Array.isArray(res.data)) {
          // map to minimal structure
          this.parts = res.data.map((p) => ({
            partNumber: p.partNumber || p.itemCode || p.chassisNumber || (p.uniqueId && String(p.uniqueId)),
            partName: p.partName || p.name || p.modelName || "",
            price: p.price || p.mrp || 0,
            rakNumber: p.rakNumber || p.rack || "",
            raw: p,
          })).filter((x) => x.partNumber); // keep only items with a partNumber
        } else {
          console.warn("Unexpected response for parts:", res.data);
          this.parts = [];
        }
      } catch (err) {
        console.error("Failed to fetch parts:", err);
        this.parts = [];
      }
    },

    onPartNumberChange(partNumber) {
      // autofill partName, price, rakNumber when selecting partNumber
      const p = this.parts.find((it) => it.partNumber === partNumber);
      if (p) {
        this.spareForm.partName = p.partName || "";
        // Only set price/rak if they are not manually filled or user wants overwrite
        this.spareForm.price = p.price || 0;
        this.spareForm.rakNumber = p.rakNumber || "";
      } else {
        // clear autofill
        this.spareForm.partName = "";
        this.spareForm.price = 0;
        this.spareForm.rakNumber = "";
      }
    },

    validateCommon() {
      this.commonErrors = {};
      if (!this.commonInvoiceNumber || !this.commonInvoiceNumber.toString().trim()) {
        this.commonErrors.invoiceNumber = "Invoice Number is required";
      }
      if (!this.commonInvoiceDate) {
        this.commonErrors.invoiceDate = "Invoice Date is required";
      }
      return Object.keys(this.commonErrors).length === 0;
    },

    validateSingleSpare() {
      this.singleSpareErrors = {};
      const s = this.spareForm;
      if (!s.partNumber || !s.partNumber.toString().trim()) this.singleSpareErrors.partNumber = "Part Number is required";
      if (!s.partName || !s.partName.toString().trim()) this.singleSpareErrors.partName = "Part Name is required";
      if (s.price === null || s.price === undefined || isNaN(s.price) || Number(s.price) < 0) this.singleSpareErrors.price = "Price is required and must be >= 0";
      if (!s.rakNumber || !s.rakNumber.toString().trim()) this.singleSpareErrors.rakNumber = "Rak Number is required";
      if (s.qty === null || s.qty === undefined || isNaN(s.qty) || Number(s.qty) < 1) this.singleSpareErrors.qty = "Qty is required and must be >= 1";
      if (!s.invoiceNumber || !s.invoiceNumber.toString().trim()) this.singleSpareErrors.invoiceNumber = "Invoice Number is required";
      if (!s.invoiceDate) this.singleSpareErrors.invoiceDate = "Invoice Date is required";

      return Object.keys(this.singleSpareErrors).length === 0;
    },

    saveSpareToTable() {
      this.ensureFormDefaults();
      const commonValid = this.validateCommon();
      const spareValid = this.validateSingleSpare();
      if (!commonValid || !spareValid) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      this.isSavingSpare = true;
      try {
        const payloadSpare = { ...this.spareForm, _localId: Date.now() + Math.floor(Math.random() * 1000) };
        this.addedSpares.push(payloadSpare);

        // clear single spare form but keep invoice fields
        this.spareForm = this.getEmptySpareForm();
        this.spareForm.addedBy = this.userName || "";
        this.spareForm.invoiceNumber = this.commonInvoiceNumber || "";
        this.spareForm.invoiceDate = this.commonInvoiceDate || "";
        this.singleSpareErrors = {};

        this.showSnackbar("success", "Part added to list.");
      } catch (err) {
        console.error("Error adding part to table:", err);
        alert("Failed to add part locally. See console.");
      } finally {
        this.isSavingSpare = false;
      }
    },

    removeFromTable(index) {
      this.addedSpares.splice(index, 1);
      this.showSnackbar("success", "Part removed from list.");
    },

    onResetEverything() {
      this.commonInvoiceNumber = "";
      this.commonInvoiceDate = "";
      this.spareForm = this.getEmptySpareForm();
      this.addedSpares = [];
      this.commonErrors = {};
      this.singleSpareErrors = {};
    },

    onReset() {
      this.spareForm = this.getEmptySpareForm();
      this.spareForm.addedBy = this.userName || "";
      this.spareForm.invoiceNumber = this.commonInvoiceNumber;
      this.spareForm.invoiceDate = this.commonInvoiceDate;
      this.singleSpareErrors = {};
    },

    onClickSubmitAll() {
      if (this.addedSpares.length === 0) {
        this.showSnackbar("Alert", "No parts to submit.");
        return;
      }
      this.showConfirmation = true;
    },

    noConfirmation() {
      this.showConfirmation = false;
    },

    async submitAll() {
      this.showConfirmation = false;
      this.isSubmitting = true;

      try {
        const payload = {
          invoiceNumber: this.commonInvoiceNumber,
          invoiceDate: this.commonInvoiceDate,
          parts: this.addedSpares.map((s) => {
            const copy = { ...s };
            delete copy._localId;
            return copy;
          }),
        };

        // example endpoint - change to your actual API endpoint
        const response = await axios.post(process.env.VUE_APP_AGENCY_BACKEND_URL + "addSpares", payload);
        console.log("✅ Parts submitted:", response.data);

        // reset on success
        this.addedSpares = [];
        this.onReset();
        this.showSnackbar("success", "Parts submitted successfully.");
      } catch (error) {
        console.error("❌ Error saving parts:", error);
        const msg = (error && error.response && error.response.data && error.response.data.message) || "Failed to save parts. Check console.";
        this.showSnackbar("error", msg);
        // keep addedSpares so user can retry
      } finally {
        this.isSubmitting = false;
      }
    },

    showSnackbar(color = "success", message = "") {
      this.snackbar.message = message || "Action completed";
      this.snackbar.color = color;
      this.snackbar.show = true;
    },
  },
};
</script>

<style scoped>
.add-spare-form {
  max-width: 99%;
  margin: 0 auto;
  margin-top: 9px;
  margin-bottom: 9px;
  font-family: 'Inter', Arial, sans-serif;
  background: #fff;
  border-radius: 8px;
  padding: 18px 24px;
  box-shadow: 0 2px 12px #0001;
}

.fields-row {
  width: 100%;
  display: flex;
  margin-bottom: 12px;
  gap: 12px;
}

.field-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.remove-btn,
.add-btn,
.cancel-btn,
.create-btn {
  margin: 8px 4px;
  padding: 8px 16px;
  cursor: pointer;
}

.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.field-details input {
  width: 100%;
  border: 1px solid #ccc;
  padding: 6px 8px;
  box-sizing: border-box;
}

.field-details {
  width: 42%;
}

.fields-row input {
  flex: 1;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #e4e7ec;
  font-size: 15px;
  background: #f8fafc;
  box-sizing: border-box;
}

.field-detail {
  display: flex;
  flex-direction: column;
  width: 33%;
}

textarea {
  resize: vertical;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

/* buttons */
.cancel-btn,
.create-btn,
.add-btn,
.remove-btn {
  background: #aa53cb;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
  margin-top: 8px;
}
.cancel-btn:hover,
.remove-btn:hover { background: #555; }
.create-btn:hover,
.add-btn:hover { background: #8e3fb5; }
.remove-btn { background: #d9534f; }
.remove-btn:hover { background: #b52b27; }

/* error styles */
.field-error input,
.field-error .v-input,
.field-error .v-select {
  border-color: #d9534f !important;
}
.error-msg {
  color: #d9534f;
  font-size: 12px;
  margin-top: 4px;
}

/* table styles */
.table-responsive {
  overflow-x: auto;
}
.spares-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}
.spares-table th,
.spares-table td {
  border: 1px solid #e6e6e6;
  padding: 8px;
  text-align: left;
  font-size: 13px;
}
.spares-table thead {
  background: #f6f6f6;
}

.table-wrapper {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
}

.spares-table {
  width: 100%;
  border-collapse: collapse;
}

/* Fix header */
.spares-table thead th {
  position: sticky;
  top: 0;
  background: #f6f6f6;
  z-index: 2;
  padding: 8px;
  border-bottom: 1px solid #ccc;
}

.spares-table th,
.spares-table td {
  border: 1px solid #e6e6e6;
  padding: 8px;
  text-align: left;
  font-size: 13px;
  background: #fff;
}

.spares-table thead th {
  font-weight: bold;
}
</style>
