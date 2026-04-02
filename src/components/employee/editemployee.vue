<template>
  <div class="add-employee-form edit-employee-form">
    <header class="form-header">
      <h2>Edit Employee</h2>
      <div class="form-sub">Update employee record and banking information</div>
    </header>

    <section class="section card">
      <div class="section-head">
        <div class="badge">1</div>
        <h3>Basic Details</h3>
      </div>

      <div class="grid-3">
        <input type="text" v-model="form.employeeName" placeholder="Full Name *" required />

        <input
          type="text"
          v-model="form.phone"
          placeholder="Phone Number *"
          required
          inputmode="numeric"
          maxlength="10"
          @input="form.phone = onlyDigits(form.phone, 10)"
        />

        <input
          type="email"
          v-model="form.email"
          placeholder="Email *"
          required
        />

        <input type="text" v-model="form.userId" placeholder="User ID" />
        <input type="text" v-model="form.password" placeholder="Password" />

        <select v-model="form.department" class="full-select">
          <option value="">Select Department</option>
          <option value="Warehouse">Warehouse</option>
          <option value="Sales">Sales</option>
          <option value="Finance">Finance</option>
          <option value="RTO">RTO</option>
        </select>
      </div>
    </section>

    <section class="section addresses card">
      <div class="section-head">
        <div class="badge">2</div>
        <h3>Addresses</h3>
      </div>

      <div class="addresses-grid">
        <div class="address-col">
          <h4 class="subtitle">Permanent Address</h4>
          <div class="grid-2">
            <input type="text" v-model="form.permanentAddress.employeeName" placeholder="Name" />
            <input type="text" v-model="form.permanentAddress.line1" placeholder="Address Line 1" />
            <input type="text" v-model="form.permanentAddress.line2" placeholder="Address Line 2" />
            <input type="text" v-model="form.permanentAddress.tahsil" placeholder="Tahsil" />
            <select v-model="form.permanentAddress.country" class="full-select">
              <option value="India">India</option>
            </select>
            <select v-model="form.permanentAddress.state" class="full-select">
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
            <input type="text" v-model="form.permanentAddress.city" placeholder="City" />
            <input
              type="text"
              v-model="form.permanentAddress.pincode"
              placeholder="Pincode *"
              required
              inputmode="numeric"
              maxlength="6"
              @input="form.permanentAddress.pincode = onlyDigits(form.permanentAddress.pincode, 6)"
            />
          </div>
        </div>

        <div class="address-col">
          <div class="address-header">
            <h4 class="subtitle">Current Address</h4>
            <a href="#" @click.prevent="copyPermanentToCurrent" class="link-copy">Copy From Permanent</a>
          </div>

          <div class="grid-2">
            <input type="text" v-model="form.currentAddress.employeeName" placeholder="Name" />
            <input type="text" v-model="form.currentAddress.line1" placeholder="Address Line 1" />
            <input type="text" v-model="form.currentAddress.line2" placeholder="Address Line 2" />
            <input type="text" v-model="form.currentAddress.tahsil" placeholder="Tahsil" />
            <select v-model="form.currentAddress.country" class="full-select">
              <option value="India">India</option>
            </select>
            <select v-model="form.currentAddress.state" class="full-select">
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
            <input type="text" v-model="form.currentAddress.city" placeholder="City" />
            <input
              type="text"
              v-model="form.currentAddress.pincode"
              placeholder="Pincode *"
              required
              inputmode="numeric"
              maxlength="6"
              @input="form.currentAddress.pincode = onlyDigits(form.currentAddress.pincode, 6)"
            />
          </div>
        </div>
      </div>
    </section>

    <section class="section permissions-section card">
      <div class="section-head">
        <div class="badge">3</div>
        <h3>Permissions</h3>
      </div>

      <div class="permissions-grid">
        <label class="perm"><input type="checkbox" v-model="form.userPermissions.admin" /> Admin</label>
        <label class="perm"><input type="checkbox" v-model="form.userPermissions.rto" /> RTO</label>
        <label class="perm"><input type="checkbox" v-model="form.userPermissions.insurence" /> Insurance</label>
        <label class="perm"><input type="checkbox" v-model="form.userPermissions.sales" /> Sales</label>
        <label class="perm"><input type="checkbox" v-model="form.userPermissions.edit" /> Edit</label>
        <label class="perm"><input type="checkbox" v-model="form.userPermissions.add" /> Add</label>
        <label class="perm"><input type="checkbox" v-model="form.userPermissions.delete" /> Delete</label>
        <label class="perm"><input type="checkbox" v-model="form.userPermissions.download" /> Download</label>

        <div class="selects-row">
          <select v-model="form.userPermissions.employeeRole" class="full-select">
            <option value="">Select Role</option>
            <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.text }}</option>
          </select>

          <select v-model="form.userPermissions.venderId" class="full-select">
            <option value="">Select Vender</option>
            <option v-for="v in venderOptions" :key="v.value" :value="v.value">{{ v.text }}</option>
          </select>
        </div>
      </div>
    </section>

    <section class="section banking-details-section card">
      <div class="section-head">
        <div class="badge">4</div>
        <h3>Banking Details</h3>
      </div>

      <div class="banking-grid">
        <input type="text" v-model="bank.bankName" placeholder="Bank Name" />
        <input type="text" v-model="bank.branch" placeholder="Branch" />
        <input type="text" v-model="bank.accountHolder" placeholder="Account Holder" />
        <input type="text" v-model="bank.accountNumber" placeholder="Account Number" />
        <input type="text" v-model="bank.ifsc" placeholder="IFSC" />
      </div>

      <div class="banking-actions">
        <button type="button" class="cancel-btn" @click="onCancel">Cancel</button>
        <button type="button" class="create-btn" @click="onRequestEdit" :disabled="saving">
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </button>
      </div>
    </section>

    <!-- Custom Dialog (same as add) -->
    <div v-if="dialog.visible" class="dlg-overlay" role="dialog" aria-modal="true">
      <div class="dlg">
        <div class="dlg-header" :class="'dlg-' + dialog.type">
          <strong>{{ dialog.title }}</strong>
          <button class="dlg-close" @click="closeDialog">×</button>
        </div>
        <div class="dlg-body">
          <div v-if="Array.isArray(dialog.message)">
            <ul class="dlg-list">
              <li v-for="(m,i) in dialog.message" :key="i">{{ m }}</li>
            </ul>
          </div>
          <div v-else>{{ dialog.message }}</div>
        </div>
        <div class="dlg-actions">
          <button v-if="dialog.type === 'confirm'" class="btn" @click="onDialogCancel">Cancel</button>
          <button
            class="btn primary"
            @click="onDialogOk"
          >
            {{ dialog.type === 'confirm' ? 'Yes, Continue' : 'OK' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "EditEmployeeSimple",
  props: {
    employee: { type: Object, default: null },
    pk: { type: String, default: null }
  },
  data() {
    return {
      form: {
        employeeName: '',
        email: '',
        password: '',
        phone: '',
        userId: '',
        department: '',
        currentAddress: { employeeName:'', line1:'', line2:'', tahsil:'', city:'', state:'', pincode:'', country:'' },
        permanentAddress: { employeeName:'', line1:'', line2:'', tahsil:'', city:'', state:'', pincode:'', country:'' },
        bank: {},
        userPermissions: {}
      },
      bank: { bankName: '', branch: '', accountHolder: '', accountNumber: '', ifsc: '' },
      roleOptions: [
        { value: "admin", text: "Admin" },
        { value: "employee", text: "Employee" },
      ],
      venderOptions: [{ value: "001", text: "001" }],
      dialog: {
        visible: false,
        type: "info",
        title: "",
        message: "",
        confirmHandler: null,
      },
      saving: false,
      loading: false
    };
  },
  watch: {
    employee: {
      immediate: true,
      handler(val) {
        if (val) this.populateForm(val);
      }
    },
    pk: {
      immediate: true,
      handler(val) {
        if (val && !this.employee) this.loadByPk(val);
      }
    }
  },
  methods: {
    // copy of helpers from add + previous edit component
    onlyDigits(val, maxLen) {
      return (val || "").replace(/\D/g, "").slice(0, maxLen);
    },

    populateForm(emp) {
      // Map incoming emp to our simple form shape (safe defaults)
      this.form.employeeName = emp.employeeName || '';
      this.form.email = emp.email || '';
      this.form.password = emp.password || '';
      this.form.phone = emp.phone || '';
      this.form.userId = emp.userId || (emp.pk ? emp.pk.split('#')[1] : '');
      this.form.department = emp.department || '';
      this.form.currentAddress = JSON.parse(JSON.stringify(emp.currentAddress || { employeeName:'', line1:'', line2:'', tahsil:'', city:'', state:'', pincode:'', country:'' }));
      this.form.permanentAddress = JSON.parse(JSON.stringify(emp.permanentAddress || { employeeName:'', line1:'', line2:'', tahsil:'', city:'', state:'', pincode:'', country:'' }));
      this.form.userPermissions = JSON.parse(JSON.stringify(emp.userPermissions || {}));
      this.bank = JSON.parse(JSON.stringify(emp.bank || { bankName:'', branch:'', accountHolder:'', accountNumber:'', ifsc:'' }));
      // ensure nested fields exist
      this.form.currentAddress = Object.assign({ employeeName:'', line1:'', line2:'', tahsil:'', city:'', state:'', pincode:'', country:'' }, this.form.currentAddress);
      this.form.permanentAddress = Object.assign({ employeeName:'', line1:'', line2:'', tahsil:'', city:'', state:'', pincode:'', country:'' }, this.form.permanentAddress);
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
        this.openDialog('error', 'Failed to load employee', this.formatErr(err));
      } finally {
        this.loading = false;
      }
    },

    copyPermanentToCurrent() {
      this.form.currentAddress = JSON.parse(JSON.stringify(this.form.permanentAddress));
    },
    copyCurrentToPermanent() {
      this.form.permanentAddress = JSON.parse(JSON.stringify(this.form.currentAddress));
    },

    // dialog controls
    openDialog(type, title, message, onConfirm = null) {
      this.dialog.visible = true;
      this.dialog.type = type || 'info';
      this.dialog.title = title || '';
      this.dialog.message = message || '';
      this.dialog.confirmHandler = typeof onConfirm === 'function' ? onConfirm : null;
    },
    closeDialog() {
      this.dialog.visible = false;
      this.dialog.confirmHandler = null;
    },
    onDialogCancel() {
      this.closeDialog();
    },
    onDialogOk() {
      const fn = this.dialog.confirmHandler;
      this.closeDialog();
      if (fn) fn();
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
    },

    validateForm() {
      const errs = [];
      const email = (this.form.email || "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const ten = /^\d{10}$/;
      const six = /^\d{6}$/;

      if (!this.form.employeeName?.trim()) errs.push("Full Name is required");
      if (!this.form.phone?.trim()) errs.push("Phone Number is required");
      if (!this.form.email?.trim()) errs.push("Email is required");

      if (this.form.phone && !ten.test(this.form.phone)) errs.push("Phone must be exactly 10 digits");
      if (this.form.email && !emailRegex.test(email)) errs.push("Invalid email format");

      if (!this.form.permanentAddress.pincode?.trim()) errs.push("Permanent Pincode is required");
      if (!this.form.currentAddress.pincode?.trim()) errs.push("Current Pincode is required");

      if (this.form.permanentAddress.pincode && !six.test(this.form.permanentAddress.pincode)) errs.push("Permanent Pincode must be exactly 6 digits");
      if (this.form.currentAddress.pincode && !six.test(this.form.currentAddress.pincode)) errs.push("Current Pincode must be exactly 6 digits");

      return errs;
    },

    onRequestEdit() {
      const errs = this.validateForm();
      if (errs.length) {
        this.openDialog("error", "Please fix the following", errs);
        return;
      }
      this.openDialog(
        "confirm",
        "Save Changes?",
        "Do you want to save the current changes to this employee?",
        this.onSave
      );
    },

    async onSave() {
      if (this.saving) return;
      this.saving = true;

      try {
        const pkToSend =
          this.pk ||
          (this.employee && (this.employee.pk || this.employee.userId)) ||
          this.form.userId;

        const payload = { employee: this._deepCloneForm(), pk: pkToSend, bank: this._deepCloneBank() };
        const res = await axios.post(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'updateEmployeeDetail',
          payload,
          { timeout: 15000 }
        );

        this.openDialog("success", "Saved", res?.data?.message || "Employee details were saved successfully!");
        this.$emit('saved', res && res.data ? res.data : res);
      } catch (err) {
        this.openDialog("error", "Failed to Save Employee", this.formatErr(err));
        this.$emit('error', err);
      } finally {
        this.saving = false;
      }
    },

    _deepCloneForm() {
      return JSON.parse(JSON.stringify(this.form || {}));
    },
    _deepCloneBank() {
      return JSON.parse(JSON.stringify(this.bank || {}));
    },

    onCancel() {
      this.$emit('cancel');
    }
  }
};
</script>

<style scoped>
/* Reused styles from Add component to match appearance exactly */

/* Simple modal/dialog */
.dlg-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.dlg {
  width: min(520px, 92vw);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.25);
  overflow: hidden;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
}
.dlg-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px;
  color: #fff;
}
.dlg-success { background: #2e7d32; }
.dlg-error   { background: #c62828; }
.dlg-confirm { background: #1565c0; }
.dlg-info    { background: #6d4c41; }
.dlg-close {
  background: transparent; border: 0; color: #fff; font-size: 22px; line-height: 1; cursor: pointer;
}
.dlg-body { padding: 16px; color: #333; }
.dlg-actions {
  display: flex; justify-content: flex-end; gap: 10px; padding: 12px 16px; background: #fafafa;
}
.dlg-list { margin: 0; padding-left: 18px; }
.btn {
  border: 1px solid #ddd; background: #fff; padding: 8px 14px; border-radius: 8px; cursor: pointer;
}
.btn.primary {
  background: #001f3f; border-color: #001f3f; color: #fff;
}

/* Layout container */
.add-employee-form {
  width: 98%;
  margin: 12px 18px;
  font-family: "Inter", Arial, sans-serif;
  background: #ffffff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 6px 24px rgba(18, 18, 18, 0.06);
}

/* Header */
.form-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}
.form-header h2 {
  margin: 0;
  font-size: 20px;
  color: #111827;
}
.form-sub {
  color: #6b7280;
  font-size: 13px;
}

/* Card style for sections */
.card {
  border-radius: 8px;
  background: linear-gradient(180deg, rgba(250,250,252,1) 0%, rgba(255,255,255,1) 100%);
  padding: 14px 16px;
  margin-bottom: 16px;
  border: 1px solid #eef2f7;
}

/* Section head */
.section-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}
.section-head h3 {
  margin: 0;
  font-size: 16px;
  color: #0f172a;
}
.badge {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg,#f3f0ff,#e9f5ff);
  color: #5b21b6;
  font-weight: 700;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(16,24,40,0.04);
}

/* generic grid helpers */
.grid-3 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}
.grid-2 {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

/* Addresses layout */
.addresses-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
}
.address-col {
  padding-top: 6px;
}
.address-col .subtitle {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #0f172a;
}
.address-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.link-copy {
  color: #7c3aed;
  text-decoration: none;
  font-size: 13px;
}
.link-copy:hover {
  color: #5b21b6;
}

/* permissions */
.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 10px;
  align-items: center;
}
.perm {
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 600;
  color: #111827;
}

/* selects row inside permissions */
.selects-row {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
}

/* Banking layout */
.banking-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 6px;
}

