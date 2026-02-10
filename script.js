// 1. DATA STORAGE
let words = JSON.parse(localStorage.getItem('bodhiCards_final')) || [
    { tib: "བཀྲ་ཤིས་བདེ་ལེགས།", eng: "Hello", category: "Basic", img: "", audio: null }
];
let filteredWords = [...words];
let currentIndex = 0;
let mediaRecorder;
let audioChunks = [];
let tempAudioData = null;

// 2. WYLIE TRANSCODER
function convertWylie() {
    let input = document.getElementById('wylie-input').value;
    if (typeof Wylie !== 'undefined') {
        // This is the magic part that stacks letters vertically
        document.getElementById('new-tib').value = Wylie.reformatWylie(input);
    } else {
        console.error("Wylie library not connected in index.html");
    }
}

// 3. UI UPDATER
function updateUI() {
    if (filteredWords.length === 0) {
        document.getElementById('tibetan-word').innerText = "Empty";
        document.getElementById('english-word').innerText = "No words here";
        document.getElementById('display-img').style.display = "none";
        document.getElementById('display-cat').innerText = "";
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

// 4. AUDIO RECORDING
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
    } catch (err) { alert("Mic error: " + err); }
}

function stopRecording() {
    if (mediaRecorder) mediaRecorder.stop();
    document.getElementById('record-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'none';
}

// 5. WORD MANAGEMENT
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
        document.getElementById('new-img').value = '';
        document.getElementById('record-status').innerText = "Voice: Not Sampled";
        filterCategory('All');
        alert("Saved to " + cat + "!");
    } else {
        alert("Please provide Tibetan, English, and a Voice Recording.");
    }
}

function filterCategory(cat) {
    if (cat === 'All') filteredWords = [...words];
    else filteredWords = words.filter(w => w.category === cat);
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

// 6. BACKUP / RESTORE
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
        try {
            words = JSON.parse(e.target.result);
            filterCategory('All');
            alert("Backup Loaded!");
        } catch (err) { alert("Invalid file."); }
    };
    reader.readAsText(event.target.files[0]);
}

// Start App
updateUI();