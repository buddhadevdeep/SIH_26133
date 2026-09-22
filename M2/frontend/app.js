// AarogyaMitra Frontend Application Logic

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initChat();
  initVoiceRecording();
  initSymptomChecker();
  initMedicineExplorer();
  initHospitalExplorer();
  initEHRViewer();
});

// ================= TAB NAVIGATION =================
function initTabs() {
  const tabs = document.querySelectorAll(".nav-btn");
  const panes = document.querySelectorAll(".tab-pane");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      panes.forEach(p => p.classList.remove("active"));

      tab.classList.add("active");
      const targetId = tab.getAttribute("data-tab");
      const targetPane = document.getElementById(targetId);
      if (targetPane) {
        targetPane.classList.add("active");
      }

      // Lazy load tab data
      if (targetId === "inventory-tab") loadMedicineStock();
      if (targetId === "hospital-tab") loadHospitals();
      if (targetId === "ehr-tab") loadPatientEHR("PAT-1001");
    });
  });
}

// ================= AI CHAT COMPONENT (WITH MULTI-TURN MEMORY) =================
let currentSessionId = sessionStorage.getItem("aarogya_session_id") || ("sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8));
sessionStorage.setItem("aarogya_session_id", currentSessionId);

let conversationHistory = [];
try {
  const saved = sessionStorage.getItem("aarogya_conversation_history");
  if (saved) conversationHistory = JSON.parse(saved);
} catch (e) {
  conversationHistory = [];
}

function initChat() {
  const form = document.getElementById("chatForm");
  const input = document.getElementById("queryInput");
  const feed = document.getElementById("chatFeed");
  const sendBtn = document.getElementById("sendBtn");
  const patientSelect = document.getElementById("userPatientId");
  const chips = document.querySelectorAll(".chip:not(#resetChatBtn)");
  const resetBtn = document.getElementById("resetChatBtn");

  // Prompt chips (excluding reset button)
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      const q = chip.getAttribute("data-query");
      if (!q) return;
      input.value = q;
      form.dispatchEvent(new Event("submit"));
    });
  });

  // Reset conversation button
  if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
      try {
        await fetch(`/api/chat/reset?session_id=${encodeURIComponent(currentSessionId)}`, { method: "POST" });
      } catch (e) {
        console.warn("Reset call failed:", e);
      }
      conversationHistory = [];
      sessionStorage.removeItem("aarogya_conversation_history");
      currentSessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
      sessionStorage.setItem("aarogya_session_id", currentSessionId);

      // Reset feed to initial welcome message
      feed.innerHTML = `
        <div class="message-card bot-msg">
          <div class="msg-header">
            <div class="bot-avatar">AI</div>
            <div class="msg-meta">
              <span class="author">AarogyaMitra Assistant</span>
              <span class="time">Just now</span>
            </div>
          </div>
          <div class="msg-body">
            <p><strong>નવી કન્સલ્ટેશન શરૂ થઈ (New Consultation Started).</strong></p>
            <p>પહેલાની વાતચીત મેમરી સાફ કરી દેવામાં આવી છે. તમે નવો પ્રશ્ન કે લક્ષણો પૂછી શકો છો.</p>
          </div>
        </div>
      `;
      scrollToBottom(feed);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = input.value.trim();
    if (!query) return;

    const patientId = patientSelect.value;
    input.value = "";
    sendBtn.disabled = true;

    // Append user message
    appendMessage(query, "user", { author: "You" });

    // Temporary loading placeholder
    const loadingId = "loading-" + Date.now();
    appendLoadingPlaceholder(loadingId);
    scrollToBottom(feed);

    // Prepare payload with multi-turn history
    const payloadHistory = conversationHistory.slice(-6);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: query,
          userId: patientId || null,
          sessionId: currentSessionId,
          history: payloadHistory
        })
      });

      const data = await resp.json();
      removeLoadingPlaceholder(loadingId);

      if (!resp.ok) {
        throw new Error(data.detail || "Failed to process query.");
      }

      // Record turns in conversation history
      conversationHistory.push({ role: "user", content: query });
      conversationHistory.push({ role: "assistant", content: data.answer });
      if (conversationHistory.length > 20) {
        conversationHistory = conversationHistory.slice(-20);
      }
      try {
        sessionStorage.setItem("aarogya_conversation_history", JSON.stringify(conversationHistory));
      } catch (e) {
        console.warn("Failed to cache history in sessionStorage:", e);
      }

      appendMessage(data.answer, "bot", {
        author: "AarogyaMitra Assistant",
        intent: data.intent,
        isEmergency: data.is_emergency,
        sources: data.sources || [],
        latencyMs: data.latency_ms
      });

    } catch (err) {
      removeLoadingPlaceholder(loadingId);
      appendMessage(`⚠️ Error: ${err.message}`, "bot", { author: "System Error" });
    } finally {
      sendBtn.disabled = false;
      scrollToBottom(feed);
    }
  });
}

