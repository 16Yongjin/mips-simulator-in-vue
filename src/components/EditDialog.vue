<template lang="pug">
v-dialog(v-model='dialog' max-width='600px')
  v-card
    v-card-title
      span.headline {{ target }} {{ name }} 수정
    v-card-text
      v-text-field.mt-5(
        v-model="textValue"
        :label="`${target} 값 입력`"
        placeholder="값을 입력해주세요"
        @keydown.enter="complete")
      .code 저장되는 값:  {{ valuePreview }}
    v-card-actions
      v-spacer
      v-btn(color='blue darken-1' text @click='close')
        | 닫기
      v-btn(color='blue darken-1' :disabled="!isNumber" text @click='complete')
        | 완료
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { Prop, Watch } from 'vue-property-decorator'

@Component({ name: 'EditDialog' })
export default class EditDialog extends Vue {
  @Prop(String)
  target!: string

  @Prop(Boolean)
  value!: boolean

  @Prop(String)
  name!: string

  @Prop(String)
  currentValue!: string

  textValue = ''

  get dialog() {
    return this.value
  }

  set dialog(v: boolean) {
    this.$emit('input', v)
  }

  get isNumber() {
    const value = Number(this.textValue)
    return this.textValue && Number.isSafeInteger(value)
  }

  get valuePreview() {
    const value = Number(this.textValue)
    return this.textValue && Number.isSafeInteger(value)
      ? `0x${this.formatHex(value >>> 0)}`
      : 'NaN'
  }

  @Watch('value')
  onValueChanged() {
    if (this.value) this.textValue = this.currentValue
  }

  close() {
    this.$emit('close')
  }

  complete() {
    if (!this.isNumber) return

    const name = this.name
    const value = Number(this.textValue) >>> 0
    const payload = { name, value }
    this.$emit('complete', payload)
    this.close()
  }

  formatHex(number: number) {
    return number.toString(16).padStart(8, '0')
  }
}
</script>

<style lang="scss" scoped>
.encoded {
  height: 400px;
  overflow-y: auto;
}

.bin-title {
  margin-bottom: -4px;
}

.bin {
  font-size: 16px;
  line-height: 1.75rem;
}

.textarea {
  font-family: monospace !important;
  font-size: 16px;
}

.memory {
  height: 275px;
  overflow-y: auto;
}
</style>
