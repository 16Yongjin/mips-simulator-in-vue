import { stdout } from './stdout'

export const REGISTER_STR = [
  '$zero', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3', '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$g7', '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7', '$t8', '$t9', '$k0', '$k1', '$gp', '$sp', '$fp', '$ra'
]
const $SP = 29

const formatHex = (str: number) => `${str.toString(16)}`

class Register {
  size: number
  REGISTERS: number[]
  R: number[]
  PC: number
  HI: number
  LO: number
  savedState: Record<string, number> = {}

  constructor() {
    this.size = 32
    this.REGISTERS = Array.from({ length: this.size }).map(() => 0)
    this.R = this.REGISTERS
    this.PC = 0
    this.HI = 0
    this.LO = 0
  }

  get SP() {
    return this.R[$SP]
  }

  reset() {
    for (let i = 0; i < this.size; i++) this.R[i] = 0
    this.HI = 0
    this.LO = 0
    this.R[$SP] = 0x80000000
    this.savedState = {}
  }

  jump(address: number) {
    this.PC = address
  }

  set(index: number, value: number) {
    if (!(index >= 0 && index < this.size)) {
      return stdout.printError('[Error] 잘못된 레지스터 접근')
    }

    this.R[index] = value
  }

  entries() {
    return [
      { name: 'PC', value: formatHex(this.PC) },
      { name: 'HI', value: formatHex(this.HI) },
      { name: 'LO', value: formatHex(this.LO) },
      ...this.R.map((value, i) => ({ name: REGISTER_STR[i], value: formatHex(value) }))
    ]
  }

  createState() {
    const state = REGISTER_STR.reduce((acc, name, idx) => {
      acc[name] = this.R[idx]
      return acc
    }, {} as Record<string, number>)
    state.PC = this.PC
    state.HI = this.HI
    state.LO = this.LO
    return state
  }

  saveState() {
    this.savedState = this.createState()
  }

  compareState() {
    const currentState = this.createState()

    const compareMap = Object.entries(currentState).reduce((acc, [name, value]) => {
      acc[name] = this.savedState[name] !== value
      return acc
    }, {} as Record<string, boolean>)

    return compareMap
  }
}

export const register = new Register()
