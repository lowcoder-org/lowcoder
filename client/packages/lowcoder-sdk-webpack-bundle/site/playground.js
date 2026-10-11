(() => {
  const $ = (selector) => document.querySelector(selector);
  const customers = { morgan: { customerName: 'Morgan Lee', plan: 'Growth', seats: 12 }, alex: { customerName: 'Alex Rivera', plan: 'Starter', seats: 0 } };
  let instance;
  let active = false;
  const entries = [];
  const log = (label, data) => {
    entries.unshift(`${label}  ${typeof data === 'string' ? data : JSON.stringify(data)}`);
    $('#event-log').textContent = entries.slice(0, 4).join('\n');
  };
  function loadSDK() {
    if (window.LowcoderSDK) return window.LowcoderSDK.ready;
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = new URL('/bundle.js', location.href).href;
      script.onload = () => window.LowcoderSDK.ready.then(resolve, reject);
      script.onerror = () => { script.remove(); reject(new Error('The SDK could not be downloaded. Please try again.')); };
      document.head.appendChild(script);
    });
  }
  async function run() {
    const button = $('#load-demo');
    button.disabled = true;
    $('#status').textContent = 'Loading the SDK and demo module…';
    try {
      const [sdk, dsl] = await Promise.all([loadSDK(), fetch('/demo.json').then((response) => { if (!response.ok) throw new Error('Demo definition unavailable.'); return response.json(); })]);
      $('#embed').replaceChildren();
      instance = await sdk.mount('#embed', { appId: 'sdk-customer-demo', appDsl: dsl, moduleInputs: customers[$('#customer').value] });
      instance.on('moduleOutputChange', (output) => { log('LOWCODER → HOST', output); $('#status').textContent = 'Live module connected. Change the customer or click its button.'; });
      instance.on('moduleEventTriggered', (event) => { log('LOWCODER → HOST', event); $('#status').textContent = 'The host received the module event: ' + event; });
      log('HOST → LOWCODER', customers[$('#customer').value]);
      active = true;
      $('#reset-demo').hidden = false;
      $('#status').textContent = 'SDK mounted. Waiting for the module to render…';
    } catch (error) {
      $('#status').textContent = error.message;
      log('LOAD ERROR', error.message);
      $('#embed').replaceChildren(button);
      button.disabled = false;
      button.textContent = 'Reload and try again';
      button.removeEventListener('click', run);
      button.addEventListener('click', () => location.reload(), { once: true });
    }
  }
  $('#load-demo')?.addEventListener('click', run);
  $('#customer')?.addEventListener('change', () => {
    if (!active) return;
    const input = customers[$('#customer').value];
    instance.setModuleInputs(input);
    log('HOST → LOWCODER', input);
  });
  $('#reset-demo')?.addEventListener('click', async () => {
    await window.LowcoderSDK.unmount('#embed');
    active = false;
    $('#reset-demo').hidden = true;
    const button = document.createElement('button');
    button.className = 'button primary'; button.id = 'load-demo'; button.textContent = 'Mount the module again';
    button.addEventListener('click', run);
    $('#embed').replaceChildren(button);
    $('#status').textContent = 'Module unmounted. The host page is still here.';
    log('HOST', 'Module destroyed; listeners and React root cleaned up.');
  });
  document.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(document.getElementById(button.dataset.copy).textContent); button.textContent = 'Copied'; }
    catch { button.textContent = 'Select code to copy'; }
  }));
})();
