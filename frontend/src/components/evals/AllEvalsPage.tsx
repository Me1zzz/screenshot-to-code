import { Link } from "react-router-dom";

function AllEvalsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">
            评测仪表盘
          </h1>
          <Link 
            to="/"
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center"
          >
            ← 返回应用
          </Link>
        </div>
        <div className="space-y-4">
          <Link
            to="/evals/run"
            className="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800">运行评测</h2>
            <p className="text-gray-600">
              生成多个模型的评测结果
            </p>
          </Link>

          <Link
            to="/evals/pairwise"
            className="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800">
              成对比较
            </h2>
            <p className="text-gray-600">
              比较两个不同模型的输出
            </p>
          </Link>

          <Link
            to="/evals/best-of-n"
            className="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800">N 选最佳</h2>
            <p className="text-gray-600">
              并排比较多个模型输出
            </p>
          </Link>

          <Link
            to="/evals/single"
            className="block w-full p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <h2 className="text-xl font-semibold text-gray-800">
              单模型评测
            </h2>
            <p className="text-gray-600">对单个模型输出进行评分</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default AllEvalsPage;
