interface Output {
  text: string
  color: string
}

export class StandardOut {
  outputs = [] as Output[]

  print(text: string) {
    this.outputs.push({ text, color: '' })
  }

  printError(text: string) {
    this.outputs.push({ text, color: 'red' })
  }

  printDebug(text: string) {
    this.outputs.push({ text, color: 'green ' })
  }

  reset() {
    this.outputs = []
  }
}

export const stdout = new StandardOut()
