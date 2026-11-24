// ==========================================================================
//  Complaint to Request — Aura Glass v3.0 Engine
// ==========================================================================

const CONTACTS = {
  telegramDirect: 'https://t.me/sathez',
  telegramChannel: 'https://t.me/brainseareal',
  instagram: 'https://instagram.com/solyansky_psy'
};

const APP = {
  data: window.TEST_DATA || {},
  currentScreen: 'onboarding', // 'onboarding' | 'interstitial' | 'question' | 'result'
  onboardingStep: 1,
  currentIndex: 0,
  answers: {},
  pendingInterstitial: null,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.initSpotlight();
    this.initBackgroundCanvas();
    this.render();
  },

  initBackgroundCanvas() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height, baseRadius;
    const numPoints = 320;
    const points = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < numPoints; i++) {
      const y = 1 - (i / (numPoints - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = goldenAngle * i;
      const phi = Math.acos(y);
      points.push({
        ox: Math.cos(theta) * radiusAtY,
        oy: y,
        oz: Math.sin(theta) * radiusAtY,
        theta: theta,
        phi: phi,
        seed: Math.random() * 10
      });
    }

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      baseRadius = Math.min(width, height) * 0.42;
    };

    let t = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.012;

      const cx = width * 0.5;
      const cy = height * 0.5;
      const rotY = t * 0.35;
      const rotX = Math.sin(t * 0.22) * 0.45;
      const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX), sinX = Math.sin(rotX);

      const focal = 650;

      for (let i = 0; i < numPoints; i++) {
        const pt = points[i];

        // Organic sci-fi morphing (breathing sponge / harmonic wave field)
        const wave1 = Math.sin(pt.phi * 3.2 + t * 1.6) * Math.cos(pt.theta * 2.5 - t * 1.2);
        const wave2 = Math.sin(pt.oy * 4.0 - t * 1.9) * 0.5;
        const breathe = Math.sin(t * 0.7) * 0.14;
        const r = baseRadius * (1 + breathe + (wave1 + wave2) * 0.24);

        let x = pt.ox * r;
        let y = pt.oy * r;
        let z = pt.oz * r;

        // Rotate Y
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        // Rotate X
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Perspective projection
        const scale = focal / (focal + z2 + baseRadius * 0.5);
        const sx = cx + x1 * scale;
        const sy = cy + y2 * scale;

        // Depth-based alpha & size
        const depthRatio = (z2 + baseRadius) / (2 * baseRadius); // 0 (front) to 1 (back)
        const alpha = Math.max(0.06, Math.min(0.65, (1 - depthRatio * 0.75) * 0.55));
        const dotSize = Math.max(0.8, (1.1 - depthRatio * 0.6) * 2.6 * scale);

        // Color blend between Acid Neon (0, 255, 136) and Cyber Cyan (6, 182, 212)
        const mix = (Math.sin(pt.phi * 2 + t) + 1) * 0.5;
        const rCol = Math.round(0 + mix * 6);
        const gCol = Math.round(255 - mix * 73);
        const bCol = Math.round(136 + mix * 76);

        ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${alpha})`;
        ctx.beginPath();
        ctx.arc(sx, sy, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    animate();
  },

  cacheDOM() {
    this.container = document.getElementById('app-main');
    this.progressFill = document.getElementById('progress-fill');
    this.stageCounter = document.getElementById('stage-counter');
  },

  initSpotlight() {
    const spot = document.getElementById('ambient-spotlight');
    if (!spot) return;
    document.addEventListener('mousemove', (e) => {
      spot.style.left = e.clientX + 'px';
      spot.style.top = e.clientY + 'px';
    });
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      if (action === 'onboarding-next') {
        if (this.onboardingStep < 3) {
          this.onboardingStep++;
          this.render();
        } else {
          this.currentScreen = 'question';
          this.currentIndex = 0;
          this.render();
        }
      } else if (action === 'onboarding-prev') {
        if (this.onboardingStep > 1) {
          this.onboardingStep--;
          this.render();
        }
      } else if (action === 'toggle-option') {
        this.toggleOption(target.dataset.key);
      } else if (action === 'submit-question') {
        this.advanceQuestion();
      } else if (action === 'prev-question') {
        if (this.currentIndex > 0) {
          this.currentIndex--;
          this.render();
        } else {
          this.currentScreen = 'onboarding';
          this.onboardingStep = 3;
          this.render();
        }
      } else if (action === 'continue-interstitial') {
        this.currentScreen = 'question';
        this.render();
      } else if (action === 'restart') {
        this.answers = {};
        this.currentIndex = 0;
        this.onboardingStep = 1;
        this.currentScreen = 'onboarding';
        this.render();
      } else if (action === 'copy-result') {
        this.copyResultToClipboard(target);
      }
    });
  },

  toggleOption(key) {
    const q = this.data.questions[this.currentIndex];
    if (!this.answers[q.number]) {
      this.answers[q.number] = [];
    }

    const currentArr = this.answers[q.number];
    const idx = currentArr.indexOf(key);

    if (idx > -1) {
      currentArr.splice(idx, 1);
    } else {
      if (currentArr.length >= 3) {
        currentArr.shift();
      }
      currentArr.push(key);
    }

    document.querySelectorAll('.option-chip').forEach(chip => {
      chip.classList.toggle('selected', currentArr.includes(chip.dataset.key));
    });

    const submitBtn = document.getElementById('btn-submit');
    const badge = document.getElementById('selected-count-badge');
    if (submitBtn) submitBtn.disabled = currentArr.length === 0;
    if (badge) {
      badge.textContent = currentArr.length > 0 ? `ВЫБРАНО: ${currentArr.length}` : '1–3 ВАРИАНТА';
    }
  },

  advanceQuestion() {
    const q = this.data.questions[this.currentIndex];
    
    if (q.number === 4) {
      this.showInterstitial({
        tag: 'ЭТАП 01 ЗАВЕРШЁН',
        title: 'ЖАЛОБА ЗАФИКСИРОВАНА',
        desc: 'Мы сняли первичный слой напряжения. Теперь посмотрим правде в глаза: чего вы на самом деле хотите вместо текущей ситуации?'
      });
      this.currentIndex++;
      return;
    } else if (q.number === 13) {
      this.showInterstitial({
        tag: 'ЭКВАТОР • 50%',
        title: 'ВНУТРЕННИЙ САБОТАЖНИК',
        desc: 'Половина пути пройдена. Сейчас мы заглянем за кулисы психики и увидим, что именно останавливает вас в шаге от действия.'
      });
      this.currentIndex++;
      return;
    } else if (q.number === 24) {
      this.showInterstitial({
        tag: 'ФИНАЛЬНЫЙ РУБЕЖ',
        title: 'СБОРКА ЗАПРОСА',
        desc: 'Осталось два финальных вопроса. На их основе система соберёт ваш психологический профиль и точную формулировку запроса.'
      });
      this.currentIndex++;
      return;
    }

    if (this.currentIndex < this.data.questions.length - 1) {
      this.currentIndex++;
      this.render();
    } else {
      this.showResult();
    }
  },

  showInterstitial(data) {
    this.pendingInterstitial = data;
    this.currentScreen = 'interstitial';
    this.render();
  },

  updateProgress(pct, label) {
    if (this.progressFill) this.progressFill.style.width = pct + '%';
    if (this.stageCounter) this.stageCounter.textContent = label;
  },

  render() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (this.currentScreen === 'onboarding') this.renderOnboarding();
    else if (this.currentScreen === 'interstitial') this.renderInterstitial();
    else if (this.currentScreen === 'question') this.renderQuestion();
    else if (this.currentScreen === 'result') this.renderResult();
  },

  // ========================================================================
  // Onboarding (3 Swiss HUD Screens)
  // ========================================================================
  renderOnboarding() {
    const step = this.onboardingStep;
    this.updateProgress(step * 33.3, `CALIBRATION • 0${step}/03`);

    let hudSvg = '';
    let title = '';
    let desc = '';
    let trayLabel = '';
    let trayText = '';

    if (step === 1) {
      // Concentric HUD Telemetry Rings
      hudSvg = `
        <svg class="hud-ring-svg" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>
          <circle class="hud-ring-spin" cx="60" cy="60" r="44" stroke="#00ff88" stroke-width="1.5" stroke-dasharray="14 8 4 8" stroke-linecap="round"/>
          <circle class="hud-ring-pulse" cx="60" cy="60" r="30" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="40 20"/>
          <circle cx="60" cy="60" r="6" fill="#00ff88"/>
          <circle cx="60" cy="60" r="14" stroke="rgba(0,255,136,0.3)" stroke-width="1"/>
        </svg>
      `;
      title = 'РАСПУТАТЬ КЛУБОК ЗА 5 МИНУТ';
      desc = 'Это не академический экзамен и не постановка диагнозов. Навигатор находит точку, где ваш интеллект и опыт застревают в ступоре, и переводит фон в ясное действие.';
      trayLabel = 'ЦЕЛЬ ИССЛЕДОВАНИЯ';
      trayText = 'Выявить скрытый механизм (перфекционизм, страх ошибки, чужие сценарии) и собрать ваш точный запрос от первого лица.';
    } else if (step === 2) {
      // Neural Pulse Wave
      hudSvg = `
        <svg class="hud-ring-svg" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
          <path d="M18 60 H34 L42 36 L54 84 L66 28 L76 74 L84 60 H102" stroke="#00ff88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="60" cy="60" r="38" stroke="rgba(245,158,11,0.25)" stroke-width="1" stroke-dasharray="4 6"/>
        </svg>
      `;
      title = 'ОТКЛЮЧИТЕ КРИТИКА. СЛУШАЙТЕ ИМПУЛЬС';
      desc = 'Здесь нет правильных или «хороших» ответов. Не анализируйте варианты логикой и не пытайтесь угадать, как надо ответить.';
      trayLabel = 'ПРАВИЛО 3 СЕКУНД';
      trayText = 'Выбирайте то, на что первым откликнулось ощущение внутри. Самая быстрая реакция — самая точная.';
    } else if (step === 3) {
      // Modular Multi-Select Nodes
      hudSvg = `
        <svg class="hud-ring-svg" viewBox="0 0 120 120" fill="none">
          <rect x="24" y="24" width="30" height="30" rx="8" stroke="#00ff88" stroke-width="1.6" fill="rgba(0,255,136,0.1)"/>
          <rect x="66" y="24" width="30" height="30" rx="8" stroke="rgba(255,255,255,0.2)" stroke-width="1.4"/>
          <rect x="24" y="66" width="30" height="30" rx="8" stroke="rgba(255,255,255,0.2)" stroke-width="1.4"/>
          <rect x="66" y="66" width="30" height="30" rx="8" stroke="#06b6d4" stroke-width="1.6" fill="rgba(6,182,212,0.1)"/>
          <path d="M33 39 L37 43 L45 34" stroke="#00ff88" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M75 81 L79 85 L87 76" stroke="#06b6d4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      title = 'СВОБОДА ВЫБОРА: 1–3 ВАРИАНТА';
      desc = 'Внутренний конфликт редко бывает односложным. Если в вопросе отзывается сразу несколько граней — отмечайте до 3 вариантов.';
      trayLabel = 'НАВИГАЦИЯ';
      trayText = 'Кликайте подходящие плитки, затем нажимайте кнопку «Далее». Никакой спешки и принудительного перелистывания.';
    }

    this.container.innerHTML = `
      <div class="glass-card">
        <div class="step-bars">
          <div class="step-bar ${step >= 1 ? 'active' : ''}"></div>
          <div class="step-bar ${step >= 2 ? 'active' : ''}"></div>
          <div class="step-bar ${step >= 3 ? 'active' : ''}"></div>
        </div>

        <div class="hud-visual-box">
          ${hudSvg}
        </div>

        <h1 class="dot-h1">${title}</h1>
        <p class="ui-body">${desc}</p>

        <div class="recessed-tray">
          <div class="tray-label">
            <span class="status-pip" style="background: var(--color-amber); box-shadow: 0 0 6px var(--color-amber);"></span>
            <span>${trayLabel}</span>
          </div>
          <div class="tray-text">${trayText}</div>
        </div>

        <div class="card-nav">
          ${step > 1 ? `
            <button class="btn-translucent" data-action="onboarding-prev">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
              <span>Назад</span>
            </button>
          ` : ''}

          <button class="btn-luminous-jade" data-action="onboarding-next">
            <span>${step === 3 ? 'Начать исследование' : 'Понятно, далее'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    `;
  },

  // ========================================================================
  // Interstitial View
  // ========================================================================
  renderInterstitial() {
    const data = this.pendingInterstitial;
    this.container.innerHTML = `
      <div class="glass-card">
        <div class="interstitial-wrap">
          <div class="dot-badge" style="margin-bottom: 24px; border-color: rgba(6,182,212,0.4); color: var(--color-cyan);">
            <span class="status-pip" style="background: var(--color-cyan); box-shadow: 0 0 8px var(--color-cyan);"></span>
            <span>${data.tag}</span>
          </div>

          <h2 class="dot-h1" style="text-align: center; margin-bottom: 16px;">${data.title}</h2>
          <p class="ui-body" style="text-align: center; max-width: 440px;">${data.desc}</p>

          <button class="btn-luminous-jade" data-action="continue-interstitial" style="max-width: 300px; width: 100%; flex: initial;">
            <span>Продолжить</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    `;
  },

  // ========================================================================
  // Question View
  // ========================================================================
  renderQuestion() {
    const q = this.data.questions[this.currentIndex];
    const total = this.data.questions.length;
    const currentSelected = this.answers[q.number] || [];
    const pct = Math.round(((this.currentIndex) / total) * 100);

    this.updateProgress(pct, `STAGE 0${q.stage_num}/08 • Q${String(this.currentIndex + 1).padStart(2, '0')}/${total}`);

    const optionsHtml = q.options.map(opt => {
      const isSelected = currentSelected.includes(opt.key);
      return `
        <div class="option-chip ${isSelected ? 'selected' : ''}" data-action="toggle-option" data-key="${opt.key}">
          <div class="opt-key">${opt.key}</div>
          <div class="opt-text">${opt.text}</div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="glass-card">
        <div class="q-header-row">
          <div class="stage-dot-label">
            <span class="status-pip"></span>
            <span>ЭТАП ${q.stage_num}: ${q.stage_title}</span>
          </div>
          <div class="select-pill-counter" id="selected-count-badge">
            ${currentSelected.length > 0 ? `ВЫБРАНО: ${currentSelected.length}` : '1–3 ВАРИАНТА'}
          </div>
        </div>

        <h2 class="q-title">${q.title}</h2>

        <div class="options-list">
          ${optionsHtml}
        </div>

        <div class="card-nav">
          <button class="btn-translucent" data-action="prev-question">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Назад</span>
          </button>
          
          <button class="btn-luminous-jade" id="btn-submit" data-action="submit-question" ${currentSelected.length === 0 ? 'disabled' : ''}>
            <span>${this.currentIndex === total - 1 ? 'Сформировать профиль' : 'Далее'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    `;
  },

  // ========================================================================
  // Result Calculation & Output
  // ========================================================================
  calculateResult() {
    const q25Selected = this.answers[25] || ['A'];
    const q25Mapping = { 'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8 };
    const scores = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0 };

    q25Selected.forEach(key => {
      if (q25Mapping[key]) scores[q25Mapping[key]] += 10;
    });

    const mapKeys = (qNum, keyMap) => {
      (this.answers[qNum] || []).forEach(k => {
        if (keyMap[k]) scores[keyMap[k]] += 3;
      });
    };

    mapKeys(1, { 'A': 5, 'B': 1, 'C': 2, 'D': 6, 'E': 3, 'F': 4, 'G': 8, 'H': 7 });
    mapKeys(7, { 'A': 1, 'B': 5, 'C': 3, 'D': 5, 'E': 2, 'F': 8, 'G': 4, 'H': 6 });

    let bestId = 1, maxScore = -1;
    for (let id = 1; id <= 8; id++) {
      if (scores[id] > maxScore) { maxScore = scores[id]; bestId = id; }
    }

    return { direction: this.data.directions[bestId] || this.data.directions[1] };
  },

  showResult() {
    this.currentScreen = 'result';
    this.updateProgress(100, 'ANALYSIS.COMPLETE');
    this.render();
  },

  renderResult() {
    const d = this.calculateResult().direction;

    const exploreHtml = d.explore.map(item => `
      <li class="explore-item">
        <span style="color: var(--color-neon); font-family: var(--font-tech);">→</span>
        <span>${item}</span>
      </li>
    `).join('');

    const tgMessage = encodeURIComponent(
      `Привет, Александр! Я прошёл тест «От жалобы к запросу».\n\n` +
      `Мой результат: ${d.title}\n` +
      `Мой предварительный запрос: «${d.request}»\n\n` +
      `Хочу разобрать этот запрос на личной сессии.`
    );

    const tgUrl = `${CONTACTS.telegramDirect}?text=${tgMessage}`;

    this.container.innerHTML = `
      <div class="glass-card">
        <div class="dot-badge" style="margin-bottom: 18px; border-color: rgba(0,255,136,0.4); color: var(--color-neon); align-self: flex-start;">
          <span class="status-pip"></span>
          <span>ПРОФИЛЬ СФОРМИРОВАН</span>
        </div>

        <h1 class="dot-h1" style="margin-bottom: 20px;">РЕЗУЛЬТАТ ИССЛЕДОВАНИЯ</h1>

        <div class="result-focus-card">
          <div class="tray-label" style="color: var(--color-neon); margin-bottom: 4px;">ОСНОВНОЕ НАПРАВЛЕНИЕ</div>
          <div class="focus-dot-title">${d.title}</div>
          <p class="ui-body" style="color: #e5e7eb; margin-bottom: 0; font-size: 14px;">${d.happening}</p>
        </div>

        <div class="recessed-tray" style="margin-bottom: 20px;">
          <div class="tray-label" style="color: var(--color-amber);">КАК РАБОТАЕТ МЕХАНИЗМ</div>
          <div class="chain-monospaced">${d.mechanism}</div>
        </div>

        <div class="request-card">
          <div class="tray-label" style="color: var(--color-cyan);">ПРЕДВАРИТЕЛЬНЫЙ ЗАПРОС</div>
          <div class="request-quote">«${d.request}»</div>
        </div>

        <div style="margin-bottom: 22px;">
          <div class="tray-label" style="color: var(--text-muted); margin-bottom: 10px;">ЧТО СТОИТ ИССЛЕДОВАТЬ</div>
          <ul class="explore-list">${exploreHtml}</ul>
        </div>

        <div class="recessed-tray" style="margin-bottom: 24px;">
          <div class="tray-label" style="color: var(--color-neon);">ВАША ОПОРА</div>
          <div class="tray-text">${d.strength}</div>
        </div>

        <!-- Мягкий переход к пробной сессии -->
        <div class="recessed-tray" style="margin-bottom: 18px; border-color: rgba(0, 255, 136, 0.25);">
          <div class="tray-label" style="color: var(--color-neon); margin-bottom: 8px;">ЧТО ДАЛЬШЕ?</div>
          <div class="tray-text" style="margin-bottom: 18px; font-size: 14px; color: #e5e7eb; line-height: 1.6;">
            Тест помогает увидеть картину со стороны, но настоящий сдвиг начинается в живом диалоге. Вы можете прийти на короткую пробную сессию — мы спокойно разберём ваш запрос и посмотрим, как распутать этот узел. Без давления и обязательств.
          </div>

          <a href="${tgUrl}" target="_blank" class="btn-luminous-jade" style="width: 100%; text-decoration: none;">
            <span>Записаться на пробную сессию</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>

        <div style="text-align: center; margin-top: 6px;">
          <button data-action="restart" style="background: none; border: none; color: var(--text-dim); font-family: var(--font-ui); font-size: 12.5px; cursor: pointer; padding: 8px;">
            Пройти тест заново
          </button>
        </div>
      </div>
    `;
  },

  copyResultToClipboard(button) {
    const d = this.calculateResult().direction;
    const textToCopy = `Профиль «От жалобы к запросу»:\n\nФокус: ${d.title}\nМеханизм: ${d.mechanism}\nЗапрос: «${d.request}»`;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const orig = button.innerHTML;
      button.innerHTML = `<span>✓ Скопировано в буфер</span>`;
      setTimeout(() => { button.innerHTML = orig; }, 2000);
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  APP.init();
});
