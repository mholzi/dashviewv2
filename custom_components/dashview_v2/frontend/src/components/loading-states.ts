/**
 * Loading states components for Dashview V2.
 * Provides consistent loading, error, and empty state components.
 */

import { LitElement, TemplateResult, css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { fadeStyles, skeletonStyles, spinnerStyles } from '../styles/animations';

@customElement('dashview-skeleton-loader')
export class SkeletonLoader extends LitElement {
  @property({ type: String }) variant: 'text' | 'button' | 'icon' | 'card' = 'text';
  @property({ type: String }) size: 'small' | 'medium' | 'large' = 'medium';
  @property({ type: Number }) count = 1;
  @property({ type: String }) width = '';
  @property({ type: String }) height = '';

  protected render(): TemplateResult {
    const skeletons = Array.from({ length: this.count }, () => 
      html`<div class="skeleton ${this.variant} ${this.size}" style="${this.getSkeletonStyle()}"></div>`
    );

    return html`${skeletons}`;
  }

  private getSkeletonStyle(): string {
    const styles: string[] = [];
    
    if (this.width) styles.push(`width: ${this.width}`);
    if (this.height) styles.push(`height: ${this.height}`);
    
    return styles.join('; ');
  }

  static styles = [
    skeletonStyles,
    css`
      :host {
        display: block;
      }

      .skeleton.text {
        height: 16px;
        margin: 4px 0;
      }

      .skeleton.text.small {
        height: 12px;
      }

      .skeleton.text.large {
        height: 20px;
      }

      .skeleton.button {
        height: 36px;
        width: 100px;
      }

      .skeleton.icon {
        width: 24px;
        height: 24px;
        border-radius: 50%;
      }

      .skeleton.card {
        height: 120px;
        width: 100%;
        border-radius: 8px;
      }
    `
  ];
}

@customElement('dashview-spinner')
export class Spinner extends LitElement {
  @property({ type: String }) size: 'small' | 'medium' | 'large' = 'medium';
  @property({ type: String }) color = 'var(--primary-color)';

  protected render(): TemplateResult {
    return html`
      <div class="spinner-container">
        <div class="spinner ${this.size}" style="border-color: ${this.color}"></div>
      </div>
    `;
  }

  static styles = [
    spinnerStyles,
    css`
      :host {
        display: inline-block;
      }

      .spinner-container {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .spinner {
        border: 2px solid transparent;
        border-top: 2px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      .spinner.small {
        width: 16px;
        height: 16px;
      }

      .spinner.medium {
        width: 24px;
        height: 24px;
      }

      .spinner.large {
        width: 32px;
        height: 32px;
      }
    `
  ];
}

@customElement('dashview-progress-bar')
export class ProgressBar extends LitElement {
  @property({ type: Number }) value = 0;
  @property({ type: Number }) max = 100;
  @property({ type: Boolean }) indeterminate = false;
  @property({ type: String }) color = 'var(--primary-color)';

  protected render(): TemplateResult {
    const percentage = this.indeterminate ? 0 : (this.value / this.max) * 100;

    return html`
      <div class="progress-container">
        <div class="progress-bar">
          <div 
            class="progress-fill ${this.indeterminate ? 'indeterminate' : ''}"
            style="width: ${percentage}%; background-color: ${this.color}"
          ></div>
        </div>
        ${!this.indeterminate ? html`
          <span class="progress-text">${Math.round(percentage)}%</span>
        ` : ''}
      </div>
    `;
  }

  static styles = css`
    :host {
      display: block;
    }

    .progress-container {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background: var(--divider-color);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--primary-color);
      border-radius: 4px;
      transition: width 0.3s ease;
    }

    .progress-fill.indeterminate {
      width: 30% !important;
      animation: indeterminate-progress 2s linear infinite;
    }

    @keyframes indeterminate-progress {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(400%); }
    }

    .progress-text {
      font-size: 0.8em;
      color: var(--secondary-text-color);
      min-width: 35px;
      text-align: right;
    }
  `;
}

@customElement('dashview-error-state')
export class ErrorState extends LitElement {
  @property({ type: String }) message = 'Something went wrong';
  @property({ type: String }) icon = 'mdi:alert-circle';
  @property({ type: Boolean }) showRetry = true;
  @property({ type: String }) retryLabel = 'Retry';

  protected render(): TemplateResult {
    return html`
      <div class="error-container">
        <ha-icon icon="${this.icon}" class="error-icon"></ha-icon>
        <div class="error-content">
          <h3 class="error-title">Error</h3>
          <p class="error-message">${this.message}</p>
          ${this.showRetry ? html`
            <mwc-button 
              outlined 
              @click=${this.handleRetry}
              class="retry-button"
            >
              <ha-icon icon="mdi:refresh" slot="icon"></ha-icon>
              ${this.retryLabel}
            </mwc-button>
          ` : ''}
        </div>
      </div>
    `;
  }

  private handleRetry(): void {
    this.dispatchEvent(new CustomEvent('retry', { bubbles: true }));
  }

  static styles = css`
    :host {
      display: block;
    }

    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 32px 16px;
      text-align: center;
      color: var(--secondary-text-color);
    }

    .error-icon {
      --mdc-icon-size: 48px;
      color: var(--error-color, #f44336);
      margin-bottom: 16px;
    }

    .error-content {
      max-width: 300px;
    }

    .error-title {
      margin: 0 0 8px 0;
      font-size: 1.1em;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .error-message {
      margin: 0 0 16px 0;
      font-size: 0.9em;
      line-height: 1.4;
    }

    .retry-button {
      --mdc-theme-primary: var(--primary-color);
    }
  `;
}

@customElement('dashview-empty-state')
export class EmptyState extends LitElement {
  @property({ type: String }) message = 'No items found';
  @property({ type: String }) icon = 'mdi:inbox';
  @property({ type: String }) actionLabel = '';
  @property({ type: String }) actionIcon = '';

  protected render(): TemplateResult {
    return html`
      <div class="empty-container">
        <ha-icon icon="${this.icon}" class="empty-icon"></ha-icon>
        <div class="empty-content">
          <h3 class="empty-title">Nothing here yet</h3>
          <p class="empty-message">${this.message}</p>
          ${this.actionLabel ? html`
            <mwc-button 
              raised 
              @click=${this.handleAction}
              class="action-button"
            >
              ${this.actionIcon ? html`<ha-icon icon="${this.actionIcon}" slot="icon"></ha-icon>` : ''}
              ${this.actionLabel}
            </mwc-button>
          ` : ''}
        </div>
      </div>
    `;
  }

  private handleAction(): void {
    this.dispatchEvent(new CustomEvent('action', { bubbles: true }));
  }

  static styles = css`
    :host {
      display: block;
    }

    .empty-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 48px 16px;
      text-align: center;
      color: var(--secondary-text-color);
    }

    .empty-icon {
      --mdc-icon-size: 64px;
      color: var(--disabled-text-color);
      margin-bottom: 24px;
      opacity: 0.6;
    }

    .empty-content {
      max-width: 300px;
    }

    .empty-title {
      margin: 0 0 8px 0;
      font-size: 1.2em;
      font-weight: 500;
      color: var(--primary-text-color);
    }

    .empty-message {
      margin: 0 0 24px 0;
      font-size: 0.9em;
      line-height: 1.4;
    }

    .action-button {
      --mdc-theme-primary: var(--primary-color);
    }
  `;
}

@customElement('dashview-loading-overlay')
export class LoadingOverlay extends LitElement {
  @property({ type: Boolean }) visible = false;
  @property({ type: String }) message = 'Loading...';

  protected render(): TemplateResult {
    if (!this.visible) return html``;

    return html`
      <div class="overlay">
        <div class="overlay-content">
          <dashview-spinner size="large"></dashview-spinner>
          <p class="overlay-message">${this.message}</p>
        </div>
      </div>
    `;
  }

  static styles = [
    fadeStyles,
    css`
      :host {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 1000;
        pointer-events: none;
      }

      .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fade-in 0.2s ease;
        pointer-events: auto;
      }

      .overlay-content {
        background: var(--card-background-color);
        border-radius: 8px;
        padding: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }

      .overlay-message {
        margin: 0;
        color: var(--primary-text-color);
        font-size: 0.9em;
      }
    `
  ];
}