<template lang="pug">
.header
  .header-title.d-flex
    v-icon.mr-2(x-large) mdi-cpu-32-bit
    | MIPS Simulator
  v-spacer
  div.header-actions
    v-btn.mr-4(fab @click="step" color="orange darken-2")
      v-icon(large) mdi-debug-step-over
    v-btn(fab @click="go" color="blue darken-2")
      v-icon(large) mdi-play
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'

@Component({ name: 'AppHeader' })
export default class AppHeader extends Vue {
  step() {
    this.$emit('step')
  }

  go() {
    this.$emit('go')
  }
}
</script>
