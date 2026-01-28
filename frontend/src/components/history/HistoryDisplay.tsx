import toast from "react-hot-toast";
import classNames from "classnames";

import { Badge } from "../ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";
import { Button } from "../ui/button";
import { CaretSortIcon } from "@radix-ui/react-icons";
import { useProjectStore } from "../../store/project-store";

interface Props {
  shouldDisableReverts: boolean;
}

export default function HistoryDisplay({ shouldDisableReverts }: Props) {
  const { versions, selectedVersionId, setVersion } = useProjectStore();

  const versionLabels = versions.map((version) => {
    switch (version.type) {
      case "create":
        return "创建";
      case "edit":
        return "编辑";
      case "code_create":
        return "从代码导入";
      default:
        return "创建";
    }
  });

  return versions.length === 0 ? null : (
    <div className="flex flex-col h-screen">
      <h1 className="font-bold mb-2">版本</h1>
      <ul className="space-y-0 flex flex-col-reverse">
        {versions.map((version, index) => (
          <li key={index}>
            <Collapsible>
              <div
                className={classNames(
                  "flex items-center justify-between space-x-2 w-full pr-2",
                  "border-b cursor-pointer",
                  {
                    " hover:bg-black hover:text-white":
                      version.id === selectedVersionId,
                    "bg-slate-500 text-white":
                      version.id === selectedVersionId,
                  }
                )}
              >
                <div
                  className="flex justify-between truncate flex-1 p-2"
                  onClick={() =>
                    shouldDisableReverts
                      ? toast.error("请等待代码生成完成后再查看旧版本。")
                      : setVersion(version.id)
                  }
                >
                  <div className="flex gap-x-1 truncate">
                    <h2 className="text-sm truncate">{version.summary}</h2>
                  </div>
                  <h2 className="text-sm">v{index + 1}</h2>
                </div>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6">
                    <CaretSortIcon className="h-4 w-4" />
                    <span className="sr-only">切换</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="w-full bg-slate-300 p-2">
                <div>完整提示：{version.summary}</div>
                <div className="flex justify-end">
                  <Badge>{versionLabels[index]}</Badge>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        ))}
      </ul>
    </div>
  );
}
