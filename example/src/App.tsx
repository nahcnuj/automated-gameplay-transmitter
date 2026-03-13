import { Box, Container, Layout } from "automated-gameplay-transmitter";

/**
 * Example application demonstrating the three-panel stream overlay layout
 * provided by automated-gameplay-transmitter.
 *
 * - Main panel  : game screen area (largest, top-left)
 * - Side panel  : stream info / stats (narrow, right side)
 * - Bottom panel: speech / captions (full width, bottom strip)
 */
export function App() {
  return (
    <Layout count={10} span={8} className="bg-slate-900/30 text-slate-50 font-bold">
      {/* Main panel — game screen area */}
      <Container>
        <Box>
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="text-6xl">🎮</div>
            <div className="text-2xl text-slate-300">Game Screen</div>
          </div>
        </Box>
      </Container>

      {/* Side panel — stream stats */}
      <Container>
        <div className="h-full flex flex-col justify-between items-center gap-2">
          <div className="flex-none text-2xl text-slate-300 text-center pt-2">
            Streamer
          </div>
          <div className="flex-auto w-full">
            <div className="h-full flex flex-col justify-between p-2 bg-black/50 border-2 border-slate-400 rounded-xl text-lg/8">
              <div className="text-center">
                <div>Session 1</div>
                <div className="text-yellow-300">(Day 1)</div>
              </div>
              <div>
                <div>Score: 1.23e+9</div>
                <div>Items: 42</div>
              </div>
              <div className="text-right">
                <div className="text-yellow-300">1,234 👥</div>
                <div>00:42:00 🕧</div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      {/* Bottom panel — speech / captions */}
      <Container>
        <div className="flex gap-2 h-full">
          <div className="flex-none w-32 max-h-full aspect-square flex items-center justify-center bg-black/30 rounded-xl text-5xl">
            🙂
          </div>
          <div className="flex-auto h-full p-1">
            <div className="h-full flex items-center p-3 bg-black/50 border-2 border-slate-400 rounded-xl overflow-hidden text-xl/9">
              Hello, viewers! Thanks for watching the stream today!
            </div>
          </div>
        </div>
      </Container>
    </Layout>
  );
}
