(function () {
  if (window.LowcoderSDK && window.LowcoderSDK.ready) return;
  var source = document.currentScript;
  var base = new URL(".", source.src);
  var api = window.LowcoderSDK = {};
  var files = __SDK_FILES__;
  api.ready = Promise.all(files.map(function (file) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = new URL(file, base).href;
      // Fetch in parallel, evaluate in entrypoint order (one React/runtime instance).
      script.async = false;
      script.crossOrigin = "anonymous";
      if (source.nonce) script.nonce = source.nonce;
      script.onload = resolve;
      script.onerror = function () { reject(new Error("Lowcoder SDK could not load " + script.src)); };
      (document.head || document.documentElement).appendChild(script);
    });
  })).then(function () {
    if (!api.mount) throw new Error("Lowcoder SDK did not initialize.");
    window.dispatchEvent(new CustomEvent("lowcoder:ready"));
    return api;
  });
  api.ready.catch(function (error) {
    window.dispatchEvent(new CustomEvent("lowcoder:error", { detail: error }));
    console.error(error);
  });
})();
