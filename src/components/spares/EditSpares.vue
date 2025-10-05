<template>
  <div class="add-spare-form">
    <h2>Edit Spare / Part</h2>

    <!-- COMMON INVOICE (readonly if you want) -->
    <div style="margin-bottom: 20px; display:flex; flex-direction:row; justify-content:space-between;">
      <div style="display:flex; flex-direction:row;">
        <div class="field-details">
          <label>Invoice Number *</label>
          <input
            type="text"
            v-model="local.invoiceNumber"
            placeholder="Invoice Number *"
          />
          <div v-if="errors.invoiceNumber" class="error-msg">{{ errors.invoiceNumber }}</div>
        </div>
        &nbsp;&nbsp;&nbsp;&nbsp;
        <div class="field-details">
          <label>Invoice Date *</label>
          <input
            type="date"
            v-model="local.invoiceDate"
            placeholder="Invoice Date *"
          />
          <div v-if="errors.invoiceDate" class="error-msg">{{ errors.invoiceDate }}</div>
        </div>
      </div>

      <!-- Quick actions -->
      <div class="actions" style="align-items:flex-end;">
        <button type="button" class="add-btn" @click="onReset">Reset</button>
      </div>
    </div>

    <!-- SINGLE-SPARE EDIT FORM -->
    <div class="row">
      <div class="form-fields" style="width:100%; padding:0px 10px; margin:10px 0px 20px 0px;">
        <div class="fields-row">

          <div class="field-detail" :class="{'field-error': errors.partNumber}">
            <label>Part Number *</label>
            <input type="text" v-model="local.partNumber" placeholder="Part Number *" />
            <div v-if="errors.partNumber" class="error-msg">{{ errors.partNumber }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': errors.partName}">
            <label>Part Name *</label>
            <input type="text" v-model="local.partName" placeholder="Part Name *" />
            <div v-if="errors.partName" class="error-msg">{{ errors.partName }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': errors.price}">
            <label>Price *</label>
            <input type="number" v-model.number="local.price" placeholder="Price *" min="0" />
            <div v-if="errors.price" class="error-msg">{{ errors.price }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': errors.rakNumber}">
            <label>Rak Number *</label>
            <input type="text" v-model="local.rakNumber" placeholder="Rak Number *" />
            <div v-if="errors.rakNumber" class="error-msg">{{ errors.rakNumber }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': errors.qty}">
            <label>Qty *</label>
            <input type="number" v-model.number="local.qty" placeholder="Qty *" min="1" />
            <div v-if="errors.qty" class="error-msg">{{ errors.qty }}</div>
          </div>

          <div style="flex:1; display:flex; align-items:flex-end; justify-content:flex-end; padding-top:9px;">
            <button class="create-btn" @click="onSave" :disabled="isSaving">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <hr />

    <!-- single-row display of additional fields (no add-more rows) -->
    <section>
      <div style="color:#666; margin-bottom:12px;">
        Edit details for this spare and click <strong>Save Changes</strong>.
      </div>
    </section>

    <br />

    <!-- CANCEL -->
    <section style="display:flex; justify-content:flex-end; gap:12px;">
      <button type="button" class="cancel-btn" @click="onCancelClick">Cancel</button>
    </section>

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
export default {
  name: "EditSpare",
  props: {
    item: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      // local editable copy of item
      local: { ...this.item },
      errors: {},
      isSaving: false,
      snackbar: { show: false, message: "", timeout: 3000, color: "success" },
    };
  },
  watch: {
    // if parent changes item, refresh local copy (but don't overwrite while editing)
    item(newVal) {
      this.local = { ...newVal };
      this.errors = {};
    },
  },
  methods: {
    validate() {
      this.errors = {};
      const s = this.local;

      if (!s.partNumber || !s.partNumber.toString().trim()) this.errors.partNumber = "Part Number is required";
      if (!s.partName || !s.partName.toString().trim()) this.errors.partName = "Part Name is required";
      if (s.price === null || s.price === undefined || isNaN(s.price) || Number(s.price) < 0) this.errors.price = "Price is required and must be >= 0";
      if (!s.rakNumber || !s.rakNumber.toString().trim()) this.errors.rakNumber = "Rak Number is required";
      if (s.qty === null || s.qty === undefined || isNaN(s.qty) || Number(s.qty) < 1) this.errors.qty = "Qty is required and must be >= 1";
      if (!s.invoiceNumber || !s.invoiceNumber.toString().trim()) this.errors.invoiceNumber = "Invoice Number is required";
      if (!s.invoiceDate) this.errors.invoiceDate = "Invoice Date is required";

      return Object.keys(this.errors).length === 0;
    },

    onSave() {
      // validate -> emit save to parent, parent should perform API saving
      if (!this.validate()) {
        // scroll top so user sees errors
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      this.isSaving = true;
      try {
        // emit updated item; parent handles persistence
        this.$emit("save", { ...this.local });
        this.showSnackbar("success", "Saved (parent will persist changes).");
      } catch (e) {
        console.error("save emit error:", e);
        this.showSnackbar("error", "Failed to save (internal).");
      } finally {
        this.isSaving = false;
      }
    },

    onCancelClick() {
      // restore local copy to original and notify parent to close editor
      this.local = { ...this.item };
      this.errors = {};
      this.$emit("cancel");
    },

    onReset() {
      // reset fields to original passed item
      this.local = { ...this.item };
      this.errors = {};
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
.cancel-btn:hover { background: #555; }
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

/* table styles (not used but kept for consistency) */
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
</style>
