type KeyState = Pick<KeyboardEvent, 'code' | 'key' | 'ctrlKey' | 'altKey' | 'metaKey'>;

function physicalKey(event: KeyState): string {
  return event.code || event.key.toLowerCase();
}

function modifiers(event: KeyState): string {
  // Shift is a camera speed modifier, not a different held direction.
  return `${event.ctrlKey}:${event.altKey}:${event.metaKey}`;
}

export class HeldActions<T> {
  private readonly keys = new Map<string, { action: T; modifiers: string }>();

  press(event: KeyState, action: T): void {
    this.reconcile(event);
    this.keys.set(physicalKey(event), { action, modifiers: modifiers(event) });
  }

  release(event: KeyState): void {
    // Never rematch a released key against the current shortcut modifiers.
    this.keys.delete(physicalKey(event));
    this.reconcile(event);
  }

  reconcile(event: KeyState): void {
    const current = modifiers(event);
    for (const [key, held] of this.keys) {
      if (held.modifiers !== current) this.keys.delete(key);
    }
  }

  has(action: T): boolean {
    for (const held of this.keys.values()) if (held.action === action) return true;
    return false;
  }

  clear(): void {
    this.keys.clear();
  }
}
