// Di versi HTML, tiga kartu ditulis berulang (copy-paste).
// Di React, data dipisah dari tampilan: cukup ubah array ini untuk menambah kartu.
const PROJECTS = [
  {
    name: '[Nama Proyek 1]',
    description: '[Deskripsi singkat proyek: masalah apa yang diselesaikan.]',
    tech: '[Teknologi: misal Django, PostgreSQL]',
    url: '#',
  },
  {
    name: '[Nama Proyek 2]',
    description: '[Deskripsi singkat proyek: masalah apa yang diselesaikan.]',
    tech: '[Teknologi: misal Next.js, Tailwind]',
    url: '#',
  },
  {
    name: '[Nama Proyek 3]',
    description: '[Deskripsi singkat proyek: masalah apa yang diselesaikan.]',
    tech: '[Teknologi: misal Tableau, SQL]',
    url: '#',
  },
];

// Props: data yang dikirim dari komponen induk, seperti argumen fungsi.
// ProjectCard tidak tahu dari mana datanya — ia hanya menampilkan apa yang diberikan.
function ProjectCard({ name, description, tech, url }) {
  return (
    <article className="card">
      <h3>{name}</h3>
      <p>{description}</p>
      <p className="card-tech">{tech}</p>
      <a href={url} className="card-link">[Link repo/demo]</a>
    </article>
  );
}

export default function Projects() {
  return (
    <section id="proyek" className="section container">
      <h2>Proyek</h2>
      <div className="card-grid">
        {/* key membantu React mengenali item mana yang berubah saat daftar di-render ulang. */}
        {PROJECTS.map((project) => (
          <ProjectCard key={project.name} {...project} />
        ))}
      </div>
    </section>
  );
}
