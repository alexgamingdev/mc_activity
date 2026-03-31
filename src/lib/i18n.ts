import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'de',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          "status": "Status",
          "uptime": "Uptime",
          "version": "Version",
          "servers": "Servers",
          "bot_info": "Bot Information",
          "apply": "Apply",
          "admin_apply": "Admin Application",
          "member_apply": "Member Application",
          "send_message": "Send Message",
          "help": "Help",
          "online": "Online",
          "offline": "Offline",
          "available_commands": "Available Commands",
          "cmd_ping_desc": "Checks if the bot is online",
          "cmd_help_desc": "Shows this help overview",
          "cmd_info_desc": "Shows bot info and portal link",
          "cmd_apply_desc": "Starts an application for the server",
          "cmd_announcement_desc": "Sends an announcement (authorized only)",
          "cmd_startup_desc": "Sends startup message manually (admins only)",
        }
      },
      de: {
        translation: {
          "status": "Status",
          "uptime": "Laufzeit",
          "version": "Version",
          "servers": "Server",
          "bot_info": "Bot-Informationen",
          "apply": "Bewerben",
          "admin_apply": "Admin-Bewerbung",
          "member_apply": "Member-Bewerbung",
          "send_message": "Nachricht senden",
          "help": "Hilfe",
          "online": "Online",
          "offline": "Offline",
          "available_commands": "Verfügbare Befehle",
          "cmd_ping_desc": "Prüft ob der Bot online ist",
          "cmd_help_desc": "Zeigt diese Befehlsübersicht",
          "cmd_info_desc": "Zeigt Bot-Informationen und Portal-Link",
          "cmd_apply_desc": "Startet eine Bewerbung für den Server",
          "cmd_announcement_desc": "Sendet eine Ankündigung (nur autorisiert)",
          "cmd_startup_desc": "Sendet die Startnachricht manuell (nur Admins)",
        }
      }
    }
  });

export default i18n;
