import { BottomPanel } from "./components/BottomPanel";
import { Layout } from "./components/Layout";
import { SidePanel } from "./components/SidePanel";
import { AIVTuberProvider } from "./contexts/AIVTuberContext";
import { CommentProvider } from "./contexts/CommentContext";
import { ServiceMetaProvider } from "./contexts/ServiceMetaContext";
import "./index.css";

export function App() {
  // const { url, startTime, total = 0, points: { ad = 0, gift = 0 } = { ad: 0, gift: 0 } } = useServiceMetaContext();
  // const { comments: allComments } = useCommentContext();
  // const { speech, sprite } = useAIVTuberContext();

  // const now = new Date();

  // // const displayComments = allComments
  // //   .filter(({ data }) => Date.now() - Date.parse(data.timestamp) < 12 /* hour */ * 60 /* min/hour */ * 60 /* min/sec */ * 1000 /* ms/sec */)
  // //   .filter(({ data }) => data.no || data.userId === 'onecomme.system' && data.name === '生放送クルーズ')
  // //   .slice(-10);

  // const liveId = url?.split('/').at(-1)?.slice(2);
  // const numUserComments = allComments.filter(({ data: { no, origin } }) => (origin as any)?.meta?.origin?.chat?.liveId === liveId && no).length;

  return (
    <ServiceMetaProvider>
      <AIVTuberProvider>
        <CommentProvider>
          <Layout count={10} span={8} className="bg-emerald-950/30 text-emerald-50 font-[Noto_Sans_CJK_JP] font-bold">
            <>
              <span className="text-xs opacity-25">{new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}</span>
            </>
            <SidePanel />
            <BottomPanel />
          </Layout>
        </CommentProvider>
      </AIVTuberProvider>
    </ServiceMetaProvider>
  );
}
