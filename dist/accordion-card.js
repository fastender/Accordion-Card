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
                }
                .accordion-header:hover {
                    background-color: var(--secondary-background-color);
                }
                .accordion-body {
                    padding: 10px;
                    display: none;
                    background-color: var(--primary-background-color);
                }
                .accordion-body.active {
                    display: block;
                }
            </style>
        `;

        const accordion = document.createElement("div");
        accordion.className = "accordion";

        this.config.items.forEach((item, index) => {
            const header = document.createElement("div");
            header.className = "accordion-header";
            header.textContent = item.title || `Item ${index + 1}`;
            header.addEventListener("click", () => this.toggleItem(index));

            const body = document.createElement("div");
            body.className = "accordion-body";
            body.dataset.index = index;

            if (item.card) {
                // Erstelle die Karte
                this.createCard(item.card).then((card) => {
                    if (card) body.appendChild(card);
                });
            }

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

        return cardElement;
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
