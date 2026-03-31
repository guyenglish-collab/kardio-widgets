/*!
 * Kardio Voice Widget v1.0
 * Embeddable feedback widget for Kardio (gokard.io)
 * 
 * SETUP:
 * 1. Deploy your Google Apps Script web app (see kardio-voice-sheets.gs)
 * 2. Replace SHEETS_WEBHOOK_URL below with your deployed script URL
 * 3. Add this script to your page: <script src="kardio-voice.js"></script>
 */

(function () {
  const SHEETS_WEBHOOK_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE';

  // ─── Styles ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

    #kv-root *, #kv-root *::before, #kv-root *::after {
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    #kv-fab {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483646;
      width: 54px;
      height: 54px;
      border-radius: 50%;
      background: #0f172a;
      border: 1.5px solid rgba(255,255,255,0.12);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 24px rgba(0,0,0,0.35), 0 1px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.2s;
    }
    #kv-fab:hover {
      transform: scale(1.07);
      box-shadow: 0 6px 28px rgba(0,0,0,0.45);
    }
    #kv-fab .kv-fab-icon { transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s; }
    #kv-fab .kv-fab-icon.hide { transform: rotate(90deg) scale(0.6); opacity: 0; position: absolute; }
    #kv-fab .kv-fab-icon.show { transform: rotate(0deg) scale(1); opacity: 1; }

    #kv-panel {
      position: fixed;
      bottom: 90px;
      right: 24px;
      z-index: 2147483645;
      width: 356px;
      background: #0f172a;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 18px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3);
      overflow: hidden;
      transform: scale(0.88) translateY(16px);
      transform-origin: bottom right;
      opacity: 0;
      pointer-events: none;
      transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s;
    }
    #kv-panel.kv-open {
      transform: scale(1) translateY(0);
      opacity: 1;
      pointer-events: all;
    }

    .kv-header {
      padding: 18px 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      display: flex;
      align-items: center;
      gap: 12px;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    }
    .kv-header-logo {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kv-header-text h3 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #f1f5f9;
      letter-spacing: -0.01em;
    }
    .kv-header-text p {
      margin: 0;
      font-size: 12px;
      color: rgba(255,255,255,0.45);
      margin-top: 1px;
    }
    .kv-account-pill {
      margin-left: auto;
      background: rgba(74,222,128,0.1);
      border: 1px solid rgba(74,222,128,0.2);
      border-radius: 20px;
      padding: 3px 10px;
      font-size: 11px;
      color: #4ade80;
      font-weight: 500;
      max-width: 100px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex-shrink: 0;
    }

    .kv-menu {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .kv-menu-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 13px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: background 0.15s, border-color 0.15s, transform 0.1s;
    }
    .kv-menu-item:hover {
      background: rgba(255,255,255,0.08);
      border-color: rgba(255,255,255,0.14);
      transform: translateX(2px);
    }
    .kv-menu-item:active { transform: translateX(1px) scale(0.99); }
    .kv-item-icon {
      width: 36px;
      height: 36px;
      border-radius: 9px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kv-item-label {
      font-size: 13.5px;
      font-weight: 500;
      color: #f1f5f9;
    }
    .kv-item-sub {
      font-size: 11.5px;
      color: rgba(255,255,255,0.4);
      margin-top: 2px;
    }
    .kv-item-arrow {
      margin-left: auto;
      color: rgba(255,255,255,0.2);
      font-size: 18px;
      line-height: 1;
    }

    .kv-form-wrap {
      display: none;
      padding: 0 14px 14px;
    }
    .kv-form-wrap.kv-active { display: block; }

    .kv-back {
      display: flex;
      align-items: center;
      gap: 5px;
      background: none;
      border: none;
      cursor: pointer;
      color: rgba(255,255,255,0.45);
      font-size: 12px;
      font-weight: 500;
      padding: 12px 0 13px;
      transition: color 0.15s;
    }
    .kv-back:hover { color: #4ade80; }
    .kv-form-title {
      font-size: 15px;
      font-weight: 600;
      color: #f1f5f9;
      margin: 0 0 14px;
      letter-spacing: -0.01em;
    }

    .kv-field { margin-bottom: 10px; }
    .kv-field label {
      display: block;
      font-size: 11.5px;
      font-weight: 500;
      color: rgba(255,255,255,0.45);
      margin-bottom: 5px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .kv-field input,
    .kv-field textarea {
      width: 100%;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 9px;
      padding: 10px 12px;
      font-size: 13px;
      color: #f1f5f9;
      outline: none;
      transition: border-color 0.15s, background 0.15s;
      resize: none;
      font-family: inherit;
    }
    .kv-field input::placeholder,
    .kv-field textarea::placeholder { color: rgba(255,255,255,0.2); }
    .kv-field input:focus,
    .kv-field textarea:focus {
      border-color: rgba(74,222,128,0.4);
      background: rgba(255,255,255,0.07);
    }
    .kv-field textarea { min-height: 82px; }

    .kv-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 4px;
    }
    .kv-chip {
      padding: 5px 11px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 20px;
      font-size: 12px;
      color: rgba(255,255,255,0.55);
      cursor: pointer;
      transition: all 0.15s;
    }
    .kv-chip.kv-sel {
      background: rgba(74,222,128,0.12);
      border-color: rgba(74,222,128,0.35);
      color: #4ade80;
      font-weight: 500;
    }

    .kv-levels {
      display: flex;
      gap: 6px;
    }
    .kv-level {
      flex: 1;
      padding: 8px 4px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 9px;
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      cursor: pointer;
      text-align: center;
      font-weight: 500;
      transition: all 0.15s;
      font-family: inherit;
    }
    .kv-level[data-val="Low"].kv-sel,
    .kv-level[data-val="Minor"].kv-sel   { background: rgba(74,222,128,0.1); border-color: rgba(74,222,128,0.3); color: #4ade80; }
    .kv-level[data-val="Medium"].kv-sel,
    .kv-level[data-val="Moderate"].kv-sel { background: rgba(251,191,36,0.1); border-color: rgba(251,191,36,0.3); color: #fbbf24; }
    .kv-level[data-val="High"].kv-sel,
    .kv-level[data-val="Critical"].kv-sel { background: rgba(248,113,113,0.1); border-color: rgba(248,113,113,0.3); color: #f87171; }

    .kv-submit {
      width: 100%;
      padding: 12px;
      background: #4ade80;
      color: #0f172a;
      border: none;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s, transform 0.1s, opacity 0.15s;
      font-family: inherit;
      letter-spacing: -0.01em;
      margin-top: 4px;
    }
    .kv-submit:hover { background: #86efac; }
    .kv-submit:active { transform: scale(0.98); }
    .kv-submit:disabled { background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.3); cursor: default; transform: none; }

    #kv-success {
      display: none;
      padding: 8px 14px 18px;
    }
    .kv-success-inner {
      text-align: center;
      padding: 20px 0 12px;
    }
    .kv-success-ring {
      width: 52px;
      height: 52px;
      background: rgba(74,222,128,0.1);
      border: 1.5px solid rgba(74,222,128,0.25);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
    }
    .kv-success-inner h4 { font-size: 15px; font-weight: 600; color: #f1f5f9; margin: 0 0 6px; }
    .kv-success-inner p { font-size: 13px; color: rgba(255,255,255,0.4); margin: 0; }

    .kv-footer {
      padding: 10px 14px 13px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .kv-footer-brand {
      font-size: 11px;
      color: rgba(255,255,255,0.25);
    }
    .kv-footer-brand span { color: #4ade80; font-weight: 500; }
    .kv-view-log {
      background: none;
      border: none;
      font-size: 11px;
      color: rgba(255,255,255,0.3);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 3px 6px;
      border-radius: 5px;
      transition: background 0.15s, color 0.15s;
      font-family: inherit;
    }
    .kv-view-log:hover { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.55); }

    .kv-log-wrap {
      display: none;
      padding: 0 14px 14px;
    }
    .kv-log-wrap.kv-active { display: block; }
    .kv-log-item {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px;
      padding: 10px 12px;
      margin-bottom: 7px;
    }
    .kv-log-type {
      font-size: 10.5px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #4ade80;
      margin-bottom: 4px;
    }
    .kv-log-msg { font-size: 13px; color: #e2e8f0; line-height: 1.4; }
    .kv-log-meta { font-size: 11px; color: rgba(255,255,255,0.3); margin-top: 5px; }
    .kv-log-empty { text-align: center; padding: 24px 0; font-size: 13px; color: rgba(255,255,255,0.25); }

    .kv-spinner {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid rgba(15,23,42,0.3);
      border-top-color: #0f172a;
      border-radius: 50%;
      animation: kv-spin 0.7s linear infinite;
      vertical-align: middle;
      margin-right: 6px;
    }
    @keyframes kv-spin { to { transform: rotate(360deg); } }

    .kv-error-msg {
      font-size: 12px;
      color: #f87171;
      margin-top: 8px;
      display: none;
    }
  `;

  // ─── HTML ──────────────────────────────────────────────────────────────────
  const html = `
    <style>${css}</style>
    <div id="kv-root">

      <button id="kv-fab" title="Kardio Voice">
        <span class="kv-fab-icon show" id="kv-icon-chat">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            <polyline points="9 10 12 13 15 10" stroke="#4ade80" stroke-width="2.2"/>
          </svg>
        </span>
        <span class="kv-fab-icon hide" id="kv-icon-close">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" stroke-width="2.2" stroke-linecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </span>
      </button>

      <div id="kv-panel">
        <div class="kv-header">
          <div class="kv-header-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div class="kv-header-text">
            <h3>Kardio Voice</h3>
            <p id="kv-greeting">How can we help?</p>
          </div>
          <div class="kv-account-pill" id="kv-acct-pill" style="display:none;"></div>
        </div>

        <!-- Menu -->
        <div id="kv-menu-view">
          <div class="kv-menu">
            <button class="kv-menu-item" data-open="question">
              <div class="kv-item-icon" style="background:rgba(251,191,36,0.1);border:1px solid rgba(251,191,36,0.2);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div><div class="kv-item-label">Ask a question</div><div class="kv-item-sub">About Kardio features or data</div></div>
              <span class="kv-item-arrow">›</span>
            </button>
            <button class="kv-menu-item" data-open="feature">
              <div class="kv-item-icon" style="background:rgba(74,222,128,0.1);border:1px solid rgba(74,222,128,0.2);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.2" stroke-linecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </div>
              <div><div class="kv-item-label">Feature Request</div><div class="kv-item-sub">Suggest an improvement</div></div>
              <span class="kv-item-arrow">›</span>
            </button>
            <button class="kv-menu-item" data-open="bug">
              <div class="kv-item-icon" style="background:rgba(248,113,113,0.1);border:1px solid rgba(248,113,113,0.2);">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </div>
              <div><div class="kv-item-label">Report a Bug</div><div class="kv-item-sub">Something not working right?</div></div>
              <span class="kv-item-arrow">›</span>
            </button>
          </div>
          <div class="kv-footer">
            <span class="kv-footer-brand">Powered by <span>Kardio Voice</span></span>
            <button class="kv-view-log" id="kv-log-btn">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Submissions log
            </button>
          </div>
        </div>

        <!-- Form: Question -->
        <div id="kv-form-question" class="kv-form-wrap">
          <button class="kv-back" data-back>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div class="kv-form-title">Ask a question</div>
          <div class="kv-field"><label>Your question</label><textarea id="q-q" placeholder="What would you like to know about Kardio?"></textarea></div>
          <div class="kv-field"><label>Topic (optional)</label>
            <div class="kv-chips" id="q-topics">
              <span class="kv-chip" data-v="Data & Metrics">Data & Metrics</span>
              <span class="kv-chip" data-v="Alerts">Alerts</span>
              <span class="kv-chip" data-v="Integrations">Integrations</span>
              <span class="kv-chip" data-v="Billing">Billing</span>
              <span class="kv-chip" data-v="Other">Other</span>
            </div>
          </div>
          <div class="kv-error-msg" id="q-err">Please enter your question.</div>
          <button class="kv-submit" id="q-btn">Send question</button>
        </div>

        <!-- Form: Feature Request -->
        <div id="kv-form-feature" class="kv-form-wrap">
          <button class="kv-back" data-back>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div class="kv-form-title">Feature Request</div>
          <div class="kv-field"><label>Feature title</label><input id="f-title" type="text" placeholder="Short description of the feature"></div>
          <div class="kv-field"><label>What problem does this solve?</label><textarea id="f-detail" placeholder="Describe the use case..."></textarea></div>
          <div class="kv-field"><label>Priority</label>
            <div class="kv-levels" id="f-priority">
              <button class="kv-level" data-val="Low">Low</button>
              <button class="kv-level" data-val="Medium">Medium</button>
              <button class="kv-level" data-val="High">High</button>
            </div>
          </div>
          <div class="kv-error-msg" id="f-err">Please add a title.</div>
          <button class="kv-submit" id="f-btn">Submit request</button>
        </div>

        <!-- Form: Bug Report -->
        <div id="kv-form-bug" class="kv-form-wrap">
          <button class="kv-back" data-back>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div class="kv-form-title">Report a Bug</div>
          <div class="kv-field"><label>What happened?</label><textarea id="b-desc" placeholder="Describe the issue you encountered..."></textarea></div>
          <div class="kv-field"><label>Steps to reproduce (optional)</label><textarea id="b-steps" placeholder="1. Go to...\n2. Click...\n3. See error"></textarea></div>
          <div class="kv-field"><label>Severity</label>
            <div class="kv-levels" id="b-severity">
              <button class="kv-level" data-val="Minor">Minor</button>
              <button class="kv-level" data-val="Moderate">Moderate</button>
              <button class="kv-level" data-val="Critical">Critical</button>
            </div>
          </div>
          <div class="kv-error-msg" id="b-err">Please describe the bug.</div>
          <button class="kv-submit" id="b-btn">Report bug</button>
        </div>

        <!-- Success -->
        <div id="kv-success">
          <div class="kv-success-inner">
            <div class="kv-success-ring">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h4>Submitted!</h4>
            <p id="kv-success-msg">Thanks — we'll be in touch soon.</p>
          </div>
          <button class="kv-submit" id="kv-done">Back to menu</button>
        </div>

        <!-- Log view -->
        <div id="kv-log-view" class="kv-log-wrap">
          <button class="kv-back" id="kv-log-back">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
          <div class="kv-form-title">Submissions log</div>
          <div id="kv-log-list"></div>
        </div>
      </div>
    </div>
  `;

  // ─── Mount ─────────────────────────────────────────────────────────────────
  const mount = document.createElement('div');
  mount.innerHTML = html;
  document.body.appendChild(mount);

  // ─── State ─────────────────────────────────────────────────────────────────
  let account = '', userName = '', panelOpen = false;
  const state = { qTopics: [], fPriority: '', bSeverity: '' };

  // ─── DOM refs ──────────────────────────────────────────────────────────────
  const fab       = document.getElementById('kv-fab');
  const panel     = document.getElementById('kv-panel');
  const menuView  = document.getElementById('kv-menu-view');
  const successEl = document.getElementById('kv-success');
  const logView   = document.getElementById('kv-log-view');

  // ─── Profile capture ───────────────────────────────────────────────────────
  function captureProfile() {
    try {
      const acctEl = document.querySelector('#menu-button-\\:rc\\: > span.css-xl71ch > span');
      if (acctEl) account = acctEl.textContent.trim();
    } catch(e) {}
    try {
      const nameEl = document.querySelector('#menu-button-\\:r13\\: > span > div > span > div');
      if (nameEl) userName = nameEl.textContent.trim();
    } catch(e) {}
    const pill = document.getElementById('kv-acct-pill');
    if (account) { pill.textContent = account; pill.style.display = 'block'; }
    if (userName) {
      document.getElementById('kv-greeting').textContent = 'Hi ' + userName.split(' ')[0] + ', how can we help?';
    }
  }

  // ─── FAB toggle ────────────────────────────────────────────────────────────
  fab.addEventListener('click', () => {
    panelOpen = !panelOpen;
    panel.classList.toggle('kv-open', panelOpen);
    document.getElementById('kv-icon-chat').classList.toggle('show', !panelOpen);
    document.getElementById('kv-icon-chat').classList.toggle('hide', panelOpen);
    document.getElementById('kv-icon-close').classList.toggle('show', panelOpen);
    document.getElementById('kv-icon-close').classList.toggle('hide', !panelOpen);
    if (panelOpen) { captureProfile(); showMenu(); }
  });

  // ─── Navigation ────────────────────────────────────────────────────────────
  function showMenu() {
    menuView.style.display = 'block';
    successEl.style.display = 'none';
    logView.classList.remove('kv-active');
    document.querySelectorAll('.kv-form-wrap').forEach(f => f.classList.remove('kv-active'));
  }

  document.querySelectorAll('[data-open]').forEach(btn => {
    btn.addEventListener('click', () => {
      menuView.style.display = 'none';
      state.qTopics = []; state.fPriority = ''; state.bSeverity = '';
      document.querySelectorAll('.kv-chip').forEach(c => c.classList.remove('kv-sel'));
      document.querySelectorAll('.kv-level').forEach(l => l.classList.remove('kv-sel'));
      document.querySelectorAll('.kv-error-msg').forEach(e => e.style.display = 'none');
      document.getElementById('kv-form-' + btn.dataset.open).classList.add('kv-active');
    });
  });

  document.querySelectorAll('[data-back]').forEach(btn => {
    btn.addEventListener('click', showMenu);
  });

  document.getElementById('kv-done').addEventListener('click', showMenu);

  // ─── Chips & levels ────────────────────────────────────────────────────────
  document.querySelectorAll('#q-topics .kv-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('kv-sel');
      const v = chip.dataset.v;
      state.qTopics = chip.classList.contains('kv-sel')
        ? [...state.qTopics, v]
        : state.qTopics.filter(t => t !== v);
    });
  });

  document.querySelectorAll('#f-priority .kv-level').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#f-priority .kv-level').forEach(b => b.classList.remove('kv-sel'));
      btn.classList.add('kv-sel'); state.fPriority = btn.dataset.val;
    });
  });

  document.querySelectorAll('#b-severity .kv-level').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#b-severity .kv-level').forEach(b => b.classList.remove('kv-sel'));
      btn.classList.add('kv-sel'); state.bSeverity = btn.dataset.val;
    });
  });

  // ─── Submissions log (localStorage) ────────────────────────────────────────
  function saveLocal(entry) {
    try {
      const existing = JSON.parse(localStorage.getItem('kv_submissions') || '[]');
      existing.unshift(entry);
      localStorage.setItem('kv_submissions', JSON.stringify(existing.slice(0, 200)));
    } catch(e) {}
  }

  function showLog() {
    menuView.style.display = 'none';
    logView.classList.add('kv-active');
    const list = document.getElementById('kv-log-list');
    try {
      const items = JSON.parse(localStorage.getItem('kv_submissions') || '[]');
      if (!items.length) {
        list.innerHTML = '<div class="kv-log-empty">No submissions yet</div>';
        return;
      }
      list.innerHTML = items.map(item => {
        const d = new Date(item.timestamp);
        const time = d.toLocaleDateString('en-GB', { day:'numeric', month:'short' }) + ' · ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
        const badge = item.priority || item.severity || item.topics || '';
        return `<div class="kv-log-item">
          <div class="kv-log-type">${item.type}${badge ? ' · ' + badge : ''}</div>
          <div class="kv-log-msg">${item.message.substring(0,120)}${item.message.length > 120 ? '…' : ''}</div>
          <div class="kv-log-meta">${item.name || 'Unknown'} · ${item.account || '—'} · ${time}</div>
        </div>`;
      }).join('');
    } catch(e) {
      list.innerHTML = '<div class="kv-log-empty">Unable to load log</div>';
    }
  }

  document.getElementById('kv-log-btn').addEventListener('click', showLog);
  document.getElementById('kv-log-back').addEventListener('click', showMenu);

  // ─── Sheet submission ───────────────────────────────────────────────────────
  async function submitToSheet(payload) {
    if (!SHEETS_WEBHOOK_URL || SHEETS_WEBHOOK_URL === 'YOUR_GOOGLE_APPS_SCRIPT_URL_HERE') {
      console.warn('[Kardio Voice] No webhook URL set. Configure SHEETS_WEBHOOK_URL in kardio-voice.js');
      return { ok: true, mock: true };
    }
    const res = await fetch(SHEETS_WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return { ok: true };
  }

  async function handleSubmit(btnId, errId, buildPayload, successMsg, resetFn) {
    const btn = document.getElementById(btnId);
    const err = document.getElementById(errId);
    const payload = buildPayload();
    if (!payload) { err.style.display = 'block'; return; }
    err.style.display = 'none';
    btn.disabled = true;
    btn.innerHTML = '<span class="kv-spinner"></span>Sending…';
    try {
      payload.account   = account;
      payload.name      = userName;
      payload.timestamp = new Date().toISOString();
      payload.pageUrl   = window.location.href;
      await submitToSheet(payload);
      saveLocal(payload);
      document.querySelectorAll('.kv-form-wrap').forEach(f => f.classList.remove('kv-active'));
      menuView.style.display = 'none';
      successEl.style.display = 'block';
      document.getElementById('kv-success-msg').textContent = successMsg;
      resetFn();
    } catch(e) {
      err.textContent = 'Something went wrong. Please try again.';
      err.style.display = 'block';
    }
    btn.disabled = false;
    btn.textContent = btn.dataset.label || 'Submit';
  }

  // ─── Question ──────────────────────────────────────────────────────────────
  document.getElementById('q-btn').dataset.label = 'Send question';
  document.getElementById('q-btn').addEventListener('click', () => {
    handleSubmit('q-btn', 'q-err',
      () => {
        const q = document.getElementById('q-q').value.trim();
        if (!q) return null;
        return { type: 'Question', message: q, topics: state.qTopics.join(', ') };
      },
      'Thanks! We\'ll respond to your question soon.',
      () => { document.getElementById('q-q').value = ''; state.qTopics = []; }
    );
  });

  // ─── Feature ───────────────────────────────────────────────────────────────
  document.getElementById('f-btn').dataset.label = 'Submit request';
  document.getElementById('f-btn').addEventListener('click', () => {
    handleSubmit('f-btn', 'f-err',
      () => {
        const t = document.getElementById('f-title').value.trim();
        if (!t) return null;
        return { type: 'Feature Request', message: t, detail: document.getElementById('f-detail').value.trim(), priority: state.fPriority };
      },
      'Feature request logged — thanks for helping us improve!',
      () => { document.getElementById('f-title').value = ''; document.getElementById('f-detail').value = ''; }
    );
  });

  // ─── Bug ───────────────────────────────────────────────────────────────────
  document.getElementById('b-btn').dataset.label = 'Report bug';
  document.getElementById('b-btn').addEventListener('click', () => {
    handleSubmit('b-btn', 'b-err',
      () => {
        const d = document.getElementById('b-desc').value.trim();
        if (!d) return null;
        return { type: 'Bug Report', message: d, steps: document.getElementById('b-steps').value.trim(), severity: state.bSeverity };
      },
      'Bug reported — our team will investigate.',
      () => { document.getElementById('b-desc').value = ''; document.getElementById('b-steps').value = ''; }
    );
  });

})();
