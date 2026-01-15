import { GiClick } from "react-icons/gi";
import { useAppStore } from "../../store/app-store";
import { Button } from "../ui/button";

function SelectAndEditModeToggleButton() {
  const { inSelectAndEditMode, toggleInSelectAndEditMode } = useAppStore();

  return (
    <Button
      onClick={toggleInSelectAndEditMode}
      className="flex items-center gap-x-2 dark:text-white dark:bg-gray-700 regenerate-btn"
      variant={inSelectAndEditMode ? "destructive" : "default"}
    >
      <GiClick className="text-lg" />
      <span>
        {inSelectAndEditMode ? "退出选择模式" : "选择并更新"}
      </span>
    </Button>
  );
}

export default SelectAndEditModeToggleButton;
