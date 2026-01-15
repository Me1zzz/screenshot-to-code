import React from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FaCog } from "react-icons/fa";
import { EditorTheme, Settings } from "../../types";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { capitalize } from "../../lib/utils";
import { IS_RUNNING_ON_CLOUD } from "../../config";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion";

interface Props {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
}

function SettingsDialog({ settings, setSettings }: Props) {
  const handleThemeChange = (theme: EditorTheme) => {
    setSettings((s) => ({
      ...s,
      editorTheme: theme,
    }));
  };

  return (
    <Dialog>
      <DialogTrigger>
        <FaCog />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="mb-4">设置</DialogTitle>
        </DialogHeader>

        <div className="flex items-center space-x-2">
          <Label htmlFor="image-generation">
            <div>DALL·E 占位图生成</div>
            <div className="font-light mt-2 text-xs">
              更有趣，但如果想省钱可以关闭。
            </div>
          </Label>
          <Switch
            id="image-generation"
            checked={settings.isImageGenerationEnabled}
            onCheckedChange={() =>
              setSettings((s) => ({
                ...s,
                isImageGenerationEnabled: !s.isImageGenerationEnabled,
              }))
            }
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="engineering-variant">
            <div>工程版变体</div>
            <div className="font-light mt-2 text-xs">
              在结果中包含工程向变体。
            </div>
          </Label>
          <Switch
            id="engineering-variant"
            checked={settings.isEngineeringVariantEnabled}
            onCheckedChange={() =>
              setSettings((s) => ({
                ...s,
                isEngineeringVariantEnabled: !s.isEngineeringVariantEnabled,
              }))
            }
          />
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="deep-thinking">
            <div>工程版深度思考</div>
            <div className="font-light mt-2 text-xs">
              对工程变体运行 VLM 精炼步骤。
            </div>
          </Label>
          <Switch
            id="deep-thinking"
            checked={settings.isDeepThinkingEnabled}
            onCheckedChange={() =>
              setSettings((s) => ({
                ...s,
                isDeepThinkingEnabled: !s.isDeepThinkingEnabled,
              }))
            }
          />
        </div>
        <div className="flex flex-col space-y-6">
          <div>
            <Label htmlFor="openai-api-key">
              <div>OpenAI API 密钥</div>
              <div className="font-light mt-1 mb-2 text-xs leading-relaxed">
                仅保存在你的浏览器中，绝不会存储在服务器上。会覆盖你的 .env 配置。
              </div>
            </Label>

            <Input
              id="openai-api-key"
              placeholder="OpenAI API 密钥"
              value={settings.openAiApiKey || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  openAiApiKey: e.target.value,
                }))
              }
            />
          </div>

          {!IS_RUNNING_ON_CLOUD && (
            <div>
              <Label htmlFor="openai-api-key">
                <div>OpenAI Base URL（可选）</div>
                <div className="font-light mt-2 leading-relaxed">
                  如果不想使用默认值，可替换为代理 URL。
                </div>
              </Label>

              <Input
                id="openai-base-url"
                placeholder="OpenAI Base URL"
                value={settings.openAiBaseURL || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    openAiBaseURL: e.target.value,
                  }))
                }
              />
            </div>
          )}

          <div>
            <Label htmlFor="anthropic-api-key">
              <div>Anthropic API 密钥</div>
              <div className="font-light mt-1 text-xs leading-relaxed">
                仅保存在你的浏览器中，绝不会存储在服务器上。会覆盖你的 .env 配置。
              </div>
            </Label>

            <Input
              id="anthropic-api-key"
              placeholder="Anthropic API 密钥"
              value={settings.anthropicApiKey || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  anthropicApiKey: e.target.value,
                }))
              }
            />
          </div>

          <div className="space-y-3 rounded-md border border-border p-4">
            <div>
              <Label htmlFor="engineering-openai-api-key">
                <div>工程版 OpenAI API 密钥</div>
                <div className="font-light mt-1 text-xs leading-relaxed">
                  用于需要 VLM 支持的工程变体。
                </div>
              </Label>
              <Input
                id="engineering-openai-api-key"
                placeholder="工程版 OpenAI API 密钥"
                value={settings.engineeringOpenAiApiKey || ""}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    engineeringOpenAiApiKey: e.target.value,
                  }))
                }
              />
            </div>

            {!IS_RUNNING_ON_CLOUD && (
              <div>
                <Label htmlFor="engineering-openai-base-url">
                  <div>工程版 OpenAI Base URL（可选）</div>
                  <div className="font-light mt-1 text-xs leading-relaxed">
                    用于工程版请求的代理 URL。
                  </div>
                </Label>
                <Input
                  id="engineering-openai-base-url"
                  placeholder="工程版 OpenAI Base URL"
                  value={settings.engineeringOpenAiBaseURL || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      engineeringOpenAiBaseURL: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div>
              <Label htmlFor="engineering-openai-model">
                <div>工程版 OpenAI 模型</div>
                <div className="font-light mt-1 text-xs leading-relaxed">
                  工程变体调用的模型名称。
                </div>
              </Label>
              <Input
                id="engineering-openai-model"
                placeholder="gpt-4o-mini"
                value={settings.engineeringOpenAiModel}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    engineeringOpenAiModel: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>URL 截图配置</AccordionTrigger>
              <AccordionContent>
                <Label htmlFor="screenshot-one-api-key">
                  <div className="leading-normal font-normal text-xs">
                    如果你想直接使用 URL，而不是自己截图，请添加 ScreenshotOne API key。{" "}
                    <a
                      href="https://screenshotone.com?via=screenshot-to-code"
                      className="underline"
                      target="_blank"
                    >
                      每月可免费获取 100 张截图。
                    </a>
                  </div>
                </Label>

                <Input
                  id="screenshot-one-api-key"
                  className="mt-2"
                  placeholder="ScreenshotOne API key"
                  value={settings.screenshotOneApiKey || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      screenshotOneApiKey: e.target.value,
                    }))
                  }
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>主题设置</AccordionTrigger>
              <AccordionContent className="space-y-4 flex flex-col">
                <div className="flex items-center justify-between">
                  <Label htmlFor="app-theme">
                    <div>应用主题</div>
                  </Label>
                  <div>
                    <button
                      className="flex rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50t"
                      onClick={() => {
                        document
                          .querySelector("div.mt-2")
                          ?.classList.toggle("dark"); // enable dark mode for sidebar
                        document.body.classList.toggle("dark");
                        document
                          .querySelector('div[role="presentation"]')
                          ?.classList.toggle("dark"); // enable dark mode for upload container
                      }}
                    >
                      切换深色模式
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="editor-theme">
                    <div>
                      代码编辑器主题 - 需要刷新页面生效
                    </div>
                  </Label>
                  <div>
                    <Select // Use the custom Select component here
                      name="editor-theme"
                      value={settings.editorTheme}
                      onValueChange={(value) =>
                        handleThemeChange(value as EditorTheme)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        {capitalize(settings.editorTheme)}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cobalt">Cobalt</SelectItem>
                        <SelectItem value="espresso">Espresso</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <DialogFooter>
          <DialogClose>保存</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
