// Инициализация карты
const map = L.map('map').setView([56.463610, 84.957846], 10);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Хранилище заметок
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let editingNoteId = null;

// DOM элементы
const notesList = document.getElementById('notesList');
const addNoteBtn = document.getElementById('addNoteBtn');
const noteModal = document.getElementById('noteModal');
const noteText = document.getElementById('noteText');
const noteLat = document.getElementById('noteLat');
const noteLng = document.getElementById('noteLng');
const saveNoteBtn = document.getElementById('saveNoteBtn');
const deleteNoteBtn = document.getElementById('deleteNoteBtn');
const cancelNoteBtn = document.getElementById('cancelNoteBtn');
const modalTitle = document.getElementById('modalTitle');

// Маркеры на карте
const markers = {};

// Инициализация приложения
function init() {
  renderNotes();
  setupEventListeners();
  map.on('moveend', filterNotesByMapBounds);
}

// Настройка обработчиков событий
function setupEventListeners() {
  addNoteBtn.addEventListener('click', () => {
    editingNoteId = null;
    modalTitle.textContent = 'Новая заметка';
    noteText.value = '';
    noteLat.value = '';
    noteLng.value = '';
    deleteNoteBtn.style.display = 'none';
    noteModal.style.display = 'flex';
  });

  saveNoteBtn.addEventListener('click', saveNote);
  deleteNoteBtn.addEventListener('click', deleteNote);
  cancelNoteBtn.addEventListener('click', () => noteModal.style.display = 'none');

  // Обработчик клика по карте для установки координат
  map.on('click', (e) => {
    if (noteModal.style.display === 'flex') {
      noteLat.value = e.latlng.lat.toFixed(6);
      noteLng.value = e.latlng.lng.toFixed(6);
    }
  });
}

// Сохранение заметки
function saveNote() {
  const text = noteText.value.trim();
  const lat = parseFloat(noteLat.value);
  const lng = parseFloat(noteLng.value);

  if (!text || isNaN(lat) || isNaN(lng)) {
    alert('Пожалуйста, заполните все поля корректно');
    return;
  }

  const note = { text, lat, lng };

  if (editingNoteId !== null) {
    // Редактирование существующей заметки
    notes[editingNoteId] = note;
  } else {
    // Добавление новой заметки
    notes.push(note);
  }

  localStorage.setItem('notes', JSON.stringify(notes));
  renderNotes();
  noteModal.style.display = 'none';
}

// Удаление заметки
function deleteNote() {
  if (editingNoteId !== null) {
    notes.splice(editingNoteId, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
    noteModal.style.display = 'none';
  }
}

// Отображение списка заметок
function renderNotes() {
  // Очистка старых маркеров
  Object.values(markers).forEach(marker => map.removeLayer(marker));
  Object.keys(markers).forEach(key => delete markers[key]);

  // Очистка списка
  notesList.innerHTML = '';

  // Фильтрация заметок по видимой области
  filterNotesByMapBounds();

  // Добавление заметок в список и на карту
  notes.forEach((note, index) => {
    // Добавление в список
    const noteElement = document.createElement('div');
    noteElement.className = 'note';
    noteElement.innerHTML = `<p>${note.text}</p><small>${note.lat}, ${note.lng}</small>`;
    noteElement.addEventListener('click', () => editNote(index));
    notesList.appendChild(noteElement);

    // Добавление маркера на карту
    const marker = L.marker([note.lat, note.lng]).addTo(map)
      .bindPopup(note.text);
    markers[index] = marker;
  });
}

// Редактирование заметки
function editNote(index) {
  const note = notes[index];
  editingNoteId = index;
  modalTitle.textContent = 'Редактировать заметку';
  noteText.value = note.text;
  noteLat.value = note.lat;
  noteLng.value = note.lng;
  deleteNoteBtn.style.display = 'inline-block';
  noteModal.style.display = 'flex';
  
  // Центрирование карты на заметке
  map.setView([note.lat, note.lng], map.getZoom());
}

// Фильтрация заметок по видимой области карты
function filterNotesByMapBounds() {
  const bounds = map.getBounds();
  notes.forEach((note, index) => {
    const marker = markers[index];
    const isVisible = bounds.contains([note.lat, note.lng]);
    if (marker) {
      if (isVisible) {
        map.addLayer(marker);
      } else {
        map.removeLayer(marker);
      }
    }
  });
}

// Инициализация приложения
init();

// Service Worker регистрация
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('ServiceWorker registration successful');
    }).catch(err => {
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}