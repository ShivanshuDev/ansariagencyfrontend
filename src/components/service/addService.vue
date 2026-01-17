<template>
  <div class="bike-service-form">

    <!-- CUSTOMER & BIKE INFO SECTION -->
    <div class="info-section">
      <h3>Customer & Bike Information</h3>
      
      <div class="info-grid">
        <div class="field-group">
          <label>Customer Name *</label>
          <input 
            type="text" 
            v-model="serviceInfo.customerName" 
            placeholder="Enter customer name"
          />
          <div v-if="showInfoErrors && infoErrors.customerName" class="error-msg">
            {{ infoErrors.customerName }}
          </div>
        </div>

        <div class="field-group">
          <label>Phone Number *</label>
          <input 
            type="tel" 
            v-model="serviceInfo.phoneNumber" 
            placeholder="Enter phone number"
          />
          <div v-if="showInfoErrors && infoErrors.phoneNumber" class="error-msg">
            {{ infoErrors.phoneNumber }}
          </div>
        </div>

        <div class="field-group">
          <label>Email</label>
          <input 
            type="email" 
            v-model="serviceInfo.email" 
            placeholder="Enter email"
          />
          <div v-if="showInfoErrors && infoErrors.email" class="error-msg">
            {{ infoErrors.email }}
          </div>
        </div>

        <div class="field-group">
          <label>Bike Model *</label>
          <input 
            type="text" 
            v-model="serviceInfo.bikeModel" 
            placeholder="eg: TVS Sport"
          />
          <div v-if="showInfoErrors && infoErrors.bikeModel" class="error-msg">
            {{ infoErrors.bikeModel }}
          </div>
        </div>

        <div class="field-group">
          <label>Registration Number</label>
          <input 
            type="text" 
            v-model="serviceInfo.registrationNumber" 
            placeholder="Bike registration number"
          />
        </div>

        <div class="field-group">
          <label>Service Type *</label>
          <select v-model="serviceInfo.serviceType">
            <option value="">Select Service Type</option>
            <option value="repair">Repair</option>
            <option value="freeService">Free Service</option>
            <option value="paidService">Paid Service</option>
            <option value="minorService">Minor Service</option>
            <option value="regular">Regular Service</option>
            <option value="accident">Accident Repair</option>
            <option value="custom">Custom Modification</option>
            <option value="counterSell">Counter Sell</option>
            <option value="warrenty">Warranty</option>
            <option value="addealer">AD Dealer</option>
            <option value="other">Other</option>
          </select>
          <div v-if="showInfoErrors && infoErrors.serviceType" class="error-msg">
            {{ infoErrors.serviceType }}
          </div>
        </div>

        <div class="field-group">
          <label>Estimated Delivery Date *</label>
          <input 
            type="date" 
            v-model="serviceInfo.estimatedDelivery"
            :min="minDate"
          />
          <div v-if="showInfoErrors && infoErrors.estimatedDelivery" class="error-msg">
            {{ infoErrors.estimatedDelivery }}
          </div>
        </div>

        <div class="field-group">
          <label>Service Notes</label>
          <textarea 
            v-model="serviceInfo.serviceNotes" 
            placeholder="Any special notes or instructions..."
            rows="1"
          ></textarea>
        </div>
      </div>
    </div>

    <!-- PARTS/SERVICES ADDITION SECTION -->
    <div class="parts-section">
      <h3>Add Parts & Services</h3>
      
      <div class="parts-form">
        <!-- Custom Entry Toggle (Show/Hide custom fields) -->
        <div class="custom-entry-toggle">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="showCustomEntry"
              @change="onCustomEntryToggle"
            />
            <span>Add Custom Part/Service (Manual Entry)</span>
          </label>
        </div>

        <!-- SEARCH ENTRY SECTION (Always Visible) -->
        <div class="search-section">
          <h4>Search & Add Parts</h4>
          <div class="parts-grid">
            <!-- PART NAME OR NUMBER SEARCH -->
            <div class="field-group autocomplete">
              <label>Search by Part Name/Number *</label>
              <input 
                type="text" 
                v-model="partSearchQuery"
                placeholder="Type part name or number to search"
                @input="onSearchPart"
                @focus="activeSearchField = 'search'"
                @blur="onSearchBlur"
              />
              
              <!-- Autocomplete Dropdown -->
              <div v-if="activeSearchField === 'search' && searchResults.length > 0" class="autocomplete-dropdown">
                <div 
                  v-for="item in searchResults" 
                  :key="item.id || item.partNumber"
                  class="autocomplete-item"
                  @mousedown="selectPart(item)"
                >
                  <div class="item-main">
                    <span class="item-name">{{ item.partName || item.spareName || item.name }}</span>
                    <span class="item-code">{{ item.partNumber || item.barcode }}</span>
                  </div>
                  <span class="item-price">₹{{ item.price || item.unitPrice || 0 }}</span>
                  <span class="item-stock">Stock: {{ item.quantity || 0 }}</span>
                </div>
              </div>
              
              <div v-if="showPartErrors && partErrors.name" class="error-msg">
                {{ partErrors.name }}
              </div>
            </div>

            <!-- PART NUMBER -->
            <div class="field-group">
              <label>Part Number</label>
              <input 
                type="text" 
                v-model="partForm.partNumber"
                readonly
                class="readonly-input"
                placeholder="Will auto-fill from search"
              />
            </div>

            <!-- PART NAME -->
            <div class="field-group">
              <label>Part/Service Name *</label>
              <input 
                type="text" 
                v-model="partForm.name" 
                placeholder="Part/service name"
              />
              <div v-if="showPartErrors && partErrors.name" class="error-msg">
                {{ partErrors.name }}
              </div>
            </div>

            <div class="field-group">
              <label>Category *</label>
              <select v-model="partForm.category">
                <option value="">Select Category</option>
                <option value="engine">Engine Parts</option>
                <option value="electrical">Electrical</option>
                <option value="brakes">Brakes</option>
                <option value="suspension">Suspension</option>
                <option value="body">Body Parts</option>
                <option value="tyres">Tyres & Wheels</option>
                <option value="service">Service/Labor</option>
                <option value="warrenty">Warranty</option>
                <option value="addealer">AD Dealer</option>
                <option value="other">Other</option>
              </select>
              <div v-if="showPartErrors && partErrors.category" class="error-msg">
                {{ partErrors.category }}
              </div>
            </div>

            <div class="field-group">
              <label>Quantity * of {{ selectedPartStock }}</label>
              <input 
                type="number" 
                v-model.number="partForm.quantity" 
                min="1"
                :max="partForm.maxQuantity"
                placeholder="Qty"
              />
              <div v-if="showPartErrors && partErrors.quantity" class="error-msg">
                {{ partErrors.quantity }}
              </div>
              <div v-if="partForm.maxQuantity !== null && partForm.quantity > partForm.maxQuantity" class="error-msg">
                Available stock: {{ partForm.maxQuantity }}
              </div>
            </div>

            <div class="field-group">
              <label>Unit Price (₹) *</label>
              <input 
                type="number" 
                v-model.number="partForm.unitPrice" 
                min="0"
                step="0.01"
                placeholder="Price per unit"
              />
              <div v-if="showPartErrors && partErrors.unitPrice" class="error-msg">
                {{ partErrors.unitPrice }}
              </div>
            </div>

            <div class="field-group">
              <label>Total Price (₹)</label>
              <input 
                type="text" 
                :value="calculateTotal()" 
                readonly
                class="readonly-input"
              />
            </div>

            <div class="field-group actions">
              <button 
                class="add-btn" 
                @click="addPart"
                :disabled="isAddingPart"
              >
                {{ getAddButtonText() }}
              </button>
              <button 
                v-if="editingPartIndex !== null"
                class="cancel-btn"
                @click="cancelEdit"
              >
                Cancel Edit
              </button>
            </div>
          </div>
        </div>

        <!-- CUSTOM PART ENTRY FIELDS (Show/Hide based on checkbox) -->
        <div v-if="showCustomEntry" class="custom-section">
          <h4>Custom Part/Service Entry</h4>
          <div class="custom-parts-grid">
            <div class="field-group">
              <label>Part Number (Optional)</label>
              <input 
                type="text" 
                v-model="customPartForm.partNumber" 
                placeholder="Enter part number"
              />
            </div>

            <div class="field-group">
              <label>Part/Service Name *</label>
              <input 
                type="text" 
                v-model="customPartForm.name" 
                placeholder="Enter part/service name"
              />
              <div v-if="showCustomPartErrors && customPartErrors.name" class="error-msg">
                {{ customPartErrors.name }}
              </div>
            </div>

            <div class="field-group">
              <label>Category *</label>
              <select v-model="customPartForm.category">
                <option value="">Select Category</option>
                <option value="engine">Engine Parts</option>
                <option value="electrical">Electrical</option>
                <option value="brakes">Brakes</option>
                <option value="suspension">Suspension</option>
                <option value="body">Body Parts</option>
                <option value="tyres">Tyres & Wheels</option>
                <option value="service">Service/Labor</option>
                <option value="warrenty">Warranty</option>
                <option value="addealer">AD Dealer</option>
                <option value="other">Other</option>
              </select>
              <div v-if="showCustomPartErrors && customPartErrors.category" class="error-msg">
                {{ customPartErrors.category }}
              </div>
            </div>

            <div class="field-group">
              <label>Quantity *</label>
              <input 
                type="number" 
                v-model.number="customPartForm.quantity" 
                min="1"
                placeholder="Qty"
              />
              <div v-if="showCustomPartErrors && customPartErrors.quantity" class="error-msg">
                {{ customPartErrors.quantity }}
              </div>
            </div>

            <div class="field-group">
              <label>Unit Price (₹) *</label>
              <input 
                type="number" 
                v-model.number="customPartForm.unitPrice" 
                min="0"
                step="0.01"
                placeholder="Price per unit"
              />
              <div v-if="showCustomPartErrors && customPartErrors.unitPrice" class="error-msg">
                {{ customPartErrors.unitPrice }}
              </div>
            </div>

            <div class="field-group">
              <label>Total Price (₹)</label>
              <input 
                type="text" 
                :value="calculateCustomTotal()" 
                readonly
                class="readonly-input"
              />
            </div>

            <div class="field-group actions">
              <button 
                class="add-btn custom-add-btn" 
                @click="addCustomPart"
                :disabled="isAddingPart"
              >
                {{ getCustomAddButtonText() }}
              </button>
              <button 
                v-if="customEditingPartIndex !== null"
                class="cancel-btn"
                @click="cancelCustomEdit"
              >
                Cancel Edit
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- PARTS TABLE -->
      <div class="parts-table-section">
        <h4>Added Parts & Services ({{ parts.length }})</h4>
        
        <div v-if="parts.length === 0" class="empty-state">
          No parts added yet. Add parts above to get started.
        </div>

        <div v-else class="table-wrapper">
          <table class="parts-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Part Number</th>
                <th>Part/Service Name</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Warranty</th>
                <th>Total</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(part, index) in parts" :key="part.id">
                <td>{{ index + 1 }}</td>
                <td>{{ part.partNumber || '-' }}</td>
                <td>{{ part.name }}</td>
                <td>
                  <span class="category-badge" :class="part.category">
                    {{ part.category }}
                  </span>
                </td>
                <td>{{ part.quantity }}</td>
                <td>₹{{ formatNumber(part.unitPrice) }}</td>
                <td>
                  <label class="warranty-checkbox">
                    <input 
                      type="checkbox" 
                      v-model="part.isWarranty"
                      @change="onWarrantyChange(index)"
                      :disabled="part.unitPrice === 0"
                      :title="part.unitPrice === 0 ? 'Already free' : 'Mark as warranty item'"
                    />
                    <span>Warranty</span>
                  </label>
                </td>
                <td>₹{{ formatNumber(calculatePartTotal(part)) }}</td>
                <td>
                  <span v-if="part.isCustom" class="type-badge custom-badge">Custom</span>
                  <span v-else class="type-badge search-badge">Stock</span>
                </td>
                <td class="action-buttons">
                  <button 
                    class="edit-btn" 
                    @click="editPart(index, part.isCustom)"
                    :title="part.isCustom ? 'Edit Custom Part' : 'Edit Part'"
                  >
                    <i class="fas fa-edit"></i> Edit
                  </button>
                  <button class="delete-btn" @click="removePart(index)">
                    <i class="fas fa-trash"></i> Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- WARRANTY SUMMARY SECTION -->
      <div v-if="hasWarrantyParts" class="warranty-summary">
        <h4>Warranty Parts Summary</h4>
        <div class="warranty-table">
          <table>
            <thead>
              <tr>
                <th>Part Name</th>
                <th>Original Price</th>
                <th>Warranty Discount</th>
                <th>Final Price</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(part, index) in warrantyParts" :key="part.id">
                <td>{{ part.name }}</td>
                <td>₹{{ formatNumber(part.unitPrice * part.quantity) }}</td>
                <td class="discount">- ₹{{ formatNumber(part.unitPrice * part.quantity) }}</td>
                <td class="free">₹0.00</td>
              </tr>
              <tr class="warranty-total">
                <td colspan="3"><strong>Total Warranty Savings:</strong></td>
                <td><strong>- ₹{{ formatNumber(calculateWarrantySavings()) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- LABOUR CHARGE & DISCOUNT SECTION -->
    <div class="charges-section">
      <h3>Additional Charges & Discount</h3>
      <div class="charges-grid">
        <!-- LABOUR CHARGE -->
        <div class="field-group">
          <label>Labour Charge (₹)</label>
          <input 
            type="number" 
            v-model.number="serviceInfo.labourCharge"
            min="0"
            step="0.01"
            placeholder="Enter labour charge"
            @input="onLabourChargeChange"
          />
        </div>

        <!-- MODE OF PAYMENT - ADD THIS NEW FIELD -->
        <div class="field-group">
          <label>Mode of Payment *</label>
          <select v-model="serviceInfo.paymentMode" required>
            <option value="cash">Cash</option>
            <option value="creditCard">Credit Card</option>
            <option value="debitCard">Debit Card</option>
            <option value="upi">UPI</option>
            <option value="netBanking">Net Banking</option>
            <option value="cheque">Cheque</option>
            <option value="onlineTransfer">Online Transfer</option>
            <option value="wallet">Wallet</option>
            <option value="credit">Credit (Account)</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div v-if="showInfoErrors && infoErrors.paymentMode" class="error-msg">
          {{ infoErrors.paymentMode }}
        </div>

        <!-- DISCOUNT TYPE -->
        <div class="field-group">
          <label>Discount Type</label>
          <select v-model="serviceInfo.discountType" @change="onDiscountTypeChange">
            <option value="none">No Discount</option>
            <option value="amount">Fixed Amount</option>
            <option value="percentage">Percentage (%)</option>
          </select>
        </div>

        <!-- DISCOUNT VALUE -->
        <div class="field-group" v-if="serviceInfo.discountType !== 'none'">
          <label>
            {{ serviceInfo.discountType === 'amount' ? 'Discount Amount (₹)' : 'Discount Percentage (%)' }}
          </label>
          <input 
            type="number" 
            v-model.number="serviceInfo.discountValue"
            :min="serviceInfo.discountType === 'percentage' ? 0 : 0"
            :max="serviceInfo.discountType === 'percentage' ? 100 : calculatePartsTotal()"
            :step="serviceInfo.discountType === 'percentage' ? 1 : 0.01"
            :placeholder="serviceInfo.discountType === 'amount' ? 'Enter discount amount' : 'Enter discount percentage'"
            @input="onDiscountValueChange"
          />
          <div v-if="serviceInfo.discountType === 'amount' && serviceInfo.discountValue > calculatePartsTotal()" class="error-msg">
            Discount cannot exceed parts total (₹{{ formatNumber(calculatePartsTotal()) }})
          </div>
          <div v-if="serviceInfo.discountType === 'percentage' && serviceInfo.discountValue > 100" class="error-msg">
            Percentage cannot exceed 100%
          </div>
        </div>

        <!-- GST CHECKBOX - DEFAULT FALSE -->
        <div class="field-group gst-checkbox">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="serviceInfo.includeGST"
              @change="onGSTToggle"
            />
            <span>Include GST (18%) in Bill</span>
          </label>
        </div>

        <!-- OFFICE COPY CHECKBOX - DEFAULT FALSE -->
        <div class="field-group office-copy-checkbox">
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              v-model="generateOfficeCopy"
            />
            <span>Generate Office Copy</span>
          </label>
          <div class="checkbox-hint">
            <small>When checked, will generate both customer and office copies</small>
          </div>
        </div>

        <!-- CALCULATED DISPLAY -->
        <div class="calculation-display">
          <div class="calc-item">
            <span>Parts Total:</span>
            <span>₹{{ formatNumber(calculatePartsTotal()) }}</span>
          </div>
          
          <!-- WARRANTY DISCOUNT -->
          <div class="calc-item" v-if="hasWarrantyParts">
            <span>Warranty Discount:</span>
            <span class="warranty-discount">- ₹{{ formatNumber(calculateWarrantySavings()) }}</span>
          </div>
          
          <div class="calc-item" v-if="serviceInfo.labourCharge > 0">
            <span>Labour Charge:</span>
            <span>₹{{ formatNumber(serviceInfo.labourCharge) }}</span>
          </div>
          <div class="calc-item" v-if="serviceInfo.discountType !== 'none' && serviceInfo.discountValue > 0">
            <span>
              {{ serviceInfo.discountType === 'amount' ? 'Discount Amount:' : 'Discount (' + serviceInfo.discountValue + '%):' }}
            </span>
            <span class="discount-amount">- ₹{{ formatNumber(calculateDiscount()) }}</span>
          </div>
          <div class="calc-item">
            <span>Sub Total:</span>
            <span>₹{{ formatNumber(calculateSubTotal()) }}</span>
          </div>
          <div class="calc-item" v-if="serviceInfo.includeGST">
            <span>GST (18%):</span>
            <span>₹{{ formatNumber(calculateGST()) }}</span>
          </div>
          <div class="calc-item grand-total">
            <span>Grand Total:</span>
            <span>₹{{ formatNumber(calculateGrandTotal()) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- SUMMARY & SUBMIT SECTION -->
    <div class="summary-section">
      <div class="summary-card">
        <h4>Service Summary</h4>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="label">Customer:</span>
            <span class="value">{{ serviceInfo.customerName || 'Not provided' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Bike Model:</span>
            <span class="value">{{ serviceInfo.bikeModel || 'Not provided' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Service Type:</span>
            <span class="value">{{ serviceInfo.serviceType || 'Not provided' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Items:</span>
            <span class="value">{{ parts.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Total Quantity:</span>
            <span class="value">{{ calculateTotalQuantity() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Custom Parts:</span>
            <span class="value">{{ countCustomParts() }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Warranty Parts:</span>
            <span class="value">{{ warrantyParts.length }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Warranty Savings:</span>
            <span class="value warranty-savings">- ₹{{ formatNumber(calculateWarrantySavings()) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">GST Included:</span>
            <span class="value">{{ serviceInfo.includeGST ? 'Yes (18%)' : 'No' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Office Copy:</span>
            <span class="value">{{ generateOfficeCopy ? 'Yes' : 'No' }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Grand Total:</span>
            <span class="value total">₹{{ formatNumber(calculateGrandTotal()) }}</span>
          </div>
          <div class="summary-item">
            <span class="label">Payment Mode:</span>
            <span class="value">{{ formatPaymentMode(serviceInfo.paymentMode) }}</span>
          </div>
        </div>
      </div>

      <div class="submit-actions">
        <button 
          class="reset-btn"
          @click="resetForm"
        >
          <i class="fas fa-redo"></i> Reset All
        </button>
        
        <button 
          class="submit-btn"
          @click="submitService"
          :disabled="isSubmitting || parts.length === 0"
        >
          <i class="fas fa-paper-plane"></i>
          {{ isSubmitting ? 'Saving...' : 'Save Service Record' }}
        </button>
      </div>
    </div>

    <!-- SERVICE ID DISPLAY -->
    <div v-if="serviceId" class="success-section">
      <div class="success-card">
        <i class="fas fa-check-circle success-icon"></i>
        <h3>Service Record Saved Successfully!</h3>
        <p>Service ID: <strong class="service-id">{{ serviceId }}</strong></p>
        <p v-if="!pdfLoading">Invoice is ready. Click below to view/download.</p>
        <p v-if="pdfLoading">Generating invoice PDF...</p>
        <div class="invoice-actions">
          <button class="pdf-btn" @click="generatePDF" :disabled="pdfLoading">
            <i class="fas fa-file-pdf"></i> {{ pdfLoading ? 'Generating...' : 'Download PDF' }}
          </button>
          <button class="new-service-btn" @click="startNewService">
            <i class="fas fa-plus"></i> Start New Service
          </button>
        </div>
      </div>
    </div>

    <!-- SNACKBAR FOR NOTIFICATIONS -->
    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      location="top right"
      :color="snackbar.color"
      variant="tonal"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn icon @click="snackbar.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

    <!-- CONFIRMATION DIALOG -->
    <v-dialog v-model="showConfirmDialog" max-width="500px">
      <v-card>
        <v-card-title class="dialog-title">
          <i class="fas fa-exclamation-triangle"></i>
          Confirm Service Submission
        </v-card-title>
        <v-card-text>
          <p>Are you sure you want to save this service record?</p>
          <div class="confirmation-details">
            <p><strong>Customer:</strong> {{ serviceInfo.customerName }}</p>
            <p><strong>Parts Total:</strong> ₹{{ formatNumber(calculatePartsTotal()) }}</p>
            <p v-if="hasWarrantyParts"><strong>Warranty Discount:</strong> -₹{{ formatNumber(calculateWarrantySavings()) }}</p>
            <p v-if="serviceInfo.labourCharge > 0"><strong>Labour Charge:</strong> ₹{{ formatNumber(serviceInfo.labourCharge) }}</p>
            <p v-if="calculateDiscount() > 0"><strong>Discount:</strong> -₹{{ formatNumber(calculateDiscount()) }}</p>
            <p v-if="serviceInfo.includeGST"><strong>GST (18%):</strong> ₹{{ formatNumber(calculateGST()) }}</p>
            <p><strong>Payment Mode:</strong> {{ formatPaymentMode(serviceInfo.paymentMode) }}</p>
            <p><strong>Office Copy:</strong> {{ generateOfficeCopy ? 'Yes' : 'No' }}</p>
            <p><strong>Grand Total:</strong> ₹{{ formatNumber(calculateGrandTotal()) }}</p>
            <p><strong>Total Items:</strong> {{ parts.length }}</p>
            <p><strong>Warranty Parts:</strong> {{ warrantyParts.length }}</p>
            <p><strong>Custom Parts:</strong> {{ countCustomParts() }}</p>
            <p><strong>Stock Parts:</strong> {{ parts.length - countCustomParts() }}</p>
            <p><strong>GST Included:</strong> {{ serviceInfo.includeGST ? 'Yes' : 'No' }}</p>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="grey" @click="showConfirmDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="confirmSubmit">Yes, Save It</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import axios from 'axios';
import jsPDF from 'jspdf';
import logoImg from '@/assets/newLogoTVS.png';

export default {
  name: 'BikeServiceForm',
  
  data() {
    return {
      // Existing data
      serviceInfo: {
        customerName: '',
        phoneNumber: '',
        email: '',
        bikeModel: '',
        registrationNumber: '',
        serviceType: '',
        estimatedDelivery: '',
        serviceNotes: '',
        status: 'pending',
        labourCharge: 0,
        discountType: 'none',
        discountValue: 0,
        includeGST: false,
        paymentMode: 'cash'
      },
      partForm: {
        partNumber: '',
        name: '',
        category: '',
        quantity: 1,
        unitPrice: 0,
        description: '',
        maxQuantity: null,
        availableQuantity: 0,
        isWarranty: false // ADDED: Track warranty for new parts
      },
      partSearchQuery: '',
      searchResults: [],
      activeSearchField: null,
      searchTimer: null,
      parts: [],
      editingPartIndex: null,
      isExistingPart: false,
      existingPartIndex: -1,
      infoErrors: {},
      partErrors: {},
      showInfoErrors: false,
      showPartErrors: false,
      isAddingPart: false,
      isSubmitting: false,
      serviceId: null,
      showConfirmDialog: false,
      pdfLoading: false,
      generateOfficeCopy: false,
      snackbar: {
        show: false,
        message: '',
        timeout: 3000,
        color: 'success'
      },
      
      // New data for custom parts
      showCustomEntry: false,
      customPartForm: {
        partNumber: '',
        name: '',
        category: '',
        quantity: 1,
        unitPrice: 0,
        description: '',
        isWarranty: false // ADDED: Track warranty for custom parts
      },
      customPartErrors: {},
      showCustomPartErrors: false,
      customEditingPartIndex: null,
      customIsExistingPart: false
    };
  },

  computed: {
    minDate() {
      const today = new Date();
      today.setDate(today.getDate() + 1);
      return today.toISOString().split('T')[0];
    },
    
    selectedPartStock() {
      return this.partForm.availableQuantity || 0;
    },
    
    hasWarrantyParts() {
      return this.parts.some(part => part.isWarranty);
    },
    
    warrantyParts() {
      return this.parts.filter(part => part.isWarranty);
    }
  },

  watch: {
    partForm: {
      handler(newVal) {
        this.checkForExistingPart();
      },
      deep: true
    },
    
    customPartForm: {
      handler(newVal) {
        this.checkForCustomExistingPart();
      },
      deep: true
    }
  },

  mounted() {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    this.serviceInfo.estimatedDelivery = deliveryDate.toISOString().split('T')[0];
  },

  methods: {
    // ==================== CUSTOM ENTRY TOGGLE ====================
    onCustomEntryToggle() {
      if (this.showCustomEntry) {
        this.showNotification('info', 'Custom entry fields are now visible');
      } else {
        this.resetCustomPartForm();
        this.showNotification('info', 'Custom entry fields are now hidden');
      }
    },
    
    // ==================== WARRANTY METHODS ====================
    onWarrantyChange(index) {
      const part = this.parts[index];
      
      if (part.isWarranty) {
        this.showNotification('info', `"${part.name}" marked as warranty item. Price will be ₹0.00`);
      } else {
        this.showNotification('info', `"${part.name}" warranty removed.`);
      }
      
      this.$forceUpdate();
    },

    calculatePartTotal(part) {
      if (part.isWarranty) {
        return 0;
      }
      return part.quantity * part.unitPrice;
    },

    calculateWarrantySavings() {
      return this.parts.reduce((total, part) => {
        if (part.isWarranty) {
          return total + (part.quantity * part.unitPrice);
        }
        return total;
      }, 0);
    },

    // ==================== SEARCH MODE METHODS ====================
    getAddButtonText() {
      if (this.isAddingPart) return 'Adding...';
      if (this.editingPartIndex !== null) return 'Update Part';
      if (this.isExistingPart) return 'Increase Quantity';
      return 'Add Part';
    },

    onSearchPart() {
      clearTimeout(this.searchTimer);
      const query = this.partSearchQuery.trim();

      if (!query || query.length < 2) {
        this.searchResults = [];
        return;
      }

      this.searchTimer = setTimeout(async () => {
        try {
          const res = await axios.get(
            process.env.VUE_APP_AGENCY_BACKEND_URL + 'spares'
          );
          
          const allParts = res.data?.parts || res.data || [];
          
          this.searchResults = allParts.filter(part => {
            const partName = (part.partName || part.spareName || part.name || '').toLowerCase();
            const partNumber = (part.partNumber || part.barcode || '').toLowerCase();
            const searchQuery = query.toLowerCase();
            
            return partName.includes(searchQuery) || 
                   partNumber.includes(searchQuery);
          }).slice(0, 8);
          
          if (this.searchResults.length === 0) {
            this.searchResults = this.getSampleParts().filter(part => {
              const partName = (part.name || '').toLowerCase();
              const partNumber = (part.barcode || part.partNumber || '').toLowerCase();
              const searchQuery = query.toLowerCase();
              
              return partName.includes(searchQuery) || 
                     partNumber.includes(searchQuery);
            }).slice(0, 8);
          }
        } catch (error) {
          console.error("Search failed:", error);
          const sampleParts = this.getSampleParts();
          this.searchResults = sampleParts.filter(part => {
            const partName = (part.name || '').toLowerCase();
            const partNumber = (part.barcode || part.partNumber || '').toLowerCase();
            const searchQuery = query.toLowerCase();
            
            return partName.includes(searchQuery) || 
                   partNumber.includes(searchQuery);
          }).slice(0, 8);
        }
      }, 300);
    },

    onSearchBlur() {
      setTimeout(() => {
        this.activeSearchField = null;
      }, 200);
    },

    selectPart(item) {
      const availableQty = item.quantity || 0;
      this.partForm = {
        partNumber: item.partNumber || item.barcode || '',
        name: item.partName || item.spareName || item.name || '',
        category: item.category || 'other',
        quantity: 1,
        unitPrice: item.price || item.unitPrice || 0,
        description: item.description || '',
        maxQuantity: availableQty,
        availableQuantity: availableQty,
        isWarranty: false // Reset warranty when selecting new part
      };
      
      this.partSearchQuery = '';
      this.searchResults = [];
      this.activeSearchField = null;
      this.checkForExistingPart();
      
      setTimeout(() => {
        document.querySelector('input[type="number"][min="1"]')?.focus();
      }, 100);
      
      if (availableQty > 0) {
        this.showNotification('info', `Available stock: ${availableQty} units`);
      } else {
        this.showNotification('warning', 'This part is out of stock');
      }
    },

    checkForExistingPart() {
      if (!this.partForm.name && !this.partForm.partNumber) {
        this.isExistingPart = false;
        this.existingPartIndex = -1;
        return;
      }

      this.existingPartIndex = this.parts.findIndex(part => 
        !part.isCustom &&
        !part.isWarranty && // Don't consider warranty parts for quantity increase
        ((part.name === this.partForm.name && part.name) ||
        (part.partNumber && this.partForm.partNumber && part.partNumber === this.partForm.partNumber))
      );
      
      this.isExistingPart = this.existingPartIndex !== -1 && this.editingPartIndex === null;
    },

    // ==================== CUSTOM PART METHODS ====================
    getCustomAddButtonText() {
      if (this.isAddingPart) return 'Adding...';
      if (this.customEditingPartIndex !== null) return 'Update Custom Part';
      if (this.customIsExistingPart) return 'Increase Quantity';
      return 'Add Custom Part';
    },
    
    checkForCustomExistingPart() {
      if (!this.customPartForm.name && !this.customPartForm.partNumber) {
        this.customIsExistingPart = false;
        return;
      }

      const existingIndex = this.parts.findIndex(part => 
        part.isCustom &&
        !part.isWarranty && // Don't consider warranty parts for quantity increase
        ((part.name === this.customPartForm.name && part.name) ||
        (part.partNumber && this.customPartForm.partNumber && part.partNumber === this.customPartForm.partNumber))
      );
      
      this.customIsExistingPart = existingIndex !== -1 && this.customEditingPartIndex === null;
    },
    
    validateCustomPartForm() {
      const errors = {};
      
      if (!this.customPartForm.name?.trim()) errors.name = 'Part/Service name is required';
      if (!this.customPartForm.category) errors.category = 'Category is required';
      
      if (!this.customPartForm.quantity || this.customPartForm.quantity < 1) {
        errors.quantity = 'Quantity must be at least 1';
      }
      
      // Don't validate unit price if it's a warranty part
      if (!this.customPartForm.isWarranty && this.serviceInfo.serviceType !== 'freeService' && 
          (!this.customPartForm.unitPrice || this.customPartForm.unitPrice <= 0)) {
        errors.unitPrice = 'Unit price must be greater than 0';
      }
      
      this.customPartErrors = errors;
      return Object.keys(errors).length === 0;
    },
    
    calculateCustomTotal() {
      const qty = this.customPartForm.quantity || 0;
      const price = this.customPartForm.isWarranty ? 0 : (this.customPartForm.unitPrice || 0);
      return this.formatNumber(qty * price);
    },
    
    addCustomPart() {
      this.showCustomPartErrors = true;
      
      if (!this.validateCustomPartForm()) {
        this.showNotification('error', 'Please fix all custom part errors');
        return;
      }

      const part = {
        id: Date.now() + Math.random(),
        partNumber: this.customPartForm.partNumber || '',
        name: this.customPartForm.name,
        category: this.customPartForm.category,
        quantity: this.customPartForm.quantity,
        unitPrice: this.customPartForm.isWarranty ? 0 : this.customPartForm.unitPrice,
        description: this.customPartForm.description || '',
        total: this.calculateCustomTotal(),
        isCustom: true,
        isWarranty: this.customPartForm.isWarranty,
        maxQuantity: null,
        availableQuantity: null
      };

      if (this.customIsExistingPart && this.customEditingPartIndex === null) {
        const existingPartIndex = this.parts.findIndex(p => 
          p.isCustom && 
          !p.isWarranty && // Don't merge with warranty parts
          ((p.name === part.name && p.name) ||
          (p.partNumber && part.partNumber && p.partNumber === part.partNumber))
        );
        
        if (existingPartIndex !== -1) {
          const existingPart = this.parts[existingPartIndex];
          const newQuantity = existingPart.quantity + part.quantity;
          
          if (confirm(`"${part.name}" already exists with quantity ${existingPart.quantity}. Increase to ${newQuantity}?`)) {
            this.parts[existingPartIndex].quantity = newQuantity;
            this.showNotification('success', `Quantity increased to ${newQuantity} for "${part.name}"`);
            this.resetCustomPartForm();
            return;
          } else {
            this.parts.push(part);
            this.showNotification('success', 'Custom part added as new item');
          }
        }
      } else if (this.customEditingPartIndex !== null) {
        this.parts[this.customEditingPartIndex] = part;
        this.showNotification('success', 'Custom part updated successfully');
        this.customEditingPartIndex = null;
      } else {
        this.parts.push(part);
        this.showNotification('success', 'Custom part added successfully');
      }

      this.resetCustomPartForm();
    },
    
    resetCustomPartForm() {
      this.customPartForm = {
        partNumber: '',
        name: '',
        category: '',
        quantity: 1,
        unitPrice: 0,
        description: '',
        isWarranty: false
      };
      this.customPartErrors = {};
      this.showCustomPartErrors = false;
      this.customIsExistingPart = false;
      this.customEditingPartIndex = null;
    },
    
    cancelCustomEdit() {
      this.resetCustomPartForm();
      this.customEditingPartIndex = null;
      this.showNotification('info', 'Edit cancelled');
    },
    
    // ==================== REGULAR PART METHODS ====================
    addPart() {
      this.showPartErrors = true;
      
      if (!this.validatePartForm()) {
        this.showNotification('error', 'Please fix all part errors');
        return;
      }

      const part = {
        id: Date.now() + Math.random(),
        partNumber: this.partForm.partNumber,
        name: this.partForm.name,
        category: this.partForm.category,
        quantity: this.partForm.quantity,
        unitPrice: this.partForm.isWarranty ? 0 : this.partForm.unitPrice,
        description: this.partForm.description,
        total: this.calculateTotal(),
        maxQuantity: this.partForm.maxQuantity,
        availableQuantity: this.partForm.availableQuantity,
        isCustom: false,
        isWarranty: this.partForm.isWarranty || false
      };

      if (this.isExistingPart && this.editingPartIndex === null) {
        const existingPart = this.parts[this.existingPartIndex];
        
        // Don't merge warranty parts with non-warranty parts
        if (existingPart.isWarranty !== part.isWarranty) {
          this.parts.push(part);
          this.showNotification('success', 'Part added as new item (different warranty status)');
          this.resetPartForm();
          return;
        }
        
        const newQuantity = existingPart.quantity + part.quantity;
        
        if (existingPart.maxQuantity !== null && newQuantity > existingPart.maxQuantity) {
          this.showNotification('error', `Cannot increase quantity. Available stock: ${existingPart.maxQuantity}, requested: ${newQuantity}`);
          return;
        }
        
        if (confirm(`"${part.name}" already exists with quantity ${existingPart.quantity}. Increase to ${newQuantity}?`)) {
          this.parts[this.existingPartIndex].quantity = newQuantity;
          this.showNotification('success', `Quantity increased to ${newQuantity} for "${part.name}"`);
          this.resetPartForm();
          return;
        } else {
          this.parts.push(part);
          this.showNotification('success', 'Part added as new item');
        }
      } else if (this.editingPartIndex !== null) {
        if (this.partForm.maxQuantity !== null && this.partForm.quantity > this.partForm.maxQuantity) {
          this.showNotification('error', `Cannot update quantity. Available stock: ${this.partForm.maxQuantity}, requested: ${this.partForm.quantity}`);
          return;
        }
        
        this.parts[this.editingPartIndex] = part;
        this.showNotification('success', 'Part updated successfully');
        this.editingPartIndex = null;
      } else {
        this.parts.push(part);
        this.showNotification('success', 'Part added successfully');
      }

      this.resetPartForm();
    },

    editPart(index, isCustom = false) {
      const part = this.parts[index];
      
      if (isCustom) {
        this.showCustomEntry = true;
        this.customPartForm = {
          partNumber: part.partNumber || '',
          name: part.name,
          category: part.category,
          quantity: part.quantity,
          unitPrice: part.isWarranty ? 0 : part.unitPrice,
          description: part.description || '',
          isWarranty: part.isWarranty || false
        };
        this.customEditingPartIndex = index;
        this.showCustomPartErrors = false;
        this.customIsExistingPart = false;
        
        setTimeout(() => {
          document.querySelector('.custom-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        this.showNotification('info', 'Editing custom part. Make changes and click "Update Custom Part"');
      } else {
        this.partForm = {
          partNumber: part.partNumber || '',
          name: part.name,
          category: part.category,
          quantity: part.quantity,
          unitPrice: part.isWarranty ? 0 : part.unitPrice,
          description: part.description || '',
          maxQuantity: part.maxQuantity,
          availableQuantity: part.availableQuantity,
          isWarranty: part.isWarranty || false
        };
        this.editingPartIndex = index;
        this.showPartErrors = false;
        this.isExistingPart = false;
        
        setTimeout(() => {
          document.querySelector('.search-section')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
        
        this.showNotification('info', 'Editing part. Make changes and click "Update Part"');
      }
    },

    removePart(index) {
      const partName = this.parts[index].name;
      if (confirm(`Delete "${partName}" from the list?`)) {
        if (this.editingPartIndex === index) {
          this.cancelEdit();
        } else if (this.customEditingPartIndex === index) {
          this.cancelCustomEdit();
        }
        
        if (this.editingPartIndex !== null && this.editingPartIndex > index) {
          this.editingPartIndex--;
        }
        if (this.customEditingPartIndex !== null && this.customEditingPartIndex > index) {
          this.customEditingPartIndex--;
        }
        
        this.parts.splice(index, 1);
        this.showNotification('success', 'Part removed successfully');
      }
    },

    cancelEdit() {
      this.resetPartForm();
      this.editingPartIndex = null;
      this.isExistingPart = false;
      this.showNotification('info', 'Edit cancelled');
    },

    resetPartForm() {
      this.partForm = {
        partNumber: '',
        name: '',
        category: '',
        quantity: 1,
        unitPrice: 0,
        description: '',
        maxQuantity: null,
        availableQuantity: 0,
        isWarranty: false
      };
      this.partSearchQuery = '';
      this.partErrors = {};
      this.showPartErrors = false;
      this.searchResults = [];
      this.activeSearchField = null;
      this.isExistingPart = false;
      this.existingPartIndex = -1;
    },

    // ==================== VALIDATION METHODS ====================
    // validateServiceInfo() {
    //   const errors = {};
      
    //   if (!this.serviceInfo.customerName?.trim()) errors.customerName = 'Customer name is required';
    //   if (!this.serviceInfo.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
    //   else if (!/^\d{10}$/.test(this.serviceInfo.phoneNumber.replace(/\D/g, ''))) errors.phoneNumber = 'Enter a valid 10-digit phone number';
    //   if (this.serviceInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.serviceInfo.email)) errors.email = 'Enter a valid email address';
    //   if (!this.serviceInfo.bikeModel?.trim()) errors.bikeModel = 'Bike model is required';
    //   if (!this.serviceInfo.serviceType) errors.serviceType = 'Service type is required';
    //   if (!this.serviceInfo.estimatedDelivery) errors.estimatedDelivery = 'Estimated delivery date is required';
      
    //   this.infoErrors = errors;
    //   return Object.keys(errors).length === 0;
    // },
    validateServiceInfo() {
      const errors = {};
      
      if (!this.serviceInfo.customerName?.trim()) errors.customerName = 'Customer name is required';
      if (!this.serviceInfo.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
      else if (!/^\d{10}$/.test(this.serviceInfo.phoneNumber.replace(/\D/g, ''))) errors.phoneNumber = 'Enter a valid 10-digit phone number';
      if (this.serviceInfo.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.serviceInfo.email)) errors.email = 'Enter a valid email address';
      if (!this.serviceInfo.bikeModel?.trim()) errors.bikeModel = 'Bike model is required';
      if (!this.serviceInfo.serviceType) errors.serviceType = 'Service type is required';
      if (!this.serviceInfo.estimatedDelivery) errors.estimatedDelivery = 'Estimated delivery date is required';
      // ADD THIS VALIDATION
      if (!this.serviceInfo.paymentMode) errors.paymentMode = 'Payment mode is required';
      
      this.infoErrors = errors;
      return Object.keys(errors).length === 0;
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

    validatePartForm() {
      const errors = {};
      
      if (!this.partForm.name?.trim()) errors.name = 'Part/Service name is required';
      if (!this.partForm.category) errors.category = 'Category is required';
      
      if (!this.partForm.quantity || this.partForm.quantity < 1) {
        errors.quantity = 'Quantity must be at least 1';
      } else if (this.partForm.maxQuantity !== null && this.partForm.quantity > this.partForm.maxQuantity) {
        errors.quantity = `Quantity exceeds available stock (${this.partForm.maxQuantity})`;
      }
      
      // Don't validate unit price if it's a warranty part
      if (!this.partForm.isWarranty && this.serviceInfo.serviceType !== 'freeService' &&
          (!this.partForm.unitPrice || this.partForm.unitPrice <= 0)) {
        errors.unitPrice = 'Unit price must be greater than 0';
      }
      
      this.partErrors = errors;
      return Object.keys(errors).length === 0;
    },

    // ==================== CALCULATION METHODS ====================
    calculateTotal() {
      const qty = this.partForm.quantity || 0;
      const price = this.partForm.isWarranty ? 0 : (this.partForm.unitPrice || 0);
      return this.formatNumber(qty * price);
    },

    calculatePartsTotal() {
      return this.parts.reduce((total, part) => {
        if (part.isWarranty) {
          return total; // Warranty parts are free
        }
        return total + (part.quantity * part.unitPrice);
      }, 0);
    },

    calculateDiscount() {
      if (this.serviceInfo.discountType === 'none' || !this.serviceInfo.discountValue) {
        return 0;
      }
      
      const partsTotal = this.calculatePartsTotal();
      
      if (this.serviceInfo.discountType === 'amount') {
        return Math.min(this.serviceInfo.discountValue, partsTotal);
      } else if (this.serviceInfo.discountType === 'percentage') {
        return (partsTotal * this.serviceInfo.discountValue) / 100;
      }
      
      return 0;
    },

    calculateSubTotal() {
      const partsTotal = this.calculatePartsTotal(); // Already excludes warranty parts
      const discount = this.calculateDiscount();
      const labourCharge = this.serviceInfo.labourCharge || 0;
      
      return partsTotal - discount + labourCharge;
    },

    calculateGST() {
      if (!this.serviceInfo.includeGST) {
        return 0;
      }
      const subTotal = this.calculateSubTotal();
      return subTotal * 0.18;
    },

    calculateGrandTotal() {
      const subTotal = this.calculateSubTotal();
      const gst = this.calculateGST();
      return subTotal + gst;
    },

    calculateTotalQuantity() {
      return this.parts.reduce((total, part) => total + part.quantity, 0);
    },
    
    countCustomParts() {
      return this.parts.filter(part => part.isCustom).length;
    },

    // ==================== EVENT HANDLERS ====================
    onLabourChargeChange() {
      if (this.serviceInfo.labourCharge < 0) {
        this.serviceInfo.labourCharge = 0;
      }
    },

    onDiscountTypeChange() {
      this.serviceInfo.discountValue = 0;
    },

    onDiscountValueChange() {
      if (this.serviceInfo.discountType === 'percentage') {
        if (this.serviceInfo.discountValue < 0) {
          this.serviceInfo.discountValue = 0;
        } else if (this.serviceInfo.discountValue > 100) {
          this.serviceInfo.discountValue = 100;
        }
      } else if (this.serviceInfo.discountType === 'amount') {
        if (this.serviceInfo.discountValue < 0) {
          this.serviceInfo.discountValue = 0;
        }
        const partsTotal = this.calculatePartsTotal();
        if (this.serviceInfo.discountValue > partsTotal) {
          this.serviceInfo.discountValue = partsTotal;
        }
      }
    },

    onGSTToggle() {
      this.showNotification('info', 
        this.serviceInfo.includeGST ? 'GST (18%) will be included in the bill' : 'GST will not be included in the bill'
      );
    },

    // ==================== SERVICE SUBMISSION ====================
    submitService() {
      this.showInfoErrors = true;
      
      if (!this.validateServiceInfo()) {
        this.showNotification('error', 'Please fix customer information errors');
        return;
      }

      if (this.parts.length === 0) {
        this.showNotification('warning', 'Please add at least one part/service');
        return;
      }

      this.showConfirmDialog = true;
    },

    async confirmSubmit() {
      this.showConfirmDialog = false;
      this.isSubmitting = true;

      try {
        const serviceData = {
          serviceInfo: this.serviceInfo,
          parts: this.parts,
          partsTotal: this.calculatePartsTotal(),
          warrantySavings: this.calculateWarrantySavings(),
          labourCharge: this.serviceInfo.labourCharge || 0,
          discount: this.calculateDiscount(),
          discountType: this.serviceInfo.discountType,
          discountValue: this.serviceInfo.discountValue,
          subTotal: this.calculateSubTotal(),
          gst: this.calculateGST(),
          includeGST: this.serviceInfo.includeGST,
          totalAmount: this.calculateGrandTotal(),
          totalQuantity: this.calculateTotalQuantity(),
          createdAt: new Date().toISOString(),
          serviceNumber: this.generateServiceNumber(),
          generateOfficeCopy: this.generateOfficeCopy,
          hasCustomParts: this.parts.some(part => part.isCustom),
          paymentMode: this.serviceInfo.paymentMode,
          hasWarrantyParts: this.hasWarrantyParts
        };

        const response = await axios.post(
          process.env.VUE_APP_AGENCY_BACKEND_URL + 'bikeServices',
          serviceData,
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (response.data && response.data.serviceId) {
          this.serviceId = response.data.serviceId;
          this.showNotification('success', 'Service record saved successfully!');
          
          setTimeout(() => {
            this.generatePDF();
          }, 1000);
          
        } else {
          throw new Error('Invalid response from server');
        }

      } catch (error) {
        console.error('Error saving service:', error);
        this.showNotification('error', 'Failed to save service. Please try again.');
      } finally {
        this.isSubmitting = false;
      }
    },

    generatePDF() {
      this.pdfLoading = true;

      try {
        if (this.generateOfficeCopy) {
          const doc = new jsPDF('p', 'mm', 'a4');
          
          this.addPDFPage(doc, 'CUSTOMER COPY');
          
          doc.addPage();
          
          this.addPDFPage(doc, 'OFFICE COPY');
          
          window.open(doc.output('bloburl'), '_blank');
          this.showNotification('success', 'Combined PDF with Customer and Office copies opened!');
          
        } else {
          const customerPDF = this.createPDF('CUSTOMER COPY');
          window.open(customerPDF.output('bloburl'), '_blank');
          this.showNotification('success', 'Invoice PDF opened in new tab!');
        }
        
        this.pdfLoading = false;

      } catch (err) {
        console.error(err);
        this.showNotification('error', 'Failed to generate PDF');
        this.pdfLoading = false;
      }
    },

    addPDFPage(doc, copyType) {
      const pageWidth = doc.internal.pageSize.width;
      const margin = 10;
      let yPos = 10;

      // Logo
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
      const invoiceNumber = this.serviceId || this.generateServiceNumber();
      const invoiceDate = new Date().toLocaleDateString('en-IN');

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
        `CUSTOMER NAME : ${formatName(this.serviceInfo.customerName) || 'N/A'}`,
        `MOBILE NO : ${this.serviceInfo.phoneNumber || 'N/A'}`,
        `BIKE MODEL : ${this.serviceInfo.bikeModel.toUpperCase() || 'N/A'}`,
        `PAYMENT MODE : ${this.formatPaymentMode(this.serviceInfo.paymentMode)}`
      ];
      
      customerInfo.forEach((line, index) => {
        doc.text(line, margin, yPos + (index * 4));
      });
      yPos += 14;

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
      this.parts.forEach((part, index) => {
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

        const description = part.name.toUpperCase();
        doc.text(description, col2 + 2, tableY + 4.5);

        // Add WARRANTY text if applicable
        if (part.isWarranty) {
          doc.setFontSize(7);
          doc.setTextColor(255, 0, 0);
          doc.text('----------------------------------------', col2 + 2, tableY + 4);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
        }

        doc.setFont('courier', 'normal');

        doc.text(
          String(part.quantity),
          col4 - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        // Show 0 price for warranty items
        const priceToShow = part.isWarranty ? 0 : part.unitPrice;
        doc.text(
          this.formatNumber(priceToShow),
          col5 - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        // Calculate amount - 0 for warranty items
        const amount = part.isWarranty ? 0 : part.quantity * part.unitPrice;
        
        doc.text(
          this.formatNumber(amount),
          margin + usableWidth - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        tableY += 7;
      });

      doc.line(margin, tableY, margin + usableWidth, tableY);
      tableY += 5;

      // Totals with warranty discount
      const partsTotal = this.calculatePartsTotal();
      const warrantySavings = this.calculateWarrantySavings();
      const discount = this.calculateDiscount();
      const labourCharge = this.serviceInfo.labourCharge || 0;
      const subTotal = this.calculateSubTotal();
      const gst = this.calculateGST();
      const grandTotal = this.calculateGrandTotal();

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
        if (this.serviceInfo.discountType === 'percentage') {
          discountLabel = `Discount (${this.serviceInfo.discountValue}%):`;
        }
        calculations.push({ label: discountLabel, value: -discount });
      }

      calculations.push({ label: 'Sub Total:', value: subTotal });

      if (this.serviceInfo.includeGST) {
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
          `- ${this.formatNumber(Math.abs(calc.value))}` : 
          this.formatNumber(calc.value);
        
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
    },

    createPDF(copyType = 'CUSTOMER COPY') {
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.width;
      const margin = 10;
      let yPos = 10;

      // Logo
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
      const invoiceNumber = this.serviceId || this.generateServiceNumber();
      const invoiceDate = new Date().toLocaleDateString('en-IN');

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
        `CUSTOMER NAME : ${formatName(this.serviceInfo.customerName) || 'N/A'}`,
        `MOBILE NO : ${this.serviceInfo.phoneNumber || 'N/A'}`,
        `BIKE MODEL : ${this.serviceInfo.bikeModel.toUpperCase() || 'N/A'}`,
        `PAYMENT MODE : ${this.formatPaymentMode(this.serviceInfo.paymentMode)}`
      ];
      
      customerInfo.forEach((line, index) => {
        doc.text(line, margin, yPos + (index * 4));
      });
      yPos += 14;

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
      this.parts.forEach((part, index) => {
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

        const description = part.name.toUpperCase();
        doc.text(description, col2 + 2, tableY + 4.5);

        // Add WARRANTY text if applicable
        if (part.isWarranty) {
          doc.setFontSize(7);
          doc.setTextColor(255, 0, 0);
          doc.text('WARRANTY', col2 + 2, tableY + 8);
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(9);
        }

        doc.setFont('courier', 'normal');

        doc.text(
          String(part.quantity),
          col4 - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        // Show 0 price for warranty items
        const priceToShow = part.isWarranty ? 0 : part.unitPrice;
        doc.text(
          this.formatNumber(priceToShow),
          col5 - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        // Calculate amount - 0 for warranty items
        const amount = part.isWarranty ? 0 : part.quantity * part.unitPrice;
        
        doc.text(
          this.formatNumber(amount),
          margin + usableWidth - 4,
          tableY + 4.5,
          { align: 'right' }
        );

        tableY += 7;
      });

      doc.line(margin, tableY, margin + usableWidth, tableY);
      tableY += 5;

      // Totals with warranty discount
      const partsTotal = this.calculatePartsTotal();
      const warrantySavings = this.calculateWarrantySavings();
      const discount = this.calculateDiscount();
      const labourCharge = this.serviceInfo.labourCharge || 0;
      const subTotal = this.calculateSubTotal();
      const gst = this.calculateGST();
      const grandTotal = this.calculateGrandTotal();

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
        if (this.serviceInfo.discountType === 'percentage') {
          discountLabel = `Discount (${this.serviceInfo.discountValue}%):`;
        }
        calculations.push({ label: discountLabel, value: -discount });
      }

      calculations.push({ label: 'Sub Total:', value: subTotal });

      if (this.serviceInfo.includeGST) {
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
          `- ${this.formatNumber(Math.abs(calc.value))}` : 
          this.formatNumber(calc.value);
        
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

      return doc;
    },

    // ==================== UTILITY METHODS ====================
    getSampleParts() {
      return [
        { id: 1, barcode: 'ENG-OIL-001', name: 'Engine Oil', category: 'engine', price: 450, quantity: 10 },
        { id: 2, barcode: 'OIL-FIL-002', name: 'Oil Filter', category: 'engine', price: 180, quantity: 15 },
        { id: 3, barcode: 'AIR-FIL-003', name: 'Air Filter', category: 'engine', price: 220, quantity: 8 },
        { id: 4, barcode: 'SPK-PLG-004', name: 'Spark Plug', category: 'engine', price: 150, quantity: 20 },
        { id: 5, barcode: 'BRK-PAD-005', name: 'Brake Pads', category: 'brakes', price: 600, quantity: 12 },
        { id: 6, barcode: 'BRK-DSC-006', name: 'Brake Disc', category: 'brakes', price: 1200, quantity: 5 },
        { id: 7, barcode: 'BATT-007', name: 'Battery', category: 'electrical', price: 2500, quantity: 7 },
        { id: 8, barcode: 'HL-BLB-008', name: 'Headlight Bulb', category: 'electrical', price: 180, quantity: 25 },
        { id: 9, barcode: 'TYR-009', name: 'Tyres', category: 'tyres', price: 1800, quantity: 6 },
        { id: 10, barcode: 'CHN-SET-010', name: 'Chain Set', category: 'body', price: 900, quantity: 9 },
        { id: 11, barcode: 'SVC-LAB-011', name: 'Service Labor', category: 'service', price: 500, quantity: 9999 },
        { id: 12, barcode: 'WHL-ALN-012', name: 'Wheel Alignment', category: 'service', price: 300, quantity: 9999 },
        { id: 13, barcode: 'CLT-PLT-013', name: 'Clutch Plate', category: 'engine', price: 800, quantity: 4 },
        { id: 14, barcode: 'SHK-ABS-014', name: 'Shock Absorber', category: 'suspension', price: 1200, quantity: 3 },
        { id: 15, barcode: 'MIR-015', name: 'Mirror', category: 'body', price: 350, quantity: 18 }
      ];
    },

    formatNumber(value) {
      if (value === null || value === undefined || isNaN(value)) {
        return '0';
      }

      return Number(value).toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    },

    generateServiceNumber() {
      const date = new Date();
      const year = date.getFullYear().toString().slice(-2);
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `BS${year}${month}${day}${random}`;
    },

    showNotification(type, message) {
      this.snackbar = {
        show: true,
        message,
        timeout: type === 'error' ? 4000 : 3000,
        color: type === 'error' ? 'error' : type === 'warning' ? 'warning' : 'success'
      };
    },

    resetForm() {
      if (confirm('Are you sure you want to reset the entire form? All unsaved data will be lost.')) {
        this.serviceInfo = {
          customerName: '',
          phoneNumber: '',
          email: '',
          bikeModel: '',
          registrationNumber: '',
          serviceType: '',
          estimatedDelivery: this.minDate,
          serviceNotes: '',
          status: 'pending',
          labourCharge: 0,
          discountType: 'none',
          discountValue: 0,
          includeGST: false
        };
        this.generateOfficeCopy = false;
        this.showCustomEntry = false;
        this.parts = [];
        this.resetPartForm();
        this.resetCustomPartForm();
        this.editingPartIndex = null;
        this.customEditingPartIndex = null;
        this.serviceId = null;
        this.showInfoErrors = false;
        this.showPartErrors = false;
        this.showCustomPartErrors = false;
        this.showNotification('info', 'Form reset successfully');
      }
    },

    startNewService() {
      this.serviceId = null;
      this.resetForm();
      this.showNotification('info', 'Ready for new service entry');
    }
  }
};
</script>

<style scoped>
/* The styles remain exactly the same as in your previous code */
/* Only removed the isCustom restriction from the warranty checkbox title */

/* Warranty Checkbox */
.warranty-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.warranty-checkbox input[type="checkbox"] {
  width: 16px;
  height: 16px;
  cursor: pointer;
}

.warranty-checkbox span {
  font-size: 12px;
  font-weight: 500;
  color: #e74c3c;
}

.warranty-checkbox input[type="checkbox"]:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}


.bike-service-form {
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f8f9fa;
  border-radius: 12px;
}

h2 {
  color: #2c3e50;
  text-align: center;
  margin-bottom: 30px;
  font-size: 28px;
  font-weight: 600;
}

h3 {
  color: #34495e;
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 600;
  border-bottom: 2px solid #e0e0e0;
  padding-bottom: 8px;
}

h4 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 16px;
  font-weight: 600;
  padding: 10px 0;
  border-bottom: 1px solid #e0e0e0;
}

.info-section,
.parts-section,
.charges-section {
  background: white;
  padding: 25px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  margin-bottom: 25px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

/* Custom Entry Toggle */
.custom-entry-toggle {
  margin-bottom: 20px;
  padding: 12px 15px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.custom-entry-toggle .checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
  gap: 10px;
  font-size: 14px;
}

.custom-entry-toggle .checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

/* Search and Custom Sections */
.search-section,
.custom-section {
  margin-bottom: 25px;
  padding: 15px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fdfdfd;
}

.custom-section {
  border-color: #3498db;
  background: #f8fafd;
}

/* Parts Grid Layout */
.parts-grid,
.custom-parts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  align-items: end;
}

.parts-grid .field-group.autocomplete {
  position: relative;
  grid-column: span 2;
}

.parts-grid .actions,
.custom-parts-grid .actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
  grid-column: span 2;
}

.custom-add-btn {
  background: #9b59b6 !important;
}

.custom-add-btn:hover:not(:disabled) {
  background: #8e44ad !important;
  transform: translateY(-2px);
}

/* Type badges in table */
.type-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.custom-badge {
  background: #9b59b6;
  color: white;
}

.search-badge {
  background: #3498db;
  color: white;
}

/* Rest of the styles remain the same */
.field-group {
  display: flex;
  flex-direction: column;
}

.field-group label {
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.field-group input,
.field-group select,
.field-group textarea {
  padding: 12px 15px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 15px;
  transition: all 0.3s ease;
  background: white;
}

.field-group input:focus,
.field-group select:focus,
.field-group textarea:focus {
  outline: none;
  border-color: #3498db;
  box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.readonly-input {
  background: #e9ecef !important;
  cursor: not-allowed;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #dee2e6;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 250px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.autocomplete-item {
  padding: 10px 15px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f8f9fa;
}

.autocomplete-item:hover {
  background: #f8f9fa;
}

.autocomplete-item .item-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.autocomplete-item .item-name {
  font-weight: 500;
  color: #2c3e50;
}

.autocomplete-item .item-code {
  font-size: 12px;
  color: #6c757d;
  font-family: monospace;
}

.autocomplete-item .item-price {
  color: #27ae60;
  font-weight: 600;
  white-space: nowrap;
}

.parts-table-section {
  margin-top: 30px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #6c757d;
  font-style: italic;
  background: #f8f9fa;
  border-radius: 8px;
  border: 2px dashed #dee2e6;
}

.table-wrapper {
  overflow-x: auto;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  margin-top: 15px;
}

.parts-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.parts-table thead {
  background: #2c3e50;
}

.parts-table thead th {
  color: white;
  padding: 15px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #1a252f;
}

.parts-table tbody tr {
  border-bottom: 1px solid #dee2e6;
}

.parts-table tbody tr:hover {
  background: #f8f9fa;
}

.parts-table td {
  padding: 12px 15px;
  vertical-align: middle;
}

.category-badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.category-badge.engine { background: #ffeaa7; color: #d35400; }
.category-badge.electrical { background: #a29bfe; color: white; }
.category-badge.brakes { background: #fd79a8; color: white; }
.category-badge.suspension { background: #81ecec; color: #00cec9; }
.category-badge.body { background: #55efc4; color: #00b894; }
.category-badge.tyres { background: #fab1a0; color: #d63031; }
.category-badge.service { background: #74b9ff; color: white; }
.category-badge.other { background: #dfe6e9; color: #636e72; }

.action-buttons {
  display: flex;
  gap: 8px;
  white-space: nowrap;
}

.parts-table tfoot {
  background: #2c3e50;
  color: white;
}

.parts-table tfoot td {
  padding: 15px;
  font-size: 16px;
}

.total-label {
  text-align: right;
}

.total-amount {
  color: #27ae60;
  font-size: 18px;
}

/* Charges Section Styles */
.charges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}

.gst-checkbox,
.office-copy-checkbox {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
  color: #495057;
  gap: 10px;
}

.checkbox-label input[type="checkbox"] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-hint {
  margin-top: 4px;
  color: #6c757d;
  font-size: 12px;
}

.calculation-display {
  grid-column: span 2;
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  margin-top: 10px;
}

.calc-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 15px;
}

.calc-item:last-child {
  border-bottom: none;
}

.calc-item.grand-total {
  font-size: 18px;
  font-weight: 600;
  color: #27ae60;
  padding-top: 15px;
  border-top: 2px solid #dee2e6;
  margin-top: 5px;
}

.calc-item .discount-amount {
  color: #e74c3c;
  font-weight: 600;
}

.summary-section {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 30px;
  align-items: end;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f1f1f1;
}

.summary-item .label {
  color: #6c757d;
  font-weight: 500;
}

.summary-item .value {
  color: #2c3e50;
  font-weight: 600;
}

.summary-item .value.total {
  color: #27ae60;
  font-size: 18px;
}

.submit-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 200px;
}

.success-section {
  margin-top: 30px;
  animation: fadeIn 0.5s ease;
}

.success-card {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  text-align: center;
  border-left: 5px solid #27ae60;
}

.success-icon {
  font-size: 48px;
  color: #27ae60;
  margin-bottom: 15px;
}

.service-id {
  background: #2c3e50;
  color: white;
  padding: 8px 16px;
  border-radius: 20px;
  font-family: monospace;
  font-size: 18px;
  margin: 0 10px;
}

.invoice-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

button {
  padding: 12px 20px;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.add-btn {
  background: #3498db;
  color: white;
}

.add-btn:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-2px);
}

.cancel-btn {
  background: #95a5a6;
  color: white;
}

.cancel-btn:hover {
  background: #7f8c8d;
}

.edit-btn {
  background: #f39c12;
  color: white;
  padding: 6px 12px;
  font-size: 13px;
}

.edit-btn:hover {
  background: #d68910;
}

.delete-btn {
  background: #e74c3c;
  color: white;
  padding: 6px 12px;
  font-size: 13px;
}

.delete-btn:hover {
  background: #c0392b;
}

.reset-btn {
  background: #95a5a6;
  color: white;
}

.reset-btn:hover {
  background: #7f8c8d;
}

.submit-btn {
  background: #27ae60;
  color: white;
}

.submit-btn:hover:not(:disabled) {
  background: #219653;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(39, 174, 96, 0.2);
}

.pdf-btn {
  background: #e74c3c;
  color: white;
}

.pdf-btn:hover:not(:disabled) {
  background: #c0392b;
}

.pdf-btn:disabled {
  background: #95a5a6;
}

.new-service-btn {
  background: #3498db;
  color: white;
}

.new-service-btn:hover {
  background: #2980b9;
}

.error-msg {
  color: #e74c3c;
  font-size: 12px;
  margin-top: 5px;
  font-weight: 500;
}

.dialog-title {
  color: #e74c3c;
  display: flex;
  align-items: center;
  gap: 10px;
}

.confirmation-details {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 6px;
  margin-top: 15px;
}

.confirmation-details p {
  margin: 8px 0;
}

/* Add to your existing CSS */
.charges-grid .field-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.charges-grid .field-group select:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@media (max-width: 1200px) {
  .parts-grid,
  .custom-parts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .parts-grid .field-group.autocomplete,
  .custom-parts-grid .actions,
  .parts-grid .actions {
    grid-column: span 2;
  }
}

@media (max-width: 768px) {
  .bike-service-form {
    padding: 15px;
  }
  .summary-section {
    grid-template-columns: 1fr;
  }
  .parts-grid,
  .custom-parts-grid {
    grid-template-columns: 1fr;
  }
  .parts-grid .field-group.autocomplete,
  .custom-parts-grid .actions,
  .parts-grid .actions {
    grid-column: span 1;
  }
  .charges-grid {
    grid-template-columns: 1fr;
  }
  .calculation-display {
    grid-column: span 1;
  }
  .action-buttons {
    flex-direction: column;
  }
  .submit-actions {
    width: 100%;
  }
  .invoice-actions {
    flex-direction: column;
  }
}

@media print {
  .parts-table {
    font-size: 12px;
  }
  .no-print {
    display: none !important;
  }
}
</style>