import { html } from 'hono/html'
import { APP_KEYWORDS } from '../constants.js';

export const Layout = (props) => {
  const { title, children } = props
  return html`
    <!DOCTYPE html>
    <html lang="en" x-data="appData()">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${title}</title>
        <meta name="description" content="Convert and optimize your subscription links easily" />
        <meta name="keywords" content="${APP_KEYWORDS}" />
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=8" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Nunito:wght@600;700;800&display=swap" rel="stylesheet">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet" />
        <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/js-yaml@4.1.0/dist/js-yaml.min.js"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.13.10/dist/cdn.min.js" onerror="window.__alpineFailed=true"></script>
        <script>
          window.__alpineLoaded = false;
          document.addEventListener('alpine:init', () => { window.__alpineLoaded = true; });
          window.addEventListener('DOMContentLoaded', () => {
            if (window.__alpineFailed || !window.__alpineLoaded) {
              console.error('Failed to initialize Alpine.js. Interactive features are disabled.');
              const warning = document.createElement('div');
              warning.className = 'fixed bottom-4 right-4 bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg shadow';
              warning.textContent = '鍔犺浇 Alpine.js 澶辫触锛岄〉闈氦浜掑姛鑳戒笉鍙敤锛岃鍒锋柊鎴栨鏌ョ綉缁溿€?;
              document.body.appendChild(warning);
            }
          });
        </script>
        <script>
          tailwind.config = {
            darkMode: 'class',
            theme: {
              extend: {
                colors: {
                  primary: {
                    50: '#eefbf6',
                    100: '#d7f5e8',
                    200: '#b3ead5',
                    300: '#7fd7bb',
                    400: '#42bd9b',
                    500: '#199b7d',
                    600: '#0f7f69',
                    700: '#0d6557',
                    800: '#0e5148',
                    900: '#0d433c',
                    950: '#062824',
                  },
                  accent: {
                    50: '#fff8eb',
                    100: '#fdeac6',
                    200: '#f9d58e',
                    300: '#f0b84f',
                    400: '#df9826',
                    500: '#be7817',
                    600: '#985b14',
                    700: '#774414',
                    800: '#613817',
                    900: '#523018',
                  },
                  gray: {
                    850: '#1f2937',
                    900: '#111827',
                    950: '#0d1110',
                  }
                },
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                }
              }
            }
          }
        </script>
        <style>
          :root {
            --page-bg: #f7f8f3;
            --page-bg-soft: #edf2ed;
            --surface: rgba(255, 255, 252, 0.88);
            --surface-strong: #ffffff;
            --surface-muted: #eef3ee;
            --border: rgba(67, 83, 72, 0.18);
            --border-strong: rgba(31, 46, 38, 0.26);
            --ink: #17221d;
            --muted: #66746c;
            --primary: #0f7f69;
            --primary-strong: #0b6756;
            --accent: #be7817;
            --shadow: 0 18px 50px rgba(31, 46, 38, 0.10);
          }

          html.dark {
            --page-bg: #0d1110;
            --page-bg-soft: #121b18;
            --surface: rgba(18, 25, 23, 0.86);
            --surface-strong: #151d1a;
            --surface-muted: #101715;
            --border: rgba(172, 192, 179, 0.15);
            --border-strong: rgba(202, 216, 207, 0.24);
            --ink: #edf5ef;
            --muted: #9baaa1;
            --primary: #42bd9b;
            --primary-strong: #7fd7bb;
            --accent: #f0b84f;
            --shadow: 0 22px 60px rgba(0, 0, 0, 0.34);
          }

          body {
            font-family: 'Inter', system-ui, -apple-system, sans-serif;
            position: relative;
            min-height: 100vh;
            color: var(--ink);
            background:
              linear-gradient(180deg, var(--page-bg) 0%, var(--page-bg-soft) 54%, var(--page-bg) 100%);
          }

          body::before {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -2;
            background-image:
              linear-gradient(rgba(15, 127, 105, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(190, 120, 23, 0.07) 1px, transparent 1px);
            background-size: 36px 36px;
            mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.84), rgba(0, 0, 0, 0.16));
            opacity: 0.65;
            pointer-events: none;
          }

          .dark body::before,
          html.dark body::before {
            background-image:
              linear-gradient(rgba(66, 189, 155, 0.11) 1px, transparent 1px),
              linear-gradient(90deg, rgba(240, 184, 79, 0.08) 1px, transparent 1px);
            opacity: 0.42;
          }

          body::after {
            content: '';
            position: fixed;
            inset: 0;
            z-index: -1;
            opacity: 0.72;
            pointer-events: none;
            background:
              linear-gradient(90deg, rgba(15, 127, 105, 0.06), transparent 24%, transparent 74%, rgba(190, 120, 23, 0.05)),
              linear-gradient(180deg, rgba(255, 255, 255, 0.55), transparent 34%);
          }

          .dark body::after,
          html.dark body::after {
            opacity: 0.32;
            background:
              linear-gradient(90deg, rgba(66, 189, 155, 0.08), transparent 26%, transparent 76%, rgba(240, 184, 79, 0.05)),
              linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent 36%);
          }

          ::selection {
            background: rgba(15, 127, 105, 0.22);
          }

          [x-cloak] { display: none !important; }

          .rounded-2xl,
          .rounded-xl {
            border-radius: 0.5rem !important;
          }

          .surface-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 0.5rem;
            box-shadow: var(--shadow);
            backdrop-filter: blur(18px);
          }

          .surface-card:hover {
            border-color: var(--border-strong);
            box-shadow: 0 22px 64px rgba(31, 46, 38, 0.14);
          }

          html.dark .surface-card:hover {
            box-shadow: 0 24px 70px rgba(0, 0, 0, 0.42);
          }

          .tool-nav {
            background: color-mix(in srgb, var(--surface-strong) 88%, transparent);
            border-bottom: 1px solid var(--border);
            box-shadow: 0 10px 30px rgba(31, 46, 38, 0.08);
          }

          .tool-hero {
            position: relative;
            overflow: hidden;
            border: 1px solid var(--border);
            background:
              linear-gradient(135deg, color-mix(in srgb, var(--surface-strong) 88%, transparent), color-mix(in srgb, var(--surface-muted) 82%, transparent));
            box-shadow: var(--shadow);
          }

          .tool-hero::before {
            content: '';
            position: absolute;
            inset: 0;
            background:
              linear-gradient(90deg, rgba(15, 127, 105, 0.11), transparent 36%),
              linear-gradient(180deg, transparent, rgba(190, 120, 23, 0.08));
            pointer-events: none;
          }

          .tool-hero > * {
            position: relative;
          }

          .format-pill {
            border: 1px solid var(--border);
            background: color-mix(in srgb, var(--surface-strong) 74%, transparent);
            color: var(--muted);
          }

          .action-primary {
            border: 1px solid rgba(255, 255, 255, 0.24) !important;
            background: linear-gradient(135deg, #0f7f69 0%, #1b7f94 58%, #be7817 100%) !important;
            color: #fff !important;
            box-shadow: 0 16px 36px rgba(15, 127, 105, 0.26) !important;
          }

          .action-primary:hover {
            filter: saturate(1.05) brightness(1.03);
            box-shadow: 0 18px 44px rgba(15, 127, 105, 0.34) !important;
          }

          .action-secondary {
            background: var(--surface) !important;
            border: 1px solid var(--border) !important;
            color: var(--ink) !important;
          }

          .soft-input {
            background: color-mix(in srgb, var(--surface-muted) 76%, transparent) !important;
            border-color: var(--border) !important;
            color: var(--ink) !important;
          }

          input[type="text"],
          input[readonly],
          textarea,
          select {
            background: color-mix(in srgb, var(--surface-muted) 76%, transparent) !important;
            border-color: var(--border) !important;
            color: var(--ink) !important;
          }

          input:focus,
          textarea:focus,
          select:focus {
            border-color: color-mix(in srgb, var(--primary) 62%, white) !important;
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary) 20%, transparent) !important;
            outline: none !important;
          }

          .icon-tile {
            background: color-mix(in srgb, var(--primary) 12%, var(--surface-strong));
            color: var(--primary);
            border: 1px solid color-mix(in srgb, var(--primary) 24%, transparent);
          }

          /* Pastel paper workspace theme */
          :root {
            --page-bg: #fffaf0;
            --page-bg-soft: #fff4db;
            --surface: rgba(255, 254, 248, 0.96);
            --surface-strong: #fffefa;
            --surface-muted: #fff6e2;
            --border: #eadfbd;
            --border-strong: #d6c58f;
            --ink: #344033;
            --muted: #6f7868;
            --primary: #28789e;
            --primary-strong: #24617f;
            --accent: #e6b92f;
            --shadow: 0 10px 24px rgba(116, 91, 42, 0.12);
          }

          html.dark {
            --page-bg: #202b2b;
            --page-bg-soft: #253436;
            --surface: rgba(39, 52, 51, 0.96);
            --surface-strong: #2b3837;
            --surface-muted: #32413f;
            --border: rgba(243, 226, 171, 0.20);
            --border-strong: rgba(255, 238, 183, 0.36);
            --ink: #f8f4e8;
            --muted: #c8cfbd;
            --primary: #78c5e3;
            --primary-strong: #a6daed;
            --accent: #f4ce58;
            --shadow: 0 12px 30px rgba(0, 0, 0, 0.28);
          }

          body {
            background: var(--page-bg) !important;
          }

          body::before {
            background-image: radial-gradient(rgba(194, 166, 96, 0.24) 0.65px, transparent 0.65px) !important;
            background-size: 14px 14px !important;
            mask-image: none !important;
            opacity: 0.34 !important;
          }

          body::after {
            background: var(--page-bg-soft) !important;
            opacity: 0.16 !important;
          }

          html.dark body::before {
            background-image: radial-gradient(rgba(245, 218, 151, 0.20) 0.65px, transparent 0.65px) !important;
            opacity: 0.24 !important;
          }

          html.dark body::after {
            background: var(--page-bg-soft) !important;
            opacity: 0.08 !important;
          }

          h1, h2, h3 {
            font-family: 'Nunito', 'Inter', sans-serif;
          }

          .surface-card {
            border-radius: 0.45rem;
            box-shadow: var(--shadow);
            backdrop-filter: blur(10px);
          }

          .surface-card:hover {
            box-shadow: 0 14px 28px rgba(116, 91, 42, 0.16);
          }

          .tool-nav {
            background: color-mix(in srgb, var(--surface-strong) 96%, transparent);
            box-shadow: 0 4px 14px rgba(116, 91, 42, 0.09);
          }

          .tool-hero {
            background: #fff3c7;
            min-height: 184px;
          }

          .tool-hero::before {
            width: 148px;
            height: 88px;
            inset: auto;
            top: -34px;
            left: 8%;
            background: #dff0b7;
            border: 1px solid rgba(114, 142, 77, 0.20);
            box-shadow: 4px 7px 0 rgba(137, 108, 51, 0.08);
            transform: rotate(-5deg);
          }

          .tool-hero::after {
            content: '';
            position: absolute;
            width: 124px;
            height: 76px;
            right: 8%;
            bottom: -30px;
            background: #dceffc;
            border: 1px solid rgba(75, 141, 174, 0.18);
            box-shadow: -4px -7px 0 rgba(137, 108, 51, 0.07);
            transform: rotate(6deg);
            pointer-events: none;
          }

          .tool-hero > * {
            z-index: 1;
          }

          html.dark .tool-hero { background: #3d4d43; }
          html.dark .tool-hero::before { background: #69825d; }
          html.dark .tool-hero::after { background: #416c80; }

          .format-pill {
            background: color-mix(in srgb, var(--surface-strong) 92%, transparent);
          }

          .action-primary {
            border: 1px solid #226b8c !important;
            background: #287fa8 !important;
            box-shadow: 0 8px 16px rgba(40, 127, 168, 0.24) !important;
          }

          .action-primary:hover {
            background: #246f95 !important;
            box-shadow: 0 10px 18px rgba(40, 127, 168, 0.30) !important;
          }

          .action-secondary { background: #fffef9 !important; }
          .soft-input { background: #fffaf0 !important; }

          input[type="text"],
          input[type="password"],
          input[readonly],
          textarea,
          select {
            background: #fffdf7 !important;
          }

          input:focus,
          textarea:focus,
          select:focus {
            border-color: #72b5d1 !important;
            box-shadow: 0 0 0 3px rgba(114, 181, 209, 0.22) !important;
          }

          .icon-tile {
            background: #e6f4fa;
            border-color: #bfdeeb;
          }

          html.dark input[type="text"],
          html.dark input[type="password"],
          html.dark input[readonly],
          html.dark textarea,
          html.dark select {
            background: #2d3a39 !important;
          }
        </style>
        <script>
          function appData() {
            return {
              darkMode: localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
              toggleDarkMode() {
                this.darkMode = !this.darkMode;
                localStorage.setItem('theme', this.darkMode ? 'dark' : 'light');
                if (this.darkMode) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              },
              init() {
                if (this.darkMode) {
                  document.documentElement.classList.add('dark');
                }
              }
            }
          }

          // Version update checker Alpine.js component
          function updateChecker(currentVersion, apiUrl) {
            return {
              currentVersion: currentVersion,
              latestVersion: '',
              showUpdateToast: false,
              i18n: {
                newVersionAvailable: getUpdateI18n('newVersionAvailable'),
                currentVersion: getUpdateI18n('currentVersion'),
                viewRelease: getUpdateI18n('viewRelease'),
                updateGuide: getUpdateI18n('updateGuide'),
                later: getUpdateI18n('later')
              },
              init() {
                // Check for updates after a short delay to not block initial render
                setTimeout(() => this.checkForUpdates(), 3000);
              },
              async checkForUpdates() {
                try {
                  // Check if user dismissed this version before
                  const dismissedVersion = localStorage.getItem('sublink_dismissed_version');
                  const lastCheck = localStorage.getItem('sublink_last_version_check');
                  const now = Date.now();
                  
                  // Only check once per hour to avoid rate limiting
                  if (lastCheck && (now - parseInt(lastCheck)) < 3600000) {
                    const cachedVersion = localStorage.getItem('sublink_latest_version');
                    if (cachedVersion && cachedVersion !== dismissedVersion && this.compareVersions(cachedVersion, this.currentVersion) > 0) {
                      this.latestVersion = cachedVersion;
                      this.showUpdateToast = true;
                    }
                    return;
                  }

                  const response = await fetch(apiUrl, {
                    headers: { 'Accept': 'application/vnd.github.v3+json' }
                  });
                  
                  if (!response.ok) return;
                  
                  const data = await response.json();
                  const latestVersion = (data.tag_name || '').replace(/^v/, '');
                  
                  // Cache the result
                  localStorage.setItem('sublink_latest_version', latestVersion);
                  localStorage.setItem('sublink_last_version_check', now.toString());
                  
                  // Compare versions
                  if (latestVersion && latestVersion !== dismissedVersion && this.compareVersions(latestVersion, this.currentVersion) > 0) {
                    this.latestVersion = latestVersion;
                    this.showUpdateToast = true;
                  }
                } catch (error) {
                  console.debug('Version check failed:', error.message);
                }
              },
              compareVersions(v1, v2) {
                const parts1 = v1.split('.').map(Number);
                const parts2 = v2.split('.').map(Number);
                for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                  const p1 = parts1[i] || 0;
                  const p2 = parts2[i] || 0;
                  if (p1 > p2) return 1;
                  if (p1 < p2) return -1;
                }
                return 0;
              },
              dismissUpdate() {
                this.showUpdateToast = false;
                localStorage.setItem('sublink_dismissed_version', this.latestVersion);
              }
            }
          }

          // i18n helper for update checker
          function getUpdateI18n(key) {
            const lang = navigator.language || 'en-US';
            const translations = {
              'zh-CN': {
                newVersionAvailable: '鍙戠幇鏂扮増鏈?,
                currentVersion: '褰撳墠鐗堟湰',
                viewRelease: '鏌ョ湅鏇存柊',
                updateGuide: '鏇存柊鎸囧崡',
                later: '绋嶅悗鎻愰啋'
              },
              'zh-TW': {
                newVersionAvailable: '鐧肩従鏂扮増鏈?,
                currentVersion: '鐣跺墠鐗堟湰',
                viewRelease: '鏌ョ湅鏇存柊',
                updateGuide: '鏇存柊鎸囧崡',
                later: '绋嶅緦鎻愰啋'
              },
              'en-US': {
                newVersionAvailable: 'New Version Available',
                currentVersion: 'Current',
                viewRelease: 'View Release',
                updateGuide: 'Update Guide',
                later: 'Later'
              },
              'fa': {
                newVersionAvailable: '賳爻禺賴 噩丿蹖丿 賲賵噩賵丿 丕爻鬲',
                currentVersion: '賳爻禺賴 賮毓賱蹖',
                viewRelease: '賲卮丕賴丿賴 賳爻禺賴',
                updateGuide: '乇丕賴賳賲丕蹖 亘賴鈥屫辟堌藏必池з嗃?,
                later: '亘毓丿丕賸'
              },
              'ru': {
                newVersionAvailable: '袛芯褋褌褍锌薪邪 薪芯胁邪褟 胁械褉褋懈褟',
                currentVersion: '孝械泻褍褖邪褟',
                viewRelease: '袩芯褋屑芯褌褉械褌褜',
                updateGuide: '袪褍泻芯胁芯写褋褌胁芯 锌芯 芯斜薪芯胁谢械薪懈褞',
                later: '袩芯蟹卸械'
              }
            };
            const langKey = Object.keys(translations).find(k => lang.startsWith(k.split('-')[0])) || 'en-US';
            return translations[langKey][key] || translations['en-US'][key];
          }
        </script>
      </head>
      <body class="bg-transparent text-gray-900 dark:text-gray-100 transition-colors duration-300">
        ${children}
      </body>
    </html>
  `
}
