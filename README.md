# TruthLens — Multi-Modal Fake Content Detection System

> **Final Year Project | Department of Computer Science & Engineering | 2024–2025**

---

## 🎯 Project Overview

TruthLens is a web-based **Multi-Modal Fake Content Detection System** that analyzes both images and text to identify:

- **AI-generated images** (GAN / Diffusion model outputs)
- **Deepfake images** (face-swapped or synthetically altered faces)
- **Digitally manipulated photos** (clone-stamp, Photoshop compositing)
- **Fake text content** (conspiracy theories, health misinformation, clickbait, partisan propaganda)

The system produces **explainable verdicts** with percentage scores, signal breakdowns, and visual heatmap overlays.

---

## ✅ Completed Features

### Image Analysis Engine
- Drag-and-drop image upload (JPG, PNG, WEBP, up to 10 MB)
- Image URL loading
- Predefined sample test images (AI-generated, Deepfake, Manipulated, Authentic)
- 6-stage animated analysis pipeline simulation
- **Grad-CAM style canvas heatmap** highlighting suspicious image regions
- Verdict banner (Fake / Suspicious / Authentic) with confidence score
- 6 signal meters with animated bars
- Artifact tag list (GAN fingerprint, texture anomaly, boundary blend, etc.)
- Overlay badge (FAKE/REAL) on analyzed image
- Re-analyze capability

### Text Analysis Engine
- Free-form text paste and analyze
- **Fakeness percentage (0–100%)** with animated SVG gauge
- 3-tier verdict: FAKE CONTENT / SUSPICIOUS / LIKELY REAL
- 6 NLP signal bars (conspiracy language, sensationalism, health misinformation, etc.)
- **Color-coded word highlighting** (red = high-risk, yellow = suspicious, blue = mild)
- 5 preloaded sample texts (2 fake, 1 suspicious, 2 real)
- Keyboard shortcut: `Ctrl+Enter` to analyze

### Multi-Modal Fusion
- When both image AND text are analyzed, a combined fusion score is computed
- Weighted ensemble: 55% image + 45% text
- Fusion score displayed with color-coded verdict

### UI/UX
- Fully responsive dark theme
- Animated hero with floating orbs and grid background
- Tab-based switcher between Image and Text modes
- Toast notification system
- Scroll-triggered fade-in animations
- Architecture diagram with animated fusion node
- Model accuracy comparison table
- About section with dataset/tech stack info

---

## 🚀 How to Run

This is a **pure static website** — no backend or server required.

```bash
# Option 1: Open directly in browser
open index.html

# Option 2: Local server (recommended)
python3 -m http.server 8080
# then visit http://localhost:8080

# Option 3: VS Code Live Server extension
# Right-click index.html → Open with Live Server
```

---

## 📁 File Structure

```
TruthLens/
├── index.html              # Main application page
├── css/
│   └── style.css           # Complete design system (dark theme)
├── js/
│   ├── textAnalysis.js     # NLP fake text detection engine
│   ├── imageAnalysis.js    # Image analysis + canvas heatmap engine
│   └── app.js              # Main controller (UI, events, state)
└── README.md               # This file
```

---

## 🧠 Technical Architecture

### Text Detection Pipeline
1. **Tokenization** — split input into word tokens
2. **Lexicon Matching** — 6 category lexicons (conspiracy, sensational, clickbait, health-misinfo, partisan, unverified)
3. **Statistical Features** — ALL-CAPS ratio, punctuation abuse, exclamation density
4. **Credibility Scoring** — academic/journalistic markers as negative indicators
5. **Score Fusion** — weighted combination → 0–100% fake probability
6. **Explainability** — token-level highlighting with class attribution