function appendMessage(text, sender, meta = {}) {
  const feed = document.getElementById("chatFeed");
  const card = document.createElement("div");
  card.className = `message-card ${sender}-msg`;

  if (meta.isEmergency) {
    card.classList.add("emergency-alert");
  }

  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  let voiceBtnHtml = "";
  if (sender === "bot") {
    voiceBtnHtml = `
      <button class="voice-play-btn" title="Listen in Gujarati Voice (Sarvam Bulbul TTS)">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>
        <span>🔊 Read Aloud (ગુજરાતી અવાજ)</span>
      </button>
    `;
  }

  let headerHtml = `
    <div class="msg-header">
      <div class="bot-avatar">${sender === "user" ? "YOU" : "AI"}</div>
      <div class="msg-meta">
        <span class="author">${meta.author || (sender === "user" ? "You" : "Assistant")}</span>
        <span class="time">${timeStr}</span>
      </div>
      ${voiceBtnHtml}
    </div>
  `;

  // Render markdown if available
  let parsedContent = text;
  if (window.marked && sender === "bot") {
    parsedContent = marked.parse(text);
  } else {
    parsedContent = `<p>${escapeHtml(text)}</p>`;
  }

  let disclaimerHtml = "";
  if (sender === "bot") {
    disclaimerHtml = `
      <div class="msg-disclaimer-tag">
        <span class="disc-icon">⚠️</span>
        <span><strong>AI Notice:</strong> I am an AI chatbot. AI analysis is not 100% perfect. For accurate diagnosis & medical care, please consult a qualified doctor. (સચોટ નિદાન માટે ડૉક્ટરનો સંપર્ક કરો).</span>
      </div>
    `;
  }

  let footerHtml = "";
  if (sender === "bot" && (meta.sources || meta.latencyMs || meta.intent)) {
    const sourcesTags = (meta.sources || []).map(s => `<span class="source-tag">${s}</span>`).join(" ");
    footerHtml = `
      <div class="msg-footer">
        <div class="sources-tags">${sourcesTags}</div>
        <div>
          ${meta.intent ? `Intent: <strong>${meta.intent}</strong> • ` : ""}
          ${meta.latencyMs ? `⚡ ${meta.latencyMs}ms` : ""}
        </div>
      </div>
    `;
  }

  card.innerHTML = `
    ${headerHtml}
    <div class="msg-body">
      ${parsedContent}
      ${disclaimerHtml}
    </div>
    ${footerHtml}
  `;

  feed.appendChild(card);

  // Voice player binding & optional auto-play
  if (sender === "bot") {
    const vBtn = card.querySelector(".voice-play-btn");
    if (vBtn) {
      vBtn.addEventListener("click", () => {
        playGujaratiVoice(text, vBtn);
      });
      const autoToggle = document.getElementById("autoVoiceToggle");
      if (autoToggle && autoToggle.checked) {
        playGujaratiVoice(text, vBtn);
      }
    }
  }
}

function appendLoadingPlaceholder(id) {
  const feed = document.getElementById("chatFeed");
  const card = document.createElement("div");
  card.id = id;
  card.className = "message-card bot-msg";
  card.innerHTML = `
    <div class="msg-header">
      <div class="bot-avatar">AI</div>
      <div class="msg-meta"><span class="author">AarogyaMitra Assistant</span></div>
    </div>
    <div class="msg-body">
      <p><em>Thinking and retrieving database records...</em></p>
    </div>
  `;
  feed.appendChild(card);
}

function removeLoadingPlaceholder(id) {
  const el = document.getElementById(id);
  if (el) el.remove();
}

