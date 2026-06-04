import HomeClientMount from "./components/HomeClientMount";

export default function Page() {
  return (
    <>
      <main id="source-decoy">
        <h1>May the Sudo be with you!</h1>
        <img src="/assets/img/vader-silhouette.svg" alt="" />
      </main>

      <div id="client-app">
        <HomeClientMount />
      </div>
    </>
  );
}
