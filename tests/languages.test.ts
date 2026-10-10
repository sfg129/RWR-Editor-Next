import { beforeEach, describe, expect, it } from 'bun:test';
import { loadSettings, saveSettings } from '../src/config/settings';
import {
  completeLanguageChoice,
  languages,
  initialLanguage,
  matchLanguage,
  needsLanguageChoice,
} from '../src/i18n/languages';
import { dynamicTranslations } from '../src/i18n/dynamic-translations';
import { patterns, translate } from '../src/i18n/runtime';
import { messageKey, translatedLanguages, translations } from '../src/i18n/translations';

describe('language selection', () => {
  beforeEach(() => localStorage.clear());
  it('supports nine persisted languages with Simplified Chinese as the default', () => {
    expect(languages).toHaveLength(9);
    expect(loadSettings().language).toBe('zh-CN');
    for (const language of languages) {
      saveSettings({ ...loadSettings(), language: language.code });
      expect(loadSettings().language).toBe(language.code);
    }
    localStorage.setItem('rwr-editor-settings-v1', JSON.stringify({ language: 'invalid' }));
    expect(loadSettings().language).toBe('zh-CN');
  });
  it('prompts existing users once without resetting their other preferences', () => {
    saveSettings({ ...loadSettings(), theme: 'light', fontSize: 19, language: 'en' });
    expect(needsLanguageChoice()).toBe(true);
    completeLanguageChoice();
    expect(needsLanguageChoice()).toBe(false);
    expect(loadSettings()).toMatchObject({ theme: 'light', fontSize: 19, language: 'en' });
  });
  it('uses a fixed language-code order and region-matched first-launch defaults', () => {
    expect(languages.map((item) => item.code)).toEqual([
      'de',
      'en',
      'es',
      'fr',
      'ja',
      'pt',
      'ru',
      'zh-CN',
      'zh-TW',
    ]);
    for (const [locale, code] of [
      ['es-MX', 'es'],
      ['pt-BR', 'pt'],
      ['de-DE', 'de'],
      ['ja-JP', 'ja'],
    ] as const) {
      expect(initialLanguage(locale)).toBe(code);
    }
    expect(matchLanguage('zh-Hant-TW')).toBe('zh-TW');
    expect(matchLanguage('zh_SG')).toBe('zh-CN');
    expect(initialLanguage('zh-CN')).toBe('zh-CN');
    expect(initialLanguage('zh-HK')).toBe('zh-TW');
    expect(initialLanguage('ru-RU')).toBe('ru');
    expect(initialLanguage('it-IT')).toBe('zh-CN');
    expect(initialLanguage('')).toBe('zh-CN');
    expect(new Set(languages.map((item) => item.code)).size).toBe(9);
  });
});

describe('localized catalogs', () => {
  it('has every dynamic translation with matching placeholder numbers', () => {
    for (const [, template] of patterns) {
      expect(dynamicTranslations.has(template)).toBe(true);
      const placeholders = (text: string) => [...text.matchAll(/\$(\d+)/g)].map((match) => match[1]).sort();
      for (const language of translatedLanguages) {
        expect(placeholders(dynamicTranslations.get(template)![language]!)).toEqual(placeholders(template));
      }
    }
    for (const translationsByLanguage of translations.values()) {
      for (const code of translatedLanguages)
        expect(translationsByLanguage[code]?.trim().length).toBeGreaterThan(0);
    }
  });
  it('covers all visible component text, placeholders and accessible labels', async () => {
    const paths = await Array.fromAsync(new Bun.Glob('src/components/*.vue').scan('.'));
    const missing = new Set<string>();
    for (const path of paths) {
      const source = await Bun.file(path).text();
      const template = source.match(/<template>([\s\S]*?)<\/template>/)?.[1] ?? '';
      const host = document.createElement('div');
      host.innerHTML = template;
      const walker = document.createTreeWalker(host, 0x1 | 0x4);
      let node = walker.nextNode();
      while (node) {
        const parent = node instanceof Element ? node : node.parentElement;
        if (!parent?.closest('[data-no-localize]')) {
          const currentNode = node;
          const values =
            currentNode instanceof Element
              ? ['title', 'aria-label', 'placeholder'].map(
                  (attribute) => currentNode.getAttribute(attribute) ?? '',
                )
              : [(currentNode.textContent ?? '').trim()];
          for (const value of values) {
            if (
              /\p{Script=Han}/u.test(value) &&
              !translations.has(messageKey(value)) &&
              !patterns.some(([pattern]) => pattern.test(value))
            )
              missing.add(value);
          }
        }
        node = walker.nextNode();
      }
    }
    expect([...missing]).toEqual([]);
  });
  it('preserves filenames and values, and translates tool names inside status text', () => {
    for (const code of translatedLanguages) {
      expect(translate('已保存：C:/模型/人物.xml', code)).toContain('C:/模型/人物.xml');
      expect(translate('已选择 12 个体素', code)).toContain('12');
      expect(translate('工具：修改', code)).toContain(translate('修改', code));
      expect(translate('动画名称', code)).not.toBe('动画名称');
    }
  });
});
