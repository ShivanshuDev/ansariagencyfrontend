<template>
  <div class="edit-inventory-form">
    <v-form ref="form" v-model="valid" lazy-validation @submit.prevent="onSave">
      <section class="section">
        <div class="row">
          <div class="form-fields">

            <!-- First Row -->
            <div class="fields-row">
              <div class="field-detail">
                <label>Invoice Number *</label>
                <input 
                  type="text" 
                  v-model="local.invoiceNumber" 
                  placeholder="Invoice Number *" 
                  required
                  :class="{ 'error-field': invoiceNumberError }"
                  @blur="validateRequiredFields"
                  disabled
                />
                <div v-if="invoiceNumberError" class="error-message">
                  {{ invoiceNumberError }}
                </div>
              </div>

              <div class="field-detail">
                <label>Invoice Date *</label>
                <input 
                  type="date" 
                  v-model="local.invoiceDate" 
                  placeholder="Invoice Date *" 
                  required
                  :class="{ 'error-field': invoiceDateError }"
                  @blur="validateRequiredFields"
                  disabled
                />
                <div v-if="invoiceDateError" class="error-message">
                  {{ invoiceDateError }}
                </div>
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
                  :class="{ 'error-field': modelNameError }"
                  @blur="validateRequiredFields"
                />
                <div v-if="modelNameError" class="error-message">
                  {{ modelNameError }}
                </div>
              </div>
            </div>

            <!-- Second Row -->
            <div class="fields-row">
              <div class="field-detail">
                <label>Chassis Number *</label>
                <input 
                  type="text" 
                  v-model="local.chassisNumber" 
                  @input="formatChassisNumber"
                  @blur="validateChassisNumber"
                  :class="{ 'error-field': chassisError || chassisExistsError }"
                  placeholder="Chassis Number * (17 characters)" 
                  maxlength="17"
                />
                <div v-if="chassisError" class="error-message">
                  {{ chassisError }}
                </div>
                <div v-if="checkingChassis" class="checking-message">
                  <v-progress-circular indeterminate size="16" width="2" color="primary"></v-progress-circular>
                  Checking chassis number...
                </div>
                <div v-if="chassisExistsError" class="error-message">
                  {{ chassisExistsError }}
                </div>
              </div>

              <div class="field-detail">
                <label>Engine Number *</label>
                <input 
                  type="text" 
                  v-model="local.engineNumber" 
                  @input="formatEngineNumber"
                  @blur="validateEngineNumber"
                  :class="{ 'error-field': engineError }"
                  placeholder="Engine Number * (12 characters)" 
                  maxlength="12"
                />
                <div v-if="engineError" class="error-message">
                  {{ engineError }}
                </div>
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
                  :class="{ 'error-field': colorError }"
                  @blur="validateRequiredFields"
                />
                <div v-if="colorError" class="error-message">
                  {{ colorError }}
                </div>
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

              <!-- <div class="field-detail">
                <label>Added By *</label>
                <input 
                  type="text" 
                  v-model="local.addedBy" 
                  placeholder="Added By *" 
                  :class="{ 'error-field': addedByError }"
                  @blur="validateRequiredFields"
                  disabled
                />
                <div v-if="addedByError" class="error-message">
                  {{ addedByError }}
                </div>
              </div> -->
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
        <button type="button" class="cancel-btn" @click="onCancel" :disabled="saving">Cancel</button>
        <button 
          type="submit" 
          class="create-btn" 
          :disabled="saving || !isFormValid" 
        >
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
      actionStatus: ['DRAFT', 'ACTIVE', 'INACTIVE', 'REVIEW', 'SOLD'],
      saving: false,
      loading: false,
      error: null,
      valid: false,
      
      // Validation states
      invoiceNumberError: '',
      invoiceDateError: '',
      modelNameError: '',
      colorError: '',
      addedByError: '',
      chassisError: '',
      engineError: '',
      chassisExistsError: '',
      
      checkingChassis: false,
      originalChassisNumber: '',
      originalEngineNumber: '',
      chassisCheckTimeout: null
    };
  },
  computed: {
    errorMessage() {
      if (!this.error) return '';
      if (this.error.response && this.error.response.data) {
        return typeof this.error.response.data === 'string' 
          ? this.error.response.data 
          : JSON.stringify(this.error.response.data);
      }
      return this.error.message || String(this.error);
    },
    
    isFormValid() {
      // Check all required fields
      const requiredFieldsValid = 
        this.local.invoiceNumber && 
        this.local.invoiceDate && 
        this.local.modelName && 
        this.local.color && 
        this.local.addedBy;
      
      // Check chassis and engine validation
      const chassisValid = this.local.chassisNumber && this.local.chassisNumber.length === 17 && !this.chassisError;
      const engineValid = this.local.engineNumber && this.local.engineNumber.length === 12 && !this.engineError;
      
      // Check no validation errors
      const noErrors = 
        !this.invoiceNumberError &&
        !this.invoiceDateError &&
        !this.modelNameError &&
        !this.colorError &&
        !this.addedByError &&
        !this.chassisError &&
        !this.engineError &&
        !this.chassisExistsError;
      
      return requiredFieldsValid && chassisValid && engineValid && noErrors;
    }
  },
  watch: {
    item: {
      immediate: true,
      handler(val) {
        if (val) {
          this.originalChassisNumber = val.chassisNumber || val.chassis || '';
          this.originalEngineNumber = val.engineNumber || val.engine || '';
          this.populate(val);
        }
      }
    },
    chassisNumber: {
      immediate: true,
      handler(val) {
        if (val && !this.item) {
          this.originalChassisNumber = val;
          this.fetchByChassis(val);
        }
      }
    },
    
    // Watch for chassis number changes to check availability
    'local.chassisNumber': {
      handler(newVal, oldVal) {
        if (newVal !== oldVal && newVal && newVal.length === 17) {
          this.checkChassisAvailability();
        }
      }
    }
  },
  methods: {
    _clone(obj) {
      return JSON.parse(JSON.stringify(obj || {}));
    },

    populate(src) {
      // Clear all errors first
      this.clearAllErrors();
      
      // Copy fields safely
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
      this.local.status = src.status || src.statusType || 'DRAFT';

      // Populate colors for the model
      if (this.local.modelName) this.updateColorsForModel();
    },

    clearAllErrors() {
      this.invoiceNumberError = '';
      this.invoiceDateError = '';
      this.modelNameError = '';
      this.colorError = '';
      this.addedByError = '';
      this.chassisError = '';
      this.engineError = '';
      this.chassisExistsError = '';
    },

    async fetchModels() {
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + 'getModel');
        if (res && res.data && Array.isArray(res.data.models)) {
          this.models = res.data.models;
        } else {
          this.models = [];
        }
      } catch (err) {
        console.warn('Failed to fetch models', err);
        this.models = [];
        this.showSnack('Failed to load models', 'warning');
      }
    },

    async fetchByChassis(chassis) {
      this.loading = true;
      this.error = null;
      try {
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL + `getInventoryByChassis/${encodeURIComponent(chassis)}`
        );
        const item = res && res.data ? (res.data.item || res.data) : null;
        if (item) {
          this.originalChassisNumber = item.chassisNumber || item.chassis || chassis;
          this.originalEngineNumber = item.engineNumber || item.engine || '';
          this.populate(item);
        } else {
          this.showSnack('Inventory item not found', 'warning');
        }
      } catch (err) {
        console.error('Failed to fetch inventory by chassis', err);
        this.error = err;
        this.showSnack('Failed to load inventory data', 'error');
      } finally {
        this.loading = false;
      }
    },

    formatChassisNumber(event) {
      let value = event.target.value;
      
      // Remove special characters, spaces, and convert to uppercase
      value = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      
      // Limit to 17 characters
      if (value.length > 17) {
        value = value.substring(0, 17);
      }
      
      this.local.chassisNumber = value;
      this.chassisError = '';
      this.chassisExistsError = '';
    },

    formatEngineNumber(event) {
      let value = event.target.value;
      
      // Remove special characters, spaces, and convert to uppercase
      value = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      
      // Limit to 12 characters
      if (value.length > 12) {
        value = value.substring(0, 12);
      }
      
      this.local.engineNumber = value;
      this.engineError = '';
    },

    validateChassisNumber() {
      const chassis = this.local.chassisNumber;
      
      if (!chassis || chassis.trim() === '') {
        this.chassisError = 'Chassis number is required';
        return false;
      }
      
      if (chassis.length !== 17) {
        this.chassisError = 'Chassis number must be exactly 17 characters';
        return false;
      }
      
      // Check if contains only alphanumeric characters
      if (!/^[A-Z0-9]{17}$/.test(chassis)) {
        this.chassisError = 'Chassis number must contain only letters and numbers (A-Z, 0-9)';
        return false;
      }
      
      this.chassisError = '';
      return true;
    },

    validateEngineNumber() {
      const engine = this.local.engineNumber;
      
      if (!engine || engine.trim() === '') {
        this.engineError = 'Engine number is required';
        return false;
      }
      
      if (engine.length !== 12) {
        this.engineError = 'Engine number must be exactly 12 characters';
        return false;
      }
      
      // Check if contains only alphanumeric characters
      if (!/^[A-Z0-9]{12}$/.test(engine)) {
        this.engineError = 'Engine number must contain only letters and numbers (A-Z, 0-9)';
        return false;
      }
      
      this.engineError = '';
      return true;
    },

    validateRequiredFields() {
      let isValid = true;
      
      // Invoice Number
      if (!this.local.invoiceNumber || this.local.invoiceNumber.trim() === '') {
        this.invoiceNumberError = 'Invoice number is required';
        isValid = false;
      } else {
        this.invoiceNumberError = '';
      }
      
      // Invoice Date
      if (!this.local.invoiceDate) {
        this.invoiceDateError = 'Invoice date is required';
        isValid = false;
      } else {
        this.invoiceDateError = '';
      }
      
      // Model Name
      if (!this.local.modelName) {
        this.modelNameError = 'Model name is required';
        isValid = false;
      } else {
        this.modelNameError = '';
      }
      
      // Color
      if (!this.local.color) {
        this.colorError = 'Color is required';
        isValid = false;
      } else {
        this.colorError = '';
      }
      
      // Added By
      if (!this.local.addedBy || this.local.addedBy.trim() === '') {
        this.addedByError = 'Added by is required';
        isValid = false;
      } else {
        this.addedByError = '';
      }
      
      return isValid;
    },

    async checkChassisAvailability() {
      const chassis = this.local.chassisNumber;
      
      // Don't check if it's the original chassis number (editing same item)
      if (chassis === this.originalChassisNumber) {
        this.chassisExistsError = '';
        return;
      }
      
      if (!chassis || chassis.length !== 17) {
        return;
      }
      
      // Clear previous timeout
      if (this.chassisCheckTimeout) {
        clearTimeout(this.chassisCheckTimeout);
      }
      
      this.checkingChassis = true;
      
      // Debounce the API call (500ms)
      this.chassisCheckTimeout = setTimeout(async () => {
        try {
          const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}inventory/check-chassis?chassisNumber=${encodeURIComponent(chassis)}`;
          const response = await axios.get(url, { timeout: 10000 });
          
          if (response.data && response.data.available === false) {
            this.chassisExistsError = 'Chassis number already exists in the database';
          } else {
            this.chassisExistsError = '';
          }
        } catch (error) {
          console.error('Error checking chassis number:', error);
          // Don't block user if the check fails, but log it
          if (error.code === 'ECONNABORTED') {
            this.chassisExistsError = 'Chassis check timeout. Please verify manually.';
          }
        } finally {
          this.checkingChassis = false;
        }
      }, 500);
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
      this.colorError = '';
      this.updateColorsForModel();
    },

    updateColorsForModel() {
      const model = this.models.find(m => this.modelValue(m) === this.local.modelName);
      this.colors = model && model.colors ? model.colors : [];
    },

    async performFinalChassisCheck() {
      const chassis = this.local.chassisNumber;
      
      // Skip if same as original
      if (chassis === this.originalChassisNumber) {
        return true;
      }
      
      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}inventory/check-chassis?chassisNumber=${encodeURIComponent(chassis)}`;
        const response = await axios.get(url, { timeout: 10000 });
        
        if (response.data && response.data.available === false) {
          this.chassisExistsError = 'Chassis number already exists in the database';
          this.showSnack('Chassis number already exists. Please use a different chassis number.', 'error');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Final chassis check failed:', error);
        this.showSnack('Unable to verify chassis number uniqueness. Please try again.', 'warning');
        return false;
      }
    },

    // async onSave() {
    //   // Validate all fields
    //   if (!this.validateRequiredFields()) {
    //     this.showSnack('Please fill all required fields correctly', 'error');
    //     return;
    //   }
      
    //   if (!this.validateChassisNumber() || !this.validateEngineNumber()) {
    //     this.showSnack('Please correct chassis and engine number errors', 'error');
    //     return;
    //   }
      
    //   // Check chassis existence
    //   if (this.chassisExistsError) {
    //     this.showSnack('Chassis number already exists. Please use a different chassis number.', 'error');
    //     return;
    //   }
      
    //   // Perform final chassis check
    //   const chassisAvailable = await this.performFinalChassisCheck();
    //   if (!chassisAvailable) {
    //     return;
    //   }
      
    //   if (!confirm('Save changes to this inventory item?')) return;

    //   this.saving = true;
    //   this.error = null;
    //   try {
    //     const payload = { 
    //       item: this._clone(this.local), 
    //       chassisNumber: this.local.chassisNumber 
    //     };
        
    //     const res = await axios.post(
    //       process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateInventoryItem', 
    //       payload, 
    //       { 
    //         timeout: 15000,
    //         headers: {
    //           'Content-Type': 'application/json'
    //         }
    //       }
    //     );
        
    //     this.showSnack('Inventory item saved successfully', 'success');
    //     this.$emit('saved', res && res.data ? res.data : res);
        
    //   } catch (err) {
    //     console.error('Failed to update inventory item', err);
    //     this.error = err;
        
    //     let errorMsg = 'Failed to save inventory item';
    //     if (err.response?.data?.message) {
    //       errorMsg += `: ${err.response.data.message}`;
    //     } else if (err.message) {
    //       errorMsg += `: ${err.message}`;
    //     }
        
    //     this.showSnack(errorMsg, 'error');
    //   } finally {
    //     this.saving = false;
    //   }
    // },

    async onSave() {
      // Validate all fields
      if (!this.validateRequiredFields()) {
        this.showSnack('Please fill all required fields correctly', 'error');
        return;
      }

      if (!this.validateChassisNumber() || !this.validateEngineNumber()) {
        this.showSnack('Please correct chassis and engine number errors', 'error');
        return;
      }

      if (this.chassisExistsError) {
        this.showSnack('Chassis number already exists. Please use a different chassis number.', 'error');
        return;
      }

      const chassisAvailable = await this.performFinalChassisCheck();
      if (!chassisAvailable) return;

      if (!confirm('Save changes to this inventory item?')) return;

      this.saving = true;
      this.error = null;

      try {
        const chassisChanged =
          this.local.chassisNumber !== this.originalChassisNumber;

        let res;

        // =====================================================
        // 🔁 CASE 1: CHASSIS NUMBER CHANGED
        // =====================================================
        if (chassisChanged) {
          const payload = {
            oldChassisNumber: this.originalChassisNumber,   // 👈 VERY IMPORTANT
            newChassisNumber: this.local.chassisNumber,
            updatedFields: {
              engineNumber: this.local.engineNumber,
              modelName: this.local.modelName,
              color: this.local.color,
              warehouse: this.local.warehouse,
              notes: this.local.notes,
              statusType: this.local.status
            },
            actor: this.local.addedBy
          };

          res = await axios.post(
            process.env.VUE_APP_AGENCY_BACKEND_URL + 'replaceInventoryChassisNumber',
            payload,
            {
              timeout: 15000,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        // =====================================================
        // ✏️ CASE 2: CHASSIS NUMBER SAME (OLD BEHAVIOR)
        // =====================================================
        else {
          const payload = {
            item: this._clone(this.local),
            chassisNumber: this.originalChassisNumber
          };

          res = await axios.post(
            process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateInventoryItem',
            payload,
            {
              timeout: 15000,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        }

        this.showSnack('Inventory item saved successfully', 'success');
        this.$emit('saved', res && res.data ? res.data : res);

      } catch (err) {
        console.error('Failed to update inventory item', err);
        this.error = err;

        let errorMsg = 'Failed to save inventory item';
        if (err.response?.data?.message) {
          errorMsg += `: ${err.response.data.message}`;
        } else if (err.message) {
          errorMsg += `: ${err.message}`;
        }

        this.showSnack(errorMsg, 'error');
      } finally {
        this.saving = false;
      }
    },
    
    showSnack(message, type = 'info') {
      // You can implement a global snackbar or use a local one
      // For now, using alert for simplicity
      if (type === 'error') {
        alert(`Error: ${message}`);
      } else if (type === 'warning') {
        alert(`Warning: ${message}`);
      } else {
        alert(message);
      }
    },

    modelFilter (item, queryText, itemText) {
      const q = (queryText || '').toString().toLowerCase().trim();
      if (!q) return true;

      // Build a combined searchable string
      const parts = [];
      try {
        parts.push(this.modelLabel(item));
        if (item.code) parts.push(item.code);
        if (item.variant) parts.push(item.variant);
        if (item.id) parts.push(String(item.id));
      } catch (e) {}

      return parts
        .filter(Boolean)
        .some(p => p.toString().toLowerCase().includes(q));
    },

    simpleFilter (item, queryText, itemText) {
      const q = (queryText || '').toString().toLowerCase().trim();
      if (!q) return true;
      const label = (typeof item === 'string')
        ? item
        : (itemText || '');
      return label.toString().toLowerCase().includes(q);
    }
  },

  async mounted() {
    await this.fetchModels();

    // Populate colors for existing model
    if (this.local.modelName) this.updateColorsForModel();

    // Populate form if item passed
    if (this.item) {
      this.populate(this.item);
    } else if (this.chassisNumber) {
      await this.fetchByChassis(this.chassisNumber);
    }
  },
  
  beforeDestroy() {
    // Clean up timeout
    if (this.chassisCheckTimeout) {
      clearTimeout(this.chassisCheckTimeout);
    }
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
  background: #ffffff00;
  border-radius: 8px;
  padding: 0px 0px;
  margin:0px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.fields-row input,
.fields-row textarea {
  flex: 1;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #e4e7ec;
  font-size: 14px;
  background: #fff;
  box-sizing: border-box;
  transition: border-color 0.3s ease;
}

.fields-row input:focus,
.fields-row textarea:focus {
  outline: none;
  border-color: #aa53cb;
  box-shadow: 0 0 0 2px rgba(170, 83, 203, 0.1);
}

.fields-row input.error-field,
.fields-row textarea.error-field,
:deep(.v-input.error-field .v-input__control) {
  border-color: #ff4444 !important;
  background-color: #fff8f8;
}

.field-detail {
  display: flex;
  flex-direction: column;
  width: calc(33.333% - 11px);
  min-width: 280px;
  position: relative;
}

.field-detail label {
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid #eee;
}

.cancel-btn,
.create-btn {
  background: #6c757d;
  color: #fff;
  border: none;
  padding: 10px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  min-width: 100px;
}

.create-btn {
  background: #aa53cb;
}

.cancel-btn:hover { 
  background: #5a6268; 
}

.create-btn:hover { 
  background: #8e3fb5; 
}

.cancel-btn:disabled,
.create-btn:disabled {
  background: #cccccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.error-message {
  color: #ff4444;
  font-size: 12px;
  margin-top: 4px;
  min-height: 16px;
  line-height: 1.3;
}

.checking-message {
  color: #666;
  font-size: 12px;
  margin-top: 4px;
  font-style: italic;
  display: flex;
  align-items: center;
  gap: 6px;
}

.checking-message .v-progress-circular {
  margin-right: 4px;
}

:deep(.v-text-field--outlined.error-field .v-input__control .v-input__slot) {
  border-color: #ff4444 !important;
  background-color: #fff8f8;
}

:deep(.v-text-field--outlined.error-field .v-label) {
  color: #ff4444 !important;
}

:deep(.v-select__selection) {
  font-size: 14px;
}

@media (max-width: 1200px) {
  .field-detail {
    width: calc(50% - 8px);
  }
}

@media (max-width: 768px) {
  .field-detail {
    width: 100%;
  }
  
  .fields-row {
    gap: 12px;
  }
}
</style>