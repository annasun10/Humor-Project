import { supabase } from "@/lib/supabaseClient";

export default async function ListPage() {
  const { data, error } = await supabase
    .from("captions")
    .select("*")
    .limit(50);

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Data</h1>

      {!data || data.length === 0 ? (
        <p>No rows found.</p>
      ) : (
        <ul>
          {data.map((row, index) => (
            <li key={index}>
              {JSON.stringify(row)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
