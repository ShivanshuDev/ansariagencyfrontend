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
      <div v-if="isTableFull" class="table-limit-reached">
        Maximum limit reached (23/23 bikes)
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
            :disabled="isTableFull"
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
            :disabled="isTableFull"
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
                :disabled="isTableFull"
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
            :disabled="isTableFull"
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
            :disabled="isTableFull"
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
            :disabled="isTableFull"
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
            :disabled="isTableFull"
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
            :disabled="isTableFull"
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
            :disabled="isTableFull"
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
            :disabled="isTableFull"
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
            :disabled="isTableFull"
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
        :disabled="isSavingBike || chassisCheck.loading || chassisCheck.available === false || isTableFull"
      >
        {{ isSavingBike ? (editingIndex !== null ? 'Updating...' : 'Saving...') : (editingIndex !== null ? 'Update' : 'Add More') }}
      </button>

      <button
        type="button"
        class="btn primary"
        @click="saveBikeToTable"
        :disabled="isSavingBike || chassisCheck.loading || chassisCheck.available === false || isTableFull"
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
      <h3>Added Bikes ({{ addedBikes.length }}/23)</h3>
      <div v-if="addedBikes.length === 0" style="color:#666; margin-bottom:12px;">
        No bikes added yet. Fill the form above and click <strong>Add More</strong>.
      </div>

      <div v-else class="table-wrapper">
        <table class="bikes-table">
          <thead>
            <tr>
              <th>#</th>
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

              <td>
                <template v-if="inlineEditIndex === idx">
                  <v-autocomplete
                    v-model="addedBikes[idx].categoryName"
                    :items="categoriesForInlineEdit"
                    item-text="category"
                    item-value="category"
                    placeholder="Select Category"
                    dense
                    hide-details
                    @input="onInlineCategoryChange(idx)"
                  />
                </template>
                <template v-else>
                  {{ b.categoryName }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <v-autocomplete
                    v-model="addedBikes[idx].modelName"
                    :items="modelsForInlineEdit[idx] || []"
                    item-text="modelName"
                    item-value="modelName"
                    placeholder="Select Model"
                    dense
                    hide-details
                    @input="onInlineModelChange(idx)"
                  />
                </template>
                <template v-else>
                  {{ b.modelName }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <input v-model="addedBikes[idx].hsn" class="inline-input" />
                </template>
                <template v-else>
                  {{ b.hsn || '-' }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <v-autocomplete
                    v-model="addedBikes[idx].color"
                    :items="colorsForInlineEdit[idx] || []"
                    placeholder="Select Color"
                    dense
                    hide-details
                  />
                </template>
                <template v-else>
                  {{ b.color }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <input 
                    v-model="addedBikes[idx].chassisNumber" 
                    class="inline-input" 
                    @input="onInlineChassisInput($event, idx)"
                  />
                </template>
                <template v-else>
                  {{ b.chassisNumber }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <input 
                    v-model="addedBikes[idx].engineNumber" 
                    class="inline-input" 
                    @input="onInlineEngineInput($event, idx)"
                  />
                </template>
                <template v-else>
                  {{ b.engineNumber }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <v-autocomplete
                    v-model="addedBikes[idx].warehouse"
                    :items="warehouses"
                    item-text="text"
                    item-value="value"
                    placeholder="Select Warehouse"
                    dense
                    hide-details
                  />
                </template>
                <template v-else>
                  {{ b.warehouse }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <input v-model="addedBikes[idx].source" class="inline-input" />
                </template>
                <template v-else>
                  {{ b.source }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <input v-model="addedBikes[idx].addedBy" class="inline-input" />
                </template>
                <template v-else>
                  {{ b.addedBy }}
                </template>
              </td>

              <td>
                <template v-if="inlineEditIndex === idx">
                  <button class="btn primary" @click="saveInlineEdit(idx)">
                    Save
                  </button>
                  <button class="btn remove" @click="cancelInlineEdit">
                    Cancel
                  </button>
                </template>
                <template v-else>
                  <button class="btn edit" @click="startInlineEdit(idx)">
                    Edit
                  </button>
                  <button class="btn remove" @click="removeFromTable(idx)">
                    Delete
                  </button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CONFIRM DIALOG -->
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

    <!-- SUBMISSION RESULT DIALOG -->
    <v-dialog v-model="showSubmissionResult" max-width="500px" persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          <v-icon 
            :color="submissionResult.type === 'success' ? 'green' : 'red'" 
            class="mr-2"
          >
            {{ submissionResult.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle' }}
          </v-icon>
          {{ submissionResult.type === 'success' ? 'Success!' : 'Failed!' }}
        </v-card-title>
        <v-card-text class="pt-4">
          <div class="submission-result-message">
            {{ submissionResult.message }}
          </div>
          <div v-if="submissionResult.details" class="submission-result-details mt-3">
            <strong>Details:</strong> {{ submissionResult.details }}
          </div>
          <div v-if="submissionResult.submittedCount !== undefined" class="submission-stats mt-3">
            <strong>Submitted:</strong> {{ submissionResult.submittedCount }} bike(s)
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn 
            color="primary" 
            @click="showSubmissionResult = false"
          >
            OK
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR FOR OTHER NOTIFICATIONS -->
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
      showSubmissionResult: false,
      submissionResult: {
        type: 'success',
        message: '',
        details: '',
        submittedCount: 0
      },
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
      editingIndex: null,
      suppressDependentResets: false,
      inlineEditIndex: null,
      inlineEditBackup: null,
      // For inline edit dropdowns
      inlineEditModels: {},
      inlineEditColors: {},
      // Track submitted bikes to prevent duplicate submission
      submittedBikeIds: new Set()
    };
  },
  computed: {
    formattedInvoiceDate() {
      return this.formatDate(this.commonInvoiceDate);
    },
    isTableFull() {
      return this.addedBikes.length >= 23;
    },
    categoriesForInlineEdit() {
      // Return categories for inline edit (allow custom entry)
      return [
        ...this.categories,
        { category: this.addedBikes[this.inlineEditIndex]?.categoryName, category: this.addedBikes[this.inlineEditIndex]?.categoryName }
      ].filter((v, i, a) => a.findIndex(t => t.category === v.category) === i);
    },
    modelsForInlineEdit() {
      // Cache models for each row during inline edit
      return this.inlineEditModels;
    },
    colorsForInlineEdit() {
      // Cache colors for each row during inline edit
      return this.inlineEditColors;
    }
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

    // CATEGORY CHANGE: user changes -> reset model, color, hsn
    "bikeForm.categoryName": function (newVal) {
      if (newVal) {
        this.fetchModels(newVal);
      } else {
        this.models = [];
      }

      if (this.suppressDependentResets) return;

      this.bikeForm.modelName = "";
      this.bikeForm.color = "";
      this.bikeForm.hsn = "";
    },

    // MODEL CHANGE: always sync HSN, only reset color for user action
    "bikeForm.modelName": function (newVal) {
      const m = this.findModelByName(newVal);
      this.bikeForm.hsn = m && m.hsn ? String(m.hsn) : "";

      if (this.suppressDependentResets) return;

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

    // Watch inline edit index to load models/colors when editing starts
    inlineEditIndex(newVal) {
      if (newVal !== null) {
        const row = this.addedBikes[newVal];
        if (row) {
          // Fetch models for this category
          if (row.categoryName) {
            this.fetchModelsForInlineEdit(row.categoryName, newVal);
          }
          // Set colors for this model
          if (row.modelName) {
            this.setColorsForInlineEdit(row.modelName, newVal);
          }
        }
      }
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
        source: "TVS Motors Company",
        hsn: "",
        categoryName: "",
      };
    },
    formatDate(d) {
      if (!d) return "";

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
        return d;
      }

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
    async fetchModelsForInlineEdit(categoryName, rowIndex) {
      if (!categoryName) {
        this.$set(this.inlineEditModels, rowIndex, []);
        return;
      }
      try {
        const res = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL +
            "getCategoryModel/" +
            categoryName
        );
        if (res.data && Array.isArray(res.data.models)) {
          // Add current model if not in list (for custom entries)
          const currentModel = this.addedBikes[rowIndex]?.modelName;
          const models = [...res.data.models];
          if (currentModel && !models.some(m => m.modelName === currentModel)) {
            models.push({ modelName: currentModel, hsn: '' });
          }
          this.$set(this.inlineEditModels, rowIndex, models);
        } else {
          this.$set(this.inlineEditModels, rowIndex, []);
        }
      } catch (err) {
        console.error("Failed to fetch models for inline edit:", err);
        this.$set(this.inlineEditModels, rowIndex, []);
      }
    },
    setColorsForInlineEdit(modelName, rowIndex) {
      const model = this.modelsForInlineEdit[rowIndex]?.find(m => m.modelName === modelName);
      let colors = [];
      
      if (model && Array.isArray(model.colors)) {
        colors = model.colors;
      }
      
      // Add current color if not in list (for custom entries)
      const currentColor = this.addedBikes[rowIndex]?.color;
      if (currentColor && !colors.includes(currentColor)) {
        colors.push(currentColor);
      }
      
      this.$set(this.inlineEditColors, rowIndex, colors);
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
    onInlineChassisInput(e, idx) {
      let v = e.target.value || "";
      v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (v.length > 17) v = v.slice(0, 17);
      this.addedBikes[idx].chassisNumber = v;
    },
    onInlineEngineInput(e, idx) {
      let v = e.target.value || "";
      v = v.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (v.length > 12) v = v.slice(0, 12);
      this.addedBikes[idx].engineNumber = v;
    },
    onInlineCategoryChange(rowIndex) {
      const category = this.addedBikes[rowIndex].categoryName;
      if (category) {
        this.fetchModelsForInlineEdit(category, rowIndex);
      }
      // Reset dependent fields
      this.addedBikes[rowIndex].modelName = "";
      this.addedBikes[rowIndex].color = "";
      this.addedBikes[rowIndex].hsn = "";
    },
    onInlineModelChange(rowIndex) {
      const modelName = this.addedBikes[rowIndex].modelName;
      // Find HSN for selected model
      const models = this.modelsForInlineEdit[rowIndex] || [];
      const model = models.find(m => m.modelName === modelName);
      if (model && model.hsn) {
        this.addedBikes[rowIndex].hsn = String(model.hsn);
      }
      // Set colors for this model
      this.setColorsForInlineEdit(modelName, rowIndex);
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

    isDuplicateInAddedBikes(bike, ignoreIndex = null) {
      const norm = (s) => (s || "").toString().trim().toUpperCase();
      const c = norm(bike.chassisNumber);
      const e = norm(bike.engineNumber);

      let chassisDupIndex = -1;
      let engineDupIndex = -1;

      for (let i = 0; i < this.addedBikes.length; i++) {
        if (ignoreIndex !== null && i === ignoreIndex) continue;
        const row = this.addedBikes[i];
        if (!row) continue;
        const rc = norm(row.chassisNumber);
        const re = norm(row.engineNumber);
        if (c && rc && c === rc) chassisDupIndex = i;
        if (e && re && e === re) engineDupIndex = i;
        if (chassisDupIndex !== -1 && engineDupIndex !== -1) break;
      }

      return { chassisDupIndex, engineDupIndex };
    },

    saveBikeToTable() {
      if (this.isTableFull) {
        this.showSnackbar("error", "Maximum limit reached (23 bikes). Cannot add more.");
        return;
      }

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

      // Check duplicates in addedBikes
      const dup = this.isDuplicateInAddedBikes(this.bikeForm, this.editingIndex);
      if (dup.chassisDupIndex !== -1 || dup.engineDupIndex !== -1) {
        if (dup.chassisDupIndex !== -1) {
          this.singleBikeErrors.chassisNumber = `Duplicate chassis found in row ${dup.chassisDupIndex + 1}`;
        }
        if (dup.engineDupIndex !== -1) {
          this.singleBikeErrors.engineNumber = `Duplicate engine found in row ${dup.engineDupIndex + 1}`;
        }
        this.showSnackbar("error", "Duplicate chassis/engine found in the current table. Resolve before adding/updating.");
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      this.isSavingBike = true;
      try {
        if (this.editingIndex !== null) {
          // UPDATE existing row
          const existing = this.addedBikes[this.editingIndex] || {};
          const updatedBike = {
            ...this.bikeForm,
            _localId: existing._localId || this.bikeForm._localId,
          };
          this.$set(this.addedBikes, this.editingIndex, updatedBike);
          this.editingIndex = null;
          this.showSnackbar("success", "Bike updated in list.");

          // Reset form for next new entry
          this.suppressDependentResets = true;
          this.bikeForm = this.getEmptyBikeForm();
          this.bikeForm.addedBy = this.userName || "";
          this.bikeForm.invoiceNumber = this.commonInvoiceNumber || "";
          this.bikeForm.invoiceDate = this.commonInvoiceDate || "";
          this.suppressDependentResets = false;
        } else {
          // ADD new row (check if we've reached the limit)
          if (this.addedBikes.length >= 23) {
            this.showSnackbar("error", "Maximum limit reached (23 bikes). Cannot add more.");
            return;
          }
          
          const payloadBike = {
            ...this.bikeForm,
            _localId: Date.now() + Math.floor(Math.random() * 1000),
          };
          this.addedBikes.push(payloadBike);
          this.showSnackbar("success", "Bike added to list.");

          // After Add More: keep dropdowns, clear chassis/engine/warehouse
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

          this.bikeForm.categoryName = prevCategory;
          this.bikeForm.modelName = prevModel;
          this.bikeForm.color = prevColor;
          this.bikeForm.hsn = prevHsn;
          this.bikeForm.source = prevSource;

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

    // INLINE EDIT HELPERS
    startInlineEdit(index) {
      // If another row is already editing, restore it first
      if (this.inlineEditIndex !== null && this.inlineEditIndex !== index) {
        this.cancelInlineEdit();
      }
      const row = this.addedBikes[index];
      if (!row) return;
      this.inlineEditIndex = index;
      this.inlineEditBackup = { ...row }; // shallow backup
      
      // Initialize models and colors for this row
      if (row.categoryName) {
        this.fetchModelsForInlineEdit(row.categoryName, index);
      }
      if (row.modelName) {
        this.setColorsForInlineEdit(row.modelName, index);
      }
    },
    saveInlineEdit(index) {
      const row = this.addedBikes[index];
      if (!row) return;

      // Run validation for the inline row
      const errors = this.validateSingleBike(row);
      if (Object.keys(errors).length) {
        this.showSnackbar("error", "Validation failed for edited row. Fix required.");
        this.singleBikeErrors = errors;
        return;
      }

      // Check duplicates excluding current edited row
      const dup = this.isDuplicateInAddedBikes(row, index);
      if (dup.chassisDupIndex !== -1 || dup.engineDupIndex !== -1) {
        let msg = "Duplicate found in table: ";
        if (dup.chassisDupIndex !== -1) msg += `chassis matches row ${dup.chassisDupIndex + 1}. `;
        if (dup.engineDupIndex !== -1) msg += `engine matches row ${dup.engineDupIndex + 1}.`;
        this.showSnackbar("error", msg);
        return;
      }

      // All good: commit inline edit
      this.inlineEditIndex = null;
      this.inlineEditBackup = null;
      this.showSnackbar("success", "Row updated successfully.");
    },
    cancelInlineEdit() {
      if (this.inlineEditIndex === null || !this.inlineEditBackup) {
        this.inlineEditIndex = null;
        this.inlineEditBackup = null;
        return;
      }

      this.$set(this.addedBikes, this.inlineEditIndex, {
        ...this.inlineEditBackup,
      });

      this.inlineEditIndex = null;
      this.inlineEditBackup = null;
    },

    removeFromTable(index) {
      this.addedBikes.splice(index, 1);

      // Clean up inline edit data
      if (this.inlineEditIndex === index) {
        this.inlineEditIndex = null;
        this.inlineEditBackup = null;
        this.$delete(this.inlineEditModels, index);
        this.$delete(this.inlineEditColors, index);
      } else if (this.inlineEditIndex !== null && index < this.inlineEditIndex) {
        this.inlineEditIndex = this.inlineEditIndex - 1;
        // Shift inline edit data
        const newModels = {};
        const newColors = {};
        Object.keys(this.inlineEditModels).forEach(key => {
          const newKey = key > index ? key - 1 : key;
          newModels[newKey] = this.inlineEditModels[key];
        });
        Object.keys(this.inlineEditColors).forEach(key => {
          const newKey = key > index ? key - 1 : key;
          newColors[newKey] = this.inlineEditColors[key];
        });
        this.inlineEditModels = newModels;
        this.inlineEditColors = newColors;
      }

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
      this.inlineEditIndex = null;
      this.inlineEditBackup = null;
      this.inlineEditModels = {};
      this.inlineEditColors = {};
      this.submittedBikeIds.clear();
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
      this.inlineEditIndex = null;
      this.inlineEditBackup = null;
    },
    onClickSubmitAll() {
      if (this.addedBikes.length === 0) {
        this.showSnackbar("Alert", "No bikes to submit.");
        return;
      }
      
      // Check for duplicates in the table before submission
      const duplicates = [];
      const seenChassis = new Set();
      const seenEngine = new Set();
      
      for (let i = 0; i < this.addedBikes.length; i++) {
        const bike = this.addedBikes[i];
        const chassis = bike.chassisNumber?.trim().toUpperCase();
        const engine = bike.engineNumber?.trim().toUpperCase();
        
        if (chassis && seenChassis.has(chassis)) {
          duplicates.push(`Row ${i + 1}: Duplicate chassis number`);
        }
        if (engine && seenEngine.has(engine)) {
          duplicates.push(`Row ${i + 1}: Duplicate engine number`);
        }
        
        if (chassis) seenChassis.add(chassis);
        if (engine) seenEngine.add(engine);
      }
      
      if (duplicates.length > 0) {
        this.showSnackbar("error", "Duplicate chassis/engine numbers found. Please resolve before submission.");
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
        // Filter out bikes that have already been submitted
        const bikesToSubmit = this.addedBikes.filter(bike => {
          const bikeId = `${bike.chassisNumber}_${bike.engineNumber}`;
          return !this.submittedBikeIds.has(bikeId);
        });

        if (bikesToSubmit.length === 0) {
          this.showSubmissionResult = true;
          this.submissionResult = {
            type: 'error',
            message: 'No new bikes to submit',
            details: 'All bikes have already been submitted in previous requests.',
            submittedCount: 0
          };
          this.isSubmitting = false;
          return;
        }

        const firstWarehouse =
          (bikesToSubmit[0] && bikesToSubmit[0].warehouse) ||
          this.bikeForm.warehouse ||
          "";

        const payload = {
          invoiceDate: this.commonInvoiceDate || this.bikeForm.invoiceDate,
          invoiceNumber:
            this.commonInvoiceNumber || this.bikeForm.invoiceNumber,
          warehouse: firstWarehouse,
          bikes: bikesToSubmit.map((b) => {
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

        // Mark these bikes as submitted
        bikesToSubmit.forEach(bike => {
          const bikeId = `${bike.chassisNumber}_${bike.engineNumber}`;
          this.submittedBikeIds.add(bikeId);
        });

        // Remove submitted bikes from the table
        this.addedBikes = this.addedBikes.filter(bike => {
          const bikeId = `${bike.chassisNumber}_${bike.engineNumber}`;
          return !this.submittedBikeIds.has(bikeId);
        });

        // Clear inline edit data for removed bikes
        this.inlineEditModels = {};
        this.inlineEditColors = {};
        if (this.inlineEditIndex !== null) {
          this.inlineEditIndex = null;
          this.inlineEditBackup = null;
        }

        this.showSubmissionResult = true;
        this.submissionResult = {
          type: 'success',
          message: `Successfully submitted ${bikesToSubmit.length} bike(s)`,
          details: 'Bikes have been added to inventory successfully.',
          submittedCount: bikesToSubmit.length
        };

        // Only reset the form if all bikes were submitted
        if (this.addedBikes.length === 0) {
          this.onReset();
        }
      } catch (error) {
        console.error("❌ Error saving bikes:", error);
        const msg =
          (error &&
            error.response &&
            error.response.data &&
            error.response.data.message) ||
          "Failed to save bikes. Check console.";
        
        this.showSubmissionResult = true;
        this.submissionResult = {
          type: 'error',
          message: 'Failed to submit bikes',
          details: msg,
          submittedCount: 0
        };
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
      // Old top-form edit still available
      const bike = this.addedBikes[index];
      if (!bike) return;
      this.editingIndex = index;

      this.commonInvoiceNumber = bike.invoiceNumber || "";
      this.commonInvoiceDate = bike.invoiceDate || "";

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
  align-items: center;
  width: 100%;
  margin-bottom: 15px;
}
.title {
  width: 40%;
  margin: 0;
}
.header-status {
  width: 40%;
  text-align: center;
  font-size: 10px;
}
.table-limit-reached {
  width: 20%;
  text-align: right;
  color: #ff5722;
  font-weight: 600;
  font-size: 14px;
  background: #fff3e0;
  padding: 5px 10px;
  border-radius: 4px;
  border: 1px solid #ffcc80;
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

/* Disabled state */
.field-block :deep(.v-input--is-disabled .v-input__slot),
.field-detail :deep(.v-input--is-disabled .v-input__slot) {
  background-color: #f5f5f5;
  border-color: #e0e0e0;
  color: #9e9e9e;
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
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.btn.primary {
  background: #283593;
  color: #fff;
}
.btn.primary:hover:not(:disabled) {
  background: #1f2a79;
  box-shadow: 0 4px 10px rgba(40, 53, 147, 0.45);
  transform: translateY(-1px);
}
.btn.remove {
  background: #d9534f;
  color: #fff;
}
.btn.remove:hover:not(:disabled) {
  background: #b52b27;
}
.btn.edit {
  background: #f0ad4e;
  color: #fff;
  margin-right: 4px;
}
.btn.edit:hover:not(:disabled) {
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
  padding: 4px 6px;
  text-align: left;
  font-size: 12px;
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

/* Inline dropdowns in table */
.bikes-table td :deep(.v-input) {
  margin: 0;
  padding: 0;
}
.bikes-table td :deep(.v-input__slot) {
  min-height: 28px !important;
  height: 28px !important;
  margin: 0 !important;
  padding: 0 4px !important;
}
.bikes-table td :deep(.v-input__control) {
  min-height: 28px !important;
}
.bikes-table td :deep(.v-select__slot) {
  margin: 0 !important;
}
.bikes-table td :deep(.v-select__selection) {
  font-size: 12px !important;
  line-height: 28px !important;
}

/* narrow action column */
.bikes-table th:last-child,
.bikes-table td:last-child {
  width: 90px;
  white-space: nowrap;
}

/* inline inputs in table */
.inline-input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  padding: 4px 6px;
  font-size: 12px;
  background: #ffffff;
  outline: none;
  border-radius: 3px;
  height: 28px;
}
.bikes-table td .inline-input {
  height: 28px;
  line-height: 28px;
}

/* Submission result dialog */
.submission-result-message {
  font-size: 16px;
  margin-bottom: 10px;
}
.submission-result-details {
  font-size: 14px;
  color: #666;
}
.submission-stats {
  font-size: 14px;
  color: #2196f3;
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
  .header-row {
    flex-wrap: wrap;
  }
  .title, .header-status, .table-limit-reached {
    width: 100%;
    text-align: left;
    margin-bottom: 10px;
  }
}
</style>