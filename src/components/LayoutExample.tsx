import { Box } from "./Box";
import { Container } from "./Container";
import { Layout } from "./Layout";

/**
 * A self-contained example that demonstrates the three-panel layout
 * provided by this package (main panel, side panel, bottom panel).
 *
 * No external contexts or live data are required; all content is
 * composed from hard-coded placeholder values.
 */
export function LayoutExample() {
  return (
    <Layout count={10} span={8} className="bg-emerald-950/30 text-emerald-50 font-bold">
      {/* Main panel — game screen area */}
      <Container>
        <Box>
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="text-6xl">🎮</div>
            <div className="text-3xl text-emerald-300">ゲーム画面</div>
          </div>
        </Box>
      </Container>

      {/* Side panel — stream stats */}
      <Container>
        <div className="h-full flex flex-col justify-between items-center">
          <div className="flex-none">
            <div className="text-4xl/12 text-emerald-300 [ruby-position:under]">
              <ruby>馬<rp>(</rp><rt>ま</rt><rp>)</rp></ruby>
              <ruby>可<rp>(</rp><rt>か</rt><rp>)</rp></ruby>
              <ruby>無<rp>(</rp><rt>む</rt><rp>)</rp></ruby>
              <ruby>序<rp>(</rp><rt>じょ</rt><rp>)</rp></ruby>
            </div>
          </div>
          <div className="flex-none">
            <div className="text-center text-2xl/10 text-white">
              <span className="px-2 bg-black rounded-sm">
                <span className="pr-2 font-normal text-white">&#x1D54F;</span>
                &#xFF20;
                <span className="font-mono">makamujo</span>
              </span>
            </div>
          </div>
          <div className="flex-auto w-full p-1">
            <div className="h-full flex flex-col justify-between p-1 bg-black/50 border-5 border-double border-emerald-300 rounded-xl text-xl/8">
              <div className="flex-none text-center">
                <div>14回目の昇天</div>
                <div className="text-yellow-300">(3日前)</div>
              </div>
              <div className="flex-none">
                <div>今世🍪 1.23e+12枚</div>
                <div>延べ🍪 4.56e+15枚</div>
              </div>
              <div className="flex-none text-right">
                <div className="text-yellow-300">1,234🙎</div>
                <div>00:42:00🕧</div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom panel — character speech */}
      <Container>
        <div className="flex gap-2 h-full">
          <div className="flex-none w-40 max-h-full aspect-square flex items-center justify-center bg-black/30 rounded-xl text-6xl">
            🧑
          </div>
          <div className="flex-auto h-full p-1">
            <div className="h-full flex items-center p-2 bg-black/50 border-5 border-double border-emerald-300 rounded-xl overflow-hidden text-2xl/9">
              クッキーをたくさん焼いています！コメントを学習してお話ししています。ぜひ遊びに来てね。
            </div>
          </div>
        </div>
      </Container>
    </Layout>
  );
}
