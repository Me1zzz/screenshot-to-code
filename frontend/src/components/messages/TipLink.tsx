import { URLS } from "../../urls";

function TipLink() {
  return (
    <a
      className="text-xs underline text-gray-500 text-right"
      href={URLS.tips}
      target="_blank"
      rel="noopener"
    >
      获得更好结果的小贴士
    </a>
  );
}

export default TipLink;
