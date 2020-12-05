const preprocess = (str: string) => str
  .replace(/,/g, ' ')
  .replace(/\s{2,}/g, ' ')
  .toLowerCase()
  .trim()

const functs: Record<string, number> = {
  sll: 0,
  srl: 2,
  sra: 3,
  jr: 8,
  syscall: 12,
  mfhi: 16,
  mflo: 18,
  mul: 24,
  div: 26,
  add: 32,
  sub: 34,
  and: 36,
  or: 37,
  xor: 38,
  nor: 39,
  slt: 42
}

const opcodes: Record<string, number> = {
  rFormat: 0,
  bltz: 1,
  j: 2,
  jal: 3,
  beq: 4,
  bne: 5,
  addi: 8,
  addiu: 9,
  slti: 10,
  sltiu: 11,
  andi: 12,
  ori: 13,
  xori: 14,
  lui: 15,
  lb: 32,
  lw: 35,
  lbu: 36,
  sb: 40,
  sw: 43
}

const registers: Record<string, number> = {
  $zero: 0,
  $at: 1,
  $v0: 2,
  $v1: 3,
  $a0: 4,
  $a1: 5,
  $a2: 6,
  $a3: 7,
  $t0: 8,
  $t1: 9,
  $t2: 10,
  $t3: 11,
  $t4: 12,
  $t5: 13,
  $t6: 14,
  $g7: 15,
  $s0: 16,
  $s1: 17,
  $s2: 18,
  $s3: 19,
  $s4: 20,
  $s5: 21,
  $s6: 22,
  $s7: 23,
  $t8: 24,
  $t9: 25,
  $k0: 26,
  $k1: 27,
  $gp: 28,
  $sp: 29,
  $fp: 30,
  $ra: 31
}

const getOpcode = (token: string) => {
  const funct = functs[token]
  const opcode = opcodes[token]

  if (Number.isInteger(funct)) return 0
  else if (Number.isInteger(opcode)) return opcode << 26
  return null
}

const getFunct = (token: string) => {
  const funct = functs[token]

  return Number.isInteger(funct) ? (funct & 0b111111) : null
}

const getRegister = (token: string) => {
  const reg = registers[token]
  return Number.isInteger(reg) ? reg : null
}

const getRs = (token: string) => {
  const reg = getRegister(token)
  return reg !== null ? (reg & 0b11111) << 21 : null
}

const getRt = (token: string) => {
  const reg = getRegister(token)
  return reg !== null ? (reg & 0b11111) << 16 : null
}
const getRd = (token: string) => {
  const reg = getRegister(token)
  return reg !== null ? (reg & 0b11111) << 11 : null
}

const parseInteger = (token: string) => {
  const imm = Number(token)

  return Number.isInteger(imm) ? imm : null
}

const getSh = (token: string) => {
  const sh = parseInteger(token)
  return sh !== null ? (sh & 0b11111) << 6 : null
}

const getTarget = (token: string) => {
  const target = parseInteger(token)
  return target !== null ? (target & 0b11111111111111111111111111) : null
}

const getImmediate = (token: string) => {
  const imm = parseInteger(token)
  return imm !== null ? (imm & 0b1111111111111111) : null
}

const combine = (...numbers: (number | null)[]) =>
  numbers.reduce((acc, v) =>
    (acc === null || v === null) ? null : ((acc | v) >>> 0)
  )

