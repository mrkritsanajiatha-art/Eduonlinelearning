const fs = require('fs');
const path = require('path');

const srcDir = __dirname; // We are in appscript folder
const outDir = path.join(__dirname, 'docs');

// Clean docs folder completely
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir);
fs.mkdirSync(path.join(outDir, 'css'));
fs.mkdirSync(path.join(outDir, 'js'));

// Read config from Settings.js
const configStr = fs.readFileSync(path.join(srcDir, 'Settings.js'), 'utf8');
let publishedUrl = '';
const match = configStr.match(/publishedUrl:\s*'([^']+)'/);
if (match) publishedUrl = match[1];

// Extract styles
let styleStr = fs.readFileSync(path.join(srcDir, 'style.html'), 'utf8');
styleStr = styleStr.replace(/<style>/, '').replace(/<\/style>/, '');
fs.writeFileSync(path.join(outDir, 'css', 'style.css'), styleStr);

// Extract and modify scripts
let scriptStr = fs.readFileSync(path.join(srcDir, 'script.html'), 'utf8');
scriptStr = scriptStr.replace(/<script[^>]*>/g, '').replace(/<\/script>/g, '');
scriptStr = scriptStr.replace(/window\.top\.location\.href = link\.href/g, "location.hash = link.href.split('?page=')[1]");
scriptStr = scriptStr.replace(/function pageUrl\(page\) \{[^}]+\}/, "function pageUrl(page) { return '#' + page; }");
scriptStr = scriptStr.replace(/function callApi\(method, payload = \{\}\) \{[\s\S]*?\}\nfunction/m, "function ");
const appJsContent = `
const API_ENDPOINT = '${publishedUrl}';
let appConfig = {};
const app = {
  logoUrl: 'https://img5.pic.in.th/file/secure-sv1/logo-smpd.png',
  subtitle: '',
  paymentQrUrl: 'https://img2.pic.in.th/pic/qrcode62ebffbb5d70e4e7.jpg',
  payment: { bank: 'ธนาคารกสิกรไทย', accountNumber: '000-0-00000-0', promptPay: '0800000000', accountName: 'ชื่อบัญชี' }
};
const API_URL = API_ENDPOINT;

async function callApi(method, payload = {}) {
  payload.token = localStorage.getItem('appToken') || '';
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ method, payload }),
      redirect: 'follow'
    });
    const res = await response.json();
    if (res && res.ok) return res.data;
    const msg = (res && res.message) || 'Error';
    if (msg.includes('No token') || msg.includes('Invalid token')) {
       localStorage.removeItem('appToken');
       if (location.hash !== '#login' && location.hash !== '#home' && location.hash !== '#courses') {
         location.hash = 'login';
       }
    }
    throw new Error(msg);
  } catch (err) {
    throw err;
  }
}

${scriptStr}

// SPA Router
function loadPage(page) {
  if(!page) page = 'home';
  const tpl = document.getElementById('tpl-' + page);
  if(!tpl) {
    document.getElementById('app-content').innerHTML = '<div class="alert alert-danger m-5">Page not found</div>';
    return;
  }
  document.getElementById('app-content').innerHTML = tpl.innerHTML;
  if (window.pageInit) window.pageInit();
}

window.addEventListener('hashchange', () => {
  loadPage(location.hash ? location.hash.substring(1) : 'home');
});

document.addEventListener('DOMContentLoaded', () => {
  loadPage(location.hash ? location.hash.substring(1) : 'home');
});
`;
fs.writeFileSync(path.join(outDir, 'js', 'app.js'), appJsContent);

// Process templates
let templatesStr = '';
const files = fs.readdirSync(srcDir);
files.forEach(file => {
  if (file.endsWith('.html') && file !== 'style.html' && file !== 'script.html' && file !== 'index.html') {
    let content = fs.readFileSync(path.join(srcDir, file), 'utf8');
    const mainMatch = content.match(/<main[^>]*>([\s\S]*?)<\/main>/);
    let body = mainMatch ? mainMatch[1] : '';
    if (!mainMatch) {
       body = content.replace(/<\/?(body|html|head)[^>]*>/g, '').replace(/<\?!= include.*?\?>/g, '');
    }
    body = body.replace(/<\?= app\.logoUrl \?>/g, "https://img5.pic.in.th/file/secure-sv1/logo-smpd.png");
    body = body.replace(/<\?= app\.subtitle \?>/g, "<span class='app-subtitle-text'></span>");
    body = body.replace(/<\?= app\.paymentQrUrl \?>/g, "https://img2.pic.in.th/pic/qrcode62ebffbb5d70e4e7.jpg");
    templatesStr += `<div id="tpl-${file.replace('.html', '')}">\n${body}\n</div>\n`;
  }
});

// For index.html, we extract its structure
let indexHtml = fs.readFileSync(path.join(srcDir, 'index.html'), 'utf8');
// Clean up <?!= include ?> tags
indexHtml = indexHtml.replace(/<\?!= include\('style'\); \?>/, '<link rel="stylesheet" href="css/style.css">');
indexHtml = indexHtml.replace(/<\?!= include\('script'\); \?>/, '<script src="js/app.js"></script>');
indexHtml = indexHtml.replace(/<\?= app\.logoUrl \?>/g, "https://img5.pic.in.th/file/secure-sv1/logo-smpd.png");
indexHtml = indexHtml.replace(/<\?= app\.subtitle \?>/g, "<span class='app-subtitle-text'></span>");

// Replace everything inside <main> with a spinner
indexHtml = indexHtml.replace(/<main[^>]*>[\s\S]*?<\/main>/, `<main id="app-content">
  <div class="text-center p-5"><div class="spinner-border text-primary"></div></div>
</main>
<div id="templates" style="display: none;">
${templatesStr}
</div>
`);

fs.writeFileSync(path.join(outDir, 'index.html'), indexHtml);
console.log('Build SPA completed in docs/');
