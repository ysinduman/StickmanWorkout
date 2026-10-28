# Stickman Workout

<p align="center">
  <img src="assets/icon.png" alt="Stickman Workout Icon" width="128" height="128" />
</p>

<p align="center">
  <b>Antrenman motivasyonu veren, seriye (streak) ve kas bazlı seviyelere göre dinamik olarak evrimleşen çöp adam (stickman) mobil fitness uygulaması.</b>
</p>

<p align="center">
  <a href="https://reactnative.dev/"><img src="https://img.shields.io/badge/React_Native-0.87.1-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React Native" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <a href="https://github.com/ysinduman/StickmanWorkout"><img src="https://img.shields.io/badge/AI_Tracking-Computer_Vision-FF6F00?style=flat-square&logo=opencv&logoColor=white" alt="AI Tracking" /></a>
  <a href="https://github.com/ysinduman/StickmanWorkout"><img src="https://img.shields.io/badge/Fitness-100%25_Calisthenics-brightgreen?style=flat-square" alt="Calisthenics" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase&logoColor=white" alt="Supabase" /></a>
  <a href="https://github.com/pmndrs/zustand"><img src="https://img.shields.io/badge/State-Zustand-443e38?style=flat-square" alt="Zustand" /></a>
  <a href="https://android.com/"><img src="https://img.shields.io/badge/Platform-Android-3DDC84?style=flat-square&logo=android&logoColor=white" alt="Platform" /></a>
  <a href="https://github.com/ysinduman/StickmanWorkout"><img src="https://img.shields.io/badge/Tests-1155%20Passing-success?style=flat-square" alt="Tests" /></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue?style=flat-square" alt="License" /></a>
</p>

---

## 🌟 Öne Çıkan Özellikler

| Özellik | Açıklama |
| :--- | :--- |
| 🤖 **AI Kamera Takibi (Computer Vision)** | Ön kamera üzerinden gerçek zamanlı eklem ve açı analizi (Şınav, Squat, Mekik, Plank). |
| ⚡ **1–100 Dinamik Vektörel Kas Motoru** | `react-native-svg` ile 11 kas grubunun tamamen prosedürel, matematiksel büyüme ve damarlanma grafiği. |
| 🔥 **Seri (Streak) ve Dopamin Sistemi** | Günlük seri koruma, seri dondurma (streak freeze), kutlama konfetileri ve seviye atlama modalleri. |
| 🏆 **3 Kademeli Prestij Sistemi** | 1-50 Hacim Büyümesi, 51-99 Vasküler Damarlanma, 100+ Altın/Elmas/Efsanevi parıltı auraları. |
| 🔊 **Etkileşimli Ses ve Geri Bildirim** | Tekrar sayımlarında ve form doğrulamalarında dinamik Web Audio sentezleyici bip tonları. |
| 🌍 **Çift Dil Desteği** | `i18next` altyapısı ile eksiksiz Türkçe ve İngilizce lokalizasyon. |

---

## 🚀 1–100 Dinamik Kas Evrim Motoru

Stickman karakteri statik resimler yerine `react-native-svg` üzerinde **tamamen prosedürel (matematiksel)** olarak çizilir. Her kas bölgesi bağımsız olarak 1'den 100+ seviyeye kadar 3 ana evreden geçer:

### 1. Seviye 1 – 50: Kas Hipertrofisi ve Hacim Büyümesi
* **Biceps (Pazu):** Cılız koldan devasa pazu yumrusuna genişler.
* **Chest (Göğüs):** İnce omuz çizgisinden geniş, zırh plaka şeklinde pektoral kaslara dönüşür.
* **Abs (Karın):** Düz gövdeden derin kesimli 2'li, 4'lü ve 6'lı karın tuğlalarına (shredded six-pack) evrilir.
* **Shoulders (Omuzlar):** Eklem noktasında kafa boyutuna yaklaşan 3D gülle (cannonball) deltoidlere büyür.
* **Back (Kanatlar - Lats):** Gövdeden iki yana açılan geniş V-Taper sırt kanatları oluşur.
* **Bacaklar (Quads & Calves):** Dış bacak kavisi (quad sweep) ve elmas kalf kasları belirir.
* **50. Seviye:** Maksimum kas hacmine (`growth = 1.0`) ulaşır.

