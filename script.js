// 1. DATA SETUP
// We use a unique key 'bodhiCards_v2' to avoid conflicts with old, broken data
let words = JSON.parse(localStorage.getItem('bodhiCards_v2')) || [
    { tib: "བཀྲ་ཤིས་བདེ་ལེགས།", eng: "Hello", category: "General", img: "", audio: null }
];
let filteredWords = [...words];
let currentIndex = 0;
let mediaRecorder;
let audioChunks = [];
let tempAudioData = null;

// 2. PROFESSIONAL WYLIE TRANSCODER
// This function now uses the 'Wylie' library we linked in the HTML head
function convertWylie() {
    let input = document.getElementById('wylie-input').value;
    
    // The library handles the complex vertical stacking (stag) and vowels (mig)
    // It is a professional-grade "Transcoder" signal processor.
    try {
        if (typeof Wylie !== 'undefined') {
            let result = Wylie.reformatWylie(input);
            document.getElementById('new-tib').value = result;
        } else {
            console.error("Wylie library not loaded yet.");
        }
    } catch (err) {
        console.log("Waiting for full Wylie input...");
    }
}

// 3. UI UPDATE (The "Screen" Driver)
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
    if (current.img) {
        imgEl.src = current.img;
        imgEl.style.display = "inline-block";
    } else {
        imgEl.style.display = "none";
    }
    // Save to Local Memory
    localStorage.setItem('bodhiCards_v2', JSON.stringify(words));
}

// 4. VOICE RECORDING (Analog-to-Digital)
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
                tempAudioData = reader.result; // Audio stored as a Base64 signal
                document.getElementById('record-status').innerText = "✅ Captured!";
            };
        };
        mediaRecorder.start();
        document.getElementById('record-btn').style.display = 'none';
        document.getElementById('stop-btn').style.display = 'inline-block';
        document.getElementById('record-status').innerText = "🔴 Recording...";
    } catch (err) { alert("Mic access denied!"); }
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('record-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'none';
}

// 5. APP LOGIC (Filter, Save, Delete)
function addNewWord() {
    const tib = document.getElementById('new-tib').value;
    const eng = document.getElementById('new-eng').value;
    const cat = document.getElementById('new-cat').value;
    const img = document.getElementById('new-img').value;

    if (tib && eng && tempAudioData) {
        words.push({ tib, eng, category: cat, img, audio: tempAudioData });
        tempAudioData = null;
        // Reset Inputs
        document.getElementById('wylie-input').value = '';
        document.getElementById('new-tib').value = '';
        document.getElementById('new-eng').value = '';
        document.getElementById('new-img').value = '';
        document.getElementById('record-status').innerText = "Voice: Not Sampled";
        
        filterCategory('All');
        alert("Entry Saved Successfully!");
    } else { 
        alert("Missing Data: You need Tibetan text, English meaning, and a Voice Recording."); 
    }
}

function filterCategory(cat) {
    if (cat === 'All') filteredWords = [...words];
    else filteredWords = words.filter(w => w.category === cat);
    currentIndex = 0;
    updateUI();
}

function deleteCurrentWord() {
    if (words.length > 1) {
        const wordToDelete = filteredWords[currentIndex];
        words = words.filter(w => w !== wordToDelete);
        filterCategory('All');
    }
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

// INITIAL START
updateUI();