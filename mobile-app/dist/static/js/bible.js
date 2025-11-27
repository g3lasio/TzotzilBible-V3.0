document.addEventListener("DOMContentLoaded", function () {
    try {
        console.log("Starting initialization...");
        
        // Inicializar componentes principales
        const components = [
            { name: 'Verse Actions', fn: initializeVerseActions },
            { name: 'Chapter Navigation', fn: initializeChapterNavigation },
            { name: 'Verse Highlighting', fn: setupVerseHighlighting },
            { name: 'Error Handling', fn: setupErrorHandling },
            { name: 'Click Outside Handler', fn: setupClickOutsideHandler },
            { name: 'Language Toggle', fn: initializeLanguageToggle },
            { name: 'Version Selector', fn: initializeVersionSelector }
        ];

        components.forEach(component => {
            try {
                component.fn();
                console.log(`${component.name} initialized successfully`);
            } catch (err) {
                console.error(`Error initializing ${component.name}:`, err);
            }
        });

        console.log("All initializers have been called successfully");
    } catch (error) {
        console.error("Critical error during initialization:", error);
        // Mostrar mensaje de error al usuario
        const errorDiv = document.getElementById('error-message') || document.createElement('div');
        errorDiv.id = 'error-message';
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = 'Error al cargar la página. Por favor, recarga la página.';
        document.body.insertBefore(errorDiv, document.body.firstChild);
    }
});;

function initializeLanguageToggle() {
    const toggle = document.getElementById('languageToggle');
    const verseContainer = document.querySelector('.verse-container');
    
    if (!toggle || !verseContainer) {
        console.error('Language toggle elements not found - skipping initialization');
        return;
    }

    const updateLanguageDisplay = (showBoth) => {
        try {
            // SOLO actualizar el contenido de los versos, NO los headers
            verseContainer.querySelectorAll('.verse-content').forEach(content => {
                const tzotzilText = content.querySelector('.verse-text.tzotzil');
                const spanishText = content.querySelector('.verse-text.spanish');
                
                // Agregar/quitar clase para controlar la línea separadora
                if (showBoth) {
                    content.classList.add('bilingual-mode');
                    content.classList.remove('spanish-only');
                } else {
                    content.classList.remove('bilingual-mode');
                    content.classList.add('spanish-only');
                }
                
                if (tzotzilText) {
                    tzotzilText.style.display = showBoth ? 'block' : 'none';
                }
                if (spanishText && !showBoth) {
                    spanishText.style.width = '100%';
                    spanishText.style.gridColumn = '1 / -1';
                } else if (spanishText) {
                    spanishText.style.width = '';
                    spanishText.style.gridColumn = '';
                }
            });

            // NO modificar los headers - mantenerlos siempre visibles y fijos
            // Los headers permanecen intactos para que el toggle no se mueva

            localStorage.setItem('languageMode', showBoth ? 'both' : 'spanish');
            console.log(`Changed to ${showBoth ? 'bilingual' : 'spanish'} mode successfully`);
        } catch (error) {
            console.error('Error updating language display:', error);
        }
    };

    // Limpiar listeners anteriores
    const handleChange = () => updateLanguageDisplay(toggle.checked);
    toggle.removeEventListener('change', handleChange);
    toggle.addEventListener('change', handleChange);

    // Establecer estado inicial
    const savedMode = localStorage.getItem('languageMode') || 'both';
    toggle.checked = savedMode === 'both';
    updateLanguageDisplay(toggle.checked);
}

function initializeVerseActions() {
    console.log("Initializing Verse Actions...");

    // Handle more options button clicks
    document
        .querySelectorAll(".verse-actions-wrapper .more-options")
        .forEach((btn) => {
            btn.addEventListener("click", function (e) {
                e.stopPropagation();
                const menuId = this.dataset.menuId;
                if (!menuId) {
                    console.error(
                        "Menu ID is missing from more-options button",
                    );
                    return;
                }
                toggleOptionsMenu(menuId);
            });
        });

    // Handle highlight actions
    document
        .querySelectorAll(".options-menu .action-btn.highlight")
        .forEach((btn) => {
            btn.addEventListener("click", function (e) {
                e.preventDefault();
                e.stopPropagation();

                const verseRow = this.closest(".verse-row");
                if (!verseRow || !verseRow.id) {
                    console.error("Could not find verse row or ID");
                    return;
                }

                const verseId = verseRow.id.replace("verse-", "");
                handleHighlightOptions(verseId);
            });
        });

    // Handle share actions
    document
        .querySelectorAll(".options-menu .action-btn.share")
        .forEach((btn) => {
            btn.addEventListener("click", async function (e) {
                e.preventDefault();
                e.stopPropagation();

                const verseRow = this.closest(".verse-row");
                if (!verseRow || !verseRow.id) {
                    console.error("Could not find verse row or ID");
                    return;
                }

                const verseId = verseRow.id.replace("verse-", "");
                try {
                    await handleShare(verseId);
                } catch (error) {
                    console.error("Error handling share:", error);
                    showErrorToast("Failed to share verse");
                }
            });
        });
}

