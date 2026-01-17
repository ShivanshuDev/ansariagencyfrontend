<template>
  <div class="add-employee-form">
    <header class="form-header">
      <h2>Add Employee</h2>
      <div class="form-sub">Create employee record and banking information</div>
    </header>

    <!-- 1. BASIC DETAILS -->
    <section class="section card">
      <div class="section-head">
        <div class="badge">1</div>
        <h3>Basic Details</h3>
      </div>

      <div class="grid-3">
        <div class="field">
          <label class="field-label">Full Name *</label>
          <input type="text" v-model="employee.employeeName" placeholder="Full Name" required />
        </div>

        <div class="field">
          <label class="field-label">Phone Number *</label>
          <input
            type="text"
            v-model="employee.phone"
            placeholder="Phone Number"
            required
            inputmode="numeric"
            maxlength="10"
            @input="employee.phone = onlyDigits(employee.phone, 10)"
          />
        </div>

        <div class="field">
          <label class="field-label">Email *</label>
          <input
            type="email"
            v-model="employee.email"
            placeholder="Email"
            required
          />
        </div>

        <div class="field">
          <label class="field-label">User ID</label>
          <input type="text" v-model="employee.userId" placeholder="User ID" />
        </div>

        <div class="field">
          <label class="field-label">Password</label>
          <input type="text" v-model="employee.password" placeholder="Password" />
        </div>

        <div class="field">
          <label class="field-label">Department</label>
          <select v-model="employee.department" class="full-select">
            <option value="">Select Department</option>
            <option value="Warehouse">Warehouse</option>
            <option value="Sales">Sales</option>
            <option value="Finance">Finance</option>
            <option value="RTO">RTO</option>
          </select>
        </div>
      </div>
    </section>

    <!-- 2. ADDRESSES -->
    <section class="section addresses card">
      <div class="section-head">
        <div class="badge">2</div>
        <h3>Addresses</h3>
      </div>

      <div class="addresses-grid">
        <!-- CURRENT ADDRESS (LEFT) -->
        <div class="address-col">
          <h4 class="subtitle">Current Address</h4>
          <div class="grid-2">
            <div class="field">
              <label class="field-label">House No. &amp; Street Name</label>
              <input
                type="text"
                v-model="employee.currentAddress.houseStreet"
                placeholder="House No. & Street Name"
              />
            </div>

            <div class="field">
              <label class="field-label">Landmark</label>
              <input
                type="text"
                v-model="employee.currentAddress.landmark"
                placeholder="Landmark"
              />
            </div>

            <div class="field">
              <label class="field-label">Village/Town/City</label>
              <input
                type="text"
                v-model="employee.currentAddress.villageTownCity"
                placeholder="Village/Town/City"
              />
            </div>

            <div class="field">
              <label class="field-label">Post</label>
              <input
                type="text"
                v-model="employee.currentAddress.post"
                placeholder="Post"
              />
            </div>

            <div class="field">
              <label class="field-label">Tahsil</label>
              <input
                type="text"
                v-model="employee.currentAddress.tahsil"
                placeholder="Tahsil"
              />
            </div>

            <div class="field">
              <label class="field-label">District</label>
              <input
                type="text"
                v-model="employee.currentAddress.district"
                placeholder="District"
              />
            </div>

            <div class="field">
              <label class="field-label">State</label>
              <input
                type="text"
                v-model="employee.currentAddress.state"
                placeholder="State"
              />
            </div>

            <div class="field">
              <label class="field-label">PIN *</label>
              <input
                type="text"
                v-model="employee.currentAddress.pincode"
                placeholder="PIN"
                required
                inputmode="numeric"
                maxlength="6"
                @input="employee.currentAddress.pincode = onlyDigits(employee.currentAddress.pincode, 6)"
              />
            </div>
          </div>
        </div>

        <!-- PERMANENT ADDRESS (RIGHT) -->
        <div class="address-col">
          <div class="address-header">
            <h4 class="subtitle">Permanent Address</h4>
            <label class="same-addr">
              <input
                type="checkbox"
                v-model="isPermanentSameAsCurrent"
                @change="onSameAsCurrentChange"
              />
              Same as Current Address
            </label>
          </div>

          <div class="grid-2">
            <div class="field">
              <label class="field-label">House No. &amp; Street Name</label>
              <input
                type="text"
                v-model="employee.permanentAddress.houseStreet"
                placeholder="House No. & Street Name"
              />
            </div>

            <div class="field">
              <label class="field-label">Landmark</label>
              <input
                type="text"
                v-model="employee.permanentAddress.landmark"
                placeholder="Landmark"
              />
            </div>

            <div class="field">
              <label class="field-label">Village/Town/City</label>
              <input
                type="text"
                v-model="employee.permanentAddress.villageTownCity"
                placeholder="Village/Town/City"
              />
            </div>

            <div class="field">
              <label class="field-label">Post</label>
              <input
                type="text"
                v-model="employee.permanentAddress.post"
                placeholder="Post"
              />
            </div>

            <div class="field">
              <label class="field-label">Tahsil</label>
              <input
                type="text"
                v-model="employee.permanentAddress.tahsil"
                placeholder="Tahsil"
              />
            </div>

            <div class="field">
              <label class="field-label">District</label>
              <input
                type="text"
                v-model="employee.permanentAddress.district"
                placeholder="District"
              />
            </div>

            <div class="field">
              <label class="field-label">State</label>
              <input
                type="text"
                v-model="employee.permanentAddress.state"
                placeholder="State"
              />
            </div>

            <div class="field">
              <label class="field-label">PIN *</label>
              <input
                type="text"
                v-model="employee.permanentAddress.pincode"
                placeholder="PIN"
                required
                inputmode="numeric"
                maxlength="6"
                @input="employee.permanentAddress.pincode = onlyDigits(employee.permanentAddress.pincode, 6)"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. PERMISSIONS (only new design, old data names kept) -->
    <section class="section permissions-section card">
      <div class="section-head">
        <div class="badge">3</div>
        <h3>Permissions</h3>
      </div>

      <!-- role & vendor selects kept with same names -->
      <div class="permissions-select-row">
        <div class="field">
          <label class="field-label">Role</label>
          <select v-model="employee.permissions.employeeRole" class="full-select">
            <option value="">Select Role</option>
            <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.text }}</option>
          </select>
        </div>

        <div class="field">
          <label class="field-label">Vendor</label>
          <select v-model="employee.permissions.venderId" class="full-select">
            <option value="">Select Vendor</option>
            <option v-for="v in venderOptions" :key="v.value" :value="v.value">{{ v.text }}</option>
          </select>
        </div>
      </div>

      <hr class="perm-divider" />

      <!-- Sidebar-style module permissions -->
      <div class="perm-modules">
        <!-- WORKSHOP -->
        <div class="perm-module">
          <div class="perm-module-title">
            <span class="icon-bullet"></span>
            Workshop
          </div>
          <div class="perm-module-body">
            <div class="perm-group">
              <div class="perm-group-title">Spares</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.workshop.addSpares" />
                Add Spares
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.workshop.sparesTable" />
                Spares Table
              </label>
            </div>
            <div class="perm-group">
              <div class="perm-group-title">Services</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.workshop.serviceRequests" />
                Service Requests
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.workshop.serviceHistory" />
                Service History
              </label>
            </div>
          </div>
        </div>

        <!-- ACCOUNTS -->
        <div class="perm-module">
          <div class="perm-module-title">
            <span class="icon-bullet"></span>
            Accounts
          </div>
          <div class="perm-module-body">
            <label class="perm-item">
              <input type="checkbox" v-model="employee.permissions.modules.accounts.vendorLedger" />
              Vendor Ledger
            </label>
            <label class="perm-item">
              <input type="checkbox" v-model="employee.permissions.modules.accounts.vendorAccounts" />
              Vendor Accounts
            </label>
            <label class="perm-item">
              <input type="checkbox" v-model="employee.permissions.modules.accounts.dayBook" />
              DAY Book
            </label>
            <label class="perm-item">
              <input type="checkbox" v-model="employee.permissions.modules.accounts.customerLedger" />
              Customer Ledger
            </label>
            <label class="perm-item">
              <input type="checkbox" v-model="employee.permissions.modules.accounts.customerAccounts" />
              Customer Accounts
            </label>
          </div>
        </div>

        <!-- SUPER ADMIN -->
        <div class="perm-module">
          <div class="perm-module-title">
            <span class="icon-bullet"></span>
            Super Admin
          </div>
          <div class="perm-module-body">
            <div class="perm-group">
              <div class="perm-group-title">Vendor</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.superAdmin.addVendor" />
                Add Vendor
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.superAdmin.vendorDetails" />
                Vendor Details
              </label>
            </div>
            <div class="perm-group">
              <div class="perm-group-title">Employee</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.superAdmin.addEmployee" />
                Add Employee
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.superAdmin.employeeTable" />
                Employee Table
              </label>
            </div>
          </div>
        </div>

        <!-- SALES -->
        <div class="perm-module">
          <div class="perm-module-title">
            <span class="icon-bullet"></span>
            Sales
          </div>
          <div class="perm-module-body">
            <div class="perm-group">
              <div class="perm-group-title">RTO &amp; INS Details</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.sales.rtoInsDetails" />
                RTO &amp; INS Details
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.sales.rtoInsDetailUpdation" />
                RTO &amp; INS Detail Updation
              </label>
            </div>

            <div class="perm-group">
              <div class="perm-group-title">Invoices</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.sales.allCustomerInvoices" />
                All Customer Invoices Details
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.sales.quickInvoice" />
                Quick Invoice
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.sales.bikeBooking" />
                Bike Booking
              </label>
            </div>

            <div class="perm-group">
              <div class="perm-group-title">Payments</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.sales.payments" />
                Payments
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.sales.paymentReceipt" />
                Payment Receipt
              </label>
            </div>
          </div>
        </div>

        <!-- ADMIN -->
        <div class="perm-module">
          <div class="perm-module-title">
            <span class="icon-bullet"></span>
            Admin
          </div>
          <div class="perm-module-body">
            <label class="perm-item">
              <input type="checkbox" v-model="employee.permissions.modules.admin.searchByChassis" />
              Search By Chassis
            </label>
            <label class="perm-item">
              <input type="checkbox" v-model="employee.permissions.modules.admin.vehicalDetail" />
              Vehical Detail
            </label>

            <div class="perm-group">
              <div class="perm-group-title">Invoice Process</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.admin.vendorBillDetail" />
                Vendor Bill Detail
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.admin.vendorBilling" />
                Vendor Billing
              </label>
            </div>

            <div class="perm-group">
              <div class="perm-group-title">Stock Process</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.admin.stock" />
                Stock
              </label>
            </div>

            <div class="perm-group">
              <div class="perm-group-title">Inventory</div>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.admin.inventoryDetails" />
                Inventory Details
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.admin.addInventory" />
                Add Inventory
              </label>
              <label class="perm-item">
                <input type="checkbox" v-model="employee.permissions.modules.admin.bikeModel" />
                Bike Model
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 4. BANKING DETAILS -->
    <section class="section banking-details-section card">
      <div class="section-head">
        <div class="badge">4</div>
        <h3>Banking Details</h3>
      </div>

      <div class="banking-grid">
        <div class="field">
          <label class="field-label">Bank Name</label>
          <input type="text" v-model="bank.bankName" placeholder="Bank Name" />
        </div>
        <div class="field">
          <label class="field-label">Branch</label>
          <input type="text" v-model="bank.branch" placeholder="Branch" />
        </div>
        <div class="field">
          <label class="field-label">Account Holder</label>
          <input type="text" v-model="bank.accountHolder" placeholder="Account Holder" />
        </div>
        <div class="field">
          <label class="field-label">Account Number</label>
          <input type="text" v-model="bank.accountNumber" placeholder="Account Number" />
        </div>
        <div class="field">
          <label class="field-label">IFSC</label>
          <input type="text" v-model="bank.ifsc" placeholder="IFSC" />
        </div>
      </div>

      <div class="banking-actions">
        <button type="button" class="cancel-btn" @click="onCancel">Cancel</button>
        <button type="button" class="create-btn" @click="onCreateClick">Create New</button>
      </div>
    </section>

    <!-- Custom Dialog -->
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
          <button class="btn primary" @click="onDialogOk">
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
  name: 'CreateNewVendor',
  emits: ['vendor-created'],
  data() {
    return {
      employee: this.emptyEmployee(),
      bank: this.emptyBank(),
      roleOptions: [
        { value: "admin", text: "Admin" },
        { value: "employee", text: "Employee" },
      ],
      venderOptions: [{ value: "001", text: "001" }],
      dialog: {
        visible: false,
        type: "info", // 'success' | 'error' | 'confirm' | 'info'
        title: "",
        message: "",
        confirmHandler: null,
      },
      isSubmitting: false,
      isPermanentSameAsCurrent: false,
    };
  },

  methods: {
    emptyEmployee() {
      return {
        image: null,
        employeeName: "",
        email: "",
        phone: "",
        password: "",
        department: "",
        userId: "",
        currentAddress: {
          houseStreet: "",
          landmark: "",
          villageTownCity: "",
          post: "",
          tahsil: "",
          district: "",
          state: "",
          pincode: "",
        },
        permanentAddress: {
          houseStreet: "",
          landmark: "",
          villageTownCity: "",
          post: "",
          tahsil: "",
          district: "",
          state: "",
          pincode: "",
        },
        permissions: {
          // OLD DATA FIELDS KEPT
          employeeRole: "",
          venderId: "",
          edit: false,
          add: false,
          delete: false,
          download: false,
          admin: false,
          rto: false,
          sales: false,
          insurence: false,
          // NEW MODULE PERMISSIONS
          modules: {
            workshop: {
              addSpares: false,
              sparesTable: false,
              serviceRequests: false,
              serviceHistory: false,
            },
            accounts: {
              vendorLedger: false,
              vendorAccounts: false,
              dayBook: false,
              customerLedger: false,
              customerAccounts: false,
            },
            superAdmin: {
              addVendor: false,
              vendorDetails: false,
              addEmployee: false,
              employeeTable: false,
            },
            sales: {
              rtoInsDetails: false,
              rtoInsDetailUpdation: false,
              allCustomerInvoices: false,
              quickInvoice: false,
              bikeBooking: false,
              payments: false,
              paymentReceipt: false,
            },
            admin: {
              searchByChassis: false,
              vehicalDetail: false,
              vendorBillDetail: false,
              vendorBilling: false,
              stock: false,
              inventoryDetails: false,
              addInventory: false,
              bikeModel: false,
            },
          },
        },
      };
    },

    emptyBank() {
      return {
        bankName: "",
        branch: "",
        accountHolder: "",
        accountNumber: "",
        ifsc: "",
      };
    },

    onlyDigits(val, maxLen) {
      return (val || "").replace(/\D/g, "").slice(0, maxLen);
    },

    onSameAsCurrentChange() {
      if (this.isPermanentSameAsCurrent) {
        this.employee.permanentAddress = { ...this.employee.currentAddress };
      }
    },

    onCancel() {
      this.bank = this.emptyBank();
    },

    openDialog(type, title, message, onConfirm = null) {
      this.dialog.visible = true;
      this.dialog.type = type;
      this.dialog.title = title;
      this.dialog.message = message;
      this.dialog.confirmHandler =
        typeof onConfirm === "function" ? onConfirm : null;
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

    validateForm() {
      const errs = [];
      const email = (this.employee.email || "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const ten = /^\d{10}$/;
      const six = /^\d{6}$/;

      if (!this.employee.employeeName?.trim())
        errs.push("Full Name is required");
      if (!this.employee.phone?.trim())
        errs.push("Phone Number is required");
      if (!this.employee.email?.trim()) errs.push("Email is required");

      if (this.employee.phone && !ten.test(this.employee.phone))
        errs.push("Phone must be exactly 10 digits");
      if (this.employee.email && !emailRegex.test(email))
        errs.push("Invalid email format");

      if (!this.employee.permanentAddress.pincode?.trim())
        errs.push("Permanent Pincode is required");
      if (!this.employee.currentAddress.pincode?.trim())
        errs.push("Current Pincode is required");

      if (
        this.employee.permanentAddress.pincode &&
        !six.test(this.employee.permanentAddress.pincode)
      )
        errs.push("Permanent Pincode must be exactly 6 digits");
      if (
        this.employee.currentAddress.pincode &&
        !six.test(this.employee.currentAddress.pincode)
      )
        errs.push("Current Pincode must be exactly 6 digits");

      return errs;
    },

    onCreateClick() {
      const errs = this.validateForm();
      if (errs.length) {
        this.openDialog("error", "Please fix the following", errs);
        return;
      }
      this.openDialog(
        "confirm",
        "Create Employee?",
        "Are you sure you want to create this employee record?",
        this.submitCreate
      );
    },

    async submitCreate() {
      if (this.isSubmitting) return;
      this.isSubmitting = true;

      try {
        const payload = { employee: this.employee, bank: this.bank };
        const res = await axios.post(
          process.env.VUE_APP_AGENCY_BACKEND_URL + "employeeDetail",
          payload
        );

        this.openDialog(
          "success",
          "Success",
          res?.data?.message || "Employee details submitted successfully!"
        );

        this.employee = this.emptyEmployee();
        this.bank = this.emptyBank();
        this.isPermanentSameAsCurrent = false;
        this.$emit('vendor-created', true);
      } catch (error) {
        const msg =
          error?.response?.data?.message ||
          error.message ||
          "Submission failed.";
        this.openDialog("error", "Submission Failed", msg);
      } finally {
        this.isSubmitting = false;
      }
    },
  },

  watch: {
    "employee.currentAddress": {
      deep: true,
      handler(newVal) {
        if (this.isPermanentSameAsCurrent) {
          this.employee.permanentAddress = { ...newVal };
        }
      },
    },
  },
};
</script>

<style scoped>
/* dialog */
.dlg-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
.dlg {
  width: min(520px, 92vw);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial;
}
.dlg-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  color: #fff;
}
.dlg-success {
  background: #2e7d32;
}
.dlg-error {
  background: #c62828;
}
.dlg-confirm {
  background: #1565c0;
}
.dlg-info {
  background: #6d4c41;
}
.dlg-close {
  background: transparent;
  border: 0;
  color: #fff;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}
.dlg-body {
  padding: 16px;
  color: #333;
}
.dlg-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px;
  background: #fafafa;
}
.dlg-list {
  margin: 0;
  padding-left: 18px;
}
.btn {
  border: 1px solid #ddd;
  background: #fff;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
}
.btn.primary {
  background: #001f3f;
  border-color: #001f3f;
  color: #fff;
}