function scrollToBottom(container) {
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(string) {
  return String(string).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ================= SYMPTOM CHECKER (ML) =================
let selectedSymptoms = [];

function initSymptomChecker() {
  const input = document.getElementById("symptomInput");
  const tagsBox = document.getElementById("selectedSymptoms");
  const predictBtn = document.getElementById("runPredictBtn");
  const clearBtn = document.getElementById("clearSymptomsBtn");
  const quickBtns = document.querySelectorAll(".add-sym-btn");

  quickBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const sym = btn.getAttribute("data-sym");
      addSymptom(sym);
    });
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const val = input.value.trim().toLowerCase();
      if (val) {
        addSymptom(val);
        input.value = "";
      }
    }
  });

  clearBtn.addEventListener("click", () => {
    selectedSymptoms = [];
    renderSymptomTags();
    document.getElementById("mlResultsContainer").style.display = "none";
  });

  predictBtn.addEventListener("click", async () => {
    if (selectedSymptoms.length === 0) {
      alert("Please select or type at least one symptom.");
      return;
    }

    predictBtn.disabled = true;
    predictBtn.innerText = "Analyzing...";

    try {
      const resp = await fetch("/api/predict-disease", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: selectedSymptoms,
          top_k: 5
        })
      });
      const data = await resp.json();
      renderMLResults(data);
    } catch (err) {
      alert("Prediction error: " + err.message);
    } finally {
      predictBtn.disabled = false;
      predictBtn.innerText = "Calculate Differential Diagnosis";
    }
  });
}

function addSymptom(sym) {
  const clean = sym.toLowerCase().trim();
  if (clean && !selectedSymptoms.includes(clean)) {
    selectedSymptoms.push(clean);
    renderSymptomTags();
  }
}

function removeSymptom(sym) {
  selectedSymptoms = selectedSymptoms.filter(s => s !== sym);
  renderSymptomTags();
}

function renderSymptomTags() {
  const container = document.getElementById("selectedSymptoms");
  container.innerHTML = selectedSymptoms.map(s => `
    <span class="symptom-tag">
      ${s}
      <span class="remove-btn" onclick="removeSymptom('${s}')">&times;</span>
    </span>
  `).join("");
}

function renderMLResults(data) {
  const container = document.getElementById("mlResultsContainer");
  const list = document.getElementById("mlPredictionList");
  const badge = document.getElementById("mlUrgencyBadge");

  badge.className = `urgency-badge ${data.overall_urgency.toLowerCase()}`;
  badge.innerText = data.overall_urgency;

  list.innerHTML = data.top_predictions.map(pred => {
    const pct = pred.confidence_percent;
    const matched = pred.matched_symptoms.length > 0 ? pred.matched_symptoms.join(", ") : "General overlap";
    const precautions = (pred.precautions || []).join(" ");

    return `
      <div class="prediction-item">
        <div class="pred-top-row">
          <span class="pred-disease">${pred.disease}</span>
          <span class="pred-conf">${pct}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}"></div>
        </div>
        <div class="pred-details">
          <span>Urgency: <strong>${pred.urgency_level}</strong></span>
          <span>•</span>
          <span>Matched Symptoms: <strong>${matched}</strong></span>
        </div>
        ${precautions ? `<p style="font-size: 0.8rem; color: #cbd5e1; margin-top: 0.4rem;">💡 ${precautions}</p>` : ""}
      </div>
    `;
  }).join("");

  container.style.display = "flex";
}

// ================= MEDICINE EXPLORER =================
function initMedicineExplorer() {
  const btn = document.getElementById("searchMedBtn");
  const input = document.getElementById("medSearchInput");

  btn.addEventListener("click", () => {
    loadMedicineStock(input.value.trim());
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      loadMedicineStock(input.value.trim());
    }
  });
}

