(()=>{"use strict";const t=globalThis,e=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),i=new WeakMap;class r{constructor(t,e,i){if(this._$cssResult$=!0,i!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const s=this.t;if(e&&void 0===t){const e=void 0!==s&&1===s.length;e&&(t=i.get(s)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),e&&i.set(s,t))}return t}toString(){return this.cssText}}const o=(t,...e)=>{const i=1===t.length?t[0]:e.reduce((e,s,i)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[i+1],t[0]);return new r(i,t,s)},n=(s,i)=>{if(e)s.adoptedStyleSheets=i.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const e of i){const i=document.createElement("style"),r=t.litNonce;void 0!==r&&i.setAttribute("nonce",r),i.textContent=e.cssText,s.appendChild(i)}},a=e?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new r("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:h,defineProperty:d,getOwnPropertyDescriptor:c,getOwnPropertyNames:l,getOwnPropertySymbols:p,getPrototypeOf:v}=Object,u=globalThis,f=u.trustedTypes,g=f?f.emptyScript:"",m=u.reactiveElementPolyfillSupport,$=(t,e)=>t,w={toAttribute(t,e){switch(e){case Boolean:t=t?g:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},y=(t,e)=>!h(t,e),_={attribute:!0,type:String,converter:w,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;class b extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=_){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),i=this.getPropertyDescriptor(t,s,e);void 0!==i&&d(this.prototype,t,i)}}static getPropertyDescriptor(t,e,s){const{get:i,set:r}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:i,set(e){const o=i?.call(this);r?.call(this,e),this.requestUpdate(t,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??_}static _$Ei(){if(this.hasOwnProperty($("elementProperties")))return;const t=v(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty($("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty($("properties"))){const t=this.properties,e=[...l(t),...p(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return n(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),i=this.constructor._$Eu(t,s);if(void 0!==i&&!0===s.reflect){const r=(void 0!==s.converter?.toAttribute?s.converter:w).toAttribute(e,s.type);this._$Em=t,null==r?this.removeAttribute(i):this.setAttribute(i,r),this._$Em=null}}_$AK(t,e){const s=this.constructor,i=s._$Eh.get(t);if(void 0!==i&&this._$Em!==i){const t=s.getPropertyOptions(i),r="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:w;this._$Em=i;const o=r.fromAttribute(e,t.type);this[i]=o??this._$Ej?.get(i)??o,this._$Em=null}}requestUpdate(t,e,s){if(void 0!==t){const i=this.constructor,r=this[t];if(s??=i.getPropertyOptions(t),!((s.hasChanged??y)(r,e)||s.useDefault&&s.reflect&&r===this._$Ej?.get(t)&&!this.hasAttribute(i._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:i,wrapped:r},o){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==r||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===i&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,i=this[e];!0!==t||this._$AL.has(e)||void 0===i||this.C(e,void 0,s,i)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}}b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[$("elementProperties")]=new Map,b[$("finalized")]=new Map,m?.({ReactiveElement:b}),(u.reactiveElementVersions??=[]).push("2.1.1");const A=globalThis,E=A.trustedTypes,x=E?E.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,P="?"+C,O=`<${P}>`,U=document,R=()=>U.createComment(""),k=t=>null===t||"object"!=typeof t&&"function"!=typeof t,H=Array.isArray,N=t=>H(t)||"function"==typeof t?.[Symbol.iterator],I="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,T=/-->/g,D=/>/g,j=RegExp(`>|${I}(?:([^\\s"'>=/]+)(${I}*=${I}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),z=/'/g,L=/"/g,W=/^(?:script|style|textarea|title)$/i,B=t=>(e,...s)=>({_$litType$:t,strings:e,values:s}),V=B(1),F=(B(2),B(3),Symbol.for("lit-noChange")),q=Symbol.for("lit-nothing"),G=new WeakMap,J=U.createTreeWalker(U,129);function K(t,e){if(!H(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==x?x.createHTML(e):e}const Y=(t,e)=>{const s=t.length-1,i=[];let r,o=2===e?"<svg>":3===e?"<math>":"",n=M;for(let e=0;e<s;e++){const s=t[e];let a,h,d=-1,c=0;for(;c<s.length&&(n.lastIndex=c,h=n.exec(s),null!==h);)c=n.lastIndex,n===M?"!--"===h[1]?n=T:void 0!==h[1]?n=D:void 0!==h[2]?(W.test(h[2])&&(r=RegExp("</"+h[2],"g")),n=j):void 0!==h[3]&&(n=j):n===j?">"===h[0]?(n=r??M,d=-1):void 0===h[1]?d=-2:(d=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?j:'"'===h[3]?L:z):n===L||n===z?n=j:n===T||n===D?n=M:(n=j,r=void 0);const l=n===j&&t[e+1].startsWith("/>")?" ":"";o+=n===M?s+O:d>=0?(i.push(a),s.slice(0,d)+S+s.slice(d)+C+l):s+C+(-2===d?e:l)}return[K(t,o+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),i]};class Z{constructor({strings:t,_$litType$:e},s){let i;this.parts=[];let r=0,o=0;const n=t.length-1,a=this.parts,[h,d]=Y(t,e);if(this.el=Z.createElement(h,s),J.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(i=J.nextNode())&&a.length<n;){if(1===i.nodeType){if(i.hasAttributes())for(const t of i.getAttributeNames())if(t.endsWith(S)){const e=d[o++],s=i.getAttribute(t).split(C),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:r,name:n[2],strings:s,ctor:"."===n[1]?st:"?"===n[1]?it:"@"===n[1]?rt:et}),i.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:r}),i.removeAttribute(t));if(W.test(i.tagName)){const t=i.textContent.split(C),e=t.length-1;if(e>0){i.textContent=E?E.emptyScript:"";for(let s=0;s<e;s++)i.append(t[s],R()),J.nextNode(),a.push({type:2,index:++r});i.append(t[e],R())}}}else if(8===i.nodeType)if(i.data===P)a.push({type:2,index:r});else{let t=-1;for(;-1!==(t=i.data.indexOf(C,t+1));)a.push({type:7,index:r}),t+=C.length-1}r++}}static createElement(t,e){const s=U.createElement("template");return s.innerHTML=t,s}}function Q(t,e,s=t,i){if(e===F)return e;let r=void 0!==i?s._$Co?.[i]:s._$Cl;const o=k(e)?void 0:e._$litDirective$;return r?.constructor!==o&&(r?._$AO?.(!1),void 0===o?r=void 0:(r=new o(t),r._$AT(t,s,i)),void 0!==i?(s._$Co??=[])[i]=r:s._$Cl=r),void 0!==r&&(e=Q(t,r._$AS(t,e.values),r,i)),e}class X{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,i=(t?.creationScope??U).importNode(e,!0);J.currentNode=i;let r=J.nextNode(),o=0,n=0,a=s[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new tt(r,r.nextSibling,this,t):1===a.type?e=new a.ctor(r,a.name,a.strings,this,t):6===a.type&&(e=new ot(r,this,t)),this._$AV.push(e),a=s[++n]}o!==a?.index&&(r=J.nextNode(),o++)}return J.currentNode=U,i}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class tt{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,i){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=i,this._$Cv=i?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),k(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==F&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):N(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&k(this._$AH)?this._$AA.nextSibling.data=t:this.T(U.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,i="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Z.createElement(K(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===i)this._$AH.p(e);else{const t=new X(i,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=G.get(t.strings);return void 0===e&&G.set(t.strings,e=new Z(t)),e}k(t){H(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,i=0;for(const r of t)i===e.length?e.push(s=new tt(this.O(R()),this.O(R()),this,this.options)):s=e[i],s._$AI(r),i++;i<e.length&&(this._$AR(s&&s._$AB.nextSibling,i),e.length=i)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=t.nextSibling;t.remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class et{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,i,r){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=i,this.options=r,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=q}_$AI(t,e=this,s,i){const r=this.strings;let o=!1;if(void 0===r)t=Q(this,t,e,0),o=!k(t)||t!==this._$AH&&t!==F,o&&(this._$AH=t);else{const i=t;let n,a;for(t=r[0],n=0;n<r.length-1;n++)a=Q(this,i[s+n],e,n),a===F&&(a=this._$AH[n]),o||=!k(a)||a!==this._$AH[n],a===q?t=q:t!==q&&(t+=(a??"")+r[n+1]),this._$AH[n]=a}o&&!i&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class st extends et{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class it extends et{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class rt extends et{constructor(t,e,s,i,r){super(t,e,s,i,r),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??q)===F)return;const s=this._$AH,i=t===q&&s!==q||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,r=t!==q&&(s===q||i);i&&this.element.removeEventListener(this.name,this,s),r&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const nt=A.litHtmlPolyfillSupport;nt?.(Z,tt),(A.litHtmlVersions??=[]).push("3.3.1");const at=globalThis;class ht extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const i=s?.renderBefore??e;let r=i._$litPart$;if(void 0===r){const t=s?.renderBefore??null;i._$litPart$=r=new tt(e.insertBefore(R(),t),t,void 0,s??{})}return r._$AI(t),r})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return F}}ht._$litElement$=!0,ht.finalized=!0,at.litElementHydrateSupport?.({LitElement:ht});const dt=at.litElementPolyfillSupport;dt?.({LitElement:ht});(at.litElementVersions??=[]).push("4.2.1");const ct={attribute:!0,type:String,converter:w,reflect:!1,hasChanged:y},lt=(t=ct,e,s)=>{const{kind:i,metadata:r}=s;let o=globalThis.litPropertyMetadata.get(r);if(void 0===o&&globalThis.litPropertyMetadata.set(r,o=new Map),"setter"===i&&((t=Object.create(t)).wrapped=!0),o.set(s.name,t),"accessor"===i){const{name:i}=s;return{set(s){const r=e.get.call(this);e.set.call(this,s),this.requestUpdate(i,r,t)},init(e){return void 0!==e&&this.C(i,void 0,t,e),e}}}if("setter"===i){const{name:i}=s;return function(s){const r=this[i];e.call(this,s),this.requestUpdate(i,r,t)}}throw Error("Unsupported decorator location: "+i)};function pt(t){return(e,s)=>"object"==typeof s?lt(t,e,s):((t,e,s)=>{const i=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),i?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function vt(t){return pt({...t,state:!0,attribute:!1})}var ut=function(t,e,s,i){var r,o=arguments.length,n=o<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(n=(o<3?r(n):o>3?r(e,s,n):r(e,s))||n);return o>3&&n&&Object.defineProperty(e,s,n),n};class ft extends ht{shouldUpdate(t){return!!this.hass&&super.shouldUpdate(t)}async callWebSocket(t,e){if(!this.hass)throw new Error("Home Assistant connection not available");try{return await this.hass.callWS(Object.assign({type:`dashview_v2/${t}`},e))}catch(t){throw t}}handleError(t,e){}connectedCallback(){super.connectedCallback()}disconnectedCallback(){super.disconnectedCallback()}}ut([pt({attribute:!1})],ft.prototype,"hass",void 0),ut([pt({type:Object})],ft.prototype,"config",void 0);class gt{constructor(t){this.hass=t}async getHomeInfo(){try{return await this.hass.callWS({type:"dashview_v2/get_home_info"})}catch(t){throw t}}async subscribeToStateChanges(t,e){if(!this.hass.connection)throw new Error("WebSocket connection not available");return await this.hass.connection.subscribeEvents(s=>{e&&!e.includes(s.data.entity_id)||t(s)},"state_changed")}isConnected(){return!!this.hass&&!!this.hass.connection}}const mt=o`
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
`,$t=o`
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
`;var wt;!function(t){t[t.DEBUG=0]="DEBUG",t[t.INFO=1]="INFO",t[t.WARN=2]="WARN",t[t.ERROR=3]="ERROR"}(wt||(wt={}));class yt{constructor(){this.level=wt.INFO,this.prefix="[Dashview V2]"}static getInstance(){return yt.instance||(yt.instance=new yt),yt.instance}setLevel(t){this.level=t}debug(...t){this.level,wt.DEBUG}info(...t){this.level,wt.INFO}warn(...t){this.level,wt.WARN}error(...t){this.level,wt.ERROR}}const _t=yt.getInstance();var bt=function(t,e,s,i){var r,o=arguments.length,n=o<3?e:null===i?i=Object.getOwnPropertyDescriptor(e,s):i;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,s,i);else for(var a=t.length-1;a>=0;a--)(r=t[a])&&(n=(o<3?r(n):o>3?r(e,s,n):r(e,s))||n);return o>3&&n&&Object.defineProperty(e,s,n),n};let At=class extends ft{constructor(){super(...arguments),this.loading=!0,this.error=null,this.homeInfo=null,this.wsConnection=null}async firstUpdated(t){super.firstUpdated(t),await this.initializeDashboard()}async initializeDashboard(){try{if(_t.info("Initializing Dashview dashboard"),!this.hass)throw new Error("Home Assistant connection not available");this.wsConnection=new gt(this.hass),await this.loadHomeInfo(),_t.info("Dashboard initialized successfully")}catch(t){_t.error("Failed to initialize dashboard:",t),this.error=t instanceof Error?t.message:"Failed to initialize dashboard",this.loading=!1}}async loadHomeInfo(){if(this.wsConnection)try{this.loading=!0,this.error=null,_t.debug("Loading home information"),this.homeInfo=await this.wsConnection.getHomeInfo(),_t.info("Home info loaded:",this.homeInfo),this.loading=!1}catch(t){_t.error("Failed to load home info:",t),this.error="Failed to load home information",this.loading=!1}}render(){var t;return this.loading?V`
        <div class="dashview-container">
          <div class="dashview-loading">
            <div class="loading-spinner"></div>
          </div>
        </div>
      `:this.error?V`
        <div class="dashview-container">
          <div class="dashview-error">
            <h2>Error</h2>
            <p>${this.error}</p>
            <button @click=${this.loadHomeInfo}>Retry</button>
          </div>
        </div>
      `:V`
      <div class="dashview-container">
        <div class="dashview-content">
          <div class="welcome-header">
            <h1 class="welcome-title">Welcome to Dashview V2</h1>
            <p class="welcome-subtitle">
              Your intelligent home dashboard for ${(null===(t=this.homeInfo)||void 0===t?void 0:t.entityCount)||0} entities
            </p>
          </div>

          ${this.homeInfo?this.renderHomeInfo():this.renderNoData()}
        </div>
      </div>
    `}renderHomeInfo(){if(!this.homeInfo)return null;const t=Math.min(100,10*this.homeInfo.complexityScore);return V`
      <div class="info-grid">
        <div class="info-card">
          <p class="info-value">${this.homeInfo.roomCount}</p>
          <p class="info-label">Rooms</p>
        </div>

        <div class="info-card">
          <p class="info-value">${this.homeInfo.entityCount}</p>
          <p class="info-label">Entities</p>
        </div>

        <div class="info-card">
          <p class="info-value">${this.homeInfo.areas.length}</p>
          <p class="info-label">Areas</p>
        </div>

        <div class="info-card">
          <p class="info-value">${this.homeInfo.complexityScore}/10</p>
          <p class="info-label">Complexity Score</p>
          <div class="complexity-meter">
            <div class="complexity-fill" style="width: ${t}%"></div>
          </div>
        </div>
      </div>

      ${this.homeInfo.areas.length>0?V`
        <div class="dashview-card">
          <h3>Detected Areas</h3>
          <div class="areas-list">
            ${this.homeInfo.areas.map(t=>V`
              <span class="area-tag">${t}</span>
            `)}
          </div>
        </div>
      `:""}
    `}renderNoData(){return V`
      <div class="dashview-card">
        <p>No home information available. Make sure your Home Assistant is configured with areas and entities.</p>
      </div>
    `}};At.styles=[mt,$t,o`
      :host {
        display: block;
        height: 100%;
        width: 100%;
      }

      .welcome-header {
        text-align: center;
        margin-bottom: var(--dashview-spacing-xl);
      }

      .welcome-title {
        font-size: 2.5rem;
        font-weight: 300;
        color: var(--dashview-primary-text-color);
        margin: 0 0 var(--dashview-spacing-sm);
      }

      .welcome-subtitle {
        font-size: 1.2rem;
        color: var(--dashview-secondary-text-color);
        margin: 0;
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--dashview-spacing-md);
        margin-top: var(--dashview-spacing-xl);
      }

      .info-card {
        background: var(--dashview-card-background);
        border-radius: var(--dashview-border-radius);
        padding: var(--dashview-spacing-lg);
        text-align: center;
        box-shadow: var(--dashview-box-shadow);
        transition: transform 0.2s ease;
      }

      .info-card:hover {
        transform: translateY(-2px);
      }

      .info-value {
        font-size: 3rem;
        font-weight: 300;
        color: var(--primary-color);
        margin: 0;
      }

      .info-label {
        font-size: 1rem;
        color: var(--dashview-secondary-text-color);
        margin: var(--dashview-spacing-sm) 0 0;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .complexity-meter {
        width: 100%;
        height: 20px;
        background: var(--divider-color);
        border-radius: 10px;
        margin-top: var(--dashview-spacing-md);
        overflow: hidden;
      }

      .complexity-fill {
        height: 100%;
        background: linear-gradient(90deg, 
          var(--success-color) 0%, 
          var(--warning-color) 50%, 
          var(--error-color) 100%
        );
        transition: width 0.5s ease;
      }

      .areas-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--dashview-spacing-sm);
        margin-top: var(--dashview-spacing-md);
      }

      .area-tag {
        background: var(--primary-color);
        color: var(--text-primary-color, white);
        padding: var(--dashview-spacing-xs) var(--dashview-spacing-sm);
        border-radius: var(--dashview-border-radius);
        font-size: 0.9rem;
      }

      .loading-spinner {
        animation: spin 1s linear infinite;
        width: 48px;
        height: 48px;
        border: 3px solid var(--divider-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `],bt([vt()],At.prototype,"loading",void 0),bt([vt()],At.prototype,"error",void 0),bt([vt()],At.prototype,"homeInfo",void 0),bt([vt()],At.prototype,"wsConnection",void 0),At=bt([(t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("dashview-dashboard")],At);customElements.get("dashview-dashboard")?_t.info("Dashview V2 dashboard registered successfully"):_t.error("Failed to register dashview-dashboard element");_t.info("Dashview V2 v0.2.0 initialized"),window.addEventListener("error",t=>{_t.error("Global error:",t.error)}),window.addEventListener("unhandledrejection",t=>{_t.error("Unhandled promise rejection:",t.reason)})})();