// ==========================================================================
//  Complaint to Request — Aura Glass v3.1 Engine
// ==========================================================================

const CONTACTS = {
  telegramDirect: 'https://t.me/sathez',
  telegramChannel: 'https://t.me/brainseareal',
  instagram: 'https://instagram.com/solyansky_psy'
};

const APP = {
  data: window.TEST_DATA || {},
  currentScreen: 'hero', // 'hero' | 'onboarding' | 'interstitial' | 'question' | 'result'
  onboardingStep: 1,
  currentIndex: 0,
  answers: {},
  pendingInterstitial: null,

  // 10-minute reverse timer state
  remainingSeconds: 600,
  timerInterval: null,
  timerExpired: false,

  init() {
    this.cacheDOM();
    this.bindEvents();
    this.initSpotlight();
    this.initBackgroundCanvas();
    this.render();
  },

  cacheDOM() {
    this.container = document.getElementById('app-main');
    this.progressFill = document.getElementById('progress-fill');
    this.stageCounter = document.getElementById('stage-counter');
    this.timerEl = document.getElementById('hud-timer');
  },

  initSpotlight() {
    const spot = document.getElementById('ambient-spotlight');
    if (!spot) return;
    document.addEventListener('mousemove', (e) => {
      spot.style.left = e.clientX + 'px';
      spot.style.top = e.clientY + 'px';
    });
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
        phi: phi
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

        const wave1 = Math.sin(pt.phi * 3.2 + t * 1.6) * Math.cos(pt.theta * 2.5 - t * 1.2);
        const wave2 = Math.sin(pt.oy * 4.0 - t * 1.9) * 0.5;
        const breathe = Math.sin(t * 0.7) * 0.14;
        const r = baseRadius * (1 + breathe + (wave1 + wave2) * 0.24);

        let x = pt.ox * r;
        let y = pt.oy * r;
        let z = pt.oz * r;

        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const scale = focal / (focal + z2 + baseRadius * 0.5);
        const sx = cx + x1 * scale;
        const sy = cy + y2 * scale;

        const depthRatio = (z2 + baseRadius) / (2 * baseRadius);
        const alpha = Math.max(0.06, Math.min(0.65, (1 - depthRatio * 0.75) * 0.55));
        const dotSize = Math.max(0.8, (1.1 - depthRatio * 0.6) * 2.6 * scale);

        // Warm Yellow Gold (250, 204, 21) to Amber (245, 158, 11)
        const mix = (Math.sin(pt.phi * 2 + t) + 1) * 0.5;
        const rCol = Math.round(250 - mix * 5);
        const gCol = Math.round(204 - mix * 46);
        const bCol = Math.round(21 - mix * 10);

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

  // ========================================================================
  // 10-Minute Reverse Timer
  // ========================================================================
  startTimer() {
    if (this.timerInterval) return;
    if (this.timerEl) this.timerEl.style.display = 'inline-block';
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
        this.updateTimerDisplay();
      } else {
        this.timerExpired = true;
        this.stopTimer();
        this.updateTimerDisplay();
        // Inject gentle timeout banner if currently on a question screen
        if (this.currentScreen === 'question') {
          this.renderTimeoutBanner();
        }
      }
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  resetTimer() {
    this.stopTimer();
    this.remainingSeconds = 600;
    this.timerExpired = false;
    if (this.timerEl) {
      this.timerEl.style.display = 'none';
      this.timerEl.classList.remove('expired');
    }
  },

  updateTimerDisplay() {
    if (!this.timerEl) return;
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    this.timerEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    if (this.timerExpired) {
      this.timerEl.classList.add('expired');
      this.timerEl.textContent = '00:00';
    }
  },

  renderTimeoutBanner() {
    const slot = document.getElementById('timeout-slot');
    if (slot && !slot.innerHTML.trim()) {
      slot.innerHTML = `
        <div class="timeout-banner">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="flex-shrink:0;"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <span>10 минут вышли, но ничего страшного — можете спокойно продолжать тест в своём темпе.</span>
        </div>
      `;
    }
  },

  bindEvents() {
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-action]');
      if (!target) return;
      const action = target.dataset.action;

      if (action === 'hero-start') {
        this.currentScreen = 'onboarding';
        this.onboardingStep = 1;
        this.render();
      } else if (action === 'onboarding-next') {
        if (this.onboardingStep < 3) {
          this.onboardingStep++;
          this.render();
        } else {
          this.currentScreen = 'question';
          this.currentIndex = 0;
          this.startTimer();
          this.render();
        }
      } else if (action === 'onboarding-prev') {
        if (this.onboardingStep > 1) {
          this.onboardingStep--;
          this.render();
        } else {
          this.currentScreen = 'hero';
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
        this.resetTimer();
        this.currentScreen = 'hero';
        this.render();
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
        desc: 'Мы сняли первый слой напряжения. Теперь посмотрим, чего вам на самом деле хочется вместо текущей ситуации.'
      });
      this.currentIndex++;
      return;
    } else if (q.number === 13) {
      this.showInterstitial({
        tag: 'ЭКВАТОР • 50%',
        title: 'ЧТО ПРОИСХОДИТ ВНУТРИ',
        desc: 'Половина позади. Дальше — про то, как именно внутренний критик или тревога тормозят вас в шаге от действия.'
      });
      this.currentIndex++;
      return;
    } else if (q.number === 24) {
      this.showInterstitial({
        tag: 'ФИНАЛЬНЫЙ РУБЕЖ',
        title: 'СОБИРАЕМ ЗАПРОС',
        desc: 'Осталось два вопроса. На их основе система соберёт ваш профиль и чёткую формулировку запроса.'
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
    if (this.currentScreen === 'hero') this.renderHero();
    else if (this.currentScreen === 'onboarding') this.renderOnboarding();
    else if (this.currentScreen === 'interstitial') this.renderInterstitial();
    else if (this.currentScreen === 'question') this.renderQuestion();
    else if (this.currentScreen === 'result') this.renderResult();
  },

  // ========================================================================
  // Screen 0: Hero / Welcome (Кто я и куда вы попали)
  // ========================================================================
  renderHero() {
    this.updateProgress(0, 'WELCOME');

    this.container.innerHTML = `
      <div class="glass-card">
        <div class="hero-avatar-wrap">
          <div class="hero-avatar-ring">
            <img src="assets/hero_avatar.jpg" alt="Александр Солянский" class="hero-avatar-img">
          </div>
        </div>

        <h1 class="dot-h1" style="text-align: center;">ПРИВЕТ. Я АЛЕКСАНДР СОЛЯНСКИЙ</h1>
        <p class="ui-body" style="text-align: center;">
          Психолог. Работаю с людьми, у которых за плечами много опыта и мыслей, но внутри сейчас каша, ступор или усталость.
        </p>

        <div class="recessed-tray">
          <div class="tray-label">
            <span class="status-pip" style="background: var(--color-amber); box-shadow: 0 0 6px var(--color-amber);"></span>
            <span>КУДА ВЫ ПОПАЛИ</span>
          </div>
          <div class="tray-text">
            Это тест «От жалобы к запросу». За 26 коротких вопросов он поможет перевести смутное состояние «что-то не так, не понимаю куда идти» в одну ясную задачу, с которой уже можно работать. Без диагнозов и воды.
          </div>
        </div>

        <div class="card-nav">
          <button class="btn-luminous-jade" data-action="hero-start">
            <span>Понятно, хочу попробовать</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    `;
  },

  // ========================================================================
  // Onboarding (3 Calibration Screens)
  // ========================================================================
  renderOnboarding() {
    const step = this.onboardingStep;
    this.updateProgress(step * 33.3, `0${step}/03`);

    let hudSvg = '';
    let title = '';
    let desc = '';
    let trayLabel = '';
    let trayText = '';

    if (step === 1) {
      hudSvg = `
        <svg class="hud-ring-svg" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="46" stroke="rgba(255,255,255,0.1)" stroke-width="1.2"/>
          <circle cx="60" cy="60" r="24" stroke="#facc15" stroke-width="1.8"/>
          <line x1="60" y1="10" x2="60" y2="30" stroke="#fbbf24" stroke-width="1.5"/>
          <line x1="60" y1="90" x2="60" y2="110" stroke="#fbbf24" stroke-width="1.5"/>
          <line x1="10" y1="60" x2="30" y2="60" stroke="#fbbf24" stroke-width="1.5"/>
          <line x1="90" y1="60" x2="110" y2="60" stroke="#fbbf24" stroke-width="1.5"/>
        </svg>
      `;
      title = 'ЗАЧЕМ ЭТИ 26 ВОПРОСОВ';
      desc = 'Тест не оценивает вас и не ставит оценки. Он просто помогает увидеть, где именно застряло движение: в страхе ошибки, чужих ожиданиях или перегрузе.';
      trayLabel = 'РЕЗУЛЬТАТ';
      trayText = 'В конце вы получите понятный срез вашей ситуации и готовую формулировку запроса для работы.';
    } else if (step === 2) {
      hudSvg = `
        <svg class="hud-ring-svg" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
          <path d="M18 60 H34 L42 36 L54 84 L66 28 L76 74 L84 60 H102" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="60" cy="60" r="38" stroke="rgba(245,158,11,0.25)" stroke-width="1" stroke-dasharray="4 6"/>
        </svg>
      `;
      title = 'НЕ ДУМАЙТЕ ДОЛГО';
      desc = 'Тут нет экзамена и правильных ответов. Не пытайтесь логически просчитать варианты или выбрать «как правильно».';
      trayLabel = 'ПРАВИЛО 3 СЕКУНД';
      trayText = 'Кликайте то, на что первым отозвалось внутри за пару секунд. Первый отклик — самый честный.';
    } else if (step === 3) {
      hudSvg = `
        <svg class="hud-ring-svg" viewBox="0 0 120 120" fill="none">
          <rect x="24" y="24" width="30" height="30" rx="8" stroke="#facc15" stroke-width="1.6" fill="rgba(250,204,21,0.1)"/>
          <rect x="66" y="24" width="30" height="30" rx="8" stroke="rgba(255,255,255,0.2)" stroke-width="1.4"/>
          <rect x="24" y="66" width="30" height="30" rx="8" stroke="rgba(255,255,255,0.2)" stroke-width="1.4"/>
          <rect x="66" y="66" width="30" height="30" rx="8" stroke="#fbbf24" stroke-width="1.6" fill="rgba(251,191,36,0.1)"/>
          <path d="M33 39 L37 43 L45 34" stroke="#facc15" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M75 81 L79 85 L87 76" stroke="#fbbf24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      `;
      title = 'МОЖНО ВЫБИРАТЬ НЕСКОЛЬКО';
      desc = 'В жизни редко бывает одна причина. Если в вопросе подходит сразу несколько пунктов, не мучайтесь выбором одного.';
      trayLabel = 'ДО 3 ВАРИАНТОВ';
      trayText = 'Отмечайте от 1 до 3 вариантов, которые цепляют, и жмите «Далее». На прохождение выделено 10 комфортных минут.';
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
          <button class="btn-translucent" data-action="onboarding-prev">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg>
            <span>Назад</span>
          </button>

          <button class="btn-luminous-jade" data-action="onboarding-next">
            <span>${step === 3 ? 'Начать тест' : 'Дальше'}</span>
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
          <div class="dot-badge" style="margin-bottom: 24px; border-color: rgba(251,191,36,0.4); color: var(--color-cyan);">
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
  // Question View (No A/B/C/D Letters, Clean Checkboxes + Timer Banner)
  // ========================================================================
  renderQuestion() {
    const q = this.data.questions[this.currentIndex];
    const total = this.data.questions.length;
    const currentSelected = this.answers[q.number] || [];
    const pct = Math.round(((this.currentIndex) / total) * 100);

    this.updateProgress(pct, `Q${String(this.currentIndex + 1).padStart(2, '0')}/${total}`);

    const optionsHtml = q.options.map(opt => {
      const isSelected = currentSelected.includes(opt.key);
      return `
        <div class="option-chip ${isSelected ? 'selected' : ''}" data-action="toggle-option" data-key="${opt.key}">
          <div class="opt-check">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="opt-text">${opt.text}</div>
        </div>
      `;
    }).join('');

    this.container.innerHTML = `
      <div class="glass-card">
        <div id="timeout-slot"></div>

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
            <span>${this.currentIndex === total - 1 ? 'Показать результат' : 'Далее'}</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        </div>
      </div>
    `;

    if (this.timerExpired) {
      this.renderTimeoutBanner();
    }
  },

  // ========================================================================
  // Result Calculation & Humanized Demo Session Pitch
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
    this.stopTimer();
    if (this.timerEl) this.timerEl.style.display = 'none';
    this.currentScreen = 'result';
    this.updateProgress(100, 'DONE');
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
      `Мой запрос: «${d.request}»\n\n` +
      `Хочу записаться на бесплатную демо-сессию.`
    );

    const tgUrl = `${CONTACTS.telegramDirect}?text=${tgMessage}`;

    this.container.innerHTML = `
      <div class="glass-card">
        <div class="dot-badge" style="margin-bottom: 18px; border-color: rgba(250,204,21,0.4); color: var(--color-neon); align-self: flex-start;">
          <span class="status-pip"></span>
          <span>РАЗБОР ГОТОВ</span>
        </div>

        <h1 class="dot-h1" style="margin-bottom: 20px;">ЧТО ПОКАЗАЛ ТЕСТ</h1>

        <div class="result-focus-card">
          <div class="tray-label" style="color: var(--color-neon); margin-bottom: 4px;">ГЛАВНЫЙ ФОКУС</div>
          <div class="focus-dot-title">${d.title}</div>
          <p class="ui-body" style="color: #e5e7eb; margin-bottom: 0; font-size: 14px;">${d.happening}</p>
        </div>

        <div class="recessed-tray" style="margin-bottom: 20px;">
          <div class="tray-label" style="color: var(--color-amber);">КАК ЭТО УСТРОЕНО</div>
          <div class="chain-monospaced">${d.mechanism}</div>
        </div>

        <div class="request-card">
          <div class="tray-label" style="color: var(--color-cyan);">ВАШ ЗАПРОС</div>
          <div class="request-quote">«${d.request}»</div>
        </div>

        <div style="margin-bottom: 22px;">
          <div class="tray-label" style="color: var(--text-muted); margin-bottom: 10px;">НА ЧТО ОБРАТИТЬ ВНИМАНИЕ</div>
          <ul class="explore-list">${exploreHtml}</ul>
        </div>

        <div class="recessed-tray" style="margin-bottom: 24px;">
          <div class="tray-label" style="color: var(--color-neon);">НА ЧТО МОЖНО ОПЕРЕТЬСЯ</div>
          <div class="tray-text">${d.strength}</div>
        </div>

        <!-- Мягкое приглашение на демо-сессию (живой язык) -->
        <div class="recessed-tray" style="margin-bottom: 14px; border-color: rgba(250, 204, 21, 0.25);">
          <div class="tray-label" style="color: var(--color-neon); margin-bottom: 8px;">БЕСПЛАТНАЯ ДЕМО-СЕССИЯ (25 МИНУТ)</div>
          <div class="tray-text" style="margin-bottom: 18px; font-size: 14px; color: #e5e7eb; line-height: 1.6;">
            Тест хорошо подсвечивает сам узел, но в одиночку бывает трудно понять, с какого края за него тянуть. Если хотите разобрать свой результат вживую, приходите на короткую демо-сессию. Созвонимся на 25 минут, спокойно посмотрим на вашу ситуацию и наметим, что с этим можно сделать. Никаких продаж в лоб и обязательств.
          </div>

          <a href="${tgUrl}" target="_blank" class="btn-luminous-jade" style="width: 100%; text-decoration: none;">
            <span>Записаться на бесплатную демо-сессию</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </a>
        </div>

        <div style="text-align: center; margin-top: 4px;">
          <button data-action="restart" style="background: none; border: none; color: var(--text-dim); font-family: var(--font-ui); font-size: 12.5px; cursor: pointer; padding: 8px;">
            Пройти тест заново
          </button>
        </div>
      </div>
    `;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  APP.init();
});
