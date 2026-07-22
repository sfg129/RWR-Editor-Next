const TEXT_INPUT_TYPES = new Set(['text', 'number', 'search', 'email', 'url', 'password']);

export function isTextEntryTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('textarea,[contenteditable="true"]')) return true;
  const input = target.closest<HTMLInputElement>('input');
  return Boolean(input && TEXT_INPUT_TYPES.has(input.type));
}

export function isNativeControlTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('button,input,select,textarea,label,[contenteditable="true"]'));
}

export function releasePressedActions<T>(actions: Set<T>): void {
  actions.clear();
}
