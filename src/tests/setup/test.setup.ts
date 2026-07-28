import '@testing-library/jest-dom'

// antd's Select/Textarea (autoSize) observe element size via ResizeObserver, which jsdom doesn't implement.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = ResizeObserverStub
}
