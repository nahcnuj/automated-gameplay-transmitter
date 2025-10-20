import { useAIVTuberContext } from "../contexts/AIVTuberContext";

type PanelProps = {
};

export function BottomPanel({ }: PanelProps) {
  const { speech, sprite } = useAIVTuberContext();

  return (
    <div className="flex gap-2 h-full">
      <div className="flex-none w-45 max-h-full aspect-square">
        {sprite}
      </div>
      <div className="flex-auto h-full">
        <div className="flex flex-col h-full">
          <div className="flex-none">
            {/* <div className="text-3xl/10">
              <div className="w-max text-base">
                <CommentList comments={displayComments} />
              </div>
            </div> */}
          </div>
          <div className="flex-auto w-full h-full p-1">
            <div className="h-full flex flex-col justify-between">
              <div className="flex-none">
                {/* TODO */}
              </div>
              <div className="flex-auto h-full p-2 bg-black/70 border-5 border-double border-emerald-300 rounded-xl overflow-hidden text-3xl/10">
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
  );
}
