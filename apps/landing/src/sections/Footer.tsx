// Footer: domain + handle are facts (messaging guide); plain copyright + pre-launch tag.
import { X_URL } from "./shared";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="wrap footer-row">
        <span className="wordmark">Riprap</span>
        <span>riprap.xyz</span>
        <a href={X_URL} target="_blank" rel="noopener noreferrer">
          @riprapxyz
        </a>
        <span className="tag">Pre-launch pilot.</span>
        <span className="copyright">© 2026 Riprap.</span>
      </div>
    </footer>
  );
}
