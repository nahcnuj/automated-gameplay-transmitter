import { Box, Layout } from "../../index";

export function App() {
  return (
    <Layout count={10} span={8} className="text-white">
      <Box>Main Panel</Box>
      <Box>Side Panel</Box>
      <Box>Bottom Panel</Box>
    </Layout>
  );
}
