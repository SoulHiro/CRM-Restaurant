declare module 'qz-tray' {
  interface QzConfig {
    [key: string]: unknown
  }

  interface QzPrintData {
    type: string
    format: string
    flavor: string
    data: string
  }

  interface QzWebsocket {
    isActive(): boolean
    connect(): Promise<void>
  }

  type QzPromiseHandler = (
    resolve: (value: string) => void,
    reject: (reason?: unknown) => void
  ) => void

  interface QzSecurity {
    setCertificatePromise(handler: () => Promise<string>): void
    setSignaturePromise(
      factory: (paraAssinar: string) => QzPromiseHandler
    ): void
    setSignatureAlgorithm(algorithm: 'SHA1' | 'SHA256' | 'SHA512'): void
  }

  interface Qz {
    websocket: QzWebsocket
    configs: {
      create(printer: string): QzConfig
    }
    printers: {
      find(): Promise<string[]>
    }
    security: QzSecurity
    print(config: QzConfig, data: QzPrintData[]): Promise<void>
  }

  const qz: Qz
  export default qz
}
