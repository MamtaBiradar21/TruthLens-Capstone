/* ═══════════════════════════════════════════════════════════
   TruthLens — Main Application Controller
   Handles UI state, events, and orchestrates analysis modules
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── State ────────────────────────────────────────────────
  const state = {
    currentTab: 'image',
    imageLoaded: false,
    imageAnalyzed: false,
    textAnalyzed: false,
    imageResult: null,
    textResult: null,
    sampleType: null   // when using a predefined sample
  };

  // ── DOM references ────────────────────────────────────────
  const $ = id => document.getElementById(id);
  const $$ = sel => document.querySelectorAll(sel);

  // Tabs
  const tabImage = $('tab-image');
  const tabText  = $('tab-text');
  const panelImage = $('panel-image');
  const panelText  = $('panel-text');

  // Image panel
  const dropZone        = $('dropZone');
  const fileInput       = $('fileInput');
  const imageUrl        = $('imageUrl');
  const loadUrlBtn      = $('loadUrlBtn');
  const sampleGrid      = $('sampleGrid');
  const imageEmptyState = $('imageEmptyState');
  const imagePreviewWrap= $('imagePreviewWrap');
  const imageCanvasContainer = $('imageCanvasContainer');
  const previewImg      = $('previewImg');
  const heatmapCanvas   = $('heatmapCanvas');
  const imgOverlayBadge = $('imgOverlayBadge');
  const imageMeta       = $('imageMeta');
  const analyzeImageBtn = $('analyzeImageBtn');
  const analyzingState  = $('analyzingState');
  const imageResults    = $('imageResults');
  const verdictBanner   = $('verdictBanner');
  const verdictIcon     = $('verdictIcon');
  const verdictLabel    = $('verdictLabel');
  const verdictSub      = $('verdictSub');
  const verdictScore    = $('verdictScore');
  const imageMeterList  = $('imageMeterList');
  const artifactsSection= $('artifactsSection');
  const artifactTags    = $('artifactTags');
  const reAnalyzeBtn    = $('reAnalyzeBtn');
  const heatmapLegend   = $('heatmapLegend');
  const imageCardActions= $('imageCardActions');
  const clearImageBtn   = $('clearImageBtn');

  // Text panel
  const textInput        = $('textInput');
  const wordCount        = $('wordCount');
  const clearTextBtn     = $('clearTextBtn');
  const analyzeTextBtn   = $('analyzeTextBtn');
  const textSampleList   = $('textSampleList');
  const textEmptyState   = $('textEmptyState');
  const textAnalyzing    = $('textAnalyzing');
  const textResultsBody  = $('textResultsBody');
  const gaugeFill        = $('gaugeFill');
  const gaugePct         = $('gaugePct');
  const gaugeVerdict     = $('gaugeVerdict');
  const signalBars       = $('signalBars');
  const highlightedText  = $('highlightedText');
  const reAnalyzeTextBtn = $('reAnalyzeTextBtn');
  const multimodalNote   = $('multimodalNote');
  const fusionScore      = $('fusionScore');

  // ── TAB SWITCHING ─────────────────────────────────────────
  function switchTab(tab) {
    state.currentTab = tab;
    tabImage.classList.toggle('active', tab === 'image');
    tabText.classList.toggle('active', tab === 'text');
    panelImage.classList.toggle('active', tab === 'image');
    panelText.classList.toggle('active', tab === 'text');
  }

  tabImage.addEventListener('click', () => switchTab('image'));
  tabText.addEventListener('click',  () => switchTab('text'));

  // ══════════════════════════════════════════════════════════
  //  IMAGE PANEL
  // ══════════════════════════════════════════════════════════

  // ── Drag and Drop ─────────────────────────────────────────
  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', e => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', e => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      loadImageFile(file);
    } else {
      showToast('Please drop a valid image file', 'error');
    }
  });

  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) loadImageFile(file);
  });

  // ── Load image from file ──────────────────────────────────
  function loadImageFile(file) {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      showToast('File too large. Max 10 MB.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      loadImageSrc(e.target.result, file.name, `${(file.size/1024).toFixed(1)} KB`);
    };
    reader.readAsDataURL(file);
    state.sampleType = null;
    showToast('Image loaded — click Analyze!', 'success');
  }

  // ── Load from URL ─────────────────────────────────────────
  loadUrlBtn.addEventListener('click', () => {
    const url = imageUrl.value.trim();
    if (!url) { showToast('Please enter a URL', 'error'); return; }
    if (!url.startsWith('http')) { showToast('Please enter a valid URL starting with http(s)://', 'error'); return; }
    loadImageSrc(url, 'External image', 'URL');
    state.sampleType = null;
  });

  imageUrl.addEventListener('keydown', e => {
    if (e.key === 'Enter') loadUrlBtn.click();
  });

  // ── Sample buttons ────────────────────────────────────────
  sampleGrid.addEventListener('click', e => {
    const btn = e.target.closest('.sample-btn');
    if (!btn) return;

    const type = btn.dataset.type;
    state.sampleType = type;

    // Highlight active sample btn
    $$('.sample-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Use a placeholder/demo image for samples
    // We'll use colored placeholder images
    const sampleColors = {
      ai: 'https://picsum.photos/seed/ai-face/400/450',
      deepfake: 'https://picsum.photos/seed/deepfake/400/450',
      manipulated: 'https://picsum.photos/seed/landscape-edit/500/350',
      real: 'https://picsum.photos/seed/real-photo/500/400'
    };

    const def = ImageAnalysis.getSampleDefinition(type);
    const url = sampleColors[type];

    loadImageSrc(url, def ? def.label : type, 'Sample image', true);
  });

  // ── Core image loader ─────────────────────────────────────
  function loadImageSrc(src, name, meta, isSample) {
    // Reset to preview state
    resetImageResults();
    state.imageLoaded = false;
    state.imageAnalyzed = false;

    // Show preview container, hide empty state
    imageEmptyState.style.display = 'none';
    imagePreviewWrap.style.display = 'flex';
    imageCardActions.style.display = 'flex';

    previewImg.style.opacity = '0.5';
    imageMeta.textContent = 'Loading…';

    previewImg.onload = () => {
      previewImg.style.opacity = '1';
      state.imageLoaded = true;

      // Sync canvas size to rendered image
      syncCanvasToImage();

      imageMeta.innerHTML = `
        <span><i class="fas fa-ruler" style="color:var(--accent)"></i> ${previewImg.naturalWidth}×${previewImg.naturalHeight}px</span>
        <span><i class="fas fa-file" style="color:var(--accent)"></i> ${name || 'Image'}</span>
        <span><i class="fas fa-database" style="color:var(--accent)"></i> ${meta || ''}</span>
      `;

      showToast(`Image ready — click Analyze Image`, 'info');
    };

    previewImg.onerror = () => {
      showToast('Failed to load image. Check the URL or try another image.', 'error');
      resetToEmptyState();
    };

    previewImg.crossOrigin = 'anonymous';
    previewImg.src = src;

    // Reset overlay
    imgOverlayBadge.style.display = 'none';
    heatmapCanvas.style.opacity = '0';
  }

  function syncCanvasToImage() {
    // Wait for layout to settle then size canvas to the rendered image
    requestAnimationFrame(() => {
      const w = previewImg.offsetWidth || previewImg.naturalWidth || 400;
      const h = previewImg.offsetHeight || previewImg.naturalHeight || 300;
      heatmapCanvas.width  = w;
      heatmapCanvas.height = h;
      heatmapCanvas.style.width  = '100%';
      heatmapCanvas.style.height = '100%';
    });
  }

  // ── Clear image ───────────────────────────────────────────
  clearImageBtn.addEventListener('click', () => {
    resetToEmptyState();
    fileInput.value = '';
    imageUrl.value = '';
    state.sampleType = null;
    $$('.sample-btn').forEach(b => b.classList.remove('active'));
  });

  function resetToEmptyState() {
    imageEmptyState.style.display = '';
    imagePreviewWrap.style.display = 'none';
    imageCardActions.style.display = 'none';
    resetImageResults();
    state.imageLoaded = false;
    state.imageAnalyzed = false;
    heatmapLegend.style.display = 'none';
    previewImg.src = '';
  }

  function resetImageResults() {
    analyzingState.style.display = 'none';
    imageResults.style.display = 'none';
    analyzeImageBtn.style.display = '';
    heatmapCanvas.style.opacity = '0';
    imgOverlayBadge.style.display = 'none';
    // Reset analysis steps
    $$('.step').forEach(s => {
      s.classList.remove('active', 'done');
    });
  }

  // ── ANALYZE IMAGE ─────────────────────────────────────────
  analyzeImageBtn.addEventListener('click', startImageAnalysis);
  reAnalyzeBtn.addEventListener('click', () => {
    resetImageResults();
    imagePreviewWrap.style.display = 'flex';
    setTimeout(startImageAnalysis, 100);
  });

  function startImageAnalysis() {
    if (!state.imageLoaded) {
      showToast('Please load an image first', 'error');
      return;
    }

    // Show analyzing state
    analyzeImageBtn.style.display = 'none';
    analyzingState.style.display = 'flex';
    imageResults.style.display = 'none';

    // Animate steps sequentially
    const steps = $$('.step');
    let stepIdx = 0;

    function activateStep() {
      if (stepIdx > 0) {
        steps[stepIdx - 1].classList.remove('active');
        steps[stepIdx - 1].classList.add('done');
      }
      if (stepIdx < steps.length) {
        steps[stepIdx].classList.add('active');
        stepIdx++;
        setTimeout(activateStep, 450);
      } else {
        // All steps done — compute result
        setTimeout(() => finishImageAnalysis(), 300);
      }
    }

    activateStep();
  }

  function finishImageAnalysis() {
    let result;

    if (state.sampleType) {
      // Use predefined sample result for demo accuracy
      result = ImageAnalysis.getSampleDefinition(state.sampleType);
    } else {
      // Pixel-level analysis on real uploaded image
      try {
        const metrics = ImageAnalysis.analyzeFromPixels(previewImg, heatmapCanvas);
        result = ImageAnalysis.buildResultFromMetrics(metrics);
      } catch (err) {
        console.warn('Pixel analysis failed:', err);
        // Fallback result
        result = {
          fakePct: 45,
          verdictClass: 'suspicious',
          verdictLabel: '⚠️ SUSPICIOUS — Analysis Incomplete',
          verdictSub: 'Could not fully analyze this image. Results may be unreliable.',
          scoreLabel: '45%',
          artifacts: [{ icon: 'fa-triangle-exclamation', text: 'Limited pixel access (CORS restriction)' }],
          meters: [
            { name: 'Confidence Level', value: 40, level: 'med' },
            { name: 'Authenticity Probability', value: 55, level: 'low' }
          ],
          heatmap: { regions: [] }
        };
      }
    }

    state.imageResult = result;
    state.imageAnalyzed = true;

    // Draw heatmap on canvas
    ImageAnalysis.drawHeatmap(heatmapCanvas, previewImg, result.heatmap.regions, result.fakePct);
    setTimeout(() => { heatmapCanvas.style.opacity = '1'; }, 100);

    // Show overlay badge
    imgOverlayBadge.textContent = result.fakePct >= 50 ? '⚠ FAKE' : '✓ REAL';
    imgOverlayBadge.className = 'img-overlay-badge ' + (result.fakePct >= 50 ? 'fake' : 'real');
    imgOverlayBadge.style.display = 'block';

    // Hide steps, show results
    analyzingState.style.display = 'none';
    imageResults.style.display = 'flex';

    // Set verdict banner
    verdictBanner.className = 'verdict-banner ' + result.verdictClass;
    verdictIcon.textContent = result.fakePct >= 60 ? '🚨' : result.fakePct >= 30 ? '⚠️' : '✅';
    verdictLabel.textContent = result.verdictLabel;
    verdictSub.textContent = result.verdictSub;
    verdictScore.textContent = result.scoreLabel;

    // Build meters
    imageMeterList.innerHTML = '';
    result.meters.forEach(m => {
      const item = document.createElement('div');
      item.className = 'meter-item';
      item.innerHTML = `
        <div class="meter-row">
          <span class="meter-name">${m.name}</span>
          <span class="meter-val" style="color:${m.level === 'high' ? 'var(--red)' : m.level === 'med' ? 'var(--yellow)' : 'var(--green)'}">${m.value}%</span>
        </div>
        <div class="meter-track">
          <div class="meter-bar ${m.level}" style="width:0%" data-target="${m.value}"></div>
        </div>`;
      imageMeterList.appendChild(item);
    });

    // Animate meter bars
    setTimeout(() => {
      imageMeterList.querySelectorAll('.meter-bar').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 80);

    // Artifacts
    if (result.artifacts && result.artifacts.length > 0) {
      artifactsSection.style.display = '';
      artifactTags.innerHTML = result.artifacts.map(a =>
        `<span class="artifact-tag"><i class="fas ${a.icon}"></i> ${a.text}</span>`
      ).join('');
    } else {
      artifactsSection.style.display = 'none';
    }

    // Show/hide legend
    heatmapLegend.style.display = result.fakePct >= 30 ? 'flex' : 'none';

    // Toast
    if (result.fakePct >= 60) {
      showToast('🚨 FAKE content detected!', 'error');
    } else if (result.fakePct >= 30) {
      showToast('⚠️ Suspicious content — review results', 'info');
    } else {
      showToast('✅ Image appears authentic', 'success');
    }

    // Check multi-modal
    checkMultiModal();
  }

  // ══════════════════════════════════════════════════════════
  //  TEXT PANEL
  // ══════════════════════════════════════════════════════════

  // Word count
  textInput.addEventListener('input', () => {
    const words = textInput.value.trim().split(/\s+/).filter(w => w.length > 0);
    wordCount.textContent = `${words.length} word${words.length !== 1 ? 's' : ''}`;
  });

  // Clear
  clearTextBtn.addEventListener('click', () => {
    textInput.value = '';
    wordCount.textContent = '0 words';
    resetTextResults();
  });

  function resetTextResults() {
    textEmptyState.style.display = '';
    textAnalyzing.style.display = 'none';
    textResultsBody.style.display = 'none';
    state.textAnalyzed = false;
    state.textResult = null;
  }

  // Sample texts
  textSampleList.addEventListener('click', e => {
    const btn = e.target.closest('.text-sample-btn');
    if (!btn) return;
    const sample = TextAnalysis.getSample(btn.dataset.sample);
    if (sample) {
      textInput.value = sample;
      const wds = sample.trim().split(/\s+/).length;
      wordCount.textContent = `${wds} words`;
      resetTextResults();
      showToast('Sample loaded — click Analyze Text', 'info');
    }
  });

  // Analyze
  analyzeTextBtn.addEventListener('click', startTextAnalysis);
  reAnalyzeTextBtn.addEventListener('click', () => {
    resetTextResults();
    setTimeout(startTextAnalysis, 100);
  });

  // Keyboard shortcut
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (state.currentTab === 'text') startTextAnalysis();
      else if (state.currentTab === 'image') analyzeImageBtn.click();
    }
  });

  function startTextAnalysis() {
    const text = textInput.value.trim();
    if (!text) {
      showToast('Please enter some text first', 'error');
      return;
    }

    textEmptyState.style.display = 'none';
    textResultsBody.style.display = 'none';
    textAnalyzing.style.display = 'flex';

    // Simulate NLP processing delay
    setTimeout(() => {
      const result = TextAnalysis.analyze(text);

      if (result.error) {
        textAnalyzing.style.display = 'none';
        textEmptyState.style.display = '';
        showToast(result.error, 'error');
        return;
      }

      state.textResult = result;
      state.textAnalyzed = true;

      textAnalyzing.style.display = 'none';
      textResultsBody.style.display = 'flex';

      // Animate gauge
      animateGauge(result.fakePct, result.verdictClass, result.verdict);

      // Signal bars
      buildSignalBars(result.signals);

      // Highlighted text
      const html = TextAnalysis.buildHighlightedHTML(text, result.flaggedRegions);
      highlightedText.innerHTML = html;

      // Toast
      if (result.fakePct >= 60) showToast(`🚨 Text flagged as FAKE (${result.fakePct}% fake)`, 'error');
      else if (result.fakePct >= 30) showToast(`⚠️ Text marked SUSPICIOUS (${result.fakePct}%)`, 'info');
      else showToast(`✅ Text appears authentic (${result.fakePct}% fake)`, 'success');

      checkMultiModal();

    }, 1800 + Math.random() * 600);
  }

  function animateGauge(pct, cls, label) {
    // Arc length for the gauge path (semicircle: π * 80 ≈ 251)
    const arcLen = 251;
    const dash = (pct / 100) * arcLen;

    let strokeColor;
    if (pct >= 60) strokeColor = 'var(--red)';
    else if (pct >= 30) strokeColor = 'var(--yellow)';
    else strokeColor = 'var(--green)';

    gaugeFill.style.stroke = strokeColor;
    gaugeFill.style.strokeDasharray = `0 ${arcLen}`;

    gaugeVerdict.className = 'gauge-verdict ' + cls;
    gaugeVerdict.textContent = label;
    gaugePct.textContent = '0%';
    gaugePct.style.fill = strokeColor;

    // Animate
    let current = 0;
    const step = pct / 40;
    const timer = setInterval(() => {
      current = Math.min(current + step, pct);
      const d = (current / 100) * arcLen;
      gaugeFill.style.strokeDasharray = `${d} ${arcLen - d}`;
      gaugePct.textContent = Math.round(current) + '%';
      if (current >= pct) clearInterval(timer);
    }, 30);
  }

  function buildSignalBars(signals) {
    signalBars.innerHTML = '';
    signals.forEach(s => {
      const div = document.createElement('div');
      div.className = 'signal-item';
      const color = s.weight === 'high' ? 'var(--red)' :
                    s.weight === 'med'  ? 'var(--yellow)' : 'var(--green)';
      div.innerHTML = `
        <span class="signal-name">${s.name}</span>
        <div class="signal-track">
          <div class="signal-bar ${s.weight}" style="width:0%" data-target="${s.value}"></div>
        </div>
        <span class="signal-val" style="color:${color}">${s.value}%</span>
      `;
      signalBars.appendChild(div);
    });

    setTimeout(() => {
      signalBars.querySelectorAll('.signal-bar').forEach(bar => {
        bar.style.width = bar.dataset.target + '%';
      });
    }, 60);
  }

  // ── Multi-modal fusion ─────────────────────────────────────
  function checkMultiModal() {
    if (state.imageAnalyzed && state.textAnalyzed && state.imageResult && state.textResult) {
      const combined = Math.round(
        state.imageResult.fakePct * 0.55 + state.textResult.fakePct * 0.45
      );

      let cls = combined >= 60 ? 'fake' : combined >= 30 ? 'suspicious' : 'real';
      let color = combined >= 60 ? 'var(--red)' : combined >= 30 ? 'var(--yellow)' : 'var(--green)';
      let label = combined >= 60 ? 'FAKE' : combined >= 30 ? 'SUSPICIOUS' : 'AUTHENTIC';

      fusionScore.textContent = `${combined}% — ${label}`;
      fusionScore.style.background = combined >= 60 ? 'rgba(239,68,68,0.2)' :
                                      combined >= 30 ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.2)';
      fusionScore.style.color = color;
      fusionScore.style.border = `1px solid ${color}`;
      fusionScore.style.borderRadius = '100px';
      fusionScore.style.padding = '2px 10px';

      multimodalNote.style.display = 'flex';
      showToast(`🧠 Multi-modal fusion: ${combined}% fake probability`, 'info');
    }
  }

  // ══════════════════════════════════════════════════════════
  //  TOAST NOTIFICATIONS
  // ══════════════════════════════════════════════════════════
  const toastContainer = $('toastContainer');

  function showToast(message, type = 'info') {
    const icon = type === 'success' ? 'fa-circle-check' :
                 type === 'error'   ? 'fa-circle-xmark' : 'fa-circle-info';

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${icon}"></i><span>${message}</span>`;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'toast-out 0.3s ease forwards';
      setTimeout(() => toast.remove(), 320);
    }, 3500);
  }

  // ══════════════════════════════════════════════════════════
  //  SCROLL ANIMATIONS
  // ══════════════════════════════════════════════════════════
  function initScrollAnimations() {
    const elements = $$('.step-card, .about-card, .arch-node, .accuracy-table-wrap');
    elements.forEach(el => el.classList.add('fade-in'));

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(el => observer.observe(el));
  }

  // ══════════════════════════════════════════════════════════
  //  INIT
  // ══════════════════════════════════════════════════════════
  function init() {
    initScrollAnimations();

    // Show welcome toast
    setTimeout(() => {
      showToast('TruthLens ready — upload an image or enter text!', 'info');
    }, 800);

    // Keyboard hint
    const analyzeHints = $$('.analyze-btn');
    analyzeHints.forEach(btn => {
      btn.title = 'Analyze (Ctrl+Enter)';
    });
  }

  // Boot
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
