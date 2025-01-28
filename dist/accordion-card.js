class AccordionCard extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: "open" });
        this._favorites = new Set();
    }

    async setConfig(config) {
        if (!config.items || !Array.isArray(config.items)) {
            throw new Error("You need to define an array of items.");
        }

        this.config = {
            // Existing defaults
            filter_font_size: "14px",
            filter_background_color: "var(--primary-background-color)",
            filter_button_color: "var(--secondary-background-color)",
            search_font_size: "14px",
            search_background_color: "var(--primary-background-color)",
            height: "48px",
            header_color_open: "var(--primary-background-color)",
            header_color_closed: "var(--primary-background-color)",
            background_open: "var(--card-background-color)",
            background_closed: "var(--card-background-color)",
            title_color: "var(--primary-text-color)",
            title_size: "16px",
            show_arrow: true,
            show_search: false,
            always_open: false,
            
            // New design options
            card_radius: "6px",
            header_radius: "4px",
            use_shadow: true,
            header_gradient: false,
            animation_speed: "0.3s",
            hover_effect: true,
            show_status: true,
            show_quick_actions: true,
            show_favorite_button: true,
            group_by_room: false,
            
            ...config
        };

        this.cardHelpers = await window.loadCardHelpers();
        this.render();
    }

    // Color helper function
    darkenColor(color, percent) {
        if (color.startsWith('var(')) return color;
        
        let R = parseInt(color.substring(1,3),16);
        let G = parseInt(color.substring(3,5),16);
        let B = parseInt(color.substring(5,7),16);

        R = parseInt(R * (100 - percent) / 100);
        G = parseInt(G * (100 - percent) / 100);
        B = parseInt(B * (100 - percent) / 100);

        R = (R<255)?R:255;  
        G = (G<255)?G:255;  
        B = (B<255)?B:255;  

        const RR = ((R.toString(16).length==1)?"0"+R.toString(16):R.toString(16));
        const GG = ((G.toString(16).length==1)?"0"+G.toString(16):G.toString(16));
        const BB = ((B.toString(16).length==1)?"0"+B.toString(16):B.toString(16));

        return "#"+RR+GG+BB;
    }

    // Group items by room
    groupItemsByRoom() {
        const groups = {};
        this.config.items.forEach(item => {
            const room = item.room || 'Other';
            if (!groups[room]) groups[room] = [];
            groups[room].push(item);
        });
        return groups;
    }

    // Get entity status
    getItemStatus(item) {
        if (!this._hass || !item.card || !item.card.entities) return false;
        
        const entity = Array.isArray(item.card.entities) 
            ? item.card.entities[0]
            : (typeof item.card.entities === 'string' ? item.card.entities : null);
            
        if (!entity) return false;
        
        const entityId = typeof entity === 'string' ? entity : entity.entity;
        const state = this._hass.states[entityId];
        
        return state && state.state !== 'off' && state.state !== 'unavailable';
    }

    // Create quick action buttons
    createQuickActions(item) {
        const quickActions = document.createElement("div");
        quickActions.className = "quick-actions";

        if (item.card && item.card.entities) {
            const entity = Array.isArray(item.card.entities) 
                ? item.card.entities[0] 
                : item.card.entities;
            
            const entityId = typeof entity === 'string' ? entity : entity.entity;
            const domain = entityId.split('.')[0];

            if (domain === 'light') {
                const toggleBtn = document.createElement("div");
                toggleBtn.className = "quick-action-btn";
                toggleBtn.textContent = "Toggle";
                toggleBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    this.toggleEntity(entityId);
                });
                quickActions.appendChild(toggleBtn);
            }
            
            if (domain === 'cover') {
                ['Up', 'Stop', 'Down'].forEach(action => {
                    const btn = document.createElement("div");
                    btn.className = "quick-action-btn";
                    btn.textContent = action;
                    btn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        this.controlCover(entityId, action.toLowerCase());
                    });
                    quickActions.appendChild(btn);
                });
            }
        }

        return quickActions;
    }

    // Toggle entity state
    toggleEntity(entityId) {
        if (!this._hass) return;
        this._hass.callService('homeassistant', 'toggle', {
            entity_id: entityId
        });
    }

    // Control cover
    controlCover(entityId, action) {
        if (!this._hass) return;
        this._hass.callService('cover', action, {
            entity_id: entityId
        });
    }

    // Toggle favorite status
    toggleFavorite(index) {
        if (this._favorites.has(index)) {
            this._favorites.delete(index);
        } else {
            this._favorites.add(index);
        }
        this.render();
    }

    // Search functionality
    applySearch(term) {
        const items = this.shadowRoot.querySelectorAll(".accordion-item");
        term = term.toLowerCase().trim();

        items.forEach((item, index) => {
            const currentItem = this.config.items[index];
            const title = (currentItem.title || '').toLowerCase();
            const category = (currentItem.category || '').toLowerCase();
            const room = (currentItem.room || '').toLowerCase();
            
            const match = title.includes(term) || 
                         category.includes(term) || 
                         room.includes(term);
                         
            item.style.display = match ? "block" : "none";
            
            // Hide room groups if all items in the group are hidden
            if (this.config.group_by_room) {
                const roomGroup = item.closest('.room-group');
                if (roomGroup) {
                    const visibleItems = Array.from(roomGroup.querySelectorAll('.accordion-item'))
                        .some(i => i.style.display !== 'none');
                    roomGroup.style.display = visibleItems ? "block" : "none";
                }
            }
        });
    }

    // Filter functionality
    applyFilter(filter) {
        const items = this.shadowRoot.querySelectorAll(".accordion-item");

        items.forEach((item, index) => {
            const currentItem = this.config.items[index];
            let isMatch = true;

            if (filter.name === 'Alle') {
                isMatch = true;
            } else if (filter.condition) {
                // Parse the condition string
                const condition = filter.condition.replace(/['"]/g, '');
                const [property, value] = condition.split('===').map(s => s.trim());
                const itemValue = currentItem[property.split('.')[1]];
                isMatch = itemValue === value;
            }

            item.style.display = isMatch ? "block" : "none";

            // Update room group visibility
            if (this.config.group_by_room) {
                const roomGroup = item.closest('.room-group');
                if (roomGroup) {
                    const visibleItems = Array.from(roomGroup.querySelectorAll('.accordion-item'))
                        .some(i => i.style.display !== 'none');
                    roomGroup.style.display = visibleItems ? "block" : "none";
                }
            }
        });

        // Update active filter button
        const filterButtons = this.shadowRoot.querySelectorAll(".accordion-filter");
        filterButtons.forEach(button => button.classList.remove("active"));
        
        const activeButton = Array.from(filterButtons)
            .find(btn => btn.textContent === filter.name);
        if (activeButton) activeButton.classList.add("active");
    }

    // Card creation
    async createCard(config) {
        if (!this.cardHelpers) {
            this.cardHelpers = await window.loadCardHelpers();
        }

        const cardElement = await this.cardHelpers.createCardElement(config);
        cardElement.hass = this._hass;
        cardElement.setConfig(config);

        return cardElement;
    }

    // Tab toggle
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

    // HASS connection
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

        // Update status indicators if needed
        if (this.config.show_status) {
            const items = this.shadowRoot.querySelectorAll(".accordion-item");
            items.forEach((item, index) => {
                const status = item.querySelector(".status-indicator");
                if (status) {
                    const isActive = this.getItemStatus(this.config.items[index]);
                    status.className = "status-indicator " + (isActive ? "active" : "inactive");
                }
            });
        }
    }

    getCardSize() {
        return this.config.items.length || 1;
    }
}

customElements.define("accordion-card", AccordionCard);
