import { supabase } from "@/lib/supabaseClient";

export default async function ListPage() {
  const { data, error } = await supabase
    .from("caption_votes")
    .select("id, vote_value, profile_id, caption_id, created_datetime_utc, modified_datetime_utc")
    .order("id", { ascending: true })
    .limit(50);

  if (error) {
    return (
      <div style={{ padding: 30 }}>
        <h1>Error loading votes</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        Caption Votes
      </h1>

      {!data || data.length === 0 ? (
        <p>No votes found.</p>
      ) : (
        <table
          style={{
            marginTop: 20,
            borderCollapse: "collapse",
            width: "100%",
          }}
        >
          <thead>
            <tr style={{ borderBottom: "2px solid #ddd" }}>
              <th align="left">ID</th>
              <th align="left">Vote</th>
              <th align="left">Profile</th>
              <th align="left">Caption</th>
              <th align="left">Created</th>
              <th align="left">Modified</th>
            </tr>
          </thead>
          <tbody>
            {data.map((vote) => (
              <tr key={vote.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{vote.id}</td>
                <td>{vote.vote_value}</td>
                <td>{vote.profile_id}</td>
                <td>{vote.caption_id}</td>
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
