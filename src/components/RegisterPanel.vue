<template lang="pug">
v-col.h-100(cols="2")
  v-card.h-100.card.rounded-xl(elevation="4")
    v-card-title.card-title 레지스터
    v-card-text.code.card-text
      div(v-for="(reg, i) in register.entries()" :key="i")
        .d-flex(:class="{ changed: registerChanged[reg.name]}")
          div.w-100 {{ reg.name }}
          div.w-100 {{ reg.value }}
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { register } from '@/simulator/register'
import { Prop } from 'vue-property-decorator'

@Component({ name: 'RegisterPanel' })
export default class RegisterPanel extends Vue {
  @Prop(Object)
  registerChanged!: Record<string, boolean>

  register = register
}
</script>
