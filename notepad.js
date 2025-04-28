const NOTES_KEY = 'notion_notes';
let notes = [];
let editIndex = null;

function saveNotes() {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}
function loadNotes() {
    const data = localStorage.getItem(NOTES_KEY);
    notes = data ? JSON.parse(data) : [];
}
function renderNotes() {
    const notesDiv = document.getElementById('notes');
    notesDiv.innerHTML = '';
    notes.forEach((note, idx) => {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.style.background = note.color;
        card.innerHTML = `
            <div class="note-title">${note.title || '(제목 없음)'}</div>
            <div class="note-content">${note.content || ''}</div>
            <div class="note-labels">
                ${(note.labels||[]).map(l => `<span class='label'>${l}</span>`).join('')}
            </div>
            <div class="note-actions">
                <button class="edit" title="수정" onclick="startEdit(${idx})">✏️</button>
                <button class="delete" title="삭제" onclick="deleteNote(${idx})">🗑️</button>
            </div>
        `;
        notesDiv.appendChild(card);
    });
}
function addNote() {
    const title = document.getElementById('newTitle').value.trim();
    const content = document.getElementById('newContent').value.trim();
    const labelStr = document.getElementById('newLabel').value.trim();
    const color = document.getElementById('newColor').value;
    const labels = labelStr ? labelStr.split(',').map(l => l.trim()).filter(l => l) : [];
    if (!title && !content) {
        alert('제목이나 내용을 입력하세요!');
        return;
    }
    if (editIndex !== null) {
        notes[editIndex] = { title, content, labels, color };
        editIndex = null;
    } else {
        notes.unshift({ title, content, labels, color });
    }
    saveNotes();
    renderNotes();
    document.getElementById('newTitle').value = '';
    document.getElementById('newContent').value = '';
    document.getElementById('newLabel').value = '';
    document.getElementById('newColor').value = getRandomColor();
}
function deleteNote(idx) {
    if (confirm('정말 삭제하시겠습니까?')) {
        notes.splice(idx, 1);
        saveNotes();
        renderNotes();
    }
}
function startEdit(idx) {
    const note = notes[idx];
    document.getElementById('newTitle').value = note.title;
    document.getElementById('newContent').value = note.content;
    document.getElementById('newLabel').value = (note.labels||[]).join(', ');
    document.getElementById('newColor').value = note.color;
    editIndex = idx;
}
function getRandomColor() {
    // 파스텔톤 팔레트
    const palette = [
        '#b5ead7', // 민트
        '#c7ceea', // 연보라
        '#ffdac1', // 살구
        '#f3b5e8', // 연분홍
        '#ffb7b2', // 연살구
        '#e2f0cb', // 연연두
        '#a1c4fd', // 연하늘
        '#f8ffae', // 연노랑
        '#ffd6e0', // 연핑크
        '#d4fc79', // 연연두
        '#c1f7d3', // 연민트
        '#f6eac2'  // 연베이지
    ];
    return palette[Math.floor(Math.random()*palette.length)];
}
// 초기화
window.onload = function() {
    loadNotes();
    renderNotes();
    document.getElementById('newColor').value = getRandomColor();
} 