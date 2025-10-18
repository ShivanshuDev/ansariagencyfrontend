<template>
  <div>
    <v-btn icon @click="$emit('toggle-preview')"><v-icon>{{ preview ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon></v-btn>
    <v-btn class="ml-2" color="primary" elevation="2" @click="$emit('print')" :disabled="!hasItems"><v-icon left>mdi-printer</v-icon> Print</v-btn>
    <v-btn class="ml-2" color="success" elevation="2" @click="$emit('save')" :disabled="!hasItems"><v-icon left>mdi-content-save</v-icon> Save</v-btn>
  </div>
</template>

<script>
export default {
  name: 'ActionBar',
  props: { preview: { type: Boolean, default: false }, hasItems: { type: Boolean, default: false } }
}
</script>
