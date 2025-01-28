# **Accordion Card for Home Assistant**

The `accordion-card` is a custom Lovelace card for Home Assistant that allows you to display content in an accordion-style layout. It supports filters, global search, tab minimize/maximize functionality, and customizable styling.

---

## **Installation**

1. Download the file `accordion-card.js` and save it to the `config/www` directory in your Home Assistant.
2. Add the card as a resource in your Lovelace configuration:
   ```yaml
   resources:
     - url: /local/accordion-card.js
       type: module
   ```
3. Restart Home Assistant.

---

## **Usage**

Below is an example of how to configure the card in your Lovelace dashboard:

### **Basic Configuration**
```yaml
type: custom:accordion-card
items:
  - title: Living Room Light
    category: lights
    card:
      type: entities
      entities:
        - entity: light.living_room
  - title: Kitchen Blind
    category: cover
    card:
      type: entities
      entities:
        - entity: cover.kitchen_blind
```

---

## **Options**

### **Main Options**

| Option            | Description                                                                         | Type      | Default    |
|-------------------|-------------------------------------------------------------------------------------|-----------|------------|
| `items`           | List of tabs with cards. Each tab can display a custom Lovelace card.              | `array`   | **Required** |
| `filters`         | Defines a filter bar to filter tabs by category.                                   | `array`   | -          |
| `show_search`     | Displays a search bar to filter tabs by title or category.                         | `boolean` | `false`    |
| `allow_minimize`  | Adds a button to minimize all tabs.                                                | `boolean` | `false`    |
| `allow_maximize`  | Adds a button to maximize all tabs.                                                | `boolean` | `false`    |

---

### **Styling Options**

| Option                     | Description                                                   | Type      | Default                           |
|----------------------------|---------------------------------------------------------------|-----------|-----------------------------------|
| `filter_font_size`          | Font size for the filter bar buttons.                        | `string`  | `14px`                            |
| `filter_background_color`   | Background color of the filter bar.                          | `string`  | `var(--primary-background-color)` |
| `filter_button_color`       | Background color of filter buttons.                          | `string`  | `var(--secondary-background-color)` |
| `search_font_size`          | Font size for the search bar text.                           | `string`  | `14px`                            |
| `search_background_color`   | Background color of the search bar.                          | `string`  | `var(--primary-background-color)` |

---

## **Tab Configuration (`items`)**

Each tab is defined as an object inside the `items` array. Below is the structure:

| Option       | Description                                                        | Type      | Required |
|--------------|--------------------------------------------------------------------|-----------|----------|
| `title`      | The title of the tab displayed in the header.                      | `string`  | Yes      |
| `category`   | The category of the tab for filtering purposes.                    | `string`  | No       |
| `card`       | A Lovelace card configuration to display inside the tab.           | `object`  | Yes      |

### **Example**
```yaml
type: custom:accordion-card
items:
  - title: Bedroom Light
    category: lights
    card:
      type: entities
      entities:
        - entity: light.bedroom
  - title: Office Blind
    category: cover
    card:
      type: entities
      entities:
        - entity: cover.office_blind
```

---

## **Filter Configuration**

Filters allow you to display only tabs that belong to a specific category. Define them in the `filters` array.

| Option     | Description                                         | Type      | Required |
|------------|-----------------------------------------------------|-----------|----------|
| `name`     | Name of the filter button displayed in the filter bar. | `string`  | Yes      |
| `category` | The category this filter applies to (e.g., `lights`, `cover`). | `string`  | Yes      |

### **Example**
```yaml
type: custom:accordion-card
filters:
  - name: All
    category: all
  - name: Lights
    category: lights
  - name: Covers
    category: cover
items:
  - title: Living Room Light
    category: lights
    card:
      type: entities
      entities:
        - entity: light.living_room
  - title: Kitchen Blind
    category: cover
    card:
      type: entities
      entities:
        - entity: cover.kitchen_blind
```

---

## **Global Search**

Enable the global search functionality by setting `show_search: true`. The search bar filters tabs based on their title or category.

### **Example**
```yaml
type: custom:accordion-card
show_search: true
items:
  - title: Living Room Light
    category: lights
    card:
      type: entities
      entities:
        - entity: light.living_room
  - title: Kitchen Blind
    category: cover
    card:
      type: entities
      entities:
        - entity: cover.kitchen_blind
```

---

## **Buttons for Minimize and Maximize**

Add buttons to minimize or maximize all tabs by enabling `allow_minimize` and `allow_maximize`.

### **Example**
```yaml
type: custom:accordion-card
allow_minimize: true
allow_maximize: true
items:
  - title: Bedroom Light
    category: lights
    card:
      type: entities
      entities:
        - entity: light.bedroom
  - title: Office Blind
    category: cover
    card:
      type: entities
      entities:
        - entity: cover.office_blind
```

---

## **Translations**

The card supports automatic translations for predefined texts based on the Home Assistant language setting. Supported translations:

- **English**
- **German**

---

## **Features**

- Accordion-style tabs for Lovelace cards.
- Global search to filter tabs dynamically.
- Filters to display specific categories of tabs.
- Minimize and maximize all tabs.
- Fully customizable styling for the filter bar and search bar.
- Supports translations for predefined texts.

