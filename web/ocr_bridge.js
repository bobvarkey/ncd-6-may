/* Browser OCR bridge for the NCD Rx Flutter AI import module.
 * Tesseract.js runs in the page; the image never leaves the browser.
 * The library is fetched on first use from jsDelivr and then cached by the
 * browser/service worker.
 */
(function () {
  let loading = null;

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (!loading) {
      loading = new Promise(function (resolve, reject) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js';
        script.async = true;
        script.onload = function () { resolve(window.Tesseract); };
        script.onerror = function () {
          loading = null;
          reject(new Error('Could not load the local OCR engine.'));
        };
        document.head.appendChild(script);
      });
    }
    return loading;
  }

  window.ncdOcrImage = async function (dataUrl) {
    const Tesseract = await loadTesseract();
    if (!Tesseract || !Tesseract.recognize) {
      throw new Error('OCR engine unavailable.');
    }
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const result = await Tesseract.recognize(blob, 'eng');
    return (result && result.data && result.data.text) || '';
  };
})();