/* container */
.add-employee-form {
  width: 98%;
  margin: 12px 18px;
  font-family: "Inter", Arial, sans-serif;
  background: #ffffff;
  border-radius: 10px;
  padding: 2px;
  box-shadow: 0 6px 24px rgba(18, 18, 18, 0.06);
}

/* header */
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

/* card */
.card {
  border-radius: 8px;
  background: linear-gradient(
    180deg,
    rgba(250, 250, 252, 1) 0%,
    rgba(255, 255, 255, 1) 100%
  );
  padding: 14px 16px;
  margin-bottom: 16px;
  border: 1px solid #eef2f7;
}

/* section head */
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
  background: linear-gradient(135deg, #f3f0ff, #e9f5ff);
  color: #5b21b6;
  font-weight: 700;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(16, 24, 40, 0.04);
}

/* FIELD STYLE (like chassis screenshot) */
.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.field-label {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}

/* grids */
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

/* addresses */
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
.same-addr {
  font-size: 13px;
  color: #4b5563;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* permissions */
.permissions-select-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 10px;
}
.perm-divider {
  border: none;
  border-top: 1px dashed #e5e7eb;
  margin: 10px 0 12px;
}

/* permission modules */
.perm-modules {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}
.perm-module {
  border-radius: 10px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  padding: 10px 12px;
}
.perm-module-title {
  font-size: 13px;
  font-weight: 700;
  color: #eff6ff;
  background: linear-gradient(135deg, #1d4ed8, #1e293b);
  padding: 6px 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.icon-bullet {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid rgba(255, 255, 255, 0.65);
  box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.3);
}
.perm-module-body {
  padding: 4px 2px 2px;
}
.perm-group {
  margin-top: 6px;
  padding-top: 4px;
}
.perm-group-title {
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 2px;
}
.perm-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #111827;
  padding: 2px 0;
}

