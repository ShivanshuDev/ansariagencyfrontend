<template>
  <div class="add-employee-form">
    <header class="form-header">
      <h2>Add Employee</h2>
      <div class="form-sub">Create employee record and banking information</div>
    </header>

    <section class="section card">
      <div class="section-head">
        <div class="badge">1</div>
        <h3>Basic Details</h3>
      </div>

      <div class="grid-3">
        <input type="text" v-model="employee.employeeName" placeholder="Full Name *" required />
        <input type="text" v-model="employee.phone" placeholder="Phone Number *" required />
        <input type="email" v-model="employee.email" placeholder="Email *" required />
        <input type="text" v-model="employee.userId" placeholder="User ID" />
        <input type="text" v-model="employee.password" placeholder="Password" />
        <select v-model="employee.department" class="full-select">
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
            <input type="text" v-model="employee.permanentAddress.name" placeholder="Name" />
            <input type="text" v-model="employee.permanentAddress.line1" placeholder="Address Line 1" />
            <input type="text" v-model="employee.permanentAddress.line2" placeholder="Address Line 2" />
            <input type="text" v-model="employee.permanentAddress.tahsil" placeholder="Tahsil" />
            <select v-model="employee.permanentAddress.country" class="full-select">
              <option value="India">India</option>
            </select>
            <select v-model="employee.permanentAddress.state" class="full-select">
              <option value="Uttar Pradesh">Uttar Pradesh</option>
            </select>
            <input type="text" v-model="employee.permanentAddress.city" placeholder="City" />
            <input type="text" v-model="employee.permanentAddress.pincode" placeholder="Pincode" />
          </div>
        </div>

        <div class="address-col">
          <div class="address-header">
            <h4 class="subtitle">Current Address</h4>
            <a href="#" @click.prevent="copyPermanentAddress" class="link-copy">Copy From Permanent</a>
          </div>

          <div class="grid-2">
            <input type="text" v-model="employee.currentAddress.name" placeholder="Name" />
            <input type="text" v-model="employee.currentAddress.line1" placeholder="Address Line 1" />
            <input type="text" v-model="employee.currentAddress.line2" placeholder="Address Line 2" />
            <input type="text" v-model="employee.currentAddress.tahsil" placeholder="Tahsil" />
            <select v-model="employee.currentAddress.country" class="full-select">
              <option value="IN">India</option>
            </select>
            <select v-model="employee.currentAddress.state" class="full-select">
              <option value="Uttar Pradesh">UTTAR PRADESH</option>
            </select>
            <input type="text" employee.currentAddress.city  placeholder="City"/>
            <input type="text" v-model="employee.currentAddress.pincode" placeholder="Pincode" />
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
        <label class="perm"><input type="checkbox" v-model="employee.permissions.admin" /> Admin</label>
        <label class="perm"><input type="checkbox" v-model="employee.permissions.rto" /> RTO</label>
        <label class="perm"><input type="checkbox" v-model="employee.permissions.incurence" /> Insurance</label>
        <label class="perm"><input type="checkbox" v-model="employee.permissions.sales" /> Sales</label>
        <label class="perm"><input type="checkbox" v-model="employee.permissions.edit" /> Edit</label>
        <label class="perm"><input type="checkbox" v-model="employee.permissions.add" /> Add</label>
        <label class="perm"><input type="checkbox" v-model="employee.permissions.delete" /> Delete</label>
        <label class="perm"><input type="checkbox" v-model="employee.permissions.download" /> Download</label>

        <div class="selects-row">
          <select v-model="employee.permissions.employeeRole" class="full-select">
            <option value="">Select Role</option>
            <option v-for="r in roleOptions" :key="r.value" :value="r.value">{{ r.text }}</option>
          </select>

          <select v-model="employee.permissions.venderId" class="full-select">
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
        <button type="button" class="create-btn" @click="onCreate">Create New</button>
      </div>
    </section>
  </div>
</template>

<script>
import axios from "axios";
export default {
  data() {
    return {
      employee: {
        image: null,
        employeeName: "",
        email: "",
        phone: "",
        password: "",
        department: "",
        userId: "",
        permanentAddress: {
          name: "",
          line1: "",
          line2: "",
          tahsil: "",
          country: "India",
          state: "Uttar Pradesh",
          city: "",
          pincode: "",
        },
        currentAddress: {
          name: "",
          line1: "",
          line2: "",
          tahsil: "",
          country: "",
          state: "",
          city: "",
          pincode: "",
        },
        permissions: {
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
        },
      },
      bank: {
        bankName: "",
        branch: "",
        accountHolder: "",
        accountNumber: "",
        ifsc: "",
      },
      roleOptions: [
        { value: "admin", text: "Admin" },
        { value: "employee", text: "Employee" },
      ],
      venderOptions: [{ value: "001", text: "001" }],
    };
  },
  methods: {
    onImageChange(event) {
      const file = event.target.files[0];
      if (file && file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.employee.image = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        alert("Please select a valid image file (Max 5MB).");
      }
    },
    copyPermanentAddress() {
      this.employee.currentAddress = { ...this.employee.permanentAddress };
    },
    onCancel() {
      this.bank = {
        bankName: "",
        branch: "",
        accountHolder: "",
        accountNumber: "",
        ifsc: "",
      };
    },
    onCreate() {
      const payload = {
        employee: this.employee,
        bank: this.bank,
      };

      axios
        .post(process.env.VUE_APP_AGENCY_BACKEND_URL + "employeeDetail", payload)
        .then((response) => {
          console.log("response", response);
          alert("Employee details submitted successfully!");
        })
        .catch((error) => {
          alert("Submission failed: " + error.message);
        });
    },
  },
};
</script>

<style scoped>
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
  background: linear-gradient(90deg,#7c3aed,#5b21b6);
  color: #fff;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
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
