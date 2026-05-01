/* eslint-env browser */
(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const initialStep = params.get("step") || "1";
  let currentStep = parseInt(initialStep, 10) || 1;
  function setStep(n) {
    if (n === currentStep || n < currentStep) return;
    currentStep = n;
    document.body.setAttribute("data-step", String(n));
    document.getElementById("step-indicator").textContent = String(n);
  }
  setStep(currentStep);

  const senderPhoneInput = document.getElementById("sender-phone");
  const senderPhoneError = document.getElementById("sender-phone-error");
  const imageInput = document.getElementById("image-input");
  const sendButton = document.getElementById("send-button");
  const bubbles = document.getElementById("bubbles");
  const transcriptBody = document.getElementById("transcript-body");
  const transcriptStatus = document.getElementById("transcript-status");
  const caseBody = document.getElementById("case-body");
  const caseStatus = document.getElementById("case-status");
  const simulatorForm = document.getElementById("simulator-form");

  const PHONE_RE = /^(\+44|0)[1-9]\d{9}$/;
  const PHONE_STORAGE_KEY = "ndx_try_aicc_sender_phone";
  const API_BASE = window.NDX_API_BASE || "/api";

  // Localised UI labels for the eight supported languages. The chat content
  // itself is translated server-side; these are just the surface controls.
  const LABELS = {
    en: { ready: "Ready", noCase: "No case yet", typing: "Bot typing…", waiting: "Waiting for bot…", send: "Ask", chooseFile: "Choose photo", noFile: "No file chosen", sender: "Sender phone", placeholder: "One issue, or several joined with 'and'..." },
    it: { ready: "Pronto", noCase: "Nessun caso ancora", typing: "Il bot sta scrivendo…", waiting: "In attesa del bot…", send: "Invia", chooseFile: "Scegli foto", noFile: "Nessun file selezionato", sender: "Telefono mittente", placeholder: "Un problema, o più uniti da 'e'..." },
    fr: { ready: "Prêt", noCase: "Aucun dossier", typing: "Le bot écrit…", waiting: "En attente du bot…", send: "Envoyer", chooseFile: "Choisir une photo", noFile: "Aucun fichier choisi", sender: "Téléphone expéditeur", placeholder: "Un problème, ou plusieurs liés par 'et'..." },
    de: { ready: "Bereit", noCase: "Noch kein Fall", typing: "Bot schreibt…", waiting: "Warte auf Bot…", send: "Senden", chooseFile: "Foto auswählen", noFile: "Keine Datei ausgewählt", sender: "Absender-Telefon", placeholder: "Ein Anliegen, oder mehrere mit 'und' verbunden..." },
    es: { ready: "Listo", noCase: "Sin caso aún", typing: "El bot escribe…", waiting: "Esperando al bot…", send: "Enviar", chooseFile: "Elegir foto", noFile: "Ningún archivo elegido", sender: "Teléfono remitente", placeholder: "Un problema, o varios unidos por 'y'..." },
    pl: { ready: "Gotowe", noCase: "Brak sprawy", typing: "Bot pisze…", waiting: "Czekam na bota…", send: "Wyślij", chooseFile: "Wybierz zdjęcie", noFile: "Nie wybrano pliku", sender: "Telefon nadawcy", placeholder: "Jedna sprawa lub kilka połączonych słowem 'i'..." },
    cy: { ready: "Barod", noCase: "Dim achos eto", typing: "Bot yn teipio…", waiting: "Yn aros am y bot…", send: "Anfon", chooseFile: "Dewis llun", noFile: "Heb ddewis ffeil", sender: "Ffôn anfonwr", placeholder: "Un mater, neu sawl un wedi'u huno gan 'a'..." },
    ro: { ready: "Gata", noCase: "Niciun caz încă", typing: "Botul scrie…", waiting: "Aștept botul…", send: "Trimite", chooseFile: "Alege poza", noFile: "Niciun fișier ales", sender: "Telefon expeditor", placeholder: "O problemă, sau mai multe unite cu 'și'..." },
  };

  let currentLang = "en";
  // Quick client-side language hint used for the badge and to send `language`
  // along with API calls. Server still re-detects, but a hint speeds up turn 1.
  function guessLanguage(text) {
    if (!text) return "en";
    const t = text.toLowerCase();
    if (/[ąćęłńóśźż]/.test(t)) return "pl";
    if (/(sbwriel|cyngor|pryd mae|rwy'n|llanfair|noson dda)/.test(t)) return "cy";
    if (/[ăâîșț]/.test(t) || /(mulțumesc|bună|gunoi|primărie)/.test(t)) return "ro";
    if (/[äöüß]/.test(t) || /(guten tag|müll|bürger|stadt)/.test(t)) return "de";
    if (/[ñ¿¡]/.test(t) || /(hola|gracias|basura|ayuntamiento)/.test(t)) return "es";
    if (/(buongiorno|spazzatura|comune|grazie)/.test(t)) return "it";
    if (/[àâçéèêëîïôùûüÿœ]/.test(t) || /(bonjour|merci|ordures|mairie)/.test(t)) return "fr";
    return "en";
  }
  function setLanguage(code) {
    if (!LABELS[code]) code = "en";
    currentLang = code;
    const indicator = document.getElementById("lang-indicator");
    const value = document.getElementById("lang-value");
    if (indicator) indicator.hidden = false;
    if (value) value.textContent = code.toUpperCase();
    applyLabels(code);
  }
  function applyLabels(code) {
    const L = LABELS[code] || LABELS.en;
    const transcriptStatusEl = document.getElementById("transcript-status");
    const caseStatusEl = document.getElementById("case-status");
    const sendBtn = document.getElementById("chat-send");
    const chatInputEl = document.getElementById("chat-input");
    const pickBtn = document.getElementById("image-pick-btn");
    const fname = document.getElementById("image-filename");
    if (transcriptStatusEl && /^(ready|pronto|prêt|bereit|listo|gotowe|barod|gata)$/i.test(transcriptStatusEl.textContent.trim())) {
      transcriptStatusEl.textContent = L.ready;
    }
    if (caseStatusEl && /^(no case yet|nessun caso|aucun|noch kein|sin caso|brak|dim achos|niciun caz)/i.test(caseStatusEl.textContent.trim())) {
      caseStatusEl.textContent = L.noCase;
    }
    if (sendBtn && !sendBtn.disabled) sendBtn.textContent = L.send;
    if (chatInputEl) chatInputEl.placeholder = L.placeholder;
    if (pickBtn) pickBtn.textContent = L.chooseFile;
    if (fname && /^(no file|nessun file|aucun fichier|keine datei|ningún archivo|nie wybrano|heb ddewis|niciun fișier)/i.test(fname.textContent.trim())) {
      fname.textContent = L.noFile;
    }
  }

  const fromQuery = params.get("phone");
  const persisted = localStorage.getItem(PHONE_STORAGE_KEY);
  if (fromQuery && PHONE_RE.test(fromQuery)) {
    senderPhoneInput.value = fromQuery;
  } else if (persisted && PHONE_RE.test(persisted)) {
    senderPhoneInput.value = persisted;
  }

  function validateSenderPhone() {
    const value = (senderPhoneInput.value || "").replace(/\s+/g, "");
    if (!value) {
      senderPhoneError.hidden = true;
      sendButton.disabled = true;
      return false;
    }
    const ok = PHONE_RE.test(value);
    senderPhoneError.hidden = ok;
    sendButton.disabled = !(ok && imageInput.files && imageInput.files.length === 1);
    if (ok) localStorage.setItem(PHONE_STORAGE_KEY, value);
    return ok;
  }

  senderPhoneInput.addEventListener("blur", validateSenderPhone);
  senderPhoneInput.addEventListener("input", validateSenderPhone);
  imageInput.addEventListener("change", () => {
    const fname = document.getElementById("image-filename");
    if (fname) fname.textContent = imageInput.files && imageInput.files[0] ? imageInput.files[0].name : "No file chosen";
    validateSenderPhone();
  });
  const imagePickBtn = document.getElementById("image-pick-btn");
  if (imagePickBtn) imagePickBtn.addEventListener("click", () => imageInput.click());

  simulatorForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (!validateSenderPhone()) return;
    const file = imageInput.files[0];
    const phone = senderPhoneInput.value.replace(/\s+/g, "");
    sendButton.disabled = true;

    appendBubble({ kind: "plain", text: `Photo received. Sender ID: ${phone}` });

    let presign;
    try {
      const presignResp = await fetch(`${API_BASE}/upload-presign`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sender_phone: phone, content_type: file.type || "image/jpeg" }),
      });
      presign = await presignResp.json();
    } catch (e) {
      appendBubble({ kind: "plain", text: `Upload presign failed: ${e}` });
      sendButton.disabled = false;
      return;
    }

    appendBubble({ kind: "shimmer", text: "Analysing image with Amazon Bedrock…" });

    try {
      await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "content-type": file.type || "image/jpeg" },
        body: file,
      });
    } catch (e) {
      appendBubble({ kind: "plain", text: `S3 PUT failed: ${e}` });
      sendButton.disabled = false;
      return;
    }

    setTimeout(() => appendBubble({ kind: "plain", text: "Looking up your case in Connect Cases…" }), 2500);

    try {
      const sendResp = await fetch(`${API_BASE}/simulator/send`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image_s3_key: presign.key, sender_phone: phone, language: currentLang }),
      });
      const data = await sendResp.json();
      if (data.status === "declined") {
        const sd = data.structured_description || {};
        appendBubble({ kind: "plain", text: `That doesn't look like something the council can help with. ${sd.suggested_council_action || ""}`.trim() });
      } else {
        appendBubble({ kind: "structured", text: JSON.stringify(data, null, 2) });
      }
    } catch (e) {
      appendBubble({ kind: "plain", text: `Multimodal call failed: ${e}` });
    } finally {
      sendButton.disabled = false;
    }
  });

  function appendBubble({ kind, text }) {
    const div = document.createElement("div");
    div.classList.add("ndx-bubble");
    if (kind === "shimmer") div.classList.add("ndx-bubble--shimmer");
    if (kind === "structured") div.classList.add("ndx-bubble--structured");
    div.textContent = text;
    bubbles.appendChild(div);
    bubbles.scrollTop = bubbles.scrollHeight;
  }

  // === Chat (left pane) ===
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const transcriptPlaceholder = document.getElementById("transcript-placeholder");
  let activeCaseId = null;
  const sessionId = "spa-" + Math.random().toString(36).slice(2, 12);

  function appendSegment(role, text, meta) {
    if (transcriptPlaceholder) { transcriptPlaceholder.remove(); }
    const seg = document.createElement("div");
    seg.classList.add("ndx-segment");
    seg.classList.add(role === "CUSTOMER" ? "ndx-segment--neutral" : "ndx-segment--positive");
    seg.innerHTML = `<div class="ndx-segment__meta">${role}${meta?` · ${meta}`:""}</div>${escapeHtml(text)}`;
    transcriptBody.appendChild(seg);
    transcriptBody.scrollTop = transcriptBody.scrollHeight;
  }

  function appendMultiIntentSummary(data) {
    if (transcriptPlaceholder) { transcriptPlaceholder.remove(); }
    const seg = document.createElement("div");
    seg.classList.add("ndx-segment", "ndx-segment--high");
    let html = `<div class="ndx-segment__meta">SYSTEM · multi-intent (${data.answers.length})</div>`;
    data.answers.forEach((a) => {
      html += `<div style="margin-bottom:6px;"><strong>${a.intent}</strong> (${(a.confidence||0).toFixed(2)}): ${escapeHtml((a.answer||"").slice(0,200))}${(a.answer||"").length>200?"...":""}</div>`;
    });
    seg.innerHTML = html;
    transcriptBody.appendChild(seg);
    transcriptBody.scrollTop = transcriptBody.scrollHeight;
  }

  const chatSendBtn = document.getElementById("chat-send");
  let connectChatSession = null;
  let chatSessionPromise = null;
  let firstBotMessageReceived = false;
  const pendingMessages = [];
  if (chatSendBtn) chatSendBtn.disabled = true;

  function startChatSessionEarly() {
    if (chatSessionPromise) return chatSessionPromise;
    chatSessionPromise = (async () => {
      const phoneVal = senderPhoneInput.value || "+447700900123";
      const startResp = await fetch(`${API_BASE}/chat/start`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ display_name: phoneVal }),
      });
      const start = await startResp.json();
      if (!start.ParticipantToken) throw new Error(start.error || "chat_start_failed");
      if (!window.connect || !window.connect.ChatSession) throw new Error("chatjs_not_loaded");
      const session = window.connect.ChatSession.create({
        chatDetails: {
          contactId: start.ContactId,
          participantId: start.ParticipantId,
          participantToken: start.ParticipantToken,
        },
        type: "CUSTOMER",
        options: { region: "us-east-1" },
      });
      await session.connect();
      transcriptStatus.textContent = "Connecting bot…";
      session.onMessage(({ data }) => {
        if (data.ContentType !== "text/plain" || data.ParticipantRole === "CUSTOMER") return;
        appendSegment(data.ParticipantRole || "SYSTEM", data.Content);
        if (!firstBotMessageReceived) {
          firstBotMessageReceived = true;
          if (chatSendBtn) chatSendBtn.disabled = false;
          transcriptStatus.textContent = "Ready";
          while (pendingMessages.length) {
            const queued = pendingMessages.shift();
            session.sendMessage({ contentType: "text/plain", message: queued }).catch(() => {});
          }
        }
        setStep(3);
        if (/connecting you|case (number|reference)|callback|will be in touch/i.test(data.Content)) setStep(5);
      });
      session.onTyping(() => { transcriptStatus.textContent = "Bot typing…"; });
      session.onEnded(() => { connectChatSession = null; chatSessionPromise = null; transcriptStatus.textContent = "Chat ended"; });
      connectChatSession = session;
      return session;
    })();
    return chatSessionPromise;
  }

  startChatSessionEarly().catch((e) => {
    appendSegment("SYSTEM", "Chat connect error: " + (e && e.message ? e.message : e));
    transcriptStatus.textContent = "Error";
  });

  async function submitChat(ev) {
      if (ev) ev.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = "";
      appendSegment("CUSTOMER", text);
      setStep(2);
      // Hint UI language from the user's first non-empty message. Server still
      // does authoritative detection on its side.
      if (currentLang === "en") {
        const guess = guessLanguage(text);
        if (guess !== "en") setLanguage(guess);
      }
      if (!firstBotMessageReceived) {
        pendingMessages.push(text);
        transcriptStatus.textContent = LABELS[currentLang].waiting;
        return;
      }
      try {
        const session = await startChatSessionEarly();
        transcriptStatus.textContent = "Sending…";
        await session.sendMessage({ contentType: "text/plain", message: text });
        transcriptStatus.textContent = "Sent";
      } catch (e) {
        appendSegment("SYSTEM", "Chat error: " + (e && e.message ? e.message : e));
        transcriptStatus.textContent = "Error";
      }
  }
  if (chatSendBtn) chatSendBtn.addEventListener("click", submitChat);
  if (chatInput) chatInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") submitChat(ev); });

  // === WebRTC voice/video/screen-share via Chime SDK ===
  const webrtcCallBtn = document.getElementById("webrtc-call");
  const webrtcVideoBtn = document.getElementById("webrtc-video");
  const webrtcScreenBtn = document.getElementById("webrtc-screen");
  const webrtcEndBtn = document.getElementById("webrtc-end");
  const webrtcStatus = document.getElementById("webrtc-status");
  const chimeAudio = document.getElementById("chime-audio");
  const chimeTiles = document.getElementById("chime-video-tiles");
  let chimeSession = null;
  let chimeContactId = null;
  let videoOn = false;
  let screenSharing = false;

  function setWebrtcStatus(s) { if (webrtcStatus) webrtcStatus.textContent = s; }

  async function startWebCall() {
    if (chimeSession) return;
    setWebrtcStatus("starting…");
    webrtcCallBtn.disabled = true;
    try {
      const phoneVal = senderPhoneInput.value || "+447700900126";
      const r = await fetch(`${API_BASE}/web-call/start`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ display_name: phoneVal }),
      });
      const data = await r.json();
      if (!data.Meeting || !data.Attendee) throw new Error(data.message || data.error || "no meeting");
      chimeContactId = data.ContactId;
      setWebrtcStatus("loading SDK…");
      const ChimeSDK = await import("https://esm.sh/amazon-chime-sdk-js@3");
      const logger = new ChimeSDK.ConsoleLogger("aicc-chime", ChimeSDK.LogLevel.WARN);
      const deviceController = new ChimeSDK.DefaultDeviceController(logger);
      const config = new ChimeSDK.MeetingSessionConfiguration(data.Meeting, data.Attendee);
      const session = new ChimeSDK.DefaultMeetingSession(config, logger, deviceController);
      const audioInputs = await session.audioVideo.listAudioInputDevices();
      if (audioInputs.length) await session.audioVideo.startAudioInput(audioInputs[0].deviceId);
      await session.audioVideo.bindAudioElement(chimeAudio);
      session.audioVideo.addObserver({
        audioVideoDidStart: () => { setWebrtcStatus("call connected"); setStep(3); },
        audioVideoDidStop: (sessionStatus) => {
          setWebrtcStatus("");
          chimeSession = null; chimeContactId = null; videoOn = false; screenSharing = false;
          webrtcCallBtn.disabled = false; webrtcCallBtn.style.display = "";
          webrtcVideoBtn.style.display = "none"; webrtcVideoBtn.textContent = "Add video";
          webrtcScreenBtn.style.display = "none"; webrtcScreenBtn.textContent = "Share screen";
          webrtcEndBtn.style.display = "none";
          chimeTiles.innerHTML = "";
        },
        videoTileDidUpdate: (tile) => { renderChimeTile(session, tile); },
        videoTileWasRemoved: (tileId) => { removeChimeTile(tileId); },
      });
      session.audioVideo.start();
      chimeSession = session;
      webrtcCallBtn.style.display = "none";
      webrtcVideoBtn.style.display = "";
      webrtcScreenBtn.style.display = "";
      webrtcEndBtn.style.display = "";
    } catch (e) {
      setWebrtcStatus("error: " + (e && e.message ? e.message : e));
      webrtcCallBtn.disabled = false;
    }
  }

  async function toggleVideo() {
    if (!chimeSession) return;
    if (!videoOn) {
      const cams = await chimeSession.audioVideo.listVideoInputDevices();
      if (!cams.length) { setWebrtcStatus("no camera"); return; }
      await chimeSession.audioVideo.startVideoInput(cams[0].deviceId);
      chimeSession.audioVideo.startLocalVideoTile();
      videoOn = true;
      webrtcVideoBtn.textContent = "Stop video";
    } else {
      chimeSession.audioVideo.stopLocalVideoTile();
      await chimeSession.audioVideo.stopVideoInput();
      videoOn = false;
      webrtcVideoBtn.textContent = "Add video";
    }
  }

  async function toggleScreenShare() {
    if (!chimeSession) return;
    if (!screenSharing) {
      try {
        await chimeSession.audioVideo.startContentShareFromScreenCapture();
        screenSharing = true;
        webrtcScreenBtn.textContent = "Stop sharing";
        setStep(4);
      } catch (e) {
        setWebrtcStatus("share denied");
      }
    } else {
      chimeSession.audioVideo.stopContentShare();
      screenSharing = false;
      webrtcScreenBtn.textContent = "Share screen";
    }
  }

  function renderChimeTile(session, tile) {
    if (!tile.boundAttendeeId) return;
    let video = document.getElementById(`tile-${tile.tileId}`);
    if (!video) {
      video = document.createElement("video");
      video.id = `tile-${tile.tileId}`;
      video.autoplay = true; video.playsInline = true;
      video.style.width = tile.isContent ? "320px" : "180px";
      video.style.height = tile.isContent ? "180px" : "135px";
      video.style.background = "#000"; video.style.borderRadius = "4px";
      const label = document.createElement("div");
      label.style.cssText = "font-size:11px; color:#6f777b; text-align:center;";
      label.textContent = tile.isContent ? "screen" : (tile.localTile ? "you" : "remote");
      const wrap = document.createElement("div");
      wrap.id = `tile-wrap-${tile.tileId}`;
      wrap.appendChild(video); wrap.appendChild(label);
      chimeTiles.appendChild(wrap);
    }
    session.audioVideo.bindVideoElement(tile.tileId, video);
  }
  function removeChimeTile(tileId) {
    const w = document.getElementById(`tile-wrap-${tileId}`);
    if (w) w.remove();
  }

  async function endWebCall() {
    if (!chimeSession) return;
    chimeSession.audioVideo.stop();
  }

  if (webrtcCallBtn) webrtcCallBtn.addEventListener("click", startWebCall);
  if (webrtcVideoBtn) webrtcVideoBtn.addEventListener("click", toggleVideo);
  if (webrtcScreenBtn) webrtcScreenBtn.addEventListener("click", toggleScreenShare);
  if (webrtcEndBtn) webrtcEndBtn.addEventListener("click", endWebCall);

  // === Polling: case ===
  const contactId = params.get("contact_id");
  const initialCaseId = params.get("case_id");
  if (contactId) pollTranscript(contactId);
  if (initialCaseId) pollCase(initialCaseId);

  async function pollTranscript(cid) {
    transcriptStatus.textContent = "Polling…";
    setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE}/transcript/${encodeURIComponent(cid)}`);
        const data = await resp.json();
        renderTranscript(data.segments || []);
      } catch (e) {
        transcriptStatus.textContent = "Polling error";
      }
    }, 3000);
  }

  function renderTranscript(segments) {
    if (!segments.length) {
      transcriptStatus.textContent = "Waiting";
      return;
    }
    transcriptStatus.textContent = `${segments.length} segments`;
    transcriptBody.innerHTML = "";
    segments.forEach((seg) => {
      const div = document.createElement("div");
      div.classList.add("ndx-segment", `ndx-segment--${(seg.sentiment || "neutral").toLowerCase()}`);
      div.innerHTML = `
        <div class="ndx-segment__meta">${seg.speaker || "?"} · ${formatTimestamp(seg.segmentTimestamp)} · ${seg.sentiment || "neutral"}</div>
        ${escapeHtml(seg.transcript || "")}
      `;
      transcriptBody.appendChild(div);
    });
    if (segments.length >= 2) setStep(3);
    if (segments.length >= 4) setStep(4);
    const joined = segments.map(s => (s.transcript || "").toLowerCase()).join(" ");
    if (/connecting you|case (number|reference)|callback|will be in touch/i.test(joined)) setStep(5);
  }

  async function pollCase(cid) {
    caseStatus.textContent = "Polling…";
    setInterval(async () => {
      try {
        const resp = await fetch(`${API_BASE}/case/${encodeURIComponent(cid)}`);
        const data = await resp.json();
        renderCase(data);
      } catch (e) {
        caseStatus.textContent = "Polling error";
      }
    }, 3000);
  }

  function renderCase(data) {
    if (!data || !data.fields) return;
    caseStatus.textContent = "Live";
    caseBody.innerHTML = "";
    Object.entries(data.fields).forEach(([k, v]) => {
      const row = document.createElement("div");
      row.classList.add("ndx-case-row");
      const valEl = document.createElement("div");
      if (k === "safeguarding_flag" && (v === true || v === "true")) {
        valEl.innerHTML = '<span class="ndx-case-row__val--bool-true">SAFEGUARDING</span>';
      } else {
        valEl.textContent = v == null ? "" : String(v);
      }
      const keyEl = document.createElement("div");
      keyEl.classList.add("ndx-case-row__key");
      keyEl.textContent = k;
      row.appendChild(keyEl);
      row.appendChild(valEl);
      caseBody.appendChild(row);
    });
  }

  function formatTimestamp(ts) {
    if (!ts) return "--:--:--";
    const d = new Date(typeof ts === "number" ? ts : Date.parse(ts));
    return d.toISOString().substring(11, 19);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
})();
