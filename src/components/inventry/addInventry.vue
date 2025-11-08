<template>
  <div class="add-bike-form">
  <div style="display:flex; flex-direction:row; justify-content:space-between; width:100%;">
    <h2 style="width:50%;">Add Bike Details</h2>
    <div style="width:50%; text-align:right; font-size:10px;">
      <div v-if="singleBikeErrors.chassisNumber" class="error-msg">{{ singleBikeErrors.chassisNumber }}</div>
      <div style="font-size:1.2rem; font-weight:600;" v-else-if="bikeForm.chassisNumber && chassisCheck.loading" class="error-msg">Checking…</div>
      <div style="font-size:1.2rem; font-weight:600;" v-else-if="bikeForm.chassisNumber && chassisCheck.available === false" class="error-msg">Chassis number already exists</div>
      <div v-else-if="bikeForm.chassisNumber && chassisCheck.available === null && !chassisCheck.loading" class="error-msg">Could not verify chassis number</div>
    </div>
  </div>

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

      <div class="actions" style="align-items:flex-end;">
         <div style="flex:1; display:flex; align-items:flex-end; justify-content:flex-end; padding-top:9px;">
            <button
              class="create-btn"
              @click="saveBikeToTable"
              :disabled="isSavingBike || chassisCheck.loading || chassisCheck.available === false"
            >
              {{ isSavingBike ? 'Saving...' : 'Add More' }}
            </button>
          </div>
        <button type="button" class="add-btn" @click="onReset">Reset Form</button>
      </div>
    </div>

    <!-- SINGLE-BIKE FORM -->
    <div class="row">
      <div class="form-fields" style="width:100%; padding:0px 10px; margin:10px 0px 20px 0px;">
        <div class="fields-row">
          <div class="field-detail" :class="{'field-error': singleBikeErrors.categoryName}">
            <label>Category Name *</label>
            <v-autocomplete
              v-model="bikeForm.categoryName"
              :items="categories"
              item-text="category"
              item-value="category"
              outlined
              dense
              hide-details
            />
            <div v-if="singleBikeErrors.categoryName" class="error-msg">{{ singleBikeErrors.categoryName }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': singleBikeErrors.modelName}">
            <label>Model Name *</label>
            <v-autocomplete
              v-model="bikeForm.modelName"
              :items="models"
              item-text="modelName"
              item-value="modelName"
              outlined
              dense
              hide-details
            />
            <div v-if="singleBikeErrors.modelName" class="error-msg">{{ singleBikeErrors.modelName }}</div>
          </div>

          <!-- ✨ Read-only HSN (auto from selected model) -->
          <div style="width:50px;" class="field-detail">
            <label>HSN (Auto)</label>
            <input type="text" v-model="bikeForm.hsn" placeholder="HSN" readonly />
          </div>

          <div class="field-detail" :class="{'field-error': singleBikeErrors.color}">
            <label>Color *</label>
            <v-autocomplete
              v-model="bikeForm.color"
              :items="getColorsForModel(bikeForm.modelName)"
              outlined
              dense
              hide-details
            />
            <div v-if="singleBikeErrors.color" class="error-msg">{{ singleBikeErrors.color }}</div>
          </div>

          <!-- CHASSIS with debounce + feedback -->
          <div class="field-detail" :class="{'field-error': singleBikeErrors.chassisNumber || chassisCheck.available === false}">
            <label>Chassis Number *</label>
            <input
              type="text"
              v-model="bikeForm.chassisNumber"
              placeholder="Chassis Number *"
              @blur="triggerImmediateChassisCheck"
            />
          </div>

          <div class="field-detail" :class="{'field-error': singleBikeErrors.engineNumber}">
            <label>Engine Number *</label>
            <input  type="text" v-model="bikeForm.engineNumber" placeholder="Engine Number *" />
            <div v-if="singleBikeErrors.engineNumber" class="error-msg">{{ singleBikeErrors.engineNumber }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': singleBikeErrors.warehouse}">
            <label>Warehouse *</label>
            <v-autocomplete
              v-model="bikeForm.warehouse"
              :items="warehouses"
              outlined
              item-text="text"
              item-value="value"
              dense
              hide-details
            />
            <div v-if="singleBikeErrors.warehouse" class="error-msg">{{ singleBikeErrors.warehouse }}</div>
          </div>

          <div class="field-detail" :class="{'field-error': singleBikeErrors.source}">
            <label>Source *</label>
            <input type="text" v-model="bikeForm.source" placeholder="Source *" />
            <div v-if="singleBikeErrors.source" class="error-msg">{{ singleBikeErrors.source }}</div>
          </div>
        </div>
      </div>
    </div>

    <hr />

    <!-- TABLE OF ADDED BIKES -->
    <section>
      <h3>Added Bikes</h3>
      <div v-if="addedBikes.length === 0" style="color:#666; margin-bottom:12px;">
        No bikes added yet. Fill the form above and click <strong>Add More</strong>.
      </div>

      <div v-else class="table-wrapper">
        <table class="bikes-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Invoice No</th>
              <th>Invoice Date</th>
              <th>Category</th>
              <th>Model</th>
              <th>HSN</th> <!-- ✨ optional display -->
              <th>Color</th>
              <th>Chassis</th>
              <th>Engine</th>
              <th>Warehouse</th>
              <th>Source</th>
              <th>Added By</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(b, idx) in addedBikes" :key="b._localId">
              <td>{{ idx + 1 }}</td>
              <td>{{ b.invoiceNumber }}</td>
              <td>{{ formatDate(b.invoiceDate) }}</td>
              <td>{{ b.categoryName }}</td>
              <td>{{ b.modelName }}</td>
              <td>{{ b.hsn || '-' }}</td> <!-- ✨ -->
              <td>{{ b.color }}</td>
              <td>{{ b.chassisNumber }}</td>
              <td>{{ b.engineNumber }}</td>
              <td>{{ b.warehouse }}</td>
              <td>{{ b.source }}</td>
              <td>{{ b.addedBy }}</td>
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
        :disabled="isSubmitting || addedBikes.length === 0"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit All Bikes' }}
      </button>
    </section>

    <v-dialog persistent v-model="showConfirmation" max-width="520px">
      <v-card>
        <v-card-title>
          Save confirmation
          <v-spacer />
          <v-btn icon @click="noConfirmation"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>
        <v-card-text>
          Are you sure you want to save {{ addedBikes.length }} bike(s)?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="submitAll">Yes</v-btn>
          <v-btn color="Alert" @click="noConfirmation">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

export default {
  name: "AddBikeSingleForm",
  data() {
    return {
      userName: "",
      commonInvoiceNumber: "",
      commonInvoiceDate: "",
      bikeForm: this.getEmptyBikeForm(),
      addedBikes: [],
      models: [],
      categories: [],
      warehouses: [
        { text: "BADI KAMHARIYA", value: "BADI KAMHARIYA" },
        { text: "OLD-JAHNGIRABAD", value: "OLD-JAHNGIRABAD" },
        { text: "NEW-JAHNGIRABAD", value: "NEW-JAHNGIRABAD" },
        { text: "SHOWROOM", value: "SHOWROOM" },
        { text: "Other", value: "Other" },
      ],
      singleBikeErrors: {},
      commonErrors: {},
      isSavingBike: false,
      isSubmitting: false,
      showConfirmation: false,
      snackbar: {
        show: false,
        message: "",
        timeout: 3000,
        color: "success",
      },
      // chassis availability state
      chassisCheck: {
        loading: false,
        available: null
      },
      chassisDebounce: null,
      debounceDelayMs: 3000,
      dialogs: {
        chassisAvailable: false,
        chassisNumber: ""
      }
    };
  },
  mounted() {
    const storedStr = localStorage.getItem("auth_user");
    if (storedStr) {
      try {
        const stored = JSON.parse(storedStr);
        if (stored && stored.userId) {
          this.userName = stored.userId;
          this.bikeForm.addedBy = this.userName;
        }
      } catch (e) {
        console.warn("Error parsing auth_user from localStorage", e);
      }
    }
    this.fetchCategory();
  },
  beforeDestroy() {
    if (this.chassisDebounce) {
      clearTimeout(this.chassisDebounce);
      this.chassisDebounce = null;
    }
  },
  watch: {
    commonInvoiceNumber(newVal) {
      this.bikeForm.invoiceNumber = newVal;
    },
    commonInvoiceDate(newVal) {
      this.bikeForm.invoiceDate = newVal;
    },
    userName(newVal) {
      if (!this.bikeForm.addedBy) this.bikeForm.addedBy = newVal;
    },
    'bikeForm.categoryName': function (newVal) {
      this.bikeForm.modelName = "";
      this.bikeForm.color = "";
      this.bikeForm.hsn = ""; // ✨ reset HSN on category change
      if (newVal) {
        this.fetchModels(newVal);
      } else {
        this.models = [];
      }
    },
    // ✨ When model changes, auto-fill HSN from the matched model object
    'bikeForm.modelName': function (newVal) {
      const m = this.findModelByName(newVal);
      this.bikeForm.hsn = m && m.hsn ? String(m.hsn) : "";
      // also clear color if model changes
      this.bikeForm.color = "";
    },
    // Debounced chassis check (3s after last keystroke)
    'bikeForm.chassisNumber': function (val) {
      if (this.chassisDebounce) {
        clearTimeout(this.chassisDebounce);
        this.chassisDebounce = null;
      }
      const trimmed = (val || '').trim();
      if (!trimmed) {
        this.chassisCheck.loading = false;
        this.chassisCheck.available = null;
        this.dialogs.chassisAvailable = false;
        return;
      }
      this.chassisCheck.loading = true;
      this.chassisCheck.available = null;
      this.chassisDebounce = setTimeout(() => {
        this.scheduleChassisCheck(trimmed);
      }, this.debounceDelayMs);
    }
  },
  methods: {
    getEmptyBikeForm() {
      return {
        _localId: Date.now() + Math.floor(Math.random() * 1000),
        invoiceNumber: this.commonInvoiceNumber || "",
        invoiceDate: this.commonInvoiceDate || "",
        chassisNumber: "",
        engineNumber: "",
        modelName: "",
        color: "",
        warehouse: "",
        addedBy: this.userName || "",
        notes: "",
        statusType: "DRAFT",
        source: "TVS Company",
        hsn: "" // ✨ new field captured from model
      };
    },
    formatDate(d) {
      if (!d) return "";
      return d;
    },
    ensureModelFieldsDefaults() {
      if (this.commonInvoiceNumber) this.bikeForm.invoiceNumber = this.commonInvoiceNumber;
      if (this.commonInvoiceDate) this.bikeForm.invoiceDate = this.commonInvoiceDate;
      if (this.userName) this.bikeForm.addedBy = this.userName;
    },
    async fetchModels(categoryName) {
      if (!categoryName) {
        this.models = [];
        return;
      }
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + "getCategoryModel/" + categoryName);
        if (res.data && Array.isArray(res.data.models)) {
          // models contain objects like { modelName, colors, category, hsn }
          this.models = res.data.models;
        } else {
          this.models = [];
        }
      } catch (err) {
        console.error("Failed to fetch models:", err);
        this.models = [];
      }
    },
    async fetchCategory() {
      try {
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + "getCategory");
        if (res.data && Array.isArray(res.data.categories)) {
          this.categories = res.data.categories;
        } else {
          this.categories = [];
        }
      } catch (err) {
        console.error("Failed to fetch getCategory:", err);
        this.categories = [];
      }
    },
    // ✨ helper: find the full model object by name
    findModelByName(modelName) {
      if (!modelName) return null;
      return this.models.find((m) => m.modelName === modelName) || null;
    },
    getColorsForModel(modelName) {
      const model = this.findModelByName(modelName);
      return model && Array.isArray(model.colors) ? model.colors : [];
    },
    // Run check immediately when field loses focus
    triggerImmediateChassisCheck() {
      const trimmed = (this.bikeForm.chassisNumber || '').trim();
      if (!trimmed) return;
      if (this.chassisDebounce) {
        clearTimeout(this.chassisDebounce);
        this.chassisDebounce = null;
      }
      this.chassisCheck.loading = true;
      this.chassisCheck.available = null;
      this.scheduleChassisCheck(trimmed);
    },
    scheduleChassisCheck(trimmed) {
      if (trimmed !== (this.bikeForm.chassisNumber || '').trim()) return;
      this.checkChassisAvailability(trimmed);
    },
    async checkChassisAvailability(chassis) {
      try {
        const url = process.env.VUE_APP_AGENCY_BACKEND_URL + "inventory/check-chassis";
        const res = await axios.get(url, { params: { chassisNumber: chassis } });
        const body = res && res.data ? res.data : {};
        const hasItems = Array.isArray(body.items) && body.items.length > 0;
        const hasCount = typeof body.count === 'number' ? body.count > 0 : false;
        const availableFlag = typeof body.available === 'boolean'
          ? body.available
          : (typeof body.available === 'string' ? body.available.toLowerCase() === 'true' : undefined);

        const exists = (availableFlag === false) || hasItems || hasCount || body.exists === true;

        // Ignore stale responses
        if (chassis !== (this.bikeForm.chassisNumber || '').trim()) return;

        this.chassisCheck.available = exists ? false : true;

        if (!exists) {
          this.dialogs.chassisNumber = chassis;
          this.dialogs.chassisAvailable = true;
        } else {
          this.dialogs.chassisAvailable = false;
        }
      } catch (e) {
        this.chassisCheck.available = null;
        this.dialogs.chassisAvailable = false;
        console.error("check-chassis failed", e);
      } finally {
        this.chassisCheck.loading = false;
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
    validateSingleBike(single = null) {
      const b = single || this.bikeForm;
      const errors = {};
      if (!b.categoryName || !b.categoryName.toString().trim()) errors.categoryName = "Category is required";
      if (!b.modelName || !b.modelName.toString().trim()) errors.modelName = "Model is required";
      if (!b.color || !b.color.toString().trim()) errors.color = "Color is required";
      if (!b.chassisNumber || !b.chassisNumber.toString().trim()) errors.chassisNumber = "Chassis Number is required";
      if (!b.engineNumber || !b.engineNumber.toString().trim()) errors.engineNumber = "Engine Number is required";
      if (!b.warehouse || !b.warehouse.toString().trim()) errors.warehouse = "Warehouse is required";
      if (!b.addedBy || !b.addedBy.toString().trim()) errors.addedBy = "Added By is required";
      if (!b.invoiceNumber || !b.invoiceNumber.toString().trim()) errors.invoiceNumber = "Invoice Number is required";
      if (!b.invoiceDate) errors.invoiceDate = "Invoice Date is required";
      if (!b.source || !b.source.toString().trim()) errors.source = "Source is required";
      if (this.chassisCheck.available === false) errors.chassisNumber = "Chassis number already exists";
      if (this.chassisCheck.loading) errors.chassisNumber = "Please wait, checking chassis number…";
      return errors;
    },
    saveBikeToTable() {
      this.ensureModelFieldsDefaults();

      const commonValid = this.validateCommon();
      if (!commonValid) {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      const singleErrors = this.validateSingleBike();
      if (Object.keys(singleErrors).length) {
        this.singleBikeErrors = singleErrors;
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      this.isSavingBike = true;
      try {
        // ✨ hsn already inside this.bikeForm; include it in the pushed copy
        const payloadBike = { ...this.bikeForm, _localId: Date.now() + Math.floor(Math.random() * 1000) };
        this.addedBikes.push(payloadBike);

        // reset form
        this.bikeForm = this.getEmptyBikeForm();
        this.bikeForm.addedBy = this.userName || "";
        this.bikeForm.invoiceNumber = this.commonInvoiceNumber || "";
        this.bikeForm.invoiceDate = this.commonInvoiceDate || "";
        this.singleBikeErrors = {};
        this.chassisCheck.loading = false;
        this.chassisCheck.available = null;
        this.dialogs.chassisAvailable = false;

        this.showSnackbar("success", "Bike added to list.");
      } catch (err) {
        console.error("Error adding bike to table:", err);
        this.showSnackbar("error", "Failed to add bike locally. See console.");
      } finally {
        this.isSavingBike = false;
      }
    },
    removeFromTable(index) {
      this.addedBikes.splice(index, 1);
      this.showSnackbar("success", "Bike removed from list.");
    },
    onResetEverything() {
      this.commonInvoiceNumber = "";
      this.commonInvoiceDate = "";
      this.bikeForm = this.getEmptyBikeForm();
      this.addedBikes = [];
      this.commonErrors = {};
      this.singleBikeErrors = {};
      this.chassisCheck.loading = false;
      this.chassisCheck.available = null;
      this.dialogs.chassisAvailable = false;
    },
    onReset() {
      this.bikeForm = this.getEmptyBikeForm();
      this.bikeForm.addedBy = this.userName || "";
      this.bikeForm.invoiceNumber = this.commonInvoiceNumber;
      this.bikeForm.invoiceDate = this.commonInvoiceDate;
      this.singleBikeErrors = {};
      this.chassisCheck.loading = false;
      this.chassisCheck.available = null;
      this.dialogs.chassisAvailable = false;
    },
    onClickSubmitAll() {
      if (this.addedBikes.length === 0) {
        this.showSnackbar("Alert", "No bikes to submit.");
        return;
      }
      this.showConfirmation = true;
    },
    noConfirmation() {
      this.showConfirmation = false;
    },
    // async submitAll() {
    //   this.showConfirmation = false;
    //   this.isSubmitting = true;

    //   try {
    //     const payload = {
    //       invoiceDate: this.commonInvoiceDate || this.bikeForm.invoiceDate,
    //       invoiceNumber: this.commonInvoiceNumber || this.bikeForm.invoiceNumber,
    //       warehouse: this.bikeForm.warehouse,
    //       bikes: this.addedBikes.map((b) => {
    //         const copy = { ...b };
    //         delete copy._localId;
    //         return copy; // ✨ includes copy.hsn
    //       }),
    //     };

    //     const response = await axios.post(process.env.VUE_APP_AGENCY_BACKEND_URL + "addInventry", payload);
    //     console.log("✅ Bike details submitted:", response.data);

    //     this.addedBikes = [];
    //     this.onReset();
    //     this.showSnackbar("success", "Bikes submitted successfully.");
    //   } catch (error) {
    //     console.error("❌ Error saving bikes:", error);
    //     const msg = (error && error.response && error.response.data && error.response.data.message) || "Failed to save bikes. Check console.";
    //     this.showSnackbar("error", msg);
    //   } finally {
    //     this.isSubmitting = false;
    //   }
    // },
    
    async submitAll() {
  this.showConfirmation = false;
  this.isSubmitting = true;

  try {
    // If your API expects ONE warehouse at the top level, take it from the first bike.
    // If your API allows multiple warehouses, use the "multi-warehouse" payload shown below.
    const firstWarehouse =
      (this.addedBikes[0] && this.addedBikes[0].warehouse) ||
      this.bikeForm.warehouse ||
      "";

    const payload = {
      invoiceDate: this.commonInvoiceDate || this.bikeForm.invoiceDate,
      invoiceNumber: this.commonInvoiceNumber || this.bikeForm.invoiceNumber,
      warehouse: firstWarehouse, // <-- fixed: not taken from the (reset) form
      bikes: this.addedBikes.map((b) => {
        const copy = { ...b };
        delete copy._localId;
        return copy; // includes copy.warehouse and copy.hsn
      }),
    };
    console.log('payload', JSON.stringify(payload, null, 2))
    const response = await axios.post(
      process.env.VUE_APP_AGENCY_BACKEND_URL + "addInventry",
      payload
    );
    console.log("✅ Bike details submitted:", response.data);

    this.addedBikes = [];
    this.onReset();
    this.showSnackbar("success", "Bikes submitted successfully.");
  } catch (error) {
    console.error("❌ Error saving bikes:", error);
    const msg =
      (error && error.response && error.response.data && error.response.data.message) ||
      "Failed to save bikes. Check console.";
    this.showSnackbar("error", msg);
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
.add-bike-form {
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
  background: #283593;
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
.bikes-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}
.bikes-table th,
.bikes-table td {
  border: 1px solid #e6e6e6;
  padding: 8px;
  text-align: left;
  font-size: 13px;
}
.bikes-table thead {
  background: #f6f6f6;
}

.table-wrapper {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
}

.bikes-table {
  width: 100%;
  border-collapse: collapse;
}

/* Fix header */
.bikes-table thead th {
  position: sticky;
  top: 0;
  background: #f6f6f6;
  z-index: 2;
  padding: 8px;
  border-bottom: 1px solid #ccc;
}

.bikes-table th,
.bikes-table td {
  border: 1px solid #e6e6e6;
  padding: 8px;
  text-align: left;
  font-size: 13px;
  background: #fff;
}

.bikes-table thead th {
  font-weight: bold;
}

</style>
