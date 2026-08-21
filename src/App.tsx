import React, { useState, useCallback, useEffect, useRef } from "react";
import { ActionFeedback } from "./components/action-feedback";
import { QuranReaderView } from "./components/QuranReaderView";
import { KhatmahView } from "./components/KhatmahView";
import { IstikharaView } from "./components/IstikharaView";
import { DevotionsView } from "./components/DevotionsView";
import { CalculatorsView } from "./components/CalculatorsView";
import { RisalahView } from "./components/RisalahView";
import { DailyActsView } from "./components/DailyActsView";
import { DailyCalendarView } from "./components/DailyCalendarView";
import { SettingsView } from "./components/SettingsView";
import { MehdiAIChatModal } from "./components/MehdiAIChatModal";
import { UpdateModal } from "./components/UpdateModal";
import { PrayerWidget } from "./components/PrayerWidget";
import {
  subscribeNotifications,
  markNotificationRead,
  getDeviceProfile,
  AppNotification,
} from "./lib/community";
import {
  initLocalNotifications,
  showSystemNotification,
} from "./lib/notifications";
import { getCoordinates } from "./lib/prayerTimes";
import { getAzanSettings, scheduleAzanAlarms } from "./lib/azan";
import { App as CapApp } from "@capacitor/app";
import { checkForUpdate, UpdateInfo } from "./lib/updateChecker";
import { getSelectedFont, getFontById } from "./lib/fonts";
import { getSettings } from "./lib/appSettings";
import {
  BookOpen,
  Users,
  Compass,
  BookMarked,
  Calculator,
  BookCopy,
  Bot,
  Menu,
  Bell,
  Check,
  Settings,
  ListChecks,
  CalendarDays,
} from "lucide-react";

type ViewType =
  | "home"
  | "quran"
  | "khatmah"
  | "istikhara"
  | "devotions"
  | "calculators"
  | "risalah"
  | "dailyacts"
  | "dailycalendar"
  | "settings";