export const encode = (str: string) => {
  const string = preprocess(str)

  const shiftRegex = /^(sll|srl|sra) (\$\w+) (\$\w+) ((0x)?[\da-f]+)$/
  const res1 = string.match(shiftRegex)
  if (res1) {
    const [_, name, rdStr, rtStr, shStr] = res1
    const opcode = getOpcode(name)
    const funct = getFunct(name)
    const rd = getRd(rdStr)
    const rt = getRt(rtStr)
    const sh = getSh(shStr)
    const word = combine(opcode, funct, rd, rt, sh)
    return word
  }

  const jrRegex = /^(jr) (\$\w+)$/
  const res2 = string.match(jrRegex)
  if (res2) {
    const [_, name, rsStr] = res2
    const opcode = getOpcode(name)
    const funct = getFunct(name)
    const rs = getRs(rsStr)
    const word = combine(opcode, funct, rs)
    return word
  }

  const syscallRegex = /^(syscall)$/
  const res3 = string.match(syscallRegex)
  if (res3) {
    const [_, name] = res3
    const opcode = getOpcode(name)
    const funct = getFunct(name)
    const word = combine(opcode, funct)
    return word
  }

  const mfhiloRegex = /^(mfhi|mflo) (\$\w+)$/
  const res4 = string.match(mfhiloRegex)
  if (res4) {
    const [_, name, rdStr] = res4
    const opcode = getOpcode(name)
    const funct = getFunct(name)
    const rd = getRd(rdStr)
    const word = combine(opcode, funct, rd)
    return word
  }

  const extraRFormatRegex = /^(div|add|sub|and|or|xor|nor|slt) (\$\w+) (\$\w+) (\$\w+)$/
  const res5 = string.match(extraRFormatRegex)
  if (res5) {
    const [_, name, rdStr, rsStr, rtStr] = res5
    const opcode = getOpcode(name)
    const funct = getFunct(name)
    const rd = getRd(rdStr)
    const rs = getRs(rsStr)
    const rt = getRt(rtStr)
    const word = combine(opcode, funct, rd, rs, rt)
    return word
  }

  const jRegex = /^(j|jal) ((0x)?[\da-f]+)$/
  const res6 = string.match(jRegex)
  if (res6) {
    const [_, name, targetStr] = res6
    const opcode = getOpcode(name)
    const target = getTarget(targetStr)
    const word = combine(opcode, target)
    return word
  }

  const bltzRegex = /^(bltz) (\$\w+) (-?(0x)?[\da-f]+)$/
  const res7 = string.match(bltzRegex)
  if (res7) {
    const [_, name, rsStr, immStr] = res7
    const opcode = getOpcode(name)
    const rs = getRs(rsStr)
    const imm = getImmediate(immStr)
    const word = combine(opcode, rs, imm)
    return word
  }

  const branchRegex = /^(beq|bne) (\$\w+) (\$\w+) (-?(0x)?[\da-f]+)$/
  const res8 = string.match(branchRegex)
  if (res8) {
    const [_, name, rsStr, rtStr, immStr] = res8
    const opcode = getOpcode(name)
    const rs = getRs(rsStr)
    const rt = getRt(rtStr)
    const imm = getImmediate(immStr)
    const word = combine(opcode, rs, rt, imm)
    return word
  }

  const addILogicIRegex = /^(addi|addiu|slti|sltiu|andi|ori|xori) (\$\w+) (\$\w+) (-?(0x)?[\da-f]+)$/
  const res9 = string.match(addILogicIRegex)
  if (res9) {
    const [_, name, rtStr, rsStr, immStr] = res9
    const opcode = getOpcode(name)
    const rt = getRt(rtStr)
    const rs = getRs(rsStr)
    const imm = getImmediate(immStr)
    const word = combine(opcode, rt, rs, imm)
    return word
  }

  const luiRegex = /^(lui) (\$\w+) (-?(0x)?[\da-f]+)$/
  const res10 = string.match(luiRegex)
  if (res10) {
    const [_, name, rtStr, immStr] = res10
    const opcode = getOpcode(name)
    const rt = getRt(rtStr)
    const imm = getImmediate(immStr)
    const word = combine(opcode, rt, imm)
    return word
  }

  const loadStoreRegex = /^(lw|sw|lb|sb|lbu) (\$\w+) (-?(0x)?[\da-f]+)\((\$\w+)\)$/
  const res11 = string.match(loadStoreRegex)
  if (res11) {
    const [_, name, rtStr, immStr, __, rsStr] = res11
    const opcode = getOpcode(name)
    const rt = getRt(rtStr)
    const rs = getRs(rsStr)
    const imm = getImmediate(immStr)
    const word = combine(opcode, rt, rs, imm)
    return word
  }

  const mulRegex = /^(mul) (\$\w+) (\$\w+)$/
  const res12 = string.match(mulRegex)
  if (res12) {
    const [_, name, rsStr, rtStr] = res12
    const opcode = getOpcode(name)
    const funct = getFunct(name)
    const rs = getRs(rsStr)
    const rt = getRt(rtStr)
    const word = combine(opcode, funct, rt, rs)
    return word
  }

  return null
}

