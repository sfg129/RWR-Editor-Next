import { filterAnimationOptions, type AnimationOption } from './animation-options';

export class SearchableAnimationDropdown {
  private readonly select: HTMLSelectElement;
  private readonly trigger: HTMLButtonElement;
  private readonly label: HTMLElement;
  private readonly search: HTMLInputElement;
  private readonly popup: HTMLElement;
  private readonly list: HTMLElement;
  private options: AnimationOption[] = [];

  constructor(private readonly root: HTMLElement) {
    this.select = root.querySelector('select')!;
    this.trigger = root.querySelector('[data-animation-trigger]')!;
    this.label = root.querySelector('[data-animation-label]')!;
    this.search = root.querySelector('[data-animation-search]')!;
    this.popup = root.querySelector('[data-animation-popup]')!;
    this.list = root.querySelector('[data-animation-list]')!;
    // Escape scrolling/clipping and transformed modal containers.
    document.body.appendChild(this.popup);
    this.trigger.addEventListener('click', () => (this.isOpen() ? this.close() : this.open()));
    this.select.addEventListener('change', () => {
      this.refresh();
      this.close();
    });
    this.search.addEventListener('input', () => this.renderMatches());
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && this.isOpen()) {
        event.preventDefault();
        event.stopPropagation();
        this.close();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        if (!this.isOpen()) {
          this.open();
          return;
        }
        const buttons = Array.from(this.list.querySelectorAll<HTMLButtonElement>('button'));
        const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
        const next =
          event.key === 'ArrowDown'
            ? (current + 1) % buttons.length
            : (current - 1 + buttons.length) % buttons.length;
        buttons[next]?.focus();
      } else if (event.key === 'Enter' && event.target === this.search) {
        event.preventDefault();
        this.list.querySelector<HTMLButtonElement>('button')?.click();
      }
    };
    root.addEventListener('keydown', handleKeyDown);
    this.popup.addEventListener('keydown', handleKeyDown);
    document.addEventListener(
      'pointerdown',
      (event) => {
        if (!root.contains(event.target as Node) && !this.popup.contains(event.target as Node))
          this.close(false);
      },
      { capture: true },
    );
    window.addEventListener('resize', () => this.close(false));
    window.addEventListener(
      'scroll',
      (event) => {
        if (!(event.target instanceof Node) || !this.popup.contains(event.target)) this.close(false);
      },
      { capture: true },
    );
    this.refresh();
  }

  isOpen(): boolean {
    return !this.popup.classList.contains('hidden');
  }

  refresh(): void {
    this.options = Array.from(this.select.options)
      .filter(({ value }) => value !== '')
      .map(({ value, textContent }) => ({ id: value, label: textContent ?? '' }));
    this.trigger.disabled = this.select.disabled || !this.options.length;
    this.label.textContent =
      this.options.find(({ id }) => id === this.select.value)?.label ??
      (this.options.length ? '选择动画' : (this.select.options[0]?.textContent ?? '未载入动画文件'));
    if (this.trigger.disabled) this.close(false);
    if (this.isOpen()) this.renderMatches();
  }

  open(): void {
    this.refresh();
    if (this.trigger.disabled) return;
    this.search.value = '';
    this.renderMatches();
    this.popup.style.width = this.trigger.getBoundingClientRect().width + 'px';
    this.popup.style.maxHeight = Math.min(320, window.innerHeight - 16) + 'px';
    this.popup.classList.remove('hidden');
    this.positionPopup();
    this.trigger.setAttribute('aria-expanded', 'true');
    this.search.focus({ preventScroll: true });
  }

  close(restoreFocus = true): void {
    if (!this.isOpen()) return;
    this.popup.classList.add('hidden');
    this.trigger.setAttribute('aria-expanded', 'false');
    if (restoreFocus) this.trigger.focus({ preventScroll: true });
  }

  private renderMatches(): void {
    this.list.replaceChildren();
    const matches = filterAnimationOptions(this.options, this.search.value);
    for (const { id, label } of matches) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.animationId = id;
      button.setAttribute('role', 'option');
      button.setAttribute('aria-selected', String(id === this.select.value));
      button.addEventListener('click', () => {
        this.select.value = id;
        this.select.dispatchEvent(new window.Event('change', { bubbles: true }));
      });
      this.list.appendChild(button);
    }
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'animation-dropdown-empty';
      empty.textContent = '无匹配动画';
      this.list.appendChild(empty);
    }
    if (this.isOpen()) this.positionPopup();
  }

  private positionPopup(): void {
    const rect = this.trigger.getBoundingClientRect();
    const height = this.popup.getBoundingClientRect().height;
    this.popup.style.left = Math.max(4, Math.min(rect.left, window.innerWidth - rect.width - 4)) + 'px';
    this.popup.style.top =
      Math.max(4, rect.bottom + height + 4 > window.innerHeight ? rect.top - height - 4 : rect.bottom + 4) +
      'px';
  }
}
