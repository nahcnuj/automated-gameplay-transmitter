import { CommentList } from "./components/CommentList";
import { HighlightOnChange } from "./components/HighlightOnChange";
import { useCommentContext } from "./contexts/CommentContext";
import { useServiceMetaContext } from "./contexts/ServiceMetaContext";
import { useSpeechContext } from "./contexts/SpeechContext";
import "./index.css";

const getClockEmoji = (d: Date) =>
  [...'🕛🕧🕐🕜🕑🕝🕒🕞🕓🕟🕔🕠🕕🕡🕖🕢🕗🕣🕘🕤🕙🕥🕚🕦']
    .at(2 * (d.getHours() % 12) + Math.floor(d.getMinutes() / 30));

const formatDateTime = (d: Date) => getClockEmoji(d) +
  new Intl.DateTimeFormat('ja-JP', {
    second: '2-digit',
    minute: '2-digit',
    hour: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Tokyo',
  })
    .format(d);

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
  const { startTime, url, total = 0, points: { ad = 0, gift = 0 } = { ad: 0, gift: 0 } } = useServiceMetaContext();
  const { comments } = useCommentContext();
  const { text: speechText } = useSpeechContext();

  const now = new Date();

  const liveId = url?.split('/').at(-1)?.slice(2);
  const numUserComments = comments.filter(({ data: { no, origin } }) => (origin as any)?.meta?.origin?.chat?.liveId === liveId && no).length;

  return (
    <div className="w-screen h-screen max-w-[1280px] max-h-[720px] m-auto overflow-hidden flex font-[Noto_Sans_CJK_JP]">
      <div className="h-full flex-auto">
        <div className="h-full flex flex-col">
          <div className="flex-auto">
            {/* Game screen */}
          </div>
          <div className="h-fit flex-none">
            <div className="after:block after:bg-[#001100f7] after:-mb-10 after:translate-x-243 after:-translate-y-18 after:w-10 after:h-10 after:[clip-path:polygon(100%_50%,8%_0,8%_100%)]">
              <div className="w-full h-30 p-2 border-5 border-green-200 bg-[#001100f7] rounded-xl text-3xl/10 font-bold text-white [text-shadow:-2px_-2px_4px_#000,2px_2px_4px_#000]">
                {speechText}
              </div>
            </div>
            <div className="text-md font-bold [text-shadow:1px_1px_6px_#000,-1px_-1px_6px_#000,-1px_1px_6px_#000,1px_-1px_6px_#000]">
              <div className="flex gap-5">
                <div className="flex-none">
                  {formatDateTime(now)}
                </div>
                <div className="flex-none px-2 bg-black/90 rounded-sm">
                  &#x1D54F; &#xFF20;<span className="font-mono">makamujo</span>
                </div>
                <div className="flex-auto"></div>
                {total > 0 && (
                  <div className="flex-none">
                    <HighlightOnChange timeout={5_000} classNameOnChanged="text-yellow-300">
                      {`🙎${formatNumber(total)}`}
                    </HighlightOnChange>
                  </div>
                )}
                {numUserComments > 0 && (
                  <div className="flex-none">
                    <HighlightOnChange timeout={5_000} classNameOnChanged="text-yellow-300">
                      {`💬${formatNumber(numUserComments)}`}
                    </HighlightOnChange>
                  </div>
                )}
                {ad > 0 && (
                  <div className="flex-none">
                    <HighlightOnChange timeout={60_000} classNameOnChanged="text-yellow-300">
                      {`📣${formatNumber(ad)}`}
                    </HighlightOnChange>
                  </div>
                )}
                {gift > 0 && (
                  <div className="flex-none">
                    <HighlightOnChange timeout={30_000} classNameOnChanged="text-yellow-300">
                      {`🎁${formatNumber(gift)}`}
                    </HighlightOnChange>
                  </div>
                )}
                {startTime &&
                  <div className="flex-none">
                    {formatDuration(new Date(now.getTime() - startTime + now.getTimezoneOffset() * 60 * 1000))}
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="w-[300px] flex-none">
        <div className="h-full flex flex-col-reverse gap-5">
          <div className="h-70 flex-none">
            <img src="/img/nc433974.png" width="720" height="960" className="h-full object-cover object-top" />
          </div>
          <div className="flex-auto">
            <CommentList comments={comments} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
