<template>
  <div>
    <!-- Summary card -->
    <v-card class="spares-simple" elevation="2" max-width="820">
      <v-card-title class="d-flex align-center">
        <div>
          <div class="title">{{ item?.partName || '-' }}</div>
          <div class="subtitle">{{ item?.partNumber || '-' }}</div>
        </div>

        <v-spacer />

        <!-- Edit button opens dialog -->
        <v-btn small color="primary" @click="openDialog">
          <v-icon left small>mdi-pencil</v-icon>Edit
        </v-btn>
      </v-card-title>

      <v-divider />

      <v-card-text class="py-4">
        <v-row>
          <v-col cols="12" md="6" class="field">
            <label class="label">Part Number</label>
            <div class="value">{{ item?.partNumber || '-' }}</div>
          </v-col>

          <v-col cols="12" md="6" class="field">
            <label class="label">Part Name</label>
            <div class="value">{{ item?.partName || '-' }}</div>
          </v-col>

          <v-col cols="12" md="6" class="field">
            <label class="label">Quantity</label>
            <div class="value">{{ item?.quantity != null ? item.quantity : '-' }}</div>
          </v-col>

          <v-col cols="12" md="6" class="field">
            <label class="label">Price</label>
            <div class="value">{{ item?.price != null ? item.price : '-' }}</div>
          </v-col>

          <v-col cols="12" md="6" class="field">
            <label class="label">Rack Number</label>
            <div class="value">{{ item?.rakNumber || '-' }}</div>
          </v-col>

          <v-col cols="12" md="6" class="field">
            <label class="label">Invoice Number</label>
            <div class="value">{{ item?.invoiceNumber || '-' }}</div>
          </v-col>

          <v-col cols="12" md="6" class="field">
            <label class="label">Invoice Date</label>
            <div class="value">{{ item?.invoiceDate || '-' }}</div>
          </v-col>
        </v-row>
      </v-card-text>
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
                <v-text-field
                  v-model.number="local.price"
                  label="Price"
                  type="number"
                  dense
                  hide-details
                  outlined
                  solo
                  disabled
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="local.rakNumber"
                  label="Rack Number"
                  dense
                  hide-details
                  outlined
                  solo
                  disabled
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="local.invoiceNumber"
                  label="Invoice Number"
                  dense
                  hide-details
                  outlined
                  solo
                  disabled
                />
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="local.invoiceDate"
                  label="Invoice Date"
                  dense
                  hide-details
                  outlined
                  solo
                  disabled
                />
              </v-col>

              <!-- Editable Quantity -->
              <v-col cols="12" md="6">
                <v-text-field
                  v-model.number="local.quantity"
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

    <!-- Confirmation Dialog -->
    <v-dialog v-model="confirmDialog" max-width="420px">
      <v-card>
        <v-card-title class="headline">Confirm Update</v-card-title>
        <v-card-text>
          Are you sure you want to update the quantity to <strong>{{ local.quantity }}</strong>?
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn text @click="confirmDialog = false">No</v-btn>
          <v-btn color="primary" @click="confirmUpdate" :loading="isSaving">Yes</v-btn>
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
      dialog: false,
      confirmDialog: false,
      valid: false,
      isSaving: false,
      snackbar: { show: false, message: "", timeout: 3000, color: "success" },
      // local editable copy - only used when dialog opens
      local: { ...this.item },
    };
  },
  watch: {
    // update local when parent item changes (but if dialog open we keep local)
    item(newVal) {
      if (!this.dialog) {
        this.local = { ...newVal };
      }
    },
  },
  methods: {
    openDialog() {
      // create fresh local copy from current prop
      this.local = { ...this.item };
      // ensure quantity field is numeric
      this.local.quantity = this.local.quantity != null ? Number(this.local.quantity) : 0;
      this.dialog = true;
    },
    closeDialog() {
      this.dialog = false;
    },
    onUpdateClick() {
      // validate quantity before asking for confirmation
      const q = this.local.quantity;
      if (q === null || q === undefined || isNaN(q) || Number(q) < 0) {
        this.showSnackbar("error", "Quantity must be a number ≥ 0");
        return;
      }
      // show confirmation
      this.confirmDialog = true;
    },
    async confirmUpdate() {
      this.confirmDialog = false;
      this.isSaving = true;
      try {
        const url = `${process.env.VUE_APP_AGENCY_BACKEND_URL || ''}sellSpare`;
        // payload - adjust field names if your backend expects different keys
        const payload = {
          partNumber: this.local.partNumber,
          quantity: this.local.quantity,
          invoiceNumber: this.local.invoiceNumber,
          type: 'RESTOCK'
          // include any other keys your API expects — keep minimal here
        }

        const res = await axios.post(url, payload);
        // emit save so parent can refresh list
        this.$emit("saved", res.data || { ...this.local });

        this.showSnackbar("success", "Quantity updated successfully");
        this.dialog = false;
      } catch (err) {
        console.error("sellSpare error:", err);
        const msg = (err && err.response && err.response.data && err.response.data.message) || "Failed to update quantity";
        this.showSnackbar("error", msg);
      } finally {
        this.isSaving = false;
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
