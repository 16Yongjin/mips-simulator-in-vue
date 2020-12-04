<template lang="pug">
v-dialog(v-model='dialog' max-width='600px')
  template(v-slot:activator='{ on, attrs }')
    v-btn(icon v-bind='attrs' v-on='on')
      v-icon(medium) mdi-pencil
  v-card
    v-card-title
      span.headline MIPS 명령어 작성
    v-card-text
      v-container
        v-row
          v-col.encoded(cols='5')
            div.bin-title 명령어 인코딩
            pre.bin.code(v-for="(bin, i) in encoded" :key="i" :class="{ error: bin === 'Parsing Error'}" )
              | {{ formatIndex(i + 1) }}. {{ bin }}
          v-col(cols='7')
            v-textarea.textarea(label="명령어 입력" rows="14" placeholder="MIPS 명령어 입력" v-model="code")
        v-row
          v-col.memory(cols='5')
            div.bin-title 데이터 인코딩
            pre.bin.code(v-for="(bin, i) in encodedData" :key="i" :class="{ error: bin === 'Parsing Error'}" )
              | {{ formatIndex(i + 1) }}. {{ bin }}
          v-col(cols='7')
            v-textarea.textarea(label="데이터 입력" rows="8" placeholder="메모리 데이터 입력" v-model="dataMemory")
    v-card-actions
      v-spacer
      v-btn(color='blue darken-1' text @click='dialog = false')
        | 닫기
      v-btn(color='blue darken-1' :disabled="disabled" text @click='onComplete')
        | 완료
</template>

<script lang="ts">
import Vue from 'vue'
import Component from 'vue-class-component'
import { encode } from '@/simulator/encode'

@Component({ name: 'InstructionWriteDialog' })
export default class InstructionWriteDialog extends Vue {
  dialog = false

  encode = encode

  code = `lui $t2 4096
lw $s0 0($t2)
lw $s1 4($t2)
lw $s2 8($t2)
lw $s3 12($t2)
lw $s4 16($t2)
add $t0 $s1 $s2
add $t1 $s3 $s4
sub $s0 $t0 $t1
sw $s0 0($t2)
ori $v0 $zero 10
syscall`

  dataMemory = `0x00000000
0x0000000a
0xfffffffb
0x00000006
0x00000003`

  get encoded() {
    return this.code
      .trim()
      .split('\n')
      .map(encode)
      .map(v => (v === null ? 'Parsing Error' : this.formatHex(v)))
  }

  get encodedData() {
    return this.dataMemory
      .trim()
      .split('\n')
      .map(v => Number(v))
      .map(v =>
        Number.isInteger(v) ? this.formatHex(v >>> 0) : 'Parsing Error'
      )
  }

  get disabled() {
    return (
      this.encoded.includes('Parsing Error') ||
      this.encodedData.includes('Parsing Error')
    )
  }

  onComplete() {
    const words = this.code
      .trim()
      .split('\n')
      .map(encode)

    const data = this.dataMemory
      .trim()
      .split('\n')
      .map(v => Number(v) >>> 0)

    this.$emit('write', { words, data })
    this.dialog = false
  }

  formatIndex(number: number) {
    return number.toString().padStart(2, ' ')
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