### Image Detection Pipeline
1. **File Load** — FileReader API for local files, CORS-enabled fetch for URLs
2. **Canvas Rendering** — image drawn to offscreen canvas for pixel access
3. **Pixel Metrics** — texture uniformity, channel variance, edge density, histogram analysis
4. **GAN Detection** — frequency-domain artifact detection heuristics
5. **Score Computation** — weighted anomaly scoring → 0–100% fake probability
6. **Heatmap Generation** — radial gradient overlays on suspicious image regions with annotation ellipses

### Multi-Modal Fusion
- Weighted ensemble: `score = 0.55 × image_score + 0.45 × text_score`
- Threshold: ≥60% → FAKE, ≥30% → SUSPICIOUS, <30% → REAL

---

## 📊 Model Performance (Referenced from Literature)

| Modality | Accuracy | F1 Score |
|----------|----------|----------|
| Text-only (BERT) | 78.4% | 78.3% |
| Image-only (ViT) | 85.2% | 85.1% |
| **Multi-Modal Fusion** | **96.1%** | **96.1%** |

> Source: Nakamura et al. (2020), Fakeddit Benchmark; prithivMLmods ViT deepfake model (HuggingFace)

---

## 🗄️ Datasets Referenced

| Dataset | Type | Source |
|---------|------|--------|
| Fakeddit | Multimodal (text + image) | github.com/entitize/Fakeddit |
| CIFAKE | AI vs Real images | Kaggle / dima806 HuggingFace |
| FaceForensics++ | Deepfake faces | Technical University Munich |
| LIAR Dataset | Fake news text | William Wang, UCSB |

---

## 🔧 Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| Styling | Custom CSS Design System (dark theme) |
| Fonts | Google Fonts (Inter, Space Grotesk) |
| Icons | Font Awesome 6 |
| Canvas API | HTML5 Canvas (heatmap rendering) |
| File API | FileReader API (local image upload) |
| Data | No backend — all client-side |

---

## 🔑 Key Entry Points

| URL | Description |
|-----|-------------|
| `index.html` | Main application |
| `index.html#detector` | Jump to detection tool |
| `index.html#how-it-works` | Methodology section |
| `index.html#architecture` | System architecture |
| `index.html#about` | Project information |

---

## 🚧 Features Not Yet Implemented

- [ ] Video frame extraction and analysis
- [ ] Real-time backend ML inference (FastAPI + HuggingFace models)
- [ ] Grad-CAM computed from actual model gradients
- [ ] LIME token attribution from real BERT model
- [ ] User analysis history and report export
- [ ] API endpoint integration with Hugging Face Inference API
- [ ] Social media URL scraping and analysis
- [ ] Admin dashboard with analytics

---

## 📈 Recommended Next Steps

1. **Backend Integration**: Deploy FastAPI backend with actual ViT + BERT models
2. **HuggingFace API**: Connect to `prithivMLmods/Deep-Fake-Detector-v2-Model` via Inference API
3. **Video Analysis**: Extract frames at 1 FPS and run per-frame detection
4. **Real Grad-CAM**: Use actual model attention weights for heatmap
5. **PDF Reports**: Generate downloadable analysis report using jsPDF
6. **History**: Use localStorage or a REST API to save analysis history

---

## 📚 References

1. Nakamura, K., Levy, S., & Wang, W. Y. (2020). r/Fakeddit: A New Multimodal Benchmark Dataset for Fine-grained Fake News Detection. *LREC 2020*.
2. Rossler, A. et al. (2019). FaceForensics++: Learning to Detect Manipulated Facial Images. *ICCV 2019*.
3. prithivMLmods. (2025). Deep-Fake-Detector-v2-Model. *Hugging Face*. https://huggingface.co/prithivMLmods/Deep-Fake-Detector-v2-Model
4. dima806. (2023). ai_vs_real_image_detection. *Hugging Face*. https://huggingface.co/dima806/ai_vs_real_image_detection
5. Microsoft. (2024). Azure AI Face Service — Transparency Note. *Microsoft Learn*.

---

*TruthLens — Multi-Modal Fake Content Detection System | Final Year Project 2025*