function handleHighlightOptions(verseId) {
    console.log(`Handling highlight action for verse ID: ${verseId}`);

    const verseRow = document.getElementById(`verse-${verseId}`);
    if (!verseRow) {
        showErrorToast("Could not find verse row");
        console.error(
            "No verse row element found with ID:",
            `verse-${verseId}`,
        );
        return;
    }

    // Buscando elementos de texto del versículo
    const verseTextElements = verseRow.querySelectorAll(".verse-text");
    if (verseTextElements.length === 0) {
        showErrorToast("No verse text elements found to highlight.");
        console.error("No elements found with class '.verse-text'");
        return;
    }

    const colors = [
        { name: "yellow", hex: "#ffd700" },
        { name: "blue", hex: "#90cdf4" },
        { name: "green", hex: "#68d391" },
        { name: "red", hex: "#fc8181" },
        { name: "purple", hex: "#d6bcfa" },
    ];

    // Crear menú de selección de color si no existe
    let colorMenu = verseRow.querySelector(".highlight-colors");
    if (!colorMenu) {
        colorMenu = document.createElement("div");
        colorMenu.className = "highlight-colors";
        colorMenu.style.cssText = `
            position: absolute;
            display: flex;
            gap: 0.5rem;
            padding: 0.5rem;
            background: var(--bg-darker);
            border: 1px solid var(--glow-primary);
            border-radius: 8px;
            z-index: 1000;
        `;

        // Crear los botones de colores
        colors.forEach((color) => {
            const button = document.createElement("button");
            button.className = "color-option";
            button.style.cssText = `
                width: 24px;
                height: 24px;
                border-radius: 50%;
                border: none;
                background-color: ${color.hex};
                cursor: pointer;
                transition: transform 0.2s;
            `;

            button.addEventListener("click", () => {
                verseTextElements.forEach((el) => {
                    el.style.backgroundColor = color.hex;
                });
                colorMenu.remove();
            });

            colorMenu.appendChild(button);
        });

        const rect = verseRow.getBoundingClientRect();
        colorMenu.style.top = `${rect.top + window.scrollY + 40}px`;
        colorMenu.style.left = `${rect.left + 20}px`;
        document.body.appendChild(colorMenu);
    } else {
        colorMenu.remove();
    }
}

async function handleShare(verseId) {
    const verseRow = document.getElementById(`verse-${verseId}`);
    if (!verseRow) {
        throw new Error("Could not find verse");
    }

    const verseTexts = verseRow.querySelectorAll(".verse-text");
    const verseNumber = verseRow.querySelector(".verse-number")?.textContent;
    const bookChapter = document.querySelector("h1")?.textContent;

    if (!verseNumber || !bookChapter) {
        throw new Error("Missing verse information");
    }

    const shareText =
        `${bookChapter}:${verseNumber}\n\n` +
        Array.from(verseTexts)
            .map((v) => v.textContent.trim())
            .join("\n\n") +
        "\n\nShared from Tzotzil Bible";

    try {
        await navigator.clipboard.writeText(shareText);
        showSuccessToast("Verse copied to clipboard");
    } catch (error) {
        throw new Error("Failed to copy verse to clipboard");
    } finally {
        closeAllMenus();
    }
}

function toggleOptionsMenu(menuId) {
    const menu = document.getElementById(menuId);
    if (!menu) {
        console.error("Menu not found:", menuId);
        return;
    }

    const isVisible = menu.style.display === "block";
    closeAllMenus();

    if (!isVisible) {
        menu.style.display = "block";
    }
}

function closeAllMenus() {
    document
        .querySelectorAll(".options-menu, .highlight-colors")
        .forEach((menu) => {
            menu.style.display = "none";
        });
}

function setupClickOutsideHandler() {
    document.addEventListener("click", function (e) {
        if (!e.target.closest(".verse-actions-wrapper")) {
            closeAllMenus();
        }
    });
}

function setupVerseHighlighting() {
    document.querySelectorAll(".verse-row").forEach((row) => {
        row.addEventListener("click", function (e) {
            // Solo abrir el menú de colores si el clic no ocurre en un botón ya existente
            if (
                !e.target.closest(".verse-actions-wrapper") &&
                !e.target.closest(".highlight-colors")
            ) {
                handleHighlightOptions(row.dataset.verseId);
            }
        });
    });
}

function initializeChapterNavigation() {
    // Usar los nuevos selectores para el header rediseñado
    const prevButton = document.querySelector('.arrow-btn.prev');
    const nextButton = document.querySelector('.arrow-btn.next');
    
    if (prevButton) {
        prevButton.addEventListener("click", () => {
            const prevChapter = prevButton.dataset.chapter;
            const book = prevButton.dataset.book;
            navigateToChapter(book, prevChapter);
        });
    }

    if (nextButton) {
        nextButton.addEventListener("click", () => {
            const nextChapter = nextButton.dataset.chapter;
            const book = nextButton.dataset.book;
            navigateToChapter(book, nextChapter);
        });
    }
}

