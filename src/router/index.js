// src/router/index.js
import Vue from 'vue'
import Router from 'vue-router'

// Lazy-load views (adjust paths to your files)
const TabdetailsVue = () => import('../views/tabdetails.vue')
const SellToVendorTablePage = () => import('../components/vendorSell/SellToVendorTable.vue') // optional: a page that shows the table
const SellToVendorAdd = () => import('../components/vendorSell/sellToVendor.vue')               // your big Add form

Vue.use(Router)

export default new Router({
  mode: 'history', // or 'hash' if you prefer
  routes: [
    { path: '/', name: 'Home', component: TabdetailsVue },
    {
      path: '/sell-to-vendor',
      name: 'SellToVendorList',
      component: SellToVendorTablePage, // or point to your table component page
      meta: { title: 'Sell To Vendor — List' }
    },
    {
      path: '/sell-to-vendor/add',
      name: 'SellToVendorAdd',
      component: SellToVendorAdd,
      meta: { title: 'Sell To Vendor — Add / Edit' }
      // We will pass ?invoiceNumber=... as a query param when editing
    },
    { path: '*', redirect: '/sell-to-vendor' }
  ],
  scrollBehavior () { return { x: 0, y: 0 } }
})
