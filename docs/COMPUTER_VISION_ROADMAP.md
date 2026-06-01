# GameIQ — Computer Vision Roadmap

> A realistic, phased plan for adding video intelligence to GameIQ. The current MVP intentionally starts without CV. This document explains why, when to add it, and how to approach each phase.

**Important:** Computer vision does not block coach pilots. The MVP delivers immediate, trustworthy value without CV. Do not build CV before validating the core workflow with real coaches.

---

## Why GameIQ Starts Without Computer Vision

Full automated sports video understanding — identifying specific players, tracking ball possession, detecting tactical patterns from video frames — requires:

- Large labeled training datasets (thousands of hours of annotated sport-specific video)
- GPU infrastructure for model inference (cloud or on-premise)
- Sport-specific model tuning (a soccer model does not understand cricket)
- Integration pipeline (video frames → model → structured events → report)
- Quality validation (the model must be accurate enough that coaches trust the output)

Building this before validating that coaches want the core product would be a classic "build before validate" mistake. The manual tagging approach:

1. Delivers useful, trustworthy reports immediately
2. Creates labeled training data that can train future CV models
3. Costs nothing to run (no GPU inference)
4. Produces more reliable evidence (coaches tag what actually matters, not what the model detects)
5. Allows the product to ship and learn while CV infrastructure is built in parallel

---

## CV Phase 0 — Current State: Human-Tagged Evidence ✅

**Status:** Complete (MVP)

**What exists:**
- Video upload to private Supabase Storage
- HTML5 video player with manual seek
- Manual timestamp entry (label, type, time, importance, players, description, tags)
- 12-event demo with evidence-linked AI reports
- AI guardrails explicitly prohibit claiming to have analyzed video frames

**Limitation:** Tagging is manual. Each tagged event requires ~60–90 seconds of coach time. A 90-minute game with 15 key moments takes ~20 minutes of focused tagging.

**When to leave this phase:** When coach interview data shows that manual tagging is a deal-breaker for > 50% of interested coaches. That's the signal to accelerate CV Phase 1.

---

## CV Phase 1 — Video Utilities

**Goal:** Reduce friction around video without requiring event detection models.  
**Technical difficulty:** Low  
**Timeline:** Can begin alongside v1.1 engineering work

### 1.1 — Duration Extraction

Extract video duration at upload time and store in `video_assets.duration_seconds`.

**Why:** Coaches need to know the total video length when entering timestamps. Currently they must know this from the video file metadata.

**Implementation:**
- Use `ffprobe` (FFmpeg) in a Vercel Edge Function or a lightweight Supabase Edge Function triggered on upload
- Alternative: Use the browser `HTMLVideoElement.duration` property client-side after file selection
- Store result in `video_assets` via server action

**Build vs buy:** Build — simple FFmpeg call or browser API. No ML required.

**Validation:** Confirm duration matches the actual video file. Works for MP4, MOV, WebM.

---

### 1.2 — Thumbnail Generation

Generate a thumbnail image at 10% and 50% of video duration.

**Why:** Thumbnails make the game list and report exportable more visually useful. Currently all videos show as text-only entries.

**Implementation:**
- FFmpeg: `ffmpeg -ss [10%] -vframes 1 -q:v 5 -f image2 thumbnail.jpg`
- Run in a background job (Vercel Cron or Supabase Edge Function)
- Store thumbnail in `video-thumbnails` storage bucket
- Display in game list, game detail, and report header

**Build vs buy:** Build — standard FFmpeg operation. No model required.

---

### 1.3 — Physical Clip Extraction

Extract a 30-second video clip centered on each tagged timestamp and store as a separate file.

**Why:** Share links currently cannot share video (privacy risk of sharing full game film). Short clips around tagged events are safer to share and more useful to players.

**Implementation:**
- `ffmpeg -ss [timestamp - 15s] -t 30 -i [video] clip_[eventId].mp4`
- Run as a background job after the coach generates a report (or on demand)
- Store in a `video-clips` storage bucket with its own RLS policies
- Add optional clip URL to coaching insights in the shared report

**Build vs buy:** Build — standard FFmpeg operation. No model required.

**Privacy note:** Clip sharing requires explicit coach opt-in. Clips of identified players require consent review.

---

### 1.4 — Waveform / Timeline Preview

