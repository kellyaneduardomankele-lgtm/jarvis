const $ = (id) => document.getElementById(id);

const orb = $("orb");
const statusText = $("statusText");
const hintText = $("hintText");
const heardText = $("heardText");
const jarvisText = $("jarvisText");
const micState = $("micState");

const settingsDialog = $("settingsDialog");
const languageSelect = $("languageSelect");
const voiceToggle = $("voiceToggle");
const wakeToggle = $("wakeToggle");
const memoryInput = $("memoryInput");
const clearMemoryBtn = $("clearMemoryBtn");

const MEMORY_KEY = "jarvis-memory-v1";

function loadMemory() {
  try {
    return JSON.parse(localStorage.getItem(MEMORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveMemory(items) {
  localStorage.setItem(MEMORY_KEY, JSON.stringify(items));
  memoryInput.value = items.join("\n");
}

function remember(note) {
  const clean = note.trim().replace(/[.!?]+$/, "");
  if (!clean) return false;
  const items = loadMemory();
  if (!items.some(item => item.toLowerCase() === clean.toLowerCase())) {
    items.push(clean);
    saveMemory(items);
  }
  return true;
}

const SpeechRecognition =
  window.SpeechRecognition || window.webkitSpeechRecognition;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
  (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

let recognition = null;
let listening = false;
let shouldRestart = false;

function setStatus(title, subtitle = "") {
  statusText.textContent = title;
  if (subtitle) hintText.textContent = subtitle;
}

function speak(text) {
  if (!voiceToggle.checked || !("speechSynthesis" in window)) return;

  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languageSelect.value;
  utterance.rate = 0.96;
  utterance.pitch = 0.92;

  const voices = speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang?.toLowerCase().startsWith(languageSelect.value.slice(0, 2).toLowerCase())
  );
  if (preferred) utterance.voice = preferred;

  speechSynthesis.speak(utterance);
}

function safeMath(expression) {
  const clean = expression
    .replace(/mal/gi, "*")
    .replace(/[x×]/gi, "*")
    .replace(/geteilt durch/gi, "/")
    .replace(/durch/gi, "/")
    .replace(/plus/gi, "+")
    .replace(/minus/gi, "-")
    .replace(/hoch/gi, "**")
    .replace(/,/g, ".")
    .replace(/[^0-9+\-*/().%\s*]/g, "");

  if (!clean.trim()) return null;
  if (!/^[0-9+\-*/().%\s*]+$/.test(clean)) return null;

  try {
    const value = Function(`"use strict"; return (${clean})`)();
    return Number.isFinite(value) ? value : null;
  } catch {
    return null;
  }
}

function schoolAnswer(text) {
  const t = text.toLowerCase();

  const memoryMatch = text.match(/^(?:bitte\s+)?(?:merk dir|merke dir)\s*[:,]?\s*(.+)$/i);
  if (memoryMatch) {
    return remember(memoryMatch[1])
      ? "Das habe ich mir auf diesem Gerät gemerkt."
      : "Sag mir bitte, was ich mir merken soll.";
  }

  if (/was (?:weisst|weißt) du über mich|was hast du dir gemerkt/i.test(t)) {
    const items = loadMemory();
    return items.length
      ? `Ich habe mir gemerkt: ${items.join("; ")}.`
      : "Ich habe mir noch nichts über dich gemerkt.";
  }

  const mathish =
    /(?:\d|\bplus\b|\bminus\b|\bmal\b|\bgeteilt\b|\bdurch\b|\bhoch\b)/i.test(text);
  if (mathish) {
    const result = safeMath(text);
    if (result !== null) return `Das Ergebnis ist ${result}.`;
  }

  if (t.includes("passé composé") || t.includes("passe compose")) {
    return "Das passé composé beschreibt meist abgeschlossene Handlungen in der Vergangenheit. Es wird meistens mit avoir oder être im Präsens plus participe passé gebildet, zum Beispiel: j’ai joué.";
  }

  if (t.includes("present perfect")) {
    return "Das Present Perfect verbindet Vergangenheit und Gegenwart. Bildung: have oder has plus past participle. Beispiel: I have finished my homework.";
  }

  if (t.includes("nominativ") || t.includes("akkusativ") || t.includes("dativ")) {
    return "Kurz erklärt: Nominativ fragt wer oder was, Akkusativ wen oder was und Dativ wem. Beispiel: Der Schüler gibt dem Freund den Ball. Der Schüler ist Nominativ, dem Freund Dativ und den Ball Akkusativ.";
  }

  if (t.includes("wer bist du")) {
    return "Ich bin JARVIS Basic, dein persönlicher Assistent im Browser.";
  }

  if (t.includes("wie heisse ich") || t.includes("wie heiße ich")) {
    return "Du heisst Kellyan.";
  }

  if (t.includes("fussball") || t.includes("fußball")) {
    return "Fussball-Modul bereit. Für aktuelle Resultate und Live-Daten braucht diese GitHub-Version später eine sichere Datenquelle oder API.";
  }

  if (t.includes("hallo") || t.includes("hey jarvis") || t === "jarvis") {
    return "Hallo Kellyan. Was kann ich für dich tun?";
  }

  return "Ich habe dich verstanden. Diese GitHub-Version kann bereits Sprache, einfache Matheaufgaben und einige Schulfragen. Für echte KI-Antworten können wir später eine sichere Server-Verbindung ergänzen.";
}

function answerUser(text) {
  const cleaned = text.trim();
  if (!cleaned) return;

  heardText.textContent = cleaned;

  let command = cleaned;
  const hasWake = /\bhey\s+jarvis\b/i.test(cleaned) || /\bjarvis\b/i.test(cleaned);

  if (wakeToggle.checked && hasWake) {
    command = cleaned
      .replace(/\bhey\s+jarvis\b[,\s]*/i, "")
      .replace(/^\s*jarvis[,\s]*/i, "")
      .trim();

    if (!command) command = "Hallo";
  }

  const answer = schoolAnswer(command);
  jarvisText.textContent = answer;
  setStatus("Antwort bereit", "Sag etwas Neues oder tippe auf den Kreis.");
  speak(answer);
}

function setupRecognition() {
  if (!SpeechRecognition) {
    setStatus("Sprache nicht verfügbar", "Benutze unten das Textfeld.");
    micState.textContent = "Mikrofon: Browser nicht unterstützt";
    orb.disabled = true;
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = languageSelect.value;
  // Safari auf iPhone/iPad ist im Dauermodus unzuverlässig.
  recognition.continuous = !isIOS;
  recognition.interimResults = true;

  recognition.onstart = () => {
    listening = true;
    orb.classList.add("listening");
    micState.textContent = "Mikrofon: hört zu";
    setStatus("Ich höre zu …", wakeToggle.checked ? "Sag „Hey Jarvis“." : "Sprich jetzt.");
  };

  recognition.onresult = (event) => {
    let interim = "";
    let finalText = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript;
      else interim += transcript;
    }

    if (interim) heardText.textContent = interim;

    if (finalText.trim()) {
      const text = finalText.trim();
      heardText.textContent = text;

      if (!wakeToggle.checked || /\bhey\s+jarvis\b/i.test(text) || /^\s*jarvis\b/i.test(text)) {
        answerUser(text);
      } else {
        setStatus("Warte auf Aktivierungswort", "Sag „Hey Jarvis“.");
      }
    }
  };

  recognition.onerror = (event) => {
    if (event.error === "not-allowed" || event.error === "service-not-allowed") {
      shouldRestart = false;
      setStatus("Mikrofon blockiert", "Erlaube den Mikrofonzugriff im Browser.");
      micState.textContent = "Mikrofon: keine Berechtigung";
      return;
    }

    if (event.error !== "no-speech") {
      setStatus("Spracherkennung unterbrochen", `Fehler: ${event.error}`);
    }
  };

  recognition.onend = () => {
    listening = false;
    orb.classList.remove("listening");
    micState.textContent = "Mikrofon: aus";

    if (shouldRestart) {
      setTimeout(() => {
        try {
          recognition.lang = languageSelect.value;
          recognition.start();
        } catch {}
      }, 500);
    } else {
      setStatus("Bereit", "Sag „Hey Jarvis“ oder tippe auf den Kreis.");
    }
  };
}

async function startListening() {
  if (!recognition) return;

  if (navigator.mediaDevices?.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch {
      shouldRestart = false;
      setStatus("Mikrofon blockiert", "Erlaube das Mikrofon in den Website-Einstellungen.");
      micState.textContent = "Mikrofon: keine Berechtigung";
      return;
    }
  }

  shouldRestart = true;
  if (!listening) {
    try {
      recognition.lang = languageSelect.value;
      recognition.start();
    } catch (error) {
      shouldRestart = false;
      setStatus("Mikrofon konnte nicht starten", "Öffne Jarvis direkt in Safari und lade die Seite neu.");
      micState.textContent = "Mikrofon: Start fehlgeschlagen";
      console.error(error);
    }
  }
}

function stopListening() {
  shouldRestart = false;
  if (recognition && listening) recognition.stop();
}

orb.addEventListener("click", () => {
  if (listening) stopListening();
  else startListening();
});

$("textForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = $("textInput");
  answerUser(input.value);
  input.value = "";
});

document.querySelectorAll(".quick-actions button").forEach(button => {
  button.addEventListener("click", () => answerUser(button.dataset.prompt));
});

$("settingsBtn").addEventListener("click", () => {
  memoryInput.value = loadMemory().join("\n");
  settingsDialog.showModal();
});

memoryInput.addEventListener("change", () => {
  const items = memoryInput.value
    .split("\n")
    .map(item => item.trim())
    .filter(Boolean);
  saveMemory(items);
});

clearMemoryBtn.addEventListener("click", () => {
  localStorage.removeItem(MEMORY_KEY);
  memoryInput.value = "";
  jarvisText.textContent = "Mein Gedächtnis auf diesem Gerät wurde gelöscht.";
});

languageSelect.addEventListener("change", () => {
  if (recognition) recognition.lang = languageSelect.value;
});

window.addEventListener("beforeunload", () => {
  shouldRestart = false;
  try { recognition?.stop(); } catch {}
});

setupRecognition();
