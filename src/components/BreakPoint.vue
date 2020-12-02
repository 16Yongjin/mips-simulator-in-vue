<template lang="pug">
.breakpoint(@click="onInput" :class="{ checked: value }")
  .point
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop } from 'vue-property-decorator'

@Component({ name: 'BreakPoint' })
export default class BreakPoint extends Vue {
  @Prop()
  value!: boolean

  onInput() {
    this.$emit('input', !this.value)
  }
}
</script>

<style lang="scss">
.breakpoint {
  width: 24px;
  height: 24px;
  position: absolute;
  transform: translate(-30px);

  .point {
    width: 50%;
    height: 50%;
    transform: translate(50%, 50%);

    border-radius: 100%;
    background: red;
    opacity: 0;
  }

  &.checked {
    .point {
      opacity: 1;
    }
  }

  &:hover:not(.checked) {
    .point {
      opacity: 0.5;
    }
  }
}
</style>
