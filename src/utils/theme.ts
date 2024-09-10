type Theme = 'light' | 'dark';

export const getSystemTheme = (): Theme => {
    const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return dark ? 'dark' : 'light';
};
