import html
import textwrap
from typing import Any, Literal

from custom_types import InputMode
from prompts.types import PromptContent, Stack


def _resolve_instruction_text(
    generation_type: Literal["create", "update"],
    prompt: PromptContent,
    history: list[dict[str, Any]],
) -> str:
    if generation_type == "update" and history:
        return str(history[-1].get("text", "")).strip()
    return str(prompt.get("text", "")).strip()


def _resolve_reference_image(prompt: PromptContent) -> str | None:
    images = prompt.get("images", [])
    if images:
        return str(images[0])
    return None


def _build_tailwind_html(title: str, description: str, image_url: str | None) -> str:
    image_block = ""
    if image_url:
        image_block = f"""
        <div class=\"rounded-2xl border border-slate-200 bg-slate-50 p-4\">
          <img
            src=\"{html.escape(image_url)}\"
            alt=\"Reference screenshot\"
            class=\"w-full rounded-xl shadow-sm\"
          />
        </div>
        """

    return textwrap.dedent(
        f"""\
        <!DOCTYPE html>
        <html lang=\"en\">
          <head>
            <meta charset=\"UTF-8\" />
            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
            <script src=\"https://cdn.tailwindcss.com\"></script>
            <title>{title}</title>
          </head>
          <body class=\"bg-slate-100 text-slate-900\">
            <div class=\"min-h-screen px-6 py-10\">
              <div class=\"mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-3xl bg-white p-8 shadow-lg\">
                <header class=\"space-y-3\">
                  <p class=\"text-sm font-semibold uppercase tracking-[0.2em] text-slate-500\">
                    Engineering Generated Option
                  </p>
                  <h1 class=\"text-3xl font-semibold text-slate-900\">{title}</h1>
                  <p class=\"text-base text-slate-600\">{description}</p>
                </header>
                {image_block}
                <section class=\"grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 md:grid-cols-3\">
                  <div class=\"space-y-2\">
                    <p class=\"text-sm font-semibold text-slate-700\">Layout Strategy</p>
                    <p class=\"text-sm text-slate-600\">
                      Start with a responsive container, then stack primary content and supporting actions.
                    </p>
                  </div>
                  <div class=\"space-y-2\">
                    <p class=\"text-sm font-semibold text-slate-700\">Component Mapping</p>
                    <p class=\"text-sm text-slate-600\">
                      Break the UI into hero, content grid, and supporting details for a clean structure.
                    </p>
                  </div>
                  <div class=\"space-y-2\">
                    <p class=\"text-sm font-semibold text-slate-700\">Next Steps</p>
                    <p class=\"text-sm text-slate-600\">
                      Replace placeholder sections with precise components once corrected by a model.
                    </p>
                  </div>
                </section>
              </div>
            </div>
          </body>
        </html>
        """
    ).strip()


def _build_html_css(title: str, description: str, image_url: str | None) -> str:
    image_block = ""
    if image_url:
        image_block = f"""
        <div class=\"reference\">
          <img src=\"{html.escape(image_url)}\" alt=\"Reference screenshot\" />
        </div>
        """

    return textwrap.dedent(
        f"""\
        <!DOCTYPE html>
        <html lang=\"en\">
          <head>
            <meta charset=\"UTF-8\" />
            <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />
            <title>{title}</title>
            <style>
              :root {{
                color-scheme: light;
              }}
              body {{
                margin: 0;
                font-family: "Inter", "Segoe UI", system-ui, sans-serif;
                background: #f1f5f9;
                color: #0f172a;
              }}
              .page {{
                min-height: 100vh;
                padding: 48px 24px;
              }}
              .card {{
                max-width: 960px;
                margin: 0 auto;
                background: #ffffff;
                border-radius: 24px;
                box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
                padding: 32px;
                display: flex;
                flex-direction: column;
                gap: 24px;
              }}
              .eyebrow {{
                text-transform: uppercase;
                letter-spacing: 0.2em;
                font-size: 12px;
                font-weight: 600;
                color: #64748b;
              }}
              h1 {{
                margin: 0;
                font-size: 32px;
                font-weight: 600;
              }}
              p {{
                margin: 0;
                font-size: 16px;
                line-height: 1.6;
                color: #475569;
              }}
              .reference {{
                padding: 16px;
                border-radius: 18px;
                border: 1px solid #e2e8f0;
                background: #f8fafc;
              }}
              .reference img {{
                width: 100%;
                border-radius: 16px;
                box-shadow: 0 8px 16px rgba(15, 23, 42, 0.12);
              }}
              .grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
                gap: 16px;
                background: #f8fafc;
                border-radius: 16px;
                border: 1px solid #e2e8f0;
                padding: 20px;
              }}
              .grid h3 {{
                margin: 0 0 8px;
                font-size: 14px;
                color: #334155;
              }}
              .grid p {{
                font-size: 14px;
                color: #64748b;
              }}
            </style>
          </head>
          <body>
            <div class=\"page\">
              <div class=\"card\">
                <div>
                  <div class=\"eyebrow\">Engineering Generated Option</div>
                  <h1>{title}</h1>
                </div>
                <p>{description}</p>
                {image_block}
                <div class=\"grid\">
                  <div>
                    <h3>Layout Strategy</h3>
                    <p>Start with a responsive container, then compose sections to match the layout.</p>
                  </div>
                  <div>
                    <h3>Component Mapping</h3>
                    <p>Translate major visual blocks into cards, headers, and action groups.</p>
                  </div>
                  <div>
                    <h3>Next Steps</h3>
                    <p>Use the optional LLM correction step to refine spacing and visual fidelity.</p>
                  </div>
                </div>
              </div>
            </div>
          </body>
        </html>
        """
    ).strip()


def generate_engineered_html(
    stack: Stack,
    input_mode: InputMode,
    generation_type: Literal["create", "update"],
    prompt: PromptContent,
    history: list[dict[str, Any]],
    openai_api_key: str | None = None,
    openai_base_url: str | None = None,
    openai_model: str | None = None,
) -> str:
    instruction = _resolve_instruction_text(generation_type, prompt, history)
    safe_instruction = html.escape(instruction) if instruction else ""
    title = "Engineering Generated Layout"
    description = (
        safe_instruction
        if safe_instruction
        else "This variant is generated with deterministic layout logic and can be refined by an LLM."
    )
    image_url = _resolve_reference_image(prompt) if input_mode != "text" else None

    if stack == "html_tailwind":
        return _build_tailwind_html(title, description, image_url)

    return _build_html_css(title, description, image_url)
