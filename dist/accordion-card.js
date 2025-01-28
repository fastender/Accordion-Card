class AccordionCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
    }

    async setConfig(config) {
        if (!config.items || !Array.isArray(config.items)) {
            throw new Error("You need to define an array of items.");
        }

        this.config = config;

        // Lade die Lovelace-Karten-Helfer
        this.cardHelpers = await window.loadCardHelpers();

        this.render();
    }

    render() {
        if (!this.config) return;

        const filterFontSize = this.config.filter_font_size || "14px";
        const filterBackgroundColor = this.config.filter_background_color || "var(--primary-background-color)";
        const filterButtonColor = this.config.filter_button_color || "var(--secondary-background-color)";
        const searchFontSize = this.config.search_font_size || "14px";
        const searchBackgroundColor = this.config.search_background_color || "var(--primary-background-color)";
        const showSearch = this.config.show_search || false; // Standard: Nicht anzeigen
        const allowMinimize = this.config.allow_minimize || false;
        const allowMaximize = this.config.allow_maximize || false;

        // Texte für Übersetzungen
        const translations = {
            search_placeholder: this.translate("search_placeholder") || "Search by title or category...",
            minimize_all: this.translate("minimize_all") || "Minimize All",
            maximize_all: this.translate("maximize_all") || "Maximize All",
        };

        const style = `
            <style>
                .accordion {
                    border: 1px solid var(--divider-color);
                    border-radius: 6px;
                    overflow: hidden;
                }
                .accordion-filters {
                    display: flex;
                    gap: 10px;
                    padding: 10px;
                    margin-bottom: 10px;
                    background-color: ${filterBackgroundColor};
                    font-size: ${filterFontSize};
                    flex-wrap: wrap;
                }
                .accordion-filter {
                    cursor: pointer;
                    padding: 5px 15px;
                    border: 1px solid var(--divider-color);
                    border-radius: 4px;
                    background: ${filterButtonColor};
                    color: var(--text-primary-color);
                    font-size: inherit;
                    transition: background 0.3s ease, color 0.3s ease;
                }
                .accordion-filter.active {
                    background: var(--accent-color);
                    color: var(--text-primary-color);
                }
                .accordion-search {
                    flex: 1 1 100%;
                    margin-bottom: 10px;
                }
                .accordion-search input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--divider-color);
                    border-radius: 4px;
                    font-size: ${searchFontSize};
                    background-color: ${searchBackgroundColor};
                    outline: none;
                }
                .accordion-item {
                    border-bottom: 1px solid var(--divider-color);
                }
                .accordion-header {
                    background-color: var(--primary-background-color);
                    padding: 10px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.3s ease;
                }
                .accordion-header:hover {
                    filter: brightness(1.1);
                }
                .accordion-title {
                    margin: 0;
                    flex-grow: 1;
                    text-align: left;
                }
                .accordion-body {
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    background-color: var(--primary-background-color);
                    transition: max-height 0.3s ease, opacity 0.3s ease, background-color 0.3s ease;
                }
                .accordion-body.active {
                    max-height: 500px;
                    opacity: 1;
                }
            </style>
        `;

        const container = document.createElement("div");
        container.className = "accordion";

        // Suchleiste hinzufügen (nur wenn aktiviert)
        if (showSearch) {
            const searchBar = document.createElement("div");
            searchBar.className = "accordion-search";

            const searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.placeholder = translations.search_placeholder;
            searchInput.addEventListener("input", (e) => this.applySearch(e.target.value));

            searchBar.appendChild(searchInput);
            container.appendChild(searchBar);
        }

        // Filterleiste oder Minimieren/Maximieren-Buttons hinzufügen
        if (this.config.filters?.length > 0 || allowMinimize || allowMaximize) {
            const filterBar = document.createElement("div");
            filterBar.className = "accordion-filters";

            if (allowMinimize) {
                const minimizeButton = document.createElement("div");
                minimizeButton.className = "accordion-filter";
                minimizeButton.textContent = translations.minimize_all;
                minimizeButton.addEventListener("click", () => this.minimizeAllTabs());
                filterBar.appendChild(minimizeButton);
            }

            if (allowMaximize) {
                const maximizeButton = document.createElement("div");
                maximizeButton.className = "accordion-filter";
                maximizeButton.textContent = translations.maximize_all;
                maximizeButton.addEventListener("click", () => this.maximizeAllTabs());
                filterBar.appendChild(maximizeButton);
            }

            if (this.config.filters?.length > 0) {
                this.config.filters.forEach((filter) => {
                    const filterButton = document.createElement("div");
                    filterButton.className = "accordion-filter";
                    filterButton.textContent = filter.name;
                    filterButton.addEventListener("click", () => this.applyFilter(filter));
                    filterBar.appendChild(filterButton);
                });
            }

            container.appendChild(filterBar);
        }

        // Tabs erstellen
        this.config.items.forEach((item, index) => {
            const header = document.createElement("div");
            header.className = "accordion-header";
            header.addEventListener("click", () => this.toggleItem(index));

            const title = document.createElement("p");
            title.className = "accordion-title";
            title.textContent = item.title || `Item ${index + 1}`;

            const body = document.createElement("div");
            body.className = "accordion-body";
            body.dataset.index = index;

            if (item.card) {
                // Asynchron die Karte erstellen
                this.createCard(item.card).then((card) => {
                    if (card) body.appendChild(card);
                });
            }

            header.appendChild(title);

            const itemContainer = document.createElement("div");
            itemContainer.className = "accordion-item";
            itemContainer.appendChild(header);
            itemContainer.appendChild(body);

            container.appendChild(itemContainer);
        });

        this.shadowRoot.innerHTML = style;
        this.shadowRoot.appendChild(container);
    }

    async createCard(config) {
        if (!this.cardHelpers) {
            this.cardHelpers = await window.loadCardHelpers();
        }

        const cardElement = await this.cardHelpers.createCardElement(config);
        cardElement.setConfig(config);
        if (this._hass) {
            cardElement.hass = hass;
        }

        return cardElement;
    }

    applySearch(searchTerm) {
        const items = this.shadowRoot.querySelectorAll(".accordion-item");
        items.forEach((item, index) => {
            const currentItem = this.config.items[index];
            const title = currentItem.title.toLowerCase();
            const category = currentItem.category?.toLowerCase() || "";
            if (title.includes(searchTerm.toLowerCase()) || category.includes(searchTerm.toLowerCase())) {
                item.style.display = "block";
            } else {
                item.style.display = "none";
            }
        });
    }

    minimizeAllTabs() {
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        bodies.forEach((body) => {
            body.classList.remove("active");
            body.style.maxHeight = "0";
        });
    }

    maximizeAllTabs() {
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        bodies.forEach((body) => {
            body.classList.add("active");
            body.style.maxHeight = "500px"; // Standardhöhe für geöffnete Tabs
        });
    }

    toggleItem(index) {
        const body = this.shadowRoot.querySelector(`.accordion-body[data-index="${index}"]`);
        const isActive = body.classList.contains("active");

        this.shadowRoot.querySelectorAll(".accordion-body").forEach((el) => el.classList.remove("active"));
        if (!isActive) {
            body.classList.add("active");
        }
    }

    translate(key) {
        const translations = {
            search_placeholder: {
                en: "Search by title or category...",
                de: "Suche nach Titel oder Kategorie...",
            },
            minimize_all: {
                en: "Minimize All",
                de: "Alle minimieren",
            },
            maximize_all: {
                en: "Maximize All",
                de: "Alle maximieren",
            },
        };
        const lang = this._hass?.language || "en";
        return translations[key]?.[lang] || translations[key]?.en;
    }

    set hass(hass) {
        this._hass = hass;
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        bodies.forEach((body) => {
            const index = body.dataset.index;
            const item = this.config.items[index];
            if (item.card) {
                const card = body.firstElementChild;
                if (card) card.hass = hass;
            }
        });
    }

    getCardSize() {
        return this.config.items.length || 1;
    }
}

customElements.define("accordion-card", AccordionCard);