/*
const tester = (input: string, output: number) => {
  const res = encode(input)
  if (res !== output) {
    console.log(`${input} 테스트 실패`)
  }
}

tester('lui $t2 4096', 0x3c0a1000)
tester('lw $s0 0($t2)', 0x8d500000)
tester('lw $s1 4($t2)', 0x8d510004)
tester('lw $s2 8($t2)', 0x8d520008)
tester('lw $s3 12($t2)', 0x8d53000c)
tester('lw $s4 16($t2)', 0x8d540010)
tester('add $t0 $s1 $s2', 0x02324020)
tester('add $t1 $s3 $s4', 0x02744820)
tester('sub $s0 $t0 $t1', 0x01098022)
tester('sw $s0 0($t2)', 0xad500000)
tester('ori $v0 $zero 10', 0x3402000a)
tester('syscall', 0x0000000c)
tester('mfhi $t1', 0x00004810)
tester('mflo $t1', 0x00004812)

tester('ori $s0 $zero 21930', 0x341055aa)
tester('ori $s1 $zero -21931', 0x3411aa55)
tester('lui $s2 -21931', 0x3c12aa55)
tester('sll $t0 $s1 4', 0x00114100)
tester('srl $t1 $s2 4', 0x00124902)
tester('sra $t2 $s2 4', 0x00125103)
tester('and $t3 $s0 $s1', 0x02115824)
tester('or $t4 $s0 $s1', 0x02116025)
tester('xor $t5 $s0 $s1', 0x02116826)
tester('nor $t6 $s0 $s1', 0x02117027)
tester('ori $v0 $zero 10', 0x3402000a)
tester('syscall', 0x0000000c)

tester('ori $s0 $zero 1', 0x34100001)
tester('ori $s1 $zero 1', 0x34110001)
tester('ori $s2 $zero 0', 0x34120000)
tester('ori $s3 $zero 4', 0x34130004)
tester('bne $s0 $s1 3', 0x16110003)
tester('add $s2 $zero $s3', 0x00139020)
tester('j 0x100008', 0x08100008)
tester('sub $s2 $zero $s3', 0x00139022)
tester('add $s0 $zero $zero', 0x00008020)
tester('bne $s0 $s1 3', 0x16110003)
tester('add $s2 $zero $s3', 0x00139020)
tester('j 0x10000d', 0x0810000d)
tester('sub $s2 $zero $s3', 0x00139022)
tester('ori $v0 $zero 10', 0x3402000a)
tester('syscall', 0x0000000c)

tester('addi $sp $sp -4', 0x23bdfffc)
tester('sw $ra 0($sp)', 0xafbf0000)
tester('ori $a0 $zero 1', 0x34040001)
tester('ori $a1 $zero 2', 0x34050002)
tester('jal 0x10000a', 0x0c10000a)
tester('add $s0 $v0 $zero', 0x00408020)
tester('lw $ra 0($sp)', 0x8fbf0000)
tester('addi $sp $sp 4', 0x23bd0004)
tester('ori $v0 $zero 10', 0x3402000a)
tester('syscall', 0x0000000c)
tester('add $v0 $a0 $a1', 0x00851020)
tester('jr $ra', 0x03e00008)
*/
