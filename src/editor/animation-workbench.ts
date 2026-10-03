/** Keeps the full-width heading, animated panel and keyboard accessibility in sync. */
export class AnimationWorkbench {
  private open = false;

  constructor(
    private readonly root: HTMLElement,
    private readonly trigger: HTMLButtonElement,
    private readonly content: HTMLElement,
    private readonly onChange: (open: boolean) => void,
  ) {
    this.sync();
    trigger.addEventListener('click', () => this.setOpen(!this.isOpen()));
  }

  isOpen(): boolean {
    return this.open;
  }

  setOpen(open: boolean): void {
    if (this.isOpen() === open) return;
    this.open = open;
    this.sync();
    this.onChange(open);
  }

  private sync(): void {
    const open = this.isOpen();
    if (!open && this.content.contains(document.activeElement)) this.trigger.focus();
    this.root.classList.toggle('workspace-expanded', open);
    this.trigger.setAttribute('aria-expanded', String(open));
    this.content.toggleAttribute('inert', !open);
    this.content.setAttribute('aria-hidden', String(!open));
  }
}
