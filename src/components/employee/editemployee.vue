<template>
  <div class="edit-employee">
    <v-form ref="form" v-model="valid" lazy-validation>
      <v-row>
        <v-col cols="12" sm="6">
          <div class="field-label">Name</div>
          <v-text-field
            outlined
            density="compact"
            v-model="form.employeeName"
            hide-details="auto"
            :rules="[r => !!r || 'Name required']"
            required
          />
        </v-col>

        <v-col cols="12" sm="4">
          <div class="field-label">Phone</div>
          <v-text-field density="compact" outlined v-model="form.phone" hide-details="auto" />
        </v-col>

        <v-col cols="12" sm="4">
          <div class="field-label">User ID</div>
          <v-text-field density="compact" outlined v-model="form.userId" hide-details="auto" />
        </v-col>

        <v-col cols="12" sm="4">
          <div class="field-label">Designation</div>
          <v-text-field density="compact" outlined v-model="form.department" hide-details="auto" />
        </v-col>

        <v-col cols="12" sm="4">
          <div class="field-label">Password</div>
          <v-text-field density="compact" outlined v-model="form.password" hide-details="auto" />
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <!-- Addresses -->
      <v-row>
        <v-col cols="12" md="6">
          <div class="address-block">
            <div class="address-header">
              <h4>Current Address</h4>
            </div>

            <div class="field-label">Name</div>
            <v-text-field density="compact" outlined v-model="form.currentAddress.employeeName" hide-details="auto" />

            <div class="field-label">Line 1</div>
            <v-text-field density="compact" outlined v-model="form.currentAddress.line1" hide-details="auto" />

            <div class="field-label">Line 2</div>
            <v-text-field density="compact" outlined v-model="form.currentAddress.line2" hide-details="auto" />

            <div class="field-label">City</div>
            <v-text-field density="compact" outlined v-model="form.currentAddress.city" hide-details="auto" />

            <div class="field-label">Tahsil</div>
            <v-text-field density="compact" outlined v-model="form.currentAddress.tahsil" hide-details="auto" />

            <div class="field-label">State</div>
            <v-text-field density="compact" outlined v-model="form.currentAddress.state" hide-details="auto" />

            <div class="field-label">Pincode</div>
            <v-text-field density="compact" outlined v-model="form.currentAddress.pincode" hide-details="auto" />

            <div class="field-label">Country</div>
            <v-text-field density="compact" outlined v-model="form.currentAddress.country" hide-details="auto" />
          </div>
        </v-col>

        <v-col cols="12" md="6">
          <div class="address-block">
            <div class="address-header" style="display:flex; justify-content:space-between; align-items:center;">
              <h4>Permanent Address</h4>
              <v-btn variant="text" size="small" @click="copyCurrentToPermanent">Copy From Current</v-btn>
            </div>

            <div class="field-label">Name</div>
            <v-text-field density="compact" outlined v-model="form.permanentAddress.employeeName" hide-details="auto" />

            <div class="field-label">Line 1</div>
            <v-text-field density="compact" outlined v-model="form.permanentAddress.line1" hide-details="auto" />

            <div class="field-label">Line 2</div>
            <v-text-field density="compact" outlined v-model="form.permanentAddress.line2" hide-details="auto" />

            <div class="field-label">City</div>
            <v-text-field density="compact" outlined v-model="form.permanentAddress.city" hide-details="auto" />

            <div class="field-label">Tahsil</div>
            <v-text-field density="compact" outlined v-model="form.permanentAddress.tahsil" hide-details="auto" />

            <div class="field-label">State</div>
            <v-text-field density="compact" outlined v-model="form.permanentAddress.state" hide-details="auto" />

            <div class="field-label">Pincode</div>
            <v-text-field density="compact" outlined v-model="form.permanentAddress.pincode" hide-details="auto" />

            <div class="field-label">Country</div>
            <v-text-field density="compact" outlined v-model="form.permanentAddress.country" hide-details="auto" />
          </div>
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <!-- Bank -->
      <v-row>
        <v-col cols="12" md="4">
          <div class="field-label">Bank Name</div>
          <v-text-field density="compact" outlined v-model="form.bank.bankName" hide-details="auto" />
        </v-col>
        <v-col cols="12" md="4">
          <div class="field-label">Branch</div>
          <v-text-field density="compact" outlined v-model="form.bank.branch" hide-details="auto" />
        </v-col>
        <v-col cols="12" md="4">
          <div class="field-label">IFSC</div>
          <v-text-field density="compact" outlined v-model="form.bank.ifsc" hide-details="auto" />
        </v-col>

        <v-col cols="12" md="6">
          <div class="field-label">Account Holder</div>
          <v-text-field density="compact" outlined v-model="form.bank.accountHolder" hide-details="auto" />
        </v-col>
        <v-col cols="12" md="6">
          <div class="field-label">Account Number</div>
          <v-text-field density="compact" outlined v-model="form.bank.accountNumber" hide-details="auto" />
        </v-col>
      </v-row>

      <v-divider class="my-3" />

      <!-- Permissions -->
      <div class="mb-2"><strong>Permissions</strong></div>
      <v-row>
        <v-col cols="12" md="6">
          <div class="field-label">Add</div>
          <v-switch v-model="form.userPermissions.add" hide-details />
          <div class="field-label">Edit</div>
          <v-switch v-model="form.userPermissions.edit" hide-details />
          <div class="field-label">Delete</div>
          <v-switch v-model="form.userPermissions.delete" hide-details />
        </v-col>
        <v-col cols="12" md="6">
          <div class="field-label">Download</div>
          <v-switch v-model="form.userPermissions.download" hide-details />
          <div class="field-label">Sales</div>
          <v-switch v-model="form.userPermissions.sales" hide-details />
          <div class="field-label">RTO</div>
          <v-switch v-model="form.userPermissions.rto" hide-details />
        </v-col>
      </v-row>

      <v-row class="mt-4">
        <v-col cols="12" class="text-right">
          <v-btn variant="text" @click="onCancel">Cancel</v-btn>
          <!-- Edit acts as confirm + save (single step) -->
          <v-btn color="primary" :loading="saving" :disabled="saving" @click="onRequestEdit">
            Edit
          </v-btn>
        </v-col>
      </v-row>
    </v-form>

    <!-- Custom Confirmation / Error Dialog -->
    <v-dialog v-model="confirm.open" max-width="520">
      <v-card>
        <v-card-title class="text-h6">{{ confirm.title }}</v-card-title>
        <v-card-text>
          <div v-if="confirm.message">{{ confirm.message }}</div>

          <v-alert
            v-if="confirm.errorMessage"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ confirm.errorMessage }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn v-if="confirm.showCancel" variant="text" @click="closeConfirm">No</v-btn>
          <v-btn :color="confirm.color" @click="handleConfirm">
            {{ confirm.confirmLabel }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'EditEmployee',
  props: {
    // either pass full employee object OR pass pk (employee id)
    employee: { type: Object, default: null },
    pk: { type: String, default: null }
  },
  data() {
    return {
      form: {
        employeeName: '',
        email: '',
        password:'',
        phone: '',
        venderId: '',
        userId: '',
        department: '',
        employeeRole: '',
        currentAddress: {
          employeeName: '', line1: '', line2: '', tahsil: '', city: '', state: '', pincode: '', country: ''
        },
        permanentAddress: {
          employeeName: '', line1: '', line2: '', tahsil: '', city: '', state: '', pincode: '', country: ''
        },
        bank: { bankName: '', branch: '', accountHolder: '', accountNumber: '', ifsc: '' },
        userPermissions: {}
      },
      loading: false,
      saving: false,
      valid: false,

      // Unified confirm/error dialog state
      confirm: {
        open: false,
        title: '',
        message: '',
        confirmLabel: 'Yes',
        showCancel: true,
        color: 'primary',
        errorMessage: '',
        onConfirm: null
      }
    };
  },
  watch: {
    // if parent passes employee prop, populate form immediately
    employee: {
      immediate: true,
      handler(val) {
        if (val) this.populateForm(val);
      }
    },
    // if parent passes pk only, load data
    pk: {
      immediate: true,
      handler(val) {
        if (val && !this.employee) this.loadByPk(val);
      }
    }
  },
  methods: {
    _deepClone(obj) {
      return JSON.parse(JSON.stringify(obj || {}));
    },

    populateForm(emp) {
      this.form.employeeName = emp.employeeName || '';
      this.form.password = emp.password || '';
      this.form.phone = emp.phone || '';
      this.form.userId = emp.userId || '';
      this.form.department = emp.department || '';
      this.form.employeeRole = emp.employeeRole || '';
      this.form.currentAddress = this._deepClone(emp.currentAddress || {});
      this.form.permanentAddress = this._deepClone(emp.permanentAddress || {});
      this.form.bank = this._deepClone(emp.bank || { bankName:'', branch:'', accountHolder:'', accountNumber:'', ifsc:'' });
      this.form.userPermissions = this._deepClone(emp.userPermissions || {});
    },

    async loadByPk(pk) {
      this.loading = true;
      try {
        const id = pk.startsWith('employee#') ? pk.split('#')[1] : pk;
        const res = await axios.get(process.env.VUE_APP_AGENCY_BACKEND_URL + `getEmployeeByPk/${id}`, { timeout: 10000 });
        const d = res && res.data ? res.data : null;
        const emp = (d && d.item) ? d.item : (d && d.employee) ? d.employee : d;
        if (emp) this.populateForm(emp);
      } catch (err) {
        this.showErrorDialog('Failed to load employee', this.formatErr(err));
      } finally {
        this.loading = false;
      }
    },

    copyCurrentToPermanent() {
      this.form.permanentAddress = this._deepClone(this.form.currentAddress);
    },

    onCancel() {
      this.$emit('cancel');
    },

    // EDIT → Confirm → Save immediately
    onRequestEdit() {
      this.showConfirmDialog({
        title: 'Save Changes?',
        message: 'Do you want to save the current changes to this employee?',
        confirmLabel: 'Yes, Save',
        color: 'primary',
        onConfirm: () => this.onSave()
      });
    },

    async onSave() {
      // Validate required fields (show in dialog instead of alert)
      if (!this.form.employeeName || !this.form.userId) {
        this.showErrorDialog('Missing Required Fields', 'Please provide both Name and User ID to continue.');
        return;
      }

      this.saving = true;
      try {
        const pkToSend =
          this.pk ||
          (this.employee && (this.employee.pk || this.employee.userId)) ||
          this.form.userId;

        const payload = { employee: this._deepClone(this.form), pk: pkToSend };
        const res = await axios.post(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateEmployeeDetail',
          payload,
          { timeout: 15000 }
        );

        this.$emit('saved', res && res.data ? res.data : res);

        // Optional success acknowledge (no extra action required)
        this.showConfirmDialog({
          title: 'Saved',
          message: 'Employee details were saved successfully.',
          confirmLabel: 'OK',
          showCancel: false,
          color: 'success',
          onConfirm: null
        });
      } catch (err) {
        this.showErrorDialog('Failed to Save Employee', this.formatErr(err));
        this.$emit('error', err);
      } finally {
        this.saving = false;
      }
    },

    // ------- Dialog helpers -------
    showConfirmDialog({ title, message, onConfirm, confirmLabel = 'Yes', showCancel = true, color = 'primary' }) {
      this.confirm.open = true;
      this.confirm.title = title || 'Confirm';
      this.confirm.message = message || '';
      this.confirm.confirmLabel = confirmLabel;
      this.confirm.showCancel = showCancel;
      this.confirm.color = color;
      this.confirm.errorMessage = '';
      this.confirm.onConfirm = typeof onConfirm === 'function' ? onConfirm : null;
    },
    showErrorDialog(title, errorMessage) {
      this.confirm.open = true;
      this.confirm.title = title || 'Error';
      this.confirm.message = '';
      this.confirm.confirmLabel = 'Close';
      this.confirm.showCancel = false;
      this.confirm.color = 'error';
      this.confirm.errorMessage = errorMessage || 'Something went wrong.';
      this.confirm.onConfirm = null;
    },
    closeConfirm() {
      this.confirm.open = false;
      this.confirm.onConfirm = null;
      this.confirm.errorMessage = '';
    },
    handleConfirm() {
      const cb = this.confirm.onConfirm;
      this.closeConfirm();
      if (cb) cb();
    },

    formatErr(err) {
      if (!err) return '';
      if (err.response && err.response.data) {
        try {
          return typeof err.response.data === 'string'
            ? err.response.data
            : JSON.stringify(err.response.data);
        } catch {
          return String(err.response.data);
        }
      }
      return err.message || String(err);
    }
  }
};
</script>

<style scoped>
.edit-employee { padding: 12px; }
.address-block { border-top: 1px solid #eee; padding-top: 8px; }
.address-header h4 { margin: 0 0 8px 0; }

/* external labels */
.field-label{
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: rgba(0,0,0,.87);
}

.v-text-field.v-input--density-compact {
  --v-input-padding-top: 2px;
  --v-input-padding-bottom: 2px;
  min-height: 36px !important;
}

.v-input.v-input--density-compact { font-size: 13px; }
</style>
