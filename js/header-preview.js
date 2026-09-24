/* Header colour trial for the client review. ?header=navy|ink|black previews a
   dark header; the pick is kept for the browser tab so it survives clicking
   between pages, and ?header=paper goes back to the default. Delete this file
   and its <script> tags once the client has chosen, before the WordPress move. */
(function () {
  const variants = ['navy', 'ink', 'black'];
  let pick = new URLSearchParams(location.search).get('header');
  try {
    if (pick !== null) sessionStorage.setItem('mlc-header', pick);
    else pick = sessionStorage.getItem('mlc-header');
  } catch (e) { /* storage blocked: the URL still works for the page itself */ }
  if (variants.includes(pick)) document.documentElement.setAttribute('data-header', pick);
})();
