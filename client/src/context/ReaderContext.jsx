import React, { createContext, useContext, useState, useEffect } from 'react';

const ReaderContext = createContext(null);

export function ReaderProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('reader_theme') || 'sepia'); // light, sepia, green, dark, amoled
  const [fontSize, setFontSize] = useState(() => parseInt(localStorage.getItem('reader_font_size')) || 18);
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem('reader_font_family') || 'serif'); // serif, sans
  const [lineHeight, setLineHeight] = useState(() => localStorage.getItem('reader_line_height') || 'relaxed'); // normal, relaxed, loose

  useEffect(() => {
    localStorage.setItem('reader_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('reader_font_size', fontSize);
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem('reader_font_family', fontFamily);
  }, [fontFamily]);

  useEffect(() => {
    localStorage.setItem('reader_line_height', lineHeight);
  }, [lineHeight]);

  const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 32));
  const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 12));

  return (
    <ReaderContext.Provider
      value={{
        theme,
        setTheme,
        fontSize,
        setFontSize,
        increaseFontSize,
        decreaseFontSize,
        fontFamily,
        setFontFamily,
        lineHeight,
        setLineHeight,
      }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export const useReader = () => useContext(ReaderContext);
