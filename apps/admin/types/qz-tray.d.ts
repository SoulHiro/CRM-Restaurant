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

  interface Qz {
    websocket: QzWebsocket
    configs: {
      create(printer: string): QzConfig
    }
    print(config: QzConfig, data: QzPrintData[]): Promise<void>
  }

  const qz: Qz
  export default qz
}
