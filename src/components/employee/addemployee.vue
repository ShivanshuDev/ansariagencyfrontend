<template>
  <div class="add-employee-form">
    <h2>Add Employee</h2>
    <section class="section">
      <h3>Basic Details</h3>
      <div class="row">
        <!-- <div class="form-image-upload">
          <label>
            <div class="image-placeholder">
              <span v-if="!employee.image">📷</span>
              <img v-if="employee.image" :src="employee.image" alt="Employee Image" />
            </div>
            <input type="file" @change="onImageChange" accept="image/png, image/jpeg" style="display: none" />
            <button type="button">Upload Image</button>
            <div class="note">JPG or PNG format, not exceeding 5MB.</div>
          </label>
        </div> -->

        <div class="form-fields">
          <div class="fields-row">
            <input type="text" v-model="employee.employeeName" placeholder="Full Name *" required />
            <input type="text" v-model="employee.phone" placeholder="Phone Number *" required />
            <input type="email" v-model="employee.email" placeholder="Email *" required />
          </div>
          <div class="fields-row">
            <input type="text" v-model="employee.userId" placeholder="userId" />
            <input type="text" v-model="employee.password" placeholder="Password" />
            <select v-model="employee.department">
              <option value="">Select Department</option>
              <option value="Warehouse">Warehouse</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
              <option value="RTO">RTO</option>
            </select>
          </div>
        </div>
      </div>
    </section>

    <section class="section addresses">
      <div class="address-col">
        <h3>Permanent Address</h3>
        <input type="text" v-model="employee.permanentAddress.name" placeholder="Name" />
        <input type="text" v-model="employee.permanentAddress.line1" placeholder="Address Line 1" />
        <input type="text" v-model="employee.permanentAddress.line2" placeholder="Address Line 2" />
        <input type="text" v-model="employee.permanentAddress.tahsil" placeholder="Tahsil" />
        <div class="fields-row">
          <select v-model="employee.permanentAddress.country">
            <option value="">Country</option>
            <option value="IN">India</option>
            <option value="US">United States</option>
          </select>
          <select v-model="employee.permanentAddress.state">
            <option value="">State</option>
            <option value="KA">Karnataka</option>
            <option value="MH">Maharashtra</option>
          </select>
        </div>
        <div class="fields-row">
          <select v-model="employee.permanentAddress.city">
            <option value="">City</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Mumbai">Mumbai</option>
          </select>
          <input type="text" v-model="employee.permanentAddress.pincode" placeholder="Pincode" />
        </div>
      </div>

      <div class="address-col">
        <div class="address-header">
          <h3>Current Address</h3>
          <a href="#" @click.prevent="copyPermanentAddress">Copy From Permanent</a>
        </div>
        <input type="text" v-model="employee.currentAddress.name" placeholder="Name" />
        <input type="text" v-model="employee.currentAddress.line1" placeholder="Address Line 1" />
        <input type="text" v-model="employee.currentAddress.line2" placeholder="Address Line 2" />
        <input type="text" v-model="employee.currentAddress.tahsil" placeholder="Tahsil" />
        <div class="fields-row">
          <select v-model="employee.currentAddress.country">
            <option value="">Country</option>
            <option value="IN">India</option>
            <option value="US">United States</option>
          </select>
          <select v-model="employee.currentAddress.state">
            <option value="">State</option>
            <option value="KA">Karnataka</option>
            <option value="MH">Maharashtra</option>
          </select>
        </div>
        <div class="fields-row">
          <select v-model="employee.currentAddress.city">
            <option value="">City</option>
            <option value="Bangalore">Bangalore</option>
            <option value="Mumbai">Mumbai</option>
          </select>
          <input type="text" v-model="employee.currentAddress.pincode" placeholder="Pincode" />
        </div>
      </div>
    </section>

    <section class="section permissions-section">
        <h3>Permissions</h3>
        <div class="permissions-checkboxes">
            <label>
                <input type="checkbox" v-model="employee.permissions.admin" />
                Admin
            </label>
            <label>
                <input type="checkbox" v-model="employee.permissions.rto" />
                RTO
            </label>
            <label>
                <input type="checkbox" v-model="employee.permissions.incurence" />
                Insurence
            </label>
            <label>
                <input type="checkbox" v-model="employee.permissions.sales" />
                Sales
            </label>
            <label>
                <input type="checkbox" v-model="employee.permissions.edit" />
                Edit
            </label>
            <label>
                <input type="checkbox" v-model="employee.permissions.add" />
                Add
            </label>
            <label>
                <input type="checkbox" v-model="employee.permissions.delete" />
                Delete
            </label>
            <label>
                <input type="checkbox" v-model="employee.permissions.download" />
                Download
            </label>
            
            <v-select
                outlined
                dence
                solo
                v-model="employee.permissions.employeeRole"
                :items="roleOptions"
                item-text="text"
                item-value="value"
                placeholder="Select Role"
                label="Role"
            />

            <v-select
                outlined
                dence
                solo
                v-model="employee.permissions.venderId"
                :items="venderOptions"
                item-text="text"
                item-value="value"
                placeholder="Select Vender"
                label="Vender"
            />
        </div>
    </section>


    <section class="banking-details-section">
      <h3>Banking Details</h3>
      <div class="banking-fields-row">
        <input type="text" v-model="bank.bankName" placeholder="Bank Name" />
        <input type="text" v-model="bank.branch" placeholder="Branch" />
        <input type="text" v-model="bank.accountHolder" placeholder="Account Holder" />
      </div>
      <div class="banking-fields-row">
        <input type="text" v-model="bank.accountNumber" placeholder="Account Number" />
        <input type="text" v-model="bank.ifsc" placeholder="IFSC" />
        <span class="empty-col"></span>
      </div>
      <div class="banking-actions">
        <button type="button" class="cancel-btn" @click="onCancel">Cancel</button>
        <button type="button" class="create-btn" @click="onCreate">Create New</button>
      </div>
    </section>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  data() {
    return {
        employee: {
            image: null,
            employeeName: '',
            email: '',
            phone: '',
            password: '',
            department: '',
            userId: '',
            permanentAddress: {
                name: '',
                line1: '',
                line2: '',
                tahsil: '',
                country: '',
                state: '',
                city: '',
                pincode: ''
            },
            currentAddress: {
                name: '',
                line1: '',
                line2: '',
                tahsil: '',
                country: '',
                state: '',
                city: '',
                pincode: ''
            },
            permissions: {
                employeeRole:'',
                venderId: '',
                edit: false,
                add: false,
                delete: false,
                download: false,
                admin:false,
                rto:false,
                sales:false,
                insurence:false,
            },
        },
        bank: {
            bankName: '',
            branch: '',
            accountHolder: '',
            accountNumber: '',
            ifsc: ''
        },
        roleOptions: [
            { value: 'admin', text: 'Admin' },
            { value: 'employee', text: 'Employee' },
        ],
        venderOptions:[
            {value: '001', text:'001'}
        ]
    }
  },
  methods: {
    onImageChange(event) {
      const file = event.target.files[0];
      if (file && file.size <= 5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = e => {
          this.employee.image = e.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please select a valid image file (Max 5MB).');
      }
    },
    copyPermanentAddress() {
      this.employee.currentAddress = { ...this.employee.permanentAddress };
    },
    onCancel() {
      this.bank = {
        bankName: '',
        branch: '',
        accountHolder: '',
        accountNumber: '',
        ifsc: ''
      };
    },
    onCreate() {
        const payload = {
            employee: this.employee,
            bank: this.bank
        };

        axios.post(process.env.VUE_APP_AGENCY_BACKEND_URL+'employeeDetail', payload)
            .then(response => {
                console.log('response', response)
            alert('Employee details submitted successfully!');
            // Optionally reset form or update UI
            })
            .catch(error => {
            alert('Submission failed: ' + error.message);
            // Optionally show error in UI
            });
        }

    }
}
</script>

