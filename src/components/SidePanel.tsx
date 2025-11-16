import { useAIVTuberContext } from "src/contexts/AIVTuberContext";
import { useServiceMetaContext } from "../contexts/ServiceMetaContext";
import { HighlightOnChange } from "./HighlightOnChange";

type PanelProps = {
};

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

const formatDuration = (d: Date) =>
  `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  // // Not implemented on an OBS browser...
  // new Intl.DurationFormat('ja-JP', {
  //   style: 'digital',
  //   seconds: '2-digit',
  //   minutes: '2-digit',
  //   hours: '2-digit',
  //   timeZone: 'Asia/Tokyo',
  // }).format({
  //   seconds: d.getSeconds(),
  //   minutes: d.getMinutes(),
  //   hours: d.getHours(),
  // });

const formatNumber = (n: number) => new Intl.NumberFormat('ja-JP').format(n);

export function SidePanel({ }: PanelProps) {
  const { gameState: { statistics } } = useAIVTuberContext();
  const { startTime = new Date(0).getTime(), total = 0, points: { ad = 0, gift = 0 } = { ad: 0, gift: 0 } } = useServiceMetaContext();

  const now = new Date();
  const duration = new Date(now.getTime() - startTime + now.getTimezoneOffset() * 60_000);

  return (
    <div className="h-full flex flex-col justify-between items-center">
      <div className="flex-none">
        <div className="text-5xl/15 text-emerald-300" style={{ rubyPosition: 'under' }}>
          <ruby>馬<rp>(</rp><rt>ま</rt><rp>)</rp></ruby>
          <ruby>可<rp>(</rp><rt>か</rt><rp>)</rp></ruby>
          <ruby>無<rp>(</rp><rt>む</rt><rp>)</rp></ruby>
          <ruby>序<rp>(</rp><rt>じょ</rt><rp>)</rp></ruby>
        </div>
      </div>
      <div className="flex-none">
        <div className="text-center text-3xl/12 text-white">
          <span className="px-3 bg-black rounded-sm">
            <span className="pr-3 font-normal text-white">&#x1D54F;</span>
            &#xFF20;
            <span className="font-mono">makamujo</span>
          </span>
        </div>
      </div>
      <div className="flex-auto w-full p-1">
        <div className="h-full flex flex-col justify-between p-1 bg-black/50 border-5 border-double border-emerald-300 rounded-xl text-2xl/10">
          <div className="flex-none">
            <div>
              {statistics?.general?.legacyStarted?.ascensions?.toString().concat('回昇天') ?? null}
            </div>
            <div>
              {statistics?.general?.cookiesBakedInThisAscension?.value.toString().concat('🍪') ?? null}
            </div>
          </div>
          <div className="flex-none">
            {total > 0 && (
              <div>
                <HighlightOnChange timeout={5_000} classNameOnChanged="text-yellow-300">
                  {`🙎${formatNumber(total)}`}
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
            <div>
              {getClockEmoji(duration)}
              {formatDuration(duration)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

declare global {
  namespace Intl {
    interface DurationFormatConstructor {
      /**
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/DurationFormat}
       */
      new(locales?: string | string[], options?: any): DurationFormat
    }

    // `Intl.DurationFormat` missing from library definitions https://github.com/microsoft/TypeScript/issues/60608
    interface DurationFormat {
      /**
       * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat/format}
       */
      format(duration: any): string
    }

    /**
     * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DurationFormat}
     */
    var DurationFormat: DurationFormatConstructor;
  }
}