class OfflineManager {
    constructor() {
        this.dbName = 'TzotzilBibleDB';
        this.dbVersion = 1;
        this.db = null;
        this.isOnline = navigator.onLine;
        this.setupListeners();
        this.initDatabase();
    }

    setupListeners() {
        window.addEventListener('online', () => this.handleConnectionChange(true));
        window.addEventListener('offline', () => this.handleConnectionChange(false));
    }

    handleConnectionChange(isOnline) {
        this.isOnline = isOnline;
        this.updateUI();
        
        if (isOnline) {
            console.log('Conexión restaurada');
            this.showNotification('Conexión restaurada', 'success');
        } else {
            console.log('Sin conexión - modo offline');
            this.showNotification('Modo offline activado', 'info');
        }
    }

    updateUI() {
        const statusElement = document.getElementById('connection-status');
        if (statusElement) {
            statusElement.textContent = this.isOnline ? 'Online' : 'Offline';
            statusElement.className = this.isOnline ? 'status-online' : 'status-offline';
        }
    }

    showNotification(message, type = 'info') {
        if (typeof createToast === 'function') {
            createToast(message, type);
        }
    }

    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('Error abriendo IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('IndexedDB inicializada correctamente');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                if (!db.objectStoreNames.contains('bible')) {
                    const bibleStore = db.createObjectStore('bible', { keyPath: 'id' });
                    bibleStore.createIndex('book', 'book', { unique: false });
                    bibleStore.createIndex('chapter', 'chapter', { unique: false });
                }

                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata', { keyPath: 'key' });
                }

                console.log('IndexedDB estructura creada');
            };
        });
    }

    async downloadBibleData() {
        try {
            this.showNotification('Descargando contenido bíblico...', 'info');
            
            const response = await fetch('/api/bible/offline-data');
            if (!response.ok) {
                throw new Error('Error descargando datos');
            }

            const data = await response.json();
            
            await this.saveBibleData(data);
            
            this.showNotification('Biblia descargada exitosamente para uso offline', 'success');
            return true;
            
        } catch (error) {
            console.error('Error descargando Biblia:', error);
            this.showNotification('Error al descargar la Biblia', 'danger');
            return false;
        }
    }

    async saveBibleData(data) {
        if (!this.db) {
            await this.initDatabase();
        }

        const transaction = this.db.transaction(['bible', 'metadata'], 'readwrite');
        const bibleStore = transaction.objectStore('bible');
        const metadataStore = transaction.objectStore('metadata');

        bibleStore.clear();

        const { books, content, last_updated, total_verses } = data;

        for (const book of books) {
            for (const [chapter, verses] of Object.entries(content[book])) {
                for (const verse of verses) {
                    const verseData = {
                        id: `${book}-${chapter}-${verse.verse}`,
                        book: book,
                        chapter: parseInt(chapter),
                        verse: verse.verse,
                        spanish_text: verse.spanish_text,
                        tzotzil_text: verse.tzotzil_text
                    };
                    bibleStore.add(verseData);
                }
            }
        }

        metadataStore.put({ key: 'last_updated', value: last_updated });
        metadataStore.put({ key: 'total_verses', value: total_verses });
        metadataStore.put({ key: 'books', value: books });

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log('Datos bíblicos guardados en IndexedDB');
                resolve();
            };
            transaction.onerror = () => {
                console.error('Error guardando datos:', transaction.error);
                reject(transaction.error);
            };
        });
    }

    async getOfflineBooks() {
        if (!this.db) {
            await this.initDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['metadata'], 'readonly');
            const metadataStore = transaction.objectStore('metadata');
            const request = metadataStore.get('books');

            request.onsuccess = () => {
                const books = request.result ? request.result.value : [];
                resolve(books);
            };

            request.onerror = () => {
                console.error('Error obteniendo libros:', request.error);
                reject(request.error);
            };
        });
    }

    async getOfflineChapter(book, chapter) {
        if (!this.db) {
            await this.initDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['bible'], 'readonly');
            const bibleStore = transaction.objectStore('bible');
            const index = bibleStore.index('book');
            const request = index.getAll(book);

            request.onsuccess = () => {
                const verses = request.result
                    .filter(v => v.chapter === parseInt(chapter))
                    .sort((a, b) => a.verse - b.verse);
                resolve(verses);
            };

            request.onerror = () => {
                console.error('Error obteniendo capítulo:', request.error);
                reject(request.error);
            };
        });
    }

    async checkOfflineData() {
        if (!this.db) {
            await this.initDatabase();
        }

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['metadata'], 'readonly');
            const metadataStore = transaction.objectStore('metadata');
            const request = metadataStore.get('total_verses');

            request.onsuccess = () => {
                const hasData = request.result && request.result.value > 0;
                resolve(hasData);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async clearOfflineData() {
        if (!this.db) {
            await this.initDatabase();
        }

        const transaction = this.db.transaction(['bible', 'metadata'], 'readwrite');
        transaction.objectStore('bible').clear();
        transaction.objectStore('metadata').clear();

        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => {
                console.log('Datos offline eliminados');
                this.showNotification('Datos offline eliminados', 'info');
                resolve();
            };
            transaction.onerror = () => {
                reject(transaction.error);
            };
        });
    }
}

const offlineManager = new OfflineManager();

window.offlineManager = offlineManager;
