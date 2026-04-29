/* eslint-env browser */
(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const step = params.get("step") || "1";
  document.body.setAttribute("data-step", step);
  document.getElementById("step-indicator").textContent = step;

  const senderPhoneInput = document.getElementById("sender-phone");
  const senderPhoneError = document.getElementById("sender-phone-error");
  const imageInput = document.getElementById("image-input");
  const sendButton = document.getElementById("send-button");
  const bubbles = document.getElementById("bubbles");
  const transcriptBody = document.getElementById("transcript-body");
  const transcriptStatus = document.getElementById("transcript-status");
  const caseBody = document.getElementById("case-body");
  const caseStatus = document.getElementById("case-status");
  const copyShareButton = document.getElementById("copy-share");
  const simulatorForm = document.getElementById("simulator-form");

  const PHONE_RE = /^(\+44|0)[1-9]\d{9}$/;
  const PHONE_STORAGE_KEY = "ndx_try_aicc_sender_phone";
  const API_BASE = window.NDX_API_BASE || "/api";

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
  imageInput.addEventListener("change", validateSenderPhone);

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
        body: JSON.stringify({ image_s3_key: presign.key, sender_phone: phone }),
      });
      const data = await sendResp.json();
      appendBubble({ kind: "structured", text: JSON.stringify(data, null, 2) });
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

  copyShareButton.addEventListener("click", () => {
    const phone = senderPhoneInput.value || "+44 800";
    const text = `I just demoed an AI Contact Centre on AWS for Aldershire DC. The bot received my call about a missed bin collection, then a photo I sent on WhatsApp, and connected them into one case. Reference: ABC-123. Tech: Amazon Connect, Lex, Bedrock, Connect Cases. Try it: ${window.location.origin}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        copyShareButton.textContent = "Copied!";
        setTimeout(() => (copyShareButton.textContent = "Copy share text"), 2000);
      });
    }
  });

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
  async function submitChat(ev) {
      if (ev) ev.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;
      chatInput.value = "";
      appendSegment("CUSTOMER", text);
      transcriptStatus.textContent = "Thinking...";
      try {
        const phoneVal = senderPhoneInput.value || "+447700900123";
        const r = await fetch(`${API_BASE}/ask`, {
          method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ utterance: text, session_id: sessionId, sender_phone: phoneVal }),
        });
        const data = await r.json();
        if (data.case_id) {
          activeCaseId = data.case_id;
          caseStatus.textContent = `Case ${data.case_id.slice(0,8).toUpperCase()}`;
          pollCase(activeCaseId);
        }
        if (data.mode === "multi_intent") {
          appendMultiIntentSummary(data);
        } else {
          const meta = `intent ${data.intent} (${(data.intent_confidence||0).toFixed(2)})${data.guardrail_intervened?" · guardrail":""}`;
          appendSegment("SYSTEM", data.answer || "(no answer)", meta);
        }
        transcriptStatus.textContent = "Ready";
      } catch (e) {
        appendSegment("SYSTEM", "Error: " + e);
        transcriptStatus.textContent = "Error";
      }
  }
  if (chatSendBtn) chatSendBtn.addEventListener("click", submitChat);
  if (chatInput) chatInput.addEventListener("keydown", (ev) => { if (ev.key === "Enter") submitChat(ev); });

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
