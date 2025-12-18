import { describe, it, expect, beforeEach } from 'vitest';
import { setLanguage, t, getAvailableLanguages, getCurrentLanguage } from '../src/utils/i18n.js';

describe('i18n', () => {
    beforeEach(() => {
        // Reset to English before each test
        setLanguage('en');
    });

    describe('setLanguage', () => {
        it('should set language to valid language code', () => {
            setLanguage('vi');
            expect(getCurrentLanguage()).toBe('vi');

            setLanguage('zh');
            expect(getCurrentLanguage()).toBe('zh');

            setLanguage('ja');
            expect(getCurrentLanguage()).toBe('ja');
        });

        it('should extract language from locale string', () => {
            setLanguage('en-US');
            expect(getCurrentLanguage()).toBe('en');

            setLanguage('vi-VN');
            expect(getCurrentLanguage()).toBe('vi');
        });

        it('should keep current language for invalid language code', () => {
            setLanguage('en');
            setLanguage('invalid');
            expect(getCurrentLanguage()).toBe('en');
        });
    });

    describe('t', () => {
        it('should return English translation by default', () => {
            expect(t('found')).toBe('Found');
            expect(t('folders')).toBe('node_modules folders');
            expect(t('scanning')).toBe('Scanning');
        });

        it('should return Vietnamese translation', () => {
            setLanguage('vi');
            expect(t('found')).toBe('Tìm thấy');
            expect(t('folders')).toBe('thư mục node_modules');
            expect(t('goodbye')).toBe('Tạm biệt!');
        });

        it('should return Chinese translation', () => {
            setLanguage('zh');
            expect(t('found')).toBe('找到');
            expect(t('noFolders')).toBe('未找到 node_modules 文件夹。');
        });

        it('should return Japanese translation', () => {
            setLanguage('ja');
            expect(t('found')).toBe('見つかりました');
            expect(t('goodbye')).toBe('さようなら！');
        });

        it('should return Korean translation', () => {
            setLanguage('ko');
            expect(t('found')).toBe('발견');
            expect(t('goodbye')).toBe('안녕히 가세요!');
        });

        it('should return Spanish translation', () => {
            setLanguage('es');
            expect(t('found')).toBe('Encontrado');
            expect(t('deleted')).toBe('Eliminado');
        });

        it('should return French translation', () => {
            setLanguage('fr');
            expect(t('found')).toBe('Trouvé');
            expect(t('goodbye')).toBe('Au revoir !');
        });

        it('should return German translation', () => {
            setLanguage('de');
            expect(t('found')).toBe('Gefunden');
            expect(t('goodbye')).toBe('Auf Wiedersehen!');
        });
    });

    describe('getAvailableLanguages', () => {
        it('should return all 8 supported languages', () => {
            const languages = getAvailableLanguages();

            expect(languages).toContain('en');
            expect(languages).toContain('vi');
            expect(languages).toContain('zh');
            expect(languages).toContain('ja');
            expect(languages).toContain('ko');
            expect(languages).toContain('es');
            expect(languages).toContain('fr');
            expect(languages).toContain('de');
            expect(languages.length).toBe(8);
        });
    });

    describe('getCurrentLanguage', () => {
        it('should return current language', () => {
            expect(getCurrentLanguage()).toBe('en');

            setLanguage('vi');
            expect(getCurrentLanguage()).toBe('vi');
        });
    });
});
