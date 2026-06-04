import HomeClientMount from "./components/HomeClientMount";

export default function Page() {
  return (
    <>
      <main id="source-decoy" className="source-decoy">
        <h1>May the Sudo be with you!</h1>
        <img src="/assets/img/vader-silhouette.svg" alt="" width={200} height={240} />
      </main>

      <div id="client-app">
        <HomeClientMount />
      </div>
    </>
  );
}
