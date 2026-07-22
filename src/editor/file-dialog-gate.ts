export class FileDialogGate {
  private active = false;

  constructor(private readonly onChange: (active: boolean) => void) {}

  tryOpen(): boolean {
    if (this.active) return false;
    this.active = true;
    this.onChange(true);
    return true;
  }

  close(): void {
    if (!this.active) return;
    this.active = false;
    this.onChange(false);
  }

  isOpen(): boolean {
    return this.active;
  }
}
