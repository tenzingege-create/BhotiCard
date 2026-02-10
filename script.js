// 1. DATA STORAGE
let words = JSON.parse(localStorage.getItem('bodhiCards_v3')) || [
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
    try {
        if (typeof Wylie !== 'undefined') {
            document.getElementById('new-tib').value = Wylie.reformatWylie(input);
        }
    } catch (err) { console.log("Processing stack..."); }
}

// 3. UI ENGINE
function updateUI() {
    if (filteredWords.length === 0) {
        document.getElementById('tibetan-word').innerText = "Empty";
        document.getElementById('english-word').innerText = "No words here";
        document.getElementById('display-img').style.display = "none";
        return;
    }
    const current = filteredWords[currentIndex];
    document.getElementById('tibetan-word').innerText = current.tib;
    document.getElementById('english-word').innerText = current.eng;
    document.getElementById('display-cat').innerText = current.category;
    
    const imgEl = document.getElementById('display-img');
    imgEl.src = current.img || "";
    imgEl.style.display = current.img ? "inline-block" : "none";
    
    localStorage.setItem('bodhiCards_v3', JSON.stringify(words));
}

// 4. AUDIO
async function startRecording() {
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
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('record-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'none';
}

// 5. APP ACTIONS
function addNewWord() {
    const tib = document.getElementById('new-tib').value;
    const eng = document.getElementById('new-eng').value;
    const cat = document.getElementById('new-cat').value;
    const img = document.getElementById('new-img').value;

    if (tib && eng && tempAudioData) {
        words.push({ tib, eng, category: cat, img, audio: tempAudioData });
        tempAudioData = null;
        document.getElementById('wylie-input').value = '';
        document.getElementById('record-status').innerText = "Voice: Not Sampled";
        filterCategory('All');
        alert("Saved to " + cat + "!");
    } else { alert("Record voice first!"); }
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
    if (filteredWords[currentIndex].audio) new Audio(filteredWords[currentIndex].audio).play();
}

// 6. DATA BRIDGE
function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(words));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", "bodhi_backup.json");
    dlAnchor.click();
}

function importData(event) {
    const reader = new FileReader();
    reader.onload = (e) => {
        words = JSON.parse(e.target.result);
        filterCategory('All');
        alert("Backup Loaded!");
    };
    reader.readAsText(event.target.files[0]);
}

updateUI();