import React, { useState } from "react";
import { haptic } from "../lib/haptics";
import { Download, Loader2 } from "lucide-react";
import { UpdateInfo } from "../lib/updateChecker";
import { Browser } from "@capacitor/browser";

interface UpdateModalProps {
  updateInfo: UpdateInfo;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({ updateInfo, onDismiss }) => {
  const [downloading, setDownloading] = useState(false);

  const handleUpdate = async () => {
    haptic.medium();
    setDownloading(true);
    try {
      await Browser.open({ url: updateInfo.downloadUrl });
    } catch (err) {
      console.error("Update error:", err);
      window.open(updateInfo.downloadUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#2D241E]/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[32px] shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-[#4A5D4E] to-[#3d4d40] p-8 text-white text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
            <Download className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-serif mb-2">تحديث جديد متاح</h2>
          <p className="text-sm text-white/80">الإصدار الجديد: {updateInfo.version}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-[#F1EFEC] rounded-2xl p-4">
            <p className="text-sm text-[#2D241E] leading-relaxed whitespace-pre-wrap">
              {updateInfo.message}
            </p>
          </div>

          <button
            type="button"
            onClick={handleUpdate}
            disabled={downloading}
            className="w-full py-3 rounded-2xl bg-[#4A5D4E] hover:bg-[#3d4d40] text-white font-bold text-sm transition-colors cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {downloading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                جاري الفتح...
              </>
            ) : (
              "تحديث الآن"
            )}
          </button>
          <button
            type="button"
            onClick={() => { haptic.light(); onDismiss(); }}
            className="w-full py-3 rounded-2xl bg-[#F1EFEC] text-[#8C7E6E] font-bold text-sm transition-colors cursor-pointer hover:bg-[#E6E0D8]"
          >
            لاحقاً
          </button>
        </div>
      </div>
    </div>
  );
};
