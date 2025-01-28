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
        const transitionEffect = this.config.transition_effect || "none"; // Übergangseffekt: none, swipe, zoom
        const headerColorClosed = this.config.header_color_closed || "var(--primary-background-color)";
        const headerColorOpen = this.config.header_color_open || "var(--accent-color)";
        const backgroundClosed = this.config.background_closed || "var(--primary-background-color)";
        const backgroundOpen = this.config.background_open || "var(--secondary-background-color)";
        const titleColor = this.config.title_color || "#000000"; // Titel-Farbe
        const titleSize = this.config.title_size || "16px"; // Titel-Größe
        const tabHeight = this.config.height || "48px"; // Höhe der Tabs
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
                    height: ${tabHeight};
                    padding: 0 10px;
                    cursor: pointer;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    transition: background-color 0.3s ease, height 0.3s ease;
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
                    flex-grow: 1;
                    text-align: left;
                    line-height: ${tabHeight};
                }
                .accordion-icon {
                    display: inline-block;
                    transform: rotate(0deg);
                    transition: transform 0.3s ease;
                }
                .accordion-icon.active {
                    transform: rotate(180deg);
                }
                .accordion-body {
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    background-color: ${backgroundClosed};
                    transform: scale(1);
                    transition: max-height 0.3s ease, opacity 0.3s ease, background-color 0.3s ease;
                }
                .accordion-body.active {
                    max-height: 500px;
                    opacity: 1;
                    background-color: ${backgroundOpen};
                }
                /* Übergangseffekte */
                .accordion-body.transition-swipe {
                    transform: translateX(-100%);
                    opacity: 0;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }
                .accordion-body.active.transition-swipe {
                    transform: translateX(0);
                    opacity: 1;
                }
                .accordion-body.transition-zoom {
                    transform: scale(0.9);
                    opacity: 0;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }
                .accordion-body.active.transition-zoom {
                    transform: scale(1);
                    opacity: 1;
                }
            </style>
        `;

        const accordion = document.createElement("div");
        accordion.className = "accordion";

        this.config.items.forEach((item, index) => {
            const header = document.createElement("div");
            header.className = "accordion-header";
            header.addEventListener("click", () => this.toggleItem(index, alwaysOpen, transitionEffect));

            const title = document.createElement("p");
            title.className = "accordion-title";
            title.textContent = item.title || `Item ${index + 1}`;

            const icon = document.createElement("span");
            icon.className = "accordion-icon";
            icon.innerHTML = "&#9662;"; // Standard-Pfeil

            const body = document.createElement("div");
            body.className = `accordion-body ${animationType} transition-${transitionEffect}`;
            body.dataset.index = index;

            if (item.card) {
                // Asynchron die Karte erstellen
                this.createCard(item.card).then((card) => {
                    if (card) body.appendChild(card);
                });
            }

            header.appendChild(title);
            header.appendChild(icon);

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

    toggleItem(index, alwaysOpen, transitionEffect) {
        const body = this.shadowRoot.querySelector(`.accordion-body[data-index="${index}"]`);
        const header = this.shadowRoot.querySelectorAll(".accordion-header")[index];
        const icon = header.querySelector(".accordion-icon");
        const isActive = body.classList.contains("active");

        if (!alwaysOpen) {
            this.shadowRoot.querySelectorAll(".accordion-body").forEach((el) => el.classList.remove("active"));
            this.shadowRoot.querySelectorAll(".accordion-header").forEach((el) => el.classList.remove("active"));
            this.shadowRoot.querySelectorAll(".accordion-icon").forEach((el) => el.classList.remove("active"));
        }

        if (!isActive || alwaysOpen) {
            body.classList.toggle("active");
            header.classList.toggle("active");
            icon.classList.toggle("active");
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
