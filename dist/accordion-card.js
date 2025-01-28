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
        this.cardHelpers = await window.loadCardHelpers();
        this.render();
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
            allow_minimize = false,
            allow_maximize = false,
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
                }
                .accordion-filter {
                    cursor: pointer;
                    padding: 5px 15px;
                    border: 1px solid var(--divider-color);
                    border-radius: 4px;
                    background: ${filter_button_color};
                    color: var(--text-primary-color);
                    font-size: inherit;
                    transition: background 0.3s ease, color 0.3s ease;
                }
                .accordion-filter.active {
                    background: var(--accent-color);
                    color: var(--text-primary-color);
                }
                .accordion-search {
                    padding: 10px;
                    background-color: ${search_background_color};
                }
                .accordion-search input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid var(--divider-color);
                    border-radius: 4px;
                    font-size: ${search_font_size};
                    background: var(--card-background-color);
                    color: var(--primary-text-color);
                }
                .accordion-item {
                    border-bottom: 1px solid var(--divider-color);
                }
                .accordion-header {
                    background-color: ${header_color_closed};
                    height: ${height};
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 10px;
                    cursor: pointer;
                    color: ${title_color};
                    font-size: ${title_size};
                    transition: background-color 0.3s ease;
                }
                .accordion-header.open {
                    background-color: ${header_color_open};
                }
                .accordion-body {
                    background-color: ${background_closed};
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease, opacity 0.3s ease;
                }
                .accordion-body.open {
                    background-color: ${background_open};
                    max-height: 500px;
                    opacity: 1;
                }
                .arrow {
                    transition: transform 0.3s ease;
                    margin-left: 8px;
                }
                .arrow.open {
                    transform: rotate(90deg);
                }
                .controls {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                .control-button {
                    cursor: pointer;
                    padding: 4px;
                    color: var(--primary-text-color);
                }
            </style>
        `;

        const container = document.createElement("div");
        container.className = "accordion";

        // Add search field if enabled
        if (show_search) {
            const searchBar = document.createElement("div");
            searchBar.className = "accordion-search";

            const searchInput = document.createElement("input");
            searchInput.type = "text";
            searchInput.placeholder = "Search...";
            searchInput.addEventListener("input", (e) => this.applySearch(e.target.value));

            searchBar.appendChild(searchInput);
            container.appendChild(searchBar);
        }

        // Add filters
        if (this.config.filters?.length > 0) {
            const filterBar = document.createElement("div");
            filterBar.className = "accordion-filters";

            this.config.filters.forEach((filter) => {
                const filterButton = document.createElement("button");
                filterButton.className = "accordion-filter";
                filterButton.textContent = filter.name;
                filterButton.addEventListener("click", () => this.applyFilter(filter));
                filterBar.appendChild(filterButton);
            });

            container.appendChild(filterBar);
        }

        // Render accordion items
        this.config.items.forEach((item, index) => {
            const accordionItem = document.createElement("div");
            accordionItem.className = "accordion-item";

            const header = document.createElement("div");
            header.className = "accordion-header";
            header.addEventListener("click", () => this.toggleTab(index, always_open));

            const title = document.createElement("span");
            title.textContent = item.title || `Item ${index + 1}`;
            header.appendChild(title);

            const controls = document.createElement("div");
            controls.className = "controls";

            // Add minimize/maximize buttons if enabled
            if (allow_minimize || allow_maximize) {
                if (allow_minimize) {
                    const minimizeBtn = document.createElement("span");
                    minimizeBtn.className = "control-button minimize";
                    minimizeBtn.textContent = "−";
                    minimizeBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.minimizeAll();
                    });
                    controls.appendChild(minimizeBtn);
                }

                if (allow_maximize) {
                    const maximizeBtn = document.createElement("span");
                    maximizeBtn.className = "control-button maximize";
                    maximizeBtn.textContent = "+";
                    maximizeBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.maximizeAll();
                    });
                    controls.appendChild(maximizeBtn);
                }
            }

            // Add arrow icon if enabled
            if (show_arrow) {
                const arrow = document.createElement("span");
                arrow.className = "arrow";
                arrow.textContent = ">";
                controls.appendChild(arrow);
            }

            header.appendChild(controls);

            const body = document.createElement("div");
            body.className = "accordion-body";

            // Load the card
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
            const isMatch = !filter.condition || 
                (filter.condition && new Function('item', `return ${filter.condition}`)(currentItem));

            item.style.display = isMatch ? "block" : "none";
        });

        // Update active filter button
        const filterButtons = this.shadowRoot.querySelectorAll(".accordion-filter");
        filterButtons.forEach(button => button.classList.remove("active"));
        
        const activeButton = Array.from(filterButtons)
            .find(btn => btn.textContent === filter.name);
        if (activeButton) activeButton.classList.add("active");
    }

    minimizeAll() {
        const headers = this.shadowRoot.querySelectorAll(".accordion-header");
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        const arrows = this.shadowRoot.querySelectorAll(".arrow");

        headers.forEach(header => header.classList.remove("open"));
        bodies.forEach(body => body.classList.remove("open"));
        arrows.forEach(arrow => arrow.classList.remove("open"));
    }

    maximizeAll() {
        const headers = this.shadowRoot.querySelectorAll(".accordion-header");
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");
        const arrows = this.shadowRoot.querySelectorAll(".arrow");

        headers.forEach(header => header.classList.add("open"));
        bodies.forEach(body => body.classList.add("open"));
        arrows.forEach(arrow => arrow.classList.add("open"));
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
