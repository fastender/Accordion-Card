class AccordionCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        // Get Home Assistant language
        this.ha_language = document.querySelector("home-assistant")?.hass?.language || 'en';
        // Add translations
        this.translations = {
            en: {
                search: "Search...",
                all: "All"
            },
            de: {
                search: "Suchen...",
                all: "Alle"
            },
            fr: {
                search: "Rechercher...",
                all: "Tout"
            },
            es: {
                search: "Buscar...",
                all: "Todo"
            },
            it: {
                search: "Cerca...",
                all: "Tutto"
            }
        };
    }

    async setConfig(config) {
        if (!config.items || !Array.isArray(config.items)) {
            throw new Error("You need to define an array of items.");
        }

        this.config = {
            ...config,
            language: config.language || this.ha_language || 'en', // Use HA language or fallback to en
            show_expand_controls: config.show_expand_controls || false // New option for expand/collapse buttons
        };
        this.cardHelpers = await window.loadCardHelpers();
        this.render();
    }

    expandAll() {
        const headers = this.shadowRoot.querySelectorAll(".accordion-header");
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        const arrows = this.shadowRoot.querySelectorAll(".arrow");
        
        headers.forEach(header => header.classList.add("open"));
        bodies.forEach(body => body.classList.add("open"));
        arrows.forEach(arrow => arrow.classList.add("open"));
    }

    collapseAll() {
        const headers = this.shadowRoot.querySelectorAll(".accordion-header");
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        const arrows = this.shadowRoot.querySelectorAll(".arrow");
        
        headers.forEach(header => header.classList.remove("open"));
        bodies.forEach(body => body.classList.remove("open"));
        arrows.forEach(arrow => arrow.classList.remove("open"));
    }

    
    render() {
        if (!this.config) return;

        const {
            filter_font_size = "14px",
            filter_background_color = "var(--primary-background-color)",
            filter_button_color = "var(--secondary-background-color)",
            search_font_size = "14px",
            search_background_color = "var(--primary-background-color)",
            height = "48px",
            header_color_open = "var(--primary-background-color)",
            header_color_closed = "var(--primary-background-color)",
            background_open = "var(--card-background-color)",
            background_closed = "var(--card-background-color)",
            title_color = "var(--primary-text-color)",
            title_size = "16px",
            show_arrow = true,
            show_search = false,
            always_open = false,
        } = this.config;

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
                    background-color: ${filter_background_color};
                    font-size: ${filter_font_size};
                    overflow-x: auto;
                    scrollbar-width: none; /* Firefox */
                    -ms-overflow-style: none; /* IE and Edge */
                    scroll-behavior: smooth;
                    -webkit-overflow-scrolling: touch;
                    white-space: nowrap;
                    font-family: var(--paper-font-headline_-_font-family);
                }
                
                /* Hide scrollbar for Chrome, Safari and Opera */
                .accordion-filters::-webkit-scrollbar {
                    display: none;
                }
                
                /* Touch scroll indicators */
                .accordion-filters-container {
                    position: relative;
                }
                
                .scroll-indicator {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 32px;
                    height: 32px;
                    background: color-mix(in srgb, var(--card-background-color) 80%, transparent);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 1;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid var(--divider-color);
                }
                
                .scroll-indicator.left {
                    left: 0;
                }
                
                .scroll-indicator.right {
                    right: 0;
                }
                
                .scroll-indicator.visible {
                    opacity: 1;
                }
                
                .scroll-indicator svg {
                    width: 24px;
                    height: 24px;
                    fill: var(--primary-text-color);
                }
                .accordion-filter {
                    cursor: pointer;
                    padding: 5px 15px;
                    border: 1px solid var(--divider-color);
                    border-radius: 4px;
                    background: ${filter_button_color};
                    color: var(--text-primary-color);
                    font-size: inherit;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    font-family: var(--paper-font-headline_-_font-family);
                }
                .accordion-filter.active {
                    background: var(--text-primary-color);
                    color: ${filter_button_color};
                    border-color: var(--text-primary-color);
                }
                .accordion-search {
                    padding: 10px;
                    background-color: ${search_background_color};
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                .accordion-control-button {
                    width: 32px;
                    height: 32px;
                    border-radius: 4px;
                    border: 1px solid var(--divider-color);
                    background: color-mix(in srgb, var(--card-background-color) 80%, transparent);
                    color: var(--primary-text-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    transition: opacity 0.3s ease;
                }
                .accordion-control-button svg {
                    width: 20px;
                    height: 20px;
                }
                .accordion-search input {
                    box-sizing: border-box;
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--divider-color);
                    border-radius: 4px;
                    font-size: ${search_font_size};
                    background: var(--card-background-color);
                    color: var(--primary-text-color);
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: var(--paper-font-headline_-_font-family);
                }
                .accordion-search input:focus {
                    border-color: var(--accent-color);
                    box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.1);
                    outline: none;
                }
                .accordion-item {
                    border-bottom: 1px solid var(--divider-color);
                    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .accordion-header {
                    background-color: ${header_color_closed};
                    height: ${height};
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 15px;
                    cursor: pointer;
                    color: ${title_color};
                    font-size: ${title_size};
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    font-family: var(--paper-font-headline_-_font-family);
                }
                .accordion-header:hover {
                    background-color: rgba(var(--accent-color-rgb), 0.05);
                }
                .accordion-header.open {
                    background-color: ${header_color_open};
                }
                .accordion-body {
                    background-color: ${background_closed};
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    will-change: max-height, opacity;
                    font-family: var(--paper-font-headline_-_font-family);
                }
                .accordion-body.open {
                    background-color: ${background_open};
                    max-height: none;
                    opacity: 1;
                }
                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                }
                .arrow {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                    margin-left: 8px;
                    color: var(--primary-text-color);
                    opacity: 0.7;
                }
                .arrow.open {
                    transform: rotate(90deg);
                }
                .arrow svg {
                    width: 18px;
                    height: 18px;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .fade-in {
                    animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
            </style>
        `;

        const container = document.createElement("div");
        container.className = "accordion fade-in";

        // Add search field if enabled
        if (show_search) {
            const searchBar = document.createElement("div");
            searchBar.className = "accordion-search";

            const searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.placeholder = this.translations[this.config.language]?.search || this.translations.en.search;
            searchInput.addEventListener("input", (e) => this.applySearch(e.target.value));

            searchBar.appendChild(searchInput);

            // Add expand/collapse buttons if enabled
            if (this.config.show_expand_controls) {
                const expandButton = document.createElement("button");
                expandButton.className = "accordion-control-button";
                expandButton.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>';
                expandButton.addEventListener("click", () => this.expandAll());
                
                const collapseButton = document.createElement("button");
                collapseButton.className = "accordion-control-button";
                collapseButton.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M19 13H5v-2h14v2z"/></svg>';
                collapseButton.addEventListener("click", () => this.collapseAll());
                
                searchBar.appendChild(expandButton);
                searchBar.appendChild(collapseButton);
            }

            container.appendChild(searchBar);
        }

        // Add filters
        if (this.config.filters?.length > 0) {
            const filterContainer = document.createElement("div");
            filterContainer.className = "accordion-filters-container";

            const filterBar = document.createElement("div");
            filterBar.className = "accordion-filters";

            // Add scroll indicators
            const leftIndicator = document.createElement("div");
            leftIndicator.className = "scroll-indicator left";
            leftIndicator.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6 1.41-1.41z"/></svg>';

            const rightIndicator = document.createElement("div");
            rightIndicator.className = "scroll-indicator right";
            rightIndicator.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>';

            // Add scroll functionality
            this.setupScroll(filterBar, leftIndicator, rightIndicator);

            // Add "All" filter if it doesn't exist
            if (!this.config.filters.some(f => f.name === this.translations[this.config.language]?.all)) {
                const allFilter = {
                    name: this.translations[this.config.language]?.all || this.translations.en.all,
                    condition: null
                };
                filterBar.appendChild(this.createFilterButton(allFilter));
            }

            this.config.filters.forEach((filter) => {
                filterBar.appendChild(this.createFilterButton(filter));
            });

            filterContainer.appendChild(leftIndicator);
            filterContainer.appendChild(filterBar);
            filterContainer.appendChild(rightIndicator);
            container.appendChild(filterContainer);
        }

        // Render accordion items
        this.config.items.forEach((item, index) => {
            const accordionItem = document.createElement("div");
            accordionItem.className = "accordion-item";
            accordionItem.setAttribute('data-category', item.category || '');

            const header = document.createElement("div");
            header.className = "accordion-header";

            const headerContent = document.createElement("div");
            headerContent.className = "header-content";

            const title = document.createElement("span");
            title.textContent = item.title || `Item ${index + 1}`;
            headerContent.appendChild(title);

            if (show_arrow) {
                const arrow = document.createElement("div");
                arrow.className = "arrow";
                arrow.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"></path></svg>';
                headerContent.appendChild(arrow);
            }

            header.appendChild(headerContent);
            header.addEventListener("click", () => this.toggleTab(index, always_open));

            const body = document.createElement("div");
            body.className = "accordion-body";

            if (item.card) {
                this.createCard(item.card).then((card) => {
                    if (card) body.appendChild(card);
                });
            }

            accordionItem.appendChild(header);
            accordionItem.appendChild(body);
            container.appendChild(accordionItem);
        });

        this.shadowRoot.innerHTML = style;
        this.shadowRoot.appendChild(container);

        // Handle initial state
        if (this.config.allow_minimize || this.config.allow_maximize) {
            const allOpen = Array.from(this.shadowRoot.querySelectorAll('.accordion-body'))
                .every(body => body.classList.contains('open'));
            
            if (allOpen && this.config.allow_minimize) {
                this.minimizeAll();
            } else if (!allOpen && this.config.allow_maximize) {
                this.maximizeAll();
            }
        }
    }

    createFilterButton(filter) {
        const filterButton = document.createElement("button");
        filterButton.className = "accordion-filter";
        filterButton.textContent = filter.name;
        filterButton.addEventListener("click", () => this.applyFilter(filter));
        return filterButton;
    }

    setupScroll(filterBar, leftIndicator, rightIndicator) {
        const checkScroll = () => {
            const isScrollable = filterBar.scrollWidth > filterBar.clientWidth;
            const isAtStart = filterBar.scrollLeft <= 0;
            const isAtEnd = filterBar.scrollLeft >= filterBar.scrollWidth - filterBar.clientWidth;

            leftIndicator.classList.toggle('visible', isScrollable && !isAtStart);
            rightIndicator.classList.toggle('visible', isScrollable && !isAtEnd);
        };

        // Initial check
        setTimeout(checkScroll, 100);

        // Check on scroll
        filterBar.addEventListener('scroll', checkScroll);

        // Check on resize
        window.addEventListener('resize', checkScroll);

        // Scroll buttons functionality
        leftIndicator.addEventListener('click', () => {
            filterBar.scrollBy({
                left: -200,
                behavior: 'smooth'
            });
        });

        rightIndicator.addEventListener('click', () => {
            filterBar.scrollBy({
                left: 200,
                behavior: 'smooth'
            });
        });

        // Touch scroll handling
        let isScrolling = false;
        let startX;
        let scrollLeft;

        filterBar.addEventListener('touchstart', (e) => {
            isScrolling = true;
            startX = e.touches[0].pageX - filterBar.offsetLeft;
            scrollLeft = filterBar.scrollLeft;
        });

        filterBar.addEventListener('touchmove', (e) => {
            if (!isScrolling) return;
            e.preventDefault();
            const x = e.touches[0].pageX - filterBar.offsetLeft;
            const walk = (x - startX) * 2;
            filterBar.scrollLeft = scrollLeft - walk;
        });

        filterBar.addEventListener('touchend', () => {
            isScrolling = false;
        });
    }
    async createCard(config) {
        if (!this.cardHelpers) {
            this.cardHelpers = await window.loadCardHelpers();
        }

        const cardElement = await this.cardHelpers.createCardElement(config);
        cardElement.setConfig(config);
        if (this._hass) {
            cardElement.hass = this._hass;
        }

        return cardElement;
    }

    applySearch(term) {
        const items = this.shadowRoot.querySelectorAll(".accordion-item");
        term = term.toLowerCase().trim();

        items.forEach((item, index) => {
            const currentItem = this.config.items[index];
            const title = (currentItem.title || '').toLowerCase();
            const category = (currentItem.category || '').toLowerCase();
            
            const match = title.includes(term) || category.includes(term);
            item.style.display = match ? "block" : "none";
        });
    }

    applyFilter(filter) {
        const items = this.shadowRoot.querySelectorAll(".accordion-item");

        items.forEach((item, index) => {
            const currentItem = this.config.items[index];
            let isMatch = true;

            if (filter.name === 'Alle') {
                isMatch = true;
            } else if (filter.condition) {
                // Vereinfachte Bedingungsprüfung
                const condition = filter.condition.replace(/[()]/g, '').trim();
                const [property, value] = condition.split('===').map(s => s.trim());
                const itemValue = property.split('.')[1]; // Extrahiert 'category' aus 'item.category'
                isMatch = currentItem[itemValue] === value.replace(/['"]/g, '');
            }

            item.style.display = isMatch ? "block" : "none";
        });

        // Update active filter button
        const filterButtons = this.shadowRoot.querySelectorAll(".accordion-filter");
        filterButtons.forEach(button => button.classList.remove("active"));
        
        const activeButton = Array.from(filterButtons)
            .find(btn => btn.textContent === filter.name);
        if (activeButton) activeButton.classList.add("active");
    }

    toggleTab(index, alwaysOpen) {
        const headers = this.shadowRoot.querySelectorAll(".accordion-header");
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        const arrows = this.shadowRoot.querySelectorAll(".arrow");

        if (!alwaysOpen) {
            headers.forEach((header, i) => {
                if (i !== index) header.classList.remove("open");
            });
            bodies.forEach((body, i) => {
                if (i !== index) body.classList.remove("open");
            });
            arrows.forEach((arrow, i) => {
                if (i !== index) arrow.classList.remove("open");
            });
        }

        headers[index].classList.toggle("open");
        bodies[index].classList.toggle("open");
        if (arrows[index]) arrows[index].classList.toggle("open");
    }

    set hass(hass) {
        this._hass = hass;
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        bodies.forEach((body, index) => {
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
