import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs";
import {
  FaUndo,
  FaDownload,
  FaDesktop,
  FaMobile,
  FaCode,
} from "react-icons/fa";
import { AppState, Settings } from "../../types";
import CodeTab from "./CodeTab";
import { Button } from "../ui/button";
import { useAppStore } from "../../store/app-store";
import { useProjectStore } from "../../store/project-store";
import { extractHtml } from "./extractHtml";
import PreviewComponent from "./PreviewComponent";
import { downloadCode } from "./download";

interface Props {
  doUpdate: (instruction: string) => void;
  reset: () => void;
  settings: Settings;
}

function PreviewPane({ doUpdate, reset, settings }: Props) {
  const { appState } = useAppStore();
  const {
    inputMode,
    head,
    commits,
    imageSessions,
    selectedImageSessionId,
    setSelectedImageSessionId,
  } = useProjectStore();

  const currentCommit = head && commits[head] ? commits[head] : "";
  const currentVariant = currentCommit
    ? currentCommit.variants[currentCommit.selectedVariantIndex]
    : null;
  const currentCode = currentVariant?.code ?? "";
  const currentArkuiCode = currentVariant?.arkuiCode ?? "";

  const previewCode =
    inputMode === "video" && appState === AppState.CODING
      ? extractHtml(currentCode)
      : currentCode;

  return (
    <div className="ml-4">
      {imageSessions.length > 1 && (
        <div className="mb-4 mr-8">
          <div className="text-sm text-gray-500 mb-2">选择图片</div>
          <div className="flex flex-wrap gap-2">
            {imageSessions.map((session, index) => {
              const isSelected = session.id === selectedImageSessionId;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedImageSessionId(session.id)}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1 text-sm transition ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-400"
                  }`}
                >
                  <span className="inline-flex h-8 w-12 items-center justify-center overflow-hidden rounded border border-gray-200 bg-white">
                    <img
                      src={session.referenceImage}
                      alt={`参考图 ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span>图 {index + 1}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <Tabs defaultValue="mobile">
        <div className="flex justify-between mr-8 mb-4">
          <div className="flex items-center gap-x-2">
            {appState === AppState.CODE_READY && (
              <>
                <Button
                  onClick={reset}
                  className="flex items-center ml-4 gap-x-2 dark:text-white dark:bg-gray-700"
                >
                  <FaUndo />
                  重置
                </Button>
                <Button
                  onClick={() => downloadCode(previewCode)}
                  variant="secondary"
                  className="flex items-center gap-x-2 mr-4 dark:text-white dark:bg-gray-700 download-btn"
                >
                  <FaDownload /> 下载代码
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="mobile" className="flex gap-x-2">
                <FaMobile /> 移动端
              </TabsTrigger>
              <TabsTrigger value="desktop" className="flex gap-x-2">
                <FaDesktop /> 桌面
              </TabsTrigger>
              <TabsTrigger value="code" className="flex gap-x-2">
                <FaCode />
                html代码
              </TabsTrigger>
              <TabsTrigger value="arkui" className="flex gap-x-2">
                <FaCode />
                arkui代码
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        <TabsContent value="desktop">
          <PreviewComponent
            code={previewCode}
            device="desktop"
            doUpdate={doUpdate}
          />
        </TabsContent>
        <TabsContent value="mobile">
          <PreviewComponent
            code={previewCode}
            device="mobile"
            doUpdate={doUpdate}
          />
        </TabsContent>
        <TabsContent value="code">
          <CodeTab 
            code={previewCode} 
            setCode={() => {}} 
            settings={settings} 
          />
        </TabsContent>
        <TabsContent value="arkui">
          <CodeTab
            code={currentArkuiCode}
            setCode={() => {}}
            settings={settings}
            showCodepen={false}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PreviewPane;
