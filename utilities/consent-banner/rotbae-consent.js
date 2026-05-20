/**
 * ROTBAE lightweight cookie / consent banner.
 * Depends on google tag globals: window.dataLayer and window.gtag (from index.html).
 * Head must call gtag('consent','default',{... denied ...}) before gtag/js loads.
 */
;(function rotbaeConsent() {
  var STORAGE_KEY = 'rotbae_consent_v1'
  var ROOT_ID = 'rotbae-consent-banner'
  var STYLE_ID = 'rotbae-consent-banner-style'

  function readChoice() {
    try {
      var raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      var o = JSON.parse(raw)
      if (o.accepted !== true && o.accepted !== false) return null
      return o.accepted
    } catch (e) {
      return null
    }
  }

  function writeChoice(accepted) {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ accepted: accepted, ts: Date.now() }),
      )
    } catch (e) {
      /* quota / private mode */
    }
  }

  function applyConsentUpdate(accepted) {
    if (typeof window.gtag !== 'function') return
    var v = accepted ? 'granted' : 'denied'
    window.gtag('consent', 'update', {
      analytics_storage: v,
      ad_storage: v,
      ad_user_data: v,
      ad_personalization: v,
    })
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return
    var s = document.createElement('style')
    s.id = STYLE_ID
    s.textContent =
      '#' +
      ROOT_ID +
      '{position:fixed;left:0;right:0;bottom:0;z-index:2147483640;' +
      'font-family:inherit;font-size:0.8125rem;line-height:1.4;' +
      'background:#fff;color:#000;border-top:3px solid #000;' +
      'box-shadow:0 -6px 0 0 rgba(0,0,0,1);}' +
      '#' +
      ROOT_ID +
      ' .rotbae-consent__inner{' +
      'max-width:min(52rem,calc(100% - 2rem));margin:0 auto;padding:1rem 1rem 1.25rem;}' +
      '#' +
      ROOT_ID +
      ' .rotbae-consent__row{' +
      'display:flex;flex-wrap:wrap;gap:1rem;align-items:center;justify-content:space-between;}' +
      '#' +
      ROOT_ID +
      ' p{margin:0;flex:1 1 16rem;text-align:left;}' +
      '#' +
      ROOT_ID +
      ' .rotbae-consent__actions{' +
      'display:flex;flex-wrap:wrap;gap:0.5rem 0.65rem;align-items:center;' +
      'justify-content:flex-end;}' +
      '#' +
      ROOT_ID +
      ' a{color:#000;font-weight:bold;text-decoration:underline;text-underline-offset:3px}' +
      '#' +
      ROOT_ID +
      ' a:hover{background:#000;color:#fff;text-decoration:none}' +
      '#' +
      ROOT_ID +
      ' button{' +
      'font:inherit;font-weight:bold;' +
      'padding:0.45rem 0.85rem;' +
      'border:2px solid #000;background:#fff;color:#000;' +
      'cursor:pointer;margin:0;}' +
      '#' +
      ROOT_ID +
      ' button:hover{background:#000;color:#fff}' +
      '#' +
      ROOT_ID +
      ' button.rotbae-consent__primary{background:#000;color:#fff}' +
      '#' +
      ROOT_ID +
      ' button.rotbae-consent__primary:hover{background:#fff;color:#000}'
    document.head.appendChild(s)
  }
  function dismiss() {
    var el = document.getElementById(ROOT_ID)
    if (el) el.remove()
  }

  function showBanner() {
    if (document.getElementById(ROOT_ID)) return
    injectStyles()
    var host = ''
    try {
      host =
        typeof window.location !== 'undefined'
          ? window.location.hostname.replace(/^www\./i, '')
          : ''
    } catch (e) {}
    var h = typeof host === 'string' ? host.toLowerCase() : ''
    var isRotbae =
      h === 'localhost' ||
      h === 'rotbae.com' ||
      h.endsWith('.rotbae.com')

    var bar = document.createElement('aside')
    bar.id = ROOT_ID
    bar.setAttribute('role', 'dialog')
    bar.setAttribute('aria-labelledby', 'rotbae-consent-title')

    bar.innerHTML =
      '<div class="rotbae-consent__inner">' +
      '<div class="rotbae-consent__row">' +
      '<div>' +
      '<strong id="rotbae-consent-title">Cookies &amp; privacy</strong>' +
      '<p>We use Google Analytics cookies to measure traffic when you consent. Essential parts of this site stay available if you decline. You can change your decision later by clearing browser storage for this site.</p>' +
      '</div>' +
      '<div class="rotbae-consent__actions">' +
      (isRotbae
        ? '<a href="https://rotbae.com">About ROTBAE</a>'
        : '') +
      '<button type="button" class="rotbae-consent__reject" data-rotbae-consent="reject">Reject non-essential</button>' +
      '<button type="button" class="rotbae-consent__primary" data-rotbae-consent="accept">Accept all</button>' +
      '</div></div></div>'

    bar.addEventListener('click', function (ev) {
      var t = ev.target
      if (!t || typeof t.closest !== 'function') return
      var btn = t.closest('[data-rotbae-consent]')
      if (!btn || !btn.getAttribute('data-rotbae-consent')) return
      var action = btn.getAttribute('data-rotbae-consent')
      var accepted = action === 'accept'
      writeChoice(accepted)
      applyConsentUpdate(accepted)
      dismiss()
    })

    document.body.appendChild(bar)
  }

  var stored = readChoice()
  if (stored !== null) {
    applyConsentUpdate(stored === true)
  } else if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', showBanner)
    } else {
      showBanner()
    }
  }
})()
