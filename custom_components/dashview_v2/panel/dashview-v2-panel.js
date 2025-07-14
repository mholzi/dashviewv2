import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit@3.0.0/index.js?module";

class DashviewV2Panel extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      narrow: { type: Boolean },
      route: { type: Object },
      panel: { type: Object },
    };
  }

  render() {
    return html`
      <div class="content">
        <h1>Hello World</h1>
        <p>Welcome to Dashview V2!</p>
      </div>
    `;
  }

  static get styles() {
    return css`
      :host {
        display: block;
        padding: 16px;
        background-color: var(--lovelace-background, var(--primary-background-color));
      }

      .content {
        max-width: 1040px;
        margin: 0 auto;
      }

      h1 {
        color: var(--primary-text-color);
        font-size: 2.5rem;
        font-weight: 400;
        margin: 0 0 16px;
      }

      p {
        color: var(--secondary-text-color);
        font-size: 1.1rem;
      }

      @media (max-width: 600px) {
        h1 {
          font-size: 2rem;
        }
      }
    `;
  }

  firstUpdated() {
    // Log to confirm panel loaded
    console.log("Dashview V2 panel loaded successfully");
  }
}

customElements.define("dashview-v2-panel", DashviewV2Panel);