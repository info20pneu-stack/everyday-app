const FEATURES = [
  { icon: '⚡', title: 'Fast & Accurate', desc: 'Real-time data updated every second' },
  { icon: '🗂️', title: 'All in One Place', desc: 'Every tool you need in a single dashboard' },
  { icon: '😊', title: 'User Friendly', desc: 'Clean, intuitive design for everyone' },
  { icon: '🆓', title: 'Always Free', desc: 'No hidden costs, no paywalls' },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      {FEATURES.map(f => (
        <div key={f.title} className="site-footer-col">
          <span className="site-footer-icon">{f.icon}</span>
          <div className="site-footer-title">{f.title}</div>
          <div className="site-footer-desc">{f.desc}</div>
        </div>
      ))}
    </footer>
  );
}
