import { Box, CharacterSprite, Container, Layout } from "automated-gameplay-transmitter";

// Placeholder character image (generic silhouette)
const characterSrc =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 960" fill="#94a3b8">' +
      '<circle cx="360" cy="200" r="130"/>' +
      '<ellipse cx="360" cy="660" rx="240" ry="300"/>' +
    '</svg>'
  );

/**
 * Example application demonstrating the three-panel stream overlay layout
 * provided by automated-gameplay-transmitter.
 *
 * - Main panel  : game screen area (largest, top-left)
 * - Side panel  : stream info / stats (narrow, right side)
 * - Bottom panel: character sprite + speech / script text (full width, bottom strip)
 */
export function App() {
  return (
    <Layout count={10} span={8} className="bg-slate-900/30 text-slate-50 font-bold">
      {/* Main panel — game screen area */}
      <Container>
        <Box>
          <div className="w-full h-full flex flex-col items-center justify-center gap-4">
            <div className="text-[7.5rem]">🎮</div>
            <div className="text-[3rem] text-slate-300">Game Screen</div>
          </div>
        </Box>
      </Container>

      {/* Side panel — sidebar info */}
      <Container>
        <Box>
          <div className="h-full flex flex-col items-center justify-center">
            <div className="text-[3rem] text-slate-300 text-center">
              Side
            </div>
          </div>
        </Box>
      </Container>

      {/* Bottom panel — character sprite + speech text */}
      <Container>
        <div className="flex gap-2 h-full min-h-0">
          <div className="h-full shrink-0 overflow-hidden aspect-[3/4]">
            <CharacterSprite src={characterSrc} className="h-full w-full" />
          </div>
          <div className="flex-auto h-full min-h-0 p-1">
            <Box>
              <div className="h-full flex items-center overflow-hidden text-[2rem]/[3rem]">
                Hello, viewers! Thanks for watching the stream today!
              </div>
            </Box>
          </div>
        </div>
      </Container>
    </Layout>
  );
}