Generate an audio waveform or visual timeline thumbnail strip to help coaches navigate to key moments faster.

**Why:** Film review currently requires manual scrubbing. A waveform or thumbnail strip (one frame per 30 seconds) gives visual landmarks.

**Implementation:**
- Generate thumbnail strip via FFmpeg: `ffmpeg -i [video] -vf fps=1/30 frame_%03d.jpg`
- Combine into a single strip image
- Display as a timeline below the video player on the timestamp page

**Defer unless:** Coach interview data shows timeline navigation is a major friction point.

---

## CV Phase 2 — Assisted Tagging

**Goal:** Use simple heuristics and traditional signal processing to suggest candidate moments that the coach can confirm or reject. No deep learning required.  
**Technical difficulty:** Medium  
**Timeline:** 3–6 months after Phase 1

### 2.1 — Audio Spike Detection

Detect moments of crowd noise, whistle blows, or commentary excitement using audio amplitude analysis.

**Why:** Crowd noise and whistles are reliable proxies for significant match events in many sports.

**Implementation:**
- Extract audio from video with FFmpeg
- Analyze amplitude peaks with `librosa` (Python) or `wavesurfer.js` (JS)
- Flag moments where amplitude exceeds a rolling mean by a configurable threshold
- Present as "candidate moments" on the tagging page — coach confirms or dismisses

**Accuracy expectation:** 60–70% precision (many false positives — coach confirms). Better than nothing; much faster than pure manual tagging.

**Build vs buy:** Build — no pre-trained model required, just signal processing.

---

### 2.2 — Scene Change Detection

Detect camera cut points using visual frame-to-frame difference.

**Why:** Camera cuts often correspond to replays, tactical pauses, or broadcast-recognized significant moments.

**Implementation:**
- OpenCV: `cv2.absdiff` between consecutive frames, threshold on mean difference
- Flag cut points as candidate timestamps
- Works well for broadcast footage; less reliable for single-camera setups

**Accuracy expectation:** Varies heavily by camera setup. Best for multi-camera broadcast.

**Build vs buy:** Build — standard OpenCV operation, no pre-trained model.

---

### 2.3 — Scoreboard Change Detection (Broadcast Video)

Detect changes in on-screen scoreboards using OCR.

**Why:** Score changes are always significant events worth tagging.

**Implementation:**
- Tesseract OCR on a fixed scoreboard region of the frame
- Detect numeric changes → flag as candidate timestamp
- Works only for broadcast video with visible scoreboard

**Build vs buy:** Build (Tesseract) or buy (Google Vision API OCR — ~$0.001/frame, expensive at scale).

**Defer unless:** Pilot coaches are primarily using broadcast footage.

---

## CV Phase 3 — Sport-Specific Event Detection

**Goal:** Train or fine-tune models to detect sport-specific events from video frames.  
**Technical difficulty:** High  
**Timeline:** 6–18 months, requires labeled training data from Phase 0–2

### 3.1 — Cricket: Ball Delivery Segmentation

Identify the start and end of each delivery (ball from bowler to bat/stumps).

**Why:** Every delivery in cricket is a discrete event worth tagging. Manual delivery-by-delivery tagging is the biggest friction point in cricket film review.

**Implementation:**
- Classify frames as "in-delivery" vs "between deliveries"
- Binary classifier fine-tuned on labeled cricket video
- Training data: manually tagged Phase 0 clips + publicly available cricket broadcast clips

**Model options:**
- Fine-tune ResNet-50 or EfficientNet-B0 on frame classification
- Or use a two-stage detector (detect stumps → track ball in ROI)

**Data requirement:** ~500 labeled delivery segments minimum for a useful classifier.

**Build vs buy:** Build own classifier — sport specificity makes off-the-shelf models poor fits.

---

### 3.2 — Soccer: Shot and Chance Detection

Identify frames containing a shot on goal, a clear chance, or a dangerous attack.

**Why:** Shots and chances are the highest-information events in soccer analysis.

**Implementation:**
- Multi-class classifier: shot / save / goal / corner / other
- Fine-tune on broadcast soccer footage (publicly available via StatsBomb Open Data + video pairs)

**Data requirement:** ~1,000 labeled clips. StatsBomb and Wyscout provide labeled event data for some competitions.

