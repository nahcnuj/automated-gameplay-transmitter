import { Layout } from "./components/Layout";
import { AIVTuberProvider } from "./contexts/AIVTuberContext";
import { CommentProvider } from "./contexts/CommentContext";
import { ServiceMetaProvider } from "./contexts/ServiceMetaContext";
import "./index.css";

export function App() {
  return (
    <ServiceMetaProvider>
      <AIVTuberProvider game="cookieclicker">
        <CommentProvider>
          <Layout count={10} span={8} className="bg-emerald-950/30 text-emerald-50 font-[Noto_Sans_CJK_JP] font-bold">
            <>
              <span className="text-xs opacity-25">{new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
            </>
          </Layout>
        </CommentProvider>
      </AIVTuberProvider>
    </ServiceMetaProvider>
  );
}
