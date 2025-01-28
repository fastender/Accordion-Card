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

        const style = `
            <style>
                .accordion {
                    font-family: Arial, sans-serif;
                    border: 1px solid var(--divider-color);
                    border-radius: 6px;
                    overflow: hidden;
                }
                .accordion-filters {
                    display: flex;
                    gap: 10px;
                    padding: 10px;
                    margin-bottom: 10px;
                    background-color: var(--primary-background-color);
                }
                .accordion-filter {
                    cursor: pointer;
                    padding: 5px 15px;
                    border: 1px solid var(--divider-color);
                    border-radius: 4px;
                    background: var(--secondary-background-color);
                    color: var(--text-primary-color);
                    font-size: 14px;
                    transition: background 0.3s ease, color 0.3s ease;
                }
                .accordion-filter.active {
                    background: var(--accent-color);
                    color: var(--text-primary-color);
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
                .accordion-header.active {
                    background-color: var(--accent-color);
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

        // Filterleiste hinzufügen, falls definiert
        if (this.config.filters && this.config.filters.length > 0) {
            const filterBar = document.createElement("div");
            filterBar.className = "accordion-filters";

            this.config.filters.forEach((filter) => {
                const filterButton = document.createElement("div");
                filterButton.className = "accordion-filter";
                filterButton.textContent = filter.name;
                filterButton.addEventListener("click", () => this.applyFilter(filter));
                filterBar.appendChild(filterButton);
            });

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
            cardElement.hass = this._hass;
        }

        return cardElement;
    }

    applyFilter(filter) {
        const items = this.shadowRoot.querySelectorAll(".accordion-item");
        items.forEach((item, index) => {
            const currentItem = this.config.items[index];
            const condition = filter.condition || (() => true); // Default: Zeigt alles an
            if (condition(currentItem)) {
                item.style.display = "block";
            } else {
                item.style.display = "none";
            }
        });

        // Setze den aktiven Zustand für die Filterbuttons
        this.shadowRoot.querySelectorAll(".accordion-filter").forEach((btn) => {
            btn.classList.remove("active");
        });
        const activeButton = Array.from(this.shadowRoot.querySelectorAll(".accordion-filter"))
            .find((btn) => btn.textContent === filter.name);
        if (activeButton) activeButton.classList.add("active");
    }

    toggleItem(index) {
        const body = this.shadowRoot.querySelector(`.accordion-body[data-index="${index}"]`);
        const isActive = body.classList.contains("active");

        this.shadowRoot.querySelectorAll(".accordion-body").forEach((el) => el.classList.remove("active"));
        if (!isActive) {
            body.classList.add("active");
        }
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
