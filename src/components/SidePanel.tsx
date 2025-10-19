type PanelProps = {
};

export function SidePanel({ }: PanelProps) {
  return (
    <div className="h-full flex flex-col justify-between items-center">
      <div className="text-5xl font-bold">
        <ruby>馬<rp>(</rp><rt>ま</rt><rp>)</rp></ruby>
        <ruby>可<rp>(</rp><rt>か</rt><rp>)</rp></ruby>
        <ruby>無<rp>(</rp><rt>む</rt><rp>)</rp></ruby>
        <ruby>序<rp>(</rp><rt>じょ</rt><rp>)</rp></ruby>
      </div>
      <div>
        b
      </div>
    </div>
  );
}