/* Inputs / selects unified style */
input[type="text"],
input[type="email"],
select,
input[type="password"] {
  height: 40px;
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #e6eef8;
  background: #fbfdff;
  color: #0b1220;
  font-size: 14px;
  box-sizing: border-box;
  width: 100%;
  transition: box-shadow 0.12s ease, border-color 0.12s ease, transform 0.06s ease;
}
input::placeholder {
  color: #94a3b8;
}

/* ensure selects have consistent appearance */
.full-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #6b7280 50%), linear-gradient(135deg, #6b7280 50%, transparent 50%);
  background-position: calc(100% - 14px) calc(1em + 2px), calc(100% - 10px) calc(1em + 2px);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

/* focus style */
input:focus,
select:focus {
  outline: none;
  border-color: #7c3aed;
  box-shadow: 0 4px 18px rgba(124,58,237,0.08);
  transform: translateY(-0.5px);
}

/* Buttons */
.banking-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 12px;
}
.cancel-btn {
  background: #f3f4f6;
  color: #374151;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
}
.cancel-btn:hover {
  background: #e6e9ee;
}
.create-btn {
  background: #283593;
  color: #fff;
  border: none;
  padding: 7px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(91,33,182,0.12);
}
.create-btn:hover {
  transform: translateY(-2px);
}

/* responsiveness */
@media (max-width: 880px) {
  .addresses-grid {
    grid-template-columns: 1fr;
  }
  .grid-3 {
    grid-template-columns: 1fr;
  }
  .grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