<style scoped>
.add-employee-form {
  max-width: 99%;
  margin: 0 auto;
  margin-top: 9px;
  margin-bottom: 9px;
  font-family: 'Inter', Arial, sans-serif;
  background: #fff;
  border-radius: 8px;
  padding: 18px 24px;
  box-shadow: 0 2px 12px #0001;
}
.section {
  margin-bottom: 24px;
}
.row {
  margin-top: 30px;
  display: flex;
  gap: 24px;
}
.form-image-upload {
  width: 180px;
  text-align: center;
}
.image-placeholder {
  width: 90px;
  height: 90px;
  background: #F3F4F6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  margin: 0 auto 10px;
  font-size: 28px;
  color: #aa53cb;
}
.form-image-upload img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.form-image-upload button {
  margin-top: 8px;
  background: #aa53cb;
  color: #fff;
  border: none;
  padding: 4px 16px;
  border-radius: 5px;
  cursor: pointer;
}
.form-image-upload .note {
  font-size: 12px;
  color: #888;
  margin-top: 4px;
}
.form-fields {
  flex: 1;
}
.fields-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}
.fields-row input,
.fields-row select {
  flex: 1;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #e4e7ec;
  font-size: 15px;
  background: #f8fafc;
}
input,
select {
  margin-bottom: 12px;
  width: 100%;
  box-sizing: border-box;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #e4e7ec;
  font-size: 15px;
  background: #f8fafc;
}
.addresses {
  display: flex;
  gap: 32px;
  margin-top: 18px;
}
.address-col {
  flex: 1;
  border-top: 1px solid #eee;
  padding-top: 12px;
  min-width: 320px;
}
.address-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.address-header h3 {
  margin: 0;
}
.address-header a {
  font-size: 13px;
  color: #aa53cb;
  cursor: pointer;
  text-decoration: none;
}
.address-header a:hover {
  color: #8e3fb5;
}
.banking-details-section {
  border-top: 1px solid #eee;
  padding-top: 18px;
}
.banking-fields-row {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}
.banking-fields-row input {
  flex: 1;
  padding: 8px;
  border-radius: 5px;
  border: 1px solid #e4e7ec;
  background: #f8fafc;
  font-size: 15px;
  transition: border-color 0.3s ease;
}
.banking-fields-row input:focus {
  border-color: #aa53cb;
  outline: none;
}
.empty-col {
  flex: 1;
}
.banking-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  margin-top: 12px;
}
.cancel-btn {
  background: #777;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.cancel-btn:hover {
  background: #555;
}
.create-btn {
  background: #aa53cb;
  color: #fff;
  border: none;
  padding: 8px 18px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s ease;
}
.create-btn:hover {
  background: #8e3fb5;
}
.permissions-section {
  border-top: 1px solid #eee;
  padding-top: 18px;
  margin-top: 24px;
}

.permissions-checkboxes {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.permissions-checkboxes label {
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.permissions-checkboxes input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

</style>
