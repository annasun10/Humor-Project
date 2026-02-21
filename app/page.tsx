import Link from "next/link";
import styles from "./page.module.css";

export default function HomePage() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.badge}>Humor Project</div>
            <div className={styles.title}>Caption Rater</div>
            <div className={styles.subtitle}>
              Help us train humor AI by rating captions that match images.
              <br />
              Press 👍 if it fits. 👎 if it doesn’t.
            </div>
          </div>

          <div className={styles.actions}>
            <Link className={styles.primaryBtn} href="/protected">
              Start rating
            </Link>
            <Link className={styles.secondaryBtn} href="/login">
              Login
            </Link>
          </div>
        </div>

        <div className={styles.card} style={{ padding: 24 }}>
          <h2 style={{ marginTop: 0 }}>How it works</h2>

          <ul style={{ lineHeight: 1.8 }}>
            <li>You will see one image and one caption at a time</li>
            <li>Decide whether the caption matches the image</li>
            <li>Use 👍 or 👎 to vote</li>
            <li>Arrow keys also work (→ 👍, ← 👎)</li>
            <li>Your votes help improve humor detection models</li>
          </ul>

          <div className={styles.actions} style={{ marginTop: 24 }}>
            <Link className={styles.primaryBtn} href="/protected">
              Begin
            </Link>
          </div>
        </div>

        <div className={styles.footnote}>
          You must be signed in to vote. Authentication is handled securely via Google OAuth.
        </div>
      </div>
    </div>
  );
}