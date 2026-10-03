import { describe, expect, it } from 'bun:test';
import { populateAnimationOptions } from '../src/editor/animation-options';
import { SearchableAnimationDropdown } from '../src/editor/searchable-animation-dropdown';

function fixture() {
  const root = document.createElement('div');
  root.innerHTML =
    '<select hidden></select><button data-animation-trigger><span data-animation-label></span></button><div data-animation-popup class="hidden"><input data-animation-search type="search"/><div data-animation-list></div></div>';
  document.body.appendChild(root);
  const select = root.querySelector('select')!;
  populateAnimationOptions(
    select,
    [
      { id: '0', label: 'running' },
      { id: '1', label: 'crouch still' },
      { id: '2', label: 'crouch forward' },
    ],
    '',
    '0',
  );
  const dropdown = new SearchableAnimationDropdown(root);
  const popup = document.querySelector<HTMLElement>('[data-animation-popup]')!;
  return { root, select, dropdown, popup, search: popup.querySelector('input')! };
}

describe('searchable animation popup', () => {
  it('puts live filtering inside the popup without changing the selected clip', () => {
    document.body.replaceChildren();
    const { root, select, dropdown, popup, search } = fixture();
    dropdown.open();
    expect(dropdown.isOpen()).toBe(true);
    expect(document.activeElement).toBe(search);
    search.value = 'CROUCH for';
    search.dispatchEvent(new window.Event('input'));
    expect(popup.querySelectorAll('[role="option"]').length).toBe(1);
    expect(select.value).toBe('0');
    popup.querySelector<HTMLButtonElement>('button')!.click();
    expect(select.value).toBe('2');
    expect(root.querySelector('[data-animation-label]')!.textContent).toBe('crouch forward');
    expect(dropdown.isOpen()).toBe(false);
  });
  it('supports keyboard selection and closes on Escape or outside clicks', () => {
    document.body.replaceChildren();
    const { root, dropdown, popup, search } = fixture();
    dropdown.open();
    search.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(document.activeElement).toBe(popup.querySelector('button'));
    popup
      .querySelector('button')!
      .dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(dropdown.isOpen()).toBe(false);
    expect(document.activeElement).toBe(root.querySelector('[data-animation-trigger]'));
    dropdown.open();
    document.body.dispatchEvent(new window.Event('pointerdown', { bubbles: true }));
    expect(dropdown.isOpen()).toBe(false);
  });
  it('disables the trigger when no animations are available', () => {
    document.body.replaceChildren();
    const { root, select, dropdown } = fixture();
    populateAnimationOptions(select, [], '', '');
    dropdown.refresh();
    dropdown.open();
    expect(dropdown.isOpen()).toBe(false);
    expect(root.querySelector<HTMLButtonElement>('[data-animation-trigger]')!.disabled).toBe(true);
  });
});
