<template>
  <div>
    <v-select
      :items="vendors"
      item-text="name"
      item-value="pk"
      label="Select vendor"
      v-model="selectedKeyLocal"
      dense
      outlined
      clearable
      :loading="loading"
      @change="onChange"
    />
  </div>
</template>

<script>
export default {
  name: 'VendorSelect',
  props: {
    vendors: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    selectedKey: { required: false }
  },
  computed: {
    selectedVendor() {
      return this.vendors.find(v => v.pk === this.selectedKeyLocal) || null
    }
  },
  data() { return { selectedKeyLocal: this.selectedKey || null } },
  watch: {
    selectedKey(val) { this.selectedKeyLocal = val },
    selectedKeyLocal(val) { this.$emit('update:selectedKey', val) }
  },
  methods: {
    onChange() { this.$emit('fetch-vendors') /* optional: parent can refetch if needed */ }
  }
}
</script>
