// Data Storage Keys
const STORAGE_KEY = 'bodhiCards_v4';

let words = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
    { tib: "བཀྲ་ཤིས་བདེ་ལེགས།", eng: "Hello", category: "Basic", img: "", audio: null }
];
let filteredWords = [...words];
let currentIndex = 0;
let mediaRecorder;
let audioChunks = [];
let tempAudioData = null;

// The Conversion Function
function convertWylie() {
    let input = document.getElementById('wylie-input').value;
    const outputField = document.getElementById('new-tib');
    
    // Check if the external library 'Wylie' is loaded
    if (typeof Wylie !== 'undefined') {
        outputField.value = Wylie.reformatWylie(input);
    } else {
        outputField.value = "Library Error: Check Internet Connection";
    }
}

function updateUI() {
    if (filteredWords.length === 0) {
        document.getElementById('tibetan-word').innerText = "Empty";
        document.getElementById('english-word').innerText = "Add words in Admin section";
        document.getElementById('display-img').style.display = "none";
        document.getElementById('display-cat').innerText = "";
        return;
    }
    const current = filteredWords[currentIndex];
    document.getElementById('tibetan-word').innerText = current.tib;
    document.getElementById('english-word').innerText = current.eng;
    document.getElementById('display-cat').innerText = current.category;
    
    const imgEl = document.getElementById('display-img');
    if (current.img) {
        imgEl.src = current.img;
        imgEl.style.display = "inline-block";
    } else {
        imgEl.style.display = "none";
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
}

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
    } catch (err) { alert("Mic Access Required!"); }
}

function stopRecording() {
    if(mediaRecorder) mediaRecorder.stop();
    document.getElementById('record-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'none';
}

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
    } else { alert("Fill all fields and Record Voice!"); }
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
    if (words.length > 1) {
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
        try {
            words = JSON.parse(e.target.result);
            filterCategory('All');
            alert("Success!");
        } catch (err) { alert("Invalid File"); }
    };
    reader.readAsText(event.target.files[0]);
}

updateUI();