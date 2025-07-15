/**
 * Touch gesture utilities for Dashview V2.
 * Provides swipe detection, long press handling, and haptic feedback.
 */

export interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  element: Element;
}

export interface LongPressEvent {
  element: Element;
  x: number;
  y: number;
}

export interface GestureOptions {
  swipeThreshold?: number;
  longPressDelay?: number;
  velocityThreshold?: number;
  preventScroll?: boolean;
}

const DEFAULT_OPTIONS: Required<GestureOptions> = {
  swipeThreshold: 50,
  longPressDelay: 500,
  velocityThreshold: 0.3,
  preventScroll: false
};

export class GestureHandler {
  private element: Element;
  private options: Required<GestureOptions>;
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private longPressTimeout?: number;
  private isLongPress = false;
  private isSwiping = false;

  private onSwipe?: (event: SwipeEvent) => void;
  private onLongPress?: (event: LongPressEvent) => void;
  private onTap?: (event: TouchEvent) => void;

  constructor(element: Element, options: GestureOptions = {}) {
    this.element = element;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.bindEvents();
  }

  public onSwipeDetected(callback: (event: SwipeEvent) => void): void {
    this.onSwipe = callback;
  }

  public onLongPressDetected(callback: (event: LongPressEvent) => void): void {
    this.onLongPress = callback;
  }

  public onTapDetected(callback: (event: TouchEvent) => void): void {
    this.onTap = callback;
  }

  private bindEvents(): void {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this) as EventListener, { passive: !this.options.preventScroll });
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this) as EventListener, { passive: !this.options.preventScroll });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this) as EventListener, { passive: true });
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this) as EventListener, { passive: true });
  }

  private handleTouchStart(event: TouchEvent): void {
    const touch = event.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
    this.isLongPress = false;
    this.isSwiping = false;

    // Start long press timer
    if (this.onLongPress) {
      this.longPressTimeout = window.setTimeout(() => {
        this.isLongPress = true;
        this.onLongPress!({
          element: this.element,
          x: this.startX,
          y: this.startY
        });
        this.triggerHapticFeedback('medium');
      }, this.options.longPressDelay);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (this.isLongPress) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.startX);
    const deltaY = Math.abs(touch.clientY - this.startY);

    // Cancel long press if moving too much
    if ((deltaX > 10 || deltaY > 10) && this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = undefined;
    }

    // Detect swipe start
    if (!this.isSwiping && (deltaX > this.options.swipeThreshold || deltaY > this.options.swipeThreshold)) {
      this.isSwiping = true;

      if (this.options.preventScroll) {
        event.preventDefault();
      }
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    const endTime = Date.now();
    const deltaX = touch.clientX - this.startX;
    const deltaY = touch.clientY - this.startY;
    const duration = endTime - this.startTime;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Clear long press timer
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = undefined;
    }

    if (this.isLongPress) {
      // Long press already handled
      return;
    }

    if (this.isSwiping && distance >= this.options.swipeThreshold) {
      // Handle swipe
      const velocity = distance / duration;
      
      if (velocity >= this.options.velocityThreshold) {
        const direction = this.getSwipeDirection(deltaX, deltaY);
        
        if (this.onSwipe) {
          this.onSwipe({
            direction,
            distance,
            velocity,
            element: this.element
          });
        }

        this.triggerHapticFeedback('light');
      }
    } else if (!this.isSwiping && duration < 200) {
      // Handle tap
      if (this.onTap) {
        this.onTap(event);
      }
    }

    this.reset();
  }

  private handleTouchCancel(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
      this.longPressTimeout = undefined;
    }
    this.reset();
  }

  private getSwipeDirection(deltaX: number, deltaY: number): 'left' | 'right' | 'up' | 'down' {
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    if (absDeltaX > absDeltaY) {
      return deltaX > 0 ? 'right' : 'left';
    } else {
      return deltaY > 0 ? 'down' : 'up';
    }
  }

  private reset(): void {
    this.isLongPress = false;
    this.isSwiping = false;
  }

  private triggerHapticFeedback(intensity: 'light' | 'medium' | 'heavy'): void {
    if ('vibrate' in navigator) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 50
      };
      navigator.vibrate(patterns[intensity]);
    }
  }

  public destroy(): void {
    if (this.longPressTimeout) {
      clearTimeout(this.longPressTimeout);
    }
    
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this) as EventListener);
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this) as EventListener);
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this) as EventListener);
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this) as EventListener);
  }
}

