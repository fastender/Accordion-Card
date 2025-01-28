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

    render() {
        const style = `
            <style>
                .accordion {
                    border: 1px solid var(--divider-color);
                    border-radius: ${this.config.card_radius};
                    overflow: hidden;
                    ${this.config.use_shadow ? 'box-shadow: 0 2px 6px rgba(0,0,0,0.1);' : ''}
                }

                .accordion-filters {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 10px;
                    padding: 10px;
                    background-color: ${this.config.filter_background_color};
                    font-size: ${this.config.filter_font_size};
                }

                .accordion-filter {
                    cursor: pointer;
                    padding: 8px 16px;
                    border: 1px solid var(--divider-color);
                    border-radius: ${this.config.header_radius};
                    background: ${this.config.filter_button_color};
                    color: var(--text-primary-color);
                    font-size: inherit;
                    transition: all ${this.config.animation_speed} ease;
                }

                ${this.config.hover_effect ? `
                .accordion-filter:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                ` : ''}

                .accordion-filter.active {
                    background: var(--accent-color);
                    color: var(--text-primary-color);
                }

                .accordion-search {
                    padding: 10px;
                    background-color: ${this.config.search_background_color};
                }

                .accordion-search input {
                    box-sizing: border-box;
                    width: 100%;
                    padding: 10px;
                    border: 1px solid var(--divider-color);
                    border-radius: ${this.config.header_radius};
                    font-size: ${this.config.search_font_size};
                    background: var(--card-background-color);
                    color: var(--primary-text-color);
                    transition: all ${this.config.animation_speed} ease;
                }

                .accordion-search input:focus {
                    outline: none;
                    border-color: var(--accent-color);
                    box-shadow: 0 0 0 2px rgba(var(--accent-color-rgb), 0.2);
                }

                .accordion-item {
                    margin-bottom: 8px;
                    border-radius: ${this.config.header_radius};
                    ${this.config.use_shadow ? 'box-shadow: 0 1px 3px rgba(0,0,0,0.1);' : ''}
                }

                .accordion-header {
                    background-color: ${this.config.header_color_closed};
                    ${this.config.header_gradient ? `
                    background-image: linear-gradient(to right, ${this.config.header_color_closed}, ${this.darkenColor(this.config.header_color_closed, 10)});
                    ` : ''}
                    height: ${this.config.height};
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 15px;
                    cursor: pointer;
                    color: ${this.config.title_color};
                    font-size: ${this.config.title_size};
                    border-radius: ${this.config.header_radius};
                    transition: all ${this.config.animation_speed} ease;
                }

                .accordion-header:hover {
                    ${this.config.hover_effect ? 'transform: translateX(2px);' : ''}
                }

                .accordion-header.open {
                    background-color: ${this.config.header_color_open};
                    ${this.config.header_gradient ? `
                    background-image: linear-gradient(to right, ${this.config.header_color_open}, ${this.darkenColor(this.config.header_color_open, 10)});
                    ` : ''}
                }

                .header-content {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    width: 100%;
                    gap: 10px;
                }

                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }

                .status-indicator {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    margin-right: 8px;
                }

                .status-indicator.active {
                    background-color: var(--success-color, #4CAF50);
                }

                .status-indicator.inactive {
                    background-color: var(--warning-color, #FFA726);
                }

                .quick-actions {
                    display: flex;
                    gap: 8px;
                }

                .quick-action-btn {
                    padding: 4px 8px;
                    border-radius: ${this.config.header_radius};
                    background: rgba(var(--accent-color-rgb), 0.1);
                    color: var(--accent-color);
                    font-size: 12px;
                    cursor: pointer;
                    transition: all ${this.config.animation_speed} ease;
                }

                .quick-action-btn:hover {
                    background: rgba(var(--accent-color-rgb), 0.2);
                }

                .favorite-btn {
                    cursor: pointer;
                    color: var(--warning-color, #FFA726);
                    opacity: 0.5;
                    transition: opacity ${this.config.animation_speed} ease;
                }

                .favorite-btn.active {
                    opacity: 1;
                }

                .room-label {
                    font-size: 12px;
                    color: var(--secondary-text-color);
                    background: rgba(var(--accent-color-rgb), 0.1);
                    padding: 2px 6px;
                    border-radius: 3px;
                }

                .arrow {
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform ${this.config.animation_speed} ease;
                    color: var(--primary-text-color);
                    opacity: 0.7;
                }

                .arrow.open {
                    transform: rotate(90deg);
                }

                .accordion-body {
                    background-color: ${this.config.background_closed};
                    max-height: 0;
                    opacity: 0;
                    overflow: hidden;
                    transition: all ${this.config.animation_speed} ease;
                    border-radius: 0 0 ${this.config.header_radius} ${this.config.header_radius};
                }

                .accordion-body.open {
                    background-color: ${this.config.background_open};
                    max-height: 500px;
                    opacity: 1;
                    padding: 10px;
                }

                .room-group {
                    margin: 16px 0;
                }

                .room-group-title {
                    font-size: 18px;
                    color: var(--primary-text-color);
                    margin-bottom: 8px;
                    padding-left: 10px;
                }
            </style>
        `;

        const container = document.createElement("div");
        container.className = "accordion";

        // Add search
        if (this.config.show_search) {
            container.appendChild(this.createSearchBar());
        }

        // Add filters
        if (this.config.filters?.length > 0) {
            container.appendChild(this.createFilterBar());
        }

        // Group items by room if enabled
        if (this.config.group_by_room) {
            const groupedItems = this.groupItemsByRoom();
            for (const [room, items] of Object.entries(groupedItems)) {
                const roomGroup = document.createElement("div");
                roomGroup.className = "room-group";
                
                const roomTitle = document.createElement("div");
                roomTitle.className = "room-group-title";
                roomTitle.textContent = room;
                roomGroup.appendChild(roomTitle);

                items.forEach((item, index) => {
                    roomGroup.appendChild(this.createAccordionItem(item, index));
                });

                container.appendChild(roomGroup);
            }
        } else {
            // Regular rendering
            this.config.items.forEach((item, index) => {
                container.appendChild(this.createAccordionItem(item, index));
            });
        }

        this.shadowRoot.innerHTML = style;
        this.shadowRoot.appendChild(container);
    }

    createSearchBar() {
        const searchBar = document.createElement("div");
        searchBar.className = "accordion-search";

        const searchInput = document.createElement("input");
        searchInput.type = "text";
        searchInput.placeholder = "Search...";
        searchInput.addEventListener("input", (e) => this.applySearch(e.target.value));

        searchBar.appendChild(searchInput);
        return searchBar;
    }

    createFilterBar() {
        const filterBar = document.createElement("div");
        filterBar.className = "accordion-filters";

        this.config.filters.forEach((filter) => {
            const filterButton = document.createElement("button");
            filterButton.className = "accordion-filter";
            filterButton.textContent = filter.name;
            filterButton.addEventListener("click", () => this.applyFilter(filter));
            filterBar.appendChild(filterButton);
        });

        return filterBar;
    }

    createAccordionItem(item, index) {
        const accordionItem = document.createElement("div");
        accordionItem.className = "accordion-item";

        const header = document.createElement("div");
        header.className = "accordion-header";

        const headerContent = document.createElement("div");
        headerContent.className = "header-content";

        // Left side of header
        const headerLeft = document.createElement("div");
        headerLeft.className = "header-left";

        // Status indicator
        if (this.config.show_status) {
            const status = document.createElement("div");
            status.className = "status-indicator " + (this.getItemStatus(item) ? "active" : "inactive");
            headerLeft.appendChild(status);
        }

        // Title
        const title = document.createElement("span");
        title.textContent = item.title || `Item ${index + 1}`;
        headerLeft.appendChild(title);

        // Room label if not grouped
        if (!this.config.group_by_room && item.room) {
            const roomLabel = document.createElement("span");
            roomLabel.className = "room-label";
            roomLabel.textContent = item.room;
            headerLeft.appendChild(roomLabel);
        }

        headerContent.appendChild(headerLeft);

        // Right side of header
        const headerRight = document.createElement("div");
        headerRight.className = "header-right";

        // Quick actions
        if (this.config.show_quick_actions) {
            const quickActions = this.createQuickActions(item);
            headerRight.appendChild(quickActions);
        }

        // Favorite button
        if (this.config.show_favorite_button) {
            const favButton = document.createElement("div");
            favButton.className = "favorite-btn" + (this._favorites.has(index) ? " active" : "");
            favButton.innerHTML = '★';
            favButton.addEventListener("click", (e) => {
                e.stopPropagation();
                this.toggleFavorite(index);
            });
            headerRight.appendChild(favButton);
        }

        // Arrow
        if (this.config.show_arrow) {
            const arrow = document.createElement("div");
            arrow.className = "arrow";
            arrow.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8.59,16.58L13.17,12L8.59,7.41L10,6L16,12L10,18L8.59,16.58Z"></path></svg>';
            headerRight.appendChild(arrow);
        }

        headerContent.appendChild(headerRight);
        header.appendChild(headerContent);

        header.addEventListener("click", () => this.toggleTab(index, this.config.always_open));

        const body = document.createElement("div");
        body.className = "accordion-body";

        if (item.card) {
            this.createCard(item.card).then((card) => {
                if (card) body.appendChild(card);
            });
        }

        accordionItem.appendChild(header);
        accordionItem.appendChild(body);
        return
