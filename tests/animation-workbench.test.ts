import { describe, expect, it } from 'bun:test';
import { AnimationWorkbench } from '../src/editor/animation-workbench';

function fixture() {
  document.body.innerHTML =
    '<section><button id="toggle">Animation Workbench</button><div id="content"><button>Play</button></div></section>';
  const root = document.querySelector('section')!;
  const toggle = document.querySelector<HTMLButtonElement>('#toggle')!;
  const content = document.querySelector<HTMLElement>('#content')!;
  const changes: boolean[] = [];
  const workbench = new AnimationWorkbench(root, toggle, content, (open) => changes.push(open));
  return { root, toggle, content, changes, workbench };
}

describe('animated animation workbench', () => {
  it('starts closed with hidden, inert controls while keeping the heading usable', () => {
    const { root, toggle, content, changes, workbench } = fixture();
    expect(workbench.isOpen()).toBe(false);
    expect(root.classList.contains('workspace-expanded')).toBe(false);
    expect(content.hasAttribute('inert')).toBe(true);
    expect(content.getAttribute('aria-hidden')).toBe('true');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(toggle.disabled).toBe(false);
    expect(changes).toEqual([]);
  });
  it('opens from the whole heading, returns focus when closing and keeps loaded controls intact', () => {
    const { root, toggle, content, changes, workbench } = fixture();
    toggle.click();
    expect(workbench.isOpen()).toBe(true);
    expect(root.classList.contains('workspace-expanded')).toBe(true);
    expect(content.hasAttribute('inert')).toBe(false);
    expect(content.getAttribute('aria-hidden')).toBe('false');
    content.querySelector('button')!.focus();
    workbench.setOpen(false);
    expect(document.activeElement).toBe(toggle);
    expect(content.querySelector('button')!.textContent).toBe('Play');
    expect(changes).toEqual([true, false]);
    workbench.setOpen(false);
    expect(changes).toEqual([true, false]);
  });
  it('synchronizes programmatic opening and repeated rapid switches', () => {
    const { root, toggle, content, changes, workbench } = fixture();
    workbench.setOpen(true);
    toggle.click();
    toggle.click();
    toggle.click();
    expect(workbench.isOpen()).toBe(false);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(content.hasAttribute('inert')).toBe(true);
    expect(root.classList.contains('workspace-expanded')).toBe(false);
    expect(changes).toEqual([true, false, true, false]);
  });
});
