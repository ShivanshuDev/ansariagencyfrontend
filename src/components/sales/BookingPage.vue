<template>
  <div class="bike-booking-form">
    <!-- HEADER -->
    <div class="header-row">
      <h2 class="title">Bike Booking</h2>
      <div class="header-status">
        <span class="status-strong">Create and manage bike bookings</span>
      </div>
    </div>

    <!-- ADD BOOKING BUTTON -->
    <section class="button-bar-top">
      <button
        type="button"
        class="btn primary"
        @click="showBookingDialog = true"
      >
        Add New Booking
      </button>
    </section>

    <!-- ===== BOOKING DIALOG ===== -->
    <v-dialog
      v-model="showBookingDialog"
      max-width="800px"
      persistent
    >
      <v-card>
        <v-card-title class="dialog-header">
          <span class="headline">Add New Booking</span>
          <v-spacer></v-spacer>
          <v-btn
            icon
            @click="showBookingDialog = false"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-card-text class="dialog-content">
          <!-- BOOKING FORM -->
          <div class="section">
            <h3 class="section-title">Booking Details</h3>

            <!-- ROW 1: Booking Date, User Name, Mobile -->
            <div class="fields-row">
              <!-- Booking Date -->
              <div class="field-detail" :class="{ 'field-error': bookingErrors.bookingDate }">
                <span class="field-label">Booking Date *</span>
                <v-menu
                  v-model="bookingDateMenu"
                  :close-on-content-click="false"
                  transition="scale-transition"
                  offset-y
                  max-width="290px"
                  min-width="290px"
                >
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field
                      :value="formattedBookingDate"
                      placeholder="Booking Date"
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
                    v-model="bookingForm.bookingDate"
                    scrollable
                    @input="bookingDateMenu = false"
                  />
                </v-menu>
                <div v-if="bookingErrors.bookingDate" class="error-msg">
                  {{ bookingErrors.bookingDate }}
                </div>
              </div>

              <!-- User Name -->
              <div class="field-detail" :class="{ 'field-error': bookingErrors.userName }">
                <span class="field-label">User Name *</span>
                <v-text-field
                  v-model="bookingForm.userName"
                  placeholder="Enter customer name"
                  prepend-inner-icon="mdi-account"
                  outlined
                  dense
                  hide-details
                />
                <div v-if="bookingErrors.userName" class="error-msg">
                  {{ bookingErrors.userName }}
                </div>
              </div>

              <!-- Mobile Number -->
              <div class="field-detail" :class="{ 'field-error': bookingErrors.mobileNumber }">
                <span class="field-label">Mobile Number *</span>
                <v-text-field
                  v-model="bookingForm.mobileNumber"
                  placeholder="10-digit mobile number"
                  prepend-inner-icon="mdi-phone"
                  outlined
                  dense
                  hide-details
                  maxlength="10"
                  @input="onMobileInput"
                />
                <div v-if="bookingErrors.mobileNumber" class="error-msg">
                  {{ bookingErrors.mobileNumber }}
                </div>
              </div>
            </div>

            <!-- ROW 2: Aadhaar, Deliver in Days -->
            <div class="fields-row">
              <!-- Aadhaar -->
              <div class="field-detail" :class="{ 'field-error': bookingErrors.aadharNumber }">
                <span class="field-label">Aadhaar Number *</span>
                <v-text-field
                  v-model="bookingForm.aadharNumber"
                  placeholder="12-digit Aadhaar number"
                  prepend-inner-icon="mdi-card-account-details"
                  outlined
                  dense
                  hide-details
                  maxlength="12"
                  @input="onAadharInput"
                />
                <div v-if="bookingErrors.aadharNumber" class="error-msg">
                  {{ bookingErrors.aadharNumber }}
                </div>
              </div>

              <!-- Deliver in Days -->
              <div class="field-detail" :class="{ 'field-error': bookingErrors.deliverInDays }">
                <span class="field-label">Deliver in (Days) *</span>
                <v-text-field
                  v-model="bookingForm.deliverInDays"
                  placeholder="e.g. 7"
                  prepend-inner-icon="mdi-truck-delivery"
                  outlined
                  dense
                  hide-details
                  type="number"
                  min="1"
                />
                <div v-if="bookingErrors.deliverInDays" class="error-msg">
                  {{ bookingErrors.deliverInDays }}
                </div>
              </div>

              <!-- EMPTY (for layout) -->
              <div class="field-detail dummy"></div>
            </div>

            <!-- ROW 3: Address (textarea) -->
            <div class="fields-row">
              <div class="field-detail" :class="{ 'field-error': bookingErrors.address }">
                <span class="field-label">Address *</span>
                <v-textarea
                  v-model="bookingForm.address"
                  placeholder="Enter full address"
                  auto-grow
                  rows="2"
                  outlined
                  dense
                  hide-details
                />
                <div v-if="bookingErrors.address" class="error-msg">
                  {{ bookingErrors.address }}
                </div>
              </div>
            </div>

            <!-- ROW 4: Category, Model, Color -->
            <div class="fields-row">
              <!-- Category -->
              <div class="field-detail" :class="{ 'field-error': bookingErrors.categoryName }">
                <span class="field-label">Category Name *</span>
                <v-autocomplete
                  v-model="bookingForm.categoryName"
                  :items="categories"
                  item-text="category"
                  item-value="category"
                  placeholder="Select Category"
                  outlined
                  dense
                  hide-details
                />
                <div v-if="bookingErrors.categoryName" class="error-msg">
                  {{ bookingErrors.categoryName }}
                </div>
              </div>

              <!-- Model -->
              <div class="field-detail" :class="{ 'field-error': bookingErrors.modelName }">
                <span class="field-label">Model Name *</span>
                <v-autocomplete
                  v-model="bookingForm.modelName"
                  :items="models"
                  item-text="modelName"
                  item-value="modelName"
                  placeholder="Select Model"
                  outlined
                  dense
                  hide-details
                />
                <div v-if="bookingErrors.modelName" class="error-msg">
                  {{ bookingErrors.modelName }}
                </div>
              </div>

              <!-- Color -->
              <div class="field-detail" :class="{ 'field-error': bookingErrors.color }">
                <span class="field-label">Color *</span>
                <v-autocomplete
                  v-model="bookingForm.color"
                  :items="getColorsForModel(bookingForm.modelName)"
                  placeholder="Select Color"
                  outlined
                  dense
                  hide-details
                />
                <div v-if="bookingErrors.color" class="error-msg">
                  {{ bookingErrors.color }}
                </div>
              </div>
            </div>

            <!-- ROW 5: Special Request -->
            <div class="fields-row">
              <div class="field-detail">
                <span class="field-label">Special Request</span>
                <v-textarea
                  v-model="bookingForm.specialRequest"
                  placeholder="Write any special request (optional)"
                  auto-grow
                  rows="2"
                  outlined
                  dense
                  hide-details
                />
              </div>
            </div>
          </div>
        </v-card-text>

        <v-card-actions class="dialog-actions">
          <v-spacer></v-spacer>
          <button
            type="button"
            class="btn"
            @click="showBookingDialog = false"
          >
            Cancel
          </button>
          <button
            type="button"
            class="btn primary"
            @click="onSaveBooking"
            :disabled="isSaving"
          >
            {{ isSaving ? 'Saving...' : 'Save Booking' }}
          </button>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ===== BOOKING TABLE + FILTERS ===== -->
    <section class="table-section">
      <h3>Bookings</h3>

      <!-- FILTER BAR -->
      <div class="filter-row">
        <!-- Search -->
        <div class="filter-field">
          <v-text-field
            v-model="searchQuery"
            placeholder="Search by name, mobile, category, model, Aadhaar..."
            prepend-inner-icon="mdi-magnify"
            outlined
            dense
            hide-details
          />
        </div>

        <!-- From Date -->
        <div class="filter-field">
          <v-menu
            v-model="fromDateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            max-width="290px"
            min-width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                :value="formattedFromDate"
                placeholder="From date"
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
              v-model="filterFromDate"
              scrollable
              @input="fromDateMenu = false"
            />
          </v-menu>
        </div>

        <!-- To Date -->
        <div class="filter-field">
          <v-menu
            v-model="toDateMenu"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            max-width="290px"
            min-width="290px"
          >
            <template v-slot:activator="{ on, attrs }">
              <v-text-field
                :value="formattedToDate"
                placeholder="To date"
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
              v-model="filterToDate"
              scrollable
              @input="toDateMenu = false"
            />
          </v-menu>
        </div>

        <!-- Clear Filters -->
        <div class="filter-field">
          <button type="button" class="btn" @click="clearFilters">
            Clear Filters
          </button>
        </div>

        <!-- Refresh Button -->
        <div class="filter-field">
          <button type="button" class="btn" @click="fetchAllBookings" :disabled="isLoading">
            {{ isLoading ? 'Loading...' : 'Refresh' }}
          </button>
        </div>
      </div>

      <!-- LOADING STATE -->
      <div v-if="isLoading" style="color:#666; margin-bottom:12px; text-align: center;">
        Loading bookings...
      </div>

      <!-- BOOKING TABLE -->
      <div v-else-if="filteredBookings.length === 0" style="color:#666; margin-bottom:12px;">
        No bookings found.
      </div>

      <div v-else class="table-wrapper">
        <table class="bookings-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Booking Date</th>
              <th>User Name</th>
              <th>Mobile</th>
              <th>Aadhaar</th>
              <th>Category</th>
              <th>Model</th>
              <th>Color</th>
              <th>Deliver in Days</th>
              <th>Special Request</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(b, idx) in filteredBookings" :key="b.bookingId">
              <td>{{ idx + 1 }}</td>
              <td>{{ b.bookingDate }}</td>
              <td>{{ b.userName }}</td>
              <td>{{ b.mobileNumber }}</td>
              <td>{{ b.aadharNumber }}</td>
              <td>{{ b.categoryName }}</td>
              <td>{{ b.modelName }}</td>
              <td>{{ b.color }}</td>
              <td>{{ b.deliverInDays }}</td>
              <td class="special-request-cell">
                <span :title="b.specialRequest">
                  {{ truncateText(b.specialRequest, 30) }}
                </span>
              </td>
              <td>
                <button
                  class="btn remove"
                  @click="removeBooking(b.bookingId, idx)"
                >
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

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

