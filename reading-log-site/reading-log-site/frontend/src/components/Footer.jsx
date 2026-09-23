export default function Footer() {
  return (
    <footer id="kontak" className="site-footer">
      <div className="container">
        <h2>Kontak</h2>
        <address>
          <ul className="contact-list">
            <li>Email: <a href="mailto:[email@contoh.com]">[email@contoh.com]</a></li>
            <li>GitHub: <a href="#">[github.com/username]</a></li>
            <li>LinkedIn: <a href="#">[linkedin.com/in/username]</a></li>
          </ul>
        </address>
        <p className="copyright">&copy; {new Date().getFullYear()} Fauzan Hidayat</p>
      </div>
    </footer>
  );
}
