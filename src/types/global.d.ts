// 全局类型声明文件

// 扩展HTMLElement接口
declare global {
  interface HTMLElement {
    style: CSSStyleDeclaration;
  }
  
  interface Element {
    style: CSSStyleDeclaration;
  }
  
  // 扩展HTMLIFrameElement
  interface HTMLIFrameElement {
    contentWindow: Window | null;
    contentDocument: Document | null;
  }
  
  // 事件处理器上下文类型
  interface EventTarget {
    value?: string;
    checked?: boolean;
    disabled?: boolean;
    innerHTML?: string;
    textContent?: string;
    classList: DOMTokenList;
    style: CSSStyleDeclaration;
    getAttribute(name: string): string | null;
    setAttribute(name: string, value: string): void;
    querySelector(selector: string): Element | null;
    querySelectorAll(selector: string): NodeListOf<Element>;
    addEventListener(type: string, listener: EventListener): void;
    removeEventListener(type: string, listener: EventListener): void;
  }
}

export {}; 