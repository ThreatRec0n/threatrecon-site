// Analyzer engine loads only on the main workbench route (not legal/privacy/terms/source).
export default function MainToolLayout({ children }) {
  return (
    <>
      {children}
      <script type="module" src="/assets/js/app.js" />
    </>
  );
}
