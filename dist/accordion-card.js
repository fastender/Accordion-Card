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

        // Load Lovelace card helpers
        this.cardHelpers = await window.loadCardHelpers();

        this.render();
    }

    render() {
        if (!this.config) return;

        const {
            title_size = "16px",
            title_color = "var(--primary-text-color)",
            header_color_open = "var(--primary-background-color)",
            header_color_closed = "var(--primary-background-color)",
            background_open = "var(--card-background-color)",
            background_closed = "var(--card-background-color)",
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
                    flex-wrap: wrap;
                }
                .accordion-header {
                    background-color: ${header_color_closed};
                    padding: 10px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.3s ease;
                }
                .accordion-header.open {
                    background-color: ${header_color_open};
                }
                .accordion-title {
                    margin: 0;
                    color: ${title_color};
                    font-size: ${title_size};
                    flex-grow: 1;
                    text-align: left;
                }
                .accordion-body {
                    background-color: ${background_closed};
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    transition: max-height 0.3s ease, opacity 0.3s ease, background-color 0.3s ease;
                }
                .accordion-body.open {
                    background-color: ${background_open};
                    max-height: 500px;
                    opacity: 1;
                }
            </style>
        `;

        const container = document.createElement("div");
        container.className = "accordion";

        // Add minimize and maximize buttons
        if (allow_minimize || allow_maximize) {
            const controls = document.createElement("div");
            controls.className = "accordion-filters";

            if (allow_minimize) {
                const minimizeButton = document.createElement("button");
                minimizeButton.textContent = "Minimize All";
                minimizeButton.addEventListener("click", () => this.minimizeAllTabs());
                controls.appendChild(minimizeButton);
            }

            if (allow_maximize) {
                const maximizeButton = document.createElement("button");
                maximizeButton.textContent = "Maximize All";
                maximizeButton.addEventListener("click", () => this.maximizeAllTabs());
                controls.appendChild(maximizeButton);
            }

            container.appendChild(controls);
        }

        // Render tabs
        this.config.items.forEach((item, index) => {
            const header = document.createElement("div");
            header.className = "accordion-header";
            header.addEventListener("click", () => this.toggleTab(index, always_open));

            const title = document.createElement("p");
            title.className = "accordion-title";
            title.textContent = item.title || `Item ${index + 1}`;

            const body = document.createElement("div");
            body.className = "accordion-body";

            // Load the card
            if (item.card) {
                this.createCard(item.card).then((card) => {
                    if (card) body.appendChild(card);
                });
            }

            header.appendChild(title);
            container.appendChild(header);
            container.appendChild(body);
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

    toggleTab(index, alwaysOpen) {
        const headers = this.shadowRoot.querySelectorAll(".accordion-header");
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");

        const isOpen = bodies[index].classList.contains("open");

        if (!alwaysOpen) {
            bodies.forEach((body, i) => {
                if (i !== index) body.classList.remove("open");
            });
            headers.forEach((header, i) => {
                if (i !== index) header.classList.remove("open");
            });
        }

        if (isOpen) {
            bodies[index].classList.remove("open");
            headers[index].classList.remove("open");
        } else {
            bodies[index].classList.add("open");
            headers[index].classList.add("open");
        }
    }

    minimizeAllTabs() {
        const headers = this.shadowRoot.querySelectorAll(".accordion-header");
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");

        headers.forEach((header) => header.classList.remove("open"));
        bodies.forEach((body) => body.classList.remove("open"));
    }

    maximizeAllTabs() {
        const headers = this.shadowRoot.querySelectorAll(".accordion-header");
        const bodies = this.shadowRoot.querySelectorAll(".accordion-body");

        headers.forEach((header) => header.classList.add("open"));
        bodies.forEach((body) => body.classList.add("open"));
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
