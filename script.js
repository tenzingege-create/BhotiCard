// DATA SETUP
let words = JSON.parse(localStorage.getItem('bodhiCards_final')) || [
    { tib: "བཀྲ་ཤིས་བདེ་ལེགས།", eng: "Hello", category: "Basic", img: "", audio: null }
];
let filteredWords = [...words];
let currentIndex = 0;
let mediaRecorder;
let audioChunks = [];
let tempAudioData = null;

// INTERNAL WYLIE TRANSLATOR
const wylieTable = {
    'ka': 'ཀ', 'kha': 'ཁ', 'ga': 'ག', 'nga': 'ང',
    'ca': 'ཅ', 'cha': 'ཆ', 'ja': 'ཇ', 'nya': 'ཉ',
    'ta': 'ཏ', 'tha': 'ཐ', 'da': 'ད', 'na': 'ན',
    'pa': 'པ', 'pha': 'ཕ', 'ba': 'བ', 'ma': 'མ',
    'tsa': 'ཙ', 'tsha': 'ཚ', 'dza': 'ཛ', 'wa': 'ཝ',
    'zha': 'ཞ', 'za': 'ཟ', "'a": 'འ', 'ya': 'ཡ',
    'ra': 'ར', 'la': 'ལ', 'sha': 'ཤ', 'sa': 'ས', 'ha': 'ཧ', 'a': 'ཨ',
    'i': 'ི', 'u': 'ུ', 'e': 'ེ', 'o': 'ོ'
};

function convertWylie() {
    let input = document.getElementById('wylie-input').value.toLowerCase();
    let result = "";
    
    // CUSTOM STACK LOGIC
    if (input === "stag") result = "སྟག"; 
    else if (input === "mig") result = "མིག";
    else if (input === "nya") result = "ཉ་";
    else {
        // Basic Transliteration Logic
        let parts = input.split(' ');
        parts.forEach(p => {
            if (wylieTable[p]) result += wylieTable[p] + "་";
            else result += p;
        });
    }
    document.getElementById('new-tib').value = result;
}

// UI & DATABASE
function updateUI() {
    if (filteredWords.length === 0) {
        document.getElementById('tibetan-word').innerText = "Empty";
        document.getElementById('english-word').innerText = "Add words above";
        return;
    }
    const current = filteredWords[currentIndex];
    document.getElementById('tibetan-word').innerText = current.tib;
    document.getElementById('english-word').innerText = current.eng;
    document.getElementById('display-cat').innerText = current.category;
    const imgEl = document.getElementById('display-img');
    imgEl.src = current.img || "";
    imgEl.style.display = current.img ? "inline-block" : "none";
    localStorage.setItem('bodhiCards_final', JSON.stringify(words));
}

// RECORDING LOGIC
async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];
        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                tempAudioData = reader.result;
                document.getElementById('record-status').innerText = "✅ Captured!";
            };
        };
        mediaRecorder.start();
        document.getElementById('record-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'inline-block';
        document.getElementById('record-status').innerText = "🔴 Recording...";
    } catch (err) { alert("Mic required for recordings."); }
}

function stopRecording() {
    if (mediaRecorder) mediaRecorder.stop();
    document.getElementById('record-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'none';
}

// ACTIONS
function addNewWord() {
    const tib = document.getElementById('new-tib').value;
    const eng = document.getElementById('new-eng').value;
    const cat = document.getElementById('new-cat').value;
    const img = document.getElementById('new-img').value;
    if (tib && eng && tempAudioData) {
        words.push({ tib, eng, category: cat, img, audio: tempAudioData });
        tempAudioData = null;
        document.getElementById('wylie-input').value = '';
        document.getElementById('new-tib').value = '';
        document.getElementById('new-eng').value = '';
        document.getElementById('record-status').innerText = "Voice: Not Sampled";
        filterCategory('All');
        alert("Saved!");
    } else { alert("Need text and voice sample!"); }
}

function filterCategory(cat) {
    filteredWords = (cat === 'All') ? [...words] : words.filter(w => w.category === cat);
    currentIndex = 0;
    updateUI();
}

function nextWord() {
    if (filteredWords.length > 0) {
        currentIndex = (currentIndex + 1) % filteredWords.length;
        updateUI();
    }
}

function playVoice() {
    const audio = filteredWords[currentIndex].audio;
    if (audio) new Audio(audio).play();
}

function deleteCurrentWord() {
    if (words.length > 0) {
        const wordToDelete = filteredWords[currentIndex];
        words = words.filter(w => w !== wordToDelete);
        filterCategory('All');
    }
}

// BACKUP & RESTORE
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(words));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "bodhi_backup.json");
    dl.click();
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        words = JSON.parse(e.target.result);
        filterCategory('All');
        alert("Backup Successfully Loaded!");
    };
    reader.readAsText(event.target.files[0]);
}

updateUI();