from codegen.utils import replace_base64_data_urls, restore_base64_placeholders


def test_replace_and_restore_multiple_base64_images() -> None:
    html = (
        '<img src="data:image/png;base64,AAA111" />'
        '<img src="data:image/jpeg;base64,BBB222" />'
    )

    scrubbed_html, mapping = replace_base64_data_urls(html)

    assert scrubbed_html != html
    assert "__IMG_BASE64_1__" in scrubbed_html
    assert "__IMG_BASE64_2__" in scrubbed_html
    assert mapping["__IMG_BASE64_1__"] == "data:image/png;base64,AAA111"
    assert mapping["__IMG_BASE64_2__"] == "data:image/jpeg;base64,BBB222"

    restored_html = restore_base64_placeholders(scrubbed_html, mapping)
    assert restored_html == html


def test_replace_ignores_non_data_url_sources() -> None:
    html = '<img src="https://example.com/image.png" />'

    scrubbed_html, mapping = replace_base64_data_urls(html)

    assert scrubbed_html == html
    assert mapping == {}


def test_restore_placeholders_in_vlm_output() -> None:
    placeholder_html = '<img src="__IMG_BASE64_1__" />'
    mapping = {"__IMG_BASE64_1__": "data:image/png;base64,CCC333"}

    restored_html = restore_base64_placeholders(placeholder_html, mapping)

    assert restored_html == '<img src="data:image/png;base64,CCC333" />'


def test_replace_reuses_placeholders_for_duplicate_data_urls() -> None:
    html = (
        '<img src="data:image/png;base64,AAA111" />'
        '<img src="data:image/png;base64,AAA111" />'
    )

    scrubbed_html, mapping = replace_base64_data_urls(html)

    assert scrubbed_html.count("__IMG_BASE64_1__") == 2
    assert mapping == {"__IMG_BASE64_1__": "data:image/png;base64,AAA111"}
