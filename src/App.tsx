import { Box } from "./components/Box";
import { Container } from "./components/Container";
import { Layout } from "./components/Layout";

export function App() {
  return (
    <Layout count={10} span={8} className="bg-emerald-950/30 text-emerald-50 font-[Noto_Sans_CJK_JP] font-bold">
      <Container><Box></Box></Container>
      <Container><Box></Box></Container>
      <Container><Box></Box></Container>
    </Layout>
  );
}
