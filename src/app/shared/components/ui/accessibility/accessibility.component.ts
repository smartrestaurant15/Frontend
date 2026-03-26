import { Component, OnInit } from '@angular/core';

@Component({
    selector: 'app-accessibility',
    templateUrl: './accessibility.component.html',
    styleUrls: ['./accessibility.component.scss']
})
export class AccessibilityComponent implements OnInit {
    showMenu = false;
    highContrast = false;
    invertColors = false;
    underlineLinks = false;
    readableFont = false;
    fontSize = 14;

    constructor() { }

    ngOnInit(): void {
        // Cargar preferencias si existen (LocalStorage)
        this.loadPreferences();
    }

    toggleMenu(): void {
        this.showMenu = !this.showMenu;
    }

    toggleHighContrast(): void {
        this.highContrast = !this.highContrast;
        this.updateBodyClass('high-contrast', this.highContrast);
        this.savePreferences();
    }

    toggleInvertColors(): void {
        this.invertColors = !this.invertColors;
        this.updateBodyClass('invert-colors', this.invertColors);
        this.savePreferences();
    }

    toggleUnderlineLinks(): void {
        this.underlineLinks = !this.underlineLinks;
        this.updateBodyClass('underline-links', this.underlineLinks);
        this.savePreferences();
    }

    toggleReadableFont(): void {
        this.readableFont = !this.readableFont;
        this.updateBodyClass('readable-font', this.readableFont);
        this.savePreferences();
    }

    changeFontSize(delta: number): void {
        this.fontSize += delta;
        if (this.fontSize < 10) this.fontSize = 10;
        if (this.fontSize > 32) this.fontSize = 32;
        this.updateFontSize();
        this.savePreferences();
    }

    resetAccessibility(): void {
        this.highContrast = false;
        this.invertColors = false;
        this.underlineLinks = false;
        this.readableFont = false;
        this.fontSize = 14;

        this.updateBodyClass('high-contrast', false);
        this.updateBodyClass('invert-colors', false);
        this.updateBodyClass('underline-links', false);
        this.updateBodyClass('readable-font', false);
        this.updateFontSize();
        this.savePreferences();
    }

    private updateBodyClass(className: string, active: boolean): void {
        if (active) {
            document.body.classList.add(className);
        } else {
            document.body.classList.remove(className);
        }
    }

    private updateFontSize(): void {
        document.documentElement.style.setProperty('--app-font-size', `${this.fontSize}px`);
    }

    private savePreferences(): void {
        const prefs = {
            highContrast: this.highContrast,
            invertColors: this.invertColors,
            underlineLinks: this.underlineLinks,
            readableFont: this.readableFont,
            fontSize: this.fontSize
        };
        localStorage.setItem('accessibility-prefs', JSON.stringify(prefs));
    }

    private loadPreferences(): void {
        const saved = localStorage.getItem('accessibility-prefs');
        if (saved) {
            try {
                const prefs = JSON.parse(saved);
                this.highContrast = prefs.highContrast || false;
                this.invertColors = prefs.invertColors || false;
                this.underlineLinks = prefs.underlineLinks || false;
                this.readableFont = prefs.readableFont || false;
                this.fontSize = prefs.fontSize || 14;

                this.updateBodyClass('high-contrast', this.highContrast);
                this.updateBodyClass('invert-colors', this.invertColors);
                this.updateBodyClass('underline-links', this.underlineLinks);
                this.updateBodyClass('readable-font', this.readableFont);
                this.updateFontSize();
            } catch (e) {
                console.error('Error loading accessibility preferences', e);
            }
        }
    }
}
