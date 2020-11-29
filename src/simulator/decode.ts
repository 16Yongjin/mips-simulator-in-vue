// OPCODE
export const enum OPCODE {
  R_FORMAT = 0,
  BLTZ = 1,
  J = 2,
  JAL = 3,
  BEQ = 4,
  BNE = 5,
  ADDI = 8,
  ADDIU = 9,
  SLTI = 10,
  SLTIU = 11,
  ANDI = 12,
  ORI = 13,
  XORI = 14,
  LUI = 15,
  LB = 32,
  LW = 35,
  LBU = 36,
  SB = 40,
  SW = 43
};

// FUNCT
export const enum FUNCT {
  SLL = 0,
  SRL = 2,
  SRA = 3,
  JR = 8,
  SYSCALL = 12,
  MFHI = 16,
  MFLO = 18,
  MUL = 24,
  DIV = 26,
  ADD = 32,
  SUB = 34,
  AND = 36,
  OR,
  XOR,
  NOR,
  SLT = 42
};

const REGISTER_STR = [
  '$zero', '$at', '$v0', '$v1', '$a0', '$a1', '$a2', '$a3', '$t0', '$t1', '$t2', '$t3', '$t4', '$t5', '$t6', '$g7', '$s0', '$s1', '$s2', '$s3', '$s4', '$s5', '$s6', '$s7', '$t8', '$t9', '$k0', '$k1', '$gp', '$sp', '$fp', '$ra'
]

const OPCODE_STR = [
  'R-format', 'bltz', 'j', 'jal', 'beq', 'bne', '', '', 'addi', '', 'slti', '', 'andi', 'ori', 'xori', 'lui', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', 'lb', '', '', 'lw', 'lbu', '', '', '', 'sb', '', '', 'sw', '', '', '', ''
]

const FUNCT_STR = [
  'sll', '', 'srl', 'sra', '', '', '', '', 'jr', '', '', '', 'syscall', '', '', '', '', 'mfhi', '', 'mflo', '', '', '', '', '', 'mul', '', '', '', '', '', '', 'add', '', 'sub', '', 'and', 'or', 'xor', 'nor', '', '', 'slt', '', '', '', '', ''
]

export function decode(word: number) {
  const opcode = word >>> 26
  const rs = (word >>> 21) & 0b11111
  const rt = (word >>> 16) & 0b11111
  const rd = (word >>> 11) & 0b11111
  const sh = (word >>> 6) & 0b11111
  const immediate = word << 16 >> 16
  const target = word & 0b11111111111111111111111111
  const funct = word & 0b111111

  const opStr = opcode ? OPCODE_STR[opcode] : FUNCT_STR[funct]
  const rsStr = REGISTER_STR[rs]
  const rtStr = REGISTER_STR[rt]
  const rdStr = REGISTER_STR[rd]

  if (opcode === OPCODE.R_FORMAT) {
    switch (funct) {
      case FUNCT.SLL: case FUNCT.SRL: case FUNCT.SRA:
        return `${opStr} ${rdStr} ${rtStr} ${sh}`
      case FUNCT.JR:
        return `${opStr} ${rsStr}`
      case FUNCT.SYSCALL:
        return 'syscall'
      case FUNCT.MFHI: case FUNCT.MFLO:
        return `${opStr} ${rdStr}`
      default:
        return `${opStr} ${rdStr} ${rsStr} ${rtStr}`
    }
  } else {
    switch (opcode) {
      case OPCODE.J: case OPCODE.JAL:
        return `${opStr} 0x${target.toString(16)}`
      case OPCODE.BLTZ:
        return `${opStr} ${rsStr} ${immediate}`
      case OPCODE.BEQ: case OPCODE.BNE:
        return `${opStr} ${rsStr} ${rtStr} ${immediate}`
      case OPCODE.ADDI: case OPCODE.ADDIU: case OPCODE.SLTI: case OPCODE.SLTIU:
        return `${opStr} ${rtStr} ${rsStr} ${immediate}`
      case OPCODE.ANDI: case OPCODE.ORI: case OPCODE.XORI:
        return `${opStr} ${rtStr} ${rsStr} ${immediate}`
      case OPCODE.LUI:
        return `${opStr} ${rtStr} ${immediate}`
      case OPCODE.LW: case OPCODE.SW: case OPCODE.LB: case OPCODE.SB: case OPCODE.LBU:
        return `${opStr} ${rtStr} ${immediate}(${rsStr})`
      default:
        return `Unknown Instruction 0x${word.toString(16)}`
    }
  }
}

export function printDecode(word: number) {
  console.log(decode(word))
}
