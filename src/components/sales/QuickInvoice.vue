<template>
  <v-card style="margin:10px;" class="rounded-lg">
    <v-toolbar flat dense>
      <v-toolbar-title class="subtitle-1 font-weight-bold">Quick Invoice — Customer Sale, <v-chip> Chassis No- {{form.chassisNumber}}</v-chip>, <v-chip>Engein Number - {{selectedChassisInfo.engineNumber}}</v-chip>, <v-chip>Color- {{selectedChassisInfo.Color}}</v-chip></v-toolbar-title>
      <v-spacer/>
      <v-btn small outlined class="mr-2" :disabled="!canPreview" @click="openInvoice">
        <v-icon left small>mdi-file-eye</v-icon> Preview
      </v-btn>
      <v-btn icon @click="$emit('close')"><v-icon>mdi-close</v-icon></v-btn>
    </v-toolbar>
    <v-divider/>
    
    <!-- Progress Indicator -->
    <v-stepper style="height:90px;" v-model="currentStep" alt-labels class="elevation-0">
      <v-stepper-header class="elevation-0">
        <v-stepper-step :complete="currentStep > 1" step="1" >
          <span>Owner</span>
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step :complete="currentStep > 2" step="2" >
          Finance & RTO
        </v-stepper-step>
        <v-divider></v-divider>
        <v-stepper-step step="3" >
          Price & Payment
        </v-stepper-step>
      </v-stepper-header>
    </v-stepper>
    
    <v-divider/>
    
    <v-card-text style="height:600px; overflow-y:scroll;">
      <v-form ref="form" v-model="valid" lazy-validation>
        <!-- error summary -->
        <v-alert v-if="errorSummary.length" type="error" dense outlined class="mb-3">
          <div><strong>Please fix the following:</strong></div>
          <ul style="margin:6px 0 0; padding-left:18px;">
            <li v-for="(e,i) in errorSummary" :key="i">{{ e }}</li>
          </ul>
        </v-alert>

        <!-- STEP 1: OWNER INFORMATION -->
        <div v-if="currentStep === 1">
          <!-- Search by chassis ONLY -->
          <section class="section-wrap">
            <div class="section-head d-flex align-center">
              Search Vehicle by Chassis
              <v-spacer/>
              <v-chip
                small v-if="searchedOnce && !searchLoading && selectedChassisInfo.status"
                :color="isSold ? 'red' : 'green'" text-color="white"
              >
                {{ selectedChassisInfo.status }}
              </v-chip>
            </div>

            <v-row dense>
              <v-col cols="12" sm="6" md="5">
                <v-text-field
                  v-model.trim="searchChassis"
                  label="Enter Chassis Number"
                  dense outlined clearable hide-details="auto"
                  prepend-inner-icon="mdi-barcode"
                  @keydown.enter.prevent="doSearchChassis"
                />
              </v-col>

              <v-col cols="12" sm="6" md="3" class="d-flex align-center">
                <v-btn color="primary" :loading="searchLoading" :disabled="!searchChassis" @click="doSearchChassis">
                  <v-icon left small>mdi-magnify</v-icon> Search
                </v-btn>
                <v-btn text class="ml-2" @click="clearVehicle" :disabled="!searchedOnce">Clear</v-btn>
              </v-col>
            </v-row>

            <v-alert v-if="searchError" type="warning" dense class="mt-2" outlined>{{ searchError }}</v-alert>
          </section>

          <!-- Basic Information -->
          <section class="section-wrap">
            <div class="section-head">Basic Information</div>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-text-field v-model="form.basic.invoiceNumber" label="Invoice Number" dense outlined hide-details="auto" prepend-inner-icon="mdi-receipt"/>
              </v-col>
              <v-col cols="12" sm="4">
                <v-menu v-model="menus.invDate" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }">
                    <v-text-field v-model="form.basic.purchaseDate"  label="Purchase/Delivery Date" readonly dense outlined hide-details="auto"  v-bind="attrs" v-on="on" prepend-inner-icon="mdi-calendar"/>
                  </template>
                  <v-date-picker v-model="form.basic.purchaseDate" @input="menus.invDate=false"/>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="4">
                <v-text-field v-model="form.basic.assignedRtoOffice" label="Please Assigned RTO Office" dense outlined hide-details="auto"/>
              </v-col>
            </v-row>
          </section>

          <!-- Vehicle Information (readonly, filled from search) -->
          <section class="section-wrap">
            <div class="section-head">Vehicle Information</div>
            <v-row dense>
              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model="form.category" label="Category" dense outlined hide-details="auto" readonly/>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model="form.model" label="Model" dense outlined hide-details="auto" readonly/>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model="form.chassisNumber" label="Chassis No." dense outlined hide-details="auto" readonly/>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model="selectedChassisInfo.engineNumber" label="Engine/Motor No." dense outlined hide-details="auto" readonly/>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model="selectedChassisInfo.color" label="Color" dense outlined hide-details="auto" readonly/>
              </v-col>

              <!-- Vehicle Price: behaves per Bill Price Mode -->
              <v-col cols="12" sm="6" md="4">
                <v-text-field
                  v-model.number="form.price"
                  type="number"
                  :rules="[rNumPos]"
                  :label="vehiclePriceLabel"
                  prefix="₹"
                  dense outlined hide-details="auto"
                />
                <div class="caption grey--text mt-1">
                  Mode: <b>{{ form.billOptions.billPriceMode }}</b>.
                  <span v-if="form.billOptions.billPriceMode==='ON_ROAD'">We derive ex-RTO/Insurance price from this.</span>
                  <span v-else>We will add RTO/Insurance on top.</span>
                </div>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model.number="form.qty" type="number" :rules="[rQty]" label="Qty" dense outlined hide-details="auto"/>
              </v-col>

              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model.number="form.rtoCharges" type="number" label="RTO Charges (per unit)" prefix="₹" dense outlined hide-details="auto"/>
              </v-col>
              <v-col cols="12" sm="6" md="4">
                <v-text-field v-model.number="form.insuranceCharges" type="number" label="Insurance Charges (per unit)" prefix="₹" dense outlined hide-details="auto"/>
              </v-col>
            </v-row>
          </section>

          <!-- Owner Information -->
          <section class="section-wrap">
            <div class="section-head">Owner Information</div>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-select v-model="form.owner.ownershipType" :items="ownershipTypes" label="Ownership Type" dense outlined hide-details="auto"/>
              </v-col>

              <!-- Individual -->
              <template v-if="form.owner.ownershipType==='INDIVIDUAL'">
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.customer.name" :rules="[rReq]" label="Owner Name"  dense outlined hide-details="auto"/>
                </v-col>

                <!-- NEW: Relation Type + Relation Name -->
                <v-col cols="12" sm="4">
                  <v-select
                    v-model="form.owner.relationType"
                    :items="relations"
                    label="Owner Relation Type"
                    dense outlined hide-details="auto"
                  />
                </v-col>
                <v-col cols="12" sm="4" v-if="form.owner.relationType">
                  <v-text-field
                    v-model="form.owner.relationName"
                    :label="`${form.owner.relationType} Name`"
                    dense outlined hide-details="auto"
                  />
                </v-col>

                <v-col cols="12" sm="4">
                  <v-menu v-model="menus.dob" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                    <template #activator="{ on, attrs }">
                      <v-text-field v-model="form.owner.dob" v-bind="attrs" v-on="on" label="Date Of Birth" dense outlined readonly hide-details="auto" prepend-inner-icon="mdi-calendar"/>
                    </template>
                    <v-date-picker v-model="form.owner.dob" @input="menus.dob=false"/>
                  </v-menu>
                </v-col>

                <!-- Same height (dense + outlined) for both Mobile & Email -->
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="form.customer.phone"
                    :rules="[rReq, rPhoneInline]"
                    label="Mobile No."
                    inputmode="numeric"
                    :maxlength="10"
                    :counter="10"
                    @keypress="onlyDigits"
                    @input="restrictCustomerMobileInput"
                    dense outlined hide-details="auto"
                    prepend-inner-icon="mdi-phone"
                  />
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field
                    v-model="form.customer.email"
                    :rules="[rEmailInline]"
                    label="Email Id"
                    dense outlined hide-details="auto"
                    prepend-inner-icon="mdi-email"
                  />
                </v-col>
              </template>

              <!-- Firm -->
              <template v-else>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.firm.name" :rules="[rReq]" label="Firm Name" dense outlined hide-details="auto"/>
                </v-col>
                <v-col cols="12" sm="4">
                  <v-text-field v-model="form.firm.gst" :rules="[rGST]" label="GSTIN (if applicable)" dense outlined hide-details="auto"/>
                </v-col>
                <v-col cols="12" sm="12">
                  <v-text-field v-model="form.firm.address" :rules="[rReq]" label="Firm Address" outlined dense hide-details="auto"/>
                </v-col>

                <!-- Custom KV rows for firm -->
                <v-col cols="12">
                  <div class="mini-title d-flex align-center">
                    Additional Firm Details
                    <v-spacer/>
                    <v-btn small outlined @click="addFirmKV"><v-icon left small>mdi-plus</v-icon>Add Field</v-btn>
                  </div>
                </v-col>
                <v-col cols="12" v-for="(kv, i) in form.firm.extra" :key="kv.key">
                  <v-row dense>
                    <v-col cols="12" sm="5">
                      <v-text-field v-model.trim="kv.k" label="Key (e.g., Contact Person)" dense outlined hide-details="auto" :rules="[optNonEmptyIfFilled(kv.v)]"/>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-text-field v-model.trim="kv.v" label="Value" dense outlined hide-details="auto" :rules="[optNonEmptyIfFilled(kv.k)]"/>
                    </v-col>
                    <v-col cols="12" sm="1" class="d-flex align-center">
                      <v-btn icon @click="removeFirmKV(i)"><v-icon color="red">mdi-delete</v-icon></v-btn>
                    </v-col>
                  </v-row>
                </v-col>
              </template>
            </v-row>
          </section>

          <!-- Address: side-by-side Current & Permanent -->
          <section class="section-wrap">
            <div class="section-head">Address Details</div>
            <v-row dense>
              <!-- Current Address -->
              <v-col cols="12" md="6">
                <div class="mini-title">Current Address</div>
                <v-row dense>
                  <v-col cols="12"><v-text-field v-model="form.customer.address.line1" :rules="[rReq]" label="House No. & Street Name" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12"><v-text-field v-model="form.customer.address.line2" label="Landmark/Police Station" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.customer.address.village" label="Village/Town/City" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.customer.address.postOffice" label="Post / Dharahan" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.customer.address.tahsil" label="Tahsil" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.customer.address.district" label="District" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.customer.address.state" :rules="[rReq]" label="State" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="form.customer.address.pincode"
                      :rules="[rPincodeInline]"
                      label="PIN"
                      inputmode="numeric"
                      :maxlength="6"
                      :counter="6"
                      @keypress="onlyDigits"
                      @input="restrictPincodeInput($event, 'customer')"
                      dense outlined hide-details="auto"
                    />
                  </v-col>
                </v-row>
              </v-col>

              <!-- Permanent Address -->
              <v-col cols="12" md="6">
                <div class="d-flex align-center">
                  <div class="mini-title mr-3 mb-2">Permanent Address</div>
                  <v-spacer/>
                  <br />
                  <v-checkbox v-model="sameAsCurrent" @change="copyCurrentToPermanent" class="mt-0" hide-details label="Same as Current Address"/>
                </div>

                <v-row dense>
                  <v-col cols="12"><v-text-field v-model="form.permanentAddress.line1" label="House No. & Street Name" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12"><v-text-field v-model="form.permanentAddress.line2" label="Landmark/Police Station" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.permanentAddress.village" label="Village/Town/City" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.permanentAddress.postOffice" label="Post" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.permanentAddress.tahsil" label="Tahsil" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.permanentAddress.district" label="District" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.permanentAddress.state" label="State" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="form.permanentAddress.pincode"
                      :rules="[rPincodeInline]"
                      label="PIN"
                      inputmode="numeric"
                      :maxlength="6"
                      :counter="6"
                      @keypress="onlyDigits"
                      @input="restrictPincodeInput($event, 'permanent')"
                      dense outlined hide-details="auto"
                    />
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </section>

          <!-- Customer ID Proof -->
          <section class="section-wrap">
            <div class="section-head">Customer ID Proof</div>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-select
                  v-model="form.ids.type"
                  :items="idTypes"
                  label="Select ID Type"
                  dense outlined hide-details="auto"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  v-model.trim="form.ids.value"
                  :label="idInputLabel"
                  :rules="[validateIdByType]"
                  :maxlength="idMaxLength"
                  :counter="idMaxLength"
                  :type="idNumericOnly ? 'tel' : 'text'"
                  :inputmode="idNumericOnly ? 'numeric' : 'text'"
                  @keypress="idNumericOnly ? onlyDigits($event) : null"
                  @input="coerceIdValue"
                  dense outlined hide-details="auto"
                />
              </v-col>
              <v-col cols="12" sm="6">
                <div class="uploader">
                    <label class="choose-file">
                      <v-icon v-if="false"></v-icon> <!-- noop to avoid lint about empty label -->
                      <span class="btn">Select files</span>
                      <input
                        ref="fileInput"
                        type="file"
                        :accept="accept"
                        :multiple="multiple"
                        @change="onFilesChange"
                      />
                    </label>

                    <!-- File list -->
                    <div v-if="files.length" class="files-wrap">
                      <div class="list-head">
                        <div><strong>{{ files.length }}</strong> file(s) selected</div>
                        <div class="actions">
                          <button class="btn ghost" @click="clearAll" :disabled="uploading">Clear all</button>
                          <button class="btn primary" @click="uploadAll" :disabled="uploading">Upload</button>
                        </div>
                      </div>

                      <!-- Thumbnails for images -->
                      <div class="thumbs" v-if="imageItems.length">
                        <div v-for="f in imageItems" :key="f.id" class="thumb">
                          <img :src="f.previewUrl" :alt="f.name">
                          <div class="thumb-meta">
                            <div class="name" :title="f.name">{{ f.name }}</div>
                            <div class="size">{{ formatSize(f.size) }}</div>
                          </div>
                          <button class="remove" @click="removeFile(f.id)" title="Remove">&times;</button>
                        </div>
                      </div>

                      <!-- Non-image files as list -->
                      <div class="list" v-if="otherItems.length">
                        <div v-for="f in otherItems" :key="f.id" class="row">
                          <div class="col grow">
                            <div class="name" :title="f.name">{{ f.name }}</div>
                            <div class="muted">{{ f.type || 'unknown' }} · {{ formatSize(f.size) }}</div>
                          </div>
                          <button class="remove small" @click="removeFile(f.id)" title="Remove">Remove</button>
                        </div>
                      </div>

                      <!-- Progress (optional simple) -->
                      <div v-if="uploading" class="progress">Uploading… {{ progress }}%</div>
                    </div>
                </div>
              </v-col>
            </v-row>

            <!-- Dynamic KV for extra proofs -->
            <div class="mini-title d-flex align-center">
              Additional ID Details
              <v-spacer/>
              <v-btn small outlined @click="addIdKV"><v-icon left small>mdi-plus</v-icon>Add Field</v-btn>
            </div>
            <v-row dense v-for="(kv, i) in form.ids.custom" :key="kv.key">
              <v-col cols="12" sm="5">
                <v-text-field v-model="kv.k" label="Key (e.g., Passport)" dense outlined hide-details="auto" :rules="[optNonEmptyIfFilled(kv.v)]"/>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field v-model="kv.v" label="Value" dense outlined hide-details="auto" :rules="[optNonEmptyIfFilled(kv.k)]"/>
              </v-col>
              <v-col cols="12" sm="1" class="d-flex align-center">
                <v-btn icon @click="removeIdKV(i)"><v-icon color="red">mdi-delete</v-icon></v-btn>
              </v-col>
            </v-row>
          </section>

          <!-- Nominee -->
          <section class="section-wrap">
            <div class="section-head">Nominee Details</div>
            <v-row dense>
              <v-col cols="12" sm="4"><v-text-field v-model="form.nominee.name" label="Nominee Name" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-select v-model="form.nominee.relation" :items="relations" label="Relation With Nominee" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model.number="form.nominee.age" :rules="[rAge]" label="Nominee Age" type="number" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="form.nominee.mobile"
                  :rules="[rNomineeMobileInline]"
                  label="Nominee Mobile"
                  inputmode="numeric"
                  :maxlength="10"
                  :counter="10"
                  @keypress="onlyDigits"
                  @input="restrictNomineeMobileInput"
                  dense outlined hide-details="auto"
                />
              </v-col>

              <!-- Nominee photo -->
                <v-col cols="12" sm="4">
                 
                  <v-file-input
                    :key="form.nominee.inputKey"
                    accept="image/*"
                    dense
                    outlined
                    hide-details="auto"
                    label="Choose nominee image"
                    append-inner-icon="mdi-image"
                    show-size
                    truncate-length="22"
                    @change="onNomineeFileChange"
                    @click:append-inner="$refs.nomineeInput.click()"
                    ref="nomineeInput"
                  />


                  <!-- Preview -->
                  <div v-if="form.nominee.previewUrl" class="nominee-thumb mt-2">
                    <img :src="form.nominee.previewUrl" alt="Nominee photo" />
                    <div class="thumb-meta">
                      <div class="name" :title="form.nominee.file?.name">{{ form.nominee.file?.name }}</div>
                      <div class="size">{{ formatSize(form.nominee.file?.size || 0) }}</div>
                    </div>
                    <v-btn class="remove" icon small @click="clearNomineeImage" title="Remove">
                      <v-icon small>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </v-col>

            </v-row>
          </section>

          
        </div>

        <!-- STEP 2: FINANCE & RTO DETAIL -->
        <div v-if="currentStep === 2">
          <!-- Sales Mode -->
          <section class="section-wrap">
            <div class="section-head">Choose Sales Mode</div>
            <v-radio-group v-model="form.salesMode" row>
              <v-radio label="Cash" value="CASH"></v-radio>
              <v-radio label="Finance" value="FINANCE"></v-radio>
            </v-radio-group>
          </section>
          
          <!-- Finance Details (hide when CASH) -->
          <section v-if="form.salesMode==='FINANCE'" class="section-wrap">
            <div class="section-head">Finance Details</div>
            <v-row dense>
              <v-col cols="12" sm="4">
                <v-select v-model="form.finance.company" :items="financeCompanies" label="Select Finance Company" dense outlined hide-details="auto"/>
              </v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="form.finance.financerName" label="Financer Name" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model.number="form.finance.downPayment" :rules="[optMoney]" type="number" prefix="₹" label="Down Payment" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model.number="form.finance.loanAmount" :rules="[optMoney]" type="number" prefix="₹" label="Loan Amount" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model.number="form.finance.disbursementAmount" :rules="[optMoney]" type="number" prefix="₹" label="Disbursement Amount" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="form.finance.agreementNumber" label="Agreement Number" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model.number="form.finance.emi" :rules="[optMoney]" type="number" prefix="₹" label="EMI" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model.number="form.finance.tenureMonths" :rules="[optInteger]" type="number" label="Tenure in Months" dense outlined hide-details="auto"/></v-col>
            </v-row>
          </section>

          <!-- Registration -->
          <section class="section-wrap">
            <div class="section-head">Registration Information</div>
            <v-row dense>
              <v-col cols="12" sm="4"><v-text-field v-model="form.registration.number" label="Registration Number" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4">
                <v-menu v-model="menus.rcApplied" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="form.registration.rcAppliedDate" v-bind="attrs" v-on="on" label="RC Applied Date" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="form.registration.rcAppliedDate" @input="menus.rcApplied=false"/>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="4">
                <v-menu v-model="menus.regPay" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="form.registration.paymentDate" v-bind="attrs" v-on="on" label="Registration Payment Date" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="form.registration.paymentDate" @input="menus.regPay=false"/>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="4">
                <v-menu v-model="menus.hsrpApplied" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="form.registration.hsrpAppliedDate" v-bind="attrs" v-on="on" label="HSRP Applied Date" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="form.registration.hsrpAppliedDate" @input="menus.hsrpApplied=false"/>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="4"><v-text-field v-model="form.registration.hsrpCourier" label="HSRP Receiving Date by courier" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4">
                <v-menu v-model="menus.rcPrint" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="form.registration.rcPrintDate" v-bind="attrs" v-on="on" label="RC Print Date" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="form.registration.rcPrintDate" @input="menus.rcPrint=false"/>
                </v-menu>
              </v-col>
            </v-row>
          </section>

          <!-- Insurance -->
          <section class="section-wrap">
            <div class="section-head">Insurance Details</div>
            <v-row dense>
              <v-col cols="12" sm="3"><v-select v-model="form.insurance.type" :items="insuranceTypes" label="Insurance Type" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="3"><v-text-field v-model="form.insurance.company" label="Insurance Company" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="3"><v-text-field v-model="form.insurance.policyNo" label="Policy No." dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="3"><v-text-field v-model="form.insurance.idv" :rules="[optMoney]" label="Insurance Declared Value" prefix="₹" type="number" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="3">
                <v-menu v-model="menus.insFrom" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="form.insurance.validFrom" v-bind="attrs" v-on="on" label="Insurance From (DD-MM-YYYY)" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="form.insurance.validFrom" @input="menus.insFrom=false"/>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="3"><v-select v-model="form.insurance.periodYears" :items="[1,2,3,4,5]" label="Insurance Period (in Years)" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="3">
                <v-menu v-model="menus.insUpto" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="form.insurance.validUpto" v-bind="attrs" v-on="on" label="Insurance UPTO (DD-MM-YYYY)" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="form.insurance.validUpto" @input="menus.insUpto=false"/>
                </v-menu>
              </v-col>
            </v-row>
          </section>

          <!-- Receiving -->
          <section class="section-wrap">
            <div class="section-head">Customer Receiving Detail</div>
            <v-row dense>
              <v-col cols="12" sm="4"><v-text-field v-model="form.receiving.receiverName" label="Receiver Name" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4">
                <v-text-field
                  v-model="form.receiving.mobile"
                  :rules="[optPhone]"
                  label="Mobile Number"
                  inputmode="numeric"
                  :maxlength="10"
                  :counter="10"
                  @keypress="onlyDigits"
                  @input="restrictReceiverMobileInput"
                  dense outlined hide-details="auto"
                />
              </v-col>
              <v-col cols="12" sm="4">
                <v-menu v-model="menus.numberPlateDate" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="form.receiving.numberPlateReceivingDate" v-bind="attrs" v-on="on" label="Number Plate Receiving Date" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="form.receiving.numberPlateReceivingDate" @input="menus.numberPlateDate=false"/>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="4">
                <v-menu v-model="menus.rcReceivingDate" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="form.receiving.rcReceivingDate" v-bind="attrs" v-on="on" label="RC Receiving Date" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="form.receiving.rcReceivingDate" @input="menus.rcReceivingDate=false"/>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="8"><v-text-field v-model="form.receiving.remarks" label="Remarks" dense outlined hide-details="auto"/></v-col>
            </v-row>
          </section>
        </div>

        <!-- STEP 3: PRICE & PAYMENT DETAIL -->
        <div v-if="currentStep === 3">
          <!-- Price structure -->
          <section class="section-wrap">
            <div class="section-head">Price Structure</div>
            <v-row dense>
              <v-col cols="12" sm="3">
                <v-text-field :value="money(lineAmount)" label="Vehicle Amount (ex-RTO/Ins)" dense outlined hide-details="auto" readonly/>
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field :value="money(totalRtoCharges)" label="RTO Charges" dense outlined hide-details="auto" readonly/>
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field :value="money(totalInsuranceCharges)" label="Insurance Charges" dense outlined hide-details="auto" readonly/>
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field readonly :value="money(form.priceStructure.hypCharge)" type="number" label="HYP Charge" prefix="₹" dense outlined hide-details="auto"/>
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field readonly :value="money(form.priceStructure.accessoryCharge)" type="number" label="Total Accessories Charge" prefix="₹" dense outlined hide-details="auto"/>
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field readonly :value="money(form.priceStructure.otherCharge)" type="number" label="Other Charge" prefix="₹" dense outlined hide-details="auto"/>
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field readonly :value="money(form.priceStructure.downPayment)" type="number" label="Down Payment" prefix="₹" dense outlined hide-details="auto"/>
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field v-model="form.priceStructure.offerName" label="Offer Name" dense outlined hide-details="auto"/></v-col>
              
              <v-col cols="12" sm="3"><v-text-field v-model.number="form.priceStructure.discount" :rules="[optMoney]" type="number" label="Cash Discount" prefix="₹" dense outlined hide-details="auto"/></v-col>
              
              <!-- New Discount Fields -->
              <v-col cols="12" sm="3">
                <v-text-field v-model.number="form.priceStructure.offerDiscount" :rules="[optMoney]" type="number" label="Offer Discount" prefix="₹" dense outlined hide-details="auto"/>
              </v-col>

              <!-- New Discount Fields -->
              <v-col cols="12" sm="3">
                <v-text-field v-model.number="form.priceStructure.seasonalDiscount" :rules="[optMoney]" type="number" label="Scheme Discount" prefix="₹" dense outlined hide-details="auto"/>
              </v-col>

              <!-- In the Price Structure section, replace the Additional Discount field: -->
              <v-col cols="12" sm="3">
                <v-text-field v-model.number="form.priceStructure.finalSettlement" :rules="[optMoney]" type="number" label="Final Settlement" prefix="₹" dense outlined hide-details="auto" />
              </v-col>
            </v-row>

            <!-- Bill price mode -->
            <v-row dense class="mt-2">
              <v-col cols="12">
                <div class="mini-title">Bill Price Mode</div>
                <v-radio-group v-model="form.billOptions.billPriceMode" row>
                  <v-radio label="On-road Price (entered price includes RTO & Insurance; we derive ex-RTO/Ins)" value="ON_ROAD"></v-radio>
                  <v-radio label="Showroom Price (entered price is showroom; add RTO/Insurance on top)" value="SHOWROOM"></v-radio>
                </v-radio-group>
              </v-col>
            </v-row>
          </section>

          <!-- Accessories Section (existing) -->
          <section class="section-wrap">
            <div class="section-head d-flex align-center">
              Accessories
              <v-spacer/>
              <v-btn small outlined @click="addAccessory"><v-icon left small>mdi-plus</v-icon>Add Accessory</v-btn>
            </div>
            <v-divider class="mb-2"/>
            <v-row v-for="(acc, idx) in form.accessories" :key="acc.key" dense>
              <v-col cols="12" sm="4">
                <v-text-field 
                  v-model="acc.name" 
                  label="Accessory Name" 
                  dense outlined 
                  hide-details="auto"
                  placeholder="e.g., Helmet, Cover, etc."
                />
              </v-col>
              <v-col cols="12" sm="2">
                <v-text-field 
                  v-model.number="acc.qty" 
                  type="number" 
                  label="Qty" 
                  dense outlined 
                  hide-details="auto"
                  :rules="[rNumNonNeg]"
                />
              </v-col>
              <v-col cols="12" sm="3">
                <v-text-field 
                  v-model.number="acc.price" 
                  type="number" 
                  label="Price" 
                  prefix="₹"
                  dense outlined 
                  hide-details="auto"
                  :rules="[rNumNonNeg]"
                />
              </v-col>
              <v-col cols="12" sm="2" class="d-flex align-center">
                <v-text-field 
                  :value="money(accessoryAmount(acc))" 
                  label="Amount" 
                  dense outlined 
                  hide-details="auto"
                  readonly
                />
              </v-col>
              <v-col cols="12" sm="1" class="d-flex align-center">
                <v-btn icon @click="removeAccessory(idx)"><v-icon color="red">mdi-delete</v-icon></v-btn>
              </v-col>
            </v-row>
            <v-row v-if="form.accessories.length > 0" dense class="mt-2">
              <v-col cols="12" class="text-right">
                <strong>Total Accessories Amount: {{ money(accessoriesTotal) }}</strong>
              </v-col>
            </v-row>
          </section>

          <!-- Tax (GST reversed) -->
          <section class="section-wrap">
            <div class="section-head">Tax</div>
            <v-row dense>
              <v-col cols="12" sm="4">
                <!-- reversed meaning -->
                <v-checkbox
                  v-model="form.priceIncludesTax"
                  label="Price excludes GST (add CGST/SGST on top)"
                  hide-details="auto"
                />
                <div class="caption grey--text mt-1">
                  Unchecked = GST included in price (back-calculate).
                </div>
              </v-col>
              <v-col cols="12" sm="4"><v-text-field v-model.number="form.cgstPercent" label="CGST %" type="number" :rules="[rPct]" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="4"><v-text-field v-model.number="form.sgstPercent" label="SGST %" type="number" :rules="[rPct]" dense outlined hide-details="auto"/></v-col>
            </v-row>
          </section>

          <!-- Bill Options -->
          <section class="section-wrap">
            <div class="section-head">Bill Options</div>
            <v-row dense>
              <v-col cols="12" sm="3">
                <v-checkbox v-model="form.billOptions.showRto" label="Show RTO Charges in Bill" hide-details/>
              </v-col>
              <v-col cols="12" sm="3">
                <v-checkbox v-model="form.billOptions.showInsurance" label="Show Insurance Details/Charges in Bill" hide-details/>
              </v-col>
              <v-col cols="12" sm="6">
                <v-checkbox
                  v-model="form.billOptions.showGstDetail"
                  label="Show GST breakdown (Taxable, CGST, SGST) in Bill"
                  hide-details
                />
              </v-col>
            </v-row>
          </section>

          <!-- Payment split -->
          <section class="section-wrap">
            <div class="section-head d-flex align-center">
              Payment Breakdown
              <v-spacer/>
              <v-btn small outlined @click="addPaymentRow"><v-icon left small>mdi-plus</v-icon>Add Row</v-btn>
            </div>
            <v-divider class="mb-2"/>
            <v-row v-for="(p, idx) in form.payments" :key="p.key" dense>
              <v-col cols="12" sm="2">
                <v-select
                  v-model="p.mode"
                  :items="payModes"
                  item-text="text"
                  item-value="value"
                  :rules="[rReq]"
                  label="Mode"
                  dense outlined hide-details="auto"
                />
              </v-col>

              <v-col cols="12" sm="3">
                <v-text-field
                  v-model="p.reference"
                  label="Reference (UPI/Bank/Cheque)"
                  dense outlined hide-details="auto"
                />
              </v-col>

              <v-col cols="12" sm="2">
                <v-text-field
                  v-model.number="p.amount"
                  :rules="[rNumNonNeg]"
                  type="number"
                  prefix="₹"
                  label="Amount"
                  dense outlined hide-details="auto"
                />
              </v-col>

              <!-- Image Upload (per-row) -->
              <v-col cols="12" sm="4">
                <v-file-input
                  :key="p.inputKey"
                  accept="image/*"
                  multiple
                  dense
                  outlined
                  hide-details="auto"
                  prepend-icon="mdi-image-multiple"
                  label="Choose images (invoice slip, cheque photo, etc.)"
                  @change="onPaymentFilesChange(idx, $event)"
                  show-size
                  chips
                  counter
                />

                <!-- Thumbnails -->
                <div v-if="p.previews && p.previews.length" class="thumb-grid mt-2">
                  <div v-for="img in p.previews" :key="img.id" class="thumb">
                    <img :src="img.url" :alt="img.name">
                    <div class="thumb-meta">
                      <div class="name" :title="img.name"><span style="font-size:10px;">{{ img.name }}</span></div>
                      <div class="size">{{ formatSize(img.size) }}</div>
                    </div>
                    <v-btn class="remove" icon small @click="removePaymentImage(idx, img.id)">
                      <v-icon small>mdi-close</v-icon>
                    </v-btn>
                  </div>
                </div>
              </v-col>

              <v-col cols="12" sm="1">
                <v-btn dence style="border:1px solid red;" icon :disabled="form.payments.length===1" @click="removePaymentRow(idx)">
                  <v-icon color="red">mdi-delete</v-icon>
                </v-btn>
              </v-col>

            </v-row>
          </section>

          <!-- Due Payments (plan) -->
          <section class="section-wrap">
            <div class="section-head d-flex align-center">
              Due Payments Plan
              <v-spacer/>
              <v-btn small outlined @click="addDueRow"><v-icon left small>mdi-plus</v-icon>Add Due</v-btn>
            </div>
            <v-row dense v-for="(d, i) in form.duePayments" :key="d.key">
              <v-col cols="12" sm="3">
                <v-menu v-model="d.menu" :close-on-content-click="false" transition="scale-transition" offset-y min-width="auto">
                  <template #activator="{ on, attrs }"><v-text-field v-model="d.date" v-bind="attrs" v-on="on" label="Due Date" dense outlined hide-details="auto" readonly prepend-inner-icon="mdi-calendar"/></template>
                  <v-date-picker v-model="d.date" @input="d.menu=false"/>
                </v-menu>
              </v-col>
              <v-col cols="12" sm="3"><v-text-field v-model.number="d.amount" :rules="[rNumNonNeg]" type="number" prefix="₹" label="Amount" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="5"><v-text-field v-model="d.note" label="Note" dense outlined hide-details="auto"/></v-col>
              <v-col cols="12" sm="1" class="d-flex align-center"><v-btn icon @click="removeDueRow(i)"><v-icon color="red">mdi-delete</v-icon></v-btn></v-col>
            </v-row>
            <div class="caption grey--text mt-1">
              Remaining Due Now: <b :class="dueAmount>0 ? 'red--text text--darken-2':'green--text text--darken-2'">{{ money(dueAmount) }}</b> —
              Planned Dues Sum: <b>{{ money(totalPlannedDue) }}</b>
            </div>
          </section>
        </div>

      </v-form>
    </v-card-text>

    <v-card-actions style="display:flex; flex-direction:column; border-top:1px solid gray;">
        <!-- Navigation Buttons --> 
        <div style="display:flex; flex-direction:row; justify-content:space-between; width:100%;">
          <v-btn 
            style="width:100px;"
            v-if="currentStep > 1" 
            @click="currentStep--" 
            text 
            color="primary"
          >
            <v-icon left>mdi-chevron-left</v-icon>
            Previous
          </v-btn>
          <v-spacer />
          <v-btn 
            style="width:100px;"
            v-if="currentStep < 3" 
            @click="currentStep++" 
            color="primary"
          >
            Next
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn 
            style="width:250px;"
            v-if="currentStep === 3" 
            @click="onSubmit" 
            color="primary"
            :loading="submitting"
          >
            Submit & Generate Invoice
          </v-btn>
        </div>
        <br/>
        <div class="d-flex" style="gap:16px; flex-wrap:wrap;">
          <div><span class="grey--text">Vehicle:</span> <b>{{ money(lineAmount) }}</b></div>
          <div v-if="accessoriesTotal > 0"><span class="grey--text">Accessories:</span> <b>{{ money(accessoriesTotal) }}</b></div>

          <div v-if="form.billOptions.showGstDetail"><span class="grey--text">Taxable:</span> <b>{{ money(taxableAmount) }}</b></div>
          <div v-if="form.billOptions.showGstDetail"><span class="grey--text">CGST:</span> <b>{{ money(cgstAmount) }}</b></div>
          <div v-if="form.billOptions.showGstDetail"><span class="grey--text">SGST:</span> <b>{{ money(sgstAmount) }}</b></div>

          <!-- Show both totals for SHOWROOM mode -->
          <div v-if="form.billOptions.billPriceMode === 'SHOWROOM'"><span class="grey--text">Showroom Total:</span> <b class="green--text text--darken-2">{{ money(showroomTotal) }}</b></div>
          <div v-if="form.billOptions.billPriceMode === 'SHOWROOM' && (totalRtoCharges > 0 || totalInsuranceCharges > 0)"><span class="grey--text">On-road Total:</span> <b class="blue--text text--darken-2">{{ money(onRoadTotal) }}</b></div>
          
          <!-- For ON_ROAD mode, just show the entered amount -->
          <div v-if="form.billOptions.billPriceMode === 'ON_ROAD'"><span class="grey--text">On-road Total:</span> <b class="green--text text--darken-2">{{ money(onRoadTotal) }}</b></div>

          <div><span class="grey--text">Total Discount:</span> <b class="orange--text text--darken-2">{{ money(totalDiscount) }}</b></div>
          <div><span class="grey--text">Bill Grand Total:</span> <b class="green--text text--darken-2">{{ money(billGrandTotal) }}</b></div>
          <div><span class="grey--text">Paid:</span> <b class="green--text text--darken-2">{{ money(totalPaid) }}</b></div>
          <div><span class="grey--text">Due:</span> <b :class="dueAmount>0 ? 'red--text text--darken-2':'green--text text--darken-2'">{{ money(dueAmount) }}</b></div>
        </div>
    </v-card-actions>

    <v-divider/>

    <v-snackbar v-model="snack.show" :color="snack.color" timeout="2600">{{ snack.text }}</v-snackbar>

    <!-- SOLD dialog -->
    <v-dialog v-model="soldDialog.show" max-width="560">
      <v-card>
        <v-toolbar dense flat color="red" dark>
          <v-toolbar-title><v-icon left>mdi-alert</v-icon> Vehicle Already SOLD</v-toolbar-title>
          <v-spacer/><v-btn icon @click="soldDialog.show=false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>
        <v-card-text class="py-4">
          <div class="mb-2"><b>Chassis:</b> {{ soldDialog.data?.chassisNumber || '—' }}</div>
          <div class="mb-2"><b>Model:</b> {{ soldDialog.data?.modelName || '—' }}</div>
          <div class="mb-2"><b>Category:</b> {{ soldDialog.data?.categoryName || '—' }}</div>
          <div class="mb-2"><b>Color:</b> {{ soldDialog.data?.color || '—' }}</div>
          <div class="mb-2"><b>Engine:</b> {{ soldDialog.data?.engineNumber || '—' }}</div>
          <div class="mb-2"><b>Status:</b> {{ soldDialog.data?.status || '—' }}</div>
          <div class="caption grey--text">Please verify. You cannot sell an already sold vehicle.</div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn color="primary" text @click="soldDialog.show=false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- BILL PREVIEW -->
    <v-dialog v-model="invoiceDialog" max-width="900px" persistent scrollable>
      <v-card style="width:900px; max-width:100%;">
        <v-toolbar flat dense>
          <v-spacer/>
          <v-btn small outlined class="mr-2" :disabled="!canPreview" @click="$refs.gatePass.show(form, selectedChassisInfo, billGrandTotal)">
            <v-icon left small>mdi-file-eye</v-icon> Gate Pass
          </v-btn>
          <v-btn small outlined class="mr-2" @click="downloadPdf"><v-icon left small>mdi-file-pdf-box</v-icon>Download</v-btn>
          <v-btn icon @click="invoiceDialog=false"><v-icon>mdi-close</v-icon></v-btn>
        </v-toolbar>

        <v-card-text>
          <div ref="billArea" class="bill-a4">
            <!-- HEADER -->
            <div class="invoice-header">
              <div class="inv-left">
                <img src="@/assets/newLogoTVS.png" alt="Logo" class="inv-logo"/>
              </div>
              <div class="inv-center">
                <div class="inv-title">BILL INVOICE</div>
                <div class="authorized">Authorised Dealer</div>
                <div class="subline">TVS MOPED, TVS MOTORCYCLE, EV SCOOTER GENUINE SPARE & ACCESSORIES</div>
              </div>
              <div class="inv-right">
                <div class="company-name">ANSARI AUTOMOBILES</div>
                <div class="company-lines">
                  <div>BADI KAMHARIYA BY PASS ROAD, MAU</div>
                  <div class="small">GSTIN/UIN - 09AJBPA4037B1ZY</div>
                  <div class="small">STATE NAME : UTTAR PRADESH</div>
                </div>
              </div>
            </div>

            <!-- META -->
            <div class="meta-row">
              <div>Invoice No.: <b>{{ inv.number }}</b></div>
              <div>Invoice Date: <b>{{ inv.date }}</b></div>
            </div>

            <!-- BILL TO -->
            <div class="addr-wrap">
              <div class="addr">
                <div class="b">Bill To -</div>
                <div>NAME: {{ form.customer.name || '-' }}</div>
                <div v-if="form.owner.relationType || form.owner.relationName">
                  {{ convertRelation(form.owner.relationType) }}  — &nbsp; {{ form.owner.relationName || '-' }}
                </div>
                <div>CURRENT ADD: {{ printableAddress || '-' }}</div>
                <div v-if="form.permanentAddress && (form.permanentAddress.line1 || form.permanentAddress.village || form.permanentAddress.district)">
                  PERMANENT ADD: {{ [
                    form.permanentAddress.line1,
                    form.permanentAddress.line2,
                    form.permanentAddress.village,
                    form.permanentAddress.postOffice,
                    form.permanentAddress.tahsil,
                    form.permanentAddress.district,
                    form.permanentAddress.state,
                    form.permanentAddress.pincode
                  ].filter(Boolean).join(', ') }}
                </div>
                <div v-if="form.customer.phone">MOB: {{ form.customer.phone }}</div>
                <div v-if="form.ids.type && form.ids.value">AADHAAR NUMBER : {{ form.ids.type==='AADHAAR' ? form.ids.value : '-' }}</div>
                <div v-if="form.basic.assignedRtoOffice">ASSIGNED RTO OFFICE DETAIL:- {{ form.basic.assignedRtoOffice }}</div>
              </div>
            </div>

            <!-- NOMINEE STRIP -->
            <div class="nominee-strip">
              <div>
                <div class="cap">NOMINEE NAME</div>
                <div>{{ form.nominee.name || '—' }}</div>
              </div>
              <div>
                <div class="cap">OWNER RELATION</div>
                <div>{{ form.nominee.relation || '—' }}</div>
              </div>
              <div>
                <div class="cap">AGE</div>
                <div>{{ form.nominee.age || '—' }}</div>
              </div>
              <div>
                <div class="cap">MOBILE NUMBER</div>
                <div>{{ form.nominee.mobile || '—' }}</div>
              </div>
            </div>

            <!-- VEHICLE TABLE -->
            <table class="grid">
              <thead>
                <tr>
                  <th>MODEL</th>
                  <th class="c">QTY</th>
                  <th class="r">PRICE</th>
                  <th class="r">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <div>{{ form.model || '-' }}</div>
                    <div class="sub-info">
                      <div>Chassis: {{ form.chassisNumber || '—' }}</div>
                      <div>Engine: {{ selectedChassisInfo?.engineNumber || '—' }}</div>
                      <div>Color: {{ selectedChassisInfo?.color || '—' }}</div>
                    </div>
                  </td>
                  <td class="c">{{ form.qty }}</td>
                  <td class="r">{{ money(unitVehicleExRtoIns) }}</td>
                  <td class="r">{{ money(lineAmount) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- ACCESSORIES -->
            <table v-if="form.accessories.length" class="grid mt-3">
              <thead>
                <tr>
                  <th colspan="2">ACCESSORIES</th>
                  <th class="r">QTY</th>
                  <th class="r">PRICE</th>
                  <th class="r">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="acc in form.accessories" :key="acc.key">
                  <td colspan="2">{{ acc.name || '—' }}</td>
                  <td class="r">{{ acc.qty || 0 }}</td>
                  <td class="r">{{ money(acc.price) }}</td>
                  <td class="r">{{ money(accessoryAmount(acc)) }}</td>
                </tr>
                <tr class="sub-total-row">
                  <td colspan="4" class="r"><b>Total Accessories:</b></td>
                  <td class="r"><b>{{ money(accessoriesTotal) }}</b></td>
                </tr>
              </tbody>
            </table>

            <!-- AMOUNT BLOCK (left: RTO/INS if SHOWROOM, right: totals like image) -->
            <div class="amount-block">
              <div class="charges" v-if="form.billOptions.billPriceMode==='SHOWROOM' && (form.billOptions.showRto || form.billOptions.showInsurance)">
                <div v-if="form.billOptions.showRto"><b>RTO CHARGES:</b> {{ money(form.rtoCharges) }} × {{ form.qty }} = {{ money(totalRtoCharges) }}</div>
                <div v-if="form.billOptions.showInsurance"><b>INSURANCE CHARGES:</b> {{ money(form.insuranceCharges) }} × {{ form.qty }} = {{ money(totalInsuranceCharges) }}</div>
              </div>

              <div class="totals-box">
                <div class="row"><span>Vehicle Amount</span><span class="r">{{ money(displayVehicleAmount) }}</span></div>
                <div v-if="accessoriesTotal>0" class="row"><span>Accessories Amount</span><span class="r">{{ money(accessoriesTotal) }}</span></div>

                <template v-if="form.billOptions.showGstDetail">
                  <div class="row"><span>Taxable Amount</span><span class="r">{{ money(taxableAmount) }}</span></div>
                  <div class="row"><span>CGST ({{ form.cgstPercent }}%)</span><span class="r">{{ money(cgstAmount) }}</span></div>
                  <div class="row"><span>SGST ({{ form.sgstPercent }}%)</span><span class="r">{{ money(sgstAmount) }}</span></div>
                </template>

                <div v-if="form.billOptions.billPriceMode==='SHOWROOM'" class="row">
                  <span>Showroom Total (Vehicle + Accessories + Tax)</span>
                  <span class="r">{{ money(showroomTotal) }}</span>
                </div>
                <div v-if="form.billOptions.billPriceMode==='SHOWROOM' && (totalRtoCharges>0 || totalInsuranceCharges>0)" class="row">
                  <span>On-road Total (Showroom + RTO + Insurance)</span>
                  <span class="r">{{ money(onRoadTotal) }}</span>
                </div>

                <!-- discounts -->
                <div v-if="discountBreakdown.discount>0" class="row disc"><span>Cash Discount</span><span class="r">-{{ money(discountBreakdown.discount) }}</span></div>
                <div v-if="discountBreakdown.offerDiscount>0" class="row disc"><span>Offer Discount</span><span class="r">-{{ money(discountBreakdown.offerDiscount) }}</span></div>
                <div v-if="discountBreakdown.seasonalDiscount>0" class="row disc"><span>Scheme Discount</span><span class="r">-{{ money(discountBreakdown.seasonalDiscount) }}</span></div>
                <div v-if="discountBreakdown.finalSettlement>0" class="row disc"><span>Final Settlement</span><span class="r">-{{ money(discountBreakdown.finalSettlement) }}</span></div>

                <div v-if="hasDiscounts" class="row disc total-disc">
                  <span><b>Total Discount</b></span><span class="r"><b>-{{ money(totalDiscount) }}</b></span>
                </div>

                <div class="row grand">
                  <span>Grand Total ({{ form.billOptions.billPriceMode==='ON_ROAD' ? 'On-road' : 'Showroom' }})</span>
                  <span class="r">{{ money(billGrandTotal) }}</span>
                </div>
                <div class="row paid"><span>Paid</span><span class="r">{{ money(totalPaid) }}</span></div>
                <div class="row due"><span>Due</span><span class="r">{{ money(dueAmount) }}</span></div>
                <div class="row"><span>Amount (in words)</span><span class="r">{{ amountInWords }}</span></div>
              </div>
            </div>

            <!-- PAYMENT TABLE -->
            <table class="grid mt-3" v-if="form.payments.length">
              <thead>
                <tr><th>MODE</th><th>REFERENCE</th><th class="r">AMOUNT</th></tr>
              </thead>
              <tbody>
                <tr v-for="p in form.payments" :key="p.key">
                  <td>{{ p.mode }}</td>
                  <td>{{ p.reference || '—' }}</td>
                  <td class="r">{{ money(p.amount) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- BANK + QR + SIGN -->
            <div class="bank-qr-sign">
              <div class="bank">
                <div style="text-align:center; margin-bottom:12px; font-size:13px;"><b><u>Company's Bank Details</u></b></div>
                <div class="row"><span>A/c Holder's Name :</span><span>Ansari Automobiles</span></div>
                <div class="row"><span>Bank Name :</span><span>Union Bank of India</span></div>
                <div class="row"><span>A/c No. :</span><span>302901010100080</span></div>
                <div class="row"><span>IFSC Code :</span><span>UBIN0530298</span></div>
                <div class="row"><span>Branch :</span><span>MAUNATH BHANJAN</span></div>
              </div>
              <div class="qr">
                <div class="b c">Scan to Pay</div>
                <div class="qr-box"><!-- you can drop your QR img here if you have one --></div>
              </div>
              <div class="sign">
                <div class="b c">For Ansari Automobiles</div>
                <br/>
                <br/>
                <br/>
                <br/>
                <div class="sig-line"></div>
                <div class="c small">Authorised Signatory</div>
              </div>
            </div>

            <!-- ENQUIRY STRIP -->
              <span>Enquery Number: </span>
            <div class="enquiry-strip">
              <div style="font-size:11px;">SALES - 8090086427  | </div>
              <div style="font-size:11px;">RC/HSRP - 8528414311 |</div>
              <div style="font-size:11px;">PARTS - 9648261555 | </div>
              <div style="font-size:11px;">SERVICE - 8090231724/8400630140</div>
            </div>

            <!-- DECLARATION -->
            <div class="declaration">
              <div class="b">Terms and Conditions:-</div>
              <ol>
                <li>***Goods once sold will not be taken back.***</li>
                <li>***All disputed subject to Mau jurisdiction.***</li>
              </ol>
            </div>
          </div>
         
        </v-card-text>
      </v-card>
    </v-dialog>
    <GatePass ref="gatePass" />
  </v-card>
</template>

<script>
import html2pdf from 'html2pdf.js'
import jsPDF from 'jspdf';
import GatePass from './GatePass.vue'
let uid = 1;
let _imgUid = 1;  

export default {
  name: 'QuickInvoiceCustomerPro',
  data () {
    return {
      nomineeImageMaxBytes: 5 * 1024 * 1024, // 5 MB
      accept: ".png,.jpg,.jpeg,.gif,.webp,.pdf",
      multiple: true,
      maxBytes: 10 * 1024 * 1024, // 10 MB per file
      maxFiles: 20,
      uploadEndpoint: (process.env.VUE_APP_API_BASE || "") + "/upload",
      fieldName: "files[]",

      files: [], // internal state
      uploading: false,
      progress: 0,
      currentStep: 1, // Add this for step management
      valid: false,
      submitting: false,
      menus: {
        invDate:false, dob:false, rcApplied:false, regPay:false, hsrpApplied:false,
        rcPrint:false, insFrom:false, insUpto:false, numberPlateDate:false, rcReceivingDate:false
      },
      // search-by-chassis
      searchChassis: '',
      searchLoading: false,
      searchError: '',
      searchedOnce: false,
      soldDialog: { show:false, data:null },
      sameAsCurrent: false,
      // no dropdowns now; just filled by search:
      form: {
        //pk, sk
        pk:'',
        sk:'',
        basic: { invoiceNumber:'', purchaseDate:null, assignedRtoOffice:'' },
        // vehicle (read-only fields populated via search)
        category: '',
        model: '',
        chassisNumber: '',
        vehicleCategory: '',
        qty: 1,
        price: null,              // interpreted by billPriceMode
        rtoCharges: 0,            // per-unit
        insuranceCharges: 0,      // per-unit
        // tax (REVERSED: checkbox now means "GST excluded")
        priceIncludesTax: false,   // true => EXCLUSIVE (add on top); false => INCLUSIVE (back-calc)
        cgstPercent: 9,
        sgstPercent: 9,
        // owner
        owner: { ownershipType:'INDIVIDUAL', careOf:'', dob:null, relationType:'', relationName:'' },
        customer: { // used for invoice/payload
          name:'', email:'', phone:'', altPhone:'',
          address:{ line1:'', line2:'', village:'', postOffice:'', tahsil:'', block:'', pincode:'', district:'', state:'' }
        },
        // firm
        firm: { name:'', gst:'', address:'', extra:[] },
        permanentAddress: { line1:'', line2:'', village:'', postOffice:'', tahsil:'', pincode:'', district:'', state:'' },
        // ID Proof
        ids: { type:'', value:'', custom:[], aadhaar:'', voter:'', pan:'', dl:'' },
        // nominee: { name:'', relation:'', age:'', mobile:'' },
        nominee: {
          name: '',
          relation: '',
          age: null,
          mobile: '',
          // NEW:
          file: null,
          previewUrl: null,
          inputKey: Date.now()
        },
        salesMode:'CASH',
        finance: { company:'', financerName:'', loanAmount:'', disbursementAmount:'', downPayment:'', emi:'', tenureMonths:'', agreementNumber:'' },
        registration: { number:'', rcAppliedDate:null, paymentDate:null, hsrpAppliedDate:null, hsrpCourier:'', rcPrintDate:null },
        insurance: { type:'THIRD PARTY', company:'', policyNo:'', idv:'', validFrom:null, periodYears:'5', validUpto:null },
        receiving: { receiverName:'', mobile:'', numberPlateReceivingDate:null, rcReceivingDate:null, remarks:'' },
        priceStructure: { 
          rtoCharge:0, 
          insuranceCharge:0, 
          hypCharge:0, 
          accessoryCharge:0, 
          otherCharge:0, 
          discount:0, 
          seasonalDiscount: 0,
          offerDiscount:0,
          finalSettlement: 0,
          downPayment:0, 
          offerName:'' 
        },
        payments: [ { key: 'p1', mode: '', reference: '', amount: 0, files: [], previews: [], inputKey: Date.now() } ],
        // due plan
        duePayments: [],
        // bill options (added mode)
        billOptions: { showRto: false, showInsurance: false, showGstDetail: false, billPriceMode: 'ON_ROAD' },
        // accessories
        accessories: []
      },
      idTypes: ['AADHAAR','PAN','VOTER','DL','PASSPORT'],
      ownershipTypes: ['INDIVIDUAL','FIRM'],
      relations: ['Father','Mother','Husband','Wife','Brother','Sister','Son','Daughter','Other'],
      insuranceTypes: ['THIRD PARTY','ZERO DEP','BASIC'],
      financeCompanies: [
        'TVS CREDIT SERVICES LIMITED',
        'HDB FINANCIAL SERVICES LIMITED',
        'MUTHOOT CAPITAL FINANCE LIMITED',
        'BAJAJ FINANCE LIMITED',
        'L&T FINANCE LIMITED',
        'IDFC FIRST BANK',
        'HDFC FINNACE LLIMITED',
        'SHRIRAM FINANCE',
        'PUNJAB NATIONAL BANK',
        'UNION BANK OF INDIA'
      ],
      payModes: [
        { text: 'CASH', value: 'CASH' },
        { text: 'UPI', value: 'UPI' },
        { text: 'CARD', value: 'CARD' },
        { text: 'BANK_TRANSFER', value: 'BANK_TRANSFER' },
        { text: 'CHEQUE', value: 'CHEQUE' },
        { text: 'OTHER', value: 'OTHER' }
      ],
      selectedChassisInfo: {},
      invoiceDialog: false,
      inv: { number: '', date: '' },
      snack: { show: false, text: '', color: 'success' },
      errorSummary: [],
      // validation rules
      rReq: v => !!(v && String(v).trim()) || 'Required',
      rNumPos: v => (!isNaN(Number(v)) && Number(v) > 0) || 'Enter positive number',
      rNumNonNeg: v => (!isNaN(Number(v)) && Number(v) >= 0) || 'Enter valid number',
      rQty: v => (Number(v) >= 1) || 'Min qty = 1',
      rPct: v => (v == null || (!isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100)) || '0–100 only',
      rPhoneInline: v => (/^\d{10}$/.test(String(v || ''))) || 'Enter 10-digit mobile',
      rAltPhoneInline: v => (!v || /^\d{10}$/.test(String(v || ''))) || '10-digit only',
      rPincodeInline: v => (!v || /^\d{6}$/.test(String(v || ''))) || '6-digit PIN only',
      rEmailInline: v => (!v || /\S+@\S+\.\S+/.test(String(v || ''))) || 'Invalid email',
      rNomineeMobileInline: v => (!v || /^\d{10}$/.test(String(v || ''))) || '10-digit only',
      rNameInline: v => (!v || /^[A-Za-z\s]+$/.test(String(v))) || 'Only alphabets allowed',
      rAadhaar: v => (!v || /^\d{12}$/.test(String(v))) || '12-digit Aadhaar',
      rVoter: v => (!v || /^[A-Z]{3}\d{7}$/i.test(String(v))) || 'Invalid Voter ID',
      rPan: v => (!v || /^[A-Z]{5}\d{4}[A-Z]{1}$/i.test(String(v))) || 'Invalid PAN',
      rDL: v => (!v || /^[A-Z0-9-]{5,20}$/i.test(String(v))) || 'Invalid DL',
      rAge: v => (!v || (Number(v)>=1 && Number(v)<=120)) || 'Age 1–120',
      optMoney: v => (v==='' || v===null || (!isNaN(Number(v)) && Number(v)>=0)) || 'Enter ≥ 0',
      optInteger: v => (v==='' || v===null || (/^\d+$/.test(String(v)))) || 'Enter integer',
      optPhone: v => (!v || /^\d{10}$/.test(String(v))) || '10-digit only',
      rGST: v => (!v || /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(String(v))) || 'Invalid GSTIN',
      optNonEmptyIfFilled: other =>
        val => (!val && !other) || (val && String(val).trim().length>0) || 'Required when other filled',
    }
  },
  components:{GatePass},
  computed: {
    hasDiscounts () {
      return this.totalDiscount > 0
    },
    imageItems() {
      return this.files.filter(f => f.type && f.type.startsWith("image/") && f.previewUrl);
    },
    otherItems() {
      return this.files.filter(f => !f.type || !f.type.startsWith("image/"));
    },

    vehiclePriceLabel () {
      return this.form.billOptions.billPriceMode === 'ON_ROAD'
        ? 'Vehicle Price (Per Unit — ON-ROAD, includes RTO & Insurance)'
        : 'Vehicle Price (Per Unit — SHOWROOM, excludes RTO & Insurance)'
    },

    BASE () { return (process.env.VUE_APP_AGENCY_BACKEND_URL || '').replace(/\/$/, '') },
    isSold () { return String(this.selectedChassisInfo.status||'').toUpperCase()==='SOLD' },

    unitVehicleExRtoIns () {
      const entered = Number(this.form.price || 0)
      const rto = Number(this.form.rtoCharges || 0)
      const ins = Number(this.form.insuranceCharges || 0)
      
      if (this.form.billOptions.billPriceMode === 'ON_ROAD') {
        // For ON_ROAD mode: entered price is final, don't add RTO/Insurance
        return entered
      }
      // SHOWROOM: entered is ex-RTO/Ins
      return entered
    },

    
     lineAmount () {
      return Number(this.unitVehicleExRtoIns) * Number(this.form.qty || 1)
    },

    discountBreakdown () {
      return {
        discount: Number(this.form.priceStructure.discount || 0),
        offerDiscount: Number(this.form.priceStructure.offerDiscount || 0),
        seasonalDiscount: Number(this.form.priceStructure.seasonalDiscount || 0),
        finalSettlement: Number(this.form.priceStructure.finalSettlement || 0)
      }
    },


    // Total RTO and Insurance charges
   
    totalRtoCharges () {
      return Number(this.form.rtoCharges || 0) * Number(this.form.qty || 1)
    },

    totalInsuranceCharges () {
      return Number(this.form.insuranceCharges || 0) * Number(this.form.qty || 1)
    },


    accessoriesTotal () { 
      return this.form.accessories.reduce((total, acc) => {
        return total + (Number(acc.qty || 0) * Number(acc.price || 0));
      }, 0);
    },

    // Subtotal (tax base) = vehicle ex-RTO/Ins + accessories
    subtotal () { 
      return Number(this.lineAmount + this.accessoriesTotal);
    },

    taxRate () { return (Number(this.form.cgstPercent || 0) + Number(this.form.sgstPercent || 0)) / 100 },

    // REVERSED GST: checkbox true => EXCLUSIVE (add tax on top)
    isTaxExclusive () { return !!this.form.priceIncludesTax },
    isTaxInclusive () { return !this.form.priceIncludesTax },

    taxableAmount () {
      const s = Number(this.subtotal || 0), tr = this.taxRate
      if (tr > 0 && this.isTaxInclusive) return Number((s / (1 + tr)).toFixed(2))
      return Number(s.toFixed(2))
    },
    cgstAmount () { return Number(((this.taxableAmount * Number(this.form.cgstPercent || 0)) / 100).toFixed(2)) },
    sgstAmount () { return Number(((this.taxableAmount * Number(this.form.sgstPercent || 0)) / 100).toFixed(2)) },

    // Showroom total: tax based on subtotal; RTO/Ins NOT included
    // showroomTotal () { 
    //   return this.isTaxInclusive ? Number(this.subtotal.toFixed(2)) : Number((this.taxableAmount + this.cgstAmount + this.sgstAmount).toFixed(2))
    // },
    showroomTotal () { 
    const taxInclusiveTotal = this.isTaxInclusive ? 
      Number(this.subtotal.toFixed(2)) : 
      Number((this.taxableAmount + this.cgstAmount + this.sgstAmount).toFixed(2))
    
    // For SHOWROOM mode, showroom total is just the tax calculated amount
    return taxInclusiveTotal
  },

    // On-road total = showroom total + (RTO + Insurance) * qty? RTO/Ins are per unit, so multiply by qty
    onRoadTotal () {
      if (this.form.billOptions.billPriceMode === 'ON_ROAD') {
        // For ON_ROAD mode: entered price already includes everything
        return Number(this.form.price || 0) * Number(this.form.qty || 1)
      } else {
        // For SHOWROOM mode: showroom total + RTO + Insurance
        const perUnitCharges = Number(this.form.rtoCharges || 0) + Number(this.form.insuranceCharges || 0)
        const totalCharges = perUnitCharges * Number(this.form.qty || 1)
        return Number((this.showroomTotal + totalCharges).toFixed(2))
      }
    },


    // Total discount calculation
    totalDiscount () {
      return Number(
        (Number(this.form.priceStructure.discount || 0) +
         Number(this.form.priceStructure.offerDiscount || 0) +
         Number(this.form.priceStructure.seasonalDiscount || 0) +
         Number(this.form.priceStructure.finalSettlement || 0)).toFixed(2)
      )
    },

    // Vehicle amount to show inside the tax-box row (keep clarity)
    displayVehicleAmount () {
      return this.lineAmount
    },

    // What should appear as GRAND TOTAL in the bill (after discounts)
    
    billGrandTotal () {
      let baseTotal
      
      if (this.form.billOptions.billPriceMode === 'ON_ROAD') {
        // ON_ROAD: Use the entered price directly (already includes RTO/Insurance)
        baseTotal = Number(this.form.price || 0) * Number(this.form.qty || 1)
      } else {
        // SHOWROOM: Use showroom total (vehicle + accessories + tax)
        baseTotal = this.showroomTotal
      }
      
      return Number(Math.max(0, (baseTotal - this.totalDiscount)).toFixed(2))
    },

    totalPaid () { return Number(this.form.payments.reduce((s, p) => s + Number(p.amount || 0), 0).toFixed(2)) },
    dueAmount () { return Number(Math.max(0, (this.billGrandTotal - this.totalPaid)).toFixed(2)) },
    totalPlannedDue () { return Number(this.form.duePayments.reduce((s,d)=>s+Number(d.amount||0),0).toFixed(2)) },
    canPreview () {
      const ownerName = this.form.owner.ownershipType==='FIRM' ? this.form.firm.name : this.form.customer.name
      return !!(this.form.chassisNumber && this.form.model && this.form.category && ownerName && this.form.price != null && this.form.qty >= 1)
    },
    printableAddress () {
      const a = this.form.customer.address || {}
      return [a.line1, a.line2, a.village, a.postOffice, a.tahsil, a.block, a.district, a.state, a.pincode]
        .map(x => (x && String(x).trim()) || '').filter(Boolean).join(', ')
    },
    amountInWords () { return this.numberToWordsIndian(this.billGrandTotal || 0) },

    // ====== ID Proof helpers (length & input constraints) ======
    idMaxLength () {
      const t = this.form.ids.type
      if (t === 'AADHAAR') return 12
      if (t === 'PAN') return 10
      if (t === 'VOTER') return 10  // e.g., ABC1234567
      if (t === 'DL') return 20
      if (t === 'PASSPORT') return 8
      return 32
    },
    idNumericOnly () {
      return this.form.ids.type === 'AADHAAR'
    },
    idInputLabel () {
      return `Enter ${this.form.ids.type || 'ID Number'}`
    }
  },

  watch: {
    // Keep visibility of RTO/Insurance aligned with mode.
    'form.billOptions.billPriceMode'(val) {
      if (val === 'ON_ROAD') {
        // hide the rows in bill
        this.form.billOptions.showRto = false
        this.form.billOptions.showInsurance = false
      } else {
        // default to showing; user can still uncheck
        this.form.billOptions.showRto = true
        this.form.billOptions.showInsurance = true
      }
    },

    // When ID type changes, clear value (requirement #6/7)
    'form.ids.type' () {
      this.form.ids.value = ''
    }
  },
  beforeDestroy() {
    for (const f of this.files) {
      if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
    }
    (this.form.payments || []).forEach(this.revokeRowPreviews);
  },

  methods: {

    //nominee

    onNomineeFileChange(fileOrFiles) {
      // v-file-input passes a single File when multiple is NOT set
      const f = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
      if (!f) { this.clearNomineeImage(); return; }

      // type/size checks
      if (!f.type || !f.type.startsWith('image/')) {
        this.$nextTick(() => this.clearNomineeImage());
        this.$toast ? this.$toast.error('Please choose an image file.') : alert('Please choose an image file.');
        return;
      }
      if (f.size > this.nomineeImageMaxBytes) {
        this.$nextTick(() => this.clearNomineeImage());
        const max = this.formatSize(this.nomineeImageMaxBytes);
        this.$toast ? this.$toast.error(`Max size ${max}`) : alert(`Max size ${max}`);
        return;
      }

      // cleanup old preview
      if (this.form.nominee.previewUrl) {
        URL.revokeObjectURL(this.form.nominee.previewUrl);
      }

      // set new
      this.form.nominee.file = f;
      this.form.nominee.previewUrl = URL.createObjectURL(f);

      // reset v-file-input so same file can be reselected later
      this.form.nominee.inputKey = Date.now() + Math.random();
    },

    clearNomineeImage() {
      if (this.form.nominee.previewUrl) {
        URL.revokeObjectURL(this.form.nominee.previewUrl);
      }
      this.form.nominee.file = null;
      this.form.nominee.previewUrl = null;
      this.form.nominee.inputKey = Date.now() + Math.random();
    },

    formatSize(bytes) {
      if (!bytes) return '0 B';
      if (bytes < 1024) return `${bytes} B`;
      const kb = bytes / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      return `${(kb / 1024).toFixed(2)} MB`;
    },

    // If you submit with FormData:
    appendNomineeToFormData(fd) {
      // append other nominee fields as you do already…
      fd.append('nominee[name]', this.form.nominee.name || '');
      fd.append('nominee[relation]', this.form.nominee.relation || '');
      fd.append('nominee[age]', this.form.nominee.age != null ? this.form.nominee.age : '');
      fd.append('nominee[mobile]', this.form.nominee.mobile || '');
      // append image if present
      if (this.form.nominee.file) {
        fd.append('nomineeImage', this.form.nominee.file, this.form.nominee.file.name);
      }
      return fd;
    },

    onFilesChange(e) {
      const list = Array.from(e.target.files || []);
      if (!list.length) return;

      if (this.maxFiles && (this.files.length + list.length) > this.maxFiles) {
        alert(`You can upload up to ${this.maxFiles} files.`);
        const allowed = this.maxFiles - this.files.length;
        list.splice(allowed);
      }

      const next = [];
      for (const f of list) {
        if (this.maxBytes && f.size > this.maxBytes) {
          alert(`"${f.name}" is too large. Max ${this.formatSize(this.maxBytes)}.`);
          continue;
        }
        const item = {
          id: uid++,
          file: f,
          name: f.name,
          size: f.size,
          type: f.type,
          previewUrl: f.type && f.type.startsWith("image/")
            ? URL.createObjectURL(f)
            : null
        };
        next.push(item);
      }

      this.files = this.files.concat(next);
      this.resetNativeInput();
    },

    removeFile(id) {
      const idx = this.files.findIndex(f => f.id === id);
      if (idx === -1) return;
      const [removed] = this.files.splice(idx, 1);
      if (removed && removed.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      this.resetNativeInput();
    },

    clearAll() {
      for (const f of this.files) {
        if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
      }
      this.files = [];
      this.progress = 0;
      this.uploading = false;
      this.resetNativeInput();
    },

    resetNativeInput() {
      const el = this.$refs.fileInput;
      if (el) el.value = "";
    },

    async uploadAll() {
      if (!this.files.length) return;

      const form = new FormData();
      for (const f of this.files) form.append(this.fieldName, f.file, f.name);

      this.uploading = true;
      this.progress = 0;

      try {
        const res = await axios.post(this.uploadEndpoint, form, {
          onUploadProgress: e => {
            if (e.total) this.progress = Math.round((e.loaded / e.total) * 100);
          }
        });
        alert("Upload successful!");
        console.log("Response:", res.data);
      } catch (err) {
        console.error(err);
        alert("Upload failed.");
      } finally {
        this.uploading = false;
      }
    },

    formatSize(bytes) {
      if (bytes < 1024) return `${bytes} B`;
      const kb = bytes / 1024;
      if (kb < 1024) return `${kb.toFixed(1)} KB`;
      const mb = kb / 1024;
      return `${mb.toFixed(2)} MB`;
    },

    convertRelation(relation, personGender = null) {
    /**
     * Convert relationship to abbreviated format (S/O, D/O, W/O, etc.)
     * 
     * @param {string} relation - The relationship to convert (e.g., 'father', 'mother', 'husband')
     * @param {string} personGender - Optional: Gender of the person ('male', 'female')
     * @returns {string} Abbreviated relationship format
     */
    relation = relation.toLowerCase().trim();
    
    const conversionMap = {
        'father': 'S/O',
        'mother': 'S/O', // or D/O depending on person's gender
        'husband': 'W/O',
        'wife': 'H/O',
        'son': 'F/O',
        'daughter': 'F/O',
        'spouse': 'S/O'
    };
    
    // Handle mother case based on person's gender
    if (relation === 'mother') {
        if (personGender && personGender.toLowerCase() === 'female') {
            return 'D/O';
        } else {
            return 'S/O';
        }
    }
    
    return conversionMap[relation] || relation.toUpperCase() + '/O';
},
    money (v) {
      const n = Number(v || 0)
      return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:2 }).format(n)
    },
    
    // Accessory methods
    addAccessory () {
      this.form.accessories.push({ 
        key: Date.now() + Math.random(), 
        name: '', 
        qty: 1, 
        price: 0 
      })
    },
    removeAccessory (index) {
      this.form.accessories.splice(index, 1)
    },
    accessoryAmount (acc) {
      return Number(acc.qty || 0) * Number(acc.price || 0)
    },
    
    async doSearchChassis () {
      this.searchError = '';
      this.searchedOnce = true;
      this.searchLoading = true;
      try {
        const url = `${this.BASE}/getInventoryByChassis?query=${encodeURIComponent(this.searchChassis)}`;
        const r = await fetch(url);
        const data = await r.json().catch(() => null);
        if (!r.ok || !data || !Array.isArray(data.items) || !data.items.length) {
          throw new Error(`No vehicle found for chassis ${this.searchChassis}`);
        }
        const it = data.items[0];
        // Fill details from backend
        this.form.pk = it.pk || '';
        this.form.sk = it.sk || '';
        this.form.category = it.categoryName || '';
        this.form.model = it.modelName || '';
        this.form.chassisNumber = it.chassisNumber || this.searchChassis;
        this.selectedChassisInfo = {
          engineNumber: it.engineNumber || '',
          color: it.color || '',
          status: it.status || ''
        };
        this.form.vehicleCategory = it.categoryName || '';
        // Optional prefill
        this.form.price = this.form.price || 0;
        this.form.rtoCharges = this.form.rtoCharges || 0;
        this.form.insuranceCharges = this.form.insuranceCharges || 0;
        if (String(it.status || '').toUpperCase() === 'SOLD') {
          this.soldDialog = { show: true, data: it };
        }
      } catch (e) {
        this.searchError = e.message || 'Search failed';
      } finally {
        this.searchLoading = false;
      }
    },
    
    clearVehicle () {
      this.searchChassis = '';
      this.searchError = '';
      this.searchedOnce = false;
      this.selectedChassisInfo = {};

      // Clear vehicle fields
      this.form.category = '';
      this.form.model = '';
      this.form.chassisNumber = '';
      this.form.vehicleCategory = '';
      this.form.price = null;
      this.form.qty = 1;
      this.form.rtoCharges = 0;
      this.form.insuranceCharges = 0;
    },
    
    // address helper
    copyCurrentToPermanent () { if (this.sameAsCurrent) this.form.permanentAddress = { ...this.form.customer.address } },
    // firm custom fields
    addFirmKV () { this.form.firm.extra.push({ key: Date.now(), k:'', v:'' }) },
    removeFirmKV (i) { this.form.firm.extra.splice(i,1) },
    // ID custom KV
    addIdKV () { this.form.ids.custom.push({ key: Date.now(), k:'', v:'' }) },
    removeIdKV (i) { this.form.ids.custom.splice(i,1) },
    onPaymentFilesChange(idx, payload) {
      const row = this.form.payments[idx];
      if (!row) return;

      // Normalize to an array of File
      let files = [];
      if (payload instanceof File) {
        files = [payload];
      } else if (Array.isArray(payload)) {
        files = payload;
      } else if (payload && payload.target && payload.target.files) {
        files = Array.from(payload.target.files);
      } else if (payload && payload.length !== undefined) {
        // some Vuetify builds pass a FileList-like object
        files = Array.from(payload);
      } else {
        files = [];
      }

      // Helper: image check (handles empty type)
      const isImage = (f) => {
        if (f.type && f.type.startsWith('image/')) return true;
        const name = (f.name || '').toLowerCase();
        return /\.(png|jpe?g|gif|webp|bmp|heic|heif|tiff?)$/.test(name);
      };

      for (const f of files) {
        if (!(f instanceof File)) continue;
        if (!isImage(f)) continue;

        row.files.push(f);

        const url = URL.createObjectURL(f);
        row.previews.push({
          id: `img_${_imgUid++}`,
          url,
          name: f.name,
          size: f.size,
          type: f.type || 'image/*'
        });
      }

      // reset input so same file can be picked again
      row.inputKey = Date.now() + Math.random();
    },

    removePaymentImage(idx, imgId) {
      const row = this.form.payments[idx];
      if (!row) return;

      const pvIdx = row.previews.findIndex(p => p.id === imgId);
      if (pvIdx === -1) return;

      const [pv] = row.previews.splice(pvIdx, 1);
      if (pv && pv.url) URL.revokeObjectURL(pv.url);

      // remove matching File (by name+size) if present
      const fIdx = row.files.findIndex(f => f && f.name === pv.name && f.size === pv.size);
      if (fIdx !== -1) row.files.splice(fIdx, 1);

      // reset the per-row file input so the same file can be picked again
      row.inputKey = Date.now() + Math.random();
    },


    revokeRowPreviews(row) {
      if (!row?.previews) return;
      for (const p of row.previews) {
        if (p.url) URL.revokeObjectURL(p.url);
      }
      row.previews = [];
    },

    // --- YOUR EXISTING ROW ADD/REMOVE, extended to initialize/cleanup images ---
    addPaymentRow() {
      const n = this.form.payments.length + 1;
      this.form.payments.push({
        key: `p${Date.now()}_${n}`,
        mode: '',
        reference: '',
        amount: 0,
        files: [],
        previews: [],
        inputKey: Date.now() + Math.random()
      });
    },

    removePaymentRow(idx) {
      if (this.form.payments.length === 1) return;
      const row = this.form.payments[idx];
      this.revokeRowPreviews(row);
      this.form.payments.splice(idx, 1);
    },

    async buildPaymentsFormData(fd) {
      // call this when constructing your payload
      // append basic fields
      fd.append('payments', JSON.stringify(
        this.form.payments.map(({ files, previews, inputKey, ...rest }) => rest)
      ));

      // append images per row with a conventional naming
      this.form.payments.forEach((row, i) => {
        row.files.forEach((f, j) => {
          fd.append(`paymentImages[${i}][]`, f, f.name);
          // or fd.append(`payments[${i}][images][${j}]`, f, f.name)
        });
      });

      return fd;
    },

    // due plan
    addDueRow () { this.form.duePayments.push({ key: Date.now(), date:null, amount:0, note:'', menu:false }) },
    removeDueRow (i) { this.form.duePayments.splice(i,1) },

    // ID type validator (hard limits)
    validateIdByType (v) {
      const t = this.form.ids.type
      if (!t && !v) return true
      const s = String(v || '')
      const m = {
        AADHAAR: /^\d{12}$/,
        PAN: /^[A-Z]{5}\d{4}[A-Z]{1}$/i,
        VOTER: /^[A-Z]{3}\d{7}$/i,
        DL: /^[A-Z0-9-]{5,20}$/i,
        PASSPORT: /^[A-PR-WYa-pr-wy][1-9]\d{6}$/
      }
      return (m[t] ? m[t].test(s) : !!s) || `Invalid ${t} number`
    },

    // Coerce ID input per type (numeric-only + length clamp where needed)
    coerceIdValue (e) {
      let val = String(e?.target?.value ?? this.form.ids.value ?? '')
      if (this.idNumericOnly) val = val.replace(/\D/g, '')
      if (this.idMaxLength > 0) val = val.slice(0, this.idMaxLength)
      this.form.ids.value = val
    },

    // ===== DIGIT-ONLY ENFORCERS (hard limits) =====
    onlyDigits (e) {
      if (!/[0-9]/.test(e.key)) e.preventDefault()
    },
    restrictCustomerMobileInput (e) {
      const v = (e?.target?.value || '').replace(/\D/g, '').slice(0, 10)
      e.target.value = v
      this.$set(this.form.customer, 'phone', v)
    },
    restrictNomineeMobileInput (e) {
      const v = (e?.target?.value || '').replace(/\D/g, '').slice(0, 10)
      e.target.value = v
      this.$set(this.form.nominee, 'mobile', v)
    },
    restrictReceiverMobileInput (e) {
      const v = (e?.target?.value || '').replace(/\D/g, '').slice(0, 10)
      e.target.value = v
      this.$set(this.form.receiving, 'mobile', v)
    },
    restrictPincodeInput (e, section = 'customer') {
      const v = (e?.target?.value || '').replace(/\D/g, '').slice(0, 6)
      e.target.value = v
      if (section === 'customer') {
        this.$set(this.form.customer.address, 'pincode', v)
      } else {
        this.$set(this.form.permanentAddress, 'pincode', v)
      }
    },

    // validate all
    validateAll () {
      const errors = []
      if (!this.form.chassisNumber) errors.push('Chassis number is required (search to fill).')
      if (!this.form.model) errors.push('Model is required (comes from search).')
      if (!this.form.category) errors.push('Category is required (comes from search).')

      if (this.form.owner.ownershipType==='FIRM') {
        if (!this.form.firm.name?.trim()) errors.push('Firm name is required for ownership type Firm.')
        if (!this.form.firm.address?.trim()) errors.push('Firm address is required for ownership type Firm.')
        if (this.form.firm.gst && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i.test(this.form.firm.gst)) {
          errors.push('GSTIN format looks invalid.')
        }
      } else {
        if (!this.form.customer.name?.trim()) errors.push('Owner name is required.')
      }

      if (this.form.price == null || isNaN(Number(this.form.price)) || Number(this.form.price) <= 0) errors.push('Vehicle price must be a positive number.')
      if (this.form.qty == null || isNaN(Number(this.form.qty)) || Number(this.form.qty) < 1) errors.push('Quantity must be at least 1.')

      const phone = String(this.form.customer.phone || '').trim()
      if (!/^\d{10}$/.test(phone)) errors.push('Phone must be exactly 10 digits.')

      const alt = String(this.form.customer.altPhone || '').trim()
      if (alt && !/^\d{10}$/.test(alt)) errors.push('Alternate phone must be empty or exactly 10 digits.')

      const pin = String(this.form.customer.address.pincode || '').trim()
      if (pin && !/^\d{6}$/.test(pin)) errors.push('PIN code must be 6 digits if provided.')

      const permPin = String(this.form.permanentAddress.pincode || '').trim()
      if (permPin && !/^\d{6}$/.test(permPin)) errors.push('Permanent PIN code must be 6 digits if provided.')

      const email = String(this.form.customer.email || '').trim()
      if (email && !/\S+@\S+\.\S+/.test(email)) errors.push('Email looks invalid.')

      const nomMobile = String(this.form.nominee.mobile || '').trim()
      if (nomMobile && !/^\d{10}$/.test(nomMobile)) errors.push('Nominee mobile must be 10 digits.')

      if (this.form.ids.type || this.form.ids.value) {
        const ok = this.validateIdByType(this.form.ids.value) === true
        if (!ok) errors.push(`Please enter a valid ${this.form.ids.type} number.`)
      }

      for (let i = 0; i < this.form.payments.length; i++) {
        const p = this.form.payments[i]
        if (p.amount == null || isNaN(Number(p.amount)) || Number(p.amount) < 0) errors.push(`Payment row ${i+1}: amount must be 0 or more.`)
        if (!p.mode) errors.push(`Payment row ${i+1}: select a payment mode.`)
      }

      // Validate accessories
      this.form.accessories.forEach((acc, i) => {
        if (acc.name && (!acc.qty || acc.qty < 0)) errors.push(`Accessory ${i+1}: quantity must be 0 or more.`)
        if (acc.name && (!acc.price || acc.price < 0)) errors.push(`Accessory ${i+1}: price must be 0 or more.`)
      })

      // planned dues optional but must be valid if filled
      this.form.duePayments.forEach((d, i) => {
        if (d.amount != null && (isNaN(Number(d.amount)) || Number(d.amount) < 0)) errors.push(`Due row ${i+1}: amount must be ≥ 0.`)
      })

      this.errorSummary = errors
      return errors.length === 0
    },

    async onSubmit () {
      const ok = this.validateAll()
      const vuetifyOk = this.$refs.form.validate()
      if (!ok || !vuetifyOk) {
        this.snack = { show: true, color: 'error', text: 'Please fix highlighted errors' }
        return
      }
      await this.submit()
    },

    async submit () {
      this.submitting = true;

      // --- helpers --------------------------------------------------------------
      const generateBillNumber = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let out = '';
        for (let i = 0; i < 12; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
        return out;
      };
      const pad = n => String(n).padStart(2, '0');
      const formatDateDDMMYYYY = (d) => `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;

      try {
        const now = new Date();
        const billNumber = generateBillNumber();

        // ----------------------- INVENTORY PAYLOAD ------------------------------
        const inventoryPayload = {
          chassisNumbers: [this.form.chassisNumber],
          pk: this.form.pk,
          sk: this.form.sk,
          item: {
            statusType: 'SOLD',
            soldType: 'CUSTOMER',
            soldAt: now.toISOString(),
            category: this.form.category,
            model: this.form.model,
            qty: Number(this.form.qty || 1),
            // save the ex-RTO/Ins unit price as the inventory price
            price: Number(this.unitVehicleExRtoIns || 0),
            rtoCharges: Number(this.form.rtoCharges || 0),
            insuranceCharges: Number(this.form.insuranceCharges || 0),
            accessories: (this.form.accessories || [])
              .filter(acc => acc?.name && Number(acc?.qty) > 0 && Number(acc?.price) > 0)
              .map(acc => ({
                name: acc.name,
                qty: Number(acc.qty || 0),
                price: Number(acc.price || 0),
                amount: Number(acc.qty || 0) * Number(acc.price || 0)
              })),
            tax: {
              priceIncludesTaxExclusive: !!this.form.priceIncludesTax,
              cgstPercent: Number(this.form.cgstPercent || 0),
              sgstPercent: Number(this.form.sgstPercent || 0),
              taxableAmount: Number(this.taxableAmount || 0),
              cgstAmount: Number(this.cgstAmount || 0),
              sgstAmount: Number(this.sgstAmount || 0),
              showroomTotal: Number(this.showroomTotal || 0),
              onRoadTotal: Number(this.onRoadTotal || 0),
              billGrandTotal: Number(this.billGrandTotal || 0),
              billPriceMode: this.form?.billOptions?.billPriceMode || null
            },
            totals: {
              totalAmount: Number(this.billGrandTotal || 0),
              totalPaid: Number(this.totalPaid || 0),
              due: Number(this.dueAmount || 0),
              totalDiscount: Number(this.totalDiscount || 0),
              discount: Number(this.form?.priceStructure?.discount || 0),
              offerDiscount: Number(this.form?.priceStructure?.offerDiscount || 0),
              seasonalDiscount: Number(this.form?.priceStructure?.seasonalDiscount || 0),
              finalSettlement: Number(this.form?.priceStructure?.finalSettlement || 0)
            },
            payments: (this.form.payments || []).map(p => ({
              mode: p.mode,
              reference: p.reference || null,
              amount: Number(p.amount || 0)
            })),
            duePlan: (this.form.duePayments || []).map(d => ({
              date: d?.date || null,
              amount: Number(d?.amount || 0),
              note: d?.note || null
            })),
            customer: {
              name: this.form.owner?.ownershipType === 'FIRM' ? this.form.firm?.name : this.form.customer?.name,
              email: this.form.customer?.email || null,
              phone: this.form.customer?.phone,
              altPhone: this.form.customer?.altPhone || null,
              address: { ...(this.form.customer?.address || {}) },
              relationType: this.form.owner?.relationType || null,
              relationName: this.form.owner?.relationName || null
            },
            nominee: { ...(this.form.nominee || {}) },
            ownerType: this.form.owner?.ownershipType,
            firm: this.form.owner?.ownershipType === 'FIRM' ? { ...(this.form.firm || {}) } : null,
            idProof: {
              type: this.form.ids?.type || null,
              value: this.form.ids?.value || null,
              custom: (this.form.ids?.custom || [])
                .filter(x => x?.k && x?.v)
                .map(x => ({ key: x.k, value: x.v }))
            }
          }
        };

        // --------------------- CUSTOMER INVOICE PAYLOAD -------------------------
        const invoiceNumber = this.inv?.number || billNumber;
        const invoiceDate = this.inv?.date || formatDateDDMMYYYY(now);

        const customerInvoicePayload = {
          // references
          billNumber,                 // generated
          invoiceNumber,              // use existing or generated
          invoiceDate,                // use existing or today
          inventoryUpdateRef: null,   // will fill after inventory update if needed
          billRef: null,              // (kept for compatibility; set later if you have bill API)

          // customer & ownership
          customer: {
            name: this.form.owner?.ownershipType === 'FIRM' ? this.form.firm?.name : this.form.customer?.name,
            email: this.form.customer?.email || null,
            phone: this.form.customer?.phone,
            altPhone: this.form.customer?.altPhone || null,
            address: { ...(this.form.customer?.address || {}) },
            relationType: this.form.owner?.relationType || null,
            relationName: this.form.owner?.relationName || null
          },
          nominee: { ...(this.form.nominee || {}) },
          ownerType: this.form.owner?.ownershipType,
          firm: this.form.owner?.ownershipType === 'FIRM' ? { ...(this.form.firm || {}) } : null,
          idProof: {
            type: this.form.ids?.type || null,
            value: this.form.ids?.value || null,
            custom: (this.form.ids?.custom || [])
              .filter(x => x?.k && x?.v)
              .map(x => ({ key: x.k, value: x.v }))
          },

          // vehicle & item
          vehicle: {
            category: this.form.category,
            model: this.form.model,
            qty: Number(this.form.qty || 1),
            chassisNumber: this.form.chassisNumber,
            engineNumber: this.selectedChassisInfo?.engineNumber || null,
            color: this.selectedChassisInfo?.color || null,
            unitPriceExRtoIns: Number(this.unitVehicleExRtoIns || 0),
            lineAmount: Number(this.lineAmount || 0)
          },

          // accessories
          accessories: (this.form.accessories || [])
            .filter(acc => acc?.name && Number(acc?.qty) > 0 && Number(acc?.price) > 0)
            .map(acc => ({
              name: acc.name,
              qty: Number(acc.qty || 0),
              price: Number(acc.price || 0),
              amount: Number(acc.qty || 0) * Number(acc.price || 0)
            })),

          // charges & tax
          charges: {
            rtoCharges: Number(this.form.rtoCharges || 0),
            insuranceCharges: Number(this.form.insuranceCharges || 0),
            totalRtoCharges: Number(this.totalRtoCharges || 0),
            totalInsuranceCharges: Number(this.totalInsuranceCharges || 0)
          },
          tax: {
            priceIncludesTaxExclusive: !!this.form.priceIncludesTax,
            cgstPercent: Number(this.form.cgstPercent || 0),
            sgstPercent: Number(this.form.sgstPercent || 0),
            taxableAmount: Number(this.taxableAmount || 0),
            cgstAmount: Number(this.cgstAmount || 0),
            sgstAmount: Number(this.sgstAmount || 0),
            showroomTotal: Number(this.showroomTotal || 0),
            onRoadTotal: Number(this.onRoadTotal || 0),
            billGrandTotal: Number(this.billGrandTotal || 0),
            billPriceMode: this.form?.billOptions?.billPriceMode || null
          },

          // totals, payments, dues
          totals: {
            totalAmount: Number(this.billGrandTotal || 0),
            totalPaid: Number(this.totalPaid || 0),
            due: Number(this.dueAmount || 0),
            totalDiscount: Number(this.totalDiscount || 0),
            discount: Number(this.form?.priceStructure?.discount || 0),
            offerDiscount: Number(this.form?.priceStructure?.offerDiscount || 0),
            seasonalDiscount: Number(this.form?.priceStructure?.seasonalDiscount || 0),
            finalSettlement: Number(this.form?.priceStructure?.finalSettlement || 0)
          },
          payments: (this.form.payments || []).map(p => ({
            mode: p.mode,
            reference: p.reference || null,
            amount: Number(p.amount || 0)
          })),
          duePlan: (this.form.duePayments || []).map(d => ({
            date: d?.date || null,
            amount: Number(d?.amount || 0),
            note: d?.note || null
          })),

          // bill options & meta
          billOptions: { ...(this.form.billOptions || {}) },
          meta: {
            createdAt: now.toISOString(),
            createdBy: (this.$store?.state?.user?.email) || null
          },

          // raw form snapshot (optional)
          rawForm: { ...(this.form || {}) }
        };

        // ------------------------ 1) SAVE CUSTOMER INVOICE ----------------------
        const custInvResp = await fetch(`${this.BASE}/customerInvoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerInvoicePayload)
        });

        const custInvData = await custInvResp.json().catch(() => ({}));

        if (!custInvResp.ok) {
          // warn and proceed to open invoice (keep your behavior)
          this.$emit('notify', { text: custInvData?.message || `Customer invoice save failed (HTTP ${custInvResp.status})`, color: 'warning' });
          this.openInvoice();
          return; // stop here; don't try inventory update if invoice failed
        }

        // reflect generated bill number to local state if it wasn't set
        if (custInvData?.billNumber && !this.inv?.number) this.inv.number = custInvData.billNumber;

        // ------------------------ 2) UPDATE INVENTORY (SOLD) --------------------
        
        const payload = {
          "chassisNumbers" : [this.form.chassisNumber],
          "item" : {"status": "SOLD"}
        };

        const invResp = await fetch(`${this.BASE}/updateInventoryItem`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const invData = await invResp.json().catch(() => ({}));

        if (!invResp.ok) {
          throw new Error(invData?.message || `Inventory update failed (HTTP ${invResp.status})`);
        }

        // success notifications
        this.snack = { show: true, color: 'success', text: invData?.message || 'Inventory updated (marked SOLD)' };
        this.$emit('notify', { text: custInvData?.message || 'Customer invoice saved', color: 'success' });

        // open invoice (existing behavior)
        this.openInvoice();

      } catch (e) {
        this.snack = { show: true, color: 'error', text: e?.message || 'Failed to save' };
      } finally {
        this.submitting = false;
      }
    },

    openInvoice () {
      if (!this.canPreview) return
      const d = new Date(), pad = n => String(n).padStart(2, '0')
      this.inv.number = this.form.chassisNumber || `INV-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}`
      this.inv.date = `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`
      this.invoiceDialog = true
    },

    async downloadPdf () {
      if (!this.$refs.billArea) return
      const opt = {
        margin: [8, 8, 8, 8],
        filename: `Invoice_${this.inv.number || 'NA'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      }
      await html2pdf().set(opt).from(this.$refs.billArea).save()
    },

    // helpers
    numberToWordsIndian (amount) {
      if (isNaN(amount)) return ''
      const n = Number(amount).toFixed(2)
      const [intPart, decPart] = String(n).split('.')
      const intNum = parseInt(intPart, 10)
      const paiseNum = parseInt(decPart.padEnd(2,'0').slice(0,2), 10)
      if (intNum === 0 && paiseNum === 0) return 'Zero Rupees'
      const ones = ['', 'One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen']
      const tens = ['', '', 'Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety']
      const two = (num)=>{ num=Number(num); if(num<20) return ones[num]; const t=Math.floor(num/10),o=num%10; return tens[t]+(o?' '+ones[o]:'') }
      const three = (num)=>{ num=Number(num); let out=''; const h=Math.floor(num/100),rem=num%100; if(h) out+=ones[h]+' Hundred'; if(rem) out+=(out?' ':'')+two(rem); return out }
      const crore=Math.floor(intNum/10000000), lakh=Math.floor((intNum%10000000)/100000), thousand=Math.floor((intNum%100000)/1000), hundred=intNum%1000
      const parts=[]; if(crore) parts.push(three(crore)+' Crore'); if(lakh) parts.push(two(lakh)+' Lakh'); if(thousand) parts.push(two(thousand)+' Thousand'); if(hundred) parts.push(three(hundred))
      let res = (parts.filter(Boolean).join(' ') || '').trim(); res += res ? (intNum>1?' Rupees':' Rupee') : ''
      if(!res && intNum===0) res='Zero Rupees'
      if(paiseNum){ res += (res?' and ':'') + two(paiseNum) + ' Paise' }
      return res.trim()
    }
  }
}
</script>

<style scoped>
/* nominee*/
.nominee-thumb {
  position: relative;
  display: grid;
  grid-template-columns: 120px 1fr;
  gap: 10px;
  align-items: center;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  padding: 8px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.nominee-thumb img {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: 8px;
}
.nominee-thumb .thumb-meta .name {
  font-size: 12px; font-weight: 600;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.nominee-thumb .thumb-meta .size { font-size: 11px; color: #666; margin-top: 2px; }
.nominee-thumb .remove {
  position: absolute; top: 6px; right: 6px;
  background: #ff4d4f; color: #fff; border-radius: 14px;
}

/* ************************/
.uploader {
  border: 1px dashed #d6d6d6;
  padding: 12px;
  border-radius: 10px;
  background: #fafafa;
}

/* File choose button */
.choose-file {
  display: inline-block;
  position: relative;
}
.choose-file input[type="file"] {
  position: absolute;
  inset: 0;
  opacity: 0;
  width: 100%;
  cursor: pointer;
}
.btn {
  display: inline-block;
  padding: 8px 14px;
  border-radius: 8px;
  background: #0d6efd;
  color: #fff;
  font-weight: 600;
  border: none;
  cursor: pointer;
  user-select: none;
}
.btn:hover { filter: brightness(0.95); }
.btn.ghost {
  background: transparent;
  color: #333;
  border: 1px solid #d0d0d0;
}
.btn.primary { background: #0d6efd; color: #fff; }
.btn.small { padding: 6px 10px; font-weight: 500; }

/* Files area */
.files-wrap { margin-top: 12px; }
.list-head {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 10px;
}
.actions .btn + .btn { margin-left: 8px; }

/* Thumbnails grid */
.thumbs {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 10px;
  margin-bottom: 12px;
}
.thumb {
  position: relative;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.04);
}
.thumb img {
  width: 100%; height: 100px; object-fit: cover; display: block;
}
.thumb-meta { padding: 8px; }
.thumb-meta .name {
  font-size: 12px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.thumb-meta .size { font-size: 11px; color: #666; margin-top: 2px; }
.thumb .remove {
  position: absolute; top: 6px; right: 6px;
  background: #ff4d4f; color: #fff; border: none; border-radius: 14px;
  width: 22px; height: 22px; line-height: 20px; cursor: pointer;
}
.thumb .remove:hover { filter: brightness(0.95); }

/* Non-image list */
.list .row {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border: 1px solid #eee; border-radius: 8px;
  padding: 8px 10px; margin-bottom: 8px;
}
.list .row .name { font-weight: 600; }
.list .row .muted { font-size: 12px; color: #666; margin-top: 2px; }
.grow { flex: 1; }

/* Progress */
.progress {
  margin-top: 8px;
  font-size: 12px;
  color: #333;
}
.elevated-panels .v-expansion-panel { border:1px solid #e5e7eb; border-radius:10px; margin-bottom:12px; overflow:hidden; }
.panel-title { font-weight:700; color:#0b5aa2; background:#eef6ff; }
.section-wrap { border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin-bottom:12px; background:#fff; }
.section-head { font-weight:700; color:#333; margin-bottom:8px; }
.mini-title { font-weight:600; color:#444; margin:4px 0 8px; }
/* Invoice styles */
.invoice-header { display: flex; flex-direction: row; justify-content: space-between; grid-template-columns: 180px 1fr 300px; align-items: center; gap: 12px; border: 2px solid #000; border-left: none; border-right: none; padding: 6px 8px; background: #fff; box-sizing: border-box; }
.inv-left { display:flex; align-items:center; padding-left:6px; }
.inv-logo { max-width: 160px; height: auto; object-fit: contain; display:block; }
/* .inv-center { display:flex; justify-content:center; align-items:center; } */
.inv-title { width: 100%; text-align:center; padding: 6px 12px; font-weight:700; font-size:14px; letter-spacing: 1px; }
.inv-right { text-align:right; padding-right:8px; }
.company-name { font-weight:700; font-size:14px; text-transform: uppercase; }
.company-lines { margin-top:4px; font-size:11px; color:#111; }
.company-lines .small { font-size:10px; color:#333; margin-top:2px }
@media (max-width: 900px) {
  .invoice-header { grid-template-columns: 120px 1fr 160px; }
  .inv-logo { max-width: 110px; }
  .inv-title { font-size:13px; padding:5px 8px; }
  .company-name { font-size:12px; }
}
.bill-a4-landscape{ width: 1122px; max-width: 100%; margin: 0 auto; background:#fff; color:#000; padding:12px 18px; font-family: "Inter", Arial, Helvetica, sans-serif; font-size:12px; box-sizing:border-box; }
.muted{ color:#666; font-size:11px; }
.meta-row{ display:flex; justify-content:space-between; margin:6px 0 12px; }
/* .addr-wrap-landscape{ display:flex; gap:12px; margin-bottom:12px; } */
.addr-land{ flex:1; border:1px solid #000; padding:8px; min-height:86px; box-sizing:border-box; }
.grid-land{ width:100%; border-collapse:collapse; margin-top:6px; }
.grid-land th, .grid-land td{ border:1px solid #000; padding:8px; font-size:12px; }
.grid-land thead th{ background:#f6f6f6; }
.c{ text-align:center; }
.r{ text-align:right; }
.sub-total-row { background: #f9f9f9; font-weight: bold; }
.charges-row-land{ display:flex; flex-direction: column; gap:12px; margin-top:10px; align-items:flex-start; }
.charges-box-land{ flex:1; padding:4px; box-sizing:border-box; }
.tax-box-land{ width:660px; border:1px solid #000; padding:8px; box-sizing:border-box; }
.tax-box-land .tax-row{ display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px dashed #ddd; }
.tax-box-land .tax-row.total{ font-weight:700; background:#f7f7f7; }
.tax-box-land .tax-row.paid{ color:#0b7a27; font-weight:700; }
.tax-box-land .tax-row.due{ color:#c1121f; font-weight:700; }
.tax-row{font-size:10px;}
.nominee-land{ display:flex; gap:12px; margin-top:10px; }
.nominee-land > div{ flex:1 }
.paygrid-land{ width:100%; border-collapse:collapse; margin-top:12px; }
.paygrid-land th, .paygrid-land td{ border:1px solid #000; padding:6px; }
.paygrid-land thead th{ background:#f6f6f6; }
.sign-declare-wrap{ display:flex; gap:12px; margin-top:12px; align-items:flex-end; }
.sig-area{ flex:1; display:flex; flex-direction:column; align-items:flex-end; }
.sig-line{ width:240px; height:40px; border-bottom:1px solid #000; margin-bottom:6px; }
.sig-caption{ font-size:12px; text-align:right; color:#333; }
.declare-land{ width:480px; border-top:1px solid #000; padding-top:8px; box-sizing:border-box; }
.grid-land { width: 100%; border-collapse: collapse; margin-top: 10px; }
.grid-land th, .grid-land td { border: 1px solid #ccc; padding: 8px 10px; vertical-align: top; }
.grid-land th { background: #f5f5f5; font-weight: bold; text-align: left; }
.grid-land .r { text-align: right; }
.grid-land .c { text-align: center; }
.sub-info { font-size: 12px; color: #666; margin-top: 3px; line-height: 1.4; }
.sub-info span { display: inline-block; margin-right: 6px; }
.mt-4 { margin-top: 16px; }

/* Stepper customization */
.v-stepper__header { box-shadow: none; border-bottom: 1px solid #e0e0e0; }
.v-stepper__step--active .v-stepper__step__step { background-color: #1976d2; }
/* Layout shell */
.bill-a4{
  width: 794px; /* A4 portrait @ ~96dpi */
  max-width: 100%;
  margin: 0 auto;
  background:#fff;
  color:#000;
  padding:12px 16px;
  font-family: "Inter", Arial, Helvetica, sans-serif;
  font-size:12px;
  box-sizing:border-box;
  border: 1px solid #000;
}

/* Header */
.invoice-header{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:8px 6px;
  border-top:2px solid #000;
  border-bottom:2px solid #000;
}
.inv-left{ display:flex; align-items:center; }
.inv-logo{ max-width:140px; height:auto; object-fit:contain; }
.inv-center{display: flex; flex-direction:column; justify-content:space-around; text-align:center; flex:1; }
.inv-title{ font-weight:700; font-size:16px; letter-spacing:0.5px; }
.authorized{ font-size:12px; text-decoration:underline; margin-top:2px; }
.subline{word-wrap:nowrap; font-size:11px; margin-top:2px; }
.inv-right{ text-align:right; min-width:240px; }
.company-name{ font-weight:700; text-transform:uppercase; }
.company-lines .small{ font-size:10px; }

/* Meta row */
.meta-row{ display:flex; justify-content:space-between; margin:8px 0 10px; }

/* Bill to block */
.addr-wrap{ display:flex; margin:0px; }
.addr{ flex:1; border:1px solid #000; padding:8px; min-height:86px; }
.b{ font-weight:700; }
.c{ text-align:center; }

/* Nominee strip */
.nominee-strip{
  display:flex; gap:8px; border:1px solid #000; padding:8px; margin:8px 0 10px;
}
.nominee-strip > div{ flex:1; }
.cap{ font-weight:700; font-size:11px; }

/* Tables */
.grid{ width:100%; border-collapse:collapse; }
.grid th, .grid td{ border:1px solid #000; padding:8px; vertical-align:top; }
.grid thead th{ background:#f6f6f6; text-align:left; }
.r{ text-align:right; } .c{ text-align:center; }
.sub-info{ color:#444; font-size:11px; line-height:1.3; margin-top:3px; }
.sub-total-row{ background:#f9f9f9; font-weight:700; }
.mt-3{ margin-top:12px; }

/* Amount block */
.amount-block{ display:flex; gap:12px; margin-top:12px; align-items:flex-start; }
.charges{ flex:1; font-size:11px; }
.totals-box{
  width: 100%;
  border:1px solid #000;
  padding:10px 20px;
}
.totals-box .row{
  display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px dashed #ddd; font-size:11px;
}
.totals-box .row.grand{ font-weight:700; background:#f7f7f7; }
.totals-box .row.paid{ color:#0b7a27; font-weight:700; }
.totals-box .row.due{ color:#c1121f; font-weight:700; }
.totals-box .row.disc{ color:#ff6b35; }
.totals-box .row.total-disc{ border-top:1px dashed #ddd; }

/* Bank + QR + Sign row */
.bank-qr-sign{
  display:flex; gap:12px; margin-top:12px; align-items:stretch;
}
.bank, .qr, .sign{
  flex:1; border:1px solid #000; padding:8px; min-height:120px;
}
.bank .row{ display:flex; justify-content:space-between; font-size:11px; padding:2px 8px; }
.qr .qr-box{ width:120px; height:120px; border:1px solid #000; margin:8px auto 0; }

/* Enquiry strip */
.enquiry-strip{
  font-size:10px;
  display:flex; justify-content:space-between;
  border-top:1px solid #000; border-bottom:1px solid #000;
  padding:6px 4px; margin-top:8px; font-size:11px;
}

/* Declaration */
.declaration{ font-size:12px; color:#000; margin-top:6px; }
.declaration ol{ margin:6px 0 0 16px; }

/* --- keep your existing form/stepper styles intact --- */
.section-wrap { border:1px solid #e5e7eb; border-radius:8px; padding:12px; margin-bottom:12px; background:#fff; }
.section-head { font-weight:700; color:#333; margin-bottom:8px; }
.mini-title { font-weight:600; color:#444; margin:4px 0 8px; }
.v-stepper__header { box-shadow: none; border-bottom: 1px solid #e0e0e0; }
.v-stepper__step--active .v-stepper__step__step { background-color: #1976d2; }

</style>