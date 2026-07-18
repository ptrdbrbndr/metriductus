/* Metriductus lead-beacon — cookieloos, geen persoonsgegevens.
   Plaats op een site met:  <script defer src="https://metriductus.nl/beacon.js"></script> */
(function () {
  var ENDPOINT = 'https://metriductus.nl/api/beacon'
  var domain = location.host.replace(/^www\./, '')

  function send(type, path) {
    try {
      var body = JSON.stringify({
        domain: domain,
        path: path || location.pathname,
        type: type,
        ref: document.referrer || '',
      })
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))
    } catch (e) {
      /* stil falen */
    }
  }

  // Paginabezoek (elke pageload).
  send('pageview')

  // Lead: elke formulier-verzending (capture-fase, zodat het ook telt bij navigatie weg).
  document.addEventListener('submit', function () { send('lead') }, true)

  // Handmatige lead-trigger voor JS-formulieren (fetch/AJAX): window.metriductusLead('/pad')
  window.metriductusLead = function (path) { send('lead', path) }
})()
