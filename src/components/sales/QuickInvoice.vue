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
        <!-- <v-stepper-step :complete="currentStep > 2" step="2" >
          Finance & RTO
        </v-stepper-step>
        <v-divider></v-divider> -->
        <v-stepper-step step="2" >
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
              </v-col>
            </v-row>
          </section>

           <section class="section-wrap">
            <div class="section-head">Choose Sales Mode</div>
            <v-radio-group v-model="form.salesMode" row>
              <v-radio label="Cash" value="CASH"></v-radio>
              <v-radio label="Finance" value="FINANCE"></v-radio>
            </v-radio-group>
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
                  <v-col cols="12"><v-text-field v-model="form.customer.address.line2" label="Landmark" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.customer.address.village" label="Village/Town/City" dense outlined hide-details="auto"/></v-col>
                  <v-col cols="12" sm="6"><v-text-field v-model="form.customer.address.postOffice" label="Post" dense outlined hide-details="auto"/></v-col>
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
                  <v-col cols="12"><v-text-field v-model="form.permanentAddress.line2" label="Landmark" dense outlined hide-details="auto"/></v-col>
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
              <v-col cols="12" sm="4"><v-select v-model="form.nominee.relation" :items="relations" label="Relation With Owner" dense outlined hide-details="auto"/></v-col>
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

        <!-- STEP 3: PRICE & PAYMENT DETAIL -->
        <div v-if="currentStep === 2">
          <!-- Price structure -->
          <section class="section-wrap">
            <div class="section-head">Price Structure</div>
            <v-row dense>
              <v-col cols="12" sm="3">
                <v-text-field :value="money(lineAmount)" label="Vehicle Amount" dense outlined hide-details="auto" readonly/>
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
            v-if="currentStep < 2" 
            @click="currentStep++" 
            color="primary"
          >
            Next
            <v-icon right>mdi-chevron-right</v-icon>
          </v-btn>
          <v-btn 
            style="width:250px;"
            v-if="currentStep === 2" 
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
           <!-- NEW: No Dues button (enabled only when dueAmount === 0) -->
          <v-btn small outlined class="mr-2" :disabled="dueAmount !== 0" @click="downloadNoDuesPdf">
            <v-icon left small>mdi-file-check</v-icon>
            No Dues
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
                <div style="text-align:center;" class="subline">TVS MOPED, TVS MOTORCYCLE, EV SCOOTER, <br> GENUINE SPARE & ACCESSORIES</div>
                <div style="text-align:center;" class="authorized"><u>Authorised Dealer</u></div>
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
                <div style="display:flex; flex-direction:row; justify-content:space-between; align-items:center;">
                  <div class="b">Bill To -</div>
                  <div>Purchase Mode : {{form.salesMode}}</div>
                </div>
                <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                  <tr>
                    <td style="font-weight:700; padding:1px 0; width:200px;">CUSTOMER NAME</td>
                    <td>: {{ form.customer.name || '-' }}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:700; padding:1px 0;">{{ convertRelation(form.owner.relationType) }}</td>
                    <td>: {{ form.owner.relationName || '-' }}</td>
                  </tr>
                  <tr>
                    <td style="font-weight:700; padding:1px 0;">CURRENT ADD</td>
                    <td>: {{ printableAddress || '-' }}</td>
                  </tr>
                  <tr v-if="form.permanentAddress && (form.permanentAddress.line1 || form.permanentAddress.village || form.permanentAddress.district)">
                    <td style="font-weight:700; padding:1px 0;">PERMANENT ADD</td>
                    <td>:
                    {{ [
                    form.permanentAddress.line1,
                    form.permanentAddress.line2,
                    form.permanentAddress.village,
                    form.permanentAddress.postOffice,
                    form.permanentAddress.tahsil,
                    form.permanentAddress.district,
                    form.permanentAddress.state,
                    form.permanentAddress.pincode
                    ].filter(Boolean).join(', ') }}
                    </td>
                  </tr>
                  <tr v-if="form.customer.phone">
                    <td style="font-weight:700; padding:1px 0;">MOBILE NO.</td>
                    <td>: {{ form.customer.phone }}</td>
                  </tr>
                  <tr v-if="form.ids.type && form.ids.value">
                    <td style="font-weight:700; padding:1px 0;">AADHAAR NUMBER</td>
                    <td>: {{ form.ids.type==='AADHAAR' ? form.ids.value : '-' }}</td>
                  </tr>
                  <tr v-if="form.basic.assignedRtoOffice">
                    <td style="font-weight:700; padding:1px 0;">ASSIGNED RTO</td>
                    <td>: {{ form.basic.assignedRtoOffice }}</td>
                  </tr>
                </table>
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
            <table style="border-top:1px solid #000; border-bottom:1px solid #000; border-left:2px solid #000; border-right:2px solid #000; border-collapse:collapse;" class="grid">
              <thead>
                <tr>
                  <th style="border:1px solid #000; padding:6px 8px;">MODEL</th>
                  <th style="border:1px solid #000; padding:6px 8px;" class="c">QTY</th>
                  <th style="border:1px solid #000; padding:6px 8px;" class="r">PRICE</th>
                  <th style="border:1px solid #000; padding:6px 8px;" class="r">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border:1px solid #000; padding:6px 8px;"> 
                    <div style="font-size:14px; font-weight:600;">{{ form.model || '-' }}</div>
                    <div class="sub-info">
                      <div>Chassis: {{ form.chassisNumber || '—' }}</div>
                      <div>Engine: {{ selectedChassisInfo?.engineNumber || '—' }}</div>
                      <div>Color: {{ selectedChassisInfo?.color || '—' }}</div>
                    </div>
                  </td>
                  <td style="border:1px solid #000; padding:6px 8px;" class="c">{{ form.qty }}</td>
                  <td style="border:1px solid #000; padding:6px 8px;" class="r">{{ money(unitVehicleExRtoIns) }}</td>
                  <td style="border:1px solid #000; padding:6px 8px;" class="r">{{ money(lineAmount) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- ACCESSORIES -->
            <table style="border-top:1px solid #000; border-bottom:1px solid #000; border-left:2px solid #000; border-right:2px solid #000; border-collapse:collapse;" v-if="form.accessories.length" class="grid">
              <thead>
                <tr>
                  <th style="border:1px solid #000; padding:6px 8px;" colspan="2">ACCESSORIES</th>
                  <th style="border:1px solid #000; padding:6px 8px;" class="r">QTY</th>
                  <th style="border:1px solid #000; padding:6px 8px;" class="r">PRICE</th>
                  <th style="border:1px solid #000; padding:6px 8px;" class="r">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="acc in form.accessories" :key="acc.key">
                  <td style="border:1px solid #000; padding:6px 8px;" colspan="2">{{ acc.name || '—' }}</td>
                  <td style="border:1px solid #000; padding:6px 8px;" class="r">{{ acc.qty || 0 }}</td>
                  <td style="border:1px solid #000; padding:6px 8px;" class="r">{{ money(acc.price) }}</td>
                  <td style="border:1px solid #000; padding:6px 8px;" class="r">{{ money(accessoryAmount(acc)) }}</td>
                </tr>
                <tr class="sub-total-row">
                  <td style="border:1px solid #000; padding:6px 8px;" colspan="4" class="r"><b>Total Accessories:</b></td>
                  <td style="border:1px solid #000; padding:6px 8px;" class="r"><b>{{ money(accessoriesTotal) }}</b></td>
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
                <div style="border:none;" class="row"><span>Amount (in words)</span><span class="r">{{ amountInWords }}</span></div>
              </div>
            </div>

            <!-- PAYMENT TABLE -->
            <table style="border-top:1px solid #000; border-bottom:1px solid #000; border-left:2px solid #000; border-right:2px solid #000; border-collapse:collapse;" class="grid" v-if="form.payments.length">
              <thead>
                <tr>
                  <th style="border:1px solid #000; padding:6px 8px;">MODE</th>
                  <th style="border:1px solid #000; padding:6px 8px;">REFERENCE</th>
                  <th style="border:1px solid #000; padding:6px 8px;" class="r">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="p in form.payments" :key="p.key">
                  <td style="border:1px solid #000; padding:6px 8px;">{{ p.mode }}</td>
                  <td style="border:1px solid #000; padding:6px 8px;">{{ p.reference || '—' }}</td>
                  <td style="border:1px solid #000; padding:6px 8px;" class="r">{{ money(p.amount) }}</td>
                </tr>
              </tbody>
            </table>

            <!-- BANK + QR + SIGN -->
            <div class="bank-qr-sign">
              <div class="bank">
                <div style="text-align:center; margin-bottom:12px; font-size:13px;"><b><u>Company's Bank Details</u></b></div>
                <table style="width:100%; border-collapse:collapse;">
                  <tr>
                    <td style="font-weight:500; font-size:10px; padding:2px;">A/c Holder's Name :</td>
                    <td style="padding:4px 6px; font-size:10px;">Ansari Automobiles</td>
                  </tr>
                  <tr>
                    <td style="font-weight:500; font-size:10px; padding:2px;">Bank Name :</td>
                    <td style="padding:2px; font-size:10px;">Union Bank of India</td>
                  </tr>
                  <tr>
                    <td style="font-weight:500; font-size:10px; padding:2px;">A/c No. :</td>
                    <td style="padding:2px; font-size:10px;">302901010100080</td>
                  </tr>
                  <tr>
                    <td style="font-weight:500; font-size:10px; padding:2px;">IFSC Code :</td>
                    <td style="padding:2px; font-size:10px;">UBIN0530298</td>
                  </tr>
                  <tr>
                    <td style="font-weight:500; font-size:10px; padding:2px;">Branch :</td>
                    <td style="padding:2px; font-size:10px;">MAUNATH BHANJAN</td>
                  </tr>
                </table>

              </div>
              <div class="qr">
                <div class="b c">Scan to Pay</div>
                <div class="qr-box"><img style="width:120px; height:120px;" src="@/assets/qr.png" /></div>
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
            <div class="enquiry-strip">
              <div style="font-size:10px; padding-top:10px; padding-bottom:10px;  display:flex; flex-direction:row; justify-content:center; aligh-items:center; width:25%; height:auto; border:1px solid black; ">SALES ENQ NO: 8090086427 </div>
              <div style="font-size:10px; padding-top:10px; padding-bottom:10px;  display:flex; flex-direction:row; justify-content:center; aligh-items:center; width:25%; height:auto; border:1px solid black; ">RC/HSRP ENQ NO: 8528414311</div>
              <div style="font-size:10px; padding-top:10px; padding-bottom:10px;  display:flex; flex-direction:row; justify-content:center; aligh-items:center; width:25%; height:auto; border:1px solid black; ">PARTS ENQ NO: 9648261555</div>
              <div style="font-size:10px; padding-top:10px; padding-bottom:10px;  display:flex; flex-direction:row; justify-content:center; aligh-items:center; width:25%; height:auto; border:1px solid black; ">SERVICE: 8090231724/8400630140</div>
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
    <GatePass ref="gatepassRef" />
  </v-card>
</template>

<script>
import html2pdf from 'html2pdf.js'
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import GatePass from './GatePass.vue'
let uid = 1;
let _imgUid = 1;  

export default {
  name: 'QuickInvoiceCustomerPro',
  components:{ GatePass },
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
        docs: {
          invoice: null,
          nodues: null,
          gatepass: null
        },
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
      rPincodeInline: v => (!v || /^\d{6}$/.test(String(v))) || '6-digit PIN only',
      rEmailInline: v => (!v || /\S+@\S+\.\S+/.test(String(v || ''))) || 'Invalid email',
      rNomineeMobileInline: v => (!v || /^\d{10}$/.test(String(v))) || '10-digit only',
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

    showroomTotal () {
      // Tax calculation based on the subtotal (vehicle + accessories)
      const s = Number(this.subtotal || 0) // lineAmount + accessoriesTotal
      if (this.isTaxInclusive) {
        // subtotal already includes tax
        return Number(s.toFixed(2))
      } else {
        // tax exclusive: taxableAmount + cgst + sgst
        const tax = Number(this.cgstAmount || 0) + Number(this.sgstAmount || 0)
        return Number((this.taxableAmount + tax).toFixed(2))
      }
    },

  onRoadTotal () {
    const qty = Number(this.form.qty || 1)
    const totalRto = Number(this.totalRtoCharges || 0)
    const totalIns = Number(this.totalInsuranceCharges || 0)

    if (this.form.billOptions.billPriceMode === 'ON_ROAD') {
      const vehicleOnRoad = Number(this.form.price || 0) * qty
      const itemsTotal = vehicleOnRoad + Number(this.accessoriesTotal || 0)
      if (this.isTaxExclusive) {
        const taxable = Number(this.isTaxExclusive ? this.taxableAmountForItems(itemsTotal) : this.taxableAmount)
        const cgst = Number(((taxable * Number(this.form.cgstPercent || 0)) / 100).toFixed(2))
        const sgst = Number(((taxable * Number(this.form.sgstPercent || 0)) / 100).toFixed(2))
        return Number((itemsTotal + cgst + sgst).toFixed(2))
      } else {
        return Number(itemsTotal.toFixed(2))
      }
    } else {
      const perUnitCharges = Number(this.form.rtoCharges || 0) + Number(this.form.insuranceCharges || 0)
      const totalCharges = perUnitCharges * qty
      return Number((this.showroomTotal + totalCharges).toFixed(2))
    }
  },

  taxableAmountForItems(itemsTotal) {
    const tr = this.taxRate
    if (tr > 0 && this.isTaxInclusive) {
      return Number((itemsTotal / (1 + tr)).toFixed(2))
    }
    return Number(itemsTotal.toFixed(2))
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

    displayVehicleAmount () {
      return this.lineAmount
    },

    billGrandTotal () {
      const baseTotal = this.onRoadTotal
      return Number(Math.max(0, (Number(baseTotal || 0) - Number(this.totalDiscount || 0))).toFixed(2))
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

    idMaxLength () {
      const t = this.form.ids.type
      if (t === 'AADHAAR') return 12
      if (t === 'PAN') return 10
      if (t === 'VOTER') return 10
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
    'form.billOptions.billPriceMode'(val) {
      if (val === 'ON_ROAD') {
        this.form.billOptions.showRto = false
        this.form.billOptions.showInsurance = false
      } else {
        this.form.billOptions.showRto = true
        this.form.billOptions.showInsurance = true
      }
    },

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

    // Add these helpers to your `methods` section

    /**
     * Wait for an element or truthy value from a selector/function.
     * - selOrFn: CSS selector string or function returning an element/truthy or null.
     * - attempts: how many polls
     * - intervalMs: ms between polls
     */
    async waitFor(selOrFn, attempts = 12, intervalMs = 150) {
      const isFn = typeof selOrFn === 'function';
      for (let i = 0; i < attempts; i++) {
        try {
          const found = isFn ? await selOrFn() : document.querySelector(selOrFn);
          if (found) return found;
        } catch (e) {
          // ignore and retry
        }
        await new Promise(r => setTimeout(r, intervalMs));
      }
      return null;
    },

    /**
     * Call GatePass.show(...) to open preview, wait for the sheet element
     * capture it as a PNG blob and upload via presign. Returns a result object
     * similar to other results: { type:'gatepass', key, url, status, ... }
     *
     * Arguments:
     *  - form, selected, totalFromParent => forwarded to GatePass.show
     *
     * NOTE: This keeps the GatePass dialog open (so the user sees it). If you want to auto-close,
     * you can set this.$refs.gatepassRef.open = false (or call a close method) after upload.
     */
    async callGatepassAndUpload(form = this.form, selected = this.selectedChassisInfo, totalFromParent = this.billGrandTotal) {
      // ensure child GatePass exists
      try {
        // 1. Open gatepass via component API (if available)
        if (this.$refs && this.$refs.gatepassRef && typeof this.$refs.gatepassRef.show === 'function') {
          // call the show method in the GatePass component to populate and open the dialog
          this.$refs.gatepassRef.show(form, selected || {}, totalFromParent || 0);
        } else {
          // nothing to open; we'll still try to find a DOM node via selector
          console.warn('GatePass component ref not found; falling back to DOM selector.');
        }

        // 2. Wait for the actual element to appear. The GatePass component uses `ref="sheet"` internally,
        // so child component's $refs.sheet should point to the DOM. Try that first (works in Vue2).
        const gpRoot = await this.waitFor(async () => {
          // prefer direct child component's sheet ref if available
          try {
            if (this.$refs && this.$refs.gatepassRef) {
              const child = this.$refs.gatepassRef;
              // child.$refs.sheet may be the DOM element (or a Vue wrapper), handle both
              if (child.$refs && child.$refs.sheet) {
                return child.$refs.sheet;
              }
              // sometimes the dialog is teleported and the component itself is the element
              if (child.$el) return child.$el;
            }
          } catch (e) { /* ignore */ }

          // fallback DOM selectors - pick a stable class used in GatePass template
          const sel = document.querySelector('.gp-a4') || document.querySelector('.gatepass-root') || document.querySelector('#gatepass') || document.querySelector('[data-ref="gatepass"]');
          return sel || null;
        }, 20, 150);

        if (!gpRoot) {
          console.warn('GatePass element not found after wait; skipping gatepass upload.');
          return { type: 'gatepass', status: 'skipped', message: 'gp not found' };
        }

        // If the ref is a Vue ref object, extract actual DOM node:
        const gpEl = (gpRoot instanceof HTMLElement) ? gpRoot : (gpRoot.$el || gpRoot);

        // small delay to allow fonts/images to settle
        await new Promise(r => setTimeout(r, 180));

        // 3. capture element using html2canvas (we already have generatePdfBlobFromElement for PDF path).
        // We'll use html2canvas directly and convert to PNG blob for "image from gatepass"
        const canvas = await html2canvas(gpEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
        // convert to blob (PNG)
        const imgBlob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1.0));
        if (!imgBlob) throw new Error('Failed to convert GatePass canvas to blob');

        // 4. build key and request presign
        const prefix = this.sanitizeLocationPrefix ? this.sanitizeLocationPrefix() : (String(this.form.customer?.phone || 'unknown').replace(/\D/g,'') || 'unknown');
        const invNum = this.inv?.number || (this.form.chassisNumber ? `INV-${this.form.chassisNumber}` : `INV-${Date.now()}`);
        const fileName = `GatePass_${invNum}.png`;
        const key = `${prefix}/gatepass/${fileName}`;

        // request presigned URL (your requestPresign expects (key, fileType))
        let presignUrl;
        try {
          presignUrl = await this.requestPresign(key, 'image/png');
        } catch (err) {
          // some backends expect different payload - try a fallback shape if requestPresign fails (defensive)
          console.warn('requestPresign failed, attempting fallback raw POST', err);
          try {
            const resp = await axios.post(`${this.BASE.replace(/\/$/,'')}/uploadImages`, { fileName: key, fileType: 'image/png' });
            presignUrl = resp?.data?.url;
          } catch (ex2) {
            throw new Error('Presign request failed: ' + (ex2?.message || err?.message || 'unknown'));
          }
        }

        if (!presignUrl) throw new Error('No presigned URL returned for GatePass image');

        // 5. upload via PUT
        let publicUrl;
        try {
          publicUrl = await this.uploadBlobToPresignedUrl(imgBlob, presignUrl, 'image/png');
        } catch (upErr) {
          // try again without content-type header (some presigned endpoints require no explicit header)
          try {
            const resp = await fetch(presignUrl, { method: 'PUT', body: imgBlob });
            if (!resp.ok) throw new Error(`Upload failed (status ${resp.status})`);
            publicUrl = presignUrl.split('?')[0];
          } catch (fallbackErr) {
            throw new Error('GatePass upload failed: ' + (fallbackErr?.message || upErr?.message || 'unknown'));
          }
        }

        // done — return object
        return { type: 'gatepass', key, url: publicUrl, status: 'success' };
      } catch (err) {
        console.error('callGatepassAndUpload error:', err);
        return { type: 'gatepass', status: 'failed', error: String(err) };
      }
    },

    // ---------- New helper: waitFor a DOM/ref to appear ----------
    async waitFor(getter, attempts = 10, delay = 150) {
      for (let i = 0; i < attempts; i++) {
        try {
          const v = getter();
          if (v) return v;
        } catch (e) { /* ignore */ }
        await new Promise(r => setTimeout(r, delay));
      }
      return null;
    },

    // ------------------ New helpers for PDF generation & presigned upload ------------------

    async generatePdfBlobFromElement(el) {
      // Use html2canvas -> jsPDF to produce a PDF blob
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'pt', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      return pdf.output('blob');
    },

    sanitizeLocationPrefix() {
      // mobile + name -> mobile_name (safe)
      const mobile = String(this.form.customer.phone || '').replace(/\D/g, '').trim();
      const nameRaw = (this.form.owner?.ownershipType === 'FIRM' ? (this.form.firm?.name || '') : (this.form.customer?.name || '')).trim();
      const name = nameRaw.replace(/\s+/g, '_').replace(/[^\w\-\.]/g, '');
      return `${mobile || 'unknown'}${name ? '_'+name : ''}`;
    },

    async requestPresign(key, fileType) {
      // Follow your backend payload shape { body: { fileName, fileType } }
      const url = `${this.BASE.replace(/\/$/,'')}/uploadImages`;
      const payload = { body: { fileName: key, fileType } };
      const resp = await axios.post(url, payload);
      if (!resp || (resp.status !== 200 && resp.status !== 201)) {
        throw new Error(`Presign failed (${resp?.status})`);
      }
      const data = resp.data || {};
      // support multiple shapes: { url }, { data: { url } }, { presigned: { url } }, or return first http string
      const presigned = data.url || (data.data && data.data.url) || (data.presigned && data.presigned.url) || null;
      if (presigned) return presigned;
      // fallback: find an http url in response body
      const findUrl = (obj) => {
        if (!obj) return null;
        if (typeof obj === 'string' && obj.startsWith('http')) return obj;
        if (typeof obj === 'object') {
          for (const k of Object.keys(obj)) {
            try {
              const found = findUrl(obj[k]);
              if (found) return found;
            } catch (e) {}
          }
        }
        return null;
      };
      const firstUrl = findUrl(data);
      if (firstUrl) return firstUrl;
      throw new Error('No presigned URL returned from backend');
    },

    async uploadBlobToPresignedUrl(blob, presignedUrl, fileType = 'application/pdf') {
      const resp = await fetch(presignedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': fileType },
        body: blob
      });
      if (!resp.ok) {
        const text = await resp.text().catch(()=>null);
        throw new Error(`Upload failed ${resp.status} ${resp.statusText} ${text || ''}`);
      }
      return presignedUrl.split('?')[0];
    },

    buildNoDuesElementForPdf() {
      let logoSrc;
      try { logoSrc = require('@/assets/newLogoTVS.png'); } catch (err) { logoSrc = '@/assets/newLogoTVS.png'; }

      const wrapper = document.createElement('div');
      wrapper.style.width = '794px';
      wrapper.style.padding = '24px';
      wrapper.style.boxSizing = 'border-box';
      wrapper.style.fontFamily = 'Arial, Helvetica, sans-serif';
      wrapper.style.color = '#000';
      wrapper.style.background = '#fff';

      const invNum = this.inv.number || (this.form.chassisNumber ? `INV-${this.form.chassisNumber}` : 'NA');
      const invDate = this.inv.date || new Date().toLocaleDateString('en-GB');
      const customerName = this.form.owner.ownershipType === 'FIRM' ? (this.form.firm.name || '-') : (this.form.customer.name || '-');
      const chassis = this.form.chassisNumber || '-';
      const model = this.form.model || '-';
      const companyName = 'ANSARI AUTOMOBILES';
      const amountWords = this.amountInWords || '';

      wrapper.innerHTML = `
        <div style="text-align:center; margin-bottom:10px;">
          <img src="${logoSrc}" alt="Logo" style="height:70px; display:block; margin:0 auto 8px;" />
          <div style="font-weight:700; font-size:18px;">${companyName}</div>
          <div style="font-size:12px; margin-top:4px;">BADI KAMHARIYA BY PASS ROAD, MAU</div>
          <hr style="margin:16px 0; border:none; border-top:1px solid #ccc;" />
        </div>

        <div style="text-align:center; margin:8px 0 18px;">
          <div style="font-size:22px; font-weight:700; letter-spacing:1px;">NO DUES CERTIFICATE</div>
          <div style="font-size:12px; color:#444; margin-top:6px;">(This certifies that the customer has cleared all dues)</div>
        </div>

        <div style="font-size:14px; line-height:1.6;">
          <div><strong>Invoice No:</strong> ${invNum}</div>
          <div><strong>Invoice Date:</strong> ${invDate}</div>
          <div style="margin-top:8px;"><strong>Customer Name:</strong> ${customerName}</div>
          <div><strong>Model / Chassis:</strong> ${model} / ${chassis}</div>
          <div style="margin-top:8px;"><strong>Bill Grand Total:</strong> ${this.money(this.billGrandTotal)}</div>
          <div><strong>Amount Paid:</strong> ${this.money(this.totalPaid)}</div>
          <div style="margin-top:12px; background:#f7f7f7; padding:10px; border-radius:4px;">
            <strong>Status:</strong> <span style="color:green; font-weight:700;">No Outstanding Dues (₹0)</span>
          </div>

          <div style="margin-top:14px;">
            This is to certify that <strong>${customerName}</strong> has no outstanding dues against the above invoice as on <strong>${invDate}</strong>. All payments have been received and the account stands settled for the referenced vehicle.
          </div>

          <div style="margin-top:10px;"><em>Amount (in words):</em> ${amountWords}</div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:36px; align-items:flex-end;">
          <div style="width:60%;">
            <div style="font-size:12px; color:#666;">This certificate is system generated and does not require a physical signature.</div>
          </div>
          <div style="width:35%; text-align:center;">
            <div style="height:60px;"></div>
            <div style="border-top:1px solid #000; padding-top:6px; font-size:13px;">Authorised Signatory</div>
            <div style="font-size:12px; color:#666; margin-top:4px;">${companyName}</div>
          </div>
        </div>
      `;
      return wrapper;
    },

    async generateAndUploadPdfsAfterSubmit() {
      const results = [];
      try {
        const prefix = this.sanitizeLocationPrefix(); // mobile_name
        const invNum = this.inv.number || (this.form.chassisNumber ? `INV-${this.form.chassisNumber}` : `INV-${Date.now()}`);
        const invoiceFileName = `Invoice_${invNum}.pdf`;
        const noDuesFileName = `NoDues_${invNum}.pdf`;
        const gatePassFileName = `GatePass_${invNum}.pdf`;

        // wait a bit for DOM placement (invoice/gatepass)
        await this.$nextTick();
        await new Promise(r => setTimeout(r, 180));

        // 1) Invoice: search refs, id or selector fallbacks
        const invEl = await this.waitFor(() => {
          if (this.$refs && this.$refs.billArea) return this.$refs.billArea;
          const byId = document.getElementById('billArea');
          if (byId) return byId;
          const q = document.querySelector('[data-ref="billArea"], .bill-area, #billArea');
          return q;
        }, 8, 150);

        if (invEl) {
          try {
            const blob = await this.generatePdfBlobFromElement(invEl);
            const keyInv = `${prefix}/invoice/${invoiceFileName}`;
            const presignInv = await this.requestPresign(keyInv, blob.type || 'application/pdf');
            const urlInvPublic = await this.uploadBlobToPresignedUrl(blob, presignInv, 'application/pdf');
            results.push({ type: 'invoice', key: keyInv, url: urlInvPublic, status: 'success' });
          } catch (err) {
            console.error('Invoice PDF/upload failed:', err);
            results.push({ type: 'invoice', status: 'failed', error: String(err) });
          }
        } else {
          console.warn('Invoice element not found; skipping invoice PDF upload.');
        }

        // 2) NoDues (only if due is zero)
        if (Number(this.dueAmount || 0) === 0) {
          const ndEl = this.buildNoDuesElementForPdf();
          document.body.appendChild(ndEl);
          try {
            const ndBlob = await this.generatePdfBlobFromElement(ndEl);
            const keyNd = `${prefix}/nodues/${noDuesFileName}`;
            const presignNd = await this.requestPresign(keyNd, ndBlob.type || 'application/pdf');
            const urlNdPublic = await this.uploadBlobToPresignedUrl(ndBlob, presignNd, 'application/pdf');
            results.push({ type: 'nodues', key: keyNd, url: urlNdPublic, status: 'success' });
          } catch (err) {
            console.error('NoDues PDF/upload failed:', err);
            results.push({ type: 'nodues', status: 'failed', error: String(err) });
          } finally {
            if (ndEl && ndEl.parentNode) ndEl.parentNode.removeChild(ndEl);
          }
        }

        // NEW ROBUST GATEPASS CAPTURE + UPLOAD
        try {
          const gpRef = this.$refs.gatepassRef;
          if (gpRef && typeof gpRef.show === 'function') {

            // 1) Open gatepass dialog with correct data
            gpRef.show(this.form, this.selectedChassisInfo || {}, this.billGrandTotal || 0);

            // 2) Wait for Vue to render the dialog
            await this.$nextTick();
            await new Promise(r => setTimeout(r, 3000));  // <---- changed from 300 to 3000ms (3 sec)

            // 3) Capture the correct element: <div ref="sheet">
            const gpSheetEl = gpRef.$refs?.sheet ?? gpRef.$el ?? null;

            if (!gpSheetEl) {
              console.warn("GatePass printable <div ref='sheet'> not found");
            } else {
              const gpBlob = await this.generatePdfBlobFromElement(gpSheetEl);

              if (gpBlob && gpBlob.size > 100) {
                const keyGp = `${prefix}/gatepass/${gatePassFileName}`;
                const presignGp = await this.requestPresign(keyGp, gpBlob.type || 'application/pdf');
                const putUrl = (typeof presignGp === 'string') ? presignGp : (presignGp.url || presignGp);

                const urlGpPublic = await this.uploadBlobToPresignedUrl(gpBlob, putUrl, 'application/pdf');
                results.push({ type: 'gatepass', key: keyGp, url: urlGpPublic, status: 'success' });
              } else {
                console.warn("GatePass blob too small → capture failed");
              }
            }

          } else {
            console.warn("gatepassRef not found or show() not available");
          }

        } catch (err) {
          console.warn('GatePass upload error:', err);
        }

        // Build doc mapping for backend
        const doc = {};
        for (const r of results) {
          if (r.type === 'invoice' && r.key) doc.invoice = r.key;
          if (r.type === 'nodues' && r.key) doc.nodues = r.key;
          if (r.type === 'gatepass' && r.key) doc.gatepass = r.key;
        }

        // Notify backend (non-fatal)
        if (Object.keys(doc).length) {
          try {
            const attachUrl = `${this.BASE.replace(/\/$/,'')}/attachInvoiceFiles`;
            await axios.post(attachUrl, { billNumber: invNum, doc });
          } catch (errAttach) {
            console.warn('Failed to notify backend of uploaded files', errAttach);
          }
        }

        this.$emit('pdfUploadResults', results);
        this.$emit('notify', { text: 'PDF upload process finished', color: 'success' });
        return results;
      } catch (err) {
        console.error('PDF upload error', err);
        this.$emit('notify', { text: 'PDF upload failed', color: 'error' });
        return [{ status: 'failed', message: String(err) }];
      }
    },

    // ------------------ Existing methods (unchanged) ------------------

    onNomineeFileChange(fileOrFiles) {
      const f = Array.isArray(fileOrFiles) ? fileOrFiles[0] : fileOrFiles;
      if (!f) { this.clearNomineeImage(); return; }

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

      if (this.form.nominee.previewUrl) {
        URL.revokeObjectURL(this.form.nominee.previewUrl);
      }

      this.form.nominee.file = f;
      this.form.nominee.previewUrl = URL.createObjectURL(f);

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

    appendNomineeToFormData(fd) {
      fd.append('nominee[name]', this.form.nominee.name || '');
      fd.append('nominee[relation]', this.form.nominee.relation || '');
      fd.append('nominee[age]', this.form.nominee.age != null ? this.form.nominee.age : '');
      fd.append('nominee[mobile]', this.form.nominee.mobile || '');
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

    convertRelation(relation, personGender = null) {
      relation = relation.toLowerCase().trim();
      const conversionMap = {
        'father': 'S/O',
        'mother': 'S/O',
        'husband': 'W/O',
        'wife': 'H/O',
        'son': 'F/O',
        'daughter': 'F/O',
        'spouse': 'S/O'
      };
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
      this.form.category = '';
      this.form.model = '';
      this.form.chassisNumber = '';
      this.form.vehicleCategory = '';
      this.form.price = null;
      this.form.qty = 1;
      this.form.rtoCharges = 0;
      this.form.insuranceCharges = 0;
    },
    
    copyCurrentToPermanent () { if (this.sameAsCurrent) this.form.permanentAddress = { ...this.form.customer.address } },
    addFirmKV () { this.form.firm.extra.push({ key: Date.now(), k:'', v:'' }) },
    removeFirmKV (i) { this.form.firm.extra.splice(i,1) },
    addIdKV () { this.form.ids.custom.push({ key: Date.now(), k:'', v:'' }) },
    removeIdKV (i) { this.form.ids.custom.splice(i,1) },

    onPaymentFilesChange(idx, payload) {
      const row = this.form.payments[idx];
      if (!row) return;
      let files = [];
      if (payload instanceof File) {
        files = [payload];
      } else if (Array.isArray(payload)) {
        files = payload;
      } else if (payload && payload.target && payload.target.files) {
        files = Array.from(payload.target.files);
      } else if (payload && payload.length !== undefined) {
        files = Array.from(payload);
      } else {
        files = [];
      }
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
      row.inputKey = Date.now() + Math.random();
    },

    removePaymentImage(idx, imgId) {
      const row = this.form.payments[idx];
      if (!row) return;
      const pvIdx = row.previews.findIndex(p => p.id === imgId);
      if (pvIdx === -1) return;
      const [pv] = row.previews.splice(pvIdx, 1);
      if (pv && pv.url) URL.revokeObjectURL(pv.url);
      const fIdx = row.files.findIndex(f => f && f.name === pv.name && f.size === pv.size);
      if (fIdx !== -1) row.files.splice(fIdx, 1);
      row.inputKey = Date.now() + Math.random();
    },

    revokeRowPreviews(row) {
      if (!row?.previews) return;
      for (const p of row.previews) {
        if (p.url) URL.revokeObjectURL(p.url);
      }
      row.previews = [];
    },

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
      fd.append('payments', JSON.stringify(
        this.form.payments.map(({ files, previews, inputKey, ...rest }) => rest)
      ));
      this.form.payments.forEach((row, i) => {
        row.files.forEach((f, j) => {
          fd.append(`paymentImages[${i}][]`, f, f.name);
        });
      });
      return fd;
    },

    addDueRow () { this.form.duePayments.push({ key: Date.now(), date:null, amount:0, note:'', menu:false }) },
    removeDueRow (i) { this.form.duePayments.splice(i,1) },

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

    coerceIdValue (e) {
      let val = String(e?.target?.value ?? this.form.ids.value ?? '')
      if (this.idNumericOnly) val = val.replace(/\D/g, '')
      if (this.idMaxLength > 0) val = val.slice(0, this.idMaxLength)
      this.form.ids.value = val
    },

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

      this.form.accessories.forEach((acc, i) => {
        if (acc.name && (!acc.qty || acc.qty < 0)) errors.push(`Accessory ${i+1}: quantity must be 0 or more.`)
        if (acc.name && (!acc.price || acc.price < 0)) errors.push(`Accessory ${i+1}: price must be 0 or more.`)
      })

      this.form.duePayments.forEach((d, i) => {
        if (d.amount != null && (isNaN(Number(d.amount)) || Number(d.amount) < 0)) errors.push(`Due row ${i+1}: amount must be ≥ 0.`)
      })

      this.errorSummary = errors
      return errors.length === 0
    },

    async onSubmit () {
      const ok = this.validateAll()
      const vuetifyOk = this.$refs.form && this.$refs.form.validate ? this.$refs.form.validate() : true
      if (!ok || !vuetifyOk) {
        this.snack = { show: true, color: 'error', text: 'Please fix highlighted errors' }
        return
      }
      await this.submit()
    },

    async submit () {
      this.submitting = true;

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
            docs: this.docs,
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

        const invoiceNumber = this.inv?.number || billNumber;
        const invoiceDate = this.inv?.date || formatDateDDMMYYYY(now);
        const prefix = this.sanitizeLocationPrefix(); // mobile_name
        const invNum = this.inv.number || (this.form.chassisNumber ? `INV-${this.form.chassisNumber}` : `INV-${Date.now()}`);
        const invoiceFileName = `Invoice_${invNum}.pdf`;
        const noDuesFileName = `NoDues_${invNum}.pdf`;
        const gatePassFileName = `GatePass_${invNum}.pdf`;
        // build keys
        const keyInv = `${prefix}/invoice/${invoiceFileName}`;
        const keyNd  = `${prefix}/nodues/${noDuesFileName}`;
        const keyGp  = `${prefix}/gatepass/${gatePassFileName}`;

        console.log('keyInv', keyInv);
        console.log('keyNd', keyNd);
        console.log('keyGp', keyGp);

        // Ensure docs object exists (Vue 2 reactive safe)
        if (!this.docs) {
          // create reactive docs on the component instance
          this.$set(this, 'docs', {});
        }

        // use the exact property names you declared in data()
this.form.docs.invoice = keyInv;
this.form.docs.nodues  = keyNd;
this.form.docs.gatepass = keyGp;

console.log('this.docs', JSON.stringify(this.docs, null, 2));



        const customerInvoicePayload = {
          billNumber,
          invoiceNumber,
          invoiceDate,
          inventoryUpdateRef: null,
          billRef: null,
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
          accessories: (this.form.accessories || [])
            .filter(acc => acc?.name && Number(acc?.qty) > 0 && Number(acc?.price) > 0)
            .map(acc => ({
              name: acc.name,
              qty: Number(acc.qty || 0),
              price: Number(acc.price || 0),
              amount: Number(acc.qty || 0) * Number(acc.price || 0)
            })),
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
          docs: this.docs,
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
          billOptions: { ...(this.form.billOptions || {}) },
          meta: {
            createdAt: now.toISOString(),
            createdBy: (this.$store?.state?.user?.email) || null
          },
          rawForm: { ...(this.form || {}) }
        };

        console.log('customerInvoicePayload', JSON.stringify(customerInvoicePayload, null, 2))

        // 1) SAVE CUSTOMER INVOICE
        const custInvResp = await fetch(`${this.BASE}/customerInvoice`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(customerInvoicePayload)
        });

        const custInvData = await custInvResp.json().catch(() => ({}));

        if (!custInvResp.ok) {
          this.$emit('notify', { text: custInvData?.message || `Customer invoice save failed (HTTP ${custInvResp.status})`, color: 'warning' });
          this.openInvoice();
          return;
        }

        if (custInvData?.billNumber && !this.inv?.number) this.inv.number = custInvData.billNumber;

        // 2) UPDATE INVENTORY (SOLD)
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

        this.snack = { show: true, color: 'success', text: invData?.message || 'Inventory updated (marked SOLD)' };
        this.$emit('notify', { text: custInvData?.message || 'Customer invoice saved', color: 'success' });

        // open invoice (existing behavior)
        this.openInvoice();

        // generate + upload PDFs and inform backend about stored keys (non-blocking errors handled)
        try {
          await this.generateAndUploadPdfsAfterSubmit();
        } catch (errUploads) {
          console.warn('PDF upload error (non-fatal):', errUploads);
        }

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
    
    async downloadNoDuesPdf () {
      if (Number(this.dueAmount || 0) !== 0) {
        this.snack = { show: true, color: 'error', text: 'No Dues PDF available only when Due = ₹0' };
        return;
      }
      let logoSrc;
      try {
        logoSrc = require('@/assets/newLogoTVS.png');
      } catch (err) {
        logoSrc = '@/assets/newLogoTVS.png';
      }
      const wrapper = document.createElement('div');
      wrapper.style.width = '794px';
      wrapper.style.padding = '24px';
      wrapper.style.boxSizing = 'border-box';
      wrapper.style.fontFamily = 'Arial, Helvetica, sans-serif';
      wrapper.style.color = '#000';
      wrapper.style.background = '#fff';

      const invNum = this.inv.number || (this.form.chassisNumber ? `INV-${this.form.chassisNumber}` : 'NA');
      const invDate = this.inv.date || new Date().toLocaleDateString('en-GB');

      const customerName = this.form.owner.ownershipType === 'FIRM' ? (this.form.firm.name || '-') : (this.form.customer.name || '-');
      const chassis = this.form.chassisNumber || '-';
      const model = this.form.model || '-';
      const amountWords = this.amountInWords || '';
      const companyName = 'ANSARI AUTOMOBILES';

      wrapper.innerHTML = `
        <div style="text-align:center; margin-bottom:10px;">
          <img src="${logoSrc}" alt="Logo" style="height:70px; display:block; margin:0 auto 8px;" />
          <div style="font-weight:700; font-size:18px;">${companyName}</div>
          <div style="font-size:12px; margin-top:4px;">BADI KAMHARIYA BY PASS ROAD, MAU</div>
          <hr style="margin:16px 0; border:none; border-top:1px solid #ccc;" />
        </div>

        <div style="text-align:center; margin:8px 0 18px;">
          <div style="font-size:22px; font-weight:700; letter-spacing:1px;">NO DUES CERTIFICATE</div>
          <div style="font-size:12px; color:#444; margin-top:6px;">(This certifies that the customer has cleared all dues)</div>
        </div>

        <div style="font-size:14px; line-height:1.6;">
          <div><strong>Invoice No:</strong> ${invNum}</div>
          <div><strong>Invoice Date:</strong> ${invDate}</div>
          <div style="margin-top:8px;"><strong>Customer Name:</strong> ${customerName}</div>
          <div><strong>Model / Chassis:</strong> ${model} / ${chassis}</div>
          <div style="margin-top:8px;"><strong>Bill Grand Total:</strong> ${this.money(this.billGrandTotal)}</div>
          <div><strong>Amount Paid:</strong> ${this.money(this.totalPaid)}</div>
          <div style="margin-top:12px; background:#f7f7f7; padding:10px; border-radius:4px;">
            <strong>Status:</strong> <span style="color:green; font-weight:700;">No Outstanding Dues (₹0)</span>
          </div>

          <div style="margin-top:14px;">
            This is to certify that <strong>${customerName}</strong> has no outstanding dues against the above invoice as on <strong>${invDate}</strong>. All payments have been received and the account stands settled for the referenced vehicle.
          </div>

          <div style="margin-top:10px;"><em>Amount (in words):</em> ${amountWords}</div>
        </div>

        <div style="display:flex; justify-content:space-between; margin-top:36px; align-items:flex-end;">
          <div style="width:60%;">
            <div style="font-size:12px; color:#666;">This certificate is system generated and does not require a physical signature.</div>
          </div>
          <div style="width:35%; text-align:center;">
            <div style="height:60px;"></div>
            <div style="border-top:1px solid #000; padding-top:6px; font-size:13px;">Authorised Signatory</div>
            <div style="font-size:12px; color:#666; margin-top:4px;">${companyName}</div>
          </div>
        </div>
      `;

      document.body.appendChild(wrapper);

      const opt = {
        margin: [16, 16, 16, 16],
        filename: `NoDues_${invNum || 'NA'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, backgroundColor: '#ffffff', useCORS: true },
        jsPDF: { unit: 'pt', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['css', 'legacy'] }
      };

      try {
        await html2pdf().set(opt).from(wrapper).save();
        this.snack = { show: true, color: 'success', text: 'No Dues PDF saved' };
      } catch (err) {
        console.error('No Dues PDF error', err);
        this.snack = { show: true, color: 'error', text: 'Failed to generate No Dues PDF' };
      } finally {
        if (wrapper && wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
      }
    },

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
/* --------------------
   Utility & base
   -------------------- */
:root{
  --accent:#222;
  --muted:#666;
  --border:#e6e6e6;
  --primary:#0d6efd;
  --danger:#ff4d4f;
  --success:#0b7a27;
  --error:#c1121f;
}
*{box-sizing:border-box}
body{font-family:Inter, Arial, Helvetica, sans-serif;margin:0;color:#111}

/* text align helpers */
.c{ text-align:center; }
.r{ text-align:right; }

/* muted text */
.muted{ color:var(--muted); font-size:11px; }

/* --------------------
   Buttons / inputs
   -------------------- */
.btn{
  display:inline-block;
  padding:8px 14px;
  border-radius:8px;
  background:var(--primary);
  color:#fff;
  font-weight:600;
  border:none;
  cursor:pointer;
  user-select:none;
}
.btn:hover{ filter:brightness(0.95) }
.btn.ghost{
  background:transparent;
  color:#333;
  border:1px solid #d0d0d0;
}
.btn.primary{ background:var(--primary); color:#fff; }
.btn.small{ padding:6px 10px; font-weight:500; }

/* file input wrapper */
.choose-file{ display:inline-block; position:relative; }
.choose-file input[type="file"]{
  position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer;
}

/* --------------------
   Upload / files / thumbs
   -------------------- */
/* shared card look for thumbs & nominee-thumb */
.card-like{
  background:#fff;
  border:1px solid #eee;
  border-radius:10px;
  overflow:hidden;
  box-shadow:0 1px 2px rgba(0,0,0,0.04);
}

/* nominee (two-column small preview) */
.nominee-thumb{
  position:relative;
  display:grid;
  grid-template-columns:120px 1fr;
  gap:10px;
  align-items:center;
  padding:8px;
}
.nominee-thumb.card-like{ /* reuse card look */
  border-radius:10px;
  padding:8px;
}
.nominee-thumb img{
  width:120px;
  height:90px;
  object-fit:cover;
  border-radius:8px;
}

/* general thumbnails grid */
.thumbs{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(140px,1fr));
  gap:10px;
  margin-bottom:12px;
}
.thumb{ position:relative; }
.thumb.card-like{ border-radius:10px; }
.thumb img{ width:100%; height:100px; object-fit:cover; display:block; }
.thumb-meta, .nominee-thumb .thumb-meta{ padding:8px; }
.thumb-meta .name, .nominee-thumb .thumb-meta .name{
  font-size:12px; font-weight:600;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.thumb-meta .size, .nominee-thumb .thumb-meta .size{
  font-size:11px; color:var(--muted); margin-top:2px;
}

/* remove button shared */
.thumb .remove, .nominee-thumb .remove{
  position:absolute; top:6px; right:6px;
  background:var(--danger); color:#fff; border-radius:14px;
  width:22px; height:22px; line-height:20px; cursor:pointer; border:none;
}
.thumb .remove:hover, .nominee-thumb .remove:hover{ filter:brightness(0.95) }

/* non-image file list */
.uploader{
  border:1px dashed #d6d6d6; padding:12px; border-radius:10px; background:#fafafa;
}
.list .row{
  display:flex; align-items:center; justify-content:space-between;
  background:#fff; border:1px solid #eee; border-radius:8px;
  padding:8px 10px; margin-bottom:8px;
}
.list .row .name{ font-weight:600; }
.list .row .muted{ font-size:12px; color:var(--muted); margin-top:2px; }
.grow{ flex:1; }

/* progress */
.progress{ margin-top:8px; font-size:12px; color:#333; }

/* --------------------
   Panels / section (single unified definition)
   -------------------- */
.elevated-panels .v-expansion-panel{
  border:1px solid #e5e7eb;
  border-radius:10px;
  margin-bottom:12px;
  overflow:hidden;
}
.panel-title{ font-weight:700; color:#0b5aa2; background:#eef6ff; padding:8px; }
.section-wrap{
  border:1px solid #e5e7eb;
  border-radius:8px;
  padding:12px;
  margin-bottom:12px;
  background:#fff;
}
.section-head{ font-weight:700; color:#333; margin-bottom:8px; }
.mini-title{ font-weight:600; color:#444; margin:4px 0 8px; }

/* stepper tweak */
.v-stepper__header{ box-shadow:none; border-bottom:1px solid #e0e0e0; }
.v-stepper__step--active .v-stepper__step__step{ background-color:#1976d2; }

/* --------------------
   Invoice / bill layout (A4 / landscape helpers)
   -------------------- */
.bill-a4{
  border:2px solid #000;
  margin:10 auto; background:#fff; color:#000; padding:10px 10px;
  font-size:12px; box-sizing:border-box; font-family:Inter, Arial, Helvetica, sans-serif;
}
/* .bill-a4{ width:794px; border:2px solid #000; } /* A4 portrait @ ~96dpi */
/* .bill-a4-landscape{ width:1122px; border:1px solid #ccc; } */ 

/* invoice header */
.invoice-header{
  display:flex; flex-direction:row; justify-content:space-between; align-items:center;
  gap:12px; border:2px solid #000; border-bottom:1px solid #000; padding:6px 8px; background:#fff;
}
.inv-left{ display:flex; align-items:center; padding-left:6px; }
.inv-logo{ max-width:160px; height:auto; object-fit:contain; display:block; }
.inv-title{ text-align:center; padding:6px 12px; font-weight:700; font-size:14px; letter-spacing:1px; width:100%; }
.inv-right{ text-align:right; padding-right:8px; min-width:180px; }
.company-name{ font-weight:700; font-size:14px; text-transform:uppercase; }
.company-lines{ margin-top:4px; font-size:11px; color:#111; }
.company-lines .small{ font-size:10px; color:#333; margin-top:2px; }

/* responsive header tweaks */
@media (max-width:900px){
  .invoice-header{ grid-template-columns:120px 1fr 160px; }
  .inv-logo{ max-width:110px; }
  .inv-title{ font-size:13px; padding:5px 8px; }
  .company-name{ font-size:12px; }
}

/* meta row */
.meta-row{
  display:flex; justify-content:space-between; margin:0; padding:10px;
  border-top:1px solid #000; border-bottom:1px solid #000; border-left:2px solid #000; border-right:2px solid #000;
}

/* address / bill-to */
.addr-wrap{ display:flex; margin:0; }
.addr{
  flex:1;
  border-top:1px solid #000; border-bottom:1px solid #000;
  border-left:2px solid #000; border-right:2px solid #000;
  padding:8px; min-height:86px;
}
.b{ font-weight:700; }

/* nominee strip */
.nominee-strip{
  display:flex; gap:8px;
  border-top:1px solid #000; border-bottom:1px solid #000;
  border-left:2px solid #000; border-right:2px solid #000;
  padding:8px; margin:0;
}
.nominee-strip > div{ flex:1; }
.cap{ font-weight:700; font-size:11px; }

/* --------------------
   Tables (unified, replaced grid-land/grid)
   -------------------- */
.grid, .grid-land{
  width:100%; border-collapse:collapse; margin-top:0px; padding:5px;
}
/* .grid th, .grid td, .grid-land th, .grid-land td{
  border-left:2px solid #000; border-right:2px solid #000; border-top:1px solid #000; border-bottom:1px solid #000; padding:8px 10px; vertical-align:top;
}
.grid thead th, .grid-land thead th{ background:#f5f5f5; font-weight:700; text-align:left; } */
.grid .r, .grid-land .r{ text-align:right; }
.grid .c, .grid-land .c{ text-align:center; }
.sub-info{ color:#444; font-weight:600; font-size:11px; line-height:1.3; }
.sub-total-row{ background:#f9f9f9; font-weight:700; }

/* small margin helpers */
.mt-3{ margin-top:12px }
.mt-4{ margin-top:16px }

/* --------------------
   Amounts / totals
   -------------------- */
.amount-block{ display:flex; gap:12px; margin:0; align-items:flex-start; }
.charges{ flex:1; font-size:11px; }
.totals-box{
  width:100%; border-left:2px solid #000; border-right:2px solid #000; border-top:1px solid #000;border-bottom:1px solid #000; padding:10px 20px; box-sizing:border-box;
}
.totals-box .row{ display:flex; justify-content:space-between; padding:3px 0; border-bottom:1px dashed #ddd; font-size:11px; }
.totals-box .row.grand{ font-weight:700; background:#f7f7f7; }
.totals-box .row.paid{ color:var(--success); font-weight:700; }
.totals-box .row.due{ color:var(--error); font-weight:700; }
.totals-box .row.disc{ color:#ff6b35; }

/* --------------------
   Bank / QR / Signature
   -------------------- */
.bank-qr-sign{
  display:flex; align-items:stretch; gap:0px;
  border-left:1px solid black; border-right:1px solid black;
}
.bank, .qr, .sign{
  flex:1; border:1px solid #000; padding:8px; min-height:120px;
}
.bank .row{ display:flex; justify-content:space-between; font-size:11px; padding:2px 8px; }
.qr .qr-box{ width:120px; height:120px; margin:8px auto 0; }

/* enquiry / declaration */
.enquiry-strip{ display:flex; justify-content:space-between; border:1px solid #000; }
.declaration{ font-size:12px; color:#000; margin-top:6px; }
.declaration ol{ margin:6px 0 0 16px; }

/* signature area */
.sign-declare-wrap{ display:flex; gap:12px; margin-top:12px; align-items:flex-end; }
.sig-area{ flex:1; display:flex; flex-direction:column; align-items:flex-end; }
.sig-line{ width:240px; height:40px; border-bottom:1px solid #000; margin-bottom:6px; }
.sig-caption{ font-size:12px; text-align:right; color:#333; }
.declare-land{ width:480px; border-top:1px solid #000; padding-top:8px; box-sizing:border-box; }

/* --------------------
   Misc / fallbacks
   -------------------- */
.list-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.actions .btn + .btn{ margin-left:8px; }

/* Small screen tweaks */
@media (max-width:600px){
  .container, .bill-a4, .bill-a4-landscape{ padding:12px; }
  .thumb img{ height:80px; }
  .nominee-thumb{ grid-template-columns: 100px 1fr; }
}


.big-label >>> .v-label {
  font-size: 16px !important;  /* adjust as you like */
}
</style>