### 2. Seviye 51 – 99: Damarlanma (Vascularity) Aşaması
* 50. seviyeden sonra kas boyutu korunurken her yeni seviyede kasların üzerine dallanan vasküler damar hatları eklenir.
* Seviye arttıkça damarların sayısı (1'den 4'e kadar dallanma), kalınlığı ve belirginliği artar (`vascularity: 0.02 → 1.0`).
* Biceps cephalic damarı, göğüs damarları, alt karın (Apollo kemeri) damarları ve ön bacak femoral damarları belirir.

### 3. Seviye 100+: Prestij Kademesi & Renk Değişimi
* **Seviye 100 – 199 (Altın Prestij):** Kas grubu ve damarları **Altın (`#FFD700`)** rengine bürünür ve arkasında altın aura parıltısı yanar.
* **Seviye 200 – 299 (Elmas Mavi):** Siber platin / elmas mavi (`#00F0FF`) tier.
* **Seviye 300+ (Kozmik Mor):** Efsanevi mor (`#BD00FF`) aura.

---

## 🤖 Yapay Zeka (AI) Kamera Egzersiz Takibi

Kamera üzerinden gerçek zamanlı bilgisayarlı görü (computer vision) ile vücut eklem açılarını analiz eder:

* **Şınav (Push-up):** Dirsek açısı (Omuz - Dirsek - Bilek) ve gövde açısı analizi ile tam iniş/kalkış sayımı.
* **Squat:** Diz açısı (Kalça - Diz - Ayak Bileği) derinliği doğrulaması.
* **Mekik (Crunches):** Gövde fleksiyon açısı (Omuz - Kalça - Diz) algılama.
* **Plank:** Düz omurga hattı (Omuz - Kalça - Ayak Bileği) hizalaması ve canlı süre sayacı.
* **Akıllı Form Düzeltme:** Yanlış açılarda sesli ve görsel ikazlar verir.

### Hazır Calisthenics Programları
1. **Full Body Beginner (Tüm Vücut Başlangıç):** Temel vücut ağırlığı hareketleri ve kondisyon altyapısı.
2. **Upper Body Beast (Üst Vücut Canavarı):** Şınav varyasyonları, omuz ve karın odaklı hacim antrenmanı.
3. **Core & Legs Shred (Karın & Bacak Parçalayıcı):** Squat, crunches ve plank kombinasyonu ile yüksek yoğunluklu dayanıklılık.

---

## 🛠️ Mimari ve Teknolojiler

* **Mobil Çatı:** Bare React Native 0.87.1, React 19.2.3 (Hermes, New Architecture)
* **Vektörel Çizim:** `react-native-svg` (prosedürel koordinat hesaplamaları)
* **Durum Yönetimi:** `zustand` + `@react-native-async-storage/async-storage`
* **Navigasyon:** `@react-navigation/native-stack` + `@react-navigation/bottom-tabs`
* **Dil Desteği:** `i18next` (Türkçe & İngilizce)
* **Backend:** Supabase (PostgreSQL, Row Level Security, Security Definer RPC'ler)

---

## 📂 Proje Yapısı ve Geliştirici Araçları

```
StickmanWorkout/
├── src/
│   ├── components/
│   │   ├── Stickman/       # Dinamik SVG çöp adam ve 1-100 kas evrim motoru
│   │   ├── Calendar/       # Antrenman geçmişi takvimi
│   │   └── LevelUpModal/   # Seviye atlama kutlama modalleri
│   ├── screens/            # Home, ActiveWorkout, Profile, WorkoutSummary
│   ├── stores/             # Zustand state store'ları (user, workout, streak)
│   └── utils/              # AI kamera motoru, streak ve ses yardımcıları
├── scripts/
│   ├── verify-evolution.js # 11 kas grubu için 1.155 durum doğrulama betiği
│   └── generate-icons.ps1  # Android ikon oluşturucu
├── gelistirici_detaylari/
│   └── stickman_evolution_preview.html # Canlı SVG evrim motoru önizleme paneli
└── Baslat_Stickman.bat     # Tek tıkla emülatör ve Metro başlatıcı
```

---

## 🚀 Hızlı Başlatma

Projeyi tek tıkla emülatör ve Metro sunucusuyla başlatmak için kök dizindeki başlatıcıyı çalıştırabilirsiniz:
```cmd
Baslat_Stickman.bat
```

Veya manuel olarak:
```bash
# 1. Metro paketleyicisini başlatın
npm start

# 2. Android uygulamasını derleyip çalıştırın
npm run android
```

---

## 🧪 Doğrulama ve Test

```bash
# Evrim motoru testlerini çalıştır (1.155 durum testi)
npm run test:evolution

# TypeScript tür kontrolü
npm run typecheck

# Kod kalitesi kontrolü (Linter)
npm run lint
```
