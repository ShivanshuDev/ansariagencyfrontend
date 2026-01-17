<template>
  <div class="add-spare-form">
    <h2>Add Spares / Parts</h2>

    <!-- Checking Status Indicator -->
    <div v-if="isCheckingPartNumber" class="checking-indicator">
      <div class="spinner"></div>
      <span>Checking part details...</span>
    </div>

    <!-- Record Limit Warning -->
    <div v-if="addedSpares.length >= 11 && isEditingIndex === null" class="limit-warning">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style="flex-shrink: 0;">
        <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
              stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Maximum limit of 11 parts reached. You cannot add more parts.</span>
    </div>

    <!-- COMMON INVOICE -->
    <div class="invoice-section">
      <div class="invoice-fields">
        <div class="field-details">
          <label>Invoice Number *</label>
          <input
            type="text"
            v-model="commonInvoiceNumber"
            placeholder="Invoice Number *"
          />
          <div v-if="showCommonErrors && commonErrors.invoiceNumber" class="error-msg">
            {{ commonErrors.invoiceNumber }}
          </div>
        </div>

        <div class="field-details">
          <label>Invoice Date *</label>
          <input
            type="date"
            v-model="commonInvoiceDate"
          />
          <div v-if="showCommonErrors && commonErrors.invoiceDate" class="error-msg">
            {{ commonErrors.invoiceDate }}
          </div>
        </div>
      </div>

      <div class="actions">
        <button type="button" class="reset-btn" @click="onReset">
          Reset Form
        </button>
      </div>
    </div>

    <!-- SINGLE SPARE FORM -->
    <div class="row">
      <div class="form-fields">
        <div class="fields-row">
          <!-- PART NUMBER -->
          <div class="field-detail autocomplete" :class="{'field-error': showSpareErrors && singleSpareErrors.partNumber}">
            <label>Part Number *</label>
            <div class="input-with-status">
              <input
                type="text"
                v-model="spareForm.partNumber"
                placeholder="Part Number *"
                @input="onPartNumberInput"
                @focus="activeSearchField = 'partNumber'"
                @blur="onPartNumberBlur"
                :disabled="shouldDisableForm"
              />
              <div v-if="partCheckStatus.exists" class="status-badge exists">
                <span>Exists</span>
                <button class="view-btn" @click.stop="showPartDetailsPopup(partCheckStatus.details)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z" fill="currentColor"/>
                    <path fill-rule="evenodd" clip-rule="evenodd" d="M12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM5 12C5 15.866 8.13401 19 12 19C15.866 19 19 15.866 19 12C19 8.13401 15.866 5 12 5C8.13401 5 5 8.13401 5 12Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>

            <ul
              v-if="activeSearchField === 'partNumber' && searchResults.length && !shouldDisableForm"
              class="autocomplete-list"
            >
              <li
                v-for="item in searchResults"
                :key="item.barcode"
                @mousedown="selectSpare(item)"
              >
                <strong>{{ item.barcode }}</strong> — {{ item.spareName }}
              </li>
            </ul>

            <div v-if="showSpareErrors && singleSpareErrors.partNumber" class="error-msg">
              {{ singleSpareErrors.partNumber }}
            </div>
          </div>

          <!-- PART NAME -->
          <div class="field-detail autocomplete" :class="{'field-error': showSpareErrors && singleSpareErrors.partName}">
            <label>Part Name *</label>
            <input
              type="text"
              v-model="spareForm.partName"
              placeholder="Part Name *"
              @input="onSearchSpare('partName')"
              @focus="activeSearchField = 'partName'"
              :disabled="shouldDisableForm"
            />

            <ul
              v-if="activeSearchField === 'partName' && searchResults.length && !shouldDisableForm"
              class="autocomplete-list"
            >
              <li
                v-for="item in searchResults"
                :key="item.barcode"
                @mousedown="selectSpare(item)"
              >
                {{ item.spareName }} ({{ item.barcode }})
              </li>
            </ul>

            <div v-if="showSpareErrors && singleSpareErrors.partName" class="error-msg">
              {{ singleSpareErrors.partName }}
            </div>
          </div>

          <!-- PRICE -->
          <div class="field-detail" :class="{'field-error': showSpareErrors && singleSpareErrors.price}">
            <label>Price *</label>
            <input 
              type="number" 
              v-model.number="spareForm.price" 
              min="0" 
              step="0.01"
              :disabled="shouldDisableForm"
            />
            <div v-if="showSpareErrors && singleSpareErrors.price" class="error-msg">
              {{ singleSpareErrors.price }}
            </div>
          </div>

          <!-- RAK -->
          <div class="field-detail" :class="{'field-error': showSpareErrors && singleSpareErrors.rakNumber}">
            <label>Rak Number *</label>
            <input 
              type="text" 
              v-model="spareForm.rakNumber" 
              :disabled="shouldDisableForm"
            />
            <div v-if="showSpareErrors && singleSpareErrors.rakNumber" class="error-msg">
              {{ singleSpareErrors.rakNumber }}
            </div>
          </div>

          <!-- QTY -->
          <div class="field-detail" :class="{'field-error': showSpareErrors && singleSpareErrors.qty}">
            <label>Qty *</label>
            <input 
              type="number" 
              v-model.number="spareForm.qty" 
              min="1" 
              :disabled="shouldDisableForm"
            />
            <div v-if="showSpareErrors && singleSpareErrors.qty" class="error-msg">
              {{ singleSpareErrors.qty }}
            </div>
          </div>

          <div class="form-actions">
            <button 
              class="save-btn" 
              @click="saveSpareToTable" 
              :disabled="isSavingSpare || shouldDisableSaveButton"
            >
              {{ isSavingSpare ? 'Saving...' : isEditingIndex !== null ? 'Update Part' : 'Save Part' }}
            </button>
            <button 
              v-if="isEditingIndex !== null"
              class="cancel-edit-btn"
              @click="cancelEdit"
            >
              Cancel Edit
            </button>
          </div>
        </div>
      </div>
    </div>

    <hr />

    <!-- TABLE -->
    <section>
      <h3>Added Parts ({{ addedSpares.length }} / 11)</h3>

      <div v-if="addedSpares.length === 0" class="empty-state">
        No parts added yet.
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
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(s, idx) in addedSpares" :key="s._localId">
              <td>{{ idx + 1 }}</td>
              <td>{{ s.invoiceNumber }}</td>
              <td>{{ formatDate(s.invoiceDate) }}</td>
              <td>{{ s.partNumber }}</td>
              <td>{{ s.partName }}</td>
              <td>{{ formatCurrency(s.price) }}</td>
              <td>{{ s.rakNumber }}</td>
              <td>{{ s.qty }}</td>
              <td class="action-buttons">
                <button class="edit-btn" @click="editSpare(idx)" :disabled="isEditingIndex !== null">
                  Edit
                </button>
                <button class="remove-btn" @click="removeFromTable(idx)">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <br />

    <!-- SUBMIT -->
    <section class="submit-section">
      <button class="cancel-all-btn" @click="onResetEverything">Cancel All</button>
      <button
        class="submit-all-btn"
        @click="onClickSubmitAll"
        :disabled="isSubmitting || addedSpares.length === 0"
      >
        {{ isSubmitting ? 'Submitting...' : `Submit ${addedSpares.length} Part(s)` }}
      </button>
    </section>

    <!-- PART DETAILS POPUP -->
    <v-dialog v-model="showPartDetails" max-width="600px" persistent>
      <v-card>
        <v-card-title class="popup-header">
          <div class="popup-title">
            <h3>Part Already Exists</h3>
            <span class="part-number-badge">{{ partCheckStatus.details?.partNumber }}</span>
          </div>
          <v-spacer />
          <v-btn icon @click="showPartDetails = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <div class="part-details-container">
            <div class="details-grid">
              <div class="detail-item">
                <span class="detail-label">Part Name:</span>
                <span class="detail-value">{{ partCheckStatus.details?.partName }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Current Stock:</span>
                <span class="detail-value stock-badge">
                  {{ partCheckStatus.details?.quantity }} units
                </span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Price:</span>
                <span class="detail-value price-badge">
                  {{ formatCurrency(partCheckStatus.details?.price) }}
                </span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Rack Number:</span>
                <span class="detail-value">{{ partCheckStatus.details?.rakNumber || 'N/A' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Last Invoice:</span>
                <span class="detail-value">{{ partCheckStatus.details?.invoiceNumber || 'N/A' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Invoice Date:</span>
                <span class="detail-value">{{ formatDate(partCheckStatus.details?.invoiceDate) }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Added By:</span>
                <span class="detail-value">{{ partCheckStatus.details?.addedBy || 'N/A' }}</span>
              </div>
              
              <div class="detail-item">
                <span class="detail-label">Last Updated:</span>
                <span class="detail-value">{{ formatDateFromTimestamp(partCheckStatus.details?.updatedAt) }}</span>
              </div>
            </div>
            
            <div class="popup-warning">
              <v-icon color="warning" class="warning-icon">mdi-alert-circle-outline</v-icon>
              <span>This part already exists in the database. Adding it again will create a duplicate entry.</span>
            </div>
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="useExistingPartData" :disabled="shouldDisableForm">
            Use Existing Data
          </v-btn>
          <v-btn color="grey" @click="showPartDetails = false" :disabled="shouldDisableForm">
            Continue Anyway
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- CONFIRM DIALOG -->
    <v-dialog persistent v-model="showConfirmation" max-width="520px">
      <v-card>
        <v-card-title>
          Save confirmation
          <v-spacer />
          <v-btn icon @click="noConfirmation">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-card-text>
          Are you sure you want to save {{ addedSpares.length }} part(s)?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" @click="submitAll">Yes</v-btn>
          <v-btn color="error" @click="noConfirmation">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- SNACKBAR -->
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
import debounce from "lodash/debounce";

export default {
  name: "AddSpareSingleForm",

  data() {
    return {
      userName: "",
      commonInvoiceNumber: "",
      commonInvoiceDate: "",

      spareForm: {
        partNumber: "",
        partName: "",
        price: 0,
        rakNumber: "",
        qty: 1,
        invoiceNumber: "",
        invoiceDate: "",
        addedBy: "",
      },

      addedSpares: [],
      isEditingIndex: null,
      singleSpareErrors: {},
      commonErrors: {},
      
      // Flags to control when to show errors
      showSpareErrors: false,
      showCommonErrors: false,

      isSavingSpare: false,
      isSubmitting: false,
      showConfirmation: false,

      snackbar: {
        show: false,
        message: "",
        timeout: 3000,
        color: "success",
      },

      // AUTOCOMPLETE
      searchResults: [],
      activeSearchField: null,
      searchTimer: null,

      // Part number checking
      isCheckingPartNumber: false,
      partCheckTimer: null,
      partCheckStatus: {
        exists: false,
        details: null,
        lastChecked: null
      },
      showPartDetails: false
    };
  },

  computed: {
    hasCommonErrors() {
      return Object.keys(this.commonErrors).length > 0;
    },
    
    isSpareFormValid() {
      return this.validateSpareForm(true);
    },
    
    isCommonFormValid() {
      return this.validateCommonFields(true);
    },

    // Check if max limit is reached (only when not editing)
    isMaxLimitReached() {
      return this.addedSpares.length >= 11 && this.isEditingIndex === null;
    },

    // Disable form fields only when max limit reached AND not editing
    shouldDisableForm() {
      return this.isMaxLimitReached;
    },

    // Disable save button conditions
    shouldDisableSaveButton() {
      return this.shouldDisableForm || (this.isEditingIndex === null && this.addedSpares.length >= 11);
    }
  },

  watch: {
    commonInvoiceNumber(v) {
      this.spareForm.invoiceNumber = v;
    },
    commonInvoiceDate(v) {
      this.spareForm.invoiceDate = v;
    },

    // Watch for limit changes and show warning
    'addedSpares.length': function(newLength) {
      if (newLength >= 11 && this.isEditingIndex === null) {
        this.showSnackbar('warning', 'Maximum limit of 11 parts reached. Cannot add more parts.');
      }
    }
  },

  created() {
    // Create debounced function for part number checking
    this.debouncedCheckPartNumber = debounce(this.checkPartNumber, 800);
  },

  mounted() {
    // Set default invoice date to today
    const today = new Date().toISOString().split('T')[0];
    this.commonInvoiceDate = today;
    this.spareForm.invoiceDate = today;
  },

  methods: {
    // Part number input handler with debouncing
    onPartNumberInput() {
      // If max limit reached and not editing, prevent input
      if (this.shouldDisableForm) {
        return;
      }

      // Clear previous status when user starts typing
      if (this.spareForm.partNumber.length === 0) {
        this.partCheckStatus = { exists: false, details: null, lastChecked: null };
      }
      
      // Call autocomplete search
      this.onSearchSpare('partNumber');
      
      // Trigger debounced part number check (only if not empty)
      if (this.spareForm.partNumber.trim().length >= 3) {
        this.debouncedCheckPartNumber();
      }
    },

    onPartNumberBlur() {
      // Small delay to allow click events on status badge
      setTimeout(() => {
        this.activeSearchField = null;
      }, 200);
    },

    // Check part number in database
    async checkPartNumber() {
      // Don't check if form should be disabled
      if (this.shouldDisableForm) {
        return;
      }

      const partNumber = this.spareForm.partNumber.trim();
      
      if (!partNumber || partNumber.length < 3) {
        this.partCheckStatus = { exists: false, details: null, lastChecked: null };
        return;
      }

      // Don't check if we already checked this part number recently
      if (this.partCheckStatus.lastChecked === partNumber) {
        return;
      }

      this.isCheckingPartNumber = true;
      
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_AGENCY_BACKEND_URL}checkPartNumber/${encodeURIComponent(partNumber)}`
        );
        
        this.partCheckStatus = {
          exists: response.data.exists,
          details: response.data.exists ? response.data.part : null,
          lastChecked: partNumber
        };
        
        // Auto-show popup if part exists and not currently editing
        if (response.data.exists && this.isEditingIndex === null && !this.shouldDisableForm) {
          this.showPartDetails = true;
        }
        
      } catch (error) {
        console.error('Error checking part number:', error);
        this.partCheckStatus = { exists: false, details: null, lastChecked: partNumber };
      } finally {
        this.isCheckingPartNumber = false;
      }
    },

    // Show part details in popup
    showPartDetailsPopup(partDetails) {
      // Don't show popup if form should be disabled
      if (this.shouldDisableForm) {
        this.showSnackbar('warning', 'Cannot add new parts. Maximum limit reached.');
        return;
      }
      
      this.partCheckStatus.details = partDetails;
      this.showPartDetails = true;
    },

    // Use existing part data
    useExistingPartData() {
      // Check limit before using data
      if (this.shouldDisableForm) {
        this.showSnackbar('warning', 'Cannot add new parts. Maximum limit reached.');
        this.showPartDetails = false;
        return;
      }

      if (this.partCheckStatus.details) {
        const details = this.partCheckStatus.details;
        
        // Pre-fill the form with existing data
        this.spareForm.partName = details.partName || '';
        this.spareForm.price = details.price || 0;
        this.spareForm.rakNumber = details.rakNumber || '';
        
        this.showSnackbar('info', 'Form prefilled with existing part data');
        this.showPartDetails = false;
      }
    },

    // VALIDATION METHODS
    validateCommonFields(silent = false) {
      const errors = {};
      
      if (!this.commonInvoiceNumber?.trim()) {
        errors.invoiceNumber = "Invoice number is required";
      }
      
      if (!this.commonInvoiceDate) {
        errors.invoiceDate = "Invoice date is required";
      } else {
        const date = new Date(this.commonInvoiceDate);
        const today = new Date();
        if (date > today) {
          errors.invoiceDate = "Invoice date cannot be in the future";
        }
      }
      
      this.commonErrors = errors;
      
      if (!silent && Object.keys(errors).length > 0) {
        this.showSnackbar("error", "Please fix invoice errors");
      }
      
      return Object.keys(errors).length === 0;
    },
    
    validateSpareForm(silent = false) {
      const errors = {};
      
      if (!this.spareForm.partNumber?.trim()) {
        errors.partNumber = "Part number is required";
      }
      
      if (!this.spareForm.partName?.trim()) {
        errors.partName = "Part name is required";
      }
      
      if (!this.spareForm.price || this.spareForm.price <= 0) {
        errors.price = "Price must be greater than 0";
      }
      
      if (!this.spareForm.rakNumber?.trim()) {
        errors.rakNumber = "Rak number is required";
      }
      
      if (!this.spareForm.qty || this.spareForm.qty < 1) {
        errors.qty = "Quantity must be at least 1";
      }
      
      this.singleSpareErrors = errors;
      
      if (!silent && Object.keys(errors).length > 0) {
        this.showSnackbar("error", "Please fix all required fields");
      }
      
      return Object.keys(errors).length === 0;
    },

    // AUTOCOMPLETE METHODS
    onSearchSpare(field) {
      // Don't search if form should be disabled
      if (this.shouldDisableForm) {
        this.searchResults = [];
        return;
      }

      clearTimeout(this.searchTimer);
      const q = field === "partNumber" ? this.spareForm.partNumber : this.spareForm.partName;

      if (!q || q.length < 2) {
        this.searchResults = [];
        return;
      }

      this.searchTimer = setTimeout(async () => {
        try {
          const res = await axios.get(
            process.env.VUE_APP_AGENCY_BACKEND_URL + `searchSpares?q=${encodeURIComponent(q.toLowerCase())}`
          );
          this.searchResults = res.data || [];
        } catch (error) {
          console.error("Search failed:", error);
          this.searchResults = [];
        }
      }, 300);
    },

    selectSpare(item) {
      // Don't select if form should be disabled
      if (this.shouldDisableForm) {
        this.showSnackbar('warning', 'Cannot add new parts. Maximum limit reached.');
        return;
      }

      this.spareForm.partNumber = item.barcode;
      this.spareForm.partName = item.spareName;
      this.spareForm.price = item.price || 0;
      this.searchResults = [];
      this.activeSearchField = null;
      
      // Trigger part number check after selection
      this.debouncedCheckPartNumber();
    },

    // SPARE MANAGEMENT METHODS
    saveSpareToTable() {
      // Check limit before saving
      if (this.isEditingIndex === null && this.addedSpares.length >= 11) {
        this.showSnackbar('warning', 'Maximum limit of 11 parts reached. Cannot add more parts.');
        return;
      }

      // Show errors only when user clicks save
      this.showSpareErrors = true;
      this.showCommonErrors = true;
      
      // Validate both forms
      const isCommonValid = this.validateCommonFields();
      const isSpareValid = this.validateSpareForm();
      
      if (!isCommonValid || !isSpareValid) {
        // Show snackbar only if there are errors
        if (!isCommonValid && !isSpareValid) {
          this.showSnackbar("error", "Please fix all errors before saving");
        }
        return;
      }

      // Update invoice info in spare form
      this.spareForm.invoiceNumber = this.commonInvoiceNumber;
      this.spareForm.invoiceDate = this.commonInvoiceDate;
      this.spareForm.addedBy = this.userName;

      if (this.isEditingIndex !== null) {
        // Update existing spare
        this.addedSpares[this.isEditingIndex] = {
          ...this.spareForm,
          _localId: this.addedSpares[this.isEditingIndex]._localId,
        };
        this.showSnackbar("success", "Part updated successfully");
        this.isEditingIndex = null;
      } else {
        // Add new spare
        this.addedSpares.push({
          ...this.spareForm,
          _localId: Date.now() + Math.random(),
        });
        this.showSnackbar("success", "Part added successfully");
      }

      // Reset form and hide errors
      this.resetSpareForm();
      this.showSpareErrors = false;
    },
    
    editSpare(index) {
      // Don't allow editing if already editing another item
      if (this.isEditingIndex !== null && this.isEditingIndex !== index) {
        this.showSnackbar('warning', 'Please finish editing the current part first.');
        return;
      }

      const spareToEdit = this.addedSpares[index];
      this.spareForm = {
        partNumber: spareToEdit.partNumber,
        partName: spareToEdit.partName,
        price: spareToEdit.price,
        rakNumber: spareToEdit.rakNumber,
        qty: spareToEdit.qty,
        invoiceNumber: spareToEdit.invoiceNumber,
        invoiceDate: spareToEdit.invoiceDate,
        addedBy: spareToEdit.addedBy,
      };
      
      // Update common fields if they differ
      if (spareToEdit.invoiceNumber !== this.commonInvoiceNumber) {
        this.commonInvoiceNumber = spareToEdit.invoiceNumber;
      }
      if (spareToEdit.invoiceDate !== this.commonInvoiceDate) {
        this.commonInvoiceDate = spareToEdit.invoiceDate;
      }
      
      this.isEditingIndex = index;
      
      // Hide errors when editing
      this.showSpareErrors = false;
      this.showCommonErrors = false;
      
      // Check if this part exists in database
      this.debouncedCheckPartNumber();
      
      // Scroll to form
      const formElement = document.querySelector('.form-fields');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth' });
      }
      
      this.showSnackbar("info", "Editing part. Make changes and click 'Update Part'");
    },
    
    cancelEdit() {
      this.resetSpareForm();
      this.isEditingIndex = null;
      this.showSpareErrors = false;
      this.showCommonErrors = false;
      this.showSnackbar("info", "Edit cancelled");
    },

    removeFromTable(index) {
      if (confirm(`Are you sure you want to delete part "${this.addedSpares[index].partName}"?`)) {
        const wasEditing = this.isEditingIndex === index;
        this.addedSpares.splice(index, 1);
        this.showSnackbar("success", "Part removed successfully");
        
        // Reset editing if the item being edited is removed
        if (wasEditing) {
          this.cancelEdit();
        } else if (this.isEditingIndex !== null && this.isEditingIndex > index) {
          this.isEditingIndex--;
        }
      }
    },

    resetSpareForm() {
      this.spareForm = {
        partNumber: "",
        partName: "",
        price: 0,
        rakNumber: "",
        qty: 1,
        invoiceNumber: this.commonInvoiceNumber,
        invoiceDate: this.commonInvoiceDate,
        addedBy: this.userName,
      };
      this.singleSpareErrors = {};
      this.searchResults = [];
      this.activeSearchField = null;
      this.partCheckStatus = { exists: false, details: null, lastChecked: null };
    },

    // SUBMISSION METHODS
    onClickSubmitAll() {
      // Show common errors when trying to submit
      this.showCommonErrors = true;
      
      if (!this.validateCommonFields()) {
        this.showSnackbar("error", "Please fix invoice errors before submitting");
        return;
      }
      
      if (this.addedSpares.length === 0) {
        this.showSnackbar("warning", "No parts to submit");
        return;
      }
      
      this.showConfirmation = true;
    },

    noConfirmation() {
      this.showConfirmation = false;
    },

    async submitAll() {
      this.showConfirmation = false;
      
      // Validate once more before submitting
      this.showCommonErrors = true;
      if (!this.validateCommonFields()) {
        this.showSnackbar("error", "Cannot submit with invoice errors");
        return;
      }

      this.isSubmitting = true;

      try {
        await axios.post(
          process.env.VUE_APP_AGENCY_BACKEND_URL + "addSpares",
          {
            invoiceNumber: this.commonInvoiceNumber,
            invoiceDate: this.commonInvoiceDate,
            parts: this.addedSpares,
            addedBy: this.userName,
          }
        );

        this.showSnackbar("success", `${this.addedSpares.length} parts submitted successfully!`);
        
        // Reset everything after successful submission
        this.addedSpares = [];
        this.isEditingIndex = null;
        this.showCommonErrors = false;
        this.showSpareErrors = false;
        
        // Reset only the spare form, keep invoice info for next batch
        this.resetSpareForm();
        
      } catch (error) {
        console.error("Submission failed:", error);
        this.showSnackbar("error", "Failed to submit parts. Please try again.");
      } finally {
        this.isSubmitting = false;
      }
    },

    onReset() {
      if (confirm("Reset the current form? This will clear the current part being added/edited.")) {
        this.resetSpareForm();
        this.isEditingIndex = null;
        this.showSpareErrors = false;
        this.showCommonErrors = false;
        this.showSnackbar("info", "Form reset");
      }
    },

    onResetEverything() {
      if (confirm("Are you sure you want to reset everything? All unsaved parts will be lost.")) {
        this.commonInvoiceNumber = "";
        this.commonInvoiceDate = new Date().toISOString().split('T')[0];
        this.addedSpares = [];
        this.resetSpareForm();
        this.isEditingIndex = null;
        this.commonErrors = {};
        this.singleSpareErrors = {};
        this.showCommonErrors = false;
        this.showSpareErrors = false;
        this.showSnackbar("info", "All data reset");
      }
    },

    // UTILITY METHODS
    showSnackbar(color, message) {
      this.snackbar.color = color;
      this.snackbar.message = message;
      this.snackbar.show = true;
    },
    
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },
    
    formatDateFromTimestamp(timestamp) {
      if (!timestamp) return 'N/A';
      const date = new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },
    
    formatCurrency(amount) {
      if (!amount && amount !== 0) return '$0.00';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
      }).format(amount);
    }
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
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

/* Limit Warning */
.limit-warning {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 6px;
  margin-bottom: 15px;
  color: #856404;
  font-weight: 500;
  border-left: 4px solid #ffc107;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.limit-warning svg {
  color: #ffc107;
  flex-shrink: 0;
}

/* Checking Indicator */
.checking-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 6px;
  margin-bottom: 15px;
  border-left: 4px solid #4a90e2;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { opacity: 0.8; }
  50% { opacity: 1; }
  100% { opacity: 0.8; }
}

.checking-indicator .spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #4a90e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.checking-indicator span {
  color: #4a90e2;
  font-size: 14px;
  font-weight: 500;
}

/* Input with status */
.input-with-status {
  position: relative;
  width: 100%;
}

.input-with-status input {
  padding-right: 100px !important;
}

.input-with-status input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #e9ecef;
}

.status-badge {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
}

.status-badge.exists {
  background: #d4edda;
  color: #155724;
  pointer-events: auto;
}

.status-badge .view-btn {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: #155724;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge .view-btn:hover {
  opacity: 0.8;
}

/* Part Details Popup Styles */
.popup-header {
  background: linear-gradient(135deg, #f8f0ff 0%, #e8f4ff 100%);
  border-bottom: 1px solid #e4e7ec;
  padding: 16px 24px;
}

.popup-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.part-number-badge {
  background: #aa53cb;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.part-details-container {
  padding: 8px 0;
}

.details-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.stock-badge {
  display: inline-block;
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
}

.price-badge {
  display: inline-block;
  background: #fff3e0;
  color: #ef6c00;
  padding: 4px 10px;
  border-radius: 4px;
  font-weight: 600;
}

.popup-warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #fff8e1;
  border-radius: 8px;
  border-left: 4px solid #ffb300;
}

.popup-warning .warning-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.popup-warning span {
  color: #5d4037;
  font-size: 14px;
  line-height: 1.5;
}

/* Existing styles - unchanged */
.invoice-section {
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: flex-end;
  gap: 20px;
}

.invoice-fields {
  display: flex;
  flex-direction: row;
  gap: 20px;
  flex: 1;
}

.field-details {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.field-details label {
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.field-details input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e4e7ec;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
}

.field-details input:focus {
  outline: none;
  border-color: #aa53cb;
  box-shadow: 0 0 0 3px rgba(170, 83, 203, 0.1);
}

.fields-row {
  width: 100%;
  display: flex;
  align-items: flex-end;
  gap: 15px;
  flex-wrap: nowrap;
}

.form-fields {
  width: 100%;
  padding: 10px 0;
  margin: 10px 0 20px 0;
}

.field-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.field-detail label {
  margin-bottom: 6px;
  font-weight: 500;
  color: #333;
  font-size: 14px;
}

.field-detail input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e4e7ec;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  box-sizing: border-box;
  background: #f8fafc;
}

.field-detail input:focus {
  outline: none;
  border-color: #aa53cb;
  box-shadow: 0 0 0 3px rgba(170, 83, 203, 0.1);
  background: #fff;
}

.field-detail input:disabled {
  background-color: #f8f9fa;
  cursor: not-allowed;
  opacity: 0.7;
  border-color: #e9ecef;
}

.autocomplete {
  position: relative;
}

.autocomplete-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #fff;
  border: 1px solid #e4e7ec;
  border-top: none;
  border-radius: 0 0 6px 6px;
  width: 100%;
  max-height: 220px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.autocomplete-list li {
  padding: 10px 12px;
  cursor: pointer;
  font-size: 14px;
  border-bottom: 1px solid #f5f5f5;
}

.autocomplete-list li:last-child {
  border-bottom: none;
}

.autocomplete-list li:hover {
  background: #f8f0ff;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-end;
  min-width: 120px;
}

.save-btn, .cancel-edit-btn {
  width: 100%;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 14px;
  text-align: center;
}

.save-btn {
  background: #aa53cb;
  color: #fff;
}

.save-btn:hover:not(:disabled) {
  background: #8e3fb5;
}

.save-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.cancel-edit-btn {
  background: #6c757d;
  color: #fff;
}

.cancel-edit-btn:hover {
  background: #545b62;
}

.reset-btn {
  padding: 10px 20px;
  background: #6c757d;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
  font-size: 14px;
  white-space: nowrap;
}

.reset-btn:hover {
  background: #545b62;
}

hr {
  border: none;
  border-top: 1px solid #e4e7ec;
  margin: 20px 0;
}

.empty-state {
  color: #666;
  font-style: italic;
  text-align: center;
  padding: 40px 20px;
  background: #f9f9f9;
  border-radius: 6px;
  border: 1px dashed #ddd;
}

.table-wrapper {
  max-height: 500px;
  overflow-y: auto;
  border: 1px solid #e4e7ec;
  border-radius: 6px;
  margin-top: 10px;
}

.spares-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.spares-table thead th {
  position: sticky;
  top: 0;
  background: #f8f0ff;
  z-index: 10;
  padding: 12px;
  border-bottom: 2px solid #aa53cb;
  font-weight: 600;
  color: #333;
  text-align: left;
}

.spares-table td {
  padding: 12px;
  border-bottom: 1px solid #e4e7ec;
  vertical-align: middle;
}

.spares-table tbody tr:hover {
  background: #f9f5ff;
}

.action-buttons {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.edit-btn, .remove-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.edit-btn {
  background: #4a90e2;
  color: white;
}

.edit-btn:hover:not(:disabled) {
  background: #357ae8;
}

.edit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

.remove-btn {
  background: #dc3545;
  color: white;
}

.remove-btn:hover {
  background: #c82333;
}

.submit-section {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 20px;
}

.cancel-all-btn, .submit-all-btn {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 15px;
}

.cancel-all-btn {
  background: #6c757d;
  color: #fff;
}

.cancel-all-btn:hover {
  background: #545b62;
}

.submit-all-btn {
  background: #28a745;
  color: #fff;
}

.submit-all-btn:hover:not(:disabled) {
  background: #218838;
}

.submit-all-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.7;
}

/* ERROR STYLES */
.field-error input {
  border-color: #dc3545 !important;
  background: #fff5f5;
}

.field-error input:focus {
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.error-msg {
  color: #dc3545;
  font-size: 12px;
  margin-top: 4px;
  font-weight: 500;
}

h2 {
  color: #333;
  margin-bottom: 20px;
  font-weight: 600;
}

h3 {
  color: #555;
  margin-bottom: 15px;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .fields-row {
    flex-wrap: wrap;
  }
  
  .field-detail {
    min-width: calc(50% - 15px);
  }
  
  .details-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .add-spare-form {
    padding: 15px;
  }
  
  .invoice-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .invoice-fields {
    flex-direction: column;
  }
  
  .field-detail {
    min-width: 100%;
  }
  
  .input-with-status input {
    padding-right: 12px !important;
  }
  
  .status-badge {
    position: relative;
    right: auto;
    top: auto;
    transform: none;
    margin-top: 8px;
    justify-content: flex-start;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .edit-btn, .remove-btn {
    width: 100%;
  }
}
</style>