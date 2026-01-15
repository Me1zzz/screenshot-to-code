export function OnboardingNote() {
  return (
    <div className="flex flex-col space-y-4 bg-green-700 p-2 rounded text-stone-200 text-sm">
      <span>
        要使用截图生成代码，{" "}
        <a
          className="inline underline hover:opacity-70"
          href="https://buy.stripe.com/8wM6sre70gBW1nqaEE"
          target="_blank"
        >
          购买一些额度（$36 可生成 100 次）
        </a>{" "}
        或使用具备 GPT-4 Vision 权限的 OpenAI API 密钥。{" "}
        <a
          href="https://github.com/abi/screenshot-to-code/blob/main/Troubleshooting.md"
          className="inline underline hover:opacity-70"
          target="_blank"
        >
          按此说明获取 API 密钥。
        </a>{" "}
        并粘贴到设置对话框（上方齿轮图标）中。你的密钥仅保存在浏览器里，
        绝不会存储在我们的服务器上。
      </span>
    </div>
  );
}
