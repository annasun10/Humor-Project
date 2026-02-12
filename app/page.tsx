import Link from "next/link";
import styles from "./page.module.css";
import { supabase } from "@/lib/supabaseClient";

export default async function ListPage() {
  const { data, error } = await supabase
    .from("caption_votes")
    .select(
      "id, vote_value, profile_id, caption_id, created_datetime_utc, modified_datetime_utc"
    )
    .order("id", { ascending: true })
    .limit(50);

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card} style={{ padding: 18 }}>
            <div className={styles.title} style={{ marginTop: 0 }}>
              Error loading votes
            </div>
            <div className={styles.subtitle}>{error.message}</div>
            <div className={styles.actions} style={{ marginTop: 16 }}>
              <Link className={styles.primaryBtn} href="/protected">
                Go to protected
              </Link>
              <Link className={styles.secondaryBtn} href="/login">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <div className={styles.badge}>Assignment #2 (DB) + Assignment #3 (Auth)</div>
            <div className={styles.title}>Caption Votes</div>
            <div className={styles.subtitle}>
              Showing the first {data?.length ?? 0} rows (ordered by ID).
            </div>
          </div>

          <div className={styles.actions}>
            <Link className={styles.primaryBtn} href="/protected">
              Go to protected
            </Link>
            <Link className={styles.secondaryBtn} href="/login">
              Login
            </Link>
          </div>
        </div>

        <div className={styles.card}>
          {!data || data.length === 0 ? (
            <div className={styles.empty}>No votes found.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead className={styles.thead}>
                  <tr>
                    <th>ID</th>
                    <th>Vote</th>
                    <th>Profile</th>
                    <th>Caption</th>
                    <th>Created</th>
                    <th>Modified</th>
                  </tr>
                </thead>
                <tbody className={styles.tbody}>
                  {data.map((vote) => {
                    const v = Number(vote.vote_value);
                    const voteLabel = v > 0 ? "Upvote" : v < 0 ? "Downvote" : "Neutral";
                    const pillClass =
                      v > 0 ? `${styles.pill} ${styles.pillUp}` :
                      v < 0 ? `${styles.pill} ${styles.pillDown}` :
                      styles.pill;

                    return (
                      <tr key={vote.id}>
                        <td className={styles.mono}>{vote.id}</td>
                        <td>
                          <span className={pillClass}>
                            {voteLabel} ({vote.vote_value})
                          </span>
                        </td>
                        <td className={styles.mono}>{vote.profile_id}</td>
                        <td className={styles.mono}>{vote.caption_id}</td>
                        <td>
                          {vote.created_datetime_utc
                            ? new Date(vote.created_datetime_utc).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          {vote.modified_datetime_utc
                            ? new Date(vote.modified_datetime_utc).toLocaleString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className={styles.footnote}>
          Tip: open <span className={styles.mono}>/protected</span> in an incognito window to confirm gating.
        </div>
      </div>
    </div>
  );
}
