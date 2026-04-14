import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";

const steps = [
  "View one image and one caption at a time",
  "Decide whether the caption actually matches the image",
  "Vote with 👍 or 👎",
  "Use arrow keys for faster rating (→ 👍, ← 👎)",
  "Help improve humor detection models with every vote",
];

export default function HomePage() {
  return (
    <main className={styles.page}>
      <div className={styles.backgroundGlowTop} />
      <div className={styles.backgroundGlowBottom} />

      <section className={styles.heroCard}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>Humor Project</div>

          <h1 className={styles.title}>Caption Rater</h1>

          <p className={styles.subtitle}>
            Help train humor AI by rating how well captions match images.
            Vote <span className={styles.emoji}>👍</span> if it fits and{" "}
            <span className={styles.emoji}>👎</span> if it does not.
          </p>

          <div className={styles.actions}>
            <Link className={styles.primaryBtn} href="/protected">
              Start Rating
            </Link>
            <Link className={styles.secondaryBtn} href="/login">
              Login
            </Link>
          </div>
        </div>

        <div className={styles.previewCard}>
          <div className={styles.previewImage}>
            <Image
              src="/cat.jpg"
              alt="Example"
              fill
              className={styles.image}
            />
          </div>

          <div className={styles.previewCaptionBox}>
            <p className={styles.previewCaption}>
              “When you realize the group project is due tonight.”
            </p>

            <div className={styles.previewVotes}>
              <button className={styles.voteBtn} type="button" aria-label="Thumbs down">
                👎
              </button>
              <button className={styles.voteBtn} type="button" aria-label="Thumbs up">
                👍
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <h2 className={styles.cardTitle}>How it works</h2>
          <ul className={styles.stepList}>
            {steps.map((step) => (
              <li key={step} className={styles.stepItem}>
                <span className={styles.stepDot} />
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.infoCard}>
          <h2 className={styles.cardTitle}>Why it matters</h2>
          <p className={styles.cardText}>
            Your feedback helps us understand what makes captions feel accurate,
            funny, or off-target. That data can be used to improve future humor
            and captioning systems.
          </p>

          <div className={styles.notice}>
            You must be signed in to vote. Authentication is handled securely
            through Google OAuth.
          </div>
        </div>
      </section>
    </main>
  );
}