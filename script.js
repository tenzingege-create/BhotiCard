// DATA SETUP
let words = JSON.parse(localStorage.getItem('bodhiCards_final')) || [
    { tib: "བཀྲ་ཤིས་བདེ་ལེགས།", eng: "Hello", category: "Basic", img: "", audio: null }
];
let filteredWords = [...words];
let currentIndex = 0;
let inputMode = 'wylie'; // Default mode
let mediaRecorder;
let audioChunks = [];
let tempAudioData = null;

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

// DUAL MODE HANDLER
function setInputMode(mode) {
    inputMode = mode;
    document.getElementById('mode-wylie').style.background = mode === 'wylie' ? '#6c5ce7' : 'rgba(255,255,255,0.1)';
    document.getElementById('mode-native').style.background = mode === 'native' ? '#6c5ce7' : 'rgba(255,255,255,0.1)';
    document.getElementById('wylie-input').placeholder = mode === 'wylie' ? "Type Wylie (ka, tashi)..." : "Type Native Tibetan...";
    document.getElementById('wylie-input').value = "";
    document.getElementById('new-tib').value = "";
}

function handleInput() {
    const inputVal = document.getElementById('wylie-input').value;
    if (inputMode === 'native') {
        document.getElementById('new-tib').value = inputVal;
    } else {
        convertWylie(inputVal);
    }
}

function convertWylie(input) {
    let result = "";
    let parts = input.toLowerCase().split(/\s+/);
    
    parts.forEach(p => {
        if (!p) return;
        let vowelMatch = p.match(/[iueo]/);
        if (vowelMatch) {
            let vowel = vowelMatch[0];
            let consonant = p.split(vowel)[0];
            result += (wylieTable[consonant] || consonant) + (wylieTable[vowel] || "");
        } else {
            result += wylieTable[p] || p;
        }
        result += "་"; // Add the Tsheg
    });
    document.getElementById('new-tib').value = result;
}

// REST OF APP LOGIC
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

// (Recording functions startRecording/stopRecording remain same as your previous version)
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
    } catch (err) { alert("Mic required."); }
}

function stopRecording() {
    if (mediaRecorder) mediaRecorder.stop();
    document.getElementById('record-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'none';
}

function addNewWord() {
    const tib = document.getElementById('new-tib').value;
    const eng = document.getElementById('new-eng').value;
    const cat = document.getElementById('new-cat').value;
    const img = document.getElementById('new-img').value;
    if (tib && eng) {
        words.push({ tib, eng, category: cat, img, audio: tempAudioData });
        tempAudioData = null;
        document.getElementById('wylie-input').value = '';
        document.getElementById('new-tib').value = '';
        document.getElementById('new-eng').value = '';
        document.getElementById('record-status').innerText = "Voice: Not Sampled";
        filterCategory('All');
        alert("Saved!");
    } else { alert("Tibetan and English text required!"); }
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
        alert("Loaded!");
    };
    reader.readAsText(event.target.files[0]);
}

updateUI();