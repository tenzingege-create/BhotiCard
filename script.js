// 1. DATA SETUP
let words = JSON.parse(localStorage.getItem('bodhiCardsData')) || [
    { tib: "བཀྲ་ཤིས་བདེ་ལེགས།", eng: "Hello", category: "General", img: "", audio: null }
];
let filteredWords = [...words];
let currentIndex = 0;
let mediaRecorder;
let audioChunks = [];
let tempAudioData = null;

// 2. WYLIE TRANSCODER
const wylieMap = {
    'ka': 'ཀ', 'kha': 'ཁ', 'ga': 'ག', 'nga': 'ང',
    'ca': 'ཅ', 'cha': 'ཆ', 'ja': 'ཇ', 'nya': 'ཉ',
    'ta': 'ཏ', 'tha': 'ཐ', 'da': 'ད', 'na': 'ན',
    'pa': 'པ', 'pha': 'ཕ', 'ba': 'བ', 'ma': 'མ',
    'tsa': 'ཙ', 'tsha': 'ཚ', 'dza': 'ཛ', 'wa': 'ཝ',
    'zha': 'ཞ', 'za': 'ཟ', "'a": 'འ', 'ya': 'ཡ',
    'ra': 'ར', 'la': 'ལ', 'sha': 'ཤ', 'sa': 'ས', 'ha': 'ཧ', 'a': 'ཨ'
};

function convertWylie() {
    let input = document.getElementById('wylie-input').value.toLowerCase();
    let result = "";
    let syllables = input.split(' ');
    syllables.forEach(s => {
        if (wylieMap[s]) result += wylieMap[s] + "་";
        else if (s.length > 0) result += s;
    });
    document.getElementById('new-tib').value = result;
}

// 3. UI UPDATE
function updateUI() {
    if (filteredWords.length === 0) {
        document.getElementById('tibetan-word').innerText = "Empty";
        document.getElementById('english-word').innerText = "No words in this category";
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
    localStorage.setItem('bodhiCardsData', JSON.stringify(words));
}

// 4. RECORDING LOGIC
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
    } catch (err) { alert("Mic access denied!"); }
}

function stopRecording() {
    mediaRecorder.stop();
    document.getElementById('record-btn').style.display = 'inline-block';
    document.getElementById('stop-btn').style.display = 'none';
}

// 5. CRUD OPERATIONS
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
        alert("Saved!");
    } else { alert("Please fill text and record voice!"); }
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

updateUI();