**Build vs buy:** Consider Hudl's Sportvu or Stats Perform's Opta if budget exists for enterprise data licensing. Otherwise build.

---

### 3.3 — Set Piece Detection (Soccer)

Detect corners, free kicks, throw-ins, and penalties.

**Why:** Set pieces are defined, repeatable events with high tactical significance.

**Implementation:**
- Audio cue (whistle) + visual cue (player clusters near corner flag or arc)
- Rule-based pipeline feeding into a classifier

---

## CV Phase 4 — Player and Ball Tracking

**Goal:** Track individual players and the ball across frames to generate movement metrics.  
**Technical difficulty:** Very High  
**Timeline:** 18–36 months

### 4.1 — Player Detection and Jersey Identification

Detect all players on the pitch. Assign jersey numbers using OCR on detected bounding boxes.

**Implementation:**
- YOLO v8 or RT-DETR for player detection (open weights available)
- OCR (PaddleOCR) on jersey crop for number identification
- Associate detections across frames using SORT or ByteTrack

**Challenge:** Jersey numbers are often occluded. Single-camera setups provide limited angles. Performance degrades at full-pitch distances (players appear very small).

**Build vs buy:** Consider Tracab (ChyronHego) or Second Spectrum for professional teams. Build for amateur/semi-pro market using open-source models.

---

### 4.2 — Ball Tracking

Track ball position across frames.

**Challenge:** Ball is small, fast, and frequently occluded. State-of-the-art models still struggle with amateur video quality and single-camera setups.

**Defer until:** High-quality multi-camera setups are available in the target market.

---

### 4.3 — Formation and Shape Analysis

Compute team shape, defensive line height, pressing triggers, and formation from player positions.

**Implementation:**
- Homography: map image coordinates to pitch coordinates (requires pitch line detection)
- Compute centroid, convex hull, and inter-player distances
- Classify formations from player positions at key moments

**Data requirement:** Pitch homography calibration per camera setup.

---

## CV Phase 5 — Advanced Intelligence

**Goal:** Move from event detection to higher-order tactical intelligence.  
**Timeline:** 36+ months

### 5.1 — Tactical Pattern Recognition

Identify recurring patterns (e.g., team consistently presses high on goal kicks, striker drops into midfield in transition).

**Implementation:**
- Temporal sequence analysis over a full match
- Unsupervised clustering of similar possession sequences
- Feed into the AI report pipeline as structured tactical evidence

---

### 5.2 — Player Development Profiles

Track individual player movement, decisions, and performance metrics across multiple games.

**Implementation:**
- Per-player position heatmaps
- Sprint count and distance (if GPS data is unavailable, estimate from tracking)
- Decision quality scores (shot selection, pass accuracy by zone)

---

### 5.3 — Automated Highlight Generation

Select and stitch the highest-impact moments from a game into a shareable highlight reel.

**Implementation:**
- Rank Phase 3 detected events by importance score
- Extract clips (Phase 1.3)
- Sequence and add title cards
- Export as MP4

---

## CV Investment Decision Framework

Before investing in any CV phase, check:

1. **Have 20+ coaches validated the core workflow?** If not, do not build CV.
2. **Is manual tagging the #1 friction point in coach feedback?** If yes, accelerate Phase 1–2.
3. **Do coaches have broadcast-quality video?** If not, CV accuracy will disappoint.
4. **Is there a labeled dataset available for the target sport?** If not, budget 3–6 months of annotation.
5. **Does the target price point support GPU inference costs?** Estimate $0.05–0.50 per game for inference at Phase 3–4 sophistication.

---

## Summary

| Phase | What it does | Difficulty | Timeline |
|-------|-------------|------------|---------|
| 0 | Manual tagging (current) | Done | ✅ |
| 1 | Video utilities (duration, thumbnails, clips) | Low | v1.1 |
| 2 | Assisted tagging (audio, scene change, OCR) | Medium | 3–6 months |
| 3 | Sport-specific event detection (delivery, shot, set piece) | High | 6–18 months |
| 4 | Player/ball tracking, formation | Very High | 18–36 months |
| 5 | Tactical patterns, development profiles, highlights | Research | 36+ months |

*CV does not block pilots. Phase 1 video utilities add value with zero ML infrastructure.*

---

*Last updated: June 2026*
