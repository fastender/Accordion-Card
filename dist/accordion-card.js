

class AccordionCard extends HTMLElement {
  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    shadow.innerHTML = `
      <style>
        :host {
          --card-background: var(--card-background-color, #fff);
          --card-border-radius: 8px;
          --card-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
          display: block;
        }

        .accordion {
          margin: 16px;
          border-radius: var(--card-border-radius);
          box-shadow: var(--card-shadow);
          overflow: hidden;
          background: var(--card-background);
        }

        .accordion-header {
          padding: 16px;
          font-size: 1.25rem;
          font-weight: bold;
          cursor: pointer;
          background: var(--header-background-color, #f9f9f9);
        }

        .accordion-content {
          overflow: hidden;
          max-height: 0;
          transition: max-height 0.3s ease;
          padding: 0;
          background: var(--content-background-color, #fafafa);
        }

        .accordion.open .accordion-content {
          padding: 16px;
        }

        .card-container {
          padding: 0;
        }

        ::slotted(*) {
          margin-bottom: 16px;
        }
      </style>
      <div class="accordion">
        <div class="accordion-header">${this.getAttribute('title')}</div>
        <div class="accordion-content">
          <div class="card-container">
            <slot></slot>
          </div>
        </div>
      </div>
    `;

    const header = shadow.querySelector('.accordion-header');
    const accordion = shadow.querySelector('.accordion');
    const content = shadow.querySelector('.accordion-content');

    header.addEventListener('click', () => {
      accordion.classList.toggle('open');
      if (accordion.classList.contains('open')) {
        const scrollHeight = content.scrollHeight;
        content.style.maxHeight = `${scrollHeight}px`;
      } else {
        content.style.maxHeight = '0';
      }
    });
  }
}

customElements.define('accordion-card', AccordionCard);
