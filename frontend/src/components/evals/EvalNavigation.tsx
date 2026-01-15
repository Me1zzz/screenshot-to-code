import { Link } from "react-router-dom";

function EvalNavigation() {
  return (
    <div className="flex justify-between items-center w-full py-3 px-4 bg-zinc-900 text-white">
      <div className="flex items-center space-x-4">
        <Link
          to="/evals"
          className="font-medium hover:text-blue-300 transition-colors"
        >
          评测首页
        </Link>
        
        <div className="text-gray-500">|</div>
        
        <Link
          to="/evals/run"
          className="hover:text-blue-300 transition-colors"
        >
          运行
        </Link>
        
        <Link
          to="/evals/pairwise"
          className="hover:text-blue-300 transition-colors"
        >
          成对比较
        </Link>
        
        <Link
          to="/evals/best-of-n"
          className="hover:text-blue-300 transition-colors"
        >
          N 选最佳
        </Link>
        
        <Link
          to="/evals/single"
          className="hover:text-blue-300 transition-colors"
        >
          单模型
        </Link>
      </div>
      
      <Link
        to="/"
        className="text-sm text-gray-300 hover:text-white transition-colors"
      >
        ← 返回应用
      </Link>
    </div>
  );
}

export default EvalNavigation;
