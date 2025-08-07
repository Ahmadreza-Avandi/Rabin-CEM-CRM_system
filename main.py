from persianttsfarsi import PersianTTS
import os

def main():
    # گرفتن متن از کاربر
    user_input = input("📝 لطفا متنی که می‌خوای خونده بشه رو وارد کن: ")

    # ساخت آبجکت PersianTTS
    tts = PersianTTS()

    # تبدیل متن به فایل صوتی
    tts.synthesize(user_input, "output.mp3")

    print("✅ صدا ساخته شد! حالا در حال پخشه...")

    # پخش فایل صوتی با mpv
    os.system("mpv output.mp3")

if __name__ == "__main__":
    main()