export default {
  name: "BikeBookingForm",
  data() {
    return {
      // DIALOG
      showBookingDialog: false,

      // FORM
      bookingForm: {
        bookingDate: "",        // raw from v-date-picker (yyyy-mm-dd)
        userName: "",
        address: "",
        aadharNumber: "",
        mobileNumber: "",
        categoryName: "",
        modelName: "",
        color: "",
        deliverInDays: "",
        specialRequest: "",
      },
      bookingErrors: {},
      isSaving: false,
      isLoading: false,

      // CATEGORY / MODEL / COLOR
      categories: [],
      models: [],

      // DATE MENUS
      bookingDateMenu: false,
      fromDateMenu: false,
      toDateMenu: false,

      // TABLE / FILTERS
      bookings: [],
      searchQuery: "",
      filterFromDate: "",       // raw, yyyy-mm-dd
      filterToDate: "",         // raw, yyyy-mm-dd

      snackbar: {
        show: false,
        message: "",
        timeout: 3000,
        color: "success",
      },
    };
  },
  computed: {
    // UI-formatted dates => dd/mm/yyyy
    formattedBookingDate() {
      return this.formatDate(this.bookingForm.bookingDate);
    },
    formattedFromDate() {
      return this.formatDate(this.filterFromDate);
    },
    formattedToDate() {
      return this.formatDate(this.filterToDate);
    },

    // FILTERED BOOKINGS FOR TABLE
    filteredBookings() {
      let rows = [...this.bookings];

      const q = (this.searchQuery || "").toLowerCase().trim();
      if (q) {
        rows = rows.filter((b) => {
          return (
            (b.userName || "").toLowerCase().includes(q) ||
            (b.mobileNumber || "").toLowerCase().includes(q) ||
            (b.categoryName || "").toLowerCase().includes(q) ||
            (b.modelName || "").toLowerCase().includes(q) ||
            (b.aadharNumber || "").toLowerCase().includes(q)
          );
        });
      }

      const fromDateObj = this.parseDateForCompare(this.filterFromDate);
      const toDateObj = this.parseDateForCompare(this.filterToDate);

      if (fromDateObj || toDateObj) {
        rows = rows.filter((b) => {
          const d = this.parseDateForCompare(b.bookingDate);
          if (!d) return false;
          if (fromDateObj && d < fromDateObj) return false;
          if (toDateObj && d > toDateObj) return false;
          return true;
        });
      }

      return rows;
    },
  },
  watch: {
    // when category changes, fetch models + reset model/color
    "bookingForm.categoryName": function (newVal) {
      if (newVal) {
        this.fetchModels(newVal);
      } else {
        this.models = [];
      }
      this.bookingForm.modelName = "";
      this.bookingForm.color = "";
    },
    // when model changes, just reset color
    "bookingForm.modelName": function () {
      this.bookingForm.color = "";
    },
  },
  mounted() {
    this.fetchCategory();
    this.fetchAllBookings(); // Load bookings when component mounts
    
    // optionally set default booking date to today
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    this.bookingForm.bookingDate = `${yyyy}-${mm}-${dd}`;
  },
  methods: {
    // === BACKEND CALLS ===
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

    // === NEW: FETCH ALL BOOKINGS ===
    async fetchAllBookings() {
      this.isLoading = true;
      try {
        const response = await axios.get(
          process.env.VUE_APP_AGENCY_BACKEND_URL + "getAllBookings"
        );
        
        if (response.data && Array.isArray(response.data.items)) {
          // Sort by creation date (newest first) - latest records on top
          this.bookings = response.data.items.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          this.showSnackbar("success", "Bookings loaded successfully");
        } else {
          this.bookings = [];
          this.showSnackbar("info", "No bookings found");
        }
      } catch (err) {
        console.error("Failed to fetch bookings:", err);
        this.showSnackbar("error", "Failed to load bookings");
        this.bookings = [];
      } finally {
        this.isLoading = false;
      }
    },

    findModelByName(modelName) {
      if (!modelName) return null;
      return this.models.find((m) => m.modelName === modelName) || null;
    },
    
    getColorsForModel(modelName) {
      const m = this.findModelByName(modelName);
      return m && Array.isArray(m.colors) ? m.colors : [];
    },

    // === DATE HELPERS (UI: dd/mm/yyyy) ===
    formatDate(d) {
      if (!d) return "";

      // already dd/mm/yyyy
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(d)) {
        return d;
      }

      // yyyy-mm-dd or yyyy/mm/dd
      const parts = String(d).split(/[-\/]/);
      if (parts.length === 3) {
        const [y, m, day] = parts;
        const dd = day.toString().padStart(2, "0");
        const mm = m.toString().padStart(2, "0");
        return `${dd}/${mm}/${y}`;
      }
      return d;
    },
    
    parseDateForCompare(str) {
      if (!str) return null;
      let y, m, d;

      if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        // dd/mm/yyyy
        const parts = str.split("/");
        d = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        y = parseInt(parts[2], 10);
      } else if (/^\d{4}[-\/]\d{2}[-\/]\d{2}$/.test(str)) {
        // yyyy-mm-dd or yyyy/mm/dd
        const parts = str.split(/[-\/]/);
        y = parseInt(parts[0], 10);
        m = parseInt(parts[1], 10) - 1;
        d = parseInt(parts[2], 10);
      } else {
        return null;
      }

      const dateObj = new Date(y, m, d);
      if (isNaN(dateObj.getTime())) return null;
      return dateObj;
    },

    // === INPUT HELPERS ===
    onAadharInput(e) {
      let v = typeof e === "string" ? e : this.bookingForm.aadharNumber || "";
      v = v.replace(/[^0-9]/g, "");
      if (v.length > 12) v = v.slice(0, 12);
      this.bookingForm.aadharNumber = v;
    },
    
    onMobileInput(e) {
      let v = typeof e === "string" ? e : this.bookingForm.mobileNumber || "";
      v = v.replace(/[^0-9]/g, "");
      if (v.length > 10) v = v.slice(0, 10);
      this.bookingForm.mobileNumber = v;
    },

    // === VALIDATION & SAVE ===
    validateBookingForm() {
      const b = this.bookingForm;
      const errors = {};

      if (!b.bookingDate) errors.bookingDate = "Booking date is required";
      if (!b.userName || !b.userName.toString().trim())
        errors.userName = "User name is required";
      if (!b.address || !b.address.toString().trim())
        errors.address = "Address is required";

      if (!b.aadharNumber || b.aadharNumber.length !== 12)
        errors.aadharNumber = "Aadhaar must be 12 digits";

      if (!b.mobileNumber || b.mobileNumber.length !== 10)
        errors.mobileNumber = "Mobile must be 10 digits";

      if (!b.categoryName || !b.categoryName.toString().trim())
        errors.categoryName = "Category is required";

      if (!b.modelName || !b.modelName.toString().trim())
        errors.modelName = "Model is required";

      if (!b.color || !b.color.toString().trim())
        errors.color = "Color is required";

      if (!b.deliverInDays || Number(b.deliverInDays) <= 0)
        errors.deliverInDays = "Deliver in days must be greater than 0";

      this.bookingErrors = errors;
      return Object.keys(errors).length === 0;
    },

    async onSaveBooking() {
      if (!this.validateBookingForm()) {
        return;
      }

      this.isSaving = true;
      try {
        // Create payload with bookingDate in dd/mm/yyyy (as per requirement)
        const payload = {
          ...this.bookingForm,
          bookingDate: this.formatDate(this.bookingForm.bookingDate),
        };

        const response = await axios.post(
          process.env.VUE_APP_AGENCY_BACKEND_URL + "addBooking",
          payload
        );
        console.log("✅ Booking saved:", response.data);

        // Refresh the bookings list to show the latest data
        await this.fetchAllBookings();

        // Close dialog and show success snackbar
        this.showBookingDialog = false;
        this.showSnackbar("success", "Booking added successfully!");
        this.resetForm();
      } catch (err) {
        console.error("❌ Error saving booking:", err);
        const msg =
          (err &&
            err.response &&
            err.response.data &&
            err.response.data.message) ||
          "Failed to save booking. Check console.";
        this.showSnackbar("error", msg);
      } finally {
        this.isSaving = false;
      }
    },

    resetForm() {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      
      this.bookingForm = {
        bookingDate: `${yyyy}-${mm}-${dd}`,
        userName: "",
        address: "",
        aadharNumber: "",
        mobileNumber: "",
        categoryName: "",
        modelName: "",
        color: "",
        deliverInDays: "",
        specialRequest: "",
      };
      this.bookingErrors = {};
    },

    // === FILTER / TABLE ===
    clearFilters() {
      this.searchQuery = "";
      this.filterFromDate = "";
      this.filterToDate = "";
    },
    
    async removeBooking(bookingId, index) {
      if (confirm("Are you sure you want to delete this booking?")) {
        try {
          // If you have a delete endpoint, you can call it here:
          // await axios.delete(process.env.VUE_APP_AGENCY_BACKEND_URL + "deleteBooking/" + bookingId);
          
          // For now, just remove from local state
          this.bookings.splice(index, 1);
          this.showSnackbar("success", "Booking removed successfully.");
        } catch (err) {
          console.error("Failed to delete booking:", err);
          this.showSnackbar("error", "Failed to delete booking");
        }
      }
    },
    
    truncateText(text, maxLen) {
      if (!text) return "";
      if (text.length <= maxLen) return text;
      return text.substring(0, maxLen) + "...";
    },

    // === SNACKBAR ===
    showSnackbar(color = "success", message = "") {
      this.snackbar.color = color;
      this.snackbar.message = message || "Action completed";
      this.snackbar.show = true;
    },
  },
};
</script>

