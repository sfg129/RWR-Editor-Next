export interface AnimationOption {
  id: string;
  label: string;
}

export function filterAnimationOptions(options: AnimationOption[], query: string): AnimationOption[] {
  const keywords = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return options.filter(({ label }) =>
    keywords.every((keyword) => label.toLocaleLowerCase().includes(keyword)),
  );
}

export function populateAnimationOptions(
  select: HTMLSelectElement,
  options: AnimationOption[],
  query: string,
  selectedId: string,
  emptyLabel = '未载入动画文件',
): void {
  const matches = filterAnimationOptions(options, query);
  select.replaceChildren();
  for (const { id, label } of matches) {
    const option = document.createElement('option');
    option.value = id;
    option.textContent = label;
    select.appendChild(option);
  }
  if (!matches.length) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = options.length ? '无匹配动画' : emptyLabel;
    select.appendChild(option);
  }
  select.disabled = !matches.length;
  // Filtering must never implicitly switch the animation being played.
  select.value = matches.some(({ id }) => id === selectedId) ? selectedId : '';
}
