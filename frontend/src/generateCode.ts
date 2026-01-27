import toast from "react-hot-toast";
import { WS_BACKEND_URL } from "./config";
import {
  APP_ERROR_WEB_SOCKET_CODE,
  USER_CLOSE_WEB_SOCKET_CODE,
} from "./constants";
import { FullGenerationSettings } from "./types";

const ERROR_MESSAGE =
  "代码生成失败。请查看开发者控制台和后端日志了解详情。欢迎在 Github 提交 issue。";

const CANCEL_MESSAGE = "已取消代码生成";

type WebSocketResponse = {
  type:
    | "chunk"
    | "status"
    | "setCode"
    | "error"
    | "variantComplete"
    | "variantError"
    | "variantCount";
  value: string | { html: string; arkui?: string };
  variantIndex: number;
  pageIndex?: number;
};

interface CodeGenerationCallbacks {
  onChange: (chunk: string, variantIndex: number, pageIndex: number) => void;
  onSetCode: (
    code: string,
    variantIndex: number,
    pageIndex: number,
    arkuiCode?: string
  ) => void;
  onStatusUpdate: (status: string, variantIndex: number, pageIndex: number) => void;
  onVariantComplete: (variantIndex: number, pageIndex: number) => void;
  onVariantError: (variantIndex: number, error: string, pageIndex: number) => void;
  onVariantCount: (count: number, pageIndex: number) => void;
  onCancel: () => void;
  onComplete: () => void;
}

type HtmlStreamState = {
  buffer: string;
  isCapturing: boolean;
};

const START_FENCE_REGEX = /```html\+?/;
const START_FENCE_MAX_LENGTH = "```html+".length;
const END_FENCE = "```";
const END_FENCE_PREFIX_LENGTH = END_FENCE.length - 1;

function getHtmlStreamState(
  states: Map<string, HtmlStreamState>,
  key: string
) {
  const existing = states.get(key);
  if (existing) {
    return existing;
  }
  const initial = { buffer: "", isCapturing: false };
  states.set(key, initial);
  return initial;
}

function resetHtmlStreamState(
  states: Map<string, HtmlStreamState>,
  key: string
) {
  states.set(key, { buffer: "", isCapturing: false });
}

function extractHtmlFromChunk(
  states: Map<string, HtmlStreamState>,
  key: string,
  chunk: string
) {
  const state = getHtmlStreamState(states, key);
  state.buffer += chunk;
  let extracted = "";

  while (state.buffer.length > 0) {
    if (!state.isCapturing) {
      const startIndex = state.buffer.search(START_FENCE_REGEX);
      if (startIndex === -1) {
        state.buffer = state.buffer.slice(-START_FENCE_MAX_LENGTH);
        break;
      }

      const match = state.buffer.slice(startIndex).match(START_FENCE_REGEX);
      if (!match) {
        state.buffer = state.buffer.slice(-START_FENCE_MAX_LENGTH);
        break;
      }

      state.buffer = state.buffer.slice(startIndex + match[0].length);
      state.isCapturing = true;
      continue;
    }

    const endIndex = state.buffer.indexOf(END_FENCE);
    if (endIndex === -1) {
      if (state.buffer.length > END_FENCE_PREFIX_LENGTH) {
        extracted += state.buffer.slice(0, -END_FENCE_PREFIX_LENGTH);
        state.buffer = state.buffer.slice(-END_FENCE_PREFIX_LENGTH);
      }
      break;
    }

    extracted += state.buffer.slice(0, endIndex);
    state.buffer = "";
    state.isCapturing = false;
    break;
  }

  return extracted;
}

export function generateCode(
  wsRef: React.MutableRefObject<WebSocket | null>,
  params: FullGenerationSettings,
  callbacks: CodeGenerationCallbacks
) {
  const wsUrl = `${WS_BACKEND_URL}/generate-code`;
  console.log("Connecting to backend @ ", wsUrl);

  const htmlStreamStates = new Map<string, HtmlStreamState>();
  const shouldUseBlockUpdates = Boolean(params.isBlockUpdateEnabled);
  const ws = new WebSocket(wsUrl);
  wsRef.current = ws;

  ws.addEventListener("open", () => {
    ws.send(JSON.stringify(params));
  });

  ws.addEventListener("message", async (event: MessageEvent) => {
    const response = JSON.parse(event.data) as WebSocketResponse;
    const pageIndex =
      typeof response.pageIndex === "number" ? response.pageIndex : 0;
    const streamKey = `${pageIndex}:${response.variantIndex}`;
    if (response.type === "chunk") {
      if (typeof response.value !== "string") {
        return;
      }
      if (shouldUseBlockUpdates) {
        if (response.value) {
          callbacks.onChange(response.value, response.variantIndex, pageIndex);
        }
      } else {
        const extracted = extractHtmlFromChunk(
          htmlStreamStates,
          streamKey,
          response.value
        );
        if (extracted) {
          callbacks.onChange(extracted, response.variantIndex, pageIndex);
        }
      }
    } else if (response.type === "status") {
      if (typeof response.value !== "string") {
        return;
      }
      callbacks.onStatusUpdate(response.value, response.variantIndex, pageIndex);
    } else if (response.type === "setCode") {
      resetHtmlStreamState(htmlStreamStates, streamKey);
      if (typeof response.value === "string") {
        callbacks.onSetCode(response.value, response.variantIndex, pageIndex);
      } else {
        callbacks.onSetCode(
          response.value.html,
          response.variantIndex,
          pageIndex,
          response.value.arkui
        );
      }
    } else if (response.type === "variantComplete") {
      callbacks.onVariantComplete(response.variantIndex, pageIndex);
    } else if (response.type === "variantError") {
      if (typeof response.value !== "string") {
        return;
      }
      callbacks.onVariantError(response.variantIndex, response.value, pageIndex);
    } else if (response.type === "variantCount") {
      if (typeof response.value !== "string") {
        return;
      }
      callbacks.onVariantCount(parseInt(response.value), pageIndex);
    } else if (response.type === "error") {
      if (typeof response.value !== "string") {
        return;
      }
      console.error("Error generating code", response.value);
      toast.error(response.value);
    }
  });

  ws.addEventListener("close", (event) => {
    console.log("Connection closed", event.code, event.reason);
    if (event.code === USER_CLOSE_WEB_SOCKET_CODE) {
      toast.success(CANCEL_MESSAGE);
      callbacks.onCancel();
    } else if (event.code === APP_ERROR_WEB_SOCKET_CODE) {
      console.error("Known server error", event);
      callbacks.onCancel();
    } else if (event.code !== 1000) {
      console.error("Unknown server or connection error", event);
      toast.error(ERROR_MESSAGE);
      callbacks.onCancel();
    } else {
      callbacks.onComplete();
    }
  });

  ws.addEventListener("error", (error) => {
    console.error("WebSocket error", error);
    toast.error(ERROR_MESSAGE);
  });
}
