import dynamic from 'next/dynamic';
export async function getStaticProps(){ return { props:{}, revalidate:300 }; }
const HomeApp = dynamic(() => import('../components/HomeApp'), { ssr:false });
export default function Page(){ return <HomeApp/>; }
