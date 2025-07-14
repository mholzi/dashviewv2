import { css } from 'lit';

export const dashviewTheme = css`
  :host {
    --dashview-primary-color: var(--primary-color);
    --dashview-primary-text-color: var(--primary-text-color);
    --dashview-secondary-text-color: var(--secondary-text-color);
    --dashview-disabled-text-color: var(--disabled-text-color);
    --dashview-divider-color: var(--divider-color);
    --dashview-error-color: var(--error-color);
    --dashview-success-color: var(--success-color);
    --dashview-warning-color: var(--warning-color);
    --dashview-info-color: var(--info-color);
    --dashview-background: var(--lovelace-background, var(--primary-background-color));
    --dashview-card-background: var(--card-background-color);
    --dashview-spacing-xs: 4px;
    --dashview-spacing-sm: 8px;
    --dashview-spacing-md: 16px;
    --dashview-spacing-lg: 24px;
    --dashview-spacing-xl: 32px;
    --dashview-border-radius: var(--ha-card-border-radius, 12px);
    --dashview-box-shadow: var(--ha-card-box-shadow, none);
  }
`;

export const dashviewStyles = css`
  * {
    box-sizing: border-box;
  }

  .dashview-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: var(--dashview-background);
  }

  .dashview-header {
    padding: var(--dashview-spacing-lg);
    background: var(--dashview-card-background);
    border-bottom: 1px solid var(--dashview-divider-color);
    box-shadow: var(--dashview-box-shadow);
  }

  .dashview-content {
    flex: 1;
    padding: var(--dashview-spacing-lg);
    overflow-y: auto;
  }

  .dashview-card {
    background: var(--dashview-card-background);
    border-radius: var(--dashview-border-radius);
    padding: var(--dashview-spacing-lg);
    margin-bottom: var(--dashview-spacing-md);
    box-shadow: var(--dashview-box-shadow);
  }

  .dashview-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: var(--dashview-secondary-text-color);
  }

  .dashview-error {
    color: var(--dashview-error-color);
    padding: var(--dashview-spacing-md);
    text-align: center;
  }

  @media (max-width: 768px) {
    .dashview-header {
      padding: var(--dashview-spacing-md);
    }

    .dashview-content {
      padding: var(--dashview-spacing-md);
    }
  }
`;