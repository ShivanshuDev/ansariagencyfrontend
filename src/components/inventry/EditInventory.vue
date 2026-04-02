<template>
  <div class="edit-inventory-form">
    <v-form ref="form" v-model="valid" lazy-validation>
      <section class="section">
        <div class="row">
          <div class="form-fields">

            <!-- First Row -->
            <div class="fields-row">
              <div class="field-detail">
                <label>Invoice Number *</label>
                <input type="text" v-model="local.invoiceNumber" placeholder="Invoice Number *" required />
              </div>

              <div class="field-detail">
                <label>Invoice Date *</label>
                <input type="date" v-model="local.invoiceDate" placeholder="Invoice Date *" required />
              </div>

              <div class="field-detail">
                <label>Model Name *</label>
                <v-autocomplete
                  v-model="local.modelName"
                  :items="models"
                  :item-text="modelLabel"
                  :item-value="modelValue"
                  :filter="modelFilter"
                  outlined
                  dense
                  hide-details
                  clearable
                  @change="onModelChange"
                  :menu-props="{ maxHeight: 300 }"
                />
              </div>
            </div>

            <!-- Second Row -->
            <div class="fields-row">
              <div class="field-detail">
                <label>Chassis Number *</label>
                <input type="text" v-model="local.chassisNumber" placeholder="Chassis Number *" disabled />
              </div>

              <div class="field-detail">
                <label>Engine Number *</label>
                <input type="text" v-model="local.engineNumber" placeholder="Engine Number *" />
              </div>

              <div class="field-detail">
                <label>Color *</label>
                <v-autocomplete
                  v-model="local.color"
                  :items="colors"
                  :item-text="colorLabel"
                  :item-value="colorValue"
                  :filter="simpleFilter"
                  outlined
                  dense
                  hide-details
                  clearable
                  :menu-props="{ maxHeight: 300 }"
                />
              </div>
            </div>

            <!-- Third Row -->
            <div class="fields-row">

              <div class="field-detail">
                <label>Status</label>
                <v-autocomplete
                  v-model="local.status"
                  :items="actionStatus"
                  :filter="simpleFilter"
                  outlined
                  dense
                  hide-details
                  clearable
                  :menu-props="{ maxHeight: 300 }"
                />
              </div>
              <div class="field-detail">
                <label>Warehouse</label>
                <!-- Warehouse -->
                <v-autocomplete
                  v-model="local.warehouse"
                  :items="warehouses"
                  :filter="simpleFilter"
                  outlined
                  dense
                  hide-details
                  clearable
                  :menu-props="{ maxHeight: 300 }"
                />

              </div>

              <div class="field-detail">
                <label>Added By *</label>
                <input type="text" v-model="local.addedBy" placeholder="Added By *" />
              </div>
            </div>

            <!-- Notes -->
            <div class="fields-row">
              <div style="display:flex; flex-direction:column; width:100%;">
                <label>Notes</label>
                <textarea v-model="local.notes" placeholder="Notes (optional)" rows="3"></textarea>
              </div>
            </div>

          </div>
        </div>
      </section>

      <!-- Actions -->
      <section class="actions">
        <button type="button" class="cancel-btn" @click="onCancel">Cancel</button>
        <button type="button" class="create-btn" :disabled="saving" @click="onSave">
          <span v-if="!saving">Save</span>
          <span v-else>Saving...</span>
        </button>
      </section>
    </v-form>

    <v-alert v-if="error" dense type="error" class="mt-3">{{ errorMessage }}</v-alert>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EditInventory',
  props: {
    item: { type: Object, default: null },
    chassisNumber: { type: String, default: null }
  },
  data() {
    return {
      local: {
        invoiceNumber: '',
        invoiceDate: '',
        chassisNumber: '',
        engineNumber: '',
        modelName: '',
        color: '',
        sgst: '',
        cgst: '',
        warehouse: '',
        addedBy: '',
        notes: '',
        status: ''
      },
      models: [],
      colors: [],
       warehouses: [
        { text: "BADI KAMHARIYA", value: "BADI KAMHARIYA" },
        { text: "OLD-JAHNGIRABAD", value: "OLD-JAHNGIRABAD" },
        { text: "NEW-JAHNGIRABAD", value: "NEW-JAHNGIRABAD" },
        { text: "SHOWROOM", value: "SHOWROOM" },
        { text: "Other", value: "Other" },
      ],
      // cleaned, no duplicates, common statuses
      actionStatus: ['DRAFT', 'ACTIVE', 'INACTIVE', 'REVIEW', 'SOLD'],
      saving: false,
      loading: false,
      error: null,
      valid: false
    };
  },
  computed: {
    errorMessage() {
      if (!this.error) return '';
      if (this.error.response && this.error.response.data) return JSON.stringify(this.error.response.data);
      return this.error.message || String(this.error);
    }
  },
  watch: {
    item: {
      immediate: true,
      handler(val) {
        if (val) this.populate(val);
      }
    },
    chassisNumber: {
      immediate: true,
      handler(val) {
        if (val && !this.item) this.fetchByChassis(val);
      }
    }
  },
  methods: {
    _clone(obj) {
      return JSON.parse(JSON.stringify(obj || {}));
    },

    populate(src) {
      // copy fields safely and ensure status is assigned to local.status
      this.local.invoiceNumber = src.invoiceNumber || '';
      this.local.invoiceDate = src.invoiceDate || '';
      this.local.chassisNumber = src.chassisNumber || src.chassis || '';
      this.local.engineNumber = src.engineNumber || src.engine || '';
      this.local.modelName = src.modelName || src.model || '';
      this.local.color = src.color || '';
      this.local.sgst = src.sgst || src.SGST || src.sgstTax || '';
      this.local.cgst = src.cgst || src.CGST || src.cgstTax || '';
      this.local.warehouse = src.warehouse || '';
      this.local.addedBy = src.addedBy || '';
      this.local.notes = src.notes || src.remarks || '';
      // <-- key fix: set local.status so the v-select shows the current value
      this.local.status = src.status || src.statusType || 'DRAFT';

      // Populate colors for the model (if models list already fetched)
      if (this.local.modelName) this.updateColorsForModel();
    },

    async fetchModels() {
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getModel');
        if (res && res.data && Array.isArray(res.data.models)) this.models = res.data.models;
        else this.models = [];
      } catch (err) {
        console.warn('Failed to fetch models', err);
        this.models = [];
      }
    },

    async fetchByChassis(chassis) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + `getInventoryByChassis/${encodeURIComponent(chassis)}`);
        const item = res && res.data ? (res.data.item || res.data) : null;
        if (item) this.populate(item);
      } catch (err) {
        console.error('Failed to fetch inventory by chassis', err);
        this.error = err;
      } finally {
        this.loading = false;
      }
    },

    modelLabel(item) {
      if (typeof item === 'string') return item;
      return item.modelName || item.name || item.label || item.value || JSON.stringify(item);
    },
    modelValue(item) {
      if (typeof item === 'string') return item;
      return item.id ?? item.value ?? item.modelName ?? item.name ?? this.modelLabel(item);
    },
    colorLabel(item) {
      if (typeof item === 'string') return item;
      return item.colorName || item.name || item.label || item.value || JSON.stringify(item);
    },
    colorValue(item) {
      if (typeof item === 'string') return item;
      return item.id ?? item.value ?? item.colorName ?? item.name ?? this.colorLabel(item);
    },

    onCancel() {
      this.$emit('cancel');
    },

    onModelChange() {
      // Reset color when model changes
      this.local.color = '';
      this.updateColorsForModel();
    },

    updateColorsForModel() {
      const model = this.models.find(m => this.modelValue(m) === this.local.modelName);
      this.colors = model && model.colors ? model.colors : [];
    },

    async onSave() {
      if (!this.local.invoiceNumber || !this.local.invoiceDate || !this.local.chassisNumber) {
        alert('Please provide Invoice Number, Invoice Date and Chassis Number.');
        return;
      }

      if (!confirm('Save changes to this inventory item?')) return;

      this.saving = true;
      this.error = null;
      try {
        const payload = { item: this._clone(this.local), chassisNumber: this.local.chassisNumber };
        const res = await axios.post(process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateInventoryItem', payload, { timeout: 15000 });
        this.$emit('saved', res && res.data ? res.data : res);
      } catch (err) {
        console.error('Failed to update inventory item', err);
        this.error = err;
      } finally {
        this.saving = false;
      }
    },

    modelFilter (item, queryText, itemText) {
      const q = (queryText || '').toString().toLowerCase().trim();
      if (!q) return true;

      // Build a combined searchable string
      const parts = [];
      try {
        parts.push(this.modelLabel(item));
        // Add other possible fields you'd like to search on:
        if (item.code) parts.push(item.code);
        if (item.variant) parts.push(item.variant);
        if (item.id) parts.push(String(item.id));
      } catch (e) {}

      return parts
        .filter(Boolean)
        .some(p => p.toString().toLowerCase().includes(q));
    },

    // Simple case-insensitive contains for string/label lists
    simpleFilter (item, queryText, itemText) {
      const q = (queryText || '').toString().toLowerCase().trim();
      if (!q) return true;
      const label = (typeof item === 'string')
        ? item
        : (itemText || '');
      return label.toString().toLowerCase().includes(q);
    },
  },

  async mounted() {
    await this.fetchModels();

    // Populate colors for existing model
    if (this.local.modelName) this.updateColorsForModel();

    // Populate form if item passed
    if (this.item) this.populate(this.item);
    else if (this.chassisNumber) await this.fetchByChassis(this.chassisNumber);
  }
};
</script>

<style scoped>
.edit-inventory-form {
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
.section {
  margin-bottom: 16px;
}
.row {
  display: flex;
  gap: 24px;
}
.form-fields {
  flex: 1;
  margin-top: 10px;
}
.fields-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}
.fields-row input,
.fields-row textarea {
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
  gap: 12px;
  justify-content: flex-end;
  margin-top: 8px;
}
.cancel-btn,
.create-btn {
  background: #aa53cb;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 5px;
  cursor: pointer;
}
.cancel-btn:hover { background: #555; }
.create-btn:hover { background: #8e3fb5; }
</style>