async function loadMedicineStock(query = "Paracetamol") {
  const grid = document.getElementById("medicineGrid");
  grid.innerHTML = '<div class="loading-spinner">Searching inventory records...</div>';

  try {
    const resp = await fetch(`/api/medicines/search?query=${encodeURIComponent(query || "Paracetamol")}`);
    const data = await resp.json();

    if (!data.results || data.results.length === 0) {
      grid.innerHTML = `<div class="info-card"><p>No stock records found for '${query}' in our database.</p></div>`;
      return;
    }

    grid.innerHTML = data.results.map(item => {
      const statusClass = (item.availability_status || "AVAILABLE").toLowerCase();
      return `
        <div class="info-card">
          <div class="card-title">
            <span>${item.medicine_name || item.name}</span>
            <span class="stock-tag ${statusClass}">${item.availability_status || "In Stock"}</span>
          </div>
          <div class="card-field">Facility: <strong>${item.hospital_name || "Central Medical Depot"}</strong></div>
          <div class="card-field">Quantity: <strong>${item.quantity !== undefined ? item.quantity + " units" : "Available"}</strong></div>
          <div class="card-field">District: <strong>${item.district || "Rajkot"}</strong></div>
          ${item.phone ? `<div class="card-field">Phone: <strong>${item.phone}</strong></div>` : ""}
          <div class="card-field" style="font-size: 0.76rem; color: #94a3b8; margin-top: 0.3rem;">
            ${item.description || item.generic_name || ""}
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    grid.innerHTML = `<div class="info-card"><p>Failed to load medicines: ${err.message}</p></div>`;
  }
}

// ================= HOSPITALS & SERVICES EXPLORER =================
function initHospitalExplorer() {
  const btn = document.getElementById("searchHospitalBtn");
  const input = document.getElementById("hospitalSearchInput");

  btn.addEventListener("click", () => {
    loadHospitals(input.value.trim());
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      loadHospitals(input.value.trim());
    }
  });
}

async function loadHospitals(query = "") {
  const grid = document.getElementById("hospitalGrid");
  grid.innerHTML = '<div class="loading-spinner">Loading network hospitals...</div>';

  try {
    const [hospResp, servResp] = await Promise.all([
      fetch(`/api/hospitals/search?query=${encodeURIComponent(query)}&limit=10`),
      fetch(`/api/hospitals/services`)
    ]);

    const hospData = await hospResp.json();
    const servData = await servResp.json();

    if (!hospData.hospitals || hospData.hospitals.length === 0) {
      grid.innerHTML = `<div class="info-card"><p>No hospitals found matching '${query}'.</p></div>`;
      return;
    }

    grid.innerHTML = hospData.hospitals.map(h => {
      const matchingServices = (servData.services || []).filter(s => s.hospital_name === h.name);
      const servicesList = matchingServices.map(s => `
        <span style="background: rgba(255,255,255,0.06); padding: 2px 6px; border-radius: 4px; font-size: 0.72rem;">
          ${s.service_name} ${s.estimated_cost_inr !== null ? `(₹${s.estimated_cost_inr})` : ''}
        </span>
      `).join(" ");

      return `
        <div class="info-card">
          <div class="card-title">
            <span>${h.name}</span>
            <span class="badge ${h.emergencyAvailable ? 'badge-pulse' : ''}" style="font-size: 0.7rem;">
              ${h.type}
            </span>
          </div>
          <div class="card-field">Address: <strong>${h.address || h.district}</strong></div>
          <div class="card-field">District: <strong>${h.district}, ${h.state}</strong></div>
          <div class="card-field">Hours: <strong>${h.openingTime || '08:00 AM'} - ${h.closingTime || '08:00 PM'}</strong></div>
          <div class="card-field">Emergency 24/7: <strong>${h.emergencyAvailable ? '✅ Yes' : '❌ No'}</strong></div>
          <div class="card-field">Phone: <strong>${h.phone || '+91 281 2444101'}</strong></div>
          ${servicesList ? `
            <div style="margin-top: 0.4rem;">
              <div style="font-size: 0.72rem; color: #94a3b8; margin-bottom: 0.2rem;">Available Services:</div>
              <div style="display: flex; flex-wrap: wrap; gap: 0.3rem;">${servicesList}</div>
            </div>
          ` : ''}
        </div>
      `;
    }).join("");
  } catch (err) {
    grid.innerHTML = `<div class="info-card"><p>Failed to load hospitals: ${err.message}</p></div>`;
  }
}

// ================= PATIENT EHR VIEWER =================
function initEHRViewer() {
  const pills = document.querySelectorAll(".patient-pill");
  pills.forEach(pill => {
    pill.addEventListener("click", () => {
      pills.forEach(p => p.classList.remove("active"));
      pill.classList.add("active");
      const pid = pill.getAttribute("data-pid");
      loadPatientEHR(pid);
    });
  });
}

async function loadPatientEHR(patientId) {
  const container = document.getElementById("patientDetails");
  container.innerHTML = '<div class="loading-spinner">Fetching secure patient EHR record...</div>';

  try {
    const resp = await fetch(`/api/patient/history/${patientId}`);
    if (!resp.ok) throw new Error("Record not found.");
    const data = await resp.json();

    const p = data.demographics;
    const h = data.history || {};

    const allergiesHtml = (h.allergies && h.allergies.length > 0)
      ? h.allergies.map(a => `<span class="allergy-badge">⚠️ ${a}</span>`).join(" ")
      : "<span style='color:#94a3b8; font-size:0.8rem;'>No known drug allergies</span>";

    const conditionsHtml = (h.chronicConditions && h.chronicConditions.length > 0)
      ? h.chronicConditions.map(c => `<span class="condition-badge">🩺 ${c}</span>`).join(" ")
      : "<span style='color:#94a3b8; font-size:0.8rem;'>No chronic conditions</span>";

    let maternalHtml = "";
    if (h.maternalStatus && h.maternalStatus.isPregnant) {
      maternalHtml = `
        <div class="ehr-stat">
          <span class="ehr-stat-label">Maternal Status</span>
          <span class="ehr-stat-val" style="color: #f472b6;">Pregnant (Trimester ${h.maternalStatus.trimester || '2'})</span>
          <span style="font-size: 0.75rem; color: #fbcfe8;">High-Risk Flags: ${(h.maternalStatus.highRiskFlags || []).join(', ') || 'None'}</span>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="ehr-profile-card">
        <div class="ehr-stat">
          <span class="ehr-stat-label">Full Name</span>
          <span class="ehr-stat-val">${p.fullName}</span>
          <span style="font-size: 0.75rem; color: #94a3b8;">${p.gender}, ${p.age} years</span>
        </div>
        <div class="ehr-stat">
          <span class="ehr-stat-label">ABHA Health Card ID</span>
          <span class="ehr-stat-val" style="font-family: monospace; color: #38bdf8;">${p.healthCardNumber || 'ABHA-XXXX-XXXX'}</span>
          <span style="font-size: 0.75rem; color: #94a3b8;">Blood Group: <strong>${p.bloodGroup || 'Unknown'}</strong></span>
        </div>
        <div class="ehr-stat">
          <span class="ehr-stat-label">Location / Sub-District</span>
          <span class="ehr-stat-val">${p.village}, ${p.district}</span>
          <span style="font-size: 0.75rem; color: #94a3b8;">ASHA: <strong>${p.assignedAshaWorker || 'Assigned'}</strong></span>
        </div>
        ${maternalHtml}
      </div>

      <div class="ehr-profile-card" style="grid-template-columns: 1fr 1fr;">
        <div class="ehr-stat">
          <span class="ehr-stat-label">Chronic Conditions</span>
          <div class="ehr-badge-list">${conditionsHtml}</div>
        </div>
        <div class="ehr-stat">
          <span class="ehr-stat-label">Verified Drug Allergies</span>
          <div class="ehr-badge-list">${allergiesHtml}</div>
        </div>
      </div>
    `;
  } catch (err) {
    container.innerHTML = `<div class="info-card"><p>Failed to load patient record: ${err.message}</p></div>`;
  }
}

// ================= SARVAM AI VOICE COMPONENT (STT & TTS) =================
let mediaRecorder = null;
let audioChunks = [];
let recordingInterval = null;
let recordingSeconds = 0;
let currentAudio = null;

function initVoiceRecording() {
  const micBtn = document.getElementById("micBtn");
  const banner = document.getElementById("voiceStatusBanner");
  const cancelBtn = document.getElementById("cancelRecBtn");
  const recText = document.getElementById("recordingText");
  const recTimer = document.getElementById("recordingTimer");
  const input = document.getElementById("queryInput");
  const langSelect = document.getElementById("voiceLangSelect");

  if (!micBtn) return;

  micBtn.addEventListener("click", async () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      stopRecordingAndProcess();
    } else {
      startRecording();
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      cancelRecording();
    });
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunks = [];
      const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/wav";
      mediaRecorder = new MediaRecorder(stream, { mimeType });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.start(100);
      micBtn.classList.add("recording");
      const micText = micBtn.querySelector("span");
      if (micText) micText.textContent = "Stop Rec";
      banner.style.display = "flex";

      const selectedLang = langSelect ? langSelect.value : "gu-IN";
      const langName = selectedLang === "gu-IN" ? "Gujarati" : (selectedLang === "hi-IN" ? "Hindi" : "English");
      recText.textContent = `Listening in ${langName} (Sarvam Saaras ASR)... Speak now!`;

      recordingSeconds = 0;
      recTimer.textContent = "00:00";
      clearInterval(recordingInterval);
      recordingInterval = setInterval(() => {
        recordingSeconds++;
        const mins = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
        const secs = String(recordingSeconds % 60).padStart(2, '0');
        recTimer.textContent = `${mins}:${secs}`;
      }, 1000);

    } catch (err) {
      alert("Microphone access error: " + err.message);
    }
  }

  function stopRecordingAndProcess() {
    if (!mediaRecorder) return;
    clearInterval(recordingInterval);
    micBtn.classList.remove("recording");
    const micText = micBtn.querySelector("span");
    if (micText) micText.textContent = "Speak Mic";
    recText.textContent = "Transcribing Gujarati speech using Sarvam Saaras ASR...";

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      banner.style.display = "none";

      if (audioBlob.size === 0) return;

      const formData = new FormData();
      const filename = (mediaRecorder.mimeType && mediaRecorder.mimeType.includes("webm")) ? "recording.webm" : "recording.wav";
      formData.append("file", audioBlob, filename);
      formData.append("language_code", langSelect ? langSelect.value : "gu-IN");

      input.value = "⏳ Transcribing Gujarati speech...";
      input.disabled = true;

      try {
        const response = await fetch("/api/speech-to-text", {
          method: "POST",
          body: formData
        });
        const data = await response.json();
        input.disabled = false;

        if (response.ok && data.transcript) {
          input.value = data.transcript;
          // Auto-submit transcribed Gujarati query!
          document.getElementById("chatForm").dispatchEvent(new Event("submit"));
        } else {
          input.value = "";
          alert("Speech recognition error: " + (data.detail || data.error || "No speech detected. Please try again."));
        }
      } catch (err) {
        input.disabled = false;
        input.value = "";
        alert("Error connecting to Sarvam ASR service: " + err.message);
      }
    };

    mediaRecorder.stop();
  }

  function cancelRecording() {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    clearInterval(recordingInterval);
    micBtn.classList.remove("recording");
    const micText = micBtn.querySelector("span");
    if (micText) micText.textContent = "Speak Mic";
    banner.style.display = "none";
    audioChunks = [];
  }
}

async function playGujaratiVoice(text, buttonElement) {
  const langSelect = document.getElementById("voiceLangSelect");
  const targetLang = langSelect ? langSelect.value : "gu-IN";

  // If already playing this audio, toggle pause
  if (currentAudio && !currentAudio.paused && buttonElement && buttonElement.getAttribute("data-playing") === "true") {
    currentAudio.pause();
    buttonElement.removeAttribute("data-playing");
    buttonElement.innerHTML = `▶️ Resume Voice`;
    return;
  }

  // If paused, resume
  if (currentAudio && currentAudio.paused && buttonElement && buttonElement.getAttribute("data-loaded") === "true") {
    currentAudio.play();
    buttonElement.setAttribute("data-playing", "true");
    buttonElement.innerHTML = `⏸️ Pause Voice`;
    return;
  }

  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }

  const defaultHtml = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
    <span>🔊 Read Aloud (ગુજરાતી અવાજ)</span>
  `;

  if (buttonElement) {
    buttonElement.disabled = true;
    buttonElement.innerHTML = `⏳ Synthesizing voice...`;
  }

  try {
    const resp = await fetch("/api/text-to-speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: text,
        language_code: targetLang,
        speaker: "pooja"
      })
    });

    const data = await resp.json();
    if (resp.ok && data.audio_url) {
      currentAudio = new Audio(data.audio_url);
      
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.setAttribute("data-playing", "true");
        buttonElement.setAttribute("data-loaded", "true");
        buttonElement.innerHTML = `⏸️ Pause Voice`;
        
        currentAudio.onended = () => {
          buttonElement.removeAttribute("data-playing");
          buttonElement.removeAttribute("data-loaded");
          buttonElement.innerHTML = defaultHtml;
        };
        currentAudio.onpause = () => {
          buttonElement.removeAttribute("data-playing");
          buttonElement.innerHTML = `▶️ Resume Voice`;
        };
      }

      await currentAudio.play();
    } else {
      console.warn("TTS Error:", data);
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = defaultHtml;
      }
    }
  } catch (err) {
    console.error("Audio playback error:", err);
    if (buttonElement) {
      buttonElement.disabled = false;
      buttonElement.innerHTML = defaultHtml;
    }
  }
}