/* banking */
.banking-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin-top: 6px;
}

/* inputs / selects */
input[type="text"],
input[type="email"],
select,
input[type="password"] {
  height: 38px;
  padding: 8px 10px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  font-size: 13px;
  box-sizing: border-box;
  width: 100%;
  transition: box-shadow 0.12s ease, border-color 0.12s ease;
}
input::placeholder {
  color: #9ca3af;
}

.full-select {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #6b7280 50%),
    linear-gradient(135deg, #6b7280 50%, transparent 50%);
  background-position: calc(100% - 14px) calc(50%),
    calc(100% - 9px) calc(50%);
  background-size: 6px 6px, 6px 6px;
  background-repeat: no-repeat;
}

input:focus,
select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 1px #3b82f6;
}

/* buttons */
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
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
}
.cancel-btn:hover {
  background: #e5e7eb;
}
.create-btn {
  background: #283593;
  color: #fff;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 6px 18px rgba(91, 33, 182, 0.12);
}
.create-btn:hover {
  transform: translateY(-1px);
}

/* responsiveness */
@media (max-width: 880px) {
  .addresses-grid {
    grid-template-columns: 1fr;
  }
  .grid-3,
  .grid-2 {
    grid-template-columns: 1fr;
  }
  .perm-modules {
    grid-template-columns: 1fr;
  }
}
</style>
