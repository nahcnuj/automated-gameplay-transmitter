import { CommentList } from "./components/CommentList";
import { HighlightOnChange } from "./components/HighlightOnChange";
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

  const displayComments = allComments
    .filter(({ data }) => Date.now() - Date.parse(data.timestamp) < 12 /* hour */ * 60 /* min/hour */ * 60 /* min/sec */ * 1000 /* ms/sec */)
    .filter(({ data }) => data.no || data.userId === 'onecomme.system' && data.name === '生放送クルーズ')
    .slice(-10);

  const liveId = url?.split('/').at(-1)?.slice(2);
  const numUserComments = allComments.filter(({ data: { no, origin } }) => (origin as any)?.meta?.origin?.chat?.liveId === liveId && no).length;

  return (
    <div className="w-screen h-screen max-w-[1280px] max-h-[720px] m-auto bg-[#000700f7] overflow-hidden flex flex-col font-[Noto_Sans_CJK_JP]">
      <div className="flex-auto">
        <div className="w-full h-140 flex flex-row">
          <div className="flex-auto h-full">
            <div className="aspect-video h-full bg-black">
              <div className="w-full h-full text-center content-center text-7xl text-green-100 font-serif [font-variant-caps:small-caps]">
                No Signal
              </div>
            </div>
          </div>
          <div className="flex-none w-70 h-full">
            <div className="h-full">
              <div className="flex flex-col h-full gap-2">
                <div className="flex-none pt-2 text-center text-6xl text-green-300 font-bold [ruby-position:under] [text-shadow:-1px_-1px_5px_#000700,1px_1px_5px_#000700]">
                  <ruby>馬<rp>(</rp><rt>ま</rt><rp>)</rp></ruby>
                  <ruby>可<rp>(</rp><rt>か</rt><rp>)</rp></ruby>
                  <ruby>無<rp>(</rp><rt>む</rt><rp>)</rp></ruby>
                  <ruby>序<rp>(</rp><rt>じょ</rt><rp>)</rp></ruby>
                </div>
                <div className="flex-none text-right text-3xl text-white">
                  <span className="bg-black rounded-sm">
                    <span className="px-3">&#x1D54F;</span>
                    <span className="text-green-100">
                      &#xFF20;
                      <span className="font-mono">makamujo</span>
                    </span>
                  </span>
                </div>
                <div className="flex-auto">
                  <div className="h-full flex flex-col justify-between p-1 bg-black/70 border-5 border-green-300 rounded-xl text-xl/8 font-bold text-green-100">
                    <div className="flex-none">
                      <div>📆{formatDate(now)}</div>
                      <div>{getClockEmoji(now)}{formatTime(now)}</div>
                    </div>
                    <div className="flex-none">
                      {total > 0 && (
                        <div>
                          <HighlightOnChange timeout={5_000} classNameOnChanged="text-yellow-300">
                            {`🙎${formatNumber(total)}`}
                          </HighlightOnChange>
                        </div>
                      )}
                      {numUserComments > 0 && (
                        <div>
                          <HighlightOnChange timeout={5_000} classNameOnChanged="text-yellow-300">
                            {`💬${formatNumber(numUserComments)}`}
                          </HighlightOnChange>
                        </div>
                      )}
                      {ad > 0 && (
                        <div>
                          <HighlightOnChange timeout={60_000} classNameOnChanged="text-yellow-300">
                            {`📣${formatNumber(ad)}`}
                          </HighlightOnChange>
                        </div>
                      )}
                      {gift > 0 && (
                        <div>
                          <HighlightOnChange timeout={30_000} classNameOnChanged="text-yellow-300">
                            {`🎁${formatNumber(gift)}`}
                          </HighlightOnChange>
                        </div>
                      )}
                      {startTime &&
                        <div>
                          {formatDuration(new Date(now.getTime() - startTime + now.getTimezoneOffset() * 60 * 1000))}
                        </div>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex-none">
        <div className="flex gap-2 max-w-full w-full h-40">
          <div className="flex-none w-50 h-50">
            {sprite}
          </div>
          <div className="flex-auto w-full h-full">
            <div className="flex flex-col w-full h-full overflow-hidden">
              <div className="flex-none">
                <div className="text-3xl/10">
                  <div className="w-max text-base font-bold [text-shadow:1px_1px_6px_#000,-1px_-1px_6px_#000,-1px_1px_6px_#000,1px_-1px_6px_#000]">
                    {/* <CommentList comments={displayComments} /> */}
                  </div>
                </div>
              </div>
              <div className="flex-auto w-full h-full">
                <div className="h-full flex flex-col justify-between">
                  <div className="flex-auto">
                    {/* TODO */}
                  </div>
                  <div className="flex-none w-full h-[3.5lh] overflow-hidden px-2 py-1 bg-black/70 border-5 border-green-300 rounded-xl text-3xl/10 font-bold text-green-100 [text-shadow:-2px_-2px_4px_#000,2px_2px_4px_#000]">
                    {speech && (
                      <>
                        {speech.icon && <img src={speech.icon} width={100} height={100} className="h-full mr-2 object-contain float-left" />}
                        {speech.text}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