/**
 * Simple swipe detection for elements
 */
export function addSwipeListener(
  element: Element,
  callback: (event: SwipeEvent) => void,
  options?: GestureOptions
): () => void {
  const handler = new GestureHandler(element, options);
  handler.onSwipeDetected(callback);
  
  return () => handler.destroy();
}

/**
 * Simple long press detection for elements
 */
export function addLongPressListener(
  element: Element,
  callback: (event: LongPressEvent) => void,
  options?: GestureOptions
): () => void {
  const handler = new GestureHandler(element, options);
  handler.onLongPressDetected(callback);
  
  return () => handler.destroy();
}

/**
 * Haptic feedback utilities
 */
export class HapticFeedback {
  private static isSupported(): boolean {
    return 'vibrate' in navigator;
  }

  public static light(): void {
    if (this.isSupported()) {
      navigator.vibrate(10);
    }
  }

  public static medium(): void {
    if (this.isSupported()) {
      navigator.vibrate(20);
    }
  }

  public static heavy(): void {
    if (this.isSupported()) {
      navigator.vibrate([50, 50, 50]);
    }
  }

  public static success(): void {
    if (this.isSupported()) {
      navigator.vibrate([10, 100, 10]);
    }
  }

  public static error(): void {
    if (this.isSupported()) {
      navigator.vibrate([100, 50, 100, 50, 100]);
    }
  }

  public static selection(): void {
    if (this.isSupported()) {
      navigator.vibrate(5);
    }
  }

  public static custom(pattern: number | number[]): void {
    if (this.isSupported()) {
      navigator.vibrate(pattern);
    }
  }
}

/**
 * Touch target size helpers
 */
export const TouchTarget = {
  /**
   * Minimum touch target size (44px) as per WCAG guidelines
   */
  MIN_SIZE: 44,

  /**
   * Check if an element meets minimum touch target requirements
   */
  meetsMinimumSize(element: Element): boolean {
    const rect = element.getBoundingClientRect();
    return rect.width >= this.MIN_SIZE && rect.height >= this.MIN_SIZE;
  },

  /**
   * Add touch target padding to an element if needed
   */
  ensureMinimumSize(element: HTMLElement): void {
    const rect = element.getBoundingClientRect();
    
    if (rect.width < this.MIN_SIZE) {
      const padding = (this.MIN_SIZE - rect.width) / 2;
      element.style.paddingLeft = `${padding}px`;
      element.style.paddingRight = `${padding}px`;
    }
    
    if (rect.height < this.MIN_SIZE) {
      const padding = (this.MIN_SIZE - rect.height) / 2;
      element.style.paddingTop = `${padding}px`;
      element.style.paddingBottom = `${padding}px`;
    }
  }
};

/**
 * Gesture-enabled base class for Lit elements
 */
export class GestureElement extends EventTarget {
  private gestureHandler?: GestureHandler;

  protected enableGestures(element: Element, options?: GestureOptions): void {
    this.gestureHandler = new GestureHandler(element, options);
    
    this.gestureHandler.onSwipeDetected((event) => {
      this.dispatchEvent(new CustomEvent('gesture-swipe', { detail: event }));
    });
    
    this.gestureHandler.onLongPressDetected((event) => {
      this.dispatchEvent(new CustomEvent('gesture-longpress', { detail: event }));
    });
    
    this.gestureHandler.onTapDetected((event) => {
      this.dispatchEvent(new CustomEvent('gesture-tap', { detail: event }));
    });
  }

  protected disableGestures(): void {
    if (this.gestureHandler) {
      this.gestureHandler.destroy();
      this.gestureHandler = undefined;
    }
  }
}