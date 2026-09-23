import { useEffect, useState } from 'react';
import { api } from './api.js';
import Header from './components/Header.jsx';
import About from './components/About.jsx';
import Projects from './components/Projects.jsx';
import GithubRepos from './components/GithubRepos.jsx';
import ReadingLog from './components/ReadingLog.jsx';
import AuthForm from './components/AuthForm.jsx';
import Footer from './components/Footer.jsx';

// App = komponen paling atas. State "user" disimpan DI SINI (lifting state up)
// karena dibutuhkan oleh lebih dari satu komponen anak:
// AuthForm mengisinya, ReadingLog memakainya, dan logout mengosongkannya.
export default function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // useEffect dengan array dependensi [] = jalankan SEKALI setelah render pertama.
  // Setara dengan init() di books.js versi JS murni.
  useEffect(() => {
    api('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null)) // 401 = memang belum login, bukan error
      .finally(() => setCheckingSession(false));
  }, []);

  async function handleLogout() {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
    }
  }

  return (
    <>
      <Header />
      <main>
        <About />
        <Projects />
        <GithubRepos />

        <section id="bacaan" className="section container">
          <h2>Pencatat Bacaan</h2>
          {/* Conditional rendering: pilih komponen berdasarkan state.
              Di versi JS murni ini dilakukan manual dengan el.hidden = ... */}
          {checkingSession ? (
            <p className="muted">Memeriksa sesi…</p>
          ) : user ? (
            <ReadingLog
              user={user}
              onLogout={handleLogout}
              onSessionExpired={() => setUser(null)}
            />
          ) : (
            <AuthForm onAuthenticated={setUser} />
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
