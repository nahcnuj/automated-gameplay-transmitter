import { Box, Container, Layout } from "automated-gameplay-transmitter";

export function App() {
  return (
    <Layout count={10} span={8} className="text-white">
      <Container><Box>Main Panel</Box></Container>
      <Container><Box>Side Panel</Box></Container>
      <Container><Box>Bottom Panel</Box></Container>
    </Layout>
  );
}
