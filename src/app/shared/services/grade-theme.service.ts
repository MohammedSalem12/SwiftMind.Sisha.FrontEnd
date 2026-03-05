import { Injectable, signal } from '@angular/core';

export interface GradeTheme {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  gradient: string;
  light: string;
  dark: string;
  textColor: string;
  cardBg: string;
  borderColor: string;
  shadowColor: string;
  iconColor: string;
  badgeColor: string;
  progressColor: string;
}

@Injectable({
  providedIn: 'root'
})
export class GradeThemeService {
  private readonly themes: Record<number, GradeTheme> = {
    1: {
      name: 'الأول الابتدائي',
      primary: '#FF6B6B',
      secondary: '#4ECDC4',
      accent: '#FFE66D',
      gradient: 'linear-gradient(135deg, #FF6B6B 0%, #4ECDC4 100%)',
      light: '#FFE5E5',
      dark: '#CC5555',
      textColor: '#2C3E50',
      cardBg: '#FFF5F5',
      borderColor: '#FFB3B3',
      shadowColor: 'rgba(255, 107, 107, 0.2)',
      iconColor: '#FF6B6B',
      badgeColor: '#FF6B6B',
      progressColor: '#FF6B6B'
    },
    2: {
      name: 'الثاني الابتدائي',
      primary: '#4ECDC4',
      secondary: '#44A08D',
      accent: '#95E1D3',
      gradient: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
      light: '#E8F8F5',
      dark: '#3BA99C',
      textColor: '#2C3E50',
      cardBg: '#F0FFFE',
      borderColor: '#7EDDD6',
      shadowColor: 'rgba(78, 205, 196, 0.2)',
      iconColor: '#4ECDC4',
      badgeColor: '#4ECDC4',
      progressColor: '#4ECDC4'
    },
    3: {
      name: 'الثالث الابتدائي',
      primary: '#45B7D1',
      secondary: '#96CEB4',
      accent: '#FFEAA7',
      gradient: 'linear-gradient(135deg, #45B7D1 0%, #96CEB4 100%)',
      light: '#E8F4F8',
      dark: '#3692A8',
      textColor: '#2C3E50',
      cardBg: '#F0FAFF',
      borderColor: '#7DD3FC',
      shadowColor: 'rgba(69, 183, 209, 0.2)',
      iconColor: '#45B7D1',
      badgeColor: '#45B7D1',
      progressColor: '#45B7D1'
    },
    4: {
      name: 'الرابع الابتدائي',
      primary: '#9B59B6',
      secondary: '#8E44AD',
      accent: '#BB8FCE',
      gradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
      light: '#F4ECF7',
      dark: '#7D3C98',
      textColor: '#2C3E50',
      cardBg: '#FAF5FF',
      borderColor: '#D7BDE2',
      shadowColor: 'rgba(155, 89, 182, 0.2)',
      iconColor: '#9B59B6',
      badgeColor: '#9B59B6',
      progressColor: '#9B59B6'
    },
    5: {
      name: 'الخامس الابتدائي',
      primary: '#F39C12',
      secondary: '#E67E22',
      accent: '#F8C471',
      gradient: 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)',
      light: '#FEF9E7',
      dark: '#D68910',
      textColor: '#2C3E50',
      cardBg: '#FFFBF0',
      borderColor: '#F5B041',
      shadowColor: 'rgba(243, 156, 18, 0.2)',
      iconColor: '#F39C12',
      badgeColor: '#F39C12',
      progressColor: '#F39C12'
    },
    6: {
      name: 'السادس الابتدائي',
      primary: '#E74C3C',
      secondary: '#C0392B',
      accent: '#EC7063',
      gradient: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
      light: '#FADBD8',
      dark: '#CB4335',
      textColor: '#2C3E50',
      cardBg: '#FFF5F4',
      borderColor: '#F1948A',
      shadowColor: 'rgba(231, 76, 60, 0.2)',
      iconColor: '#E74C3C',
      badgeColor: '#E74C3C',
      progressColor: '#E74C3C'
    },
    7: {
      name: 'الأول الإعدادي',
      primary: '#3498DB',
      secondary: '#2980B9',
      accent: '#5DADE2',
      gradient: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
      light: '#EBF5FB',
      dark: '#2874A6',
      textColor: '#2C3E50',
      cardBg: '#F0F8FF',
      borderColor: '#85C1E9',
      shadowColor: 'rgba(52, 152, 219, 0.2)',
      iconColor: '#3498DB',
      badgeColor: '#3498DB',
      progressColor: '#3498DB'
    },
    8: {
      name: 'الثاني الإعدادي',
      primary: '#16A085',
      secondary: '#138D75',
      accent: '#48C9B0',
      gradient: 'linear-gradient(135deg, #16A085 0%, #138D75 100%)',
      light: '#E8F8F5',
      dark: '#0E6655',
      textColor: '#FFFFFF',
      cardBg: '#F0FFFE',
      borderColor: '#76D7C4',
      shadowColor: 'rgba(22, 160, 133, 0.2)',
      iconColor: '#16A085',
      badgeColor: '#16A085',
      progressColor: '#16A085'
    },
    9: {
      name: 'الثالث الإعدادي',
      primary: '#2ECC71',
      secondary: '#27AE60',
      accent: '#52BE80',
      gradient: 'linear-gradient(135deg, #2ECC71 0%, #27AE60 100%)',
      light: '#E8F8F5',
      dark: '#239B56',
      textColor: '#2C3E50',
      cardBg: '#F0FFF4',
      borderColor: '#7DCEA0',
      shadowColor: 'rgba(46, 204, 113, 0.2)',
      iconColor: '#2ECC71',
      badgeColor: '#2ECC71',
      progressColor: '#2ECC71'
    },
    10: {
      name: 'الأول الثانوي',
      primary: '#8E44AD',
      secondary: '#7D3C98',
      accent: '#AF7AC5',
      gradient: 'linear-gradient(135deg, #8E44AD 0%, #7D3C98 100%)',
      light: '#F4ECF7',
      dark: '#6C3483',
      textColor: '#FFFFFF',
      cardBg: '#FAF5FF',
      borderColor: '#D7BDE2',
      shadowColor: 'rgba(142, 68, 173, 0.2)',
      iconColor: '#8E44AD',
      badgeColor: '#8E44AD',
      progressColor: '#8E44AD'
    },
    11: {
      name: 'الثاني الثانوي',
      primary: '#34495E',
      secondary: '#2C3E50',
      accent: '#5D6D7E',
      gradient: 'linear-gradient(135deg, #34495E 0%, #2C3E50 100%)',
      light: '#EAFAF1',
      dark: '#1C2833',
      textColor: '#FFFFFF',
      cardBg: '#F8F9FA',
      borderColor: '#BDC3C7',
      shadowColor: 'rgba(52, 73, 94, 0.2)',
      iconColor: '#34495E',
      badgeColor: '#34495E',
      progressColor: '#34495E'
    },
    12: {
      name: 'الثالث الثانوي',
      primary: '#E67E22',
      secondary: '#CA6F1E',
      accent: '#EB984E',
      gradient: 'linear-gradient(135deg, #E67E22 0%, #CA6F1E 100%)',
      light: '#FEF5E7',
      dark: '#BA4A00',
      textColor: '#2C3E50',
      cardBg: '#FFFBF0',
      borderColor: '#F5B041',
      shadowColor: 'rgba(230, 126, 34, 0.2)',
      iconColor: '#E67E22',
      badgeColor: '#E67E22',
      progressColor: '#E67E22'
    }
  };

  private currentTheme = signal<GradeTheme>(this.themes[1]); // Default to grade 1

  constructor() {}

  setThemeByGrade(grade: number): void {
    const theme = this.themes[grade] || this.themes[1];
    this.currentTheme.set(theme);
    this.applyThemeToDocument(theme);
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getThemeForGrade(grade: number): GradeTheme {
    return this.themes[grade] || this.themes[1];
  }

  getAllThemes(): Record<number, GradeTheme> {
    return this.themes;
  }

  private applyThemeToDocument(theme: GradeTheme): void {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--grade-primary', theme.primary);
    root.style.setProperty('--grade-secondary', theme.secondary);
    root.style.setProperty('--grade-accent', theme.accent);
    root.style.setProperty('--grade-gradient', theme.gradient);
    root.style.setProperty('--grade-light', theme.light);
    root.style.setProperty('--grade-dark', theme.dark);
    root.style.setProperty('--grade-text-color', theme.textColor);
    root.style.setProperty('--grade-card-bg', theme.cardBg);
    root.style.setProperty('--grade-border-color', theme.borderColor);
    root.style.setProperty('--grade-shadow-color', theme.shadowColor);
    root.style.setProperty('--grade-icon-color', theme.iconColor);
    root.style.setProperty('--grade-badge-color', theme.badgeColor);
    root.style.setProperty('--grade-progress-color', theme.progressColor);
    
    // Add theme class to body
    document.body.className = document.body.className.replace(/grade-\d+/g, '');
    document.body.classList.add(`grade-theme`);
    
    // Add meta theme-color for mobile browsers
    let metaThemeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta') as HTMLMetaElement;
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    metaThemeColor.content = theme.primary;
  }

  resetTheme(): void {
    const root = document.documentElement;
    const properties = [
      '--grade-primary', '--grade-secondary', '--grade-accent', '--grade-gradient',
      '--grade-light', '--grade-dark', '--grade-text-color', '--grade-card-bg',
      '--grade-border-color', '--grade-shadow-color', '--grade-icon-color',
      '--grade-badge-color', '--grade-progress-color'
    ];
    
    properties.forEach(prop => root.style.removeProperty(prop));
    document.body.className = document.body.className.replace(/grade-theme/g, '');
    
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.remove();
    }
  }
}