function navigateToChapter(book, chapter) {
    if (!book || !chapter) {
        console.error("Invalid book or chapter data");
        return;
    }
    window.location.href = `/chapter/${book}/${chapter}`;
}

function setupErrorHandling() {
    window.addEventListener("error", function (e) {
        console.error("Global error:", e.error);
        showErrorToast("An unexpected error occurred");
    });
}

function showSuccessToast(message) {
    if (window.createToast) {
        window.createToast(message, "success");
    } else {
        console.log("Success:", message);
    }
}

function showErrorToast(message) {
    if (window.createToast) {
        window.createToast(message, "danger");
    } else {
        console.error("Error:", message);
    }
}

// Function to initialize version selector
function initializeVersionSelector() {
    const versionButton = document.getElementById('versionButton');
    const versionDropdown = document.getElementById('versionDropdown');
    const versionSelector = document.getElementById('versionSelector');
    
    if (!versionButton || !versionDropdown) {
        return; // No hay selector en esta página
    }
    
    let currentVersion = 'rv1960';
    
    // Toggle dropdown al hacer click en el botón
    versionButton.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = versionDropdown.classList.contains('active');
        
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });
    
    // Manejar clicks en items del dropdown
    versionDropdown.addEventListener('click', function(e) {
        const versionItem = e.target.closest('.version-item');
        
        if (!versionItem) return;
        
        // Si está bloqueada, mostrar mensaje
        if (versionItem.classList.contains('locked')) {
            showComingSoonMessage();
            return;
        }
        
        // Cambiar versión activa
        const newVersion = versionItem.dataset.version;
        if (newVersion !== currentVersion) {
            // Remover active de todos
            versionDropdown.querySelectorAll('.version-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Agregar active al nuevo
            versionItem.classList.add('active');
            
            // Actualizar texto del botón
            const versionText = versionButton.querySelector('.version-text');
            versionText.textContent = versionItem.textContent.trim().replace('PRONTO', '').trim();
            
            currentVersion = newVersion;
            
            // Aquí se puede agregar lógica futura para cambiar de versión
        }
        
        closeDropdown();
    });
    
    // Cerrar dropdown al hacer click fuera
    document.addEventListener('click', function(e) {
        if (!versionSelector.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Soporte para teclado
    versionButton.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            versionButton.click();
        }
    });
    
    versionDropdown.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeDropdown();
            versionButton.focus();
        }
    });
    
    function openDropdown() {
        versionDropdown.classList.add('active');
        versionButton.setAttribute('aria-expanded', 'true');
    }
    
    function closeDropdown() {
        versionDropdown.classList.remove('active');
        versionButton.setAttribute('aria-expanded', 'false');
    }
}

function showComingSoonMessage() {
    // Crear elemento de mensaje temporal
    const message = document.createElement('div');
    message.className = 'coming-soon-toast';
    message.innerHTML = '<i class="bi bi-info-circle"></i> Próximamente disponible';
    message.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 243, 255, 0.95);
        color: #0d1117;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        font-family: 'Poppins', sans-serif;
        font-weight: 600;
        font-size: 0.95rem;
        box-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    document.body.appendChild(message);
    
    // Agregar animación de entrada
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(400px);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Remover después de 2.5 segundos
    setTimeout(() => {
        message.style.transition = 'all 0.3s ease-out';
        message.style.transform = 'translateX(400px)';
        message.style.opacity = '0';
        setTimeout(() => {
            document.body.removeChild(message);
            document.head.removeChild(style);
        }, 300);
    }, 2500);
}

// Function to load a random promise
async function loadRandomPromise() {
    try {
        const response = await fetch("/random_promise");
        if (!response.ok) {
            throw new Error("Error al cargar la promesa");
        }

        const data = await response.json();
        if (data.status === "success") {
            const promiseText = document.getElementById("random-promise-text");
            const promiseBackground = document.getElementById("promise-background");
            
            if (promiseText && promiseBackground) {
                promiseText.innerText = data.verse_text;
                promiseBackground.style.backgroundImage = `url(${data.background_image})`;
            }
        } else {
            const promiseText = document.getElementById("random-promise-text");
            if (promiseText) {
                promiseText.innerText = "No se pudo cargar la promesa, intente más tarde";
            }
        }
    } catch (error) {
        console.error("Error en loadRandomPromise:", error);
        const promiseText = document.getElementById("random-promise-text");
        if (promiseText) {
            promiseText.innerText = "Error al cargar la promesa";
        }
    }
}

// Initialize page-specific components when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Only initialize verse actions if we're on a page with verses
    if (document.querySelector(".verse-actions-wrapper")) {
        initializeVerseActions();
        setupVerseHighlighting();
    }

    // Only initialize chapter navigation if we're on a chapter page
    if (document.querySelector(".navigation-buttons")) {
        initializeChapterNavigation();
    }

    // Global initializations
    setupErrorHandling();
    setupClickOutsideHandler();

    // Initialize random promise if we're on the index page
    if (document.getElementById("random-promise-text")) {
        loadRandomPromise();
    }

    console.log("DOM fully loaded and parsed, all initializers have been called.");
});