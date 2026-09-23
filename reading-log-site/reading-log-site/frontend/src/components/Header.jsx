import ThemeToggle from './ThemeToggle.jsx';

// Komponen tanpa state: hanya menerjemahkan markup statis dari index.html lama.
// Perbedaan JSX vs HTML: "class" ditulis "className" (class = kata kunci JavaScript).
export default function Header() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <a href="#" className="brand">Fauzan Hidayat</a>
        <nav aria-label="Navigasi utama">
          <ul className="nav-list">
            <li><a href="#tentang">Tentang</a></li>
            <li><a href="#proyek">Proyek</a></li>
            <li><a href="#repo">Repo</a></li>
            <li><a href="#bacaan">Bacaan</a></li>
            <li><a href="#kontak">Kontak</a></li>
          </ul>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
