<template>
  <div style="margin:10px;" >
    <div v-if="showAddNewServiceDialog" style="padding:5px; width:100%; background-color:white;">
       <v-icon style="width:40px; height:40px; border:1px solid black; border-radius:50%;" @click="backtoTable()" left>mdi-arrow-left</v-icon>
    </div>
    
    <div v-if="!showAddNewServiceDialog">
      <!-- ===== LIST VIEW ===== -->
      <template v-if="!embedded.show">
        <v-card class="pa-4" elevation="6">
          <v-toolbar flat dense class="mb-3">
            <v-toolbar-title class="subtitle-1 font-weight-medium">
              Bike Service — Records
            </v-toolbar-title>
            <v-spacer />

            <!-- Download buttons -->
            <v-btn v-if="!showAddNewServiceDialog"
              small
              depressed
              class="mr-2"
              color="error"
              @click="downloadPdf"
              :loading="pdfBusy"
              :disabled="loading || pdfBusy || !rows.length"
              style="cursor:pointer;"
            >
              <v-icon left>mdi-file-pdf-box</v-icon>
              PDF
            </v-btn>

            <v-btn
              v-if="!showAddNewServiceDialog" 
              small
              depressed
              class="mr-2"
              color="info"
              @click="downloadSparePartsPdf"
              :loading="sparePartsPdfBusy"
              :disabled="loading || sparePartsPdfBusy || !filteredSpareParts.length"
              style="cursor:pointer;"
            >
              <v-icon left>mdi-file-document</v-icon>
              Spare Parts Report
            </v-btn>

            <v-btn
              v-if="!showAddNewServiceDialog" 
              small
              depressed
              class="mr-4"
              color="success"
              @click="downloadExcel"
              :disabled="loading || !rows.length"
              style="cursor:pointer;"
            >
              <v-icon style="cursor:pointer;" left>mdi-microsoft-excel</v-icon>
              Excel
            </v-btn>

            <v-btn v-if="!showAddNewServiceDialog" small style="cursor:pointer;" depressed color="primary" @click="loadAll" :loading="loading">
              <v-icon left>mdi-refresh</v-icon>
              Refresh
            </v-btn>
          </v-toolbar>

          <!-- Filters -->
          <v-card v-if="!showAddNewServiceDialog" class="pa-3 mb-3" outlined>
            <v-row dense>
              <v-col cols="12" md="3">
                <v-text-field dense outlined clearable hide-details
                  v-model.trim="filters.serviceNumber"
                  label="Service Number" prepend-inner-icon="mdi-pound"
                  @click:clear="loadAll"/>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field dense outlined clearable hide-details
                  v-model.trim="filters.customerName"
                  label="Customer Name" prepend-inner-icon="mdi-account"
                  @click:clear="loadAll"/>
              </v-col>
              <v-col cols="12" md="3">
                <v-text-field dense outlined clearable hide-details
                  v-model.trim="filters.phoneNumber"
                  label="Phone Number" prepend-inner-icon="mdi-phone"
                  @keyup.enter="runSearch"
                  @click:clear="loadAll"/>
              </v-col>
              <v-col cols="12" md="3">
                <v-select dense outlined clearable hide-details
                  v-model="filters.status"
                  label="Select Status" prepend-inner-icon="mdi-clock"
                  :items="statusOptions"
                  @click:clear="loadAll"/>
              </v-col>
              
              <v-col cols="12" md="3">
                <v-select dense outlined clearable hide-details
                  v-model="filters.serviceType"
                  label="Service Type" prepend-inner-icon="mdi-wrench"
                  :items="serviceTypeOptions"
                  @click:clear="loadAll"/>
              </v-col>
              
              <!-- From date -->
              <v-col cols="12" md="3">
                <v-menu v-model="menus.from" :close-on-content-click="false" max-width="320" offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field v-bind="attrs" v-on="on" dense outlined readonly clearable hide-details
                      label="From (DD/MM/YYYY)" prepend-inner-icon="mdi-calendar"
                      :value="displayDateSlash(filters.from)" @click:clear="filters.from=null"/>
                  </template>
                  <v-date-picker v-model="filters.from" @input="menus.from=false" scrollable />
                </v-menu>
              </v-col>

              <!-- To date -->
              <v-col cols="12" md="3">
                <v-menu v-model="menus.to" :close-on-content-click="false" max-width="320" offset-y>
                  <template v-slot:activator="{ on, attrs }">
                    <v-text-field v-bind="attrs" v-on="on" dense outlined readonly clearable hide-details
                      label="To (DD/MM/YYYY)" prepend-inner-icon="mdi-calendar"
                      :value="displayDateSlash(filters.to)" @click:clear="filters.to=null"/>
                  </template>
                  <v-date-picker v-model="filters.to" @input="menus.to=false" scrollable />
                </v-menu>
              </v-col>

              <v-col cols="12" md="3">
                <v-btn color="primary" @click="runSearch" :loading="loading">
                  <v-icon left>mdi-magnify</v-icon> Search
                </v-btn>
                <v-btn text @click="resetFilters" :disabled="loading">Clear</v-btn>
              </v-col>
            </v-row>
          </v-card>

          <!-- Statistics Cards -->
          <v-row v-if="!showAddNewServiceDialog && rows.length > 0" class="mb-3">
            <v-col cols="12" md="3">
              <v-card color="blue lighten-5" class="pa-3" flat>
                <div class="text-caption text--secondary">Total Services</div>
                <div class="text-h5 font-weight-bold">{{ rows.length }}</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card color="green lighten-5" class="pa-3" flat>
                <div class="text-caption text--secondary">Total Revenue</div>
                <div class="text-h5 font-weight-bold">₹{{ money(totalRevenue) }}</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card color="orange lighten-5" class="pa-3" flat>
                <div class="text-caption text--secondary">Pending Services</div>
                <div class="text-h5 font-weight-bold">{{ stats.pending }}</div>
              </v-card>
            </v-col>
            <v-col cols="12" md="3">
              <v-card color="purple lighten-5" class="pa-3" flat>
                <div class="text-caption text--secondary">Avg. Service Value</div>
                <div class="text-h5 font-weight-bold">₹{{ money(stats.averageValue) }}</div>
              </v-card>
            </v-col>
          </v-row>

          <!-- Spare Parts Summary (only shown when dates are selected) -->
          <v-expand-transition>
            <v-card v-if="filters.from && filters.to && filteredSpareParts.length > 0" class="pa-3 mb-3" color="blue-grey lighten-5" outlined>
              <v-row dense align="center">
                <v-col cols="12" md="9">
                  <div class="subtitle-2">Spare Parts Used in Selected Period</div>
                  <div class="caption">
                    Showing {{ filteredSpareParts.length }} parts from {{ filteredServices.length }} services 
                    between {{ displayDateSlash(filters.from) }} and {{ displayDateSlash(filters.to) }}
                  </div>
                  <div class="caption font-weight-medium">
                    Total Parts Value: ₹{{ money(filteredSparePartsTotalValue) }} | 
                    Total Quantity: {{ filteredSparePartsTotalQuantity }}
                  </div>
                </v-col>
                <v-col cols="12" md="3" class="text-right">
                  <v-btn small color="info" @click="showSparePartsDialog = true">
                    <v-icon left small>mdi-eye</v-icon>
                    View Details
                  </v-btn>
                  <v-btn small color="success" @click="downloadSparePartsPdf" class="ml-2">
                    <v-icon left small>mdi-download</v-icon>
                    PDF
                  </v-btn>
                </v-col>
              </v-row>
            </v-card>
          </v-expand-transition>

          <!-- Table -->
          <v-data-table v-if="!showAddNewServiceDialog"  
            :headers="headers"
            :items="rows"
            :loading="loading"
            :items-per-page="15"
            :footer-props="{ itemsPerPageOptions: [15, 30, 45, 60] }"
            class="elevation-1"
            item-key="serviceId"
            dense
            @click:row="openView"
          >
            <!-- Serial number column -->
            <template v-slot:item.serial="{ index }">
              {{ index + 1 }}
            </template>

            <!-- Date column -->
            <template v-slot:item.createdAt="{ item }">
              {{ fmtDate(item.createdAt) }}
            </template>

            <!-- Estimated Delivery Date -->
            <template v-slot:item.estimatedDelivery="{ item }">
              <v-chip small :color="getDeliveryColor(item.estimatedDelivery)" dark>
                {{ fmtDate(item.estimatedDelivery) }}
              </v-chip>
            </template>

            <!-- Total Amount -->
            <template v-slot:item.totalAmount="{ item }">
              <span class="font-weight-bold">₹{{ money(item.totalAmount) }}</span>
            </template>

            <!-- Parts Count -->
            <template v-slot:item.partsCount="{ item }">
              <v-chip small :color="item.partsCount > 0 ? 'primary' : 'grey'" dark>
                {{ item.partsCount || 0 }} items
              </v-chip>
            </template>

            <!-- Status -->
            <template v-slot:item.status="{ item }">
              <v-chip small :color="statusColor(item.status)" dark>
                {{ item.status || 'pending' }}
              </v-chip>
            </template>

            <!-- Service Type -->
            <template v-slot:item.serviceType="{ item }">
              <v-chip small :color="serviceTypeColor(item.serviceType)" dark outlined>
                {{ item.serviceType }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn icon small color="primary" v-on="on" @click.stop="openView(item)">
                    <v-icon small>mdi-eye</v-icon>
                  </v-btn>
                </template>
                <span>View Details</span>
              </v-tooltip>

              <!-- KEEP THIS: Quick Update Button (opens the Quick Edit Dialog) -->
              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn icon small color="orange" v-on="on" @click.stop="openEditDialog(item)">
                    <v-icon small>mdi-pencil</v-icon>
                  </v-btn>
                </template>
                <span>Quick Update</span>
              </v-tooltip>

              <v-tooltip top>
                <template v-slot:activator="{ on }">
                  <v-btn icon small color="success" v-on="on" @click.stop="openInvoiceOptionsDialog(item)">
                    <v-icon small>mdi-file-pdf</v-icon>
                  </v-btn>
                </template>
                <span>Download Invoice</span>
              </v-tooltip>
            </template>

            <template v-slot:no-data>
              <div class="pa-6 text-center grey--text">
                No service records found. Try changing filters or click "New Service" to add one.
              </div>
            </template>
          </v-data-table>

          <!-- View Dialog (Read-only) -->
          <v-dialog v-if="!showAddNewServiceDialog" v-model="dialogs.view" max-width="1200px" scrollable>
            <v-card v-if="currentService">
              <v-card-title class="subtitle-1">
                <v-icon left color="primary">
                  mdi-bike
                </v-icon>
                Service Details — {{ currentService.serviceNumber }}
                <v-spacer />
                <v-btn icon @click="closeDialog">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>
              <v-divider></v-divider>
              
              <!-- VIEW MODE ONLY (Read-only) -->
              <v-card-text>
                <!-- Service Header -->
                <v-row class="mb-4">
                  <v-col cols="12" md="6">
                    <div class="caption text--secondary">Customer Information</div>
                    <div class="font-weight-medium">{{ currentService.customerName }}</div>
                    <div class="caption">Phone: {{ currentService.phoneNumber }}</div>
                    <div class="caption" v-if="currentService.email">Email: {{ currentService.email }}</div>
                    <div class="caption">Bike: {{ currentService.bikeModel }}</div>
                    <div class="caption" v-if="currentService.registrationNumber">Reg. No: {{ currentService.registrationNumber }}</div>
                  </v-col>
                  <v-col cols="12" md="6" class="text-right">
                    <div class="caption text--secondary">Service Information</div>
                    <div class="font-weight-medium">Type: {{ currentService.serviceType }}</div>
                    <div class="caption">Service ID: {{ currentService.serviceId }}</div>
                    <div class="caption">Date: {{ fmtDate(currentService.createdAt) }}</div>
                    <div class="caption">Delivery: {{ fmtDate(currentService.estimatedDelivery) }}</div>
                    <v-chip small :color="statusColor(currentService.status)" class="mt-1" dark>
                      {{ currentService.status }}
                    </v-chip>
                  </v-col>
                </v-row>

                <!-- Service Notes -->
                <v-alert v-if="currentService.serviceNotes" type="info" dense outlined class="mb-4">
                  <div class="caption font-weight-bold">Service Notes:</div>
                  {{ currentService.serviceNotes }}
                </v-alert>

                <!-- Financial Summary -->
                <v-row v-if="showFinancials(currentService)" class="mb-4">
                  <v-col cols="12" md="6">
                    <v-card outlined class="pa-3">
                      <div class="caption text--secondary mb-2">Financial Summary</div>
                      <div class="d-flex justify-space-between mb-1">
                        <span>Parts Total:</span>
                        <span class="font-weight-medium">₹{{ money(calculatePartsTotal(currentService)) }}</span>
                      </div>
                      <div v-if="currentService.labourCharge" class="d-flex justify-space-between mb-1">
                        <span>Labour Charge:</span>
                        <span class="font-weight-medium">₹{{ money(currentService.labourCharge) }}</span>
                      </div>
                      <div v-if="currentService.discount" class="d-flex justify-space-between mb-1">
                        <span>Discount:</span>
                        <span class="font-weight-medium text-red">- ₹{{ money(currentService.discount) }}</span>
                      </div>
                      <div v-if="currentService.includeGST" class="d-flex justify-space-between mb-1">
                        <span>GST (18%):</span>
                        <span class="font-weight-medium">₹{{ money(calculateGST(currentService)) }}</span>
                      </div>
                      <v-divider class="my-2"></v-divider>
                      <div class="d-flex justify-space-between">
                        <span class="font-weight-bold">Grand Total:</span>
                        <span class="font-weight-bold text-green">₹{{ money(currentService.totalAmount || calculateGrandTotal(currentService)) }}</span>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>

                <!-- Parts Table -->
                <div class="caption text--secondary mb-2">Parts & Services</div>
                <v-simple-table dense class="mb-4">
                  <thead>
                    <tr>
                      <th class="text-left">Part Name</th>
                      <th class="text-left">Part Number</th>
                      <th class="text-left">Category</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Unit Price</th>
                      <th class="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="part in currentService.parts" :key="part.partId || part.tempId">
                      <td>{{ part.name }}</td>
                      <td>{{ part.partNumber || '—' }}</td>
                      <td>
                        <v-chip x-small :color="categoryColor(part.category)" dark>
                          {{ part.category }}
                        </v-chip>
                      </td>
                      <td class="text-right">{{ part.quantity }}</td>
                      <td class="text-right">₹{{ money(part.unitPrice) }}</td>
                      <td class="text-right font-weight-bold">₹{{ money(part.totalPrice || part.quantity * part.unitPrice) }}</td>
                    </tr>
                    <tr v-if="!currentService.parts || currentService.parts.length === 0">
                      <td colspan="6" class="text-center grey--text pa-4">
                        No parts added to this service
                      </td>
                    </tr>
                  </tbody>
                  <tfoot v-if="currentService.parts && currentService.parts.length > 0">
                    <tr>
                      <td colspan="4"></td>
                      <td class="text-right font-weight-bold">Total:</td>
                      <td class="text-right font-weight-bold">₹{{ money(calculatePartsTotal(currentService)) }}</td>
                    </tr>
                  </tfoot>
                </v-simple-table>

                <!-- Summary -->
                <v-divider class="my-3" />
                <v-row>
                  <v-col cols="6">
                    <div class="caption text--secondary">Service Summary</div>
                    <div>Total Items: <b>{{ currentService.partsCount || (currentService.parts ? currentService.parts.length : 0) }}</b></div>
                    <div>Total Quantity: <b>{{ calculateTotalQuantity(currentService) }}</b></div>
                  </v-col>
                  <v-col cols="6" class="text-right">
                    <div class="text-h6 text-primary">₹{{ money(currentService.totalAmount) }}</div>
                    <div class="caption">Service Amount</div>
                  </v-col>
                </v-row>
              </v-card-text>
              
              <v-divider></v-divider>
              <v-card-actions>
                <v-spacer />
                <v-btn color="success" @click="openInvoiceOptionsDialog(currentService)">
                  <v-icon left>mdi-file-pdf</v-icon>
                  Download Invoice
                </v-btn>
                <v-btn text @click="closeDialog">Close</v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Invoice Options Dialog -->
          <v-dialog v-model="dialogs.invoiceOptions" max-width="500px">
            <v-card>
              <v-card-title class="subtitle-1">
                <v-icon left>mdi-file-pdf</v-icon>
                Invoice Options
              </v-card-title>
              <v-divider></v-divider>
              <v-card-text class="pt-4">
                <div class="subtitle-2 mb-3">Select invoice type to download:</div>
                <v-radio-group v-model="selectedInvoiceType">
                  <v-radio value="customer" color="primary">
                    <template v-slot:label>
                      <div>
                        <div class="font-weight-medium">Customer Copy</div>
                        <div class="caption">Standard invoice for customer</div>
                      </div>
                    </template>
                  </v-radio>
                  <v-radio value="office" color="green">
                    <template v-slot:label>
                      <div>
                        <div class="font-weight-medium">Office Copy</div>
                        <div class="caption">Internal copy for office records</div>
                      </div>
                    </template>
                  </v-radio>
                  <v-radio value="both" color="orange">
                    <template v-slot:label>
                      <div>
                        <div class="font-weight-medium">Both Copies</div>
                        <div class="caption">Download Customer and Office copies</div>
                      </div>
                    </template>
                  </v-radio>
                </v-radio-group>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="dialogs.invoiceOptions = false">Cancel</v-btn>
                <v-btn color="primary" @click="downloadSelectedInvoice" :loading="pdfBusy">
                  <v-icon left>mdi-download</v-icon>
                  Download
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Simple Edit Dialog (Quick Status Update) - KEPT THIS -->
          <v-dialog v-if="!showAddNewServiceDialog" v-model="dialogs.edit" max-width="600px" persistent>
            <v-card v-if="editService">
              <v-card-title class="subtitle-1">
                <v-icon left>mdi-pencil</v-icon>
                Quick Update — {{ editService.serviceNumber }}
                <v-spacer />
                <v-btn icon @click="dialogs.edit=false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>
              <v-divider />
              <v-card-text>
                <v-form ref="quickEditForm" v-model="quickEditValid" lazy-validation>
                  <v-row dense>
                    <v-col cols="12" md="6">
                      <v-select dense outlined label="Status*" required
                        v-model="editService.status"
                        :items="statusOptions"
                        :rules="[v => !!v || 'Status is required']" />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-menu v-model="menus.quickEditDelivery" :close-on-content-click="false" max-width="320" offset-y>
                        <template v-slot:activator="{ on, attrs }">
                          <v-text-field v-bind="attrs" v-on="on" dense outlined readonly label="Delivery Date*"
                            :value="displayDateSlash(editService.estimatedDelivery)"
                            :rules="[v => !!v || 'Delivery date is required']" />
                        </template>
                        <v-date-picker v-model="editService.estimatedDelivery" @input="menus.quickEditDelivery=false" scrollable />
                      </v-menu>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea dense outlined label="Service Notes"
                        v-model="editService.serviceNotes"
                        rows="2"
                        placeholder="Update service notes..." />
                    </v-col>
                    <v-col cols="12">
                      <v-alert type="info" dense>
                        <div class="caption">Service ID: {{ editService.serviceId }}</div>
                        <div class="caption">Customer: {{ editService.customerName }}</div>
                        <div class="caption">Phone: {{ editService.phoneNumber }}</div>
                        <div class="caption">Total: ₹{{ money(editService.totalAmount) }}</div>
                      </v-alert>
                    </v-col>
                  </v-row>
                </v-form>
              </v-card-text>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="dialogs.edit=false">Cancel</v-btn>
                <v-btn color="primary" :loading="saving" @click="updateService">
                  <v-icon left>mdi-content-save</v-icon>
                  Update Service
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <!-- Spare Parts Details Dialog -->
          <v-dialog v-model="showSparePartsDialog" max-width="900px" scrollable>
            <v-card>
              <v-card-title class="subtitle-1">
                <v-icon left>mdi-cogs</v-icon>
                Spare Parts Report
                <v-spacer />
                <v-btn icon @click="showSparePartsDialog = false">
                  <v-icon>mdi-close</v-icon>
                </v-btn>
              </v-card-title>
              <v-divider></v-divider>
              
              <v-card-text>
                <div class="mb-4">
                  <div class="subtitle-2">Period: {{ displayDateSlash(filters.from) }} to {{ displayDateSlash(filters.to) }}</div>
                  <div class="caption">
                    Total {{ filteredServices.length }} services | {{ filteredSpareParts.length }} parts | 
                    Total Value: ₹{{ money(filteredSparePartsTotalValue) }}
                  </div>
                </div>

                <!-- Parts Summary Table -->
                <v-simple-table dense>
                  <thead>
                    <tr>
                      <th width="5%">#</th>
                      <th width="20%">Part Name</th>
                      <th width="15%">Part Number</th>
                      <th width="15%">Category</th>
                      <th width="10%" class="text-center">Qty</th>
                      <th width="15%" class="text-right">Unit Price</th>
                      <th width="20%" class="text-right">Total Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(part, index) in filteredSpareParts" :key="part.partId || part.tempId">
                      <td>{{ index + 1 }}</td>
                      <td>{{ part.name }}</td>
                      <td>{{ part.partNumber || '—' }}</td>
                      <td>
                        <v-chip x-small :color="categoryColor(part.category)" dark>
                          {{ part.category }}
                        </v-chip>
                      </td>
                      <td class="text-center">{{ part.quantity }}</td>
                      <td class="text-right">₹{{ money(part.unitPrice) }}</td>
                      <td class="text-right font-weight-bold">₹{{ money(part.totalPrice || part.quantity * part.unitPrice) }}</td>
                    </tr>
                    <tr v-if="!filteredSpareParts.length">
                      <td colspan="7" class="text-center grey--text pa-4">
                        No spare parts found for the selected period
                      </td>
                    </tr>
                  </tbody>
                  <tfoot v-if="filteredSpareParts.length > 0">
                    <tr>
                      <td colspan="4"></td>
                      <td class="text-center font-weight-bold">{{ filteredSparePartsTotalQuantity }}</td>
                      <td class="text-right font-weight-bold">Total:</td>
                      <td class="text-right font-weight-bold">₹{{ money(filteredSparePartsTotalValue) }}</td>
                    </tr>
                  </tfoot>
                </v-simple-table>

                <!-- Service-wise Breakdown (Accordion) -->
                <v-expansion-panels class="mt-4">
                  <v-expansion-panel>
                    <v-expansion-panel-header>
                      <div class="subtitle-2">Service-wise Breakdown ({{ filteredServices.length }} services)</div>
                    </v-expansion-panel-header>
                    <v-expansion-panel-content>
                      <div v-for="service in filteredServices" :key="service.serviceId" class="mb-3">
                        <div class="font-weight-medium caption">
                          {{ service.serviceNumber }} — {{ service.customerName }} — {{ fmtDate(service.createdAt) }}
                        </div>
                        <v-simple-table dense class="mt-1">
                          <thead>
                            <tr>
                              <th>Part Name</th>
                              <th class="text-center">Qty</th>
                              <th class="text-right">Price</th>
                              <th class="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-for="part in service.parts" :key="part.partId || part.tempId">
                              <td>{{ part.name }}</td>
                              <td class="text-center">{{ part.quantity }}</td>
                              <td class="text-right">₹{{ money(part.unitPrice) }}</td>
                              <td class="text-right">₹{{ money(part.quantity * part.unitPrice) }}</td>
                            </tr>
                            <tr v-if="!service.parts || service.parts.length === 0">
                              <td colspan="4" class="text-center grey--text">No parts in this service</td>
                            </tr>
                          </tbody>
                        </v-simple-table>
                      </div>
                    </v-expansion-panel-content>
                  </v-expansion-panel>
                </v-expansion-panels>
              </v-card-text>
              
              <v-divider></v-divider>
              <v-card-actions>
                <v-spacer />
                <v-btn text @click="showSparePartsDialog = false">Close</v-btn>
                <v-btn color="success" @click="downloadSparePartsPdf">
                  <v-icon left>mdi-download</v-icon>
                  Download PDF
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-dialog>

          <v-snackbar v-model="snack.show" :color="snack.color" timeout="2200">
            {{ snack.text }}
          </v-snackbar>
        </v-card>
      </template>

      <!-- Hidden container for html2pdf rendering -->
      <div ref="pdfContainer" style="display:none;"></div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import html2pdf from 'html2pdf.js'
import jsPDF from 'jspdf'
import logoImg from '@/assets/newLogoTVS.png';

export default {
  name: 'BikeServiceRecords',
  data () {
    return {
      base: process.env.VUE_APP_AGENCY_BACKEND_URL,
      loading: false,
      rows: [],
      allRows: [],
      headers: [
        { text: 'S.No', value: 'serial', width: 70, sortable: false },
        { text: 'Date', value: 'createdAt', width: 100 },
        { text: 'Service No.', value: 'serviceNumber', width: 160 },
        { text: 'Customer', value: 'customerName' },
        { text: 'Phone', value: 'phoneNumber', width: 120 },
        { text: 'Bike Model', value: 'bikeModel', width: 140 },
        { text: 'Service Type', value: 'serviceType', width: 120 },
        { text: 'Delivery', value: 'estimatedDelivery', width: 100 },
        { text: 'Amount', value: 'totalAmount', align: 'end', width: 120 },
        { text: 'Items', value: 'partsCount', align: 'center', width: 90 },
        { text: 'Status', value: 'status', width: 120 },
        { text: 'Actions', value: 'actions', sortable: false, align: 'end', width: 150 }
      ],
      filters: {
        serviceNumber: null,
        customerName: null,
        phoneNumber: null,
        status: null,
        serviceType: null,
        bikeModel: null,
        from: null,
        to: null
      },
      menus: { 
        from: false, 
        to: false,
        quickEditDelivery: false 
      },
      dialogs: { 
        view: false, 
        edit: false, // Keep edit dialog for quick update
        invoiceOptions: false 
      },
      currentService: null,
      editService: null,
      quickEditValid: true,
      saving: false,
      embedded: { show: false, serviceNumber: null },
      snack: { show: false, color: 'success', text: '' },
      pdfBusy: false,
      sparePartsPdfBusy: false,
      showAddNewServiceDialog: false,
      showSparePartsDialog: false,
      
      // Invoice options
      selectedInvoiceType: 'customer',
      invoiceService: null,
      
      // Data options
      statusOptions: ['pending', 'in_progress', 'completed', 'delivered', 'cancelled'],
      serviceTypeOptions: ['regular', 'repair', 'accident', 'custom', 'other'],
      
      // Statistics
      stats: {
        pending: 0,
        completed: 0,
        totalRevenue: 0,
        averageValue: 0
      },
      
      // Spare parts data (computed from services)
      filteredSpareParts: [],
      filteredServices: []
    }
  },

  computed: {
    currentDate () {
      return new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },
    totalRevenue () {
      return this.rows.reduce((sum, row) => sum + (row.totalAmount || 0), 0)
    },
    totalItems () {
      return this.rows.reduce((sum, row) => sum + (row.partsCount || 0), 0)
    },
    filteredSparePartsTotalValue () {
      return this.filteredSpareParts.reduce((sum, part) => {
        const quantity = part.quantity || 1
        const unitPrice = part.unitPrice || 0
        return sum + (quantity * unitPrice)
      }, 0)
    },
    filteredSparePartsTotalQuantity () {
      return this.filteredSpareParts.reduce((sum, part) => sum + (part.quantity || 1), 0)
    }
  },

  watch: {
    rows: {
      handler() {
        this.calculateStats()
        this.extractSparePartsFromFilteredRows()
      },
      deep: true
    },
    // Extract spare parts when date filters change
    'filters.from': function() {
      this.extractSparePartsFromFilteredRows()
    },
    'filters.to': function() {
      this.extractSparePartsFromFilteredRows()
    }
  },

  created () { 
    this.loadAll() 
    this.calculateStats()
  },

  methods: {
    // ===== SERVICE MANAGEMENT =====
    async loadAll () {
      this.loading = true
      try {
        const { data } = await axios.get(`${this.base}getALlServices`)
        
        if (data.success && data.data && data.data.services) {
          this.allRows = data.data.services
          this.rows = this.allRows.slice()
          this.extractSparePartsFromFilteredRows()
          this.notify(`Loaded ${this.rows.length} service records`, 'success')
        } else {
          this.allRows = []
          this.rows = []
          this.filteredSpareParts = []
          this.filteredServices = []
          this.notify('No service records found', 'info')
        }
      } catch (e) {
        console.error('Error loading services:', e)
        this.notify('Failed to load service records', 'error')
        this.allRows = []
        this.rows = []
        this.filteredSpareParts = []
        this.filteredServices = []
      } finally { 
        this.loading = false 
      }
    },

    calculateStats() {
      const stats = {
        pending: 0,
        completed: 0,
        totalRevenue: 0,
        averageValue: 0
      }
      
      this.rows.forEach(service => {
        if (service.status === 'pending' || service.status === 'in_progress') {
          stats.pending++
        } else if (service.status === 'completed' || service.status === 'delivered') {
          stats.completed++
        }
        stats.totalRevenue += service.totalAmount || 0
      })
      
      stats.averageValue = this.rows.length > 0 ? stats.totalRevenue / this.rows.length : 0
      this.stats = stats
    },

    // ===== SPARE PARTS EXTRACTION =====
    extractSparePartsFromFilteredRows() {
      // Clear previous data
      this.filteredSpareParts = []
      this.filteredServices = []
      
      if (!this.filters.from || !this.filters.to || !this.rows.length) {
        return
      }
      
      try {
        // Convert filter dates to comparable format
        const fromDate = new Date(this.filters.from)
        const toDate = new Date(this.filters.to)
        toDate.setHours(23, 59, 59, 999) // Include entire end day
        
        // Filter services by date range
        const servicesInRange = this.rows.filter(service => {
          if (!service.createdAt) return false
          
          const serviceDate = new Date(service.createdAt)
          return serviceDate >= fromDate && serviceDate <= toDate
        })
        
        this.filteredServices = servicesInRange
        
        if (!servicesInRange.length) {
          this.filteredSpareParts = []
          return
        }
        
        // Aggregate parts from all services in the range
        const partsMap = new Map()
        
        servicesInRange.forEach(service => {
          if (!service.parts || !Array.isArray(service.parts)) return
          
          service.parts.forEach(part => {
            const key = part.partNumber 
              ? `${part.name}_${part.partNumber}` 
              : part.name
            
            if (partsMap.has(key)) {
              // Update existing part
              const existing = partsMap.get(key)
              existing.quantity += part.quantity || 1
              existing.totalPrice = existing.quantity * existing.unitPrice
              // Track which services this part is used in
              if (!existing.services.includes(service.serviceNumber)) {
                existing.services.push(service.serviceNumber)
              }
            } else {
              // Add new part
              partsMap.set(key, {
                name: part.name || 'Unknown',
                partNumber: part.partNumber || '',
                category: part.category || 'other',
                quantity: part.quantity || 1,
                unitPrice: part.unitPrice || 0,
                totalPrice: (part.quantity || 1) * (part.unitPrice || 0),
                services: [service.serviceNumber]
              })
            }
          })
        })
        
        // Convert map to array and sort by total value (descending)
        this.filteredSpareParts = Array.from(partsMap.values())
          .sort((a, b) => b.totalPrice - a.totalPrice)
        
      } catch (error) {
        console.error('Error extracting spare parts:', error)
        this.filteredSpareParts = []
        this.filteredServices = []
      }
    },

    // ===== SPARE PARTS PDF DOWNLOAD =====
    async downloadSparePartsPdf() {
      if (!this.filteredSpareParts.length) {
        this.notify('No spare parts data to export', 'warning')
        return
      }

      if (this.sparePartsPdfBusy) return
      this.sparePartsPdfBusy = true

      try {
        const container = this.$refs.pdfContainer
        if (!container) {
          this.notify('PDF container missing', 'error')
          return
        }

        // Format dates for display
        const fromDate = this.displayDateSlash(this.filters.from)
        const toDate = this.displayDateSlash(this.filters.to)
        const generatedDate = this.currentDate

        // Create parts table rows
        const partsRows = this.filteredSpareParts.map((part, index) => `
          <tr>
            <td style="padding: 4px 6px; border: 1px solid #ccc; text-align: center;">${index + 1}</td>
            <td style="padding: 4px 6px; border: 1px solid #ccc;">${part.name.toUpperCase()}</td>
            <td style="padding: 4px 6px; border: 1px solid #ccc;">${part.partNumber.toUpperCase() || '—'}</td>
            <td style="padding: 4px 6px; border: 1px solid #ccc;">${part.category.toUpperCase()}</td>
            <td style="padding: 4px 6px; border: 1px solid #ccc; text-align: center;">${part.quantity}</td>
            <td style="padding: 4px 6px; border: 1px solid #ccc; text-align: right;">₹${this.money(part.unitPrice)}</td>
            <td style="padding: 4px 6px; border: 1px solid #ccc; text-align: right;">₹${this.money(part.totalPrice)}</td>
          </tr>
        `).join('')

       // Service summary (ALL services)
        const serviceSummary = this.filteredServices.map(service => `
          <div style="margin-bottom: 5px;">
            <span style="font-weight: bold;">${service.serviceNumber}:</span>
            ${service.customerName} — ₹${this.money(service.totalAmount)} (${service.parts?.length || 0} parts)
          </div>
        `).join('')

        container.innerHTML = `
          <div id="spare-parts-pdf" style="font-family: Arial, sans-serif; font-size: 10pt; padding: 15px; max-width: 210mm;">
            <!-- Header -->
            <div style="border-bottom: 1px solid #000; padding-bottom: 10px; margin-bottom: 15px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="width: 20%; vertical-align: top;">
                    <div style="width: 50px; height: 18px;"><img src="@/assets/newLogoTVS.png" /></div>
                  </td>
                  <td style="vertical-align: top; text-align: right;">
                    <div style="font-size: 14pt; font-weight: bold;">ANSARI AUTOMOBILES</div>
                    <div style="font-size: 9pt;">BADI KAMHARIYA, NEAR OVER BRIDGE BYPASS ROAD. DIST-MAU</div>
                    <div style="font-size: 9pt;">GSTIN-09AJ8P3403T812Y</div>
                    <div style="font-size: 9pt;">STATE - UTTAR PRADESH</div>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Report Title -->
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="font-size: 16pt; font-weight: bold; color: #1a237e;">SPARE PARTS USED REPORT</div>
              <div style="font-size: 11pt; font-weight: bold; color: #d32f2f;">
                Period: ${fromDate} to ${toDate}
              </div>
              <div style="font-size: 9pt; color: #666;">
                Generated on: ${generatedDate}
              </div>
            </div>

            <!-- Summary Stats -->
            <div style="display: flex; justify-content: space-between; background: #f5f5f5; padding: 10px; margin-bottom: 15px; border-radius: 4px;">
              <div style="text-align: center;">
                <div style="font-size: 10pt; font-weight: bold;">${this.filteredServices.length}</div>
                <div style="font-size: 8pt;">Services</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 10pt; font-weight: bold;">${this.filteredSpareParts.length}</div>
                <div style="font-size: 8pt;">Unique Parts</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 10pt; font-weight: bold;">${this.filteredSparePartsTotalQuantity}</div>
                <div style="font-size: 8pt;">Total Quantity</div>
              </div>
              <div style="text-align: center;">
                <div style="font-size: 10pt; font-weight: bold;">₹${this.money(this.filteredSparePartsTotalValue)}</div>
                <div style="font-size: 8pt;">Total Value</div>
              </div>
            </div>

            <!-- Parts Table -->
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 9pt;">
              <thead>
                <tr style="background-color: #1a237e; color: white;">
                  <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 5%;">#</th>
                  <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 25%;">PART NAME</th>
                  <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 15%;">PART NO</th>
                  <th style="border: 1px solid #000; padding: 6px; text-align: left; width: 15%;">CATEGORY</th>
                  <th style="border: 1px solid #000; padding: 6px; text-align: center; width: 10%;">QUANTITY</th>
                  <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 15%;">UNIT PRICE (₹)</th>
                  <th style="border: 1px solid #000; padding: 6px; text-align: right; width: 15%;">TOTAL VALUE (₹)</th>
                </tr>
              </thead>
              <tbody>
                ${partsRows}
                <tr style="background-color: #f5f5f5;">
                  <td colspan="4" style="padding: 6px; border: 1px solid #ccc; text-align: right; font-weight: bold;">GRAND TOTAL</td>
                  <td style="padding: 6px; border: 1px solid #ccc; text-align: center; font-weight: bold;">${this.filteredSparePartsTotalQuantity}</td>
                  <td style="padding: 6px; border: 1px solid #ccc;"></td>
                  <td style="padding: 6px; border: 1px solid #ccc; text-align: right; font-weight: bold;">₹${this.money(this.filteredSparePartsTotalValue)}</td>
                </tr>
              </tbody>
            </table>

            <!-- Service Summary -->
            <div style="margin-top: 20px; padding: 10px; border: 1px solid #ccc; background: #f9f9f9;">
              <div style="font-weight: bold; margin-bottom: 5px;">Service Summary (${this.filteredServices.length} services in period):</div>
              ${serviceSummary}
            </div>

            <!-- Category Breakdown -->
            <div style="margin-top: 20px;">
              <div style="font-weight: bold; margin-bottom: 5px;">Category-wise Distribution:</div>
              <table style="width: 100%; border-collapse: collapse; font-size: 8pt;">
                <thead>
                  <tr style="background-color: #e0e0e0;">
                    <th style="padding: 4px; border: 1px solid #ccc;">Category</th>
                    <th style="padding: 4px; border: 1px solid #ccc; text-align: center;">Parts</th>
                    <th style="padding: 4px; border: 1px solid #ccc; text-align: center;">Quantity</th>
                    <th style="padding: 4px; border: 1px solid #ccc; text-align: right;">Value</th>
                  </tr>
                </thead>
                <tbody>
                  ${this.getCategoryBreakdown().map(cat => `
                    <tr>
                      <td style="padding: 4px; border: 1px solid #ccc;">${cat.category.toUpperCase()}</td>
                      <td style="padding: 4px; border: 1px solid #ccc; text-align: center;">${cat.count}</td>
                      <td style="padding: 4px; border: 1px solid #ccc; text-align: center;">${cat.quantity}</td>
                      <td style="padding: 4px; border: 1px solid #ccc; text-align: right;">₹${this.money(cat.value)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Footer -->
            <div style="margin-top: 30px; font-size: 8pt; color: #666; text-align: center;">
              <div>Report generated by Ansari Automobiles Management System</div>
              <div>This is an internal document for inventory and sales analysis</div>
              <div style="margin-top: 15px; border-top: 1px solid #ccc; padding-top: 10px;">
                <div>For any queries, contact: 8050086427 (Sales) | 9648261555 (Service)</div>
                <div>Email: info@ansariautomobiles.com</div>
              </div>
            </div>
          </div>
        `

        await this.$nextTick()

        const el = container.querySelector('#spare-parts-pdf')
        if (!el) {
          this.notify('PDF element not found', 'error')
          return
        }

        const opt = {
          margin: [10, 10, 10, 10],
          filename: `Spare_Parts_Report_${fromDate}_to_${toDate}_${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false,
            letterRendering: true
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          }
        }

        await html2pdf().set(opt).from(el).save()
        
        container.innerHTML = ''
        this.notify(`Spare parts report downloaded for ${fromDate} to ${toDate}`, 'success')
        
      } catch (error) {
        console.error('Error downloading spare parts report:', error)
        this.notify('Failed to download spare parts report', 'error')
      } finally {
        this.sparePartsPdfBusy = false
      }
    },

    getCategoryBreakdown() {
      const categories = {}
      
      this.filteredSpareParts.forEach(part => {
        const category = part.category || 'other'
        if (!categories[category]) {
          categories[category] = {
            category,
            count: 0,
            quantity: 0,
            value: 0
          }
        }
        
        categories[category].count++
        categories[category].quantity += part.quantity || 1
        categories[category].value += part.totalPrice || (part.quantity || 1) * (part.unitPrice || 0)
      })
      
      return Object.values(categories).sort((a, b) => b.value - a.value)
    },

    // ===== DIALOG MANAGEMENT =====
    openView (item) {
      this.currentService = item
      this.dialogs.view = true
    },

    openEditDialog (item) {
      this.editService = { ...item }
      this.dialogs.edit = true
    },

    closeDialog () {
      this.dialogs.view = false
      this.currentService = null
    },

    // ===== CALCULATION METHODS =====
    calculatePartsTotal(service) {
      if (!service || !service.parts) return 0
      return service.parts.reduce((sum, part) => {
        const quantity = part.quantity || 1
        const unitPrice = part.unitPrice || 0
        return sum + (quantity * unitPrice)
      }, 0)
    },

    calculateTotalQuantity(service) {
      if (!service || !service.parts) return 0
      return service.parts.reduce((sum, part) => sum + (part.quantity || 1), 0)
    },

    calculateGST(service) {
      if (!service || !service.includeGST) return 0
      const partsTotal = this.calculatePartsTotal(service)
      const labourCharge = service.labourCharge || 0
      const discount = service.discount || 0
      const subtotal = partsTotal + labourCharge - discount
      return subtotal * 0.18
    },

    calculateGrandTotal(service) {
      const partsTotal = this.calculatePartsTotal(service)
      const labourCharge = service.labourCharge || 0
      const discount = service.discount || 0
      const subtotal = partsTotal + labourCharge - discount
      const gst = service.includeGST ? subtotal * 0.18 : 0
      return subtotal + gst
    },

    showFinancials(service) {
      return service.labourCharge > 0 || service.discount > 0 || service.includeGST
    },

    // ===== INVOICE MANAGEMENT =====
    openInvoiceOptionsDialog(service) {
      this.invoiceService = service
      this.selectedInvoiceType = 'customer'
      this.dialogs.invoiceOptions = true
    },

    async downloadSelectedInvoice() {
      if (!this.invoiceService) return
      
      this.dialogs.invoiceOptions = false
      
      if (this.selectedInvoiceType === 'both') {
        // Generate combined PDF with both copies
        await this.generateCombinedPDF(this.invoiceService);
      } else {
        // Generate single PDF
        await this.generateSinglePDF(this.invoiceService, this.selectedInvoiceType);
      }
      
      this.invoiceService = null
    },

    async generateCombinedPDF(service) {
      try {
        this.pdfBusy = true;
        this.notify('Generating combined invoice PDF...', 'info');

        const doc = new jsPDF('p', 'mm', 'a4');
        
        // Add Customer Copy
        this.addPDFPage(doc, service, 'CUSTOMER COPY');
        
        // Add Office Copy
        doc.addPage();
        this.addPDFPage(doc, service, 'OFFICE COPY');
        
        // Save the PDF
        const fileName = `Invoice_${service.serviceNumber || service.serviceId}_Combined_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        
        this.notify('Combined PDF with Customer and Office copies downloaded!', 'success');
        
      } catch (err) {
        console.error(err);
        this.notify('Failed to generate combined PDF', 'error');
      } finally {
        this.pdfBusy = false;
      }
    },

    async generateSinglePDF(service, copyType = 'customer') {
      try {
        this.pdfBusy = true;
        this.notify(`Generating ${copyType} invoice PDF...`, 'info');

        const copyText = copyType === 'office' ? 'OFFICE COPY' : 'CUSTOMER COPY';
        const doc = this.createPDF(service, copyText);
        
        // Save the PDF
        const fileName = `Invoice_${service.serviceNumber || service.serviceId}_${copyType}_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(fileName);
        
        this.notify(`${copyType === 'office' ? 'Office' : 'Customer'} invoice downloaded for ${service.serviceNumber}`, 'success');
        
      } catch (err) {
        console.error(err);
        this.notify('Failed to generate PDF', 'error');
      } finally {
        this.pdfBusy = false;
      }
    },

    formatPaymentMode(mode) {
      const modeMap = {
        'cash': 'Cash',
        'creditCard': 'Credit Card',
        'debitCard': 'Debit Card',
        'upi': 'UPI',
        'netBanking': 'Net Banking',
        'cheque': 'Cheque',
        'onlineTransfer': 'Online Transfer',
        'wallet': 'Wallet',
        'credit': 'Credit (Account)',
        'other': 'Other'
      };
      return modeMap[mode] || 'Cash';
    },

    addPDFPage(doc, service, copyType) {
      const pageWidth = doc.internal.pageSize.width;
      const margin = 10;
      let yPos = 10;

      // Logo (placeholder - you'll need to add your logo)
      const logoWidth = 50;
      const logoHeight = 18;
      const logoX = 4;
      const logoY = yPos - 5;
      doc.addImage(logoImg, 'PNG', logoX, logoY, logoWidth, logoHeight);
      
      // Text positioning
      const textX = logoX + logoWidth + 5;
      const textWidth = pageWidth - margin - textX;
      
      // Company name
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('ANSARI AUTOMOBILES', textX + textWidth, yPos, { align: 'right' });
      yPos += 5;

      // Address and details
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const addressLine1 = 'BADI KAMHARIYA, NEAR OVER BRIDGE BYPASS ROAD. DIST-MAU';
      const gstin = 'GSTIN-09AJ8P3403T812Y';
      const state = 'STATE - UTTAR PRADESH';
      
      const maxCharsPerLine = Math.floor(textWidth / (doc.internal.getFontSize() / 3.5));
      
      if (addressLine1.length > maxCharsPerLine) {
        const midPoint = Math.floor(addressLine1.length / 2);
        let splitPoint = addressLine1.lastIndexOf(' ', midPoint);
        if (splitPoint === -1) splitPoint = midPoint;
        
        const line1 = addressLine1.substring(0, splitPoint);
        const line2 = addressLine1.substring(splitPoint + 1);
        
        doc.text(line1, textX + textWidth, yPos, { align: 'right' });
        yPos += 4;
        doc.text(line2, textX + textWidth, yPos, { align: 'right' });
        yPos += 4;
      } else {
        doc.text(addressLine1, textX + textWidth, yPos, { align: 'right' });
        yPos += 5;
      }
      
      doc.text(gstin, textX + textWidth, yPos, { align: 'right' });
      yPos += 5;
      
      doc.text(state, textX + textWidth, yPos, { align: 'right' });
      yPos += 10;

      const textBottom = yPos;
      const logoBottom = logoY + logoHeight;
      if (logoBottom > textBottom) {
        yPos = logoBottom + 5;
      }

      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 10;

      // Copy type
      if (copyType) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 0, 0);
        doc.text(copyType, pageWidth / 2, yPos, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        yPos += 8;
      }

      // Invoice info
      const invoiceNumber = service.serviceNumber || service.serviceId;
      const invoiceDate = this.fmtDate(service.createdAt || new Date());

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      doc.text(`Invoice No: ${invoiceNumber}`, margin, yPos);
      doc.text(`Invoice Date: ${invoiceDate}`, pageWidth - margin - 5, yPos, {
        align: 'right'
      });
      yPos += 6;

      doc.setLineWidth(0.2);
      doc.line(margin, yPos, pageWidth - margin, yPos);
      yPos += 6;

      // Bill to
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('BILL TO:', margin, yPos);
      yPos += 6;

      doc.setFontSize(10);
      const formatName = (name) => {
        if (!name) return 'N/A';
        return name
          .toLowerCase()
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');
      };
      
      const customerInfo = [
        `CUSTOMER NAME : ${formatName(service.customerName) || 'N/A'}`,
        `MOBILE NO : ${service.phoneNumber || 'N/A'}`,
        `BIKE MODEL : ${(service.bikeModel || 'N/A').toUpperCase()}`,
        `PAYMENT MODE : ${this.formatPaymentMode((service.paymentMode)) || 'N/A'.toUpperCase()}`,
      ];
      
      // Add service ID for office copy
      if (copyType === 'OFFICE COPY') {
        customerInfo.push(`SERVICE ID : ${service.serviceId}`);
      }
      
      customerInfo.forEach((line, index) => {
        doc.text(line, margin, yPos + (index * 4));
      });
      yPos += customerInfo.length * 4 + 4;

      // Table
      const usableWidth = pageWidth - (2 * margin);
      const colWidths = [
        usableWidth * 0.15,
        usableWidth * 0.45,
        usableWidth * 0.10,
        usableWidth * 0.15,
        usableWidth * 0.15
      ];
      let tableY = yPos;

      // Table header
      doc.setFillColor(241, 241, 241);
      doc.rect(margin, tableY, usableWidth, 7, 'F');
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');

      const col1 = margin + 2;
      const col2 = col1 + colWidths[0];
      const col3 = col2 + colWidths[1];
      const col4 = col3 + colWidths[2];
      const col5 = col4 + colWidths[3];

      doc.text('PART NO', col1, tableY + 4.5);
      doc.text('DESCRIPTION', col2, tableY + 4.5);
      doc.text('QTY', col4 - 4, tableY + 4.5, { align: 'right' });
      doc.text('PRICE', col5 - 4, tableY + 4.5, { align: 'right' });
      doc.text('AMOUNT', margin + usableWidth - 4, tableY + 4.5, { align: 'right' });

      doc.rect(margin, tableY, usableWidth, 7);
      tableY += 7;

      // Table rows
      const parts = service.parts || [];
      parts.forEach((part, index) => {
        if (tableY > 270) {
          doc.addPage();
          tableY = 15;
        }

        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 250);
          doc.rect(margin, tableY, usableWidth, 7, 'F');
        }

        doc.setDrawColor(200);
        doc.rect(margin, tableY, usableWidth, 7);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);

        const partNumber = part.partNumber ? part.partNumber.toUpperCase() : '-';
        doc.text(partNumber, col1, tableY + 4.5);

        const description = (part.name || '').toUpperCase();
        doc.text(description, col2 + 2, tableY + 4.5);

        // Check for warranty (assuming part.hasWarranty or part.isWarranty property)
        const isWarranty = part.hasWarranty || part.isWarranty || false;
        if (isWarranty) {
          doc.setFontSize(7);
          doc.setTextColor(255, 0, 0);
          doc.text('WARRANTY', col2 + 2, tableY + 8);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
        }

        doc.setFont('courier', 'normal');

        doc.text(
          String(part.quantity || 1),
          col4 - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        // Show 0 price for warranty items
        const priceToShow = isWarranty ? 0 : (part.unitPrice || 0);
        doc.text(
          this.formatNumberForPDF(priceToShow),
          col5 - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        // Calculate amount - 0 for warranty items
        const amount = isWarranty ? 0 : (part.quantity || 1) * (part.unitPrice || 0);
        
        doc.text(
          this.formatNumberForPDF(amount),
          margin + usableWidth - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        tableY += 7;
      });

      doc.line(margin, tableY, margin + usableWidth, tableY);
      tableY += 5;

      // Calculate totals
      const partsTotal = this.calculatePartsTotal(service);
      const warrantySavings = this.calculateWarrantySavings(service);
      const discount = service.discount || 0;
      const discountType = service.discountType || 'none';
      const discountValue = service.discountValue || 0;
      const labourCharge = service.labourCharge || 0;
      const subTotal = partsTotal + labourCharge - discount;
      const gst = service.includeGST ? subTotal * 0.18 : 0;
      const grandTotal = subTotal + gst;

      // Totals with warranty discount
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);

      const calculations = [
        { label: 'Parts Total:', value: partsTotal + warrantySavings }, // Show original total
      ];

      if (warrantySavings > 0) {
        calculations.push({ label: 'Warranty Discount:', value: -warrantySavings });
      }

      if (labourCharge > 0) {
        calculations.push({ label: 'Labour Charge:', value: labourCharge });
      }

      if (discount > 0) {
        let discountLabel = 'Discount:';
        if (discountType === 'percentage') {
          discountLabel = `Discount (${discountValue}%):`;
        }
        calculations.push({ label: discountLabel, value: -discount });
      }

      calculations.push({ label: 'Sub Total:', value: subTotal });

      if (service.includeGST) {
        calculations.push({ label: 'GST (18%):', value: gst });
      }

      calculations.push({ label: 'Grand Total:', value: grandTotal, isGrandTotal: true });

      calculations.forEach((calc, index) => {
        const lineY = tableY + (index * 4);
        
        if (calc.isGrandTotal) {
          doc.setFontSize(10);
          doc.setTextColor(0, 120, 0);
        } else if (calc.label === 'Warranty Discount:') {
          doc.setTextColor(255, 0, 0);
        }
        
        doc.setFont('helvetica', calc.isGrandTotal ? 'bold' : 'bold');
        doc.text(calc.label, col4 - 10, lineY);
        
        doc.setFont('courier', calc.isGrandTotal ? 'bold' : 'normal');
        
        const formattedValue = calc.value < 0 ? 
          `- ${this.formatNumberForPDF(Math.abs(calc.value))}` : 
          this.formatNumberForPDF(calc.value);
        
        doc.text(formattedValue, margin + usableWidth - 4, lineY, {
          align: 'right'
        });
        
        if (calc.isGrandTotal || calc.label === 'Warranty Discount:') {
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
        }
      });

      tableY += (calculations.length * 4) + 8;

      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      const contactInfo = 'Sales Enquiry: 8050086427  |  Service Enquiry: 9648261555';
      doc.text(contactInfo, margin, tableY);
      tableY += 4;
      
      doc.setFont('helvetica', 'bold');
      doc.text('For Ansari Automobiles', pageWidth - margin, tableY, {
        align: 'right'
      });
      tableY += 6;

      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', margin, tableY);
      tableY += 3;
      
      doc.setFont('helvetica', 'normal');
      const terms = [
        '1. Goods once sold will not be taken back.',
        '2. Subject to Mau jurisdiction.'
      ];
      
      terms.forEach((term, index) => {
        doc.text(term, margin, tableY + (index * 3));
      });

      // Service Info Footer (Only for office copy)
      if (copyType === 'OFFICE COPY') {
        tableY += 15;
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        
        const serviceInfo = [
          `Service ID: ${service.serviceId}`,
          `Service Type: ${service.serviceType}`,
          `Estimated Delivery: ${this.fmtDate(service.estimatedDelivery)}`,
          `Status: ${service.status}`,
          `Customer Phone: ${service.phoneNumber}`
        ];
        
        if (service.serviceNotes) {
          serviceInfo.push(`Notes: ${service.serviceNotes}`);
        }
        
        serviceInfo.forEach((info, index) => {
          doc.text(info, margin, tableY + (index * 3));
        });
      }
    },

    createPDF(service, copyType = 'CUSTOMER COPY') {
      const doc = new jsPDF('p', 'mm', 'a4');
      this.addPDFPage(doc, service, copyType);
      return doc;
    },

    calculateWarrantySavings(service) {
      if (!service || !service.parts) return 0;
      
      return service.parts.reduce((total, part) => {
        const isWarranty = part.hasWarranty || part.isWarranty || false;
        if (isWarranty) {
          const quantity = part.quantity || 1;
          const unitPrice = part.unitPrice || 0;
          return total + (quantity * unitPrice);
        }
        return total;
      }, 0);
    },

    formatNumberForPDF(num) {
      const formatted = Number(num || 0).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
      return formatted;
    },

    // ===== QUICK UPDATE (Status only) =====
    async updateService () {
      if (!this.editService || !this.editService.serviceId) return
      
      if (this.$refs.quickEditForm && !this.$refs.quickEditForm.validate()) {
        this.notify('Please fill all required fields', 'error')
        return
      }

      this.saving = true
      try {
        const payload = {
          serviceId: this.editService.serviceId,
          status: this.editService.status,
          estimatedDelivery: this.editService.estimatedDelivery,
          serviceNotes: this.editService.serviceNotes
        }

        const { data } = await axios.put(`${this.base}bikeServices/${this.editService.serviceId}`, payload)
        
        if (data.success) {
          this.notify('Service updated successfully', 'success')
          this.dialogs.edit = false
          
          // Update the row in the table
          const index = this.rows.findIndex(r => r.serviceId === this.editService.serviceId)
          if (index !== -1) {
            this.rows[index] = { ...this.rows[index], ...payload }
            this.allRows = [...this.allRows]
          }
        } else {
          this.notify(data.message || 'Update failed', 'error')
        }
      } catch (e) {
        console.error('Error updating service:', e)
        this.notify('Failed to update service', 'error')
      } finally {
        this.saving = false
      }
    },

    // ===== SEARCH & FILTERS =====
    async runSearch () {
      this.loading = true
      try {
        if (!this.allRows || !this.allRows.length) {
          await this.loadAll()
        }

        const {
          serviceNumber,
          customerName,
          phoneNumber,
          status,
          serviceType,
          bikeModel,
          from,
          to
        } = this.filters

        let filtered = this.allRows.slice()

        if (serviceNumber && String(serviceNumber).trim()) {
          const q = String(serviceNumber).trim().toLowerCase()
          filtered = filtered.filter(it => 
            String(it.serviceNumber || '').toLowerCase().includes(q) ||
            String(it.serviceId || '').toLowerCase().includes(q)
          )
        }

        if (customerName && String(customerName).trim()) {
          const q = String(customerName).trim().toLowerCase()
          filtered = filtered.filter(it => 
            String(it.customerName || '').toLowerCase().includes(q)
          )
        }

        if (phoneNumber && String(phoneNumber).trim()) {
          const q = String(phoneNumber).trim().replace(/\D/g, '')
          filtered = filtered.filter(it => 
            String(it.phoneNumber || '').replace(/\D/g, '').includes(q)
          )
        }

        if (status && String(status).trim()) {
          const q = String(status).trim().toLowerCase()
          filtered = filtered.filter(it => 
            String(it.status || '').toLowerCase() === q
          )
        }

        if (serviceType && String(serviceType).trim()) {
          const q = String(serviceType).trim().toLowerCase()
          filtered = filtered.filter(it => 
            String(it.serviceType || '').toLowerCase() === q
          )
        }

        if (bikeModel && String(bikeModel).trim()) {
          const q = String(bikeModel).trim().toLowerCase()
          filtered = filtered.filter(it => 
            String(it.bikeModel || '').toLowerCase().includes(q)
          )
        }

        if (from || to) {
          const itemDateYmd = (iso) => {
            if (!iso) return null
            try {
              const d = new Date(iso)
              if (isNaN(d.getTime())) return null
              const yyyy = d.getFullYear()
              const mm = String(d.getMonth() + 1).padStart(2, '0')
              const dd = String(d.getDate()).padStart(2, '0')
              return `${yyyy}-${mm}-${dd}`
            } catch {
              return null
            }
          }

          const fromYmd = from ? String(from).slice(0, 10) : null
          const toYmd = to ? String(to).slice(0, 10) : null

          filtered = filtered.filter(it => {
            const itYmd = itemDateYmd(it.createdAt)
            if (!itYmd) return false
            if (fromYmd && toYmd) {
              return itYmd >= fromYmd && itYmd <= toYmd
            } else if (fromYmd) {
              return itYmd >= fromYmd
            } else if (toYmd) {
              return itYmd <= toYmd
            }
            return true
          })
        }

        this.rows = filtered
        this.extractSparePartsFromFilteredRows()
        if (!this.rows.length) this.notify('No records found matching your search', 'warning')
      } catch (e) {
        console.error(e)
        this.notify('Search failed', 'error')
      } finally {
        this.loading = false
      }
    },

    resetFilters () {
      this.filters = {
        serviceNumber: null,
        customerName: null,
        phoneNumber: null,
        status: null,
        serviceType: null,
        bikeModel: null,
        from: null,
        to: null
      }
      this.rows = this.allRows.slice()
      this.extractSparePartsFromFilteredRows()
    },

    // ===== EXPORT FUNCTIONS =====
    async downloadPdf () {
      if (!this.rows.length) {
        this.notify('No records to export', 'warning')
        return
      }

      if (this.pdfBusy) return
      this.pdfBusy = true

      try {
        const pageSize = 30
        const totalRows = this.rows.length
        const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))

        const fromText = this.filters.from ? this.displayDateSlash(this.filters.from) : 'All'
        const toText = this.filters.to ? this.displayDateSlash(this.filters.to) : 'All'

        const pagesHtml = []

        for (let p = 0; p < totalPages; p++) {
          const start = p * pageSize
          const end = start + pageSize
          const pageRows = this.rows.slice(start, end)

          const rowsHtml = pageRows.map((row, idx) => {
            const serial = start + idx + 1
            const dateStr = this.fmtDate(row.createdAt)
            const serviceNo = row.serviceNumber || row.serviceId || ''
            const customer = row.customerName || ''
            const phone = row.phoneNumber || ''
            const bike = row.bikeModel || ''
            const serviceType = row.serviceType || ''
            const amount = this.money(row.totalAmount || 0)
            const status = row.status || 'pending'
            const delivery = this.fmtDate(row.estimatedDelivery)

            return `
              <tr>
                <td class="text-center">${serial}</td>
                <td>${dateStr}</td>
                <td>${serviceNo}</td>
                <td>${customer}</td>
                <td>${phone}</td>
                <td>${bike}</td>
                <td>${serviceType}</td>
                <td>${delivery}</td>
                <td class="text-right">${amount}</td>
                <td class="text-center">${status}</td>
              </tr>
            `
          }).join('')

          pagesHtml.push(`
            <div class="pdf-page">
              <div class="pdf-header-main">Ansari Automobiles</div>
              <div class="pdf-subheader">BADI KAMHARIYA BY PASS ROAD MAU</div>
              <div class="pdf-subheader">BIKE SERVICE RECORDS</div>
              <div class="pdf-subheader">
                Services from ${fromText} to ${toText}
              </div>
              <div class="pdf-meta">
                <span>Generated: ${this.currentDate}</span>
                <div><strong>Total Revenue: </strong>₹${this.money(this.totalRevenue)}</div>
                <div><strong>Total Services: </strong>${this.rows.length}</div>
                <span>Page ${p + 1} of ${totalPages}</span>
              </div>

              <table class="pdf-table">
                <thead>
                  <tr>
                    <th class="text-center" style="width:40px;">S.No</th>
                    <th style="width:80px;">DATE</th>
                    <th style="width:120px;">SERVICE NO</th>
                    <th>CUSTOMER</th>
                    <th style="width:100px;">PHONE</th>
                    <th style="width:120px;">BIKE MODEL</th>
                    <th style="width:100px;">TYPE</th>
                    <th style="width:80px;">DELIVERY</th>
                    <th class="text-right" style="width:100px;">AMOUNT (₹)</th>
                    <th class="text-center" style="width:80px;">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          `)
        }

        const container = this.$refs.pdfContainer
        if (!container) {
          this.notify('PDF container missing', 'error')
          return
        }

        container.innerHTML = ``
          + `<div id="bike-service-pdf-root" class="pdf-root">`
          + `<style>
              .pdf-root {
                font-family: "Courier New", monospace;
                font-size: 9pt;
                color: #000;
              }
              .pdf-page {
                padding: 18pt 18pt 12pt 18pt;
                page-break-after: always;
              }
              .pdf-page:last-child {
                page-break-after: auto;
              }
              .pdf-header-main {
                text-align: center;
                font-weight: bold;
                font-size: 11pt;
              }
              .pdf-subheader {
                text-align: center;
                font-size: 9pt;
              }
              .pdf-meta {
                display: flex;
                justify-content: space-between;
                font-size: 8pt;
                margin-top: 6pt;
                margin-bottom: 6pt;
              }
              .pdf-table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 6pt;
                table-layout: fixed;
              }
              .pdf-table th,
              .pdf-table td {
                padding: 2pt 3pt;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
              }
              .pdf-table thead th {
                font-weight: bold;
              }
              .text-right { text-align: right; }
              .text-center { text-align: center; }
            </style>
            ${pagesHtml.join('')}
          </div>
        `

        await this.$nextTick()

        const el = container.querySelector('#bike-service-pdf-root')
        if (!el) {
          this.notify('PDF element not found', 'error')
          return
        }

        const opt = {
          margin: 10,
          filename: `bike-service-records-${new Date().toISOString().slice(0, 10)}.pdf`,
          image: { type: 'jpeg', quality: 0.95 },
          html2canvas: {
            scale: 1.2,
            useCORS: true
          },
          jsPDF: { unit: 'pt', format: 'a4', orientation: 'landscape' }
        }

        await html2pdf().set(opt).from(el).save()
        
        container.innerHTML = ''
        this.notify('PDF downloaded successfully', 'success')
      } catch (error) {
        console.error('PDF generation failed:', error)
        this.notify('PDF generation failed', 'error')
      } finally {
        this.pdfBusy = false
      }
    },

    downloadExcel () {
      if (!this.rows.length) {
        this.notify('No records to export', 'warning')
        return
      }

      try {
        const excelHeaders = [
          'S.No',
          'Service Number',
          'Date',
          'Customer Name',
          'Phone Number',
          'Bike Model',
          'Service Type',
          'Estimated Delivery',
          'Total Amount (₹)',
          'Items Count',
          'Status'
        ]

        const dataRows = this.rows.map((row, index) => [
          index + 1,
          row.serviceNumber || row.serviceId,
          this.fmtDate(row.createdAt),
          row.customerName,
          row.phoneNumber,
          row.bikeModel,
          row.serviceType,
          this.fmtDate(row.estimatedDelivery),
          this.money(row.totalAmount || 0),
          row.partsCount || 0,
          row.status
        ])

        const escapeCsv = (value) => {
          if (value === null || value === undefined) return ''
          const str = String(value)
          if (/[",\n\r\t]/.test(str)) {
            return '"' + str.replace(/"/g, '""') + '"'
          }
          return str
        }

        const csvContent = [
          excelHeaders.map(escapeCsv).join(','),
          ...dataRows.map(row => row.map(escapeCsv).join(','))
        ].join('\r\n')

        const blob = new Blob(['\uFEFF' + csvContent], {
          type: 'text/csv;charset=utf-8;'
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        const timestamp = new Date().toISOString().slice(0, 10)

        link.href = url
        link.setAttribute('download', `bike-service-records-${timestamp}.csv`)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)

        this.notify('Excel file downloaded successfully', 'success')
      } catch (error) {
        console.error('Excel download failed:', error)
        this.notify('Failed to generate Excel file', 'error')
      }
    },

    // ===== HELPER METHODS =====
    money (v) {
      const num = Number(v || 0)
      if (isNaN(num)) return '0'
      
      return Number(num).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    },

    fmtDate (iso) {
      if (!iso) return '—'
      try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return '—'
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      } catch {
        return '—'
      }
    },

    displayDateSlash (iso) {
      if (!iso) return ''
      try {
        const d = new Date(iso)
        if (isNaN(d.getTime())) return ''
        const dd = String(d.getDate()).padStart(2, '0')
        const mm = String(d.getMonth() + 1).padStart(2, '0')
        const yyyy = d.getFullYear()
        return `${dd}/${mm}/${yyyy}`
      } catch {
        return ''
      }
    },

    statusColor (s) {
      const status = String(s || '').toLowerCase()
      switch (status) {
        case 'pending': return 'orange'
        case 'in_progress': return 'blue'
        case 'completed': return 'green'
        case 'delivered': return 'teal'
        case 'cancelled': return 'red'
        default: return 'grey'
      }
    },

    serviceTypeColor (type) {
      const serviceType = String(type || '').toLowerCase()
      switch (serviceType) {
        case 'regular': return 'blue'
        case 'repair': return 'orange'
        case 'accident': return 'red'
        case 'custom': return 'purple'
        case 'other': return 'grey'
        default: return 'primary'
      }
    },

    categoryColor (category) {
      const cat = String(category || '').toLowerCase()
      switch (cat) {
        case 'engine': return 'red'
        case 'electrical': return 'blue'
        case 'brakes': return 'orange'
        case 'suspension': return 'green'
        case 'body': return 'purple'
        case 'tyres': return 'brown'
        case 'service': return 'teal'
        default: return 'grey'
      }
    },

    getDeliveryColor (deliveryDate) {
      if (!deliveryDate) return 'grey'
      
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const delivery = new Date(deliveryDate)
      delivery.setHours(0, 0, 0, 0)
      
      const diffDays = Math.floor((delivery - today) / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return 'red' // Overdue
      if (diffDays === 0) return 'orange' // Today
      if (diffDays <= 2) return 'yellow' // Within 2 days
      return 'green' // Future
    },

    notify (text, color = 'success') { 
      this.snack = { show: true, color, text } 
    },

    showAddNewServiceDialogFunction () {
      this.showAddNewServiceDialog = true
    },
    
    backtoTable () {
      this.showAddNewServiceDialog = false
      this.loadAll()
    },

    handleServiceCreated(serviceData) {
      this.showAddNewServiceDialog = false
      this.loadAll()
      this.notify('Service created successfully!', 'success')
    }
  }
}
</script>

<style scoped>
.subtitle-1.font-weight-medium { letter-spacing: .2px; }

.v-data-table >>> tbody tr:hover {
  cursor: pointer;
  background-color: rgba(0, 0, 0, 0.03);
}

/* Responsive adjustments */
@media (max-width: 960px) {
  .v-dialog {
    margin: 10px;
  }
  
  .v-card__text {
    padding: 15px;
  }
}
</style>