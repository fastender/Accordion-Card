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

        const animationType = this.config.animation || "slide"; // Standardanimation
        const headerColorClosed = this.config.header_color_closed || "var(--primary-background-color)";
        const headerColorOpen = this.config.header_color_open || "var(--accent-color)";
        const backgroundClosed = this.config.background_closed || "var(--primary-background-color)";
        const backgroundOpen = this.config.background_open || "var(--secondary-background-color)";
        const titleColor = this.config.title_color || "#000000"; // Titel-Farbe
        const titleSize = this.config.title_size || "16px"; // Titel-Größe
        const alwaysOpen = this.config.always_open || false; // Standardmäßig geschlossen

        const style = `
            <style>
                .accordion {
                    font-family: Arial, sans-serif;
                    border: 1px solid var(--divider-color);
                    border-radius: 6px;
                    overflow: hidden;
                }
                .accordion-item {
                    border-bottom: 1px solid var(--divider-color);
                }
                .accordion-header {
                    background-color: ${headerColorClosed};
                    padding: 10px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.3s ease;
                }
                .accordion-header.active {
                    background-color: ${headerColorOpen};
                }
                .accordion-header:hover {
                    filter: brightness(1.1);
                }
                .accordion-title {
                    color: ${titleColor};
                    font-size: ${titleSize};
                    margin: 0;
                }
                .accordion-body {
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    transform: translateY(-10px);
                    background-color: ${backgroundClosed};
                    transition: max-height 0.3s ease, opacity 0.3s ease, transform 0.3s ease, background-color 0.3s ease;
                }
                .accordion-body.active {
                    max-height: 500px; /* Oder eine ausreichende Höhe */
                    opacity: 1;
                    transform: translateY(0);
                    background-color: ${backgroundOpen};
                }
                /* Pfeil Animation */
                .accordion-arrow {
                    display: inline-block;
                    transform: rotate(0deg);
                    transition: transform 0.3s ease;
                }
                .accordion-arrow.active {
                    transform: rotate(180deg);
                }
            </style>
        `;

        const accordion = document.createElement("div");
        accordion.className = "accordion";

        this.config.items.forEach((item, index) => {
            const header = document.createElement("div");
            header.className = "accordion-header";
            header.addEventListener("click", () => this.toggleItem(index, alwaysOpen));

            const title = document.createElement("p");
            title.className = "accordion-title";
            title.textContent = item.title || `Item ${index + 1}`;

            const arrow = document.createElement("span");
            arrow.className = "accordion-arrow";
            arrow.innerHTML = "&#9662;"; // Standard-Pfeil (kann durch SVG/Icons ersetzt werden)

            const body = document.createElement("div");
            body.className = `accordion-body ${animationType}`;
            body.dataset.index = index;

            if (item.card) {
                // Asynchron die Karte erstellen
                this.createCard(item.card).then((card) => {
                    if (card) body.appendChild(card);
                });
            }

            header.appendChild(title);
            header.appendChild(arrow);

            const itemContainer = document.createElement("div");
            itemContainer.className = "accordion-item";
            itemContainer.appendChild(header);
            itemContainer.appendChild(body);

            accordion.appendChild(itemContainer);
        });

        this.shadowRoot.innerHTML = style;
        this.shadowRoot.appendChild(accordion);
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

    toggleItem(index, alwaysOpen) {
        const body = this.shadowRoot.querySelector(`.accordion-body[data-index="${index}"]`);
        const header = this.shadowRoot.querySelectorAll(".accordion-header")[index];
        const arrow = header.querySelector(".accordion-arrow");
        const isActive = body.classList.contains("active");

        if (!alwaysOpen) {
            this.shadowRoot.querySelectorAll(".accordion-body").forEach((el) => el.classList.remove("active"));
            this.shadowRoot.querySelectorAll(".accordion-header").forEach((el) => el.classList.remove("active"));
            this.shadowRoot.querySelectorAll(".accordion-arrow").forEach((el) => el.classList.remove("active"));
        }

        if (!isActive || alwaysOpen) {
            body.classList.toggle("active");
            header.classList.toggle("active");
            arrow.classList.toggle("active");
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
