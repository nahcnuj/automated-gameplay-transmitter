import { BottomPanel } from "./components/BottomPanel";
import { Layout } from "./components/Layout";
import { SidePanel } from "./components/SidePanel";
import { useAIVTuberContext } from "./contexts/AIVTuberContext";
import { useCommentContext } from "./contexts/CommentContext";
import { useServiceMetaContext } from "./contexts/ServiceMetaContext";
import "./index.css";

const getClockEmoji = (d: Date) =>
  [...'🕛🕧🕐🕜🕑🕝🕒🕞🕓🕟🕔🕠🕕🕡🕖🕢🕗🕣🕘🕤🕙🕥🕚🕦']
    .at(2 * (d.getHours() % 12) + Math.floor(d.getMinutes() / 30));

const formatDate = (d: Date) => new Intl.DateTimeFormat('ja-JP', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  timeZone: 'Asia/Tokyo',
}).format(d);

const formatTime = (d: Date) => new Intl.DateTimeFormat('ja-JP', {
  second: '2-digit',
  minute: '2-digit',
  hour: '2-digit',
  timeZone: 'Asia/Tokyo',
}).format(d);

const formatDuration = (d: Date) => getClockEmoji(d) +
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
// // `Intl.DurationFormat` missing from library definitions https://github.com/microsoft/TypeScript/issues/60608
// new (Intl as any).DurationFormat('ja-JP', {
//   style: 'digital',
//   seconds: '2-digit',
//   minutes: '2-digit',
//   hours: '2-digit',
//   timeZone: 'Asia/Tokyo',
// })
//   .format({
//     seconds: d.getSeconds(),
//     minutes: d.getMinutes(),
//     hours: d.getHours(),
//   });

const formatNumber = (n: number) => new Intl.NumberFormat('ja-JP').format(n);

export function App() {
  const { url, startTime, total = 0, points: { ad = 0, gift = 0 } = { ad: 0, gift: 0 } } = useServiceMetaContext();
  const { comments: allComments } = useCommentContext();
  const { speech, sprite } = useAIVTuberContext();

  const now = new Date();

  // const displayComments = allComments
  //   .filter(({ data }) => Date.now() - Date.parse(data.timestamp) < 12 /* hour */ * 60 /* min/hour */ * 60 /* min/sec */ * 1000 /* ms/sec */)
  //   .filter(({ data }) => data.no || data.userId === 'onecomme.system' && data.name === '生放送クルーズ')
  //   .slice(-10);

  const liveId = url?.split('/').at(-1)?.slice(2);
  const numUserComments = allComments.filter(({ data: { no, origin } }) => (origin as any)?.meta?.origin?.chat?.liveId === liveId && no).length;

  return (
    <Layout count={10} span={8} className="bg-emerald-950/30 text-green-100 font-[Noto_Sans_CJK_JP]">
      <SidePanel />
      <BottomPanel />
    </Layout>
  );
}

export default App;
