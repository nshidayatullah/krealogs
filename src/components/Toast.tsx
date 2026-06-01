import { useEffect } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type, visible, onClose }: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] animate-slide-up">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
        type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
      }`}>
        {type === "success" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
        <span>{message}</span>
        <button onClick={onClose} className="ml-2 p-0.5 hover:opacity-80 cursor-pointer"><X className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