<style scoped>
.bike-booking-form {
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

/* top button bar */
.button-bar-top {
  display: flex;
  justify-content: flex-start;
  margin: 20px 0;
}

/* dialog styles */
.dialog-header {
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  padding: 16px 24px;
}
.dialog-content {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}
.dialog-actions {
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
  gap: 8px;
}

/* sections */
.section {
  margin-top: 10px;
}
.section-title {
  margin-bottom: 6px;
}

/* rows */
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
.field-detail.dummy {
  flex: 1;
  visibility: hidden;
}
.field-label {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 4px;
}

/* unify Vuetify field look like thin boxes */
.field-detail :deep(.v-input__slot),
.filter-field :deep(.v-input__slot) {
  border-radius: 3px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  min-height: 32px;
}
.field-detail :deep(.v-text-field__slot),
.filter-field :deep(.v-text-field__slot) {
  font-size: 14px;
}
.field-detail :deep(.v-input--is-focused .v-input__slot),
.filter-field :deep(.v-input--is-focused .v-input__slot) {
  border-color: #2563eb;
}

/* fallback for plain input */
.field-detail input {
  border-radius: 3px;
  border: 1px solid #d1d5db;
  padding: 7px 8px;
  font-size: 14px;
  background: #ffffff;
  box-sizing: border-box;
}

/* buttons */
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
  background: #e5e7eb;
  color: #111827;
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

/* table section */
.table-section {
  margin-top: 20px;
}

/* filter row */
.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}
.filter-field {
  flex: 1;
  min-width: 180px;
}

/* table */
.table-wrapper {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid #e6e6e6;
}
.bookings-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 12px;
}
.bookings-table th,
.bookings-table td {
  border: 1px solid #e6e6e6;
  padding: 4px 6px;
  text-align: left;
  font-size: 12px;
  background: #fff;
}
.bookings-table thead {
  background: #f6f6f6;
}
.bookings-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  padding: 4px 6px;
  border-bottom: 1px solid #ccc;
  font-weight: bold;
}
.special-request-cell {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* responsive */
@media (max-width: 960px) {
  .fields-row {
    flex-wrap: wrap;
  }
  .button-bar-top {
    flex-wrap: wrap;
  }
  .filter-row {
    flex-direction: column;
  }
}
</style>