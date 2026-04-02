<template>
  <div>
    <!-- <v-btn icon @click="$emit('toggle-preview')"><v-icon>{{ preview ? 'mdi-eye-off' : 'mdi-eye' }}</v-icon></v-btn> -->
    <v-btn
  variant="tonal"
  color="primary"
  @click="$emit('toggle-preview')"
>
  <v-icon start>mdi-eye</v-icon>
  Show
</v-btn>

  </div>
</template>

<script>
export default {
  name: 'ActionBar',
  props: { preview: { type: Boolean, default: false }, hasItems: { type: Boolean, default: false } }
}
</script>
