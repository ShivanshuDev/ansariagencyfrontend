<template>
  <div class="add-bike-form">
    <!-- HEADER -->
    <div class="header-row">
      <h2 class="title">Add Bike Details</h2>
      <div class="header-status">
        <div v-if="singleBikeErrors.chassisNumber" class="error-msg">
          {{ singleBikeErrors.chassisNumber }}
        </div>
        <div
          v-else-if="bikeForm.chassisNumber && chassisCheck.loading"
          class="error-msg status-strong"
        >
          Checking…
        </div>
        <div
          v-else-if="bikeForm.chassisNumber && chassisCheck.available === false"
          class="error-msg status-strong"
        >
          Chassis number already exists
        </div>
        <div
          v-else-if="
            bikeForm.chassisNumber &&
            chassisCheck.available === null &&
            !chassisCheck.loading
          "
          class="error-msg status-strong"
        >
          Could not verify chassis number
        </div>
      </div>
    </div>

    <!-- ===== INVOICE ROW (3 FIELDS) ===== -->
    <div class="section">
      <div class="invoice-row">
        <!-- Invoice Number -->
        <div class="field-block" :class="{'field-error': commonErrors.invoiceNumber}">
          <v-text-field
            v-model="commonInvoiceNumber"
            placeholder="Invoice Number"
            prepend-inner-icon="mdi-receipt"
            outlined
            dense
            hide-details
          />
          <div v-if="commonErrors.invoiceNumber" class="error-msg">
            {{ commonErrors.invoiceNumber }}
          </div>
        </div>

        <!-- Purchase / Delivery Date -->
        <div class="field-block" :class="{'field-error': commonErrors.invoiceDate}">
          <v-menu
            v-model="invoiceDateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            max-width="290px"
            min-width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                :value="formattedInvoiceDate"
                placeholder="Purchase/Delivery Date"
                prepend-inner-icon="mdi-calendar"
                readonly
                outlined
                dense
                hide-details
                v-bind="attrs"
                v-on="on"
              />

            </template>
            <v-date-picker
              v-model="commonInvoiceDate"
              scrollable
              @input="invoiceDateMenu = false"
            />
          </v-menu>
          <div v-if="commonErrors.invoiceDate" class="error-msg">
            {{ commonErrors.invoiceDate }}
          </div>
        </div>

        <!-- Source / RTO Office -->
        <div class="field-block" :class="{'field-error': singleBikeErrors.source}">
          <v-text-field
            v-model="bikeForm.source"
            placeholder="Please Assigned RTO Office"
            prepend-inner-icon="mdi-office-building"
            outlined
            dense
            hide-details
          />
          <div v-if="singleBikeErrors.source" class="error-msg">
            {{ singleBikeErrors.source }}
          </div>
        </div>
      </div>
    </div>

    <!-- ===== BIKE DETAILS ===== -->
    <div class="section">
      <h3 class="section-title">Bike Details</h3>

      <!-- ROW 1: Category, Model, Color, HSN -->
      <div class="fields-row">
        <div class="field-detail" :class="{'field-error': singleBikeErrors.categoryName}">
          <span class="field-label">Category Name *</span>
          <v-autocomplete
            v-model="bikeForm.categoryName"
            :items="categories"
            item-text="category"
            item-value="category"
            placeholder="Select Category"
            outlined
            dense
            hide-details
          />
          <div v-if="singleBikeErrors.categoryName" class="error-msg">
            {{ singleBikeErrors.categoryName }}
          </div>
        </div>

        <div class="field-detail" :class="{'field-error': singleBikeErrors.modelName}">
          <span class="field-label">Model Name</span>
          <v-autocomplete
            v-model="bikeForm.modelName"
            :items="models"
            item-text="modelName"
            item-value="modelName"
            placeholder="Select Model"
            outlined
            dense
            hide-details
          />
          <div v-if="singleBikeErrors.modelName" class="error-msg">
            {{ singleBikeErrors.modelName }}
          </div>
        </div>

        <div class="field-detail" :class="{'field-error': singleBikeErrors.color}">
          <span class="field-label">Color</span>
          <v-autocomplete
            v-model="bikeForm.color"
            :items="getColorsForModel(bikeForm.modelName)"
            placeholder="Select Color"
            outlined
            dense
            hide-details
          />
          <div v-if="singleBikeErrors.color" class="error-msg">
            {{ singleBikeErrors.color }}
          </div>
        </div>

        <div class="field-detail">
          <span class="field-label">HSN Code</span>
          <v-text-field
            v-model="bikeForm.hsn"
            placeholder="HSN Code"
            outlined
            dense
            hide-details
            readonly
          />
        </div>
      </div>

      <!-- ROW 2: Chassis, Engine, Warehouse, Added By -->
      <div class="fields-row">
        <div
          class="field-detail"
          :class="{
            'field-error':
              singleBikeErrors.chassisNumber || chassisCheck.available === false
          }"
        >
          <span class="field-label">Chassis Number *</span>
          <v-text-field
            v-model="bikeForm.chassisNumber"
            placeholder="Chassis Number"
            outlined
            dense
            hide-details
            maxlength="17"
            @input="onChassisInput"
            @blur="triggerImmediateChassisCheck"
          />
          <div v-if="singleBikeErrors.chassisNumber" class="error-msg">
            {{ singleBikeErrors.chassisNumber }}
          </div>
          <div
            v-else-if="bikeForm.chassisNumber && bikeForm.chassisNumber.length < 17"
            class="error-msg"
          >
            Chassis must be 17 characters ({{ bikeForm.chassisNumber.length }}/17)
          </div>
        </div>

        <div class="field-detail" :class="{'field-error': singleBikeErrors.engineNumber}">
          <span class="field-label">Engine Number</span>
          <v-text-field
            v-model="bikeForm.engineNumber"
            placeholder="Engine Number"
            outlined
            dense
            hide-details
            maxlength="12"
            @input="onEngineInput"
          />
          <div v-if="singleBikeErrors.engineNumber" class="error-msg">
            {{ singleBikeErrors.engineNumber }}
          </div>
          <div
            v-else-if="bikeForm.engineNumber && bikeForm.engineNumber.length < 10"
            class="error-msg"
          >
            Engine number must be between 10 and 12 characters
            ({{ bikeForm.engineNumber.length }})
          </div>
        </div>

        <div class="field-detail" :class="{'field-error': singleBikeErrors.warehouse}">
          <span class="field-label">Warehouse</span>
          <v-autocomplete
            v-model="bikeForm.warehouse"
            :items="warehouses"
            item-text="text"
            item-value="value"
            placeholder="Select Warehouse"
            outlined
            dense
            hide-details
          />
          <div v-if="singleBikeErrors.warehouse" class="error-msg">
            {{ singleBikeErrors.warehouse }}
          </div>
        </div>

        <div class="field-detail" :class="{'field-error': singleBikeErrors.addedBy}">
          <span class="field-label">Added by</span>
          <v-text-field
            v-model="bikeForm.addedBy"
            placeholder="Added by"
            outlined
            dense
            hide-details
            readonly
            disabled
          />
          <div v-if="singleBikeErrors.addedBy" class="error-msg">
            {{ singleBikeErrors.addedBy }}
          </div>
        </div>
      </div>
    </div>

    <!-- BUTTON BAR -->
    <section class="button-bar">
      <button
        type="button"
        class="btn primary"
        @click="saveBikeToTable"
        :disabled="isSavingBike || chassisCheck.loading || chassisCheck.available === false"
      >
        {{ isSavingBike ? (editingIndex !== null ? 'Updating...' : 'Saving...') : (editingIndex !== null ? 'Update' : 'Add More') }}
      </button>

      <button
        type="button"
        class="btn primary"
        @click="saveBikeToTable"
        :disabled="isSavingBike || chassisCheck.loading || chassisCheck.available === false"
      >
        Draft
      </button>

      <button type="button" class="btn primary" @click="onReset">
        Reset Form
      </button>

      <button
        type="button"
        class="btn primary"
        @click="onClickSubmitAll"
        :disabled="isSubmitting || addedBikes.length === 0"
      >
        {{ isSubmitting ? 'Submitting...' : 'Submit All Bikes' }}
      </button>

      <button type="button" class="btn primary" @click="onResetEverything">
        Cancel
      </button>
    </section>

    <hr />

    <!-- TABLE OF ADDED BIKES (Invoice cols hidden) -->
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
              <!-- Invoice No / Date removed from UI -->
              <th>Category</th>
              <th>Model</th>
              <th>HSN</th>
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
              <td>{{ b.categoryName }}</td>
              <td>{{ b.modelName }}</td>
              <td>{{ b.hsn || '-' }}</td>
              <td>{{ b.color }}</td>
              <td>{{ b.chassisNumber }}</td>
              <td>{{ b.engineNumber }}</td>
              <td>{{ b.warehouse }}</td>
              <td>{{ b.source }}</td>
              <td>{{ b.addedBy }}</td>
              <td>
                <button class="btn edit" @click="onEditRow(idx)">
                  Edit
                </button>
                <button class="btn remove" @click="removeFromTable(idx)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CONFIRM / SNACKBAR -->
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
      chassisCheck: {
        loading: false,
        available: null,
      },
      chassisDebounce: null,
      debounceDelayMs: 3000,
      dialogs: {
        chassisAvailable: false,
        chassisNumber: "",
      },
      invoiceDateMenu: false,
      // track which row is being edited
      editingIndex: null,
      // 🔹 used to avoid resetting dropdowns when we change values programmatically
      suppressDependentResets: false,
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

    // 🔹 CATEGORY CHANGE: user changes -> reset model, color, hsn
    "bikeForm.categoryName": function (newVal) {
      if (newVal) {
        this.fetchModels(newVal);
      } else {
        this.models = [];
      }

      if (this.suppressDependentResets) return;

      // user-triggered category change
      this.bikeForm.modelName = "";
      this.bikeForm.color = "";
      this.bikeForm.hsn = "";
    },

    // 🔹 MODEL CHANGE: always sync HSN, only reset color for user action
    "bikeForm.modelName": function (newVal) {
      const m = this.findModelByName(newVal);
      this.bikeForm.hsn = m && m.hsn ? String(m.hsn) : "";

      if (this.suppressDependentResets) return;

      // user-triggered model change -> reset color only
      this.bikeForm.color = "";
    },

    "bikeForm.chassisNumber": function (val) {
      if (this.chassisDebounce) {
        clearTimeout(this.chassisDebounce);
        this.chassisDebounce = null;
      }
      const trimmed = (val || "").trim();
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
    },
  },
  computed: {
    formattedInvoiceDate() {
      return this.formatDate(this.commonInvoiceDate);
    },
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
        source: "TVS Motors Company",
        hsn: "",
        categoryName: "",
      };
    },
    formatDate(d) {
      if (!d) return "";

      // already in dd/mm/yyyy
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
        return d;
      }

      // handle yyyy-mm-dd or yyyy/mm/dd from v-date-picker
      const parts = String(d).split(/[-\/]/);
      if (parts.length === 3) {
        const [y, m, day] = parts;
        const dd = day.toString().padStart(2, "0");
        const mm = m.toString().padStart(2, "0");
        return `${dd}/${mm}/${y}`;
      }

      return d;
    },

    ensureModelFieldsDefaults() {
      if (this.commonInvoiceNumber)
        this.bikeForm.invoiceNumber = this.commonInvoiceNumber;
      if (this.commonInvoiceDate)
        this.bikeForm.invoiceDate = this.commonInvoiceDate;
      if (this.userName) this.bikeForm.addedBy = this.userName;
    },
    async fetchModels(categoryName) {
      if (!categoryName) {
        this.models = [];
        return;
      }
      try {
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL +
            "getCategoryModel/" +
            categoryName
        );
        if (res.data && Array.isArray(res.data.models)) {
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
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL + "getCategory"
        );
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
    findModelByName(modelName) {
      if (!modelName) return null;
      return this.models.find((m) => m.modelName === modelName) || null;
    },
    getColorsForModel(modelName) {
      const model = this.findModelByName(modelName);
      return model && Array.isArray(model.colors) ? model.colors : [];
    },
    triggerImmediateChassisCheck() {
      const trimmed = (this.bikeForm.chassisNumber || "").trim();
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
      if (trimmed !== (this.bikeForm.chassisNumber || "").trim()) return;
      this.checkChassisAvailability(trimmed);
    },
    async checkChassisAvailability(chassis) {
      try {
        const url =
          process.env.VUE_APP_AGENCY_BACKEND_URL + "inventory/check-chassis";
        const res = await axios.get(url, {
          params: { chassisNumber: chassis },
        });
        const body = (res && res.data) ? res.data : {};
        const hasItems = Array.isArray(body.items) && body.items.length > 0;
        const hasCount = typeof body.count === "number" ? body.count > 0 : false;
        const availableFlag =
          typeof body.available === "boolean"
            ? body.available
            : typeof body.available === "string"
            ? body.available.toLowerCase() === "true"
            : undefined;

        const exists =
          availableFlag === false || hasItems || hasCount || body.exists === true;

        if (chassis !== (this.bikeForm.chassisNumber || "").trim()) return;

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
    onChassisInput(e) {
      let v = "";
      if (typeof e === "string") v = e;
      else if (e && e.target && typeof e.target.value === "string") v = e.target.value;
      else v = this.bikeForm.chassisNumber || "";

      // keep only letters + digits, then uppercase
      v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (v.length > 17) v = v.slice(0, 17);
      this.bikeForm.chassisNumber = v;

      const len = (this.bikeForm.chassisNumber || "").length;
      if (len > 0 && len < 17) {
        this.singleBikeErrors.chassisNumber = `Chassis must be 17 characters (${len}/17)`;
      } else {
        if (len === 17 || len === 0) delete this.singleBikeErrors.chassisNumber;
      }
    },
    onEngineInput(e) {
      let v = "";
      if (typeof e === "string") v = e;
      else if (e && e.target && typeof e.target.value === "string") v = e.target.value;
      else v = this.bikeForm.engineNumber || "";

      // keep only letters + digits, then uppercase
      v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (v.length > 12) v = v.slice(0, 12);
      this.bikeForm.engineNumber = v;

      const len = (this.bikeForm.engineNumber || "").length;
      if (len > 0 && len !== 12) {
        this.singleBikeErrors.engineNumber = "Engine number must be exactly 12 characters";
      } else {
        if (len === 12 || len === 0) delete this.singleBikeErrors.engineNumber;
      }
    },
    validateCommon() {
      this.commonErrors = {};
      if (
        !this.commonInvoiceNumber ||
        !this.commonInvoiceNumber.toString().trim()
      ) {
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
      if (!b.categoryName || !b.categoryName.toString().trim())
        errors.categoryName = "Category is required";
      if (!b.modelName || !b.modelName.toString().trim())
        errors.modelName = "Model is required";
      if (!b.color || !b.color.toString().trim())
        errors.color = "Color is required";

      if (!b.chassisNumber || !b.chassisNumber.toString().trim())
        errors.chassisNumber = "Chassis Number is required";
      else if ((b.chassisNumber || "").length !== 17)
        errors.chassisNumber = "Chassis must be exactly 17 characters";

      if (!b.engineNumber || !b.engineNumber.toString().trim())
        errors.engineNumber = "Engine Number is required";
      else if ((b.engineNumber || "").length !== 12)
        errors.engineNumber = "Engine must be exactly 12 characters";

      if (!b.warehouse || !b.warehouse.toString().trim())
        errors.warehouse = "Warehouse is required";
      if (!b.addedBy || !b.addedBy.toString().trim())
        errors.addedBy = "Added By is required";
      if (!b.invoiceNumber || !b.invoiceNumber.toString().trim())
        errors.invoiceNumber = "Invoice Number is required";
      if (!b.invoiceDate) errors.invoiceDate = "Invoice Date is required";
      if (!b.source || !b.source.toString().trim())
        errors.source = "Source is required";

      if (this.chassisCheck.available === false)
        errors.chassisNumber = "Chassis number already exists";
      if (this.chassisCheck.loading)
        errors.chassisNumber = "Please wait, checking chassis number…";

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
        if (this.editingIndex !== null) {
          // UPDATE existing row at same index (old behaviour preserved)
          const existing = this.addedBikes[this.editingIndex] || {};
          const updatedBike = {
            ...this.bikeForm,
            _localId: existing._localId || this.bikeForm._localId,
          };
          this.$set(this.addedBikes, this.editingIndex, updatedBike);
          this.editingIndex = null;
          this.showSnackbar("success", "Bike updated in list.");

          // reset form for next new entry
          this.suppressDependentResets = true;
          this.bikeForm = this.getEmptyBikeForm();
          this.bikeForm.addedBy = this.userName || "";
          this.bikeForm.invoiceNumber = this.commonInvoiceNumber || "";
          this.bikeForm.invoiceDate = this.commonInvoiceDate || "";
          this.suppressDependentResets = false;
        } else {
          // ADD new row
          const payloadBike = {
            ...this.bikeForm,
            _localId: Date.now() + Math.floor(Math.random() * 1000),
          };
          this.addedBikes.push(payloadBike);
          this.showSnackbar("success", "Bike added to list.");

          // ✅ after Add More: keep dropdowns, clear chassis/engine/warehouse
          const prevCategory = this.bikeForm.categoryName;
          const prevModel = this.bikeForm.modelName;
          const prevColor = this.bikeForm.color;
          const prevHsn = this.bikeForm.hsn;
          const prevSource = this.bikeForm.source;

          this.suppressDependentResets = true;
          this.bikeForm = this.getEmptyBikeForm();
          this.bikeForm.addedBy = this.userName || "";
          this.bikeForm.invoiceNumber = this.commonInvoiceNumber || "";
          this.bikeForm.invoiceDate = this.commonInvoiceDate || "";

          // restore dropdown-related selections
          this.bikeForm.categoryName = prevCategory;
          this.bikeForm.modelName = prevModel;
          this.bikeForm.color = prevColor;
          this.bikeForm.hsn = prevHsn;
          this.bikeForm.source = prevSource;

          // clear chassis, engine, warehouse for next bike
          this.bikeForm.chassisNumber = "";
          this.bikeForm.engineNumber = "";
          this.bikeForm.warehouse = "";

          this.suppressDependentResets = false;
        }

        this.singleBikeErrors = {};
        this.chassisCheck.loading = false;
        this.chassisCheck.available = null;
        this.dialogs.chassisAvailable = false;
      } catch (err) {
        console.error("Error adding/updating bike to table:", err);
        this.showSnackbar("error", "Failed to add/update bike locally. See console.");
      } finally {
        this.isSavingBike = false;
      }
    },
    removeFromTable(index) {
      this.addedBikes.splice(index, 1);
      if (this.editingIndex === index) {
        this.editingIndex = null;
      } else if (this.editingIndex !== null && index < this.editingIndex) {
        this.editingIndex = this.editingIndex - 1;
      }
      this.showSnackbar("success", "Bike removed from list.");
    },
    onResetEverything() {
      this.commonInvoiceNumber = "";
      this.commonInvoiceDate = "";

      this.suppressDependentResets = true;
      this.bikeForm = this.getEmptyBikeForm();
      this.suppressDependentResets = false;

      this.addedBikes = [];
      this.commonErrors = {};
      this.singleBikeErrors = {};
      this.chassisCheck.loading = false;
      this.chassisCheck.available = null;
      this.dialogs.chassisAvailable = false;
      this.editingIndex = null;
    },
    onReset() {
      this.suppressDependentResets = true;
      this.bikeForm = this.getEmptyBikeForm();
      this.bikeForm.addedBy = this.userName || "";
      this.bikeForm.invoiceNumber = this.commonInvoiceNumber;
      this.bikeForm.invoiceDate = this.commonInvoiceDate;
      this.suppressDependentResets = false;

      this.singleBikeErrors = {};
      this.chassisCheck.loading = false;
      this.chassisCheck.available = null;
      this.dialogs.chassisAvailable = false;
      this.editingIndex = null;
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
    async submitAll() {
      this.showConfirmation = false;
      this.isSubmitting = true;

      try {
        const firstWarehouse =
          (this.addedBikes[0] && this.addedBikes[0].warehouse) ||
          this.bikeForm.warehouse ||
          "";

        const payload = {
          invoiceDate: this.commonInvoiceDate || this.bikeForm.invoiceDate,
          invoiceNumber:
            this.commonInvoiceNumber || this.bikeForm.invoiceNumber,
          warehouse: firstWarehouse,
          bikes: this.addedBikes.map((b) => {
            const copy = { ...b };
            delete copy._localId;
            return copy;
          }),
        };
        console.log("payload", JSON.stringify(payload, null, 2));
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
          (error &&
            error.response &&
            error.response.data &&
            error.response.data.message) ||
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
    onEditRow(index) {
      const bike = this.addedBikes[index];
      if (!bike) return;
      this.editingIndex = index;

      this.commonInvoiceNumber = bike.invoiceNumber || "";
      this.commonInvoiceDate = bike.invoiceDate || "";

      // load row data without triggering resets
      this.suppressDependentResets = true;
      this.bikeForm = { ...bike };
      this.ensureModelFieldsDefaults();
      this.suppressDependentResets = false;

      this.singleBikeErrors = {};
      this.chassisCheck.loading = false;
      this.chassisCheck.available = null;
      this.dialogs.chassisAvailable = false;
    },
  },
};
</script>

<style scoped>
.add-bike-form {
  max-width: 99%;
  margin: 9px auto;
  font-family: "Inter", Arial, sans-serif;
  background: #fff;
  border-radius: 8px;
  padding: 18px 24px;
  box-shadow: 0 2px 12px #0001;
}

/* header */
.header-row {
  display: flex;
  justify-content: space-between;
  width: 100%;
}
.title {
  width: 50%;
  margin: 0;
}
.header-status {
  width: 50%;
  text-align: right;
  font-size: 10px;
}
.status-strong {
  font-size: 1.2rem;
  font-weight: 600;
}

/* invoice */
.section {
  margin-top: 10px;
}
.invoice-row {
  display: flex;
  gap: 12px;
}
.field-block {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* bike fields grid */
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
.field-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

/* unify Vuetify field look like thin boxes */
.field-block :deep(.v-input__slot),
.field-detail :deep(.v-input__slot) {
  border-radius: 3px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  min-height: 32px;
}
.field-block :deep(.v-text-field__slot),
.field-detail :deep(.v-text-field__slot) {
  font-size: 14px;
}
.field-block :deep(.v-input--is-focused .v-input__slot),
.field-detail :deep(.v-input--is-focused .v-input__slot) {
  border-color: #2563eb;
}

/* fallback for any plain input */
.field-detail input,
.field-block input {
  border-radius: 3px;
  border: 1px solid #d1d5db;
  padding: 7px 8px;
  font-size: 14px;
  background: #ffffff;
  box-sizing: border-box;
}

/* buttons */
.button-bar {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin: 22px 0 10px;
}
.btn {
  min-width: 110px;
  padding: 6px 14px;
  border-radius: 5px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  transition: background 0.3s ease, box-shadow 0.1s ease, transform 0.1s ease;
}
.btn.primary {
  background: #283593;
  color: #fff;
}
.btn.primary:hover {
  background: #1f2a79;
  box-shadow: 0 4px 10px rgba(40, 53, 147, 0.45);
  transform: translateY(-1px);
}
.btn.remove {
  background: #d9534f;
  color: #fff;
}
.btn.remove:hover {
  background: #b52b27;
}
.btn.edit {
  background: #f0ad4e;
  color: #fff;
  margin-right: 4px;
}
.btn.edit:hover {
  background: #ec971f;
}

/* errors */
.field-error input,
.field-error :deep(.v-input__slot),
.field-error :deep(.v-select),
.field-error :deep(.v-input) {
  border-color: #d9534f !important;
}
.error-msg {
  color: #d9534f;
  font-size: 12px;
  margin-top: 4px;
}

/* table */
.table-wrapper {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
}
.bikes-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}
.bikes-table th,
.bikes-table td {
  border: 1px solid #e6e6e6;
  padding: 4px 6px; /* reduced padding for smaller row height */
  text-align: left;
  font-size: 12px; /* compact */
  background: #fff;
}
.bikes-table thead {
  background: #f6f6f6;
}
.bikes-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 4px 6px;
  border-bottom: 1px solid #ccc;
  font-weight: bold;
}

/* Add this to your <style scoped> */

.bikes-table th:last-child,
.bikes-table td:last-child {
  width: 90px;        /* or 80px / 70px as you like */
  white-space: nowrap; /* keep buttons on a single line */
}


/* responsive */
@media (max-width: 960px) {
  .invoice-row {
    flex-wrap: wrap;
  }
  .fields-row {
    flex-wrap: wrap;
  }
  .button-bar {
    flex-wrap: wrap;
  }
}
</style>
