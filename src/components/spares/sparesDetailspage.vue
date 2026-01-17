<template>
  <div>
    <!-- Summary card -->
    <v-card class="spares-simple" elevation="2" max-width="820">
      <v-card-title class="d-flex align-center">
        <div>
          <div class="title">{{ partSummary?.partName || '-' }}</div>
          <div class="subtitle">{{ partSummary?.partNumber || '-' }}</div>
        </div>

        <v-spacer />

        <!-- Edit button opens dialog -->
        <v-btn small color="primary" @click="openDialog">
          <v-icon left small>mdi-pencil</v-icon>Edit
        </v-btn>
        &nbsp;
        <v-btn small color="error" @click="openDeleteDialog">
          <v-icon left small>mdi-delete</v-icon>Delete
        </v-btn>
      </v-card-title>

      <v-divider />

      <!-- Tabs for Summary and History -->
      <v-tabs v-model="tab" grow>
        <v-tab>Summary</v-tab>
        <v-tab>History</v-tab>
      </v-tabs>

      <v-divider />

      <v-tabs-items v-model="tab">
        <!-- Summary Tab -->
        <v-tab-item>
          <v-card-text class="py-4">
            <v-row>
              <v-col cols="12" md="6" class="field">
                <label class="label">Part Number</label>
                <div class="value">{{ partSummary?.partNumber || '-' }}</div>
              </v-col>

              <v-col cols="12" md="6" class="field">
                <label class="label">Part Name</label>
                <div class="value">{{ partSummary?.partName || '-' }}</div>
              </v-col>

              <v-col cols="12" md="6" class="field">
                <label class="label">Current Quantity</label>
                <div class="value">{{ partSummary?.currentQuantity != null ? partSummary.currentQuantity : '-' }}</div>
              </v-col>

              <v-col cols="12" md="6" class="field">
                <label class="label">Current Price</label>
                <div class="value">{{ partSummary?.currentPrice != null ? partSummary.currentPrice : '-' }}</div>
              </v-col>

              <v-col cols="12" md="6" class="field">
                <label class="label">Rack Number</label>
                <div class="value">{{ partSummary?.rakNumber || '-' }}</div>
              </v-col>

              <v-col cols="12" md="6" class="field">
                <label class="label">Added By</label>
                <div class="value">{{ partSummary?.addedBy || '-' }}</div>
              </v-col>

              <v-col cols="12" md="6" class="field">
                <label class="label">Last Updated</label>
                <div class="value">{{ formatDate(partSummary?.lastUpdated) || '-' }}</div>
              </v-col>

              <v-col cols="12" md="6" class="field">
                <label class="label">Total Transactions</label>
                <div class="value">{{ partHistory?.totalTransactions || 0 }}</div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-tab-item>

        <!-- History Tab -->
        <v-tab-item>
          <v-card-text class="py-4">
            <!-- Loading State -->
            <div v-if="loadingHistory" class="text-center py-6">
              <v-progress-circular indeterminate color="primary"></v-progress-circular>
              <div class="mt-2">Loading history...</div>
            </div>

            <!-- Error State -->
            <div v-else-if="historyError" class="text-center py-6 error--text">
              <v-icon color="error" large>mdi-alert-circle</v-icon>
              <div class="mt-2">{{ historyError }}</div>
              <v-btn small @click="loadPartHistory" class="mt-2">Retry</v-btn>
            </div>

            <!-- History Data -->
            <div v-else>
              <!-- History Stats -->
              <v-row class="mb-4">
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-text class="text-center">
                      <div class="text-h6">{{ partHistory?.totalTransactions || 0 }}</div>
                      <div class="text-caption text-grey">Total Transactions</div>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card outlined>
                    <v-card-text class="text-center">
                      <div class="text-h6">{{ partHistory?.totalQuantityAdded || 0 }}</div>
                      <div class="text-caption text-grey">Total Quantity Added</div>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>

              <!-- History Table -->
              <v-data-table
                :headers="historyHeaders"
                :items="partHistory?.history || []"
                :items-per-page="10"
                class="elevation-1"
                :loading="loadingHistory"
                loading-text="Loading history..."
                no-data-text="No history found"
              >
                <!-- Invoice Number -->
                <template v-slot:[`item.invoiceNumber`]="{ item }">
                  <span class="font-weight-medium">{{ item.invoiceNumber || 'N/A' }}</span>
                </template>

                <!-- Type -->
                <template v-slot:[`item.type`]="{ item }">
                  <v-chip small :color="getTypeColor(item.type)" dark>
                    {{ formatType(item.type) }}
                  </v-chip>
                </template>

                <!-- Quantity Change -->
                <template v-slot:[`item.quantityChange`]="{ item }">
                  <span :class="item.quantityChange >= 0 ? 'green--text' : 'red--text'">
                    {{ item.quantityChange >= 0 ? '+' : '' }}{{ item.quantityChange }}
                  </span>
                </template>

                <!-- Price -->
                <template v-slot:[`item.price`]="{ item }">
                  {{ formatPrice(item.price) }}
                </template>

                <!-- Dates -->
                <template v-slot:[`item.invoiceDate`]="{ item }">
                  {{ formatDate(item.invoiceDate) }}
                </template>
                <template v-slot:[`item.transactionDate`]="{ item }">
                  {{ formatDate(item.transactionDate) }}
                </template>
              </v-data-table>
            </div>
          </v-card-text>
        </v-tab-item>
      </v-tabs-items>
    </v-card>

    <!-- Edit Dialog -->
    <v-dialog v-model="dialog" max-width="600px">
      <v-card>
        <v-card-title>
          Edit Quantity
          <v-spacer />
          <v-btn icon @click="closeDialog"><v-icon>mdi-close</v-icon></v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text>
          <v-form ref="form" v-model="valid" lazy-validation>
            <v-row dense>
              <!-- All fields shown but disabled except quantity -->
              <v-col cols="12" md="6">
                <label>Part Number</label>
                <v-text-field
                  v-model="local.partNumber"
                  label="Part Number"
                  dense
                  hide-details
                  outlined
                  solo
                  disabled
                />
              </v-col>

              <v-col cols="12" md="6">
                <label>Part Name</label>
                <v-text-field
                  v-model="local.partName"
                  label="Part Name"
                  dense
                  hide-details
                  outlined
                  solo
                  disabled
                />
              </v-col>

              <v-col cols="12" md="6">
                <label>Price</label>
                <v-text-field
                  v-model.number="local.currentPrice"
                  label="Price"
                  type="number"
                  dense
                  hide-details
                  outlined
                  solo
                  
                />
              </v-col>

              <v-col cols="12" md="6">
                <label>Rack Number</label>
                <v-text-field
                  v-model="local.rakNumber"
                  label="Rack Number"
                  dense
                  hide-details
                  outlined
                  solo
                />
              </v-col>

              <!-- Editable Quantity -->
              <v-col cols="12" md="6">
                <label>Quantity</label>
                <v-text-field
                  v-model.number="local.currentQuantity"
                  label="Quantity"
                  type="number"
                  :rules="[v => v !== null && v !== undefined && !isNaN(v) && Number(v) >= 0 || 'Quantity must be ≥ 0']"
                  dense
                  hide-details
                  outlined
                  solo
                  autofocus
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn text @click="closeDialog">Cancel</v-btn>
          <v-btn color="primary" :loading="isSaving" @click="onUpdateClick">Update</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Update Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="420px">
      <v-card>
        <v-card-title class="headline">Confirm Update</v-card-title>
        <v-card-text>
          Are you sure you want to update the quantity to <strong>{{ local.currentQuantity }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="confirmDialog = false">No</v-btn>
          <v-btn color="primary" @click="confirmUpdate" :loading="isSaving">Yes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="500px">
      <v-card>
        <v-card-title class="headline error--text">
          <v-icon left color="error">mdi-alert-circle</v-icon>
          Confirm Delete
        </v-card-title>
        
        <v-card-text>
          <p class="mb-4">
            Are you sure you want to delete <strong>{{ partSummary?.partName }}</strong> 
            ({{ partSummary?.partNumber }})?
          </p>
          
          <v-alert type="warning" dense outlined class="mb-4">
            <div class="d-flex align-center">
              <v-icon left small>mdi-alert</v-icon>
              <span>This action cannot be undone. All history and data for this part will be permanently deleted.</span>
            </div>
          </v-alert>
          
          <div class="text-caption text-grey">
            <strong>Details:</strong><br>
            • Part Number: {{ partSummary?.partNumber }}<br>
            • Part Name: {{ partSummary?.partName }}<br>
            • Current Quantity: {{ partSummary?.currentQuantity }}<br>
            • Rack: {{ partSummary?.rakNumber || 'N/A' }}
          </div>
        </v-card-text>
        
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="deleteDialog = false">Cancel</v-btn>
          <v-btn 
            color="error" 
            @click="confirmDelete"
            :loading="isDeleting"
            depressed
          >
            <v-icon left>mdi-delete</v-icon>
            Delete Permanently
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar.show" :timeout="snackbar.timeout" :color="snackbar.color">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn icon @click="snackbar.show = false"><v-icon>mdi-close</v-icon></v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "SparesDetails",
  props: {
    item: { type: Object, required: true },
  },
  data() {
    return {
      tab: 0, // 0 = summary, 1 = history
      dialog: false,
      confirmDialog: false,
      deleteDialog: false, // New dialog for delete confirmation
      valid: false,
      isSaving: false,
      isDeleting: false, // New loading state for delete
      loadingHistory: false,
      historyError: null,
      partSummary: null,
      partHistory: null,
      snackbar: { show: false, message: "", timeout: 3000, color: "success" },
      local: { ...this.item },
      
      // History table headers
      historyHeaders: [
        { text: 'Invoice Number', value: 'invoiceNumber' },
        { text: 'Invoice Date', value: 'invoiceDate' },
        { text: 'Transaction Date', value: 'transactionDate' },
        { text: 'Type', value: 'type' },
        { text: 'Quantity Change', value: 'quantityChange', align: 'center' },
        { text: 'Price', value: 'price', align: 'right' },
        { text: 'Added By', value: 'addedBy' },
      ],
    };
  },
  watch: {
    // Load history when switching to history tab
    tab(newTab) {
      if (newTab === 1 && !this.partHistory && !this.loadingHistory) {
        this.loadPartHistory();
      }
    },
    
    // Update data when prop changes
    item: {
      immediate: true,
      handler(newVal) {
        this.partSummary = {
          partNumber: newVal.partNumber,
          partName: newVal.partName,
          currentQuantity: newVal.quantity,
          currentPrice: newVal.price,
          rakNumber: newVal.rakNumber,
          addedBy: newVal.addedBy,
          lastUpdated: newVal.updatedAt
        };
        this.local = { ...this.partSummary };
      }
    }
  },
  methods: {
    // Load part history from API
    async loadPartHistory() {
      if (!this.partSummary?.partNumber) {
        this.historyError = "Part number is required";
        return;
      }

      this.loadingHistory = true;
      this.historyError = null;

      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL || ''}getPartHistory/${this.partSummary.partNumber}`;
        
        const response = await axios.get(url);
        this.partHistory = response.data;
        
        // Also update summary with latest data from API
        if (response.data.part) {
          this.partSummary = response.data.part;
          this.local = { ...this.partSummary };
        }
      } catch (err) {
        console.error("Error loading part history:", err);
        this.historyError = err.response?.data?.error || "Failed to load history";
      } finally {
        this.loadingHistory = false;
      }
    },

    // Helper methods
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    },

    formatPrice(price) {
      if (!price && price !== 0) return '-';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(price);
    },

    formatType(type) {
      const typeMap = {
        'STOCK_ADD': 'Stock Added',
        'RESTOCK': 'Restock',
        'SALE': 'Sale',
        'ADJUSTMENT': 'Adjustment',
        'RETURN': 'Return'
      };
      return typeMap[type] || type || 'Unknown';
    },

    getTypeColor(type) {
      const colorMap = {
        'STOCK_ADD': 'green',
        'RESTOCK': 'blue',
        'SALE': 'orange',
        'ADJUSTMENT': 'grey',
        'RETURN': 'teal'
      };
      return colorMap[type] || 'grey';
    },

    // Edit dialog methods
    openDialog() {
      this.local = { ...this.partSummary };
      this.local.currentQuantity = this.local.currentQuantity != null ? Number(this.local.currentQuantity) : 0;
      this.dialog = true;
    },

    closeDialog() {
      this.dialog = false;
    },

    onUpdateClick() {
      const q = this.local.currentQuantity;
      if (q === null || q === undefined || isNaN(q) || Number(q) < 0) {
        this.showSnackbar("error", "Quantity must be a number ≥ 0");
        return;
      }
      this.confirmDialog = true;
    },

    // Update method
    async confirmUpdate() {
      this.confirmDialog = false;
      this.isSaving = true;
      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL}sellSpare`;
        
        const payload = {
          partNumber: this.local.partNumber || this.item.partNumber,
          quantity: this.local.currentQuantity || this.local.quantity,
          invoiceNumber: this.local.invoiceNumber || this.item.invoiceNumber,
          type: 'RESTOCK',
          price: this.local.currentPrice || this.local.price,
          partName: this.local.partName || this.item.partName,
          rakNumber: this.local.rakNumber || this.item.rakNumber
        };

        console.log("Sending payload:", payload);
        
        const res = await axios.post(url, payload);
        
        if (this.tab === 1) {
          await this.loadPartHistory();
        }
        
        this.$emit("saved", res.data || { ...this.local });
        this.showSnackbar("success", "Quantity updated successfully");
        this.dialog = false;
        this.$emit("refresh-data");
      } catch (err) {
        console.error("sellSpare error:", err.response || err);
        const msg = err.response?.data?.error || err.response?.data?.message || "Failed to update quantity";
        this.showSnackbar("error", msg);
      } finally {
        this.isSaving = false;
      }
    },

    // Delete methods
    openDeleteDialog() {
      if (!this.partSummary?.partNumber) {
        this.showSnackbar("error", "Cannot delete: Part number not found");
        return;
      }
      this.deleteDialog = true;
    },

    async confirmDelete() {
      this.isDeleting = true;
      
      try {
        // Send DELETE request with partNumber as URL parameter
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL || ''}delete/${this.partSummary.partNumber}`;
        
        // Using GET request as per your endpoint definition
        const response = await axios.get(url);
        console.log('response', response)
        
        if (response.status == 200) {
          this.showSnackbar("success", "Part deleted successfully");
          this.deleteDialog = false;
          
          // Emit event to parent component to remove this item from list
          this.$emit("deleted", this.partSummary.partNumber);
          this.$emit("refresh-data");
        } else {
          throw new Error(response.data.error || "Delete failed");
        }
      } catch (err) {
        console.error("Delete error:", err.response || err);
        const msg = err.response?.data?.error || err.message || "Failed to delete part";
        this.showSnackbar("error", msg);
      } finally {
        this.isDeleting = false;
      }
    },

    showSnackbar(color = "success", message = "") {
      this.snackbar.color = color;
      this.snackbar.message = message;
      this.snackbar.show = true;
    },
  },
};
</script>

<style scoped>
.spares-simple {
  border-radius: 10px;
}
.title {
  font-weight: 600;
  font-size: 18px;
  color: #0b2540;
}
.subtitle {
  font-size: 13px;
  color: #5b6b77;
}
.label {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 6px;
  display: block;
}
.value {
  font-size: 15px;
  color: #111827;
}
.field {
  padding: 6px 12px;
}
</style>