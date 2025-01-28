# Accordion Card for Home Assistant

A custom card that creates an accordion-style expandable/collapsible interface for Home Assistant dashboards. Perfect for organizing multiple cards or information in a clean, structured way.

## Installation

1. Download `accordion-card.js`
2. Add the file to your `www` folder in Home Assistant
3. Add the following to your dashboard resources:
   ```yaml
   url: /local/accordion-card.js
   type: module
   ```

## Usage

Add the card to your dashboard with the type `custom:accordion-card`:

```yaml
type: custom:accordion-card
```

## Configuration Parameters

### Basic Configuration

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| items | array | required | Array of accordion items to display |
| language | string | 'en' | Interface language ('en', 'de', 'fr', 'es', 'it') |
| show_expand_controls | boolean | false | Show expand/collapse all buttons |

### Visual Customization

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| filter_font_size | string | '14px' | Font size for filter buttons |
| filter_background_color | string | var(--primary-background-color) | Background color for filter section |
| filter_button_color | string | var(--secondary-background-color) | Background color for filter buttons |
| search_font_size | string | '14px' | Font size for search input |
| search_background_color | string | var(--primary-background-color) | Background color for search section |
| height | string | '48px' | Height of accordion headers |
| header_color_open | string | var(--primary-background-color) | Background color for open accordion headers |
| header_color_closed | string | var(--primary-background-color) | Background color for closed accordion headers |
| background_open | string | var(--card-background-color) | Background color for open accordion content |
| background_closed | string | var(--card-background-color) | Background color for closed accordion content |
| title_color | string | var(--primary-text-color) | Color for accordion titles |
| title_size | string | '16px' | Font size for accordion titles |

### Functional Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| show_arrow | boolean | true | Show/hide expand arrows |
| show_search | boolean | false | Enable search functionality |
| always_open | boolean | false | Allow multiple sections to be open simultaneously |
| allow_minimize | boolean | false | Allow minimizing all sections |
| allow_maximize | boolean | false | Allow maximizing all sections |

### Filter Configuration

| Parameter | Type | Description |
|-----------|------|-------------|
| filters | array | Array of filter objects |
| filters[].name | string | Display name for the filter |
| filters[].condition | string | Filter condition (e.g., "item.category === 'lights'") |

### Item Configuration

Each item in the `items` array can have the following properties:

| Parameter | Type | Description |
|-----------|------|-------------|
| title | string | Title of the accordion section |
| category | string | Category for filtering |
| card | object | Home Assistant card configuration to be displayed |

## Example Configuration

```yaml
type: custom:accordion-card
show_search: true
show_expand_controls: true
filter_font_size: '16px'
title_size: '18px'
filters:
  - name: "All"
    condition: null
  - name: "Lights"
    condition: "item.category === 'lights'"
  - name: "Climate"
    condition: "item.category === 'climate'"
items:
  - title: "Living Room Lights"
    category: "lights"
    card:
      type: light
      entity: light.living_room
  - title: "Kitchen Temperature"
    category: "climate"
    card:
      type: thermostat
      entity: climate.kitchen
```

## Available Translations

The card automatically supports the following languages:
- English (en)
- German (de)
- French (fr)
- Spanish (es)
- Italian (it)

Translation applies to search placeholder and "All" filter text.

## Styling Notes

- The card uses Home Assistant's CSS variables for consistent theming
- All color parameters accept CSS color values or Home Assistant CSS variables
- Backdrop filters are used for glass-like effects on filters and controls

## Browser Compatibility

- Supports all modern browsers
- Uses standard web components
- Requires browsers with CSS Grid and Flexbox support
- Best viewed in browsers that support backdrop-filter

## Known Limitations

- Internet Explorer is not supported
- Some older browsers might not display backdrop filters
- Performance may vary with large numbers of nested cards
