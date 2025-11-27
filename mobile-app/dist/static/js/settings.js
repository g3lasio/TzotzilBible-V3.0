document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log("Iniciando configuración de settings...");
        initializeSettings();
        setupEventListeners();
        setupBackupAndSync();
        setupOfflineMode();
    } catch (error) {
        console.error("Error durante la inicialización:", error);
        window.createToast("Error al cargar la configuración", "error");
    }
});

// Agregar manejador global de errores
window.addEventListener('error', function(event) {
    console.error("Error global:", event.error);
    window.createToast("Error en la aplicación", "error");
});

async function updateSettings(type, settings) {
    try {
        const response = await fetch('/settings', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content
            },
            credentials: 'same-origin',
            body: JSON.stringify({
                type: type,
                ...settings
            }),
            credentials: 'same-origin'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.status === 'success') {
            window.createToast(data.message, 'success');
            return true;
        } else {
            throw new Error(data.message || 'Unknown error occurred');
        }
    } catch (error) {
        console.error(`Error updating ${type} settings:`, error);
        window.createToast(`Error updating ${type} settings: ${error.message}`, 'danger');
        return false;
    }
}

function initializeSettings() {
    // Cargar configuraciones básicas para funcionalidad restante
    console.log("Settings initialized successfully");
}

function setupEventListeners() {
    // Profile form
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            try {
                const response = await fetch('/settings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        type: 'profile',
                        first_name: document.getElementById('profileName').value,
                        phone: document.getElementById('profilePhone').value
                    })
                });
                
                const data = await response.json();
                window.createToast(data.message, data.status === 'success' ? 'success' : 'danger');
            } catch (error) {
                console.error('Error updating profile:', error);
                window.createToast('Error updating profile', 'danger');
            }
        });
    }

    // No theme or reading preference controls needed
    console.log("Event listeners setup completed");
}

// Reading preferences removed as they are not functional



function setupBackupAndSync() {
    const backupBtn = document.querySelector('[data-action="backup"]');
    const restoreBtn = document.querySelector('[data-action="restore"]');
    
    if (backupBtn) {
        backupBtn.addEventListener('click', function() {
            const settings = {
                themeMode: localStorage.getItem('themeMode'),
                fontSize: localStorage.getItem('fontSize'),
                verseNumbers: localStorage.getItem('verseNumbers'),
                parallelView: localStorage.getItem('parallelView'),
                primaryLanguage: localStorage.getItem('primaryLanguage'),
                language: localStorage.getItem('language'),
                bilingualMode: localStorage.getItem('bilingualMode')
            };
            
            const blob = new Blob([JSON.stringify(settings)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'bible_settings_backup.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.createToast('Settings backed up successfully', 'success');
        });
    }
    
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function() {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            input.onchange = function(e) {
                const file = e.target.files[0];
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    try {
                        const settings = JSON.parse(e.target.result);
                        Object.entries(settings).forEach(([key, value]) => {
                            localStorage.setItem(key, value);
                        });
                        initializeSettings();
                        window.createToast('Settings restored successfully', 'success');
                    } catch (error) {
                        console.error('Error restoring settings:', error);
                        window.createToast('Error restoring settings', 'danger');
                    }
                };
                
                reader.readAsText(file);
            };
            
            input.click();
        });
    }
}

function setupOfflineMode() {
    const downloadBtn = document.getElementById('download-offline-btn');
    const checkBtn = document.getElementById('check-offline-btn');
    const clearBtn = document.getElementById('clear-offline-btn');
    const statusDiv = document.getElementById('offline-status');
    const statusText = document.getElementById('offline-status-text');

    function showStatus(message, type = 'info') {
        statusDiv.style.display = 'block';
        statusDiv.className = `alert alert-${type} mb-3`;
        statusText.textContent = message;
    }

    function hideStatus() {
        statusDiv.style.display = 'none';
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', async function() {
            try {
                downloadBtn.disabled = true;
                downloadBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Descargando...';
                
                const success = await window.offlineManager.downloadBibleData();
                
                if (success) {
                    showStatus('✓ Biblia descargada exitosamente para uso offline', 'success');
                } else {
                    showStatus('✗ Error al descargar la Biblia', 'danger');
                }
            } catch (error) {
                console.error('Error:', error);
                showStatus('✗ Error al descargar la Biblia', 'danger');
            } finally {
                downloadBtn.disabled = false;
                downloadBtn.innerHTML = '<i class="bi bi-download me-2"></i>Descargar Biblia Offline';
            }
        });
    }

    if (checkBtn) {
        checkBtn.addEventListener('click', async function() {
            try {
                const hasData = await window.offlineManager.checkOfflineData();
                
                if (hasData) {
                    const books = await window.offlineManager.getOfflineBooks();
                    showStatus(`✓ Datos offline disponibles (${books.length} libros)`, 'success');
                } else {
                    showStatus('✗ No hay datos offline disponibles', 'warning');
                }
            } catch (error) {
                console.error('Error:', error);
                showStatus('✗ Error al verificar datos offline', 'danger');
            }
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener('click', async function() {
            if (confirm('¿Estás seguro de que deseas eliminar todos los datos offline?')) {
                try {
                    clearBtn.disabled = true;
                    await window.offlineManager.clearOfflineData();
                    showStatus('✓ Datos offline eliminados', 'info');
                } catch (error) {
                    console.error('Error:', error);
                    showStatus('✗ Error al eliminar datos offline', 'danger');
                } finally {
                    clearBtn.disabled = false;
                }
            }
        });
    }

    checkBtn?.click();
}

// Additional donation functions removed

// Donation functions removed as per request