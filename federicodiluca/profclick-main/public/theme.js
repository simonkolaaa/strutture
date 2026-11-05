// Il tema prima del primo disegno, per non lampeggiare: la scelta fatta nell'app
// (src/state/theme.ts), altrimenti quella del sistema, che si segue anche se cambia.
;(function () {
  var system = matchMedia('(prefers-color-scheme: dark)')
  function apply() {
    var choice
    try {
      choice = localStorage.getItem('profclick-theme')
    } catch {}
    var dark = choice === 'dark' || (choice !== 'light' && system.matches)
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.content = dark ? '#050807' : '#2f5b4f'
    })
  }
  apply()
  system.addEventListener('change', apply)
  window.addEventListener('storage', apply)
  // Sulla carta sempre il tema chiaro; finita la stampa si torna a quello scelto.
  window.addEventListener('beforeprint', function () {
    document.documentElement.dataset.theme = 'light'
  })
  window.addEventListener('afterprint', apply)
  window.profclickApplyTheme = apply
})()