const menuItems: { id: ViewType; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "quran", label: "القرآن الكريم", icon: <BookOpen className="w-6 h-6" />, description: "قراءة القرآن مع التفسير والعلامات" },
  { id: "khatmah", label: "الختمات الجماعية", icon: <Users className="w-6 h-6" />, description: "شارك في ختم القرآن مع المسلمين" },
  { id: "istikhara", label: "الاستخارة", icon: <Compass className="w-6 h-6" />, description: "استخارة القرآن بالصفحات الفردية" },
  { id: "devotions", label: "الأدعية والزيارات", icon: <BookMarked className="w-6 h-6" />, description: "أدعية وزيارات والصحيفة السجادية" },
  { id: "risalah", label: "الرسائل الفقهية", icon: <BookCopy className="w-6 h-6" />, description: "رسائل 23 مرجع فقهي - 97 كتاب" },
  { id: "calculators", label: "الحاسبات الفقهية", icon: <Calculator className="w-6 h-6" />, description: "المسبحة والقضاء والمواريث والخمس" },
  { id: "dailycalendar", label: "التقويم اليومي", icon: <CalendarDays className="w-6 h-6" />, description: "أعمال وأذكار وأدعية كل يوم" },
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [showMehdiChat, setShowMehdiChat] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ visible: boolean; message: string }>({ visible: false, message: "" });
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [chromeVisible, setChromeVisible] = useState<boolean>(true);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);

  const device = getDeviceProfile();

  useEffect(() => {
    initLocalNotifications();
    let unsub: (() => void) | undefined;
    subscribeNotifications((list) => {
      setNotifications(list);
    }).then((fn) => { unsub = fn; });
    return () => { if (unsub) unsub(); };
  }, []);

    // Apply saved font and dark mode on start
  useEffect(() => {
    const font = getFontById(getSelectedFont());
    document.documentElement.style.setProperty("--app-font", font.family.split(",")[0].trim());
    const settings = getSettings();
    document.documentElement.style.setProperty("--app-font-size", `${settings.fontSize}px`);
    if (settings.darkMode) {
      document.documentElement.classList.add("dark");
      document.body.style.filter = "invert(1) hue-rotate(180deg)";
      document.body.style.backgroundColor = "#1a1a2e";
      document.body.style.color = "#ffffff";
    }
  }, []);

  // Re-schedule azan alarms on app start so they keep working across days.
  useEffect(() => {
    const settings = getAzanSettings();
    if (!settings.enabled) return;
    getCoordinates().then((coords) => {
      scheduleAzanAlarms(coords.latitude, coords.longitude, -new Date().getTimezoneOffset() / 60);
    });
  }, []);

  // Android back button handling
  useEffect(() => {
    let handle: any;
    CapApp.addListener("backButton", ({ canGoBack }) => {
      if (showMehdiChat) {
        setShowMehdiChat(false);
      } else if (showNotifications) {
        setShowNotifications(false);
      } else if (sidebarOpen) {
        setSidebarOpen(false);
      } else if (currentView !== "home") {
        setCurrentView("home");
      } else if (!canGoBack) {
        CapApp.exitApp();
      }
    }).then((h) => { handle = h; });
    return () => { if (handle && handle.remove) handle.remove(); };
  }, [showMehdiChat, showNotifications, sidebarOpen, currentView]);

  // Notifications relevant to me:
  //  - Targeted to my device (part_reserved, dua_prayed) => always
  //  - Broadcast (new_khatmah, new_dua) => only if I'm NOT the author
  const isRelevant = (n: AppNotification): boolean => {
    if (n.targetDevice) return n.targetDevice === device.id;
    if (n.broadcast) return !n.authorFingerprint || n.authorFingerprint !== device.id;
    return false;
  };

  // Show a system notification + toast whenever a NEW relevant notification arrives
  const lastNotifIds = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (notifications.length === 0) return;
    // Initialize the seen-set with existing notifications on first load
    if (lastNotifIds.current.size === 0) {
      notifications.forEach((n) => lastNotifIds.current.add(n.id));
      return;
    }
    const fresh = notifications.filter((n) => !lastNotifIds.current.has(n.id) && isRelevant(n));
    if (fresh.length > 0) {
      fresh.forEach((n) => {
        showSystemNotification("روافد", n.message);
      });
      const newest = fresh[0];
      setFeedback({ visible: true, message: newest.message });
      setTimeout(() => setFeedback({ visible: false, message: "" }), 3500);
      fresh.forEach((n) => lastNotifIds.current.add(n.id));
    }
  }, [notifications]);

  const myNotifications = notifications.filter(isRelevant);
  const unreadCount = myNotifications.filter((n) => !n.read).length;

  const showFeedback = useCallback((msg: string) => {
    setFeedback({ visible: true, message: msg });
    setTimeout(() => setFeedback({ visible: false, message: "" }), 2500);
  }, []);

  const renderView = () => {
    switch (currentView) {
      case "quran":
        return <QuranReaderView showFeedback={showFeedback} />;
      case "khatmah":
        return <KhatmahView showFeedback={showFeedback} />;
      case "istikhara":
        return <IstikharaView showFeedback={showFeedback} />;
      case "devotions":
        return <DevotionsView showFeedback={showFeedback} />;
      case "calculators":
        return <CalculatorsView showFeedback={showFeedback} />;
      case "risalah":
        return <RisalahView showFeedback={showFeedback} />;
      case "dailyacts":
        return <DailyActsView showFeedback={showFeedback} />;
      case "dailycalendar":
        return <DailyCalendarView />;
      case "settings":
        return <SettingsView showFeedback={showFeedback} />;
      default:
        return renderHome();
    }
  };

  const renderHome = () => (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#4A5D4E] to-[#3d4d40] p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
        </div>
        <div className="relative z-10 text-center space-y-5">
          <PrayerWidget />
        </div>
      </div>
    </div>
  );

  return (
    <div
      className="min-h-screen bg-[#F9F7F5]"
      onClick={(e) => {
        if (sidebarOpen || showNotifications || showMehdiChat) return;
        const target = e.target as HTMLElement;
        if (target.closest("button, a, input, textarea, select, [role='button'], label, .cursor-pointer, .fixed.inset-0")) return;
        setChromeVisible((v) => !v);
      }}
    >
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setSidebarOpen(false)}>
          <div className="absolute inset-0 bg-[#2D241E]/40" />
          <div className="absolute top-0 right-0 w-72 h-full bg-white border-l border-[#E6E0D8] shadow-xl p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-black mb-4">القائمة</h3>
            <button
              type="button"
              onClick={() => { setCurrentView("home"); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl text-right cursor-pointer transition-colors ${currentView === "home" ? "bg-[#F1EFEC] text-[#4A5D4E]" : "text-[#8C7E6E] hover:bg-[#F1EFEC]"}`}
            >
              <span className="text-sm font-bold">الرئيسية</span>
            </button>
            {menuItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => { setCurrentView(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 p-3 rounded-xl text-right cursor-pointer transition-colors ${currentView === item.id ? "bg-[#F1EFEC] text-[#4A5D4E]" : "text-[#8C7E6E] hover:bg-[#F1EFEC]"}`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="text-sm font-bold">{item.label}</span>
              </button>
            ))}
            <div className="border-t border-[#E6E0D8] pt-3 mt-3">
              <button
                type="button"
                onClick={() => { setShowMehdiChat(true); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-right cursor-pointer transition-colors text-[#8C7E6E] hover:bg-[#F1EFEC] hover:text-[#4A5D4E]"
              >
                <span className="shrink-0"><Bot className="w-6 h-6" /></span>
                <span className="text-sm font-bold">مجيب - المساعد الذكي</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`w-full px-4 pt-4 transition-[padding] duration-300 ${chromeVisible ? "pb-24" : "pb-6"}`}
      >
        {renderView()}
      </main>

      {/* AI Chat Modal */}
      <MehdiAIChatModal visible={showMehdiChat} onClose={() => setShowMehdiChat(false)} currentView={currentView} />

      {/* Notifications Panel (overlay from bottom nav) */}
      {showNotifications && (
        <div className="fixed inset-0 z-40 bg-[#2D241E]/40" onClick={() => setShowNotifications(false)}>
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-80 max-h-[60vh] overflow-y-auto bg-white border border-[#E6E0D8] rounded-3xl shadow-2xl p-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2 px-2">
              <h3 className="text-sm font-bold text-black font-serif">الإشعارات</h3>
              {myNotifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => myNotifications.forEach((n) => { if (!n.read) markNotificationRead(n.id); })}
                  className="text-[11px] text-[#4A5D4E] font-bold cursor-pointer hover:underline"
                >
                  تعليم الكل كمقروء
                </button>
              )}
            </div>
            {myNotifications.length === 0 ? (
              <div className="text-center py-8 text-[#8C7E6E] text-sm">لا توجد إشعارات</div>
            ) : (
              <div className="space-y-2">
                {myNotifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => { if (!n.read) markNotificationRead(n.id); }}
                    className={`p-3 rounded-2xl border cursor-pointer transition-colors ${n.read ? "bg-[#F9F7F5] border-[#E6E0D8]" : "bg-[#D4E2D5]/30 border-[#B8CEBA]"}`}
                  >
                    <p className="text-xs text-black leading-relaxed">{n.message}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] text-[#8C7E6E]">{new Date(n.timestamp).toLocaleString("ar-EG")}</span>
                      {!n.read && <span className="text-[10px] text-[#4A5D4E] font-bold flex items-center gap-1"><Check className="w-3 h-3" /> جديد</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Nav Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E6E0D8] shadow-[0_-2px_20px_rgba(0,0,0,0.08)] transition-transform duration-300 ${chromeVisible ? "translate-y-0" : "translate-y-full"}`}>
        <div className="max-w-4xl mx-auto px-2 py-2 grid grid-cols-4 items-center">
          {/* Options */}
          <button
            type="button"
            onClick={() => { setSidebarOpen(!sidebarOpen); setShowNotifications(false); }}
            className="flex flex-col items-center gap-1 py-1 rounded-xl cursor-pointer transition-colors hover:bg-[#F1EFEC]"
          >
            <Menu className="w-6 h-6 text-[#4A5D4E]" />
            <span className="text-[10px] font-bold text-[#8C7E6E]">الخيارات</span>
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => { setShowNotifications(!showNotifications); setSidebarOpen(false); }}
            className="relative flex flex-col items-center gap-1 py-1 rounded-xl cursor-pointer transition-colors hover:bg-[#F1EFEC]"
          >
            <span className="relative">
              <Bell className="w-6 h-6 text-[#4A5D4E]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 min-w-[16px] h-[16px] px-0.5 rounded-full bg-[#4A5D4E] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </span>
            <span className="text-[10px] font-bold text-[#8C7E6E]">الإشعارات</span>
          </button>

          {/* Daily Acts */}
          <button
            type="button"
            onClick={() => { setCurrentView("dailyacts"); setSidebarOpen(false); setShowNotifications(false); }}
            className="flex flex-col items-center gap-1 py-1 rounded-xl cursor-pointer transition-colors hover:bg-[#F1EFEC]"
          >
            <ListChecks className="w-6 h-6 text-[#4A5D4E]" />
            <span className="text-[10px] font-bold text-[#8C7E6E]">أعمال اليوم</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => { setCurrentView("settings"); setSidebarOpen(false); setShowNotifications(false); }}
            className="flex flex-col items-center gap-1 py-1 rounded-xl cursor-pointer transition-colors hover:bg-[#F1EFEC]"
          >
            <Settings className="w-6 h-6 text-[#4A5D4E]" />
            <span className="text-[10px] font-bold text-[#8C7E6E]">الإعدادات</span>
          </button>
        </div>
      </nav>

      {/* Floating AI Assistant button - available on every screen */}
      <button
        type="button"
        onClick={() => setShowMehdiChat(true)}
        className="fixed bottom-24 left-4 z-40 w-14 h-14 rounded-full bg-[#4A5D4E] hover:bg-[#3d4d40] text-white shadow-lg flex items-center justify-center transition-all cursor-pointer active:scale-95"
        aria-label="المساعد الذكي"
      >
        <Bot className="w-6 h-6" />
      </button>

      {/* Feedback Toast */}
      <ActionFeedback visible={feedback.visible} message={feedback.message} />

      {/* Update Modal */}
      {updateInfo && (
        <UpdateModal updateInfo={updateInfo} onDismiss={() => setUpdateInfo(null)} />
      )}
    </div>
  );
}
