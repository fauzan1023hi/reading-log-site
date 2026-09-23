import { useEffect, useState } from 'react';

function readInitialTheme() {
  // Script inline di index.html sudah memasang atribut ini sebelum React dimuat.
  return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
}

export default function ThemeToggle() {
  // Fungsi (bukan nilai) diberikan ke useState agar hanya dijalankan sekali.
  const [theme, setTheme] = useState(readInitialTheme);

  // Efek samping (mengubah <html> & localStorage) dijalankan SETIAP "theme" berubah.
  // Di versi JS murni, dua baris ini ditulis manual di dalam event listener.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch {
      // penyimpanan diblokir: tema tetap berganti, hanya tidak diingat
    }
  }, [theme]);

  const isDark = theme === 'dark';

  // Teks tombol & aria-pressed dihitung dari state saat render —
  // tidak ada lagi renderThemeButton() yang harus dipanggil manual.
  return (
    <button
      type="button"
      className="btn btn-ghost btn-small"
      aria-pressed={isDark}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
    >
      {isDark ? 'Mode terang' : 'Mode gelap'}
    </button>
  );
}
